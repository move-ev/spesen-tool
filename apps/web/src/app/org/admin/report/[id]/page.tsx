import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@zemio/ui/components/avatar";
import { Button } from "@zemio/ui/components/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@zemio/ui/components/input-group";
import { Separator } from "@zemio/ui/components/separator";
import {
	ArrowLeftIcon,
	ArrowUpIcon,
	CheckCircle2Icon,
	CopyIcon,
	EllipsisIcon,
	UserCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { StatusIcons } from "@/lib/icons";
import { formatIban } from "@/lib/utils";

export default async function ServerPage() {
	return (
		<main>
			<div className="py-12">
				<section className="container flex flex-wrap items-center justify-between">
					<div>
						<Link
							className="mb-8 flex items-center gap-1.5 font-medium text-sm text-zinc-600 transition-colors hover:text-violet-600"
							href={"#"}
						>
							<ArrowLeftIcon className="size-3.5" />
							Berichte
						</Link>
						<h1 className="font-semibold text-2xl text-zinc-800">
							Preise für das Jubiläum 2026
						</h1>
						<p className="mt-2 text-sm text-zinc-500">
							Erstellt am 29.01.2026 um 09:32 Uhr von{" "}
							<span className="font-medium text-violet-700">Max Mustermann</span>
						</p>
					</div>
					<div className="flex items-center justify-center gap-3">
						<Button className={"bg-violet-600"} variant={"default"}>
							<StatusIcons.ACCEPTED />
							Akzeptieren
						</Button>
						<Button size={"icon"} variant={"outline"}>
							<EllipsisIcon />
						</Button>
					</div>
				</section>
				<div className="container mt-6 mb-6">
					<Separator />
				</div>
				<section className="container overflow-x-auto">
					<div className="flex min-w-max items-start justify-start gap-6">
						<div className="space-y-1.5">
							<p className="text-sm text-zinc-500">Status</p>
							<p className="flex items-center justify-start gap-1.5 font-medium text-sm text-zinc-700">
								In Bearbeitung
							</p>
						</div>
						<Separator className={""} orientation="vertical" />
						<div className="space-y-1.5">
							<p className="text-sm text-zinc-500">Kostenstelle</p>
							<p className="flex items-center justify-start gap-1.5 font-medium text-sm text-zinc-700">
								KS312: Kommunikation
							</p>
						</div>
						<Separator className={""} orientation="vertical" />
						<div className="space-y-1.5">
							<p className="text-sm text-zinc-500">IBAN</p>
							<p className="flex items-center justify-start gap-1.5 font-medium text-sm text-zinc-700">
								{formatIban("DE12345678901234567890")}
							</p>
						</div>
						<Separator className={""} orientation="vertical" />
						<div className="space-y-1.5">
							<p className="text-sm text-zinc-500">Gesamtbetrag</p>
							<p className="flex items-center justify-start gap-1.5 font-medium text-sm text-zinc-700">
								100,00 €
							</p>
						</div>
					</div>
				</section>
				<section className="container mt-20">
					<h2 className="font-semibold text-lg text-zinc-800">Ausgaben</h2>
					<table className="mt-6 w-full">
						<thead>
							<tr className="border-zinc-800 border-b">
								<th className="h-10 text-left font-medium text-sm text-zinc-800">
									Beschreibung
								</th>
								<th className="h-10 text-left font-medium text-sm text-zinc-800">
									Anzahl
								</th>
								<th className="h-10 text-right font-medium text-sm text-zinc-800">
									Einzelbetrag
								</th>
								<th className="h-10 text-right font-medium text-sm text-zinc-800">
									Summe
								</th>
								<th className="h-10 w-16"></th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b">
								<td className="h-10 text-left font-medium text-sm text-zinc-800">
									Reisepauschale
								</td>
								<td className="h-10 text-left font-medium text-sm text-zinc-500">
									85 <span className="font-regular text-zinc-500">(km)</span>
								</td>
								<td className="h-10 text-right font-medium text-sm text-zinc-500">
									0,06 EUR
								</td>
								<td className="h-10 text-right font-medium text-sm text-zinc-800">
									5,10 EUR
								</td>
								<td className="flex h-10 w-16 items-center justify-center">
									<Button size={"icon-sm"} variant={"ghost"}>
										<EllipsisIcon />
									</Button>
								</td>
							</tr>
							<tr>
								<td className="h-10 text-left font-medium text-sm text-zinc-800">
									Einkauf Rewe
								</td>
								<td className="h-10 text-left font-medium text-sm text-zinc-500">1</td>
								<td className="h-10 text-right font-medium text-sm text-zinc-500">
									12,99 EUR
								</td>
								<td className="h-10 text-right font-medium text-sm text-zinc-800">
									12,99 EUR
								</td>
								<td className="flex h-10 w-16 items-center justify-center">
									<Button size={"icon-sm"} variant={"ghost"}>
										<EllipsisIcon />
									</Button>
								</td>
							</tr>
							<tr>
								<td></td>
								<td className="h-10 border-t text-left font-medium text-sm text-zinc-500">
									<p className="text-zinc-500">Gesamt</p>
								</td>
								<td
									className="h-10 border-t text-right font-medium text-sm text-zinc-800"
									colSpan={2}
								>
									28,18 EUR
								</td>
								<td className="flex h-10 w-16 items-center justify-center border-t">
									<Button size={"icon-sm"} variant={"ghost"}>
										<CopyIcon />
									</Button>
								</td>
							</tr>
						</tbody>
					</table>
				</section>
				<section className="container mt-20">
					<h2 className="font-semibold text-lg text-zinc-800">Aktivitäten</h2>
					<div className="mt-6">
						<div className="pl-4">
							<div className="flex items-center justify-start">
								<Avatar className="size-4">
									<AvatarImage src="https://github.com/shadcn.png" />
									<AvatarFallback>
										<UserCircleIcon />
									</AvatarFallback>
								</Avatar>
								<p className="ms-2 font-medium text-xs text-zinc-500">
									Christoph Langer hat diesen Report erstellt
								</p>
							</div>
							<div>
								<Separator className={"my-1 ms-1.75 h-2"} orientation="vertical" />
							</div>
							<div className="flex items-center justify-start">
								<CheckCircle2Icon className="size-4 text-green-500" />
								<p className="ms-2 font-medium text-xs text-zinc-500">
									Markus Müller hat diesen Report akzeptiert
								</p>
							</div>
							<div>
								<Separator className={"my-1 ms-1.75 h-2"} orientation="vertical" />
							</div>
						</div>
						<div className="max-w-xl rounded-lg border border-border p-4 shadow-xs">
							<div className="flex items-center justify-start">
								<Avatar className="size-4">
									<AvatarImage src="https://github.com/shadcn.png" />
									<AvatarFallback>
										<UserCircleIcon />
									</AvatarFallback>
								</Avatar>
								<p className="ms-2 font-medium text-sm text-zinc-800">
									Christoph Langer
								</p>
							</div>
							<div className="mt-2">
								<p className="text-zinc-700">
									Das ist ein Test Kommentar. Hier fehlt noch der Text. Kannst du das
									bitte ausfüllen?
								</p>
							</div>
						</div>
						<div className="pl-4">
							<Separator className={"my-1 ms-1.75 h-2"} orientation="vertical" />
						</div>
						<InputGroup className="shadow-xs">
							<InputGroupTextarea placeholder="Kommentar hinzufügen" />
							<InputGroupAddon align="block-end">
								<InputGroupButton
									className="ml-auto rounded-full"
									size={"icon-sm"}
									variant={"outline"}
								>
									<ArrowUpIcon />
									<span className="sr-only">Kommentar hinzufügen</span>
								</InputGroupButton>
							</InputGroupAddon>
						</InputGroup>
					</div>
				</section>
			</div>
		</main>
	);
}
