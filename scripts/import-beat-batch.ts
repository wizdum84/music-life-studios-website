import "dotenv/config";
import { storage } from "../server/storage";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";

type BeatImport = {
  title: string;
  slug: string;
  genre: string;
  bpm: number;
  description: string;
  mood: string;
  source: string;
  cover: string;
};

const previewRoot = "client/public/assets/beats/previews";

const imports: BeatImport[] = [
  { title: "F2", slug: "f2", genre: "Trap / Drill", bpm: 100, description: "A tight, modern rhythm bed with weight, bounce, and clean space for verses.", mood: "focused, heavy, modern", source: "E:/Production/f2 100 bpm.wav", cover: "client/public/assets/beats/covers/f2-v4.png" },
  { title: "Murfo", slug: "murfo", genre: "Hip-Hop", bpm: 122, description: "A character-filled groove with bounce, texture, and a strong hook-ready pulse.", mood: "bouncy, colorful, character-filled", source: "E:/Production/r&b work/2fo1/3AM/exported beats by category/MURFO.wav", cover: "client/public/assets/beats/covers/murfo-v4.png" },
  { title: "Rico", slug: "rico", genre: "Hip-Hop", bpm: 120, description: "A confident, spacious cut with a direct groove and room for personality.", mood: "confident, direct, spacious", source: "E:/Production/r&b work/rico/rico.mp3", cover: "client/public/assets/beats/covers/rico-v4.png" },
  { title: "Roll", slug: "roll", genre: "Trap / Drill", bpm: 166, description: "A kinetic, forward-moving beat with sharp rhythm and neon energy.", mood: "kinetic, bright, forward", source: "E:/Production/ROLL 166 BPM.mp3", cover: "client/public/assets/beats/covers/roll-v4.png" },
  { title: "Scoundrel", slug: "scoundrel", genre: "Hip-Hop", bpm: 176, description: "A dark, stylish groove with swagger and a cinematic edge.", mood: "dark, stylish, cinematic", source: "E:/Production/scoundrel 176.mp3", cover: "client/public/assets/beats/covers/scoundrel-v4.png" },
  { title: "Smile", slug: "smile", genre: "R&B / Soul", bpm: 148, description: "A darker, expressive record starter with a bittersweet pulse and room for a reflective vocal.", mood: "somber, bittersweet, reflective", source: "E:/Production/smile148  BPM.mp3", cover: "client/public/assets/beats/covers/smile-v5.png" },
  { title: "Suda", slug: "suda", genre: "R&B / Soul", bpm: 126, description: "A dreamy, fluid groove for a melodic vocal and an immersive finish.", mood: "dreamy, fluid, immersive", source: "E:/Production/r&b work/2fo1/3AM/exported beats by category/suda.mp3", cover: "client/public/assets/beats/covers/suda-v4.png" },
  { title: "Sumner", slug: "sumner", genre: "R&B / Soul", bpm: 120, description: "A warm, open instrumental with an easy pocket and sunset atmosphere.", mood: "warm, open, sunset", source: "E:/Production/r&b work/2fo1/3AM/exported beats by category/bouned beats/sumner.mp3", cover: "client/public/assets/beats/covers/sumner-v4.png" },
  { title: "Trude", slug: "trude", genre: "Experimental", bpm: 72, description: "A slow, unusual pocket with space for left-field writing and sound design.", mood: "slow, unusual, spacious", source: "E:/Production/trude 72.mp3", cover: "client/public/assets/beats/covers/trude-v4.png" },
  { title: "Weez", slug: "weez", genre: "Trap / Drill", bpm: 168, description: "A fast, polished cut with driving drums and a bright night-time feel.", mood: "driving, polished, nocturnal", source: "E:/Production/weez 168 bpm.wav", cover: "client/public/assets/beats/covers/weez-v4.png" },
  { title: "Wetty", slug: "wetty", genre: "Trap / Drill", bpm: 195, description: "A high-speed, energetic beat with a glossy edge and strong release momentum.", mood: "high-speed, glossy, energetic", source: "E:/Production/WETTY 195 bpm.wav", cover: "client/public/assets/beats/covers/wetty-v4.png" },
  { title: "Win", slug: "win", genre: "Hip-Hop", bpm: 140, description: "A triumphant, release-ready cut built to make the hook feel bigger.", mood: "triumphant, bold, release-ready", source: "E:/Production/r&b work/2fo1/3AM/exported beats by category/bouned beats/WIN.mp3", cover: "client/public/assets/beats/covers/win-v4.png" },
];

function createPreview(source: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error("ffmpeg-static is unavailable"));
    const process = spawn(ffmpegPath, [
      "-y", "-hide_banner", "-loglevel", "error", "-i", source,
      "-t", "45", "-vn", "-codec:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2", output,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    process.stderr.on("data", (chunk) => { error += String(chunk); });
    process.on("error", reject);
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(error || `ffmpeg exited with code ${code}`)));
  });
}

function nextCatalogNumber(existing: any[]) {
  const max = existing.reduce((highest, beat) => {
    const match = typeof beat.catalogNumber === "string" ? beat.catalogNumber.match(/^MLS-(\d+)$/i) : null;
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return max + 1;
}

async function main() {
  const existing = await storage.getAllBeats();
  const existingTitles = new Set(existing.map((beat) => beat.title.trim().toLowerCase()));
  let catalogNumber = nextCatalogNumber(existing);

  for (const item of imports) {
    const previewUrl = `/assets/beats/previews/${item.slug}-preview.mp3`;
    if (!existingTitles.has(item.title.toLowerCase())) {
      await createPreview(item.source, `${previewRoot}/${item.slug}-preview.mp3`);
      const record = await storage.createBeat({
        title: item.title,
        genre: item.genre,
        description: item.description,
        previewUrl,
        fullAudioUrl: previewUrl,
        imageUrl: item.cover.replaceAll("\\", "/").replace(/^client\/public/, ""),
        bpm: item.bpm,
        price: 2999,
        licensingOptions: {
          basic: { price: 2999, description: "MP3 lease for one release" },
          premium: { price: 6999, description: "WAV and MP3 lease with broader release rights" },
          exclusive: { price: 19999, description: "Exclusive rights package" },
        },
        tags: ["tracked-out", "stem-ready", "catalog"],
        featured: false,
        availabilityStatus: "available_nonexclusive",
        starterRewardEligible: true,
        commercialLeaseEligible: true,
        contentIdRestricted: true,
        licenseVersion: 1,
        catalogNumber: `MLS-${String(catalogNumber).padStart(3, "0")}`,
        producerName: "Wiz",
        durationSeconds: undefined,
        metadata: { mood: item.mood, energy: "medium", notes: "Source bounce and tracked-out stems verified on the production drive." },
      } as any);
      console.log(`${record.catalogNumber}: ${record.title}`);
      catalogNumber += 1;
    } else {
      console.log(`Skipped existing beat: ${item.title}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
