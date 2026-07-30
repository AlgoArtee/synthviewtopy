import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.SECRET_LABS_OUTPUT ?? 'output/secret-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
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
  await page.evaluate(() => window.advanceTime(240));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__secret-labs');
    const definition = world.definitions.get('secret-labs');
    if (!district || !definition?.sector) throw new Error('Secret Labs District is unavailable');
    world.select('secret-labs', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    district.updateMatrixWorld(true);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(14),
      mode: 'explore',
      selectedPackageId: 'secret-labs',
      interiorPackageId: null,
      force: true,
    });

    const facilities = [];
    const names = [];
    const materialNames = new Set();
    const animated = [];
    const scaledMeshParents = [];
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      if (object.userData.animate) animated.push(object);
      if (!object.isMesh) return;
      meshCount += 1;
      if (object.parent?.isMesh && (
        Math.abs(object.parent.scale.x - 1) > 0.001
        || Math.abs(object.parent.scale.y - 1) > 0.001
        || Math.abs(object.parent.scale.z - 1) > 0.001
      )) scaledMeshParents.push({ name: object.name, parent: object.parent.name });
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materialNames.add(material.name));
    });

    const normalizeNear = (angle, reference) => reference + Math.atan2(
      Math.sin(angle - reference),
      Math.cos(angle - reference),
    );
    const sector = definition.sector;
    const boundaryViolations = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) {
          for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
              const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
              const radius = Math.hypot(point.x, point.z);
              const angle = normalizeNear(Math.atan2(point.z, point.x), sector.centerAngle);
              if (
                radius < sector.innerRadius - 0.25
                || radius > sector.outerRadius + 0.25
                || angle < sector.startAngle - 0.012
                || angle > sector.endAngle + 0.012
              ) {
                boundaryViolations.push({
                  code: facility.userData.buildingCode,
                  object: object.name,
                  radius: Number(radius.toFixed(3)),
                  degrees: Number((angle * 180 / Math.PI).toFixed(3)),
                });
              }
            }
          }
        }
      });
    });

    const road = district.getObjectByName('SECRET__AUTONOMOUS_QUANTUM_ARC');
    if (!road?.isMesh) throw new Error('Secret Labs central road is missing');
    const roadPositions = road.geometry.attributes.position;
    const pair = Math.floor(roadPositions.count / 4) * 2;
    const pointA = world.camera.position.clone().fromBufferAttribute(roadPositions, pair);
    const pointB = world.camera.position.clone().fromBufferAttribute(roadPositions, pair + 1);
    const roadPoint = pointA.add(pointB).multiplyScalar(0.5).applyMatrix4(road.matrixWorld);
    world.walkController.refreshNavigation();
    const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const beforeAnimation = animated.map((object) => ({
      name: object.name,
      position: object.position.toArray(),
      rotation: object.rotation.toArray().slice(0, 3),
    }));
    world.advanceTime(1_200);
    const animationChanges = animated.filter((object, index) => {
      const before = beforeAnimation[index];
      const moved = object.position.toArray().some((value, axis) => Math.abs(value - before.position[axis]) > 0.0001);
      const rotated = object.rotation.toArray().slice(0, 3).some((value, axis) => Math.abs(value - before.rotation[axis]) > 0.0001);
      return moved || rotated;
    }).length;
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.secretLabsDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort(),
      displayNames: facilities.map((facility) => facility.userData.displayName).sort(),
      researchBands: [...new Set(facilities.map((facility) => facility.userData.researchBand))].sort(),
      requiredRoots: [
        'SECRET__L1__AION',
        'SECRET__L2__MNEMOSYNE',
        'SECRET__L3__CHIMAERA',
        'SECRET__L4__EVE',
        'SECRET__L5__GENESIS',
        'SECRET__L6__PROTEUS',
        'SECRET__L7__ARIADNE',
        'SECRET__L8__MORPHOS',
        'SECRET__L9__TOPOS',
        'SECRET__L10__CHRONOS',
        'SECRET__L11__HELIOS',
        'SECRET__L12__ORPHEUS',
        'SECRET__L13__NOOSPHERE',
        'SECRET__L14__LIMEN',
        'SECRET__L15__NULL',
      ].filter((name) => !district.getObjectByName(name)),
      meshCount,
      uniqueNameCount: new Set(names).size,
      nameCount: names.length,
      materialNames: [...materialNames].sort(),
      scaledMeshParents,
      boundaryViolations,
      animatedCount: animated.length,
      animationChanges,
      roadPoint: roadPoint.toArray(),
      roadGround,
      roadWalkable: road.userData.walkable === true,
      textSecretLabs: textState.secretLabsDistrict,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === 'secret-labs') ?? null,
    };
  });

  if (audit.facilityCount !== 15) throw new Error(`Expected 15 Secret Lab facilities, found ${audit.facilityCount}`);
  if (new Set(audit.codes).size !== 15 || audit.codes[0] !== 'L1' || !audit.codes.includes('L15')) {
    throw new Error(`Secret Lab facility codes are incomplete: ${audit.codes.join(', ')}`);
  }
  if (audit.requiredRoots.length) throw new Error(`Missing Secret Lab roots: ${audit.requiredRoots.join(', ')}`);
  if (audit.researchBands.length !== 3) throw new Error(`Scientific gradient is incomplete: ${audit.researchBands.join(', ')}`);
  if (audit.meshCount < 950) throw new Error(`Secret Labs exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.scaledMeshParents.length) throw new Error(`Secret Labs detail inherited scaled mesh transforms: ${JSON.stringify(audit.scaledMeshParents.slice(0, 8))}`);
  if (audit.boundaryViolations.length) throw new Error(`Secret Labs facilities cross the district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 8))}`);
  if (!audit.roadWalkable || audit.roadGround === null) throw new Error('Secret Labs scientific-gradient road is not WALK-grounded');
  if (audit.animatedCount < 12 || audit.animationChanges < 8) throw new Error(`Secret Labs deterministic systems are inactive: ${audit.animationChanges}/${audit.animatedCount}`);
  if (audit.textSecretLabs?.buildingCount !== 15 || audit.textSecretLabs?.identity !== 'The Secret Labs Scientific Gradient') {
    throw new Error('Secret Labs metadata is missing from render_game_to_text()');
  }
  if (audit.population?.realizedFacilityCount !== 15 || audit.population?.secretScientificGradient !== true) {
    throw new Error('Secret Labs population metadata is incomplete');
  }
  if (audit.streaming?.detailResident !== true) throw new Error('Secret Labs detail package did not remain resident');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  for (const material of [
    'Secret Labs honed black basalt',
    'Secret Labs seamless pale bioceramic',
    'Secret Labs brushed titanium',
    'Secret Labs ultradark electrochromic glass',
    'Secret Labs translucent structural polymer',
    'Secret Labs calibrated cold-white illumination',
  ]) {
    if (!audit.materialNames.includes(material)) throw new Error(`Missing Secret Labs material: ${material}`);
  }

  await page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
  });

  const prepareOverview = async (time = 'noon', weather = 'clear') => {
    await page.evaluate(({ time, weather }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__secret-labs');
      const min = world.camera.position.clone().set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      const max = world.camera.position.clone().set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
      district.updateMatrixWorld(true);
      district.traverse((object) => {
        if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) {
          for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
              const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
              min.min(point);
              max.max(point);
            }
          }
        }
      });
      const center = min.clone().add(max).multiplyScalar(0.5);
      const size = max.clone().sub(min);
      world.setMode('explore');
      world.setTimeOfDay(time);
      world.setWeather(weather);
      world.cameraTween = null;
      world.camera.position.set(center.x - size.x * 0.23, center.y + Math.max(size.x, size.z) * 0.42, center.z + size.z * 0.52);
      world.controls.target.copy(center).setY(2.0);
      world.controls.update();
      world.advanceTime(900);
    }, { time, weather });
    await page.waitForTimeout(350);
  };
  await prepareOverview();
  await page.screenshot({ path: `${OUTPUT}/scientific-gradient-overview.png` });
  await prepareOverview('night', 'clear');
  await page.screenshot({ path: `${OUTPUT}/scientific-gradient-night.png` });

  const prepareFacilityView = async (code, cameraLocal, targetLocal, environment = { time: 'noon', weather: 'clear' }) => {
    await page.evaluate(({ code, cameraLocal, targetLocal, environment }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__secret-labs');
      let facility = null;
      district.traverse((object) => {
        if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object;
      });
      if (!facility) throw new Error(`Secret Lab facility ${code} was unavailable`);
      facility.updateMatrixWorld(true);
      world.setMode('explore');
      world.setTimeOfDay(environment.time);
      world.setWeather(environment.weather);
      world.cameraTween = null;
      world.camera.position.copy(world.camera.position.clone().fromArray(cameraLocal).applyMatrix4(facility.matrixWorld));
      world.controls.target.copy(world.controls.target.clone().fromArray(targetLocal).applyMatrix4(facility.matrixWorld));
      world.controls.update();
      world.advanceTime(900);
    }, { code, cameraLocal, targetLocal, environment });
    await page.waitForTimeout(300);
  };
  await prepareFacilityView('L1', [14, 8, 17], [0, 1.1, 0], { time: 'noon', weather: 'fog' });
  await page.screenshot({ path: `${OUTPUT}/aion-biostasis-ripples.png` });
  await prepareFacilityView('L2', [9, 8, 14], [0, 5.0, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/mnemosyne-split-tower-night.png` });
  await prepareFacilityView('L8', [14, 7, 15], [0, 2.2, 0]);
  await page.screenshot({ path: `${OUTPUT}/morphos-programmable-facade.png` });
  await prepareFacilityView('L10', [14, 9, 17], [0, 5.1, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/chronos-time-ring-night.png` });
  await prepareFacilityView('L12', [14, 9, 17], [0, 4.2, 0], { time: 'noon', weather: 'fog' });
  await page.screenshot({ path: `${OUTPUT}/orpheus-obelisk-array.png` });
  await prepareFacilityView('L14', [14, 9, 17], [0, 4.0, 0], { time: 'night', weather: 'fog' });
  await page.screenshot({ path: `${OUTPUT}/limen-anomalous-void.png` });
  await prepareFacilityView('L15', [14, 7, 16], [0, 0.2, 0], { time: 'night', weather: 'rain' });
  await page.screenshot({ path: `${OUTPUT}/null-black-containment.png` });

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__secret-labs');
    const road = district.getObjectByName('SECRET__AUTONOMOUS_QUANTUM_ARC');
    const positions = road.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 12, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 13, positions.count - 1));
    const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(road.matrixWorld);
    world.setMode('walk');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]);
    world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(next.x, ground + 0.16, next.z);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true);
    world.advanceTime(900);
    world.setWalkIntent(0, 0);
    const end = world.camera.position.clone();
    return {
      ground,
      eyeClearance: start.y - ground,
      moved: start.distanceTo(end),
      grounded: world.walkController.getSnapshot().grounded,
      position: world.walkController.getSnapshot().positionWorld,
    };
  }, { roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) {
    throw new Error(`Secret Labs WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-central-scientific-arc.png` });

  const report = { audit, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
