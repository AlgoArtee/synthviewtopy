import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ART_MARKETING_OUTPUT ?? 'output/art-marketing-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtIds = ['scientific-art-labs', 'marketing'];
const requiredRoots = [
  'ARTMARK__SA1__PARALLAX_INSTITUTE',
  'ARTMARK__SA2__MORPHOGENESIS_FABRICATION_HALL',
  'ARTMARK__SA3__CHROMAFLUX_BIOART_CONSERVATORY',
  'ARTMARK__SA4__RESONANCE_FOUNDRY',
  'ARTMARK__SA5__LUMEN_OBSERVATORY',
  'ARTMARK__SA6__ATLAS_OF_INVISIBLE_WORLDS',
  'ARTMARK__SA7__ARCHIVE_OF_FUTURE_MATERIALS',
  'ARTMARK__SA8__NULL_FIELD_GALLERY',
  'ARTMARK__M1__SIGNAL_HOUSE',
  'ARTMARK__M2__LAUNCH_ARRAY',
  'ARTMARK__M3__NARRATIVE_ENGINE_MEDIA_FOUNDRY',
  'ARTMARK__M4__AUDIENCE_DYNAMICS_OBSERVATORY',
  'ARTMARK__M5__PROTOTYPE_IDENTITY_WORKS',
  'ARTMARK__M6__BEACON_EXCHANGE_TOWER',
  'ARTMARK__M7__EVIDENCE_COMMONS',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  for (const districtId of districtIds) {
    await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
    await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident), districtId);
  }

  const audit = await page.evaluate(({ districtIds, requiredRoots }) => {
    const world = window.labIsland;
    const districts = districtIds.map((id) => world.scene.getObjectByName(`DISTRICT__${id}`));
    const definitions = districtIds.map((id) => world.definitions.get(id));
    if (districts.some((district) => !district) || definitions.some((definition) => !definition?.sector)) throw new Error('Scientific Art and Marketing districts are unavailable');
    world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    const restores = districtIds.map((id) => world.worldStreaming.mountPackageAuthoritySources(id));
    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); let meshCount = 0; let triangles = 0;
    districts.forEach((district) => {
      district.updateMatrixWorld(true);
      district.traverse((object) => {
        if (object.name) names.push(object.name);
        if (object.userData.exteriorProgram === true) facilities.push(object);
        const animation = object.userData.animate ?? object.userData.gpuAnimationProfile;
        if (animation) animations.set(animation, (animations.get(animation) ?? 0) + 1);
        if (!object.isMesh || !object.geometry) return;
        meshCount += 1;
        const index = object.geometry.index; const position = object.geometry.attributes.position;
        triangles += index ? index.count / 3 : position ? position.count / 3 : 0;
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((entry) => materialNames.add(entry.name));
      });
    });
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const facilityBoxes = []; const boundaryViolations = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      const definition = definitions[districtIds.indexOf(facility.userData.districtId)]; const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point);
          const radius = Math.hypot(point.x, point.z); const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
          if (radius < definition.sector.innerRadius - 0.25 || radius > definition.sector.outerRadius + 0.25 || angle < definition.sector.startAngle - 0.012 || angle > definition.sector.endAngle + 0.012) boundaryViolations.push({ code: facility.userData.buildingCode, feature: object.name, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
        }
      });
      facilityBoxes.push({ code: facility.userData.buildingCode, districtId: facility.userData.districtId, name: facility.userData.buildingName, min: min.toArray(), max: max.toArray() });
    });
    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) {
      const a = facilityBoxes[left]; const b = facilityBoxes[right]; const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]); const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.35 && overlapZ > 0.35) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }
    const routeNames = [
      'ARTMARK__SA__SPECTRUM_SPINE_INNER_HALF',
      ...Array.from({ length: 8 }, (_, index) => `ARTMARK__SA${index + 1}__BUILDING_APPROACH`),
      'ARTMARK__M__SPECTRUM_SPINE_OUTER_HALF',
      ...Array.from({ length: 7 }, (_, index) => `ARTMARK__M${index + 1}__BUILDING_APPROACH`),
    ];
    const routes = routeNames.map((name) => world.scene.getObjectByName(name)); const walkRoute = routes[0]; const positions = walkRoute.geometry.attributes.position; const pair = Math.floor((positions.count / 2 - 5) * 0.54) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const roadNext = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    world.select('scientific-art-labs', 'scene'); const scientificText = JSON.parse(window.render_game_to_text()); world.select('marketing', 'scene'); const marketingText = JSON.parse(window.render_game_to_text()); const deepState = world.getTextSnapshot(); const streaming = world.worldStreaming.getSnapshot();
    const expressions = {
      parallaxFins: /^ARTMARK__SA1__ROTATING_DICHROIC_VERTICAL_FIN_\d+$/,
      shellPanels: /^ARTMARK__SA2__OPTIMIZED_CERAMIC_SHELL_PANEL_\d+$/,
      chromafluxPods: /^ARTMARK__SA3__CONNECTED_GREENHOUSE_POD_\d+$/,
      resonanceVolumes: /^ARTMARK__SA4__OFFSET_ACOUSTIC_VOLUME_\d+$/,
      lumenShutters: /^ARTMARK__SA5__ROTATING_MIRRORED_SHUTTER_\d+$/,
      atlasSlides: /^ARTMARK__SA6__DISPLACED_MICROSCOPE_SLIDE_\d+$/,
      archiveStrips: /^ARTMARK__SA7__PERMANENT_WEATHERING_TEST_STRIP_\d+$/,
      nullDatums: /^ARTMARK__SA8__CONTINUOUS_EYE_LEVEL_DATUM_\d+$/,
      signalSegments: /^ARTMARK__M1__WAVEFORM_CURVED_SLAB_\d+$/,
      launchCanopies: /^ARTMARK__M2__RADIAL_EVENT_CANOPY_\d+$/,
      narrativeVolumes: /^ARTMARK__M3__SLIDING_BLACK_PRODUCTION_VOLUME_\d+$/,
      audienceCells: /^ARTMARK__M4__RESPONSIVE_ELECTROCHROMIC_CELL_\d+$/,
      identityPanels: /^ARTMARK__M5__INTERCHANGEABLE_MATERIAL_PANEL_\d+$/,
      beaconRings: /^ARTMARK__M6__OFFSET_PERFORATED_TITANIUM_RING_\d+$/,
      evidenceColumns: /^ARTMARK__M7__EVIDENCE_STANDARD_COLUMN_\d+_SECTION_1$/,
    };
    const signatureCounts = Object.fromEntries(Object.entries(expressions).map(([key, expression]) => [key, names.filter((name) => expression.test(name)).length]));
    const result = {
      programs: { scientificArt: districts[0].userData.scientificArtLabsDistrict, marketing: districts[1].userData.marketingDistrict }, populations: districts.map((district) => district.userData.population),
      facilityCount: facilities.length, codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => left.localeCompare(right, undefined, { numeric: true })), meshCount, triangles, uniqueNames: new Set(names).size, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), signatureCounts,
      missingRoots: requiredRoots.filter((name) => !world.scene.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes,
      routeAudit: routes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadNext: roadNext.toArray(), roadGround,
      scientificText: scientificText.scientificArtLabsDistrict, marketingText: marketingText.marketingDistrict, selected: marketingText.selected, specializedRevision: deepState.masterplan?.specializedDistrictLayoutRevision, planning: deepState.planning,
      streaming: districtIds.map((id) => streaming.packages.find((entry) => entry.id === id) ?? null),
    };
    restores.reverse().forEach((restore) => restore?.()); return result;
  }, { districtIds, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangles: audit.triangles, animations: audit.animations, signatureCounts: audit.signatureCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 20) }, null, 2));
  if (audit.facilityCount !== 15 || audit.codes.join(',') !== 'M1,M2,M3,M4,M5,M6,M7,SA1,SA2,SA3,SA4,SA5,SA6,SA7,SA8') throw new Error(`Scientific Art / Marketing facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing authored roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 900 || audit.uniqueNames < audit.meshCount * 0.94 || audit.triangles > 350_000) throw new Error(`District detail budget failed: meshes=${audit.meshCount}, unique=${audit.uniqueNames}, triangles=${audit.triangles}`);
  if (audit.boundaryViolations.length) throw new Error(`Facilities cross the shared wedge: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.length !== 17 || audit.routeAudit.some((route) => !route.resident || !route.walkable) || audit.roadGround === null) throw new Error(`Spectrum Spine circulation is incomplete: ${JSON.stringify({ routes: audit.routeAudit, ground: audit.roadGround })}`);
  if (audit.scientificText?.buildingCount !== 8 || audit.scientificText?.signatureSystems?.parallaxDichroicFins !== 72 || audit.marketingText?.buildingCount !== 7 || audit.marketingText?.signatureSystems?.evidenceColumns !== 32) throw new Error('Compact Scientific Art / Marketing metadata is incomplete');
  if (audit.populations.some((population) => population?.artMarketingTranslationNarrative !== true || population?.spectrumSpineWalkable !== true) || audit.specializedRevision !== 28 || audit.planning?.cellViolations !== 0 || audit.selected?.packageId !== 'marketing') throw new Error('District integration metadata regressed');
  const expectedCounts = { parallaxFins: 72, shellPanels: 32, chromafluxPods: 7, resonanceVolumes: 5, lumenShutters: 30, atlasSlides: 6, archiveStrips: 24, nullDatums: 34, signalSegments: 16, launchCanopies: 8, narrativeVolumes: 6, audienceCells: 84, identityPanels: 10, beaconRings: 5, evidenceColumns: 32 };
  for (const [key, expected] of Object.entries(expectedCounts)) if (audit.signatureCounts[key] !== expected) throw new Error(`Expected ${expected} ${key}, found ${audit.signatureCounts[key]}`);
  for (const name of ['Art Marketing black titanium', 'Art Marketing smoked low-iron glass', 'Art Marketing pearlescent ceramic', 'Art Marketing brushed aluminum', 'Art Marketing translucent photovoltaic glass', 'Art Marketing dichroic interference film', 'Art Marketing pale geopolymer stone']) if (!audit.materialNames.includes(name)) throw new Error(`Missing common-palette material: ${name}`);

  const bounds = { min: [0, 1, 2].map((axis) => Math.min(...audit.facilityBoxes.map((entry) => entry.min[axis]))), max: [0, 1, 2].map((axis) => Math.max(...audit.facilityBoxes.map((entry) => entry.max[axis]))) };
  await page.evaluate(() => { const world = window.labIsland; world.clearSelection('system'); world.selectionBox.material.visible = false; document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ time, plan, bounds }) => {
      const world = window.labIsland; const min = world.camera.position.clone().fromArray(bounds.min); const max = world.camera.position.clone().fromArray(bounds.max); const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min);
      world.select('scientific-art-labs', 'scene'); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.67 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 115), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.72, center.y + Math.max(size.x, size.z) * 0.31, center.z + size.z * 0.7); world.controls.target.copy(center).setY(4.2); }
      world.controls.update(); world.advanceTime(1_200); world.selectionBox.visible = false;
    }, { time, plan, bounds }); await page.waitForTimeout(350);
  };
  await prepareView('noon'); await page.screenshot({ path: `${OUTPUT}/district-overview.png` });
  await prepareView('noon', true); await page.screenshot({ path: `${OUTPUT}/district-plan.png` });
  await prepareView('night'); await page.screenshot({ path: `${OUTPUT}/district-night.png` });
  for (const code of ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6', 'SA7', 'SA8', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']) {
    const facilityBounds = audit.facilityBoxes.find((entry) => entry.code === code);
    await page.evaluate(({ code, facilityBounds }) => {
      const world = window.labIsland; const min = world.camera.position.clone().fromArray(facilityBounds.min); const max = world.camera.position.clone().fromArray(facilityBounds.max); const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.05 + size.y * 0.78;
      world.select(facilityBounds.districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay(['SA1', 'SA3', 'SA4', 'SA5', 'SA8', 'M1', 'M3', 'M4', 'M6'].includes(code) ? 'night' : 'noon'); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false; world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.4, center.z + distance * 0.72); world.controls.target.copy(center); world.controls.update(); world.advanceTime(700); world.selectionBox.visible = false;
    }, { code, facilityBounds }); await page.waitForTimeout(160); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }
  const walkAudit = await page.evaluate(({ roadPoint, roadNext }) => {
    const world = window.labIsland; const next = world.camera.position.clone().fromArray(roadNext); world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const preferred = world.camera.position.clone().fromArray(roadPoint); const heading = next.clone().sub(preferred).setY(0).normalize(); world.walkController.enter(preferred, heading, preferred); const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot(); return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint, roadNext: audit.roadNext });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Spectrum Spine traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/spectrum-spine-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangles: audit.triangles, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
