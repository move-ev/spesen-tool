import { TRPCError } from "@trpc/server";

/**
 * A single authorization rule: a pure predicate over the request-scoped facts
 * and the subject being acted on. Rules must not perform data access — the
 * subject is loaded before the decision is made.
 */
export type PolicyRule<TContext, TSubject> = (
	ctx: TContext,
	subject: TSubject,
) => boolean;

export type Policy<TAction extends string, TContext, TSubject> = {
	/** Non-throwing check, for callers that need to branch on the outcome. */
	can(action: TAction, ctx: TContext, subject: TSubject): boolean;
	/** Throws a typed `FORBIDDEN` when the action is not permitted. */
	authorize(action: TAction, ctx: TContext, subject: TSubject): void;
};

/**
 * Builds a policy from a rule table.
 *
 * Authorization is expressed as data — one entry per action — rather than as
 * branching copy-pasted into each procedure, so the full set of rules for a
 * resource is readable in one place. See docs/trpc-architecture.md §2.
 */
export function definePolicy<TAction extends string, TContext, TSubject>(
	rules: Record<TAction, PolicyRule<TContext, TSubject>>,
	forbiddenMessage: string,
): Policy<TAction, TContext, TSubject> {
	return {
		can(action, ctx, subject) {
			return rules[action](ctx, subject);
		},
		authorize(action, ctx, subject) {
			if (!rules[action](ctx, subject)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: forbiddenMessage,
				});
			}
		},
	};
}
