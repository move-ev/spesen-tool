# Webhooks are refresh signals, not state

When a Stripe subscription webhook arrives, the handler ignores the subscription
object in the event payload and re-fetches the subscription from the Stripe API
before writing anything.

This looks redundant — the payload already contains the data — and a future
reader will be tempted to remove the extra call. Do not. Stripe does not
guarantee event ordering, so a delayed `updated` event can carry older state than
one already processed and would overwrite newer data with stale data. Re-fetching
makes the event a signal that *something* changed rather than a claim about
*what* it changed to, which removes the ordering problem entirely instead of
trying to detect and correct for it.

## Consequences

One additional Stripe API call per webhook, on a low-volume endpoint. Events are
also recorded by Stripe's event id before processing, so redelivery — which
Stripe does aggressively on any non-2xx response — is a no-op.
