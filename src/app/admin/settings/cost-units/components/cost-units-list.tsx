"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";

export function CostUnitsList() {
	const [data] = api.costUnit.listGrouped.useSuspenseQuery();

	return (
		<div className="flex flex-col gap-8">
			{/* Ungrouped cost units */}
			{data.ungrouped.length > 0 && (
				<CostUnitSection costUnits={data.ungrouped} title="Ohne Gruppe" />
			)}

			{/* Grouped cost units */}
			{data.grouped.map((group) => (
				<CostUnitSection
					costUnits={group.costUnits}
					key={group.group?.id}
					title={group.group?.title ?? "Unbekannte Gruppe"}
				/>
			))}

			{/* Empty state */}
			{data.ungrouped.length === 0 && data.grouped.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
					<p>Keine Kostenstellen vorhanden.</p>
					<p className="text-sm">Erstelle eine neue Kostenstelle, um zu beginnen.</p>
				</div>
			)}
		</div>
	);
}

interface CostUnitSectionProps {
	title: string;
	costUnits: {
		id: string;
		tag: string;
		title: string;
		examples: string[];
	}[];
}

function CostUnitSection({ title, costUnits }: CostUnitSectionProps) {
	return (
		<section>
			<h2 className="mb-4 font-semibold text-lg">{title}</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{costUnits.map((costUnit) => (
					<CostUnitCard costUnit={costUnit} key={costUnit.id} />
				))}
			</div>
		</section>
	);
}

interface CostUnitCardProps {
	costUnit: {
		id: string;
		tag: string;
		title: string;
		examples: string[];
	};
}

function CostUnitCard({ costUnit }: CostUnitCardProps) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardDescription>{costUnit.tag}</CardDescription>
				<CardTitle>{costUnit.title}</CardTitle>
			</CardHeader>
			{costUnit.examples.length > 0 && (
				<CardContent>
					<p className="mb-1 text-muted-foreground text-xs">Beispiele:</p>
					<ul className="list-inside list-disc text-sm">
						{costUnit.examples.map((example) => (
							<li key={example}>{example}</li>
						))}
					</ul>
				</CardContent>
			)}
		</Card>
	);
}
