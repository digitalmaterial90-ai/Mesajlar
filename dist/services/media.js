"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
// Mock S3 Client for local development if no creds
const s3Config = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
};
if (process.env.S3_ENDPOINT) {
    s3Config.endpoint = process.env.S3_ENDPOINT;
}
const s3Client = new client_s3_1.S3Client(s3Config);
const BUCKET_NAME = process.env.MEDIA_BUCKET || 'whatsapp-clone-media';
exports.MediaService = {
    async getPresignedUploadUrl(userId, contentType, size) {
        const extension = contentType.split('/')[1] || 'bin';
        const key = `uploads/${userId}/${(0, uuid_1.v4)()}.${extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            // ContentLength: size // S3 SDK doesn't always validate this on presign, but good to have
        });
        try {
            // In local dev without real S3 connectivity, this might fail or return a useless URL.
            // We can mock it for purely offline dev if needed.
            // For now, let's try to generate one.
            const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
            return { url, key };
        }
        catch (e) {
            console.error("S3 Presign Error", e);
            // Fallback for local testing without valid AWS setup
            return {
                url: `http://localhost:8080/mock-s3-upload/${key}`,
                key
            };
        }
    }
};
//# sourceMappingURL=media.js.map