# Billing state changes are not written to the audit trail

Zemio's audit trail records every event against a real user, and that link is
enforced — an audit event without an actor cannot exist. Subscription changes
driven by Stripe have no human actor: nobody at the organization performs a
renewal or a dunning failure.

Rather than make the actor optional to accommodate one feature, the audit trail
records only the billing actions a person actually takes — an owner starting a
subscription — and leaves machine-driven state changes to Stripe's own event log,
which is already complete and immutable.

## Consequences

"Who committed us to this tier" is answerable from Zemio. "When did this
subscription go past due" is answerable from Stripe, not from Zemio's audit
trail. The audit trail's guarantee that every event has an accountable actor
stays intact.
