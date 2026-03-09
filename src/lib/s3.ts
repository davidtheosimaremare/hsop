import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Strip https:// or http:// if user accidentally added it in .env
let rawEndpoint = process.env.MINIO_ENDPOINT || "assets.hokiindo.co.id";
rawEndpoint = rawEndpoint.replace(/^https?:\/\//, "");

const bucketName = process.env.MINIO_BUCKET || "shop";

export const s3Client = new S3Client({
    endpoint: `https://${rawEndpoint}`,
    region: "us-east-1", // MinIO default fallback
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "",
    },
    forcePathStyle: true,
});

export const MINIO_BUCKET = bucketName;
export const MINIO_PUBLIC_URL = `https://${rawEndpoint}/${bucketName}`;

/**
 * Uploads a buffer directly to MinIO and returns the public accessible URL.
 */
export async function uploadBufferToMinio(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    folder: "products" | "assets" | "files" = "files"
): Promise<string> {

    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Remove ACL as it sometimes conflicts with MinIO strict modes, bucket should be public by default Policy
    });

    await s3Client.send(command);

    return `${MINIO_PUBLIC_URL}/${key}`;
}
