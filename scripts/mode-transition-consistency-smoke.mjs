import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.MODE_TRANSITION_OUTPUT ?? 'output/mode-transition-consistency';
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

function distance3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_200);

  const buildingId = 'entry-logistics-building-e2';
  await page.click('[data-mode="edit"]');
  const editStart = await page.evaluate((id) => {
    const world = window.labIsland;
    world.camera.position.set(150, 16, -270);
    world.controls.target.set(171, 2.2, -296);
    world.camera.lookAt(world.controls.target);
    world.select(id, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(id)) throw new Error('Could not open the Welcome Hall interior');
    world.advanceTime(180);
    return {
      camera: world.camera.position.toArray(),
      activeInteriorBuildingId: world.getActiveInteriorBuildingId(),
      currentInteriorBuildingId: world.getCurrentInteriorBuildingId(),
      workspace: world.getEditWorkspace(),
    };
  }, buildingId);

  await page.click('[data-mode="walk"]');
  await page.waitForTimeout(180);
  const walkInside = await page.evaluate(() => {
    const world = window.labIsland;
    world.advanceTime(180);
    return {
      mode: world.getMode(),
      camera: world.camera.position.toArray(),
      currentInteriorBuildingId: world.getCurrentInteriorBuildingId(),
      walk: world.walkController.getSnapshot(),
    };
  });
  await page.screenshot({ path: `${OUTPUT}/welcome-walk-before-edit.png`, fullPage: true });

  await page.click('[data-mode="edit"]');
  await page.waitForTimeout(180);
  const editFromWalk = await page.evaluate((id) => {
    const world = window.labIsland;
    world.advanceTime(180);
    const interior = world.authoredInteriorByBuildingId.get(id);
    return {
      mode: world.getMode(),
      camera: world.camera.position.toArray(),
      activeInteriorBuildingId: world.getActiveInteriorBuildingId(),
      currentInteriorBuildingId: world.getCurrentInteriorBuildingId(),
      workspace: world.getEditWorkspace(),
      controlsEnabled: world.controls.enabled,
      walkActive: world.walkController.getSnapshot().active,
      interiorVisible: interior?.visible ?? false,
      landscapeVisible: world.landscapeRoot.visible,
      transitVisible: world.transitRoot.visible,
      cityVisible: world.cityRoot.visible,
      runtimePolicy: world.getTextSnapshot().runtimePolicies.activeViewPolicy,
    };
  }, buildingId);
  await page.screenshot({ path: `${OUTPUT}/welcome-edit-after-walk.png`, fullPage: true });

  await page.click('[data-mode="explore"]');
  await page.waitForTimeout(180);
  const exploreAfterRoundTrip = await page.evaluate(() => {
    const world = window.labIsland;
    world.advanceTime(180);
    return {
      mode: world.getMode(),
      camera: world.camera.position.toArray(),
      target: world.controls.target.toArray(),
      activeInteriorBuildingId: world.getActiveInteriorBuildingId(),
      currentInteriorBuildingId: world.getCurrentInteriorBuildingId(),
      landscapeVisible: world.landscapeRoot.visible,
      transitVisible: world.transitRoot.visible,
      cityVisible: world.cityRoot.visible,
    };
  });
  await page.screenshot({ path: `${OUTPUT}/welcome-explore-after-round-trip.png`, fullPage: true });

  const authoredMatrix = await page.evaluate(() => {
    const world = window.labIsland;
    const results = [];
    for (const [id, interior] of world.authoredInteriorByBuildingId.entries()) {
      world.setMode('explore');
      world.select(id, 'system');
      world.setEditWorkspace('interior');
      world.setMode('edit');
      if (!world.enterInterior(id)) {
        results.push({ id, entered: false });
        continue;
      }
      world.setMode('walk');
      world.advanceTime(120);
      const walkCamera = world.camera.position.toArray();
      const walkInterior = world.getCurrentInteriorBuildingId();
      world.setMode('edit');
      world.advanceTime(120);
      results.push({
        id,
        entered: true,
        walkInterior,
        editInterior: world.getActiveInteriorBuildingId(),
        currentInterior: world.getCurrentInteriorBuildingId(),
        workspace: world.getEditWorkspace(),
        cameraDelta: world.camera.position.distanceTo({
          x: walkCamera[0],
          y: walkCamera[1],
          z: walkCamera[2],
        }),
        interiorVisible: interior.visible,
        walkActive: world.walkController.getSnapshot().active,
      });
    }
    return results;
  });

  const generatedTransition = await page.evaluate(() => {
    const world = window.labIsland;
    const id = 'pharmacology-labs';
    world.setMode('explore');
    world.select(id, 'system');
    world.setEditWorkspace('interior');
    world.setMode('edit');
    if (!world.enterInterior(id)) return { id, entered: false };
    world.setMode('walk');
    world.advanceTime(120);
    const walkCamera = world.camera.position.clone();
    const walkInterior = world.getCurrentInteriorBuildingId();
    world.setMode('edit');
    world.advanceTime(120);
    return {
      id,
      entered: true,
      walkInterior,
      editInterior: world.getActiveInteriorBuildingId(),
      currentInterior: world.getCurrentInteriorBuildingId(),
      workspace: world.getEditWorkspace(),
      cameraDelta: world.camera.position.distanceTo(walkCamera),
      interiorVisible: world.interiorGroups.get(id)?.visible ?? false,
      walkActive: world.walkController.getSnapshot().active,
    };
  });

  const transitionMatrix = await page.evaluate(() => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    const sourceModes = ['explore', 'plan', 'edit', 'walk', 'interior-edit', 'interior-walk'];
    const targetModes = ['explore', 'plan', 'edit', 'walk'];
    const results = [];

    const prepare = (source) => {
      world.setMode('explore');
      world.setEditWorkspace('landscape');
      world.clearSelection('system');
      world.cameraTween = null;
      world.camera.position.set(-122, 24, 60);
      world.controls.target.set(-116, 1.61, 54);
      world.camera.lookAt(world.controls.target);
      if (source === 'interior-edit' || source === 'interior-walk') {
        world.select(buildingId, 'system');
        world.setEditWorkspace('interior');
        world.setMode('edit');
        if (!world.enterInterior(buildingId)) throw new Error(`Could not prepare ${source}`);
        if (source === 'interior-walk') {
          world.setMode('walk');
          world.advanceTime(120);
        }
      } else {
        world.setMode(source);
        world.advanceTime(source === 'plan' ? 1_400 : 120);
      }
    };

    for (const source of sourceModes) {
      for (const target of targetModes) {
        prepare(source);
        const sourceCamera = world.camera.position.clone();
        world.setMode(target);
        world.advanceTime(target === 'plan' ? 1_400 : 160);
        const camera = world.camera.position.clone();
        const currentInterior = world.getCurrentInteriorBuildingId();
        const activeInterior = world.getActiveInteriorBuildingId();
        const walk = world.walkController.getSnapshot();
        const interiorVisible = world.authoredInteriorByBuildingId.get(buildingId)?.visible ?? false;
        results.push({
          source,
          target,
          mode: world.getMode(),
          workspace: world.getEditWorkspace(),
          currentInterior,
          activeInterior,
          walkActive: walk.active,
          grounded: walk.grounded,
          controlsEnabled: world.controls.enabled,
          interiorVisible,
          landscapeVisible: world.landscapeRoot.visible,
          horizontalCameraDelta: Math.hypot(camera.x - sourceCamera.x, camera.z - sourceCamera.z),
          planHeight: camera.y,
        });
      }
    }
    return results;
  });

  const exteriorTransitions = await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.setEditWorkspace('landscape');
    world.camera.position.set(-84, 30, 46);
    world.controls.target.set(-76, 1.61, 42);
    world.camera.lookAt(world.controls.target);
    world.setMode('walk');
    world.advanceTime(120);
    const walkCamera = world.camera.position.clone();
    const walkSnapshot = world.walkController.getSnapshot();
    world.setMode('edit');
    world.advanceTime(120);
    const editCamera = world.camera.position.clone();
    const edit = {
      mode: world.getMode(),
      workspace: world.getEditWorkspace(),
      activeInterior: world.getActiveInteriorBuildingId(),
      cameraDelta: editCamera.distanceTo(walkCamera),
      horizontalCameraDelta: Math.hypot(editCamera.x - walkCamera.x, editCamera.z - walkCamera.z),
      controlsEnabled: world.controls.enabled,
    };
    world.setMode('plan');
    world.advanceTime(1_200);
    const plan = {
      mode: world.getMode(),
      camera: world.camera.position.toArray(),
      activeInterior: world.getActiveInteriorBuildingId(),
    };
    world.setMode('walk');
    world.advanceTime(120);
    const planToWalk = {
      mode: world.getMode(),
      currentInterior: world.getCurrentInteriorBuildingId(),
      walk: world.walkController.getSnapshot(),
    };
    return { walkSnapshot, edit, plan, planToWalk };
  });

  const authoredFailures = authoredMatrix.filter((entry) => (
    !entry.entered
    || entry.walkInterior !== entry.id
    || entry.editInterior !== entry.id
    || entry.currentInterior !== entry.id
    || entry.workspace !== 'interior'
    || entry.cameraDelta > 0.05
    || !entry.interiorVisible
    || entry.walkActive
  ));
  const inverseWelcomePass = (
    walkInside.mode === 'walk'
    && walkInside.walk.active
    && walkInside.currentInteriorBuildingId === buildingId
    && editFromWalk.mode === 'edit'
    && editFromWalk.activeInteriorBuildingId === buildingId
    && editFromWalk.currentInteriorBuildingId === buildingId
    && editFromWalk.workspace === 'interior'
    && editFromWalk.controlsEnabled
    && !editFromWalk.walkActive
    && editFromWalk.interiorVisible
    && !editFromWalk.landscapeVisible
    && !editFromWalk.transitVisible
    && !editFromWalk.cityVisible
    && editFromWalk.runtimePolicy === 'edit-interior'
    && distance3(editFromWalk.camera, walkInside.camera) <= 0.05
  );
  const generatedPass = (
    generatedTransition.entered
    && generatedTransition.walkInterior === generatedTransition.id
    && generatedTransition.editInterior === generatedTransition.id
    && generatedTransition.currentInterior === generatedTransition.id
    && generatedTransition.workspace === 'interior'
    && generatedTransition.cameraDelta <= 0.05
    && generatedTransition.interiorVisible
    && !generatedTransition.walkActive
  );
  const transitionMatrixFailures = transitionMatrix.filter((entry) => {
    const sourceIsInterior = entry.source === 'interior-edit' || entry.source === 'interior-walk';
    const targetKeepsInterior = sourceIsInterior && (entry.target === 'edit' || entry.target === 'walk');
    const expectedInterior = targetKeepsInterior ? buildingId : null;
    return entry.mode !== entry.target
      || entry.currentInterior !== expectedInterior
      || entry.activeInterior !== (entry.target === 'edit' && targetKeepsInterior ? buildingId : null)
      || entry.walkActive !== (entry.target === 'walk')
      || (entry.target === 'walk' && !entry.grounded)
      || entry.controlsEnabled !== (entry.target !== 'walk')
      || entry.interiorVisible !== targetKeepsInterior
      || (targetKeepsInterior && entry.workspace !== 'interior')
      || (!targetKeepsInterior && entry.target === 'edit' && entry.workspace !== 'landscape')
      || (entry.target === 'plan' && entry.planHeight < 500)
      || (entry.source === 'interior-walk' && entry.target === 'edit' && entry.horizontalCameraDelta > 0.05)
      || (entry.source === 'walk' && entry.target === 'edit' && entry.horizontalCameraDelta > 0.05)
      || ((entry.target === 'explore' || entry.target === 'plan' || (entry.target === 'edit' && !targetKeepsInterior))
        && !entry.landscapeVisible);
  });
  const returnViewPass = (
    exploreAfterRoundTrip.mode === 'explore'
    && exploreAfterRoundTrip.activeInteriorBuildingId === null
    && exploreAfterRoundTrip.currentInteriorBuildingId === null
    && exploreAfterRoundTrip.landscapeVisible
    && exploreAfterRoundTrip.transitVisible
    && exploreAfterRoundTrip.cityVisible
    && distance3(exploreAfterRoundTrip.camera, [150, 16, -270]) <= 0.05
    && distance3(exploreAfterRoundTrip.target, [171, 2.2, -296]) <= 0.05
  );
  const exteriorPass = (
    exteriorTransitions.walkSnapshot.active
    && exteriorTransitions.walkSnapshot.grounded
    && exteriorTransitions.edit.mode === 'edit'
    && exteriorTransitions.edit.workspace === 'landscape'
    && exteriorTransitions.edit.activeInterior === null
    && exteriorTransitions.edit.horizontalCameraDelta <= 0.05
    && exteriorTransitions.edit.controlsEnabled
    && exteriorTransitions.plan.mode === 'plan'
    && exteriorTransitions.plan.activeInterior === null
    && exteriorTransitions.plan.camera[1] > 500
    && exteriorTransitions.planToWalk.mode === 'walk'
    && exteriorTransitions.planToWalk.currentInterior === null
    && exteriorTransitions.planToWalk.walk.active
    && exteriorTransitions.planToWalk.walk.grounded
  );

  const audit = {
    editStart,
    walkInside,
    editFromWalk,
    inverseWelcomePass,
    exploreAfterRoundTrip,
    returnViewPass,
    authoredCount: authoredMatrix.length,
    authoredFailures,
    generatedTransition,
    generatedPass,
    transitionMatrixCount: transitionMatrix.length,
    transitionMatrixFailures,
    exteriorTransitions,
    exteriorPass,
    errors,
  };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(audit, null, 2));
  console.log(JSON.stringify(audit, null, 2));

  if (!inverseWelcomePass) throw new Error('Welcome Hall WALK to Interior Edit did not retain the interior workspace and camera');
  if (!returnViewPass) throw new Error(`Interior round trip did not restore its exterior view: ${JSON.stringify(exploreAfterRoundTrip)}`);
  if (authoredFailures.length) throw new Error(`Authored WALK to Edit failures: ${JSON.stringify(authoredFailures)}`);
  if (!generatedPass) throw new Error(`Generated WALK to Edit failed: ${JSON.stringify(generatedTransition)}`);
  if (transitionMatrixFailures.length) {
    throw new Error(`Mode transition matrix failures: ${JSON.stringify(transitionMatrixFailures)}`);
  }
  if (!exteriorPass) throw new Error(`Exterior/Plan transition consistency failed: ${JSON.stringify(exteriorTransitions)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
} finally {
  await browser.close();
}
