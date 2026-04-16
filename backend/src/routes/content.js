/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { readContent, writeContent } from '../services/fileSystem.js';
import { markSaved } from '../services/watcher.js';

export default async function contentRoutes(fastify) {
  fastify.get('/api/content/*', async (req, reply) => {
    try {
      const content = await readContent(req.params['*']);
      return { content };
    } catch (err) {
      if (err.code === 'ENOENT') reply.status(404).send({ error: 'Not found' });
      else throw err;
    }
  });

  fastify.put('/api/content/*', async (req) => {
    const path = req.params['*'];
    markSaved(path); // mark before write so chokidar event is suppressed
    await writeContent(path, req.body.content);
    return { ok: true };
  });
}
