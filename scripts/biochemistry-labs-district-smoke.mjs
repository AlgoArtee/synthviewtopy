import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.BIOCHEMISTRY_DISTRICT_OUTPUT ?? 'output/biochemistry-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const districtId = 'biochemistry-labs';
const requiredRoots = [
  'BIOCHEM__B1__AMINOFORM_FOUNDRY',
  'BIOCHEM__B2__CRYOSTRATUM',
  'BIOCHEM__B3__METABOLOME_ATLAS',
  'BIOCHEM__B4__VESICA_GENESIS',
  'BIOCHEM__B5__EVOZYME_LOOP',
  'BIOCHEM__B6__COACERVUM',
  'BIOCHEM__B7__GLYCAN_CIPHER',
  'BIOCHEM__B8__PROTEOSTASIS_CITADEL',
  'BIOCHEM__B9__CHRONOCATALYSIS_SPIRE',
  'BIOCHEM__B10__FERRUM_VITA_FORGE',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
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
  await page.waitForTimeout(900);
  await page.evaluate(() => window.advanceTime(360));
  await page.evaluate((packageId) => window.labIsland.select(packageId, 'scene'), districtId);
  await page.waitForFunction((packageId) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === packageId && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Biochemistry Labs District is unavailable');
    world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(16), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    district.updateMatrixWorld(true);

    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); const scaledMeshParentDetails = []; let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animationProfile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animationProfile) animations.set(animationProfile, (animations.get(animationProfile) ?? 0) + 1);
      if (!object.isMesh) return;
      meshCount += 1;
      if (object.parent?.isMesh && (Math.abs(object.parent.scale.x - 1) > 0.001 || Math.abs(object.parent.scale.y - 1) > 0.001 || Math.abs(object.parent.scale.z - 1) > 0.001)) scaledMeshParentDetails.push({ name: object.name, parent: object.parent.name, scale: object.parent.scale.toArray() });
      const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((entry) => materialNames.add(entry.name));
    });

    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const boundaryViolations = []; const facilityBoxes = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); const corners = [];
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); corners.push(point); }
      });
      facilityBoxes.push({ code: facility.userData.buildingCode, min: min.toArray(), max: max.toArray() });
      corners.forEach((point) => { const radius = Math.hypot(point.x, point.z); const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle); if (radius < definition.sector.innerRadius - 0.25 || radius > definition.sector.outerRadius + 0.25 || angle < definition.sector.startAngle - 0.012 || angle > definition.sector.endAngle + 0.012) boundaryViolations.push({ code: facility.userData.buildingCode, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) }); });
    });
    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) { const a = facilityBoxes[left]; const b = facilityBoxes[right]; const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]); const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]); if (overlapX > 0.18 && overlapZ > 0.18) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) }); }

    const routeNames = ['BIOCHEM__REACTION_GRADIENT', ...Array.from({ length: 4 }, (_, index) => `BIOCHEM__DISTRICT_INTERFACE_LINK_${index + 1}`), 'BIOCHEM__OUTER_UTILITY_SPINE', ...Array.from({ length: 10 }, (_, index) => `BIOCHEM__BUILDING_APPROACH_B${index + 1}`)];
    const roads = routeNames.map((name) => district.getObjectByName(name)); const promenade = roads[0]; const positions = promenade.geometry.attributes.position; const pair = Math.floor(positions.count / 8) * 2; const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z); const textState = JSON.parse(window.render_game_to_text()); const streaming = world.worldStreaming.getSnapshot();
    const prefixCounts = Object.fromEntries([
      'BIOCHEM__B2__TOMOGRAPHY_TILT_WINDOW_', 'BIOCHEM__B3__ANALYTICAL_PIXEL_', 'BIOCHEM__B4__TRANSLUCENT_VESICLE_', 'BIOCHEM__B5__SEALED_SAMPLE_CARRIER_', 'BIOCHEM__B6__MERGED_CONDENSATE_MASS_', 'BIOCHEM__B7__SUGAR_RING_EXOSKELETON_', 'BIOCHEM__B7__TERMINAL_GLYCAN_MODULE_', 'BIOCHEM__B8__RADIAL_CHAMBER_BRIDGE_', 'BIOCHEM__B9__LOGARITHMIC_OPTICAL_FIN_', 'BIOCHEM__B10__METALLOCLUSTER_CORE_', 'BIOCHEM__B10__CELL_FREE_CASCADE_HALL_',
    ].map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    return {
      program: district.userData.biochemistryLabsDistrict, population: district.userData.population, topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name), codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))), facilityCount: facilities.length,
      meshCount, uniqueNames: new Set(names).size, scaledMeshParentDetails, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), prefixCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes, routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadGround,
      textDistrict: textState.biochemistryLabsDistrict, specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision, planning: textState.planning, streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, prefixCounts: audit.prefixCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations }, null, 2));
  if (audit.facilityCount !== 10 || audit.codes.join(',') !== 'B1,B2,B3,B4,B5,B6,B7,B8,B9,B10') throw new Error(`Biochemistry facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing biochemistry roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 750) throw new Error(`Biochemistry exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Biochemistry names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Biochemistry detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Biochemistry facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Biochemistry facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.length !== 16 || audit.routeAudit.some((road) => !road.resident || !road.walkable) || audit.roadGround === null) throw new Error(`Biochemistry route hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 10 || audit.textDistrict?.signatureSystems?.syntheticVesicles !== 7 || audit.textDistrict?.signatureSystems?.metalloclusterTowers !== 3) throw new Error('Biochemistry metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.reactionGradientNarrative !== true) throw new Error('Biochemistry population metadata is incomplete');
  if (audit.specializedRevision !== 11 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Biochemistry integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['biochemistry-emissive-pulse'] ?? 0) < 180 || (audit.animations['biochemistry-path-transit'] ?? 0) !== 8 || (audit.animations['biochemistry-vertical-transit'] ?? 0) !== 4 || (audit.animations['biochemistry-kinetic-blade'] ?? 0) < 40 || (audit.animations['biochemistry-phase-drift'] ?? 0) !== 12) throw new Error(`Biochemistry animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  const expectedCounts = { 'BIOCHEM__B2__TOMOGRAPHY_TILT_WINDOW_': 9, 'BIOCHEM__B3__ANALYTICAL_PIXEL_': 102, 'BIOCHEM__B4__TRANSLUCENT_VESICLE_': 7, 'BIOCHEM__B5__SEALED_SAMPLE_CARRIER_': 8, 'BIOCHEM__B6__MERGED_CONDENSATE_MASS_': 5, 'BIOCHEM__B7__SUGAR_RING_EXOSKELETON_': 10, 'BIOCHEM__B7__TERMINAL_GLYCAN_MODULE_': 5, 'BIOCHEM__B8__RADIAL_CHAMBER_BRIDGE_': 8, 'BIOCHEM__B9__LOGARITHMIC_OPTICAL_FIN_': 20, 'BIOCHEM__B10__METALLOCLUSTER_CORE_': 3, 'BIOCHEM__B10__CELL_FREE_CASCADE_HALL_': 4 };
  for (const [prefix, expected] of Object.entries(expectedCounts)) if (audit.prefixCounts[prefix] !== expected) throw new Error(`Expected ${expected} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('BIOCHEM__'))) throw new Error(`Generic placeholder leaked into Biochemistry: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of ['Biochemistry carbon-black basalt substrate', 'Biochemistry pale vitrified laboratory ceramic', 'Biochemistry satin titanium instrumentation', 'Biochemistry iridium-coated catalytic steel', 'Biochemistry smoke-grey electrochromic glass', 'Biochemistry catalytic amber light']) if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing biochemistry material: ${requiredMaterial}`);

  await page.evaluate(() => { window.labIsland.clearSelection('system'); document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); district.updateMatrixWorld(true);
      district.traverse((object) => { if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 88), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.58, center.y + Math.max(size.x, size.z) * 0.4, center.z + size.z * 0.76); world.controls.target.copy(center).setY(4.1); }
      world.controls.update(); world.advanceTime(1_200);
    }, { districtId, time, plan }); await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon'); await page.screenshot({ path: `${OUTPUT}/biochemistry-overview.png` });
  await prepareDistrictView('noon', true); await page.screenshot({ path: `${OUTPUT}/biochemistry-plan.png` });
  await prepareDistrictView('night'); await page.screenshot({ path: `${OUTPUT}/biochemistry-night.png` });

  for (let index = 1; index <= 10; index += 1) {
    const code = `B${index}`;
    await page.evaluate(({ districtId, code }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); let facility = null; district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; });
      facility.updateMatrixWorld(true); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => { if (!object.isMesh || !object.geometry) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.18 + size.y * 0.6; world.setMode('explore'); world.setTimeOfDay(code === 'B9' || code === 'B10' ? 'night' : 'noon'); world.setWeather('clear'); world.cameraTween = null; world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.36, center.z + distance * 0.72); world.controls.target.copy(center); world.controls.update(); world.advanceTime(900);
    }, { districtId, code });
    await page.waitForTimeout(220); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const promenade = district.getObjectByName('BIOCHEM__REACTION_GRADIENT'); const positions = promenade.geometry.attributes.position; const pair = Math.floor(positions.count / 8) * 2; const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const preferred = world.camera.position.clone().set(roadPoint[0], roadPoint[1], roadPoint[2]); const heading = next.clone().sub(preferred).setY(0).normalize(); world.walkController.enter(preferred, heading, preferred); const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot(); return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, speedKilometresPerHour: walk.speedKilometresPerHour, configuredWalkSpeedKilometresPerHour: walk.configuredWalkSpeedKilometresPerHour, position: walk.positionWorld };
  }, { districtId, roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Reaction Gradient WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/reaction-gradient-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
