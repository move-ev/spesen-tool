import { headers } from "next/headers";
import { auth } from "@/server/better-auth";
import { AdminStats } from "./_components/admin-stats";

export default async function ServerPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const userName = session?.user?.name?.split(" ")[0] ?? "zurück";

	return (
		<main>
			<div className="h-svh overflow-y-auto py-12">
				<section className="container">
					<h1 className="font-semibold text-2xl text-zinc-800">
						Willkommen zurück{userName !== "zurück" ? `, ${userName}` : ""}!
					</h1>
				</section>
				<section className="container mt-6">
					<AdminStats />
				</section>
			</div>
		</main>
	);
}
