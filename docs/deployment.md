# Deployment

Zemio deploys two services — `web` (Next.js) and `api` (Hono) — as Docker
images. Images are **built in CI** and published to the GitHub Container
Registry; Railway deploys the prebuilt images rather than building them itself.

## Why CI builds the images

Building in GitHub Actions gives a single, reproducible artifact that is
promoted across environments — the runtime configuration is injected by Railway
at container start (see "Runtime configuration"), so the same image is
environment-agnostic. It also supports BuildKit secret mounts
(`RUN --mount=type=secret`), which Railway's builder does not; no build
currently needs one, but a future build-time credential can be passed without
persisting it in an image layer.

## Pipeline

`.github/workflows/build-images.yml`:

- **Pull requests** (into `master` or `canary`) build both images **without**
  pushing — this catches Docker/build breakage before merge.
- **Pushes to `master`** (production) and **`canary`** (staging) build and push
  both images to:
  - `ghcr.io/<owner>/zemio-web`
  - `ghcr.io/<owner>/zemio-api`
- **Version tags** (`web-vX.Y.Z`, `api-vX.Y.Z`) build and push only the
  matching app's image — web and api version and release independently (see
  `.changeset/config.json`), so a release of one doesn't touch the other.
- Image tags published per build:
  - `sha-<40hex>` — immutable, every build (use for reproducible pins/rollback).
  - the **branch name** — a moving tag per branch (`master`, `canary`), always
    pointing at that branch's latest build.
  - the version, e.g. `1.2.0` — extracted from a `web-v*`/`api-v*` tag push.
  - `latest` — on the default branch (`master`) only.

  So production tracks `latest` (or `master`) and staging tracks `canary`, while
  any deploy can still be pinned to an exact `sha-…`.

## Railway configuration

Each service's source is set to a registry image (`ghcr.io/<owner>/zemio-web` or
`zemio-api`), not a build from `apps/*/Dockerfile` — the `apps/*/railway.toml`
build section is unused; only its runtime settings (healthcheck, restart
policy) apply. Staging services track the `canary` tag; production services
track `master`.

Neither service has a linked GitHub repo, so Railway's auto-deploy-on-new-image
cannot fire: that feature requires a linked repo. **Nothing about pushing a new
image to GHCR causes Railway to run it.**

(This used to be justified by the Dockerfile needing a `--mount=type=secret`
step that Railway's builder cannot parse. That step went with the Sentry
source-map upload — the Dockerfile no longer has one — so linking a repo is no
longer blocked on that account, though CI-built images remain the arrangement
in use.)

### Deploying a newly built image

`build-images.yml`'s `deploy-staging`/`deploy-production` jobs are what
actually ships a build: after a canary push (or a `web-vX.Y.Z`/`api-vX.Y.Z` tag
push for production) builds and pushes the image, these jobs call
`railway redeploy --service <id> --yes` for the affected service(s), which
pulls the tag's current image and restarts the service. Without this step a pushed
image just sits in GHCR until someone manually redeploys it in the dashboard.

This needs a Railway **project token** per environment (project tokens are
scoped to exactly one environment) stored as GitHub secrets:

| Secret | Scope |
| --- | --- |
| `RAILWAY_TOKEN_STAGING` | Staging environment project token |
| `RAILWAY_TOKEN_PRODUCTION` | Production environment project token |

Service IDs are hardcoded in the workflow rather than looked up by name.

## Runtime configuration

Set these on whichever platform hosts the environment. They are injected at
container start, never baked into the image, which is what lets one image serve
every environment:

> The sections above describe Railway. Staging has since moved to Hetzner +
> Coolify; rewriting them (and replacing the `railway redeploy` step) is tracked
> by the Hetzner migration, not here.

- Core: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, the
  `MICROSOFT_*`, `STORAGE_*`, `RESEND_API_KEY`, `SECRET_ENCRYPTION_KEY`,
  `INTERNAL_API_SECRET`, `API_URL`, etc. (see `apps/web/src/env.js`).
- Error tracking (AppSignal; read at runtime, the front-end key is injected
  into the browser at request time):
  - `APPSIGNAL_PUSH_API_KEY` — server key; absent turns monitoring off
  - `APPSIGNAL_FRONTEND_KEY` — browser key, a *different* credential
  - `APPSIGNAL_APP_NAME` — `Zemio Web`
  - `APPSIGNAL_APP_ENV` — `production` or `staging`
  > `APP_REVISION` is **not** set here — it is baked into the image at build
  > time. See [Build revision](#build-revision) below.

  > Name + environment identify the app on appsignal.com. Changing either
  > creates a **new** app with empty history rather than renaming the old one.

  Browser reports are relayed through `/api/monitoring` on our own origin
  rather than posted straight to AppSignal, so AppSignal never sees an end
  user's IP address. Any proxy or CDN in front of the app must let that path
  through.
- Logging: application logs go to AppSignal under the `web` group, with user
  identifiers redacted on the way out (`apps/web/src/lib/log-redaction.ts`).
  Logs fall back to stdout/stderr when AppSignal is not configured, and stdout
  keeps its full fields — those stay on the host.
- Billing (optional; leave unset to run without billing):
  - `BILLING_ENABLED` — `true`/`1` turns billing on for the deployment.
    Anything else, including unset, leaves it off: no billing interface, and
    every organization entitled (ADR-0001).
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

  > The two Stripe variables are optional on their own but **required once
  > `BILLING_ENABLED` is on** — the container fails to start if either is
  > missing, naming every one that is absent so a second restart is not needed
  > to discover the second variable.

  Turning the flag on enforces nothing by itself: enforcement also needs
  `billingEnforced` on the individual organization, so a rollout can be staged
  one customer at a time. See [billing-runbook.md](./billing-runbook.md) for
  that and for verifying billing locally against Stripe test mode.

## Build revision

`APP_REVISION` carries the commit an image was built from. CI passes it as a
Docker build arg (`--build-arg APP_REVISION=${{ github.sha }}`) and the runner
stage bakes it into the image. **Do not set it on Coolify or Railway** — a value
set there shadows the correct one, and a stale revision is worse than none.

It is deliberately not per-environment configuration. The revision identifies
the *artifact*: the same image is the same code wherever it runs, so a setting
that could differ between staging and production would be wrong by
construction. This does not weaken "build once, deploy anywhere" — one image
reporting one revision everywhere is the point.

AppSignal opens a deploy marker whenever the value changes, and links backtrace
frames to the repo at that commit, so it must be the real SHA rather than a
version string.

The platform-provided variables do not work for this pipeline. Coolify's
`SOURCE_COMMIT` is excluded from Docker builds by default and applies to
git-based resources, while staging deploys a prebuilt image from GHCR; Railway's
`RAILWAY_GIT_COMMIT_SHA` needs a linked repo, which neither service has. Both
describe the platform's view of the repo rather than the artifact running.

> This relies on both platforms deploying the **prebuilt GHCR image**. The
> `builder = "DOCKERFILE"` line in `apps/web/railway.toml` is unused for that
> reason (see "Railway configuration"); a platform that built from source would
> get the empty `ARG` default and no revision at all.

## Database migrations

`prisma migrate deploy` runs in the web container's start command (`CMD`), so it
executes with full log visibility and the same env/network context as the app.
Prisma takes a database advisory lock, so concurrent replicas serialize rather
than conflict.

## Building images locally

```sh
# web
docker build -f apps/web/Dockerfile -t zemio-web .

# api
docker build -f apps/api/Dockerfile -t zemio-api .
```
