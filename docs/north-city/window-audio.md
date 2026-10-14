# O's City Apartment: window city ambience

Added 2026-10-12. This is an audio and interface feature on the accepted revision-13 scene; it does not change room geometry or materials or create another visual realism grade.

## Listening

Use **Left city window** below the weather selector. Fully opening the sash admits the city sound; Kippöffnung admits a quieter, low-pass-filtered version. Closing the actual animated sash smoothly fades the sound out. Loudness follows the opening and distance from the window; stereo direction follows the listener's orientation. The audio keeps working when apartment controls are collapsed with H or the North City chevron.

**City sound: On/Off** and **City ambience volume** sit below the window selector. Mute and volume persist locally; default volume is 55%. Audio is loaded only after an opening or sound-control gesture. A Play control appears if browser autoplay rules require another gesture; a failed asset fetch offers Retry. There is no audio while the window is closed, the volume is zero, sound is muted or the page is hidden. Hidden pages and completed fades suspend the audio context; leaving the apartment disposes it. Reduced motion still permits sound and immediately applies the window state.

## Source and license

[Cyberpunk rain ambience (rain and city noises stem)](https://freesound.org/people/Rmshh/sounds/743999/) by **Rmshh**, licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Downloaded the publicly offered HQ MP3 preview on 2026-10-12 and stored it locally at `public/audio/north-city/cyberpunk-city-ambience.mp3` (2,761,683 bytes). The app does not stream from or depend on the source website at runtime. Source URL, license, checksum and adaptations are recorded in `public/audio/north-city/source.json` and `ATTRIBUTION.md`; visible attribution is beside the controls.

The source is quiet (ffmpeg mean -37.4 dB, peak -22.5 dB). Runtime RMS/peak normalization gives usable background level with headroom, then applies a two-second equal-power overlap, gain fades, distance attenuation, low-pass filtering and stereo panning. Decoded normalized loop is about 120.88 seconds. Full opening uses a 7,600 Hz cutoff; full tilt uses 2,100 Hz and 34% of the opening gain, before distance and volume. This is a general cyberpunk rain/city ambience; weather presets do not select different audio recordings.

## Verification

`scripts/north-city-audio-smoke.mjs` exercises the actual running room with Chrome and trusted keyboard/pointer opening gestures, without an autoplay-policy bypass. It checks deferred loading, audible nonzero post-master signal when fully open and tilted, the 0.34 tilt/open gain ratio, filter difference, mute/unmute, saved 27% volume after reload, H collapse, closing to zero and context suspension, visibility pause/resume and disposal. Desktop and 390 x 844 phone captures fit without horizontal overflow. Asset SHA256 matches the source record.

Measured normalized loop peak is 0.6093 and the largest loop boundary sample step is 0.00504, retaining crossfade headroom. These are signal and continuity checks, not a claim of subjective audio audition or a new photographic scene score. Results and controls captures: `test-artifacts/north-city/audio-window/`. The existing visual review and snapshot archive remain historical records of their documented revisions.

The focused retry check (`scripts/north-city-audio-retry-smoke.mjs`) deliberately returns HTTP 503 on the first audio fetch, verifies the Retry control, then recovers actual playback on the second request with reduced motion enabled and no page errors. `npm run build` passes; the packaged audio bytes match the source hash.
