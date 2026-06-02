/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../src/config.js';
import { build } from '../src/server.js';
import { initSearch, closeSearch, search } from '../src/services/search.js';

let tmpDir, app;

beforeEach(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'nanowiki-routes-'));
  config.dataDir = tmpDir;
  initSearch();
  app = await build();
});

afterEach(async () => {
  await app.close();
  closeSearch();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('GET /api/files', () => {
  it('returns empty array for empty dir', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/files' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('returns tree with files', async () => {
    writeFileSync(join(tmpDir, 'readme.md'), '# hi');
    const res = await app.inject({ method: 'GET', url: '/api/files' });
    const body = JSON.parse(res.body);
    expect(body[0].name).toBe('readme.md');
  });
});

describe('POST /api/files', () => {
  it('creates a file', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/files',
      payload: { type: 'file', path: 'new.md' },
    });
    expect(res.statusCode).toBe(201);
    const tree = JSON.parse((await app.inject({ method: 'GET', url: '/api/files' })).body);
    expect(tree.find((n) => n.name === 'new.md')).toBeTruthy();
  });

  it('creates a folder', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/files',
      payload: { type: 'folder', path: 'docs' },
    });
    expect(res.statusCode).toBe(201);
  });
});

describe('PUT /api/files/*', () => {
  it('renames a file', async () => {
    writeFileSync(join(tmpDir, 'old.md'), '');
    const res = await app.inject({
      method: 'PUT',
      url: '/api/files/old.md',
      payload: { newPath: 'new.md' },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('DELETE /api/files/*', () => {
  it('deletes a file', async () => {
    writeFileSync(join(tmpDir, 'bye.md'), '');
    const res = await app.inject({ method: 'DELETE', url: '/api/files/bye.md' });
    expect(res.statusCode).toBe(204);
  });
});

describe('GET /api/content/*', () => {
  it('returns file content', async () => {
    writeFileSync(join(tmpDir, 'note.md'), '# Hello');
    const res = await app.inject({ method: 'GET', url: '/api/content/note.md' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).content).toBe('# Hello');
  });

  it('returns 404 for missing file', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/content/missing.md' });
    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/content/*', () => {
  it('saves file content', async () => {
    writeFileSync(join(tmpDir, 'note.md'), '');
    const res = await app.inject({
      method: 'PUT',
      url: '/api/content/note.md',
      payload: { content: '# Updated' },
    });
    expect(res.statusCode).toBe(200);
    const check = await app.inject({ method: 'GET', url: '/api/content/note.md' });
    expect(JSON.parse(check.body).content).toBe('# Updated');
  });
});

describe('search index updates', () => {
  it('indexes a newly created file by name', async () => {
    await app.inject({ method: 'POST', url: '/api/files', payload: { type: 'file', path: 'mypage.md' } });
    const results = search('mypage');
    expect(results.some((r) => r.path === 'mypage.md')).toBe(true);
  });

  it('updates index when a file is renamed', async () => {
    writeFileSync(join(tmpDir, 'before.md'), 'unique rename content');
    await app.inject({ method: 'PUT', url: '/api/files/before.md', payload: { newPath: 'after.md' } });
    expect(search('unique rename content').some((r) => r.path === 'after.md')).toBe(true);
    expect(search('unique rename content').some((r) => r.path === 'before.md')).toBe(false);
  });

  it('updates index when a folder is renamed', async () => {
    mkdirSync(join(tmpDir, 'olddir'));
    writeFileSync(join(tmpDir, 'olddir', 'page.md'), 'folder rename test');
    await app.inject({ method: 'PUT', url: '/api/files/olddir', payload: { newPath: 'newdir' } });
    expect(search('folder rename test').some((r) => r.path === 'newdir/page.md')).toBe(true);
    expect(search('folder rename test').some((r) => r.path === 'olddir/page.md')).toBe(false);
  });

  it('removes file from index on delete', async () => {
    writeFileSync(join(tmpDir, 'gone.md'), 'content to be deleted');
    await app.inject({ method: 'DELETE', url: '/api/files/gone.md' });
    expect(search('content to be deleted')).toHaveLength(0);
  });

  it('removes all folder files from index on folder delete', async () => {
    mkdirSync(join(tmpDir, 'todelete'));
    writeFileSync(join(tmpDir, 'todelete', 'a.md'), 'folder delete alpha');
    writeFileSync(join(tmpDir, 'todelete', 'b.md'), 'folder delete beta');
    await app.inject({ method: 'DELETE', url: '/api/files/todelete' });
    expect(search('folder delete alpha')).toHaveLength(0);
    expect(search('folder delete beta')).toHaveLength(0);
  });
});
