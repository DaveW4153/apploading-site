/* Guest photos. They live in this browser's IndexedDB on this device only: not uploaded, not backed up, not on other devices.
   Every photo is re-drawn onto a canvas before saving, which drops all embedded metadata (GPS position, camera, time), and is resized. */
import { MODE } from './core.js';

const DB_NAME = MODE.demo ? 'lw-stay-demo-photos' : 'lw-stay-photos';
const STORE = 'photos';
export const LIMITS = { full: 1600, thumb: 420, maxInput: 40 * 1024 * 1024 };

let dbp;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    if (!('indexedDB' in window)) { rej(new Error('nodb')); return; }
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error || new Error('db'));
  });
  dbp.catch(() => { dbp = null; });
  return dbp;
}
const tx = async (mode, fn) => {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('abort'));
  });
};

export const savePhoto = (rec) => tx('readwrite', (s) => s.put(rec));
export const getPhoto = (id) => tx('readonly', (s) => s.get(id));
export const deletePhoto = (id) => { drop(id); return tx('readwrite', (s) => s.delete(id)); };
export const allPhotos = () => tx('readonly', (s) => s.getAll());
export const clearPhotos = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls.clear(); return tx('readwrite', (s) => s.clear()); };

/* Object URLs for showing photos. Cached by id and kind so re-renders are cheap. */
const urls = new Map();
const drop = (id) => ['full', 'thumb'].forEach((k) => { const u = urls.get(`${id}:${k}`); if (u) { URL.revokeObjectURL(u); urls.delete(`${id}:${k}`); } });
export async function photoUrl(id, kind = 'thumb') {
  const key = `${id}:${kind}`;
  if (urls.has(key)) return urls.get(key);
  const rec = await getPhoto(id);
  if (!rec) return null;
  const u = URL.createObjectURL(kind === 'full' ? rec.full : rec.thumb);
  urls.set(key, u);
  return u;
}

/* Fill every <img data-photo="id" data-kind="thumb|full"> under root. */
export async function hydratePhotos(root = document) {
  const imgs = [...root.querySelectorAll('img[data-photo]')];
  await Promise.all(imgs.map(async (img) => {
    try {
      const u = await photoUrl(img.dataset.photo, img.dataset.kind || 'thumb');
      if (u) { img.src = u; img.classList.add('ready'); } else img.closest('[data-photo-wrap]')?.classList.add('missing');
    } catch (e) { img.closest('[data-photo-wrap]')?.classList.add('missing'); }
  }));
}

const toBlob = (canvas, type, q) => new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), type, q));
async function decode(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* try the image element */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
}
function draw(src, max) {
  const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
  const k = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
/* Returns { full, thumb, w, h }: clean JPEG blobs with no metadata. Throws Error('toobig') or Error('unreadable'). */
export async function cleanPhoto(file) {
  if (!file || file.size > LIMITS.maxInput) throw new Error('toobig');
  let src;
  try { src = await decode(file); } catch (e) { throw new Error('unreadable'); }
  const full = draw(src, LIMITS.full), thumb = draw(src, LIMITS.thumb);
  if (src.close) src.close();
  return { full: await toBlob(full, 'image/jpeg', 0.84), thumb: await toBlob(thumb, 'image/jpeg', 0.78), w: full.width, h: full.height };
}

/* Ask the browser not to evict our photos when space is short, and say how much we use. */
export async function storageInfo() {
  const info = { persisted: false, usage: null, quota: null };
  try {
    if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted();
    if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); info.usage = e.usage ?? null; info.quota = e.quota ?? null; }
  } catch (e) { /* not available */ }
  return info;
}
export async function requestPersistence() {
  try { return navigator.storage?.persist ? await navigator.storage.persist() : false; } catch (e) { return false; }
}
