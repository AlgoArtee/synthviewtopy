import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.MICROBIOLOGY_OUTPUT ?? 'output/microbiology-district';
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
  await page.waitForTimeout(700);
  await page.evaluate(() => window.advanceTime(240));
  await page.evaluate(() => window.labIsland.select('microbiology-labs', 'scene'));
  await page.waitForFunction(() => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === 'microbiology-labs' && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__microbiology-labs');
    const definition = world.definitions.get('microbiology-labs');
    if (!district || !definition?.sector) throw new Error('Microbiology Labs District is unavailable');
    district.updateMatrixWorld(true);
    world.select('microbiology-labs', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(15),
      mode: 'explore',
      selectedPackageId: 'microbiology-labs',
      interiorPackageId: null,
      force: true,
    });

    const facilities = [];
    const names = [];
    const materials = new Set();
    const animated = [];
    const scaledMeshParentDetails = [];
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animationProfile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animationProfile) animated.push({ name: object.name, animate: animationProfile });
      if (!object.isMesh) return;
      meshCount += 1;
      if (object.parent?.isMesh && (
        Math.abs(object.parent.scale.x - 1) > 0.001
        || Math.abs(object.parent.scale.y - 1) > 0.001
        || Math.abs(object.parent.scale.z - 1) > 0.001
      )) scaledMeshParentDetails.push({ name: object.name, parent: object.parent.name });
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materials.add(material.name));
    });

    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const sector = definition.sector;
    const boundaryViolations = [];
    const facilityBounds = [];
    facilities.forEach((facility) => {
      const minWorld = world.camera.position.clone().set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      const maxWorld = world.camera.position.clone().set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
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
              minWorld.min(point);
              maxWorld.max(point);
              const radius = Math.hypot(point.x, point.z);
              const angle = normalizeNear(Math.atan2(point.z, point.x), sector.centerAngle);
              if (
                radius < sector.innerRadius - 0.3
                || radius > sector.outerRadius + 0.3
                || angle < sector.startAngle - 0.014
                || angle > sector.endAngle + 0.014
              ) boundaryViolations.push({ code: facility.userData.buildingCode, name: object.name, radius, angle });
            }
          }
        }
      });
      facilityBounds.push({
        code: facility.userData.buildingCode,
        min: minWorld.toArray(),
        max: maxWorld.toArray(),
      });
    });

    const overlapPairs = [];
    for (let first = 0; first < facilityBounds.length; first += 1) {
      for (let second = first + 1; second < facilityBounds.length; second += 1) {
        const a = facilityBounds[first];
        const b = facilityBounds[second];
        const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
        const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
        if (overlapX > 1.2 && overlapZ > 1.2) overlapPairs.push({ codes: [a.code, b.code], overlapX, overlapZ });
      }
    }

    const routeNames = [
      'MICROBIOLOGY__WEST_RESEARCH_SPINE',
      'MICROBIOLOGY__EAST_RESEARCH_SPINE',
      'MICROBIOLOGY__INNER_COLONY_ARC',
      'MICROBIOLOGY__OUTER_RESEARCH_ARC',
      'MICROBIOLOGY__BUILDING_APPROACH_M1',
      'MICROBIOLOGY__BUILDING_APPROACH_M2',
      'MICROBIOLOGY__BUILDING_APPROACH_M3',
      'MICROBIOLOGY__BUILDING_APPROACH_M4',
      'MICROBIOLOGY__BUILDING_APPROACH_M5',
    ];
    const routes = routeNames.map((name) => district.getObjectByName(name));
    const walkRoute = routes[0];
    if (!walkRoute?.isMesh) throw new Error('Microbiology west research spine is missing');
    const positions = walkRoute.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair);
    const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation();
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.microbiologyDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort(),
      displayNames: facilities.map((facility) => facility.userData.displayName).sort(),
      dimensions: facilities.map((facility) => ({
        code: facility.userData.buildingCode,
        footprintMetres: facility.userData.footprintMetres,
        heightMetres: facility.userData.heightMetres,
        placementZone: facility.userData.placementZone,
        worldPosition: facility.getWorldPosition(world.camera.position.clone()).toArray(),
      })),
      facilityBounds,
      meshCount,
      uniqueNames: new Set(names).size,
      materialNames: [...materials].sort(),
      animated,
      scaledMeshParentDetails,
      boundaryViolations,
      overlapPairs,
      missingRoots: [
        'MICROBIOLOGY__M1__THE_LYTIC_CROWN',
        'MICROBIOLOGY__M2__THE_SYMBIOME_TERRACES',
        'MICROBIOLOGY__M3__THE_METABOLITE_FOUNDRY',
        'MICROBIOLOGY__M4__THE_BLACK_BRINE_OBSERVATORY',
        'MICROBIOLOGY__M5__THE_ONE_HEALTH_SENTINEL',
      ].filter((name) => !district.getObjectByName(name)),
      signatureCounts: {
        lysisPerforations: names.filter((name) => name.startsWith('MICROBIOLOGY__M1__LYSIS_PERFORATION_')).length,
        symbiomeCrescents: names.filter((name) => name.match(/^MICROBIOLOGY__M2__.+_CRESCENT$/)).length,
        fermentationTowers: names.filter((name) => name.endsWith('_PRODUCTION_TOWER')).length,
        extremePods: names.filter((name) => name.match(/^MICROBIOLOGY__M4__.+_TEST_POD_/)).length,
        sentinelMullions: names.filter((name) => name.startsWith('MICROBIOLOGY__M5__PRECISE_VERTICAL_MULLION_')).length,
        colonyPlazas: names.filter((name) => name.match(/^MICROBIOLOGY__COLONY_PLAZA_\d+$/)).length,
        waterChannels: names.filter((name) => name.startsWith('MICROBIOLOGY__SHALLOW_RESEARCH_WATER_CHANNEL_')).length,
        gardens: names.filter((name) => name.startsWith('MICROBIOLOGY__BIOSENSOR_GARDEN_')).length,
      },
      routeAudit: routes.map((route) => ({ name: route?.name ?? null, walkable: route?.userData.walkable === true, resident: Boolean(route?.parent) })),
      roadGround: world.walkController.sampleGround(roadPoint.x, roadPoint.z),
      roadPoint: roadPoint.toArray(),
      textMicrobiology: textState.microbiologyDistrict,
      planning: textState.planning,
      streaming: streaming.packages.find((entry) => entry.id === 'microbiology-labs') ?? null,
    };
  });

  await writeFile(`${OUTPUT}/audit-baseline.json`, `${JSON.stringify({ audit, errors }, null, 2)}\n`);

  if (audit.facilityCount !== 5 || audit.codes.join(',') !== 'M1,M2,M3,M4,M5') throw new Error(`Microbiology facility program is incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Microbiology roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 650) throw new Error(`Microbiology exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.96) throw new Error('Microbiology exterior names are not sufficiently deterministic');
  if (audit.scaledMeshParentDetails.length) throw new Error(`Microbiology detail inherited a scaled mesh transform: ${JSON.stringify(audit.scaledMeshParentDetails)}`);
  if (audit.boundaryViolations.length) throw new Error(`Microbiology facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 18))}`);
  if (audit.overlapPairs.length) throw new Error(`Microbiology facility envelopes overlap: ${JSON.stringify(audit.overlapPairs)}`);
  if (audit.animated.length < 30) throw new Error(`Microbiology responsive systems are incomplete: ${audit.animated.length}`);
  if (Object.values(audit.signatureCounts).join(',') !== '84,3,4,5,64,3,2,24') throw new Error(`Microbiology signatures are incomplete: ${JSON.stringify(audit.signatureCounts)}`);
  if (audit.routeAudit.some((route) => !route.walkable || !route.resident)) throw new Error(`Microbiology public routes are incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.program?.circulation?.majorRouteCount !== 4 || audit.program?.circulation?.directCrossSiteDiagonals !== 0) throw new Error('Microbiology route hierarchy metadata is incomplete');
  if (audit.roadGround === null) throw new Error('Microbiology west research spine is not WALK-grounded');
  if (audit.textMicrobiology?.buildingCount !== 5 || audit.textMicrobiology?.identity !== 'Microbiology Labs District') throw new Error('Microbiology metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 5 || audit.population?.microbialSystemsLandscape !== true) throw new Error('Microbiology population metadata is incomplete');
  if (audit.streaming?.detailResident !== true) throw new Error('Microbiology detail package did not remain resident for inspection');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  for (const material of [
    'Microbiology pale antimicrobial ceramic',
    'Microbiology silver titanium',
    'Microbiology cyan green violet iridescent glass',
    'Microbiology sterilized basalt foundation',
    'Black Brine sintered black ceramic',
    'Metabolite amber scientific glass',
    'Microbiology cyan communication light',
  ]) if (!audit.materialNames.includes(material)) throw new Error(`Missing Microbiology material: ${material}`);

  await page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none'));
  });

  const prepareDistrictView = async (time = 'noon') => {
    await page.evaluate((time) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__microbiology-labs');
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
      world.camera.up.set(0, 1, 0);
      if (time === 'night') {
        world.camera.position.set(center.x - size.x * 0.82, center.y + Math.max(size.x, size.z) * 0.46, center.z - size.z * 0.72);
      } else {
        world.camera.position.set(center.x - size.x * 0.86, center.y + Math.max(size.x, size.z) * 0.79, center.z + size.z * 0.24);
      }
      world.controls.target.copy(center).setY(3.8);
      world.controls.update();
      world.advanceTime(1_200);
    }, time);
    await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon');
  await page.screenshot({ path: `${OUTPUT}/microbiology-district-overview.png` });
  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__microbiology-labs');
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
    const verticalExtent = Math.max(size.z, size.x / world.camera.aspect);
    const altitude = verticalExtent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360);
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.cameraTween = null;
    world.camera.up.set(0, 0, -1);
    world.camera.position.set(center.x, Math.max(altitude, 82), center.z + 0.001);
    world.controls.target.set(center.x, 0, center.z);
    world.controls.update();
    world.advanceTime(500);
  });
  await page.waitForTimeout(280);
  await page.screenshot({ path: `${OUTPUT}/microbiology-road-network-plan.png` });
  await prepareDistrictView('night');
  await page.screenshot({ path: `${OUTPUT}/microbiology-district-night.png` });

  const facilityViews = {
    M1: { camera: [16, 11, 18], target: [0, 4.8, 1] },
    M2: { camera: [18, 10, 18], target: [0, 2.8, 0] },
    M3: { camera: [23, 14, 23], target: [0, 5.8, 0] },
    M4: { camera: [-22, 14, 23], target: [0, 3.8, 1.5] },
    M5: { camera: [0, 18, -28], target: [0, 6.2, 1] },
  };
  for (const [code, view] of Object.entries(facilityViews)) {
    await page.evaluate(({ code, view }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__microbiology-labs');
      let facility = null;
      district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; });
      facility.updateMatrixWorld(true);
      world.setMode('explore');
      world.setTimeOfDay(code === 'M3' || code === 'M4' ? 'night' : 'noon');
      world.setWeather('clear');
      world.clearSelection('system');
      world.cameraTween = null;
      world.camera.position.copy(world.camera.position.clone().fromArray(view.camera).applyMatrix4(facility.matrixWorld));
      world.controls.target.copy(world.controls.target.clone().fromArray(view.target).applyMatrix4(facility.matrixWorld));
      world.controls.update();
      world.advanceTime(900);
    }, { code, view });
    await page.waitForTimeout(280);
    await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__microbiology-labs');
    const spine = district.getObjectByName('MICROBIOLOGY__WEST_RESEARCH_SPINE');
    const positions = spine.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2));
    const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1));
    const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(spine.matrixWorld);
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
    return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002) throw new Error(`Microbiology WALK eye clearance is incorrect: ${JSON.stringify(walkAudit)}`);
  if (!walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Microbiology research spine WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/walk-research-spine.png` });

  const report = { audit, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
