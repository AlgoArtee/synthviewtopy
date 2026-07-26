import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.PROJECT_BUNDLE_OUTPUT ?? 'output/project-bundle';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function createTriangleGlb() {
  const json = JSON.stringify({
    asset: { version: '2.0', generator: 'SynthViewTopy bundle smoke' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'BUNDLE_INTERIOR_TEST', mesh: 0 }],
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
  acceptDownloads: true,
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
  await page.waitForTimeout(1_200);

  const authored = await page.evaluate(async (bytes) => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    world.setMode('edit');
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Could not enter the Welcome Hall interior');
    const file = new File([new Uint8Array(bytes)], 'bundle-interior-test.glb', {
      type: 'model/gltf-binary',
    });
    const [definition] = await world.importFiles([file]);
    if (!definition) throw new Error('Bundle test GLB did not import');
    world.setObjectPosition(definition.id, 'x', 1.234);
    await world.saveProjectToLocalStorage(true);
    return {
      id: definition.id,
      parentBuildingId: definition.parentBuildingId,
      state: world.getObjectState(definition.id),
      persistence: world.getPersistenceSnapshot(),
    };
  }, [...createTriangleGlb()]);

  const downloadPromise = page.waitForEvent('download');
  await page.click('#project-bundle-export');
  const download = await downloadPromise;
  const bundlePath = `${OUTPUT}/round-trip.project.zip`;
  await download.saveAs(bundlePath);

  const mutated = await page.evaluate(({ id }) => {
    const world = window.labIsland;
    if (world.getActiveInteriorBuildingId()) world.exitInterior(false);
    world.deleteObject(id);
    const e4 = world.getObjectState('entry-logistics-building-e4');
    world.setObjectPosition('entry-logistics-building-e4', 'x', e4.position.x + 9);
    return {
      importedMissing: world.getDefinition(id) === null,
      movedE4X: world.getObjectState('entry-logistics-building-e4').position.x,
    };
  }, authored);
  if (!mutated.importedMissing) throw new Error('Mutation setup did not delete the imported object');

  await page.setInputFiles('#project-bundle-file', bundlePath);
  await page.waitForFunction(
    (id) => Boolean(window.labIsland.getDefinition(id)),
    authored.id,
  );
  await page.waitForTimeout(500);

  const restored = await page.evaluate(({ id, expectedX }) => {
    const world = window.labIsland;
    const definition = world.getDefinition(id);
    const group = world.objectGroups.get(id);
    const state = world.getObjectState(id);
    const integrity = world.getCanonicalIntegrity();
    return {
      definition,
      parentIsWelcomeInterior: group?.parent === world.authoredInteriorByBuildingId.get('entry-logistics-building-e2'),
      state,
      xRestored: Math.abs((state?.position.x ?? 0) - expectedX) < 0.001,
      integrity,
      persistence: world.getPersistenceSnapshot(),
    };
  }, { id: authored.id, expectedX: authored.state.position.x });

  const archive = unzipSync(new Uint8Array(await readFile(bundlePath)));
  const project = JSON.parse(strFromU8(archive['project.json']));
  project.editor.weather = 'checksum-tamper';
  archive['project.json'] = strToU8(JSON.stringify(project, null, 2));
  const corruptBundle = zipSync(archive, { level: 0 });
  const corruption = await page.evaluate(async (bytes) => {
    const world = window.labIsland;
    try {
      await world.importProjectBundle(new File(
        [new Uint8Array(bytes)],
        'corrupt.project.zip',
        { type: 'application/zip' },
      ));
      return { rejected: false, message: null };
    } catch (error) {
      return {
        rejected: true,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }, [...corruptBundle]);

  if (authored.parentBuildingId !== 'entry-logistics-building-e2') {
    throw new Error('Imported source was not authored inside the Welcome Hall');
  }
  if (
    restored.definition?.assetId === undefined
    || !restored.parentIsWelcomeInterior
    || !restored.xRestored
    || restored.integrity.entry.present !== 13
    || !restored.integrity.welcomePool.present
  ) {
    throw new Error('Verified bundle did not restore objects, parentage, transforms, or canonical assets');
  }
  if (!corruption.rejected || !/checksum/i.test(corruption.message ?? '')) {
    throw new Error('Tampered project bundle was not rejected by checksum validation');
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: `${OUTPUT}/restored-project.png`, fullPage: true });
  const result = { authored, restored, corruption, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
