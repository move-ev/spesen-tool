// Plain JS version used by the Docker runner container.
// Locally, prisma.config.ts takes precedence (Prisma 7 searches .ts first).
export default {
	schema: "prisma/schema",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
	},
};
