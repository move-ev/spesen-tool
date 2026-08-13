import { beforeEach, describe, expect, it, vi } from "vitest";

// The route reads its configuration through the module-level `billingConfig`,
// resolved from the environment at import, so switching billing on means
// replacing that module — as in billing.enabled.test.ts.
vi.mock("@/server/modules/billing/billing.config", async (importOriginal) => ({
	...(await importOriginal<object>()),
	billingConfig: {
		enabled: true,
		secretKey: "sk_test_1",
		webhookSecret: "whsec_1",
	},
}));

// A real client would need credentials, and a real db client a DATABASE_URL.
const constructEventAsync = vi.fn();
vi.mock("@/server/modules/billing/billing.stripe", () => ({
	getStripe: () => ({ webhooks: { constructEventAsync } }),
}));

const handleStripeEvent = vi.fn();
vi.mock("@/server/modules/billing/billing.webhook", () => ({
	handleStripeEvent,
}));

vi.mock("@/server/db", () => ({ db: {} }));

const { POST } = await import("./route");

function post(headers: Record<string, string> = {}) {
	return POST(
		new Request("https://zemio.test/api/billing/webhook", {
			method: "POST",
			headers,
			body: '{"id":"evt_1"}',
		}),
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	handleStripeEvent.mockResolvedValue("processed");
});

describe("the Stripe webhook route", () => {
	it("rejects a request carrying no signature, reading nothing", async () => {
		const response = await post();

		expect(response.status).toBe(400);
		expect(constructEventAsync).not.toHaveBeenCalled();
		expect(handleStripeEvent).not.toHaveBeenCalled();
	});

	it("rejects a request whose signature does not verify, reading nothing", async () => {
		constructEventAsync.mockRejectedValue(new Error("No signatures found"));

		const response = await post({ "stripe-signature": "t=1,v1=nonsense" });

		expect(response.status).toBe(400);
		expect(handleStripeEvent).not.toHaveBeenCalled();
	});

	it("verifies against the raw body and the configured secret", async () => {
		constructEventAsync.mockResolvedValue({ id: "evt_1" });

		await post({ "stripe-signature": "t=1,v1=good" });

		expect(constructEventAsync).toHaveBeenCalledWith(
			'{"id":"evt_1"}',
			"t=1,v1=good",
			"whsec_1",
		);
	});

	it("hands a verified event on and answers success", async () => {
		constructEventAsync.mockResolvedValue({ id: "evt_1" });

		const response = await post({ "stripe-signature": "t=1,v1=good" });

		expect(response.status).toBe(200);
		expect(handleStripeEvent).toHaveBeenCalledWith(expect.anything(), {
			id: "evt_1",
		});
	});

	it("fails loudly when handling throws, so Stripe redelivers", async () => {
		constructEventAsync.mockResolvedValue({ id: "evt_1" });
		handleStripeEvent.mockRejectedValue(new Error("database is down"));

		await expect(post({ "stripe-signature": "t=1,v1=good" })).rejects.toThrow(
			"database is down",
		);
	});
});

describe("the Stripe webhook route body limit", () => {
	function postBody(body: string, headers: Record<string, string> = {}) {
		return POST(
			new Request("https://zemio.test/api/billing/webhook", {
				method: "POST",
				headers: { "stripe-signature": "t=1,v1=deadbeef", ...headers },
				body,
			}),
		);
	}

	it("refuses a body too large to be a Stripe event, verifying nothing", async () => {
		// The endpoint is unauthenticated until the signature is checked, and
		// checking it needs the whole body in memory. Reading an unbounded one
		// first would let an anonymous request exhaust the process.
		const response = await postBody("x".repeat(1_000_001));

		expect(response.status).toBe(413);
		expect(constructEventAsync).not.toHaveBeenCalled();
		expect(handleStripeEvent).not.toHaveBeenCalled();
	});

	it("refuses on a declared length over the limit without reading the body", async () => {
		const response = await postBody('{"id":"evt_1"}', {
			"content-length": "50000000",
		});

		expect(response.status).toBe(413);
		expect(constructEventAsync).not.toHaveBeenCalled();
	});

	it("reads an ordinary event through unchanged", async () => {
		constructEventAsync.mockResolvedValue({ id: "evt_1", type: "x" });

		const response = await postBody('{"id":"evt_1"}');

		expect(response.status).toBe(200);
		expect(constructEventAsync).toHaveBeenCalledWith(
			'{"id":"evt_1"}',
			"t=1,v1=deadbeef",
			"whsec_1",
		);
	});
});
