/* Shared foundations for My stay: mode, storage, language, time, the guest and their stay stage. No DOM work happens here. */
import { BRAND, LODGE, LODGES, ROUTES } from './data.js';
import { UI, LANGS, pickLang } from './i18n.js';

export const params = new URLSearchParams(location.search);

/* ---------- Mode ---------- */
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const givenDates = isDate(params.get('in')) && isDate(params.get('out')) && params.get('out') > params.get('in');
/* demo: a sample stay with its own storage, so real guest data is never touched. embed: shown inside another page (owner studio, website). */
/* On apploading.co this app is a public demo of an invented lodge, so it is always a sample stay: nothing here can message or call anyone. */
export const MODE = { demo: true, embed: params.get('embed') === '1', given: givenDates };

/* ---------- Storage on this device ---------- */
export const KEY = MODE.demo ? 'lw-stay-demo-v1' : 'lw-stay-v1';
export const store = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } };
  return {
    get: (k, f) => (k in d ? d[k] : f),
    set(k, v) { d[k] = v; return save(); },
    del(...ks) { ks.forEach((k) => { delete d[k]; }); return save(); },
    keys: () => Object.keys(d),
    clear(keep = []) { const kept = {}; keep.forEach((k) => { if (k in d) kept[k] = d[k]; }); d = kept; return save(); },
  };
})();

/* Hooks that app.js fills in, so feature modules can ask for a redraw or a toast without importing the app. */
export const bus = { render: () => {}, toast: () => {}, sheet: () => {}, link: (url) => window.open(url, '_blank', 'noopener') };

/* ---------- Time in South Africa ---------- */
const saFmt = new Intl.DateTimeFormat('en-CA', { timeZone: LODGE.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' });
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export function saNow() {
  const p = Object.fromEntries(saFmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), dow: DOW[p.weekday] };
}
export const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export const diffDays = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
export { isDate };

/* ---------- Language ---------- */
export const enabledLangs = BRAND.langs.filter((c) => LANGS[c]);
export let lang = pickLang({ url: params.get('lang'), saved: store.get('lang'), device: navigator.languages || [navigator.language], enabled: enabledLangs, fallback: BRAND.defaultLang });
export function setLang(l) {
  if (!enabledLangs.includes(l)) return;
  lang = l;
  store.set('lang', l);
}
export const t = (k, v) => {
  let s = (UI[lang] && UI[lang][k]) ?? UI.en[k] ?? k;
  for (const [a, b] of Object.entries({ host: LODGE.host, brand: BRAND.short, brandFull: BRAND.name, ...(v || {}) })) s = s.replaceAll(`{${a}}`, b);
  return s;
};
export const tn = (k, n) => t(`${k}.${n === 1 ? 'one' : 'other'}`, { n });
/* Pick the guest's language from a { en, de } pair, falling back to English. {host} and {brand} are filled in. */
export const L = (o) => String((o && (o[lang] ?? o.en)) || '').replaceAll('{host}', LODGE.host).replaceAll('{brand}', BRAND.short);
export const locale = () => LANGS[lang].locale;
export const fmtDate = (d, opts) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...opts });
export const fmtDateEn = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-ZA', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtMin = (m) => {
  m = Math.round(m / 5) * 5;
  const h = Math.floor(m / 60), mm = m % 60;
  if (h === 0) return `${mm} ${t('u.min')}`;
  return mm ? `${h} ${t('u.h')} ${mm} ${t('u.min')}` : `${h} ${t('u.h')}`;
};

/* ---------- The guest, read from the personal link ---------- */
export function readGuest() {
  const q = params;
  const clean = (s, n = 60) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
  const today = saNow().date;
  let a = q.get('in'), b = q.get('out');
  if (!givenDates) { a = addDays(today, 9); b = addDays(a, 3); }
  const ids = Object.keys(LODGES).map(Number);
  const lodge = ids.includes(Number(q.get('l'))) ? Number(q.get('l')) : ids[0];
  const name = clean(q.get('n')) || (givenDates ? '' : lang === 'de' ? 'Anika und Jonas' : 'Anika and Jonas');
  const via = Object.keys(ROUTES).includes(q.get('via')) ? q.get('via') : 'hds';
  return {
    name, lodge, in: a, out: b, nights: diffDays(a, b), via,
    adults: Math.min(8, Math.max(1, parseInt(q.get('a'), 10) || 2)),
    kids: Math.min(8, Math.max(0, parseInt(q.get('k'), 10) || 0)),
    demo: MODE.demo,
  };
}

export const state = {
  tab: 'home', sub: { journey: 'getting', wild: null, lodge: 'lodge' }, cat: 'eat', guest: readGuest(),
  at: MODE.demo && isDate(params.get('at')) ? params.get('at') : null,
  wx: null, wxStatus: 'none', route: null, deferredInstall: null, online: navigator.onLine !== false, sim: false,
};
/* Demo links can open at a chosen moment: ?stage=pre|eve|arrival|staying|departure|after (the sample stay arrives 9 days from today). */
export const STAGES = ['pre', 'eve', 'arrival', 'staying', 'departure', 'after'];
export function stageDate(s, g = state.guest) {
  return { pre: saNow().date, eve: addDays(g.in, -1), arrival: g.in, staying: addDays(g.in, 1), departure: g.out, after: addDays(g.out, 2) }[s];
}
if (MODE.demo && STAGES.includes(params.get('stage')) && !state.at) state.at = stageDate(params.get('stage'));
state.route = store.get('route', state.guest.via);
if (!ROUTES[state.route]) state.route = 'hds';

export const today = () => state.at || saNow().date;
export function stage() {
  const g = state.guest, d = today();
  if (d > g.out) return 'after';
  if (d === g.out) return 'departure';
  if (d === g.in) return 'arrival';
  if (d > g.in) return 'staying';
  return diffDays(d, g.in) === 1 ? 'eve' : 'pre';
}
export const focusDate = () => {
  const g = state.guest, s = stage();
  if (s === 'pre' || s === 'eve') return g.in;
  if (s === 'after') return g.out;
  return today();
};
export const lodgeName = () => LODGES[state.guest.lodge].name;
export const range = () => `${fmtDate(state.guest.in, { weekday: 'short', day: 'numeric', month: 'short' })} ${t('to')} ${fmtDate(state.guest.out, { weekday: 'short', day: 'numeric', month: 'short' })}`;
export const greeting = () => state.guest.name || (lang === 'de' ? 'Gast' : 'guest');

/* ---------- Links and messages to the host ---------- */
export const wa = (text) => `https://wa.me/${LODGE.whatsapp}?text=${encodeURIComponent(text)}`;
export const dir = (lat, lon) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
export const waze = (lat, lon) => `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
export const mapSearch = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
/* Messages to the host are always in English, which the host reads. The guest sees them first and can edit them before sending. */
export function hostMessage(topic) {
  const g = state.guest;
  const lines = [`Hello ${LODGE.host}, this is ${g.name || 'a guest'}. I'm staying in ${LODGES[g.lodge].name} from ${fmtDateEn(g.in)} to ${fmtDateEn(g.out)}.`];
  lines.push('', topic);
  return lines.join('\n');
}
/* Open a link to the outside world. In demo mode this shows a safe preview instead of messaging a real person. */
export const openLink = (url) => bus.link(url);
