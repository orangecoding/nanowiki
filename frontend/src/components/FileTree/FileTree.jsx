import { useState } from 'react';
import { ContextMenu } from './ContextMenu.jsx';

const IconFile = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 1.5h5l2.5 2.5v8H2.5v-10.5z" />
    <path d="M7.5 1.5v2.5h2.5" />
  </svg>
);

const IconFolder = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 3.5h4l1.5 1.5H12v6.5H1V3.5z" />
  </svg>
);

function NodeRow({ node, depth, activePath, onOpen, onCreate, onRename, onDelete, openFolders, toggleFolder }) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const [menu, setMenu] = useState(null);
  const isFolder = node.type === 'folder';
  const isOpen = isFolder && openFolders.has(node.path);
  const isActive = node.path === activePath;

  const startRename = () => {
    // Show the name without .md so the user edits just the stem
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
      // Strip any extension the user typed and always enforce .md
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
        {
          label: 'Rename',
          onClick: () => {
            startRename();
          },
        },
        { label: 'Delete', danger: true, onClick: () => onDelete(node.path) },
      ]
    : [
        {
          label: 'Rename',
          onClick: () => {
            startRename();
          },
        },
        { label: 'Delete', danger: true, onClick: () => onDelete(node.path) },
      ];

  return (
    <>
      <div
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
        style={{ paddingLeft: depth * 14 + 8 }}
        className={`flex items-center gap-1 py-[3px] cursor-pointer select-none group rounded-sm mx-1 transition-colors ${
          isActive ? 'bg-accent/15 text-accent' : 'text-wiki-muted hover:bg-elevated hover:text-wiki-text'
        }`}
      >
        {isFolder && <span className="text-wiki-faint text-xs w-3 flex-shrink-0">{isOpen ? '▾' : '▸'}</span>}
        {!isFolder && <span className="w-3 flex-shrink-0" />}
        {renaming ? (
          <span className="flex items-center flex-1 min-w-0">
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
              className="bg-surface border border-wiki-border-bright text-wiki-text text-sm px-1.5 py-0.5 rounded outline-none flex-1 min-w-0 font-mono text-xs"
            />
            {!isFolder && <span className="text-wiki-faint text-xs font-mono ml-0.5 flex-shrink-0">.md</span>}
          </span>
        ) : (
          <span className="text-sm flex-1 truncate">{node.name}</span>
        )}
        <span className="hidden group-hover:flex items-center gap-0.5 mr-1 flex-shrink-0">
          {isFolder && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreate('file', node.path);
                }}
                className="text-wiki-faint hover:text-accent p-0.5 rounded hover:bg-base transition-colors"
                title="New file in folder"
              >
                <IconFile />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreate('folder', node.path);
                }}
                className="text-wiki-faint hover:text-accent p-0.5 rounded hover:bg-base transition-colors"
                title="New subfolder"
              >
                <IconFolder />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              startRename();
            }}
            className="text-wiki-faint hover:text-wiki-text text-xs px-1 py-0.5 rounded hover:bg-base transition-colors"
            title="Rename"
          >
            ✏
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.path);
            }}
            className="text-wiki-faint hover:text-red-400 text-xs px-1 py-0.5 rounded hover:bg-base transition-colors"
            title="Delete"
          >
            ✕
          </button>
        </span>
      </div>
      {isFolder &&
        isOpen &&
        node.children &&
        node.children.map((child) => (
          <NodeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            activePath={activePath}
            onOpen={onOpen}
            onCreate={onCreate}
            onRename={onRename}
            onDelete={onDelete}
            openFolders={openFolders}
            toggleFolder={toggleFolder}
          />
        ))}
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
    <div className="py-2 min-h-full" onContextMenu={handleRootContextMenu}>
      {tree.length === 0 && (
        <p className="px-4 py-3 text-xs text-wiki-faint">No files yet. Right-click or use the buttons above.</p>
      )}
      {tree.map((node) => (
        <NodeRow
          key={node.path}
          node={node}
          depth={0}
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
