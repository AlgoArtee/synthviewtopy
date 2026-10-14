# Revision 7 realism review record

## Formal round 1 of at most 3 — 8.2/10, accepted

Independent reviewer `/root/realism_reviewer` inspected final actual 1920 × 1080 runtime duvet, bed-wide, pillows and panorama views in `test-artifacts/north-city/revision-7/final-pass-1-contact/`. Full direct report: `revision-7-review-1.md`. Construction 1.90/2, lighting 1.55/2, materials 1.45/2, fidelity 2.00/2.5, composition 1.30/1.5. Two rounds remain unused.

The four upright pillows are on the east wall opposite the west TV. Two low relaxed pillows leave the central city window clear. The 7.47 × 7.55 m white duvet is a separate closed filled layer with an asymmetric thick turnback and sewn perimeter. Ungraded implementation preflights reduced excessive sheet gathers, refined the duvet silhouette/turnback and evaluated pillow contact with both blanket body and folded edge. A final exact-vertex bounds correction brought the four upright pillows to within 4 mm of the wall. The review resumed after a stalled brief-file read; no grade was issued before that interruption. Earlier revision-7 folders remain ungraded.

Limits: the broad duvet centre remains smooth and evenly lit; the long turnback is regular with a dark seam; pillow stuffing remains simplified; city detail remains procedural. This was a focused bedding realism review, not a fresh independent whole-scene or motion review.

## Technical validation

Production build passed. Root captured all 25 runtime viewpoints, duvet under clear/rain/snow, and 390 px mobile fit without browser errors. Deliberate bed climb, full-bed walking, wall/window boundaries and step-down passed. The exact mesh audit reports finite geometry, six pillows contained within the alcove, four at the east wall, a closed manifold duvet with 0.02199996 m minimum and 0.20018334 m mean thickness, 1,533,402 unique triangles under the 1,650,000 target, and 1,874,624 instance-expanded triangles. Reduced-motion city freeze, weather selection and panel collapse passed. The final floor plan is from the actual meshes.

Evidence: `revision-7/final-pass-1-contact/bedding-results.json`, `evidence-manifest.json`, `revision-7/validation-contact/audit.json`, `floor-plan.png`. Final source binding: `revision-7-source-hashes.json`. The only source change after capture corrected an internal mesh label; geometry, materials and cameras were unchanged. The fifty native 4K images in the user Snapshots archive remain their original capture version. No deployment, paid services or source commit was performed.
