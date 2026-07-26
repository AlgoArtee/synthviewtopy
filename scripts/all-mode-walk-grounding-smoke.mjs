import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ALL_MODE_WALK_OUTPUT ?? 'output/all-mode-walk-grounding';
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

async function loadClean() {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(750);
}

async function inspectWalkTransition(name, setup) {
  await loadClean();
  const source = await page.evaluate(setup);
  await page.click('[data-mode="walk"]');
  await page.waitForTimeout(100);
  const result = await page.evaluate(() => {
    const world = window.labIsland;
    world.advanceTime(180);
    const controller = world.walkController;
    const snapshot = {
      mode: world.getMode(),
      camera: { position: world.camera.position.toArray() },
      walk: controller.getSnapshot(),
    };
    const initial = world.camera.position.clone();
    controller.rayOrigin.copy(world.camera.position);
    controller.rayOrigin.y = 40;
    controller.raycaster.set(controller.rayOrigin, controller.down);
    controller.raycaster.near = 0;
    controller.raycaster.far = 80;
    const hit = controller.raycaster.intersectObjects(controller.walkables, false)[0];
    const startGround = controller.groundY;
    let maxMove = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      world.camera.position.copy(initial);
      controller.groundY = startGround;
      controller.grounded = true;
      world.camera.lookAt(initial.x + dx, initial.y, initial.z + dz);
      controller.setMoveIntent(0, 1, false);
      world.advanceTime(480);
      controller.setMoveIntent(0, 0, false);
      maxMove = Math.max(maxMove, world.camera.position.distanceTo(initial));
    }
    world.camera.position.copy(initial);
    controller.groundY = startGround;
    controller.grounded = true;
    return {
      snapshot,
      groundY: controller.groundY,
      eyeOffset: controller.groundY === null ? null : initial.y - controller.groundY,
      groundHitName: hit?.object.name ?? null,
      groundHitY: hit?.point.y ?? null,
      currentInteriorBuildingId: world.getCurrentInteriorBuildingId(),
      maxMove,
    };
  });
  return { name, source, result };
}

try {
  const scenarios = [];
  scenarios.push(await inspectWalkTransition('explore-overview', () => {
    const world = window.labIsland;
    world.setMode('explore');
    world.clearSelection('system');
    world.camera.position.set(0, 90, 84);
    world.controls.target.set(0, 1.61, 75);
    world.camera.lookAt(world.controls.target);
    return {
      mode: world.mode,
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      expectedWalkXZ: [0, 84],
    };
  }));
  scenarios.push(await inspectWalkTransition('explore-selected-overview', () => {
    const world = window.labIsland;
    world.setMode('explore');
    world.select('entry-logistics-building-e2', 'system');
    world.camera.position.set(84, 90, 0);
    world.controls.target.set(75, 1.61, 0);
    world.camera.lookAt(world.controls.target);
    return {
      mode: world.mode,
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      expectedWalkXZ: [84, 0],
    };
  }));
  scenarios.push(await inspectWalkTransition('plan-overview', () => {
    const world = window.labIsland;
    world.setMode('plan');
    world.cameraTween = null;
    world.camera.position.set(0, 940, -84);
    world.controls.target.set(0, 1.61, -84);
    world.camera.lookAt(world.controls.target);
    return {
      mode: world.mode,
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      expectedWalkXZ: [0, -84],
    };
  }));
  scenarios.push(await inspectWalkTransition('exterior-edit-overview', () => {
    const world = window.labIsland;
    world.select('entry-logistics-building-e2', 'system');
    world.setEditWorkspace('exterior');
    world.setMode('edit');
    world.camera.position.set(-84, 90, 0);
    world.controls.target.set(-75, 1.61, 0);
    world.camera.lookAt(world.controls.target);
    return {
      mode: world.mode,
      workspace: world.getEditWorkspace(),
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      expectedWalkXZ: [-84, 0],
    };
  }));
  scenarios.push(await inspectWalkTransition('authored-interior-edit-to-explore', () => {
    const world = window.labIsland;
    const interiorOrigin = 'entry-logistics-building-e2';
    world.camera.position.set(0, 30, 84);
    world.controls.target.set(0, 1.61, 75);
    world.camera.lookAt(world.controls.target);
    world.select(interiorOrigin, 'system');
    world.setEditWorkspace('interior');
    world.setMode('edit');
    if (!world.enterInterior(interiorOrigin)) throw new Error('Could not enter authored interior');
    world.setMode('explore');
    return {
      mode: world.mode,
      workspace: world.getEditWorkspace(),
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      interiorOrigin,
      expectedWalkXZ: [0, 84],
    };
  }));
  scenarios.push(await inspectWalkTransition('generated-interior-edit-to-explore', () => {
    const world = window.labIsland;
    const interiorOrigin = 'pharmacology-labs';
    world.camera.position.set(0, 30, -84);
    world.controls.target.set(0, 1.61, -75);
    world.camera.lookAt(world.controls.target);
    world.select(interiorOrigin, 'system');
    world.setEditWorkspace('interior');
    world.setMode('edit');
    if (!world.enterInterior(interiorOrigin)) throw new Error('Could not enter generated interior');
    world.setMode('explore');
    return {
      mode: world.mode,
      workspace: world.getEditWorkspace(),
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      interiorOrigin,
      expectedWalkXZ: [0, -84],
    };
  }));
  scenarios.push(await inspectWalkTransition('authored-interior-edit', () => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    world.setMode('edit');
    if (!world.enterInterior(buildingId)) throw new Error('Could not enter authored interior');
    return {
      mode: world.mode,
      workspace: world.getEditWorkspace(),
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      buildingId,
    };
  }));
  scenarios.push(await inspectWalkTransition('generated-interior-edit', () => {
    const world = window.labIsland;
    const buildingId = 'pharmacology-labs';
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    world.setMode('edit');
    if (!world.enterInterior(buildingId)) throw new Error('Could not enter generated interior');
    return {
      mode: world.mode,
      workspace: world.getEditWorkspace(),
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      selectedId: world.selectedId,
      buildingId,
    };
  }));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.select('entry-logistics-building-e2', 'system');
    world.camera.position.set(84, 25, 0);
    world.controls.target.set(75, 1.61, 0);
    world.camera.lookAt(world.controls.target);
  });
  await page.click('[data-mode="walk"]');
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUTPUT}/explore-selected-to-walk.png`, fullPage: true });

  const failures = scenarios.filter(({ name, source, result }) => {
    const expectedInterior = source.buildingId ?? null;
    return result.snapshot.mode !== 'walk'
      || !result.snapshot.walk.active
      || !result.snapshot.walk.grounded
      || result.eyeOffset === null
      || Math.abs(result.eyeOffset - 0.162) > 0.001
      || !result.groundHitName
      || result.maxMove < 0.025
      || result.currentInteriorBuildingId !== expectedInterior
      || ((name.includes('overview') || name.includes('exterior')) && result.groundY < 1.5);
  });
  const exteriorScenarios = scenarios.filter(({ source }) => !source.buildingId);
  const coordinateFailures = exteriorScenarios.filter(({ source, result }) => (
    !source.expectedWalkXZ
    || Math.hypot(
      result.snapshot.camera.position[0] - source.expectedWalkXZ[0],
      result.snapshot.camera.position[2] - source.expectedWalkXZ[1],
    ) > 0.8
  ));
  const distinctExteriorLocations = new Set(exteriorScenarios.map(({ result }) => (
    `${result.snapshot.camera.position[0].toFixed(1)},${result.snapshot.camera.position[2].toFixed(1)}`
  )));
  const audit = { scenarios, failures, coordinateFailures, distinctExteriorLocations: Array.from(distinctExteriorLocations), errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(audit, null, 2));
  console.log(JSON.stringify(audit, null, 2));
  if (failures.length) throw new Error(`All-mode WALK failures: ${failures.map((entry) => entry.name).join(', ')}`);
  if (coordinateFailures.length || distinctExteriorLocations.size < 4) {
    throw new Error(`Exterior modes did not retain their view coordinates: ${coordinateFailures.map((entry) => entry.name).join(', ')}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
} finally {
  await browser.close();
}
