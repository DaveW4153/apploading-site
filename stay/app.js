/* My stay: the guest companion. Vanilla JS, no build step, works offline once opened.
   Property content comes from property/*.js through data.js; shared foundations are in core.js. */
import { LODGE, LODGES, PLACES, CATS, ROUTES, GATES, CLIMATE, WEATHER, EMERGENCY, KNOW, CHECKLIST, PACKING, SOURCES, SPECIES, BRAND, LODGE_INFO } from './data.js';
import { accentCss } from './property/index.js';
import { sunTimes, twilight, hhmm, moon } from './sun.js';
import { UI, LANGS } from './i18n.js';
import { esc, R, html, ic, $, $$, btn } from './ui.js';
import { params, MODE, store, bus, saNow, addDays, diffDays, isDate, lang, setLang, enabledLangs, t, tn, L, locale, fmtDate, fmtMin, readGuest, state, today, stage, STAGES, stageDate, focusDate, range, greeting, wa, dir, waze, mapSearch, hostMessage, openLink } from './core.js';
import { openSheet, closeSheet } from './sheet.js';
import { PLANNED } from './i18n.js';
import { clearPhotos, storageInfo } from './photos.js';
import { viewWild, wildAct, wildAfterRender, initWild, seedDemo, passportStats, todaysChallenge, localSummary, wipeWild } from './wild.js';
import { extrasView, extrasTeaser, extrasAct, initExtras } from './extras.js';

const root = document.documentElement;

/* ---------- Weather ---------- */
const wxInfo = (code) => WEATHER.find((w) => w.codes.includes(code)) || { icon: 'ph-cloud', label: { en: 'Cloudy', de: 'Wolkig' } };
const WX_TTL = 3 * 3600 * 1000;
const isOffline = () => state.sim || !state.online || navigator.onLine === false;
/* status: live (fetched in the last 3 hours), saved (an older copy kept on this phone because there is no signal), none. */
async function loadWeather() {
  const cached = store.get('wx', null);
  if (isOffline()) {
    state.wx = cached || null; state.wxStatus = cached ? 'saved' : 'none';
  } else if (cached && Date.now() - cached.t < WX_TTL) {
    state.wx = cached; state.wxStatus = 'live';
  } else {
    try {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${LODGE.lat}&longitude=${LODGE.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset,wind_speed_10m_max&timezone=Africa%2FJohannesburg&forecast_days=16`;
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(u, { signal: ctl.signal });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      state.wx = { t: Date.now(), daily: d.daily };
      store.set('wx', state.wx);
      state.wxStatus = 'live';
    } catch (e) {
      state.wx = cached || null;
      state.wxStatus = cached ? 'saved' : 'none';
    }
  }
  if (state.tab === 'home') render();
}
/* Forecast for a date if we have it, otherwise the long-run average for that month. */
function wxFor(date) {
  const w = state.wx && state.wx.daily;
  const i = w ? w.time.indexOf(date) : -1;
  if (i >= 0) {
    return { kind: 'forecast', hi: Math.round(w.temperature_2m_max[i]), lo: Math.round(w.temperature_2m_min[i]), code: w.weather_code[i], pop: w.precipitation_probability_max[i], rain: w.precipitation_sum[i], uv: w.uv_index_max[i], wind: w.wind_speed_10m_max[i] };
  }
  const c = CLIMATE[Number(date.slice(5, 7))];
  return { kind: 'typical', hi: Math.round(c.hi), lo: Math.round(c.lo), code: c.rain > 60 ? 80 : c.rain > 25 ? 2 : 0, pop: null, rain: c.rain, days: c.days, hot: c.hot, uv: null };
}

/* ---------- Sun and moon ---------- */
const sun = (d) => {
  const s = sunTimes(d, LODGE.lat, LODGE.lon, LODGE.tzOffset);
  const w = twilight(d, LODGE.lat, LODGE.lon, LODGE.tzOffset);
  return { rise: s.rise, set: s.set, dawn: w.rise, dusk: w.set };
};
const moonText = (d) => {
  const m = moon(d);
  return { ...m, name: t(`moon.${m.phase}`), dark: m.lit < 0.15 };
};

/* ---------- Small view helpers ---------- */
const countParts = () => {
  const mins = diffDays(today(), state.guest.in) * 1440 - saNow().min;
  const m = Math.max(0, mins);
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
};

/* ================= HOME ================= */
/* The home screen changes with the guest's moment: preparing, the day before, arriving, staying, leaving, remembering.
   Each moment has one primary action in the hero and a short list of things that matter right then. */
function dayPlan(date) {
  const s = sun(date), w = wxFor(date), mo = moonText(date);
  const items = [];
  items.push({ icon: 'ph-sun-horizon', time: `${hhmm(s.dawn)} ${t('to')} ${hhmm(s.rise + 120)}`, title: t('plan.dawn'), text: t('plan.dawn.t', { rise: hhmm(s.rise) }) });
  const storm = w.pop != null ? w.pop >= 50 : (w.rain || 0) > 80;
  if (storm) items.push({ icon: 'ph-cloud-lightning', time: `11:30 ${t('to')} 16:00`, title: t('plan.storm'), text: t('plan.storm.t') });
  else if (w.hi >= 30) items.push({ icon: 'ph-swimming-pool', time: `11:30 ${t('to')} 15:00`, title: t('plan.heat'), text: t('plan.heat.t', { hi: w.hi }) });
  else items.push({ icon: 'ph-compass', time: `10:00 ${t('to')} 15:00`, title: t('plan.cool'), text: t('plan.cool.t') });
  items.push({ icon: 'ph-wine', time: `${hhmm(s.set - 75)} ${t('to')} ${hhmm(s.set + 15)}`, title: t('plan.golden'), text: t('plan.golden.t', { set: hhmm(s.set) }) });
  items.push({ icon: mo.dark ? 'ph-moon-stars' : 'ph-moon', time: `${t('after')} ${hhmm(s.dusk)}`, title: t('plan.night'), text: mo.dark ? t('plan.night.dark') : t('plan.night.moon', { moon: mo.name }) });
  return items;
}

function sunArc(date) {
  const s = sun(date), now = saNow().min;
  const f = (now - s.rise) / (s.set - s.rise);
  const up = f >= 0 && f <= 1;
  const x = 150 - 130 * Math.cos(Math.PI * Math.min(1, Math.max(0, f)));
  const y = 104 - 86 * Math.sin(Math.PI * Math.min(1, Math.max(0, f)));
  return html`<figure class="arc" aria-label="${t('arc.label', { rise: hhmm(s.rise), set: hhmm(s.set) })}">
    <svg viewBox="0 0 300 128" role="img" aria-hidden="true"><path class="arc-line" d="M20 104 A130 86 0 0 1 280 104"/><line class="arc-ground" x1="8" y1="104" x2="292" y2="104"/>${up ? R(`<circle class="arc-sun" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`) : ''}</svg>
    <figcaption><span><small>${t('sunrise')}</small><b>${hhmm(s.rise)}</b></span><span><small>${t('sunset')}</small><b>${hhmm(s.set)}</b></span></figcaption>
  </figure>`;
}

/* Where the weather came from, said plainly. */
function wxSource(w) {
  const when = state.wx ? new Date(state.wx.t).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: LODGE.tz }) : '';
  if (w.kind === 'forecast') return state.wxStatus === 'live' ? { tag: t('wx.live'), note: t('wx.live.at', { when }) } : { tag: t('wx.saved'), note: t('wx.saved.at', { when }) };
  if (state.wx) return { tag: t('wx.avg'), note: '' };
  return { tag: t('wx.avg'), note: isOffline() ? t('wx.none.off') : t('wx.none.on') };
}
function weatherCard() {
  const date = focusDate(), w = wxFor(date), info = wxInfo(w.code);
  const stg = stage();
  const days = [];
  const start = stg === 'pre' || stg === 'eve' || stg === 'arrival' ? state.guest.in : date;
  for (let i = 0; i < 5; i += 1) days.push(addDays(start, i));
  const mo = Number(date.slice(5, 7));
  const month = fmtDate(date, { month: 'long' });
  const src = wxSource(w);
  const note = w.kind === 'forecast'
    ? [w.uv != null && w.uv >= 8 ? t('wx.uv') : '', w.pop != null && w.pop >= 50 ? t('wx.storm') : ''].filter(Boolean).join(' ')
    : t('wx.typical', { month, rain: Math.round(CLIMATE[mo].rain), days: Math.round(CLIMATE[mo].days) }) + (CLIMATE[mo].hot >= 2 ? ' ' + t('wx.hot', { n: Math.round(CLIMATE[mo].hot) }) : '');
  return html`<section class="card wx">
    <header class="card-head"><h2>${t('wx.title')}</h2><span class="tag${w.kind === 'forecast' && state.wxStatus !== 'live' ? ' warn' : ''}">${src.tag}</span></header>
    <div class="wx-now">
      ${ic(info.icon, 'wx-icon')}
      <div><p class="wx-temp">${w.hi}°<small> / ${w.lo}°</small></p><p class="wx-label">${L(info.label)}${w.pop != null ? `, ${t('wx.rain', { p: w.pop })}` : ''}</p></div>
    </div>
    <ul class="wx-strip">${days.map((d) => { const x = wxFor(d), i = wxInfo(x.code); return html`<li${R(d === focusDate() ? ' class="on"' : '')}><span>${fmtDate(d, { weekday: 'short' })}</span>${ic(i.icon)}<b>${x.hi}°</b><small>${x.lo}°</small></li>`; })}</ul>
    ${note ? html`<p class="note">${note}</p>` : ''}
    ${src.note ? html`<p class="note src-note">${ic(isOffline() ? 'ph-wifi-slash' : 'ph-clock-clockwise')} ${src.note}</p>` : ''}
  </section>`;
}

let showAllChecks = false;
function checklistSec(when) {
  const all = CHECKLIST.filter((c) => c.when === when);
  const done = store.get('done', {});
  const n = all.filter((c) => done[c.id]).length;
  const ordered = [...all.filter((c) => !done[c.id]), ...all.filter((c) => done[c.id])];
  const items = showAllChecks ? ordered : ordered.slice(0, 4);
  return html`<section class="sec" id="check-${when}">
    <div class="sec-head"><h2>${when === 'dep' ? t('check.dep') : t('check.pre')}</h2><span class="tag">${t('check.count', { n, total: all.length })}</span></div>
    <ul class="checks">${items.map((c) => html`<li${R(done[c.id] ? ' class="done"' : '')}>
      <button type="button" class="box" data-act="tick" data-id="${c.id}" role="checkbox" aria-checked="${done[c.id] ? 'true' : 'false'}" aria-label="${L(c.text)}">${ic('ph-check')}</button>
      <span>${L(c.text)}</span>
      ${c.act ? html`<button type="button" class="link" data-act="${c.act.split(':')[0]}" data-arg="${c.act.split(':')[1] || ''}" data-id="${c.id}">${L(c.actLabel)}</button>` : ''}
    </li>`)}</ul>
    ${ordered.length > 4 ? html`<button type="button" class="link more" data-act="checks-more">${showAllChecks ? t('check.fewer') : t('check.all', { n: all.length })}</button>` : ''}
  </section>`;
}

function installCard() {
  if (MODE.embed || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone || store.get('installDismissed', false)) return '';
  return html`<section class="card install">
    ${ic('ph-device-mobile', 'big')}
    <div><h2>${t('install.title')}</h2><p class="note">${t('install.text')}</p>
      <div class="row">${btn('btn-accent btn-sm', 'data-act="install"', t('install.cta'))}${btn('btn-ghost btn-sm', 'data-act="install-dismiss"', t('install.no'))}</div>
    </div>
  </section>`;
}

function hostSec() {
  return html`<section class="sec host">
    <h2>${t('host.title', { host: LODGE.host })}</h2>
    <p class="note">${t('host.text')}</p>
    <div class="row">
      <a class="btn btn-ghost btn-sm" href="${wa(hostMessage(''))}" target="_blank" rel="noopener">${t('wa')} ${ic('ph-whatsapp-logo')}</a>
      <a class="btn btn-ghost btn-sm" href="tel:${LODGE.phone.replace(/\s/g, '')}">${t('call')} ${ic('ph-phone')}</a>
    </div>
  </section>`;
}

/* A row of lodge information. Shows the lodge's own text when it has been filled in, otherwise offers a one-tap question. */
function infoRow(id) {
  const it = LODGE_INFO.find((i) => i.id === id);
  if (!it) return '';
  const val = it.value ? L(it.value) : null;
  return html`<li>${ic(it.icon, 'lead')}<div><b>${t(`lodge.${id}`)}</b>${val ? html`<small>${val}</small>` : html`<small class="todo">${t('lodge.todo')}</small>`}</div>${val ? '' : html`<a class="link" href="${wa(hostMessage(UI.en[`lodge.${id}.ask`]))}" target="_blank" rel="noopener">${t('lodge.ask')}</a>`}</li>`;
}

/* ---- Preparing ---- */
function prepSec() { return checklistSec('pre'); }
function neighboursSec() {
  const n = SPECIES.filter((s) => s.zone === 'estate').length;
  return html`<section class="sec">
    <h2>${t('away.title')}</h2>
    <p class="note">${t('h.away.text', { n })}</p>
    <button type="button" class="btn btn-ghost btn-sm" data-act="goto" data-arg="wild/explore">${t('away.cta')} ${ic('ph-arrow-right')}</button>
  </section>`;
}
function etaSec() {
  const set = sun(state.guest.in).set;
  return html`<section class="sec">
    <h2>${t('eta.title')}</h2>
    <p class="note">${t('h.eve.text', { set: hhmm(set) })}</p>
    <label class="field-row">${ROUTES[state.route].airport === 'hds' ? t('eta.q.hds') : t('eta.q.drive')}<input type="time" id="eta" value="${store.get('eta', '')}"></label>
    <div id="eta-out">${etaOutput()}</div>
  </section>`;
}

/* ---- Arriving ---- */
function arrivalSec() {
  const set = sun(today()).set;
  return html`<section class="sec">
    <h2>${t('h.arrive.title')}</h2>
    <ul class="rows">
      <li>${ic('ph-map-pin', 'lead')}<div><b>${t('address')}</b><small>${LODGE.address}</small></div><a class="link" href="${dir(LODGE.lat, LODGE.lon)}" target="_blank" rel="noopener">${t('directions')}</a></li>
      ${infoRow('gate')}${infoRow('checkin')}
      <li>${ic('ph-sun-horizon', 'lead')}<div><b>${t('h.arrive.sunset')}</b><small>${t('h.arrive.sunset.t', { set: hhmm(set) })}</small></div></li>
    </ul>
    <div class="row">
      <a class="btn btn-ghost btn-sm" href="${wa(hostMessage('I have arrived at the estate gate.'))}" target="_blank" rel="noopener">${t('h.arrive.here')} ${ic('ph-whatsapp-logo')}</a>
      <a class="btn btn-ghost btn-sm" href="tel:${LODGE.phone.replace(/\s/g, '')}">${t('call')} ${ic('ph-phone')}</a>
    </div>
  </section>`;
}
function skySec(date) {
  const mo = moonText(date);
  return html`<section class="sec sky"><h2>${t('sky.title')}</h2>${sunArc(date)}<p class="note">${ic(mo.dark ? 'ph-moon-stars' : 'ph-moon')} ${mo.name}. ${mo.dark ? t('sky.dark') : t('sky.bright')}</p></section>`;
}

/* ---- Staying ---- */
function todaySec() {
  const date = today();
  return html`${weatherCard()}
    <section class="sec plan"><h2>${t('plan.title.today')}</h2>
      <ol class="timeline">${dayPlan(date).map((p) => html`<li>${ic(p.icon)}<div><p class="when">${p.time}</p><h3>${p.title}</h3><p>${p.text}</p></div></li>`)}</ol>
    </section>`;
}
function wildTodaySec() {
  const st = passportStats(), s = sun(today()), ch = todaysChallenge();
  return html`<section class="sec">
    <div class="sec-head"><h2>${t('h.wild.title')}</h2><span class="tag">${st.seen} ${t('of')} ${st.total}</span></div>
    <p>${t('h.wild.best', { dawn: hhmm(s.dawn), rise: hhmm(s.rise + 120), dusk: hhmm(s.set - 90), end: hhmm(s.dusk) })}</p>
    ${store.get('explorer', state.guest.kids > 0) ? html`<p class="challenge-line${ch.done ? ' done' : ''}">${ic(ch.done ? 'ph-check-circle' : ch.icon)} <span><b>${t('w.challenge')}:</b> ${t(`c.${ch.id}`)}</span></p>` : ''}
    <div class="row">
      <button type="button" class="btn btn-accent btn-sm" data-act="goto" data-arg="wild/passport">${ic('ph-notebook')} ${t('h.wild.passport')}</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="goto" data-arg="wild/explore">${t('h.wild.guide')}</button>
    </div>
  </section>`;
}
function essentialsSec() {
  return html`<section class="sec">
    <h2>${t('h.ess.title')}</h2>
    <ul class="rows">${infoRow('wifi')}${infoRow('braai')}${infoRow('pool')}</ul>
    <button type="button" class="link" data-act="goto" data-arg="lodge/lodge">${t('h.ess.all')} ${ic('ph-arrow-right')}</button>
  </section>`;
}

/* ---- Leaving ---- */
function onwardSec() {
  const fl = (store.get('flights', {}) || {}).out || {};
  const r = ROUTES[state.route], buf = r.airport === 'hds' ? 90 : 120;
  let body;
  if (fl.dep) {
    const [h, m] = fl.dep.split(':').map(Number);
    const leave = h * 60 + m - buf - r.drive;
    body = html`<p class="big-time">${hhmm(leave)}</p><p>${t('h.onward.leave', { time: fl.dep, buf, drive: fmtMin(r.drive) })}</p>`;
  } else body = html`<p class="note">${t('h.onward.none')}</p><button type="button" class="btn btn-ghost btn-sm" data-act="goto" data-arg="journey/getting">${t('h.onward.add')} ${ic('ph-arrow-right')}</button>`;
  const open = (store.get('requests', []) || []).filter((q) => q.status === 'prepared' || q.status === 'sent').length;
  return html`<section class="sec">
    <h2>${t('h.onward.title')}</h2>
    ${body}
    ${open ? html`<p class="callout">${ic('ph-hourglass')} ${tn('h.open', open)} <button type="button" class="link" data-act="goto" data-arg="lodge/extras">${t('h.open.see')}</button></p>` : ''}
    <ul class="rows tight">${infoRow('checkout')}</ul>
  </section>`;
}

/* ---- Remembering ---- */
function memoriesSec() {
  const st = passportStats();
  const pics = (store.get('sightings', []) || []).filter((x) => x.photo).slice(-4);
  return html`<section class="sec">
    <h2>${t('m.title')}</h2>
    ${pics.length ? html`<ul class="mini-photos">${pics.map((x) => html`<li data-photo-wrap><img data-photo="${x.photo}" alt="" width="80" height="80"></li>`)}</ul>` : ''}
    <p>${st.sightings ? t('h.mem.stats', { species: st.seen, sightings: st.sightings, badges: st.badges }) : t('h.mem.none')}</p>
    <div class="row">
      <button type="button" class="btn btn-accent btn-sm" data-act="goto" data-arg="wild/memories">${ic('ph-image-square')} ${t('h.mem.cta')}</button>
      ${st.sightings ? '' : html`<button type="button" class="btn btn-ghost btn-sm" data-act="goto" data-arg="wild/passport">${t('h.mem.add')}</button>`}
    </div>
  </section>`;
}
function feedbackSec() {
  return html`<section class="sec">
    <h2>${t('h.fb.title')}</h2>
    <p class="note">${t('h.fb.text')}</p>
    <div class="row">
      <a class="btn btn-ghost btn-sm" href="${wa(hostMessage('Thank you for a wonderful stay! Here is how it went: '))}" target="_blank" rel="noopener">${t('h.fb.tell')} ${ic('ph-whatsapp-logo')}</a>
      <a class="btn btn-ghost btn-sm" href="${BRAND.reviewUrl}" target="_blank" rel="noopener">${t('review')} ${ic('ph-star')}</a>
    </div>
  </section>`;
}
function returnSec() {
  return html`<section class="sec">
    <h2>${t('h.back.title')}</h2>
    <p class="note">${t('h.back.text')}</p>
    <a class="btn btn-accent btn-sm" href="${LODGE.book}" target="_blank" rel="noopener">${t('rebook')} ${ic('ph-arrow-up-right')}</a>
  </section>`;
}

/* ---- The hero: the guest, their stay and one primary action ---- */
function primaryAction() {
  const s = stage();
  const link = (cls, href, label, icon) => html`<a class="btn ${cls}" href="${href}" target="_blank" rel="noopener">${label}${ic(icon)}</a>`;
  const go = (cls, arg, label, icon) => html`<button type="button" class="btn ${cls}" data-act="goto" data-arg="${arg}">${label}${ic(icon)}</button>`;
  if (s === 'pre') return go('btn-accent', 'journey/getting', t('cta.pre'), 'ph-arrow-right');
  if (s === 'eve') return link('btn-accent', wa(hostMessage('I will arrive tomorrow at about ')), t('cta.eve', { host: LODGE.host }), 'ph-whatsapp-logo');
  if (s === 'arrival') return link('btn-accent', dir(LODGE.lat, LODGE.lon), t('cta.arrival'), 'ph-navigation-arrow');
  if (s === 'staying') return go('btn-accent', 'wild/passport', t('cta.staying'), 'ph-notebook');
  if (s === 'departure') return html`<button type="button" class="btn btn-accent" data-act="scroll" data-arg="check-dep">${t('cta.departure')}${ic('ph-arrow-down')}</button>`;
  return go('btn-accent', 'wild/memories', t('cta.after'), 'ph-image-square');
}
function heroCard() {
  const g = state.guest, s = stage(), lod = LODGES[g.lodge];
  const photo = `${LODGE.cdn}${lod.photo}?width=900&quality=70`;
  let head = '', sub = '', extra = '';
  const meta = `${range()}, ${tn('nights', g.nights)}, ${tn('guests', g.adults + g.kids)}`;
  if (s === 'pre' || s === 'eve') {
    const c = countParts();
    head = s === 'eve' ? t('hero.eve') : tn('hero.pre', c.d);
    sub = meta;
    extra = html`<div class="count" data-count role="timer" aria-live="off">
      <div><b data-c="d">${c.d}</b><span>${t('u.days')}</span></div><div><b data-c="h">${c.h}</b><span>${t('u.hours')}</span></div><div><b data-c="m">${c.m}</b><span>${t('u.minutes')}</span></div>
    </div>`;
  } else if (s === 'arrival') { head = t('hero.arrival'); sub = t('hero.arrival.sub', { set: hhmm(sun(today()).set) }); }
  else if (s === 'staying') { head = t('hero.day', { d: diffDays(g.in, today()) + 1, n: g.nights + 1 }); sub = t('hero.day.sub'); }
  else if (s === 'departure') { head = t('hero.dep'); sub = t('hero.dep.sub'); }
  else { head = t('hero.after', { name: greeting() }); sub = t('hero.after.sub'); }
  return html`<section class="hero-card" style="--photo:url('${photo}')">
    <div class="hero-in">
      <p class="kicker">${g.name && s !== 'after' ? t('hero.hello', { name: g.name }) : lod.name}</p>
      <h1>${head}</h1>
      <p class="hero-sub">${sub}</p>
      ${extra}
      <div class="hero-cta">${primaryAction()}</div>
    </div>
  </section>`;
}

function viewHome() {
  const s = stage();
  const date = focusDate();
  const plan = {
    pre: [prepSec, weatherCard, extrasTeaser, neighboursSec, hostSec, installCard],
    eve: [etaSec, weatherCard, prepSec, hostSec],
    arrival: [arrivalSec, () => skySec(date), extrasTeaser, hostSec],
    staying: [todaySec, wildTodaySec, () => skySec(date), extrasTeaser, essentialsSec, hostSec],
    departure: [() => checklistSec('dep'), onwardSec, extrasTeaser, hostSec],
    after: [memoriesSec, feedbackSec, returnSec],
  }[s];
  return html`${heroCard()}${plan.map((f) => f())}`;
}

/* ================= JOURNEY ================= */
function etaOutput() {
  const r = ROUTES[state.route], v = store.get('eta', '');
  if (!v) return html`<p class="note">${t('eta.hint')}</p>`;
  const [h, m] = v.split(':').map(Number);
  const arriveMin = h * 60 + m + r.buffer + r.drive;
  const set = sun(state.guest.in).set;
  const late = arriveMin > set;
  return html`<div class="eta ${late ? 'warn' : 'ok'}">
    <p class="eta-time">${hhmm(arriveMin)}</p>
    <p>${late ? t('eta.late', { set: hhmm(set) }) : t('eta.ok', { set: hhmm(set) })}</p>
    <p class="note">${t('eta.how', { buffer: r.buffer, drive: fmtMin(r.drive) })}</p>
    <a class="btn btn-ghost btn-sm" href="${wa(hostMessage(`I expect to arrive at about ${hhmm(arriveMin)}.`))}" target="_blank" rel="noopener">${t('eta.send')} ${ic('ph-whatsapp-logo')}</a>
  </div>`;
}

function flightForm(kind) {
  const g = state.guest, f = (store.get('flights', {}) || {})[kind] || {};
  const date = f.date || (kind === 'in' ? g.in : g.out);
  const out = kind === 'out';
  return html`<fieldset class="flight" data-flight="${kind}">
    <legend>${ic(out ? 'ph-airplane-takeoff' : 'ph-airplane-landing')} ${out ? t('fl.out') : t('fl.in')}</legend>
    <div class="grid2">
      <label>${t('fl.date')}<input type="date" name="date" value="${date}"></label>
      <label>${t('fl.no')}<input type="text" name="no" value="${f.no || ''}" maxlength="10" autocomplete="off" placeholder="4Z 123"></label>
      <label>${t('fl.dep')}<input type="time" name="dep" value="${f.dep || ''}"></label>
      ${out ? '' : html`<label>${t('fl.arr')}<input type="time" name="arr" value="${f.arr || ''}"></label>`}
    </div>
    ${f.no ? html`<a class="link" href="https://www.flightradar24.com/data/flights/${f.no.replace(/\s/g, '').toLowerCase()}" target="_blank" rel="noopener">${t('fl.track')} ${ic('ph-arrow-up-right')}</a>` : ''}
  </fieldset>`;
}

function gettingHere() {
  const r = ROUTES[state.route];
  const ap = PLACES.find((p) => p.id === r.airport);
  return html`
    <section class="card">
      <header class="card-head"><h2>${t('rt.title')}</h2></header>
      <div class="chips" role="group">${Object.entries(ROUTES).map(([k, v]) => html`<button type="button" class="chip${state.route === k ? ' on' : ''}" data-act="route" data-arg="${k}">${ic(v.icon)} ${L(v.title)}</button>`)}</div>
      <div class="route">
        <p class="big-time">${r.airport === 'hds' ? t('rt.hds.time') : fmtMin(r.drive)}</p>
        <p>${L(r.summary)}</p>
        <ul class="bullets">${r.tips.map((tip) => html`<li>${L(tip)}</li>`)}</ul>
        <div class="row"><a class="btn btn-ghost btn-sm" href="https://www.google.com/maps/dir/?api=1&origin=${ap.lat},${ap.lon}&destination=${LODGE.lat},${LODGE.lon}" target="_blank" rel="noopener">${t('rt.dir')} ${ic('ph-navigation-arrow')}</a>
        <a class="btn btn-ghost btn-sm" href="${waze(LODGE.lat, LODGE.lon)}" target="_blank" rel="noopener">${t('rt.waze')}</a></div>
      </div>
    </section>
    <section class="card">
      <header class="card-head"><h2>${t('eta.title')}</h2></header>
      <label class="field-row">${r.airport === 'hds' ? t('eta.q.hds') : t('eta.q.drive')}<input type="time" id="eta" value="${store.get('eta', '')}"></label>
      <div id="eta-out">${etaOutput()}</div>
    </section>
    <section class="card">
      <header class="card-head"><h2>${t('fl.title')}</h2></header>
      <p class="note">${t('fl.text')}</p>
      ${flightForm('in')}${flightForm('out')}
      <button type="button" class="btn btn-accent" data-act="ics">${t('fl.ics')} ${ic('ph-calendar-plus')}</button>
      <p class="note">${t('fl.note')}</p>
    </section>
    <section class="card">
      <header class="card-head"><h2>${t('rt.other')}</h2></header>
      <ul class="rows">${PLACES.filter((p) => p.cat === 'air').map((p) => html`<li><div><b>${p.name}</b><small>${p.minLow ? `${p.minLow} ${t('to')} ${p.min} ${t('u.min')}` : fmtMin(p.min)}, ${p.km} km</small></div></li>`)}</ul>
      <p class="note">${t('rt.est')}</p>
    </section>`;
}

function knowSection() {
  return html`<section class="card">
    <header class="card-head"><h2>${t('know.title')}</h2></header>
    <div class="acc">${KNOW.map((k) => {
      const body = typeof k.body === 'object' ? (k.body[lang] || k.body.en) : k.body;
      const links = (k.links && (k.links[lang] || k.links.en)) || [];
      return html`<details id="know-${k.id}"><summary>${ic(k.icon)}<span>${L(k.title)}</span>${ic('ph-caret-down', 'caret')}</summary><div class="acc-body"><p>${body}</p>${links.map(([label, url]) => html`<a class="link" href="${url}" target="_blank" rel="noopener">${label} ${ic('ph-arrow-up-right')}</a>`)}</div></details>`;
    })}</div>
  </section>`;
}

function packSection() {
  const g = state.guest;
  const c = CLIMATE[Number(g.in.slice(5, 7))];
  const ctx = { lo: c.lo, rainDays: c.days, kids: g.kids, driving: true };
  const packed = store.get('packed', {});
  const groups = PACKING.filter((x) => !x.cond || x.cond(ctx));
  const all = groups.flatMap((x) => x.items.filter((i) => !i.cond || i.cond(ctx)));
  const n = all.filter((i) => packed[i.id]).length;
  return html`<section class="card">
    <header class="card-head"><h2>${t('pack.title')}</h2><span class="tag">${t('check.count', { n, total: all.length })}</span></header>
    <p class="note">${t('pack.text', { month: fmtDate(g.in, { month: 'long' }), hi: Math.round(c.hi), lo: Math.round(c.lo) })}</p>
    ${groups.map((x) => html`<h3 class="sub">${L(x.cat)}</h3><ul class="checks">${x.items.filter((i) => !i.cond || i.cond(ctx)).map((i) => html`<li${R(packed[i.id] ? ' class="done"' : '')}>
      <button type="button" class="box" data-act="pack" data-id="${i.id}" role="checkbox" aria-checked="${packed[i.id] ? 'true' : 'false'}" aria-label="${L(i.text)}">${ic('ph-check')}</button><span>${L(i.text)}</span></li>`)}</ul>`)}
  </section>`;
}

function viewJourney() {
  return html`
    <div class="seg" role="group">${[['getting', t('j.getting')], ['know', t('j.know')], ['pack', t('j.pack')]].map(([k, label]) => html`<button type="button" aria-pressed="${String(state.sub.journey === k)}" data-act="jtab" data-arg="${k}">${label}</button>`)}</div>
    ${state.sub.journey === 'getting' ? gettingHere() : state.sub.journey === 'know' ? knowSection() : packSection()}`;
}

/* ================= AROUND ================= */
function openNow(p) {
  if (!p.hours) return null;
  const n = saNow(), h = p.hours[n.dow];
  if (!h) return false;
  return n.min >= h[0] * 60 && n.min < h[1] * 60;
}
function placeCard(p) {
  const open = openNow(p);
  const time = p.minLow ? `${p.minLow} ${t('to')} ${p.min} ${t('u.min')}` : fmtMin(p.min);
  const q = p.lat != null ? null : p.mapQuery;
  return html`<li class="place" id="pl-${p.id}">
    <div class="place-top"><h3>${p.name}</h3>${open === null ? '' : html`<span class="badge ${open ? 'open' : 'closed'}">${open ? t('open') : t('closed')}</span>`}</div>
    <p class="meta">${ic('ph-car')} ${p.approx ? t('approx') + ' ' : ''}${time}, ${p.km} km</p>
    <p>${L(p.note)}</p>
    ${p.hoursText ? html`<p class="meta">${ic('ph-clock')} ${L(p.hoursText)}</p>` : ''}
    <div class="row">
      <a class="btn btn-ghost btn-sm" href="${q ? mapSearch(q) : dir(p.lat, p.lon)}" target="_blank" rel="noopener">${t('directions')} ${ic('ph-navigation-arrow')}</a>
      ${p.lat != null ? html`<a class="btn btn-ghost btn-sm" href="${waze(p.lat, p.lon)}" target="_blank" rel="noopener">${t('rt.waze')}</a>` : ''}
      ${p.phone ? html`<a class="btn btn-ghost btn-sm" href="tel:${p.phone}">${t('call')} ${ic('ph-phone')}</a>` : ''}
    </div>
  </li>`;
}
function gatesCard() {
  const d = focusDate(), mo = Number(d.slice(5, 7)) - 1, [open, close] = GATES[mo];
  return html`<li class="place gates">
    <div class="place-top"><h3>${t('gates.title')}</h3></div>
    <p>${t('gates.text', { month: fmtDate(d, { month: 'long' }), open, close })}</p>
    <p class="note">${t('gates.note')}</p>
    <div class="row"><a class="btn btn-ghost btn-sm" href="https://www.sanparks.org/parks/kruger/" target="_blank" rel="noopener">SANParks ${ic('ph-arrow-up-right')}</a></div>
  </li>`;
}
function placeList() {
  const list = PLACES.filter((p) => p.cat === state.cat && p.cat !== 'air').sort((a, b) => a.min - b.min);
  return html`${state.cat === 'sights' ? gatesCard() : ''}${list.map(placeCard)}`;
}
function viewAround() {
  return html`
    <section class="card map-card">
      <div id="map" class="map" role="region" aria-label="${t('map.label')}"><p class="map-off">${t('map.loading')}</p></div>
      <p class="note">${t('map.credit')}</p>
    </section>
    <div class="chips scroll" role="group">${Object.entries(CATS).filter(([k]) => k !== 'air').map(([k, c]) => html`<button type="button" class="chip${state.cat === k ? ' on' : ''}" data-act="cat" data-arg="${k}">${ic(c.icon)} ${L(c.label)}</button>`)}</div>
    <ul class="places" id="places">${placeList()}</ul>
    <p class="note pad">${t('around.note')}</p>`;
}

let leafletP; let map; let markers = []; let pendingOpen = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletP) return leafletP;
  leafletP = new Promise((res, rej) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    const js = document.createElement('script');
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'; js.onload = () => res(window.L); js.onerror = () => { leafletP = null; rej(new Error('leaflet')); };
    document.head.append(css, js);
  });
  return leafletP;
}
async function initMap() {
  const el = $('#map');
  if (!el) return;
  if (isOffline()) { el.innerHTML = `<p class="map-off">${esc(t('map.off'))}</p>`; return; }
  try {
    const Lf = await loadLeaflet();
    if (!$('#map')) return;
    if (map) { map.remove(); map = null; }
    el.innerHTML = '';
    map = Lf.map(el, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
    Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    map.setView([LODGE.lat, LODGE.lon], 12);
    Lf.marker([LODGE.lat, LODGE.lon], { icon: Lf.divIcon({ className: 'pin pin-home', html: '<i class="ph ph-house-line"></i>', iconSize: [40, 40], iconAnchor: [20, 20] }), zIndexOffset: 1000 }).addTo(map).bindTooltip(LODGES[state.guest.lodge].name);
    paintMarkers();
  } catch (e) {
    el.innerHTML = `<p class="map-off">${esc(t('map.off'))}</p>`;
  }
}
function paintMarkers() {
  if (!map || !window.L) return;
  const Lf = window.L;
  markers.forEach((m) => m.remove());
  markers = [];
  const pts = [[LODGE.lat, LODGE.lon]];
  PLACES.filter((p) => p.cat === state.cat && p.lat != null).forEach((p) => {
    const m = Lf.marker([p.lat, p.lon], { icon: Lf.divIcon({ className: 'pin', html: `<i class="ph ${CATS[p.cat].icon}"></i>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map);
    m.bindTooltip(p.name);
    m.on('click', () => { const li = document.getElementById(`pl-${p.id}`); if (li) li.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    markers.push(m); pts.push([p.lat, p.lon]);
  });
  map.fitBounds(Lf.latLngBounds(pts), { padding: [34, 34], maxZoom: 14 });
}

/* ================= LODGE ================= */
function lodgeInfoView() {
  const g = state.guest, lod = LODGES[g.lodge];
  const photo = `${LODGE.cdn}${lod.photo}?width=900&quality=70`;
  return html`
    <section class="card lodge-hero" style="--photo:url('${photo}')"><div class="hero-in"><p class="kicker">${L(lod.sleeps)}</p><h1>${lod.name}</h1><p class="hero-sub">${range()}</p></div></section>
    <section class="sec">
      <h2>${t('lodge.incl')}</h2>
      <p>${L(lod.includes)}</p>
      <ul class="bullets">${[t('lodge.i1'), t('lodge.i2'), t('lodge.i3')].map((x) => html`<li>${x}</li>`)}</ul>
    </section>
    <section class="sec">
      <h2>${t('lodge.info')}</h2>
      <p class="note">${t('lodge.info.note')}</p>
      <ul class="rows">${LODGE_INFO.map((i) => infoRow(i.id))}</ul>
    </section>
    <section class="sec">
      <h2>${t('lodge.contact')}</h2>
      <ul class="rows">
        <li>${ic('ph-whatsapp-logo', 'lead')}<div><b>WhatsApp</b><small>${LODGE.phone}</small></div><a class="link" href="${wa(hostMessage(''))}" target="_blank" rel="noopener">${t('open.cta')}</a></li>
        <li>${ic('ph-phone', 'lead')}<div><b>${t('call')}</b><small>${LODGE.phoneAlt}</small></div><a class="link" href="tel:${LODGE.phoneAlt.replace(/\s/g, '')}">${t('call')}</a></li>
        <li>${ic('ph-envelope-simple', 'lead')}<div><b>${t('email')}</b><small>${LODGE.email}</small></div><a class="link" href="mailto:${LODGE.email}">${t('email')}</a></li>
        <li>${ic('ph-map-pin', 'lead')}<div><b>${t('address')}</b><small>${LODGE.address}</small></div><a class="link" href="${dir(LODGE.lat, LODGE.lon)}" target="_blank" rel="noopener">${t('directions')}</a></li>
      </ul>
      <p class="note">${t('lodge.signal')}</p>
    </section>`;
}

function settingsView() {
  const theme = store.get('theme', 'auto');
  return html`
    <section class="sec intro"><h1 class="h1">${t('set.title')}</h1></section>
    <section class="card">
      <div class="row between"><span>${t('set.lang')}</span><div class="seg small" role="group" aria-label="${t('set.lang')}">${enabledLangs.map((k) => html`<button type="button" aria-pressed="${String(lang === k)}" data-act="setlang" data-arg="${k}">${LANGS[k].label}</button>`)}</div></div>
      <button type="button" class="link" data-act="lang-menu">${t('lang.more')} ${ic('ph-arrow-right')}</button>
      <div class="row between"><span>${t('set.theme')}</span><div class="seg small" role="group" aria-label="${t('set.theme')}">${[['auto', t('set.auto')], ['light', t('set.day')], ['dark', t('set.dusk')]].map(([k, label]) => html`<button type="button" aria-pressed="${String(theme === k)}" data-act="theme" data-arg="${k}">${label}</button>`)}</div></div>
    </section>
    <section class="card data" id="data">
      <header class="card-head"><h2>${t('d.title')}</h2></header>
      <p class="note">${t('d.intro')}</p>
      <ul class="rows tight" id="data-rows"><li><div><small>${t('map.loading')}</small></div></li></ul>
      <p class="note" id="data-persist"></p>
      <p class="callout">${ic('ph-warning-circle')} ${t('d.warn')}</p>
      <div class="row"><button type="button" class="btn btn-ghost btn-sm" data-act="wipe" id="wipe">${ic('ph-trash')} ${t('d.wipe')}</button></div>
    </section>
    <section class="card">
      <header class="card-head"><h2>${t('off.title')}</h2></header>
      <ul class="rows tight off-list">
        <li>${ic('ph-check-circle', 'lead')}<div><b>${t('off.on')}</b><small>${t('off.on.t')}</small></div></li>
        <li>${ic('ph-wifi-slash', 'lead')}<div><b>${t('off.live')}</b><small>${t('off.live.t')}</small></div></li>
      </ul>
      <p class="note">${t('set.offline')}</p>
    </section>
    <section class="card">
      <div class="row between"><span>${t('set.reset')}</span>${btn('btn-ghost btn-sm', 'data-act="reset"', t('set.resetBtn'))}</div>
      <details class="src"><summary>${t('set.sources')}</summary><ul class="bullets">${SOURCES.map(([label, url]) => html`<li><a class="link" href="${url}" target="_blank" rel="noopener">${label}</a></li>`)}</ul><p class="note">${t('set.sources.note')}</p></details>
      ${MODE.demo ? html`<p class="note">${ic('ph-flask')} ${t('d.demo')} <a class="link" href="/stay/host/">${t('side.host')}</a></p>` : ''}
    </section>`;
}

function viewLodge() {
  const sub = state.sub.lodge;
  const reqs = (store.get('requests', []) || []).filter((q) => q.status === 'prepared' || q.status === 'sent').length;
  const tabs = [['lodge', t('lodge.tab')], ['extras', t('x.tab')], ['settings', t('set.title')]];
  return html`
    <div class="seg" role="group" aria-label="${t('nav.lodge')}">${tabs.map(([k, label]) => html`<button type="button" aria-pressed="${String(sub === k)}" data-act="ltab" data-arg="${k}">${label}${k === 'extras' && reqs ? html`<span class="dot" aria-label="${reqs}">${reqs}</span>` : ''}</button>`)}</div>
    ${sub === 'extras' ? extrasView() : sub === 'settings' ? settingsView() : lodgeInfoView()}`;
}

/* The "saved on this device" list, filled in after the page is drawn because photo sizes are read asynchronously. */
async function fillData() {
  const rows = $('#data-rows');
  if (!rows) return;
  const w = await localSummary();
  const si = await storageInfo();
  const mb = (b) => (b / 1048576 < 0.1 ? '< 0.1' : (b / 1048576).toFixed(1)) + ' MB';
  const done = Object.values(store.get('done', {})).filter(Boolean).length + Object.values(store.get('packed', {})).filter(Boolean).length;
  const fl = store.get('flights', {}) || {};
  const wxt = store.get('wx', null);
  const reqs = (store.get('requests', []) || []).length;
  const item = (icon, label, value) => html`<li>${ic(icon, 'lead')}<div><b>${label}</b><small>${value}</small></div></li>`;
  rows.innerHTML = html`
    ${item('ph-binoculars', t('d.sightings'), `${w.sightings}`)}
    ${item('ph-camera', t('d.photos'), `${w.photos}${w.photos ? `, ${mb(w.bytes)}` : ''}`)}
    ${item('ph-paper-plane-tilt', t('d.requests'), `${reqs}`)}
    ${item('ph-list-checks', t('d.ticks'), `${done}`)}
    ${item('ph-airplane-tilt', t('d.flights'), fl.in || fl.out ? t('d.yes') : t('d.no'))}
    ${item('ph-cloud-sun', t('d.forecast'), wxt ? new Date(wxt.t).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: LODGE.tz }) : t('d.no'))}`.r;
  const p = $('#data-persist');
  if (p) p.textContent = si.persisted ? t('d.persist.yes') : t('d.persist.no');
}
async function wipeAll(el) {
  if (!wipeAll.armed) { wipeAll.armed = true; el.innerHTML = `${ic('ph-trash').r} ${esc(t('d.wipe.sure'))}`; setTimeout(() => { wipeAll.armed = false; if (el.isConnected) el.innerHTML = `${ic('ph-trash').r} ${esc(t('d.wipe'))}`; }, 5000); return; }
  wipeAll.armed = false;
  await wipeWild();
  store.clear(['lang', 'theme', 'welcomed']);
  state.wx = null; state.wxStatus = 'none';
  toast(t('d.wiped'));
  loadWeather();
  render();
}

/* ================= SOS ================= */
function fmtTel(n) {
  if (n.startsWith('0861') && n.length === 10) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  if (n.length === 10) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  if (n.length === 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
  return n;
}
function openSOS() {
  const dlg = $('#sos');
  const near = PLACES.filter((p) => p.cat === 'health').slice(0, 4);
  $('#sos-body').innerHTML = html`
    <h2 id="sos-title">${t('sos.title')}</h2>
    <p class="note">${t('sos.text')}</p>
    ${EMERGENCY.map((g) => html`<h3 class="sub">${L(g.group)}</h3><ul class="callrows">${g.items.map((i) => html`<li><a href="tel:${i.tel}">${ic('ph-phone')}<span>${L(i.name)}</span><b>${fmtTel(i.tel)}</b></a></li>`)}</ul>`)}
    <h3 class="sub">${t('sos.host')}</h3>
    <div class="row"><a class="btn btn-accent btn-sm" href="${wa(hostMessage('I need help.'))}" target="_blank" rel="noopener">WhatsApp ${ic('ph-whatsapp-logo')}</a><a class="btn btn-ghost btn-sm" href="tel:${LODGE.phone.replace(/\s/g, '')}">${t('call')} ${ic('ph-phone')}</a></div>
    <button type="button" class="btn btn-ghost" data-act="share-loc">${ic('ph-crosshair')} ${t('sos.loc')}</button>
    <p class="note" id="loc-msg"></p>
    <h3 class="sub">${t('sos.near')}</h3>
    <ul class="rows">${near.map((p) => html`<li><div><b>${p.name}</b><small>${p.approx ? t('approx') + ' ' : ''}${fmtMin(p.min)}, ${p.km} km</small></div>${p.phone ? html`<a class="link" href="tel:${p.phone}">${t('call')}</a>` : ''}</li>`)}</ul>
    <p class="note">${t('sos.bill')}</p>`.r;
  if (!dlg.open) dlg.showModal();
}

/* ================= Calendar file ================= */
function icsDate(d, hhmmStr, offsetMin = 0) {
  const [h, m] = hhmmStr.split(':').map(Number);
  const utc = Date.parse(`${d}T00:00:00Z`) + (h * 60 + m - LODGE.tzOffset * 60 + offsetMin) * 60000;
  return new Date(utc).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function buildIcs() {
  const g = state.guest, lod = LODGES[g.lodge], fl = store.get('flights', {}) || {};
  const ev = [];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const add = (e) => ev.push(e);
  const day = (d) => d.replace(/-/g, '');
  add({ summary: `${BRAND.short}: ${lod.name}`, start: day(g.in), end: day(addDays(g.out, 1)), allDay: true, loc: LODGE.address, alarm: 15 * 60, desc: `Your stay at ${BRAND.name}.\nHost WhatsApp ${LODGE.phone}.` });
  add({ summary: `One week to ${BRAND.short}: check your list`, start: icsDate(addDays(g.in, -7), '09:00'), end: icsDate(addDays(g.in, -7), '09:15'), alarm: 0, desc: 'Open your My stay app for the checklist, weather and travel plan.' });
  add({ summary: `Tomorrow you arrive at ${BRAND.short}`, start: icsDate(addDays(g.in, -1), '18:00'), end: icsDate(addDays(g.in, -1), '18:15'), alarm: 0, desc: 'Charge your devices, check your arrival time and message your host.' });
  const inn = fl.in || {}, outf = fl.out || {};
  if (inn.dep) {
    const d = inn.date || g.in;
    add({ summary: `Check in online${inn.no ? ` for ${inn.no}` : ''}`, start: icsDate(d, inn.dep, -24 * 60), end: icsDate(d, inn.dep, -24 * 60 + 15), alarm: 0, desc: 'Online check-in usually opens about 24 hours before departure. Check your airline.' });
    add({ summary: `Flight${inn.no ? ` ${inn.no}` : ''} to the Lowveld`, start: icsDate(d, inn.dep), end: icsDate(d, inn.arr || inn.dep, inn.arr ? 0 : 60), alarm: 120, desc: 'Message your host when you land.' });
  }
  if (outf.dep) {
    const d = outf.date || g.out, r = ROUTES[state.route], buf = r.airport === 'hds' ? 90 : 120;
    add({ summary: `Check in online${outf.no ? ` for ${outf.no}` : ''}`, start: icsDate(d, outf.dep, -24 * 60), end: icsDate(d, outf.dep, -24 * 60 + 15), alarm: 0, desc: 'Online check-in usually opens about 24 hours before departure. Check your airline.' });
    add({ summary: `Leave ${BRAND.short} for the airport`, start: icsDate(d, outf.dep, -(buf + r.drive)), end: icsDate(d, outf.dep, -(buf + r.drive) + 15), alarm: 15, desc: `Allows ${buf} minutes at the airport and about ${r.drive} minutes of driving.` });
    add({ summary: `Flight${outf.no ? ` ${outf.no}` : ''} home`, start: icsDate(d, outf.dep), end: icsDate(d, outf.dep, 60), alarm: 120 });
  }
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${BRAND.short} My stay//EN`, 'CALSCALE:GREGORIAN'];
  ev.forEach((e, i) => {
    lines.push('BEGIN:VEVENT', `UID:${BRAND.short.toLowerCase().replace(/[^a-z0-9]/g, '')}-${g.in}-${i}@mystay`, `DTSTAMP:${stamp}`);
    if (e.allDay) lines.push(`DTSTART;VALUE=DATE:${e.start}`, `DTEND;VALUE=DATE:${e.end}`); else lines.push(`DTSTART:${e.start}`, `DTEND:${e.end}`);
    lines.push(`SUMMARY:${icsEsc(e.summary)}`);
    if (e.loc) lines.push(`LOCATION:${icsEsc(e.loc)}`);
    if (e.desc) lines.push(`DESCRIPTION:${icsEsc(e.desc)}`);
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(e.summary)}`, `TRIGGER:-PT${e.alarm}M`, 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function downloadIcs() {
  const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `${BRAND.short.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-stay.ics`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('toast.ics'));
}

/* ================= Chrome, rendering, events ================= */
const TABS = ['home', 'journey', 'around', 'wild', 'lodge'];
const TAB_ICON = { home: 'ph-house-line', journey: 'ph-airplane-tilt', around: 'ph-map-trifold', wild: 'ph-binoculars', lodge: 'ph-bed' };
const SUBS = { journey: ['getting', 'know', 'pack'], wild: ['explore', 'passport', 'memories'], lodge: ['lodge', 'extras', 'settings'] };

function chrome() {
  const next = enabledLangs[(enabledLangs.indexOf(lang) + 1) % enabledLangs.length];
  const brand = BRAND.logo
    ? html`<img src="${BRAND.logo}" alt="${BRAND.name}" width="400" height="388">`
    : html`<span class="wordmark">${BRAND.name}</span>`;
  $('#top').innerHTML = html`<a class="brand" href="#/home" aria-label="${BRAND.short}, ${t('nav.home')}">${brand}</a>
    <div class="top-actions">
      ${MODE.demo && !MODE.embed ? html`<button type="button" class="pill pill-demo" data-act="demo" aria-label="${t('demo.open')}">${ic('ph-sliders-horizontal')} ${t('demo.pill')}</button>` : ''}
      <button type="button" class="pill pill-lang" data-act="lang-menu" aria-haspopup="dialog" aria-label="${t('lang.menu', { lang: LANGS[lang].label })}">${ic('ph-translate')} ${lang.toUpperCase()} ${ic('ph-caret-down', 'caret')}</button>
      <button type="button" class="pill pill-sos" data-act="sos" aria-label="${t('sos.aria')}">${ic('ph-lifebuoy')} ${t('sos')}</button>
    </div>`.r;
  $('#tabs').innerHTML = TABS.map((k) => html`<a href="#/${k}" ${R(state.tab === k ? 'aria-current="page"' : '')}>${ic(TAB_ICON[k])}<span>${t(`nav.${k}`)}</span></a>`).map((x) => x.r).join('');
  $('#tabs').setAttribute('aria-label', t('nav.label'));
  const net = $('#net');
  const off = isOffline();
  net.hidden = !off;
  net.innerHTML = off ? html`${ic('ph-wifi-slash')} <span>${t(state.sim ? 'net.sim' : 'net.off')}</span>`.r : '';
}
function render(keepScroll = true) {
  const y = window.scrollY;
  chrome();
  const views = { home: viewHome, journey: viewJourney, around: viewAround, wild: viewWild, lodge: viewLodge };
  $('#view').innerHTML = views[state.tab]().r;
  document.documentElement.lang = lang;
  document.title = t('app.title');
  if (state.tab === 'around') initMap();
  else if (map) { map.remove(); map = null; markers = []; }
  tickCountdown();
  paintSide();
  wildAfterRender();
  if (state.tab === 'lodge' && state.sub.lodge === 'settings') fillData();
  if (keepScroll) window.scrollTo(0, y);
  if (pendingOpen) {
    const d = document.getElementById(`know-${pendingOpen}`);
    pendingOpen = null;
    if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -72); }
  }
}
function go(tab, sub) {
  state.tab = TABS.includes(tab) ? tab : 'home';
  if (sub && SUBS[state.tab] && SUBS[state.tab].includes(sub)) state.sub[state.tab] = sub;
  const v = $('#view');
  v.classList.add('enter');
  clearTimeout(go.t);
  go.t = setTimeout(() => v.classList.remove('enter'), 1200);
  render(false);
  if (!pendingOpen) window.scrollTo({ top: 0, behavior: 'instant' });
}
function route() {
  const [tab, sub] = (location.hash || '#/home').replace('#/', '').split('/');
  go(TABS.includes(tab) ? tab : 'home', sub);
}
const goto = (arg) => { if (location.hash === `#/${arg}`) route(); else location.hash = `#/${arg}`; };
const setSub = (tab, key) => { state.sub[tab] = key; try { history.replaceState(null, '', `#/${tab}/${key}`); } catch (e) { /* ignore */ } render(false); window.scrollTo({ top: 0, behavior: 'instant' }); };

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2800);
}
function tickCountdown() {
  const box = $('[data-count]');
  if (!box) return;
  const c = countParts();
  $$('[data-c]', box).forEach((n) => { n.textContent = c[n.dataset.c]; });
}
setInterval(tickCountdown, 20000);

/* Desktop side panel: a QR code so the owner can open the guest app on a phone. */
function paintSide() {
  const side = $('#side');
  if (!side || MODE.embed) return;
  side.innerHTML = html`<p class="side-kicker">${t('side.kicker')}</p><h2>${t('side.title')}</h2><p>${t('side.text')}</p>
    <div id="qr" class="qr" aria-label="QR code"></div>
    <ul class="side-list">${['side.1', 'side.2', 'side.3', 'side.4', 'side.5'].map((k) => html`<li>${ic('ph-check')}${t(k)}</li>`)}</ul>
    <a class="link" href="/stay/host/">${t('side.host')} ${ic('ph-arrow-right')}</a>`.r;
  const box = $('#qr');
  if (box && window.QRCode && !box.firstChild) { try { new window.QRCode(box, { text: location.href.split('#')[0], width: 132, height: 132, correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) { /* ignore */ } }
}
if (window.matchMedia('(min-width: 1100px)').matches && !MODE.embed) {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = paintSide;
  document.head.append(s);
}

/* ---------- Demo: controls, and a safe preview instead of messaging a real person ---------- */
function demoSheet() {
  const cur = today();
  const g = state.guest;
  openSheet(html`
    <h2 id="sheet-title">${t('demo.title')}</h2>
    <p class="note">${t('demo.text')}</p>
    <h3 class="sub">${t('demo.jump')}</h3>
    <div class="chips" role="group">${STAGES.map((k) => { const d = stageDate(k, g); return html`<button type="button" class="chip${cur === d ? ' on' : ''}" data-act="at" data-arg="${d}" aria-pressed="${String(cur === d)}">${t(`demo.${k}`)}</button>`; })}</div>
    <h3 class="sub">${t('demo.data')}</h3>
    <div class="row">
      <button type="button" class="btn btn-ghost btn-sm" data-act="demo-seed">${ic('ph-binoculars')} ${t('demo.seed')}</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="welcome">${ic('ph-arrow-counter-clockwise')} ${t('demo.welcome')}</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="demo-sim" aria-pressed="${String(state.sim)}">${ic('ph-wifi-slash')} ${t(state.sim ? 'demo.sim.off' : 'demo.sim')}</button>
    </div>
    <p class="note">${t('demo.sim.note')}</p>
    <p class="note">${t('demo.data.note')}</p>
    <div class="row">
      <button type="button" class="btn btn-ghost btn-sm" data-act="demo-reset">${ic('ph-eraser')} ${t('demo.reset')}</button>
      <a class="btn btn-ghost btn-sm" href="/stay/host/">${t('side.host')} ${ic('ph-arrow-right')}</a>
    </div>
    <p class="note">${t('demo.reset.note')}</p>`);
}
async function demoReset() {
  store.clear(['lang', 'theme']);
  try { await clearPhotos(); } catch (e) { /* none */ }
  closeSheet();
  state.at = MODE.demo && isDate(params.get('at')) ? params.get('at') : null;
  state.wx = null; state.wxStatus = 'none';
  toast(t('demo.reset.done'));
  loadWeather();
  render();
}
function guard(url) {
  let kind = 'wa', text = '';
  if (url.startsWith('mailto:')) kind = 'mail';
  else if (url.startsWith('tel:')) kind = 'tel';
  try { const u = new URL(url); text = u.searchParams.get('text') || u.searchParams.get('body') || ''; } catch (e) { /* none */ }
  if (kind === 'mail' && !text) { const m = /[?&]body=([^&]*)/.exec(url); if (m) text = decodeURIComponent(m[1]); }
  const label = { wa: 'WhatsApp', mail: t('email'), tel: t('call') }[kind];
  openSheet(html`
    <div class="sp-head"><span class="lead-ic big">${ic('ph-flask')}</span><div><p class="kicker-sm">${t('demo.pill')}</p><h2 id="guard-title">${t('guard.title')}</h2></div></div>
    <p>${t(`guard.${kind}`, { host: LODGE.host })}</p>
    ${text ? html`<blockquote class="msg-preview">${text}</blockquote>` : ''}
    ${kind === 'tel' ? html`<p class="note">${url.replace('tel:', '')}</p>` : ''}
    <div class="row">
      <button type="button" class="btn btn-accent" data-close>${t('guard.ok')}</button>
    </div>`, 'guard');
}
bus.link = (url) => { if (MODE.demo) guard(url); else window.open(url, '_blank', 'noopener'); };
bus.render = render; bus.toast = toast;
/* In demo mode, links that would message or call a real person show a preview first. */
document.addEventListener('click', (e) => {
  if (!MODE.demo) return;
  const a = e.target.closest('a[href]');
  if (!a || a.hasAttribute('data-real')) return;
  if (/^(https:\/\/wa\.me\/|mailto:|tel:)/.test(a.getAttribute('href'))) { e.preventDefault(); guard(a.getAttribute('href')); }
}, true);

/* ---------- Events ---------- */
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, arg = el.dataset.arg, id = el.dataset.id;
  if (await wildAct(act, arg, id, el)) return;
  if (await extrasAct(act, arg, id, el)) return;
  const flip = (key) => { const o = store.get(key, {}); o[id] = !o[id]; store.set(key, o); };
  switch (act) {
    case 'tab': goto(arg); break;
    case 'goto': closeSheet(); goto(arg); break;
    case 'scroll': { const n = document.getElementById(arg); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
    case 'jtab': setSub('journey', arg); break;
    case 'ltab': setSub('lodge', arg); break;
    case 'lang': case 'setlang': setLang(act === 'lang' ? enabledLangs[(enabledLangs.indexOf(lang) + 1) % enabledLangs.length] : arg); state.guest = readGuest(); render(); break;
    case 'lang-menu': openSheet(html`<h2 id="sheet-title">${t('set.lang')}</h2>
      <p class="kicker-sm">${t('lang.ready')}</p>
      <div class="chips" role="group" aria-label="${t('lang.ready')}">${enabledLangs.map((k) => html`<button type="button" class="chip${lang === k ? ' on' : ''}" data-act="setlang" data-arg="${k}" data-close>${LANGS[k].label}</button>`)}</div>
      <p class="kicker-sm lang-more">${t('lang.soon')}</p>
      <div class="chips" role="group" aria-label="${t('lang.soon')}">${Object.entries(PLANNED).map(([k, label]) => html`<button type="button" class="chip chip-soon" data-act="lang-soon" data-arg="${label}" lang="${k}">${label}</button>`)}</div>
      <p class="note" id="lang-note" role="status">${t('lang.soon.note')}</p>`); break;
    case 'lang-soon': { const n = $('#lang-note'); if (n) n.textContent = t('lang.soon.pick', { lang: arg }); break; }
    case 'theme': store.set('theme', arg); applyTheme(); render(); break;
    case 'sos': openSOS(); break;
    case 'tick': flip('done'); render(); break;
    case 'checks-more': showAllChecks = !showAllChecks; render(); break;
    case 'pack': flip('packed'); render(); break;
    case 'route': state.route = arg; store.set('route', arg); render(); break;
    case 'cat': state.cat = arg; $$('.chips [data-act="cat"]').forEach((c) => c.classList.toggle('on', c.dataset.arg === arg)); $('#places').innerHTML = placeList().r; paintMarkers(); break;
    case 'ics': downloadIcs(); break;
    case 'at': state.at = arg; closeSheet(); render(); break;
    case 'welcome': closeSheet(); showWelcome(); break;
    case 'demo': demoSheet(); break;
    case 'demo-seed': await seedDemo(true); closeSheet(); toast(t('demo.seeded')); render(); break;
    case 'demo-reset': demoReset(); break;
    case 'demo-sim': state.sim = !state.sim; closeSheet(); await loadWeather(); render(); toast(t(state.sim ? 'net.sim' : 'demo.sim.back')); break;
    case 'maps': openLink(mapSearch('Hoedspruit, Limpopo')); break;
    case 'whatsapp': openLink(wa(hostMessage('Here is my expected arrival time: '))); break;
    case 'whatsapp-gate': openLink(wa(hostMessage('Could you confirm how I get through the estate gate on arrival, and whether you need my ID details beforehand?'))); break;
    case 'whatsapp-thanks': openLink(wa(hostMessage('Thank you for a wonderful stay!'))); break;
    case 'know': pendingOpen = arg; state.sub.journey = 'know'; if (location.hash === '#/journey') render(); else location.hash = '#/journey'; break;
    case 'install': doInstall(); break;
    case 'install-dismiss': store.set('installDismissed', true); render(); break;
    case 'reset': store.set('done', {}); store.set('packed', {}); toast(t('toast.reset')); render(); break;
    case 'wipe': wipeAll(el); break;
    case 'share-loc': shareLocation(); break;
    default: break;
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'eta') { store.set('eta', e.target.value); $('#eta-out').innerHTML = etaOutput().r; return; }
  const fs = e.target.closest('[data-flight]');
  if (fs) {
    const f = store.get('flights', {}) || {};
    const k = fs.dataset.flight;
    f[k] = f[k] || {};
    f[k][e.target.name] = e.target.value;
    store.set('flights', f);
  }
});
for (const id of ['sos', 'sheet', 'guard']) {
  const d = $(`#${id}`);
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
}

function shareLocation() {
  const msg = $('#loc-msg');
  if (!navigator.geolocation) { msg.textContent = t('sos.loc.no'); return; }
  msg.textContent = t('sos.loc.wait');
  navigator.geolocation.getCurrentPosition((p) => {
    const url = `https://maps.google.com/?q=${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`;
    openLink(wa(hostMessage(`I need help. My location: ${url}`)));
    msg.textContent = '';
  }, () => { msg.textContent = t('sos.loc.no'); }, { enableHighAccuracy: true, timeout: 12000 });
}

/* Install as an app */
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.deferredInstall = e; });
async function doInstall() {
  if (state.deferredInstall) { state.deferredInstall.prompt(); await state.deferredInstall.userChoice; state.deferredInstall = null; return; }
  toast(t('install.ios'));
}

/* Theme */
function applyTheme() {
  const forced = MODE.embed && ['light', 'dark'].includes(params.get('theme')) ? params.get('theme') : null;
  const th = forced || store.get('theme', 'auto');
  if (th === 'auto') root.removeAttribute('data-theme'); else root.dataset.theme = th;
}
/* Property branding (accent colour). Only the default accent needs no override. */
function applyBrand() {
  const css = accentCss(BRAND.accent);
  if (!css) return;
  const s = document.createElement('style');
  s.id = 'brand-vars'; s.textContent = css;
  document.head.append(s);
}

/* Offline and online */
window.addEventListener('online', () => { state.online = true; loadWeather(); render(); });
window.addEventListener('offline', () => { state.online = false; loadWeather(); render(); });

/* Welcome screen when the personal link is first opened */
function showWelcome() {
  const g = state.guest, lod = LODGES[g.lodge];
  const el = document.createElement('div');
  el.className = 'welcome';
  el.style.setProperty('--photo', `url('${LODGE.cdn}${BRAND.welcomePhoto}?width=1000&quality=75')`);
  el.innerHTML = html`<div class="welcome-in">
    ${BRAND.logo ? html`<img class="welcome-logo" src="${BRAND.logo}" alt="${BRAND.name}" width="120" height="116">` : html`<p class="wordmark">${BRAND.name}</p>`}
    <h1>${g.name ? t('welcome.hi', { name: g.name }) : t('welcome.hiNo')}</h1>
    <p>${t('welcome.sub', { lodge: lod.name })}</p>
    <p class="welcome-meta">${lod.name}, ${range()}</p>
    <button type="button" class="btn btn-accent" id="welcome-go">${t('welcome.cta')} ${ic('ph-arrow-right')}</button>
    ${g.demo ? html`<p class="welcome-demo">${t('welcome.demo')}</p>` : ''}
  </div>`.r;
  document.body.append(el);
  $('#welcome-go', el).addEventListener('click', () => { el.classList.add('out'); setTimeout(() => el.remove(), 500); store.set('welcomed', true); });
  $('#welcome-go', el).focus();
}

/* Start */
applyTheme();
applyBrand();
initWild();
initExtras();
window.addEventListener('hashchange', route);
(async () => {
  if (MODE.demo) {
    /* Demo links can start with sample sightings (seed=1), keep the guest's own or add samples only if empty (seed=auto), or start clean (fresh=1). */
    const sd = params.get('seed');
    try {
      if (sd === '1' || (sd === 'auto' && passportStats().sightings === 0)) await seedDemo(true);
      else if (params.get('fresh') === '1') await wipeWild();
    } catch (e) { /* sample photos are optional */ }
  }
  route();
  loadWeather();
  if (!MODE.embed && (!store.get('welcomed', false) || params.get('welcome') === '1')) showWelcome();
  /* A guest on a real link is nudged to keep their photos: ask the browser to protect storage once they have used the app. */
})();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/stay/sw.js').catch(() => { /* offline support is optional */ });
