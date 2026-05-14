# open-brain-auth

A Vite + React + TypeScript app that serves as the **OAuth 2.1 authorization UI**
for Supabase Auth's [OAuth Server](https://supabase.com/docs/guides/auth/oauth-server/getting-started).
Third-party apps (e.g. Claude.ai custom connectors, the Open Brain MCP server)
that want to authenticate users via your Supabase project will be redirected
here to ask the user for consent.

## What this app does

- Renders the consent screen at `/oauth/consent?authorization_id=…`
- Lets the user sign in via Supabase magic link at `/login`
- Handles the magic-link return at `/auth/callback`
- Calls `supabase.auth.oauth.approveAuthorization` / `denyAuthorization` to
  finish the OAuth flow, then redirects back to the requesting client

## Routes

| Path              | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `/`               | Landing page                                                                           |
| `/login`          | Magic-link sign-in (accepts `?redirect=<path>`)                                        |
| `/auth/callback`  | Magic-link return target — exchanges the link for a session and forwards to `redirect` |
| `/oauth/consent`  | The OAuth consent screen — expects `?authorization_id=<id>` from Supabase Auth         |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Find these in **Supabase Dashboard -> Project Settings -> API**. Use the
**publishable** (anon) key, not the secret key.

### 3. Configure Supabase (one-time, in the Dashboard)

Follow the [Supabase OAuth 2.1 Server guide](https://supabase.com/docs/guides/auth/oauth-server/getting-started)
and apply these settings:

1. **Migrate JWT signing keys to RS256/ES256** — required for OAuth.
   _Dashboard -> Authentication -> JWT Signing Keys -> Add new signing key
   (RS256) -> Make current key._
2. **Enable OAuth 2.1 Server** at _Authentication -> OAuth Server_:
   - **Authorization Path**: `/oauth/consent`
   - **Allow dynamic client registration**: ON (only required if a client like
     Claude.ai uses DCR)
3. **Set the Site URL** at _Authentication -> URL Configuration_:
   - Dev: `http://localhost:5173`
   - Prod: `https://your-deployed-domain`
4. **Add redirect URLs** at the same URL Configuration page so magic-link
   sign-in returns to this app:
   - `http://localhost:5173/auth/callback`
   - `https://your-deployed-domain/auth/callback`

The full consent URL Supabase exposes is `<Site URL> + <Authorization Path>`,
i.e. `http://localhost:5173/oauth/consent` in dev.

If you also use the local Supabase stack in `../open-brain-rnd/supabase`,
`config.toml` is already updated:

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = [
  "http://localhost:5173",
  "http://localhost:5173/auth/callback",
  ...
]

[auth.oauth_server]
enabled = true
authorization_url_path = "/oauth/consent"
allow_dynamic_registration = true
```

Restart the local stack so the change is picked up:

```bash
cd ../open-brain-rnd
supabase stop && supabase start
```

### Auth flow choice (implicit vs PKCE)

This app configures supabase-js with `flowType: 'implicit'`
(see [`src/lib/supabase.ts`](src/lib/supabase.ts)). Magic-link tokens come back
in the URL hash, so the sign-in completes even if the email opens in a
different browser, profile, or in-app browser than the one that requested the
link.

If you switch to `flowType: 'pkce'`, sign-in will fail with
`PKCE code verifier not found in storage` whenever the magic link opens in a
context that does not share localStorage with the original tab. To keep PKCE:

- Always open the magic link in the **same browser** that requested it.
- Pick **one** hostname (`localhost` _or_ `127.0.0.1`) and use it everywhere —
  the Vite URL, the Supabase **Site URL**, and the bookmark you visit. Each
  hostname has its own localStorage, so mixing them also wipes the verifier.

### 4. Run the dev server

```bash
pnpm dev
```

Then trigger an OAuth flow from a registered client. The client should
redirect the browser to `http://localhost:5173/oauth/consent?authorization_id=…`
and you'll see the consent screen.

### 5. Register an OAuth client (optional)

To test end-to-end, register a client either in the Dashboard
(_Authentication -> OAuth Apps -> Add a new client_) or programmatically:

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // service-role/secret key, server-side only
)

await supabase.auth.admin.oauth.createClient({
  name: 'My Test App',
  redirect_uris: ['http://localhost:3000/auth/callback'],
  client_type: 'confidential',
})
```

## Deploy on Vercel

Vite builds a SPA: only `index.html` exists at the root. Direct hits to
`/oauth/consent`, `/login`, or `/auth/callback` must still return that HTML so
React Router can run. [vercel.json](vercel.json) adds a rewrite so every path
falls back to `index.html` (Vercel still serves real files under `/assets/` and
`/public` first).

1. In the Vercel project, set **Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. If this repo is a monorepo, set **Root Directory** to `open-brain-auth` and
   **Build command** `pnpm build` (or `npm run build`), **Output** `dist`.
3. In Supabase **Authentication → URL Configuration**, set **Site URL** to your
   production origin (e.g. `https://your-app.vercel.app`) and add **Redirect
   URLs** for `https://your-app.vercel.app/auth/callback`.
4. Redeploy after changing `vercel.json` or env vars.

## Scripts

| Command        | What it does                                |
| -------------- | ------------------------------------------- |
| `pnpm dev`     | Start the Vite dev server on port `5173`    |
| `pnpm build`   | Type-check and build for production         |
| `pnpm preview` | Preview the production build locally        |
| `pnpm lint`    | Run ESLint                                  |
