/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return createPortal(
    <ul
      ref={ref}
      style={{ top: y, left: x }}
      className="fixed z-50 bg-elevated border border-wiki-border-bright rounded-lg shadow-2xl py-1 min-w-[160px]"
    >
      {items.map((item) =>
        item.divider ? (
          <li key={item.key} className="border-t border-wiki-border my-1" />
        ) : (
          <li key={item.label}>
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full text-left px-4 py-1.5 text-sm transition-colors hover:bg-surface ${
                item.danger ? 'text-red-400 hover:text-red-300' : 'text-wiki-muted hover:text-wiki-text'
              }`}
            >
              {item.label}
            </button>
          </li>
        ),
      )}
    </ul>,
    document.body,
  );
}
