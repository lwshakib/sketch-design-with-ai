export const GLM_WORKER_URL = process.env.GLM_WORKER_URL || "";
export const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY || "";

// AI Gateway Variables
export const CLOUDFLARE_AI_GATEWAY_API_KEY = process.env.CLOUDFLARE_AI_GATEWAY_API_KEY || process.env.CLOUDFLARE_API_KEY;
export const CLOUDFLARE_AI_GATEWAY_ENDPOINT = process.env.CLOUDFLARE_AI_GATEWAY_ENDPOINT || process.env.GLM_WORKER_URL;

export const AWS_REGION = process.env.AWS_REGION;
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
export const AWS_ENDPOINT = process.env.AWS_ENDPOINT;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
