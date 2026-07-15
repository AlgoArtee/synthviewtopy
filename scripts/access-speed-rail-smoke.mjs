import fs from 'node:fs';
import { chromium } from 'playwright';

const outputDirectory = 'output/access-speed-rail';
fs.mkdirSync(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#loading-screen.done', { timeout: 60_000 });
await page.waitForTimeout(900);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const industrial = world.scene.getObjectByName('DISTRICT__industrial-labs');
  world.setTimeOfDay('noon');
  world.setWeather('clear');
  const tropical = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  if (!industrial || !tropical) throw new Error('Required industrial or tropical group is missing');
  industrial.updateMatrixWorld(true);
  tropical.updateMatrixWorld(true);
  const worldPoint = (group, xyz) => world.camera.position.clone().fromArray(xyz).applyMatrix4(group.matrixWorld);
  const localPoint = (group, point) => point.clone().applyMatrix4(group.matrixWorld.clone().invert());
  const placeWalker = (group, xyz, targetXyz) => {
    world.setMode('walk');
    world.walkController.refreshNavigation();
    const point = worldPoint(group, xyz);
    const target = worldPoint(group, targetXyz);
    const ground = world.walkController.sampleGround(point.x, point.z);
    if (ground === null) throw new Error(`No walkable ground at ${xyz.join(',')}`);
    world.camera.position.set(point.x, ground + 0.162, point.z);
    world.camera.lookAt(target.x, ground + 0.162, target.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    return { point, target, ground };
  };

  const industrialPlot = industrial.getObjectByName('industrial-labs__PLOT');
  const tropicalBase = tropical.getObjectByName('tropical-rainforest-dome__SOLID_FOUNDATION');
  const tropicalRamp = tropical.getObjectByName('tropical-rainforest-dome__ACCESS_RAMP');
  const facilityNames = [
    'INDUSTRIAL__MAIN_MANUFACTURING_HALL',
    'INDUSTRIAL__ABANDONED_WAREHOUSE',
    'INDUSTRIAL__BRICK_POWER_STATION',
    'INDUSTRIAL__ADMINISTRATION_BUILDING',
    'INDUSTRIAL__WATER_TREATMENT_STRUCTURE',
    'INDUSTRIAL__BOILER_HOUSE',
    'INDUSTRIAL__RAIL_MAINTENANCE_SHED',
    'INDUSTRIAL__COLD_STORAGE_FACILITY',
    'INDUSTRIAL__RECYCLING_SORTING_HALL',
    'INDUSTRIAL__STORAGE_SILOS',
    'INDUSTRIAL__SECURITY_CHECKPOINT',
    'INDUSTRIAL__MAINTENANCE_TUNNEL_ENTRANCE',
  ];
  const facilityCenters = facilityNames.map((name) => {
    const facility = industrial.getObjectByName(name);
    if (!facility) throw new Error(`Missing facility ${name}`);
    return { name, point: facility.getWorldPosition(world.camera.position.clone()) };
  });
  let minimumFacilitySpacing = Number.POSITIVE_INFINITY;
  for (let i = 0; i < facilityCenters.length; i += 1) {
    for (let j = i + 1; j < facilityCenters.length; j += 1) {
      minimumFacilitySpacing = Math.min(
        minimumFacilitySpacing,
        Math.hypot(
          facilityCenters[i].point.x - facilityCenters[j].point.x,
          facilityCenters[i].point.z - facilityCenters[j].point.z,
        ),
      );
    }
  }

  placeWalker(industrial, [10.08, 0, 0], [9.2, 0, 0]);
  world.setWalkTurbo(false);
  world.setWalkIntent(0, 1, false);
  world.advanceTime(1100);
  world.setWalkIntent(0, 0);
  const industrialSideLocal = localPoint(industrial, world.camera.position);
  const industrialSideSnapshot = world.walkController.getSnapshot();

  const measureSpeed = (turbo) => {
    placeWalker(industrial, [-2.0, 0, 0.05], [2.0, 0, 0.05]);
    world.setWalkTurbo(turbo);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, false);
    world.advanceTime(1000);
    world.setWalkIntent(0, 0);
    return {
      distanceMetres: start.distanceTo(world.camera.position) * 10,
      snapshot: world.walkController.getSnapshot(),
    };
  };
  const normalSpeed = measureSpeed(false);
  const turboSpeed = measureSpeed(true);
  world.setWalkTurbo(false);

  // The corrected 18 cm foundation is intentionally step-accessible around
  // its perimeter; verify a direct island-to-biome-floor traversal.
  placeWalker(tropical, [7.05, 0, 0], [6.35, 0, 0]);
  world.setWalkIntent(0, 1, true);
  world.advanceTime(1250);
  world.setWalkIntent(0, 0);
  const tropicalSideLocal = localPoint(tropical, world.camera.position);
  const tropicalSnapshot = world.walkController.getSnapshot();

  // Use the Box3 constructor already present on the ramp geometry without
  // depending on a global THREE symbol in the application bundle.
  tropicalRamp.geometry.computeBoundingBox();
  const actualRampBounds = tropicalRamp.geometry.boundingBox.clone().applyMatrix4(tropicalRamp.matrixWorld);
  const coastalDetails = world.scene.getObjectByName('Coastal rocks and planting');
  let coastalRampIntersections = 0;
  coastalDetails?.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    child.geometry.computeBoundingBox();
    const bounds = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
    if (bounds.intersectsBox(actualRampBounds)) coastalRampIntersections += 1;
  });

  const railBeds = [];
  const rails = [];
  const trains = [];
  world.transitRoot.traverse((child) => {
    if (child.name.startsWith('Hexagonal coastal rail bed')) railBeds.push(child);
    if (child.name.startsWith('Coastal steel rail')) rails.push(child);
    if (child.name.startsWith('COASTAL_RAIL__TRAIN_')) trains.push(child);
  });
  const trainStart = trains[0]?.position.clone();
  world.advanceTime(3000);
  const trainTravel = trainStart && trains[0] ? trainStart.distanceTo(trains[0].position) : 0;

  return {
    industrial: {
      footprint: world.getDefinition('industrial-labs').footprint,
      plotHeight: industrialPlot.geometry.parameters.height,
      plotObstacle: industrialPlot.userData.navObstacle === true,
      sideLocalX: industrialSideLocal.x,
      sideGrounded: industrialSideSnapshot.grounded,
      minimumFacilitySpacingMetres: minimumFacilitySpacing * 10,
    },
    speed: {
      normal: normalSpeed,
      turbo: turboSpeed,
    },
    tropical: {
      foundationHeight: tropicalBase.geometry.parameters.height,
      foundationObstacle: tropicalBase.userData.navObstacle === true,
      rampLengthMetres: tropicalRamp.geometry.parameters.depth * 10,
      coastalRampIntersections,
      sideLocalX: tropicalSideLocal.x,
      grounded: tropicalSnapshot.grounded,
    },
    coastalRail: {
      metadata: world.transitRoot.userData.coastalRail,
      railBedCount: railBeds.length,
      steelRailCount: rails.length,
      trainCount: trains.length,
      firstTrainTravelMetres: trainTravel * 10,
    },
    textState: JSON.parse(window.render_game_to_text()),
  };
});

await page.locator('#walk-mode').click();
await page.locator('#walk-turbo').click();
const turboButton = await page.locator('#walk-turbo').evaluate((button) => ({
  pressed: button.getAttribute('aria-pressed'),
  text: button.textContent,
}));

await page.evaluate(() => {
  const world = window.labIsland;
  const industrial = world.scene.getObjectByName('DISTRICT__industrial-labs');
  const camera = world.camera.position.clone().set(13.2, 0.52, 8.8).applyMatrix4(industrial.matrixWorld);
  const target = world.controls.target.clone().set(0, 0.75, 0).applyMatrix4(industrial.matrixWorld);
  world.setMode('walk');
  world.camera.position.copy(camera);
  world.camera.lookAt(target);
  document.querySelectorAll('.atlas, .topbar, .scene-card, .layerbar, .compass, .interaction-hint').forEach((element) => {
    element.setAttribute('style', 'display:none');
  });
  world.advanceTime(1800);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/industrial-human-eye.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  const tropical = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  const camera = world.camera.position.clone().set(0, 0.62, 8.2).applyMatrix4(tropical.matrixWorld);
  const target = world.controls.target.clone().set(0, 0.24, 5.25).applyMatrix4(tropical.matrixWorld);
  world.camera.position.copy(camera);
  world.camera.lookAt(target);
  world.advanceTime(600);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/tropical-access.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('explore');
  const train = world.scene.getObjectByName('COASTAL_RAIL__TRAIN_1');
  if (!train) throw new Error('Coastal train unavailable for screenshot');
  train.userData.animate = '';
  train.updateMatrixWorld(true);
  const locomotive = train.getObjectByName('COASTAL_RAIL__LOCOMOTIVE_1');
  if (!locomotive) throw new Error('Coastal locomotive unavailable for screenshot');
  const camera = train.localToWorld(world.camera.position.clone().set(2.2, 0.75, 2.8));
  const target = train.localToWorld(world.controls.target.clone().set(0, 0.17, 0));
  world.camera.position.copy(camera);
  world.controls.target.copy(target);
  world.camera.near = 0.05;
  world.camera.updateProjectionMatrix();
  world.controls.update();
  world.controls.enabled = false;
  world.camera.lookAt(target);
  document.querySelector('.walk-hud')?.setAttribute('style', 'display:none');
  world.advanceTime(220);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/coastal-rail-train.png` });

console.log(JSON.stringify({ audit, turboButton, consoleErrors }, null, 2));

if (audit.industrial.plotHeight > 0.02 || audit.industrial.plotObstacle) throw new Error('Industrial parcel is still a blocking raised plinth');
if (audit.industrial.sideLocalX >= 10 || !audit.industrial.sideGrounded) throw new Error('Industrial side approach did not enter the paved parcel');
if (audit.industrial.minimumFacilitySpacingMetres < 21) throw new Error(`Industrial facilities remain too compressed: ${audit.industrial.minimumFacilitySpacingMetres} m`);
if (Math.abs(audit.speed.normal.distanceMetres - 1.8) > 0.25) throw new Error(`Normal WALK speed measured ${audit.speed.normal.distanceMetres} m/s`);
if (Math.abs(audit.speed.turbo.distanceMetres - 12) > 0.5) throw new Error(`Turbo speed measured ${audit.speed.turbo.distanceMetres} m/s`);
if (audit.tropical.foundationHeight > 0.02 || audit.tropical.foundationObstacle) throw new Error('Tropical Dome foundation is still inaccessible');
if (audit.tropical.rampLengthMetres > 2.5 || audit.tropical.coastalRampIntersections > 0) throw new Error('Tropical approach still intersects coastal rocks or is oversized');
if (audit.tropical.sideLocalX >= 6.77 || !audit.tropical.grounded) throw new Error('Tropical platform side traversal failed');
if (audit.coastalRail.railBedCount !== 6 || audit.coastalRail.steelRailCount !== 24 || audit.coastalRail.trainCount !== 3) throw new Error('Coastal railway is incomplete');
if (audit.coastalRail.firstTrainTravelMetres < 10) throw new Error('Coastal train did not animate');
if (turboButton.pressed !== 'true' || !turboButton.text.includes('12 m/s')) throw new Error('Turbo HUD control did not activate');
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

await browser.close();
