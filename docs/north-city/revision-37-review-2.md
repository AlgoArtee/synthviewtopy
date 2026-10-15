# Revision 37 — formal visual review 2

Reviewer: separate `market_visual_review` agent. Date: 2026-10-14.

**Score: 8.0/10. Accepted for the requested market addition.** This is formal round 2 of at most 3, following round 1 at 7.5/10. The score applies to visual and physical integration of the new small cyberpunk market stands at the intended balcony viewing scale. It is not a claim that the close-up assets are photorealistic replicas of the supplied references. The requirement in `src/apartments/AGENTS.md` is met; no further graded round is required.

## Findings

The ten stands remain appropriately scaled against people and surrounding shops, occupy both requested side areas and preserve the central plaza composition. The public balcony captures show recognizable merchandise clusters and neon signs rather than a wall of new buildings. Gaps between stands and the shop approaches remain visually clear. Day, night/rain and snow captures show coherent atmosphere and visibility.

The concrete round-1 findings have been addressed:

- **Structural variety:** the repair stall now reads as an open workbench/gantry with its sign on the front, the produce stall has a distinct canopy edge and timber crate frontage, the record stall has a different hood/sign profile and wooden storage, and the data stall exposes lower stock shelving. Food and fabric roof/sign treatments differ from the rigid tech displays. Some modular framing remains, but the repeated identical-box effect is reduced.
- **Functional surfaces and merchandise:** darker worktops reduce the large blank pale slabs. Price cards, segmented fronts, folded textiles, chips, tools, repair parts and small containers make the counters more usable and occupied. The repair bench in particular is materially and compositionally different from round 1.
- **Backdrop prominence:** reference imagery has been reduced to smaller framed panels, leaving actual structural walls, shelving and foreground objects to define the stalls. The photo/geometry mismatch is now subordinate to the physical display.
- **Fabric cloth:** the customer-facing sheet is clearly visible on the loom at the right of `detail-fabric.png`, along with the added folded stock. The existing foreground lamp still occludes part of this supplemental camera view, but it does not prevent assessment of the cloth correction.

No obvious floating merchandise, unsupported elevated trays, ground separation or blocking collision is visible in this set. The primary balcony views retain clear sightlines to the existing shop signs and the mall. I found no concrete blocker requiring another implementation iteration.

## Remaining limitations

The merchandise remains intentionally simplified: fruit and mushroom shapes, robot limbs, garments, fish graphics and luminous memory tubes do not reproduce the references' fine surface detail. Worktops and framing remain cleaner and more regular than the heavily weathered reference assets. Some photo panels remain visibly photographic when inspected close up. These limit the score to 8.0 rather than a higher realism rating, but do not prevent the requested small market stands from working coherently in this scene.

Night captures are dark away from neon and street lights, as is the surrounding district. The new lights and merchandise silhouettes remain discernible; this is not a new market-specific defect. The fruit boat reference is reasonably adapted to a ground stand. No new canal or boat is implied by this acceptance.

This review uses actual running-room captures. The six overview/weather shots are primary public-view evidence; the ten detail shots are supplemental QA camera positions within the same runtime scene and do not imply added street-level navigation. Animation and exhaustive collision correctness remain the responsibility of functional checks.

The implementation agent reports native 9/9 checks, bundled-client readiness with ten stands, and unchanged final source hashes. Those reports are separate from this visual score. The earlier `final-3` first-frame timeout was not treated as a visual result; this review examines only the successful `final-4` capture set.

## Exact inspected runtime screenshots

- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/north-market-day.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/south-market-day.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/whole-plaza-day.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/north-market-night-rain.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/south-market-night-rain.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/north-market-snow.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-noodles.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-cyberware.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-fish.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-myco.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-spice.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-fabric.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-memory.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-vinyl.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-fruit.png`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-37/final-4/detail-repair.png`

## Reference comparison

The same two user placement screenshots and all ten market design images explicitly inspected in [round 1](revision-37-review-1.md) were used for comparison. Their exact paths are preserved in that record. The revised captures were compared against the noodle counter, cyberware display, holo fish, mushroom, spice, textile, memory, vinyl, fruit and salvage references, and against the three round-1 correction categories. No unrelated historical city feature was regraded.

No product code was edited by the reviewer. Acceptance is based on this frozen screenshot set, with the limitations above retained.
