/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  darkMode: 'class',
  content: [join(__dirname, 'index.html'), join(__dirname, 'src/**/*.{js,jsx}')],
  theme: {
    extend: {
      colors: {
        base: '#0d0d0d',
        surface: '#161616',
        elevated: '#1e1e1e',
        'wiki-border': '#2a2a2a',
        'wiki-border-bright': '#383838',
        accent: '#e04a38',
        'accent-dim': '#c13827',
        'wiki-text': '#efefef',
        'wiki-muted': '#909090',
        'wiki-faint': '#505050',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#fb7185',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
