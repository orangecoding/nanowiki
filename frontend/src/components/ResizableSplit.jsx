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

const IconMenu = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M2 5h14M2 9h14M2 13h14" />
  </svg>
);

const IconClose = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 4l10 10M14 4L4 14" />
  </svg>
);

export function ResizableSplit({ sidebar, content }) {
  const [width, setWidth] = useState(getStoredWidth);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      {/* Desktop sidebar */}
      <div style={{ width }} className="hidden md:block h-full flex-shrink-0 overflow-hidden">
        {sidebar}
      </div>

      {/* Desktop resizer */}
      <div
        onMouseDown={onMouseDown}
        className="hidden md:block w-px cursor-col-resize bg-wiki-border hover:bg-accent transition-colors flex-shrink-0"
      />

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-wiki-border bg-surface flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="text-wiki-faint hover:text-accent p-1 rounded hover:bg-elevated transition-colors"
          >
            <IconMenu />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">{content}</div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-30 w-72 overflow-hidden flex flex-col">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-wiki-faint hover:text-accent p-1.5 rounded hover:bg-elevated transition-colors"
              >
                <IconClose />
              </button>
            </div>
            {sidebar}
          </div>
        </>
      )}
    </div>
  );
}
