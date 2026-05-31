/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useEffect, useRef } from 'react';

export function Toast({ message, onConfirm, onDismiss }) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!onConfirm) {
      const t = setTimeout(() => onDismissRef.current(), 4000);
      return () => clearTimeout(t);
    }
  }, [message, onConfirm]);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-bright)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 360,
      }}
    >
      <span style={{ fontSize: 14, color: 'var(--text-base)', flex: 1 }}>{message}</span>
      {onConfirm && (
        <button
          onClick={onConfirm}
          style={{
            fontSize: 14,
            color: 'var(--accent)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            padding: 0,
            transition: 'color 0.1s',
          }}
        >
          Reload
        </button>
      )}
      <button
        onClick={onDismiss}
        style={{
          fontSize: 18,
          lineHeight: 1,
          color: 'var(--text-faint)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.1s',
        }}
      >
        ×
      </button>
    </div>
  );
}
