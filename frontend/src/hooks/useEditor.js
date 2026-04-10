import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../api.js';

function extractLocalImageUrls(markdown) {
  const urls = new Set();
  // Standard markdown images: ![alt](/files/...)
  for (const m of markdown.matchAll(/!\[[^\]]*\]\((\/files\/[^)]+)\)/g)) {
    urls.add(m[1]);
  }
  // HTML img tags: <img src="/files/..." ...>
  for (const m of markdown.matchAll(/src="(\/files\/[^"]+)"/g)) {
    urls.add(m[1]);
  }
  return urls;
}

export function useEditor(filePath, { onError, onImageDelete } = {}) {
  const [content, setContentState] = useState('');
  const [dirty, setDirty] = useState(false);
  const [savedState, setSavedState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const saveTimer = useRef(null);
  const savedResetTimer = useRef(null);
  const latestPath = useRef(filePath);
  const onErrorRef = useRef(onError);
  const onImageDeleteRef = useRef(onImageDelete);
  const prevSavedImages = useRef(new Set());

  useEffect(() => {
    onErrorRef.current = onError;
  });
  useEffect(() => {
    onImageDeleteRef.current = onImageDelete;
  });

  useEffect(() => {
    latestPath.current = filePath;
    clearTimeout(saveTimer.current);
  }, [filePath]);

  // Load content when file changes
  useEffect(() => {
    if (!filePath) {
      setContentState('');
      setDirty(false);
      prevSavedImages.current = new Set();
      return;
    }
    api
      .getContent(filePath)
      .then((c) => {
        setContentState(c);
        setDirty(false);
        setSavedState('idle');
        prevSavedImages.current = extractLocalImageUrls(c);
      })
      .catch((err) => {
        onErrorRef.current?.(`Failed to load file: ${err.message ?? err}`);
      });
  }, [filePath]);

  // Update title dirty indicator
  useEffect(() => {
    const base = 'NanoWiki';
    document.title = dirty ? `● ${base}` : base;
  }, [dirty]);

  const setContent = useCallback((newContent) => {
    setContentState(newContent);
    setDirty(true);

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const path = latestPath.current;
      if (!path) return;
      setSavedState('saving');
      try {
        await api.saveContent(path, newContent);
        setDirty(false);
        setSavedState('saved');
        savedResetTimer.current = setTimeout(() => setSavedState('idle'), 2000);

        // Delete image files that were removed from the document
        const newImages = extractLocalImageUrls(newContent);
        const removed = [...prevSavedImages.current].filter((url) => !newImages.has(url));
        prevSavedImages.current = newImages;
        for (const url of removed) {
          onImageDeleteRef.current?.(url);
        }
      } catch {
        setSavedState('idle');
      }
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(savedResetTimer.current);
    };
  }, []);

  return { content, dirty, savedState, setContent };
}
