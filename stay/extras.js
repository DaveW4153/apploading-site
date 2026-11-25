/* Extras: things a guest can ask their host for. Every extra is a request. Nothing is booked, paid or confirmed in the app:
   the request opens in the guest's own WhatsApp or email, and the host confirms price and availability there. */
import { EXTRAS, LODGE } from './data.js';
import { html, ic } from './ui.js';
import { MODE, store, bus, state, t, L, fmtDate, fmtDateEn, stage, hostMessage, wa, addDays } from './core.js';
import { openSheet, closeSheet } from './sheet.js';

const EX = Object.fromEntries(EXTRAS.map((e) => [e.id, e]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clean = (s, n = 120) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const requests = () => store.get('requests', []);
export const requestCount = () => requests().filter((r) => r.status === 'prepared' || r.status === 'sent').length;

export const suggestedExtras = (n = 2) => {
  const s = stage();
  return EXTRAS.filter((e) => e.stages.includes(s)).slice(0, n);
};

const priceText = (e) => (e.price ? `R ${e.price.amount} ${L(e.price.unit)}` : t('x.price.host'));
const whenText = (e) => (e.when ? L(e.when) : t('x.when.host'));

function extraRow(e) {
  return html`<li><button type="button" class="x-row" data-act="extra" data-id="${e.id}">
    <span class="lead-ic">${ic(e.icon)}</span>
    <span class="sp-main"><b>${L(e.title)}</b><small>${L(e.gets)}</small></span>
    ${ic('ph-caret-right', 'dim')}
  </button></li>`;
}

function statusChip(r) { return html`<span class="status ${r.status}">${t(`x.s.${r.status}`)}</span>`; }

function requestRow(r) {
  const e = EX[r.ex];
  if (!e) return '';
  return html`<li class="req">
    <div class="req-top"><b>${L(e.title)}</b>${statusChip(r)}</div>
    <p class="note">${r.date ? fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' }) : t('x.anytime')}, ${r.guests} ${t('x.guests.short')}${r.demo ? `. ${t('x.demo.tag')}` : ''}</p>
    <div class="row">
      ${r.status === 'prepared' ? html`<button type="button" class="btn btn-accent btn-sm" data-act="req-open" data-id="${r.id}">${t('x.finish')}</button>` : ''}
      ${r.status === 'sent' ? html`<button type="button" class="btn btn-ghost btn-sm" data-act="req-confirm" data-id="${r.id}">${ic('ph-check')} ${t('x.mark.confirmed')}</button>` : ''}
      ${r.status === 'prepared' || r.status === 'sent' || r.status === 'confirmed' ? html`<button type="button" class="link" data-act="req-cancel" data-id="${r.id}">${t('x.cancel')}</button>` : ''}
      ${r.status === 'cancelled' ? html`<button type="button" class="link" data-act="req-remove" data-id="${r.id}">${t('x.remove')}</button>` : ''}
    </div>
  </li>`;
}

export function extrasView() {
  const list = requests();
  return html`
    <section class="sec intro">
      <h1 class="h1">${t('x.title')}</h1>
      <p>${t('x.intro')}</p>
      <p class="callout">${ic('ph-handshake')} ${t('x.honest')}</p>
    </section>
    ${list.length ? html`<section class="sec"><h2>${t('x.yours')}</h2><ul class="reqs">${[...list].sort((a, b) => b.ts - a.ts).map(requestRow)}</ul><p class="note">${t('x.status.note')}</p></section>` : ''}
    <section class="sec">
      <h2>${t('x.menu')}</h2>
      <ul class="x-list">${EXTRAS.map(extraRow)}</ul>
      <p class="note">${t('x.sample')}</p>
    </section>`;
}

/* A short list for the home screen, chosen for the guest's stage. */
export function extrasTeaser() {
  const picks = suggestedExtras(2);
  if (!picks.length) return '';
  return html`<section class="sec">
    <div class="sec-head"><h2>${t('x.home')}</h2><button type="button" class="link" data-act="goto" data-arg="lodge/extras">${t('x.all')} ${ic('ph-arrow-right')}</button></div>
    <ul class="x-list">${picks.map(extraRow)}</ul>
  </section>`;
}

/* ---------- The request sheet ---------- */
function buildMessage(e, v) {
  const when = { morning: 'morning', afternoon: 'afternoon', evening: 'evening' };
  const lines = [`I would like to ask about ${e.ask}.`];
  if (v.date) lines.push(`Date: ${fmtDateEn(v.date)}`);
  if (v.time && when[v.time]) lines.push(`Time: ${when[v.time]}`);
  lines.push(`Guests: ${v.guests}`);
  if (v.flight) lines.push(`Flight: ${v.flight}`);
  if (v.note) lines.push(`Notes: ${v.note}`);
  lines.push('', 'Please let me know what is available and the price. Thank you!');
  return hostMessage(lines.join('\n'));
}

export function openExtra(id) {
  const e = EX[id];
  if (!e) return;
  const g = state.guest;
  const f = new Set(e.fields);
  const people = g.adults + g.kids;
  openSheet(html`
    <div class="sp-head"><span class="lead-ic big">${ic(e.icon)}</span><div><p class="kicker-sm">${t('x.kind')}</p><h2 id="sheet-title">${L(e.title)}</h2></div></div>
    <p>${L(e.gets)}</p>
    <ul class="rows tight">
      <li>${ic('ph-tag', 'lead')}<div><b>${t('x.price')}</b><small>${priceText(e)}</small></div></li>
      <li>${ic('ph-calendar-check', 'lead')}<div><b>${t('x.when')}</b><small>${whenText(e)}</small></div></li>
    </ul>
    <h3 class="sub">${t('x.next')}</h3>
    <ol class="steps"><li>${t('x.next1')}</li><li>${t('x.next2')}</li><li>${t('x.next3')}</li></ol>
    <p class="note">${t('x.nopay')}</p>
    <form class="x-form" data-form="extra" data-ex="${e.id}" novalidate>
      <h3 class="sub">${t('x.form')}</h3>
      <div class="grid2">
        ${f.has('date') ? html`<label>${t('x.date')}<input type="date" name="date" value="${stage() === 'staying' || stage() === 'arrival' ? (stage() === 'arrival' ? g.in : addDays(g.in, 1)) : g.in}" min="${addDays(g.in, -1)}" max="${addDays(g.out, 1)}"></label>` : ''}
        ${f.has('time') ? html`<label>${t('x.time')}<select name="time"><option value="any">${t('x.time.any')}</option><option value="morning">${t('x.time.morning')}</option><option value="afternoon">${t('x.time.afternoon')}</option><option value="evening">${t('x.time.evening')}</option></select></label>` : ''}
        ${f.has('guests') ? html`<label>${t('x.guests')}<input type="number" name="guests" min="1" max="16" value="${people}" inputmode="numeric"></label>` : ''}
        ${f.has('flight') ? html`<label>${t('x.flight')}<input type="text" name="flight" maxlength="10" autocomplete="off" placeholder="4Z 123"></label>` : ''}
      </div>
      ${f.has('note') ? html`<label class="field-row">${t('x.note')}<input type="text" name="note" maxlength="120" autocomplete="off" placeholder="${t('x.note.ph')}"></label>` : ''}
      <button type="submit" class="btn btn-accent">${ic('ph-paper-plane-tilt')} ${t('x.prepare')}</button>
    </form>`);
}

function readySheet(r) {
  const e = EX[r.ex];
  const mail = `mailto:${LODGE.email}?subject=${encodeURIComponent(`${L(e.title)} (${state.guest.name || 'guest'})`)}&body=${encodeURIComponent(r.msg)}`;
  openSheet(html`
    <div class="sp-head"><span class="lead-ic big">${ic('ph-paper-plane-tilt')}</span><div><p class="kicker-sm">${L(e.title)}</p><h2 id="sheet-title">${t('x.ready')}</h2></div></div>
    <p class="note">${t('x.ready.note')}</p>
    <label class="field-row">${t('x.msg')}<textarea rows="8" data-msg="${r.id}">${r.msg}</textarea></label>
    <div class="row">
      <a class="btn btn-accent" data-wa="${r.id}" href="${wa(r.msg)}" target="_blank" rel="noopener" data-act="req-sent" data-id="${r.id}">${t('x.send.wa')} ${ic('ph-whatsapp-logo')}</a>
      <a class="btn btn-ghost" data-mail="${r.id}" href="${mail}" data-act="req-sent" data-id="${r.id}">${t('x.send.mail')} ${ic('ph-envelope-simple')}</a>
    </div>
    <p class="note">${MODE.demo ? t('x.ready.demo') : t('x.ready.after')}</p>
    <button type="button" class="link" data-act="req-later" data-id="${r.id}">${t('x.later')}</button>`);
}

export async function extrasAct(act, arg, id) {
  const list = requests();
  const r = list.find((q) => q.id === id);
  const save = () => store.set('requests', list);
  switch (act) {
    case 'extra': openExtra(id); return true;
    case 'req-open': if (r) readySheet(r); return true;
    case 'req-sent': if (r && r.status === 'prepared') { r.status = 'sent'; r.sentAt = Date.now(); save(); setTimeout(() => bus.render(), 300); } return false; // the link itself still opens
    case 'req-later': closeSheet(); bus.toast(t('x.saved.later')); bus.render(); return true;
    case 'req-confirm': if (r) { r.status = 'confirmed'; save(); bus.render(); } return true;
    case 'req-cancel': if (r) { r.status = 'cancelled'; save(); bus.render(); } return true;
    case 'req-remove': store.set('requests', list.filter((q) => q.id !== id)); bus.render(); return true;
    default: return false;
  }
}

export function initExtras() {
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form="extra"]');
    if (!form) return;
    e.preventDefault();
    const ex = EX[form.dataset.ex];
    const v = { date: form.elements.date ? form.elements.date.value : '', time: form.elements.time ? form.elements.time.value : '', guests: Math.min(16, Math.max(1, parseInt(form.elements.guests ? form.elements.guests.value : state.guest.adults + state.guest.kids, 10) || 1)), flight: form.elements.flight ? clean(form.elements.flight.value, 10) : '', note: form.elements.note ? clean(form.elements.note.value) : '' };
    const rec = { id: uid(), ex: ex.id, ...v, msg: buildMessage(ex, v), status: 'prepared', ts: Date.now(), demo: MODE.demo };
    const list = requests(); list.push(rec); store.set('requests', list);
    readySheet(rec);
    bus.render();
  });
  document.addEventListener('input', (e) => {
    const m = e.target.closest('[data-msg]');
    if (!m) return;
    const id = m.dataset.msg;
    const list = requests(); const r = list.find((q) => q.id === id);
    if (!r) return;
    r.msg = m.value; store.set('requests', list);
    const a = document.querySelector(`[data-wa="${id}"]`); if (a) a.href = wa(m.value);
    const b = document.querySelector(`[data-mail="${id}"]`); if (b) b.href = `mailto:${LODGE.email}?subject=${encodeURIComponent(`${L(EX[r.ex].title)} (${state.guest.name || 'guest'})`)}&body=${encodeURIComponent(m.value)}`;
  });
}
