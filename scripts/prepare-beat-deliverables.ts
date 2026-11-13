import "dotenv/config";

import { createReadStream, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { buildObjectKey, putPrivateObject } from "../server/services/object-storage";
import { storage } from "../server/storage";

type SourceRow = { title: string; source: string };
type PreparedBeat = {
  id: number;
  title: string;
  catalogNumber: string | null;
  masterSource: string | null;
  masterKind: "wav" | "mp3" | null;
  trackedDirectory: string | null;
  stemFiles: string[];
  basicMp3: string | null;
  premiumZip: string | null;
  exclusiveZip: string | null;
  notes: string[];
};

const productionRoot = "E:/Production";
const trackedRoot = path.join(productionRoot, "tracked out beats");
const outputRoot = path.join(productionRoot, "Music Life Deliverables");
const reportPath = path.join(outputRoot, "delivery-manifest.json");
const audioExtensions = new Set([".wav", ".mp3", ".aiff", ".aif"]);
const importFiles = ["scripts/import-tracked-out-batch.ts", "scripts/import-beat-batch.ts"];

function identity(value: string, stripTempo = false) {
  let result = path.basename(value, path.extname(value)).toLowerCase();
  if (stripTempo) result = result.replace(/\s+\d+(?:\.\d+)?\s*(?:bpm|bpn)?\s*$/gi, " ");
  return result.replace(/[^a-z0-9]+/g, "").trim();
}

function safeName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "beat";
}

function readSourceManifest() {
  const result = new Map<string, SourceRow>();
  const expression = /title:\s*"([^"]+)"[\s\S]*?source:\s*"([^"]+)"/g;
  for (const file of importFiles) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(expression)) {
      const row = { title: match[1], source: match[2] };
      result.set(identity(row.title, false), row);
    }
  }
  return result;
}

function walkAudio(root: string) {
  const files: string[] = [];
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop()!;
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (path.resolve(item) !== path.resolve(outputRoot)) pending.push(item);
      } else if (entry.isFile() && audioExtensions.has(path.extname(entry.name).toLowerCase())) files.push(item);
    }
  }
  return files;
}

function trackedDirectoryFor(title: string, bpm: number, directories: string[]) {
  const aliases: Record<string, string> = { commision: "commission" };
  const target = aliases[identity(title)] || identity(title);
  const matches = directories.filter((directory) => identity(path.basename(directory), true) === target);
  if (matches.length <= 1) return matches[0] || null;
  return matches.find((directory) => path.basename(directory).includes(String(Math.round(bpm)))) || null;
}

function exactMasterCandidates(title: string, files: string[], trackedDirectory: string | null) {
  const target = identity(title);
  return files.filter((file) => {
    if (/ - track \d+/i.test(path.basename(file))) return false;
    if (trackedDirectory && path.dirname(file).toLowerCase().startsWith(trackedDirectory.toLowerCase()) && /track \d+/i.test(path.basename(file))) return false;
    return identity(file, true) === target;
  });
}

function chooseMaster(title: string, manifestSource: string | undefined, files: string[], trackedDirectory: string | null) {
  const exact = exactMasterCandidates(title, files, trackedDirectory);
  const exactWav = exact.find((file) => path.extname(file).toLowerCase() === ".wav");
  if (manifestSource && existsSync(manifestSource)) {
    if (path.extname(manifestSource).toLowerCase() === ".wav") return manifestSource;
    if (exactWav) return exactWav;
    return manifestSource;
  }
  const outsideTracked = exact.filter((file) => !file.toLowerCase().startsWith(trackedRoot.toLowerCase()));
  return outsideTracked.find((file) => path.extname(file).toLowerCase() === ".wav")
    || outsideTracked.find((file) => path.extname(file).toLowerCase() === ".mp3")
    || exactWav
    || exact.find((file) => path.extname(file).toLowerCase() === ".mp3")
    || null;
}

function directStemFiles(directory: string | null, master: string | null) {
  if (!directory || !existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".wav")
    .map((entry) => path.join(directory, entry.name))
    .filter((file) => !master || path.resolve(file) !== path.resolve(master));
}

function run(binary: string, args: string[], label: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk) => { error += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${label} failed: ${error.slice(-800)}`)));
  });
}

async function ensureMp3(source: string, destination: string) {
  if (existsSync(destination) && statSync(destination).size > 0) return;
  mkdirSync(path.dirname(destination), { recursive: true });
  if (path.extname(source).toLowerCase() === ".mp3") {
    copyFileSync(source, destination);
    return;
  }
  if (!ffmpegPath) throw new Error("ffmpeg-static is unavailable");
  await run(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-i", source, "-vn", "-codec:a", "libmp3lame", "-b:a", "320k", destination], `MP3 conversion for ${path.basename(source)}`);
}

async function ensureZip(destination: string, files: string[]) {
  if (existsSync(destination) && statSync(destination).size > 0) return;
  mkdirSync(path.dirname(destination), { recursive: true });
  const args = ["-a", "-cf", destination];
  for (const file of files) args.push("-C", path.dirname(file), path.basename(file));
  await run("tar.exe", args, `Archive ${path.basename(destination)}`);
}

async function buildManifest() {
  const beats = await storage.getAllBeats();
  const uniqueBeats = [...new Map(beats.filter((beat) => identity(beat.title) !== "cawl").map((beat) => [identity(beat.title), beat])).values()];
  const sourceManifest = readSourceManifest();
  const allAudio = walkAudio(productionRoot);
  const trackedDirectories = existsSync(trackedRoot)
    ? readdirSync(trackedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(trackedRoot, entry.name))
    : [];

  return uniqueBeats.map<PreparedBeat>((beat) => {
    const sourceRow = sourceManifest.get(identity(beat.title));
    const trackedDirectory = trackedDirectoryFor(beat.title, beat.bpm, trackedDirectories);
    const masterSource = chooseMaster(beat.title, sourceRow?.source, allAudio, trackedDirectory);
    const stemFiles = directStemFiles(trackedDirectory, masterSource);
    const folder = path.join(outputRoot, `${beat.catalogNumber || `beat-${beat.id}`}-${safeName(beat.title)}`);
    const basicMp3 = masterSource ? path.join(folder, "basic", `${safeName(beat.title)}.mp3`) : null;
    const wavMaster = masterSource && [".wav", ".aiff", ".aif"].includes(path.extname(masterSource).toLowerCase()) ? masterSource : null;
    const premiumZip = wavMaster && basicMp3 ? path.join(folder, "premium", `${safeName(beat.title)}-premium.zip`) : null;
    const exclusiveZip = wavMaster && basicMp3 && stemFiles.length >= 2 ? path.join(folder, "exclusive", `${safeName(beat.title)}-exclusive.zip`) : null;
    const notes: string[] = [];
    if (!masterSource) notes.push("No unambiguous full master found");
    else if (!wavMaster) notes.push("MP3-only master; WAV export required for Premium and Exclusive");
    if (!trackedDirectory) notes.push("No matching tracked-out folder");
    else if (stemFiles.length < 2) notes.push("Tracked-out folder has fewer than two WAV stems");
    return {
      id: beat.id,
      title: beat.title,
      catalogNumber: beat.catalogNumber,
      masterSource,
      masterKind: masterSource ? (wavMaster ? "wav" : "mp3") : null,
      trackedDirectory,
      stemFiles,
      basicMp3,
      premiumZip,
      exclusiveZip,
      notes,
    };
  });
}

async function prepare(manifest: PreparedBeat[]) {
  mkdirSync(outputRoot, { recursive: true });
  let completed = 0;
  for (const beat of manifest) {
    if (!beat.masterSource || !beat.basicMp3) continue;
    await ensureMp3(beat.masterSource, beat.basicMp3);
    const wavMaster = beat.masterKind === "wav" ? beat.masterSource : null;
    if (beat.premiumZip && wavMaster) await ensureZip(beat.premiumZip, [beat.basicMp3, wavMaster]);
    if (beat.exclusiveZip && wavMaster) await ensureZip(beat.exclusiveZip, [beat.basicMp3, wavMaster, ...beat.stemFiles]);
    completed += 1;
    console.log(`[${completed}/${manifest.length}] Prepared ${beat.title}`);
  }
}

async function upload(manifest: PreparedBeat[]) {
  let completed = 0;
  for (const beat of manifest) {
    const uploads: Array<{ tier: "basic" | "premium" | "exclusive"; file: string }> = [];
    if (beat.basicMp3 && existsSync(beat.basicMp3)) uploads.push({ tier: "basic", file: beat.basicMp3 });
    if (beat.premiumZip && existsSync(beat.premiumZip)) uploads.push({ tier: "premium", file: beat.premiumZip });
    if (beat.exclusiveZip && existsSync(beat.exclusiveZip)) uploads.push({ tier: "exclusive", file: beat.exclusiveZip });
    if (!uploads.length) continue;
    const current = await storage.getBeat(beat.id);
    if (!current) continue;
    const metadata = current.metadata && typeof current.metadata === "object" ? current.metadata as Record<string, unknown> : {};
    const deliverables = metadata.deliverables && typeof metadata.deliverables === "object" ? metadata.deliverables as Record<string, unknown> : {};
    const pendingUploads = uploads.filter((item) => typeof deliverables[item.tier] !== "string" || !String(deliverables[item.tier]).startsWith("r2-private://"));
    if (!pendingUploads.length) {
      console.log(`[skip] ${beat.title}: all prepared tiers are already linked`);
      continue;
    }
    for (const item of pendingUploads) {
      const objectKey = buildObjectKey("beats", String(beat.id), "deliverables", item.tier, path.basename(item.file));
      const contentType = item.tier === "basic" ? "audio/mpeg" : "application/zip";
      await putPrivateObject(objectKey, createReadStream(item.file), contentType);
      deliverables[item.tier] = `r2-private://${objectKey}`;
    }
    await storage.updateBeat(beat.id, {
      ...(deliverables.basic ? { fullAudioUrl: String(deliverables.basic) } : {}),
      metadata: { ...metadata, deliverables },
    });
    completed += 1;
    console.log(`[${completed}/${manifest.length}] Uploaded ${beat.title}: ${pendingUploads.map((item) => item.tier).join(", ")}`);
  }
}

async function main() {
  const manifest = await buildManifest();
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({
    beats: manifest.length,
    basicReady: manifest.filter((beat) => beat.basicMp3).length,
    premiumReady: manifest.filter((beat) => beat.premiumZip).length,
    exclusiveReady: manifest.filter((beat) => beat.exclusiveZip).length,
    mp3Only: manifest.filter((beat) => beat.masterKind === "mp3").map((beat) => beat.title),
    missingMaster: manifest.filter((beat) => !beat.masterSource).map((beat) => beat.title),
    missingStems: manifest.filter((beat) => !beat.exclusiveZip).map((beat) => beat.title),
    reportPath,
  }, null, 2));
  if (process.argv.includes("--prepare")) {
    await prepare(manifest);
    writeFileSync(reportPath, JSON.stringify(manifest, null, 2));
  }
  if (process.argv.includes("--upload")) await upload(manifest);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
