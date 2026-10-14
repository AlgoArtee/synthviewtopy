# Revision 6 realism review record

Latest user direction supersedes the earlier arched-window and pillow-border reference. Actual production-room captures: `test-artifacts/north-city/revision-6/pass-1/`, 1920 × 1080. Floor plan comes from the actual meshes. The existing fifty-picture user Snapshots archive is preserved.

## Formal round 1 of at most 3 — 8.2/10, accepted

Independent reviewer: `/root/realism_reviewer`. Construction 1.90/2; lighting 1.55/2; materials 1.50/2; fidelity 2.00/2.5; composition 1.25/1.5. Detailed verdict: `revision-6-review-1.md`.

The reviewer inspected panorama, television, pillows, bed-wide, sleep, on-bed, city-detail, clear/rain/storm/snow/fog, all three ceiling views, north-west corner, bathroom, study, lounge and motion frames 1/3/6. Coherent full-wall glazing has no exposed city edges in these inspected views. The left TV reads as a thin luminous display with an emitter rail. Six larger pillows have clearer creases and varied silhouettes. The previous ceiling cutoff remains fixed. Sampled frames show traffic and gown changes; direct video playback was not claimed.

Remaining limits: broad smooth pillow faces with shallow compression; broad overly smooth duvet; a small dark cloth notch near the left pillow group; prominent centre mullion in the close city view; procedural TV content, scanlines, repeated city motifs and reflection streaks. These findings are preserved without presenting the scene as photographic equivalence. Two graded rounds remain unused; no further graded review is needed after acceptance.

## Validation

Build, 24 runtime viewpoints, six weather states, mobile controls, full-bed traversal, three boundaries, window stop and step-down passed. Geometry audit found 1,417,296 unique triangles (below the 1,650,000 target), 1,758,518 instance-expanded triangles, no non-finite attributes, four panes, six pillows inside the alcove and six additional lateral blocks. The TV faces inward; its two brackets meet the west wall within 5 mm. Both city and TV obey reduced motion. No browser errors. Evidence: `revision-6/validation/audit.json`, `television.json`, `revision-6/preflight/results.json` and `pass-1/hologram-results.json`.
