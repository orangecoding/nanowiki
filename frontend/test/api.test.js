import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn();
});

describe('api', () => {
  it('getFiles returns parsed JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ type: 'file', name: 'readme.md', path: 'readme.md' }],
    });
    const { getFiles } = await import('../src/api.js?' + Date.now());
    const result = await getFiles();
    expect(result[0].name).toBe('readme.md');
    expect(fetch).toHaveBeenCalledWith('/api/files');
  });

  it('getContent returns content string', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: '# Hello' }),
    });
    const { getContent } = await import('../src/api.js?' + Date.now() + 1);
    const content = await getContent('readme.md');
    expect(content).toBe('# Hello');
  });
});
