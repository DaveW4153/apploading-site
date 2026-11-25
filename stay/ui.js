/* Small shared helpers: safe HTML templating (values are escaped unless they came from html``) and DOM shortcuts. */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const R = (s) => ({ r: s });
export const out = (v) => (v === false || v == null ? '' : Array.isArray(v) ? v.map(out).join('') : typeof v === 'object' && 'r' in v ? v.r : esc(v));
export const html = (s, ...v) => R(s.reduce((a, str, i) => a + str + (i < v.length ? out(v[i]) : ''), ''));
export const ic = (name, cls = '') => R(`<i class="ph ${esc(name)} ${esc(cls)}" aria-hidden="true"></i>`);
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const btn = (cls, attrs, label, icon) => html`<button type="button" class="btn ${cls}" ${R(attrs)}>${label}${icon ? ic(icon) : ''}</button>`;
