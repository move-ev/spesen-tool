export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		// Starts the AppSignal agent. First, so that it is running before the
		// billing bootstrap below can fail.
		await import("../appsignal.cjs");

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
}
