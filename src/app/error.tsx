import type { ErrorProps } from "next/error";
import { PageDescription, PageTitle } from "@/components/page-title";

export function ErrorPage({ statusCode, hostname, title }: ErrorProps) {
	return (
		<main>
			<div className="container flex flex-col items-center justify-center gap-4">
				<PageTitle>{title || "Unbekannter Fehler ist aufgetreten"}</PageTitle>
				<PageDescription>
					{statusCode ? `Error ${statusCode}` : "Unbekannter Statuscode"}
				</PageDescription>
				<p>{`${hostname} returned a ${statusCode} error`}</p>
			</div>
		</main>
	);
}
