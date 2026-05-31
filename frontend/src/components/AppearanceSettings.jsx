/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

const ACCENT_COLORS = [
  { key: 'coral', color: '#e04a38' },
  { key: 'blue', color: '#3b82f6' },
  { key: 'green', color: '#10b981' },
  { key: 'amber', color: '#f59e0b' },
  { key: 'violet', color: '#8b5cf6' },
];

export function AppearanceSettings({ settings, setSettings }) {
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  return (
    <div className="settings">
      <div className="settings__title">Appearance</div>

      <div className="set-group">
        <span className="set-label">Accent color</span>
        <div className="swatches">
          {ACCENT_COLORS.map(({ key, color }) => (
            <button
              key={key}
              className={`swatch${settings.accent === key ? ' sel' : ''}`}
              style={{ background: color, color }}
              onClick={() => set('accent', key)}
              title={key}
            />
          ))}
        </div>
      </div>

      <div className="set-group">
        <span className="set-label">Reading width</span>
        <div className="segrow">
          {[
            ['focus', 'Focus'],
            ['wide', 'Wide'],
            ['full', 'Full'],
          ].map(([k, l]) => (
            <button key={k} className={settings.width === k ? 'active' : ''} onClick={() => set('width', k)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="set-group">
        <span className="set-label">Density</span>
        <div className="segrow">
          {[
            ['cozy', 'Cozy'],
            ['compact', 'Compact'],
          ].map(([k, l]) => (
            <button key={k} className={settings.density === k ? 'active' : ''} onClick={() => set('density', k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
