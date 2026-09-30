const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const {
  PORT = 3000,
  SMTP_HOST = 'smtp.gmail.com',
  SMTP_PORT = 465,
  SMTP_USER,
  SMTP_PASS,
  MAIL_TO = 'ictclubnps@gmail.com',
  TRUST_PROXY
} = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.warn('⚠  SMTP_USER / SMTP_PASS are not set — the contact form will fail until you fill in .env');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

const app = express();
if (TRUST_PROXY) app.set('trust proxy', 1); // behind Nginx / Render / Railway etc.
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---- Tiny in-memory rate limit: 5 messages per IP per 15 minutes ---- */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) if (times.every(t => now - t >= WINDOW_MS)) hits.delete(ip);
}, WINDOW_MS).unref();

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', async (req, res) => {
  const body = req.body || {};

  // Honeypot: real visitors never fill this hidden field. Pretend success to bots.
  if (body._honey) return res.json({ ok: true });

  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, error: 'Too many messages — please try again later.' });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const org = clean(body.org, 150);
  const topic = clean(body.topic, 100) || 'General enquiry';
  const message = clean(body.message, 5000);

  if (!name || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter your name and a valid email address.' });
  }

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Organisation', org || '—'],
    ['Interested in', topic],
    ['Message', message || '—']
  ];

  try {
    await transporter.sendMail({
      from: `"Restechx Website" <${SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `Restechx enquiry: ${topic} — ${name}`.replace(/[\r\n]/g, ' '),
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px">
          <h2 style="color:#0b4449;margin:0 0 16px">New enquiry from the Restechx website</h2>
          <table cellpadding="10" style="border-collapse:collapse;width:100%">
            ${rows.map(([k, v]) => `
              <tr>
                <td style="border-bottom:1px solid #eee;color:#6e6e73;width:140px;vertical-align:top">${k}</td>
                <td style="border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(v)}</td>
              </tr>`).join('')}
          </table>
        </div>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Mail send failed:', err.message);
    res.status(502).json({ ok: false, error: 'Sorry, we couldn\'t send your message right now. Please try again shortly.' });
  }
});

app.listen(PORT, () => {
  console.log(`Restechx site running at http://localhost:${PORT}`);
  transporter.verify()
    .then(() => console.log(`✓ SMTP ready — enquiries go to ${MAIL_TO}`))
    .catch(err => console.warn('⚠  SMTP not ready:', err.message));
});
