/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useCallback, useEffect, useRef } from 'react';

const MIN_WIDTH = 160;
const DEFAULT_WIDTH = 260;

function getStoredWidth() {
  return parseInt(localStorage.getItem('sidebar-width') ?? DEFAULT_WIDTH, 10);
}

export function ResizableSplit({ sidebar, content }) {
  const [width, setWidth] = useState(getStoredWidth);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const next = Math.max(MIN_WIDTH, Math.min(e.clientX, window.innerWidth * 0.5));
      setWidth(next);
      localStorage.setItem('sidebar-width', next);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <div style={{ width }} className="h-full flex-shrink-0 overflow-hidden">
        {sidebar}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-px cursor-col-resize bg-wiki-border hover:bg-accent transition-colors flex-shrink-0"
      />
      <div className="flex-1 overflow-hidden">{content}</div>
    </div>
  );
}
