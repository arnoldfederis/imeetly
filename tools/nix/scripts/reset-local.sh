#!/bin/bash

echo "Removing db..."
rm -rf .devbox/virtenv/postgresql/data
echo "Done removing db."
echo "Resetting local..."

bun clean
bun install
cert-gen
env-decrypt
env-sync
sync-hosts
dev up