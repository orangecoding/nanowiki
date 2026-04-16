/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { watch } from 'chokidar';
import { relative } from 'node:path';
import { readFile } from 'node:fs/promises';
import { config } from '../config.js';
import { upsertIndex, removeIndex } from './search.js';

let watcher = null;
const clients = new Set();
const recentlySaved = new Set();

export function markSaved(relPath) {
  recentlySaved.add(relPath);
  setTimeout(() => recentlySaved.delete(relPath), 5000);
}

export function addClient(socket) {
  clients.add(socket);
  socket.on('close', () => clients.delete(socket));
}

function broadcast(event) {
  const msg = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

export function startWatcher() {
  if (watcher) return;
  watcher = watch(config.dataDir, {
    ignored: (path) => {
      const base = path.split('/').pop();
      return base.startsWith('.') || base.endsWith('.db');
    },
    persistent: true,
    ignoreInitial: true,
    followSymlinks: false,
  });

  watcher.on('add', (abs) => {
    if (!abs.endsWith('.md')) return;
    const relPath = relative(config.dataDir, abs);
    readFile(abs, 'utf8')
      .then((content) => upsertIndex(relPath, content))
      .catch(() => {});
    broadcast({ type: 'file:added', path: relPath });
  });
  watcher.on('change', (abs) => {
    if (!abs.endsWith('.md')) return;
    const relPath = relative(config.dataDir, abs);
    readFile(abs, 'utf8')
      .then((content) => upsertIndex(relPath, content))
      .catch(() => {});
    if (recentlySaved.has(relPath)) return;
    broadcast({ type: 'file:changed', path: relPath });
  });
  watcher.on('unlink', (abs) => {
    if (!abs.endsWith('.md')) return;
    const relPath = relative(config.dataDir, abs);
    try {
      removeIndex(relPath);
    } catch {}
    broadcast({ type: 'file:deleted', path: relPath });
  });
  watcher.on('addDir', (abs) => {
    broadcast({ type: 'file:added', path: relative(config.dataDir, abs) + '/' });
  });
  watcher.on('unlinkDir', (abs) => {
    broadcast({ type: 'file:deleted', path: relative(config.dataDir, abs) + '/' });
  });
}

export async function stopWatcher() {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
}
