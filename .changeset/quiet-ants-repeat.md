---
"@zemio/web": patch
---

Upload browser sourcemaps to AppSignal so frontend backtraces resolve to real
code instead of minified chunk names.

Maps are uploaded privately and stripped from the served assets — they embed the
original source, so serving them would publish the frontend. CI extracts them
from the image it just pushed, because Turbopack chunk names are not stable
across builds and maps from a second build would resolve nothing.

Requires a new `APPSIGNAL_PUSH_API_KEY` GitHub Actions secret.
