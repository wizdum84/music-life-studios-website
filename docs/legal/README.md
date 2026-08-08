# Music Life Studios Legal Reference Library

These files are source materials supplied for the contract-generator build. The PDFs in `source/` are the earlier reference set. The DOCX files in `source/simple-language/` are the newer short-form set intended to make the client flow easier to read. Neither set is automatically a customer-facing contract by itself. The generator should assemble only the modules relevant to a transaction, preserve their versions, and require manual review for ownership transfers, exclusive rights, media licenses, buyouts, and other high-risk terms.

## Document Map

- `Contract Generator Assembly Map.pdf`: assembly rules, module triggers, versioning, license history, and manual-review gates.
- `Music Life Studios Services Agreement.pdf`: master agreement and core account, payment, retention, loyalty, and rights provisions.
- `Music Lifer and Passport Loyalty Schedule.pdf`: free Music Lifer stamps, Passport benefits, rollover, pause, and reward cycles.
- `Service Module Library.pdf`: recording, release-ready, mixing, mastering, production, media, exclusive, and buyout service modules.
- `Music Life Studios Booking and Refund Policies.pdf`: deposit, cancellation, rescheduling, no-show, refund, and Schedule A fields.
- `Commercial Beat License Module.pdf`: nonexclusive commercial lease and exclusive-sale rider.
- `Starter Reward Beat License.pdf`: narrower reward beat license and commercial-upgrade rules.
- `Music Life Studios Rights & Add-On Library.pdf`: portfolio release, guardian consent, split sheet, sample disclosure, and delivery add-ons.
- `Music Life Studios Policies.pdf`: privacy, security, file retention, license-history, and electronic-record policy material.
- `Music Life Studios Launch Checklist.pdf`: resolved launch rules and business/legal decisions that remain open.

### New short-form source set

- `source/simple-language/Music Life Studios Services Agreement.docx`: shorter master agreement and Schedule A order summary.
- `source/simple-language/Music Life Studios Service Modules.docx`: concise recording, mixing, mastering, production, and media modules.
- `source/simple-language/Music Life Studios Short Forms & Add-Ons.docx`: optional portfolio, guardian, split-sheet, sample-disclosure, and delivery add-ons.
- `source/simple-language/Music Life Studios Privacy and E-Signature Terms.docx`: shorter privacy and electronic-signature terms.
- `source/simple-language/Music Life Studios Policies.docx`: concise booking, refund, file, and website policies.
- `source/simple-language/Music Life Studios Beat Licenses.docx`: starter reward, commercial lease, exclusive, and buyout license language.

## Current Integration

The application now uses the master, service, loyalty, booking/refund, and electronic-consent materials to assemble generated booking and Passport agreements through `shared/contractGenerator.ts` (library version `2026-08-08.1`). Booking previews recalculate the server-side price, create a transaction-specific agreement, and include the selected service module, Schedule A, booking/refund policy, account program terms, and electronic-signature consent. Passport enrollment uses the selected catalog tier and term in the same assembly path.

At checkout, the customer also sees a short service-specific plain-language summary with links to payment, deliverables, cancellation, rights, and e-signature sections. It is a convenience summary only; the full generated agreement controls. It is generated from the selected service path and does not call an external AI service, which keeps checkout predictable and avoids sending customer information to another provider.

The signed record stores the selected module manifest, agreement content, contract version, timestamp, and SHA-256 document hash. The generated agreement is the transaction record; these PDFs remain the legal reference library and are not served as a single catch-all contract.

Production bookings now require an explicit beat-rights choice and carry the selected rights snapshot into the generated agreement. Exclusive rights and portfolio-use requests are review-gated. Add-on, split-sheet, sample-disclosure, guardian-consent, and formal portfolio-release modules still need dedicated checkout fields and separate assent before they can be added to a signable agreement.

## Do Not Auto-Finalize

Media composition licenses, exclusive beat licenses, copyright assignments, work-made-for-hire language, unusual publishing or royalty terms, custom synchronization rights, and ownership overrides require admin/legal review and separate assent.

## Open Decisions

Before public launch, finalize timely-deposit treatment, remaining-balance timing by service, the retention trigger, advanced/master-only revision counts, rush fees, media kill fees, beat usage caps, DSP and monetization limits, publishing splits, producer royalties, and sample-clearance responsibility.
