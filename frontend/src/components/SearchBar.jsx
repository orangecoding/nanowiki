import { useState, useEffect, useRef } from 'react';

export function SearchBar({ onSearch, results, onSelect }) {
  const [query, setQuery] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer.current);
  }, [query, onSearch]);

  return (
    <div className="relative">
      <input
        type="search"
        role="searchbox"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        className="w-full bg-elevated border border-wiki-border text-wiki-text placeholder-wiki-faint text-sm rounded-md px-3 py-1.5 outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors"
      />
      {results.length > 0 && (
        <ul className="mt-1 rounded-lg bg-elevated border border-wiki-border-bright overflow-y-auto max-h-64 shadow-xl">
          {results.map((r) => {
            const name = r.path.split('/').pop();
            return (
              <li key={r.path}>
                <button
                  onClick={() => {
                    onSelect(r.path);
                    setQuery('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-surface transition-colors"
                >
                  <div className="text-sm text-wiki-text font-medium">{name}</div>
                  <div className="text-xs text-wiki-faint truncate mt-0.5">{r.snippet}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
