## How to deploy

1. pnpm install
2. pnpm dev
3. deploy permissions
4. generate drizzle schema
5. migrate drizzle schema

```bash
pnpm zero-deploy-permissions -p '.\src\zero-schema.ts' || pnpm zero-deploy-permissions -p './src/zero-schema.ts'
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

MAKE SURE TO MATCH ZERO SERVER VERSION TO VERSION IN ZERO-SVELTE PACKAGE!!!!!
