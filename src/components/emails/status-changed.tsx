import * as React from "react";
import { env } from "@/env";
import type { ReportStatus } from "@/generated/prisma/enums";
import { translateReportStatus } from "@/lib/utils";

interface StatusChangedEmailProps {
	name: string;
	title: string;
	status: ReportStatus;
	reportId: string;
}

const baseUrl =
	env.NODE_ENV === "production"
		? "https://spesen.move-ev.de"
		: "http://localhost:3000";

export function StatusChangedEmail({
	name,
	title,
	status,
	reportId,
}: StatusChangedEmailProps) {
	return (
		<div>
			<h1>Report status changed</h1>
			<p>Hello {name},</p>
			<p>
				The status of the report <strong>{title}</strong> has been changed to{" "}
				<strong>"{translateReportStatus(status)}"</strong>.
			</p>
			<p>
				You can view the report <a href={`${baseUrl}/reports/${reportId}`}>here</a>.
			</p>
			<p>Best regards,</p>
			<p>The move e.V. team</p>
		</div>
	);
}
