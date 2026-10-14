# O's City Apartment: weather and sound library

Added 2026-10-12. The apartment offers all eight island weather IDs plus its existing overcast and snow modes. The four Dark Academia labels come directly from `ACADEMIC_WEATHER_PRESETS`; the original city architecture is retained.

| Weather | Built-in choices | Sound character |
|---|---:|---|
| Clear | 10 | Dry city, distant traffic, residential mornings and parks |
| Overcast | 10 | Urban breeze, wind between buildings, traffic and leaves |
| Rain | 11 | Light rain, wet traffic and city windows; original heavy cyberpunk rain is an extra |
| Storm | 10 | Thunder, rainstorms, wind gusts and passing traffic |
| Snow | 10 | Winter city air, quiet stations, bare trees, snow wind and thaw |
| Fog | 10 | Quiet distant city and night traffic |
| Late-autumn after rain | 10 | Autumn wind, dry leaves, residential courtyards and residual drain water |
| Overcast afternoon | 10 | Urban wind and overcast city ambience |
| Rainy dusk | 10 | Rainy streets and wet traffic |
| Foggy night | 10 | Quiet night city, rooftop hum and distant traffic |

There are **70 distinct source recordings and 101 weather-list entries**, totaling 92,602,027 packaged audio bytes. Compatible modes share appropriate recordings. Each individual weather list contains at least ten different recordings; these are not ten pitch changes of one file. Fog has no intrinsic sound, so its choices use subdued city recordings. Winter and autumn include suitable wind/leaf field recordings as well as urban ambience.

## Controls and playback

Choose **Weather outside**, then **Sound for this weather** below **Left city window**. Each weather remembers its selected track in local storage. Switching weather restores that weather's selection and smoothly transitions the recording. The original heavy cyberpunk rain is an optional extra under Rain; dry modes do not use it by default.

The actual tilt/turn opening, listener distance, stereo direction, mute and saved volume still control admission of the sound. Full opening is fuller; Kippöffnung is quieter and low-pass filtered. Closing fades to silence. Hidden pages suspend audio, and leaving disposes the context and sources. Built-in files load on demand and retain only two decoded loops. Local MP3s use moderate RMS/peak normalization and a two-second equal-power loop overlap. Uploaded audio streams from a local Blob URL and loops using the browser's media player, so long recordings do not require full-buffer decoding. Browser gesture restrictions have a Play fallback, and failed downloads offer Retry.

## Your own sound

Expand **Use your own sound** and choose an audio file of up to 25 MB. Formats such as MP3, WAV, OGG, M4A, AAC and FLAC depend on browser support; unsupported/invalid files leave the current selection intact and show an actionable error. Audio is associated with the current weather and selected after loading.

Uploads are saved in this origin's IndexedDB on this device. They are never sent to a server or added to the project files. **Remove your selected sound** deletes that upload and restores a built-in choice. If browser storage is disabled or full, the audio works for the current session and the interface clearly says so. Browser/site-data clearing or changing browser/origin removes access to those local uploads. Custom recordings retain their own loudness and loop seam; the saved volume control adjusts them.

## Weather appearance

The original six weather appearances remain. Dark Academia late autumn uses cool grey daylight, sparse drizzle, wet materials, subdued seven-tone leaves drifting in the street canyon and uneven leaf collections at the curbs. Rainy dusk has darker blue-grey light, heavier rain, reflective streets and fewer moving leaves. Overcast afternoon has diffuse grey daylight. Foggy night has a dark blue atmosphere, restrained external light and deeper mist. Atmospheric fog affects exterior materials; room surfaces remain in clear indoor air. No room architecture, furniture, window mechanism or city scale is changed.

## Sources

69 recordings use CC0 1.0; Rmshh's original cyberpunk rain uses CC BY 4.0. Each primary Freesound page was inspected for its actual license and public HQ preview URL. Recordings are stored locally; the running app does not depend on Freesound. The new files are excerpts of up to 90 seconds, encoded as stereo 44.1 kHz 128 kbps MP3. Full titles, authors, source URLs, license URLs, adaptations, durations, bytes and SHA256 hashes are in `public/audio/north-city/weather-library.json`. All credits are in [WEATHER_ATTRIBUTION.md](../../public/audio/north-city/WEATHER_ATTRIBUTION.md), and the selected recording is credited beside the sound picker. Search/source HTML and individual metadata are preserved under `test-artifacts/north-city/weather-audio/research/`.

## Validation

The actual-room weather/audio browser suite verifies all ten weather modes, each list's ten-or-more unique source IDs, manifest/file hashes, nonzero audio output, second-track selection, per-weather recall, rapid switching, tilt filtering, mute/suspension, collapsed controls, custom playback with no audio upload request, IndexedDB reload persistence, removal, invalid-file rejection, visibility recovery and disposal. No autoplay-policy override is used. The first-frame shader compile delayed IndexedDB opening beyond the original timeout; storage now initializes after that render, while built-in playback remains independent of database readiness. The repeated full suite passes with no page errors.

Detailed validation and runtime captures are under `test-artifacts/north-city/weather-audio/validation/`. Audio measurements establish functioning output, not subjective audition. Independent visual review addresses the rendered weather scenes separately. Existing revision-12 Snapshot exports and previous visual-review evidence are historical and are retained.

Final TypeScript/Vite production build passes. All 70 audio assets in the production package match the source SHA256 hashes; the 12 frozen review source files and 24 actual-room captures also match their bindings. An injected HTTP503 recovers on Retry, and session-only uploads play with IndexedDB disabled. Touch layouts at 390 × 844, 375 × 667 and 844 × 390 fit without horizontal overflow or overlap with movement controls. The weather-effects audit verifies changing finite leaf matrices outside the glazing, correct rain/snow counts and preset lighting, and exterior-only fog. The geometry audit passes with 1,585,646 unique triangles, no nonfinite positions, the fitted manifold duvet and all 270 TV sight rays clear. Reduced motion freezes the city life. Reports: `retry-results.json`, `touch-results.json`, `weather-effects.json`, and `../geometry/audit.json` under the validation location above.

Independent revision-14 formal visual review 1/3 accepted **8.1/10**, inspecting 17 actual runtime views and three references. The full unedited [review](revision-14-review-1.md) records regular wet-road reflections, deep night darkness, subtle autumn leaves, existing smooth bedding/city repetition and phone control footprint. Two generic storage phrases identified in the review were subsequently changed to neutral browser-privacy wording, retaining explicit saved/session-only status. Frozen review source and screenshots remain bound to their original hashes; the two-string final change is recorded separately in the brief. The initial brief-read tool stalled before any inspection/grade; the same first round resumed using direct image reads. Two formal rounds remain unused.
