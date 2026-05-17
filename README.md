# open-brain-auth

A Vite + React + TypeScript app that serves as the **OAuth 2.1 authorization UI**
for Supabase Auth's [OAuth Server](https://supabase.com/docs/guides/auth/oauth-server/getting-started).
Third-party apps (e.g. Claude.ai custom connectors) redirect users here to sign in
and approve access.

## What this app does

- Renders the consent screen at `/oauth/consent?authorization_id=…`
- **Invite-only** sign-in: work email must exist in `auth.users` (RPC check), then **Google OAuth**
- Handles the Google return at `/auth/callback` (PKCE)
- Blocks consent if the user has no row in `mcp_user_projects` (MCP allowlist)
- Calls `supabase.auth.oauth.approveAuthorization` / `denyAuthorization` to finish the flow

## Routes

| Path             | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `/`              | Landing page                                                            |
| `/login`         | Email check + Google sign-in (`?redirect=<path>`)                       |
| `/auth/callback` | Google OAuth return — PKCE exchange, then forward to `redirect`         |
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

- `is_user_invited(email)` — callable before login (`anon`); true if email exists in `auth.users`
- `user_has_mcp_access()` — callable when signed in; true if user has any `mcp_user_projects` row

Also ensure [`../open-brain-rnd/sql/setup.sql`](../open-brain-rnd/sql/setup.sql) has been applied (creates `mcp_user_projects`).

### 4. Supabase Dashboard

| Setting | Value |
| ------- | ----- |
| **Allow new users to sign up** | **OFF** (invite / add user only) |
| **Google provider** | **ON** — Client ID + secret from Google Cloud Console |
| Google redirect URI | `https://<project-ref>.supabase.co/auth/v1/callback` |
| **OAuth 2.1 Server** | **ON**, authorization path `/oauth/consent` |
| **Site URL** | `http://localhost:5173` (dev) or your Vercel URL (prod) |
| **Redirect URLs** | `http://localhost:5173/auth/callback`, production `/auth/callback` |

#### Google Cloud Console

1. OAuth consent screen (Internal if using Google Workspace).
2. OAuth client (Web application).
3. Authorized redirect URI: Supabase callback above.

#### Adding users

1. **Authentication → Users → Invite user** (or Add user).
2. Grant MCP access in SQL:

```sql
INSERT INTO mcp_user_projects (user_id, project)
VALUES ('<user-uuid>', 'your-project-slug');
-- Or super-user: ('<user-uuid>', '*');
```

Users without `auth.users` see **User does not exist** on login. Users without `mcp_user_projects` see **Access denied** on consent.

### 5. Run locally

```bash
pnpm dev
```

Vite is pinned to port **5173** (`strictPort: true`). Free the port if another process holds it.

### 6. Auth client (`flowType: 'pkce'`)

Google OAuth runs in the same browser tab; [`src/lib/supabase.ts`](src/lib/supabase.ts) uses **PKCE** and `exchangeCodeForSession` in [`AuthCallback.tsx`](src/pages/AuthCallback.tsx).

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
