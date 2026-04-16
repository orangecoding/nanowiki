/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useCallback } from 'react';

export function useDialog() {
  const [dialog, setDialog] = useState(null);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ type: 'confirm', message, resolve });
    });
  }, []);

  const showPrompt = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ type: 'prompt', message, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setDialog((prev) => {
      prev?.resolve(true);
      return null;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setDialog((prev) => {
      prev?.resolve(null);
      return null;
    });
  }, []);

  const handleSubmit = useCallback((value) => {
    setDialog((prev) => {
      prev?.resolve(value);
      return null;
    });
  }, []);

  return { dialog, showConfirm, showPrompt, handleConfirm, handleCancel, handleSubmit };
}
