import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as env from '@/lib/env';

const region = env.AWS_REGION!;
const bucket = env.AWS_S3_BUCKET_NAME!;
const endpoint = env.AWS_ENDPOINT;

if (!region || !bucket) {
  throw new Error('S3 Configuration error: AWS_REGION and AWS_S3_BUCKET_NAME must be defined in environment variables.');
}

export const s3Client = new S3Client({
  region,
  ...(endpoint && { endpoint }),
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generates a presigned URL for secure client-side uploading.
 * 
 * @param path - The destination path in the bucket.
 * @param contentType - The expected MIME type.
 * @param expiresIn - Expiration time in seconds (default 1 hour).
 * @returns The presigned PUT URL.
 */
export async function getPresignedUploadUrl(
  path: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generates a signed URL for secure client-side downloading/viewing.
 * 
 * @param path - The path of the object in the bucket.
 * @param expiresIn - Expiration time in seconds (default 1 hour).
 * @returns The signed GET URL.
 */
export async function getSignedDownloadUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  // If the path is already a full URL, return it as-is to avoid double-signing
  if (path.startsWith('http')) {
    return path;
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
