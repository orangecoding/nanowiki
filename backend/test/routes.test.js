import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../src/config.js';
import { build } from '../src/server.js';

let tmpDir, app;

beforeEach(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'nanowiki-routes-'));
  config.dataDir = tmpDir;
  app = await build();
});

afterEach(async () => {
  await app.close();
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
