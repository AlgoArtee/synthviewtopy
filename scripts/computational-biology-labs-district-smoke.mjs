import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.COMPUTATIONAL_BIOLOGY_DISTRICT_OUTPUT ?? 'output/computational-biology-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'computational-biology-labs';
const requiredRoots = [
  'COMPBIO__C1__CELLULARIS_NEXUS',
  'COMPBIO__C2__CAUSA_ARRAY',
  'COMPBIO__C3__PROTEUS_FOLD',
  'COMPBIO__C4__PANGENOME_MERIDIAN',
  'COMPBIO__C5__MORPHOSPACE_ATLAS',
  'COMPBIO__C6__REGULA_LOOM',
  'COMPBIO__C7__IMMUNOME_EXCHANGE',
  'COMPBIO__C8__KINETICA_DYNAMICS_ARRAY',
  'COMPBIO__C9__AION_EVOLUTION_ENGINE',
  'COMPBIO__C10__CONTINUUM_BIOTWIN_OBSERVATORY',
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
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Computational Biology Labs District is unavailable');
    world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(16), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    const restoreAuthority = world.worldStreaming.mountPackageAuthoritySources(districtId);
    district.updateMatrixWorld(true);
    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animation = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animation) animations.set(animation, (animations.get(animation) ?? 0) + 1);
      if (!object.isMesh) return; meshCount += 1;
      const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((entry) => materialNames.add(entry.name));
    });
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const facilityBoxes = []; const boundaryViolations = [];
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
    const routeNames = ['COMPBIO__INFERENCE_SPINE', ...Array.from({ length: 5 }, (_, index) => `COMPBIO__BRANCHING_INFERENCE_PATH_${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `COMPBIO__BUILDING_APPROACH_C${index + 1}`)];
    const routes = routeNames.map((name) => world.scene.getObjectByName(name)); const spine = routes[0]; const positions = spine.geometry.attributes.position; const pair = Math.floor(positions.count / 8) * 2; const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(spine.matrixWorld); const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const roadNext = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(spine.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z); const textState = JSON.parse(window.render_game_to_text()); const deepState = world.getTextSnapshot(); const streaming = world.worldStreaming.getSnapshot();
    const prefixes = ['COMPBIO__C1__DISPLACED_ELLIPTICAL_SHELL_', 'COMPBIO__C1__PERTURBATION_GARDEN_PLOT_', 'COMPBIO__C2__INTERVENTION_BASIN_', 'COMPBIO__C4__GENOME_GRAPH_BAR_', 'COMPBIO__C5__OFFSET_TISSUE_SECTION_PLATE_', 'COMPBIO__C6__CONTEXT_CORE_', 'COMPBIO__C7__RECOGNITION_FACET_', 'COMPBIO__C8__WARPED_TRAJECTORY_RIBBON_', 'COMPBIO__C9__THERMAL_REEF_TOWER_', 'COMPBIO__C10__TISSUE_FRAME_TERRACE_'];
    const prefixCounts = Object.fromEntries(prefixes.map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    const result = {
      program: district.userData.computationalBiologyLabsDistrict, population: district.userData.population, facilityCount: facilities.length, codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))), meshCount, uniqueNames: new Set(names).size,
      materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), prefixCounts, missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes,
      routeAudit: routes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadNext: roadNext.toArray(), roadGround,
      textDistrict: textState.computationalBiologyLabsDistrict, specializedRevision: deepState.masterplan?.specializedDistrictLayoutRevision, planning: deepState.planning, streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
    restoreAuthority?.();
    return result;
  }, { districtId, requiredRoots });
  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, prefixCounts: audit.prefixCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations }, null, 2));
  if (audit.facilityCount !== 10 || audit.codes.join(',') !== 'C1,C2,C3,C4,C5,C6,C7,C8,C9,C10') throw new Error(`Computational Biology facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Computational Biology roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 900 || audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Computational Biology exterior detail is too sparse or nondeterministic: meshes=${audit.meshCount}, names=${audit.uniqueNames}`);
  if (audit.boundaryViolations.length) throw new Error(`Computational Biology facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Computational Biology facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.length !== 16 || audit.routeAudit.some((route) => !route.resident || !route.walkable) || audit.roadGround === null) throw new Error(`Inference Spine circulation is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 10 || audit.textDistrict?.circulation?.widthMetres !== 32 || audit.textDistrict?.signatureSystems?.biologicalScales !== 4) throw new Error('Computational Biology metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.inferenceSpineNarrative !== true || audit.specializedRevision !== 13 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error('Computational Biology integration metadata regressed');
  const expectedCounts = { 'COMPBIO__C1__DISPLACED_ELLIPTICAL_SHELL_': 3, 'COMPBIO__C1__PERTURBATION_GARDEN_PLOT_': 32, 'COMPBIO__C2__INTERVENTION_BASIN_': 48, 'COMPBIO__C4__GENOME_GRAPH_BAR_': 5, 'COMPBIO__C5__OFFSET_TISSUE_SECTION_PLATE_': 6, 'COMPBIO__C6__CONTEXT_CORE_': 3, 'COMPBIO__C8__WARPED_TRAJECTORY_RIBBON_': 87, 'COMPBIO__C9__THERMAL_REEF_TOWER_': 18, 'COMPBIO__C10__TISSUE_FRAME_TERRACE_': 3 };
  for (const [prefix, expected] of Object.entries(expectedCounts)) if (audit.prefixCounts[prefix] !== expected) throw new Error(`Expected ${expected} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  for (const material of ['Computational Biology pale mineral ceramic', 'Computational Biology white UHPC', 'Computational Biology graphite titanium', 'Computational Biology black basalt', 'Computational Biology translucent photovoltaic glass', 'Computational Biology restrained iridescent metal']) if (!audit.materialNames.includes(material)) throw new Error(`Missing material: ${material}`);

  const districtBounds = {
    min: [0, 1, 2].map((axis) => Math.min(...audit.facilityBoxes.map((entry) => entry.min[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...audit.facilityBoxes.map((entry) => entry.max[axis]))),
  };

  await page.evaluate(() => { const world = window.labIsland; world.clearSelection('system'); world.selectionBox.material.visible = false; document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan, districtBounds }) => {
      const world = window.labIsland; const min = world.camera.position.clone().fromArray(districtBounds.min); const max = world.camera.position.clone().fromArray(districtBounds.max);
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 100), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.58, center.y + Math.max(size.x, size.z) * 0.42, center.z + size.z * 0.76); world.controls.target.copy(center).setY(4.5); }
      world.controls.update(); world.advanceTime(1_200); world.selectionBox.visible = false; world.selectionBox.material.visible = false;
    }, { districtId, time, plan, districtBounds }); await page.waitForTimeout(350);
  };
  await prepareView('noon'); await page.screenshot({ path: `${OUTPUT}/computational-biology-overview.png` });
  await prepareView('noon', true); await page.screenshot({ path: `${OUTPUT}/computational-biology-plan.png` });
  await prepareView('night'); await page.screenshot({ path: `${OUTPUT}/computational-biology-night.png` });
  for (let index = 1; index <= 10; index += 1) {
    const code = `C${index}`;
    const facilityBounds = audit.facilityBoxes.find((entry) => entry.code === code);
    await page.evaluate(({ districtId, code, facilityBounds }) => {
      const world = window.labIsland; const min = world.camera.position.clone().fromArray(facilityBounds.min); const max = world.camera.position.clone().fromArray(facilityBounds.max);
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.15 + size.y * 0.65; world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay(code === 'C8' || code === 'C9' || code === 'C10' ? 'night' : 'noon'); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false; world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.38, center.z + distance * 0.72); world.controls.target.copy(center); world.controls.update(); world.advanceTime(900); world.selectionBox.visible = false; world.selectionBox.material.visible = false;
    }, { districtId, code, facilityBounds });
    await page.waitForTimeout(220); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }
  const walkAudit = await page.evaluate(({ roadPoint, roadNext }) => {
    const world = window.labIsland; const next = world.camera.position.clone().set(roadNext[0], roadNext[1], roadNext[2]);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const preferred = world.camera.position.clone().set(roadPoint[0], roadPoint[1], roadPoint[2]); const heading = next.clone().sub(preferred).setY(0).normalize(); world.walkController.enter(preferred, heading, preferred); const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot(); return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint, roadNext: audit.roadNext });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Inference Spine WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/inference-spine-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
