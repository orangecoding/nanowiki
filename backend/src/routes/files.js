import { getTree, createFile, createFolder, renameEntry, deleteEntry, listMdFiles } from '../services/fileSystem.js';
import { removeIndex } from '../services/search.js';

export default async function filesRoutes(fastify) {
  fastify.get('/api/files', async () => getTree());

  fastify.post('/api/files', async (req, reply) => {
    const { type, path } = req.body;
    if (type === 'folder') await createFolder(path);
    else await createFile(path);
    reply.status(201).send({ ok: true });
  });

  fastify.put('/api/files/*', async (req, reply) => {
    const relPath = req.params['*'];
    await renameEntry(relPath, req.body.newPath);
    reply.send({ ok: true });
  });

  fastify.delete('/api/files/*', async (req, reply) => {
    const relPath = req.params['*'];
    // Collect affected .md paths before deletion for index cleanup
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
