/* Owner studio: a guided demo, simple branding preview, guest-link creation, and an honest status list.
   The phone preview is the real guest app in demo mode, so nothing here is a mock-up. Demo data lives under its own storage keys. */
import { PROPERTY, ACCENTS } from '/stay/property/index.js';
import { LODGES, PLACES, SPECIES, EXTRAS, LODGE_INFO, BUSH_RULES, KNOW, ZONES, EMERGENCY, CHECKLIST } from '/stay/data.js';
import { UI, LANGS } from '/stay/i18n.js';
import { html, R, esc } from '/stay/ui.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/* ---------- The guided demo ---------- */
const STEPS = [
  { id: 'prep', title: 'A guest preparing to arrive', look: 'The countdown, a short checklist, the weather for their dates and one clear next step: plan the arrival.', q: { stage: 'pre' }, hash: 'home' },
  { id: 'arrive', title: 'Arrival day', look: 'Directions, estate gate and check-in questions that go to the host in one tap, and the time to arrive before sunset.', q: { stage: 'arrival' }, hash: 'home' },
  { id: 'stay', title: 'During the stay', look: "Today's weather and plan, the best hours to look for wildlife, lodge essentials and extras to ask for.", q: { stage: 'staying' }, hash: 'home' },
  { id: 'wild', title: 'A wildlife discovery with a photo', look: 'Tap Giraffe, choose "Use sample photo", then "Add to my passport". A real guest takes or picks their own photo. Its location data is removed and it stays on their phone.', q: { stage: 'staying', fresh: '1' }, hash: 'wild/passport' },
  { id: 'extra', title: 'Asking for an extra', look: 'Tap Braai pack, prepare the request and press Send on WhatsApp. The demo shows the message instead of sending it. In real use, the host confirms price and availability in WhatsApp.', q: { stage: 'staying' }, hash: 'lodge/extras' },
  { id: 'memories', title: 'Trip memories', look: "The trip card is made on the phone from the guest's sightings and photos. Download it as a real image. Nothing is uploaded.", q: { stage: 'after', seed: 'auto' }, hash: 'wild/memories' },
];
const view = { step: 0, lang: 'en', brand: '', host: '', accent: 'ember', guestUrl: null };
const frame = $('#frame');

function frameUrl() {
  if (view.guestUrl) return view.guestUrl;
  const s = STEPS[view.step];
  const q = new URLSearchParams({ demo: '1', embed: '1', lang: view.lang, ...s.q });
  if (view.brand) q.set('brand', view.brand);
  if (view.host) q.set('host', view.host);
  if (view.accent && view.accent !== 'ember') q.set('accent', view.accent);
  const th = document.documentElement.dataset.theme;
  if (th) q.set('theme', th);
  return `/stay/?${q.toString()}#/${s.hash}`;
}
function loadFrame() {
  const url = frameUrl();
  frame.src = url;
  $('#frame-open').href = url.replace('&embed=1', '');
}
function paintSteps() {
  $('#steps').innerHTML = STEPS.map((s, i) => html`<li${R(i === view.step ? ' class="on" aria-current="step"' : '')}>
    <button type="button" data-step="${i}"><span class="num">${i + 1}</span><span><b>${s.title}</b>${i === view.step ? html`<small>${s.look}</small>` : ''}</span></button></li>`).map((x) => x.r).join('');
  $('#prev').disabled = view.step === 0 && !view.guestUrl;
  $('#next').innerHTML = view.step === STEPS.length - 1 ? 'Start again <i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>' : 'Next moment <i class="ph ph-arrow-right" aria-hidden="true"></i>';
}
function setStep(i) {
  view.guestUrl = null;
  view.step = (i + STEPS.length) % STEPS.length;
  paintSteps(); loadFrame();
  if (matchMedia('(max-width: 899px)').matches) $('.phone-col').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('#steps').addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) setStep(Number(b.dataset.step)); });
$('#next').addEventListener('click', () => setStep(view.step + 1));
$('#prev').addEventListener('click', () => setStep(view.guestUrl ? view.step : view.step - 1));
$('#reset').addEventListener('click', async () => {
  frame.src = 'about:blank';
  await new Promise((r) => setTimeout(r, 200));
  try { localStorage.removeItem('lw-stay-demo-v1'); } catch (e) { /* none */ }
  await new Promise((res) => { try { const r = indexedDB.deleteDatabase('lw-stay-demo-photos'); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch (e) { res(); } });
  $('#reset-msg').textContent = "Demo data cleared. Real guests' data is stored separately and was not touched.";
  setStep(0);
});
$$('[data-lang]').forEach((b) => b.addEventListener('click', () => {
  view.lang = b.dataset.lang;
  $$('[data-lang]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  if (view.guestUrl) { const u = new URL(view.guestUrl, location.origin); u.searchParams.set('lang', view.lang); view.guestUrl = u.pathname + u.search + u.hash; }
  loadFrame();
}));

/* ---------- Branding preview ---------- */
$('#swatches').innerHTML = Object.entries(ACCENTS).map(([k, a]) => html`<label class="swatch"><input type="radio" name="accent" value="${k}"${R(k === 'ember' ? ' checked' : '')}><span style="--sw:${a.swatch}" title="${a.label}"></span><small>${a.label}</small></label>`).map((x) => x.r).join('');
let brandTimer;
$('#brandform').addEventListener('input', () => {
  const f = $('#brandform').elements;
  view.brand = f.brand.value.trim(); view.host = f.host.value.trim();
  view.accent = ($('#brandform input[name="accent"]:checked') || {}).value || 'ember';
  clearTimeout(brandTimer);
  brandTimer = setTimeout(() => { view.guestUrl = null; loadFrame(); }, 450);
});
$('#brandform').addEventListener('submit', (e) => e.preventDefault());

/* ---------- Property pack summary, read from the real pack ---------- */
const est = SPECIES.filter((s) => s.zone === 'estate').length, exc = SPECIES.length - est;
const filled = LODGE_INFO.filter((i) => i.value).length;
$('#pack').innerHTML = [
  ['ph-palette', 'Branding', `${PROPERTY.brand.name}: name, logo, accent colour, welcome photo and memory-card photo`],
  ['ph-bed', 'Accommodation', `${Object.keys(LODGES).length} lodges, each with a photo and description`],
  ['ph-address-book', 'Contacts and emergency numbers', `Host name, WhatsApp, phone, email and address, plus ${EMERGENCY.reduce((n, g) => n + g.items.length, 0)} emergency numbers`],
  ['ph-map-pin', 'Local places', `${PLACES.length} places with distances, drive times and opening hours`],
  ['ph-binoculars', 'Wildlife', `${est} animals and birds on the estate, ${exc} on day trips, ${SPECIES.filter((s) => s.sensitive).length} with locations kept private`],
  ['ph-paper-plane-tilt', 'Extras', `${EXTRAS.length} sample extras, every one a request the host confirms`],
  ['ph-key', 'Lodge information', `${filled} of ${LODGE_INFO.length} filled in (check-in, check-out, Wi-Fi, gate, braai, pool). The rest show a one-tap question for the host`],
  ['ph-translate', 'Languages', `${Object.values(LANGS).map((l) => l.label).join(' and ')}`],
].map(([i, t, d]) => html`<li><span class="work-ic"><i class="ph ${i}" aria-hidden="true"></i></span><div><b>${t}</b><p>${d}</p></div></li>`).map((x) => x.r).join('');

/* ---------- Guest links ---------- */
const f = $('#f');
$('select[name="l"]').innerHTML = Object.entries(LODGES).map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join('');
const start = addDays(iso(new Date()), 14);
f.elements.in.value = start;
f.elements.out.value = addDays(start, 3);
const nice = (d, lang) => new Date(`${d}T12:00:00Z`).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-ZA', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
let built = null;
function build() {
  const v = Object.fromEntries(new FormData(f).entries());
  const err = $('#err');
  if (!v.in || !v.out || v.out <= v.in) { err.textContent = 'Choose an arrival date and a later departure date.'; $('#result').hidden = true; return; }
  err.textContent = '';
  const q = new URLSearchParams({ l: v.l, in: v.in, out: v.out, a: v.a || '2', k: v.k || '0', lang: v.lang, via: v.via });
  const name = (v.n || '').trim();
  if (name) q.set('n', name);
  const link = `${location.origin}/stay/?${q.toString()}`;
  built = { q, lang: v.lang };
  const lodge = LODGES[v.l].name;
  const first = name || (v.lang === 'de' ? 'liebe Gäste' : 'there');
  const brand = PROPERTY.brand.name;
  const text = v.lang === 'de'
    ? `Hallo ${first}, vielen Dank für Ihre Buchung (${lodge}) im ${brand} vom ${nice(v.in, 'de')} bis ${nice(v.out, 'de')}. Hier ist Ihre persönliche Gäste-App mit Countdown, Wetter, Reiseplan und Tierführer. Sie funktioniert auch offline: ${link}`
    : `Hi ${first}, thank you for booking ${lodge} at ${brand} from ${nice(v.in, 'en')} to ${nice(v.out, 'en')}. Here is your personal guest app, with a countdown, weather, travel plan and wildlife guide. It works offline once opened: ${link}`;
  $('#result').hidden = false;
  $('#link').value = link;
  const m = $('#msg');
  if (m.dataset.auto !== 'off') m.value = text;
  $('#wa').href = `https://wa.me/?text=${encodeURIComponent(m.value)}`;
  $('#mail').href = `mailto:?subject=${encodeURIComponent(v.lang === 'de' ? 'Ihr Aufenthalt' : 'Your stay')}&body=${encodeURIComponent(m.value)}`;
  const box = $('#qr');
  box.innerHTML = '';
  if (window.QRCode) { try { new window.QRCode(box, { text: link, width: 132, height: 132, correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) { /* optional */ } }
}
f.addEventListener('input', () => { $('#msg').dataset.auto = 'on'; build(); });
$('#msg').addEventListener('input', (e) => {
  e.target.dataset.auto = 'off';
  $('#wa').href = `https://wa.me/?text=${encodeURIComponent(e.target.value)}`;
  $('#mail').href = `mailto:?body=${encodeURIComponent(e.target.value)}`;
});
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#link').value); $('#copy').innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Copied'; } catch (e) { $('#link').select(); }
  setTimeout(() => { $('#copy').innerHTML = '<i class="ph ph-copy" aria-hidden="true"></i> Copy link'; }, 1800);
});
/* Preview runs the guest's link in demo mode, so it keeps its own storage and never messages anyone. */
$('#preview').addEventListener('click', () => {
  if (!built) return;
  const q = new URLSearchParams(built.q);
  q.set('demo', '1'); q.set('embed', '1'); q.set('stage', 'pre');
  view.guestUrl = `/stay/?${q.toString()}#/home`;
  view.lang = built.lang;
  $$('[data-lang]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.lang === view.lang)));
  paintSteps(); loadFrame();
  $('.phone-col').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
const qr = document.createElement('script');
qr.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
qr.onload = build;
document.head.append(qr);
build();

/* ---------- Status ---------- */
const li = (a) => a.map((t) => `<li>${esc(t)}</li>`).join('');
$('#s-ok').innerHTML = li([
  'A personal link and QR code for each guest, created here',
  'A home screen that changes as the stay moves: preparing, arriving, staying, leaving, remembering',
  'Countdown, checklists, a packing list for the month and flight details turned into calendar reminders',
  'Live weather forecast for the lodge, sunrise, sunset and moon. Offline it shows the last saved forecast and says so',
  'Arrival planning: routes, drive times, whether the guest arrives before sunset, and directions',
  'A plan for each day from the weather and the light',
  'A map of places to eat, shops, fuel, pharmacies, hospitals and sights, with opening hours',
  'A wildlife guide with photos and an animal identifier',
  "Wildlife passport: sightings, photos kept on the guest's phone with location data removed, badges and a family explorer mode",
  'Requests for extras by WhatsApp or email. You confirm price and availability',
  'An SOS screen: emergency numbers, the nearest medical help and "send my location to my host"',
  'A trip memories card, made on the phone as a real image to download or share',
  'English and German. Works without signal once opened',
]);
$('#s-demo').innerHTML = li([
  'The sample lodge, guest, sightings and photos',
  'The extras menu: items are a sample, with no prices until you set yours',
  'Check-in, Wi-Fi, gate and house rules show "your host adds this" until you send yours',
  'The branding preview changes name, colour and host name. Your logo, photos and contact details go in when your lodge is set up',
]);
$('#s-need').innerHTML = li([
  "An AI guest assistant that answers guests' questions from your own guide. Built, and switched on per lodge",
  'More languages',
  'Bookings imported automatically from your booking system',
  'Links and reminders sent automatically by WhatsApp Business or email',
  'Signed guest links, so booking details are not in the web address',
  'Payment for extras',
  'Guests sending photos straight to the lodge, with recorded consent for marketing use. Today a guest shares from their own phone, only if they choose to',
  "Guest data kept in sync across devices. Today it stays on the guest's own phone",
]);

/* ---------- Languages and the wording to review ---------- */
$('#langs').innerHTML = `<thead><tr><th>Language</th><th>Screens translated</th><th>Native-speaker review</th></tr></thead><tbody>${Object.entries(LANGS).map(([c, l]) => `<tr><td>${esc(l.label)}</td><td>Complete, ${Object.keys(UI[c]).length} strings</td><td>${c === 'en' ? 'Source text' : 'Needed before launch'}</td></tr>`).join('')}</tbody>`;
const L2 = (o) => (o && typeof o === 'object' ? [o.en, o.de] : [o, o]);
const fill = (x) => String(x ?? '').replaceAll('{host}', PROPERTY.lodge.host);
const group = (title, rows) => html`<details class="review"><summary>${title} <small>${rows.length} items</small></summary><table class="lang-table"><thead><tr><th>Item</th><th>English</th><th>Deutsch</th></tr></thead><tbody>${rows.map(([k, en, de]) => html`<tr><td>${k}</td><td>${fill(en)}</td><td>${fill(de)}</td></tr>`)}</tbody></table></details>`;
const uiRows = (keys) => keys.filter((k) => UI.en[k]).map((k) => [k, UI.en[k], UI.de[k]]);
const sp = (id) => SPECIES.find((s) => s.id === id);
$('#review').innerHTML = [
  group('Emergency and safety', [
    ...uiRows(['sos.title', 'sos.text', 'sos.bill', 'wild.snake', 'wild.tick', 'eta.late', 'h.arrive.sunset.t', 'wx.storm', 'wx.uv', 'w.sensitive', 'x.nopay', 'd.warn']),
    ...BUSH_RULES.map((r, i) => [`Rule of the bush ${i + 1}`, r.en, r.de]),
    ...['leopard', 'wilddog', 'hyena', 'honeybadger', 'elephant', 'lion', 'buffalo', 'rhino', 'hippo', 'croc'].map((id) => [`${sp(id).name.en}: how to behave`, sp(id).care.en, sp(id).care.de]),
  ]),
  group('Arrival, entry and health', [
    ...KNOW.map((k) => [k.title.en, L2(k.body)[0], L2(k.body)[1] || L2(k.body)[0]]),
    ...uiRows(['hero.arrival.sub', 'eta.ok', 'gates.text', 'gates.note', 'x.ready.note']),
    ...CHECKLIST.filter((c) => c.when === 'pre').map((c) => [`Checklist: ${c.id}`, c.text.en, c.text.de]),
  ]),
].map((x) => x.r).join('');
void ZONES;

/* ---------- Start ---------- */
paintSteps();
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { if (!frame.src || frame.src === 'about:blank') loadFrame(); io.disconnect(); } }, { rootMargin: '300px' });
  io.observe($('.phone-col'));
} else loadFrame();
