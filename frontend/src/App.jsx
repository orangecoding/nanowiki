import { useState, useCallback } from 'react';
import { ResizableSplit } from './components/ResizableSplit.jsx';
import { FileTree } from './components/FileTree/FileTree.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { Editor } from './components/Editor/Editor.jsx';
import { Toast } from './components/Toast.jsx';
import { Footer } from './components/Footer.jsx';
import { Dialog } from './components/Dialog.jsx';
import { useFileTree } from './hooks/useFileTree.js';
import { useOpenFolders } from './hooks/useOpenFolders.js';
import { useDialog } from './hooks/useDialog.js';
import { useEditor } from './hooks/useEditor.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { searchFiles, uploadImage, deleteImage } from './api.js';

const IconNewFile = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 1.5h5.5l2.5 2.5v8.5H3V1.5z" />
    <path d="M8.5 1.5v2.5H11" />
    <path d="M5.5 8h3M7 6.5v3" />
  </svg>
);

const IconNewFolder = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1.5 4h4.5l1.5 1.5H12.5v7H1.5V4z" />
    <path d="M5.5 8.5h3M7 7v3" />
  </svg>
);

function Logo() {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-sm font-semibold text-wiki-muted tracking-wide">Nano</span>
      <span className="text-sm font-semibold text-accent tracking-wide">Wiki</span>
    </div>
  );
}

export default function App() {
  const [activePath, setActivePath] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => setToast({ message: msg }), []);
  const { dialog, showConfirm, showPrompt, handleConfirm, handleCancel, handleSubmit } = useDialog();
  const [openFolders, toggleFolder, openFolder] = useOpenFolders();

  const { tree, refresh, create, rename, remove } = useFileTree({
    onError: showToast,
    showConfirm,
    showPrompt,
    onCreated: openFolder,
  });
  const handleImageDelete = useCallback(async (urlPath) => {
    try {
      await deleteImage(urlPath);
    } catch {
      // silent, file may already be gone
    }
  }, []);

  const { content, savedState, setContent } = useEditor(activePath, {
    onError: showToast,
    onImageDelete: handleImageDelete,
  });

  const handleWsEvent = useCallback(
    (event) => {
      if (event.type === 'file:added' || event.type === 'file:deleted') {
        refresh();
      }
      if (event.type === 'file:deleted' && event.path === activePath) {
        setActivePath(null);
      }
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

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchFiles(q).catch(() => []);
    setSearchResults(results);
  }, []);

  const handleImageDrop = useCallback(
    async (file) => {
      if (!activePath) return;
      try {
        const result = await uploadImage(activePath, file);
        return result;
      } catch (err) {
        setToast({ message: `Image upload failed: ${err.message}` });
      }
    },
    [activePath],
  );

  const sidebar = (
    <div className="flex flex-col h-full bg-surface border-r border-wiki-border">
      <div className="px-4 py-3 border-b border-wiki-border flex items-center justify-between gap-2">
        <Logo />
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => create('file', null)}
            className="text-wiki-faint hover:text-accent p-1.5 rounded hover:bg-elevated transition-colors"
            title="New file"
          >
            <IconNewFile />
          </button>
          <button
            onClick={() => create('folder', null)}
            className="text-wiki-faint hover:text-accent p-1.5 rounded hover:bg-elevated transition-colors"
            title="New folder"
          >
            <IconNewFolder />
          </button>
        </div>
      </div>
      <div className="px-3 py-2 border-b border-wiki-border">
        <SearchBar
          onSearch={handleSearch}
          results={searchResults}
          onSelect={(path) => {
            setActivePath(path);
            setSearchResults([]);
          }}
        />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <FileTree
          tree={tree}
          activePath={activePath}
          onOpen={setActivePath}
          onCreate={create}
          onRename={rename}
          onDelete={remove}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
        />
      </div>
    </div>
  );

  const editorPanel = (
    <Editor
      filePath={activePath}
      content={content}
      onChange={setContent}
      onImageDrop={handleImageDrop}
      savedState={savedState}
    />
  );

  return (
    <div className="h-screen bg-base text-wiki-text overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResizableSplit sidebar={sidebar} content={editorPanel} />
      </div>
      <Footer />
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
