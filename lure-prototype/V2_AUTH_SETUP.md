# V2 Authentication Setup

The online Worker now protects every `/api/*` endpoint with a signed HttpOnly session cookie.
Static assets remain public so the login screen can load.

## Generate secrets

Run this from `lure-prototype`:

```bash
node scripts/hash-password.mjs
```

The command prints three lines. Keep them private.

## Configure production

Set each value as a Wrangler secret. Paste the value after the prompt:

```bash
npx wrangler secret put AUTH_PASSWORD_TOKEN
npx wrangler secret put AUTH_PASSWORD_PEPPER
npx wrangler secret put AUTH_SESSION_SECRET
```

For the current V2 login flow, set `AUTH_PASSWORD_TOKEN`, `AUTH_PASSWORD_PEPPER`, and
`AUTH_SESSION_SECRET`. `AUTH_PASSWORD_HASH` is retained only as a PBKDF2 compatibility fallback.

Then deploy:

```bash
npm run deploy
```

If the secrets are missing, the API intentionally returns `AUTH_NOT_CONFIGURED` instead of exposing data.

## Local development

Copy `.dev.vars.example` to `.dev.vars`, replace both values with the output from the generator, and run:

```bash
npm run dev
```

The `.dev.vars` file is ignored by Git and is not uploaded as a static asset.

## Session behavior

- Sessions expire after 30 days.
- The password is never stored in D1 or in the Worker source.
- The password verifier uses a server-side random pepper and HMAC-SHA-256; the pepper is never sent to the browser.
- The session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, and signed with HMAC-SHA-256.
- `file://` demo mode continues to use seed data without a login screen.
