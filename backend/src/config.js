/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Mutable so tests can override config.dataDir directly
export const config = {
  dataDir: '',
  port: 3001,
};

export function initConfig() {
  const raw = process.env.NANOWIKI_DATA_DIR;
  if (!raw) {
    console.error('Error: NANOWIKI_DATA_DIR is not set in .env');
    process.exit(1);
  }
  const resolved = resolve(raw);
  if (!existsSync(resolved)) {
    console.error(`Error: DATA_DIR does not exist: ${resolved}`);
    process.exit(1);
  }
  config.dataDir = resolved;
  config.port = parseInt(process.env.PORT ?? '3001', 10);
}

export function getLlmProvider() {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      baseUrl: null,
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      baseUrl: null,
    };
  }
  if (process.env.OLLAMA_BASE_URL) {
    return {
      provider: 'ollama',
      apiKey: null,
      model: process.env.OLLAMA_MODEL ?? 'llama3',
      baseUrl: process.env.OLLAMA_BASE_URL,
    };
  }
  return null;
}
