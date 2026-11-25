/* Chooses the property pack the app runs on, and applies simple branding.
   Add a lodge by creating property/<id>.js (copy sample.js) and registering it in PACKS. Guests never choose: the link carries the property. */
import { PACK as sample } from './sample.js';

export const PACKS = { sample };

/* Accent colours that keep readable contrast on both the day and dusk themes. ember is the default and needs no overrides. */
export const ACCENTS = {
  ember: { label: 'Ember', swatch: '#ee7a30' },
  sage: { label: 'Sage', swatch: '#8aae72', accent: '#8aae72', hover: '#9bbd84', ink: '#0f1a0b', textLight: '#3d6129', textDark: '#a9cf93', photo: '#c8e2b6' },
  ochre: { label: 'Ochre', swatch: '#d9a02e', accent: '#d9a02e', hover: '#e3b04a', ink: '#1c1406', textLight: '#7a5400', textDark: '#e8bf5f', photo: '#f1d089' },
  clay: { label: 'Clay', swatch: '#c8644c', accent: '#c8644c', hover: '#d2765f', ink: '#1c0a06', textLight: '#8f3322', textDark: '#ee9a86', photo: '#f3b3a3' },
  dusk: { label: 'Dusk blue', swatch: '#6f95bd', accent: '#6f95bd', hover: '#84a6c9', ink: '#08121c', textLight: '#2c5278', textDark: '#a3c3e3', photo: '#bfd6ee' },
};

export function accentCss(key) {
  const a = ACCENTS[key];
  if (!a || !a.accent) return '';
  const soft = `color-mix(in srgb, ${a.accent} 16%, transparent)`;
  return `:root{--accent:${a.accent};--accent-hover:${a.hover};--accent-ink:${a.ink};--accent-text:${a.textLight};--accent-soft:${soft};--photo-accent:${a.photo}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--accent:${a.accent};--accent-hover:${a.hover};--accent-text:${a.textDark};--accent-soft:${soft}}}
:root[data-theme="dark"]{--accent:${a.accent};--accent-hover:${a.hover};--accent-text:${a.textDark};--accent-soft:${soft}}`;
}

const q = new URLSearchParams(location.search);
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const base = PACKS[q.get('p')] || sample;
/* Branding preview: only in demo mode, and only name, host first name and accent. Contact details always stay the property's own. */
const preview = true; /* public demo: the name, host and colour preview is always on */
const name = preview ? clean(q.get('brand'), 40) : '';
const host = preview ? clean(q.get('host'), 20) : '';
const accent = preview && ACCENTS[q.get('accent')] ? q.get('accent') : base.brand.accent;

export const PROPERTY = {
  ...base,
  brand: { ...base.brand, accent, ...(name ? { name, short: name.length <= 12 ? name : name.split(/\s+/)[0], logo: null, custom: true } : {}) },
  lodge: { ...base.lodge, ...(host ? { host } : {}) },
};
export const PREVIEW = { name, host, accent: preview ? accent : null };
