import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:5178').replace(/\/$/, '');
const output = process.env.ASTRONOMY_DESK_OUTPUT ?? 'test-artifacts/liminette-astronomy-desk';
const assetPath = '/apartments/assets/liminette-astronomy-desk.glb';
await mkdir(output, { recursive: true });
const asset = await readFile(`public${assetPath}`);
assert.equal(asset.readUInt32LE(0), 0x46546c67);
assert.equal(asset.readUInt32LE(4), 2);
assert.equal(asset.readUInt32LE(8), asset.length);
const manifest = JSON.parse(asset.subarray(20, 20 + asset.readUInt32LE(12)).toString());
assert(manifest.images.length >= 8, 'The GLB must embed the baked materials and instrument artwork');
assert(manifest.images.every(image => image.bufferView !== undefined && image.uri === undefined));
assert(!manifest.cameras?.length && !manifest.extensions?.KHR_lights_punctual);
const primitives = manifest.meshes.flatMap(mesh => mesh.primitives);
const triangles = primitives.reduce((sum, primitive) => sum + manifest.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3, 0);
assert(primitives.length <= 40 && triangles <= 150_000 && asset.length <= 20 * 1024 * 1024);
const results = { asset: { bytes: asset.length, primitives: primitives.length, triangles, images: manifest.images.length }, views: [], errors: [] };

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--disable-features=BackForwardCache'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', error => results.errors.push(error.stack));
page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()); });
const snapshot = target => target.evaluate(() => JSON.parse(window.render_game_to_text()));
async function waitReady(target) {
  await target.waitForFunction(() => typeof window.render_game_to_text === 'function'
    && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 90_000 });
}
async function goView(id) {
  await page.locator('#room-menu-toggle').click();
  await page.locator(`#room-viewpoints [data-viewpoint="${id}"]`).click();
  await page.evaluate(() => window.advanceTime(100));
}

try {
  await page.goto(`${base}/liminette.html`);
  await waitReady(page);
  const initial = await snapshot(page);
  results.initial = initial;
  const desk = initial.referenceDesk;
  assert.equal(desk.id, 'liminette-reference-astronomy-desk');
  assert.equal(desk.state, 'loaded');
  assert.equal(desk.facing, '-X');
  assert.equal(desk.seatedFacing, '+X');
  assert.equal(desk.rotationY, -Math.PI / 2);
  assert.equal(initial.floorArea, 285);
  assert(initial.bounds.minX <= -10.65 && initial.bounds.minZ <= -8.65, 'The enlarged room must offer the added walking space');
  assert.equal(desk.triangles, triangles);
  assert(desk.meshes <= 40);
  assert(desk.bounds.min[0] >= 2.14 && desk.bounds.max[0] <= 4.02, 'The rotated desk must fit against the east partition');
  assert(desk.bounds.min[1] >= -.015 && desk.bounds.max[1] < 2.02, 'The asset must stand on the floor at realistic height');
  // The armillary rings project slightly behind the furniture footprint.
  assert(desk.bounds.min[2] >= -6.52 && desk.bounds.max[2] <= -2.98);
  assert.equal(initial.workstation.model, 'Vinculum Atlas research workstation');
  await page.screenshot({ path: `${output}/room-entrance.png` });
  results.views.push({ id: 'entrance', state: initial });
  for (const id of ['study', 'astronomy-desk', 'sleep']) {
    await goView(id);
    const state = await snapshot(page);
    assert.equal(state.view, id);
    await page.screenshot({ path: `${output}/room-${id}.png` });
    results.views.push({ id, state });
    for (const key of ['s', 'a', 'd']) {
      await goView(id);
      const before = await snapshot(page);
      await page.keyboard.down(key);
      await page.evaluate(() => window.advanceTime(300));
      await page.keyboard.up(key);
      const after = await snapshot(page);
      assert(Math.hypot(after.position[0]-before.position[0], after.position[2]-before.position[2]) > .15,
        `${id} must offer an unobstructed ${key} departure`);
    }
  }
  // The desks now meet at the corner; walking access is in front of the L.
  await goView('astronomy-desk');
  await page.keyboard.down('d');
  await page.evaluate(() => window.advanceTime(1400));
  await page.keyboard.up('d');
  await page.keyboard.down('w');
  await page.evaluate(() => window.advanceTime(1600));
  await page.keyboard.up('w');
  const alcoveRoute = await snapshot(page);
  assert(alcoveRoute.position[0] > 4.6 && alcoveRoute.position[2] > -2.2,
    'The route from the astronomy desk through the sleeping alcove doorway must stay open');
  results.alcoveRoute = alcoveRoute.position;
  await goView('astronomy-desk');
  await page.keyboard.down('w');
  await page.evaluate(() => window.advanceTime(4000));
  await page.keyboard.up('w');
  const stopped = await snapshot(page);
  await page.keyboard.down('w');
  await page.evaluate(() => window.advanceTime(1000));
  await page.keyboard.up('w');
  assert.deepEqual((await snapshot(page)).position, stopped.position, 'Desk collision must stop sustained forward walking');
  await goView('astronomy-desk');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${output}/room-mobile.png` });
  assert.equal((await snapshot(page)).referenceDesk.state, 'loaded');

  // Test the actual imported asset resources and race using the same public helper.
  // GLTFLoader does not require a renderer, so this also exercises pre-render disposal.
  const lifecycle = await page.evaluate(async () => {
    const { createReferenceAstronomyDesk } = await import('/src/apartments/referenceAstronomyDesk.ts');
    const loaded = createReferenceAstronomyDesk();
    await loaded.ready;
    let geometryCount = 0, materialCount = 0, textureCount = 0;
    let geometryDisposals = 0, materialDisposals = 0, textureDisposals = 0;
    const materials = new Set(), textures = new Set();
    loaded.group.traverse(object => {
      if (!object.isMesh) return;
      geometryCount++;
      object.geometry.addEventListener('dispose', () => geometryDisposals++);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    for (const material of materials) {
      materialCount++;
      material.addEventListener('dispose', () => materialDisposals++);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    for (const texture of textures) {
      textureCount++;
      texture.addEventListener('dispose', () => textureDisposals++);
    }
    loaded.dispose();
    loaded.dispose();
    const pending = createReferenceAstronomyDesk();
    pending.dispose();
    await pending.ready;
    return { geometryCount, materialCount, textureCount, geometryDisposals, materialDisposals, textureDisposals,
      loadedChildren: loaded.group.children.length, lateChildren: pending.group.children.length,
      loadedState: loaded.metadata.state, lateState: pending.metadata.state };
  });
  assert.equal(lifecycle.geometryDisposals, lifecycle.geometryCount);
  assert.equal(lifecycle.materialDisposals, lifecycle.materialCount);
  assert.equal(lifecycle.textureDisposals, lifecycle.textureCount);
  assert.equal(lifecycle.loadedChildren, 0);
  assert.equal(lifecycle.lateChildren, 0);
  assert.equal(lifecycle.loadedState, 'disposed');
  assert.equal(lifecycle.lateState, 'disposed');
  results.lifecycle = lifecycle;

  // Room departure while its GLB request is delayed must never claim readiness.
  const departing = await context.newPage();
  let requestArrived;
  const arrived = new Promise(resolve => { requestArrived = resolve; });
  await departing.route(`**${assetPath}`, async route => {
    requestArrived();
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ body: asset, contentType: 'model/gltf-binary' }).catch(() => {});
  });
  await departing.goto(`${base}/liminette.html`, { waitUntil: 'domcontentloaded' });
  await arrived;
  const departure = await departing.evaluate(async () => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    await new Promise(resolve => setTimeout(resolve, 1300));
    return { canvases: document.querySelectorAll('#apartment-viewport canvas').length,
      ready: typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready };
  });
  assert.equal(departure.ready, false);
  results.departureDuringLoading = departure;
  await departing.close();

  const failed = await context.newPage();
  await failed.route(`**${assetPath}`, route => route.fulfill({ status: 404, body: 'Missing asset fixture' }));
  await failed.goto(`${base}/liminette.html`);
  await failed.getByText('The room could not finish loading.', { exact: false }).waitFor({ timeout: 30_000 });
  assert(await failed.locator('#room-loading').isVisible());
  assert.equal(await failed.evaluate(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready), false);
  assert.equal(await failed.locator('#apartment-viewport canvas').count(), 0);
  await failed.screenshot({ path: `${output}/missing-glb-fallback.png` });
  await failed.locator('#room-loading').getByRole('link', { name: 'Back to Lux Umbrarum Student Spaces', exact: true }).click();
  await failed.locator('a.apartment-card').first().waitFor();
  results.missingAsset = 'readable fallback, disposed scene, working directory link';
  await failed.close();
  assert.deepEqual(results.errors, []);
  console.log(`Astronomy desk smoke passed: ${triangles} triangles, ${primitives.length} primitives, ${asset.length} bytes`);
} catch (error) {
  results.failure = error.stack;
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
