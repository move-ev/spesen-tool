import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
	...defaultStatements,
	member: ["create", "update", "delete", "list"],
	stats: ["read"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
	member: ["list"],
});

const admin = ac.newRole({
	...adminAc.statements,
	member: ["list", ...adminAc.statements.member],
	stats: ["read"],
});

const owner = ac.newRole({
	...ownerAc.statements,
	member: ["list", ...ownerAc.statements.member],
	stats: ["read"],
});

export { member, admin, owner, ac as organizationAc };
