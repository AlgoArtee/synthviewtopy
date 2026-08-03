import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.FORENSIC_DISTRICT_OUTPUT ?? 'output/forensic-cyberforensic-district';
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

const districtId = 'forensic-cyberforensic-lab';
const requiredRoots = [
  'FORENSIC__F1__EVIDENTIA_NEXUS',
  'FORENSIC__F2__HELIX_TRACE_INSTITUTE',
  'FORENSIC__F3__PROTEOMIC_RESIDUE_OBSERVATORY',
  'FORENSIC__F4__MICROBIOME_PROVENANCE_CONSERVATORY',
  'FORENSIC__F5__THANATOSCAN_MONOLITH',
  'FORENSIC__F6__RIDGE_MORPHOLOGY_INSTITUTE',
  'FORENSIC__F7__ISOTOPE_GEOLOCATION_SPIRE',
  'FORENSIC__F8__NANOTRACE_MATERIALS_FOUNDRY',
  'FORENSIC__F9__ECOLOGICAL_EVIDENCE_TERRACES',
  'FORENSIC__F10__SILICON_AUTOPSY_FOUNDRY',
  'FORENSIC__F11__MALWARE_ECOLOGY_CONTAINMENT_TOWER',
  'FORENSIC__F12__NETWORK_RECONSTRUCTION_ARRAY',
  'FORENSIC__F13__VERITAS_PRISM',
  'FORENSIC__F14__QUANTUM_EVIDENCE_VAULT',
  'FORENSIC__F15__CYBER_PHYSICAL_RECONSTRUCTION_RANGE',
];

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_300);
  await page.evaluate(() => window.advanceTime(240));
  await page.evaluate((packageId) => window.labIsland.select(packageId, 'scene'), districtId);
  await page.waitForFunction((packageId) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === packageId && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Forensic / Cyberforensic Labs District is unavailable');
    district.updateMatrixWorld(true);
    world.select(districtId, 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(14),
      mode: 'explore',
      selectedPackageId: districtId,
      interiorPackageId: null,
      force: true,
    });

    const facilities = [];
    const names = [];
    const materialNames = new Set();
    const animations = new Map();
    const scaledMeshParentDetails = [];
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animationProfile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animationProfile) animations.set(animationProfile, (animations.get(animationProfile) ?? 0) + 1);
      if (!object.isMesh) return;
      meshCount += 1;
      if (object.parent?.isMesh && (
        Math.abs(object.parent.scale.x - 1) > 0.001
        || Math.abs(object.parent.scale.y - 1) > 0.001
        || Math.abs(object.parent.scale.z - 1) > 0.001
      )) scaledMeshParentDetails.push({ name: object.name, parent: object.parent.name, scale: object.parent.scale.toArray() });
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((entry) => materialNames.add(entry.name));
    });

    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const boundaryViolations = [];
    const facilityBoxes = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      const corners = [];
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
          min.min(point); max.max(point); corners.push(point);
        }
      });
      facilityBoxes.push({ code: facility.userData.buildingCode, min: min.toArray(), max: max.toArray() });
      corners.forEach((point) => {
        const radius = Math.hypot(point.x, point.z);
        const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
        if (radius < definition.sector.innerRadius - 0.25 || radius > definition.sector.outerRadius + 0.25 || angle < definition.sector.startAngle - 0.012 || angle > definition.sector.endAngle + 0.012) {
          boundaryViolations.push({ code: facility.userData.buildingCode, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
        }
      });
    });
    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) {
      const a = facilityBoxes[left]; const b = facilityBoxes[right];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.18 && overlapZ > 0.18) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }

    const roads = [
      'FORENSIC__EVIDENCE_LINE_BOULEVARD',
      'FORENSIC__SEALED_SERVICE_ARC',
      ...Array.from({ length: 4 }, (_, index) => `FORENSIC__CONTROLLED_EVIDENCE_LINK_${index + 1}`),
      ...Array.from({ length: 15 }, (_, index) => `FORENSIC__BUILDING_APPROACH_F${index + 1}`),
    ].map((name) => district.getObjectByName(name));
    const evidenceLine = roads[0];
    const positions = evidenceLine.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair);
    const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(evidenceLine.matrixWorld);
    world.walkController.refreshNavigation();
    const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.forensicCyberforensicDistrict,
      population: district.userData.population,
      topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name),
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
      facilityCount: facilities.length,
      meshCount,
      uniqueNames: new Set(names).size,
      scaledMeshParentDetails,
      materialNames: [...materialNames].sort(),
      animations: Object.fromEntries(animations),
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)),
      boundaryViolations,
      overlaps,
      facilityBoxes,
      sector: definition.sector,
      routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })),
      roadPoint: roadPoint.toArray(),
      roadGround,
      textDistrict: textState.forensicCyberforensicDistrict,
      specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations }, null, 2));

  if (audit.facilityCount !== 15) throw new Error(`Expected 15 forensic facilities, found ${audit.facilityCount}`);
  if (audit.codes.join(',') !== Array.from({ length: 15 }, (_, index) => `F${index + 1}`).join(',')) throw new Error(`Forensic facility codes are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing forensic roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 900) throw new Error(`Forensic exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Forensic names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Forensic detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Forensic facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Forensic facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.some((road) => !road.resident || !road.walkable)) throw new Error(`Forensic route hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.roadGround === null) throw new Error('The Evidence Line is not WALK-grounded');
  if (audit.textDistrict?.buildingCount !== 15 || audit.textDistrict?.chainline?.hermeticCapsules !== 10) throw new Error('Forensic metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 15 || audit.population?.persistentSignatureSystem !== true) throw new Error('Forensic population metadata is incomplete');
  if (audit.specializedRevision !== 12) throw new Error(`Expected specialized layout revision 12, received ${audit.specializedRevision}`);
  if (audit.streaming?.detailResident !== true) throw new Error('Forensic detail package did not remain resident');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  if ((audit.animations['forensic-path-transit'] ?? 0) !== 10 || (audit.animations['forensic-emissive-pulse'] ?? 0) < 70 || (audit.animations['forensic-rotation'] ?? 0) < 1) throw new Error(`Forensic animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('FORENSIC__'))) throw new Error(`Generic placeholder leaked into the forensic package: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of ['Forensic anthracite technical ceramic', 'Forensic volcanic black basalt', 'Forensic white technical ceramic', 'Forensic satin titanium', 'Forensic electrochromic smoked glass', 'Chainline translucent opal glass', 'Forensic verified-evidence amber light', 'Hardware-forensic copper trace metal']) {
    if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing forensic material: ${requiredMaterial}`);
  }

  await page.evaluate(() => {
    window.labIsland.clearSelection('system');
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none'));
  });

  const prepareDistrictView = async (plan = false) => {
    await page.evaluate(({ districtId, plan }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
      district.updateMatrixWorld(true);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      district.traverse((object) => {
        if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return;
        object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); }
      });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min);
      world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.cameraTween = null;
      if (plan) world.camera.position.set(center.x, center.y + Math.max(size.x, size.z) * 1.08, center.z + 0.01);
      else world.camera.position.set(center.x - size.x * 0.28, center.y + Math.max(size.x, size.z) * 0.54, center.z + size.z * 0.62);
      world.controls.target.copy(center).setY(2.0); world.controls.update(); world.advanceTime(700);
    }, { districtId, plan });
    await page.waitForTimeout(350);
  };
  await prepareDistrictView(false); await page.screenshot({ path: `${OUTPUT}/forensic-district-overview.png` });
  await prepareDistrictView(true); await page.screenshot({ path: `${OUTPUT}/forensic-district-plan.png` });

  const prepareFacilityView = async (code, cameraLocal, targetLocal, environment = { time: 'noon', weather: 'clear' }) => {
    await page.evaluate(({ districtId, code, cameraLocal, targetLocal, environment }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); let facility = null;
      district.traverse((object) => { if (object.userData.exteriorProgram === true && object.userData.buildingCode === code) facility = object; });
      if (!facility) throw new Error(`Forensic facility ${code} is unavailable`);
      facility.updateMatrixWorld(true); world.setMode('explore'); world.setTimeOfDay(environment.time); world.setWeather(environment.weather); world.cameraTween = null;
      world.camera.position.copy(world.camera.position.clone().fromArray(cameraLocal).applyMatrix4(facility.matrixWorld)); world.controls.target.copy(world.controls.target.clone().fromArray(targetLocal).applyMatrix4(facility.matrixWorld)); world.controls.update(); world.advanceTime(700);
    }, { districtId, code, cameraLocal, targetLocal, environment });
    await page.waitForTimeout(280);
  };
  await prepareFacilityView('F1', [0, 5.0, 20], [0, 4.1, 0]); await page.screenshot({ path: `${OUTPUT}/evidentia-nexus-gateway.png` });
  await prepareFacilityView('F2', [0, 8.5, 19], [0, 5.0, 0]); await page.screenshot({ path: `${OUTPUT}/helix-trace-institute.png` });
  await prepareFacilityView('F5', [12, 8.0, 17], [0, 6.2, 0], { time: 'night', weather: 'clear' }); await page.screenshot({ path: `${OUTPUT}/thanatoscan-night.png` });
  await prepareFacilityView('F11', [0, 10.5, 22], [0, 7.0, 0], { time: 'night', weather: 'fog' }); await page.screenshot({ path: `${OUTPUT}/malware-containment-night.png` });
  await prepareFacilityView('F12', [16, 10, 18], [0, 6.5, 0], { time: 'night', weather: 'clear' }); await page.screenshot({ path: `${OUTPUT}/network-reconstruction-night.png` });
  await prepareFacilityView('F15', [19, 9, 23], [0, 3.2, 0]); await page.screenshot({ path: `${OUTPUT}/cyber-physical-range.png` });

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const mainRoad = district.getObjectByName('FORENSIC__EVIDENCE_LINE_BOULEVARD');
    const positions = mainRoad.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1));
    const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(mainRoad.matrixWorld);
    world.setTimeOfDay('noon'); world.setWeather('clear'); world.setMode('walk'); world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]); world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true; world.camera.lookAt(next.x, ground + 0.16, next.z);
    const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot();
    return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld, text: JSON.parse(window.render_game_to_text()).forensicCyberforensicDistrict, activeDistrict: districtId };
  }, { districtId, roadPoint: audit.roadPoint });
  await page.screenshot({ path: `${OUTPUT}/evidence-line-human-height.png` });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || walkAudit.grounded !== true || walkAudit.moved < 0.12) throw new Error(`Evidence Line WALK traversal failed: ${JSON.stringify(walkAudit)}`);

  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ ...audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, routeCount: audit.routeAudit.length, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations, walkGrounded: walkAudit.grounded, errors }, null, 2));
} finally {
  await browser.close();
}
