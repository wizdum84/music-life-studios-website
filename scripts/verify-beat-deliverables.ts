import "dotenv/config";

import { HeadObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { storage } from "../server/storage";

const required = ["PRIVATE_MEDIA_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "PRIVATE_MEDIA_BUCKET_NAME"] as const;
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.PRIVATE_MEDIA_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const bucket = process.env.PRIVATE_MEDIA_BUCKET_NAME!;

const beats = (await storage.getAllBeats()).filter((beat) => beat.title.trim().toLowerCase() !== "cawl");
const references: Array<{ title: string; tier: string; key: string }> = [];
for (const beat of beats) {
  const metadata = beat.metadata && typeof beat.metadata === "object" ? beat.metadata as Record<string, unknown> : {};
  const deliverables = metadata.deliverables && typeof metadata.deliverables === "object"
    ? metadata.deliverables as Record<string, unknown>
    : {};
  for (const tier of ["basic", "premium", "exclusive"]) {
    const reference = String(deliverables[tier] || "");
    if (reference.startsWith("r2-private://")) references.push({ title: beat.title, tier, key: reference.slice(13) });
  }
}

let missing = 0;
for (const item of references) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: item.key }));
  } catch {
    missing += 1;
    console.error(`Missing object: ${item.title} ${item.tier}`);
  }
}

let objectCount = 0;
let continuationToken: string | undefined;
do {
  const page = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: "beats/",
    ContinuationToken: continuationToken,
  }));
  objectCount += page.KeyCount || 0;
  continuationToken = page.NextContinuationToken;
} while (continuationToken);

const count = (tier: string) => references.filter((item) => item.tier === tier).length;
console.log(JSON.stringify({
  catalogBeats: beats.length,
  basicLinked: count("basic"),
  premiumLinked: count("premium"),
  exclusiveLinked: count("exclusive"),
  linkedObjectsMissingFromR2: missing,
  privateBeatObjects: objectCount,
}, null, 2));

if (missing) process.exitCode = 1;
