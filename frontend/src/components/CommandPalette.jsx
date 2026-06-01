/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icon } from './Icon.jsx';
import { searchFiles } from '../api.js';
import { flattenTree } from '../utils/fileLinks.js';

const ACTIONS = [
  { id: 'new-file', title: 'New page', icon: 'newFile', kw: 'create add' },
  { id: 'new-folder', title: 'New folder', icon: 'newFolder', kw: 'create add directory' },
  { id: 'settings', title: 'Open appearance settings', icon: 'settings', kw: 'theme accent density' },
];

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="hl">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function makeSnippet(snippet, query) {
  if (!snippet || !query) return snippet;
  const q = query.toLowerCase();
  const lower = snippet.toLowerCase();
  const at = lower.indexOf(q);
  if (at === -1) return snippet;
  const start = Math.max(0, at - 40);
  const end = Math.min(snippet.length, at + q.length + 80);
  const pre = (start > 0 ? '…' : '') + snippet.slice(start, at);
  const hit = snippet.slice(at, at + q.length);
  const post = snippet.slice(at + q.length, end) + (end < snippet.length ? '…' : '');
  return (
    <>
      {pre}
      <span className="hl">{hit}</span>
      {post}
    </>
  );
}

export function CommandPalette({ tree, activePath: _activePath, onClose, onOpenFile, onAction, recentPaths = [] }) {
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isActions = q.startsWith('>');
  const searchQuery = isActions ? '' : q.trim();
  const actionQuery = isActions ? q.slice(1).trim().toLowerCase() : '';

  // Debounced FTS search
  useEffect(() => {
    if (isActions || !searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchFiles(searchQuery).catch(() => []);
      setSearchResults(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, isActions]);

  const flatFiles = useMemo(() => flattenTree(tree), [tree]);

  // Build groups
  const groups = useMemo(() => {
    if (isActions) {
      const filtered = ACTIONS.filter(
        (a) => !actionQuery || (a.title.toLowerCase() + ' ' + a.kw).includes(actionQuery),
      );
      return [{ label: 'Actions', items: filtered.map((a) => ({ kind: 'action', ...a })) }];
    }
    if (!searchQuery) {
      const recents = recentPaths.length > 0 ? recentPaths : flatFiles.slice(0, 8);
      return [
        {
          label: 'Recent',
          items: recents.slice(0, 8).map((p) => ({ kind: 'file', path: p })),
        },
      ];
    }
    const ql = searchQuery.toLowerCase();
    const titleHits = [];
    const bodyHits = [];
    for (const r of searchResults) {
      const name = r.path.split('/').pop().replace(/\.md$/, '');
      if (name.toLowerCase().includes(ql) || r.path.toLowerCase().includes(ql)) {
        titleHits.push({ kind: 'file', ...r });
      } else {
        bodyHits.push({ kind: 'file', ...r });
      }
    }
    const result = [];
    if (titleHits.length) result.push({ label: 'Files', items: titleHits });
    if (bodyHits.length) result.push({ label: 'In page text', items: bodyHits });
    if (!result.length && searchQuery) result.push({ label: '', items: [] });
    return result;
  }, [isActions, actionQuery, searchQuery, searchResults, flatFiles, recentPaths]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  useEffect(() => setSel(0), [q]);

  const choose = useCallback(
    (item) => {
      if (!item) return;
      if (item.kind === 'action') onAction(item.id);
      else onOpenFile(item.path);
    },
    [onAction, onOpenFile],
  );

  const onKey = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((s) => Math.min(flat.length - 1, s + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        choose(flat[sel]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [flat, sel, choose, onClose],
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = bodyRef.current?.querySelector('.presult.sel');
    if (el) {
      const parent = bodyRef.current;
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      if (elTop < parent.scrollTop) parent.scrollTop = elTop - 8;
      else if (elBottom > parent.scrollTop + parent.clientHeight) parent.scrollTop = elBottom - parent.clientHeight + 8;
    }
  }, [sel]);

  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette">
        <div className="palette__input-wrap">
          <Icon name={isActions ? 'bolt' : 'search'} size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            autoFocus
            className="palette__input"
            placeholder="Search pages, or type > for actions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <span className="palette__mode">{isActions ? 'ACTIONS' : searchQuery ? 'SEARCH' : 'RECENT'}</span>
        </div>

        <div className="palette__body" ref={bodyRef}>
          {groups.map((group, groupIdx) => {
            const groupOffset = groups.slice(0, groupIdx).reduce((acc, g) => acc + g.items.length, 0);
            return (
              <div key={group.label}>
                {group.label && <div className="palette__group-label">{group.label}</div>}
                {group.items.length === 0 && searchQuery && !isActions && (
                  <div className="palette__empty">No results for "{searchQuery}"</div>
                )}
                {group.items.map((item, localIdx) => {
                  const idx = groupOffset + localIdx;
                  const isSel = idx === sel;

                  if (item.kind === 'action') {
                    return (
                      <button
                        key={item.id}
                        className={`presult${isSel ? ' sel' : ''}`}
                        onClick={() => choose(item)}
                        onMouseEnter={() => setSel(idx)}
                      >
                        <span className="presult__icon">
                          <Icon name={item.icon} size={16} />
                        </span>
                        <span className="presult__body">
                          <span className="presult__title">{item.title}</span>
                        </span>
                        {isSel && <span className="presult__enter">↵</span>}
                      </button>
                    );
                  }

                  const name = item.path.split('/').pop().replace(/\.md$/, '');
                  return (
                    <button
                      key={item.path}
                      className={`presult${isSel ? ' sel' : ''}`}
                      onClick={() => choose(item)}
                      onMouseEnter={() => setSel(idx)}
                    >
                      <span className="presult__icon">
                        <Icon name="file" size={16} />
                      </span>
                      <span className="presult__body">
                        <span className="presult__title">{highlight(name, searchQuery)}</span>
                        <span className="presult__path">{item.path}</span>
                        {item.snippet && (
                          <span className="presult__snippet">{makeSnippet(item.snippet, searchQuery)}</span>
                        )}
                      </span>
                      {isSel && <span className="presult__enter">↵</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="palette__foot">
          <span className="k">
            <span className="kbd">↑↓</span> navigate
          </span>
          <span className="k">
            <span className="kbd">↵</span> open
          </span>
          <span className="k">
            <span className="kbd">Esc</span> close
          </span>
          {!isActions && (
            <span className="k" style={{ marginLeft: 'auto' }}>
              Type <span className="kbd">&gt;</span> for actions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
