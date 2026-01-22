import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseLogging, getDatabaseUrl } from "@/lib/config";

const createPrismaClient = () => {
	const connectionString = getDatabaseUrl();
	const adapter = new PrismaPg({ connectionString });

	return new PrismaClient({
		adapter,
		log: getDatabaseLogging(),
	});
};

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
