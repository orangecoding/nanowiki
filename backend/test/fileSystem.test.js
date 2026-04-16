/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../src/config.js';
import {
  getTree,
  createFile,
  createFolder,
  renameEntry,
  deleteEntry,
  readContent,
  writeContent,
} from '../src/services/fileSystem.js';

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'nanowiki-fs-'));
  config.dataDir = tmpDir;
});

afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

describe('getTree', () => {
  it('returns empty array for empty dir', async () => {
    expect(await getTree()).toEqual([]);
  });

  it('returns md files and folders, hides dotfiles', async () => {
    writeFileSync(join(tmpDir, 'readme.md'), '# hi');
    mkdirSync(join(tmpDir, 'notes'));
    writeFileSync(join(tmpDir, 'notes', 'todo.md'), '- item');
    writeFileSync(join(tmpDir, '.hidden'), 'x');

    const tree = await getTree();
    expect(tree).toHaveLength(2);
    const readme = tree.find((n) => n.name === 'readme.md');
    expect(readme).toMatchObject({ type: 'file', path: 'readme.md' });
    const notes = tree.find((n) => n.name === 'notes');
    expect(notes.children).toHaveLength(1);
    expect(notes.children[0].name).toBe('todo.md');
  });
});

describe('createFile', () => {
  it('creates an empty .md file', async () => {
    await createFile('new.md');
    const tree = await getTree();
    expect(tree.find((n) => n.name === 'new.md')).toBeTruthy();
  });

  it('auto-appends .md extension', async () => {
    await createFile('new');
    const tree = await getTree();
    expect(tree.find((n) => n.name === 'new.md')).toBeTruthy();
  });

  it('throws 403 on path traversal', async () => {
    await expect(createFile('../escape.md')).rejects.toMatchObject({ status: 403 });
  });
});

describe('createFolder', () => {
  it('creates a directory', async () => {
    await createFolder('docs');
    const tree = await getTree();
    expect(tree.find((n) => n.name === 'docs' && n.type === 'folder')).toBeTruthy();
  });
});

describe('renameEntry', () => {
  it('renames a file', async () => {
    writeFileSync(join(tmpDir, 'old.md'), '');
    await renameEntry('old.md', 'new.md');
    const tree = await getTree();
    expect(tree.find((n) => n.name === 'new.md')).toBeTruthy();
    expect(tree.find((n) => n.name === 'old.md')).toBeFalsy();
  });

  it('throws 403 on path traversal in newPath', async () => {
    writeFileSync(join(tmpDir, 'old.md'), '');
    await expect(renameEntry('old.md', '../escape.md')).rejects.toMatchObject({ status: 403 });
  });
});

describe('deleteEntry', () => {
  it('deletes a file', async () => {
    writeFileSync(join(tmpDir, 'bye.md'), '');
    await deleteEntry('bye.md');
    expect(await getTree()).toEqual([]);
  });
});

describe('readContent / writeContent', () => {
  it('round-trips content', async () => {
    await writeContent('note.md', '# Hello');
    expect(await readContent('note.md')).toBe('# Hello');
  });
});
