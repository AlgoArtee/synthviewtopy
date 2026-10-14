import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:5178').replace(/\/$/, '');
const output = process.env.CATALOG_OUTPUT ?? 'test-artifacts/apartment-catalog';
const previewDirectory = process.env.CATALOG_PREVIEWS ?? 'public/apartments/previews';
const publishPreviews = process.env.CATALOG_PUBLISH_PREVIEWS !== '0';
const requirePreviews = process.env.CATALOG_REQUIRE_PREVIEWS === '1';
const scope = process.env.CATALOG_SCOPE ?? 'all';
const start = Number(process.env.CATALOG_START ?? 1);
const end = Number(process.env.CATALOG_END ?? 100);
assert(Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end <= 100 && start <= end, 'Use a catalog range within 1–100');
const viewport = { width: 640, height: 400 };
const metadataKey = 'vinculum-room-metadata-v1';
const disposalKey = '__vinculum_catalog_disposal_audit__';
const results = [];
const failures = [];
const errors = [];
let phase = 'startup';
await mkdir(output, { recursive: true });
await mkdir(`${output}/renders`, { recursive: true });
if (publishPreviews) await mkdir(previewDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  // Exercise actual pagehide cleanup without retaining prior rooms in BFCache.
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--disable-features=BackForwardCache'],
});
const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  const counts = { createdTextures: 0, deletedTextures: 0, createdBuffers: 0, deletedBuffers: 0, createdPrograms: 0, deletedPrograms: 0 };
  window.__catalogGLResources = counts;
  const methods = { createTexture: 'createdTextures', deleteTexture: 'deletedTextures', createBuffer: 'createdBuffers', deleteBuffer: 'deletedBuffers', createProgram: 'createdPrograms', deleteProgram: 'deletedPrograms' };
  for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Type) continue;
    for (const [method, counter] of Object.entries(methods)) {
      const original = Type.prototype[method];
      Type.prototype[method] = function (...args) {
        const value = Reflect.apply(original, this, args);
        if (method.startsWith('delete') ? Boolean(args[0]) : Boolean(value)) counts[counter] += 1;
        return value;
      };
    }
  }
});
const page = await context.newPage();
page.setDefaultTimeout(25_000);
page.on('pageerror', error => errors.push({ phase, type: 'pageerror', message: error.message, stack: error.stack }));
page.on('console', message => {
  if (message.type() === 'error' || /too many active webgl contexts|context.*lost/i.test(message.text())) errors.push({ phase, type: message.type(), message: message.text() });
});
page.on('requestfailed', request => {
  if (request.url().includes('/apartments/materials/')) errors.push({ phase, type: 'asset request', url: request.url(), message: request.failure()?.errorText });
});
page.on('response', response => {
  if (response.url().includes('/apartments/materials/') && response.status() >= 400) errors.push({ phase, type: 'asset HTTP', url: response.url(), status: response.status() });
});

const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const roomId = number => `room-${String(number).padStart(3, '0')}`;
const roomUrl = id => `${base}/room.html?id=${encodeURIComponent(id)}`;
const card = id => page.locator(`#room-catalog-grid .catalog-card[data-room-id="${id}"]`);
const visibleCards = () => page.locator('#room-catalog-grid .catalog-card:visible');
const escapeHtml = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const markBeforeNavigation = () => page.evaluate(key => {
  const before = { ...window.__catalogGLResources };
  // Register after startup, so this listener runs after the app's disposal
  // listeners. A microtask in an earlier listener can run before later ones.
  window.addEventListener('pagehide', event => {
    const counts = window.__catalogGLResources;
    const deletedOnHide = { textures: counts.deletedTextures - before.deletedTextures, buffers: counts.deletedBuffers - before.deletedBuffers, programs: counts.deletedPrograms - before.deletedPrograms };
    sessionStorage.setItem(key, JSON.stringify({ url: location.href, persisted: event.persisted, ...counts, deletedOnHide }));
  }, { once: true });
}, disposalKey);

async function waitRoom() {
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready === true, null, { timeout: 120_000 });
  await page.locator('#room-loading').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#apartment-viewport canvas').count(), 1, 'Each route must own exactly one room canvas');
  await page.evaluate(() => window.advanceTime(100));
}

async function canvasSnapshot(encode = true) {
  return page.evaluate(encode => {
    const canvas = document.querySelector('#apartment-viewport canvas');
    const tiny = document.createElement('canvas');
    tiny.width = 64; tiny.height = 40;
    const drawing = tiny.getContext('2d');
    drawing.drawImage(canvas, 0, 0, tiny.width, tiny.height);
    const pixels = drawing.getImageData(0, 0, tiny.width, tiny.height).data;
    const colors = new Set();
    let min = 255, max = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      colors.add(`${pixels[i] >> 3},${pixels[i + 1] >> 3},${pixels[i + 2] >> 3}`);
      const light = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      min = Math.min(min, light); max = Math.max(max, light);
    }
    return { width: canvas.width, height: canvas.height, colors: colors.size, brightnessRange: max - min,
      jpeg: encode ? canvas.toDataURL('image/jpeg', .8) : undefined };
  }, encode);
}

function insideRoom(snapshot, label) {
  assert(snapshot.position.length === 3 && snapshot.position.every(Number.isFinite), `${label} must keep a finite camera position`);
  const [x, , z] = snapshot.position;
  const { minX, maxX, minZ, maxZ } = snapshot.bounds;
  assert(x >= minX && x <= maxX && z >= minZ && z <= maxZ,
    `${label} must stay inside the room: ${JSON.stringify(snapshot.position)}`);
}

const displacement = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
async function chooseView(id) {
  await page.locator('#room-menu-toggle').click();
  await page.locator(`#room-viewpoints [data-viewpoint="${id}"]`).click();
  await page.evaluate(() => window.advanceTime(50));
}
async function resetRoom() {
  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-reset').click();
  await page.evaluate(() => window.advanceTime(50));
}
async function walk(key, milliseconds) {
  await page.keyboard.down(key);
  await page.evaluate(time => window.advanceTime(time), milliseconds);
  await page.keyboard.up(key);
  return state();
}

async function presetChecks(initial, representative) {
  const id = initial.roomId;
  const views = await page.locator('#room-viewpoints [data-viewpoint]').evaluateAll(buttons => buttons.map(button => button.dataset.viewpoint));
  assert.equal(views.length, 7, `${id} must provide all seven living-space viewpoints`);
  assert(views.includes('outlook'), `${id} must offer the shared campus outlook`);
  const audit = [];
  const directory = `${output}/layout-${String(initial.layout).padStart(2, '0')}`;
  if (representative) await mkdir(directory, { recursive: true });
  for (const view of views) {
    await chooseView(view);
    const current = await state();
    assert.equal(current.view, view, `${id} must activate its ${view} preset`);
    assert.equal(current.menuOpen, false, 'Choosing a viewpoint must close the guide');
    assert.equal(await page.locator(`#room-viewpoints [data-viewpoint="${view}"]`).getAttribute('aria-current'), 'true');
    insideRoom(current, `${id} ${view}`);
    const image = await canvasSnapshot(representative);
    assert(image.colors > 30 && image.brightnessRange > 20, `${id} ${view} must render an illuminated scene`);
    const { jpeg, ...pixels } = image;
    const capture = representative ? `${directory}/${id}-${view}.jpg` : undefined;
    if (capture) await writeFile(capture, Buffer.from(jpeg.split(',')[1], 'base64'));
    const steps = [];
    // Walk from every preset for one room per floorplan. A preset inside an
    // enlarged furnishing collider can render correctly yet trap the visitor.
    if (representative) {
      let before = current;
      for (const key of ['w', 'd', 's', 'a']) {
        const after = await walk(key, 180);
        insideRoom(after, `${id} ${view} walking ${key}`);
        steps.push({ key, from: before.position, to: after.position, distance: displacement(before.position, after.position) });
        before = after;
      }
      assert(steps.some(step => step.distance > .15), `${id} ${view} must allow walking away from its preset; possible collider trap`);
    }
    audit.push({ view, position: current.position, look: current.look, pixels, capture, movement: steps });
  }
  await resetRoom();
  assert.deepEqual((await state()).position, initial.position, `${id} must reset to its entrance`);
  return audit;
}

async function layoutControls(initial) {
  const id = initial.roomId;
  const before = await state();
  await page.mouse.move(350, 230);
  await page.mouse.down();
  await page.mouse.move(470, 265, { steps: 7 });
  await page.mouse.up();
  const dragged = await state();
  assert(Math.abs(dragged.look.yaw - before.look.yaw) > .1, `${id} must respond to drag-look`);
  assert(Math.abs(dragged.look.pitch - before.look.pitch) > .02, `${id} must respond to vertical drag-look`);
  await resetRoom();
  const entranceMovement = [];
  let last = await state();
  for (const key of ['w', 'a', 's', 'd']) {
    const next = await walk(key, 250);
    insideRoom(next, `${id} entrance walking ${key}`);
    entranceMovement.push({ key, distance: displacement(last.position, next.position), position: next.position });
    last = next;
  }
  assert(entranceMovement.some(step => step.distance > .2), `${id} must allow the visitor to leave its entrance`);
  await chooseView('outlook');
  const left = await walk('a', 200);
  const right = await walk('d', 400);
  assert(displacement(left.position, right.position) > .4, `${id} must allow sideways movement at its outlook`);
  assert.equal(left.look.yaw, right.look.yaw, `${id} strafing must preserve view direction`);
  await chooseView('outlook');
  const windowStop = await walk('w', 30_000);
  const heldAtWindow = await walk('w', 4_000);
  insideRoom(windowStop, `${id} window boundary`);
  insideRoom(heldAtWindow, `${id} continued window movement`);
  assert(windowStop.position[2] >= windowStop.bounds.minZ + .23, `${id} must stop before crossing the window`);
  assert.equal(heldAtWindow.position[2], windowStop.position[2], `${id} continued forward movement must stop at the window`);
  await resetRoom();
  const reset = await state();
  assert.equal(reset.view, 'entrance');
  assert.deepEqual(reset.position, initial.position);
  assert.equal(reset.look.fov, initial.look.fov);
  return { drag: { before: before.look, after: dragged.look }, entranceMovement,
    outlookLeft: left.position, outlookRight: right.position, windowStop: windowStop.position, continuedWindow: heldAtWindow.position };
}

async function disposalAfterNavigation(expectedId) {
  const audit = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key) ?? 'null'), disposalKey);
  assert(audit && audit.url.includes(expectedId === 'liminette-student-room' ? '/liminette.html' : expectedId), `Missing pagehide resource audit for ${expectedId}`);
  assert.equal(audit.persisted, false, 'This lifecycle fixture disables BFCache');
  assert(audit.createdTextures > 0 && audit.createdBuffers > 0, `${expectedId} must have allocated actual WebGL scene resources`);
  assert(audit.deletedOnHide.textures > 0 && audit.deletedOnHide.buffers > 0 && audit.deletedOnHide.programs > 0,
    `${expectedId} must release its textures, geometry buffers and programs on navigation: ${JSON.stringify(audit)}`);
  return audit;
}

function celestialIdentity(snapshot) {
  const sky = snapshot.celestial;
  assert(sky && typeof sky === 'object', 'Runtime must identify the shared island celestial renderer');
  assert.equal(sky.source, 'src/world/islandCygnus.ts');
  assert.equal(sky.artworkSource, 'src/world/syntheticShore/celestial.ts');
  assert.equal(sky.shaderAndGeometry, 'identical-to-lab-island');
  assert(sky.artworkSignature?.geometry && sky.artworkSignature?.fragmentShader, 'The shared sky must fingerprint its actual geometry and artwork shader');
  const identity = { source: sky.source, artworkSource: sky.artworkSource, shaderAndGeometry: sky.shaderAndGeometry,
    artworkSignature: sky.artworkSignature,
    placement: sky.placement, depthPlacement: sky.depthPlacement, sourceSkyDistance: sky.sourceSkyDistance,
    angularScale: sky.angularScale, centreElevationDegrees: sky.centreElevationDegrees,
    companionToBlackHoleDiameter: sky.companionToBlackHoleDiameter,
    coronaPeriodSeconds: sky.animation?.coronaPeriodSeconds, streamTransitSeconds: sky.animation?.streamTransitSeconds,
    streamDirection: sky.animation?.streamDirection };
  return identity;
}

async function editMetadata(id, name, description, action = 'save') {
  await page.locator(`.catalog-edit[data-edit-room="${id}"]`).click();
  await page.locator('#room-metadata-dialog').waitFor({ state: 'visible' });
  await page.locator('#metadata-room-name').fill(name);
  await page.locator('#metadata-room-description').fill(description);
  await page.locator(`#metadata-${action}`).click();
  await page.locator('#room-metadata-dialog').waitFor({ state: 'hidden' });
}

async function galleryChecks() {
  phase = 'catalog gallery';
  console.log('Checking gallery search and editable metadata…');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/apartments.html`, { waitUntil: 'networkidle' });
  assert.equal(await visibleCards().count(), 100, 'The gallery must list all 100 new rooms');
  if (requirePreviews) {
    const previews = page.locator('#room-catalog-grid .catalog-card img');
    assert.equal(await previews.count(), 100, 'Every new residence must display an actual renderer preview');
    const decoded = await previews.evaluateAll(async images => {
      images.forEach(image => { image.loading = 'eager'; });
      await Promise.all(images.map(image => image.decode()));
      return images.map(image => ({ id: image.closest('[data-room-id]').dataset.roomId, source: image.currentSrc,
        width: image.naturalWidth, height: image.naturalHeight, label: image.parentElement.querySelector('.catalog-visual-label').textContent }));
    });
    for (const image of decoded) {
      assert(image.source.includes(image.id), `${image.id} must display its own preview`);
      assert.equal(image.width, 640, `${image.id} must decode its full renderer thumbnail`);
      assert.equal(image.height, 400);
      assert.equal(image.label, '3D room preview');
    }
    results.push({ check: 'all100 real scene previews decode and belong to their rooms', status: 'passed', previews: decoded });
  }
  assert(await page.locator('a[href="/liminette.html"]').first().isVisible(), 'Liminette must remain available as an original residence');
  const hrefs = await page.locator('#room-catalog-grid .catalog-room-link').evaluateAll(links => links.map(link => link.getAttribute('href')));
  assert.equal(new Set(hrefs).size, 100, 'Every new card must link to a distinct room route');
  for (let number = 1; number <= 100; number++) assert(hrefs.includes(`/room.html?id=${roomId(number)}`), `Missing gallery route for ${roomId(number)}`);
  await page.locator('#room-search').fill('Frutiger Aero');
  assert.equal(await visibleCards().count(), 1, 'Style search must select the corresponding room');
  await page.locator('#room-search').fill('not-a-room-92718');
  assert.equal(await visibleCards().count(), 0, 'An unmatched search must show no unrelated rooms');
  await page.locator('#room-search').fill('');
  await page.locator('#room-motif-filter').selectOption('botanical');
  const filteredCount = await visibleCards().count();
  assert(filteredCount > 0 && filteredCount < 100, 'The motif filter must narrow the collection');
  await page.locator('#room-motif-filter').selectOption('all');
  await page.locator('.catalog-edit[data-edit-room="room-001"]').click();
  const original = { name: await page.locator('#metadata-room-name').inputValue(), description: await page.locator('#metadata-room-description').inputValue() };
  await page.locator('#metadata-cancel').click();
  const otherCardText = await card('room-002').innerText();
  await editMetadata('room-001', 'Cancelled title', 'Cancelled description', 'cancel');
  assert(!(await card('room-001').innerText()).includes('Cancelled title'), 'Cancelling must preserve room metadata');
  const name = 'Archive <img src=x onerror="window.__catalogEscaped=1">';
  const description = 'Mae & Sol — <script>window.__catalogEscaped=1</script> — a future character residence.';
  await editMetadata('room-001', name, description);
  assert((await card('room-001').innerText()).includes(name), 'Edited room titles must appear as literal text');
  assert((await card('room-001').innerText()).includes(description), 'Edited descriptions must appear as literal text');
  assert.equal(await page.evaluate(() => window.__catalogEscaped), undefined, 'Metadata must never execute as HTML');
  assert.equal(await card('room-001').locator('script, img[src="x"]').count(), 0, 'Metadata must not insert HTML elements');
  assert.equal(await card('room-002').innerText(), otherCardText, 'Editing one room must preserve another room');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#metadata-export').click()]);
  const exportPath = path.join(output, 'edited-room-metadata.json');
  await download.saveAs(exportPath);
  const exported = JSON.parse(await readFile(exportPath, 'utf8'));
  assert.equal(exported.format, 'vinculum-room-metadata');
  assert.equal(exported.rooms.length, 103, 'The metadata export must include the complete residence collection');
  assert.equal(exported.rooms.find(room => room.id === 'room-001').name, name);
  await editMetadata('room-001', original.name, original.description);
  await page.locator('#metadata-file').setInputFiles(exportPath);
  await page.waitForFunction(expected => document.querySelector('[data-room-id="room-001"]').textContent.includes(expected), name);
  assert((await card('room-001').innerText()).includes(name), 'Import must restore exported metadata');
  const invalidImport = { format: 'vinculum-room-metadata', version: 1, rooms: [
    { id: 'room-002', name: 'Must not be applied', description: '' },
    { id: 'room-does-not-exist', name: 'Unknown room', description: '' },
  ] };
  await page.locator('#metadata-file').setInputFiles({ name: 'invalid-room-metadata.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalidImport)) });
  await page.locator('#catalog-status').filter({ hasText: 'unknown or repeated room ID' }).waitFor();
  assert.equal(await card('room-002').innerText(), otherCardText, 'A rejected import must not partially apply earlier records');
  await page.reload({ waitUntil: 'networkidle' });
  assert((await card('room-001').innerText()).includes(name), 'Edited titles must persist after reload');
  await page.locator('#room-search').fill('Mae & Sol');
  assert.equal(await visibleCards().count(), 1, 'Search must include custom room descriptions');
  await page.locator('#room-search').fill('');
  await page.goto(roomUrl('room-001'), { waitUntil: 'domcontentloaded' });
  await waitRoom();
  assert.equal(await page.locator('.room-title h1').innerText(), name, 'The room page must use the same saved display name');
  assert.equal(await page.evaluate(() => window.__catalogEscaped), undefined, 'Room headers must escape edited names');
  await page.goto(`${base}/apartments.html`, { waitUntil: 'networkidle' });
  await page.locator('.catalog-edit[data-edit-room="room-001"]').click();
  await page.locator('#metadata-reset').click();
  assert.equal(await page.locator('#metadata-room-name').inputValue(), original.name, 'Restore generic text must reset the editor');
  assert.equal(await page.locator('#metadata-room-description').inputValue(), original.description);
  await page.locator('#metadata-save').click();
  await page.locator('#room-metadata-dialog').waitFor({ state: 'hidden' });
  await page.screenshot({ path: `${output}/gallery-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'The gallery must fit a phone without horizontal overflow');
  await page.screenshot({ path: `${output}/gallery-mobile.png` });
  await page.evaluate(key => localStorage.setItem(key, '{broken-json'), metadataKey);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await visibleCards().count(), 100, 'Corrupt local metadata must not break the catalog');
  await page.evaluate(key => localStorage.removeItem(key), metadataKey);
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(roomUrl('room-does-not-exist'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).error === 'unknown-room');
  assert.equal((await state()).ready, false, 'An unknown room must not report a ready scene');
  assert.equal(await page.locator('#apartment-viewport canvas').count(), 0, 'Unknown rooms must not allocate an unrelated scene');
  assert(await page.locator('#room-loading a[href="/apartments.html"]').isVisible(), 'Unknown room URLs must offer a usable way back');
  await page.locator('#room-loading a').click();
  await page.locator('#room-catalog-grid .catalog-card').first().waitFor();
  assert.equal(await visibleCards().count(), 100);
  await page.setViewportSize(viewport);
  results.push({ check: 'gallery, search, scoped metadata, persistence, export/import, escaping and mobile layout', status: 'passed' });
}

async function roomChecks() {
  phase = 'Liminette shared exterior reference';
  await page.setViewportSize(viewport);
  await page.goto(`${base}/liminette.html`, { waitUntil: 'domcontentloaded' });
  await waitRoom();
  const reference = await state();
  assert(typeof reference.exteriorSignature === 'string' && reference.exteriorSignature.length > 0, 'Liminette must expose its actual exterior geometry signature');
  const sharedSky = celestialIdentity(reference);
  // Liminette's enlarged room translates its courtyard to the new window wall.
  // The numbered apartments retain their common, original exterior coordinates.
  let numberedExterior;
  let previousId = 'liminette-student-room';
  let consecutiveFailures = 0;
  const exercisedLayouts = new Set();
  for (let number = start; number <= end; number++) {
    const id = roomId(number);
    phase = id;
    const began = performance.now();
    try {
      await markBeforeNavigation();
      await page.goto(roomUrl(id), { waitUntil: 'domcontentloaded' });
      const disposal = await disposalAfterNavigation(previousId);
      await waitRoom();
      const snapshot = await state();
      assert.equal(snapshot.roomId, id);
      assert(typeof snapshot.style === 'string' && snapshot.style.length > 0, `${id} must have an explicit style`);
      assert(Number.isInteger(snapshot.layout), `${id} must identify its layout`);
      assert(typeof snapshot.roomSignature === 'string' && snapshot.roomSignature.length > 0, `${id} must hash its actual interior`);
      assert(snapshot.geometryAudit && Object.keys(snapshot.geometryAudit).length > 0, `${id} must report actual scene geometry`);
      assert(snapshot.render.triangles > 1000 && snapshot.render.calls > 10, `${id} must render furnished 3D geometry`);
      assert(snapshot.collisionCount > 10, `${id} must retain interior collision geometry`);
      const neighborLinks = await page.locator('.room-neighbors a').evaluateAll(links => links.map(link => link.getAttribute('href')));
      assert.deepEqual(neighborLinks, [number === 1 ? '/room.html?id=lux-umbrarum-pool-commons' : `/room.html?id=${roomId(number - 1)}`,
        number === 100 ? '/liminette.html' : `/room.html?id=${roomId(number + 1)}`], `${id} must link to its adjacent residences`);
      assert(typeof snapshot.exteriorSignature === 'string' && snapshot.exteriorSignature.length > 0, `${id} must expose its outside geometry`);
      numberedExterior ??= snapshot.exteriorSignature;
      assert.equal(snapshot.exteriorSignature, numberedExterior, `${id} must share the numbered apartments' outside geometry`);
      assert.deepEqual(celestialIdentity(snapshot), sharedSky, `${id} must use the same island celestial source and configuration`);
      const image = await canvasSnapshot();
      assert.equal(image.width, 640); assert.equal(image.height, 400);
      assert(image.colors > 40 && image.brightnessRange > 25, `${id} must display a varied, illuminated room rather than a clear canvas`);
      const bytes = Buffer.from(image.jpeg.split(',')[1], 'base64');
      assert(bytes.length > 8000, `${id} must produce a nonempty scene thumbnail`);
      const preview = path.join(previewDirectory, `${id}.jpg`);
      // Stage outside public/ while Vite is open, avoiding a full-page HMR
      // reload in the next room each time a new preview file is created.
      const capture = path.join(output, 'renders', `${id}.jpg`);
      await writeFile(capture, bytes);
      const { jpeg, ...pixelAudit } = image;
      const loadMs = +(performance.now() - began).toFixed(1);
      const representative = !exercisedLayouts.has(snapshot.layout);
      const presets = await presetChecks(snapshot, representative);
      const controls = representative ? await layoutControls(snapshot) : undefined;
      exercisedLayouts.add(snapshot.layout);
      results.push({ check: id, status: 'passed', loadMs, totalMs: +(performance.now() - began).toFixed(1), snapshot, pixelAudit, presets, controls,
        preview, capture, previewSha256: createHash('sha256').update(bytes).digest('hex'), previousRoomDisposal: disposal });
      previousId = id;
      consecutiveFailures = 0;
      if (number % 5 === 0 || number === end) console.log(`Rendered ${number - start + 1}/${end - start + 1}: ${id} · ${snapshot.style}`);
    } catch (error) {
      failures.push({ id, message: error.stack });
      console.error(`${id}: ${error.message}`);
      await page.screenshot({ path: `${output}/${id}-failure.png` }).catch(() => {});
      previousId = id;
      if (++consecutiveFailures >= 3) throw new Error('Three consecutive room routes failed; fix the shared startup problem before continuing.');
    }
  }
  await markBeforeNavigation();
  await page.goto(`${base}/apartments.html`, { waitUntil: 'domcontentloaded' });
  await disposalAfterNavigation(previousId);
  const rooms = results.filter(result => /^room-\d{3}$/.test(result.check) && result.status === 'passed');
  assert.equal(rooms.length, end - start + 1, 'Every requested room must load and produce a real scene thumbnail');
  assert.equal(new Set(rooms.map(room => room.snapshot.style)).size, rooms.length, 'Each room must have its own named style');
  assert.equal(new Set(rooms.map(room => room.snapshot.roomSignature)).size, rooms.length, 'Every room must have a distinct actual interior geometry/material signature');
  assert.equal(new Set(rooms.map(room => room.previewSha256)).size, rooms.length, 'Every room must produce a distinct visual capture');
  if (rooms.length === 100) {
    assert.equal(new Set(rooms.map(room => room.snapshot.layout)).size, 12, 'The 100-room collection must provide all twelve floorplans');
    assert.equal(rooms.filter(room => room.controls).length, 12, 'Each floorplan must have actual drag, WASD and window collision checks');
    assert.equal(rooms.reduce((count, room) => count + room.presets.length, 0), 700, 'All 700 room presets must be exercised');
  }
  await page.goto('about:blank');
  if (publishPreviews) for (const room of rooms) await writeFile(room.preview, await readFile(room.capture));
  await contactSheets(rooms);
  await layoutSheets(rooms.filter(room => room.controls));
}

async function layoutSheets(rooms) {
  await page.setViewportSize({ width: 1280, height: 1100 });
  for (const room of rooms) {
    const tiles = await Promise.all(room.presets.map(async preset => `<article><img src="data:image/jpeg;base64,${(await readFile(preset.capture)).toString('base64')}"><p>${escapeHtml(preset.view)}</p></article>`));
    const html = `<!doctype html><html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:22px;background:#14231e;color:#f1ead9;font:16px system-ui}h1{font:24px Georgia}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}article{margin:0;background:#24372c}img{width:100%;display:block}p{margin:0;padding:8px}</style><h1>${escapeHtml(room.check)} — ${escapeHtml(room.snapshot.style)} — layout ${room.snapshot.layout}</h1><div class="grid">${tiles.join('')}</div></html>`;
    const name = `layout-${String(room.snapshot.layout).padStart(2, '0')}/viewpoint-sheet`;
    await writeFile(`${output}/${name}.html`, html);
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
}

async function contactSheets(rooms) {
  await page.goto('about:blank');
  await page.setViewportSize({ width: 1280, height: 1020 });
  for (let offset = 0; offset < rooms.length; offset += 25) {
    const subset = rooms.slice(offset, offset + 25);
    const tiles = await Promise.all(subset.map(async room => {
      const image = (await readFile(room.capture)).toString('base64');
      return `<article><img src="data:image/jpeg;base64,${image}" width="240" height="150"><p><strong>${escapeHtml(room.check)}</strong> ${escapeHtml(room.snapshot.style)}</p></article>`;
    }));
    const html = `<!doctype html><html><meta charset="utf-8"><title>Apartment render audit</title><style>*{box-sizing:border-box}body{margin:0;padding:22px;background:#14231e;color:#f1ead9;font:12px system-ui}h1{font:24px Georgia;margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{margin:0;min-width:0;background:#24372c;border:1px solid #8c7e4a}img{width:100%;height:auto;display:block}p{margin:0;padding:8px;font-size:10px;line-height:1.4}strong{color:#d5bd80}</style><h1>Lux Umbrarum Student Spaces — actual scene renders ${offset + 1}–${offset + subset.length}</h1><div class="grid">${tiles.join('')}</div></html>`;
    const name = `contact-sheet-${String(offset / 25 + 1).padStart(2, '0')}`;
    await writeFile(`${output}/${name}.html`, html);
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
}

try {
  if (scope === 'all' || scope === 'gallery') await galleryChecks();
  if (scope === 'all' || scope === 'rooms') await roomChecks();
  assert.equal(errors.length, 0, `Unexpected browser errors: ${JSON.stringify(errors)}`);
  assert.equal(failures.length, 0, `Room failures: ${JSON.stringify(failures)}`);
  console.log(`Apartment catalog smoke passed (${scope}, rooms ${start}–${end}); ${results.length} results.`);
} catch (error) {
  failures.push({ phase, message: error.stack });
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/results-${scope}-${start}-${end}.json`, JSON.stringify({ base, scope, start, end, publishPreviews, requirePreviews, results, failures, errors }, null, 2));
  await browser.close();
}
