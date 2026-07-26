import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.INTERIOR_EDIT_WALK_OUTPUT ?? 'output/interior-edit-to-walk';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});
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
  await page.click('[data-mode="edit"]');

  const editor = await page.evaluate(() => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Could not open Welcome Hall in Interior Edit');
    world.advanceTime(180);
    const interior = world.authoredInteriorByBuildingId.get(buildingId);
    if (!interior) throw new Error('Welcome Hall authored interior is unavailable');
    return {
      buildingId,
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      floorY: interior.userData.editorFloorY,
      roomCenter: interior.userData.editorRoomCenter,
      roomDepth: interior.userData.roomDepth,
      interiorVisible: interior.visible,
    };
  });

  await page.click('[data-mode="walk"]');
  await page.waitForTimeout(250);
  const transition = await page.evaluate(({ buildingId }) => {
    const world = window.labIsland;
    world.advanceTime(180);
    const interior = world.authoredInteriorByBuildingId.get(buildingId);
    const start = world.camera.position.clone();
    const initial = world.getTextSnapshot();
    const controller = world.walkController;
    controller.rayOrigin.copy(world.camera.position);
    controller.rayOrigin.y = 40;
    controller.raycaster.set(controller.rayOrigin, controller.down);
    controller.raycaster.near = 0;
    controller.raycaster.far = 80;
    const groundHit = controller.raycaster.intersectObjects(controller.walkables, false)[0];
    let hitCursor = groundHit?.object ?? null;
    let groundHitInsideInterior = false;
    while (hitCursor) {
      if (hitCursor === interior) groundHitInsideInterior = true;
      hitCursor = hitCursor.parent;
    }
    world.setWalkIntent(0, 1, false);
    world.advanceTime(1200);
    world.setWalkIntent(0, 0, false);
    world.advanceTime(100);
    const final = world.getTextSnapshot();
    return {
      initial,
      final,
      interiorVisible: interior?.visible ?? false,
      detectedInteriorBuildingId: world.getCurrentInteriorBuildingId(),
      groundHitName: groundHit?.object.name ?? null,
      groundHitInsideInterior,
      travelWorld: world.camera.position.distanceTo(start),
      verticalTravelWorld: world.camera.position.y - start.y,
    };
  }, editor);

  await page.screenshot({
    path: `${OUTPUT}/interior-edit-to-walk.png`,
    fullPage: true,
  });
  const result = { editor, transition, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    editor,
    transition: {
      initialWalk: transition.initial.walk,
      finalWalk: transition.final.walk,
      initialCamera: transition.initial.camera,
      finalCamera: transition.final.camera,
      interiorVisible: transition.interiorVisible,
      detectedInteriorBuildingId: transition.detectedInteriorBuildingId,
      groundHitName: transition.groundHitName,
      groundHitInsideInterior: transition.groundHitInsideInterior,
      travelWorld: transition.travelWorld,
      verticalTravelWorld: transition.verticalTravelWorld,
    },
    errors,
  }, null, 2));

  if (transition.initial.mode !== 'walk' || !transition.initial.walk.active) {
    throw new Error('WALK mode did not activate');
  }
  if (!transition.interiorVisible || transition.detectedInteriorBuildingId !== editor.buildingId) {
    throw new Error('WALK did not remain in the active authored interior');
  }
  if (!transition.final.walk.grounded || !transition.groundHitInsideInterior) {
    throw new Error('WALK did not spawn on the interior floor');
  }
  if (transition.travelWorld < 0.04) {
    throw new Error(`WALK movement remained blocked (${transition.travelWorld.toFixed(4)} world units)`);
  }

  const interiorMatrix = await page.evaluate(() => {
    const world = window.labIsland;
    const inspectTransition = (buildingId, expectedInterior) => {
      world.setMode('edit');
      world.select(buildingId, 'system');
      world.setEditWorkspace('interior');
      if (!world.enterInterior(buildingId)) {
        return { buildingId, entered: false };
      }
      world.setMode('walk');
      world.advanceTime(120);
      const interior = expectedInterior ?? world.interiorGroups.get(buildingId);
      const controller = world.walkController;
      controller.rayOrigin.copy(world.camera.position);
      controller.rayOrigin.y = 40;
      controller.raycaster.set(controller.rayOrigin, controller.down);
      controller.raycaster.near = 0;
      controller.raycaster.far = 80;
      const hit = controller.raycaster.intersectObjects(controller.walkables, false)[0];
      let cursor = hit?.object ?? null;
      let hitInsideInterior = false;
      while (cursor) {
        if (cursor === interior) hitInsideInterior = true;
        cursor = cursor.parent;
      }
      const start = world.camera.position.clone();
      const startGround = controller.groundY;
      let moveDistanceWorld = 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        world.camera.position.copy(start);
        controller.groundY = startGround;
        controller.grounded = true;
        world.camera.lookAt(start.x + dx, start.y, start.z + dz);
        controller.setMoveIntent(0, 1, false);
        world.advanceTime(360);
        controller.setMoveIntent(0, 0, false);
        moveDistanceWorld = Math.max(moveDistanceWorld, world.camera.position.distanceTo(start));
        if (moveDistanceWorld >= 0.03) break;
      }
      const walkSnapshot = controller.getSnapshot();
      return {
        buildingId,
        entered: true,
        detectedBuildingId: world.getCurrentInteriorBuildingId(),
        visible: interior?.visible ?? false,
        grounded: walkSnapshot.grounded,
        surfaceKind: walkSnapshot.surfaceKind,
        hitName: hit?.object.name ?? null,
        hitInsideInterior,
        moveDistanceWorld,
      };
    };

    const authored = Array.from(world.authoredInteriorByBuildingId.entries())
      .map(([buildingId, interior]) => inspectTransition(buildingId, interior));
    const generated = inspectTransition('pharmacology-labs', null);
    return { authored, generated };
  });

  const failedAuthored = interiorMatrix.authored.filter((entry) => (
    !entry.entered
    || entry.detectedBuildingId !== entry.buildingId
    || !entry.visible
    || !entry.grounded
    || entry.moveDistanceWorld < 0.02
  ));
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify({ editor, transition, interiorMatrix, errors }, null, 2));
  if (failedAuthored.length) {
    throw new Error(`Authored Interior Edit → WALK failures: ${JSON.stringify(failedAuthored)}`);
  }
  if (
    !interiorMatrix.generated.entered
    || interiorMatrix.generated.detectedBuildingId !== interiorMatrix.generated.buildingId
    || !interiorMatrix.generated.visible
    || !interiorMatrix.generated.grounded
    || interiorMatrix.generated.moveDistanceWorld < 0.02
  ) {
    throw new Error(`Generated fallback Interior Edit → WALK failed: ${JSON.stringify(interiorMatrix.generated)}`);
  }
  console.log(JSON.stringify({
    authoredTransitions: interiorMatrix.authored.length,
    authoredFailures: failedAuthored.length,
    generatedTransition: interiorMatrix.generated,
  }, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
} finally {
  await browser.close();
}
