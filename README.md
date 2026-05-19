# open-brain-auth

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

Use the **publishable** (anon) key from **Project Settings → API**, not the service role key.

### 3. Run SQL migration (required)

In **Supabase SQL Editor**, run:

[`../open-brain-rnd/sql/auth-ui-rpc.sql`](../open-brain-rnd/sql/auth-ui-rpc.sql)

This creates:

- `is_user_invited(email)` — pre-login; true if email exists in `auth.users`
- `email_has_mcp_access(email)` — pre-login; true if that user has any `mcp_user_projects` row
- `user_has_mcp_access()` — post-login; same check for the signed-in user

Also ensure [`../open-brain-rnd/sql/setup.sql`](../open-brain-rnd/sql/setup.sql) has been applied (creates `mcp_user_projects`).

### 4. Supabase Dashboard

| Setting | Value |
| ------- | ----- |
| **Allow new users to sign up** | **OFF** (invite / add user only) |
| **Email provider** | **ON** (magic link) |
| **Google provider** | **OFF** (optional — not used by this app) |
| **OAuth 2.1 Server** | **ON**, authorization path `/oauth/consent` |
| **Site URL** | `http://localhost:5173` (dev) or your Vercel URL (prod) |
| **Redirect URLs** | `http://localhost:5173/auth/callback`, production `/auth/callback` |

#### Adding users

1. **Authentication → Users → Invite user** (or Add user).
2. Grant MCP access in SQL:

```sql
INSERT INTO mcp_user_projects (user_id, project)
VALUES ('<user-uuid>', 'your-project-slug');
-- Or super-user: ('<user-uuid>', '*');
```

Users without `auth.users` see **not registered** on login (before any email is sent). Users without `mcp_user_projects` see **no Open Brain access** on login. Users who lose access after sign-in see **Access denied** on consent.

### 5. Run locally

```bash
pnpm dev
```

Vite is pinned to port **5173** (`strictPort: true`). Free the port if another process holds it.

### 6. Auth client (`flowType: 'pkce'`)

Magic links redirect to `/auth/callback`; [`src/lib/supabase.ts`](src/lib/supabase.ts) uses **PKCE** and `exchangeCodeForSession` in [`AuthCallback.tsx`](src/pages/AuthCallback.tsx). `signInWithOtp` uses `shouldCreateUser: false` so unknown emails cannot self-register.

## Deploy on Vercel

[`vercel.json`](vercel.json) rewrites all routes to `index.html` for the SPA.

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel env.
2. Set Supabase **Site URL** and **Redirect URLs** to your production domain.
3. Redeploy after env or `vercel.json` changes.

## Scripts

| Command        | What it does                         |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Dev server on port `5173`            |
| `pnpm build`   | Type-check and production build      |
| `pnpm preview` | Preview production build             |
| `pnpm lint`    | ESLint                               |
