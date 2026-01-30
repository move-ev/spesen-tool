import { Button } from "@zemio/ui/components/button";
import { Input } from "@zemio/ui/components/input";
import { ChevronDownIcon } from "lucide-react";
import { Shell } from "@/components/shell";
import { organizationInvitationsColumns } from "@/components/tables/org-invitations-columns";
import { OrganizationMembersTable } from "@/components/tables/org-members";
import { organizationMembersColumns } from "@/components/tables/org-members-columns";
import { api } from "@/trpc/server";
import { CreateInvite } from "./_components/create-invite";

export default async function ServerPage() {
	const members = await api.organization.listMembers({});
	const invitations = await api.organization.listInvitations({});

	return (
		<Shell>
			<section className="container mb-10">
				<h1 className="font-semibold text-2xl text-zinc-800">Mitglieder</h1>
			</section>
			<section className="container mb-20 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Input className="w-72" placeholder="Suche nach Mitgliedern... " />
					<Button size={"default"} variant={"outline"}>
						Filtern <ChevronDownIcon />
					</Button>
				</div>
				<div>
					<CreateInvite>Einladen</CreateInvite>
				</div>
			</section>
			<section className="container">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="font-semibold text-lg text-zinc-800">Einladungen</h2>
					<CreateInvite>Einladen</CreateInvite>
				</div>
				<OrganizationMembersTable
					className="mt-6"
					columns={organizationInvitationsColumns}
					data={invitations}
				/>
			</section>
			<section className="container mt-20">
				<h2 className="font-semibold text-lg text-zinc-800">Aktive Mitglieder</h2>
				<OrganizationMembersTable
					className="mt-6"
					columns={organizationMembersColumns}
					data={members}
				/>
			</section>
		</Shell>
	);
}
