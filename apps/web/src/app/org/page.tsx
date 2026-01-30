import { CreateOrganizationForm } from "@/components/forms/org/create-org";
import { OrganizationSwitcher } from "@/components/org-switcher";

export default function OrgPage() {
	return (
		<div>
			<CreateOrganizationForm />
			<OrganizationSwitcher />
		</div>
	);
}
