"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export function useOrgSlug() {
	const router = useRouter();
	const pathname = usePathname();

	// Avoid hydration mismatch with rewrites
	const [clientPath, setClientPath] = useState("");
	useEffect(() => {
		setClientPath(pathname);
	}, [pathname]);

	const current = React.useMemo(() => {
		if (!clientPath.startsWith("/org/")) {
			return null;
		}
		return clientPath.split("/").slice(1)[1] ?? null;
	}, [clientPath]);

	return {
		/**
		 * Takes in a new organization slug and replaces the current slug with thw new one.
		 * When no organization slug is provided, the organization base path will be used.
		 *
		 * @param organizationSlug - The new organization slug to replace the current one with.
		 */
		replace: (organizationSlug: string) => {
			if (!clientPath.startsWith("/org/")) {
				router.push(`/org/${organizationSlug}`);
				return;
			}

			const [_, currentSlug, ...rest] = clientPath.split("/").slice(1);

			if (!currentSlug) {
				router.push(`/org/${organizationSlug}`);
				return;
			}

			if (currentSlug === organizationSlug) {
				return;
			}

			router.push(
				`/org/${organizationSlug}${rest.length > 0 ? `/${rest.join("/")}` : ""}`,
			);
		},
		/**
		 * The currently selected organization slug.
		 */
		current,
	};
}
