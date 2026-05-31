/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { ContextMenu } from './ContextMenu.jsx';

function NodeRow({ node, activePath, onOpen, onCreate, onRename, onDelete, openFolders, toggleFolder }) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const [menu, setMenu] = useState(null);
  const isFolder = node.type === 'folder';
  const isOpen = isFolder && openFolders.has(node.path);
  const isActive = node.path === activePath;

  const startRename = () => {
    setRenameVal(isFolder ? node.name : node.name.replace(/\.md$/, ''));
    setRenaming(true);
  };

  const commitRename = () => {
    let finalName = renameVal.trim();
    if (!finalName) {
      setRenaming(false);
      return;
    }
    if (!isFolder) {
      finalName = finalName.replace(/\.[^./\\]*$/, '') || finalName;
      finalName += '.md';
    }
    if (finalName !== node.name) {
      const parts = node.path.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
      onRename(node.path, dir + finalName);
    }
    setRenaming(false);
  };

  const handleClick = () => {
    if (isFolder) toggleFolder(node.path);
    else onOpen(node.path);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const contextItems = isFolder
    ? [
        { label: '+ New File', onClick: () => onCreate('file', node.path) },
        { label: '+ New Folder', onClick: () => onCreate('folder', node.path) },
        { key: 'div1', divider: true },
        { label: 'Rename', onClick: startRename },
        { label: 'Delete', danger: true, onClick: () => onDelete(node.path) },
      ]
    : [
        { label: 'Rename', onClick: startRename },
        { label: 'Delete', danger: true, onClick: () => onDelete(node.path) },
      ];

  return (
    <>
      <button
        className={`row row--${isFolder ? 'folder' : 'file'}${isActive ? ' active' : ''}`}
        data-active={isActive ? '' : undefined}
        draggable={!isFolder && !renaming}
        onDragStart={
          !isFolder && !renaming
            ? (e) => {
                e.dataTransfer.setData('application/x-nanowiki-path', node.path);
                e.dataTransfer.effectAllowed = 'copy';
              }
            : undefined
        }
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isFolder ? (
          <Icon name="chevron" size={13} className={`row__chevron${isOpen ? ' row__chevron--open' : ''}`} />
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        <span className="row__icon">
          <Icon name={isFolder ? (isOpen ? 'folderOpen' : 'folder') : 'file'} size={15} />
        </span>
        {renaming ? (
          <span style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <input
              autoFocus
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(false);
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '2px 6px',
                outline: 'none',
                flex: 1,
                minWidth: 0,
              }}
            />
            {!isFolder && (
              <span
                style={{
                  color: 'var(--text-faint)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  marginLeft: 2,
                  flexShrink: 0,
                }}
              >
                .md
              </span>
            )}
          </span>
        ) : (
          <span className="row__name">{isFolder ? node.name : node.name.replace(/\.md$/, '')}</span>
        )}
      </button>

      {isFolder && isOpen && node.children && (
        <div className="tree__group">
          {node.children.map((child) => (
            <NodeRow
              key={child.path}
              node={child}
              activePath={activePath}
              onOpen={onOpen}
              onCreate={onCreate}
              onRename={onRename}
              onDelete={onDelete}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={contextItems} onClose={() => setMenu(null)} />}
    </>
  );
}

const EMPTY_SET = new Set();

export function FileTree({
  tree,
  activePath,
  onOpen,
  onCreate,
  onRename,
  onDelete,
  openFolders = EMPTY_SET,
  toggleFolder = () => {},
}) {
  const [rootMenu, setRootMenu] = useState(null);

  const handleRootContextMenu = (e) => {
    e.preventDefault();
    setRootMenu({ x: e.clientX, y: e.clientY });
  };

  const rootMenuItems = [
    { label: '+ New File', onClick: () => onCreate('file', null) },
    { label: '+ New Folder', onClick: () => onCreate('folder', null) },
  ];

  return (
    <div className="tree" onContextMenu={handleRootContextMenu}>
      {tree.length === 0 && (
        <p style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-faint)' }}>
          No files yet. Right-click to create.
        </p>
      )}
      {tree.map((node) => (
        <NodeRow
          key={node.path}
          node={node}
          activePath={activePath}
          onOpen={onOpen}
          onCreate={onCreate}
          onRename={onRename}
          onDelete={onDelete}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
        />
      ))}
      {rootMenu && (
        <ContextMenu x={rootMenu.x} y={rootMenu.y} items={rootMenuItems} onClose={() => setRootMenu(null)} />
      )}
    </div>
  );
}
