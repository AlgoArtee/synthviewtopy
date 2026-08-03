import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.INORGANIC_CHEMISTRY_DISTRICT_OUTPUT ?? 'output/inorganic-chemistry-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'inorganic-chemistry';
const requiredRoots = [
  'INORGCHEM__I1__CRYSTAL_GENOME_FOUNDRY',
  'INORGCHEM__I2__MONATOMIC_CATALYST_SPIRE',
  'INORGCHEM__I3__HALIDE_ION_CITADEL',
  'INORGCHEM__I4__BREATHING_FRAMEWORK_ARK',
  'INORGCHEM__I5__SOLAR_FUELS_LEAFWORKS',
  'INORGCHEM__I6__NITROGEN_TRIPLE_BOND_FORGE',
  'INORGCHEM__I7__F_BLOCK_CONTAINMENT_MONASTERY',
  'INORGCHEM__I8__LANTHANIDE_CASCADE_REFINERY',
  'INORGCHEM__I9__POLYOXOMETALATE_BASILICA',
  'INORGCHEM__I10__QUANTUM_OXIDE_TERRACES',
  'INORGCHEM__I11__MEGABAR_DIAMOND_ANVIL_TOWER',
  'INORGCHEM__I12__MOLTEN_SALT_THERMAL_KEEP',
  'INORGCHEM__I13__BIOMINERAL_HYBRID_CONSERVATORY',
  'INORGCHEM__I14__CARBON_MINERALIZATION_RAMPARTS',
  'INORGCHEM__I15__VALENCE_NEXUS_AND_COORDINATION_CROWN',
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
    if (!district || !definition?.sector) throw new Error('Inorganic Chemistry Labs District is unavailable');
    world.select(districtId, 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(16),
      mode: 'explore',
      selectedPackageId: districtId,
      interiorPackageId: null,
      force: true,
    });
    district.updateMatrixWorld(true);

    const facilities = [];
    const names = [];
    const materialNames = new Set();
    const animations = new Map();
    const scaledMeshParentDetails = [];
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (Array.isArray(object.userData.instanceNames)) names.push(...object.userData.instanceNames);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animationProfile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animationProfile) animations.set(animationProfile, (animations.get(animationProfile) ?? 0) + (object.userData.authoredAnimationCount ?? 1));
      if (!object.isMesh) return;
      meshCount += object.userData.authoredInstanceCount ?? 1;
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
        const instanceMatrix = world.camera.matrixWorld.clone();
        const appendCorners = (matrix) => {
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            const point = world.camera.position.clone().set(x, y, z).applyMatrix4(matrix);
            min.min(point);
            max.max(point);
            corners.push(point);
          }
        };
        if (object.isInstancedMesh) {
          for (let index = 0; index < object.count; index += 1) {
            object.getMatrixAt(index, instanceMatrix);
            appendCorners(world.camera.matrixWorld.clone().multiplyMatrices(object.matrixWorld, instanceMatrix));
          }
        } else appendCorners(object.matrixWorld);
      });
      facilityBoxes.push({ code: facility.userData.buildingCode, min: min.toArray(), max: max.toArray() });
      corners.forEach((point) => {
        const radius = Math.hypot(point.x, point.z);
        const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
        if (
          radius < definition.sector.innerRadius - 0.25
          || radius > definition.sector.outerRadius + 0.25
          || angle < definition.sector.startAngle - 0.012
          || angle > definition.sector.endAngle + 0.012
        ) boundaryViolations.push({ code: facility.userData.buildingCode, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
      });
    });

    const overlaps = [];
    for (let left = 0; left < facilityBoxes.length; left += 1) for (let right = left + 1; right < facilityBoxes.length; right += 1) {
      const a = facilityBoxes[left];
      const b = facilityBoxes[right];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.18 && overlapZ > 0.18) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }

    const routeNames = [
      'INORGCHEM__VALENCE_AVENUE',
      'INORGCHEM__STOICHIOMETRIC_LOOP',
      'INORGCHEM__CRYSTAL_AXIS',
      'INORGCHEM__F_BLOCK_PASSAGE',
      ...Array.from({ length: 4 }, (_, index) => `INORGCHEM__STRUCTURAL_BOND_SERVICE_LINK_${index + 1}`),
      ...Array.from({ length: 15 }, (_, index) => `INORGCHEM__BUILDING_APPROACH_I${index + 1}`),
    ];
    const roads = routeNames.map((name) => district.getObjectByName(name));
    const boulevard = roads[0];
    const positions = boulevard.geometry.attributes.position;
    const pair = Math.floor(positions.count / 8) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair);
    const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(boulevard.matrixWorld);
    world.walkController.refreshNavigation();
    const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    const prefixes = [
      'INORGCHEM__I1__CRYSTAL_SYSTEM_WING_',
      'INORGCHEM__I1__DIAGRID_LATTICE_NODE_',
      'INORGCHEM__I2__COORDINATION_ARM_LOWER_',
      'INORGCHEM__I3__FACETED_DESICCANT_CRYSTAL_',
      'INORGCHEM__I4__BREATHING_CERAMIC_SHUTTER_',
      'INORGCHEM__I5__MINERAL_LEAF_PIVOT_',
      'INORGCHEM__I6__MECHANOCHEMICAL_REACTOR_DRUM_',
      'INORGCHEM__I7__NESTED_CONTAINMENT_WALL_N_',
      'INORGCHEM__I8__RARE_EARTH_PROCESS_TOWER_',
      'INORGCHEM__I9__POLYGONAL_CLUSTER_CHAPEL_',
      'INORGCHEM__I10__ROTATED_EPITAXIAL_SLAB_',
      'INORGCHEM__I11__CALIBRATED_PRESSURE_RING_',
      'INORGCHEM__I12__THERMAL_STACK_',
      'INORGCHEM__I13__BRANCHING_POROUS_CERAMIC_RIB_',
      'INORGCHEM__I14__GEOLOGICAL_STRATUM_',
      'INORGCHEM__I15__COORDINATION_LIGAND_PYLON_',
    ];
    const prefixCounts = Object.fromEntries(prefixes.map((prefix) => [prefix, names.filter((name) => name.startsWith(prefix)).length]));
    return {
      program: district.userData.inorganicChemistryLabsDistrict,
      population: district.userData.population,
      topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name),
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))),
      facilityCount: facilities.length,
      meshCount,
      uniqueNames: new Set(names).size,
      scaledMeshParentDetails,
      materialNames: [...materialNames].sort(),
      animations: Object.fromEntries(animations),
      prefixCounts,
      missingRoots: requiredRoots.filter((name) => !district.getObjectByName(name)),
      boundaryViolations,
      overlaps,
      facilityBoxes,
      routeAudit: roads.map((road) => ({ name: road?.name ?? null, resident: Boolean(road?.parent), walkable: road?.userData.walkable === true })),
      roadPoint: roadPoint.toArray(),
      roadGround,
      textDistrict: textState.inorganicChemistryLabsDistrict,
      specializedRevision: textState.masterplan?.specializedDistrictLayoutRevision,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === districtId) ?? null,
    };
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, prefixCounts: audit.prefixCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 5) }, null, 2));
  if (audit.facilityCount !== 15 || audit.codes.join(',') !== 'I1,I2,I3,I4,I5,I6,I7,I8,I9,I10,I11,I12,I13,I14,I15') throw new Error(`Inorganic Chemistry facilities are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Inorganic Chemistry roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 950) throw new Error(`Inorganic Chemistry exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error(`Inorganic Chemistry names are not deterministic enough: ${audit.uniqueNames}/${audit.meshCount}`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Inorganic Chemistry detail inherited scaled mesh parents: ${JSON.stringify(audit.scaledMeshParentDetails.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Inorganic Chemistry facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Inorganic Chemistry facility envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routeAudit.length !== 23 || audit.routeAudit.some((road) => !road.resident || !road.walkable) || audit.roadGround === null) throw new Error(`Inorganic Chemistry circulation is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.textDistrict?.buildingCount !== 15 || audit.textDistrict?.signatureSystems?.rareEarthTowers !== 17 || audit.textDistrict?.signatureSystems?.ligandPylons !== 8) throw new Error('Inorganic Chemistry metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 15 || audit.population?.mineralLatticeDistrict !== true) throw new Error('Inorganic Chemistry population metadata is incomplete');
  if (audit.specializedRevision !== 10 || audit.streaming?.detailResident !== true || audit.planning?.cellViolations !== 0) throw new Error(`Inorganic Chemistry integration regressed: revision=${audit.specializedRevision}, streaming=${JSON.stringify(audit.streaming)}, planning=${JSON.stringify(audit.planning)}`);
  if ((audit.animations['inorganic-chemistry-emissive-pulse'] ?? 0) < 300 || (audit.animations['inorganic-chemistry-rotation'] ?? 0) !== 14 || (audit.animations['inorganic-chemistry-breathe'] ?? 0) !== 72 || (audit.animations['inorganic-chemistry-travel'] ?? 0) !== 21) throw new Error(`Inorganic Chemistry animation coverage is incomplete: ${JSON.stringify(audit.animations)}`);
  const expectedCounts = {
    'INORGCHEM__I1__CRYSTAL_SYSTEM_WING_': 7,
    'INORGCHEM__I1__DIAGRID_LATTICE_NODE_': 48,
    'INORGCHEM__I2__COORDINATION_ARM_LOWER_': 3,
    'INORGCHEM__I3__FACETED_DESICCANT_CRYSTAL_': 6,
    'INORGCHEM__I4__BREATHING_CERAMIC_SHUTTER_': 72,
    'INORGCHEM__I5__MINERAL_LEAF_PIVOT_': 5,
    'INORGCHEM__I6__MECHANOCHEMICAL_REACTOR_DRUM_': 3,
    'INORGCHEM__I7__NESTED_CONTAINMENT_WALL_N_': 5,
    'INORGCHEM__I8__RARE_EARTH_PROCESS_TOWER_': 17,
    'INORGCHEM__I9__POLYGONAL_CLUSTER_CHAPEL_': 12,
    'INORGCHEM__I10__ROTATED_EPITAXIAL_SLAB_': 6,
    'INORGCHEM__I11__CALIBRATED_PRESSURE_RING_': 13,
    'INORGCHEM__I12__THERMAL_STACK_': 6,
    'INORGCHEM__I13__BRANCHING_POROUS_CERAMIC_RIB_': 44,
    'INORGCHEM__I14__GEOLOGICAL_STRATUM_': 7,
    'INORGCHEM__I15__COORDINATION_LIGAND_PYLON_': 8,
  };
  for (const [prefix, expected] of Object.entries(expectedCounts)) if (audit.prefixCounts[prefix] !== expected) throw new Error(`Expected ${expected} ${prefix} systems, found ${audit.prefixCounts[prefix]}`);
  if (audit.topLevelNames.some((name) => !name.startsWith('INORGCHEM__'))) throw new Error(`Generic placeholder leaked into Inorganic Chemistry: ${audit.topLevelNames.join(', ')}`);
  for (const requiredMaterial of [
    'Inorganic Chemistry black basalt geopolymer',
    'Inorganic Chemistry pale zirconia ceramic',
    'Inorganic Chemistry salt-like translucent glass ceramic',
    'Inorganic Chemistry brushed stainless steel',
    'Inorganic Chemistry copper violet photoelectrode',
    'Inorganic Chemistry red brown thermal ceramic',
  ]) if (!audit.materialNames.includes(requiredMaterial)) throw new Error(`Missing Inorganic Chemistry material: ${requiredMaterial}`);

  await page.evaluate(() => {
    window.labIsland.clearSelection('system');
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none'));
  });
  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ districtId, time, plan }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      district.updateMatrixWorld(true);
      district.traverse((object) => {
        if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
          min.min(point);
          max.max(point);
        }
      });
      const center = min.clone().add(max).multiplyScalar(0.5);
      const size = max.clone().sub(min);
      world.setMode('explore');
      world.setTimeOfDay(time);
      world.setWeather('clear');
      world.cameraTween = null;
      if (plan) {
        const extent = Math.max(size.z, size.x / world.camera.aspect);
        const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360);
        world.camera.up.set(0, 0, -1);
        world.camera.position.set(center.x, Math.max(altitude, 88), center.z + 0.001);
        world.controls.target.set(center.x, 0, center.z);
      } else {
        world.camera.up.set(0, 1, 0);
        world.camera.position.set(center.x - size.x * 0.58, center.y + Math.max(size.x, size.z) * 0.34, center.z + size.z * 0.70);
        world.controls.target.copy(center).setY(4.0);
      }
      world.controls.update();
      world.advanceTime(1_200);
    }, { districtId, time, plan });
    await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon');
  await page.screenshot({ path: `${OUTPUT}/inorganic-chemistry-overview.png` });
  await prepareDistrictView('noon', true);
  await page.screenshot({ path: `${OUTPUT}/inorganic-chemistry-plan.png` });
  await prepareDistrictView('night');
  await page.screenshot({ path: `${OUTPUT}/inorganic-chemistry-night.png` });

  for (let index = 1; index <= 15; index += 1) {
    const code = `I${index}`;
    await page.evaluate(({ districtId, code }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
      let facility = null;
      district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; });
      facility.updateMatrixWorld(true);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        const instanceMatrix = world.camera.matrixWorld.clone();
        const appendCorners = (matrix) => {
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            const point = world.camera.position.clone().set(x, y, z).applyMatrix4(matrix);
            min.min(point);
            max.max(point);
          }
        };
        if (object.isInstancedMesh) {
          for (let index = 0; index < object.count; index += 1) {
            object.getMatrixAt(index, instanceMatrix);
            appendCorners(world.camera.matrixWorld.clone().multiplyMatrices(object.matrixWorld, instanceMatrix));
          }
        } else appendCorners(object.matrixWorld);
      });
      const center = min.clone().add(max).multiplyScalar(0.5);
      const size = max.clone().sub(min);
      const distance = Math.max(size.x, size.z) * 1.18 + size.y * 0.62;
      const orientation = facility.getWorldQuaternion(world.camera.quaternion.clone());
      const front = world.camera.position.clone().set(0, 0, 1).applyQuaternion(orientation).setY(0).normalize();
      const side = world.camera.position.clone().set(-1, 0, 0).applyQuaternion(orientation).setY(0).normalize();
      if (code === 'I7') {
        front.multiplyScalar(-1);
        side.multiplyScalar(-1);
      }
      world.setMode('explore');
      world.setTimeOfDay(['I2', 'I7', 'I9', 'I10', 'I11', 'I12', 'I15'].includes(code) ? 'night' : 'noon');
      world.setWeather('clear');
      world.cameraTween = null;
      world.camera.up.set(0, 1, 0);
      world.camera.position.copy(center).addScaledVector(front, distance * 0.78).addScaledVector(side, distance * 0.42).setY(center.y + distance * 0.34);
      world.controls.target.copy(center);
      world.controls.update();
      world.advanceTime(900);
    }, { districtId, code });
    await page.waitForTimeout(220);
    await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ districtId, roadPoint }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const boulevard = district.getObjectByName('INORGCHEM__VALENCE_AVENUE');
    const positions = boulevard.geometry.attributes.position;
    const pair = Math.floor(positions.count / 8) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1));
    const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(boulevard.matrixWorld);
    world.setMode('walk');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    const preferred = world.camera.position.clone().set(roadPoint[0], roadPoint[1], roadPoint[2]);
    const heading = next.clone().sub(preferred).setY(0).normalize();
    world.walkController.enter(preferred, heading, preferred);
    const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true);
    world.advanceTime(900);
    world.setWalkIntent(0, 0);
    const end = world.camera.position.clone();
    const walk = world.walkController.getSnapshot();
    return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { districtId, roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Valence Avenue WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/valence-avenue-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshCount: audit.meshCount, animations: audit.animations, routeCount: audit.routeAudit.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
