/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0c0c0e',
        surface: '#111113',
        elevated: '#18181b',
        'wiki-border': '#27272a',
        'wiki-border-bright': '#3f3f46',
        accent: '#f97316',
        'accent-dim': '#ea580c',
        'wiki-text': '#e4e4e7',
        'wiki-muted': '#a1a1aa',
        'wiki-faint': '#52525b',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
