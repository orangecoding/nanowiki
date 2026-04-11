import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import websocket from '@fastify/websocket';
import filesRoutes from './routes/files.js';
import contentRoutes from './routes/content.js';
import imagesRoutes from './routes/images.js';
import searchRoutes from './routes/search.js';
import { addClient, startWatcher } from './services/watcher.js';
import { config } from './config.js';

const frontendDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

export async function build(opts = {}) {
  const fastify = Fastify({ logger: false, ...opts });

  await fastify.register(cors, { origin: true });
  await fastify.register(multipart);
  await fastify.register(websocket);

  if (config.dataDir) {
    await fastify.register(staticFiles, {
      root: config.dataDir,
      prefix: '/files/',
      decorateReply: false,
    });
  }

  // Serve built frontend in production (when dist/ exists)
  if (existsSync(frontendDist)) {
    await fastify.register(staticFiles, {
      root: frontendDist,
      prefix: '/',
      decorateReply: false,
      wildcard: false,
    });
    // SPA catch-all: serve index.html for unmatched GET routes
    fastify.setNotFoundHandler(async (req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/files') && req.url !== '/ws') {
        return reply.type('text/html').sendFile('index.html', frontendDist);
      }
      reply.status(404).send({ error: 'Not found' });
    });
  }

  await fastify.register(filesRoutes);
  await fastify.register(contentRoutes);
  await fastify.register(imagesRoutes);
  await fastify.register(searchRoutes);

  fastify.get('/ws', { websocket: true }, (socket) => {
    addClient(socket);
  });

  return fastify;
}

const isMain =
  process.argv[1] === new URL(import.meta.url).pathname || process.argv[1]?.includes('ProcessContainerFork');

if (isMain) {
  const { default: dotenv } = await import('dotenv');
  // Resolve .env from project root regardless of cwd
  dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

  const { initConfig } = await import('./config.js');
  initConfig();

  const { initSearch, closeSearch } = await import('./services/search.js');
  const { stopWatcher } = await import('./services/watcher.js');

  const app = await build({
    disableRequestLogging: true,
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
      },
    },
  });

  initSearch();
  startWatcher();
  await app.listen({ port: config.port, host: '0.0.0.0' });

  async function shutdown() {
    await app.close();
    await stopWatcher();
    closeSearch();
    process.exit(0);
  }

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
