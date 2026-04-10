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
    <div className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-base/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-surface border border-wiki-border rounded-lg shadow-2xl w-80 p-5">
        <p className="text-wiki-text text-sm mb-4 leading-relaxed">{message}</p>
        {type === 'prompt' && (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-elevated border border-wiki-border-bright text-wiki-text text-sm px-3 py-2 rounded outline-none focus:border-accent/70 mb-4 font-mono"
          />
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-wiki-muted hover:text-wiki-text bg-elevated hover:bg-wiki-border rounded transition-colors"
          >
            Cancel
          </button>
          {type === 'confirm' ? (
            <button
              ref={confirmRef}
              onClick={onConfirm}
              className="px-3 py-1.5 text-xs text-white bg-red-600/80 hover:bg-red-600 rounded transition-colors"
            >
              Delete
            </button>
          ) : (
            <button
              ref={confirmRef}
              onClick={() => value.trim() && onSubmit(value.trim())}
              className="px-3 py-1.5 text-xs text-wiki-text bg-accent/20 hover:bg-accent/30 border border-accent/30 rounded transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
