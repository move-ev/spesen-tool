---
"@zemio/web": minor
---

Send transactional email through Scaleway instead of Resend, and move the
templates and transport into the new `@zemio/email` package.

Requires `SCALEWAY_TEM_SECRET_KEY`, `SCALEWAY_TEM_PROJECT_ID` and `EMAIL_FROM`
to be set; `RESEND_API_KEY` is no longer read. `EMAIL_FROM` was previously
validated but ignored, and is now the sender of every outgoing email, written as
`Name <address>` on a domain verified in Scaleway.

Emails now carry a plaintext part alongside the HTML, and their links are built
from `BETTER_AUTH_URL` rather than guessed from `NODE_ENV` — which had status
notifications in production linking to another domain, and every staging email
linking to production.
