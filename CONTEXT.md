# Zemio

Expense reporting for student initiatives. Organizations collect their members'
expenses into reports, review them, and pay them out. Organizations subscribe to
Zemio to use the product.

Zemio does not move money on behalf of its customers. Reimbursements are paid by
the organization through its own banking arrangements; Zemio only records the
banking details needed to make that payment.

## Language

### Organizations and people

**Organization**:
A student initiative using Zemio. The unit of tenancy, of billing, and of
ownership for every report and setting.
_Avoid_: tenant, company, account, client, customer

**Member**:
A person's participation in one organization, carrying their role there. A
person belonging to three organizations is three Members.
_Avoid_: seat, user, participant

**User**:
A person with a Zemio login, independent of any organization.
_Avoid_: account, profile

### Expenses

**Report**:
A collection of expenses submitted together for a single purpose, moving through
review as one unit.
_Avoid_: claim, submission, expense report

**Expense**:
A single cost within a report — a receipt, a travel allowance, or a food
allowance.
_Avoid_: line item, entry, cost

### Billing

**Subscription**:
An organization's ongoing agreement to pay for Zemio. An organization has at
most one, and it is the organization's — never a person's.
_Avoid_: plan, contract, licence

**Tier**:
A named commercial package — S, M, L, or a custom XL. Tiers differ only in how
many members they include; every tier grants identical functionality.
_Avoid_: plan, package, level, product

**Seat**:
One member's worth of a tier's included allowance. Seats are counted, never
issued or assigned: one member consumes one seat, whatever their role.
_Avoid_: licence, slot, user

**Seat Limit**:
The number of seats a tier includes. It is an expectation, not a barrier —
exceeding it is visible but never prevents anything.
_Avoid_: cap, quota, maximum

**Over Seat Limit**:
An organization with more members than its seat limit. Independent of
entitlement: an over-limit organization remains fully entitled.
_Avoid_: over quota, exceeded, overage

**Entitlement**:
Whether an organization may currently create new work in Zemio. Distinct from
any Stripe status — an organization behind on payment is still entitled, and so
is every organization when billing is switched off.
_Avoid_: access, active, paid-up, subscribed

**Lapsed**:
A subscription that has ended without payment. A lapsed organization becomes
read-only.
_Avoid_: expired, suspended, delinquent, churned

**Read-Only**:
The state of an unentitled organization: everything already recorded stays
visible and exportable, but no new reports or expenses can be created or
submitted.
_Avoid_: locked, frozen, suspended, disabled

**Billing Provider**:
Stripe. It is the record of what an organization pays, what tiers exist, and
what each tier includes. Zemio holds a cached copy of the current state, never
the history.
_Avoid_: payment gateway, processor

### Stripe's own vocabulary

These words belong to Stripe and should not be reused for Zemio concepts:
`active`, `past_due`, `canceled`, `unpaid`, `price`, `plan`, `customer`,
`quantity`. When a Stripe status is meant, name it as Stripe's; when Zemio's own
concept is meant, use **Entitlement**, **Tier**, or **Organization**.
