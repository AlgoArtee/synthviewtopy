import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.INTERIOR_GLB_IMPORT_OUTPUT ?? 'output/interior-glb-import';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function createTriangleGlb() {
  const json = JSON.stringify({
    asset: { version: '2.0', generator: 'SynthViewTopy interior import smoke' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'INTERIOR_IMPORT_TEST', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 }],
    accessors: [{
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [0, 0, 0],
      max: [1, 1, 0],
    }],
  });
  const jsonLength = Math.ceil(Buffer.byteLength(json) / 4) * 4;
  const jsonChunk = Buffer.alloc(jsonLength, 0x20);
  jsonChunk.write(json);
  const binChunk = Buffer.alloc(36);
  new Float32Array(binChunk.buffer, binChunk.byteOffset, 9).set([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ]);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const glb = Buffer.alloc(totalLength);
  glb.writeUInt32LE(0x46546c67, 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(totalLength, 8);
  glb.writeUInt32LE(jsonChunk.length, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  jsonChunk.copy(glb, 20);
  const binHeader = 20 + jsonChunk.length;
  glb.writeUInt32LE(binChunk.length, binHeader);
  glb.writeUInt32LE(0x004e4942, binHeader + 4);
  binChunk.copy(glb, binHeader + 8);
  return glb;
}

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
  await page.click('[data-mode="walk"]');

  const before = await page.evaluate(() => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const interior = facility?.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    if (!facility || !interior) throw new Error('Welcome Hall authored interior is unavailable');
    // Enter through the real scale-aware edit-to-WALK handoff instead of
    // synthesizing a local eye height that changes when the host is scaled.
    world.setMode('edit');
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Welcome Hall interior could not be entered');
    world.setMode('walk');
    world.advanceTime(180);
    const detected = world.getCurrentInteriorBuildingId();
    if (detected !== buildingId) {
      throw new Error(`WALK interior detection returned ${detected ?? 'null'}, expected ${buildingId}`);
    }
    return {
      buildingId,
      camera: world.camera.position.toArray(),
      mode: world.getTextSnapshot().mode,
      detected,
      interiorVisible: interior.visible,
    };
  });

  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('#import-trigger');
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'interior-import-test.glb',
    mimeType: 'model/gltf-binary',
    buffer: createTriangleGlb(),
  });
  await page.waitForFunction(() => {
    const snapshot = window.labIsland.getTextSnapshot();
    return snapshot.edit.activeInteriorBuildingId === 'entry-logistics-building-e2'
      && snapshot.selected?.category === 'imported';
  });
  await page.waitForTimeout(400);

  const after = await page.evaluate(({ buildingId, camera }) => {
    const world = window.labIsland;
    const snapshot = world.getTextSnapshot();
    const selected = snapshot.selected;
    const group = selected ? world.objectGroups.get(selected.id) : null;
    const definition = selected ? world.getDefinition(selected.id) : null;
    const interior = world.authoredInteriorByBuildingId.get(buildingId);
    if (!selected || !group || !definition || !interior) throw new Error('Imported interior selection is incomplete');
    const state = world.getObjectState(selected.id);
    const cameraShift = world.camera.position.distanceTo(world.camera.position.clone().fromArray(camera));
    let effectivelyVisible = true;
    let cursor = group;
    while (cursor) {
      effectivelyVisible &&= cursor.visible;
      cursor = cursor.parent;
    }
    return {
      activeInteriorBuildingId: snapshot.edit.activeInteriorBuildingId,
      activeInteriorType: snapshot.edit.activeInteriorType,
      workspace: snapshot.edit.workspace,
      mode: snapshot.mode,
      selected,
      parentIsAuthoredInterior: group.parent === interior,
      definitionParentBuildingId: definition.parentBuildingId,
      definitionWorkspace: definition.workspace,
      effectivelyVisible,
      cameraShift,
      importPlacement: snapshot.importPlacement,
      state,
      transformAttached: world.transformControls.object === group,
      interiorVisible: interior.visible,
    };
  }, before);

  if (after.mode !== 'edit' || after.workspace !== 'interior') {
    throw new Error(`Import left the wrong workspace: ${after.mode}/${after.workspace}`);
  }
  if (after.activeInteriorBuildingId !== before.buildingId || after.activeInteriorType !== 'authored') {
    throw new Error('Import did not retain the authored Welcome Hall interior');
  }
  if (!after.parentIsAuthoredInterior || after.definitionParentBuildingId !== before.buildingId) {
    throw new Error('Imported GLB was not parented to the active authored interior');
  }
  if (after.definitionWorkspace !== 'interior' || !after.effectivelyVisible || !after.interiorVisible) {
    throw new Error('Imported GLB is not visible in the interior workspace');
  }
  if (after.cameraShift > 0.001) {
    throw new Error(`Import moved the inside camera by ${after.cameraShift.toFixed(4)} world units`);
  }
  if (after.importPlacement.choosing || after.importPlacement.position) {
    throw new Error('Interior import incorrectly activated exterior placement');
  }
  if (!after.transformAttached) throw new Error('Imported GLB was not attached to the edit gizmo');
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  await page.screenshot({
    path: `${OUTPUT}/interior-glb-import.png`,
    fullPage: true,
  });
  const result = { before, after, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
