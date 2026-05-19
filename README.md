# open-brain-auth (Coeo)

OAuth 2.1 authorization UI for the Coeo Supabase project.

Same behavior as [open-brain-rnd-auth](../open-brain-rnd-auth/README.md): email magic link, pre-login MCP access check, OAuth consent.

## SQL (required)

Run in the **Coeo** Supabase project:

**[../open-brain-setup-coeo/sql/README.md](../open-brain-setup-coeo/sql/README.md)**

Minimum:

1. [../open-brain-setup-coeo/sql/setup.sql](../open-brain-setup-coeo/sql/setup.sql)
2. [../open-brain-setup-coeo/sql/auth-ui-rpc.sql](../open-brain-setup-coeo/sql/auth-ui-rpc.sql)

Legacy DB: [mcp-auth-upgrade.sql](../open-brain-setup-coeo/sql/mcp-auth-upgrade.sql) first.

## Docs

- [../open-brain-setup-coeo/05-oauth-setup.md](../open-brain-setup-coeo/05-oauth-setup.md)
- [../open-brain-setup-coeo/auth/README.md](../open-brain-setup-coeo/auth/README.md) (in-repo `auth/` copy)

## Local dev

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```
