import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.OUTPUT_DIR ?? 'output/robotics-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'robotics-labs';

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

async function waitForWorld() {
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot), null, { timeout: 180_000 });
}

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await waitForWorld();
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true, null, { timeout: 180_000 });
  await page.evaluate(() => window.advanceTime(300));
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId, { timeout: 180_000 });
  const requiredRoots = [
    'ROBOTICS__R1__CORPUS_NEXUS', 'ROBOTICS__R2__TACTUS_HALL', 'ROBOTICS__R3__MYOMER_PAVILION',
    'ROBOTICS__R4__MURMURATION_ARRAY', 'ROBOTICS__R5__SYMBIONT_CONSERVATORY', 'ROBOTICS__R6__MAGNETOTAXIS_VAULT',
    'ROBOTICS__R7__AVATAR_SPINE', 'ROBOTICS__R8__TERMINUS_RANGE', 'ROBOTICS__R9__AUTOPOIESIS_YARD',
    'ROBOTICS__R10__PALINGENESIS_WORKS', 'ROBOTICS__KINEMATIC_WALK_INFRASTRUCTURE', 'ROBOTICS__ACTIVE_TEST_LANDSCAPE',
  ];
  const audit = await page.evaluate(async ({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    if (!district) throw new Error('Robotics district root is unavailable');
    world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(14), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    district.updateMatrixWorld(true);
    const authorityRoot = world.worldStreaming.packages.get(districtId)?.authorityRoot;
    if (!authorityRoot) throw new Error('Robotics authoring authority is unavailable');

    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); const scaledMeshParentDetails = [];
    let meshCount = 0; let triangleCount = 0;
    district.traverse((object) => { if (object.userData.exteriorProgram === true) facilities.push(object); });
    authorityRoot.traverse((object) => {
      if (object.name) names.push(object.name);
      const profile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (profile) animations.set(profile, (animations.get(profile) ?? 0) + 1);
      if (!object.isMesh) return;
      meshCount += 1;
      const geometry = object.geometry;
      triangleCount += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
      if (object.parent?.isMesh && (Math.abs(object.parent.scale.x - 1) > 0.001 || Math.abs(object.parent.scale.y - 1) > 0.001 || Math.abs(object.parent.scale.z - 1) > 0.001)) scaledMeshParentDetails.push({ name: object.name, parent: object.parent.name, scale: object.parent.scale.toArray() });
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((entry) => materialNames.add(entry.name));
    });

    const definition = world.getDefinition(districtId);
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const boundaryViolations = []; const facilityBoxes = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      const bounds = facility.userData.authoredLocalBounds;
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
    const roads = ['ROBOTICS__KINEMATIC_WALK', ...Array.from({ length: 10 }, (_, index) => `ROBOTICS__BUILDING_APPROACH_R${index + 1}`)].map((name) => district.getObjectByName(name) ?? authorityRoot.getObjectByName(name));
    const walk = roads[0]; const positions = walk.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2; const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(walk.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const deepState = world.getTextSnapshot(); const compactState = JSON.parse(window.render_game_to_text()); const streaming = world.worldStreaming.getSnapshot();
    const selectableAudit = facilities.map((facility) => {
      const id = String(facility.userData.individualSelectableId ?? '');
      return { code: facility.userData.buildingCode, id, definitionRegistered: world.definitions.has(id), objectRegistered: world.objectGroups.get(id) === facility };
    });
    const prefixes = ['ROBOTICS__R1__ROTATED_RESEARCH_SLAB_', 'ROBOTICS__R2__PRESSURE_SKIN_TILE_', 'ROBOTICS__R2__ARTICULATED_CANOPY_SUPPORT_', 'ROBOTICS__R3__ADAPTIVE_MEMBRANE_LOBE_', 'ROBOTICS__R3__VARIABLE_STIFFNESS_ARCH_', 'ROBOTICS__R4__HEXAGONAL_SWARM_TOWER_', 'ROBOTICS__R4__DOCKING_APERTURE_', 'ROBOTICS__R4__COORDINATED_SWARM_DRONE_', 'ROBOTICS__R5__LENS_PAVILION_', 'ROBOTICS__R5__CULTURE_MEDIA_TUBE_', 'ROBOTICS__R6__FIELD_SHAPING_ARCH_', 'ROBOTICS__R7__TENSION_BRIDGE_', 'ROBOTICS__R8__ARMOURED_HANGAR_', 'ROBOTICS__R9__GANTRY_BEAM_', 'ROBOTICS__R10__RECONFIGURABLE_ANNULAR_MODULE_', 'ROBOTICS__R10__PARTS_TREE_TRUNK_', 'ROBOTICS__MACHINE_READABLE_FIDUCIAL_', 'ROBOTICS__HUMAN_MACHINE_REFUGE_', 'ROBOTICS__ROBOT_HEIGHT_TRAFFIC_SIGNAL_', 'ROBOTICS__AUTONOMOUS_MACHINE_CARRIER_'];
    const prefixCounts = Object.fromEntries(prefixes.map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    return {
      program: district.userData.roboticsLabsDistrict, population: district.userData.population,
      topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name),
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))), facilityCount: facilities.length,
      meshCount, triangleCount, uniqueNames: new Set(names).size, scaledMeshParentDetails, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), prefixCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes,
      routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadGround,
      textDistrict: deepState.roboticsLabsDistrict, compactDistrict: compactState.roboticsLabsDistrict, compactSelected: compactState.selected,
      selectableAudit,
      specializedRevision: deepState.masterplan?.specializedDistrictLayoutRevision, planning: deepState.planning,
      streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangleCount: audit.triangleCount, animations: audit.animations, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations, prefixCounts: audit.prefixCounts }, null, 2));
  if (audit.facilityCount !== 10 || audit.codes.join(',') !== 'R1,R2,R3,R4,R5,R6,R7,R8,R9,R10') throw new Error(`Robotics facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Robotics roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 750) throw new Error(`Robotics exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.triangleCount > 250_000) throw new Error(`Robotics source triangle budget exceeded: ${audit.triangleCount}`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Robotics names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Robotics detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Robotics facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Robotics facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.some((road) => !road.resident || !road.walkable) || audit.roadGround === null) throw new Error(`Kinematic Walk hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 10 || audit.textDistrict?.circulation?.exactBuildingApproaches !== 10) throw new Error('Robotics metadata is missing from getTextSnapshot()');
  if (audit.compactDistrict?.signatureSystems?.reconfigurableModules !== 12 || audit.compactSelected?.id !== districtId || audit.compactSelected?.packageId !== districtId) throw new Error(`Compact render_game_to_text() lost Robotics state: ${JSON.stringify({ district: audit.compactDistrict, selected: audit.compactSelected })}`);
  if (audit.selectableAudit.length !== 10 || audit.selectableAudit.some((entry) => !entry.id || !entry.definitionRegistered || !entry.objectRegistered)) throw new Error(`Robotics per-building selection registration is incomplete: ${JSON.stringify(audit.selectableAudit)}`);
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.kinematicWalkNarrative !== true || audit.population?.movementIsFunctional !== true) throw new Error('Robotics population metadata is incomplete');
  if (audit.specializedRevision !== 18 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Robotics integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['robotics-emissive-pulse'] ?? 0) < 60 || (audit.animations['robotics-path-transit'] ?? 0) !== 6 || (audit.animations['robotics-rotation'] ?? 0) < 1) throw new Error(`Robotics functional animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  const expected = { 'ROBOTICS__R1__ROTATED_RESEARCH_SLAB_': 7, 'ROBOTICS__R2__PRESSURE_SKIN_TILE_': 120, 'ROBOTICS__R2__ARTICULATED_CANOPY_SUPPORT_': 24, 'ROBOTICS__R3__ADAPTIVE_MEMBRANE_LOBE_': 5, 'ROBOTICS__R3__VARIABLE_STIFFNESS_ARCH_': 8, 'ROBOTICS__R4__HEXAGONAL_SWARM_TOWER_': 6, 'ROBOTICS__R4__DOCKING_APERTURE_': 96, 'ROBOTICS__R4__COORDINATED_SWARM_DRONE_': 24, 'ROBOTICS__R5__LENS_PAVILION_': 3, 'ROBOTICS__R5__CULTURE_MEDIA_TUBE_': 18, 'ROBOTICS__R6__FIELD_SHAPING_ARCH_': 6, 'ROBOTICS__R7__TENSION_BRIDGE_': 3, 'ROBOTICS__R8__ARMOURED_HANGAR_': 4, 'ROBOTICS__R9__GANTRY_BEAM_': 2, 'ROBOTICS__R10__RECONFIGURABLE_ANNULAR_MODULE_': 12, 'ROBOTICS__R10__PARTS_TREE_TRUNK_': 8, 'ROBOTICS__MACHINE_READABLE_FIDUCIAL_': 48, 'ROBOTICS__HUMAN_MACHINE_REFUGE_': 8, 'ROBOTICS__ROBOT_HEIGHT_TRAFFIC_SIGNAL_': 10, 'ROBOTICS__AUTONOMOUS_MACHINE_CARRIER_': 6 };
  for (const [prefix, count] of Object.entries(expected)) if (audit.prefixCounts[prefix] !== count) throw new Error(`Expected ${count} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('ROBOTICS__') && name !== 'DISTRICT_ROADS__GENERATED_NETWORK')) throw new Error(`Generic placeholder leaked into Robotics: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of ['Robotics pale ceramic composite', 'Robotics graphite structural shell', 'Robotics dark titanium exoskeleton', 'Robotics field-shaping copper alloy', 'Robotics reinforced adaptive membrane', 'Robotics biohybrid fluoropolymer shell']) if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing Robotics material: ${requiredMaterial}`);

  await page.evaluate(() => { document.querySelector('.label-layer')?.setAttribute('style', 'display:none'); document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); district.updateMatrixWorld(true);
      district.traverse((object) => { if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.setMode('explore'); world.select(districtId, 'scene'); world.selectionBox.visible = false; world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 82), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.54, center.y + Math.max(size.x, size.z) * 0.4, center.z + size.z * 0.7); world.controls.target.copy(center).setY(4.2); }
      world.controls.update(); world.worldStreaming.ensurePackageResident(district); world.labelRoot.visible = false; world.advanceTime(1_200); world.selectionBox.visible = false;
    }, { districtId, time, plan });
    await page.waitForTimeout(350); await page.evaluate(() => { const world = window.labIsland; world.selectionBox.visible = false; world.renderer.setAnimationLoop(null); world.renderer.render(world.scene, world.camera); });
  };
  await prepareDistrictView('noon'); await page.screenshot({ path: `${OUTPUT}/robotics-overview.png` });
  await prepareDistrictView('noon', true); await page.screenshot({ path: `${OUTPUT}/robotics-plan.png` });
  await prepareDistrictView('night'); await page.screenshot({ path: `${OUTPUT}/robotics-night.png` });

  const facilityViews = { R1: [20, 17, 23, 0, 7, 0], R2: [23, 10, 19, 0, 2.5, 0], R3: [20, 11, 20, 0, 2.5, 0], R4: [22, 15, 22, 0, 4.5, 0], R5: [21, 13, 20, 0, 3.2, 0], R6: [21, 14, 22, 0, 3.5, 0], R7: [22, 17, 22, 0, 7, 0], R8: [23, 14, 23, 0, 4.2, 0], R9: [23, 13, 22, 0, 4.0, 0], R10: [22, 14, 22, 0, 4.0, 0] };
  for (const [code, values] of Object.entries(facilityViews)) {
    await page.evaluate(({ districtId, code, values }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); let facility = null; district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; }); facility.updateMatrixWorld(true); world.setMode('explore'); world.select(districtId, 'scene'); world.setTimeOfDay(['R4', 'R6', 'R10'].includes(code) ? 'night' : 'noon'); world.setWeather(code === 'R3' ? 'fog' : 'clear'); world.cameraTween = null; world.camera.up.set(0, 1, 0); world.camera.position.copy(world.camera.position.clone().set(values[0], values[1], values[2]).applyMatrix4(facility.matrixWorld)); world.controls.target.copy(world.controls.target.clone().set(values[3], values[4], values[5]).applyMatrix4(facility.matrixWorld)); world.controls.update(); world.worldStreaming.ensurePackageResident(district); world.labelRoot.visible = false; world.advanceTime(900); world.selectionBox.visible = false;
    }, { districtId, code, values });
    await page.waitForTimeout(220); await page.evaluate(() => { const world = window.labIsland; world.selectionBox.visible = false; world.renderer.render(world.scene, world.camera); }); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const authorityRoot = world.worldStreaming.packages.get(districtId)?.authorityRoot; const walk = district.getObjectByName('ROBOTICS__KINEMATIC_WALK') ?? authorityRoot?.getObjectByName('ROBOTICS__KINEMATIC_WALK'); const positions = walk.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2; const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(walk.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]); world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true; world.camera.lookAt(next.x, ground + 0.16, next.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walkState = world.walkController.getSnapshot(); return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walkState.grounded, position: walkState.positionWorld };
  }, { districtId, roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Kinematic Walk traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/kinematic-walk-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangleCount: audit.triangleCount, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
