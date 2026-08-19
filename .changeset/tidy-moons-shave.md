---
"@zemio/web": patch
---

Redact user identifiers on the stdout fallback path, so container logs stay safe
to drain.

Logging to stdout previously kept full fields on the grounds that they never
left the host. A log drain removes that guarantee, so the fallback is now
redacted wherever stdout can leave — full fields survive only in development.
