/* Local preview: serves the static site and runs the functions in /api, roughly as Vercel does.

     npm run dev                      http://localhost:8091
     PORT=3000 npm run dev

   To try the guest assistant locally, start it with the switch on and a Claude API key in the environment:

     STAY_ASSISTANT=on npm run dev

   This is for development only. It has no caching, no redirects from vercel.json and no security hardening. */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const root = resolve(process.env.SITE_ROOT || process.cwd());
const port = Number(process.env.PORT) || 8091;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.woff2': 'font/woff2' };

async function runFunction(req, res, url) {
  const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (!/^[a-z0-9/_-]+$/i.test(name) || name.split('/').some((s) => s.startsWith('_'))) { res.writeHead(404).end('Not found'); return; }
  let handler;
  try { handler = require(join(root, 'api', `${name}.js`)); } catch (e) { res.writeHead(404).end('Not found'); return; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  req.query = Object.fromEntries(url.searchParams);
  Object.defineProperty(req, 'body', { get() { return /json/.test(req.headers['content-type'] || '') && raw ? JSON.parse(raw) : raw; } });
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(data)); return res; };
  try { await handler(req, res); } catch (e) { console.error(e); if (!res.writableEnded) res.status(500).json({ error: 'server_error' }); }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return runFunction(req, res, url);
  let file = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root) || /(^|\/)(\.git|node_modules|\.env[^/]*)(\/|$)/.test(file.slice(root.length))) { res.writeHead(403).end('Forbidden'); return; }
  try {
    let s = await stat(file);
    if (s.isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(308, { Location: url.pathname + '/' + url.search }).end(); return; }
      file = join(file, 'index.html'); s = await stat(file);
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
  }
}).listen(port, () => console.log(`Local preview on http://localhost:${port}  (guest assistant: ${String(process.env.STAY_ASSISTANT).toLowerCase() === 'on' ? 'on' : 'off'})`));
