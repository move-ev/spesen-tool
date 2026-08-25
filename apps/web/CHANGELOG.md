# @zemio/web

## 1.3.0

### Minor Changes

- [#193](https://github.com/zemio-co/zemio/pull/193) [`df1d26d`](https://github.com/zemio-co/zemio/commit/df1d26dd53945b716a4efd6f9511d7bad7dfecfa) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Send transactional email through Scaleway instead of Resend, and move the
  templates and transport into the new `@zemio/email` package.

  Requires `SCALEWAY_TEM_SECRET_KEY`, `SCALEWAY_TEM_PROJECT_ID` and `EMAIL_FROM`
  to be set; `RESEND_API_KEY` is no longer read. `EMAIL_FROM` was previously
  validated but ignored, and is now the sender of every outgoing email, written as
  `Name <address>` on a domain verified in Scaleway.

  Emails now carry a plaintext part alongside the HTML, and their links are built
  from `BETTER_AUTH_URL` rather than guessed from `NODE_ENV` — which had status
  notifications in production linking to another domain, and every staging email
  linking to production.

- [#195](https://github.com/zemio-co/zemio/pull/195) [`76a8137`](https://github.com/zemio-co/zemio/commit/76a813720a9258d602bf0896fa3e5392b22aeeac) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Remove the agentation dev overlay from the web app and drop its pinned agent
  skills.

  The overlay mounted only under `NODE_ENV=development` and talked to a local
  endpoint on port 4747, so no deployed build ever rendered it. Removing the
  package takes the import and the conditional mount in the root layout with it.

  `skills-lock.json` also pinned two skills from the same upstream —
  `agentation` and `agentation-self-driving`. With the package gone those were
  dead config that could still point an agent at an overlay that no longer
  exists, so they are removed too. Nothing to change in any environment.

- [#185](https://github.com/zemio-co/zemio/pull/185) [`28a5652`](https://github.com/zemio-co/zemio/commit/28a56528da5b95e6ab6669e2987ec5e6ae393eef) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Replace Better Stack error tracking and logging with AppSignal (DEV-43).

  The `@sentry/nextjs` SDK, which pointed at Better Stack's Sentry-compatible
  ingest, is removed along with the `@logtail/node` log transport. Error tracking
  now runs on `@appsignal/nodejs` (server) and `@appsignal/javascript` (browser),
  and application logs go to AppSignal with user identifiers redacted.

  Deployments must set `APPSIGNAL_PUSH_API_KEY`, `APPSIGNAL_FRONTEND_KEY`,
  `APPSIGNAL_APP_NAME` and `APPSIGNAL_APP_ENV`; the `BETTER_STACK_*` and
  `SENTRY_*` variables are no longer read. The web image now
  builds on a glibc base, because AppSignal selects its native agent at install
  time and the runtime image is Debian.

### Patch Changes

- [#187](https://github.com/zemio-co/zemio/pull/187) [`45bf5c8`](https://github.com/zemio-co/zemio/commit/45bf5c80c31871d92a2a85fc22f6d7bb227dfcdd) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Bake the build's commit SHA into the image as `APP_REVISION` instead of
  configuring it per environment.

  AppSignal opens a deploy marker whenever the revision changes, and links
  backtrace frames to the repo at that commit — so the value has to be the real
  commit and has to agree between build time and runtime. Setting it by hand on
  each platform could only ever drift, and a stale revision is worse than an
  absent one.

  CI now passes `--build-arg APP_REVISION=${{ github.sha }}`. Nothing to configure
  on Coolify or Railway; remove `APP_REVISION` if you set it there.

- [#193](https://github.com/zemio-co/zemio/pull/193) [`f326063`](https://github.com/zemio-co/zemio/commit/f32606339fc201257f0695516f0b030a5419ae4e) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Send the submission confirmation to owners who never opened their notification
  preferences.

  A missing preferences row was emitted as `null` and compared against `ALL`, so
  the confirmation was skipped — while the same `null` passed the status-change
  check and those emails were sent. Both now see the `ALL` that the schema default
  and the preferences screen already promised.

- [#188](https://github.com/zemio-co/zemio/pull/188) [`1dff194`](https://github.com/zemio-co/zemio/commit/1dff194e8e2613e724acacf2bbcebc277490b264) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Upload browser sourcemaps to AppSignal so frontend backtraces resolve to real
  code instead of minified chunk names.

  Maps are uploaded privately and stripped from the served assets — they embed the
  original source, so serving them would publish the frontend. CI extracts them
  from the image it just pushed, because Turbopack chunk names are not stable
  across builds and maps from a second build would resolve nothing.

  Requires a new `APPSIGNAL_PUSH_API_KEY` GitHub Actions secret.

- [#190](https://github.com/zemio-co/zemio/pull/190) [`bef2667`](https://github.com/zemio-co/zemio/commit/bef26673dae90497d259b3b9a82559d4c61d053c) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Redact user identifiers on the stdout fallback path, so container logs stay safe
  to drain.

  Logging to stdout previously kept full fields on the grounds that they never
  left the host. A log drain removes that guarantee, so the fallback is now
  redacted wherever stdout can leave — full fields survive only in development.

## 1.2.0

### Minor Changes

- [#183](https://github.com/zemio-co/zemio/pull/183) [`82bcc3b`](https://github.com/zemio-co/zemio/commit/82bcc3bbee351a9d6a576f814d28a0e82fd41484) Thanks [@chris23lngr](https://github.com/chris23lngr)! - implement billing with stripe

### Patch Changes

- [#179](https://github.com/zemio-co/zemio/pull/179) [`14eafc5`](https://github.com/zemio-co/zemio/commit/14eafc50fe55e61dcd3463ae65b703f73d7c9c4b) Thanks [@chris23lngr](https://github.com/chris23lngr)! - fix: issue report numbers per organization instead of from a global counter

- Updated dependencies [[`82bcc3b`](https://github.com/zemio-co/zemio/commit/82bcc3bbee351a9d6a576f814d28a0e82fd41484)]:
  - @zemio/i18n@0.2.0

## 1.1.0

### Minor Changes

- [#174](https://github.com/zemio-co/zemio/pull/174) [`cf9b230`](https://github.com/zemio-co/zemio/commit/cf9b230161eb82f3936991d57b9fa2e0d78b63e3) Thanks [@chris23lngr](https://github.com/chris23lngr)! - allow custom colors for cost units

- [#176](https://github.com/zemio-co/zemio/pull/176) [`cee7b16`](https://github.com/zemio-co/zemio/commit/cee7b166f86fb4b4a184e26fa4fd3fa08ead4708) Thanks [@chris23lngr](https://github.com/chris23lngr)! - improve database schema and tRPC endpoints

- [#172](https://github.com/zemio-co/zemio/pull/172) [`fc226aa`](https://github.com/zemio-co/zemio/commit/fc226aaf860c59b6b7599da2ce4478d20ac6a1e8) Thanks [@chris23lngr](https://github.com/chris23lngr)! - improve use of language across apps using translations & next-intl

- [#171](https://github.com/zemio-co/zemio/pull/171) [`b065953`](https://github.com/zemio-co/zemio/commit/b06595363e50ad17801e603eaac3d7f40a090e80) Thanks [@chris23lngr](https://github.com/chris23lngr)! - paid status for reports with giro code ability

- [#177](https://github.com/zemio-co/zemio/pull/177) [`c8c26a9`](https://github.com/zemio-co/zemio/commit/c8c26a9018d1d637bf52102f76b74905da3dc548) Thanks [@chris23lngr](https://github.com/chris23lngr)! - updated applications to use the new ui package

### Patch Changes

- [#173](https://github.com/zemio-co/zemio/pull/173) [`0d27e58`](https://github.com/zemio-co/zemio/commit/0d27e58fc2703007d347ee60137fb70138b0e376) Thanks [@chris23lngr](https://github.com/chris23lngr)! - hide draft reports from admins

- [#169](https://github.com/zemio-co/zemio/pull/169) [`1f56113`](https://github.com/zemio-co/zemio/commit/1f56113b80437dcff050ccda14b5d63f48326322) Thanks [@chris23lngr](https://github.com/chris23lngr)! - reporting endpoints return only top 5 entries

- Updated dependencies [[`782e1b2`](https://github.com/zemio-co/zemio/commit/782e1b28fb9aed2994369f45a53d37053d6b573b), [`cee7b16`](https://github.com/zemio-co/zemio/commit/cee7b166f86fb4b4a184e26fa4fd3fa08ead4708), [`fc226aa`](https://github.com/zemio-co/zemio/commit/fc226aaf860c59b6b7599da2ce4478d20ac6a1e8), [`c8c26a9`](https://github.com/zemio-co/zemio/commit/c8c26a9018d1d637bf52102f76b74905da3dc548)]:
  - @zemio/ui@0.1.0
  - @zemio/i18n@0.1.0

## 1.0.0

Exits the prerelease cycle entered for the 1.0.0 major bump below; no
functional change from 1.0.0-alpha.0.

## 1.0.0-alpha.0

### Major Changes

- [#161](https://github.com/zemio-co/zemio/pull/161) [`979b5da`](https://github.com/zemio-co/zemio/commit/979b5dac8f6b03dbf5a30f687a0a90d6503ded8c) Thanks [@chris23lngr](https://github.com/chris23lngr)! - Initial stable release of zemio stack
