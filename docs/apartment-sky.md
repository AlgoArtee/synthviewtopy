# Shared apartment celestial artwork

`src/apartments/apartmentSky.ts` is a placement adapter around the actual `createIslandCygnus()` factory in `src/world/islandCygnus.ts`. That island factory uses the Cygnus X-1 / HDE 226868 shader and animation in `src/world/syntheticShore/celestial.ts`. Neither shared source file is modified, and the apartment adapter does not contain a replacement shader, duplicate art function, stellar sphere, accretion torus, or painted window image.

The adapter preserves the shared plane geometry, vertex/fragment shader strings, body radii, spacing, uniforms and animation. The sky retains a fixed north bearing. Its complete artwork is rotated to a 20° centre elevation so the campus roofs do not hide it; the island uses a 7° centre elevation. This is a rotation of the whole existing artwork, without changing its angular dimensions or the relationship between its bodies.

The existing island proxy is uniformly reduced to 20% of its original size and distance. Its centre is consequently 252 m from the viewing camera, and a room far plane of 450 m is sufficient. The adapter exports `APARTMENT_SKY_MINIMUM_CAMERA_FAR = 320`. The unchanged island vertex shader writes far-background depth, so even real buildings beyond the 252 m proxy occlude the astronomical artwork correctly.

## Integration

```ts
import { createApartmentSky } from './apartmentSky';

const sky = createApartmentSky();
scene.add(sky.group);
camera.layers.enable(1);

// After assigning the initial camera position/rotation:
sky.update(camera, 0);

// In the frame update, after navigation has updated the camera:
sky.update(camera, elapsedSeconds);

// Expose this in render_game_to_text for every room:
const celestial = sky.getSnapshot(camera);

// Teardown: remove its objects before the room's generic resource traversal.
sky.dispose();
```

Each loaded room should create one sky adapter. Rooms share source code and artwork; they do not need to keep 101 renderer instances or sky resources alive. The adapter has no network dependencies or asynchronous assets.

All sky objects use layer 1, matching the room's existing non-AO layer. The main camera and the vanity reflector camera enable layer 1. The room reflection probe and GTAO geometry pass retain only layer 0. This prevents AO from treating the astronomical proxy as nearby geometry. Existing `createRoomRendering()` already follows this layer convention.

`sky.update()` follows camera translation while leaving its orientation fixed. A per-mesh `onBeforeRender` hook performs the same translation for a reflector's virtual camera. This preserves astronomical placement in the vanity mirror and restores the main-camera placement when its sky is rendered. No camera rotation is copied onto the sky.

`dispose()` is idempotent, removes the group from its scene, and delegates geometry/material disposal to the island factory.

## Snapshot contract

Every apartment exposes the same stable artwork identity through `sky.getSnapshot(camera)`:

- `source`: `src/world/islandCygnus.ts`
- `artworkSource`: `src/world/syntheticShore/celestial.ts`
- `shaderAndGeometry`: `identical-to-lab-island`
- `placement`: `fixed-north-sky`
- `depthPlacement`: `background-far-plane`
- `cameraTranslationOnly`: `true`
- `centreElevationDegrees`: `20`
- `angularScale`: `1`
- `skyDistance`: approximately `252` (floating-point tolerance applies)
- `companionToBlackHoleDiameter`: `5.625`
- `animation.coronaPeriodSeconds`: `8`
- `animation.streamTransitSeconds`: `10`
- `animation.streamDirection`: `companion-to-black-hole`

`artworkSignature` contains deterministic FNV-1a content fingerprints of the actual returned shader strings and geometry buffers. These are diagnostic fingerprints, not security hashes. QA should compare each room's signature to a fresh baseline, rather than permanently hard-coding its hashes: legitimate future updates to the shared island art should reach all apartments.

At implementation time, the signature is:

```json
{
  "vertexShader": "fnv1a32:d1296ab2",
  "fragmentShader": "fnv1a32:da8b4df1",
  "geometry": "fnv1a32:675ee110",
  "meshCount": 1,
  "geometryType": "PlaneGeometry",
  "planeWidth": 7600,
  "planeHeight": 3800,
  "angularWidthDegrees": 45.781103,
  "angularHeightDegrees": 23.841477
}
```

`blackHole` and `companion` retain per-camera screen position, bearing and visibility diagnostics. Their body-centre elevations are 19.2° and 22.8°. Screen positions and `inViewport` depend on where the viewer looks; the artwork signature, elevations, angular scale and diameter ratio do not. A shared north-window outlook pose near `(-1.85, 1.65, -4.72)` reveals both bodies above the campus when looking approximately 20° above north.

## Verification

Run the source/geometry/animation checks without a browser:

```sh
node scripts/apartment-sky-smoke.mjs --static-only
```

Run the isolated GPU comparison and screenshot fixture:

```sh
node scripts/apartment-sky-smoke.mjs
```

The fixture verifies byte-for-byte equality of shader source and geometry against a fresh Lab Island factory, matching animation uniforms, preserved angular dimensions, translation invariance, virtual-camera placement, idempotent disposal and removal of old primitive celestial bodies from `academicOutlook.ts`. GPU checks compare the island and apartment artwork at equivalent camera angles, verify opaque/transparent occlusion beyond the apartment proxy, and confirm no pixel parallax after camera translation.

Outputs are written to `test-artifacts/apartment-sky/`, including `source-equality.json`, `results.json` and `exact-lab-island-artwork.png`. The current GPU comparison has no differing colour channels above a two-level tolerance; its maximum difference is one level in an eight-bit channel. Camera translation is pixel-identical. The captured view contains the shared lensed disk, black-hole shadow, gas stream and blue-white companion, with no primitive replacements.
