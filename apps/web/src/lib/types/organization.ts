/**
 * Unified type representing both organization members and invitations.
 *
 * This is a discriminated union type for type-safe handling of members and invitations.
 * Use the `type` field to discriminate between the two variants.
 *
 * @example
 * ```typescript
 * function handleUser(user: UnifiedUserRow) {
 *   if (user.type === 'member') {
 *     // TypeScript knows userId is available here
 *     console.log(user.userId);
 *   } else {
 *     // TypeScript knows expiresAt is available here
 *     console.log(user.expiresAt);
 *   }
 * }
 * ```
 */
export type UnifiedUserRow =
	| {
			id: string;
			type: "member";
			email: string;
			name: string | null;
			image: string | null;
			role: string;
			status: "active";
			joinedAt: Date;
			createdAt: Date;
			userId: string;
	  }
	| {
			id: string;
			type: "invitation";
			email: string;
			name: null;
			image: null;
			role: string;
			status: "pending" | "expired";
			joinedAt: Date;
			createdAt: Date;
			expiresAt: Date;
	  };
