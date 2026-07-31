import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.MEDICAL_LABS_OUTPUT ?? 'output/medical-labs-district';
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
  await page.waitForTimeout(1_500);
  await page.evaluate(() => window.advanceTime(240));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__medical-labs');
    const definition = world.definitions.get('medical-labs');
    if (!district || !definition?.sector) throw new Error('Medical Labs District is unavailable');
    district.updateMatrixWorld(true);
    world.select('medical-labs', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(15),
      mode: 'explore',
      selectedPackageId: 'medical-labs',
      interiorPackageId: null,
      force: true,
    });

    const facilities = [];
    const materialNames = new Set();
    const names = [];
    const animated = [];
    const scaledMeshParentDetails = [];
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      if (object.userData.animate) animated.push({ name: object.name, animate: object.userData.animate });
      if (!object.isMesh) return;
      meshCount += 1;
      if (object.parent?.isMesh && (
        Math.abs(object.parent.scale.x - 1) > 0.001
        || Math.abs(object.parent.scale.y - 1) > 0.001
        || Math.abs(object.parent.scale.z - 1) > 0.001
      )) {
        scaledMeshParentDetails.push({
          name: object.name,
          parent: object.parent.name,
          parentScale: object.parent.scale.toArray(),
        });
      }
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
      const corners = [];
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const localBounds = object.geometry.boundingBox;
        if (!localBounds) return;
        for (const x of [localBounds.min.x, localBounds.max.x]) {
          for (const y of [localBounds.min.y, localBounds.max.y]) {
            for (const z of [localBounds.min.z, localBounds.max.z]) {
              const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
              corners.push([point.x, point.z]);
            }
          }
        }
      });
      corners.forEach(([x, z]) => {
        const radius = Math.hypot(x, z);
        const angle = normalizeNear(Math.atan2(z, x), sector.centerAngle);
        if (
          radius < sector.innerRadius - 0.2
          || radius > sector.outerRadius + 0.2
          || angle < sector.startAngle - 0.01
          || angle > sector.endAngle + 0.01
        ) {
          boundaryViolations.push({
            code: facility.userData.buildingCode,
            radius: Number(radius.toFixed(3)),
            degrees: Number((angle * 180 / Math.PI).toFixed(3)),
          });
        }
      });
    });

    const routeNames = [
      'MEDICAL__DIAGNOSTIC_CRESCENT',
      'MEDICAL__THERAPEUTIC_SPINE',
      'MEDICAL__RESTRICTED_SPECIMEN_VEIN',
      'MEDICAL__CLINICAL_SERVICE_ROUTE_1',
      'MEDICAL__CLINICAL_SERVICE_ROUTE_2',
      'MEDICAL__CLINICAL_SERVICE_ROUTE_3',
      'MEDICAL__CLINICAL_SERVICE_ROUTE_4',
    ];
    const routes = routeNames.map((name) => district.getObjectByName(name));
    const mainRoad = routes[0];
    if (!mainRoad?.isMesh) throw new Error('Diagnostic Crescent is missing');
    const roadPositions = mainRoad.geometry.attributes.position;
    const middlePair = Math.floor(roadPositions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(roadPositions, middlePair);
    const b = world.camera.position.clone().fromBufferAttribute(roadPositions, middlePair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(mainRoad.matrixWorld);
    world.walkController.refreshNavigation();
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.medicalLabsDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))),
      displayNames: facilities.map((facility) => facility.userData.displayName).sort(),
      dimensions: facilities.map((facility) => ({
        code: facility.userData.buildingCode,
        footprintMetres: facility.userData.footprintMetres,
        heightMetres: facility.userData.heightMetres,
        placementZone: facility.userData.placementZone,
      })),
      meshCount,
      uniqueNames: new Set(names).size,
      materialNames: [...materialNames].sort(),
      animated,
      scaledMeshParentDetails,
      boundaryViolations,
      missingRoots: [
        'MEDICAL__M1__ATLAS_PATHOLOGICA',
        'MEDICAL__M2__HEMOLUMEN_SPIRE',
        'MEDICAL__M3__VITRIVIVARIUM',
        'MEDICAL__M4__EDITORIUM_GENOMICUM',
        'MEDICAL__M5__IMMUNIS_BASTION',
        'MEDICAL__M6__ASTRA_THERANOSTICA',
        'MEDICAL__M7__REGENERA_FORGE',
        'MEDICAL__M8__CONCORDIA_XENOMEDICA',
        'MEDICAL__M9__AEGIS_PHAGICA',
        'MEDICAL__M10__CLINICA_SIMULACRA',
      ].filter((name) => !district.getObjectByName(name)),
      legacyGenericNames: [
        'Translational Research Hospital',
        'Diagnostic Imaging Wing',
        'Clinical Trials Pavilion',
        'Regenerative Medicine Greenhouse',
      ].filter((name) => names.some((candidate) => candidate.includes(name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')))),
      routeAudit: routes.map((route) => ({
        name: route?.name ?? null,
        walkable: route?.userData.walkable === true,
        resident: Boolean(route?.parent),
      })),
      specimenCapsules: names.filter((name) => name.startsWith('MEDICAL__SEALED_SPECIMEN_CAPSULE_')).length,
      roadGround: world.walkController.sampleGround(roadPoint.x, roadPoint.z),
      roadPoint: roadPoint.toArray(),
      textMedical: textState.medicalLabsDistrict,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === 'medical-labs') ?? null,
    };
  });

  if (audit.facilityCount !== 10) throw new Error(`Expected 10 Medical facilities, found ${audit.facilityCount}`);
  if (audit.codes.join(',') !== 'M1,M2,M3,M4,M5,M6,M7,M8,M9,M10') {
    throw new Error(`Medical facility codes are incomplete: ${audit.codes.join(', ')}`);
  }
  if (audit.missingRoots.length) throw new Error(`Missing Medical roots: ${audit.missingRoots.join(', ')}`);
  if (audit.legacyGenericNames.length) throw new Error(`Legacy generic Medical buildings remain: ${audit.legacyGenericNames.join(', ')}`);
  if (audit.boundaryViolations.length) {
    throw new Error(`Medical facilities cross the road-bounded district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 16))}`);
  }
  if (audit.meshCount < 500) throw new Error(`Medical exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.scaledMeshParentDetails.length) {
    throw new Error(`Medical detail inherited a scaled mesh transform: ${JSON.stringify(audit.scaledMeshParentDetails)}`);
  }
  if (audit.uniqueNames < audit.meshCount * 0.95) throw new Error('Medical exterior names are not sufficiently deterministic');
  if (audit.animated.length < 30) throw new Error(`Medical night/exterior systems are incomplete: ${audit.animated.length}`);
  if (audit.specimenCapsules !== 10) throw new Error(`Expected 10 sealed specimen capsules, found ${audit.specimenCapsules}`);
  if (audit.routeAudit.slice(0, 2).some((route) => !route.resident || !route.walkable)) {
    throw new Error(`Medical public route hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  }
  if (audit.routeAudit[2]?.walkable || !audit.routeAudit[2]?.resident) {
    throw new Error(`Specimen Vein is not separated from public pedestrian routing: ${JSON.stringify(audit.routeAudit[2])}`);
  }
  if (audit.routeAudit.slice(3).some((route) => !route.resident || !route.walkable)) {
    throw new Error(`Medical clinical route hierarchy is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  }
  if (audit.roadGround === null) throw new Error('Diagnostic Crescent is not WALK-grounded');
  if (audit.textMedical?.buildingCount !== 10 || audit.textMedical?.identity !== 'The Anatomical Crescent') {
    throw new Error('Medical metadata is missing from render_game_to_text()');
  }
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.anatomicalCrescent !== true) {
    throw new Error('Medical population metadata is incomplete');
  }
  if (audit.streaming?.detailResident !== true) throw new Error('Medical detail package did not remain resident for inspection');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  for (const material of [
    'Medical bone-white sintered ceramic',
    'Medical frosted low-iron glass',
    'Medical satin titanium',
    'Medical black volcanic stone',
    'Medical opalescent electrochromic glazing',
    'Medical translucent membrane roof',
    'Medical ruby diagnostic light',
    'Medical violet therapeutic light',
    'Medical cold cyan diagnostic light',
  ]) {
    if (!audit.materialNames.includes(material)) throw new Error(`Missing Medical district material: ${material}`);
  }

  await page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
  });

  const prepareDistrictView = async (time = 'noon') => {
    await page.evaluate((time) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__medical-labs');
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
      world.setWeather('clear');
      world.clearSelection('system');
      world.cameraTween = null;
      world.camera.position.set(center.x - size.x * 0.2, center.y + Math.max(size.x, size.z) * 0.56, center.z + size.z * 0.62);
      world.controls.target.copy(center).setY(2.2);
      world.controls.update();
      world.advanceTime(1_200);
    }, time);
    await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon');
  await page.screenshot({ path: `${OUTPUT}/anatomical-crescent-overview.png` });
  await prepareDistrictView('night');
  await page.screenshot({ path: `${OUTPUT}/anatomical-crescent-night.png` });

  const prepareFacilityView = async (code, cameraLocal, targetLocal, environment = { time: 'noon', weather: 'clear' }) => {
    await page.evaluate(({ code, cameraLocal, targetLocal, environment }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__medical-labs');
      let facility = null;
      district.traverse((object) => {
        if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object;
      });
      if (!facility) throw new Error(`Medical facility ${code} was unavailable`);
      facility.updateMatrixWorld(true);
      world.setMode('explore');
      world.setTimeOfDay(environment.time);
      world.setWeather(environment.weather);
      world.clearSelection('system');
      world.cameraTween = null;
      world.camera.position.copy(world.camera.position.clone().fromArray(cameraLocal).applyMatrix4(facility.matrixWorld));
      world.controls.target.copy(world.controls.target.clone().fromArray(targetLocal).applyMatrix4(facility.matrixWorld));
      world.controls.update();
      world.advanceTime(900);
    }, { code, cameraLocal, targetLocal, environment });
    await page.waitForTimeout(300);
  };

  await prepareFacilityView('M1', [13.5, 8.0, -15.5], [0, 2.8, 0]);
  await page.screenshot({ path: `${OUTPUT}/atlas-pathologica.png` });
  await prepareFacilityView('M2', [18.0, 14.0, 20.0], [0, 7.0, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/hemolumen-spire-night.png` });
  await prepareFacilityView('M3', [18.0, 9.5, -19.0], [0, 1.8, 0]);
  await page.screenshot({ path: `${OUTPUT}/vitrivivarium-colony.png` });
  await prepareFacilityView('M4', [16.0, 10.0, 4.0], [0, 3.2, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/editorium-edit-gap-night.png` });
  await prepareFacilityView('M5', [17.0, 10.0, 4.0], [0, 2.6, 0]);
  await page.screenshot({ path: `${OUTPUT}/immunis-bastion.png` });
  await prepareFacilityView('M6', [20.0, 11.0, 4.0], [0, 2.8, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/astra-theranostica-night.png` });
  await prepareFacilityView('M7', [26.0, 12.0, 3.0], [0, 2.4, 0]);
  await page.screenshot({ path: `${OUTPUT}/regenera-forge.png` });
  await prepareFacilityView('M8', [21.0, 12.0, 3.0], [0, 2.8, 0]);
  await page.screenshot({ path: `${OUTPUT}/concordia-xenomedica.png` });
  await prepareFacilityView('M9', [20.0, 10.0, 3.0], [0, 3.0, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/aegis-phagica-night.png` });
  await prepareFacilityView('M10', [18.0, 13.0, 4.0], [0, 7.0, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/clinica-simulacra-night.png` });

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__medical-labs');
    const mainRoad = district.getObjectByName('MEDICAL__DIAGNOSTIC_CRESCENT');
    const positions = mainRoad.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1));
    const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(mainRoad.matrixWorld);
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
    const walk = world.walkController.getSnapshot();
    return {
      ground,
      eyeClearance: start.y - ground,
      moved: start.distanceTo(end),
      grounded: walk.grounded,
      position: walk.positionWorld,
    };
  }, { roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002) {
    throw new Error(`Medical WALK eye clearance is incorrect: ${JSON.stringify(walkAudit)}`);
  }
  if (!walkAudit.grounded || walkAudit.moved < 0.12) {
    throw new Error(`Diagnostic Crescent WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-diagnostic-crescent.png` });

  const report = { audit, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
