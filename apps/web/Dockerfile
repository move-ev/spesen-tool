# syntax=docker/dockerfile:1

# ── Base: Bun + Node.js for building ─────────────────────────────────────────
# Debian (glibc), NOT Alpine (musl), on purpose: @appsignal/nodejs picks its
# native extension and agent binary at INSTALL time based on the libc it sees.
# The runner below is node:22-slim (glibc), so installing under musl would
# produce an image that builds and typechecks cleanly and then fails to load
# the agent at boot.
FROM oven/bun:1.3.14-debian AS base
RUN apt-get update && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Pruner: extract the minimal workspace subset for @zemio/web ───────────────
# turbo prune emits out/json (manifests only, for a cached install layer) and
# out/full (the source) for @zemio/web and its transitive workspace packages.
# New packages require no Dockerfile changes.
FROM base AS pruner
WORKDIR /app
COPY . .
RUN bunx turbo prune @zemio/web --docker

# ── Deps: install only the pruned dependencies ────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
# The @zemio/db postinstall runs `prisma generate`, which needs the schema
# and prisma.config.js (schema now lives under prisma/schema/, not the
# default prisma/schema.prisma Prisma falls back to without it).
COPY --from=pruner /app/out/full/packages/db/prisma/ ./packages/db/prisma/
COPY --from=pruner /app/out/full/packages/db/prisma.config.js ./packages/db/prisma.config.js

RUN bun install --frozen-lockfile

# ── Builder: compile Next.js app ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ENV NODE_ENV=production

# Runtime config is NOT baked at build — it is read from the environment at
# container start, so no build args are needed for it.
#
# turbo build runs ^build first, so workspace packages (db, encryption, logger)
# are compiled to dist before next build consumes them.
RUN SKIP_ENV_VALIDATION=1 bun run turbo build --filter=@zemio/web

# Next.js standalone does not include static assets; copy them into the
# standalone directory so the server can serve them correctly.
# With outputFileTracingRoot at the monorepo root, server.js lives at
# apps/web/server.js inside standalone, so assets must be placed relative to it.
RUN mkdir -p apps/web/.next/standalone/apps/web/.next && \
    cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static && \
    cp -r apps/web/public apps/web/.next/standalone/apps/web/public

# appsignal.cjs is loaded by the instrumentation hook at runtime, and
# @appsignal/nodejs is declared in serverExternalPackages so Next does not
# bundle it. Neither is picked up by standalone file tracing, so both are
# copied in explicitly.
RUN cp apps/web/appsignal.cjs apps/web/.next/standalone/apps/web/appsignal.cjs && \
    mkdir -p apps/web/.next/standalone/node_modules/@appsignal && \
    cp -r node_modules/@appsignal/nodejs \
          apps/web/.next/standalone/node_modules/@appsignal/nodejs

# ── Runner: slim Node.js image ────────────────────────────────────────────────
# node:22-slim (Debian) is required because the Prisma migration CLI needs
# glibc. Alpine (musl) is incompatible with Prisma's default migration engine
# binary without additional binaryTargets configuration in schema.prisma.
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Install the Prisma CLI so the preDeployCommand can run migrations.
# Version must stay in sync with the prisma devDependency in packages/db.
RUN npm install -g prisma@7 --quiet

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Schema and JS config are required by `prisma migrate deploy` at pre-deploy time.
# prisma.config.js is plain JavaScript (no TypeScript compilation, no external imports)
# so it loads correctly when only the global prisma CLI is available in the runner.
# Locally, prisma.config.ts takes precedence (Prisma 7 searches .ts before .js).
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma.config.js ./packages/db/prisma.config.js

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "(cd packages/db && prisma migrate deploy) && node apps/web/server.js"]
