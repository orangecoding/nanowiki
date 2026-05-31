/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useEffect, useRef } from 'react';

export function Dialog({ type, message, onConfirm, onCancel, onSubmit }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (type === 'prompt') inputRef.current?.focus();
    else confirmRef.current?.focus();
  }, [type]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (type === 'confirm') onConfirm();
      else if (type === 'prompt' && value.trim()) onSubmit(value.trim());
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in srgb, var(--bg-base) 70%, transparent)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onCancel}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
          width: 320,
          padding: 20,
        }}
      >
        <p
          style={{
            color: 'var(--text-base)',
            fontSize: 14,
            marginBottom: 16,
            lineHeight: 1.5,
            margin: '0 0 16px',
          }}
        >
          {message}
        </p>
        {type === 'prompt' && (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-bright)',
              color: 'var(--text-base)',
              fontSize: 13,
              padding: '8px 12px',
              borderRadius: 6,
              outline: 'none',
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
            }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'color 0.1s, background 0.1s',
            }}
          >
            Cancel
          </button>
          {type === 'confirm' ? (
            <button
              ref={confirmRef}
              onClick={onConfirm}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                color: '#fff',
                background: 'rgba(220,38,38,0.8)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              Delete
            </button>
          ) : (
            <button
              ref={confirmRef}
              onClick={() => value.trim() && onSubmit(value.trim())}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                color: 'var(--text-base)',
                background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
