import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:5178').replace(/\/$/, '');
const output = process.env.COMMUNITY_OUTPUT ?? 'test-artifacts/lux-umbrarum-community-room';
const id = 'lux-umbrarum-community-room';
const assetPath = '/apartments/assets/lux-umbrarum-community-room.glb';
const roomUrl = `${base}/room.html?id=${id}`;
await mkdir(output, { recursive: true });
const asset = await readFile(`public${assetPath}`);
const gltf = JSON.parse(asset.subarray(20, 20 + asset.readUInt32LE(12)).toString());
const primitives = gltf.meshes.flatMap(mesh => mesh.primitives);
const triangles = primitives.reduce((sum, primitive) => sum + gltf.accessors[primitive.indices].count / 3, 0);
assert(triangles <= 500_000 && primitives.length <= 40 && asset.length < 35 * 1024 * 1024);
assert(gltf.images.length >= 6 && gltf.images.every(image => image.bufferView !== undefined && !image.uri));
assert(gltf.buffers.every(buffer => !buffer.uri));
assert(!gltf.cameras?.length && !gltf.extensions?.KHR_lights_punctual);
const assetRoot = gltf.nodes.find(node => node.name === 'COMMONS__Lux_Umbrarum');
const layout = JSON.parse(assetRoot.extras.layout_json);
assert.equal(layout.id, id);
assert.equal(layout.pit.shape, 'ellipse');
assert.equal(layout.stairs.length, 6);
assert(layout.stairs.every(step => step.shape === 'elliptical-sector'));
assert.equal(layout.architecture.exits.length, 3);
assert(layout.architecture.mediaWall.angleDegrees > 20 && layout.architecture.mediaWall.angleDegrees < 40);
assert(layout.architecture.libraryWall.angleDegrees < -30);
assert(gltf.nodes.some(node => node.name === 'COMMONS__interior'));
assert(gltf.nodes.some(node => node.name === 'COMMONS__exterior'));
const results = { asset: { bytes: asset.length, triangles, primitives: primitives.length, embeddedImages: gltf.images.length }, checks: [], errors: [] };
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--disable-features=BackForwardCache'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', error => results.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()); });
page.setDefaultTimeout(30_000);
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const waitRoom = () => page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 120_000 });
const choose = async view => {
  await page.locator('#room-menu-toggle').click();
  await page.locator(`[data-viewpoint="${view}"]`).click();
  await page.evaluate(() => window.advanceTime(150));
};
const walk = async (key, ms) => {
  await page.keyboard.down(key); await page.evaluate(ms => window.advanceTime(ms), ms); await page.keyboard.up(key); return state();
};
try {
  await page.goto(`${base}/apartments.html`);
  await page.locator('#community-room-link img').evaluate(image => image.decode());
  const directory = await state();
  assert.equal(directory.category, 'Interiors'); assert.equal(directory.page, 'Lux Umbrarum Student Spaces');
  assert.equal(directory.totalRooms, 103); assert.equal(directory.additionalRooms, 100); assert.equal(directory.sharedRooms, 2);
  assert.match(await page.title(), /Lux Umbrarum Student Spaces/);
  await page.locator('#community-room-link').click(); await waitRoom();
  const initial = await state();
  assert.equal(initial.scene, 'community-room'); assert.equal(initial.communityRoom.state, 'loaded');
  assert.equal(initial.communityRoom.triangles, triangles); assert.equal(initial.collisionCount, layout.colliders.length);
  assert(initial.roomSignature && initial.exteriorSignature && initial.communityRoom.features.length >= 8);
  assert.deepEqual(initial.position, [0, 1.65, 7.8]);
  await page.screenshot({ path: `${output}/reference-view.png` });
  const jpeg = await page.evaluate(() => document.querySelector('#apartment-viewport canvas').toDataURL('image/jpeg', .9).split(',')[1]);
  await writeFile('public/apartments/community-room-preview.jpg', Buffer.from(jpeg, 'base64'));
  results.initial = initial; results.checks.push('directory hierarchy, shared-room route, ready metadata and rendered preview');

  const walked = await walk('w', 1600);
  assert.equal(walked.floorHeight, -.54); assert(Math.abs(walked.position[1] - 1.11) < .015);
  const stopped = await walk('w', 2400);
  const blocked = await walk('w', 700);
  assert.deepEqual(blocked.position, stopped.position, 'The low pit table must block walking at the lower floor level');
  assert(stopped.position[2] >= 3.7 && stopped.position[2] < 3.85);
  const climbed = await walk('s', 1900);
  assert.equal(climbed.floorHeight, 0); assert(Math.abs(climbed.position[1] - 1.65) < .03);
  results.walking = { descended: walked.position, tableStop: stopped.position, climbed: climbed.position };
  results.checks.push('three-step descent and ascent, eye height, sunken-table collision');

  for (const view of initial.viewpoints) {
    await choose(view.id);
    const current = await state();
    assert.equal(current.view, view.id);
    const [x, y, z] = current.position;
    assert(x >= current.bounds.minX + .24 && x <= current.bounds.maxX - .24 && z >= current.bounds.minZ + .24 && z <= current.bounds.maxZ - .24);
    assert(Math.abs(y - (current.floorHeight + 1.65)) < .02, `${view.id} must sit above the actual floor`);
    for (const box of layout.colliders) {
      if (box.max[1] < current.floorHeight + .18 || box.min[1] > current.floorHeight + 1.8) continue;
      const nx = Math.max(box.min[0], Math.min(x, box.max[0])); const nz = Math.max(box.min[2], Math.min(z, box.max[2]));
      assert((x - nx) ** 2 + (z - nz) ** 2 >= .24 ** 2, `${view.id} must have full camera clearance`);
    }
    await page.screenshot({ path: `${output}/view-${view.id}.png` });
  }
  results.checks.push('ten viewpoint renders, floor heights and furniture clearance');
  await choose('stairs');
  const rearClimb = await walk('w', 1100);
  assert.equal(rearClimb.floorHeight, 0); assert(Math.abs(rearClimb.position[1] - 1.65) < .03);
  const rearDescent = await walk('s', 1100);
  assert.equal(rearDescent.floorHeight, -.54); assert(Math.abs(rearDescent.position[1] - 1.11) < .03);
  results.walking.rearStairs = { climbed: rearClimb.position, descended: rearDescent.position };
  for (const [view, sign] of [['west-exit', -1], ['east-exit', 1]]) {
    await choose(view);
    const entered = await walk('w', 1000);
    assert(entered.position[0] * sign > 8.4, `${view} must be accessible through its opening`);
    assert.equal(entered.floorHeight, 0);
    const end = await walk('w', 900); const blockedEnd = await walk('w', 500);
    assert.deepEqual(end.position, blockedEnd.position, 'Corridor end wall must stop walking');
    const returned = await walk('s', 1400);
    assert(returned.position[0] * sign < 6, `${view} must let visitors return to the terrace`);
    results.walking[view] = { entered: entered.position, stopped: end.position, returned: returned.position };
  }
  await choose('entrance');
  const mainExit = await walk('s', 500);
  assert(mainExit.position[2] > 8.9); assert.equal(mainExit.floorHeight, 0);
  results.checks.push('rear curved stair ascent/descent and three clear entrance/exit routes');
  await choose('entrance'); await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.screenshot({ path: `${output}/mobile.png` });
  await page.locator('#room-menu-toggle').click();
  assert(await page.locator('[data-viewpoint="library"]').isVisible());
  await page.keyboard.press('Escape');
  results.checks.push('phone viewport and accessible room guide');

  results.lifecycle = await page.evaluate(async () => {
    const { createCommunityRoom } = await import('/src/apartments/communityRoom.ts');
    const loaded = createCommunityRoom(); await loaded.ready;
    const geometries = new Set(), materials = new Set(), textures = new Set();
    loaded.scene.traverse(object => {
      if (!object.isMesh) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    const counts = { geometry: 0, material: 0, texture: 0 };
    for (const [values, key] of [[geometries, 'geometry'], [materials, 'material'], [textures, 'texture']]) for (const value of values) value.addEventListener('dispose', () => counts[key]++);
    const metadata = loaded.scene.userData.apartment.communityRoom;
    loaded.dispose(); loaded.dispose();
    const pending = createCommunityRoom(); const late = pending.scene.userData.apartment.communityRoom;
    pending.dispose(); await pending.ready;
    return { expected: { geometry: geometries.size, material: materials.size, texture: textures.size }, counts,
      loadedState: metadata.state, loadedReleased: metadata.resourcesReleased, lateState: late.state, lateReleased: late.resourcesReleased, lateChildren: pending.scene.children.length };
  });
  assert.deepEqual(results.lifecycle.counts, results.lifecycle.expected);
  assert.equal(results.lifecycle.loadedState, 'disposed'); assert(results.lifecycle.loadedReleased);
  assert.equal(results.lifecycle.lateState, 'disposed'); assert(results.lifecycle.lateReleased); assert.equal(results.lifecycle.lateChildren, 0);
  results.checks.push('geometry, material and texture disposal exactly once; late load cannot attach');

  const departing = await context.newPage();
  let arrived; const arrival = new Promise(resolve => { arrived = resolve; });
  await departing.route(`**${assetPath}`, async route => {
    arrived(); await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ body: asset, contentType: 'model/gltf-binary' }).catch(() => {});
  });
  await departing.goto(roomUrl, { waitUntil: 'domcontentloaded' }); await arrival;
  results.departure = await departing.evaluate(async () => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    await new Promise(resolve => setTimeout(resolve, 1400));
    return { ready: typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, guideButtons: document.querySelectorAll('[data-viewpoint]').length };
  });
  assert.equal(results.departure.ready, false); assert.equal(results.departure.guideButtons, 0);
  await departing.close(); results.checks.push('room departure during delayed asset loading');

  const failed = await context.newPage(); const expectedErrors = [];
  failed.on('pageerror', error => { throw error; });
  failed.on('console', message => { if (message.type() === 'error') expectedErrors.push(message.text()); });
  await failed.route(`**${assetPath}`, route => route.fulfill({ status: 404, body: 'Missing asset fixture' }));
  await failed.goto(roomUrl); await failed.getByText('The room could not finish loading.', { exact: false }).waitFor();
  assert.equal(await failed.locator('#apartment-viewport canvas').count(), 0);
  await failed.screenshot({ path: `${output}/missing-glb.png` });
  await failed.locator('#room-loading').getByRole('link', { name: 'Back to Lux Umbrarum Student Spaces', exact: true }).click();
  await failed.locator('#community-room-link').waitFor();
  assert(expectedErrors.some(error => error.includes('Unable to open student space')));
  await failed.close(); results.checks.push('missing GLB recovery returns to the usable collection');
  assert.deepEqual(results.errors, []);
  console.log(`Community room smoke passed: ${results.checks.length} checks; ${triangles} triangles, ${primitives.length} primitives, ${(asset.length / 1e6).toFixed(1)} MB`);
} catch (error) {
  results.failure = error.stack; console.error(error);
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {}); process.exitCode = 1;
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2)); await browser.close();
}
