/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useEffect } from 'react';
import { getVersion } from '../api.js';

export function Footer() {
  const [version, setVersion] = useState(null);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-wiki-border bg-base/60 px-4 py-1.5 flex items-center justify-between gap-4 flex-shrink-0">
      <span className="flex items-center gap-2 text-xs text-wiki-faint font-mono">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-elevated border border-wiki-border text-wiki-muted">
          <span className="text-wiki-faint">v</span>
          {version ?? '...'}
        </span>
      </span>
      <span className="text-xs text-wiki-faint">
        Made with <span className="text-accent">&#10084;</span> by{' '}
        <a
          href="https://github.com/orangecoding"
          target="_blank"
          rel="noopener noreferrer"
          className="text-wiki-muted hover:text-accent transition-colors duration-150 underline underline-offset-2 decoration-wiki-border hover:decoration-accent/50"
        >
          Christian Kellner
        </a>
      </span>
    </footer>
  );
}
