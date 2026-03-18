# Garage Local Setup

[Garage](https://garagehq.deuxfleurs.fr/) is an S3-compatible distributed storage engine used for file uploads.

## Prerequisites

- Garage binary installed (included via devbox)

## Ports

| Service   | Port |
| --------- | ---- |
| S3 API    | 3900 |
| RPC       | 3901 |
| Web       | 3902 |
| Admin     | 3903 |
| K2V API   | 3904 |

## Setup

All commands should be run from the `tools/garage/` directory.

```bash
cd tools/garage
```

### 1. Start the server

```bash
garage -c ./config.toml server
```

Keep this running in a separate terminal (or background it with `&`).

### 2. Check the node status

```bash
garage -c ./config.toml status
```

Copy the node ID from the output (e.g. `871bbde92a1f2628`).

### 3. Assign the node to a layout

Replace `<node_id>` with the ID from step 2.

```bash
garage -c ./config.toml layout assign -z dc1 -c 1G <node_id>
```

### 4. Apply the layout

```bash
garage -c ./config.toml layout apply --version 1
```

### 5. Create a bucket

```bash
garage -c ./config.toml bucket create aimeetly
```

### 6. Create an API key

```bash
garage -c ./config.toml key create aimeetly-key
```

Save the **Key ID** and **Secret Key** from the output.

### 7. Grant the key access to the bucket

```bash
garage -c ./config.toml bucket allow --read --write --owner aimeetly --key aimeetly-key
```

### 8. Configure CORS for browser uploads

**Note:** CORS is automatically configured by the `garage-setup` process in `process-compose.yaml`.

If you need to manually configure CORS, run:

```bash
./tools/garage/setup-cors.sh
```

The CORS configuration is defined in `cors.xml` and allows:
- Origins: `http://localhost:3000`, `http://localhost:3001`
- Methods: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
- Headers: All (`*`)
- Exposed Headers: `ETag`, `x-amz-checksum-crc32`

### 9. Update `.env`

Set the following in the root `.env` file using the credentials from step 6:

```env
S3_ENDPOINT=http://localhost:3900
S3_ACCESS_KEY_ID=<key_id>
S3_SECRET_ACCESS_KEY=<secret_key>
S3_BUCKET=aimeetly
S3_REGION=garage
```

## Verify

```bash
garage -c ./config.toml status
garage -c ./config.toml bucket info aimeetly
garage -c ./config.toml key info aimeetly-key
```

## Data storage

Metadata and data are stored locally in `tools/garage/meta/` and `tools/garage/data/` (gitignored). Deleting these directories resets the cluster and requires re-running the setup from step 2.
