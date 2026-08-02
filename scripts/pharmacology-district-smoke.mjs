import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.PHARMACOLOGY_OUTPUT ?? 'output/pharmacology-district';
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
  await page.waitForTimeout(800);
  await page.evaluate(() => window.advanceTime(240));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__pharmacology-labs');
    const definition = world.definitions.get('pharmacology-labs');
    if (!district || !definition?.sector) throw new Error('Pharmacology Labs District is unavailable');
    district.updateMatrixWorld(true);
    world.select('pharmacology-labs', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(15),
      mode: 'explore',
      selectedPackageId: 'pharmacology-labs',
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
              ) boundaryViolations.push({
                code: facility.userData.buildingCode,
                name: object.name,
                radius: Number(radius.toFixed(3)),
                degrees: Number((angle * 180 / Math.PI).toFixed(3)),
              });
            }
          }
        }
      });
    });

    const routeNames = [
      'PHARMACOLOGY__DOSE_RESPONSE_PROMENADE',
      'PHARMACOLOGY__TOXICOLOGY_SHIELDED_SERVICE_ROUTE',
      'PHARMACOLOGY__MEDICAL_TRANSLATION_WALK',
      'PHARMACOLOGY__BUILDING_APPROACH_P1',
      'PHARMACOLOGY__BUILDING_APPROACH_P2',
      'PHARMACOLOGY__BUILDING_APPROACH_P3',
      'PHARMACOLOGY__BUILDING_APPROACH_P4',
      'PHARMACOLOGY__BUILDING_APPROACH_P5',
    ];
    const routes = routeNames.map((name) => district.getObjectByName(name));
    const promenade = routes[0];
    if (!promenade?.isMesh) throw new Error('Dose-Response Promenade is missing');
    const roadPositions = promenade.geometry.attributes.position;
    const middlePair = Math.floor(roadPositions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(roadPositions, middlePair);
    const b = world.camera.position.clone().fromBufferAttribute(roadPositions, middlePair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
    world.walkController.refreshNavigation();
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.pharmacologyDistrict,
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
        'PHARMACOLOGY__P1__PHARMAKON_NEXUS',
        'PHARMACOLOGY__P2__THE_TERNARY_GATE',
        'PHARMACOLOGY__P3__SCRIPTORIUM_THERAPEUTICA',
        'PHARMACOLOGY__P4__VECTORIUM_AEGIS',
        'PHARMACOLOGY__P5__CHRONOPHARM_OBSERVATORY',
      ].filter((name) => !district.getObjectByName(name)),
      legacyGenericNames: [
        'Medicinal Chemistry Laboratory',
        'Therapeutics Screening Hall',
        'Medicinal Plant Conservatory',
        'Automated Compound Pavilion',
      ].filter((legacy) => names.some((name) => name.includes(legacy.toUpperCase().replace(/[^A-Z0-9]+/g, '_')))),
      routeAudit: routes.map((route) => ({
        name: route?.name ?? null,
        walkable: route?.userData.walkable === true,
        resident: Boolean(route?.parent),
      })),
      concentrationLights: names.filter((name) => name.startsWith('PHARMACOLOGY__CONCENTRATION_LIGHT_POINT_')).length,
      waterBranches: names.filter((name) => name.startsWith('PHARMACOLOGY__PHARMACOKINETIC_WATER_BRANCH_')).length,
      responsivePanels: names.filter((name) => name.startsWith('PHARMACOLOGY__P1__RESPONSIVE_HEX_PANEL_')).length,
      sequenceFins: names.filter((name) => name.startsWith('PHARMACOLOGY__P3__SEQUENCE_FIN_')).length,
      vectoriumPods: names.filter((name) => name.startsWith('PHARMACOLOGY__P4__SUSPENDED_RESEARCH_POD_')).length,
      microfluidicCapsules: names.filter((name) => name.startsWith('PHARMACOLOGY__P4__ROBOTIC_TRANSPORT_CAPSULE_')).length,
      doseDialSectors: names.filter((name) => name.startsWith('PHARMACOLOGY__P5__DOSE_DIAL_SECTOR_')).length,
      roadGround: world.walkController.sampleGround(roadPoint.x, roadPoint.z),
      roadPoint: roadPoint.toArray(),
      textPharmacology: textState.pharmacologyDistrict,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === 'pharmacology-labs') ?? null,
    };
  });

  if (audit.facilityCount !== 5) throw new Error(`Expected 5 Pharmacology facilities, found ${audit.facilityCount}`);
  if (audit.codes.join(',') !== 'P1,P2,P3,P4,P5') throw new Error(`Pharmacology facility codes are incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Pharmacology roots: ${audit.missingRoots.join(', ')}`);
  if (audit.legacyGenericNames.length) throw new Error(`Legacy generic Pharmacology buildings remain: ${audit.legacyGenericNames.join(', ')}`);
  if (audit.boundaryViolations.length) throw new Error(`Pharmacology facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 20))}`);
  if (audit.meshCount < 600) throw new Error(`Pharmacology exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.scaledMeshParentDetails.length) throw new Error(`Pharmacology detail inherited a scaled mesh transform: ${JSON.stringify(audit.scaledMeshParentDetails)}`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error('Pharmacology exterior names are not sufficiently deterministic');
  if (audit.animated.length < 150) throw new Error(`Pharmacology responsive systems are incomplete: ${audit.animated.length}`);
  if (audit.concentrationLights !== 74 || audit.waterBranches !== 4) throw new Error('Dose-Response landscape counts are incomplete');
  if (audit.responsivePanels !== 140 || audit.sequenceFins !== 128) throw new Error('Responsive or sequence facade counts are incomplete');
  if (audit.vectoriumPods !== 6 || audit.microfluidicCapsules !== 5 || audit.doseDialSectors !== 24) throw new Error('Vectorium or Chronopharm signatures are incomplete');
  if (!audit.routeAudit[0]?.walkable || !audit.routeAudit[0]?.resident) throw new Error('Dose-Response Promenade is unavailable to WALK');
  if (audit.routeAudit[1]?.walkable || !audit.routeAudit[1]?.resident) throw new Error('Toxicology service route is not separated from public circulation');
  if (audit.routeAudit.slice(2).some((route) => !route.walkable || !route.resident)) throw new Error(`Public Pharmacology routes are incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.roadGround === null) throw new Error('Dose-Response Promenade is not WALK-grounded');
  if (audit.textPharmacology?.buildingCount !== 5 || audit.textPharmacology?.identity !== 'The Therapeutic Gradient') throw new Error('Pharmacology metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 5 || audit.population?.therapeuticGradient !== true) throw new Error('Pharmacology population metadata is incomplete');
  if (audit.streaming?.detailResident !== true) throw new Error('Pharmacology detail package did not remain resident for inspection');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  for (const material of [
    'Pharmacology bone-white responsive ceramic',
    'Pharmacology pale satin titanium',
    'Pharmacology smoked electrochromic glass',
    'Pharmacology dark basalt podium',
    'Pharmacology black photovoltaic glass',
    'Pharmacology iridescent fluoropolymer membrane',
    'Pharmacology cold-white instrumentation light',
    'Pharmacology concentration mint light',
  ]) {
    if (!audit.materialNames.includes(material)) throw new Error(`Missing Pharmacology district material: ${material}`);
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
      const district = world.scene.getObjectByName('DISTRICT__pharmacology-labs');
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
      world.camera.position.set(center.x - size.x * 0.32, center.y + Math.max(size.x, size.z) * 0.5, center.z + size.z * 0.6);
      world.controls.target.copy(center).setY(2.6);
      world.controls.update();
      world.advanceTime(1_200);
    }, time);
    await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon');
  await page.screenshot({ path: `${OUTPUT}/therapeutic-gradient-overview.png` });
  await prepareDistrictView('night');
  await page.screenshot({ path: `${OUTPUT}/therapeutic-gradient-night.png` });

  const prepareFacilityView = async (code, cameraLocal, targetLocal, environment = { time: 'noon', weather: 'clear' }) => {
    await page.evaluate(({ code, cameraLocal, targetLocal, environment }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__pharmacology-labs');
      let facility = null;
      district.traverse((object) => {
        if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object;
      });
      if (!facility) throw new Error(`Pharmacology facility ${code} was unavailable`);
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

  await prepareFacilityView('P1', [14, 9, 16], [0, 2.0, 0]);
  await page.screenshot({ path: `${OUTPUT}/pharmakon-nexus.png` });
  await prepareFacilityView('P2', [14, 10, 16], [0, 4.1, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/ternary-gate-night.png` });
  await prepareFacilityView('P3', [18, 8, 14], [0, 1.8, 0]);
  await page.screenshot({ path: `${OUTPUT}/scriptorium-therapeutica.png` });
  await prepareFacilityView('P4', [14, 9, 15], [0, 2.8, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/vectorium-aegis-night.png` });
  await prepareFacilityView('P5', [18, 12, 18], [0, 4.6, 2.5], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/chronopharm-observatory-night.png` });

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__pharmacology-labs');
    const promenade = district.getObjectByName('PHARMACOLOGY__DOSE_RESPONSE_PROMENADE');
    const positions = promenade.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1));
    const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(promenade.matrixWorld);
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
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002) throw new Error(`Pharmacology WALK eye clearance is incorrect: ${JSON.stringify(walkAudit)}`);
  if (!walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Dose-Response Promenade WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/walk-dose-response-promenade.png` });

  const report = { audit, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
