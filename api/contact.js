// Enquiry form endpoint. Emails each submission through Resend.
//
// Environment variables (set in the Vercel project):
//   RESEND_API_KEY  required. Without it the endpoint answers 503 and the
//                   page falls back to the visitor's own email app.
//   CONTACT_TO      optional. Where enquiries are delivered.
//   CONTACT_FROM    optional. Sender address; must be on a domain verified
//                   in Resend.

const TO = process.env.CONTACT_TO || 'dave@apploading.co';
const FROM = process.env.CONTACT_FROM || 'apploading.co enquiries <onboarding@resend.dev>';

const ALLOWED_HOSTS = /^(www\.)?apploading\.co$|\.vercel\.app$|^localhost(:\d+)?$/;
const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

// strip control characters, trim, cap the length
const clean = (v, max) =>
  String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, ' ');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // only accept posts from the site itself
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch { /* malformed origin */ }
    if (!ALLOWED_HOSTS.test(host)) return res.status(403).json({ error: 'Forbidden' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Contact form is not configured' });

  // req.body is parsed lazily and throws on malformed JSON
  let body = null;
  try {
    body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
  } catch { body = null; }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request' });

  // honeypot: real visitors never see or fill this field
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const name = oneLine(body.name, 120);
  const email = oneLine(body.email, 200);
  const need = oneLine(body.need, 60);
  const message = clean(body.message, 4000);

  if (!name || !EMAIL.test(email) || message.length < 5) {
    return res.status(400).json({ error: 'Please fill in your name, a valid email and a message' });
  }

  const text = [
    'Name: ' + name,
    'Email: ' + email,
    need ? 'Looking for: ' + need : null,
    '',
    message
  ].filter(l => l !== null).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: 'Project enquiry from ' + name,
        text
      })
    });
    if (!r.ok) {
      console.error('contact: resend answered', r.status, await r.text());
      return res.status(502).json({ error: 'Could not send the message' });
    }
  } catch (err) {
    console.error('contact: send failed', err);
    return res.status(502).json({ error: 'Could not send the message' });
  }

  return res.status(200).json({ ok: true });
};
