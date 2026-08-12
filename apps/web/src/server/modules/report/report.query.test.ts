import { ReportStatus } from "@zemio/db";
import { describe, expect, it } from "vitest";
import {
	buildReportListOrderBy,
	buildReportListWhere,
	type ReportListFilterGroup,
	type ReportListFilterGroupInput,
	reportListInputSchema,
} from "./report.query";

describe("buildReportListWhere", () => {
	it("scopes 'own' to the caller's own reports", () => {
		const where = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
		});

		expect(where).toEqual({ organizationId: "org_1", ownerId: "user_1" });
	});

	it("scopes 'all' to every non-draft report in the org", () => {
		const where = buildReportListWhere({
			scope: "all",
			organizationId: "org_1",
			userId: "user_1",
		});

		expect(where).toEqual({
			organizationId: "org_1",
			status: { not: ReportStatus.DRAFT },
		});
	});

	it("ANDs the scope base with compiled filters when filters are given", () => {
		const where = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
			filters: {
				logic: "and",
				rules: [{ field: "title", op: "is", value: "Conference" }],
			},
		});

		expect(where).toEqual({
			AND: [
				{ organizationId: "org_1", ownerId: "user_1" },
				{ AND: [{ title: "Conference" }] },
			],
		});
	});

	it("compiles an 'or' group into an OR clause", () => {
		const filters: ReportListFilterGroup = {
			logic: "or",
			rules: [
				{ field: "status", op: "is", value: ReportStatus.ACCEPTED },
				{ field: "status", op: "is", value: ReportStatus.PAID },
			],
		};

		const where = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
			filters,
		});

		expect(where).toEqual({
			AND: [
				{ organizationId: "org_1", ownerId: "user_1" },
				{
					OR: [{ status: ReportStatus.ACCEPTED }, { status: ReportStatus.PAID }],
				},
			],
		});
	});

	it("compiles a nested group", () => {
		const filters: ReportListFilterGroup = {
			logic: "and",
			rules: [
				{ field: "costUnitId", op: "is", value: "cu_1" },
				{
					logic: "or",
					rules: [
						{ field: "title", op: "is", value: "A" },
						{ field: "title", op: "is", value: "B" },
					],
				},
			],
		};

		const where = buildReportListWhere({
			scope: "all",
			organizationId: "org_1",
			userId: "user_1",
			filters,
		});

		expect(where).toEqual({
			AND: [
				{ organizationId: "org_1", status: { not: ReportStatus.DRAFT } },
				{
					AND: [{ costUnitId: "cu_1" }, { OR: [{ title: "A" }, { title: "B" }] }],
				},
			],
		});
	});

	it.each([
		["is", "Conference", { title: "Conference" }],
		["isNot", "Conference", { title: { not: "Conference" } }],
		[
			"in",
			["Conference", "Retreat"],
			{ title: { in: ["Conference", "Retreat"] } },
		],
		[
			"notIn",
			["Conference", "Retreat"],
			{ title: { notIn: ["Conference", "Retreat"] } },
		],
	] as const)("compiles a string filter with op %s", (op, value, expected) => {
		const rule = { field: "title" as const, op, value } as never;

		const where = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
			filters: { logic: "and", rules: [rule] },
		});

		expect(where).toEqual({
			AND: [{ organizationId: "org_1", ownerId: "user_1" }, { AND: [expected] }],
		});
	});

	it("compiles status 'in'/'notIn' with an operator object", () => {
		const where = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
			filters: {
				logic: "and",
				rules: [
					{
						field: "status",
						op: "notIn",
						value: [ReportStatus.DRAFT, ReportStatus.REJECTED],
					},
				],
			},
		});

		expect(where).toEqual({
			AND: [
				{ organizationId: "org_1", ownerId: "user_1" },
				{
					AND: [{ status: { notIn: [ReportStatus.DRAFT, ReportStatus.REJECTED] } }],
				},
			],
		});
	});

	it("compiles tag comparisons (eq/gt/lt/between/notBetween/in)", () => {
		const cases: Array<[ReportListFilterGroup, unknown]> = [
			[
				{ logic: "and", rules: [{ field: "tag", op: "eq", value: 5 }] },
				{ tag: 5 },
			],
			[
				{ logic: "and", rules: [{ field: "tag", op: "gt", value: 5 }] },
				{ tag: { gt: 5 } },
			],
			[
				{ logic: "and", rules: [{ field: "tag", op: "lt", value: 5 }] },
				{ tag: { lt: 5 } },
			],
			[
				{
					logic: "and",
					rules: [{ field: "tag", op: "between", value: { min: 1, max: 5 } }],
				},
				{ tag: { gte: 1, lte: 5 } },
			],
			[
				{
					logic: "and",
					rules: [{ field: "tag", op: "notBetween", value: { min: 1, max: 5 } }],
				},
				{ OR: [{ tag: { lt: 1 } }, { tag: { gt: 5 } }] },
			],
			[
				{ logic: "and", rules: [{ field: "tag", op: "in", value: [1, 2, 3] }] },
				{ tag: { in: [1, 2, 3] } },
			],
		];

		for (const [filters, expected] of cases) {
			const where = buildReportListWhere({
				scope: "own",
				organizationId: "org_1",
				userId: "user_1",
				filters,
			});

			expect(where).toEqual({
				AND: [{ organizationId: "org_1", ownerId: "user_1" }, { AND: [expected] }],
			});
		}
	});

	it("compiles date range filters (between/notBetween)", () => {
		const start = new Date("2026-01-01T00:00:00.000Z");
		const end = new Date("2026-01-31T00:00:00.000Z");

		const between = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
			filters: {
				logic: "and",
				rules: [{ field: "createdAt", op: "between", value: { start, end } }],
			},
		});
		expect(between).toEqual({
			AND: [
				{ organizationId: "org_1", ownerId: "user_1" },
				{ AND: [{ createdAt: { gte: start, lte: end } }] },
			],
		});

		const notBetween = buildReportListWhere({
			scope: "own",
			organizationId: "org_1",
			userId: "user_1",
			filters: {
				logic: "and",
				rules: [
					{ field: "lastUpdatedAt", op: "notBetween", value: { start, end } },
				],
			},
		});
		expect(notBetween).toEqual({
			AND: [
				{ organizationId: "org_1", ownerId: "user_1" },
				{
					AND: [
						{
							OR: [{ lastUpdatedAt: { lt: start } }, { lastUpdatedAt: { gt: end } }],
						},
					],
				},
			],
		});
	});
});

describe("buildReportListOrderBy", () => {
	it("defaults to createdAt desc when no sorting is given", () => {
		expect(buildReportListOrderBy(undefined)).toEqual({ createdAt: "desc" });
	});

	it("orders by the requested field and direction", () => {
		expect(buildReportListOrderBy([{ id: "title", desc: false }])).toEqual({
			title: "asc",
		});
		expect(buildReportListOrderBy([{ id: "tag", desc: true }])).toEqual({
			tag: "desc",
		});
	});
});

describe("reportListInputSchema filter-tree limits", () => {
	const baseInput = { page: 1, pageSize: 20 };

	it("accepts a filter tree within the rule-count and depth limits", () => {
		const filters: ReportListFilterGroupInput = {
			logic: "and",
			rules: Array.from({ length: 50 }, (_, i) => ({
				field: "title" as const,
				op: "is" as const,
				value: `Report ${i}`,
			})),
		};

		const result = reportListInputSchema.safeParse({ ...baseInput, filters });

		expect(result.success).toBe(true);
	});

	it("rejects a filter tree with more than 50 rules", () => {
		const filters: ReportListFilterGroupInput = {
			logic: "and",
			rules: Array.from({ length: 51 }, (_, i) => ({
				field: "title" as const,
				op: "is" as const,
				value: `Report ${i}`,
			})),
		};

		const result = reportListInputSchema.safeParse({ ...baseInput, filters });

		expect(result.success).toBe(false);
	});

	it("accepts a filter tree nested exactly 3 levels deep", () => {
		const filters: ReportListFilterGroupInput = {
			logic: "and",
			rules: [
				{
					logic: "and",
					rules: [
						{
							logic: "and",
							rules: [{ field: "title", op: "is", value: "x" }],
						},
					],
				},
			],
		};

		const result = reportListInputSchema.safeParse({ ...baseInput, filters });

		expect(result.success).toBe(true);
	});

	it("rejects a filter tree nested more than 3 levels deep", () => {
		const filters: ReportListFilterGroupInput = {
			logic: "and",
			rules: [
				{
					logic: "and",
					rules: [
						{
							logic: "and",
							rules: [
								{
									logic: "and",
									rules: [{ field: "title", op: "is", value: "x" }],
								},
							],
						},
					],
				},
			],
		};

		const result = reportListInputSchema.safeParse({ ...baseInput, filters });

		expect(result.success).toBe(false);
	});
});
