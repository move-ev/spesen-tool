import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, getCurrentSession } from "@/server/better-auth";

export default async function ServerLayout(
	props: LayoutProps<"/settings/org">,
) {
	const { children } = props;

	const session = await getCurrentSession();

	if (!session?.user) {
		redirect("/auth");
	}

	const hasPermission = await auth.api.hasPermission({
		headers: await headers(),
		body: {
			permissions: {
				organization: ["update"],
			},
		},
	});

	if (!hasPermission.success) {
		redirect("/");
	}

	return children;
}
