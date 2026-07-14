import fs from 'node:fs';
import { chromium } from 'playwright';

const outputDirectory = 'output/road-depth';
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('.mode[data-mode="explore"]', { state: 'visible', timeout: 30_000 });
await page.waitForTimeout(800);

const roadAudit = await page.evaluate(() => {
  const world = window.labIsland;
  const roadName = /^(District boundary ring road|Autonomous transit guide|Ring road \d+ curb|Hexagonal coastal express road|Coastal express luminous median|Radial district boundary road|Biome axis light)/;
  const primaryRoadName = /^(District boundary ring road|Hexagonal coastal express road|Radial district boundary road)/;
  const records = [];
  world.transitRoot.traverse((child) => {
    if (!child.isMesh || !roadName.test(child.name)) return;
    child.updateWorldMatrix(true, false);
    child.geometry.computeBoundingBox();
    const bounds = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    records.push({
      name: child.name,
      primarySurface: primaryRoadName.test(child.name),
      minY: bounds.min.y,
      maxY: bounds.max.y,
      height: bounds.max.y - bounds.min.y,
      materials: materials.map((material) => ({
        depthTest: material.depthTest,
        depthWrite: material.depthWrite,
        polygonOffset: material.polygonOffset,
      })),
    });
  });
  return records;
});

const invalidExploreDepthObjects = roadAudit.filter((record) => record.materials.some(
  (material) => material.depthTest !== false || material.depthWrite !== false,
));
const raisedRoads = roadAudit.filter((record) => (
  record.primarySurface && (record.maxY < 1.61 || record.maxY > 1.625 || record.height > 0.014)
));
const raisedMarkings = roadAudit.filter((record) => !record.primarySurface && record.maxY > 1.64);
const offsetRoads = roadAudit.filter((record) => (
  record.primarySurface && record.materials.some((material) => material.polygonOffset)
));
if (roadAudit.length !== 38) throw new Error(`Expected 38 primary road surfaces and markings, found ${roadAudit.length}`);
if (invalidExploreDepthObjects.length) {
  throw new Error(`Road objects not configured as Explore terrain decals: ${invalidExploreDepthObjects.map((record) => record.name).join(', ')}`);
}
if (raisedRoads.length) throw new Error(`Road surfaces above ground level: ${raisedRoads.map((record) => record.name).join(', ')}`);
if (raisedMarkings.length) throw new Error(`Road markings above curb height: ${raisedMarkings.map((record) => record.name).join(', ')}`);
if (offsetRoads.length !== 14) throw new Error(`Expected all 14 road surfaces to use aerial anti-flicker depth bias, found ${offsetRoads.length}`);

const prepareScreenshot = async () => page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('explore');
  world.setTimeOfDay('noon');
  for (let index = 0; index < 30; index += 1) world.advanceTime(100);
  document.querySelector('.atlas')?.setAttribute('style', 'display:none');
  document.querySelector('.topbar')?.setAttribute('style', 'display:none');
  document.querySelector('.mode-help')?.setAttribute('style', 'display:none');
});

await prepareScreenshot();
await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.position.set(250, 210, 285);
  world.controls.target.set(0, 1.62, 0);
  world.controls.update();
  world.advanceTime(160);
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${outputDirectory}/explore-overview.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.up.set(0, 1, 0);
  world.camera.position.set(82, 64, 92);
  world.controls.target.set(0, 1.62, 0);
  world.controls.update();
  world.advanceTime(160);
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${outputDirectory}/explore-road-close.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  if (!dome) throw new Error('Tropical Rainforest Dome was unavailable');
  dome.updateMatrixWorld(true);
  // This close interior angle deliberately places several rainforest trunks in
  // front of a radial road, reproducing the original always-on-top failure.
  const cameraPosition = world.camera.position.clone().set(3.5, 6.2, 15.5).applyMatrix4(dome.matrixWorld);
  const target = world.controls.target.clone().set(-8.4, 2.65, 1.1).applyMatrix4(dome.matrixWorld);
  world.camera.position.copy(cameraPosition);
  world.camera.up.set(0, 1, 0);
  world.controls.target.copy(target);
  world.controls.update();
  world.advanceTime(160);
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${outputDirectory}/tropical-interior.png` });

const walkAudit = await page.evaluate(() => {
  const world = window.labIsland;
  const road = world.scene.getObjectByName('Radial district boundary road 1');
  if (!road) throw new Error('Representative radial road was unavailable');
  road.updateWorldMatrix(true, false);
  const depth = road.geometry.parameters.depth;
  const position = world.camera.position.clone().set(0, 0, depth * 0.28);
  const target = world.controls.target.clone().set(0, 0, depth * 0.08);
  road.localToWorld(position);
  road.localToWorld(target);

  world.setMode('walk');
  world.walkController.refreshNavigation();
  const ground = world.walkController.sampleGround(position.x, position.z);
  if (ground === null) throw new Error('Representative radial road has no walkable ground');
  world.camera.position.set(position.x, ground + 0.18, position.z);
  world.camera.lookAt(target.x, ground + 0.18, target.z);
  world.walkController.groundY = ground;
  world.walkController.grounded = true;
  const invalidWalkDepthObjects = [];
  const roadName = /^(District boundary ring road|Autonomous transit guide|Ring road \d+ curb|Hexagonal coastal express road|Coastal express luminous median|Radial district boundary road|Biome axis light)/;
  world.transitRoot.traverse((child) => {
    if (!child.isMesh || !roadName.test(child.name)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    if (materials.some((material) => material.depthTest !== true || material.depthWrite !== true)) {
      invalidWalkDepthObjects.push(child.name);
    }
  });
  world.setWalkIntent(0, 1);
  world.advanceTime(240);
  world.setWalkIntent(0, 0);
  const snapshot = world.walkController.getSnapshot();
  return {
    ground,
    cameraClearance: world.camera.position.y - ground,
    grounded: snapshot.grounded,
    finalGroundY: snapshot.groundY,
    invalidWalkDepthObjects,
  };
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${outputDirectory}/walk-ground-level.png` });

const exploreDepthRestored = await page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('explore');
  const roadName = /^(District boundary ring road|Autonomous transit guide|Ring road \d+ curb|Hexagonal coastal express road|Coastal express luminous median|Radial district boundary road|Biome axis light)/;
  const invalid = [];
  world.transitRoot.traverse((child) => {
    if (!child.isMesh || !roadName.test(child.name)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    if (materials.some((material) => material.depthTest !== false || material.depthWrite !== false)) invalid.push(child.name);
  });
  return invalid;
});

if (Math.abs(walkAudit.ground - 1.616) > 0.01) throw new Error(`Road ground sampled at ${walkAudit.ground}, expected 1.616`);
if (Math.abs(walkAudit.cameraClearance - 0.162) > 0.01) throw new Error(`Walk camera clearance changed to ${walkAudit.cameraClearance}`);
if (!walkAudit.grounded) throw new Error('Walk controller lost grounding on the representative road');
if (walkAudit.invalidWalkDepthObjects.length) throw new Error(`Walk roads outside the physical depth buffer: ${walkAudit.invalidWalkDepthObjects.join(', ')}`);
if (exploreDepthRestored.length) throw new Error(`Explore road decal mode was not restored: ${exploreDepthRestored.join(', ')}`);

if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify({
  auditedRoadObjects: roadAudit.length,
  invalidExploreDepthObjects,
  raisedRoads,
  raisedMarkings,
  offsetRoadCount: offsetRoads.length,
  roadSurfaceRange: {
    min: Math.min(...roadAudit.filter((record) => record.primarySurface).map((record) => record.minY)),
    max: Math.max(...roadAudit.filter((record) => record.primarySurface).map((record) => record.maxY)),
  },
  walkAudit,
  exploreDepthRestored,
  consoleErrors,
}, null, 2));

await browser.close();
