import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const outputDirectory = 'output/industrial-railway';
fs.mkdirSync(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const railwayWarnings = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
  if (message.type() === 'warning' && message.text().includes('[IndustrialRailway]')) railwayWarnings.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#loading-screen.done', { timeout: 60_000 });
await page.waitForTimeout(900);

const prepareView = async (camera, target, environment = { time: 'noon', weather: 'fog' }) => {
  await page.evaluate(({ camera, target, environment }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
    if (!district) throw new Error('Industrial district unavailable');
    district.updateMatrixWorld(true);
    world.setMode('explore');
    world.cameraTween = null;
    world.setTimeOfDay(environment.time);
    world.setWeather(environment.weather);
    world.setLayer('labels', false);
    world.camera.position.fromArray(camera).applyMatrix4(district.matrixWorld);
    world.controls.target.fromArray(target).applyMatrix4(district.matrixWorld);
    world.controls.update();
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(1200);
  }, { camera, target, environment });
  await page.waitForTimeout(300);
};

await prepareView([12.8, 12.4, 14.2], [-1.5, 0.3, 0.25]);
await page.screenshot({ path: `${outputDirectory}/network-elevated.png` });
await prepareView([-14.2, 0.3, -1.15], [13.2, 0.35, 0.65], { time: 'noon', weather: 'clear' });
await page.screenshot({ path: `${outputDirectory}/branch-human-eye.png` });
await prepareView([-10.8, 4.8, 7.0], [1.0, 0.3, 0.8], { time: 'noon', weather: 'clear' });
await page.screenshot({ path: `${outputDirectory}/freight-yard.png` });

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
  const railway = district?.getObjectByName('INDUSTRIAL__RAILWAY');
  if (!district || !railway) throw new Error('Spline industrial railway missing');
  railway.updateMatrixWorld(true);
  const hierarchy = railway.children.map((child) => child.name);
  const tracks = [];
  let instancedMeshes = 0;
  let sleeperInstances = 0;
  let bufferStops = 0;
  let switchBlades = 0;
  let frogs = 0;
  let guardRails = 0;
  railway.traverse((object) => {
    if (object.userData.railwayTrack) tracks.push(object.userData);
    if (object.isInstancedMesh) instancedMeshes += 1;
    if (object.name.endsWith('__SLEEPERS') && object.isInstancedMesh) sleeperInstances += object.count;
    if (object.userData.bufferStop) bufferStops += 1;
    if (object.name.endsWith('__SWITCH_BLADES')) switchBlades += 1;
    if (object.name.endsWith('__CROSSING_FROG')) frogs += 1;
    if (object.name.endsWith('__GUARD_RAILS')) guardRails += 1;
  });
  const Vector3 = district.position.constructor;
  const surfaceHits = [
    [-14, -0.8],
    [-10, -0.7],
    [-4, -0.6],
    [2, 0.2],
    [8, 1.1],
  ].map(([x, z]) => {
    const worldPoint = district.localToWorld(new Vector3(x, 4, z));
    const controller = world.walkController;
    controller.rayOrigin.set(worldPoint.x, 40, worldPoint.z);
    world.raycaster.set(controller.rayOrigin, controller.down);
    world.raycaster.near = 0;
    world.raycaster.far = 80;
    const hits = world.raycaster.intersectObjects(world.scene.children, true).slice(0, 8);
    return {
      local: [x, z],
      hits: hits.map((hit) => ({ name: hit.object.name, y: Number(hit.point.y.toFixed(3)) })),
    };
  });
  return {
    hierarchy,
    metadata: railway.userData.railwaySystem,
    tracks,
    instancedMeshes,
    sleeperInstances,
    bufferStops,
    switchBlades,
    frogs,
    guardRails,
    surfaceHits,
    renderText: JSON.parse(window.render_game_to_text()),
    rendererCalls: world.renderer.info.render.calls,
  };
});

const walkAudit = await page.evaluate(() => {
  const world = window.labIsland;
  const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
  if (!district) throw new Error('Industrial district unavailable for WALK audit');
  const Vector3 = district.position.constructor;
  district.updateMatrixWorld(true);
  const spawn = district.localToWorld(new Vector3(2, 1, 0.2));
  const target = district.localToWorld(new Vector3(8, 0.4, 0.35));
  world.camera.position.copy(spawn);
  world.controls.target.copy(target);
  world.controls.update();
  world.setMode('walk');
  world.advanceTime(250);
  const start = world.walkController.getSnapshot();
  world.walkController.setMoveIntent(0, 1, false);
  world.advanceTime(2000);
  world.walkController.setMoveIntent(0, 0, false);
  world.advanceTime(100);
  const end = world.walkController.getSnapshot();
  return {
    start,
    end,
    distanceWorld: Number(Math.hypot(
      end.positionWorld[0] - start.positionWorld[0],
      end.positionWorld[2] - start.positionWorld[2],
    ).toFixed(3)),
    eyeClearanceWorld: end.groundY === null ? null : Number((end.positionWorld[1] - end.groundY).toFixed(3)),
  };
});

const expectedHierarchy = [
  'INDUSTRIAL_RAILWAY__MAIN_LINE',
  'INDUSTRIAL_RAILWAY__INDUSTRIAL_BRANCH',
  'INDUSTRIAL_RAILWAY__FREIGHT_YARD',
  'INDUSTRIAL_RAILWAY__INDUSTRIAL_SIDINGS',
  'INDUSTRIAL_RAILWAY__FACTORY_TRACKS',
  'INDUSTRIAL_RAILWAY__TURNOUTS',
  'INDUSTRIAL_RAILWAY__CROSSINGS',
  'INDUSTRIAL_RAILWAY__RAILWAY_PROPS',
];
assert.deepEqual(audit.hierarchy, expectedHierarchy);
assert.deepEqual(audit.metadata.categoryCounts, { main: 2, branch: 1, siding: 3, yard: 5, factory: 3 });
assert.equal(audit.metadata.configuredTrackCount, 14);
assert.equal(audit.metadata.renderedTrackCount, 14);
assert.deepEqual(audit.metadata.skippedTrackIds, []);
assert.deepEqual(audit.metadata.validationWarnings, []);
assert.equal(audit.metadata.turnoutCount, 12);
assert.equal(audit.metadata.bufferStopCount, 9);
assert.equal(audit.bufferStops, 9);
assert.equal(audit.switchBlades, 12);
assert.equal(audit.frogs, 12);
assert.equal(audit.guardRails, 12);
assert.ok(audit.instancedMeshes >= 40, `Expected extensive instancing, found ${audit.instancedMeshes} meshes`);
assert.ok(audit.sleeperInstances >= 5000, `Expected at least 5000 sleeper instances, found ${audit.sleeperInstances}`);
assert.ok(audit.metadata.totalLengthMetres >= 2500);
assert.ok(audit.metadata.drawCalls < 200);
assert.equal(audit.metadata.performanceTargetMet, true);
assert.equal(audit.renderText.industrialDistrict.railwayTrackCount, 14);
assert.equal(audit.renderText.industrialDistrict.railwayValidationWarnings, 0);
const primaryTracks = audit.tracks.filter((track) => !track.id.endsWith('__DIVERGING_ROUTE'));
assert.equal(primaryTracks.length, 14);
for (const track of primaryTracks) {
  if (track.measuredMinimumRadiusMetres === null) continue;
  assert.ok(
    track.measuredMinimumRadiusMetres + 0.5 >= track.minimumRadiusMetres,
    `${track.id} radius ${track.measuredMinimumRadiusMetres} m is below ${track.minimumRadiusMetres} m`,
  );
}
for (const sample of audit.surfaceHits) {
  assert.ok(sample.hits.length > 0, `No terrain/rail hit at ${sample.local.join(', ')}`);
  assert.notEqual(sample.hits[0].name, 'Island basalt foundation', 'Basalt foundation still covers the district datum');
}
assert.equal(walkAudit.start.grounded, true);
assert.equal(walkAudit.end.grounded, true);
assert.ok(walkAudit.distanceWorld >= 0.2, `WALK traversal moved only ${walkAudit.distanceWorld} world units`);
assert.ok(walkAudit.eyeClearanceWorld !== null && Math.abs(walkAudit.eyeClearanceWorld - 0.162) < 0.01);

console.log(JSON.stringify({ audit, walkAudit, railwayWarnings, consoleErrors }, null, 2));
if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);

await browser.close();
