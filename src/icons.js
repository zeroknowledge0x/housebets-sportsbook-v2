// Authored SVG icon set: 24px grid, 1.75 stroke, round caps. No third-party icon assets.
const P = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  live: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="m10 10 4.5 2.5L10 15z" fill="currentColor"/><path d="M8 3l4 3 4-3"/>',
  football: '<circle cx="12" cy="12" r="9"/><path d="m12 7.2 3.6 2.6-1.4 4.2H9.8L8.4 9.8z"/><path d="M12 7.2V3.3M15.6 9.8l3.8-1.3M14.2 14l2.4 3.4M9.8 14l-2.4 3.4M8.4 9.8 4.6 8.5"/>',
  tennis: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6c3.4 3.4 3.4 9.4 0 12.8M18.4 5.6c-3.4 3.4-3.4 9.4 0 12.8"/>',
  basketball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6C8 8 8.8 10 9 12s-1 4-3.4 6.4M18.4 5.6C16 8 15.2 10 15 12s1 4 3.4 6.4"/>',
  hockey: '<path d="M5 3l5.5 12.5c.4.9 1.2 1.5 2.2 1.5H20"/><path d="M19 3l-4 9"/><ellipse cx="9" cy="19" rx="4" ry="1.8"/>',
  esports: '<path d="M7 8h10a4 4 0 0 1 4 4v1.5a3.5 3.5 0 0 1-6.3 2.1L14 14.7h-4l-.7.9A3.5 3.5 0 0 1 3 13.5V12a4 4 0 0 1 4-4z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="16" cy="11" r=".6" fill="currentColor"/><circle cx="17.5" cy="13" r=".6" fill="currentColor"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  up: '<path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/>',
  down: '<path d="M12 5v13M6.5 12.5 12 18l5.5-5.5"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  chevUp: '<path d="m6 15 6-6 6 6"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11" rx="2.5"/><path d="M16 13.5h1.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  casino: '<rect x="6" y="3.5" width="12" height="17" rx="2.5"/><path d="M12 9.2c1.6 1.5 3 2.6 3 4a1.6 1.6 0 0 1-3 .8 1.6 1.6 0 0 1-3-.8c0-1.4 1.4-2.5 3-4z" fill="currentColor"/>',
  chat: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/><path d="M8 10h8M8 13h5"/>',
  ticket: '<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5V15a3 3 0 0 0 0-6z"/><path d="M9.5 9h5M9.5 12h5M9.5 15h3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4"/>',
  crown: '<path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13z"/>',
  panel: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M14.5 4.5v15"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  sliders: '<path d="M5 6h9M18 6h1M5 12h3M12 12h7M5 18h11M20 18h-1"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
};
export const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
export const starFilled = (cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true" focusable="false">${P.star}</svg>`;

// Original crest generator: a shield with the team's two colours and a pattern. Not a club logo.
export function crest(t, size = 20) {
  const id = 'c' + t.id;
  const shield = 'M12 2.2 20 5v6.4c0 5-3.4 8.7-8 10.4C7.4 20.1 4 16.4 4 11.4V5z';
  let inner = '';
  switch (t.pattern) {
    case 'stripes': inner = `<path d="M8 0v24M12 0v24M16 0v24" stroke="${t.b}" stroke-width="2"/>`; break;
    case 'band': inner = `<path d="M0 10.5h24v4H0z" fill="${t.b}"/>`; break;
    case 'split': inner = `<path d="M12 0h12v24H12z" fill="${t.b}"/>`; break;
    case 'chevron': inner = `<path d="M3 7l9 6 9-6v4l-9 6-9-6z" fill="${t.b}"/>`; break;
    case 'ring': inner = `<circle cx="12" cy="11.5" r="4" fill="none" stroke="${t.b}" stroke-width="2"/>`; break;
    case 'player': return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="${t.a}"/><circle cx="12" cy="9.6" r="3.4" fill="${t.b}" opacity=".9"/><path d="M5.8 18.6a6.6 6.6 0 0 1 12.4 0" fill="${t.b}" opacity=".9"/></svg>`;
  }
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="${id}"><path d="${shield}"/></clipPath></defs><path d="${shield}" fill="${t.a}"/><g clip-path="url(#${id})">${inner}</g><path d="${shield}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1"/></svg>`;
}

// Housebets-style wordmark: original wave mark + wordmark set in Outfit.
export const logo = (small = false) => `
<span class="logo${small ? ' logo--sm' : ''}" translate="no">
  <svg class="logo__wave" viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
    <path d="M2 27c6 0 9-3 12-8 4-7 9-14 19-14 7 0 12 4 13 9-3-3-7-4-10-3 4 1 6 4 6 7-3-3-8-3-11-1 3 1 4 3 4 5-6-3-12-1-16 5z" fill="#19e3f0"/>
    <path d="M2 30c10 0 15-2 20-6 5 3 12 4 24 6z" fill="#0e7f8c"/>
    <path d="M20 22c2-6 7-11 13-12" stroke="#c8f6fa" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>
  <span class="logo__word"><b>H</b>ousebets</span>
</span>`;
