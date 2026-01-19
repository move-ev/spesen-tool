import { Body, Head, Html } from "@react-email/components";
import type { ReportStatus } from "@/generated/prisma/enums";
import { translateReportStatus } from "@/lib/utils";

interface StatusChangedEmailProps {
	name: string;
	title: string;
	status: ReportStatus;
	reportId: string;
}

const baseUrl =
	process.env.NODE_ENV === "production"
		? "https://spesen.move-ev.de"
		: "http://localhost:3000";

export default function StatusChangedEmail({
	name,
	title,
	status,
	reportId,
}: StatusChangedEmailProps) {
	return (
		<Html>
			<Head />
			<Body>
				<h1>Report status changed</h1>
				<p>Hello {name},</p>
				<p>
					The status of the report <strong>{title}</strong> has been changed to{" "}
					<strong>"{translateReportStatus(status)}"</strong>.
				</p>
				<p>
					You can view the report <a href={`${baseUrl}/reports/${reportId}`}>here</a>
					.
				</p>
				<p>Best regards,</p>
				<p>The move e.V. team</p>
			</Body>
		</Html>
	);
}

StatusChangedEmail.PreviewProps = {
	name: "John Doe",
	title: "Report 1",
	status: "PENDING_APPROVAL",
	reportId: "123",
};
