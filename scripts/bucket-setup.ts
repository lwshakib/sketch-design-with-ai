import {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "auto";
const endpoint = process.env.AWS_ENDPOINT;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !bucketName) {
  console.error("Missing required environment variables for S3 setup.");
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

async function setupBucket() {
  try {
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket "${bucketName}" already exists.`);
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        console.log(`Creating bucket "${bucketName}"...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket "${bucketName}" created successfully.`);
      } else {
        throw error;
      }
    }

    // Set CORS configuration
    console.log(`Setting CORS configuration for bucket "${bucketName}"...`);
    const corsConfiguration = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"], // In production, replace with your actual domain
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    await s3Client.send(new PutBucketCorsCommand(corsConfiguration));
    console.log("CORS configuration set successfully.");
  } catch (error) {
    console.error("Error setting up bucket:", error);
    process.exit(1);
  }
}

setupBucket();
