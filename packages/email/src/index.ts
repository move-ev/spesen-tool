export type {
	EmailAddress,
	SendResult,
} from "./client/scaleway";
export {
	createEmailer,
	type Emailer,
	type EmailerConfig,
	type OrgInvitationInput,
	type ReportReceivedInput,
	type ReportSubmittedInput,
	type StatusChangedInput,
} from "./emailer";
