import { Shell } from "@/components/shell";
import { UnifiedUsersTable } from "@/components/tables/unified-users-table";
import { unifiedUsersSearchParamsCache } from "@/lib/schemas/url-state";
import { CreateInvite } from "./_components/create-invite";

/**
 * Page props with searchParams for URL state management.
 *
 * Next.js automatically passes searchParams to page components.
 * We parse them server-side to prevent hydration mismatches.
 */
type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Organization Members & Invitations Page
 *
 * Features:
 * - Server-side URL parameter parsing (prevents hydration errors)
 * - Deep linking support (shareable URLs with filters)
 * - Browser history integration (back/forward buttons work)
 *
 * URL Structure:
 * - /org/settings/members                    (default view)
 * - /org/settings/members?page=2             (page 2)
 * - /org/settings/members?search=john        (search filter)
 * - /org/settings/members?page=3&search=test (combined)
 *
 * @param searchParams - URL search parameters (parsed by Next.js)
 */
export default async function MembersPage({ searchParams }: PageProps) {
	// Parse and validate URL parameters on the server
	// This ensures the initial render matches between server and client
	const { page, search } =
		await unifiedUsersSearchParamsCache.parse(searchParams);

	return (
		<Shell>
			<section className="container">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="font-semibold text-2xl text-zinc-800">
						Mitglieder & Einladungen
					</h1>
					<CreateInvite>Einladen</CreateInvite>
				</div>

				{/* Pass initial URL state to client component */}
				<UnifiedUsersTable initialPage={page} initialSearch={search} />
			</section>
		</Shell>
	);
}
