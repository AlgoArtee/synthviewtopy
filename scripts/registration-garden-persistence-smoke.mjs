import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.REGISTRATION_GARDEN_OUTPUT
  ?? 'output/registration-garden-persistence';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BUILDING_ID = 'entry-logistics-building-e2';
const ANCHOR_NAME = 'ENTRY__E2__LIVING_INDEX_PERSISTENT_GLB_GARDEN';
const MODEL_NAME = 'ENTRY__E2__LIVING_INDEX_PERSISTENT_GLB_GARDEN_MODEL';
const EXPECTED_SHA256 =
  '19b639141178cf50726c8fc515caea5b83cd8a661f97552db969fd1e6d591144';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 1800, height: 1080 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(300_000);
const errors = [];
const warnings = [];
const assetRequests = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'warning') warnings.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('requestfinished', (request) => {
  if (request.url().includes('/assets/interiors/registration-hall/garden.glb')) {
    assetRequests.push(request.url());
  }
});

async function waitForWorld() {
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_000);
}

async function enterRegistrationInterior() {
  await page.evaluate((buildingId) => {
    const world = window.labIsland;
    if (!world.enterInterior(buildingId)) {
      throw new Error('Could not enter Registration Hall Interior Edit');
    }
  }, BUILDING_ID);
  await page.waitForFunction(
    ({ buildingId, anchorName }) => {
      const world = window.labIsland;
      const interior = world.authoredInteriorByBuildingId.get(buildingId);
      const anchor = interior?.getObjectByName(anchorName);
      return anchor?.userData.projectAssetState === 'loaded';
    },
    { buildingId: BUILDING_ID, anchorName: ANCHOR_NAME },
    { timeout: 300_000 },
  );
  await page.waitForTimeout(700);
}

async function inspectGarden() {
  return page.evaluate(({ buildingId, anchorName, modelName }) => {
    const world = window.labIsland;
    const interior = world.authoredInteriorByBuildingId.get(buildingId);
    const anchor = interior?.getObjectByName(anchorName);
    const model = anchor?.getObjectByName(modelName);
    if (!interior || !anchor || !model) {
      throw new Error('Persistent Registration Hall garden is incomplete');
    }
    const wrapper = anchor.parent;
    const selectableId = wrapper?.userData.selectableId ?? anchor.userData.selectableId;
    const definition = selectableId ? world.getDefinition(selectableId) : null;
    const state = selectableId ? world.getObjectState(selectableId) : null;
    let meshCount = 0;
    let navObstacleCount = 0;
    let walkableCount = 0;
    let visibleMeshCount = 0;
    const materials = new Set();
    model.traverse((object) => {
      if (!object.isMesh) return;
      meshCount += 1;
      navObstacleCount += Number(object.userData.navObstacle === true);
      walkableCount += Number(object.userData.walkable === true);
      visibleMeshCount += Number(object.visible);
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      entries.forEach((entry) => materials.add(entry.uuid));
    });
    let effectivelyVisible = true;
    let cursor = model;
    while (cursor) {
      effectivelyVisible &&= cursor.visible;
      cursor = cursor.parent;
    }
    const fallback = interior.getObjectByName(
      String(anchor.userData.projectAssetFallbackGroupName),
    );
    let visibleFallbackCount = 0;
    fallback?.traverse((object) => {
      if (object.userData.projectAssetFallback === true && object.visible) {
        visibleFallbackCount += 1;
      }
    });
    return {
      selectableId,
      definition,
      state,
      assetUrl: anchor.userData.projectAssetUrl,
      sha256: anchor.userData.projectAssetSha256,
      projectAssetState: anchor.userData.projectAssetState,
      sourceSize: anchor.userData.projectAssetSourceSize,
      fittedSize: anchor.userData.projectAssetFittedSize,
      targetSize: anchor.userData.projectAssetTargetSize,
      rotatedToGardenAxis: anchor.userData.projectAssetRotatedToGardenAxis,
      fallbackHidden: anchor.userData.projectAssetFallbackHidden,
      visibleFallbackCount,
      meshCount,
      materialCount: materials.size,
      navObstacleCount,
      walkableCount,
      visibleMeshCount,
      effectivelyVisible,
      interiorVisible: interior.visible,
      modelChildCount: model.children.length,
    };
  }, {
    buildingId: BUILDING_ID,
    anchorName: ANCHOR_NAME,
    modelName: MODEL_NAME,
  });
}

try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForWorld();
  const lazyBeforeEntry = await page.evaluate(({ buildingId, anchorName }) => {
    const world = window.labIsland;
    const interior = world.authoredInteriorByBuildingId.get(buildingId);
    const anchor = interior?.getObjectByName(anchorName);
    if (!interior || !anchor) throw new Error('Registration garden anchor is missing');
    return {
      interiorVisible: interior.visible,
      state: anchor.userData.projectAssetState,
      hasLoadedModel: anchor.children.some((child) => child.userData.projectAssetLoaded),
      selectableId: anchor.userData.selectableId,
    };
  }, { buildingId: BUILDING_ID, anchorName: ANCHOR_NAME });
  if (lazyBeforeEntry.state !== 'unloaded' || lazyBeforeEntry.interiorVisible) {
    throw new Error('Registration garden was not kept lazy before interior entry');
  }
  if (assetRequests.length !== 0) {
    throw new Error('Registration garden binary was requested before interior entry');
  }

  await enterRegistrationInterior();
  const firstLoad = await inspectGarden();
  if (firstLoad.sha256 !== EXPECTED_SHA256) {
    throw new Error(`Unexpected garden SHA-256: ${firstLoad.sha256}`);
  }
  if (firstLoad.definition?.category !== 'authored-interior'
    || firstLoad.definition?.parentBuildingId !== BUILDING_ID) {
    throw new Error('Garden does not have a stable authored interior definition');
  }
  if (firstLoad.meshCount < 2_000 || firstLoad.materialCount < 20) {
    throw new Error(`Garden detail was lost (${firstLoad.meshCount} meshes, ${firstLoad.materialCount} materials)`);
  }
  if (!firstLoad.effectivelyVisible || !firstLoad.interiorVisible || firstLoad.visibleMeshCount === 0) {
    throw new Error('Garden is not effectively visible in Interior Edit');
  }
  if (!firstLoad.fallbackHidden || firstLoad.visibleFallbackCount !== 0) {
    throw new Error('Procedural fallback remained visible over the persistent GLB');
  }
  if (firstLoad.navObstacleCount || firstLoad.walkableCount) {
    throw new Error('Garden GLB introduced unreviewed WALK collision');
  }

  const edited = await page.evaluate((selectableId) => {
    const world = window.labIsland;
    const before = world.getObjectState(selectableId);
    world.setObjectPosition(selectableId, 'x', before.position.x + 0.08);
    world.setObjectRotationY(selectableId, before.rotationY + 5.5);
    world.setObjectScale(selectableId, 0.94);
    const after = world.getObjectState(selectableId);
    world.clearSelection('system');
    return { before, after };
  }, firstLoad.selectableId);
  await page.click('#save-project');
  const savedPayload = await page.evaluate((selectableId) => {
    const payload = JSON.parse(localStorage.getItem('youtopy_saved_project'));
    return {
      object: payload.objects.find((entry) => entry.id === selectableId),
      gardenImports: payload.objects.filter(
        (entry) => entry.category === 'imported'
          && String(entry.sourceLabel ?? entry.name).toLowerCase().includes('garden'),
      ),
    };
  }, firstLoad.selectableId);
  if (!savedPayload.object || savedPayload.gardenImports.length !== 0) {
    throw new Error('Save did not store the authored garden transform cleanly');
  }

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForWorld();
  const restoredBeforeLoad = await page.evaluate(({ buildingId, anchorName, selectableId }) => {
    const world = window.labIsland;
    const interior = world.authoredInteriorByBuildingId.get(buildingId);
    const anchor = interior?.getObjectByName(anchorName);
    return {
      state: anchor?.userData.projectAssetState,
      transform: world.getObjectState(selectableId),
      definition: world.getDefinition(selectableId),
      interiorVisible: interior?.visible,
    };
  }, {
    buildingId: BUILDING_ID,
    anchorName: ANCHOR_NAME,
    selectableId: firstLoad.selectableId,
  });
  if (!restoredBeforeLoad.transform || restoredBeforeLoad.state !== 'unloaded') {
    throw new Error('Saved garden definition was not reconstructed lazily after page reload');
  }

  await enterRegistrationInterior();
  const restored = await inspectGarden();
  const expected = edited.after;
  const actual = restored.state;
  const epsilon = 1e-6;
  if (
    Math.abs(actual.position.x - expected.position.x) > epsilon
    || Math.abs(actual.position.y - expected.position.y) > epsilon
    || Math.abs(actual.position.z - expected.position.z) > epsilon
    || Math.abs(actual.rotationY - expected.rotationY) > epsilon
    || Math.abs(actual.scale - expected.scale) > epsilon
  ) {
    throw new Error(`Garden transform did not survive Save/reload: ${JSON.stringify({ expected, actual })}`);
  }
  if (restored.selectableId !== firstLoad.selectableId || restored.meshCount !== firstLoad.meshCount) {
    throw new Error('Reload changed the stable garden identity or model detail');
  }

  const canvas = page.locator('#viewport canvas');
  const gardenViews = [
    { name: 'south', offset: [0, 2.8] },
    { name: 'north', offset: [0, -2.8] },
    { name: 'west', offset: [-2.3, 0] },
    { name: 'east', offset: [2.3, 0] },
  ];
  for (const view of gardenViews) {
    await page.evaluate(({ buildingId, anchorName, offset }) => {
      const world = window.labIsland;
      if (world.getTextSnapshot().mode !== 'walk') world.setMode('walk');
      const interior = world.authoredInteriorByBuildingId.get(buildingId);
      const anchor = interior.getObjectByName(anchorName);
      const livingIndex = anchor.parent.parent;
      interior.updateWorldMatrix(true, false);
      const worldScale = interior.getWorldScale(world.camera.position.clone());
      const floorY = Number(interior.userData.editorFloorY);
      const eyeLocal = 0.162 / Math.max(0.001, Math.abs(worldScale.y));
      const cameraLocal = world.camera.position.clone().set(
        livingIndex.position.x + offset[0],
        floorY + eyeLocal,
        livingIndex.position.z + offset[1],
      );
      const targetLocal = world.camera.position.clone().set(
        livingIndex.position.x,
        floorY + eyeLocal * 1.18,
        livingIndex.position.z,
      );
      const cameraWorld = interior.localToWorld(cameraLocal);
      const targetWorld = interior.localToWorld(targetLocal);
      world.camera.position.copy(cameraWorld);
      world.camera.lookAt(targetWorld);
      world.walkController.groundY = cameraWorld.y - 0.162;
      world.walkController.grounded = true;
      world.syncAuthoredRuntimeInteriorVisibility();
      world.advanceTime(240);
    }, {
      buildingId: BUILDING_ID,
      anchorName: ANCHOR_NAME,
      offset: view.offset,
    });
    await page.waitForTimeout(300);
    await canvas.screenshot({
      path: `${OUTPUT}/registration-garden-walk-${view.name}-canvas.png`,
    });
  }
  await page.screenshot({ path: `${OUTPUT}/registration-garden-walk.png`, fullPage: true });
  const finalState = await page.evaluate(() => window.labIsland.getTextSnapshot());
  if (
    finalState.mode !== 'walk'
    || finalState.walk?.grounded !== true
    || finalState.runtimePolicies?.isolatedWalkInteriorActive !== true
  ) {
    throw new Error('Final Registration Hall WALK state is not grounded and isolated');
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  const result = {
    lazyBeforeEntry,
    firstLoad,
    edited,
    savedPayload,
    restoredBeforeLoad,
    restored,
    assetRequestCount: assetRequests.length,
    finalWalk: finalState.walk,
    runtimePolicies: finalState.runtimePolicies,
    errors,
    warnings,
  };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    stableId: restored.selectableId,
    meshCount: restored.meshCount,
    materialCount: restored.materialCount,
    fittedSize: restored.fittedSize,
    transformRestored: restored.state,
    assetRequestCount: assetRequests.length,
    walkGrounded: finalState.walk.grounded,
    errors: errors.length,
  }, null, 2));
} finally {
  await browser.close();
}
