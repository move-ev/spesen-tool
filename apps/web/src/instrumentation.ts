import * as Sentry from "@sentry/nextjs";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("../sentry.server.config");

		// Resolves the billing configuration while the server is starting, so a
		// deployment that turns billing on without credentials fails here rather
		// than on the first request that reaches the tRPC API.
		//
		// Exiting explicitly because Next.js logs a throwing instrumentation hook
		// and then leaves the process running: without this the container stays
		// up, holding its port open while being unable to serve anything.
		try {
			await import("./server/modules/billing/billing.config");
		} catch (error) {
			console.error(error instanceof Error ? error.message : error);
			process.exit(1);
		}
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("../sentry.edge.config");
	}
}

export const onRequestError = Sentry.captureRequestError;
