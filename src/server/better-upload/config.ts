import { RejectUpload, type Router, route } from "@better-upload/server";
import { custom } from "@better-upload/server/clients";
import { env } from "@/env";
import {
	getStorageHost,
	getStorageRegion,
	getStorageBucket,
	getStorageSecure,
	getStorageForcePathStyle,
	getUploadMaxFileSize,
	getUploadMaxFiles,
} from "@/lib/config";
import { auth } from "@/server/better-auth";

// Get configuration values
const storageHost = getStorageHost();
const storageRegion = getStorageRegion();
const storageBucket = getStorageBucket();
const storageSecure = getStorageSecure();
const storageForcePathStyle = getStorageForcePathStyle();
const maxFileSize = getUploadMaxFileSize();
const maxFiles = getUploadMaxFiles();

const s3 = custom({
	host: storageHost,
	accessKeyId: env.STORAGE_ACCESS_KEY_ID,
	secretAccessKey: env.STORAGE_ACCESS_KEY,
	region: storageRegion,
	secure: storageSecure,
	forcePathStyle: storageForcePathStyle,
});

export const router: Router = {
	client: s3,
	bucketName: storageBucket,
	routes: {
		attachments: route({
			multipleFiles: true,
			maxFiles: maxFiles,
			maxFileSize: maxFileSize,
			async onBeforeUpload({ req }) {
				const session = await auth.api.getSession({
					headers: req.headers,
				});

				if (!session?.user) {
					throw new RejectUpload("Unauthorized");
				}

				return {
					generateObjectInfo: ({ file }) => ({ key: `attachment/${file.name}` }),
				};
			},
		}),
	},
};
