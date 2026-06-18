/* =====================================================
   nexus.ai — tool submission handler (Vercel Serverless Function)
   Receives the Submit-a-Tool form and emails it to the editor.

   Security model:
   - The email-provider API key lives ONLY in a server env var
     (RESEND_API_KEY); it is never shipped to the browser.
   - All input is validated and length-capped server-side; the
     client cannot be trusted.
   - User-supplied text is HTML-escaped before being placed in the
     email body, preventing HTML/header injection.
   - A hidden honeypot field traps naive bots.
   - Best-effort per-IP rate limiting on warm instances.
   ===================================================== */

const RECIPIENT = 'aqeel@epicdynamics.ai';
// Must be a domain verified in your email provider. Override via env.
const FROM = process.env.SUBMIT_FROM_EMAIL || 'nexus.ai <noreply@epicdynamics.ai>';

const LIMITS = {
  toolName: 120, toolUrl: 300, toolCategory: 40, toolDesc: 120,
  tier: 20, toolPricing: 120, toolWhy: 4000, toolWeaknesses: 4000,
  submitterName: 120, submitterEmail: 200, affiliation: 40,
};
const CATEGORIES = ['chatbots','agents','coding','image','video','music','voice','search','writing','design','business','infra'];
const TIERS = ['', 'frontier','leading','specialist','open'];

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const clean = (s) => String(s == null ? '' : s).trim();
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isHttpUrl = (s) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };

// Best-effort rate limit (per warm instance). Not a substitute for a real
// limiter, but cheap defense against bursts.
const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now(), windowMs = 60_000, max = 5;
  const arr = (HITS.get(ip) || []).filter(t => now - t < windowMs);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear(); // bound memory
  return arr.length > max;
}

async function sendEmail({ subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { const e = new Error('email_not_configured'); e.code = 'config'; throw e; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [RECIPIENT], subject, html, reply_to: replyTo || undefined }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const e = new Error('email_send_failed');
    e.code = 'provider';
    e.detail = detail.slice(0, 500);
    throw e;
  }
  return res.json().catch(() => ({}));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'bad_request' });

  // Honeypot: real users never fill this. Pretend success so bots don't learn.
  if (clean(body.company)) return res.status(200).json({ ok: true });

  // Collect + length-check
  const f = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = clean(body[k]);
    if (v.length > max) return res.status(400).json({ ok: false, error: `too_long:${k}` });
    f[k] = v;
  }

  // Required + format validation
  const errs = [];
  if (!f.toolName) errs.push('toolName');
  if (!isHttpUrl(f.toolUrl)) errs.push('toolUrl');
  if (!CATEGORIES.includes(f.toolCategory)) errs.push('toolCategory');
  if (!f.toolDesc) errs.push('toolDesc');
  if (!f.toolWhy) errs.push('toolWhy');
  if (!isEmail(f.submitterEmail)) errs.push('submitterEmail');
  if (f.tier && !TIERS.includes(f.tier)) errs.push('tier');
  if (errs.length) return res.status(400).json({ ok: false, error: 'validation_failed', fields: errs });

  const row = (label, val) => val ? `<tr><td style="padding:4px 14px 4px 0;color:#888;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:4px 0">${esc(val).replace(/\n/g,'<br>')}</td></tr>` : '';
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:14px;color:#111;line-height:1.5">
      <h2 style="margin:0 0 4px">New tool submission — ${esc(f.toolName)}</h2>
      <p style="margin:0 0 16px;color:#666">Submitted via the nexus.ai directory.</p>
      <table style="border-collapse:collapse">
        ${row('Tool', f.toolName)}
        ${row('Website', f.toolUrl)}
        ${row('Category', f.toolCategory)}
        ${row('Verdict', f.toolDesc)}
        ${row('Suggested tier', f.tier)}
        ${row('Pricing', f.toolPricing)}
        ${row('Why list it', f.toolWhy)}
        ${row('Weaknesses', f.toolWeaknesses)}
        ${row('Submitter', f.submitterName)}
        ${row('Email', f.submitterEmail)}
        ${row('Affiliation', f.affiliation)}
      </table>
    </div>`;

  try {
    await sendEmail({ subject: `nexus.ai submission: ${f.toolName}`, html, replyTo: f.submitterEmail });
    return res.status(200).json({ ok: true });
  } catch (e) {
    if (e.code === 'config') return res.status(503).json({ ok: false, error: 'email_not_configured' });
    console.error('submit send failed:', e.message, e.detail || '');
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
}
