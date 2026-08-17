# Seat limits are advisory and never block

An organization over its seat limit keeps working exactly as before. The only
consequence is a banner, shown to every member. Nothing is refused, no login is
blocked, and no member is turned away.

A seat limit that does not limit anything looks like an oversight, so the reason
matters: **members are created automatically at login.** A user whose Microsoft
tenant matches an organization is added to it during session creation, without an
invitation and without either party choosing it. An organization on a 25-seat
tier whose tenant contains 400 employees will exceed its limit through nobody's
action. Enforcing the limit would mean failing logins for a billing condition the
person logging in cannot see, cannot cause and cannot fix.

Making the limit binding would require abandoning tenant auto-join for billed
organizations and moving them to invitation-only membership. That is a plausible
future direction, but it is a change to how people join Zemio, not a billing
detail, and it is not this decision.

## Consequences

Seat limits are a commercial conversation, not a technical control. Over-limit
organizations are visible to the operator and expected to be resolved by sales.
Seat counts are derived by counting members on demand; there is no seat ledger to
keep in sync, and nothing is ever pushed to Stripe as a quantity.
