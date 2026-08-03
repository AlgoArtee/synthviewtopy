import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.PARTICLE_PHYSICS_DISTRICT_OUTPUT ?? 'output/particle-physics-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'particle-physics-labs';
const requiredRoots = [
  'PARTICLE__P1__CONVENTUS_ORBIS',
  'PARTICLE__P2__CHRONOS_RELAY',
  'PARTICLE__P3__EVENT_LOOM',
  'PARTICLE__P4__SCALARIS',
  'PARTICLE__P5__CHROMODYNAMIC_COURT',
  'PARTICLE__P6__OSCILLA',
  'PARTICLE__P7__ASYMMETRY_HOUSE',
  'PARTICLE__P8__NOCTIS',
  'PARTICLE__P9__SYMMETRIA',
  'PARTICLE__P10__QUANTUM_SILENCE_PAVILION',
  'PARTICLE__P11__LATTICE_CITADEL',
  'PARTICLE__P12__AMPLITUHEDRON_HOUSE',
  'PARTICLE__P13__RENORMALIZATION_TOWER',
  'PARTICLE__P14__GENESIS_SPIRAL',
  'PARTICLE__P15__SIGNAL_COAST_ARCHIVE',
];
const requiredSignatures = [
  'PARTICLE__P1__INTERACTION_COURT_RADIAL_GRID',
  'PARTICLE__P1__HALL_SCALE_ARC_SECTOR_1_BAND_1',
  'PARTICLE__P1__V_PYLON_1_RING_BEARING_SHOE',
  'PARTICLE__P1__KINETIC_COLLISION_EVENT_SCULPTURE',
  'PARTICLE__P2__WAVEFORM_CERAMIC_FIN_FIELD',
  'PARTICLE__P2__SYMMETRIC_BLACK_METAL_CROWN',
  'PARTICLE__P3__RECESSED_SIGNAL_PIXEL_FIELD',
  'PARTICLE__P3__MONUMENTAL_ABSTRACT_EVENT_DISPLAY',
  'PARTICLE__P4__PEARLESCENT_HIGGS_CUBE',
  'PARTICLE__P4__OFF_CENTER_DICHROIC_FIELD_SLIT',
  'PARTICLE__P5__FORCE_NETWORK_CABLE_1',
  'PARTICLE__P6__GEOMETRIC_MOIRE_SCREEN_1',
  'PARTICLE__P7__DECAY_TREE_ENTRANCE_CANOPY',
  'PARTICLE__P8__FAINT_DARK_SECTOR_SIGNAL_TRACE',
  'PARTICLE__P9__CENTRAL_SYMMETRY_CYLINDER',
  'PARTICLE__P10__ENORMOUS_TAPERED_FLOATING_ROOF',
  'PARTICLE__P11__STEPPED_COMPUTATIONAL_LATTICE',
  'PARTICLE__P12__TRIANGULAR_ENTRANCE_VOID_COLUMNS',
  'PARTICLE__P13__LUMINOUS_POLYHEDRAL_DISTRICT_BEACON',
  'PARTICLE__P14__ARCHITECTURAL_COSMOLOGY_OCULUS',
  'PARTICLE__P15__FORTIFIED_BASALT_STORM_BARRIER_BASE',
  'PARTICLE__P15__LANDWARD_ARCHIVE_E_PAPER_FIELD',
];

await mkdir(`${OUTPUT}/facilities`, { recursive: true });
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
    localStorage.removeItem('youtopy_full_island_detail');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.advanceTime(300));
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots, requiredSignatures }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Particle Physics Labs District is unavailable');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({ cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(18), mode: 'explore', selectedPackageId: districtId, interiorPackageId: null, force: true });
    const restoreAuthority = world.worldStreaming.mountPackageAuthoritySources(districtId);
    if (!restoreAuthority) throw new Error('Particle Physics package authority could not be mounted for audit');
    district.updateMatrixWorld(true);

    const facilities = [];
    const allNames = [];
    const materialNames = new Set();
    const animations = new Map();
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) allNames.push(object.name);
      if (Array.isArray(object.userData.instanceNames)) allNames.push(...object.userData.instanceNames);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const profile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (profile) animations.set(profile, (animations.get(profile) ?? 0) + Number(object.userData.authoredAnimationCount ?? object.userData.authoredInstanceCount ?? 1));
      if (!object.isMesh) return;
      meshCount += Number(object.userData.authoredInstanceCount ?? 1);
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
      const corners = [];
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        const appendCorners = (matrix) => {
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            const point = world.camera.position.clone().set(x, y, z).applyMatrix4(matrix);
            min.min(point); max.max(point); corners.push(point);
          }
        };
        if (object.isInstancedMesh) {
          const instanceMatrix = object.matrix.clone();
          for (let index = 0; index < object.count; index += 1) { object.getMatrixAt(index, instanceMatrix); appendCorners(object.matrixWorld.clone().multiply(instanceMatrix)); }
        } else appendCorners(object.matrixWorld);
      });
      facilityBoxes.push({ code: facility.userData.buildingCode, name: facility.userData.buildingName, min: min.toArray(), max: max.toArray(), center: min.clone().add(max).multiplyScalar(0.5).toArray(), size: max.clone().sub(min).toArray() });
      corners.forEach((point) => {
        const radius = Math.hypot(point.x, point.z);
        const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
        if (radius < definition.sector.innerRadius - 0.25 || radius > definition.sector.outerRadius + 0.25 || angle < definition.sector.startAngle - 0.012 || angle > definition.sector.endAngle + 0.012) boundaryViolations.push({ code: facility.userData.buildingCode, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
      });
    });

    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) {
      const a = facilityBoxes[left]; const b = facilityBoxes[right];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.2 && overlapZ > 0.2) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }

    const routeNames = [
      'PARTICLE__EVENT_TRACK_PROMENADE',
      'PARTICLE__THEORY_RIDGE_PATH',
      'PARTICLE__DATA_COAST_SERVICE_ROAD',
      'PARTICLE__PROBABILITY_FIELD_SPINE',
      ...Array.from({ length: 4 }, (_, index) => `PARTICLE__CURVED_OPERATIONAL_LINK_${index + 1}`),
      ...Array.from({ length: 15 }, (_, index) => `PARTICLE__BUILDING_APPROACH_P${index + 1}`),
    ];
    const roads = routeNames.map((name) => district.getObjectByName(name));
    const conventus = district.getObjectByName('PARTICLE__P1__CONVENTUS_ORBIS');
    const hallBands = [];
    const pylonLegs = [];
    const bearingShoes = [];
    const cardinalNodes = [];
    const cardinalBridges = [];
    conventus?.traverse((object) => {
      if (object.userData.habitableHallSector === true) hallBands.push(object);
      if (/PARTICLE__P1__.+_V_PYLON_\d+_LEG_[AB]$/.test(object.name)) pylonLegs.push(object);
      if (object.userData.ringBearing === true) bearingShoes.push(object);
      if (/PARTICLE__P1__CARDINAL_INTERACTION_NODE_\d+$/.test(object.name)) cardinalNodes.push(object);
      if (/PARTICLE__P1__HABITABLE_LUMINOUS_BRIDGE_\d+$/.test(object.name)) cardinalBridges.push(object);
    });
    const lowerHallBands = hallBands.filter((object) => /_BAND_1$/.test(object.name));
    const actualRingUndersideY = lowerHallBands.length
      ? Math.min(...lowerHallBands.map((object) => object.position.y - Number(object.geometry?.parameters?.tube ?? 0) * object.scale.z))
      : null;
    const minimumHallDepthMetres = hallBands.length
      ? Math.min(...hallBands.map((object) => Number(object.geometry?.parameters?.tube ?? 0) * 2 * Math.min(object.scale.x, object.scale.y) * 10))
      : 0;
    const structure = conventus?.userData.conventusOrbisStructure ?? null;
    const bearingEllipseErrors = bearingShoes.map((shoe) => Math.abs(Math.hypot(
      shoe.position.x / Number(structure?.supportApexRadiusX ?? 1),
      shoe.position.z / Number(structure?.supportApexRadiusZ ?? 1),
    ) - 1));
    const normalizedAngleError = (actual, expected) => Math.abs(Math.atan2(Math.sin(actual - expected), Math.cos(actual - expected)));
    const bearingSectorAngleErrors = bearingShoes.map((shoe) => {
      const index = Number(shoe.name.match(/V_PYLON_(\d+)_/)?.[1] ?? 0) - 1;
      return normalizedAngleError(Math.atan2(shoe.position.z, shoe.position.x), index * Math.PI / 6 + Math.PI / 12);
    });
    const nodeRadii = cardinalNodes.map((node) => Math.hypot(node.position.x, node.position.z));
    const nodeAngleErrors = cardinalNodes.map((node) => {
      const index = Number(node.name.match(/NODE_(\d+)$/)?.[1] ?? 0) - 1;
      return normalizedAngleError(Math.atan2(node.position.z, node.position.x), index * Math.PI / 2);
    });
    const bridgeLengths = cardinalBridges.map((bridge) => Math.max(bridge.scale.x, bridge.scale.z));
    const bandRadii = hallBands.map((band) => band.scale.x);
    const promenade = roads[0];
    const positions = promenade.geometry.attributes.position;
    const pair = Math.floor(positions.count / 8) * 2;
    const roadPoint = world.camera.position.clone().fromBufferAttribute(positions, pair).add(world.controls.target.clone().fromBufferAttribute(positions, pair + 1)).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    const nextPair = Math.min(positions.count - 2, pair + 12);
    const roadNextPoint = world.camera.position.clone().fromBufferAttribute(positions, nextPair).add(world.controls.target.clone().fromBufferAttribute(positions, nextPair + 1)).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    world.walkController.refreshNavigation();
    const textState = world.getTextSnapshot();
    const snapshot = world.worldStreaming.getSnapshot();
    const result = {
      program: district.userData.particlePhysicsLabsDistrict,
      population: district.userData.population,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
      facilityCount: facilities.length,
      meshCount,
      uniqueNames: new Set(allNames).size,
      materialNames: [...materialNames].sort(),
      animations: Object.fromEntries(animations),
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)),
      missingSignatures: requiredSignatures.filter((name) => !district.getObjectByName(name)),
      retiredAcceleratorObjects: allNames.filter((name) => /ACCELERATOR|BEAM_HALL|MAGNET_HALL|SUPERCONDUCTING_MAGNET|LIQUID_HELIUM/i.test(name)),
      facilityBoxes,
      overlaps,
      boundaryViolations,
      conventusStructure: {
        metadata: structure,
        hallBandCount: hallBands.length,
        pylonLegCount: pylonLegs.length,
        bearingShoeCount: bearingShoes.length,
        minimumHallDepthMetres,
        actualRingUndersideY,
        maximumBearingVerticalOffset: actualRingUndersideY === null || !bearingShoes.length ? null : Math.max(...bearingShoes.map((shoe) => Math.abs(shoe.position.y - actualRingUndersideY))),
        maximumBearingEllipseError: bearingEllipseErrors.length ? Math.max(...bearingEllipseErrors) : null,
        maximumBearingSectorAngleError: bearingSectorAngleErrors.length ? Math.max(...bearingSectorAngleErrors) : null,
        maximumBandCircularScaleError: hallBands.length ? Math.max(...hallBands.map((band) => Math.abs(band.scale.x - band.scale.y))) : null,
        bandRadiusSpread: bandRadii.length ? Math.max(...bandRadii) - Math.min(...bandRadii) : null,
        cardinalNodeCount: cardinalNodes.length,
        cardinalNodeRadiusSpread: nodeRadii.length ? Math.max(...nodeRadii) - Math.min(...nodeRadii) : null,
        maximumCardinalNodeAngleError: nodeAngleErrors.length ? Math.max(...nodeAngleErrors) : null,
        cardinalBridgeLengthSpread: bridgeLengths.length ? Math.max(...bridgeLengths) - Math.min(...bridgeLengths) : null,
      },
      routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })),
      roadPoint: roadPoint.toArray(),
      roadNextPoint: roadNextPoint.toArray(),
      roadGround: world.walkController.sampleGround(roadPoint.x, roadPoint.z),
      textDistrict: textState.particlePhysicsLabsDistrict,
      specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision,
      planning: textState.planning,
      streaming: snapshot.packages.find((entry) => entry.id === districtId) ?? null,
    };
    restoreAuthority();
    return result;
  }, { districtId, requiredRoots, requiredSignatures });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, uniqueNames: audit.uniqueNames, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 10), conventusStructure: audit.conventusStructure, animations: audit.animations }, null, 2));
  if (audit.facilityCount !== 15 || audit.codes.join(',') !== 'P1,P2,P3,P4,P5,P6,P7,P8,P9,P10,P11,P12,P13,P14,P15') throw new Error(`Particle Physics facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length || audit.missingSignatures.length) throw new Error(`Missing Particle Physics authored geometry: ${[...audit.missingRoots, ...audit.missingSignatures].join(', ')}`);
  if (audit.retiredAcceleratorObjects.length) throw new Error(`Retired accelerator objects remain: ${audit.retiredAcceleratorObjects.join(', ')}`);
  if (audit.meshCount < 700 || audit.uniqueNames < 680) throw new Error(`Particle Physics exterior detail is too sparse: ${audit.meshCount} meshes / ${audit.uniqueNames} names`);
  if (audit.boundaryViolations.length) throw new Error(`Particle Physics facilities cross their sector: ${JSON.stringify(audit.boundaryViolations.slice(0, 12))}`);
  if (audit.overlaps.length) throw new Error(`Particle Physics facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.conventusStructure.hallBandCount !== 36
    || audit.conventusStructure.pylonLegCount !== 24
    || audit.conventusStructure.bearingShoeCount !== 12
    || audit.conventusStructure.minimumHallDepthMetres < 30
    || audit.conventusStructure.maximumBearingVerticalOffset > 0.06
    || audit.conventusStructure.maximumBearingEllipseError > 0.002
    || audit.conventusStructure.maximumBearingSectorAngleError > 0.000001
    || audit.conventusStructure.maximumBandCircularScaleError > 0.000001
    || audit.conventusStructure.bandRadiusSpread > 0.000001
    || audit.conventusStructure.cardinalNodeCount !== 4
    || audit.conventusStructure.cardinalNodeRadiusSpread > 0.000001
    || audit.conventusStructure.maximumCardinalNodeAngleError > 0.000001
    || audit.conventusStructure.cardinalBridgeLengthSpread > 0.000001
    || audit.conventusStructure.metadata?.supportPairCount !== 12
    || audit.conventusStructure.metadata?.circularPlan !== true) {
    throw new Error(`Conventus Orbis ring/support geometry regressed: ${JSON.stringify(audit.conventusStructure)}`);
  }
  if (audit.routeAudit.length !== 23 || audit.routeAudit.some((route) => !route.resident || !route.walkable) || audit.roadGround === null) throw new Error(`Particle Physics circulation is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 15 || audit.textDistrict?.zones?.northernTheoryRidge?.length !== 3 || audit.textDistrict?.exclusions?.length !== 4) throw new Error('Particle Physics metadata is absent from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 15 || audit.population?.surfaceFacilitiesOnly !== true || audit.population?.performanceAuthored !== true) throw new Error('Particle Physics population/performance metadata is incomplete');
  if (audit.specializedRevision !== 12 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Particle Physics integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['particle-physics-emissive-pulse'] ?? 0) < 80 || (audit.animations['particle-physics-rotation'] ?? 0) < 4) throw new Error(`Particle Physics animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);

  const overallMin = [0, 1, 2].map((axis) => Math.min(...audit.facilityBoxes.map((entry) => entry.min[axis])));
  const overallMax = [0, 1, 2].map((axis) => Math.max(...audit.facilityBoxes.map((entry) => entry.max[axis])));
  const overallCenter = overallMin.map((value, axis) => (value + overallMax[axis]) * 0.5);
  const overallSize = overallMax.map((value, axis) => value - overallMin[axis]);
  const capture = async (name, mode, time, heightScale, distanceScale) => {
    await page.evaluate(({ mode, time, heightScale, distanceScale, overallCenter, overallSize }) => {
      const world = window.labIsland;
      const center = world.controls.target.clone().set(...overallCenter);
      const radius = Math.max(overallSize[0], overallSize[2]);
      world.setMode(mode);
      world.setTimeOfDay(time);
      world.setWeather('clear');
      world.setLayer('labels', false);
      if (mode === 'plan') {
        world.camera.position.set(center.x, center.y + radius * heightScale, center.z + 0.001);
        world.camera.up.set(0, 0, -1);
      } else {
        world.camera.position.set(center.x + radius * distanceScale, center.y + radius * heightScale, center.z + radius * distanceScale * 0.78);
        world.camera.up.set(0, 1, 0);
      }
      world.camera.lookAt(center); world.controls.target.copy(center); world.controls.update(); world.advanceTime(800);
    }, { mode, time, heightScale, distanceScale, overallCenter, overallSize });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUTPUT}/${name}.png` });
  };
  await capture('district-overview-day', 'explore', 'noon', 0.72, 0.72);
  await capture('district-plan-day', 'plan', 'noon', 1.32, 0);
  await capture('district-overview-night', 'explore', 'night', 0.52, 0.66);

  for (const record of audit.facilityBoxes) {
    await page.evaluate(({ record }) => {
      const world = window.labIsland;
      const center = world.controls.target.clone().set(...record.center);
      const distance = Math.max(record.size[0], record.size[2], record.size[1] * 1.6) * (record.code === 'P1' ? 1.6 : 1.15);
      const outward = center.clone().setY(0).normalize();
      world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear');
      world.camera.position.copy(center).addScaledVector(outward, distance * 0.72).add(new world.camera.position.constructor(-outward.z, 0, outward.x).multiplyScalar(distance * 0.35)).setY(center.y + distance * 0.5);
      world.camera.lookAt(center); world.controls.target.copy(center); world.controls.update(); world.advanceTime(300);
    }, { record });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${OUTPUT}/facilities/${record.code.toLowerCase()}.png` });
  }

  const conventusRecord = audit.facilityBoxes.find((record) => record.code === 'P1');
  await page.evaluate(({ record }) => {
    const world = window.labIsland;
    const center = world.controls.target.clone().set(...record.center);
    const span = Math.max(record.size[0], record.size[2]);
    world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear');
    world.camera.position.set(center.x, center.y + span * 1.75, center.z + 0.001);
    world.camera.up.set(0, 0, -1);
    world.camera.lookAt(center); world.controls.target.copy(center); world.controls.update(); world.advanceTime(300);
  }, { record: conventusRecord });
  await page.waitForTimeout(100);
  await page.screenshot({ path: `${OUTPUT}/facilities/p1-plan.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const conventus = world.scene.getObjectByName('PARTICLE__P1__CONVENTUS_ORBIS');
    if (!conventus) throw new Error('Conventus Orbis camera anchor is unavailable');
    conventus.updateMatrixWorld(true);
    const supportAngle = Math.PI / 4;
    const eye = conventus.localToWorld(world.camera.position.clone().set(Math.cos(supportAngle) * 4.8, 0.52, Math.sin(supportAngle) * 3.8));
    const target = conventus.localToWorld(world.controls.target.clone().set(Math.cos(supportAngle) * 9.2, 1.12, Math.sin(supportAngle) * 9.2));
    world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear');
    world.camera.position.copy(eye); world.camera.up.set(0, 1, 0);
    world.camera.lookAt(target); world.controls.target.copy(target); world.controls.update(); world.advanceTime(300);
  });
  await page.waitForTimeout(100);
  await page.screenshot({ path: `${OUTPUT}/facilities/p1-support-court.png` });

  const walkAudit = await page.evaluate(({ roadPoint, roadNextPoint }) => {
    const world = window.labIsland;
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation();
    const preferred = world.camera.position.clone().set(...roadPoint);
    const heading = world.controls.target.clone().set(...roadNextPoint).sub(preferred).setY(0).normalize();
    world.walkController.enter(preferred, heading, preferred);
    const ground = world.walkController.sampleGround(preferred.x, preferred.z);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0);
    const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot();
    return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint, roadNextPoint: audit.roadNextPoint });
  await page.screenshot({ path: `${OUTPUT}/event-track-promenade-human-height.png` });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.003 || !walkAudit.grounded || walkAudit.moved < 0.1) throw new Error(`Event Track Promenade WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
