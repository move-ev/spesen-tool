import type { PrismaClient } from "@zemio/db";
import type { AuditServiceContext } from "./audit.service";

type AuditRequestContext = {
	db: PrismaClient;
	organizationId: string;
	session: { user: { id: string } };
};

export function toAuditServiceContext(
	ctx: AuditRequestContext,
): AuditServiceContext {
	return {
		db: ctx.db,
		organizationId: ctx.organizationId,
		userId: ctx.session.user.id,
	};
}
