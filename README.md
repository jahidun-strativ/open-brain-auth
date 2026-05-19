# open-brain-auth

OAuth 2.1 authorization UI — **email + password** sign-in, pre-login MCP access check, OAuth consent.

## SQL

**[../open-brain-rnd/sql/README.md](../open-brain-rnd/sql/README.md)**

1. [setup.sql](../open-brain-setup-coeo/sql/setup.sql)
2. [auth-ui-rpc.sql](../open-brain-setup-coeo/sql/auth-ui-rpc.sql)

## Supabase

- **Email + password** ON, **sign-up** OFF
- Create users with password in **Authentication → Users**
- Grant `mcp_user_projects` in SQL

Full guide: [../open-brain-setup-coeo/05-oauth-setup.md](../open-brain-setup-coeo/05-oauth-setup.md)

## Dev

```bash
pnpm install && cp .env.example .env.local && pnpm dev
```

## Deploy (Vercel)

Set env vars, point Supabase **Site URL** / **Redirect URLs** at production host, deploy. Push to Git if Vercel auto-deploys.
