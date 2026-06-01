/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { getLlmProvider } from '../config.js';

const ALLOWED_TONES = ['Neutral', 'Formal', 'Casual', 'Friendly'];
const ALLOWED_STYLES = ['Professional', 'Creative', 'Concise', 'Detailed'];

const SYSTEM_PROMPT = `You are a professional writing assistant. Rewrite the provided Markdown document.
Preserve all Markdown formatting, headings, lists, code blocks, links, and images exactly as structured.
Only rewrite the prose content according to the requested tone and style.
Respond with only the rewritten Markdown, no explanation, no preamble, no code fences around the output.
Tone: {tone}
Style: {style}`;

async function callOpenAI(apiKey, model, systemPrompt, markdown) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: markdown },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `OpenAI error: ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error('Unexpected response from OpenAI');
  return text;
}

async function callAnthropic(apiKey, model, systemPrompt, markdown) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: markdown }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Anthropic error: ${res.status}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (typeof text !== 'string') throw new Error('Unexpected response from Anthropic');
  return text;
}

async function callOllama(baseUrl, model, systemPrompt, markdown) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: markdown },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Ollama error: ${res.status}`);
  }
  const data = await res.json();
  const text = data.message?.content;
  if (typeof text !== 'string') throw new Error('Unexpected response from Ollama');
  return text;
}

export default async function llmRoutes(fastify) {
  fastify.get('/api/llm/config', async () => {
    const p = getLlmProvider();
    return { provider: p?.provider ?? null };
  });

  fastify.post('/api/llm/rewrite', async (req, reply) => {
    const p = getLlmProvider();
    if (!p) {
      return reply.status(503).send({ error: 'No LLM provider configured' });
    }
    const { markdown, tone, style } = req.body;
    if (typeof markdown !== 'string' || !markdown) {
      return reply.status(400).send({ error: 'markdown is required' });
    }
    if (markdown.length > 100_000) {
      return reply.status(400).send({ error: 'markdown exceeds 100 KB limit' });
    }
    const resolvedTone = ALLOWED_TONES.includes(tone) ? tone : 'Neutral';
    const resolvedStyle = ALLOWED_STYLES.includes(style) ? style : 'Professional';
    const systemPrompt = SYSTEM_PROMPT.replace('{tone}', resolvedTone).replace('{style}', resolvedStyle);
    try {
      let result;
      if (p.provider === 'openai') {
        result = await callOpenAI(p.apiKey, p.model, systemPrompt, markdown);
      } else if (p.provider === 'anthropic') {
        result = await callAnthropic(p.apiKey, p.model, systemPrompt, markdown);
      } else if (p.provider === 'ollama') {
        result = await callOllama(p.baseUrl, p.model, systemPrompt, markdown);
      } else {
        return reply.status(500).send({ error: 'Unknown provider' });
      }
      return { result };
    } catch (err) {
      return reply.status(502).send({ error: err.message });
    }
  });
}
