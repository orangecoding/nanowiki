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
    <div className="fixed bottom-6 right-6 z-50 bg-elevated border border-wiki-border-bright rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
      <span className="text-sm text-wiki-text flex-1">{message}</span>
      {onConfirm && (
        <button
          onClick={onConfirm}
          className="text-sm text-accent hover:text-accent-dim font-medium transition-colors whitespace-nowrap"
        >
          Reload
        </button>
      )}
      <button
        onClick={onDismiss}
        className="text-wiki-faint hover:text-wiki-text text-lg leading-none transition-colors"
      >
        ×
      </button>
    </div>
  );
}
