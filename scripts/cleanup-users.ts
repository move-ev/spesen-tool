// Script to clean up partially created users
// Run with: pnpm tsx scripts/cleanup-users.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupUsers() {
	try {
		// Find users without accounts (partially created)
		const usersWithoutAccounts = await prisma.user.findMany({
			where: {
				accounts: {
					none: {},
				},
			},
			include: {
				accounts: true,
				sessions: true,
			},
		});

		console.log(`Found ${usersWithoutAccounts.length} users without accounts`);

		for (const user of usersWithoutAccounts) {
			console.log(`Deleting user: ${user.email} (${user.id})`);
			await prisma.user.delete({
				where: { id: user.id },
			});
		}

		console.log("✅ Cleanup complete");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
	} finally {
		await prisma.$disconnect();
	}
}

cleanupUsers();
