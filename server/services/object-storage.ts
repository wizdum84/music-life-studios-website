import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type StorageArea = "public" | "private";

const MAX_SIGNED_URL_SECONDS = 60 * 60;

function storageConfig(area: StorageArea) {
  const prefix = area === "public" ? "PUBLIC_MEDIA" : "PRIVATE_MEDIA";
  const endpoint = process.env[`${prefix}_ENDPOINT`];
  const bucket = process.env[`${prefix}_BUCKET_NAME`];
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

function clientFor(area: StorageArea) {
  const config = storageConfig(area);
  if (!config) throw new Error(`R2 ${area} storage is not fully configured`);
  return {
    bucket: config.bucket,
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

export function buildObjectKey(...parts: string[]) {
  const key = parts
    .flatMap((part) => part.split(/[\\/]+/))
    .map((part) => part.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
  if (!key) throw new Error("A valid object key is required");
  return key;
}

export function isObjectStorageConfigured(area?: StorageArea) {
  return area ? Boolean(storageConfig(area)) : Boolean(storageConfig("public") && storageConfig("private"));
}

async function putObject(area: StorageArea, key: string, body: PutObjectCommandInput["Body"], contentType: string) {
  const { client, bucket } = clientFor(area);
  const objectKey = buildObjectKey(key);
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
  }));
  return objectKey;
}

export async function putPublicObject(key: string, body: PutObjectCommandInput["Body"], contentType: string) {
  const objectKey = await putObject("public", key, body, contentType);
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "");
  return { key: objectKey, url: baseUrl ? `${baseUrl}/${objectKey}` : null };
}

export async function putPrivateObject(key: string, body: PutObjectCommandInput["Body"], contentType: string) {
  return { key: await putObject("private", key, body, contentType) };
}

export async function createPrivateDownloadUrl(key: string, expiresInSeconds = 15 * 60, downloadName?: string) {
  const { client, bucket } = clientFor("private");
  const expiresIn = Math.max(60, Math.min(MAX_SIGNED_URL_SECONDS, Math.round(expiresInSeconds)));
  const safeName = downloadName?.replace(/[^a-zA-Z0-9._ -]+/g, "-").trim();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: buildObjectKey(key),
    ...(safeName ? { ResponseContentDisposition: `attachment; filename="${safeName}"` } : {}),
  }), { expiresIn });
}

export async function deleteObject(area: StorageArea, key: string) {
  const { client, bucket } = clientFor(area);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: buildObjectKey(key) }));
}
