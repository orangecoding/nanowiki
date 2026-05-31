/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useMemo, useCallback } from 'react';
import { Icon } from './Icon.jsx';
import { useScrollSpy } from '../hooks/useScrollSpy.js';

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) headings.push({ level: 2, text: h2[1].trim(), id: slug(h2[1].trim()) });
    else if (h3) headings.push({ level: 3, text: h3[1].trim(), id: slug(h3[1].trim()) });
  }
  return headings;
}

function findBacklinks(_filePath, _tree) {
  // Backlinks detection from file tree (simplified — no content search)
  // In production this could be a backend call
  return [];
}

export function MetaRail({ filePath, content, tree, onNavigate, canvasRef }) {
  const headings = useMemo(() => extractHeadings(content || ''), [content]);
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useScrollSpy(canvasRef, headingIds);
  const backlinks = useMemo(() => findBacklinks(filePath, tree), [filePath, tree]);

  const jumpTo = useCallback(
    (id) => {
      const canvas = canvasRef?.current;
      if (!canvas) return;
      const el = canvas.querySelector(`[id="${CSS.escape(id)}"]`);
      if (!el) return;
      const top = el.getBoundingClientRect().top - canvas.getBoundingClientRect().top + canvas.scrollTop - 72;
      canvas.scrollTo({ top, behavior: 'smooth' });
    },
    [canvasRef],
  );

  return (
    <aside className="rail">
      {headings.length > 0 && (
        <div className="rail__sec">
          <div className="rail__label">On this page</div>
          <nav className="outline">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={`${h.level === 3 ? 'lvl3' : ''}${activeId === h.id ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  jumpTo(h.id);
                }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {headings.length === 0 && (
        <div className="rail__sec">
          <div className="rail__label">On this page</div>
          <div className="outline">
            <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>No headings</span>
          </div>
        </div>
      )}

      {backlinks.length > 0 && (
        <div className="rail__sec">
          <div className="rail__label">Linked from ({backlinks.length})</div>
          <div className="backlinks">
            {backlinks.map((path) => (
              <button key={path} className="backlink" onClick={() => onNavigate(path)}>
                <span className="backlink__icon">
                  <Icon name="file" size={14} />
                </span>
                <span className="backlink__name">{path.split('/').pop().replace(/\.md$/, '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
