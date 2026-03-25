/**
 * Configure CORS on Hetzner Object Storage bucket to allow direct browser uploads.
 * Run once per bucket:  bun run tools/s3/setup-cors.ts
 */
import { PutBucketCorsCommand, GetBucketCorsCommand, S3Client } from "../../apps/server/node_modules/@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const corsOrigin = process.env.CORS_ORIGIN ?? "https://app.aimeetly.dev";

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !region) {
  console.error("Missing required S3 env vars. Ensure .env is loaded.");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

console.log(`Setting CORS on bucket "${bucket}" at ${endpoint}`);
console.log(`Allowed origin: ${corsOrigin}`);

await s3.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [corsOrigin],
          AllowedMethods: ["PUT"],
          AllowedHeaders: ["Content-Type"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.log("CORS configured. Verifying...");

const result = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
console.log("Current CORS rules:", JSON.stringify(result.CORSRules, null, 2));
console.log("Done.");
