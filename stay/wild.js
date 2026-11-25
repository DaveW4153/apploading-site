/* Wildlife: the species guide, the Passport (sightings, photos, badges, scorecard) and Memories (a downloadable trip card).
   Everything here is stored on this device only. Nothing is uploaded; sharing happens only through the phone's own share menu when the guest chooses it. */
import { SPECIES, ZONES, BUSH_RULES, BRAND, LODGE, LODGES, DEMO } from './data.js';
import { sunTimes, twilight, hhmm, moon } from './sun.js';
import { html, R, ic, $, esc } from './ui.js';
import { MODE, store, bus, state, t, tn, L, lang, fmtDate, today, stage, focusDate, hostMessage, addDays, diffDays } from './core.js';
import { cleanPhoto, savePhoto, deletePhoto, allPhotos, clearPhotos, hydratePhotos, requestPersistence, getPhoto } from './photos.js';
import { openSheet, closeSheet, sheetOpen } from './sheet.js';

const SP = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
const ESTATE = SPECIES.filter((s) => s.zone === 'estate');
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clean = (s, n = 120) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

/* ---------- Data on this device ---------- */
const sightings = () => store.get('sightings', []);
const seenSet = () => new Set(sightings().map((x) => x.sp));
const learned = () => store.get('learned', {});
const photoCount = () => sightings().filter((x) => x.photo).length;

/* ---------- Badges: small, tasteful, and all about learning and noticing. Nothing rewards getting closer to an animal. ---------- */
const HOOF = ['impala', 'kudu', 'nyala', 'waterbuck', 'bushbuck', 'duiker', 'wildebeest'];
export const BADGES = [
  { id: 'first', icon: 'ph-footprints', goal: 1, val: (c) => c.sightings.length },
  { id: 'curious', icon: 'ph-lightbulb', goal: 8, val: (c) => Object.keys(c.learned).length },
  { id: 'bushwise', icon: 'ph-shield-check', goal: 1, val: (c) => (c.rules ? 1 : 0) },
  { id: 'antelope', icon: 'ph-eye', goal: 4, val: (c) => HOOF.filter((i) => c.seen.has(i)).length },
  { id: 'birds', icon: 'ph-bird', goal: 3, val: (c) => SPECIES.filter((s) => s.grp === 'bird' && c.seen.has(s.id)).length },
  { id: 'patterns', icon: 'ph-star-four', goal: 2, val: (c) => ['zebra', 'giraffe'].filter((i) => c.seen.has(i)).length },
  { id: 'album', icon: 'ph-camera', goal: 3, val: (c) => c.photos },
  { id: 'further', icon: 'ph-mountains', goal: 1, val: (c) => SPECIES.filter((s) => s.zone === 'excursion' && c.seen.has(s.id)).length },
  { id: 'naturalist', icon: 'ph-medal', goal: 10, val: (c) => c.seen.size },
];
const badgeCtx = () => ({ sightings: sightings(), seen: seenSet(), learned: learned(), rules: store.get('rules', false), photos: photoCount() });
export const badgeStates = () => { const c = badgeCtx(); return BADGES.map((b) => { const v = b.val(c); return { ...b, v: Math.min(v, b.goal), done: v >= b.goal }; }); };

export function passportStats() {
  const seen = seenSet();
  const bs = badgeStates();
  return {
    seen: ESTATE.filter((s) => seen.has(s.id)).length, total: ESTATE.length, sightings: sightings().length, photos: photoCount(),
    badges: bs.filter((b) => b.done).length, badgeTotal: bs.length, days: new Set(sightings().map((x) => x.day)).size,
  };
}

/* ---------- Explorer challenge for families: one gentle idea a day ---------- */
const STRIPY = ['zebra', 'giraffe', 'bushbuck', 'nyala', 'kudu', 'leopard', 'hyena', 'civet'];
const CHALLENGES = [
  { id: 'stripes', icon: 'ph-star-four', test: (s) => STRIPY.includes(s.id) },
  { id: 'wings', icon: 'ph-bird', test: (s) => s.grp === 'bird' },
  { id: 'horns', icon: 'ph-eye', test: (s) => s.grp === 'hoofed' && !['warthog', 'zebra', 'giraffe'].includes(s.id) },
  { id: 'herd', icon: 'ph-users-three', test: (s) => ['zebra', 'wildebeest', 'impala', 'giraffe', 'buffalo'].includes(s.id) },
  { id: 'big', icon: 'ph-arrows-out', test: (s) => s.size === 'l' },
  { id: 'listen', icon: 'ph-ear', test: (s) => ['barbet', 'goaway', 'hornbill', 'bushbaby', 'hyena'].includes(s.id) },
];
export function todaysChallenge() {
  const d = today();
  const c = CHALLENGES[((diffDays(state.guest.in, d) % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length];
  const done = sightings().some((x) => x.day === d && SP[x.sp] && c.test(SP[x.sp]));
  return { ...c, done };
}
const explorer = () => store.get('explorer', state.guest.kids > 0);

/* ---------- Adding, removing and seeding sightings ---------- */
export async function addSighting({ sp, file, sample, note }) {
  let photo = null;
  if (file || sample) {
    try {
      const blob = file || await fetch(sample).then((r) => r.blob());
      const c = await cleanPhoto(blob);
      photo = uid();
      await savePhoto({ id: photo, full: c.full, thumb: c.thumb, w: c.w, h: c.h, ts: Date.now(), sample: !!sample });
      requestPersistence();
    } catch (e) {
      return { ok: false, err: e && e.name === 'QuotaExceededError' ? 'space' : e && e.message === 'toobig' ? 'toobig' : e && e.message === 'unreadable' ? 'unreadable' : 'save' };
    }
  }
  const rec = { id: uid(), sp, ts: Date.now(), day: today(), photo, note: SP[sp] && SP[sp].sensitive ? '' : clean(note), share: 'private', sample: !!sample };
  const list = sightings();
  list.push(rec);
  if (!store.set('sightings', list)) return { ok: false, err: 'save' };
  return { ok: true, rec };
}
async function removeSighting(id) {
  const list = sightings();
  const rec = list.find((x) => x.id === id);
  if (!rec) return;
  if (rec.photo) { try { await deletePhoto(rec.photo); } catch (e) { /* already gone */ } }
  store.set('sightings', list.filter((x) => x.id !== id));
}

/* Sample sightings for the owner demo and website previews. Uses the lodge's own photos and is clearly marked as a sample. */
export async function seedDemo(force = false) {
  if (!MODE.demo || (!force && store.get('seeded', false))) return;
  store.set('sightings', []);
  try { await clearPhotos(); } catch (e) { /* no storage: sightings still work without photos */ }
  store.set('learned', { giraffe: 1, zebra: 1, impala: 1, kudu: 1, roller: 1, hornbill: 1, leopard: 1, hyena: 1 });
  const g = state.guest;
  const plan = [
    ['impala', 0, null], ['kudu', 0, null], ['roller', 1, null], ['zebra', 1, DEMO.samplePhotos.zebra], ['giraffe', 2, DEMO.samplePhotos.giraffe], ['hornbill', 2, null], ['nyala', 2, null],
  ];
  for (const [sp, off, photo] of plan) {
    const r = await addSighting({ sp, sample: photo });
    if (r.ok) { r.rec.day = addDays(g.in, off); r.rec.share = 'private'; const l = sightings(); l[l.length - 1] = r.rec; store.set('sightings', l); }
  }
  store.set('rules', true);
  store.set('seeded', true);
}

/* ---------- Small view pieces ---------- */
const thumb = (s, size = 56) => (s.photo
  ? html`<img src="${LODGE.cdn}${s.photo}?width=${size * 3}&quality=70" alt="" loading="lazy" width="${size}" height="${size}">`
  : html`<span class="ph-wrap" style="width:${size}px;height:${size}px">${ic(s.icon)}</span>`);
const when = (day) => fmtDate(day, { weekday: 'short', day: 'numeric', month: 'short' });
function defaultSub() {
  const s = stage();
  return s === 'after' ? 'memories' : s === 'arrival' || s === 'staying' || s === 'departure' ? 'passport' : 'explore';
}
const subOf = () => state.sub.wild || defaultSub();
const w = { zone: 'estate', id: { grp: null, size: null, act: null }, sel: null, name: true, animals: true, badges: true, armed: null, pending: null };

/* ================= The tab ================= */
export function viewWild() {
  const sub = subOf();
  const tabs = [['explore', t('w.explore')], ['passport', t('w.passport')], ['memories', t('w.memories')]];
  return html`
    <div class="seg" role="group" aria-label="${t('nav.wild')}">${tabs.map(([k, label]) => html`<button type="button" aria-pressed="${String(sub === k)}" data-act="wsub" data-arg="${k}">${label}</button>`)}</div>
    ${sub === 'explore' ? explore() : sub === 'passport' ? passport() : memories()}`;
}

function sunBits() {
  const d = focusDate();
  const s = sunTimes(d, LODGE.lat, LODGE.lon, LODGE.tzOffset), tw = twilight(d, LODGE.lat, LODGE.lon, LODGE.tzOffset), m = moon(d);
  return { rise: s.rise, set: s.set, dawn: tw.rise, dusk: tw.set, moonName: t(`moon.${m.phase}`), dark: m.lit < 0.15 };
}

function speciesRow(s) {
  const seen = seenSet().has(s.id);
  return html`<li><button type="button" class="sp-row${seen ? ' seen' : ''}" data-act="sp" data-id="${s.id}">
    ${thumb(s)}
    <span class="sp-main"><b>${L(s.name)}</b><small>${t(`likely.${s.likely}`)}${s.sensitive ? ` , ${t('w.sensitive.tag')}` : ''}</small></span>
    ${seen ? html`<span class="seen-tick" title="${t('wild.seen')}">${ic('ph-check-circle')}</span>` : ic('ph-caret-right', 'dim')}
  </button></li>`;
}

function explore() {
  const sb = sunBits();
  const list = SPECIES.filter((s) => s.zone === w.zone);
  const order = { daily: 0, often: 1, sometimes: 2, rare: 3 };
  list.sort((a, b) => order[a.likely] - order[b.likely] || L(a.name).localeCompare(L(b.name), lang));
  return html`
    <section class="sec intro">
      <h1 class="h1">${t('wild.title')}</h1>
      <p>${t('wild.intro')}</p>
      <label class="switch"><input type="checkbox" data-act="explorer" ${R(explorer() ? 'checked' : '')}><span>${ic('ph-smiley')} ${t('w.explorer')}</span></label>
      <p class="note">${t('w.explorer.note')}</p>
    </section>
    <section class="sec">
      <div class="chips" role="group" aria-label="${t('w.zone')}">${Object.entries(ZONES).map(([k, z]) => html`<button type="button" class="chip${w.zone === k ? ' on' : ''}" data-act="wzone" data-arg="${k}" aria-pressed="${String(w.zone === k)}">${L(z.label)}</button>`)}</div>
      <p class="note">${w.zone === 'estate' ? t('w.zone.estate') : t('w.zone.excursion')}</p>
      <button type="button" class="btn btn-ghost btn-sm" data-act="identify">${ic('ph-magnifying-glass')} ${t('w.id.open')}</button>
      <ul class="sp-list sp-cards">${list.map(speciesRow)}</ul>
    </section>
    <section class="sec">
      <h2>${t('wild.when')}</h2>
      <ul class="rows tight">
        <li>${ic('ph-sun-horizon', 'lead')}<div><b>${t('wild.dawn')}</b><small>${hhmm(sb.dawn)} ${t('to')} ${hhmm(sb.rise + 120)}</small></div></li>
        <li>${ic('ph-sun-horizon', 'lead')}<div><b>${t('wild.dusk')}</b><small>${hhmm(sb.set - 90)} ${t('to')} ${hhmm(sb.dusk)}</small></div></li>
        <li>${ic(sb.dark ? 'ph-moon-stars' : 'ph-moon', 'lead')}<div><b>${sb.moonName}</b><small>${sb.dark ? t('wild.moon.dark') : t('wild.moon.bright')}</small></div></li>
      </ul>
      <p class="note">${t('wild.baby')}</p>
    </section>
    <section class="card rules">
      <header class="card-head"><h2>${t('wild.rules')}</h2></header>
      <ol class="rule-list">${BUSH_RULES.map((r) => html`<li>${L(r)}</li>`)}</ol>
      ${store.get('rules', false) ? html`<p class="note ok">${ic('ph-check-circle')} ${t('w.rules.done')}</p>` : html`<button type="button" class="btn btn-ghost btn-sm" data-act="rules-read">${ic('ph-check')} ${t('w.rules.read')}</button>`}
    </section>
    <section class="sec">
      <h2>${t('wild.small')}</h2>
      <div class="acc">
        <details><summary>${ic('ph-warning')}<span>${t('wild.snake.t')}</span>${ic('ph-caret-down', 'caret')}</summary><div class="acc-body"><p>${t('wild.snake')}</p><a class="btn btn-ghost btn-sm" href="tel:084124">${t('wild.er24')} ${ic('ph-phone')}</a></div></details>
        <details><summary>${ic('ph-bug')}<span>${t('wild.tick.t')}</span>${ic('ph-caret-down', 'caret')}</summary><div class="acc-body"><p>${t('wild.tick')}</p></div></details>
        <details><summary>${ic('ph-moon-stars')}<span>${t('wild.sky.t')}</span>${ic('ph-caret-down', 'caret')}</summary><div class="acc-body"><p>${t('wild.sky')}</p></div></details>
      </div>
    </section>`;
}

/* ================= Passport ================= */
function stamp(s) {
  const mine = sightings().filter((x) => x.sp === s.id);
  const seen = mine.length > 0;
  const withPhoto = mine.find((x) => x.photo);
  return html`<li><button type="button" class="stamp${seen ? ' on' : ''}" data-act="sp" data-id="${s.id}" aria-label="${L(s.name)}, ${seen ? t('wild.seen') : t('w.notyet')}">
    <span class="stamp-art" data-photo-wrap>${withPhoto ? html`<img data-photo="${withPhoto.photo}" alt="" width="96" height="96">` : thumb(s, 64)}${seen ? html`<i class="ph ph-check-circle stamp-tick" aria-hidden="true"></i>` : ''}</span>
    <span class="stamp-name">${L(s.name).replace(/ \(.*\)$/, '')}</span>
  </button></li>`;
}

function badgeTile(b) {
  return html`<li class="badge-tile${b.done ? ' on' : ''}" ${R(`title="${esc(t(`b.${b.id}.d`))}"`)}>
    <span class="badge-ic">${ic(b.icon)}</span>
    <b>${t(`b.${b.id}`)}</b>
    <small>${b.done ? t('b.earned') : `${b.v} ${t('of')} ${b.goal}`}</small>
    <span class="sr-only">${t(`b.${b.id}.d`)}</span>
  </li>`;
}

function passport() {
  const st = passportStats(), g = state.guest;
  const bs = badgeStates();
  const ch = todaysChallenge();
  const recent = [...sightings()].sort((a, b) => b.ts - a.ts).slice(0, 5);
  const pct = Math.round((st.seen / st.total) * 100);
  return html`
    <section class="sec intro">
      <h1 class="h1">${t('w.passport.title')}</h1>
      <p>${g.name ? t('w.passport.for', { name: g.name }) : t('w.passport.sub')}</p>
    </section>
    <section class="score" aria-label="${t('w.score')}">
      <div class="ring" style="--p:${pct}"><b>${st.seen}</b><small>${t('of')} ${st.total}</small></div>
      <ul class="stats">
        <li><b>${st.sightings}</b><span>${tn('w.sightings', st.sightings)}</span></li>
        <li><b>${st.photos}</b><span>${tn('w.photos', st.photos)}</span></li>
        <li><b>${st.badges}</b><span>${t('w.badges')}</span></li>
      </ul>
      <p class="note score-note">${t('w.score.note')}</p>
    </section>
    ${explorer() ? html`<section class="challenge${ch.done ? ' done' : ''}">${ic(ch.done ? 'ph-check-circle' : ch.icon, 'big')}<div><p class="kicker-sm">${t('w.challenge')}</p><h2>${t(`c.${ch.id}`)}</h2><p class="note">${ch.done ? t('w.challenge.done') : t('w.challenge.how')}</p></div></section>` : ''}
    <section class="sec">
      <h2>${t('w.collect')}</h2>
      <ul class="stamps">${ESTATE.map(stamp)}</ul>
      <h3 class="sub">${L(ZONES.excursion.label)}</h3>
      <ul class="stamps">${SPECIES.filter((s) => s.zone === 'excursion').map(stamp)}</ul>
    </section>
    <section class="sec">
      <h2>${t('w.badges.title')}</h2>
      <ul class="badges">${bs.map(badgeTile)}</ul>
    </section>
    ${recent.length ? html`<section class="sec">
      <h2>${t('w.recent')}</h2>
      <ul class="log">${recent.map((x) => logRow(x))}</ul>
    </section>` : html`<section class="empty">${ic('ph-binoculars', 'big')}<h2>${t('w.empty')}</h2><p class="note">${t('w.empty.text')}</p><button type="button" class="btn btn-accent" data-act="wsub" data-arg="explore">${t('w.empty.cta')} ${ic('ph-arrow-right')}</button></section>`}
    <p class="note pad">${ic('ph-device-mobile')} ${t('w.local')}</p>`;
}

function logRow(x) {
  const s = SP[x.sp];
  if (!s) return '';
  return html`<li><button type="button" class="log-row" data-act="${x.photo ? 'photo' : 'sp'}" data-id="${x.photo ? x.id : x.sp}">
    <span class="log-art" data-photo-wrap>${x.photo ? html`<img data-photo="${x.photo}" alt="" width="52" height="52">` : thumb(s, 52)}</span>
    <span class="sp-main"><b>${L(s.name).replace(/ \(.*\)$/, '')}</b><small>${when(x.day)}${x.photo ? `, ${t('w.photo1')}` : ''}${x.sample ? `, ${t('w.sample')}` : ''}</small></span>
    ${ic('ph-caret-right', 'dim')}
  </button></li>`;
}

/* ================= Species sheet and sighting form ================= */
function speciesSheet(id) {
  const s = SP[id];
  if (!s) return;
  const lr = learned();
  if (!lr[id]) { lr[id] = 1; store.set('learned', lr); }
  const mine = sightings().filter((x) => x.sp === id).sort((a, b) => b.ts - a.ts);
  w.pending = null;
  openSheet(html`
    ${s.photo ? html`<img class="sp-photo" src="${LODGE.cdn}${s.photo}" alt="${L(s.name)}" width="760" height="570">` : ''}
    <div class="sp-head">${s.photo ? '' : thumb(s, 72)}<div><p class="kicker-sm">${L(ZONES[s.zone].label)}</p><h2 id="sheet-title">${L(s.name)}</h2><p class="note">${t(`likely.${s.likely}`)}${s.likely === 'rare' ? `. ${t('w.reported')}` : ''}</p></div></div>
    <p>${L(s.fact)}</p>
    <ul class="rows tight">
      <li>${ic('ph-eye', 'lead')}<div><b>${t('w.look')}</b><small>${L(s.look)}</small></div></li>
      <li>${ic('ph-clock', 'lead')}<div><b>${t('wild.best')}</b><small>${L(s.best)}</small></div></li>
      <li>${ic('ph-warning', 'lead')}<div><b>${t('w.care')}</b><small>${L(s.care)}</small></div></li>
    </ul>
    ${s.sensitive ? html`<p class="callout">${ic('ph-shield-check')} ${t('w.sensitive')}</p>` : ''}
    ${mine.length ? html`<h3 class="sub">${t('w.yours')}</h3><ul class="log">${mine.map((x) => logRow(x))}</ul>` : ''}
    <form class="sight-form" data-form="sight" data-sp="${id}" novalidate>
      <h3 class="sub">${mine.length ? t('w.again') : t('w.log')}</h3>
      <p class="note">${t('w.log.note')}</p>
      <div class="photo-pick" data-photo-wrap>
        <img id="sf-preview" alt="" hidden>
        <label class="btn btn-ghost btn-sm file">${ic('ph-camera')} <span>${t('w.photo.add')}</span><input type="file" name="photo" accept="image/*" data-form-file></label>
        ${MODE.demo && DEMO.samplePhotos[id] ? html`<button type="button" class="btn btn-ghost btn-sm" data-act="sample-photo" data-sample="${DEMO.samplePhotos[id]}">${ic('ph-image')} ${t('w.photo.sample')}</button>` : ''}
        <button type="button" class="link" data-act="photo-clear" id="sf-clear" hidden>${t('w.photo.remove')}</button>
      </div>
      ${s.sensitive ? '' : html`<label class="field-row">${t('w.note')}<input type="text" name="note" maxlength="120" autocomplete="off" placeholder="${t('w.note.ph')}"></label>`}
      <p class="note" id="sf-msg" role="status"></p>
      <button type="submit" class="btn btn-accent">${ic('ph-check')} ${t('w.save')}</button>
      <p class="note">${t('w.photo.privacy')}</p>
    </form>`);
  hydratePhotos($('#sheet-body'));
}

function photoSheet(sightId) {
  const x = sightings().find((r) => r.id === sightId);
  if (!x) return;
  const s = SP[x.sp];
  const sens = !!(s && s.sensitive);
  openSheet(html`
    <h2 id="sheet-title">${L(s.name).replace(/ \(.*\)$/, '')}</h2>
    <p class="note">${when(x.day)}${x.sample ? `, ${t('w.sample.long')}` : ''}</p>
    <div class="big-photo" data-photo-wrap><img data-photo="${x.photo}" data-kind="full" alt="${L(s.name)}"></div>
    <p class="note">${ic('ph-lock-simple')} ${x.share === 'private' ? t('w.share.private') : x.share === 'marketing' ? t('w.share.marketing') : t('w.share.host')}</p>
    <form class="share-form" data-form="share" data-id="${x.id}">
      <h3 class="sub">${t('w.share.title')}</h3>
      <p class="note">${t('w.share.intro')}</p>
      <fieldset class="opts">
        <label class="opt"><input type="radio" name="perm" value="private" checked><span><b>${t('w.share.o1')}</b><small>${t('w.share.o1d')}</small></span></label>
        <label class="opt"><input type="radio" name="perm" value="host"><span><b>${t('w.share.o2')}</b><small>${t('w.share.o2d')}</small></span></label>
      </fieldset>
      ${sens ? html`<p class="callout">${ic('ph-shield-check')} ${t('w.share.sens')}</p>` : html`<label class="opt check" data-mkt hidden><input type="checkbox" name="mkt"><span><b>${t('w.share.o3')}</b><small>${t('w.share.o3d')}</small></span></label>`}
      <p class="note" id="sh-msg" role="status"></p>
      <div class="row">
        <button type="submit" class="btn btn-accent btn-sm" id="sh-go" disabled>${ic('ph-share-network')} ${t('w.share.go')}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="photo-save" data-id="${x.id}">${ic('ph-download-simple')} ${t('w.photo.save')}</button>
      </div>
      <p class="note">${t('w.share.how')}</p>
    </form>
    <div class="row between"><button type="button" class="link" data-act="sp" data-id="${x.sp}">${t('w.see')} ${L(s.name).replace(/ \(.*\)$/, '')}</button>
    <button type="button" class="link danger" data-act="sight-del" data-id="${x.id}">${ic('ph-trash')} ${t('w.delete')}</button></div>`);
  hydratePhotos($('#sheet-body'));
}

/* ================= Help me identify: a browsing aid, never an automatic answer ================= */
const GROUPS = ['hoofed', 'hunter', 'small', 'bird', 'giant', 'reptile'];
function identifySheet() {
  const f = w.id;
  const match = SPECIES.filter((s) => (!f.grp || s.grp === f.grp) && (!f.size || s.size === f.size) && (!f.act || s.act === f.act || s.act === 'both'));
  const chips = (key, vals, label) => html`<div class="field"><p class="field-label">${label}</p><div class="chips" role="group" aria-label="${label}">${vals.map(([v, text]) => html`<button type="button" class="chip${f[key] === v ? ' on' : ''}" data-act="id-set" data-arg="${key}:${v}" aria-pressed="${String(f[key] === v)}">${text}</button>`)}</div></div>`;
  openSheet(html`
    <h2 id="sheet-title">${t('w.id.title')}</h2>
    <p class="note">${t('w.id.intro')}</p>
    ${chips('grp', GROUPS.map((g) => [g, t(`g.${g}`)]), t('w.id.q1'))}
    ${chips('size', [['s', t('sz.s')], ['m', t('sz.m')], ['l', t('sz.l')]], t('w.id.q2'))}
    ${chips('act', [['day', t('act.day')], ['night', t('act.night')]], t('w.id.q3'))}
    <h3 class="sub">${tn('w.id.matches', match.length)}</h3>
    ${match.length ? html`<ul class="sp-list">${match.map(speciesRow)}</ul>` : html`<p class="note">${t('w.id.none')}</p>`}
    <div class="row"><button type="button" class="btn btn-ghost btn-sm" data-act="id-reset">${t('w.id.reset')}</button></div>
    <p class="note">${t('w.id.note')}</p>`);
}

/* ================= Memories ================= */
const memPhotos = () => sightings().filter((x) => x.photo).sort((a, b) => a.ts - b.ts);
function selectedPhotos() {
  const all = memPhotos();
  if (w.sel === null) w.sel = all.slice(-4).map((x) => x.id);
  w.sel = w.sel.filter((id) => all.some((x) => x.id === id));
  return all.filter((x) => w.sel.includes(x.id));
}

function memories() {
  const g = state.guest, st = passportStats(), all = memPhotos(), sel = selectedPhotos();
  const staying = ['pre', 'eve'].includes(stage());
  return html`
    <section class="sec intro">
      <h1 class="h1">${t('m.title')}</h1>
      <p>${staying ? t('m.intro.pre') : t('m.intro')}</p>
    </section>
    <section class="card mem">
      <div class="card-canvas"><canvas id="mem-canvas" width="1080" height="1350" role="img" aria-label="${t('m.card.alt', { lodge: LODGES[g.lodge].name })}"></canvas><p class="note canvas-msg" id="mem-msg" role="status"></p></div>
      <div class="mem-opts">
        ${all.length ? html`<p class="field-label">${t('m.pick')} <small>${t('m.pick.max')}</small></p>
        <ul class="pick">${all.map((x) => html`<li><button type="button" class="pick-b${w.sel.includes(x.id) ? ' on' : ''}" data-act="mem-pick" data-id="${x.id}" aria-pressed="${String(w.sel.includes(x.id))}" aria-label="${L(SP[x.sp].name)}, ${when(x.day)}"><span data-photo-wrap><img data-photo="${x.photo}" alt="" width="64" height="64"></span></button></li>`)}</ul>` : html`<p class="note">${t('m.nophoto')}</p>`}
        <label class="switch"><input type="checkbox" data-act="mem-opt" data-arg="name" ${R(w.name ? 'checked' : '')} ${R(g.name ? '' : 'disabled')}><span>${t('m.opt.name')}</span></label>
        <label class="switch"><input type="checkbox" data-act="mem-opt" data-arg="animals" ${R(w.animals ? 'checked' : '')}><span>${t('m.opt.animals')}</span></label>
        <label class="switch"><input type="checkbox" data-act="mem-opt" data-arg="badges" ${R(w.badges ? 'checked' : '')}><span>${t('m.opt.badges')}</span></label>
      </div>
      <div class="row">
        <button type="button" class="btn btn-accent" data-act="mem-dl">${ic('ph-download-simple')} ${t('m.download')}</button>
        <button type="button" class="btn btn-ghost" data-act="mem-share" id="mem-share">${ic('ph-share-network')} ${t('m.share')}</button>
      </div>
      <p class="note">${ic('ph-lock-simple')} ${t('m.private')}</p>
      ${MODE.demo ? html`<p class="note demo-note">${ic('ph-flask')} ${t('m.demo')}</p>` : ''}
    </section>
    <section class="sec">
      <h2>${t('m.days')}</h2>
      ${sightings().length ? daysList() : html`<p class="note">${t('m.none')}</p><button type="button" class="btn btn-ghost btn-sm" data-act="wsub" data-arg="explore">${t('w.empty.cta')} ${ic('ph-arrow-right')}</button>`}
    </section>
    <p class="note pad">${ic('ph-device-mobile')} ${t('w.local')}</p>`;
}
function daysList() {
  const by = {};
  sightings().forEach((x) => { (by[x.day] = by[x.day] || []).push(x); });
  const days = Object.keys(by).sort();
  return html`<ol class="days">${days.map((d) => html`<li><p class="when">${when(d)}</p><p>${by[d].map((x) => L(SP[x.sp].name).replace(/ \(.*\)$/, '')).join(', ')}</p></li>`)}</ol>`;
}

/* ---------- The trip card, drawn on a canvas. Only same-origin images are used, so it can always be exported. ---------- */
const imgFrom = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function cover(c, img, x, y, W, H, r = 0) {
  const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
  const k = Math.max(W / iw, H / ih);
  c.save();
  c.beginPath();
  if (r) c.roundRect(x, y, W, H, r); else c.rect(x, y, W, H);
  c.clip();
  c.drawImage(img, x + (W - iw * k) / 2, y + (H - ih * k) / 2, iw * k, ih * k);
  c.restore();
}
/* Break text into lines that fit, keeping at most maxLines (the last one ends with an ellipsis when cut). */
function wrapLines(c, text, maxW, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { const cut = lines.slice(0, maxLines); cut[maxLines - 1] = `${cut[maxLines - 1].replace(/,?$/, '')}...`; return cut; }
  return lines;
}
const F = { title: '800 86px "Cabinet Grotesk", system-ui, sans-serif', big: '800 88px "Cabinet Grotesk", system-ui, sans-serif', body: '500 34px "Satoshi", system-ui, sans-serif', small: '500 30px "Satoshi", system-ui, sans-serif', label: '700 28px "Satoshi", system-ui, sans-serif' };
let drawTok = 0;
export async function renderCard(canvas, o = {}) {
  const tok = (drawTok += 1);
  const W = 1080, g = state.guest, st = passportStats();
  try { await Promise.all([document.fonts.load('800 80px "Cabinet Grotesk"'), document.fonts.load('500 34px "Satoshi"'), document.fonts.load('700 28px "Satoshi"')]); } catch (e) { /* fall back to system fonts */ }
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--photo-accent').trim() || '#ffb27c';
  const ph = o.photos || [];
  const names = o.animals ? [...new Set(sightings().map((x) => x.sp))].map((id) => L(SP[id].name).replace(/ \(.*\)$/, '')) : [];
  const badgeNames = o.badges ? badgeStates().filter((b) => b.done).map((b) => t(`b.${b.id}`)) : [];
  // Measure first, so the card is always tall enough for what it holds.
  const m = document.createElement('canvas').getContext('2d');
  m.font = F.body;
  const nameLines = names.length ? wrapLines(m, names.join(', '), 960, 5) : [];
  const badgeLines = badgeNames.length ? wrapLines(m, badgeNames.join(', '), 960, 3) : [];
  const PH = 440, LH = 46;
  let H = 560 + (ph.length ? PH + 56 : 0) + 176;
  if (nameLines.length) H += 52 + nameLines.length * LH + 26;
  if (badgeLines.length) H += 52 + badgeLines.length * LH + 26;
  H = Math.max(1350, H + 150);
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  c.fillStyle = '#0e120e'; c.fillRect(0, 0, W, H);
  try { cover(c, await imgFrom(BRAND.memoryPhoto), 0, 0, W, 520); } catch (e) { /* plain background */ }
  const gr = c.createLinearGradient(0, 0, 0, 520);
  gr.addColorStop(0, 'rgba(8,10,7,.35)'); gr.addColorStop(.55, 'rgba(8,10,7,.25)'); gr.addColorStop(1, '#0e120e');
  c.fillStyle = gr; c.fillRect(0, 0, W, 520);
  c.textBaseline = 'alphabetic';
  if (BRAND.logo) {
    try {
      const logo = await imgFrom(BRAND.logo);
      const off = document.createElement('canvas'); off.width = 150; off.height = Math.round(150 * (logo.height / logo.width));
      const oc = off.getContext('2d'); oc.drawImage(logo, 0, 0, off.width, off.height); oc.globalCompositeOperation = 'source-in'; oc.fillStyle = '#f8f5ec'; oc.fillRect(0, 0, off.width, off.height);
      c.drawImage(off, 60, 56);
    } catch (e) { /* no logo */ }
  } else { c.fillStyle = '#f8f5ec'; c.font = '800 40px "Cabinet Grotesk", system-ui, sans-serif'; c.fillText(BRAND.name, 60, 100); }
  c.fillStyle = '#f8f5ec'; c.font = F.title;
  c.fillText(LODGES[g.lodge].name, 60, 396);
  c.font = F.body; c.fillStyle = accent;
  c.fillText(`${fmtDate(g.in, { day: 'numeric', month: 'long' })} ${t('to')} ${fmtDate(g.out, { day: 'numeric', month: 'long', year: 'numeric' })}, ${tn('nights', g.nights)}`, 60, 450);
  c.fillStyle = 'rgba(248,245,236,.9)';
  if (o.name && g.name) c.fillText(g.name, 60, 498);
  let y = 560;
  if (ph.length) {
    const imgs = await Promise.all(ph.map(async (x) => { const rec = await getPhoto(x.photo); return rec ? createImageBitmap(rec.full) : null; }));
    const P = imgs.filter(Boolean), A = 60, B = 960, gap = 16, half = (B - gap) / 2, hh = (PH - gap) / 2;
    if (P.length === 1) cover(c, P[0], A, y, B, PH, 28);
    else if (P.length === 2) { cover(c, P[0], A, y, half, PH, 28); cover(c, P[1], A + half + gap, y, half, PH, 28); }
    else if (P.length === 3) { cover(c, P[0], A, y, half, PH, 28); cover(c, P[1], A + half + gap, y, half, hh, 28); cover(c, P[2], A + half + gap, y + hh + gap, half, hh, 28); }
    else if (P.length >= 4) { cover(c, P[0], A, y, half, hh, 28); cover(c, P[1], A + half + gap, y, half, hh, 28); cover(c, P[2], A, y + hh + gap, half, hh, 28); cover(c, P[3], A + half + gap, y + hh + gap, half, hh, 28); }
    y += PH + 56;
  }
  [[st.seen, t('m.card.species')], [st.sightings, tn('w.sightings', st.sightings)], [st.badges, t('w.badges')]].forEach(([n, label], i) => {
    const x = 60 + i * 330;
    c.fillStyle = '#f8f5ec'; c.font = F.big; c.fillText(String(n), x, y + 70);
    c.fillStyle = 'rgba(248,245,236,.7)'; c.font = F.small; c.fillText(label, x, y + 112);
  });
  y += 176;
  const block = (label, lines) => {
    if (!lines.length) return;
    c.fillStyle = accent; c.font = F.label; c.fillText(label.toUpperCase(), 60, y);
    c.fillStyle = 'rgba(248,245,236,.92)'; c.font = F.body;
    lines.forEach((ln, i) => c.fillText(ln, 60, y + 48 + i * LH));
    y += 52 + lines.length * LH + 26;
  };
  block(t('m.card.seen'), nameLines);
  block(t('w.badges.title'), badgeLines);
  c.fillStyle = 'rgba(248,245,236,.14)'; c.fillRect(60, H - 112, 960, 2);
  c.fillStyle = 'rgba(248,245,236,.78)'; c.font = F.small;
  c.fillText(`${BRAND.name}, Hoedspruit`, 60, H - 56);
  if (MODE.demo) { c.fillStyle = accent; c.font = '700 24px "Satoshi", system-ui, sans-serif'; c.fillText(t('m.card.demo'), 60, H - 136); }
  else { const tag = BRAND.hashtag; c.font = F.small; c.fillStyle = 'rgba(248,245,236,.78)'; c.fillText(tag, W - 60 - c.measureText(tag).width, H - 56); }
  return tok === drawTok;
}
const cardOpts = () => ({ photos: selectedPhotos(), name: w.name && !!state.guest.name, animals: w.animals, badges: w.badges });
async function paintCard() {
  const cv = $('#mem-canvas');
  if (cv) { try { await renderCard(cv, cardOpts()); } catch (e) { const m = $('#mem-msg'); if (m) m.textContent = t('m.err'); } }
}
async function cardBlob() {
  const cv = document.createElement('canvas');
  await renderCard(cv, cardOpts());
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/png'));
}
const fileName = () => `${BRAND.short.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-my-stay-${state.guest.in}.png`;
function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- After every render ---------- */
export function wildAfterRender() {
  if (state.tab === 'home' || state.tab === 'wild') hydratePhotos();
  if (state.tab === 'wild' && subOf() === 'memories') {
    paintCard();
    const sh = $('#mem-share');
    if (sh && !(navigator.canShare && navigator.share)) { sh.disabled = true; sh.title = t('m.share.no'); }
  }
}

/* ---------- Actions ---------- */
async function trySharePhoto(form) {
  const x = sightings().find((r) => r.id === form.dataset.id);
  const msg = $('#sh-msg', form);
  if (!x) return;
  const perm = form.elements.perm.value;
  const mkt = !!(form.elements.mkt && form.elements.mkt.checked && perm === 'host');
  if (perm === 'private') { msg.textContent = t('w.share.private'); return; }
  const rec = await getPhoto(x.photo);
  if (!rec) { msg.textContent = t('m.err'); return; }
  const file = new File([rec.full], `${x.sp}-${x.day}.jpg`, { type: 'image/jpeg' });
  const s = SP[x.sp];
  const text = hostMessage(`Here is a photo of a ${s.name.en.toLowerCase().replace(/ \(.*\)$/, '')} from my stay.\nYou may look at it: yes.\nYou may use it on your website and social media: ${mkt ? `yes, with my first name as credit${state.guest.name ? ` (${state.guest.name.split(/ and | und |,/)[0].trim()})` : ''}` : 'no, please keep it private'}.`);
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: BRAND.name });
      const l = sightings(); const r = l.find((q) => q.id === x.id); r.share = mkt ? 'marketing' : 'host'; r.sharedAt = Date.now(); store.set('sightings', l);
      msg.textContent = t('w.share.sent');
      return;
    } catch (e) { if (e && e.name === 'AbortError') { msg.textContent = t('w.share.cancel'); return; } }
  }
  msg.textContent = t('w.share.fallback');
}

function setPreview(file, src) {
  const img = $('#sf-preview'), clear = $('#sf-clear');
  if (!img) return;
  if (img.dataset.url) { URL.revokeObjectURL(img.dataset.url); img.dataset.url = ''; }
  if (file) { const u = URL.createObjectURL(file); img.src = u; img.dataset.url = u; img.hidden = false; clear.hidden = false; }
  else if (src) { img.src = src; img.hidden = false; clear.hidden = false; }
  else { img.removeAttribute('src'); img.hidden = true; clear.hidden = true; }
}

export async function wildAct(act, arg, id, el) {
  switch (act) {
    case 'wsub': state.sub.wild = arg; if (sheetOpen()) closeSheet(); bus.render(false); window.scrollTo(0, 0); return true;
    case 'wzone': w.zone = arg; bus.render(); return true;
    case 'sp': speciesSheet(id); return true;
    case 'photo': photoSheet(id); return true;
    case 'identify': identifySheet(); return true;
    case 'id-set': { const [k, v] = arg.split(':'); w.id[k] = w.id[k] === v ? null : v; identifySheet(); return true; }
    case 'id-reset': w.id = { grp: null, size: null, act: null }; identifySheet(); return true;
    case 'rules-read': store.set('rules', true); bus.toast(t('w.rules.toast')); bus.render(); return true;
    case 'explorer': store.set('explorer', el.checked); bus.render(); return true;
    case 'sample-photo': w.pending = { sample: arg === undefined ? el.dataset.sample : arg }; setPreview(null, el.dataset.sample); $('#sf-msg').textContent = t('w.photo.sample.on'); return true;
    case 'photo-clear': w.pending = null; const fi = $('[data-form-file]'); if (fi) fi.value = ''; setPreview(null, null); return true;
    case 'sight-del': {
      if (w.armed !== id) { w.armed = id; el.innerHTML = `${ic('ph-trash').r} ${esc(t('w.delete.sure'))}`; setTimeout(() => { if (w.armed === id) w.armed = null; }, 4000); return true; }
      w.armed = null; await removeSighting(id); closeSheet(); bus.toast(t('w.deleted')); bus.render(); return true;
    }
    case 'photo-save': {
      const x = sightings().find((r) => r.id === id); const rec = x && await getPhoto(x.photo);
      if (rec) saveBlob(rec.full, `${x.sp}-${x.day}.jpg`);
      return true;
    }
    case 'mem-pick': {
      const max = 4;
      w.sel = w.sel || [];
      if (w.sel.includes(id)) w.sel = w.sel.filter((q) => q !== id); else { w.sel.push(id); if (w.sel.length > max) w.sel.shift(); }
      bus.render(); return true;
    }
    case 'mem-opt': w[arg] = el.checked; paintCard(); return true;
    case 'mem-dl': {
      try { saveBlob(await cardBlob(), fileName()); bus.toast(t('m.saved')); } catch (e) { $('#mem-msg').textContent = t('m.err'); }
      return true;
    }
    case 'mem-share': {
      try {
        const blob = await cardBlob();
        const file = new File([blob], fileName(), { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: BRAND.name, text: `${BRAND.hashtag}` });
        else saveBlob(blob, fileName());
      } catch (e) { if (!e || e.name !== 'AbortError') $('#mem-msg').textContent = t('m.err'); }
      return true;
    }
    default: return false;
  }
}

const ERR = { space: 'w.err.space', toobig: 'w.err.toobig', unreadable: 'w.err.unreadable', save: 'w.err.save' };
export function initWild() {
  document.addEventListener('change', (e) => {
    const f = e.target.closest('[data-form-file]');
    if (f) { const file = f.files && f.files[0]; w.pending = file ? { file } : null; setPreview(file || null, null); $('#sf-msg').textContent = file ? t('w.photo.cleaned') : ''; return; }
    const r = e.target.closest('.share-form input[name="perm"]');
    if (r) { const form = r.closest('form'); $('#sh-go', form).disabled = r.value === 'private'; const m = $('[data-mkt]', form); if (m) m.hidden = r.value !== 'host'; }
  });
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    if (form.dataset.form === 'share') { trySharePhoto(form); return; }
    if (form.dataset.form !== 'sight') return;
    const msg = $('#sf-msg', form), submit = form.querySelector('[type="submit"]');
    submit.disabled = true; msg.textContent = t('w.saving');
    const r = await addSighting({ sp: form.dataset.sp, file: w.pending && w.pending.file, sample: w.pending && w.pending.sample, note: form.elements.note ? form.elements.note.value : '' });
    submit.disabled = false;
    if (!r.ok) { msg.textContent = t(ERR[r.err] || 'w.err.save'); return; }
    w.pending = null; w.sel = null;
    closeSheet();
    bus.toast(t('w.saved', { name: L(SP[form.dataset.sp].name).replace(/ \(.*\)$/, '') }));
    if (state.tab !== 'wild') { state.sub.wild = 'passport'; }
    bus.render();
  });
}

/* Everything saved on this device by the wildlife features, for the data panel. */
export async function localSummary() {
  let photos = [];
  try { photos = await allPhotos(); } catch (e) { /* no storage */ }
  return { sightings: sightings().length, photos: photos.length, bytes: photos.reduce((n, p) => n + (p.full ? p.full.size : 0) + (p.thumb ? p.thumb.size : 0), 0) };
}
export async function wipeWild() {
  store.del('sightings', 'learned', 'rules', 'seeded', 'explorer');
  try { await clearPhotos(); } catch (e) { /* nothing stored */ }
}
