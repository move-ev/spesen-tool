---
"@zemio/web": patch
---

Bake the build's commit SHA into the image as `APP_REVISION` instead of
configuring it per environment.

AppSignal opens a deploy marker whenever the revision changes, and links
backtrace frames to the repo at that commit — so the value has to be the real
commit and has to agree between build time and runtime. Setting it by hand on
each platform could only ever drift, and a stale revision is worse than an
absent one.

CI now passes `--build-arg APP_REVISION=${{ github.sha }}`. Nothing to configure
on Coolify or Railway; remove `APP_REVISION` if you set it there.
