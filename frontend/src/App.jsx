/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import rootPkg from '../../package.json';
import { FileTree } from './components/FileTree/FileTree.jsx';
import { Editor } from './components/Editor/Editor.jsx';
import { extractHeadings } from './components/MetaRail.jsx';
import { Toast } from './components/Toast.jsx';
import { Dialog } from './components/Dialog.jsx';
import { Icon, BrandMark } from './components/Icon.jsx';
import { CommandPalette } from './components/CommandPalette.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { AppearanceSettings } from './components/AppearanceSettings.jsx';
import { SavePill } from './components/SavePill.jsx';
import { useFileTree } from './hooks/useFileTree.js';
import { useOpenFolders } from './hooks/useOpenFolders.js';
import { useDialog } from './hooks/useDialog.js';
import { useEditor } from './hooks/useEditor.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { uploadImage, deleteImage } from './api.js';
import { flattenTree, resolveRelative } from './utils/fileLinks.js';

const DEFAULT_SETTINGS = { accent: 'coral', width: 'focus', density: 'cozy' };

const ACCENTS = {
  coral: { a: '#e04a38', dim: '#c13827', glow: 'rgba(224,74,56,0.18)' },
  blue: { a: '#3b82f6', dim: '#2563eb', glow: 'rgba(59,130,246,0.20)' },
  green: { a: '#10b981', dim: '#059669', glow: 'rgba(16,185,129,0.18)' },
  amber: { a: '#f59e0b', dim: '#d97706', glow: 'rgba(245,158,11,0.18)' },
  violet: { a: '#8b5cf6', dim: '#7c3aed', glow: 'rgba(139,92,246,0.20)' },
};

function Brand({ small }) {
  return (
    <div className="brand">
      <BrandMark size={small ? 24 : 26} radius={small ? 6 : 7} className="brand__mark" />
      <span className="brand__name">
        <span className="n">Nano</span>
        <span className="w">Wiki</span>
      </span>
      {!small && <span className="brand__ver mono">v{rootPkg.version}</span>}
    </div>
  );
}

export default function App() {
  const [activePath, setActivePath] = useState(null);
  const canvasRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const v = parseInt(localStorage.getItem('nw-sbw') || '288', 10);
    return isNaN(v) ? 288 : Math.max(220, Math.min(460, v));
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [recentPaths, setRecentPaths] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nw-recents') || '[]');
    } catch {
      return [];
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('nw-settings') || '{}') };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const showToast = useCallback((msg) => setToast({ message: msg }), []);
  const { dialog, showConfirm, showPrompt, handleConfirm, handleCancel, handleSubmit } = useDialog();
  const [openFolders, toggleFolder, openFolder] = useOpenFolders();

  const { tree, refresh, create, rename, remove, move } = useFileTree({
    onError: showToast,
    showConfirm,
    showPrompt,
    onCreated: openFolder,
  });

  const handleImageDelete = useCallback(async (urlPath) => {
    try {
      await deleteImage(urlPath);
    } catch {
      /* silent */
    }
  }, []);

  const { content, dirty, savedState, setContent } = useEditor(activePath, {
    onError: showToast,
    onImageDelete: handleImageDelete,
  });

  // Apply settings to CSS custom properties
  useEffect(() => {
    localStorage.setItem('nw-settings', JSON.stringify(settings));
    const root = document.documentElement;
    const ac = ACCENTS[settings.accent] || ACCENTS.coral;
    root.style.setProperty('--accent', ac.a);
    root.style.setProperty('--accent-dim', ac.dim);
    root.style.setProperty('--accent-glow', ac.glow);
    const widthMap = { focus: '760px', wide: '940px', full: '1180px' };
    root.style.setProperty('--reading-w', widthMap[settings.width] || '760px');
  }, [settings]);

  // Persist sidebar width
  useEffect(() => {
    localStorage.setItem('nw-sbw', String(sidebarWidth));
  }, [sidebarWidth]);

  const openFile = useCallback(
    (path) => {
      setRecentPaths((prev) => {
        const next = [path, ...prev.filter((p) => p !== path)].slice(0, 20);
        localStorage.setItem('nw-recents', JSON.stringify(next));
        return next;
      });
      const segments = path.split('/');
      for (let i = 1; i < segments.length; i++) openFolder(segments.slice(0, i).join('/'));
      setActivePath(path);
      setPaletteOpen(false);
      setDrawerOpen(false);
      setSheet(null);
    },
    [openFolder],
  );

  const handleCreate = useCallback(
    async (type, parentPath) => {
      const createdPath = await create(type, parentPath);
      if (type === 'file' && createdPath) openFile(createdPath);
    },
    [create, openFile],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'f')) {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.ctrlKey && !e.metaKey && k === 'n') {
        e.preventDefault();
        const parentPath = activePath ? activePath.split('/').slice(0, -1).join('/') || null : null;
        handleCreate('file', parentPath);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
        setSettingsOpen(false);
        setDrawerOpen(false);
        setSheet(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePath, handleCreate]);

  // WebSocket events
  const handleWsEvent = useCallback(
    (event) => {
      if (event.type === 'file:added' || event.type === 'file:deleted') refresh();
      if (event.type === 'file:deleted' && event.path === activePath) setActivePath(null);
      if (event.type === 'file:changed' && event.path === activePath) {
        setToast({
          message: 'This file was changed externally. Reload?',
          onConfirm: () => {
            setActivePath(null);
            setTimeout(() => setActivePath(event.path), 0);
            setToast(null);
          },
        });
      }
    },
    [activePath, refresh],
  );
  useWebSocket(handleWsEvent);

  // Sidebar drag resize
  const startResize = useCallback((e) => {
    e.preventDefault();
    const onMove = (ev) => {
      const x = ev.clientX;
      setSidebarWidth(Math.max(220, Math.min(460, x)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
  }, []);

  const handleNavigate = useCallback(
    (href) => {
      const paths = flattenTree(tree);
      if (activePath) {
        const relative = resolveRelative(href, activePath);
        if (paths.includes(relative)) {
          openFile(relative);
          return;
        }
      }
      if (paths.includes(href)) {
        openFile(href);
        return;
      }
      window.open(href, '_blank', 'noopener,noreferrer');
    },
    [activePath, tree, openFile],
  );

  const handleImageDrop = useCallback(
    async (file) => {
      if (!activePath) return;
      try {
        return await uploadImage(activePath, file);
      } catch (err) {
        setToast({ message: `Image upload failed: ${err.message}` });
      }
    },
    [activePath],
  );

  const handleAction = useCallback(
    (id) => {
      setPaletteOpen(false);
      setSheet(null);
      if (id === 'new-file') handleCreate('file', null);
      else if (id === 'new-folder') handleCreate('folder', null);
      else if (id === 'settings') setSettingsOpen(true);
    },
    [handleCreate],
  );

  const flatFiles = flattenTree(tree);

  const sidebarContent = (
    <>
      <div className="sidebar__head">
        <span className="sidebar__title">Workspace</span>
        <div className="sidebar__actions">
          <button className="iconbtn" title="New page" onClick={() => handleCreate('file', null)}>
            <Icon name="newFile" size={16} />
          </button>
          <button className="iconbtn" title="New folder" onClick={() => handleCreate('folder', null)}>
            <Icon name="newFolder" size={16} />
          </button>
        </div>
      </div>
      <div className="sidebar__tree">
        <FileTree
          tree={tree}
          activePath={activePath}
          onOpen={openFile}
          onCreate={handleCreate}
          onRename={rename}
          onDelete={remove}
          onMove={move}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
        />
      </div>
      <div className="sidebar__foot">
        <Icon name="folder" size={13} />
        <span>{flatFiles.length} pages</span>
        <span className="mono" style={{ marginLeft: 'auto' }}>
          ~/wiki
        </span>
      </div>
    </>
  );

  return (
    <div className={`app${settings.density === 'compact' ? ' compact' : ''}`}>
      {/* Desktop top bar */}
      <header className="topbar">
        <button
          className={`iconbtn${sidebarCollapsed ? '' : ' iconbtn--on'}`}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          onClick={() => setSidebarCollapsed((v) => !v)}
        >
          <Icon name="panelLeft" size={17} />
        </button>
        <Brand />
        <button className="omnibox" onClick={() => setPaletteOpen(true)}>
          <Icon name="search" size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="omnibox__label">Search or jump to a page…</span>
          <span className="omnibox__kbd">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
        <div className="topbar__right">
          <button className="iconbtn" title="Quick actions" onClick={() => setPaletteOpen(true)}>
            <Icon name="bolt" size={17} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className={`iconbtn${settingsOpen ? ' iconbtn--on' : ''}`}
              title="Appearance"
              onClick={() => setSettingsOpen((v) => !v)}
            >
              <Icon name="settings" size={17} />
            </button>
            {settingsOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setSettingsOpen(false)} />
                <div className="pop settings" style={{ right: 0, top: 'calc(100% + 8px)', zIndex: 60 }}>
                  <AppearanceSettings settings={settings} setSettings={setSettings} />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="mtopbar">
        <button className="iconbtn hamburger" onClick={() => setDrawerOpen(true)}>
          <Icon name="menu" size={18} />
        </button>
        <Brand small />
        <div className="mtopbar__spacer" />
        {activePath && <SavePill dirty={dirty} savedState={savedState} />}
      </header>

      {/* Body */}
      <div className="body">
        {!sidebarCollapsed && (
          <aside className="sidebar" style={{ flexBasis: sidebarWidth, width: sidebarWidth, minWidth: sidebarWidth }}>
            {sidebarContent}
          </aside>
        )}
        {!sidebarCollapsed && (
          <div
            className="sb-handle"
            onMouseDown={startResize}
            onDoubleClick={() => setSidebarWidth(288)}
            title="Drag to resize · double-click to reset"
          />
        )}

        <main className="main">
          {!activePath ? (
            <EmptyState
              onOpenFile={openFile}
              onOpenPalette={() => setPaletteOpen(true)}
              onCreate={handleCreate}
              recentPaths={recentPaths}
            />
          ) : (
            <Editor
              filePath={activePath}
              content={content}
              onChange={setContent}
              onImageDrop={handleImageDrop}
              savedState={savedState}
              dirty={dirty}
              onNavigate={handleNavigate}
              canvasRef={canvasRef}
            />
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottomnav">
        <button className={`navitem${drawerOpen ? ' active' : ''}`} onClick={() => setDrawerOpen(true)}>
          <span className="navitem__icon">
            <Icon name="panelLeft" size={20} />
          </span>
          Files
        </button>
        <button className="navitem" onClick={() => setPaletteOpen(true)}>
          <span className="navitem__icon">
            <Icon name="search" size={20} />
          </span>
          Search
        </button>
        <button
          className={`navitem${sheet === 'outline' ? ' active' : ''}`}
          onClick={() => activePath && setSheet('outline')}
        >
          <span className="navitem__icon">
            <Icon name="outline" size={20} />
          </span>
          Outline
        </button>
        <button className={`navitem${sheet === 'settings' ? ' active' : ''}`} onClick={() => setSheet('settings')}>
          <span className="navitem__icon">
            <Icon name="settings" size={20} />
          </span>
          Theme
        </button>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="drawer">
          <div className="drawer__scrim" onClick={() => setDrawerOpen(false)} />
          <div className="drawer__panel">
            <div className="sidebar__head">
              <Brand small />
              <button className="iconbtn" onClick={() => setDrawerOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="sidebar__tree">
              <FileTree
                tree={tree}
                activePath={activePath}
                onOpen={openFile}
                onCreate={handleCreate}
                onRename={rename}
                onDelete={remove}
                onMove={move}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
              />
            </div>
            <div className="sidebar__foot">
              <Icon name="folder" size={13} />
              <span>{flatFiles.length} pages</span>
              <span className="mono" style={{ marginLeft: 'auto' }}>
                ~/wiki
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sheets */}
      {sheet === 'outline' && activePath && (
        <div className="sheet">
          <div className="sheet__scrim" onClick={() => setSheet(null)} />
          <div className="sheet__panel">
            <div className="sheet__grip" />
            <div className="sheet__head">
              <span className="sheet__title">On this page</span>
              <button className="iconbtn" onClick={() => setSheet(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="sheet__body">
              <nav className="outline">
                {extractHeadings(content).length === 0 ? (
                  <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>No headings</span>
                ) : (
                  extractHeadings(content).map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={h.level === 3 ? 'lvl3' : ''}
                      onClick={(e) => {
                        e.preventDefault();
                        setSheet(null);
                      }}
                    >
                      {h.text}
                    </a>
                  ))
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
      {sheet === 'settings' && (
        <div className="sheet">
          <div className="sheet__scrim" onClick={() => setSheet(null)} />
          <div className="sheet__panel">
            <div className="sheet__grip" />
            <div className="sheet__head">
              <span className="sheet__title">Appearance</span>
              <button className="iconbtn" onClick={() => setSheet(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="sheet__body">
              <AppearanceSettings settings={settings} setSettings={setSettings} />
            </div>
          </div>
        </div>
      )}

      {/* Command palette */}
      {paletteOpen && (
        <CommandPalette
          tree={tree}
          activePath={activePath}
          onClose={() => setPaletteOpen(false)}
          onOpenFile={openFile}
          onAction={handleAction}
          recentPaths={recentPaths}
        />
      )}

      {/* Toasts and dialogs */}
      {toast && <Toast message={toast.message} onConfirm={toast.onConfirm} onDismiss={() => setToast(null)} />}
      {dialog && (
        <Dialog
          type={dialog.type}
          message={dialog.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
