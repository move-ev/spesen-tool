# Unentitled organizations become read-only, over a named allowlist

When an organization is not entitled, it does not lose access to Zemio. Existing
reports, expenses, attachments, PDF exports, settings and banking details all
remain fully available. Only the creation of *new* work is refused: starting a
report, adding an expense, and submitting a report.

Two things follow from this, both deliberate.

**Access to records survives a billing dispute.** The data in Zemio is the
organization's own financial record, and people need it during exactly the period
when a payment has failed — for accounting, for audits, for reimbursing someone
who is waiting. Withholding it as payment leverage would be both hostile and, for
records the organization is legally obliged to retain, indefensible. Falling
behind on payment is also not a state the ordinary member caused or can resolve.

**The gate is an explicit allowlist, never a default.** Entitlement is checked by
naming the three operations it applies to, rather than by gating broadly and
exempting the rest. Under the opposite arrangement, any operation added later
would silently become billing-locked without anyone deciding it should be — a
class of bug that surfaces as a customer unable to do something unrelated to
billing, with no clue why.

## Consequences

Adding a fourth billable-only operation is a deliberate edit to the allowlist.
Falling behind on payment alone does not trigger this — an organization Stripe
reports as `past_due` stays entitled while Stripe retries, because a card that
expired on a Friday should not cost a customer their working week.
