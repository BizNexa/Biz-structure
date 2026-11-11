/** Small stroke icon set (24x24), drawn inline so the page needs no icon font. */
const P: Record<string, string> = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  building: 'M4 21V5l8-2v18M12 7h8v14M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2M2 21h20',
  badge: 'M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.6 7.1 17.2l.9-5.5-4-3.9L9.5 7z',
  landmark: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7z',
  home: 'M3 11l9-8 9 8M5 9v12h14V9M10 21v-6h4v6',
  heart: 'M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  gov: 'M12 3l9 5H3zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  box: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
  briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  leaf: 'M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8',
  cart: 'M3 4h2l2.5 11h11L21 7H6.5M9 20h.01M18 20h.01',
  bar1: 'M4 20V16M10 20V12M16 20V8M22 20V4',
  bar2: 'M4 20V16M10 20V12M16 20V8M22 20V4',
  bar3: 'M4 20V16M10 20V12M16 20V8M22 20V4',
  bar4: 'M4 20V16M10 20V12M16 20V8M22 20V4',
  truck: 'M2 6h12v10H2zM14 10h4l3 3v3h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  plane: 'M2 16l20-8-6 12-3-5-5 3 1-4z',
  store: 'M4 10v10h16V10M3 4h18l-1.5 6h-15zM9 20v-5h6v5',
  map: 'M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  wallet: 'M3 7h16v12H3zM3 7l12-4v4M16 13h.01',
  car: 'M5 16l1.5-5h11l1.5 5M4 16h16v3H4zM7 19v1M17 19v1',
  refresh: 'M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4',
  handshake: 'M2 12l4-4 4 2 4-3 4 3 4 2M6 8l6 6 3-2M9 15l2 2M12 13l3 3',
  tent: 'M3 20L12 4l9 16zM12 4v16M9 20l3-6 3 6',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  factory: 'M3 21V10l6 4V10l6 4V6l6 3v12zM7 18h2M12 18h2M17 18h2',
  scale: 'M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0zM8 21h8',
  recycle: 'M7 19H4l3-5M17 19h3l-3-5M12 4l-2 3h4zM9 7l-3 5M15 7l3 5M8 19h8',
  key: 'M8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 11h10M18 11v3M21 11v2',
  merge: 'M6 3v6a6 6 0 0 0 6 6h6M18 15l-3-3M18 15l-3 3M6 21v-6',
  passport: 'M6 3h12v18H6zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 17h6',
  cloud: 'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z',
  dice: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  brush: 'M14 4l6 6-8 8-6-6zM6 12l-3 7 7-3',
  tool: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2z',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  whatsapp: 'M4 20l1.5-4.5A8 8 0 1 1 9 19z M9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 1c-1 0-3-2-3-3l1-1-1-2z',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  restart: 'M4 4v6h6M20 12a8 8 0 1 1-2.3-5.7L20 9',
  check: 'M5 12l5 5 9-10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const d = P[name] ?? P.dots;
  const level = { bar1: 1, bar2: 2, bar3: 3, bar4: 4 }[name];
  if (level) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {[4, 10, 16, 22].map((x, i) => (
          <path key={x} d={`M${x} 20V${16 - i * 4}`} stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" opacity={i < level ? 1 : 0.25} />
        ))}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
