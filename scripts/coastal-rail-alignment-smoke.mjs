import fs from 'node:fs';
import { chromium } from 'playwright';

const outputDirectory = 'output/coastal-rail-alignment';
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#loading-screen.done', { timeout: 90_000 });
await page.waitForTimeout(700);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('explore');
  world.setTimeOfDay('noon');
  world.setWeather('clear');
  world.advanceTime(600);

  const railBeds = [];
  const rails = [];
  const sleeperFields = [];
  const trains = [];
  world.transitRoot.traverse((object) => {
    if (object.name.startsWith('Hexagonal coastal rail bed')) railBeds.push(object);
    if (object.name.startsWith('Coastal steel rail')) rails.push(object);
    if (object.name.startsWith('Coastal railway sleepers')) sleeperFields.push(object);
    if (object.name.startsWith('COASTAL_RAIL__TRAIN_')) trains.push(object);
  });
  if (!railBeds.length || !rails.length || !sleeperFields.length || !trains.length) {
    throw new Error('The coastal railway assembly is incomplete');
  }

  const boundsOf = (object) => {
    object.updateWorldMatrix(true, false);
    object.geometry.computeBoundingBox();
    return object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
  };
  const firstTrain = trains[0];
  const trainStart = firstTrain.position.clone();
  world.advanceTime(3000);
  const trainTravelMetres = trainStart.distanceTo(firstTrain.position) * 10;
  firstTrain.userData.animate = '';
  firstTrain.updateMatrixWorld(true);

  const wheels = [];
  const bodies = [];
  firstTrain.traverse((object) => {
    if (object.name.endsWith('__WHEEL')) wheels.push(object);
    if (/^COASTAL_RAIL__(?:LOCOMOTIVE_\d+|CARRIAGE_\d+_\d+)$/.test(object.name)) bodies.push(object);
  });
  const railTopY = Math.max(...rails.map((rail) => boundsOf(rail).max.y));
  const wheelBottomY = Math.min(...wheels.map((wheel) => boundsOf(wheel).min.y));
  const bodyBottomY = Math.min(...bodies.map((body) => boundsOf(body).min.y));
  const wheelGaugeMetres = (
    Math.max(...wheels.map((wheel) => wheel.position.x))
    - Math.min(...wheels.map((wheel) => wheel.position.x))
  ) * 10;
  const railBedBounds = railBeds.map(boundsOf);
  const railBedMaterials = railBeds.flatMap((bed) => (
    Array.isArray(bed.material) ? bed.material : [bed.material]
  ));

  document.querySelectorAll('.atlas, .topbar, .scene-card, .layerbar, .compass, .mode-help, .walk-hud, .interaction-hint')
    .forEach((element) => element.setAttribute('style', 'display:none'));
  world.labelRoot.visible = false;

  const camera = firstTrain.localToWorld(world.camera.position.clone().set(1.45, 0.17, 2.05));
  const target = firstTrain.localToWorld(world.controls.target.clone().set(0, 0.2, -2.25));
  world.camera.position.copy(camera);
  world.camera.up.set(0, 1, 0);
  world.camera.near = 0.03;
  world.camera.fov = 58;
  world.camera.updateProjectionMatrix();
  world.controls.target.copy(target);
  world.controls.update();
  world.controls.enabled = false;
  world.camera.lookAt(target);
  world.renderer.render(world.scene, world.camera);

  return {
    counts: {
      railBeds: railBeds.length,
      rails: rails.length,
      sleeperFields: sleeperFields.length,
      trains: trains.length,
      firstTrainWheels: wheels.length,
      firstTrainBodies: bodies.length,
    },
    metadata: world.transitRoot.userData.coastalRail,
    trainTravelMetres,
    verticalDatum: {
      railTopY,
      wheelBottomY,
      bodyBottomY,
      wheelToRailGapMetres: (wheelBottomY - railTopY) * 10,
      bodyClearanceMetres: (bodyBottomY - railTopY) * 10,
      wheelGaugeMetres,
      railGaugeMetres: world.transitRoot.userData.coastalRail.trackGaugeMetres,
    },
    railBed: {
      minimumY: Math.min(...railBedBounds.map((bounds) => bounds.min.y)),
      maximumY: Math.max(...railBedBounds.map((bounds) => bounds.max.y)),
      maximumHeightMetres: Math.max(...railBedBounds.map((bounds) => bounds.max.y - bounds.min.y)) * 10,
      physicalDepth: railBeds.every((bed) => bed.userData.physicalDepth === true),
      defaultRenderOrder: railBeds.every((bed) => bed.renderOrder === 0),
      depthTest: railBedMaterials.every((material) => material.depthTest === true),
      depthWrite: railBedMaterials.every((material) => material.depthWrite === true),
      excludedFromAerialDecalMode: railBedMaterials.every((material) => material.userData.groundRoadDepthMode !== true),
    },
  };
});

await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/track-level-train.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  const train = world.scene.getObjectByName('COASTAL_RAIL__TRAIN_1');
  const camera = train.localToWorld(world.camera.position.clone().set(3.4, 2.65, 3.8));
  const target = train.localToWorld(world.controls.target.clone().set(0, 0.08, -2.35));
  world.camera.position.copy(camera);
  world.controls.target.copy(target);
  world.camera.lookAt(target);
  world.renderer.render(world.scene, world.camera);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/rail-profile-overview.png` });

fs.writeFileSync(`${outputDirectory}/audit.json`, JSON.stringify({ audit, consoleErrors }, null, 2));

if (audit.counts.railBeds !== 6 || audit.counts.rails !== 24 || audit.counts.sleeperFields !== 6) {
  throw new Error(`Coastal track geometry is incomplete: ${JSON.stringify(audit.counts)}`);
}
if (audit.counts.trains !== 3 || audit.counts.firstTrainWheels !== 16 || audit.counts.firstTrainBodies !== 4) {
  throw new Error(`Coastal rolling stock is incomplete: ${JSON.stringify(audit.counts)}`);
}
if (!audit.railBed.physicalDepth || !audit.railBed.defaultRenderOrder
  || !audit.railBed.depthTest || !audit.railBed.depthWrite || !audit.railBed.excludedFromAerialDecalMode) {
  throw new Error(`The coastal rail bed can still occlude raised track geometry: ${JSON.stringify(audit.railBed)}`);
}
if (audit.railBed.maximumHeightMetres > 0.13) {
  throw new Error(`The coastal rail bed is too tall: ${audit.railBed.maximumHeightMetres} m`);
}
if (Math.abs(audit.verticalDatum.wheelToRailGapMetres) > 0.01) {
  throw new Error(`Wheel tread misses the rail head by ${audit.verticalDatum.wheelToRailGapMetres} m`);
}
if (audit.verticalDatum.bodyClearanceMetres < 0.2) {
  throw new Error(`Train body remains buried in the rail profile: ${audit.verticalDatum.bodyClearanceMetres} m`);
}
if (Math.abs(audit.verticalDatum.wheelGaugeMetres - audit.verticalDatum.railGaugeMetres) > 0.001) {
  throw new Error(`Wheel gauge ${audit.verticalDatum.wheelGaugeMetres} m does not match rail gauge ${audit.verticalDatum.railGaugeMetres} m`);
}
if (audit.trainTravelMetres < 10) throw new Error('The corrected coastal train did not animate');
if (consoleErrors.length) throw new Error(`Browser errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify({ audit, consoleErrors }, null, 2));
await browser.close();
