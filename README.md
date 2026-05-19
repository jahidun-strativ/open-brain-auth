# open-brain-auth (Coeo)

A Vite + React + TypeScript app that serves as the **OAuth 2.1 authorization UI**
for Supabase Auth's [OAuth Server](https://supabase.com/docs/guides/auth/oauth-server/getting-started).
Third-party apps (e.g. Claude.ai custom connectors) redirect users here to sign in
and approve access.

## What this app does

- Renders the consent screen at `/oauth/consent?authorization_id=…`
- **Invite-only** sign-in via **email magic link** (no Google)
- **Before** sending a magic link: checks the email is in `auth.users` and has `mcp_user_projects` (RPC)
- Handles the magic-link return at `/auth/callback` (PKCE)
- Re-checks MCP access after sign-in; blocks consent if access was revoked
- Calls `supabase.auth.oauth.approveAuthorization` / `denyAuthorization` to finish the flow

## Routes

| Path             | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `/`              | Landing page                                                            |
| `/login`         | Email magic link (`?redirect=<path>`, optional `?error=` from failed check) |
| `/auth/callback` | Magic-link return — PKCE exchange, then forward to `redirect`         |
| `/oauth/consent` | OAuth consent — expects `?authorization_id=<id>` from Supabase Auth     |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 3. Run SQL migration (required)

In **Supabase SQL Editor**, run:

[`../open-brain-setup-coeo/sql/auth-ui-rpc.sql`](../open-brain-setup-coeo/sql/auth-ui-rpc.sql)

Also ensure [`../open-brain-setup-coeo/sql/setup.sql`](../open-brain-setup-coeo/sql/setup.sql) (or `mcp-auth-upgrade.sql` on existing DB) has been applied.

RPCs: `is_user_invited`, `email_has_mcp_access`, `user_has_mcp_access` — see that file for details.

### 4. Supabase Dashboard

| Setting | Value |
| ------- | ----- |
| **Allow new users to sign up** | **OFF** |
| **Email provider** | **ON** (magic link) |
| **Google provider** | **OFF** |
| **OAuth 2.1 Server** | **ON**, authorization path `/oauth/consent` |
| **Site URL** | your auth app URL (dev: `http://localhost:5173`) |
| **Redirect URLs** | `…/auth/callback` for dev and prod |

See [`../open-brain-setup-coeo/05-oauth-setup.md`](../open-brain-setup-coeo/05-oauth-setup.md) for the full connector walkthrough.

### 5. Run locally

```bash
pnpm dev
```

Port **5173** (`strictPort: true`).

## Deploy on Vercel

Set `VITE_SUPABASE_*` env vars, configure Supabase **Site URL** / **Redirect URLs**, deploy. See [`vercel.json`](vercel.json).
