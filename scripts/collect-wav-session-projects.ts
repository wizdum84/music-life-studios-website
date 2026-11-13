import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const productionRoot = "E:\\Production";
const manifestPath = "E:\\Production\\Music Life Deliverables\\delivery-manifest.json";
const outputRoot = "E:\\Production\\These Need WAVs";
const shouldCopy = process.argv.includes("--copy");

type BeatManifest = { id: number; title: string; masterKind: string | null; masterSource: string | null };
type ProjectCandidate = { file: string; modifiedMs: number };

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b\d{2,3}\s*bpm\b/gi, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function safeName(value: string) {
  return value.replace(/[<>:"/\\|?*]/g, "_").trim().replace(/[. ]+$/g, "") || "untitled";
}

async function findProjects(directory: string, results: ProjectCandidate[] = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (/^(backup|these need wavs|music life deliverables)$/i.test(entry.name)) continue;
      await findProjects(fullPath, results);
    } else if (/\.(flp|als)$/i.test(entry.name) && !/(autosaved|overwritten)/i.test(entry.name)) {
      const info = await stat(fullPath);
      results.push({ file: fullPath, modifiedMs: info.mtimeMs });
    }
  }
  return results;
}

const manifest = JSON.parse(await (await import("node:fs/promises")).readFile(manifestPath, "utf8")) as BeatManifest[];
const beats = manifest.filter((beat) => beat.masterKind === "mp3");
if (beats.length !== 95) throw new Error(`Expected 95 MP3-only beats, found ${beats.length}`);
const projects = await findProjects(productionRoot);

const report = beats.map((beat) => {
  const key = normalize(beat.title);
  const masterKey = beat.masterSource ? normalize(path.basename(beat.masterSource)) : key;
  const exact = projects.filter((candidate) => normalize(path.basename(candidate.file)) === key);
  const masterMatches = projects.filter((candidate) => normalize(path.basename(candidate.file)) === masterKey);
  const directoryMatches = projects.filter((candidate) =>
    candidate.file.split(path.sep).some((segment) => normalize(segment) === key),
  );
  const candidates = [...new Map([...masterMatches, ...exact, ...directoryMatches].map((item) => [item.file.toLowerCase(), item])).values()]
    .sort((a, b) => {
      const aMaster = normalize(path.basename(a.file)) === masterKey ? 1 : 0;
      const bMaster = normalize(path.basename(b.file)) === masterKey ? 1 : 0;
      const aExact = normalize(path.basename(a.file)) === key ? 1 : 0;
      const bExact = normalize(path.basename(b.file)) === key ? 1 : 0;
      return bMaster - aMaster || bExact - aExact || b.modifiedMs - a.modifiedMs;
    });
  return { id: beat.id, title: beat.title, selected: candidates[0]?.file || null, candidates: candidates.map((item) => item.file) };
});

if (shouldCopy) {
  await mkdir(outputRoot, { recursive: true });
  for (const beat of report) {
    if (!beat.selected) continue;
    const folder = path.join(outputRoot, safeName(beat.title));
    await mkdir(folder, { recursive: true });
    await copyFile(beat.selected, path.join(folder, path.basename(beat.selected)));
  }
  await writeFile(path.join(outputRoot, "session-match-report.json"), JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({
  beats: report.length,
  matched: report.filter((beat) => beat.selected).length,
  missing: report.filter((beat) => !beat.selected).map((beat) => beat.title),
  ambiguous: report.filter((beat) => beat.candidates.length > 1).map((beat) => ({ title: beat.title, candidates: beat.candidates.length })),
  outputRoot: shouldCopy ? outputRoot : null,
}, null, 2));
