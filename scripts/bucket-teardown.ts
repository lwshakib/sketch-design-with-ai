import { 
  S3Client, 
  DeleteBucketCommand, 
  ListObjectsV2Command, 
  DeleteObjectsCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "auto";
const endpoint = process.env.AWS_ENDPOINT;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !bucketName) {
  console.error("Missing required environment variables for S3 teardown.");
  process.exit(1);
}

const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function teardownBucket() {
  try {
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        console.log(`Bucket "${bucketName}" does not exist. Nothing to teardown.`);
        return;
      }
      throw error;
    }

    // List and delete all objects in the bucket
    console.log(`Cleaning up objects in bucket "${bucketName}"...`);
    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });

      const listResponse = await s3Client.send(listCommand);
      const objects = listResponse.Contents;

      if (objects && objects.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: objects.map((obj) => ({ Key: obj.Key })),
            Quiet: true,
          },
        });

        await s3Client.send(deleteCommand);
        console.log(`Deleted ${objects.length} objects.`);
      }

      isTruncated = !!listResponse.IsTruncated;
      continuationToken = listResponse.NextContinuationToken;
    }

    // Delete the bucket
    console.log(`Deleting bucket "${bucketName}"...`);
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" deleted successfully.`);

  } catch (error) {
    console.error("Error tearing down bucket:", error);
    process.exit(1);
  }
}

teardownBucket();
