import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ENTRY_LOGISTICS_OUTPUT ?? 'output/entry-logistics';
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
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.evaluate(() => window.advanceTime(120));

  const cityline = await page.evaluate(() => {
    const world = window.labIsland;
    const id = 'entry-logistics-building-e13';
    const initial = world.getObjectState(id);
    world.setObjectPosition(id, 'x', initial.position.x + 14);
    world.setObjectPosition(id, 'z', initial.position.z - 9);
    world.setObjectRotationY(id, initial.rotationY + 15);
    world.setObjectAxisScale(id, 'x', 1.25);
    world.setObjectAxisScale(id, 'z', 0.85);
    const facility = world.objectGroups.get(id);
    const district = world.objectGroups.get('entry-commercial');
    facility.updateMatrixWorld(true);
    district.updateMatrixWorld(true);
    let firstRoad;
    let roadSegmentCount = 0;
    district.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.traverse((object) => {
      if (object.userData.entranceLinkedRoad === true && object.userData.routeId === 'e13-to-collector') {
        roadSegmentCount += 1;
        if (!firstRoad || object.userData.segmentIndex < firstRoad.userData.segmentIndex) firstRoad = object;
      }
    });
    const centre = facility.getWorldPosition(world.camera.position.clone());
    world.setMode('explore');
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.cameraTween = null;
    world.camera.position.set(centre.x + 0.1, centre.y + 86, centre.z + 0.1);
    world.controls.target.copy(centre);
    world.controls.update();
    document.querySelectorAll('.atlas, .topbar, #inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(900);
    return {
      state: world.getObjectState(id),
      roadSegmentCount,
      routeStartGap: Math.hypot(
        firstRoad.userData.fromPoint[0] - facility.userData.roadRouteStart[0],
        firstRoad.userData.fromPoint[2] - facility.userData.roadRouteStart[2],
      ),
      walkAccess: facility.userData.walkAccess,
    };
  });
  await page.waitForTimeout(1_200);
  await page.screenshot({ path: `${OUTPUT}/cityline-live-edited-road.png` });

  const interior = await page.evaluate(() => {
    const world = window.labIsland;
    const facility = world.objectGroups.get('entry-logistics-building-e13');
    const district = world.objectGroups.get('entry-commercial');
    const walkAccess = facility.userData.walkAccess;
    world.setMode('walk');
    world.walkController.refreshNavigation();
    const roomCenter = facility.userData.runtimeInteriorCenter ?? [0, 0];
    const target = facility.localToWorld(
      world.camera.position.clone().set(roomCenter[0], walkAccess.finishedFloorY, roomCenter[1] + 1.08),
    );
    const initialGround = world.walkController.sampleGround(target.x, target.z, { spawnSearch: true });
    world.camera.position.set(target.x, initialGround + 0.162, target.z);
    world.walkController.groundY = initialGround;
    world.walkController.grounded = true;
    const rear = facility.localToWorld(
      world.controls.target.clone().set(roomCenter[0], 0.55, roomCenter[1] - 1.75),
    );
    world.camera.lookAt(rear);
    world.advanceTime(600);
    const ground = world.walkController.sampleGround(target.x, target.z, { trackSurface: true });
    world.camera.position.y = ground + 0.162;
    world.advanceTime(240);
    const visibleInteriors = [];
    world.scene.traverse((object) => {
      if (object.userData.runtimeInterior === true && object.visible) visibleInteriors.push(object.name);
    });
    return {
      ground,
      walk: world.walkController.getSnapshot(),
      visibleInteriors,
      runtimeInteriorVisible: facility.getObjectByName('ENTRY__E13__AUTHORED_WALK_INTERIOR')?.visible === true,
    };
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUTPUT}/walk-inside-cityline-orientation-tower.png` });

  const report = { cityline, interior, errors };
  await writeFile(`${OUTPUT}/entry-interior-visual-report.json`, JSON.stringify(report, null, 2));
  if (cityline.roadSegmentCount < 20
    || cityline.routeStartGap > 0.001
    || !interior.runtimeInteriorVisible
    || interior.visibleInteriors.length !== 1
    || errors.length) {
    throw new Error(`Entry interior visual audit failed: ${JSON.stringify(report, null, 2)}`);
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
