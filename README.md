# open-brain-auth

OAuth 2.1 authorization UI for Supabase Auth (Claude.ai custom connectors, etc.).

## What this app does

- Consent at `/oauth/consent?authorization_id=…`
- **Email + password** sign-in (invite-only — no public sign-up)
- **Before** sign-in: checks email is in `auth.users` and has `mcp_user_projects`
- `approveAuthorization` / `denyAuthorization` via Supabase Auth OAuth API

## SQL (required)

**[../open-brain-rnd/sql/README.md](../open-brain-rnd/sql/README.md)**

1. [../open-brain-rnd/sql/setup.sql](../open-brain-rnd/sql/setup.sql)
2. [../open-brain-rnd/sql/auth-ui-rpc.sql](../open-brain-rnd/sql/auth-ui-rpc.sql)

## Supabase Dashboard

| Setting | Value |
| ------- | ----- |
| **Allow new users to sign up** | **OFF** |
| **Email provider** | **ON** — enable **Email + password** (not magic link / OTP only) |
| **Confirm email** | Your choice — if ON, users must be confirmed before `signInWithPassword` works |
| **Google provider** | **OFF** (optional) |
| **OAuth 2.1 Server** | **ON**, path `/oauth/consent` |
| **Site URL** | this app (dev: `http://localhost:5173`) |
| **Redirect URLs** | `…/auth/callback` (for invite / recovery links only) |

### Adding users (password)

1. **Authentication → Users → Add user** (or Invite).
2. Set **email** and **password** (or send invite so they set a password).
3. Grant MCP access in SQL:

```sql
INSERT INTO mcp_user_projects (user_id, project)
VALUES ('<user-uuid>', 'your-project-slug');
```

Users without `auth.users` or without `mcp_user_projects` are blocked on the login form before password is checked.

Connector setup: [../open-brain-rnd/05-oauth-setup.md](../open-brain-rnd/05-oauth-setup.md)

## Local dev

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Deploy (Vercel)

Set `VITE_SUPABASE_*`, configure Supabase **Site URL** / **Redirect URLs**, push to deploy.
