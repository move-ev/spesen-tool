export function isOrganizationAdminRole(
	role: string | null | undefined,
): boolean {
	return role === "admin" || role === "owner";
}

/**
 * The single owner of an organization, as distinct from its administrators.
 *
 * Kept separate from {@link isOrganizationAdminRole} because the two answer
 * different questions: who may run the organization, and who may commit it to
 * paying for it.
 */
export function isOrganizationOwnerRole(
	role: string | null | undefined,
): boolean {
	return role === "owner";
}

export function createOrganizationSlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^[-]+|[-]+$/g, "");
}
