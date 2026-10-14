# Current snapshot archive — 2026-10-12

The previous 50 PNG pictures were deleted and replaced by 100 new native-resolution captures of the current revision 12 apartment. Application scene sources were unchanged during export.

- Folder: `Snapshots/North City/O's Apartment/`
- `Ultrawide/`: 50 PNG images at 5120 × 2160 (64:27).
- `Phone/`: 50 PNG images at 2160 × 3840 (9:16), independently framed rather than cropped from the ultrawides.
- 100 distinct camera positions and image hashes; 459,867,177 image bytes.
- Features include the full-wall window, 8.55 m square bed, oversized wall-fitted duvet, opposite-wall pillows, left-wall holographic TV, transparent floating chair, circular white rug, workstation, bathroom, kitchen, ceiling fixture, helix nightlight, animated city and both updated ghost faces.
- All six weather modes represented: clear, cloudy, rain, storm, snow and fog.
- `index.html` provides a responsive gallery; `manifest.json` records native dimensions, exact camera position/target/FOV, weather, simulation time, scene source hashes and every PNG SHA256.

Technical validation: every PNG dimension and SHA256 verified before and after publication, no browser capture errors, exactly 50 old root-level PNG files removed, exactly 100 new PNG files present, gallery lists 50 images per format, and all 100 image links return HTTP 200 with image/png content type. No upscaling or application geometry/material edits.

Independent /root/realism_reviewer archive QA:

> Snapshot archive QA: no publication blocker visible. Inspected all four contact sheets. The numbered sequence covers 001–100, with no missing, blank or fully obstructed thumbnail. Updated features are represented: full-wall window, oversized fitted duvet, unobstructed TV, and both realistic ghost portraits. Ultrawide views provide broad room coverage; phone compositions keep their main subjects readable. No severe geometry clipping is apparent. Partial furniture, screen and ceiling crops read as intentional detail framing. A few phone bedding views contain substantial plain ceiling or duvet area, but remain usable. This is contact-sheet QA only; native dimensions, hashes and pixel-level image quality were not independently checked. Revision 12’s existing 8.3/10 realism grade remains unchanged. No new formal scene grade was issued.

Evidence: `output/playwright/snapshot-100-validation.json`, `snapshot-gallery-validation.json`, the four `snapshot-*-contact-*.jpg` sheets and the final archive manifest. Exporter: `scripts/capture-os-apartment-snapshots.mjs`. Verified publication/deletion: `scripts/publish-os-apartment-snapshots.ps1`. Gallery check: `scripts/verify-os-apartment-snapshots-gallery.mjs`.
