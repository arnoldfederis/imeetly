#!/bin/bash
set -e

ADMIN_TOKEN="ZUZJ44FrST7v8h/DjG1CCpk3jbTpt6RPyYBA73Civ2c="
ADMIN_ENDPOINT="http://localhost:3903"
S3_ENDPOINT="http://localhost:3900"
BUCKET="aimeetly"
CORS_FILE="tools/garage/cors.xml"
ENV_FILE=".env"

echo "Waiting for Garage to be ready..."
sleep 5

# 1. Get node ID and assign layout if needed
echo "=== Checking layout ==="
LAYOUT=$(curl -s "$ADMIN_ENDPOINT/v1/layout" -H "Authorization: Bearer $ADMIN_TOKEN")
ROLE_COUNT=$(echo "$LAYOUT" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['roles']))")

if [ "$ROLE_COUNT" = "0" ]; then
  NODE_ID=$(curl -s "$ADMIN_ENDPOINT/v1/status" -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['node'])")

  LAYOUT_VERSION=$(echo "$LAYOUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])")
  NEXT_VERSION=$((LAYOUT_VERSION + 1))

  echo "Assigning role to node $NODE_ID..."
  curl -s -X POST "$ADMIN_ENDPOINT/v1/layout" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "[{\"id\": \"$NODE_ID\", \"zone\": \"dc1\", \"capacity\": 1073741824, \"tags\": [\"dev\"]}]" > /dev/null

  curl -s -X POST "$ADMIN_ENDPOINT/v1/layout/apply" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"version\": $NEXT_VERSION}" > /dev/null

  echo "Layout applied."
else
  echo "Layout already configured."
fi

# 2. Create API key if none exist
echo ""
echo "=== Checking API keys ==="
KEYS=$(curl -s "$ADMIN_ENDPOINT/v1/key" -H "Authorization: Bearer $ADMIN_TOKEN")
KEY_COUNT=$(echo "$KEYS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")

if [ "$KEY_COUNT" = "0" ]; then
  echo "Creating API key..."
  KEY_RESULT=$(curl -s -X POST "$ADMIN_ENDPOINT/v1/key" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "aimeetly-dev"}')

  ACCESS_KEY=$(echo "$KEY_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessKeyId'])")
  SECRET_KEY=$(echo "$KEY_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['secretAccessKey'])")
  echo "API key created: $ACCESS_KEY"

  # Update .env file
  if [ -f "$ENV_FILE" ]; then
    sed -i '' "s|^S3_ACCESS_KEY_ID=.*|S3_ACCESS_KEY_ID=$ACCESS_KEY|" "$ENV_FILE"
    sed -i '' "s|^S3_SECRET_ACCESS_KEY=.*|S3_SECRET_ACCESS_KEY=$SECRET_KEY|" "$ENV_FILE"
    echo "Updated $ENV_FILE with new S3 credentials."
  fi
else
  ACCESS_KEY=$(echo "$KEYS" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
  # Read secret from .env since the list endpoint doesn't return it
  if [ -f "$ENV_FILE" ]; then
    SECRET_KEY=$(grep "^S3_SECRET_ACCESS_KEY=" "$ENV_FILE" | cut -d'=' -f2)
  fi
  if [ -z "$SECRET_KEY" ]; then
    echo "ERROR: Could not find S3_SECRET_ACCESS_KEY in $ENV_FILE. Delete the key via Garage admin API and re-run to create a new one."
    exit 1
  fi
  echo "Using existing API key: $ACCESS_KEY"
fi

# 3. Create bucket if it doesn't exist
echo ""
echo "=== Checking bucket ==="
BUCKET_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_ENDPOINT/v1/bucket?globalAlias=$BUCKET" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if [ "$BUCKET_CHECK" != "200" ]; then
  echo "Creating bucket '$BUCKET'..."
  BUCKET_RESULT=$(curl -s -X POST "$ADMIN_ENDPOINT/v1/bucket" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')

  BUCKET_ID=$(echo "$BUCKET_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

  # Add global alias
  curl -s -X PUT "$ADMIN_ENDPOINT/v1/bucket/alias/global?id=$BUCKET_ID&alias=$BUCKET" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

  # Grant key access
  curl -s -X POST "$ADMIN_ENDPOINT/v1/bucket/allow" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"bucketId\": \"$BUCKET_ID\", \"accessKeyId\": \"$ACCESS_KEY\", \"permissions\": {\"read\": true, \"write\": true, \"owner\": true}}" > /dev/null

  echo "Bucket '$BUCKET' created and configured."
else
  echo "Bucket '$BUCKET' already exists."
fi

# 4. Apply CORS
echo ""
echo "=== Applying CORS ==="
CORS_RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$S3_ENDPOINT/$BUCKET?cors" \
  -H "Content-Type: application/xml" \
  --aws-sigv4 "aws:amz:garage:s3" \
  --user "$ACCESS_KEY:$SECRET_KEY" \
  -d @"$CORS_FILE")

if [ "$CORS_RESULT" = "200" ]; then
  echo "CORS configuration applied."
else
  echo "CORS configuration failed (HTTP $CORS_RESULT)."
  exit 1
fi

echo ""
echo "=== Garage setup complete ==="
