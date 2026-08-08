import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.INDUSTRIAL_DISTRICT_OUTPUT ?? 'output/industrial-district';
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
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.addInitScript(() => {
  localStorage.removeItem('youtopy_saved_project');
  localStorage.removeItem('youtopy_walk_speed_kmh');
});
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
await page.waitForTimeout(700);

await page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('explore');
  world.select('industrial-labs', 'system');
  world.focus('industrial-labs');
  world.setLayer('labels', false);
  world.setTimeOfDay('noon');
  world.setWeather('clear');
  document.querySelectorAll('.atlas, #inspector-panel, #scene-card, #edit-studio, .scene-card, .layerbar, .topbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
    element.setAttribute('style', 'display:none');
  });
  world.advanceTime(2600);
});
await page.waitForTimeout(1000);

async function frameDistrict(view, environment) {
  await page.evaluate(({ view, environment }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
    const definition = world.definitions.get('industrial-labs');
    if (!district || !definition) throw new Error('Industrial district was unavailable');
    const restore = world.worldStreaming.mountPackageAuthoritySources('industrial-labs');
    try {
      district.updateMatrixWorld(true);
      const facilities = [];
      district.traverse((object) => {
        if (object.userData.exteriorProgram === true) facilities.push(object);
      });
      const bounds = new world.selectionBounds.constructor();
      facilities.forEach((facility) => bounds.expandByObject(facility, true));
      const center = bounds.getCenter(world.camera.position.clone());
      const size = bounds.getSize(world.controls.target.clone());
      const radial = world.camera.up.clone().set(definition.position[0], 0, definition.position[2]).normalize();
      const tangent = world.camera.up.clone().set(-radial.z, 0, radial.x);
      const distance = Math.max(size.x, size.z);
      if (view === 'plan') {
        world.camera.position.copy(center).setY(center.y + distance * 0.72);
        world.camera.position.addScaledVector(tangent, distance * 0.04);
      } else if (view === 'coast') {
        world.camera.position.copy(center).addScaledVector(radial, distance * 0.38).addScaledVector(tangent, distance * 0.32).setY(center.y + distance * 0.23);
      } else {
        world.camera.position.copy(center).addScaledVector(radial, distance * 0.34).addScaledVector(tangent, -distance * 0.40).setY(center.y + distance * 0.26);
      }
      world.controls.target.copy(center).setY(center.y + 2.8);
      world.camera.fov = view === 'plan' ? 46 : 50;
      world.camera.updateProjectionMatrix();
      world.controls.update();
    } finally {
      restore?.();
    }
    world.setTimeOfDay(environment.time);
    world.setWeather(environment.weather);
    world.advanceTime(1200);
  }, { view, environment });
  await page.waitForTimeout(400);
}

await frameDistrict('overview', { time: 'noon', weather: 'clear' });
await page.screenshot({ path: `${OUTPUT}/industrial-works-overview-day.png` });
await frameDistrict('plan', { time: 'noon', weather: 'clear' });
await page.screenshot({ path: `${OUTPUT}/industrial-works-plan.png` });
await frameDistrict('coast', { time: 'night', weather: 'clear' });
await page.screenshot({ path: `${OUTPUT}/industrial-works-night.png` });

async function frameFacility(rootName, time = 'noon') {
  await page.evaluate(({ rootName, time }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
    const definition = world.definitions.get('industrial-labs');
    if (!district || !definition) throw new Error('Industrial district was unavailable');
    const restore = world.worldStreaming.mountPackageAuthoritySources('industrial-labs');
    try {
      district.updateMatrixWorld(true);
      const facility = district.getObjectByName(rootName);
      if (!facility) throw new Error(`Industrial facility ${rootName} was unavailable`);
      const bounds = new world.selectionBounds.constructor().setFromObject(facility, true);
      const center = bounds.getCenter(world.controls.target.clone());
      const size = bounds.getSize(world.camera.position.clone());
      const front = world.camera.up.clone().set(0, 0, 1).applyQuaternion(facility.getWorldQuaternion(world.camera.quaternion.clone())).setY(0).normalize();
      const side = world.camera.up.clone().set(front.z, 0, -front.x);
      const distance = Math.max(size.x, size.z, size.y * 1.2);
      world.camera.position.copy(center).addScaledVector(front, distance * 1.12).addScaledVector(side, distance * 0.68).setY(center.y + Math.max(size.y * 0.62, distance * 0.34));
      world.controls.target.copy(center).setY(center.y + size.y * 0.08);
      world.camera.fov = 48;
      world.camera.updateProjectionMatrix();
      world.controls.update();
    } finally {
      restore?.();
    }
    world.setTimeOfDay(time);
    world.setWeather('clear');
    world.advanceTime(700);
  }, { rootName, time });
  await page.waitForTimeout(250);
}

const facilityCaptures = [
  ['INDUSTRIAL_NEW__I01__SHIFT_MERIDIAN', 'shift-meridian-close.png'],
  ['INDUSTRIAL_NEW__I02__CONTINUOUS_WORKS', 'continuous-works-close.png'],
  ['INDUSTRIAL_NEW__I03__BLACK_KILN', 'black-kiln-close.png'],
  ['INDUSTRIAL_NEW__I04__VACUUM_CASTING_CATHEDRAL', 'vacuum-cathedral-close.png'],
  ['INDUSTRIAL_NEW__I08__AUTONOMOUS_MICROFACTORY_HIVE', 'microfactory-hive-close.png'],
  ['INDUSTRIAL_NEW__I12__PLATFORM_ZERO', 'platform-zero-close.png'],
  ['INDUSTRIAL_NEW__I15__BUILDING_NULL', 'building-null-close.png'],
  ['INDUSTRIAL__LEGACY_AUTOMATIC_WORKS_ANNEX', 'legacy-automatic-works-annex.png'],
];
for (const [rootName, fileName] of facilityCaptures) {
  await frameFacility(rootName);
  await page.screenshot({ path: `${OUTPUT}/${fileName}` });
}

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
  const definition = world.definitions.get('industrial-labs');
  if (!district || !definition?.sector) throw new Error('Industrial district missing during audit');
  const restore = world.worldStreaming.mountPackageAuthoritySources('industrial-labs');
  try {
    district.updateMatrixWorld(true);
    const names = [];
    const animated = [];
    const facilities = [];
    let meshCount = 0;
    let triangleCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.isMesh && object.geometry) {
        meshCount += 1;
        const position = object.geometry.getAttribute('position');
        triangleCount += object.geometry.index ? object.geometry.index.count / 3 : (position?.count ?? 0) / 3;
      }
      if (object.userData.animate) animated.push(object.userData.animate);
      if (object.userData.exteriorProgram === true) facilities.push(object);
    });

    const bounds2d = (object) => {
      const bounds = new world.selectionBounds.constructor().setFromObject(object, true);
      return { minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z, size: bounds.getSize(world.camera.position.clone()).toArray() };
    };
    const facilityBounds = facilities.map((facility) => ({ name: facility.userData.buildingName ?? facility.name, bounds: bounds2d(facility) }));
    const overlaps = [];
    for (let left = 0; left < facilityBounds.length; left += 1) {
      for (let right = left + 1; right < facilityBounds.length; right += 1) {
        const a = facilityBounds[left].bounds;
        const b = facilityBounds[right].bounds;
        const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
        const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
        if (overlapX > 0.12 && overlapZ > 0.12) overlaps.push({ a: facilityBounds[left].name, b: facilityBounds[right].name, overlapX, overlapZ });
      }
    }

    const sectorViolations = [];
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    facilities.forEach((facility) => {
      const bounds = new world.selectionBounds.constructor().setFromObject(facility, true);
      for (const x of [bounds.min.x, bounds.max.x]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const radius = Math.hypot(x, z);
          const angle = normalizeNear(Math.atan2(z, x), definition.sector.centerAngle);
          if (radius < definition.sector.innerRadius - 0.5 || radius > definition.sector.outerRadius + 0.5 || angle < definition.sector.startAngle - 0.01 || angle > definition.sector.endAngle + 0.01) {
            sectorViolations.push({ facility: facility.userData.buildingName ?? facility.name, radius, angle });
          }
        }
      }
    });

    const road = district.getObjectByName('INDUSTRIAL_NEW__PRODUCTION_MERIDIAN');
    if (!road?.isMesh) throw new Error('Production Meridian missing');
    const position = road.geometry.getAttribute('position');
    const sampleIndex = Math.floor(position.count * 0.18 / 2) * 2;
    const nextIndex = Math.min(position.count - 2, sampleIndex + 8);
    const roadPoint = world.camera.position.clone().set(position.getX(sampleIndex), position.getY(sampleIndex), position.getZ(sampleIndex)).applyMatrix4(road.matrixWorld);
    const roadNext = world.controls.target.clone().set(position.getX(nextIndex), position.getY(nextIndex), position.getZ(nextIndex)).applyMatrix4(road.matrixWorld);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    if (ground === null) throw new Error('Production Meridian has no walkable ground');
    world.setMode('walk');
    world.walkController.refreshNavigation();
    world.camera.position.set(roadPoint.x, ground + 0.162, roadPoint.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(roadNext.x, ground + 0.16, roadNext.z);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true);
    world.advanceTime(1000);
    world.setWalkIntent(0, 0);
    const walk = world.walkController.getSnapshot();
    const end = world.camera.position.clone();
    world.select('industrial-labs', 'system');
    const textState = JSON.parse(window.render_game_to_text());
    return {
      names: [...new Set(names)].sort(),
      animated: [...new Set(animated)].sort(),
      meshCount,
      triangleCount,
      facilities: facilities.map((facility) => ({ name: facility.userData.buildingName ?? facility.name, code: facility.userData.buildingCode ?? null })),
      facilityBounds,
      overlaps,
      sectorViolations,
      population: district.userData.population,
      industrial: district.userData.industrialDistrict,
      railExtension: district.userData.industrialRailExtension,
      textState,
      streaming: world.worldStreaming.getSnapshot().packages.find((entry) => entry.id === 'industrial-labs'),
      specializedRevision: world.getTextSnapshot().masterplan?.specializedDistrictLayoutRevision,
      walk: { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld },
    };
  } finally {
    restore?.();
  }
});

await page.waitForTimeout(250);
await page.screenshot({ path: `${OUTPUT}/production-meridian-walk.png` });

const requiredFacilities = [
  'The Shift Meridian', 'The Continuous Works', 'The Black Kiln', 'The Vacuum Casting Cathedral', 'The Metamaterial Loomworks',
  'The Cryogenic Forming Plant', 'The Additive Megafabrication Yard', 'The Autonomous Microfactory Hive', 'The Biogenic Materials Foundry',
  'The Machine Genesis Hall', 'The Destructive Testing Monolith', 'Platform Zero', 'The Thermal Recovery and Process Power Station',
  'The Closed-Loop Reclamation Works', 'Building Ø', 'Legacy Automatic Works Annex',
];
const missingFacilities = requiredFacilities.filter((name) => !audit.facilities.some((facility) => facility.name === name));
if (missingFacilities.length) throw new Error(`Missing industrial facilities: ${missingFacilities.join(', ')}`);

const signatureExpectations = [
  ['INDUSTRIAL_NEW__I01__EMPTY_WORKER_TRANSPORT_BAY_', 12],
  ['INDUSTRIAL_NEW__I02__MONUMENTAL_LOADING_BAY_', 48],
  ['INDUSTRIAL_NEW__I03__ELECTROMAGNETIC_INDUCTION_RING_', 3],
  ['INDUSTRIAL_NEW__I04__MIRROR_VACUUM_VESSEL_', 3],
  ['INDUSTRIAL_NEW__I05__TENSION_TOWER_', 6],
  ['INDUSTRIAL_NEW__I06__CIRCULAR_TRANSFER_PORT_', 5],
  ['INDUSTRIAL_NEW__I07__PRINTER_GANTRY_BRIDGE_', 6],
  ['INDUSTRIAL_NEW__I08__RECONFIGURABLE_HEX_CELL_', 36],
  ['INDUSTRIAL_NEW__I09__AMBER_BIOREACTOR_TOWER_', 12],
  ['INDUSTRIAL_NEW__I10__NESTED_ASSEMBLY_DOOR_', 24],
  ['INDUSTRIAL_NEW__I12__TERMINAL_TRACK_', 24],
  ['INDUSTRIAL_NEW__I13__SKELETAL_COOLING_RIB_', 30],
  ['INDUSTRIAL_NEW__I14__CYCLONE_SEPARATOR_', 9],
  ['INDUSTRIAL_NEW__I15__SENSOR_BOUNDARY_', 44],
  ['INDUSTRIAL_NEW__EXACT_FACILITY_APPROACH_', 15],
];
for (const [prefix, expected] of signatureExpectations) {
  const actual = audit.names.filter((name) => name.startsWith(prefix)).length;
  if (actual !== expected) throw new Error(`Expected ${expected} ${prefix} features, found ${actual}`);
}
if (audit.meshCount < 1200) throw new Error(`Industrial package lacks authored detail: ${audit.meshCount} meshes`);
if (audit.overlaps.length) throw new Error(`Industrial facilities overlap: ${JSON.stringify(audit.overlaps)}`);
if (audit.sectorViolations.length) throw new Error(`Industrial facilities cross sector red lines: ${JSON.stringify(audit.sectorViolations.slice(0, 8))}`);
if (audit.animated.length < 7) throw new Error(`Industrial automatic systems are too limited: ${audit.animated.join(', ')}`);
if (audit.population?.realizedFacilityCount !== 16 || audit.industrial?.buildingCount !== 15 || audit.industrial?.preservedLegacyBuildingCount !== 1) throw new Error(`Industrial population metadata is incorrect: ${JSON.stringify({ population: audit.population, industrial: audit.industrial })}`);
if (audit.textState.industrialDistrict?.buildingCount !== 15 || audit.textState.industrialDistrict?.facilities?.length !== 15) throw new Error(`Text state does not expose the complete fifteen-facility district: ${JSON.stringify(audit.textState.industrialDistrict)}`);
if (audit.specializedRevision !== 16) throw new Error(`Expected specialized layout revision 16, received ${audit.specializedRevision}`);
if (!audit.railExtension?.coastalRailwayPreserved || audit.railExtension?.connectionPoints?.length !== 2) throw new Error(`Coastal railway or relocated legacy metadata is incomplete: ${JSON.stringify(audit.railExtension)}`);
if (Math.abs(audit.walk.eyeClearance - 0.162) > 0.002 || !audit.walk.grounded || audit.walk.moved < 0.16) throw new Error(`Industrial WALK validation failed: ${JSON.stringify(audit.walk)}`);
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify({ audit: { ...audit, names: undefined, facilityBounds: undefined, industrial: { ...audit.industrial, buildings: undefined } }, consoleErrors }, null, 2));
await browser.close();
