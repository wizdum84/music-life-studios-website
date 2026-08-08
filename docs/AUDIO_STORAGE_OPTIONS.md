# Audio Storage Options

Updated August 7, 2026.

## Recommendation

Use **Cloudflare R2** for artist uploads, WAVs, stems, beats, and project files when real file uploads are added.

R2 is the best fit when files may be downloaded repeatedly because it has no internet egress charge. The application should store the audio in R2 and keep only the secure object URL, owner, booking/project reference, file type, and retention date in the database.

## Current Comparison

| Service | Storage | Download cost | Notes |
| --- | ---: | ---: | --- |
| Cloudflare R2 | $0.015/GB-month | Free egress | 10 GB storage and request allowances each month; best for repeated downloads. |
| Backblaze B2 | $0.00695/GB-month | Free up to 3x average stored data, then $0.01/GB | Cheapest storage when downloads are light. |
| Google Cloud Storage | About $0.02/GB-month in a U.S. Standard region | General internet transfer can be about $0.12/GB | Familiar with the current project, but less predictable for large downloads. |

## Example

With 100 GB stored and 1 TB downloaded in one month:

- Cloudflare R2: about $1.35 plus small request charges.
- Backblaze B2: roughly $7.60 after its free-egress allowance.
- Google Cloud Storage: potentially over $100 in transfer charges, depending on destination and free-tier eligibility.

## Implementation Notes

- Do not store large audio files in PostgreSQL.
- Do not rely on the application server's local disk for permanent uploads.
- Use private buckets and short-lived signed download URLs.
- Restrict file types and upload size before accepting the upload.
- Link every file to the user, booking, or project that owns it.
- Apply the account retention rules: guest 30 days, Music Lifer 90 days, Passport at least 90 days at launch.
- Add lifecycle deletion only after confirming the retention trigger and legal requirements.

The current booking form captures selected filenames and pasted links only. Actual binary upload storage remains a future implementation step.

## Official Pricing

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Backblaze B2 pricing](https://www.backblaze.com/cloud-storage/pricing)
- [Google Cloud Storage pricing](https://cloud.google.com/storage/pricing)
