import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createPrivateDownloadUrl } from "../server/services/object-storage";
import { storage } from "../server/storage";

const sourcePath = "E:\\Production\\r&b work\\rokit\\rokit 168 bpm.mp3";
const beat = (await storage.getAllBeats()).find((item) => item.title.trim().toLowerCase() === "rokit");
if (!beat) throw new Error("ROKIT beat was not found");
const metadata = beat.metadata && typeof beat.metadata === "object" ? beat.metadata as Record<string, unknown> : {};
const deliverables = metadata.deliverables && typeof metadata.deliverables === "object"
  ? metadata.deliverables as Record<string, unknown>
  : {};
const reference = String(deliverables.basic || "");
if (!reference.startsWith("r2-private://")) throw new Error("ROKIT Basic private deliverable is not configured");

const url = await createPrivateDownloadUrl(reference.slice("r2-private://".length), 60, "ROKIT.mp3");
const response = await fetch(url);
if (!response.ok) throw new Error(`Private download returned HTTP ${response.status}`);
const [source, downloaded] = await Promise.all([readFile(sourcePath), response.arrayBuffer()]);
const digest = (value: Buffer | ArrayBuffer) => createHash("sha256").update(value instanceof Buffer ? value : new Uint8Array(value)).digest("hex");
if (source.length !== downloaded.byteLength || digest(source) !== digest(downloaded)) {
  throw new Error("Downloaded ROKIT file does not match the source MP3");
}
console.log(`ROKIT secure delivery verified byte-for-byte (${source.length} bytes)`);
