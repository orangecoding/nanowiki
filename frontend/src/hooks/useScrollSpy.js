/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useEffect } from 'react';

export function useScrollSpy(canvasRef, headingIds) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas || headingIds.length === 0) {
      setActiveId(null);
      return;
    }

    const onScroll = () => {
      const canvasTop = canvas.getBoundingClientRect().top;
      const offset = canvasTop + 96;
      let current = null;
      for (const id of headingIds) {
        const el = canvas.querySelector(`[id="${CSS.escape(id)}"]`);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    canvas.addEventListener('scroll', onScroll, { passive: true });
    return () => canvas.removeEventListener('scroll', onScroll);
  }, [canvasRef, headingIds]);

  return activeId;
}
