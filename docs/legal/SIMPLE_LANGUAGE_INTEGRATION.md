# Simple-Language Legal Integration

Updated: 2026-08-08

## What Changed

The six newer DOCX files are stored in `docs/legal/source/simple-language/` as the preferred plain-language reference set. The existing PDF set remains available for comparison and legal history.

The booking checkout now shows a short summary tailored to the selected service path. It covers the main customer decision in one or two sentences and links to important parts of the generated agreement. The summary is not a replacement for the agreement and does not claim to be legal advice or an AI-generated legal opinion.

The full agreement still assembles from versioned modules. This preserves the protections already implemented for payment, cancellations, file retention, revisions, beat rights, loyalty programs, and electronic signatures while making the first read less intimidating.

The master agreement and booking/refund sections were also rewritten in simpler language. Customers will still see the full terms, but they now explain what applies to the order, what signing means, how deposits work, what happens with cancellation, and how file storage and beat licenses are handled without requiring the customer to interpret internal labels such as “Schedule A” or “module manifest.”

## Document-to-Feature Map

| New source | Current use |
| --- | --- |
| Services Agreement | Core agreement and Schedule A structure in `shared/contractGenerator.ts`. |
| Service Modules | Recording, release-ready, Quick Finish, mix/master, mastering, production, and media wording. |
| Short Forms & Add-Ons | Reference for future optional forms; portfolio requests are currently review-gated. |
| Privacy and E-Signature Terms | Electronic consent module and customer download/signing reminder. |
| Policies | Booking/refund and file-retention policy inputs. |
| Beat Licenses | Beat-rights snapshot and separate manual-review gates for higher-risk rights. |

## Still Needs a Decision Before Customer-Facing Automation

- Exact treatment of a timely cancellation deposit and the balance due date for each service.
- The event that starts the file-retention clock.
- Final storage, payment, e-signature, email, analytics, and messaging providers in the privacy terms.
- Advanced Mix/Master revision count and final scope rules.
- Rush fees, media kill fees, DSP/monetization limits, and beat usage caps.
- Publishing splits, producer royalties, sample clearance, and any work-for-hire or copyright transfer.
- Minor/guardian account and signature workflow.
- Final governing-law and venue language after lawyer review.

Until these are decided, the generator should continue to show only confirmed transaction terms and use manual review for exclusive rights, buyouts, media licenses, ownership transfers, guardian forms, split sheets, and sample disclosures.
