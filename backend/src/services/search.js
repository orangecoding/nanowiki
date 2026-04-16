import Database from 'better-sqlite3';
import { join } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { config } from '../config.js';

let db = null;

export function initSearch() {
  db = new Database(join(config.dataDir, '.nanowiki.db'));
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS files_fts
    USING fts5(path UNINDEXED, content, tokenize='unicode61')
  `);
  rebuildIndex();
}

function rebuildIndex() {
  db.prepare('DELETE FROM files_fts').run();
  indexDir(config.dataDir, config.dataDir);
}

function indexDir(dir, base) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isSymbolicLink()) continue; // never follow symlinks outside data dir
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      indexDir(full, base);
    } else if (entry.name.endsWith('.md')) {
      const rel = full.slice(base.length + 1);
      const content = readFileSync(full, 'utf8');
      // Prepend the filename (without extension) so searches match file names too
      const stem = entry.name.replace(/\.md$/, '');
      db.prepare('INSERT INTO files_fts(path, content) VALUES (?, ?)').run(rel, `${stem}\n${content}`);
    }
  }
}

export function upsertIndex(path, content) {
  const stem = path.split('/').pop().replace(/\.md$/, '');
  db.prepare('DELETE FROM files_fts WHERE path = ?').run(path);
  db.prepare('INSERT INTO files_fts(path, content) VALUES (?, ?)').run(path, `${stem}\n${content}`);
}

export function removeIndex(path) {
  db.prepare('DELETE FROM files_fts WHERE path = ?').run(path);
}

export function search(query) {
  if (!db || !query.trim()) return [];
  try {
    return db
      .prepare(
        `
      SELECT path,
        snippet(files_fts, 1, '', '', '…', 25) AS snippet
      FROM files_fts
      WHERE files_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `,
      )
      .all(query);
  } catch {
    return [];
  }
}

export function closeSearch() {
  if (db) {
    db.close();
    db = null;
  }
}
