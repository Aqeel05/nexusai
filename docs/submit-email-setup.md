# Submit-a-tool email — setup & security

The **Submit a Tool** form (`submit.html`) posts to a Vercel Serverless Function at
`api/submit.js`, which emails each submission to **aqeel@epicdynamics.ai**.

> ⚠️ **Until the two env vars below are set in Vercel, submissions will fail** with a
> friendly "temporarily unavailable" message (HTTP 503). The form, validation, and the
> function are all in place — they just need credentials to actually send.

## 1. Pick a provider (default: Resend)

`api/submit.js` sends via [Resend](https://resend.com) using a plain `fetch` call (no npm
dependency added). Resend's free tier is enough for a submission form.

1. Create a Resend account.
2. **Verify the `epicdynamics.ai` domain** in Resend (add the DNS records it gives you).
   This is what lets you send *from* `noreply@epicdynamics.ai`.
3. Create an API key.

## 2. Set environment variables in Vercel

Project → Settings → Environment Variables:

| Variable            | Value                                             | Notes                              |
| ------------------- | ------------------------------------------------- | ---------------------------------- |
| `RESEND_API_KEY`    | `re_...` (from Resend)                            | **Secret. Server-only.**           |
| `SUBMIT_FROM_EMAIL` | `nexus.ai <noreply@epicdynamics.ai>`              | Optional; must be a verified sender |

Redeploy after adding them.

## 3. Why this is secure

- **The API key never reaches the browser.** It's read from `process.env` inside the
  serverless function only. The client just POSTs form JSON to `/api/submit`.
- **Server-side validation.** Required fields, email/URL format, allowed category & tier,
  and per-field length caps are all re-checked on the server — the client cannot bypass them.
- **Injection-safe.** All user text is HTML-escaped before being placed in the email body,
  so a malicious submission can't inject markup or headers. `javascript:`/`data:` URLs are
  rejected.
- **Spam resistance.** A hidden honeypot field traps naive bots, and there's best-effort
  per-IP rate limiting (5/min on a warm instance).
- **Reply-to.** The submitter's email is set as `reply_to`, so you can reply to them
  directly from your inbox.

## Swapping providers

All sending is isolated in the `sendEmail()` function in `api/submit.js`. To use SendGrid,
Postmark, AWS SES, or SMTP (via Nodemailer), replace that one function and adjust the env
var(s). Nothing else changes.

## Local note

`api/submit.js` uses ES module syntax (`export default`) and the global `fetch`, matching
Vercel's Node runtime. Test it live with `vercel dev`, or rely on the unit tests that cover
validation, sanitization, honeypot, rate limiting, and the send path.
