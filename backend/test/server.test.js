/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../src/config.js';

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'nanowiki-test-'));
  config.dataDir = tmpDir;
});

afterAll(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe('build()', () => {
  it('starts and returns 200 on GET /api/files', async () => {
    const { build } = await import('../src/server.js');
    const app = await build();
    const res = await app.inject({ method: 'GET', url: '/api/files' });
    expect(res.statusCode).toBe(200);
    await app.close();
  });
});
