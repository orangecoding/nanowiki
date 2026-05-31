/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { BrandMark, Icon } from './Icon.jsx';

export function EmptyState({ onOpenFile, onOpenPalette, onCreate, recentPaths = [] }) {
  return (
    <div className="empty">
      <div className="empty__inner">
        <BrandMark size={56} radius={14} className="empty__mark" />
        <h1 className="empty__title">NanoWiki</h1>
        <p className="empty__sub">
          Your local-first Markdown wiki. Pick a page from the tree, search with ⌘K, or start something new.
        </p>
        <div className="empty__actions">
          <button className="btn btn--primary" onClick={() => onCreate('file', null)}>
            <Icon name="newFile" size={15} />
            New File
          </button>
          <button className="btn" onClick={onOpenPalette}>
            <Icon name="search" size={15} />
            Search
            <span className="kbd" style={{ marginLeft: 2 }}>
              ⌘K
            </span>
          </button>
        </div>
        {recentPaths.length > 0 && (
          <div className="empty__recents">
            <div className="empty__recents-label">Recently viewed</div>
            {recentPaths.slice(0, 5).map((path) => {
              const name = path.split('/').pop().replace(/\.md$/, '');
              return (
                <button key={path} className="reccard" onClick={() => onOpenFile(path)}>
                  <span className="reccard__icon">
                    <Icon name="file" size={18} />
                  </span>
                  <span className="reccard__body">
                    <span className="reccard__title">{name}</span>
                    <span className="reccard__path">{path}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
