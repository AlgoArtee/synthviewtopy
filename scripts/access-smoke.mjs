import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consoleErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#walk-mode', { state: 'visible', timeout: 30_000 });
await page.waitForTimeout(800);

const result = await page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('walk');
  world.walkController.refreshNavigation();

  const portals = [];
  world.modelRoot.traverse((object) => {
    if (!object.userData.navAccess || !object.isMesh) return;
    object.updateWorldMatrix(true, false);
    const matrix = object.matrixWorld.elements;
    const axisX = matrix[8];
    const axisZ = matrix[10];
    const axisLength = Math.hypot(axisX, axisZ) || 1;
    portals.push({
      kind: object.userData.accessKind,
      x: matrix[12],
      z: matrix[14],
      axisX: axisX / axisLength,
      axisZ: axisZ / axisLength,
    });
  });

  const traverse = (kind) => {
    const portal = portals.find((entry) => entry.kind === kind);
    if (!portal) return null;
    const startDistance = 1.4;
    const startX = portal.x + portal.axisX * startDistance;
    const startZ = portal.z + portal.axisZ * startDistance;
    world.camera.position.set(startX, 2.2, startZ);
    world.camera.lookAt(portal.x - portal.axisX, 2.2, portal.z - portal.axisZ);
    world.setWalkIntent(0, 1);
    world.advanceTime(2600);
    world.setWalkIntent(0, 0);
    const finalPosition = world.camera.position;
    const crossedIntoPortal =
      (startX - finalPosition.x) * portal.axisX + (startZ - finalPosition.z) * portal.axisZ;
    return {
      start: [Number(startX.toFixed(3)), Number(startZ.toFixed(3))],
      end: [Number(finalPosition.x.toFixed(3)), Number(finalPosition.z.toFixed(3))],
      enteredDistance: Number(crossedIntoPortal.toFixed(3)),
      grounded: world.walkController.getSnapshot().grounded,
    };
  };
  const districtTraversal = traverse('district');
  const domeTraversal = traverse('dome');

  const domeIds = [
    'alpine-dome',
    'tundra-dome',
    'desert-dome',
    'savanna-dome',
    'temperate-deciduous-forest-dome',
    'tropical-rainforest-dome',
  ];
  const domeAudit = domeIds.map((id) => {
    const definition = world.getDefinition(id);
    const object = world.scene.getObjectByName(`BIOME__${id}`);
    let fieldLabs = 0;
    object?.traverse((child) => {
      if (child.name === `${id}__BIOME_FIELD_LABORATORY`) fieldLabs += 1;
    });
    return {
      id,
      footprint: definition?.footprint,
      height: definition?.height,
      fieldLabObjects: fieldLabs,
    };
  });

  world.setMode('explore');
  const alpine = world.getObjectState('alpine-dome');
  if (!alpine) throw new Error('Alpine Dome was unavailable');
  world.camera.position.set(alpine.position.x + 24, 17, alpine.position.z + 30);
  world.controls.target.set(alpine.position.x, 4, alpine.position.z);
  world.controls.update();
  const exploreView = {
    camera: world.camera.position.toArray(),
    target: world.controls.target.toArray(),
    direction: world.camera.getWorldDirection(world.controls.target.clone()).toArray(),
  };
  world.setMode('edit');
  const editView = {
    camera: world.camera.position.toArray(),
    target: world.controls.target.toArray(),
  };
  world.select('alpine-dome', 'system');
  const domeCanEnterInterior = world.canEnterInterior('alpine-dome');
  const domeInteriorEntered = world.enterInterior('alpine-dome');
  let defaultLabFixtures = 0;
  world.interiorsRoot.traverse((child) => {
    if (child.name.startsWith('BIOME_LAB_DEFAULT__')) defaultLabFixtures += 1;
  });
  const domeInteriorMeta = world.interiorsRoot.children.find((child) => child.userData.buildingId === 'alpine-dome')?.userData;
  world.exitInterior();

  world.camera.position.set(alpine.position.x + 18, 12, alpine.position.z + 24);
  world.controls.target.set(alpine.position.x, 3, alpine.position.z);
  world.controls.update();
  const walkSource = {
    camera: world.camera.position.toArray(),
    target: world.controls.target.toArray(),
  };
  world.setMode('walk');
  const walkView = world.walkController.getSnapshot();
  world.setMode('edit');
  const editAfterWalk = {
    camera: world.camera.position.toArray(),
    target: world.controls.target.toArray(),
  };

  return {
    portalCounts: portals.reduce((counts, portal) => {
      counts[portal.kind] = (counts[portal.kind] ?? 0) + 1;
      return counts;
    }, {}),
    district: districtTraversal,
    dome: domeTraversal,
    domeAudit,
    editPreservedExploreView:
      JSON.stringify(exploreView.camera) === JSON.stringify(editView.camera) &&
      JSON.stringify(exploreView.target) === JSON.stringify(editView.target),
    domeCanEnterInterior,
    domeInteriorEntered,
    defaultLabFixtures,
    domeInteriorMeta: domeInteriorMeta
      ? { biomeLaboratory: domeInteriorMeta.biomeLaboratory, labType: domeInteriorMeta.labType }
      : null,
    walkSource,
    walkView,
    editAfterWalk,
    walkStayedAtViewedTarget:
      Math.hypot(walkView.positionWorld[0] - walkSource.target[0], walkView.positionWorld[2] - walkSource.target[2]) < 0.01,
    editKeptWalkLocation:
      Math.hypot(editAfterWalk.camera[0] - walkView.positionWorld[0], editAfterWalk.camera[2] - walkView.positionWorld[2]) < 0.01,
  };
});

await page.click('.mode[data-mode="explore"]');
await page.evaluate(() => {
  const world = window.labIsland;
  const alpine = world.getObjectState('alpine-dome');
  if (!alpine) return;
  world.camera.position.set(alpine.position.x + 31, 19, alpine.position.z + 34);
  world.controls.target.set(alpine.position.x, 5, alpine.position.z);
  world.controls.update();
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'output/dome-camera-client/alpine-dome-field-lab.png' });
await page.click('.mode[data-mode="edit"]');
await page.evaluate(() => {
  const world = window.labIsland;
  world.select('alpine-dome', 'system');
});
await page.click('#edit-interior');
await page.click('#enter-interior');
await page.waitForTimeout(600);
await page.screenshot({ path: 'output/dome-camera-client/alpine-dome-edit-interior.png' });

console.log(JSON.stringify({ result, consoleErrors }, null, 2));
await browser.close();
