# Restechx

Founder website and Smart MaT product page, served by a small Node.js backend that emails contact-form enquiries.

## Structure

```
public/        the website (index.html, styles.css, script.js, assets/)
server.js      Express server: serves public/ and handles POST /api/contact
.env.example   settings template — copy to .env
```

## Setup

1. Install Node.js 22.9 or newer, then run `npm install`.
2. Copy `.env.example` to `.env` and fill in the SMTP sender account.
   For Gmail: enable 2-Step Verification, create an App Password at
   https://myaccount.google.com/apppasswords, and use it as `SMTP_PASS`.
3. Run `npm start` (or `npm run dev` to auto-restart on changes) and open http://localhost:3000.

On startup the server logs `✓ SMTP ready` when the mail settings are correct.
Enquiries are sent to `MAIL_TO` (default `ictclubnps@gmail.com`), with Reply-To set to the visitor's email.
