"use client";

import { format } from "date-fns";
import { FileSearchCornerIcon } from "lucide-react";
import * as React from "react";
import { DatePicker } from "@/components/date-picker";
import { ReportCard, ReportCardField } from "@/components/report-card";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { DATE_FORMAT, PRESET_OPTIONS, STATUS_OPTIONS } from "@/lib/consts";
import type { DatePreset } from "@/lib/types";
import { cn, getPresetRange, parseFilterDate } from "@/lib/utils";
import { api } from "@/trpc/react";

export function RelevantReportList({
	className,
	...props
}: Omit<React.ComponentProps<"ul">, "children">) {
	const initialRange = getPresetRange("LAST_30");
	const [datePreset, setDatePreset] = React.useState<DatePreset>("LAST_30");
	const [statusFilter, setStatusFilter] = React.useState(STATUS_OPTIONS[0]);
	const [dateFrom, setDateFrom] = React.useState(
		initialRange.from ? format(initialRange.from, DATE_FORMAT) : "",
	);
	const [dateTo, setDateTo] = React.useState(
		initialRange.to ? format(initialRange.to, DATE_FORMAT) : "",
	);

	const parsedDateFrom = React.useMemo(
		() => parseFilterDate(dateFrom),
		[dateFrom],
	);
	const parsedDateTo = React.useMemo(() => parseFilterDate(dateTo), [dateTo]);

	const presetRange = React.useMemo(
		() => getPresetRange(datePreset),
		[datePreset],
	);

	const effectiveDateFrom =
		datePreset === "CUSTOM" ? parsedDateFrom : presetRange.from;
	const effectiveDateTo =
		datePreset === "CUSTOM" ? parsedDateTo : presetRange.to;

	const queryInput = React.useMemo(() => {
		const status =
			statusFilter?.value === "ALL" ? undefined : statusFilter?.value;
		if (!status && datePreset === "LAST_30") return undefined;
		if (!status && !effectiveDateFrom && !effectiveDateTo) return undefined;
		return {
			status,
			dateFrom: effectiveDateFrom,
			dateTo: effectiveDateTo,
		};
	}, [effectiveDateFrom, effectiveDateTo, statusFilter?.value, datePreset]);

	const hasFiltersActive =
		(statusFilter?.value ?? "ALL") !== "ALL" || datePreset !== "LAST_30";

	const { data: reports = [], ...queryResult } = api.admin.listRelevant.useQuery(
		queryInput as Parameters<typeof api.admin.listRelevant.useQuery>[0],
	);

	if (queryResult.isError) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileSearchCornerIcon />
					</EmptyMedia>
					<EmptyTitle>Fehler beim Laden</EmptyTitle>
					<EmptyDescription>
						{queryResult.error?.message ?? "Bitte später erneut versuchen."}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	if (reports?.length === 0) {
		return (
			<div className="space-y-6">
				<div className="rounded-lg border border-border/60 bg-card/60 p-4">
					<div className="flex flex-wrap items-end gap-4">
						<div className="flex flex-col gap-2">
							<Label>Zeitraum</Label>
							<div className="flex flex-wrap gap-2">
								{PRESET_OPTIONS.map((preset) => (
									<Button
										key={preset.value}
										onClick={() => {
											setDatePreset(preset.value);
											if (preset.value === "CUSTOM") {
												return;
											}
											const range = getPresetRange(preset.value);
											setDateFrom(range.from ? format(range.from, DATE_FORMAT) : "");
											setDateTo(range.to ? format(range.to, DATE_FORMAT) : "");
										}}
										type="button"
										variant={datePreset === preset.value ? "secondary" : "outline"}
									>
										{preset.label}
									</Button>
								))}
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="relevant-date-from">Zeitraum von</Label>
							<DatePicker
								disabled={datePreset !== "CUSTOM"}
								id="relevant-date-from"
								onChange={(event) => {
									setDatePreset("CUSTOM");
									setDateFrom(event.target.value);
								}}
								placeholder="tt.mm.jjjj"
								value={dateFrom}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="relevant-date-to">Bis</Label>
							<DatePicker
								disabled={datePreset !== "CUSTOM"}
								id="relevant-date-to"
								onChange={(event) => {
									setDatePreset("CUSTOM");
									setDateTo(event.target.value);
								}}
								placeholder="tt.mm.jjjj"
								value={dateTo}
							/>
						</div>
						<div className="flex min-w-[14rem] flex-col gap-2">
							<Label htmlFor="relevant-status">Status</Label>
							<Combobox
								items={STATUS_OPTIONS}
								itemToStringLabel={(item) => item.label}
								itemToStringValue={(item) => item.value}
								onValueChange={(value) => setStatusFilter(value ?? STATUS_OPTIONS[0])}
								value={statusFilter}
							>
								<ComboboxInput id="relevant-status" placeholder="Alle Status" />
								<ComboboxContent>
									<ComboboxEmpty>Kein Status gefunden.</ComboboxEmpty>
									<ComboboxList>
										{(item) => (
											<ComboboxItem key={item.value} value={item}>
												{item.label}
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</div>
						<div className="flex flex-1 justify-end">
							<Button
								onClick={() => {
									setStatusFilter(STATUS_OPTIONS[0]);
									setDatePreset("LAST_30");
									const range = getPresetRange("LAST_30");
									setDateFrom(range.from ? format(range.from, DATE_FORMAT) : "");
									setDateTo(range.to ? format(range.to, DATE_FORMAT) : "");
								}}
								type="button"
								variant="outline"
							>
								Filter zurücksetzen
							</Button>
						</div>
					</div>
					<p className="mt-3 text-muted-foreground text-xs">
						Standard: letzte 30 Tage, ohne offene Anträge oder Entwürfe.
					</p>
				</div>
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileSearchCornerIcon />
						</EmptyMedia>
						<EmptyTitle>Keine Anträge gefunden</EmptyTitle>
						<EmptyDescription>
							{hasFiltersActive
								? "Passe die Filter an, um weitere Anträge zu sehen."
								: "Hier werden Anträge angezeigt, die das letzte Mal in den letzten 30 Tagen bearbeitet wurden."}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="rounded-lg border border-border/60 bg-card/60 p-4">
				<div className="flex flex-wrap items-end gap-4">
					<div className="flex flex-col gap-2">
						<Label>Zeitraum</Label>
						<div className="flex flex-wrap gap-2">
							{PRESET_OPTIONS.map((preset) => (
								<Button
									key={preset.value}
									onClick={() => {
										setDatePreset(preset.value);
										if (preset.value === "CUSTOM") {
											return;
										}
										const range = getPresetRange(preset.value);
										setDateFrom(range.from ? format(range.from, DATE_FORMAT) : "");
										setDateTo(range.to ? format(range.to, DATE_FORMAT) : "");
									}}
									type="button"
									variant={datePreset === preset.value ? "secondary" : "outline"}
								>
									{preset.label}
								</Button>
							))}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="relevant-date-from">Zeitraum von</Label>
						<DatePicker
							disabled={datePreset !== "CUSTOM"}
							id="relevant-date-from"
							onChange={(event) => {
								setDatePreset("CUSTOM");
								setDateFrom(event.target.value);
							}}
							placeholder="tt.mm.jjjj"
							value={dateFrom}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="relevant-date-to">Bis</Label>
						<DatePicker
							disabled={datePreset !== "CUSTOM"}
							id="relevant-date-to"
							onChange={(event) => {
								setDatePreset("CUSTOM");
								setDateTo(event.target.value);
							}}
							placeholder="tt.mm.jjjj"
							value={dateTo}
						/>
					</div>
					<div className="flex min-w-[14rem] flex-col gap-2">
						<Label htmlFor="relevant-status">Status</Label>
						<Combobox
							items={STATUS_OPTIONS}
							itemToStringLabel={(item) => item.label}
							itemToStringValue={(item) => item.value}
							onValueChange={(value) => setStatusFilter(value ?? STATUS_OPTIONS[0])}
							value={statusFilter}
						>
							<ComboboxInput id="relevant-status" placeholder="Alle Status" />
							<ComboboxContent>
								<ComboboxEmpty>Kein Status gefunden.</ComboboxEmpty>
								<ComboboxList>
									{(item) => (
										<ComboboxItem key={item.value} value={item}>
											{item.label}
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>
					<div className="flex flex-1 justify-end">
						<Button
							onClick={() => {
								setStatusFilter(STATUS_OPTIONS[0]);
								setDatePreset("LAST_30");
								const range = getPresetRange("LAST_30");
								setDateFrom(range.from ? format(range.from, DATE_FORMAT) : "");
								setDateTo(range.to ? format(range.to, DATE_FORMAT) : "");
							}}
							type="button"
							variant="outline"
						>
							Filter zurücksetzen
						</Button>
					</div>
				</div>
				<p className="mt-3 text-muted-foreground text-xs">
					Standard: letzte 30 Tage, ohne offene Anträge oder Entwürfe.
				</p>
			</div>
			<ul
				className={cn(
					"grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
					className,
				)}
				data-slot="relevant-report-list"
				{...props}
			>
				{reports.map((report) => {
					const reportTotal = report.expenses.reduce(
						(sum, expense) => sum + expense.amount,
						0,
					);

					return (
						<li key={report.id}>
							<ReportCard report={report} reportRoute={"/reports/:reportId"}>
								<ReportCardField
									label="Gesamtbetrag"
									value={`${reportTotal.toFixed(2)} €`}
								/>
								<ReportCardField
									label="Anzahl Ausgaben"
									value={
										report.expenses.length === 0
											? "Keine Ausgaben"
											: report.expenses.length.toString()
									}
								/>
								<ReportCardField label="Antragsteller" value={report.owner.name} />
							</ReportCard>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
