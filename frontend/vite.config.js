/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Read PORT from the project root .env (parent of frontend/)
  const env = loadEnv(mode, new URL('..', import.meta.url).pathname, '');
  const port = env.PORT ?? 3001;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': `http://localhost:${port}`,
        '/files': `http://localhost:${port}`,
        '/ws': { target: `ws://localhost:${port}`, ws: true },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './test/setup.js',
      include: ['test/**/*.{test,spec}.{js,jsx}', 'src/**/*.{test,spec}.{js,jsx}'],
    },
  };
});
