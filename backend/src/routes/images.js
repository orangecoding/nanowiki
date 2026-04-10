import { safePath } from '../services/fileSystem.js';
import { pipeline } from 'node:stream/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { dirname, extname, basename, join, relative } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { config } from '../config.js';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default async function imagesRoutes(fastify) {
  fastify.post('/api/images/*', async (req, reply) => {
    const mdRelPath = req.params['*'];
    const mdAbs = safePath(mdRelPath);
    const dir = dirname(mdAbs);

    const data = await req.file({ limits: { fileSize: MAX_BYTES } });
    if (!data) return reply.status(400).send({ error: 'No file' });

    const ext = extname(data.filename).toLowerCase();
    if (!ALLOWED.has(ext)) return reply.status(415).send({ error: 'Unsupported type' });

    let name = basename(data.filename);
    let dest = join(dir, name);
    let counter = 1;
    while (existsSync(dest)) {
      const base = basename(data.filename, ext);
      name = `${base}-${counter}${ext}`;
      dest = join(dir, name);
      counter++;
    }

    await mkdir(dir, { recursive: true });
    await pipeline(data.file, createWriteStream(dest));

    const relDest = relative(config.dataDir, dest);
    return { relativePath: `./${name}`, urlPath: `/files/${relDest}` };
  });

  fastify.delete('/api/images/*', async (req, reply) => {
    const relPath = req.params['*'];
    const abs = safePath(relPath);
    const ext = extname(abs).toLowerCase();
    if (!ALLOWED.has(ext)) return reply.status(415).send({ error: 'Not an image' });
    try {
      await unlink(abs);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    return reply.status(204).send();
  });
}
