import "dotenv/config";

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { buildObjectKey, putPrivateObject } from "../server/services/object-storage";
import { storage } from "../server/storage";

const [beatTitle, licenseType, sourcePath] = process.argv.slice(2);
if (!beatTitle || !["basic", "premium", "exclusive"].includes(licenseType) || !sourcePath) {
  throw new Error("Usage: upload-beat-deliverable <beat title> <basic|premium|exclusive> <source file>");
}

const source = await stat(sourcePath);
if (!source.isFile()) throw new Error("The deliverable source must be a file");

const beats = await storage.getAllBeats();
const matches = beats.filter((beat) => beat.title.trim().toLowerCase() === beatTitle.trim().toLowerCase());
if (matches.length !== 1) throw new Error(`Expected one exact beat match; found ${matches.length}`);
const beat = matches[0];
const objectKey = buildObjectKey("beats", String(beat.id), "deliverables", licenseType, path.basename(sourcePath));
const extension = path.extname(sourcePath).toLowerCase();
const contentType = extension === ".mp3" ? "audio/mpeg"
  : extension === ".wav" ? "audio/wav"
    : extension === ".zip" ? "application/zip" : "application/octet-stream";

await putPrivateObject(objectKey, createReadStream(sourcePath), contentType);
const metadata = beat.metadata && typeof beat.metadata === "object" ? beat.metadata as Record<string, unknown> : {};
const deliverables = metadata.deliverables && typeof metadata.deliverables === "object"
  ? metadata.deliverables as Record<string, unknown>
  : {};
const reference = `r2-private://${objectKey}`;
await storage.updateBeat(beat.id, {
  ...(licenseType === "basic" ? { fullAudioUrl: reference } : {}),
  metadata: { ...metadata, deliverables: { ...deliverables, [licenseType]: reference } },
});

console.log(`Uploaded ${beat.title} ${licenseType} deliverable (${source.size} bytes)`);
