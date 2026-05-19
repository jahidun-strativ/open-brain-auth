# open-brain-auth (Coeo)

OAuth 2.1 authorization UI — **email + password** sign-in, pre-login MCP access check, OAuth consent.

## SQL

**[../open-brain-setup-coeo/sql/README.md](../open-brain-setup-coeo/sql/README.md)**

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
