#!/bin/bash

# Check if tools/certs directory exists, if not create it
if [ ! -d "tools/certs" ]; then
    mkdir -p tools/certs
fi

# Change to the certs directory
cd tools/certs

# Generate root CA and certificates using mkcert
mkcert -install
mkcert -cert-file imeetly.dev.pem -key-file imeetly.dev-key.pem "*.imeetly.dev" "imeetly.dev"

# Copy root CA
cp "$(mkcert -CAROOT)/rootCA.pem" ./rootCA.pem
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"

echo "Certificates generated successfully in tools/certs directory"
