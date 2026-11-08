# Beat Library Setup

Updated: 2026-09-13

## Public Beat Page

The customer-facing `/beats` page now has its own darker, simpler identity:

- a record-shelf style header;
- search and simple genre buttons;
- featured sounds separated from the full catalog;
- larger listening cards with a minimal orange waveform treatment when no cover art is set;
- the existing license agreement flow remains available from each beat.

## Admin Beat Library

Open **Admin > Content Manager > Beat Marketplace**. Each record can now hold:

- beat title, genre, BPM, key, and duration;
- catalog number, such as `MLS-001`;
- ISRC code;
- producer name;
- mood or descriptive tags;
- private catalog notes for splits, samples, clearance, and release planning;
- preview/full-audio URLs, cover art, price, licensing, and availability.

The library can search by title, catalog number, ISRC, or producer. Edit and Delete now call the protected server routes instead of being visual placeholders.

Public beat responses intentionally omit private catalog notes, ISRC/catalog fields, contract URLs, and full-audio delivery URLs. Those remain available to the authenticated admin library only.

## ISRC Note

An ISRC identifies a specific sound recording. An unreleased instrumental can use a Music Life catalog number first; assign the ISRC when the finished recording is registered. Keep the ISRC on the final recording record even if the underlying beat has multiple licenses.

## Storage Boundary

The catalog metadata is stored in Postgres. The production exports are bundled as 45-second MP3 previews under `client/public/assets/beats/previews/` and are live in the public catalog. The three portfolio examples are bundled as 90-second MP3 previews under `client/public/assets/portfolio/`.

The source WAVs remain on the E: drive. These bundled files are previews only; full-resolution masters and paid beat delivery still need the storage provider decision documented elsewhere. Public beat responses omit full-audio delivery URLs and private catalog fields.

## Current Import

Current public catalog: 86 beats. The original 10 and the September 12 batches remain available, including the active stem-ready batches listed below.

The September 12 import added 20 full bounced previews: Conn, Crash, Crisp, Cyb, Davey, Fahge, Fever, Ifin, Level, Lude, Ority, Quick Time, Rem, Ser, Shoopy, Smooth, Soother, Tilted, Tragedt, and Venice. Each has a local 45-second MP3 preview, its own generated Music Life cover artwork, a catalog number, BPM, producer metadata, and the standard Basic/Premium/Exclusive license options.

The second September 12 import added 20 additional beats that were not identified in the Pro Tools song crossmatch: Cleus, Clocain, Commision, Cradle, Cur, Dangle, Dupe, Eras 2, EB, Fews, Fied, Fition, Getup, Grizelda Type, Gut, Hozon, Maybe, Mystic, Nator, and Nightmarre. Each has a distinct generated cover, a local 45-second MP3 preview, a catalog number from MLS-031 through MLS-050, and the standard license options. Source bounces remain on the E: drive.

The third September 12 import added 17 stem-ready beats. The active portion is F2, Murfo, Rico, Roll, Scoundrel, Smile, Suda, Sumner, Trude, Weez, Wetty, and Win. Each has a distinct generated cover, a local 45-second MP3 preview, a catalog number from the MLS-051 through MLS-067 range, and the standard license options. Their source bounces and tracked-out stems remain on the E: drive. Five records were intentionally removed after import because they are tied to existing songs or came from the custom-beat source folder: Blu 2 (MLS-051), Cyclone 2 (MLS-052), Everytime (MLS-053), Micor (MLS-055), and Prom (MLS-057). Their public preview and cover assets were removed from the project bundle; source files remain on the production drive.

The latest tracked-out import added six more beats: BRUNT (MLS-068), WOODS 2 (MLS-069), FELL IN LOVE (MLS-070), JUST BE YOU (MLS-071), SAVE US (MLS-072), and LOCK (MLS-073). Each has a distinct generated cover and a local 45-second MP3 preview made from its bounce file. Their tracked-out stems were verified in `E:\Production\tracked out beats`, and the source bounces remain on the E: drive.

The next tracked-out import added two more beats: 64 (MLS-074) and LED (MLS-075). Each has a distinct generated cover and a local 45-second MP3 preview made from its matching bounce file. Their tracked-out stems were verified on the production drive.

The following tracked-out import added HEFT (MLS-076) and BRASSY (MLS-077). Each has a distinct generated cover and a local 45-second MP3 preview made from its available bounce file. Their tracked-out stems were verified on the production drive. Jumo remains pending while its bounce is being replaced.

The next tracked-out import added JUMO (MLS-078) and BACK UP (MLS-079). Jumo uses the replacement bounce at 148.5 BPM and is displayed as 149 BPM because the catalog field stores whole numbers. Back Up uses its matching bounce and seven verified tracked-out stems. Both have local 45-second MP3 previews; Back Up uses the selected generated cover artwork.

The next tracked-out import added RECOVERY (MLS-080), NEWHEAT (MLS-081), MI AMORE (MLS-082), MASE (MLS-083), HEY (MLS-084), ELE2 (MLS-085), DAY DAY (MLS-086), and NOT OURS (MLS-087). Each has verified tracked-out stems, a local 45-second MP3 preview, and catalog artwork. Not Ours is the title of the beat, not an exclusion.

The latest tracked-out import added SLIDEY (MLS-088), SERVOCITY (MLS-089), SCRAPER (MLS-090), SHOE IN (MLS-091), and OOPS (MLS-092). Each has verified tracked-out stems, a local 45-second MP3 preview, distinct cover artwork, BPM metadata, and the standard license options.

Genre/category labels on this second batch are a provisional first pass informed by the available BPM and production naming. Entries without a BPM in the source filename are tagged `bpm-unverified` and use a neutral placeholder BPM until the audio is reviewed by ear. These labels should be treated as editable catalog metadata, not definitive genre claims.

All 86 catalog entries now have a first-pass category: `R&B / Soul`, `Hip-Hop`, `Trap / Drill`, or `Experimental`/`Experimental / Club`. The site genre filter reads these values. A later listening pass can refine individual records without changing the catalog structure.

Intentionally held back from this batch: Nupine, Yes U Did, Zeta, Let You Go, Softly, and 2 for 1. Confirmed song-linked beat roots from the Pro Tools review were also held back, including 307, Anniversary, Cyclone 2, Espo, Everytime, Freakin, Hundred Miles, Micor, Ohh Sample, Physical, Poppy Seed, Prom, Rico, Secret, Snowfall, Dungeon, Lunchbreak, Pey, Siri, and Sweet.

Portfolio examples: MUTT, Where the Hoes, and We Don't Care Remix.
