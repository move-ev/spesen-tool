---
"@zemio/web": minor
---

Replace Better Stack error tracking and logging with AppSignal (DEV-43).

The `@sentry/nextjs` SDK, which pointed at Better Stack's Sentry-compatible
ingest, is removed along with the `@logtail/node` log transport. Error tracking
now runs on `@appsignal/nodejs` (server) and `@appsignal/javascript` (browser),
and application logs go to AppSignal with user identifiers redacted.

Deployments must set `APPSIGNAL_PUSH_API_KEY`, `APPSIGNAL_FRONTEND_KEY`,
`APPSIGNAL_APP_NAME`, `APPSIGNAL_APP_ENV` and optionally `APP_REVISION`; the
`BETTER_STACK_*` and `SENTRY_*` variables are no longer read. The web image now
builds on a glibc base, because AppSignal selects its native agent at install
time and the runtime image is Debian.
