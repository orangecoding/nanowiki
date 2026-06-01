/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

const ICON_PATHS = {
  file: '<path d="M5 2.5h6l3 3v9.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z"/><path d="M11 2.5V6h3.5"/>',
  folder: '<path d="M2.5 5.5a1 1 0 0 1 1-1H7l1.5 1.5h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1Z"/>',
  folderOpen:
    '<path d="M2.5 6a1 1 0 0 1 1-1H7l1.5 1.5h5a1 1 0 0 1 1 1H4.2a1 1 0 0 0-.96.73L2.5 13Z"/><path d="m2.5 13 1.2-4.27a1 1 0 0 1 .96-.73h11.34a.5.5 0 0 1 .48.64l-1.1 3.85a1 1 0 0 1-.96.73H3a.5.5 0 0 1-.48-.64Z"/>',
  chevron: '<path d="m6 4 4 4-4 4"/>',
  search: '<circle cx="7.5" cy="7.5" r="4.5"/><path d="m11 11 3.5 3.5"/>',
  command: '<path d="M5.5 2.5A2.5 2.5 0 1 1 3 5h10a2.5 2.5 0 1 1-2.5 2.5v-5A2.5 2.5 0 1 1 13 5"/>',
  plus: '<path d="M8 3.5v9M3.5 8h9"/>',
  newFile:
    '<path d="M4 2.5h5l3 3v8a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-11A.5.5 0 0 1 4 2.5Z"/><path d="M9 2.5V6h3"/><path d="M7.5 9v3M6 10.5h3"/>',
  newFolder:
    '<path d="M2.5 5.5a1 1 0 0 1 1-1H7l1.5 1.5h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1Z"/><path d="M8 8.5v3M6.5 10h3"/>',
  settings:
    '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8 3.4 3.4"/>',
  history: '<path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.8M2.8 3v2.2H5"/><path d="M8 5.5V8l2 1.3"/>',
  check: '<path d="m3 8.5 3.2 3L13 4.5"/>',
  clock: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.3"/>',
  link: '<path d="M6.5 9.5a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5l-1 1"/><path d="M9.5 6.5a2.5 2.5 0 0 0-3.5 0l-2 2a2.5 2.5 0 0 0 3.5 3.5l1-1"/>',
  hash: '<path d="M6 2.5 4.5 13.5M11.5 2.5 10 13.5M3 6h11M2.5 10h11"/>',
  list: '<path d="M5.5 4.5h9M5.5 8h9M5.5 11.5h9"/><circle cx="2.6" cy="4.5" r=".9" fill="currentColor" stroke="none"/><circle cx="2.6" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="2.6" cy="11.5" r=".9" fill="currentColor" stroke="none"/>',
  listOrdered: '<path d="M6 4.5h8.5M6 8h8.5M6 11.5h8.5M2 3.5h1v3M2 6.5h2M2 13.5h2v-2H2v-.5h2"/>',
  code: '<path d="m5.5 5-3 3 3 3M10.5 5l3 3-3 3"/>',
  codeBlock:
    '<rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="m6.5 6.5-1.5 1.5 1.5 1.5M9.5 6.5 11 8l-1.5 1.5"/>',
  quote:
    '<path d="M6.5 4.5c-1.8.6-3 2.2-3 4.2 0 1.4.9 2.3 2 2.3s1.9-.8 1.9-1.9-.8-1.8-1.8-1.8c-.2 0-.4 0-.5.1M13 4.5c-1.8.6-3 2.2-3 4.2 0 1.4.9 2.3 2 2.3s1.9-.8 1.9-1.9-.8-1.8-1.8-1.8c-.2 0-.4 0-.5.1"/>',
  table: '<rect x="2.5" y="3" width="11" height="10" rx="1"/><path d="M2.5 6.5h11M2.5 10h11M6.5 3v10"/>',
  image:
    '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="m3 12 3-3 2.5 2L11 8l2.5 2.5"/>',
  x: '<path d="m4 4 8 8M12 4l-8 8"/>',
  menu: '<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>',
  arrowLeft: '<path d="M9.5 4 5.5 8l4 4"/>',
  book: '<path d="M2.5 3.5h4a2 2 0 0 1 2 2v8a1.5 1.5 0 0 0-1.5-1.5h-4.5Z"/><path d="M13.5 3.5h-4a2 2 0 0 0-2 2v8a1.5 1.5 0 0 1 1.5-1.5h4.5Z"/>',
  panelLeft: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M6.5 3v10"/>',
  panelRight: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M9.5 3v10"/>',
  bolt: '<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8Z"/>',
  trash: '<path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 9a.5.5 0 0 0 .5.5h4.8a.5.5 0 0 0 .5-.5l.6-9"/>',
  edit: '<path d="M10.5 2.8 13.2 5.5 5.5 13.2 2.5 13.5l.3-3Z"/><path d="M9.2 4.1 12 6.9"/>',
  dots: '<circle cx="3.5" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="12.5" cy="8" r="1.3" fill="currentColor" stroke="none"/>',
  outline: '<path d="M2.6 4.5h2M2.6 8h2M2.6 11.5h2M6.5 4.5h7M6.5 8h7M6.5 11.5h7"/>',
  info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.2v3.6M8 5.2v.2"/>',
  warn: '<path d="M8 2 14.5 13.5h-13Z"/><path d="M8 6.5v3.2M8 11.6v.2"/>',
  sparkles:
    '<path fill="currentColor" stroke="none" d="M11 2 11.8 4.2 14 5 11.8 5.8 11 8 10.2 5.8 8 5 10.2 4.2ZM4.5 9 5 10.5 6.5 11 5 11.5 4.5 13 4 11.5 2.5 11 4 10.5ZM13.5 9.5 13.9 10.6 15 11 13.9 11.4 13.5 12.5 13.1 11.4 12 11 13.1 10.6Z"/>',
};

export function Icon({ name, size = 16, stroke = 1.6, className = '', style }) {
  const p = ICON_PATHS[name];
  if (!p) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: p }}
    />
  );
}

export function BrandMark({ size = 26, radius = 7, className = '', style }) {
  const gradId = `bm${size}`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" style={style}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e04a38" />
          <stop offset="1" stopColor="#c13827" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx={radius * (64 / size)} fill={`url(#${gradId})`} />
      <g stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
        <line x1="20" y1="20" x2="40" y2="32" opacity="0.85" />
        <line x1="40" y1="32" x2="22" y2="46" opacity="0.85" />
        <line x1="40" y1="32" x2="46" y2="18" opacity="0.7" />
      </g>
      <g fill="#fff">
        <circle cx="20" cy="20" r="5" opacity="0.82" />
        <circle cx="40" cy="32" r="6.5" />
        <circle cx="22" cy="46" r="5" opacity="0.92" />
        <circle cx="46" cy="18" r="3.6" opacity="0.7" />
      </g>
    </svg>
  );
}
