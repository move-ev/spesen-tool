import { writeFile } from "node:fs/promises";
import { format } from "date-fns";
import PDFDocument from "pdfkit";
import type { Expense, Report, User } from "@/generated/prisma/client";
import { translateExpenseType, translateReportStatus } from "@/lib/utils";
import {
	foodExpenseMetaSchema,
	travelExpenseMetaSchema,
} from "@/lib/validators";

interface SummaryProps {
	report: Report & {
		expenses: Expense[];
		owner: User;
	};
	reviewer: User;
}

const MUTED_COLOR = "#6b7280";
const COLUMN_WIDTHS = {
	TYPE: 100,
	DATE: 80,
	DETAILS: "*",
	AMOUNT: 80,
} as const;

function formatExpenseMeta(expense: Expense): string {
	if (expense.type === "TRAVEL") {
		const meta = travelExpenseMetaSchema.safeParse(expense.meta);
		if (meta.success) {
			return `${meta.data.from} → ${meta.data.to} (${meta.data.distance.toFixed(2)} km)`;
		}
		return "Ungültige Reisedaten";
	}

	if (expense.type === "FOOD") {
		const meta = foodExpenseMetaSchema.safeParse(expense.meta);
		if (meta.success) {
			return `${meta.data.days} Tag(e)`;
		}
		return "Ungültige Verpflegungsdaten";
	}

	if (expense.type === "RECEIPT") {
		return "Beleg";
	}

	return "";
}

export async function generatePdfSummary(props: SummaryProps): Promise<Buffer> {
	const { report, reviewer } = props;
	const pdfCreationDate = new Date();

	const doc = new PDFDocument({
		autoFirstPage: true,
		layout: "portrait",
		size: "A4",
		margins: {
			top: 48,
			bottom: 48,
			left: 32,
			right: 32,
		},
	});

	doc.fontSize(24);
	doc.font("Helvetica-Bold");
	doc.text(report.title, { align: "left" });
	doc.moveDown(0.5);

	doc.fontSize(12);
	doc.font("Helvetica");
	doc.fillColor(MUTED_COLOR);
	const creationDateStr = format(report.createdAt, "dd.MM.yyyy");
	const statusStr = translateReportStatus(report.status);
	doc.text(`Erstellt am ${creationDateStr} | Status: ${statusStr}`, {
		align: "left",
	});
	doc.fillColor("black");
	doc.moveDown(1);

	if (report.description) {
		doc.fontSize(11);
		doc.fillColor(MUTED_COLOR);
		doc.text(report.description, {
			align: "left",
			width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
		});
		doc.fillColor("black");
		doc.moveDown(2.5);
	} else {
		doc.moveDown(2);
	}

	const userInfoTable = doc.table({
		defaultStyle: {
			border: false,
			padding: 0,
		},
		rowStyles: () => ({ height: 16 }),
		columnStyles: () => ({ width: "*" }),
	});

	doc.font("Helvetica-Bold");
	doc.fontSize(11);
	userInfoTable.row(["Prüfer", "Ersteller"]);

	doc.font("Helvetica");
	userInfoTable.row([
		reviewer.name || reviewer.email,
		report.owner.name || report.owner.email,
	]);
	userInfoTable.row([reviewer.email, report.owner.email]);

	doc.moveDown(3);

	doc.fontSize(14);
	doc.font("Helvetica-Bold");
	doc.text("Ausgabenübersicht", { align: "left" });
	doc.moveDown(0.5);

	if (report.expenses.length === 0) {
		doc.fontSize(11);
		doc.font("Helvetica");
		doc.text("Keine Ausgaben vorhanden.", { align: "left" });
	} else {
		const totalAmount = report.expenses.reduce(
			(sum, expense) => sum + Number(expense.amount),
			0,
		);
		const lastRowIndex = report.expenses.length + 1;

		const expensesTable = doc.table({
			rowStyles: (index) => {
				if (index === 0) return { backgroundColor: "#efefef" };
				if (index === lastRowIndex) return { backgroundColor: "#f5f5f5" };
				return {};
			},
			columnStyles: (index) => {
				const widths = [
					COLUMN_WIDTHS.TYPE,
					COLUMN_WIDTHS.DATE,
					COLUMN_WIDTHS.DATE,
					COLUMN_WIDTHS.DETAILS,
					COLUMN_WIDTHS.AMOUNT,
				];
				return { width: widths[index] ?? "*" };
			},
		});

		doc.font("Helvetica-Bold");
		doc.fontSize(10);
		expensesTable.row(["Typ", "Startdatum", "Enddatum", "Details", "Betrag"]);

		doc.font("Helvetica");
		doc.fontSize(9);

		for (const expense of report.expenses) {
			const typeStr = translateExpenseType(expense.type);
			const startDateStr = format(expense.startDate, "dd.MM.yyyy");
			const endDateStr = format(expense.endDate, "dd.MM.yyyy");
			const metaStr = formatExpenseMeta(expense);
			const descriptionStr = expense.description || "";
			const detailsStr =
				descriptionStr && metaStr
					? `${descriptionStr} (${metaStr})`
					: descriptionStr || metaStr || "-";
			const amountStr = `${Number(expense.amount).toFixed(2)} €`;

			expensesTable.row([
				typeStr,
				startDateStr,
				endDateStr,
				detailsStr,
				amountStr,
			]);
		}

		doc.font("Helvetica-Bold");
		doc.fontSize(9);
		expensesTable.row(["Gesamt", "", "", "", `${totalAmount.toFixed(2)} €`]);
	}

	doc.moveDown(2);

	doc.fontSize(9);
	doc.font("Helvetica");
	doc.text(
		`PDF erstellt am ${format(pdfCreationDate, "dd.MM.yyyy")} um ${format(pdfCreationDate, "HH:mm")} Uhr`,
		{
			align: "left",
		},
	);

	const chunks: Uint8Array[] = [];
	doc.on("data", (chunk) => chunks.push(chunk));

	return new Promise((resolve, reject) => {
		doc.on("end", () => {
			const buffer = Buffer.concat(chunks);
			resolve(buffer);
		});
		doc.on("error", reject);
		doc.end();
	});
}

export async function savePdfSummaryToFile(
	filepath: string,
	props: SummaryProps,
): Promise<void> {
	const buffer = await generatePdfSummary(props);
	await writeFile(filepath, buffer);
}
