import "dotenv/config";

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { storage } from "../server/storage";

type ManifestRow = { title: string; source: string };

const audioExtensions = new Set([".wav", ".mp3", ".aiff", ".aif"]);
const importFiles = [
  "scripts/import-tracked-out-batch.ts",
  "scripts/import-beat-batch.ts",
];

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/\b\d+(?:\.\d+)?\s*bpm\b/g, "").replace(/[^a-z0-9]+/g, "").trim();
}

function readManifest() {
  const rows: ManifestRow[] = [];
  const expression = /title:\s*"([^"]+)"[\s\S]*?source:\s*"([^"]+)"/g;
  for (const file of importFiles) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(expression)) rows.push({ title: match[1], source: match[2] });
  }
  const unique = new Map<string, ManifestRow>();
  const duplicateTitles: string[] = [];
  for (const row of rows) {
    const key = normalizeTitle(row.title);
    if (unique.has(key)) duplicateTitles.push(row.title);
    else unique.set(key, row);
  }
  return { rows: [...unique.values()], duplicateTitles };
}

function immediateAudioFiles(directory: string) {
  if (!existsSync(directory)) return [] as string[];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && audioExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(directory, entry.name));
}

function walkCandidateStemDirectories(root: string) {
  const matches: Array<{ directory: string; files: number; bytes: number }> = [];
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop()!;
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = path.join(directory, entry.name);
      pending.push(child);
      if (!/(stem|track.?out|bounce|bounced)/i.test(entry.name)) continue;
      const files = immediateAudioFiles(child);
      matches.push({
        directory: child,
        files: files.length,
        bytes: files.reduce((total, file) => total + statSync(file).size, 0),
      });
    }
  }
  return matches;
}

function walkAudioFiles(root: string) {
  const files: string[] = [];
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop()!;
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(item);
      else if (entry.isFile() && audioExtensions.has(path.extname(entry.name).toLowerCase())) files.push(item);
    }
  }
  return files;
}

function sourceCandidates(title: string, files: string[]) {
  const target = normalizeTitle(title);
  return files.filter((file) => {
    const base = normalizeTitle(path.basename(file, path.extname(file)));
    const parent = normalizeTitle(path.basename(path.dirname(file)));
    return base === target || parent === target || (target.length >= 4 && base.startsWith(target));
  });
}

async function main() {
  const { rows, duplicateTitles } = readManifest();
  const catalog = await storage.getAllBeats();
  const catalogTitles = new Set(catalog.map((beat) => normalizeTitle(beat.title)));
  const existingSources = rows.filter((row) => existsSync(row.source));
  const missingSources = rows.filter((row) => !existsSync(row.source));
  const unmatchedCatalog = catalog.filter((beat) => !rows.some((row) => normalizeTitle(row.title) === normalizeTitle(beat.title)));
  const unmatchedManifest = rows.filter((row) => !catalogTitles.has(normalizeTitle(row.title)));
  const mp3Only = existingSources.filter((row) => {
    if (path.extname(row.source).toLowerCase() !== ".mp3") return false;
    return !immediateAudioFiles(path.dirname(row.source)).some((file) => path.extname(file).toLowerCase() === ".wav");
  });
  const wavSources = existingSources.filter((row) => path.extname(row.source).toLowerCase() === ".wav");
  const stemDirectories = walkCandidateStemDirectories("E:/Production");
  const allAudioFiles = walkAudioFiles("E:/Production");
  const unmatchedCandidateResults = unmatchedCatalog.map((beat) => ({
    title: beat.title,
    candidates: sourceCandidates(beat.title, allAudioFiles),
  }));
  const directWavGroups = new Map<string, string[]>();
  for (const file of allAudioFiles.filter((item) => path.extname(item).toLowerCase() === ".wav")) {
    const directory = path.dirname(file);
    const group = directWavGroups.get(directory) || [];
    group.push(file);
    directWavGroups.set(directory, group);
  }
  const multiWavDirectories = [...directWavGroups.entries()]
    .filter(([, files]) => files.length >= 3)
    .map(([directory, files]) => ({
      directory,
      files: files.length,
      sizeGb: Number((files.reduce((total, file) => total + statSync(file).size, 0) / 1024 ** 3).toFixed(2)),
    }))
    .sort((a, b) => b.files - a.files);
  const trackedRoot = "E:/Production/tracked out beats";
  const trackedDirectories = existsSync(trackedRoot)
    ? readdirSync(trackedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(trackedRoot, entry.name))
    : [];
  const trackedMatches = catalog.map((beat) => {
    const target = normalizeTitle(beat.title);
    const matches = trackedDirectories.filter((directory) => {
      const normalized = normalizeTitle(path.basename(directory).replace(/\b\d+(?:\.\d+)?\s*(?:bpm|bpn)\b/ig, ""));
      return normalized === target;
    });
    return { title: beat.title, matches };
  });

  if (process.argv.includes("--summary")) {
    console.log(JSON.stringify({
      catalogBeats: catalog.length,
      uniqueCatalogTitles: new Set(catalog.map((beat) => normalizeTitle(beat.title))).size,
      manifestTitles: rows.length,
      existingMappedSources: existingSources.length,
      wavMappedSources: wavSources.length,
      mp3OnlyMappedSources: mp3Only.length,
      allProductionAudioFiles: allAudioFiles.length,
      trackedOutDirectories: trackedDirectories.length,
      catalogTitlesWithOneTrackedMatch: trackedMatches.filter((item) => item.matches.length === 1).length,
      catalogTitlesWithMultipleTrackedMatches: trackedMatches.filter((item) => item.matches.length > 1).map((item) => item.title),
      catalogTitlesWithoutTrackedMatch: trackedMatches.filter((item) => item.matches.length === 0).map((item) => item.title),
      multiWavDirectories: multiWavDirectories.length,
      multiWavFiles: multiWavDirectories.reduce((total, item) => total + item.files, 0),
      multiWavSizeGb: Number(multiWavDirectories.reduce((total, item) => total + item.sizeGb, 0).toFixed(2)),
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    catalogBeats: catalog.length,
    manifestTitles: rows.length,
    duplicateManifestTitles: duplicateTitles,
    existingMappedSources: existingSources.length,
    missingMappedSources: missingSources.map((row) => row.title),
    wavMappedSources: wavSources.length,
    mp3OnlyMappedSources: mp3Only.map((row) => row.title),
    unmatchedCatalogTitles: unmatchedCatalog.map((beat) => beat.title),
    unmatchedManifestTitles: unmatchedManifest.map((row) => row.title),
    candidateStemDirectories: stemDirectories.length,
    candidateStemAudioFiles: stemDirectories.reduce((total, item) => total + item.files, 0),
    candidateStemSizeGb: Number((stemDirectories.reduce((total, item) => total + item.bytes, 0) / 1024 ** 3).toFixed(2)),
    candidateStemLocations: stemDirectories.slice(0, 100),
    allProductionAudioFiles: allAudioFiles.length,
    unmatchedWithOneSourceCandidate: unmatchedCandidateResults.filter((item) => item.candidates.length === 1).map((item) => item.title),
    unmatchedWithMultipleSourceCandidates: unmatchedCandidateResults.filter((item) => item.candidates.length > 1).map((item) => ({ title: item.title, candidates: item.candidates })),
    unmatchedWithNoSourceCandidate: unmatchedCandidateResults.filter((item) => item.candidates.length === 0).map((item) => item.title),
    multiWavDirectories,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
