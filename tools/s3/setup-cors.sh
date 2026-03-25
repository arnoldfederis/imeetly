#!/usr/bin/env bash
# Configure CORS on Hetzner Object Storage bucket to allow direct browser uploads.
# Run this once per bucket. Requires aws CLI configured with S3 credentials.
#
# Usage:
#   ./tools/s3/setup-cors.sh
#
# Or manually:
#   aws s3api put-bucket-cors --bucket "$S3_BUCKET" --endpoint-url "$S3_ENDPOINT" --cors-configuration file://tools/s3/cors.json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load env from .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

: "${S3_ENDPOINT:?S3_ENDPOINT is required}"
: "${S3_BUCKET:?S3_BUCKET is required}"
: "${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID is required}"
: "${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY is required}"

export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"

echo "Applying CORS configuration to bucket: $S3_BUCKET"
echo "Endpoint: $S3_ENDPOINT"

aws s3api put-bucket-cors \
  --bucket "$S3_BUCKET" \
  --endpoint-url "$S3_ENDPOINT" \
  --cors-configuration "file://${SCRIPT_DIR}/cors.json"

echo "CORS configured. Verifying..."

aws s3api get-bucket-cors \
  --bucket "$S3_BUCKET" \
  --endpoint-url "$S3_ENDPOINT"

echo "Done."
