/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useCallback } from 'react';

export function useOpenFolders() {
  const [openFolders, setOpenFolders] = useState(() => {
    try {
      const stored = localStorage.getItem('open-folders');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const toggle = useCallback((path) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      localStorage.setItem('open-folders', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const open = useCallback((path) => {
    if (!path) return;
    setOpenFolders((prev) => {
      if (prev.has(path)) return prev;
      const next = new Set(prev);
      next.add(path);
      localStorage.setItem('open-folders', JSON.stringify([...next]));
      return next;
    });
  }, []);

  return [openFolders, toggle, open];
}
