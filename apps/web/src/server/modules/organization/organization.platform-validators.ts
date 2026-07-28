import { z } from "zod";

const microsoftTenantIdSchema = z
	.string()
	.uuid(
		"Microsoft Tenant ID must be a valid UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)",
	);

const organizationSlugSchema = z
	.string()
	.min(1, "Slug ist erforderlich")
	.max(100, "Slug darf höchstens 100 Zeichen lang sein")
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		'Slug darf nur Kleinbuchstaben, Zahlen und "-" enthalten',
	);

export const createOrganizationSchema = z.object({
	name: z.string().min(1).max(100),
	microsoftTenantId: microsoftTenantIdSchema,
});

export const updateOrganizationProfileSchema = z.object({
	name: z.string().trim().min(1).max(100),
	slug: organizationSlugSchema,
	logo: z.url("Logo muss eine gültige URL sein").nullable(),
	metadata: z.string().trim().max(5000).nullable(),
	microsoftTenantId: microsoftTenantIdSchema.nullable(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationProfileInput = z.infer<
	typeof updateOrganizationProfileSchema
>;
