import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
	...defaultStatements,
	member: ["create", "update", "delete", "list"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
	member: ["list"],
});

const admin = ac.newRole({
	...adminAc.statements,
	member: ["list", ...adminAc.statements.member],
});

const owner = ac.newRole({
	...ownerAc.statements,
	member: ["list", ...ownerAc.statements.member],
});

export { member, admin, owner, ac as organizationAc };
