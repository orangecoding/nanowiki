/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import {
  getTree,
  createFile,
  createFolder,
  renameEntry,
  deleteEntry,
  listMdFiles,
  readContent,
} from '../services/fileSystem.js';
import { removeIndex, upsertIndex } from '../services/search.js';

export default async function filesRoutes(fastify) {
  fastify.get('/api/files', async () => getTree());

  fastify.post('/api/files', async (req, reply) => {
    const { type, path } = req.body ?? {};
    if (typeof path !== 'string' || !path) {
      return reply.status(400).send({ error: 'path is required' });
    }
    if (type === 'folder') {
      await createFolder(path);
    } else {
      const mdPath = path.endsWith('.md') ? path : path + '.md';
      await createFile(path);
      try {
        upsertIndex(mdPath, '');
      } catch {}
    }
    reply.status(201).send({ ok: true });
  });

  fastify.put('/api/files/*', async (req, reply) => {
    const relPath = req.params['*'];
    const { newPath } = req.body;
    const oldMdPaths = await listMdFiles(relPath);
    await renameEntry(relPath, newPath);
    for (const oldMdPath of oldMdPaths) {
      try {
        removeIndex(oldMdPath);
      } catch {}
      const newMdPath = newPath + oldMdPath.slice(relPath.length);
      try {
        const content = await readContent(newMdPath);
        upsertIndex(newMdPath, content);
      } catch {}
    }
    reply.send({ ok: true });
  });

  fastify.delete('/api/files/*', async (req, reply) => {
    const relPath = req.params['*'];
    const mdPaths = await listMdFiles(relPath);
    await deleteEntry(relPath);
    for (const p of mdPaths) {
      try {
        removeIndex(p);
      } catch {}
    }
    reply.status(204).send();
  });
}
