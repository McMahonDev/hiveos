## How to deploy

1. pnpm install
2. pnpm dev
3. deploy permissions
4. generate drizzle schema
5. migrate drizzle schema

```bash
npx zero-deploy-permissions -p '.\src\schema.ts'
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```
