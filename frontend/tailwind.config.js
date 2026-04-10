export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#080b14',
        surface: '#0d1120',
        elevated: '#121828',
        'wiki-border': '#1a2540',
        'wiki-border-bright': '#253660',
        accent: '#f97316',
        'accent-dim': '#ea580c',
        'wiki-text': '#e1e7f0',
        'wiki-muted': '#8899bb',
        'wiki-faint': '#3d5070',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
