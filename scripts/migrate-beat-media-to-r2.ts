import "dotenv/config";
import path from "node:path";
import { createReadStream, existsSync } from "node:fs";
import { storage } from "../server/storage";
import { putPublicObject } from "../server/services/object-storage";

const publicRoot = path.resolve(process.cwd(), "client", "public");
const contentType = (filename: string) => {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
};

async function migrateUrl(value: string | null | undefined, kind: "covers" | "previews") {
  if (!value || /^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  const relative = decodeURIComponent(value.split("?")[0]).replace(/^\/+/, "");
  const source = path.resolve(publicRoot, relative);
  if (!source.startsWith(`${publicRoot}${path.sep}`) || !existsSync(source)) throw new Error(`Missing local media: ${relative}`);
  const stored = await putPublicObject(path.posix.join("beats", kind, path.basename(source)), createReadStream(source), contentType(source));
  if (!stored.url) throw new Error("PUBLIC_MEDIA_BASE_URL is not configured");
  return stored.url;
}

async function main() {
  const beats = await storage.getAllBeats();
  let migrated = 0;
  for (const beat of beats) {
    const imageUrl = await migrateUrl(beat.imageUrl, "covers");
    const previewUrl = await migrateUrl(beat.previewUrl, "previews");
    if (imageUrl !== beat.imageUrl || previewUrl !== beat.previewUrl) {
      await storage.updateBeat(beat.id, { imageUrl, previewUrl });
      migrated += 1;
      console.log(`Migrated ${migrated}/${beats.length}: beat #${beat.id}`);
    }
  }
  console.log(`R2 media migration complete: ${migrated} updated, ${beats.length - migrated} already remote.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Beat media migration failed");
  process.exit(1);
});
