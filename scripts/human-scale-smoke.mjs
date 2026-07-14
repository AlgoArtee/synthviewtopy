import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const outputDirectory = 'output/human-scale-audit';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 60_000 });
await page.evaluate(() => document.querySelector('#walk-mode')?.click());
await page.waitForTimeout(600);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  world.walkController.refreshNavigation();

  const tropical = world.objectGroups.get('tropical-rainforest-dome');
  if (!tropical) throw new Error('Tropical Rainforest Dome was not found');
  tropical.updateMatrixWorld(true);

  const canopySegments = [];
  let canopyRail = null;
  let canopyPost = null;
  let biomeFloor = null;
  tropical.traverse((object) => {
    if (!object.isMesh) return;
    if (object.name === 'TROPICAL__ELEVATED_CANOPY_WALK') canopySegments.push(object);
    else if (!canopyRail && object.name === 'TROPICAL__CANOPY_WALK_RAIL') canopyRail = object;
    else if (!canopyPost && object.name === 'TROPICAL__CANOPY_WALK_POST') canopyPost = object;
    else if (object.name.endsWith('__BIOME_FLOOR')) biomeFloor = object;
  });
  if (!canopySegments.length || !canopyRail || !canopyPost || !biomeFloor) {
    throw new Error('Human-scale canopy audit objects were incomplete');
  }
  const district = world.objectGroups.get('pharmacology-labs');
  const districtRamp = district?.getObjectByName('pharmacology-labs__ACCESS_RAMP');
  const districtDoor = district?.getObjectByName('pharmacology-labs__WALK_ENTRY_DOOR');
  const domeRamp = tropical.getObjectByName('tropical-rainforest-dome__ACCESS_RAMP');
  const domeDoor = tropical.getObjectByName('tropical-rainforest-dome__AIRLOCK_ENTRY_DOOR');
  if (!districtRamp?.isMesh || !districtDoor?.isMesh || !domeRamp?.isMesh || !domeDoor?.isMesh) {
    throw new Error('Human-scale entrance audit objects were incomplete');
  }

  const firstSegment = canopySegments[0];
  biomeFloor.geometry.computeBoundingBox();
  const localFloorTop = biomeFloor.geometry.boundingBox.max.y;
  const floorWorldTop = biomeFloor.localToWorld(
    world.camera.position.clone().set(0, localFloorTop, 0),
  ).y;

  const entryLocal = firstSegment.userData.entryLocalStart;
  const entryWorld = world.camera.position.clone().fromArray(entryLocal).applyMatrix4(tropical.matrixWorld);
  const entryGround = world.walkController.sampleGround(entryWorld.x, entryWorld.z);

  world.walkController.enter(
    world.camera.position.clone().set(0, 0, 44),
    world.camera.position.clone().set(0, 0, -1),
  );
  const motionStart = world.camera.position.clone();
  world.setWalkIntent(0, 1, false);
  world.advanceTime(1000);
  const movingSnapshot = world.walkController.getSnapshot();
  world.setWalkIntent(0, 0, false);
  const walkDistanceMetres = world.camera.position.distanceTo(motionStart) * 10;

  const walkFov = world.camera.fov;
  world.setMode('explore');
  const restoredExploreFov = world.camera.fov;
  world.setMode('walk');
  world.walkController.refreshNavigation();

  const viewpointSegment = canopySegments[7];
  const targetSegment = canopySegments[13];
  const viewpoint = viewpointSegment.getWorldPosition(world.camera.position.clone());
  const ground = world.walkController.sampleGround(viewpoint.x, viewpoint.z);
  const target = targetSegment.getWorldPosition(world.camera.position.clone());
  world.camera.position.set(viewpoint.x, ground + 0.162, viewpoint.z);
  world.camera.lookAt(target.x, world.camera.position.y - 0.015, target.z);
  world.walkController.groundY = ground;
  world.walkController.grounded = true;

  const pathGeometry = firstSegment.geometry.parameters;
  const railGeometry = canopyRail.geometry.parameters;
  const postGeometry = canopyPost.geometry.parameters;
  return {
    scaleConvention: '1 world unit = 10 metres',
    personHeightMetres: 1.7,
    eyeHeightMetres: Number(((world.camera.position.y - ground) * 10).toFixed(3)),
    walkVerticalFovDegrees: walkFov,
    restoredExploreFovDegrees: restoredExploreFov,
    normalWalkSpeedMetresPerSecond: movingSnapshot.speedMetresPerSecond,
    normalWalkDistanceInOneSecondMetres: Number(walkDistanceMetres.toFixed(3)),
    islandSurfaceElevationMetres: 16.1,
    tropicalFinishedFloorWorldY: Number(floorWorldTop.toFixed(3)),
    tropicalFinishedFloorElevationMetres: Number((floorWorldTop * 10).toFixed(1)),
    canopyEntryRiseMetres: entryGround === null
      ? null
      : Number(((entryGround - floorWorldTop) * 10).toFixed(3)),
    canopyPathWidthMetres: Number((pathGeometry.width * 10).toFixed(3)),
    canopyDeckThicknessMetres: Number((pathGeometry.height * 10).toFixed(3)),
    guardrailTopMetresAboveDeck: Number(((postGeometry.height + railGeometry.radiusTop) * 10).toFixed(3)),
    handrailDiameterMetres: Number((railGeometry.radiusTop * 20).toFixed(3)),
    railPostDiameterMetres: Number((postGeometry.radiusTop * 20).toFixed(3)),
    districtRampWidthMetres: Number((districtRamp.geometry.parameters.width * 10).toFixed(3)),
    districtRampLengthMetres: Number((districtRamp.geometry.parameters.depth * 10).toFixed(3)),
    districtRampSlope: Number((3.4 / (districtRamp.geometry.parameters.depth * 10)).toFixed(4)),
    districtDoorHeightMetres: Number((districtDoor.geometry.parameters.height * 10).toFixed(3)),
    domeRampWidthMetres: Number((domeRamp.geometry.parameters.width * 10).toFixed(3)),
    domeRampLengthMetres: Number((domeRamp.geometry.parameters.depth * 10).toFixed(3)),
    domeRampSlope: Number((4 / (domeRamp.geometry.parameters.depth * 10)).toFixed(4)),
    domeDoorHeightMetres: Number((domeDoor.geometry.parameters.height * 10).toFixed(3)),
    canopySegments: canopySegments.length,
    groundedAtScreenshotViewpoint: world.walkController.getSnapshot().grounded,
  };
});

await page.waitForTimeout(350);
await page.screenshot({ path: `${outputDirectory}/tropical-walk-human-scale.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  const district = world.objectGroups.get('pharmacology-labs');
  const ramp = district?.getObjectByName('pharmacology-labs__ACCESS_RAMP');
  if (!district || !ramp) throw new Error('Representative district entrance was not found');
  district.updateMatrixWorld(true);
  const rampLength = ramp.geometry.parameters.depth;
  const cameraLocal = world.camera.position.clone().set(0, 0, ramp.position.z + rampLength * 0.5 + 0.35);
  const targetLocal = world.camera.position.clone().set(0, 0, ramp.position.z - rampLength * 0.5 - 0.35);
  const cameraWorld = cameraLocal.applyMatrix4(district.matrixWorld);
  const targetWorld = targetLocal.applyMatrix4(district.matrixWorld);
  const ground = world.walkController.sampleGround(cameraWorld.x, cameraWorld.z);
  world.camera.position.set(cameraWorld.x, ground + 0.162, cameraWorld.z);
  world.camera.lookAt(targetWorld.x, world.camera.position.y - 0.02, targetWorld.z);
  world.walkController.groundY = ground;
  world.walkController.grounded = true;
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/district-entry-human-scale.png` });

const closeEnough = (actual, expected, tolerance) => Math.abs(actual - expected) <= tolerance;
if (!closeEnough(audit.eyeHeightMetres, 1.62, 0.01)) throw new Error(`Eye height was ${audit.eyeHeightMetres} m`);
if (audit.walkVerticalFovDegrees !== 55) throw new Error(`WALK FOV was ${audit.walkVerticalFovDegrees}°`);
if (audit.restoredExploreFovDegrees !== 42) throw new Error(`Explore FOV restored to ${audit.restoredExploreFovDegrees}°`);
if (!closeEnough(audit.normalWalkSpeedMetresPerSecond, 1.4, 0.01)) throw new Error(`Walk speed was ${audit.normalWalkSpeedMetresPerSecond} m/s`);
if (!closeEnough(audit.normalWalkDistanceInOneSecondMetres, 1.4, 0.05)) throw new Error(`One-second walk covered ${audit.normalWalkDistanceInOneSecondMetres} m`);
if (!closeEnough(audit.tropicalFinishedFloorWorldY, 2.01, 0.005)) throw new Error(`Tropical floor world Y was ${audit.tropicalFinishedFloorWorldY}`);
if (!closeEnough(audit.canopyEntryRiseMetres, 0.16, 0.03)) throw new Error(`Canopy entry rise was ${audit.canopyEntryRiseMetres} m`);
if (!closeEnough(audit.canopyPathWidthMetres, 2.4, 0.01)) throw new Error(`Canopy path width was ${audit.canopyPathWidthMetres} m`);
if (!closeEnough(audit.canopyDeckThicknessMetres, 0.22, 0.01)) throw new Error(`Canopy deck thickness was ${audit.canopyDeckThicknessMetres} m`);
if (!closeEnough(audit.guardrailTopMetresAboveDeck, 1.1, 0.02)) throw new Error(`Guardrail height was ${audit.guardrailTopMetresAboveDeck} m`);
if (!closeEnough(audit.districtRampWidthMetres, 4, 0.01)) throw new Error(`District ramp width was ${audit.districtRampWidthMetres} m`);
if (!closeEnough(audit.districtRampLengthMetres, 41, 0.01) || audit.districtRampSlope > 1 / 12) throw new Error(`District ramp slope was ${audit.districtRampSlope}`);
if (!closeEnough(audit.districtDoorHeightMetres, 2.6, 0.01)) throw new Error(`District door height was ${audit.districtDoorHeightMetres} m`);
if (!closeEnough(audit.domeRampWidthMetres, 4, 0.01)) throw new Error(`Dome ramp width was ${audit.domeRampWidthMetres} m`);
if (!closeEnough(audit.domeRampLengthMetres, 48, 0.01) || audit.domeRampSlope > 1 / 12) throw new Error(`Dome ramp slope was ${audit.domeRampSlope}`);
if (!closeEnough(audit.domeDoorHeightMetres, 3, 0.01)) throw new Error(`Dome door height was ${audit.domeDoorHeightMetres} m`);
if (!audit.groundedAtScreenshotViewpoint) throw new Error('WALK was not grounded at the screenshot viewpoint');
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify({ audit, consoleErrors }, null, 2));
await browser.close();
