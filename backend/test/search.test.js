import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../src/config.js';

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'nanowiki-search-'));
  config.dataDir = tmpDir;
});

afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

describe('search service', () => {
  it('indexes and finds a document', async () => {
    const { initSearch, upsertIndex, search } = await import('../src/services/search.js?' + Date.now());
    initSearch();
    upsertIndex('note.md', 'Elephants are large mammals');
    const results = search('elephants');
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('note.md');
    expect(results[0].snippet).toContain('Elephants');
  });

  it('removes a document from index', async () => {
    const { initSearch, upsertIndex, removeIndex, search } = await import(
      '../src/services/search.js?' + Date.now() + 1
    );
    initSearch();
    upsertIndex('gone.md', 'vanishing content');
    removeIndex('gone.md');
    expect(search('vanishing')).toHaveLength(0);
  });
});
