import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.OMICS_DISTRICT_OUTPUT ?? 'output/omics-labs-district';
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

const districtId = 'omics-labs';
const requiredRoots = [
  'OMICS__O1__ATLAS_LOOM',
  'OMICS__O2__PERTURBOME_FOUNDRY',
  'OMICS__O3__EXPOSOME_EXCHANGE',
  'OMICS__O4__FLUX_CATHEDRAL',
  'OMICS__O5__CONVERGENCE_VAULT',
];

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.evaluate(() => window.advanceTime(300));
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Omics Labs District is unavailable');
    world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(14), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    district.updateMatrixWorld(true);
    const authorityRoot = world.worldStreaming.packages.get(districtId)?.authorityRoot;
    if (!authorityRoot) throw new Error('Omics authoring authority is unavailable');

    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); const scaledMeshParentDetails = [];
    let meshCount = 0; let triangleCount = 0;
    district.traverse((object) => { if (object.userData.exteriorProgram === true) facilities.push(object); });
    authorityRoot.traverse((object) => {
      if (object.name) names.push(object.name);
      const profile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (profile) animations.set(profile, (animations.get(profile) ?? 0) + 1);
      if (!object.isMesh) return;
      meshCount += 1;
      const geometry = object.geometry; triangleCount += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
      if (object.parent?.isMesh && (Math.abs(object.parent.scale.x - 1) > 0.001 || Math.abs(object.parent.scale.y - 1) > 0.001 || Math.abs(object.parent.scale.z - 1) > 0.001)) scaledMeshParentDetails.push({ name: object.name, parent: object.parent.name, scale: object.parent.scale.toArray() });
      const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((entry) => materialNames.add(entry.name));
    });

    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const boundaryViolations = []; const facilityBoxes = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true); const bounds = facility.userData.authoredLocalBounds;
      if (!bounds?.min || !bounds?.max) throw new Error(`Missing authored bounds for ${facility.userData.buildingCode}`);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); const corners = [];
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const point = world.camera.position.clone().set(x, y, z).applyMatrix4(facility.matrixWorld); min.min(point); max.max(point); corners.push(point);
      }
      facilityBoxes.push({ code: facility.userData.buildingCode, min: min.toArray(), max: max.toArray() });
      corners.forEach((point) => {
        const radius = Math.hypot(point.x, point.z); const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
        if (radius < definition.sector.innerRadius - 0.25 || radius > definition.sector.outerRadius + 0.25 || angle < definition.sector.startAngle - 0.012 || angle > definition.sector.endAngle + 0.012) boundaryViolations.push({ code: facility.userData.buildingCode, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
      });
    });
    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) {
      const a = facilityBoxes[left]; const b = facilityBoxes[right]; const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]); const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.18 && overlapZ > 0.18) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }
    const roads = ['OMICS__OMIC_CONTINUUM', ...Array.from({ length: 5 }, (_, index) => `OMICS__BUILDING_APPROACH_O${index + 1}`)].map((name) => district.getObjectByName(name) ?? authorityRoot.getObjectByName(name));
    const continuum = roads[0]; const positions = continuum.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2; const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(continuum.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z); const textState = world.getTextSnapshot(); const compactTextState = JSON.parse(window.render_game_to_text()); const streaming = world.worldStreaming.getSnapshot();
    const prefixes = ['OMICS__O1__VORONOI_CELL_PANEL_', 'OMICS__O2__MOLECULAR_BARCODE_FIN_', 'OMICS__O3__RISING_INCOMPLETE_RING_SEGMENT_', 'OMICS__O3__ENVIRONMENTAL_COLLECTION_PLATE_', 'OMICS__O4__CHROMATOGRAPHIC_FACADE_FIN_', 'OMICS__O5__CHRONOLOGICAL_CONCRETE_GROOVE_', 'OMICS__O5__CHRONOME_TIME_BAND_', 'OMICS__AUTONOMOUS_CRYOGENIC_CAPSULE_'];
    const prefixCounts = Object.fromEntries(prefixes.map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    return {
      program: district.userData.omicsLabsDistrict, population: district.userData.population, topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name), codes: facilities.map((facility) => facility.userData.buildingCode).sort(), facilityCount: facilities.length,
      meshCount, triangleCount, uniqueNames: new Set(names).size, scaledMeshParentDetails, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), prefixCounts, missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes,
      routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadGround, textDistrict: textState.omicsLabsDistrict, specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision, planning: textState.planning, compactDistrict: compactTextState.omicsLabsDistrict, compactSelected: compactTextState.selected, streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangleCount: audit.triangleCount, animations: audit.animations, prefixCounts: audit.prefixCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations }, null, 2));
  if (audit.facilityCount !== 5 || audit.codes.join(',') !== 'O1,O2,O3,O4,O5') throw new Error(`Omics facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Omics roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 900) throw new Error(`Omics exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.triangleCount > 250_000) throw new Error(`Omics source triangle budget exceeded: ${audit.triangleCount}`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Omics names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Omics detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Omics facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Omics facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.some((road) => !road.resident || !road.walkable) || audit.roadGround === null) throw new Error(`Omic Continuum route hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 5 || audit.textDistrict?.scientificSequence?.join('>') !== 'Map>Perturb>Expose>Measure Flux>Integrate') throw new Error('Omics metadata is missing from getTextSnapshot()');
  if (audit.compactDistrict?.signatureSystems?.autonomousCapsules !== 10 || audit.compactSelected?.id !== districtId || audit.compactSelected?.packageId !== districtId) throw new Error(`Compact render_game_to_text() lost Omics state: ${JSON.stringify({ district: audit.compactDistrict, selected: audit.compactSelected })}`);
  if (audit.population?.realizedFacilityCount !== 5 || audit.population?.omicContinuumNarrative !== true) throw new Error('Omics population metadata is incomplete');
  if (audit.specializedRevision !== 17 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Omics integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['omics-emissive-pulse'] ?? 0) < 250 || (audit.animations['omics-sample-transit'] ?? 0) !== 10 || (audit.animations['omics-rotation'] ?? 0) < 5) throw new Error(`Omics animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  const expected = { 'OMICS__O1__VORONOI_CELL_PANEL_': 270, 'OMICS__O2__MOLECULAR_BARCODE_FIN_': 96, 'OMICS__O3__RISING_INCOMPLETE_RING_SEGMENT_': 24, 'OMICS__O3__ENVIRONMENTAL_COLLECTION_PLATE_': 96, 'OMICS__O4__CHROMATOGRAPHIC_FACADE_FIN_': 96, 'OMICS__O5__CHRONOLOGICAL_CONCRETE_GROOVE_': 64, 'OMICS__O5__CHRONOME_TIME_BAND_': 36, 'OMICS__AUTONOMOUS_CRYOGENIC_CAPSULE_': 10 };
  for (const [prefix, count] of Object.entries(expected)) if (audit.prefixCounts[prefix] !== count) throw new Error(`Expected ${count} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('OMICS__') && name !== 'DISTRICT_ROADS__GENERATED_NETWORK')) throw new Error(`Generic placeholder leaked into Omics: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of ['Omics pale ivory cellular ceramic', 'Omics matte black titanium', 'Omics responsive environmental mesh', 'Omics brushed stainless steel', 'Omics pale mineral concrete', 'Omics black electrochromic glass']) if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing Omics material: ${requiredMaterial}`);

  await page.evaluate(() => { document.querySelector('.label-layer')?.setAttribute('style', 'display:none'); document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); district.updateMatrixWorld(true);
      district.traverse((object) => { if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.setMode('explore'); world.select(districtId, 'scene'); world.selectionBox.visible = false; world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 82), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.58, center.y + Math.max(size.x, size.z) * 0.42, center.z + size.z * 0.72); world.controls.target.copy(center).setY(4.0); }
      world.controls.update(); world.worldStreaming.ensurePackageResident(district); world.labelRoot.visible = false; world.advanceTime(1_200); world.selectionBox.visible = false;
    }, { districtId, time, plan }); await page.waitForTimeout(350); await page.evaluate(() => { const world = window.labIsland; world.selectionBox.visible = false; world.renderer.setAnimationLoop(null); world.renderer.render(world.scene, world.camera); });
  };
  await prepareDistrictView('noon'); await page.screenshot({ path: `${OUTPUT}/omics-overview.png` });
  await prepareDistrictView('noon', true); await page.screenshot({ path: `${OUTPUT}/omics-plan.png` });
  await prepareDistrictView('night'); await page.screenshot({ path: `${OUTPUT}/omics-night.png` });

  const views = { O1: { camera: [16, 12, 17], target: [0, 2.8, 0] }, O2: { camera: [17, 10, 15], target: [0, 2.6, 0] }, O3: { camera: [16, 13, 17], target: [0, 3.1, 0] }, O4: { camera: [16, 14, 18], target: [0, 6.0, 0] }, O5: { camera: [19, 12, 18], target: [0, 3.4, 0] } };
  for (const [code, view] of Object.entries(views)) {
    await page.evaluate(({ districtId, code, view }) => { const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); let facility = null; district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; }); facility.updateMatrixWorld(true); world.setMode('explore'); world.select(districtId, 'scene'); world.setTimeOfDay(code === 'O4' ? 'night' : 'noon'); world.setWeather(code === 'O3' ? 'fog' : 'clear'); world.cameraTween = null; world.camera.up.set(0, 1, 0); world.camera.position.copy(world.camera.position.clone().fromArray(view.camera).applyMatrix4(facility.matrixWorld)); world.controls.target.copy(world.controls.target.clone().fromArray(view.target).applyMatrix4(facility.matrixWorld)); world.controls.update(); world.worldStreaming.ensurePackageResident(district); world.labelRoot.visible = false; world.advanceTime(900); world.selectionBox.visible = false; }, { districtId, code, view });
    await page.waitForTimeout(250); await page.evaluate(() => { const world = window.labIsland; world.selectionBox.visible = false; world.renderer.setAnimationLoop(null); world.renderer.render(world.scene, world.camera); }); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const authorityRoot = world.worldStreaming.packages.get(districtId)?.authorityRoot; const walk = district.getObjectByName('OMICS__OMIC_CONTINUUM') ?? authorityRoot?.getObjectByName('OMICS__OMIC_CONTINUUM'); const positions = walk.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2; const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(walk.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]); world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true; world.camera.lookAt(next.x, ground + 0.16, next.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walkState = world.walkController.getSnapshot(); return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walkState.grounded, position: walkState.positionWorld };
  }, { districtId, roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Omic Continuum traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/omic-continuum-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangleCount: audit.triangleCount, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
