import type { Router } from "@better-upload/server";
import { custom } from "@better-upload/server/clients";
import { env } from "@/env";

const s3 = custom({
	host: env.STORAGE_HOST,
	accessKeyId: env.STORAGE_ACCESS_KEY_ID,
	secretAccessKey: env.STORAGE_ACCESS_KEY,
	region: "nbg1",
	secure: true,
	forcePathStyle: false,
});

export const router: Router = {
	client: s3,
	bucketName: "my-bucket",
	routes: {},
};
