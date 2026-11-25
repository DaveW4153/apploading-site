/* The guest assistant: an "ask anything" box answered from the lodge's own guide.
   It appears only when the server says the assistant is switched on for this lodge (see api/stay/ask.js),
   so a lodge without it sees no change. The question goes to the server with the lodge, the language and the
   stage of the stay. The guest's name, dates and link are never sent. */
import { PROPERTY } from './property/index.js';
import { LODGE } from './data.js';
import { html, ic, $, R } from './ui.js';
import { t, lang, stage, today, wa, hostMessage, openLink, bus } from './core.js';
import { sunTimes, hhmm } from './sun.js';
import { openSheet } from './sheet.js';

const ENDPOINT = '/api/stay/ask/';
const MAX = 300;
const a = { enabled: false, stores: false, busy: false, last: null };

/* Ask the server once whether the assistant is on. Any failure leaves it off. */
export async function initAsk() {
  try {
    const r = await fetch(`${ENDPOINT}?p=${encodeURIComponent(PROPERTY.id)}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const d = await r.json();
    a.enabled = d.enabled === true; a.stores = d.stores === true;
    if (a.enabled) bus.render();
  } catch (e) { /* no server, or offline: the box stays hidden */ }
  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'ask-q' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
}

/* The entry point on the home screen. */
export const askTeaser = () => (a.enabled ? html`<section class="sec ask">
    <button type="button" class="ask-open" data-act="ask-open">
      <span class="lead-ic">${ic('ph-chat-circle-dots')}</span>
      <span class="ask-open-text"><b>${t('ask.teaser')}</b><small>${t('ask.teaser.sub', { host: LODGE.host })}</small></span>
      ${ic('ph-caret-right', 'dim')}
    </button>
  </section>` : '');

function sheet() {
  openSheet(html`<h2 id="sheet-title">${t('ask.title')}</h2>
    <p class="note">${t(a.stores ? 'ask.privacy.stores' : 'ask.privacy')}</p>
    <div class="ask-form">
      <label class="sr" for="ask-q">${t('ask.title')}</label>
      <textarea id="ask-q" rows="2" maxlength="${MAX}" placeholder="${t('ask.ph')}" enterkeyhint="send"></textarea>
      <button type="button" class="btn btn-accent" data-act="ask-send">${t('ask.send')} ${ic('ph-paper-plane-tilt')}</button>
    </div>
    <div class="chips ask-ideas" role="group" aria-label="${t('ask.ideas')}">${['ask.s1', 'ask.s2', 'ask.s3'].map((k) => html`<button type="button" class="chip" data-act="ask-idea" data-arg="${t(k)}">${t(k)}</button>`)}</div>
    <div id="ask-out" class="ask-out" role="status" aria-live="polite">${a.last ? answerView(a.last) : ''}</div>`);
  const q = $('#ask-q'); if (q) q.focus();
}

const hostButton = (question) => html`<button type="button" class="btn btn-ghost btn-sm" data-act="ask-host" data-arg="${question}">${t('ask.host', { host: LODGE.host })} ${ic('ph-whatsapp-logo')}</button>`;

function answerView({ question, answer, askHost, problem }) {
  return html`<p class="kicker-sm">${t('ask.you')}</p>
    <p class="ask-q-echo">${question}</p>
    <div class="ask-answer${problem ? ' problem' : ''}">${answer}</div>
    ${askHost ? hostButton(question) : ''}
    ${problem ? '' : html`<p class="note">${ic('ph-sparkle')} ${t('ask.ai', { host: LODGE.host })}</p>`}`;
}

/* Sunrise and sunset at the lodge today, so the assistant can answer "will we arrive before dark". */
function sunToday() {
  try { const s = sunTimes(today(), LODGE.lat, LODGE.lon, LODGE.tzOffset); return { sunrise: hhmm(s.rise), sunset: hhmm(s.set) }; } catch (e) { return {}; }
}

function show(view) { const o = $('#ask-out'); if (o) o.innerHTML = view.r !== undefined ? view.r : view; }

async function send(preset) {
  const box = $('#ask-q');
  const question = String(preset || (box && box.value) || '').replace(/\s+/g, ' ').trim().slice(0, MAX);
  if (question.length < 2 || a.busy) return;
  if (navigator.onLine === false) { show(html`<p class="ask-answer problem">${t('ask.offline')}</p>`); return; }
  a.busy = true;
  const sendBtn = $('[data-act="ask-send"]'); if (sendBtn) sendBtn.disabled = true;
  show(html`<p class="ask-busy">${ic('ph-circle-notch', 'spin')} ${t('ask.busy')}</p>`);
  let result;
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: PROPERTY.id, q: question, lang, stage: stage(), ...sunToday() }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && typeof d.answer === 'string') result = { question, answer: d.answer, askHost: d.askHost === true };
    else if (r.status === 429 && d.error === 'slow_down') result = { question, answer: t('ask.slow'), askHost: false, problem: true };
    else result = { question, answer: t('ask.unavailable', { host: LODGE.host }), askHost: true, problem: true };
  } catch (e) {
    result = { question, answer: t('ask.unavailable', { host: LODGE.host }), askHost: true, problem: true };
  }
  a.busy = false; a.last = result;
  if (sendBtn) sendBtn.disabled = false;
  if (box && !result.problem) box.value = '';
  show(answerView(result));
}

/* Actions from the shared click handler in app.js. Returns true when it handled the click. */
export async function askAct(act, arg) {
  switch (act) {
    case 'ask-open': sheet(); return true;
    case 'ask-send': await send(); return true;
    case 'ask-idea': { const box = $('#ask-q'); if (box) box.value = arg; await send(arg); return true; }
    /* The message to the host is in English with the guest's own question quoted, and they can edit it before sending. */
    case 'ask-host': openLink(wa(hostMessage(`I have a question: ${arg}`))); return true;
    default: return false;
  }
}
