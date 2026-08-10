/** Prisma `skip`/`take` for a 1-based offset page. The shared offset contract. */
export function offsetPageArgs(input: { page: number; pageSize: number }): {
	skip: number;
	take: number;
} {
	return {
		skip: (input.page - 1) * input.pageSize,
		take: input.pageSize,
	};
}

/** Total number of pages for an offset-paginated result. */
export function pageCount(totalCount: number, pageSize: number): number {
	return Math.ceil(totalCount / pageSize);
}

/**
 * The pagination envelope every offset-paginated endpoint returns.
 *
 * `totalCount` is carried alongside `pageCount` because tables need both — a
 * row total to display and a page total to bound the pager — and deriving one
 * per endpoint is how divergent pagination shapes start.
 */
export type PageMeta = {
	page: number;
	pageSize: number;
	pageCount: number;
	totalCount: number;
};

export function toPageMeta(
	input: { page: number; pageSize: number },
	totalCount: number,
): PageMeta {
	return {
		page: input.page,
		pageSize: input.pageSize,
		pageCount: pageCount(totalCount, input.pageSize),
		totalCount,
	};
}
