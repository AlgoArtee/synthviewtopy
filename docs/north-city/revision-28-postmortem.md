# Revision 28 outcome

The plaza and its district were physically level. The downward-looking perspective camera made left-side building edges lean outward; projected mall verticals in the original panorama drifted about 12–27 pixels at 951×892. A small across-frontage heading also remained in the original preset.

The balcony now uses a vertically shifted architectural frustum for moderate viewing angles, keeping wall edges vertical while preserving the requested look direction. The main panorama faces squarely along the plaza axis. Projection correction blends in through the balcony doorway and yields to ordinary perspective for steep floor/ceiling views. Interior views remain conventional. Zoom, resize, dragging and walking update the same camera and inverse projection, including the depth/AO/reflection passes. No scene geometry was rotated.

Validation: production build, 4517 pure projection checks, 38 actual-room checks and the original bundled browser client pass. 13 native captures cover rainy day, clear night/day/evening, fog, northern/southern skyline, zoom, free look, mobile, ceiling and indoor return. Actual projected tower edges drift at most 0 pixels; the main mall roof deviates by at most 2.475797344914099e-14 pixels. The shifted inverse is consistent, and 55 actual rail/train-height samples remain unobstructed. Other city modules retain their revision-27 source hashes; sky, weather, light/animation systems and user settings were not altered.

An initial ungraded capture launch was stopped before screenshots after static preflight found a mistaken test expectation: the saved ceiling view looks up only 16 degrees. The corrected test explicitly drags into a steep upward view. This required no scene change and is recorded in aborted-preflight.json.

Independent round 1 accepted 8.4/10 for this alignment/camera scope. Historical realism grades remain unchanged. Angled side facades retain their natural horizontal vanishing points; distant haze and simple tower architecture remain. Live user controls were left as found. No commit or deployment.
