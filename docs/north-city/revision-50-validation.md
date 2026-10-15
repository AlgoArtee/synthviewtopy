# Revision 50 — Nocturne desk radio

User request: add a small futuristic radio beside the PC desk, with different Halloween sounds and music available when selected.

## Implementation

- Pearl/graphite stereo, 0.78 × 0.275 × 0.255 m, on a matching side stand at `(1.91, 0, 5.68)`. Twin cyan speaker rings, instanced perforated grilles, antenna, physical controls and a live display. Stand collision bounds keep walking clear of the prop. Existing desk and pumpkin retain their positions.
- Click/tap the stereo to open its modal chooser. Dragging or pinching does not select it. Opaque interior geometry occludes selection. A keyboard-accessible **Desk radio** shortcut and room-guide viewpoint are also available.
- Five original locally synthesized loops: **Midnight Circuit**, **Clockwork Haunt**, **Ghost Signal**, **Whispers in the Wires**, **Pumpkin Reactor**. Three musical programs and two ambient soundscapes, with distinct instrumentation and phrasing.
- Play/Stop, live switching, volume, saved program/volume, no autoplay, tab-hide stop/suspend and disposal. Bounded two-program cache. No audio downloads, licenses or external services are required.
- Radio state is included in `render_game_to_text`. Equalizer animation honors reduced motion; controls use a native modal dialog and restore focus to the room.

## Validation

- `npm run build`: passed; final room bundle `room-DvP-XsMu.js`.
- Five rendered stereo waveforms have distinct zero-crossing counts, RMS 0.077–0.119, peaks ≤0.8 and zero endpoint discontinuity. The source phrases last 20, 24 or 32 seconds.
- Actual IAB inspection caught cyan rings embedded in the rubber surround; moved them forward and verified their visibility. Radio and stand are clear of the desk pumpkin and refrigerator. Click selection and complete chooser inspected in the running room.
- Full browser report and captures: `test-artifacts/north-city/revision-50/native/`.
- Installed web-game action client: `test-artifacts/north-city/revision-50/bundled/`. Uses the existing Edge adapter from revision 49 to avoid the client's forced SwiftShader renderer.
- The initial full-room run was interrupted by the visual correction's hot reload; its eight audio checks passed and its original report is preserved as `initial-interrupted-results.json`. The next run captured the corrected model but exposed a test-only camera-instrumentation mismatch with Vite's transformed quote style (`camera-instrumentation-results.json`). The harness now clicks the actual canvas at the dedicated radio viewpoint, without depending on a private camera. Final rerun status is recorded below.

This small prop and interaction addition does not substantially rebuild the apartment; no new graded whole-scene realism round was invoked.

## Final result

`node scripts/north-city-radio-check.mjs` passes all **23 checks** with **zero browser errors**. It verifies actual canvas selection, no autoplay, five playing programs, live switching, zero-volume silence, Stop, Escape with continuing music, focus restoration, drag protection, keyboard isolation and a 390 × 844 mobile dialog. Audio checks additionally cover persistence, rapid-switch cancellation, visibility suspension and context disposal.

Final desktop, mobile, workstation, close-up and playing-display screenshots were inspected. The installed action client also passes with `ready=true`, expected walking state and no error artifact. `git diff --check` passes. The user preview is left at the radio with its chooser open and playback off. No outstanding requested work.
