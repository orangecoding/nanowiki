/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { promises as fs } from 'node:fs';
import { join, resolve, relative, extname, dirname } from 'node:path';
import { config } from '../config.js';

export function safePath(relPath) {
  const abs = resolve(join(config.dataDir, relPath));
  const base = config.dataDir.endsWith('/') ? config.dataDir : config.dataDir + '/';
  if (abs !== config.dataDir && !abs.startsWith(base)) {
    throw Object.assign(new Error('Path traversal attempt'), { status: 403, statusCode: 403 });
  }
  return abs;
}

async function buildTree(dir, base) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (entry.isDirectory()) {
      result.push({ type: 'folder', name: entry.name, path: rel, children: await buildTree(full, base) });
    } else if (extname(entry.name) === '.md') {
      result.push({ type: 'file', name: entry.name, path: rel });
    }
  }
  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getTree() {
  return buildTree(config.dataDir, config.dataDir);
}

export async function createFile(relPath) {
  const withExt = relPath.endsWith('.md') ? relPath : relPath + '.md';
  const abs = safePath(withExt);
  await fs.mkdir(dirname(abs), { recursive: true });
  await fs.writeFile(abs, '', { flag: 'wx' });
}

export async function createFolder(relPath) {
  const abs = safePath(relPath);
  await fs.mkdir(abs, { recursive: true });
}

export async function renameEntry(oldPath, newPath) {
  const absOld = safePath(oldPath);
  const absNew = safePath(newPath);
  await fs.rename(absOld, absNew);
}

export async function deleteEntry(relPath) {
  const abs = safePath(relPath);
  await fs.rm(abs, { recursive: true, force: true });
}

// Returns all .md file paths (relative to dataDir) under a given file or folder path
export async function listMdFiles(relPath) {
  const abs = safePath(relPath);
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    return [];
  }

  if (stat.isFile()) {
    return relPath.endsWith('.md') ? [relPath] : [];
  }

  const paths = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name.endsWith('.md')) {
        paths.push(relative(config.dataDir, full));
      }
    }
  }
  await walk(abs);
  return paths;
}

export async function readContent(relPath) {
  const abs = safePath(relPath);
  return fs.readFile(abs, 'utf8');
}

export async function writeContent(relPath, content) {
  const abs = safePath(relPath);
  await fs.mkdir(dirname(abs), { recursive: true });
  return fs.writeFile(abs, content, 'utf8');
}
