import { useState, useCallback, useEffect } from 'react';
import * as api from '../api.js';

export function useFileTree({ onError, showConfirm, showPrompt, onCreated } = {}) {
  const [tree, setTree] = useState([]);

  const refresh = useCallback(async () => {
    try {
      setTree(await api.getFiles());
    } catch (err) {
      onError?.(`Failed to load files: ${err.message}`);
    }
  }, [onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (type, parentPath) => {
      const label = type === 'folder' ? 'Folder name:' : 'File name:';
      const name = showPrompt ? await showPrompt(label) : prompt(label);
      if (!name) return;
      const path = parentPath ? `${parentPath}/${name}` : name;
      try {
        await api.createEntry(type, path);
        await refresh();
        if (parentPath) onCreated?.(parentPath);
      } catch (err) {
        onError?.(`Failed to create ${type}: ${err.message}`);
      }
    },
    [refresh, onError, showPrompt, onCreated],
  );

  const rename = useCallback(
    async (path, newPath) => {
      try {
        await api.renameEntry(path, newPath);
        await refresh();
      } catch (err) {
        onError?.(`Failed to rename: ${err.message}`);
      }
    },
    [refresh, onError],
  );

  const remove = useCallback(
    async (path) => {
      const ok = showConfirm ? await showConfirm(`Delete "${path}"?`) : confirm(`Delete "${path}"?`);
      if (!ok) return;
      try {
        await api.deleteEntry(path);
        await refresh();
      } catch (err) {
        onError?.(`Failed to delete: ${err.message}`);
      }
    },
    [refresh, onError, showConfirm],
  );

  return { tree, refresh, create, rename, remove };
}
