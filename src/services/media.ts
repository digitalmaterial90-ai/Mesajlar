import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Mock S3 Client for local development if no creds
const s3Config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
};

if (process.env.S3_ENDPOINT) {
    s3Config.endpoint = process.env.S3_ENDPOINT;
}

const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.MEDIA_BUCKET || 'whatsapp-clone-media';

export const MediaService = {
    async getPresignedUploadUrl(userId: string, contentType: string, size: number) {
        const extension = contentType.split('/')[1] || 'bin';
        const key = `uploads/${userId}/${uuidv4()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            // ContentLength: size // S3 SDK doesn't always validate this on presign, but good to have
        });

        try {
            // In local dev without real S3 connectivity, this might fail or return a useless URL.
            // We can mock it for purely offline dev if needed.
            // For now, let's try to generate one.
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return { url, key };
        } catch (e) {
            console.error("S3 Presign Error", e);
            // Fallback for local testing without valid AWS setup
            return {
                url: `http://localhost:8080/mock-s3-upload/${key}`,
                key
            };
        }
    }
};
