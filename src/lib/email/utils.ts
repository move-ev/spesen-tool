import { render, toPlainText } from "@react-email/render";
import type { SendEmailOptions } from "./types/adapter";

/**
 * Converts email arguments into appropriate html and text content.
 *
 * At least one of 'html', 'react', or 'text' must be provided.
 * If only 'react' is provided, both 'html' and 'text' will be rendered from the React node.
 * If 'html' is provided but not 'text', 'text' will be generated from 'html'.
 * If both 'html' and 'text' are provided, they will be used as-is.
 *
 * @param args
 */
export async function sendArgsToContent(args: SendEmailOptions): Promise<{
	html: string;
	text: string;
}> {
	if (!args.html && !args.react && !args.text) {
		throw new Error(
			"At least one of html, react, or text must be provided for the email content to be valid.",
		);
	}

	let html = args.html ?? "";
	let text = args.text ?? "";

	// If React node is provided, render it to HTML if html not already given
	if (args.react && !html) {
		html = await render(args.react);
	}

	// If html is available but text is not, generate plain text
	if (html && !text) {
		text = await toPlainText(html);
	}

	// If only text is provided and no html or react, we allow that (text-only email)
	// If neither html nor text nor react are satisfactorily filled, this will throw above

	return {
		html,
		text,
	};
}
