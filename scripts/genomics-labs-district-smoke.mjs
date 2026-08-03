import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.GENOMICS_DISTRICT_OUTPUT ?? 'output/genomics-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

const districtId = 'genomics-labs';
const requiredRoots = [
  'GENOMICS__G1__PANGENOME_CONFLUENCE',
  'GENOMICS__G2__HELIX_MERIDIAN',
  'GENOMICS__G3__TESSERA_VITAE',
  'GENOMICS__G4__FABRICA_GENOMICA',
  'GENOMICS__G5__VARIANT_CONSTELLATION',
];

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_300);
  await page.evaluate(() => window.advanceTime(300));
  await page.evaluate((packageId) => window.labIsland.select(packageId, 'scene'), districtId);
  await page.waitForFunction((packageId) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === packageId && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Genomics Labs District is unavailable');
    world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(14), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    district.updateMatrixWorld(true);

    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); const scaledMeshParentDetails = [];
    let meshCount = 0;
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

    const roads = ['GENOMICS__BASE_PAIR_PROMENADE', ...Array.from({ length: 4 }, (_, index) => `GENOMICS__DISTRICT_INTERFACE_LINK_${index + 1}`), ...Array.from({ length: 5 }, (_, index) => `GENOMICS__BUILDING_APPROACH_G${index + 1}`)].map((name) => district.getObjectByName(name));
    const promenade = roads[0]; const positions = promenade.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2; const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z); const textState = JSON.parse(window.render_game_to_text()); const streaming = world.worldStreaming.getSnapshot();
    const prefixCounts = Object.fromEntries(['GENOMICS__G1__GRAPH_RIBBON_', 'GENOMICS__G1__VARIANT_BUBBLE_', 'GENOMICS__G2__VERTICAL_MOIRE_BLADE_', 'GENOMICS__G2__PORE_WINDOW_', 'GENOMICS__G3__CELL_MODULE_', 'GENOMICS__G3__NUCLEUS_SKYLIGHT_', 'GENOMICS__G4__CHROMOSOME_MODULE_', 'GENOMICS__G4__ROBOTIC_GANTRY_CARRIAGE_', 'GENOMICS__G5__PROJECTING_VARIANT_PANEL_', 'GENOMICS__G5__MANHATTAN_PEAK_'].map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    return {
      program: district.userData.genomicsLabsDistrict, population: district.userData.population, topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name), codes: facilities.map((facility) => facility.userData.buildingCode).sort(), facilityCount: facilities.length,
      meshCount, uniqueNames: new Set(names).size, scaledMeshParentDetails, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), prefixCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes, routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadGround,
      textDistrict: textState.genomicsLabsDistrict, specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision, planning: textState.planning, streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, prefixCounts: audit.prefixCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations }, null, 2));
  if (audit.facilityCount !== 5 || audit.codes.join(',') !== 'G1,G2,G3,G4,G5') throw new Error(`Genomics facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing genomics roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 500) throw new Error(`Genomics exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Genomics names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Genomics detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Genomics facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Genomics facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.some((road) => !road.resident || !road.walkable) || audit.roadGround === null) throw new Error(`Genomics route hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 5 || audit.textDistrict?.signatureSystems?.tesseraCellModules !== 30) throw new Error('Genomics metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 5 || audit.population?.genomicCodeLandscape !== true) throw new Error('Genomics population metadata is incomplete');
  if (audit.specializedRevision !== 11 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Genomics integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['genomics-emissive-pulse'] ?? 0) < 100 || (audit.animations['genomics-vertical-read'] ?? 0) !== 11 || (audit.animations['genomics-gantry-carriage'] ?? 0) !== 4 || (audit.animations['genomics-rotation'] ?? 0) < 1) throw new Error(`Genomics animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  const expectedCounts = { 'GENOMICS__G1__GRAPH_RIBBON_': 48, 'GENOMICS__G1__VARIANT_BUBBLE_': 6, 'GENOMICS__G2__VERTICAL_MOIRE_BLADE_': 48, 'GENOMICS__G2__PORE_WINDOW_': 12, 'GENOMICS__G3__CELL_MODULE_': 30, 'GENOMICS__G3__NUCLEUS_SKYLIGHT_': 15, 'GENOMICS__G4__CHROMOSOME_MODULE_': 6, 'GENOMICS__G4__ROBOTIC_GANTRY_CARRIAGE_': 4, 'GENOMICS__G5__PROJECTING_VARIANT_PANEL_': 52, 'GENOMICS__G5__MANHATTAN_PEAK_': 36 };
  for (const [prefix, expected] of Object.entries(expectedCounts)) if (audit.prefixCounts[prefix] !== expected) throw new Error(`Expected ${expected} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('GENOMICS__'))) throw new Error(`Generic placeholder leaked into Genomics: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of ['Genomics dark volcanic-stone foundation', 'Genomics pearl-white genomic ceramic', 'Genomics brushed titanium', 'Genomics dark electrochromic laboratory glass', 'Genomics spectral white sequence light']) if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing genomics material: ${requiredMaterial}`);

  await page.evaluate(() => { window.labIsland.clearSelection('system'); document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); district.updateMatrixWorld(true);
      district.traverse((object) => { if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 82), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.54, center.y + Math.max(size.x, size.z) * 0.42, center.z + size.z * 0.7); world.controls.target.copy(center).setY(3.6); }
      world.controls.update(); world.advanceTime(1_200);
    }, { districtId, time, plan }); await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon'); await page.screenshot({ path: `${OUTPUT}/genomics-overview.png` });
  await prepareDistrictView('noon', true); await page.screenshot({ path: `${OUTPUT}/genomics-plan.png` });
  await prepareDistrictView('night'); await page.screenshot({ path: `${OUTPUT}/genomics-night.png` });

  const views = { G1: { camera: [18, 10, 18], target: [0, 3.2, 0] }, G2: { camera: [14, 14, 18], target: [0, 6.2, 0] }, G3: { camera: [20, 12, 19], target: [0, 2.5, 0] }, G4: { camera: [18, 14, 19], target: [0, 4.8, 0] }, G5: { camera: [16, 15, 19], target: [0, 4.5, 0] } };
  for (const [code, view] of Object.entries(views)) {
    await page.evaluate(({ districtId, code, view }) => { const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); let facility = null; district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; }); facility.updateMatrixWorld(true); world.setMode('explore'); world.setTimeOfDay(code === 'G5' ? 'night' : 'noon'); world.setWeather('clear'); world.cameraTween = null; world.camera.up.set(0, 1, 0); world.camera.position.copy(world.camera.position.clone().fromArray(view.camera).applyMatrix4(facility.matrixWorld)); world.controls.target.copy(world.controls.target.clone().fromArray(view.target).applyMatrix4(facility.matrixWorld)); world.controls.update(); world.advanceTime(900); }, { districtId, code, view });
    await page.waitForTimeout(240); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const promenade = district.getObjectByName('GENOMICS__BASE_PAIR_PROMENADE'); const positions = promenade.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2; const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]); world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true; world.camera.lookAt(next.x, ground + 0.16, next.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot(); return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { districtId, roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Base-Pair Promenade WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/base-pair-promenade-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
