/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

export function RawEditor({ value, onChange }) {
  return (
    <div className="doc">
      <textarea className="rawmd" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
    </div>
  );
}
