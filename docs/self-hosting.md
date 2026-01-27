# Self-Hosting Guide

This guide explains how to deploy and configure Spesen Tool in a self-hosted environment.

## Quick Start (Docker Compose DB + local app)

1. **Install dependencies**

```bash
pnpm install
```

2. **Create your env file**

```bash
cp -n apps/web/.env.example apps/web/.env
```

3. **Start PostgreSQL (development)**

```bash
cd infra && docker compose up -d
```

The compose file exposes Postgres on port `5435` (see `infra/docker-compose.yml`).

4. **Run migrations**

```bash
pnpm --filter @zemio/web db:migrate
```

5. **Start the app**

```bash
pnpm dev
```

## Configuration

Spesen Tool is configured **entirely via environment variables**.

- **Example env file**: `apps/web/.env.example`
- **Authoritative list of required env vars**: `apps/web/src/env.js`

## Storage (S3-compatible)

For S3 CORS configuration, see:

- `infra/aws/s3-cors.json`

## Production build

```bash
pnpm build
pnpm --filter @zemio/web start
```

## Troubleshooting

- **Build fails due to missing env vars**: set `SKIP_ENV_VALIDATION=1` for the build step (only if you understand the risk).
