import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.SECURITY_DISTRICT_OUTPUT ?? 'output/security-district';
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
  await page.evaluate(() => window.advanceTime(180));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__security');
    const definition = world.definitions.get('security');
    if (!district || !definition?.sector) throw new Error('Security District is unavailable');
    district.updateMatrixWorld(true);
    world.select('security', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(12),
      mode: 'explore',
      selectedPackageId: 'security',
      interiorPackageId: null,
      force: true,
    });
    const facilities = [];
    const names = [];
    const materialNames = new Set();
    let meshCount = 0;
    const scaledMeshParentDetails = [];
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
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
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) {
          for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
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

    const roads = [
      'SECURITY__MAIN_CURVED_BOULEVARD',
      'SECURITY__OPERATIONAL_SERVICE_ARC',
      'SECURITY__PERIMETER_MAINTENANCE_ARC',
      'SECURITY__RADIAL_SERVICE_ROUTE_1',
      'SECURITY__RADIAL_SERVICE_ROUTE_2',
      'SECURITY__RADIAL_SERVICE_ROUTE_3',
    ].map((name) => district.getObjectByName(name));
    const mainRoad = roads[0];
    if (!mainRoad?.isMesh) throw new Error('Security main boulevard is missing');
    const roadPositions = mainRoad.geometry.attributes.position;
    const middlePair = Math.floor(roadPositions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(roadPositions, middlePair);
    const b = world.camera.position.clone().fromBufferAttribute(roadPositions, middlePair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(mainRoad.matrixWorld);
    world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.securityDistrict,
      population: district.userData.population,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort(),
      displayNames: facilities.map((facility) => facility.userData.displayName).sort(),
      facilityCount: facilities.length,
      meshCount,
      scaledMeshParentDetails,
      uniqueNames: new Set(names).size,
      materialNames: [...materialNames].sort(),
      requiredNames: [
        'SECURITY__S1__PORTA_AEGIS',
        'SECURITY__S2__PRAESIDIUM_NEXUS',
        'SECURITY__S3__SENTINEL_CROWN',
        'SECURITY__S4__SCUTUM_BLACKGLASS',
        'SECURITY__S5__FORUM_MERIDIAN',
        'SECURITY__S6__CELERITAS_RESPONSE_ARC',
        'SECURITY__S7__STRIX_AVIARY',
        'SECURITY__S8__CERBERUS_YARD',
        'SECURITY__S9__VIA_CUSTOS',
        'SECURITY__S10__JANUS_CLEAN_GATE',
        'SECURITY__S11__CUSTODIA_VAULT',
        'SECURITY__S12__SILENTIUM_BUREAU',
        'SECURITY__S13__AEGIS_PROVING_HALL',
        'SECURITY__S14__CONCORDIA_COURT',
        'SECURITY__S15__LIMES_FORGE',
      ].filter((name) => !district.getObjectByName(name)),
      roadAudit: roads.map((road) => ({
        name: road?.name ?? null,
        walkable: road?.userData.walkable === true,
        resident: Boolean(road?.parent),
      })),
      roadGround: ground,
      roadPoint: roadPoint.toArray(),
      boundaryViolations,
      textSecurity: textState.securityDistrict,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === 'security') ?? null,
    };
  });

  if (audit.facilityCount !== 15) throw new Error(`Expected 15 Security facilities, found ${audit.facilityCount}`);
  if (new Set(audit.codes).size !== 15 || audit.codes[0] !== 'S1' || !audit.codes.includes('S15')) {
    throw new Error(`Security facility codes are incomplete: ${audit.codes.join(', ')}`);
  }
  if (audit.requiredNames.length) throw new Error(`Missing Security roots: ${audit.requiredNames.join(', ')}`);
  if (audit.boundaryViolations.length) {
    throw new Error(`Security facilities cross the road-bounded district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 12))}`);
  }
  if (audit.meshCount < 320) throw new Error(`Security exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.scaledMeshParentDetails.length) {
    throw new Error(`Security detail inherited a scaled mesh transform: ${JSON.stringify(audit.scaledMeshParentDetails)}`);
  }
  if (audit.uniqueNames < audit.meshCount * 0.9) throw new Error('Security exterior names are not sufficiently deterministic');
  if (audit.roadAudit.some((road) => !road.resident || !road.walkable)) {
    throw new Error(`Security road hierarchy is incomplete: ${JSON.stringify(audit.roadAudit)}`);
  }
  if (audit.roadGround === null) throw new Error('The main Security boulevard is not WALK-grounded');
  if (audit.textSecurity?.buildingCount !== 15 || audit.textSecurity?.identity !== 'The Aegis Arc') {
    throw new Error('Security metadata is missing from render_game_to_text()');
  }
  if (audit.population?.realizedFacilityCount !== 15 || audit.population?.aegisArc !== true) {
    throw new Error('Security population metadata is incomplete');
  }
  if (audit.streaming?.detailResident !== true) throw new Error('Security detail package did not remain resident for inspection');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  for (const material of [
    'Aegis frost-white ceramic composite',
    'Aegis charcoal basalt-fibre concrete',
    'Aegis brushed marine-grade titanium',
    'Aegis smoked electrochromic glass',
    'Aegis dark stone paving',
  ]) {
    if (!audit.materialNames.includes(material)) throw new Error(`Missing district material: ${material}`);
  }

  const hideUi = async () => page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
  });
  await hideUi();

  const prepareDistrictView = async () => {
    await page.evaluate(() => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__security');
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
      world.setTimeOfDay('noon');
      world.setWeather('clear');
      world.cameraTween = null;
      world.camera.position.set(center.x - size.x * 0.2, center.y + Math.max(size.x, size.z) * 0.62, center.z + size.z * 0.56);
      world.controls.target.copy(center).setY(1.2);
      world.controls.update();
      world.advanceTime(900);
    });
    await page.waitForTimeout(350);
  };
  await prepareDistrictView();
  await page.screenshot({ path: `${OUTPUT}/aegis-arc-overview.png` });

  const prepareFacilityView = async (code, cameraLocal, targetLocal, environment = { time: 'noon', weather: 'clear' }) => {
    await page.evaluate(({ code, cameraLocal, targetLocal, environment }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__security');
      let facility = null;
      district.traverse((object) => {
        if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object;
      });
      if (!facility) throw new Error(`Security facility ${code} was unavailable`);
      facility.updateMatrixWorld(true);
      world.setMode('explore');
      world.setTimeOfDay(environment.time);
      world.setWeather(environment.weather);
      world.cameraTween = null;
      world.camera.position.copy(world.camera.position.clone().fromArray(cameraLocal).applyMatrix4(facility.matrixWorld));
      world.controls.target.copy(world.controls.target.clone().fromArray(targetLocal).applyMatrix4(facility.matrixWorld));
      world.controls.update();
      world.advanceTime(800);
    }, { code, cameraLocal, targetLocal, environment });
    await page.waitForTimeout(300);
  };

  await prepareFacilityView('S1', [0, 4.1, 15.5], [0, 1.15, 0]);
  await page.screenshot({ path: `${OUTPUT}/porta-aegis-threshold.png` });
  await prepareFacilityView('S2', [10.5, 7.2, 13.5], [0, 2.0, 0]);
  await page.screenshot({ path: `${OUTPUT}/praesidium-command-core.png` });
  await prepareFacilityView('S3', [10.5, 8.5, 14.2], [0, 6.8, 0], { time: 'night', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/sentinel-crown-night.png` });
  await prepareFacilityView('S4', [10, 5.3, 12], [0, 1.0, 0], { time: 'night', weather: 'fog' });
  await page.screenshot({ path: `${OUTPUT}/scutum-blackglass-night.png` });
  await prepareFacilityView('S6', [0, 3.6, 14.5], [0, 0.9, 1.5]);
  await page.screenshot({ path: `${OUTPUT}/celeritas-response-arc.png` });
  await prepareFacilityView('S10', [0, 4.4, 13.8], [0, 0.9, 0]);
  await page.screenshot({ path: `${OUTPUT}/janus-clean-gate.png` });
  await prepareFacilityView('S13', [18, 10.5, 21], [0, 1.1, 0]);
  await page.screenshot({ path: `${OUTPUT}/aegis-proving-hall.png` });
  await prepareFacilityView('S15', [13.5, 6.4, 14.5], [0, 1.1, 0], { time: 'night', weather: 'rain' });
  await page.screenshot({ path: `${OUTPUT}/limes-forge-coast.png` });

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__security');
    const mainRoad = district.getObjectByName('SECURITY__MAIN_CURVED_BOULEVARD');
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
    throw new Error(`Security WALK eye clearance is incorrect: ${JSON.stringify(walkAudit)}`);
  }
  if (!walkAudit.grounded || walkAudit.moved < 0.12) {
    throw new Error(`Security boulevard WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-main-boulevard.png` });

  const report = { audit, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
