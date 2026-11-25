/* My stay selling page: the live demo controls.
   Each moment is a normal link to the full-screen demo, so the page works without this script and on phones.
   On wide screens, where the phone frame is shown, a click loads that moment into the frame instead.
   The name, host and colour fields are passed to the demo as a branding preview. Nothing is stored or sent anywhere else. */
(() => {
  const form = document.getElementById('ms-brand');
  const frame = document.getElementById('ms-frame');
  const open = document.getElementById('ms-open');
  const moments = Array.from(document.querySelectorAll('[data-moment]'));
  if (!form || !open || !moments.length) return;

  const wide = window.matchMedia('(min-width: 1021px)');
  let current = moments[0];

  const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);

  function url(moment, embed) {
    const q = new URLSearchParams({ demo: '1' });
    if (embed) { q.set('embed', '1'); q.set('theme', 'dark'); }
    q.set('lang', 'en');
    q.set('stage', moment.dataset.stage);
    if (moment.dataset.seed) q.set('seed', '1');
    const d = new FormData(form);
    const brand = clean(d.get('brand'), 40);
    const host = clean(d.get('host'), 20);
    const accent = d.get('accent');
    if (brand) q.set('brand', brand);
    if (host) q.set('host', host);
    if (accent && accent !== 'ember') q.set('accent', accent);
    return `/stay/?${q}${moment.dataset.hash || '#/home'}`;
  }

  function sync(load) {
    moments.forEach((m) => {
      m.href = url(m, false);
      if (m === current) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current');
    });
    open.href = url(current, false);
    if (load && frame && wide.matches) frame.src = url(current, true);
  }

  moments.forEach((m) => m.addEventListener('click', (e) => {
    current = m;
    /* On a wide screen show it in the phone frame. On a phone, let the link open the demo itself. */
    if (wide.matches && frame && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); sync(true); } else { sync(false); }
  }));

  let timer;
  form.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => sync(true), e.target.type === 'radio' ? 0 : 450);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); sync(true); });

  sync(false);
})();
