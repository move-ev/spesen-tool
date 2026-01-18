import { type Router, route } from "@better-upload/server";
import { custom } from "@better-upload/server/clients";
import { env } from "@/env";

const s3 = custom({
	host: env.STORAGE_HOST,
	accessKeyId: env.STORAGE_ACCESS_KEY_ID,
	secretAccessKey: env.STORAGE_ACCESS_KEY,
	region: env.STORAGE_REGION,
	secure: true,
	forcePathStyle: false,
});

export const router: Router = {
	client: s3,
	bucketName: "spesen-tool-dev1",
	routes: {
		attachments: route({
			multipleFiles: true,
			maxFiles: 5,
			maxFileSize: 1024 * 1024 * 5, // 5MB
			onBeforeUpload() {
				return {
					generateObjectInfo: ({ file }) => ({ key: `attachment/${file.name}` }),
				};
			},
		}),
	},
};
