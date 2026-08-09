import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ELECTRONICS_DISTRICT_OUTPUT ?? 'output/electronics-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'electronics-microelectronics-labs';
const requiredRoots = [
  'ELECTRONICS__EL1__FABRICA_ANGSTROM',
  'ELECTRONICS__EL2__INTERPOSER_EXCHANGE',
  'ELECTRONICS__EL3__LUMEN_WEAVE_INSTITUTE',
  'ELECTRONICS__EL4__KELVIN_NULL_CENTER',
  'ELECTRONICS__EL5__SYNAPTIC_STACK_LABORATORY',
  'ELECTRONICS__EL6__SPIN_ORBIT_VAULT',
  'ELECTRONICS__EL7__AEGIS_POWER_BASTION',
  'ELECTRONICS__EL8__TERAHERTZ_METROLOGY_SPIRE',
  'ELECTRONICS__EL9__ADAPTIVE_SKIN_PAVILION',
  'ELECTRONICS__EL10__SENSORIUM_HIVE',
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
    if (!district || !definition?.sector) throw new Error('Electronics Labs District is unavailable');
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
      const a = facilityBoxes[left]; const b = facilityBoxes[right];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.18 && overlapZ > 0.18) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }
    const routeNames = ['ELECTRONICS__SIGNAL_SPINE', ...Array.from({ length: 10 }, (_, index) => `ELECTRONICS__BUILDING_APPROACH_EL${index + 1}`)];
    const routes = routeNames.map((name) => world.scene.getObjectByName(name));
    const serviceRoutes = ['ELECTRONICS__BACKSIDE_POWER_DELIVERY_SERVICE_ARC', 'ELECTRONICS__AUTOMATED_MATERIAL_TRANSFER_ARC'].map((name) => world.scene.getObjectByName(name));
    const walkRoute = routes[0];
    const positions = walkRoute.geometry.attributes.position;
    const pair = Math.floor((positions.count / 2 - 5) * 0.56) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair);
    const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1));
    const roadNext = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation();
    const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const textState = JSON.parse(window.render_game_to_text());
    const deepState = world.getTextSnapshot();
    const streaming = world.worldStreaming.getSnapshot();
    const expressions = {
      gateLoops: /^ELECTRONICS__EL1__STRUCTURAL_GATE_LOOP_\d+_CROWN$/,
      chiplets: /^ELECTRONICS__EL2__SPECIALIZED_CHIPLET_VOLUME_\d+$/,
      lumenWingSegments: /^ELECTRONICS__EL3__(?:WEST|EAST)_CURVED_GLASS_SEGMENT_\d+$/,
      kelvinShells: /^ELECTRONICS__EL4__(?:OUTER_THERMAL_BOUNDARY|SECOND_BLACK_THERMAL_BOUNDARY|INNER_VACUUM_FLASK_TOWER)$/,
      synapticWings: /^ELECTRONICS__EL5__DENDRITIC_BASE_WING_\d+$/,
      spinMoireFins: /^ELECTRONICS__EL6__MOIRE_MAGNETIC_FACADE_FIN_\d+$/,
      aegisHeatSinkFins: /^ELECTRONICS__EL7__HEAT_SINK_CERAMIC_FIN_[NS]_\d+$/,
      terahertzFacets: /^ELECTRONICS__EL8__TRIANGULAR_SHIELDING_FACET_\d+$/,
      adaptiveMembranes: /^ELECTRONICS__EL9__THERMORESPONSIVE_MEMBRANE_FIELD_\d+$/,
      sensoriumVolumes: /^ELECTRONICS__EL10__SENSING_MODALITY_VOLUME_\d+$/,
      bondPads: /^ELECTRONICS__ENLARGED_BOND_PAD_PLAZA_\d+$/,
      undercroftCuts: /^ELECTRONICS__GLASS_COVERED_UTILITY_UNDERCROFT_CUT_\d+$/,
    };
    const signatureCounts = Object.fromEntries(Object.entries(expressions).map(([key, expression]) => [key, names.filter((name) => expression.test(name)).length]));
    const result = {
      program: district.userData.electronicsLabsDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(2)) - Number(right.slice(2))),
      meshCount, triangles, uniqueNames: new Set(names).size, materialNames: [...materialNames].sort(), animations: Object.fromEntries(animations), signatureCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)), boundaryViolations, overlaps, facilityBoxes,
      routeAudit: routes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })),
      serviceRouteAudit: serviceRoutes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })),
      roadPoint: roadPoint.toArray(), roadNext: roadNext.toArray(), roadGround,
      textDistrict: textState.electronicsLabsDistrict,
      selected: textState.selected,
      specializedRevision: deepState.masterplan?.specializedDistrictLayoutRevision,
      deepDistrict: deepState.electronicsLabsDistrict,
      planning: deepState.planning,
      streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
    restoreAuthority?.();
    return result;
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangles: audit.triangles, animations: audit.animations, signatureCounts: audit.signatureCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 20) }, null, 2));
  if (audit.facilityCount !== 10 || audit.codes.join(',') !== 'EL1,EL2,EL3,EL4,EL5,EL6,EL7,EL8,EL9,EL10') throw new Error(`Electronics facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Electronics roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 1000 || audit.uniqueNames < audit.meshCount * 0.94) throw new Error(`Electronics exterior detail is too sparse or nondeterministic: meshes=${audit.meshCount}, names=${audit.uniqueNames}`);
  if (audit.triangles > 300_000) throw new Error(`Electronics triangle budget exceeded: ${audit.triangles}`);
  if (audit.boundaryViolations.length) throw new Error(`Electronics facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Electronics facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.length !== 11 || audit.routeAudit.some((route) => !route.resident || !route.walkable) || audit.serviceRouteAudit.some((route) => !route.resident || route.walkable) || audit.roadGround === null) throw new Error(`Signal Spine circulation is incomplete: ${JSON.stringify({ routes: audit.routeAudit, service: audit.serviceRouteAudit, ground: audit.roadGround })}`);
  if (audit.textDistrict?.buildingCount !== 10 || audit.textDistrict?.circulation?.primaryRoute !== 'ELECTRONICS__SIGNAL_SPINE' || audit.textDistrict?.signatureSystems?.sensoriumSensingVolumes !== 12 || audit.textDistrict?.lightingProtocol?.broadFacadeWash !== false) throw new Error('Electronics metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.semiconductorEcosystemNarrative !== true || audit.population?.signalSpineWalkable !== true || audit.specializedRevision !== 27 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0 || audit.selected?.packageId !== districtId) throw new Error('Electronics integration metadata regressed');
  const expectedCounts = { gateLoops: 8, chiplets: 8, lumenWingSegments: 26, kelvinShells: 3, synapticWings: 3, spinMoireFins: 72, aegisHeatSinkFins: 60, terahertzFacets: 72, adaptiveMembranes: 3, sensoriumVolumes: 12, bondPads: 10, undercroftCuts: 10 };
  for (const [key, expected] of Object.entries(expectedCounts)) if (audit.signatureCounts[key] !== expected) throw new Error(`Expected ${expected} ${key}, found ${audit.signatureCounts[key]}`);
  for (const materialName of ['Electronics graphite technical ceramic', 'Electronics pale technical porcelain', 'Electronics satin titanium', 'Electronics oxidized copper service alloy', 'Electronics anti-reflective black research glass', 'Electronics iridescent photonic coating', 'Electronics translucent fluoropolymer membrane', 'Signal Spine pale technical stone']) if (!audit.materialNames.includes(materialName)) throw new Error(`Missing material: ${materialName}`);

  const districtBounds = { min: [0, 1, 2].map((axis) => Math.min(...audit.facilityBoxes.map((entry) => entry.min[axis]))), max: [0, 1, 2].map((axis) => Math.max(...audit.facilityBoxes.map((entry) => entry.max[axis]))) };
  await page.evaluate(() => { const world = window.labIsland; world.clearSelection('system'); world.selectionBox.material.visible = false; document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan, districtBounds }) => {
      const world = window.labIsland; const min = world.camera.position.clone().fromArray(districtBounds.min); const max = world.camera.position.clone().fromArray(districtBounds.max); const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min);
      world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 100), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.58, center.y + Math.max(size.x, size.z) * 0.34, center.z + size.z * 0.74); world.controls.target.copy(center).setY(4.4); }
      world.controls.update(); world.advanceTime(1_200); world.selectionBox.visible = false; world.selectionBox.material.visible = false;
    }, { districtId, time, plan, districtBounds });
    await page.waitForTimeout(300);
  };
  await prepareView('noon'); await page.screenshot({ path: `${OUTPUT}/electronics-overview.png` });
  await prepareView('noon', true); await page.screenshot({ path: `${OUTPUT}/electronics-plan.png` });
  await prepareView('night'); await page.screenshot({ path: `${OUTPUT}/electronics-night.png` });
  for (let index = 1; index <= 10; index += 1) {
    const code = `EL${index}`; const facilityBounds = audit.facilityBoxes.find((entry) => entry.code === code);
    await page.evaluate(({ districtId, code, facilityBounds }) => {
      const world = window.labIsland; const min = world.camera.position.clone().fromArray(facilityBounds.min); const max = world.camera.position.clone().fromArray(facilityBounds.max); const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.12 + size.y * 0.82;
      world.select(districtId, 'scene'); world.setMode('explore'); world.setTimeOfDay(['EL2', 'EL3', 'EL5', 'EL6', 'EL8', 'EL10'].includes(code) ? 'night' : 'noon'); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false; world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.4, center.z + distance * 0.72); world.controls.target.copy(center); world.controls.update(); world.advanceTime(900); world.selectionBox.visible = false; world.selectionBox.material.visible = false;
    }, { districtId, code, facilityBounds });
    await page.waitForTimeout(180); await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }
  const walkAudit = await page.evaluate(({ roadPoint, roadNext }) => {
    const world = window.labIsland; const next = world.camera.position.clone().set(roadNext[0], roadNext[1], roadNext[2]); world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const preferred = world.camera.position.clone().set(roadPoint[0], roadPoint[1], roadPoint[2]); const heading = next.clone().sub(preferred).setY(0).normalize(); world.walkController.enter(preferred, heading, preferred); const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot(); return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint, roadNext: audit.roadNext });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Signal Spine traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/signal-spine-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, triangles: audit.triangles, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
