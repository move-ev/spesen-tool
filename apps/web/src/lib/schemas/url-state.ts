/**
 * URL State Management Schema
 *
 * Type-safe URL parameter parsing and serialization using nuqs.
 * Enables shareable URLs, deep linking, and proper browser history support.
 *
 * @see https://nuqs.47ng.com/
 */

import {
	createSearchParamsCache,
	parseAsInteger,
	parseAsString,
} from "nuqs/server";

/**
 * URL state parsers for the unified users table.
 *
 * Defines how URL parameters are parsed, validated, and serialized.
 * Each parser includes:
 * - Type validation (parseAsInteger, parseAsString, etc.)
 * - Default values (withDefault)
 * - Serialization options (shallow routing, throttling, clear on default)
 *
 * @example
 * ```typescript
 * // Clean URLs with clearOnDefault
 * /org/settings/members                    // Default view (page 1, no search)
 * /org/settings/members?page=2             // Page 2
 * /org/settings/members?search=john        // Search "john" (page 1)
 * /org/settings/members?page=3&search=test // Page 3 with search
 * ```
 */
export const unifiedUsersSearchParams = {
	/**
	 * Current page number (1-indexed)
	 *
	 * Features:
	 * - Shallow routing: Uses replaceState instead of pushState to avoid history pollution
	 * - Clear on default: Removes ?page=1 from URL for cleaner URLs
	 * - Validation: Automatically handles invalid values (non-integers, negatives)
	 *
	 * @default 1
	 */
	page: parseAsInteger.withDefault(1).withOptions({
		shallow: true, // Don't add to browser history on every page change
		clearOnDefault: true, // Remove from URL when page === 1
		scroll: false, // Don't scroll to top when page changes
	}),

	/**
	 * Email search filter
	 *
	 * Features:
	 * - Throttled updates: Updates URL max once per 300ms during typing
	 * - Shallow routing: Uses replaceState to avoid history pollution
	 * - Clear on default: Removes ?search= from URL when empty
	 * - XSS safe: nuqs automatically encodes/decodes URL parameters
	 *
	 * @default ""
	 */
	search: parseAsString.withDefault("").withOptions({
		shallow: true, // Don't add to browser history on every keystroke
		clearOnDefault: true, // Remove from URL when search is empty
		throttleMs: 300, // Update URL at most once per 300ms (built-in debouncing)
		scroll: false, // Don't scroll to top when search changes
	}),

	// Future: Add more filters here
	// Example filters for extensibility:
	//
	// status: parseAsStringEnum(["all", "active", "pending", "expired"])
	//   .withDefault("all")
	//   .withOptions({ clearOnDefault: true }),
	//
	// role: parseAsStringEnum(["all", "admin", "member", "owner"])
	//   .withDefault("all")
	//   .withOptions({ clearOnDefault: true }),
	//
	// sortBy: parseAsStringEnum(["name", "email", "joinedAt"])
	//   .withDefault("joinedAt")
	//   .withOptions({ clearOnDefault: true }),
	//
	// sortOrder: parseAsStringEnum(["asc", "desc"])
	//   .withDefault("desc")
	//   .withOptions({ clearOnDefault: true }),
} as const;

/**
 * Server-side search params cache for initial render.
 *
 * This cache is used to parse URL parameters on the server during SSR/SSG,
 * preventing hydration mismatches between server and client.
 *
 * Usage in page.tsx:
 * ```typescript
 * export default async function MembersPage({ searchParams }) {
 *   const { page, search } = await unifiedUsersSearchParamsCache.parse(searchParams);
 *   return <UnifiedUsersTable initialPage={page} initialSearch={search} />;
 * }
 * ```
 *
 * Why this is necessary:
 * - Server renders initial HTML with URL state
 * - Client hydrates with same state
 * - Prevents "Text content does not match" errors
 * - Ensures consistent rendering between server and client
 */
export const unifiedUsersSearchParamsCache = createSearchParamsCache(
	unifiedUsersSearchParams,
);

/**
 * TypeScript type for URL state.
 *
 * Automatically inferred from the parsers, ensuring type safety.
 *
 * @example
 * ```typescript
 * const urlState: UnifiedUsersUrlState = {
 *   page: 2,
 *   search: "john@example.com"
 * };
 * ```
 */
export type UnifiedUsersUrlState = {
	page: number;
	search: string;
};

/**
 * Validation helpers for URL state
 */
export const urlStateValidation = {
	/**
	 * Validates and clamps a page number to a valid range.
	 *
	 * @param page - The page number to validate
	 * @param totalPages - The maximum number of pages
	 * @returns A valid page number within [1, totalPages]
	 *
	 * @example
	 * ```typescript
	 * clampPage(0, 10)    // Returns 1
	 * clampPage(5, 10)    // Returns 5
	 * clampPage(999, 10)  // Returns 10
	 * ```
	 */
	clampPage: (page: number, totalPages: number): number => {
		if (page < 1) return 1;
		if (totalPages === 0) return 1;
		if (page > totalPages) return totalPages;
		return page;
	},

	/**
	 * Validates a search string for safety.
	 *
	 * Note: nuqs automatically handles URL encoding/decoding,
	 * and Prisma handles SQL sanitization. This is an additional safety layer.
	 *
	 * @param search - The search string to validate
	 * @returns The validated search string
	 */
	validateSearch: (search: string): string => {
		// Trim whitespace
		const trimmed = search.trim();

		// Limit length to prevent abuse
		const maxLength = 200;
		if (trimmed.length > maxLength) {
			return trimmed.slice(0, maxLength);
		}

		return trimmed;
	},
} as const;
