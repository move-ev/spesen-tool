import { decryptBankingDetails } from "@zemio/encryption";
import { env } from "../../env";
import { db } from "../../lib/db";
import { logger } from "../../lib/logger";
import {
	getFileFromStorage,
	getPresignedDownloadUrl,
	isPdfFile,
	uploadToStorage,
} from "../../lib/storage";
import {
	buildReportPdfFilename,
	generatePdf,
	prepareAttachmentBuffers,
} from "./generate";

function getEncryptionKey(): Buffer {
	return Buffer.from(env.SECRET_ENCRYPTION_KEY, "base64").subarray(0, 32);
}

function isAdminRole(role: string): boolean {
	return role === "admin" || role === "owner";
}

export async function generateReportPdf(
	reportId: string,
	userId: string,
	organizationId: string,
	memberRole: string,
): Promise<{ url: string; filename: string }> {
	const existsReport = await db.report.findFirst({
		where: { id: reportId, organizationId },
		select: { ownerId: true },
	});

	if (!existsReport) {
		throw Object.assign(new Error("Report not found"), { status: 404 });
	}

	if (!isAdminRole(memberRole) && existsReport.ownerId !== userId) {
		throw Object.assign(new Error("Forbidden"), { status: 403 });
	}

	const report = await db.report.findUnique({
		where: { id: reportId },
		include: {
			expenses: {
				include: { attachments: true, travelDetail: true, foodDetail: true },
			},
			owner: true,
			costUnit: { select: { tag: true, title: true } },
			bankingDetails: true,
			bankingSnapshot: true,
		},
	});

	// Submitted reports export the snapshot taken at submission; editable
	// reports (draft/revision) export the live details they would submit.
	// An editable report without live details (the owner deleted them) must
	// not fall back to an old snapshot — that would export stale account
	// data the next submission is required to replace, so it 404s below.
	const isEditable =
		report?.status === "DRAFT" || report?.status === "NEEDS_REVISION";
	const bankingSource = isEditable
		? report?.bankingDetails
		: (report?.bankingSnapshot ?? report?.bankingDetails);

	if (!report || !bankingSource) {
		throw Object.assign(new Error("Report or banking details not found"), {
			status: 404,
		});
	}

	const bankingDetails = decryptBankingDetails(
		bankingSource,
		getEncryptionKey(),
	);

	const allAttachments = report.expenses.flatMap((e) => e.attachments);
	const rawImages: { key: string; buffer: Buffer }[] = [];
	const pdfs: { key: string; buffer: Buffer }[] = [];

	await Promise.all(
		allAttachments.map(async (attachment) => {
			const buffer = await getFileFromStorage(attachment.key);
			if (!buffer) {
				logger.warn("Attachment fetch returned no data", { key: attachment.key });
				return;
			}
			if (isPdfFile(attachment.key)) {
				pdfs.push({ key: attachment.key, buffer });
			} else {
				rawImages.push({ key: attachment.key, buffer });
			}
		}),
	);

	const images = await prepareAttachmentBuffers(rawImages);

	const pdfBuffer = await generatePdf({
		report: { ...report, bankingDetails },
		images,
		pdfs,
	});

	const filename = buildReportPdfFilename(report);
	const key = `pdf/temp/${crypto.randomUUID()}.pdf`;

	await uploadToStorage(key, pdfBuffer, "application/pdf");
	const url = await getPresignedDownloadUrl(key, filename, 120);

	return { url, filename };
}
