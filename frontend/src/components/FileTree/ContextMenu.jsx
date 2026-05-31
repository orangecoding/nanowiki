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
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 50,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-bright)',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
        padding: '4px 0',
        minWidth: 160,
        listStyle: 'none',
        margin: 0,
      }}
    >
      {items.map((item) =>
        item.divider ? (
          <li key={item.key} style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
        ) : (
          <li key={item.label}>
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 16px',
                fontSize: 13,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: item.danger ? 'var(--red, #e05252)' : 'var(--text-muted)',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.color = item.danger ? 'var(--red, #e05252)' : 'var(--text-base)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = item.danger ? 'var(--red, #e05252)' : 'var(--text-muted)';
              }}
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
