/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../src/config.js';
import { build } from '../src/server.js';

let tmpDir, app;

beforeEach(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'nanowiki-llm-'));
  config.dataDir = tmpDir;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OLLAMA_BASE_URL;
  app = await build();
});

afterEach(async () => {
  await app.close();
  rmSync(tmpDir, { recursive: true, force: true });
  vi.unstubAllGlobals();
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OLLAMA_BASE_URL;
});

describe('GET /api/llm/config', () => {
  it('returns null provider when no env vars set', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/llm/config' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ provider: null });
  });

  it('returns openai when OPENAI_API_KEY is set', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const res = await app.inject({ method: 'GET', url: '/api/llm/config' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).provider).toBe('openai');
  });

  it('returns anthropic when ANTHROPIC_API_KEY is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const res = await app.inject({ method: 'GET', url: '/api/llm/config' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).provider).toBe('anthropic');
  });

  it('returns ollama when OLLAMA_BASE_URL is set', async () => {
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    const res = await app.inject({ method: 'GET', url: '/api/llm/config' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).provider).toBe('ollama');
  });
});

describe('POST /api/llm/rewrite', () => {
  it('returns 503 when no provider configured', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/llm/rewrite',
      payload: { markdown: '# Test', tone: 'Neutral', style: 'Professional' },
    });
    expect(res.statusCode).toBe(503);
  });

  it('returns 400 when markdown is missing', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const res = await app.inject({
      method: 'POST',
      url: '/api/llm/rewrite',
      payload: { tone: 'Neutral', style: 'Professional' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('calls OpenAI and returns result', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '# Rewritten' } }] }),
      }),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/llm/rewrite',
      payload: { markdown: '# Original', tone: 'Formal', style: 'Concise' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).result).toBe('# Rewritten');
  });

  it('calls Anthropic and returns result', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: '# Rewritten by Claude' }] }),
      }),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/llm/rewrite',
      payload: { markdown: '# Hello', tone: 'Casual', style: 'Creative' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).result).toBe('# Rewritten by Claude');
  });

  it('calls Ollama and returns result', async () => {
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: { content: '# Rewritten by Ollama' } }),
      }),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/llm/rewrite',
      payload: { markdown: '# Hello', tone: 'Friendly', style: 'Detailed' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).result).toBe('# Rewritten by Ollama');
  });

  it('returns 502 when LLM API call fails', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      }),
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/llm/rewrite',
      payload: { markdown: '# Hello', tone: 'Neutral', style: 'Professional' },
    });
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body).error).toBe('Invalid API key');
  });
});
