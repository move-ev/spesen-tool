/**
 * Generates a URL-friendly organization slug from a name string.
 *
 * Converts to lowercase, replaces spaces and special chars with hyphens,
 * removes consecutive hyphens, and trims hyphens from start/end.
 */
export function generateSlugFromName(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[äÄ]/g, "ae")
		.replace(/[öÖ]/g, "oe")
		.replace(/[üÜ]/g, "ue")
		.replace(/ß/g, "ss")
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}
