/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { Icon } from './Icon.jsx';

export function SavePill({ dirty, savedState }) {
  const state =
    dirty && savedState === 'idle'
      ? 'dirty'
      : savedState === 'saving'
        ? 'saving'
        : savedState === 'saved'
          ? 'saved'
          : null;

  if (!state) return null;
  if (state === 'saving')
    return (
      <span className="savepill savepill--saving">
        <span className="savepill__dot" />
        Saving…
      </span>
    );
  if (state === 'dirty')
    return (
      <span className="savepill savepill--dirty">
        <span className="savepill__dot" />
        Unsaved
      </span>
    );
  return (
    <span className="savepill savepill--saved">
      <span className="savepill__dot" />
      <Icon name="check" size={12} />
      Saved
    </span>
  );
}
