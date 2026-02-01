import { Shell } from "@/components/shell";

export default async function ServerPage() {
	return (
		<Shell>
			<section className="container max-w-3xl">
				<h1 className="font-semibold text-2xl text-zinc-800">
					Allgemeine Einstellungen
				</h1>
			</section>
			<section className="container max-w-3xl">
				<div className="rounded-lg border bg-background p-6 shadow-2xs">
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="font-medium text-sm text-zinc-800">Logo</p>
							<p className="text-xs text-zinc-500">
								Ändere das Logo der Organisation.
							</p>
						</div>
					</div>
				</div>
			</section>
		</Shell>
	);
}
