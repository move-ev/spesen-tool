# Raw Stripe SDK rather than the Better Auth Stripe plugin

Zemio uses Better Auth for authentication and organizations, and Better Auth
publishes an official Stripe plugin that handles customers, subscriptions and
webhooks with organization-scoped billing built in. We are not using it. Billing
is implemented directly against the `stripe` SDK.

## Considered Options

The plugin would have provided customer creation, checkout, the billing portal
and webhook verification out of the box. Against that: it owns database schema in
a repository where migrations are hand-written and the generated Prisma client is
committed; it ties the billing lifecycle to Better Auth's release cadence, which
is currently moving fast on 1.6.x; and it mounts its webhook under the auth
handler rather than a standalone route.

The deciding argument was that the plugin's savings are concentrated in the parts
that are already easy. Creating a checkout session is a handful of lines. The
genuinely hard part — deciding what entitlement means when members join
organizations automatically — is ours to write either way.

## Consequences

Anyone who later reaches for the plugin should know this was considered and
rejected on coupling grounds, not overlooked.
