import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ORGANIC_CHEMISTRY_DISTRICT_OUTPUT ?? 'output/organic-chemistry-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'organic-chemistry-labs';
const requiredRoots = [
  'ORGCHEM__O1__AUTOCATALYTIC_SYNTHESIS_EXCHANGE',
  'ORGCHEM__O2__SKELETAL_EDITING_CATHEDRAL',
  'ORGCHEM__O3__PHOTON_ELECTRON_CATALYSIS_PRISM',
  'ORGCHEM__O4__MERIDIAN_SELECTIVE_C_H_ACTIVATION',
  'ORGCHEM__O5__CHEMOENZYMATIC_CASCADE_CONSERVATORY',
  'ORGCHEM__O6__CHIRAL_SYNTHESIS_TWIN',
  'ORGCHEM__O7__CATENANE_FORUM_MOLECULAR_MACHINES',
  'ORGCHEM__O8__ORGANIC_PHOTONICS_SEMICONDUCTOR_LOOM',
  'ORGCHEM__O9__CIRCULAR_CARBON_REFORGING_WORKS',
  'ORGCHEM__O10__NATURAL_PRODUCTS_MACROCYCLIC_ATLAS',
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

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Organic Chemistry Labs District is unavailable');
    world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(16), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    district.updateMatrixWorld(true);

    const facilities = []; const names = []; const materialNames = new Set(); const animations = new Map(); const scaledMeshParentDetails = []; let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      if (object.userData.animate) animations.set(object.userData.animate, (animations.get(object.userData.animate) ?? 0) + 1);
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

    const routeNames = ['ORGCHEM__SYNTHESIS_ARC', 'ORGCHEM__BIOCHEMISTRY_RESEARCH_PROMENADE', 'ORGCHEM__SHIELDED_OUTER_LOGISTICS_ROAD', ...Array.from({ length: 4 }, (_, index) => `ORGCHEM__CONTROLLED_SERVICE_LINK_${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `ORGCHEM__BUILDING_APPROACH_O${index + 1}`)];
    const roads = routeNames.map((name) => district.getObjectByName(name)); const boulevard = roads[0]; const positions = boulevard.geometry.attributes.position; const pair = Math.floor(positions.count / 8) * 2; const a = world.camera.position.clone().fromBufferAttribute(positions, pair); const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1); const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(boulevard.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z); const textState = JSON.parse(window.render_game_to_text()); const streaming = world.worldStreaming.getSnapshot();
    const prefixCounts = Object.fromEntries([
      'ORGCHEM__O1__RECONFIGURABLE_FACADE_MODULE_', 'ORGCHEM__O2__MOLECULAR_VOID_FRAME_', 'ORGCHEM__O3__DICHROIC_LIGHT_HARVESTING_FIN_', 'ORGCHEM__O3__TRANSPARENT_ELECTROSYNTHESIS_TOWER_', 'ORGCHEM__O4__SELECTIVELY_FUNCTIONALIZED_FACADE_PANEL_', 'ORGCHEM__O5__DESCENDING_CASCADE_VOLUME_', 'ORGCHEM__O6__LEFT_HELICOIDAL_EXHAUST_', 'ORGCHEM__O6__RIGHT_HELICOIDAL_EXHAUST_', 'ORGCHEM__O7__KINETIC_WOVEN_ENVELOPE_', 'ORGCHEM__O8__SAWTOOTH_PHOTOVOLTAIC_ROOF_', 'ORGCHEM__O9__RECYCLED_POLYMER_PANEL_', 'ORGCHEM__O10__ALGORITHMIC_LANTERN_APERTURE_',
    ].map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    return {
      program: district.userData.organicChemistryLabsDistrict, population: district.userData.population, topLevelNames: district.children.map((child) => child.name), codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))), facilityCount: facilities.length,
      meshCount, uniqueNames: new Set(names).size, scaledMeshParentDetails, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), prefixCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes, routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadGround,
      textDistrict: textState.organicChemistryLabsDistrict, specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision, planning: textState.planning, streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, prefixCounts: audit.prefixCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 5) }, null, 2));
  if (audit.facilityCount !== 10 || audit.codes.join(',') !== 'O1,O2,O3,O4,O5,O6,O7,O8,O9,O10') throw new Error(`Organic Chemistry facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Organic Chemistry roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 800) throw new Error(`Organic Chemistry exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Organic Chemistry names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Organic Chemistry detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Organic Chemistry facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Organic Chemistry facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.length !== 17 || audit.routeAudit.some((road) => !road.resident || !road.walkable) || audit.roadGround === null) throw new Error(`Organic Chemistry circulation is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 10 || audit.textDistrict?.signatureSystems?.exchangeFacadeModules !== 40 || audit.textDistrict?.signatureSystems?.lanternApertures !== 96) throw new Error('Organic Chemistry metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.molecularSynthesisQuarter !== true) throw new Error('Organic Chemistry population metadata is incomplete');
  if (audit.specializedRevision !== 9 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Organic Chemistry integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['organic-chemistry-emissive-pulse'] ?? 0) < 250 || (audit.animations['organic-chemistry-rotation'] ?? 0) < 20 || (audit.animations['organic-chemistry-sway'] ?? 0) < 150 || (audit.animations['organic-chemistry-orbit'] ?? 0) !== 14) throw new Error(`Organic Chemistry animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  const expectedCounts = { 'ORGCHEM__O1__RECONFIGURABLE_FACADE_MODULE_': 40, 'ORGCHEM__O2__MOLECULAR_VOID_FRAME_': 3, 'ORGCHEM__O3__DICHROIC_LIGHT_HARVESTING_FIN_': 60, 'ORGCHEM__O3__TRANSPARENT_ELECTROSYNTHESIS_TOWER_': 4, 'ORGCHEM__O4__SELECTIVELY_FUNCTIONALIZED_FACADE_PANEL_': 5, 'ORGCHEM__O5__DESCENDING_CASCADE_VOLUME_': 5, 'ORGCHEM__O6__LEFT_HELICOIDAL_EXHAUST_': 18, 'ORGCHEM__O6__RIGHT_HELICOIDAL_EXHAUST_': 18, 'ORGCHEM__O7__KINETIC_WOVEN_ENVELOPE_': 108, 'ORGCHEM__O8__SAWTOOTH_PHOTOVOLTAIC_ROOF_': 22, 'ORGCHEM__O9__RECYCLED_POLYMER_PANEL_': 48, 'ORGCHEM__O10__ALGORITHMIC_LANTERN_APERTURE_': 96 };
  for (const [prefix, expected] of Object.entries(expectedCounts)) if (audit.prefixCounts[prefix] !== expected) throw new Error(`Expected ${expected} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('ORGCHEM__'))) throw new Error(`Generic placeholder leaked into Organic Chemistry: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of ['Organic Chemistry carbon-black basalt composite', 'Organic Chemistry white acid-resistant technical stone', 'Organic Chemistry brushed stainless steel', 'Organic Chemistry amber laboratory glass', 'Organic Chemistry copper-violet dichroic photovoltaic surface', 'Organic Chemistry replaceable fluoropolymer membrane']) if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing Organic Chemistry material: ${requiredMaterial}`);

  await page.evaluate(() => { window.labIsland.clearSelection('system'); document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity); district.updateMatrixWorld(true);
      district.traverse((object) => { if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 88), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.62, center.y + Math.max(size.x, size.z) * 0.36, center.z + size.z * 0.74); world.controls.target.copy(center).setY(4.0); }
      world.controls.update(); world.advanceTime(1_200);
    }, { districtId, time, plan }); await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon'); await page.screenshot({ path: `${OUTPUT}/organic-chemistry-overview.png` });
  await prepareDistrictView('noon', true); await page.screenshot({ path: `${OUTPUT}/organic-chemistry-plan.png` });
  await prepareDistrictView('night'); await page.screenshot({ path: `${OUTPUT}/organic-chemistry-night.png` });

  for (let index = 1; index <= 10; index += 1) {
    const code = `O${index}`;
    await page.evaluate(({ districtId, code }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); let facility = null; district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; });
      facility.updateMatrixWorld(true); const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => { if (!object.isMesh || !object.geometry) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return; for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); } });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.18 + size.y * 0.62; const orientation = facility.getWorldQuaternion(world.camera.quaternion.clone()); const front = world.camera.position.clone().set(0, 0, 1).applyQuaternion(orientation).setY(0).normalize(); const side = world.camera.position.clone().set(-1, 0, 0).applyQuaternion(orientation).setY(0).normalize(); world.setMode('explore'); world.setTimeOfDay(['O2', 'O3', 'O7', 'O8', 'O9', 'O10'].includes(code) ? 'night' : 'noon'); world.setWeather('clear'); world.cameraTween = null; world.camera.up.set(0, 1, 0); world.camera.position.copy(center).addScaledVector(front, distance * 0.78).addScaledVector(side, distance * 0.42).setY(center.y + distance * 0.34); world.controls.target.copy(center); world.controls.update(); world.advanceTime(900);
    }, { districtId, code });
    await page.waitForTimeout(220); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const boulevard = district.getObjectByName('ORGCHEM__SYNTHESIS_ARC'); const positions = boulevard.geometry.attributes.position; const pair = Math.floor(positions.count / 8) * 2; const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(boulevard.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const preferred = world.camera.position.clone().set(roadPoint[0], roadPoint[1], roadPoint[2]); const heading = next.clone().sub(preferred).setY(0).normalize(); world.walkController.enter(preferred, heading, preferred); const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot(); return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { districtId, roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Synthesis Arc WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/synthesis-arc-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
