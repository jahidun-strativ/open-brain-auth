# open-brain-auth

OAuth 2.1 authorization UI for Supabase Auth (Claude.ai custom connectors, etc.).

## What this app does

- Consent at `/oauth/consent?authorization_id=…`
- **Email magic link** sign-in (invite-only, no Google)
- **Before** sending a link: checks email is in `auth.users` and has `mcp_user_projects`
- Callback at `/auth/callback` (PKCE)
- `approveAuthorization` / `denyAuthorization` via Supabase Auth OAuth API

## SQL (required)

Run in the **RND** Supabase project — full guide:

**[../open-brain-rnd/sql/README.md](../open-brain-rnd/sql/README.md)**

Minimum for this app:

1. [../open-brain-rnd/sql/setup.sql](../open-brain-rnd/sql/setup.sql)
2. [../open-brain-rnd/sql/auth-ui-rpc.sql](../open-brain-rnd/sql/auth-ui-rpc.sql)

## Supabase Dashboard

| Setting | Value |
| ------- | ----- |
| **Allow new users to sign up** | **OFF** |
| **Email provider** | **ON** |
| **Google provider** | **OFF** |
| **OAuth 2.1 Server** | **ON**, path `/oauth/consent` |
| **Site URL** | this app (dev: `http://localhost:5173`) |
| **Redirect URLs** | `…/auth/callback` |

Connector setup: [../open-brain-rnd/05-oauth-setup.md](../open-brain-rnd/05-oauth-setup.md)

## Local dev

```bash
pnpm install
cp .env.example .env.local   # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
pnpm dev                     # http://localhost:5173
```

## Deploy (Vercel)

Set env vars, point Supabase **Site URL** / **Redirect URLs** at production host, deploy. Push to Git if Vercel auto-deploys.
