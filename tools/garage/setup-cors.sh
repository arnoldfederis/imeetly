#!/bin/bash
set -e

# Wait for Garage to be ready
echo "Waiting for Garage to be ready..."
sleep 5

# Read S3 credentials from environment
if [ -z "$S3_ACCESS_KEY_ID" ] || [ -z "$S3_SECRET_ACCESS_KEY" ]; then
  echo "S3 credentials not found in environment. Skipping CORS setup."
  exit 0
fi

BUCKET="aimeetly"
ENDPOINT="http://localhost:3900"
CORS_FILE="tools/garage/cors.xml"

echo "Configuring CORS for bucket: $BUCKET"

# Use garage CLI to configure via S3 API
# Garage supports the S3 PutBucketCors API but doesn't have a dedicated CLI command
# We'll use a simple curl request with minimal auth (Garage is lenient for localhost)

curl -X PUT "${ENDPOINT}/${BUCKET}?cors" \
  -H "Content-Type: application/xml" \
  --aws-sigv4 "aws:amz:garage:s3" \
  --user "${S3_ACCESS_KEY_ID}:${S3_SECRET_ACCESS_KEY}" \
  -d @"${CORS_FILE}" \
  && echo "✓ CORS configuration applied successfully" \
  || echo "✗ CORS configuration failed (may already be set)"
