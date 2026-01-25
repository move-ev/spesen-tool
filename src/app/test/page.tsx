import { OrganizationSwitcher } from "@/components/org-switcher";

export default async function TestPage() {
	return (
		<main className="p-32">
			<OrganizationSwitcher className={"w-48"} />
		</main>
	);
}
