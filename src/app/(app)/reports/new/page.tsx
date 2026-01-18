import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { CreateReportForm } from "@/components/forms/create-report-form";
import { PageDescription, PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/consts";

export default async function ServerPage() {
	return (
		<React.Fragment>
			<section className="container mt-12 max-w-4xl">
				<Button
					className={"-ms-2"}
					nativeButton={false}
					render={
						<Link href={ROUTES.USER_DASHBOARD}>
							<ArrowLeftIcon />
							Zurück zur Übersicht
						</Link>
					}
					variant={"ghost"}
				/>
				<PageTitle className="mt-8">Neuer Spesenantrag</PageTitle>
				<PageDescription className="mt-2">
					Erstelle einen neuen Spesenantrag
				</PageDescription>
			</section>
			<section className="container mt-10 max-w-4xl">
				<CreateReportForm
					accountingUnits={[
						{
							label: "Test123",
							value: "test123",
						},
						{
							label: "TestABC",
							value: "testabc",
						},
					]}
					businessUnits={[
						{
							label: "Test123",
							value: "test123",
						},
						{
							label: "TestABC",
							value: "testabc",
						},
					]}
				/>
			</section>
		</React.Fragment>
	);
}
