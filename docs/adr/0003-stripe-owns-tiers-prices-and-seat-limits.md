# Stripe owns tiers, prices and seat limits

No monetary amount, tier name, or seat limit is hardcoded in Zemio. Tiers are
discovered from Stripe prices carrying our own metadata, the included seat count
is read from that metadata, and displayed amounts come from Stripe.

The alternative — a tier catalogue in TypeScript — was rejected because XL is a
negotiated, per-customer tier. A code-level catalogue means every custom deal
requires a code change and a deploy, and it creates two places where commercial
terms live, which will eventually disagree. With Stripe as the source of truth, a
new custom customer is provisioned by creating a price in the dashboard.

## Consequences

The seat limit is copied onto Zemio's local subscription record when a webhook
fires, so entitlement checks stay local and fast rather than calling Stripe on
every request. Changing a tier's seat allowance in Stripe only takes effect for
an organization once a subscription event for it arrives.
