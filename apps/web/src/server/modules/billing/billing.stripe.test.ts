import { describe, expect, it } from "vitest";
import { getStripe } from "./billing.stripe";

// The suite pins BILLING_ENABLED off (vitest.setup.ts), so this is the state
// every self-hosted instance runs in. The enabled branch is left to the tests
// that mock the config module; constructing a real client here would only
// assert that the Stripe SDK works.
describe("getStripe with billing switched off", () => {
	it("refuses rather than handing back a client with no credentials", () => {
		expect(() => getStripe()).toThrow(/billing is switched off/);
	});
});
