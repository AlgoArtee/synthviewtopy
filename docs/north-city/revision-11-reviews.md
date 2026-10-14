# North City revision 11 — reference portrait faces

Both city holograms now use a detailed reference-derived portrait atlas on shaped relief, with luminous eyes, natural facial texture, anatomical nose/lips and swept-back fine hair. Cyan/pink identities, independent blinking, neck-pivot motion and wind-driven gowns remain. Texture loading is part of production readiness. A dense facial core supplies correct foreground depth/AO while hair and shoulders retain native alpha.

| Formal round | Score | Result | Evidence |
| --- | ---: | --- | --- |
| 1 | 7.8/10 | Rejected: exaggerated nose projection and cyan closed-eye corner discontinuity | revision-11/review-1 |
| 2 | 8.3/10 | Accepted after nose and lid corrections | revision-11/review-2 |

One of the three permitted formal rounds remains unused. Full independent reports are preserved in revision-11-review-1.md and revision-11-review-2.md; each evidence set and source revision has a SHA256 manifest. No technical test points were added to visual grades.

Round 2 reduced/broadened nasal relief, shared the exact face/core tessellation and raised/feathered closing eyelids. Acceptance is for a close visual interpretation, not an exact dimensional replica. Shallow relief, some fixed photographic shading/hair detail, stronger facial solidity and subtle distant features remain. The reviewer inspected sampled poses without playing the live clips.

Build, actual eyelid aperture closure and moving lids, independent head quaternions, unequal 40-second blink sequences, live head/gown motion, reduced-motion freeze, finite geometry, weather/collapsible controls and bedding/TV fit pass. Final full-room capture status and measurements are recorded in revision-11-brief.json. Architecture/bed/city placement are unchanged; the prior actual-mesh plan remains applicable. The existing 50 native 4K Snapshots archive is preserved.

The native 1536x1024 RGBA portrait atlas was generated with built-in imagegen from the supplied reference, then copied into public/apartments/holograms/reference-portrait-atlas-v11.png. The full prompt, generator mode, original output path and source are in revision-11-portrait-asset.json. This asset is used on character relief, not as city/room background or screenshot evidence. No paid mesh service, export, deployment or commit was performed.
