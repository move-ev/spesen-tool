"use client";

import { useTranslations } from "next-intl";
import { isBillingRefusal } from "@/lib/billing";

/**
 * Turns a failed mutation into a description worth reading.
 *
 * Every operation entitlement gates reports failure the same way — a toast
 * built from `error.message` — and a billing refusal carries a marker rather
 * than prose, because the server has no locale to write in. Without this, a
 * member of a lapsed organization is shown `BILLING_NOT_ENTITLED` and left to
 * guess.
 *
 * The banner says what state the organization is in and who can act on it; this
 * only has to say why the thing they just tried was refused.
 */
export function useErrorDescription() {
	const t = useTranslations("modules.shared.billingBanner");

	return (error: unknown, fallback: string): string => {
		if (isBillingRefusal(error)) return t("refused.description");

		const message =
			typeof error === "object" && error !== null && "message" in error
				? (error as { message?: unknown }).message
				: undefined;

		return typeof message === "string" && message !== "" ? message : fallback;
	};
}
