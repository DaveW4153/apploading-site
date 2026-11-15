/* apploading.co: shared behaviour. No dependencies. */
(() => {
  'use strict';
  const doc = document;
  doc.documentElement.classList.add('js');
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Measurement integration point ----------
     Nothing is sent anywhere until a provider is configured below.
     To switch it on: set provider to 'plausible', 'ga4' or 'datalayer', add that provider's own
     script tag to the pages (or its container snippet), and publish. Events carry only an event
     name, the page path and a short label. Form contents and personal details are never included. */
  const ANALYTICS = { provider: 'none' };
  function track(name, props) {
    const p = Object.assign({ page: location.pathname }, props || {});
    try {
      doc.dispatchEvent(new CustomEvent('apploading:track', { detail: { name, props: p } }));
      if (ANALYTICS.provider === 'plausible' && window.plausible) window.plausible(name, { props: p });
      else if (ANALYTICS.provider === 'ga4' && window.gtag) window.gtag('event', name, p);
      else if (ANALYTICS.provider === 'datalayer' && window.dataLayer) window.dataLayer.push(Object.assign({ event: name }, p));
    } catch (e) { /* measurement must never break the page */ }
  }
  window.apploadingTrack = track;

  /* ---------- Gentle reveal on scroll ---------- */
  const rv = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach((el) => io.observe(el));
    setTimeout(() => rv.forEach((el) => el.classList.add('in')), 2500);
  }

  /* ---------- Motion ----------
     Progressive enhancement: with scripts off or reduced motion on, the page is complete and still. */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // headline words rise in; a long statement lights up word by word as you scroll
  function wrapWords(root, cls, indexVar) {
    let i = 0;
    (function walk(node) {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const sp = doc.createElement('span');
            sp.className = cls;
            if (indexVar) sp.style.setProperty('--i', i);
            i++;
            sp.textContent = part;
            frag.append(sp);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    })(root);
    return i;
  }
  const splits = $$('[data-split]');
  splits.forEach((h) => { h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim()); wrapWords(h, 'w', true); });
  if (reduce || !('IntersectionObserver' in window)) splits.forEach((h) => h.classList.add('in'));
  else {
    const sio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); sio.unobserve(e.target); } }), { threshold: 0.25 });
    splits.forEach((h) => sio.observe(h));
    setTimeout(() => splits.forEach((h) => h.classList.add('in')), 2500);
  }
  const lits = $$('[data-lit]');
  lits.forEach((el) => { el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim()); wrapWords(el, 'sw', false); el._w = $$('.sw', el); });

  // numbers count up when they scroll into view
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    const start = performance.now(), dur = 1700;
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt((1 - Math.pow(1 - p, 4)) * target);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
    $$('[data-count]').forEach((el) => { el.textContent = '0'; cio.observe(el); });
  }

  // typing line in the hero
  const typed = $('#typed');
  if (typed && !reduce) {
    const words = typed.dataset.words.split('|');
    let w = 0, c = words[0].length, dir = -1;
    typed.textContent = words[0];
    (function step() {
      if (doc.hidden) { setTimeout(step, 600); return; }
      const word = words[w];
      let wait = dir < 0 ? 38 : 62;
      c += dir;
      typed.textContent = word.slice(0, Math.max(c, 0));
      if (dir > 0 && c >= word.length) { dir = -1; wait = 2000; }
      else if (dir < 0 && c <= 0) { dir = 1; w = (w + 1) % words.length; wait = 350; }
      setTimeout(step, wait);
    })();
  }

  // phones follow the pointer a little and drift with scroll
  const hero = $('.hero'), hv = $('.hero-visual');
  if (hero && hv && !reduce && fine) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hv.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2));
      hv.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 9).toFixed(2));
    });
    hero.addEventListener('pointerleave', () => { hv.style.setProperty('--ry', 0); hv.style.setProperty('--rx', 0); });
  }

  // the phone in the story changes screen as you scroll the steps
  const sc = $('.scrolly');
  if (sc && 'IntersectionObserver' in window) {
    const steps = $$('.sstep', sc), imgs = $$('.stack img', sc), dots = $$('.sdots i', sc);
    const show = (i) => {
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      imgs.forEach((m, k) => m.classList.toggle('on', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(+e.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io2.observe(s));
  }

  // the order tracker ticks through its stages
  $$('.mock').forEach((m) => {
    if (reduce || !('IntersectionObserver' in window)) return;
    const lis = $$('ol li', m), pbar = $('.bar i', m), now = lis.findIndex((l) => l.classList.contains('now'));
    if (now < 1) return;
    const set = (v) => pbar.style.setProperty('--p', v.toFixed(1));
    const play = () => {
      m.classList.add('play');
      m.classList.remove('fin');
      lis.forEach((l) => l.classList.remove('done', 'now'));
      set(0);
      lis.slice(0, now).forEach((l, i) => setTimeout(() => { l.classList.add('done'); set(((i + 1) / lis.length) * 100); }, 450 + i * 320));
      setTimeout(() => { lis[now].classList.add('now'); set(((now + 1) / lis.length) * 100); m.classList.add('fin'); }, 450 + now * 320 + 200);
    };
    const mio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { play(); mio.unobserve(m); } }), { threshold: 0.55 });
    mio.observe(m);
  });

  // cursor spotlight on cards, and a gentle magnetic pull on the main buttons
  if (fine && !reduce) {
    const SPOT = '.prod article, .status3 > div, .stat, .facts, .enq, .proof > div, .after-list';
    doc.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest(SPOT);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
    $$('.btn:not(.btn-sm):not([type=submit])').forEach((b) => {
      b.classList.add('mag');
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (((e.clientX - r.left) / r.width - 0.5) * 10) + 'px, ' + (((e.clientY - r.top) / r.height - 0.5) * 8) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // one scroll handler: nav progress bar, hero drift, statement highlight
  const navBar = $('#navBar'), load = $('#load');
  let queued = false;
  function onScroll() {
    queued = false;
    const max = doc.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(scrollY / max, 1) : 0;
    if (navBar) navBar.style.transform = 'scaleX(' + p + ')';
    if (load) {
      const done = p > 0.995;
      load.textContent = done ? 'loaded' : Math.round(p * 100) + '%';
      load.classList.toggle('done', done);
    }
    if (hv && !reduce && scrollY < 1000) hv.style.setProperty('--sy', (-scrollY * 0.05).toFixed(1));
    if (!reduce) lits.forEach((el) => {
      const r = el.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.5)));
      const n = Math.round(t * el._w.length);
      el._w.forEach((w, i) => w.classList.toggle('lit', i < n));
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  onScroll();

  /* ---------- Click measurement ---------- */
  doc.addEventListener('click', (e) => {
    const cta = e.target.closest('[data-track]');
    if (cta) track('enquiry_cta_click', { label: cta.dataset.track });
    const cs = e.target.closest('[data-case-link]');
    if (cs) track('case_study_visit', { case: cs.dataset.caseLink, via: 'link' });
  });
  const seen = new Set();
  const cases = $$('[data-case]');
  if (cases.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      const id = e.target.dataset.case;
      if (e.isIntersecting && !seen.has(id)) { seen.add(id); track('case_study_visit', { case: id, via: 'scroll' }); }
    }), { threshold: 0.5 });
    cases.forEach((c) => cio.observe(c));
  }

  /* ---------- Screens dialog (optional, lightweight) ---------- */
  const dlg = $('#shots');
  if (dlg && typeof dlg.showModal === 'function') {
    $$('[data-open-shots]').forEach((b) => b.addEventListener('click', () => { dlg.showModal(); track('demo_open', { item: 'guest-app-screens' }); }));
    $$('[data-close-shots]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  } else {
    $$('[data-open-shots]').forEach((b) => { b.hidden = true; });
  }

  /* ---------- Enquiry forms ---------- */
  const MAIL = 'dave@apploading.co';
  const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
  const say = {
    name: 'Please tell me your name.',
    email: 'Please add an email address so I can reply.',
    emailBad: "That email address doesn't look right. Could you check it?",
    message: "Tell me a little about what's taking up your time. A rough description is fine."
  };
  function fieldError(input, msg) {
    const wrap = input.closest('.fld');
    let p = $('.err', wrap);
    if (!msg) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      if (p) p.remove();
      return;
    }
    input.setAttribute('aria-invalid', 'true');
    if (!p) { p = doc.createElement('p'); p.className = 'err'; p.id = input.id + '-err'; wrap.append(p); }
    p.textContent = msg;
    input.setAttribute('aria-describedby', p.id);
  }
  function check(f) {
    const v = (n) => f.elements[n].value.trim();
    const bad = [];
    const rule = (n, ok, msg) => { fieldError(f.elements[n], ok ? '' : msg); if (!ok) bad.push(f.elements[n]); };
    rule('name', v('name').length > 0, say.name);
    rule('email', v('email').length > 0 && EMAIL.test(v('email')), v('email') ? say.emailBad : say.email);
    rule('message', v('message').length >= 5, say.message);
    return bad;
  }

  $$('form.enq').forEach((f) => {
    f.noValidate = true;
    const status = $('.enq-status', f);
    const btn = $('button[type=submit]', f);
    const label = btn.innerHTML;
    ['name', 'email', 'message'].forEach((n) => f.elements[n].addEventListener('input', () => { if (f.elements[n].getAttribute('aria-invalid')) check(f); }));

    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'enq-status';
      status.textContent = '';
      const bad = check(f);
      if (bad.length) {
        status.classList.add('bad');
        status.textContent = bad.length === 1 ? 'One thing to fix above, then send it.' : 'A few things to fix above, then send it.';
        bad[0].focus();
        return;
      }
      const d = Object.fromEntries(new FormData(f));
      btn.disabled = true;
      btn.textContent = 'Sending...';
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        if (!r.ok) throw new Error(String(r.status));
        f.reset();
        status.classList.add('ok');
        status.textContent = "Thanks, your message is on its way. I'll reply, usually the same business day.";
        track('enquiry_form_complete', { form: f.dataset.form || 'form' });
      } catch (err) {
        const body = d.message + '\n\n' + d.name + (d.business ? '\n' + d.business : '');
        const href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Enquiry from ' + d.name) + '&body=' + encodeURIComponent(body);
        const a = doc.createElement('a');
        a.href = href;
        a.textContent = 'Open it in your email app';
        status.classList.add('bad');
        status.append("That didn't send from here, and your message is still in the form. ", a, ', or write to ' + MAIL + '.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });
  });
})();
