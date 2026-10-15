# Revision 45 — bed TV programming

The existing bed TV now has five channels: North City News, Aurora Ocean, Orbital Drift, Bioluminescence and Neon After Hours. The news channel contains four authored fictional district reports, matching animated graphics, a rotating studio globe and scrolling ticker. It is not a real news feed.

The Bed TV panel provides channel selection, pause/play, next story and optional channel changes every minute. Channel/playback choices persist in this browser. Reduced motion freezes animation and automatic changes while preserving manual channel/story selection. All programming is generated locally; no video downloads or external news requests are required.

Validation:

- Final `npm run build` passed; only the existing bundle-size advisory. Log: `test-artifacts/north-city/revision-45/build.log`.
- Original installed develop-web-game client passed; startup screenshot and ready-state output inspected. Evidence: `test-artifacts/north-city/revision-45/bundled-client/`.
- `node scripts/north-city-tv-programming-check.mjs` passed all 21 checks in the actual apartment, including pause/play, all channels, manual and timed news changes, animated texture updates, automatic channel wraparound, reduced motion, browser reload persistence and phone layout. No browser/WebGL errors. Results: `test-artifacts/north-city/revision-45/native/results.json`.
- Actual in-app news, orbital, jellyfish and neon city screenshots inspected; native aurora/news and phone screenshots also inspected. Final news view: `test-artifacts/north-city/revision-45/live-news.jpg`.
- `git diff --check` passed. No scene geometry or navigation changes; this TV content update does not require a new apartment realism review.

No requested work remains. Changes are local and uncommitted.
