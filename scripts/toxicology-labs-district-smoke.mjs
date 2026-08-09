import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.TOXICOLOGY_DISTRICT_OUTPUT ?? 'output/toxicology-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'toxicology-labs';
const requiredRoots = [
  'TOXICOLOGY__T1__EXPOSOMA',
  'TOXICOLOGY__T2__MIMESIS',
  'TOXICOLOGY__T3__CAUSALITY_ARRAY',
  'TOXICOLOGY__T4__PALIMPSEST',
  'TOXICOLOGY__T5__MERIDIAN',
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
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Toxicology Labs District is unavailable');
    world.select(districtId, 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(14), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    const restoreAuthority = world.worldStreaming.mountPackageAuthoritySources(districtId);
    district.updateMatrixWorld(true);
    const facilities = [];
    const names = [];
    const materialNames = new Set();
    const animations = new Map();
    let meshCount = 0;
    let triangles = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animation = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animation) animations.set(animation, (animations.get(animation) ?? 0) + 1);
      if (!object.isMesh || !object.geometry) return;
      meshCount += 1;
      const index = object.geometry.index;
      const position = object.geometry.attributes.position;
      triangles += index ? index.count / 3 : position ? position.count / 3 : 0;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((entry) => materialNames.add(entry.name));
    });
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const facilityBoxes = [];
    const boundaryViolations = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
          min.min(point);
          max.max(point);
          if (object.name.includes('PHARMACOLOGY_ENCLOSED_BRIDGE') || object.name.includes('MEDICAL_SECURE_COURIER_BRIDGE')) continue;
          const radius = Math.hypot(point.x, point.z);
          const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
          if (radius < definition.sector.innerRadius - 0.25 || radius > definition.sector.outerRadius + 0.25 || angle < definition.sector.startAngle - 0.012 || angle > definition.sector.endAngle + 0.012) {
            boundaryViolations.push({ code: facility.userData.buildingCode, feature: object.name, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
          }
        }
      });
      facilityBoxes.push({ code: facility.userData.buildingCode, name: facility.userData.buildingName, min: min.toArray(), max: max.toArray() });
    });
    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) {
      const a = facilityBoxes[left];
      const b = facilityBoxes[right];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.18 && overlapZ > 0.18) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }
    const routeNames = ['TOXICOLOGY__DOSE_RESPONSE_PROMENADE', ...Array.from({ length: 5 }, (_, index) => `TOXICOLOGY__BUILDING_APPROACH_T${index + 1}`)];
    const routeAudit = routeNames.map((name) => {
      const route = district.getObjectByName(name);
      return { name, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true };
    });
    const serviceRouteAudit = ['TOXICOLOGY__RESTRICTED_OUTER_SERVICE_ROAD', 'TOXICOLOGY__SEALED_SAMPLE_COURIER_LANE', 'TOXICOLOGY__MERIDIAN_EMERGENCY_ACCESS_AVENUE'].map((name) => {
      const route = district.getObjectByName(name);
      return { name, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true };
    });
    const walkRoute = district.getObjectByName('TOXICOLOGY__DOSE_RESPONSE_PROMENADE');
    const positions = walkRoute.geometry.attributes.position;
    const pair = Math.floor((positions.count / 2 - 4) * 0.30) * 2;
    const roadPoint = world.camera.position.clone().fromBufferAttribute(positions, pair).add(world.camera.position.clone().fromBufferAttribute(positions, pair + 1)).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    const nextPair = Math.min(pair + 10, positions.count - 2);
    const roadNext = world.camera.position.clone().fromBufferAttribute(positions, nextPair).add(world.camera.position.clone().fromBufferAttribute(positions, nextPair + 1)).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation();
    const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const count = (expression) => names.filter((name) => expression.test(name)).length;
    const signatureCounts = {
      exposureRings: count(/^TOXICOLOGY__T1__EXPOSURE_TIMESCALE_RING_\d+$/),
      samplingInstruments: count(/^TOXICOLOGY__T1__SAMPLING_CROWN_INSTRUMENT_\d+$/),
      crescentSystems: count(/^TOXICOLOGY__T2__CRESCENT_SYSTEM_\d+$/),
      capillaryColumns: count(/^TOXICOLOGY__T2__CAPILLARY_COLUMN_\d+$/),
      mimesisServiceSpines: count(/^TOXICOLOGY__T2__DARK_RESTRICTED_SERVICE_SPINE$/),
      mimesisLanternDecks: count(/^TOXICOLOGY__T2__ROOF_LANTERN_SUPPORT_DECK_\d+$/),
      mimesisLanternDeckColumns: count(/^TOXICOLOGY__T2__ROOF_LANTERN_DECK_COLUMN_\d+_\d+$/),
      mimesisTowerBaseFlanges: count(/^TOXICOLOGY__T2__AIR_MONITORING_TOWER_BASE_FLANGE_\d+$/),
      causalPrisms: count(/^TOXICOLOGY__T3__CAUSAL_PRISM_TOWER_\d+$/),
      assayPanels: count(/^TOXICOLOGY__T3__ASSAY_TRANSFER_PANEL_\d+$/),
      bastionSegments: count(/^TOXICOLOGY__T4__CONTAINMENT_BASTION_SEGMENT_\d+$/),
      filtrationTowers: count(/^TOXICOLOGY__T4__FILTRATION_TOWER_\d+$/),
      toxicokineticWings: count(/^TOXICOLOGY__T5__TOXICOKINETIC_WING_\d+_[A-Z]+$/),
      decontaminationCanopies: count(/^TOXICOLOGY__T5__DECONTAMINATION_CANOPY_\d+$/),
    };
    const compactState = JSON.parse(window.render_game_to_text());
    const deepState = world.getTextSnapshot();
    const streaming = world.worldStreaming.getSnapshot();
    const result = {
      program: district.userData.toxicologyLabsDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort(),
      meshCount,
      triangles,
      uniqueNames: new Set(names).size,
      materialNames: [...materialNames].sort(),
      animations: Object.fromEntries(animations),
      signatureCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)),
      boundaryViolations,
      overlaps,
      facilityBoxes,
      routeAudit,
      serviceRouteAudit,
      roadPoint: roadPoint.toArray(),
      roadNext: roadNext.toArray(),
      roadGround,
      compactDistrict: compactState.toxicologyLabsDistrict,
      compactSelected: compactState.selected,
      deepDistrict: deepState.toxicologyLabsDistrict,
      specializedRevision: deepState.masterplan?.specializedDistrictLayoutRevision,
      planning: deepState.planning,
      streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
    restoreAuthority?.();
    return result;
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangles: audit.triangles, signatureCounts: audit.signatureCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 10) }, null, 2));
  if (audit.facilityCount !== 5 || audit.codes.join(',') !== 'T1,T2,T3,T4,T5') throw new Error(`Toxicology facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Toxicology roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 650 || audit.uniqueNames < audit.meshCount * 0.94) throw new Error(`Toxicology exterior detail is too sparse or nondeterministic: meshes=${audit.meshCount}, names=${audit.uniqueNames}`);
  if (audit.triangles > 250_000) throw new Error(`Toxicology triangle budget exceeded: ${audit.triangles}`);
  if (audit.boundaryViolations.length) throw new Error(`Toxicology facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Toxicology facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.some((route) => !route.resident || !route.walkable) || audit.serviceRouteAudit.some((route) => !route.resident || route.walkable) || audit.roadGround === null) throw new Error(`Toxicology circulation is incomplete: ${JSON.stringify({ public: audit.routeAudit, restricted: audit.serviceRouteAudit, ground: audit.roadGround })}`);
  if (audit.compactDistrict?.buildingCount !== 5 || audit.compactDistrict?.circulation?.primaryRoute !== 'TOXICOLOGY__DOSE_RESPONSE_PROMENADE' || audit.compactDistrict?.lightingProtocol?.radioactiveLimeWash !== false) throw new Error('Toxicology metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 5 || audit.population?.doseMechanismCountermeasureNarrative !== true || audit.specializedRevision !== 27 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0 || audit.compactSelected?.packageId !== districtId) throw new Error('Toxicology integration metadata regressed');
  const expectedCounts = { exposureRings: 5, samplingInstruments: 32, crescentSystems: 3, capillaryColumns: 18, mimesisServiceSpines: 1, mimesisLanternDecks: 2, mimesisLanternDeckColumns: 12, mimesisTowerBaseFlanges: 8, causalPrisms: 3, assayPanels: 96, bastionSegments: 7, filtrationTowers: 7, toxicokineticWings: 4, decontaminationCanopies: 3 };
  for (const [key, expected] of Object.entries(expectedCounts)) if (audit.signatureCounts[key] !== expected) throw new Error(`Expected ${expected} ${key}, found ${audit.signatureCounts[key]}`);
  for (const materialName of ['Toxicology immaculate pale technical ceramic', 'Toxicology pale ultra-high-performance concrete', 'Toxicology graphite containment metal', 'Toxicology dark basalt armour composite', 'Toxicology tensioned satin titanium', 'Toxicology electrochromic graphite glass', 'Dose Response Promenade pale sealed paving', 'Toxicology limited amber status light']) if (!audit.materialNames.includes(materialName)) throw new Error(`Missing material: ${materialName}`);

  const districtBounds = {
    min: [0, 1, 2].map((axis) => Math.min(...audit.facilityBoxes.map((entry) => entry.min[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...audit.facilityBoxes.map((entry) => entry.max[axis]))),
  };
  await page.evaluate(() => {
    const world = window.labIsland;
    world.selectionBox.visible = false;
    world.selectionBox.material.visible = false;
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer').forEach((element) => element.setAttribute('style', 'display:none'));
  });
  const prepareView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan, districtBounds }) => {
      const world = window.labIsland;
      const min = world.camera.position.clone().fromArray(districtBounds.min);
      const max = world.camera.position.clone().fromArray(districtBounds.max);
      const center = min.clone().add(max).multiplyScalar(0.5);
      const size = max.clone().sub(min);
      world.select(districtId, 'scene');
      world.setMode('explore');
      world.setTimeOfDay(time);
      world.setWeather('clear');
      world.cameraTween = null;
      world.selectionBox.visible = false;
      if (plan) {
        const extent = Math.max(size.z, size.x / world.camera.aspect);
        const altitude = extent * 0.64 / Math.tan(world.camera.fov * Math.PI / 360);
        world.camera.up.set(0, 0, -1);
        world.camera.position.set(center.x, Math.max(altitude, 88), center.z + 0.001);
        world.controls.target.set(center.x, 0, center.z);
      } else {
        world.camera.up.set(0, 1, 0);
        world.camera.position.set(center.x - size.x * 0.72, center.y + Math.max(size.x, size.z) * 0.38, center.z + size.z * 0.78);
        world.controls.target.copy(center).setY(3.6);
      }
      world.controls.update();
      world.advanceTime(1_200);
      world.selectionBox.visible = false;
      world.selectionBox.material.visible = false;
    }, { districtId, time, plan, districtBounds });
    await page.waitForTimeout(300);
  };
  await prepareView('noon');
  await page.screenshot({ path: `${OUTPUT}/toxicology-overview.png` });
  await prepareView('noon', true);
  await page.screenshot({ path: `${OUTPUT}/toxicology-plan.png` });
  await prepareView('night');
  await page.screenshot({ path: `${OUTPUT}/toxicology-night.png` });
  for (let index = 1; index <= 5; index += 1) {
    const code = `T${index}`;
    const facilityBounds = audit.facilityBoxes.find((entry) => entry.code === code);
    await page.evaluate(({ districtId, code, facilityBounds }) => {
      const world = window.labIsland;
      const min = world.camera.position.clone().fromArray(facilityBounds.min);
      const max = world.camera.position.clone().fromArray(facilityBounds.max);
      const center = min.clone().add(max).multiplyScalar(0.5);
      const size = max.clone().sub(min);
      const distance = Math.max(size.x, size.z) * 1.08 + size.y * 0.82;
      world.select(districtId, 'scene');
      world.setMode('explore');
      world.setTimeOfDay(code === 'T2' ? 'noon' : 'night');
      world.setWeather('clear');
      world.cameraTween = null;
      world.selectionBox.visible = false;
      world.camera.up.set(0, 1, 0);
      world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.38, center.z + distance * 0.72);
      world.controls.target.copy(center);
      world.controls.update();
      world.advanceTime(900);
      world.selectionBox.visible = false;
      world.selectionBox.material.visible = false;
    }, { districtId, code, facilityBounds });
    await page.waitForTimeout(180);
    await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }
  await page.evaluate((districtId) => {
    const world = window.labIsland;
    const mimesis = world.scene.getObjectByName('TOXICOLOGY__T2__MIMESIS');
    if (!mimesis) throw new Error('MIMESIS is unavailable for the rear-service visual audit');
    mimesis.updateMatrixWorld(true);
    const cameraPosition = world.camera.position.clone().set(0, 6.4, -20.5).applyMatrix4(mimesis.matrixWorld);
    const target = world.camera.position.clone().set(0, 1.9, -3.7).applyMatrix4(mimesis.matrixWorld);
    world.select(districtId, 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.cameraTween = null;
    world.selectionBox.visible = false;
    world.camera.up.set(0, 1, 0);
    world.camera.position.copy(cameraPosition);
    world.controls.target.copy(target);
    world.controls.update();
    world.advanceTime(900);
    world.selectionBox.visible = false;
    world.selectionBox.material.visible = false;
  }, districtId);
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${OUTPUT}/t2-rear-service-facade.png` });
  const walkAudit = await page.evaluate(({ roadPoint, roadNext }) => {
    const world = window.labIsland;
    const preferred = world.camera.position.clone().fromArray(roadPoint);
    const next = world.camera.position.clone().fromArray(roadNext);
    const heading = next.clone().sub(preferred).setY(0).normalize();
    world.setMode('walk');
    world.setTimeOfDay('night');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    world.walkController.enter(preferred, heading, preferred);
    const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true);
    world.advanceTime(900);
    world.setWalkIntent(0, 0);
    const end = world.camera.position.clone();
    const walk = world.walkController.getSnapshot();
    return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint, roadNext: audit.roadNext });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Dose-Response Promenade traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/dose-response-promenade-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangles: audit.triangles, routeCount: audit.routeAudit.length + audit.serviceRouteAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
