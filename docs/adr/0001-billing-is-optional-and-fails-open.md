# Billing is optional, and fails open when disabled

Zemio is open source and self-hostable, so the product must run fully without a
Stripe account. Billing is therefore gated behind a single switch, and when it is
off every organization is treated as entitled and all billing surfaces disappear.

We chose to fail *open* rather than closed. Failing closed would be the safer
instinct, but it would brick every self-hosted instance the moment it upgraded to
a release containing this feature — a self-hoster who never asked for billing
would find their expense tool read-only. The cost of failing open is that a
misconfigured hosted deployment silently stops enforcing payment; we accept that,
because it is recoverable and a bricked instance is not.

## Consequences

Every entitlement check has a "billing disabled" branch that must return
entitled. When billing is switched on, the Stripe credentials become required and
their absence fails at startup rather than at the first checkout — a deployment
that claims to bill must be able to bill.

The switch is deliberately two-level: a deployment-wide flag, and a per-organization
enforcement override beneath it. Without the second level, the day the flag is
turned on is the day enforcement begins for every organization simultaneously,
with no way to try it on one willing customer first. The override makes that a
staged rollout rather than a cutover, and it remains useful afterwards for any
organization that must be exempted for commercial reasons.
