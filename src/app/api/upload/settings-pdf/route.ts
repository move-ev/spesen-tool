import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from "@/server/better-auth";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		if (file.type !== "application/pdf") {
			return NextResponse.json(
				{ error: "Invalid file type. Only PDFs are allowed." },
				{ status: 400 },
			);
		}

		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File too large. Maximum size is 10MB." },
				{ status: 400 },
			);
		}

		const uploadsDir = join(process.cwd(), "public", "uploads", "settings");
		if (!existsSync(uploadsDir)) {
			await mkdir(uploadsDir, { recursive: true });
		}

		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const filename = `${timestamp}-${randomString}.pdf`;
		const filepath = join(uploadsDir, filename);

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(filepath, buffer);

		const publicUrl = `/uploads/settings/${filename}`;

		return NextResponse.json({ url: publicUrl, filename });
	} catch (error) {
		console.error("Settings PDF upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 },
		);
	}
}
