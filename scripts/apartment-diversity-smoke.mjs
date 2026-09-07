import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Focused follow-up audit: all residences and workstations, four useful views
// and movement for each furnishing family, then refresh real gallery previews.
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:5178').replace(/\/$/, '');
const output = process.env.DIV_OUTPUT ?? 'test-artifacts/apartment-diversity';
const previewDirectory = process.env.DIV_PREVIEWS ?? 'public/apartments/previews';
const publishPreviews = process.env.DIV_PUBLISH_PREVIEWS !== '0';
const start = Number(process.env.DIV_START ?? 1);
const end = Number(process.env.DIV_END ?? 100);
const selected = process.env.DIV_ROOMS?.split(',').map(Number);
const numbers = selected ?? Array.from({ length: end - start + 1 }, (_, i) => start + i);
assert(numbers.length && numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 100), 'Use room numbers within 1–100');
assert.equal(new Set(numbers).size, numbers.length, 'Room numbers must be unique');
const viewport = { width: 640, height: 400 };
const detailViewport = { width: 1280, height: 800 };
const results = [];
const failures = [];
const errors = [];
const disposalKey = '__vinculum_diversity_disposal__';
let phase = 'startup';
await mkdir(path.join(output, 'renders'), { recursive: true });
await mkdir(path.join(output, 'families'), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--disable-features=BackForwardCache'],
});
const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  const counters = { textures: 0, buffers: 0, programs: 0 };
  window.__diversityDisposals = counters;
  for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Type) continue;
    for (const [method, key] of [['deleteTexture', 'textures'], ['deleteBuffer', 'buffers'], ['deleteProgram', 'programs']]) {
      const original = Type.prototype[method];
      Type.prototype[method] = function (...args) {
        if (args[0]) counters[key]++;
        return Reflect.apply(original, this, args);
      };
    }
  }
});
const page = await context.newPage();
page.setDefaultTimeout(25_000);
page.on('pageerror', error => errors.push({ phase, type: 'pageerror', message: error.message, stack: error.stack }));
page.on('console', message => {
  if (message.type() === 'error' || /too many active webgl contexts|context.*lost/i.test(message.text())) {
    errors.push({ phase, type: message.type(), message: message.text() });
  }
});
page.on('requestfailed', request => {
  if (/\/apartments\/(materials|previews)\//.test(request.url())) errors.push({ phase, type: 'asset request', url: request.url(), message: request.failure()?.errorText });
});
page.on('response', response => {
  if (/\/apartments\/(materials|previews)\//.test(response.url()) && response.status() >= 400) errors.push({ phase, type: 'asset HTTP', url: response.url(), status: response.status() });
});

const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const roomId = number => `room-${String(number).padStart(3, '0')}`;
const href = id => id === 'liminette-student-room' ? '/liminette.html' : `/room.html?id=${id}`;
const displacement = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const checkpoint = () => writeFile(path.join(output, 'results.json'), JSON.stringify({ base, numbers, publishPreviews, results, failures, errors }, null, 2));

async function waitRoom() {
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready === true, null, { timeout: 120_000 });
  await page.locator('#room-loading').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#apartment-viewport canvas').count(), 1, 'A residence must own exactly one canvas');
  await page.evaluate(() => window.advanceTime(100));
}

async function capture(file) {
  const image = await page.evaluate(() => {
    const canvas = document.querySelector('#apartment-viewport canvas');
    const tiny = document.createElement('canvas');
    tiny.width = 64; tiny.height = 40;
    const drawing = tiny.getContext('2d');
    drawing.drawImage(canvas, 0, 0, 64, 40);
    const pixels = drawing.getImageData(0, 0, 64, 40).data;
    const colors = new Set();
    let min = 255, max = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      colors.add(`${pixels[i] >> 3},${pixels[i + 1] >> 3},${pixels[i + 2] >> 3}`);
      const light = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      min = Math.min(min, light); max = Math.max(max, light);
    }
    return { width: canvas.width, height: canvas.height, colors: colors.size, brightnessRange: max - min, jpeg: canvas.toDataURL('image/jpeg', .88) };
  });
  assert(image.colors > 35 && image.brightnessRange > 25, `${phase} must display illuminated, varied geometry`);
  const bytes = Buffer.from(image.jpeg.split(',')[1], 'base64');
  assert(bytes.length > 8000, `${phase} must produce a nonempty scene capture`);
  await writeFile(file, bytes);
  const { jpeg, ...pixels } = image;
  return { capture: file, ...pixels, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function celestialIdentity(snapshot) {
  const sky = snapshot.celestial;
  assert.equal(sky?.source, 'src/world/islandCygnus.ts');
  assert.equal(sky.artworkSource, 'src/world/syntheticShore/celestial.ts');
  assert.equal(sky.shaderAndGeometry, 'identical-to-lab-island');
  assert(sky.artworkSignature?.geometry && sky.artworkSignature?.fragmentShader, 'The sky must fingerprint actual artwork and geometry');
  return { source: sky.source, artworkSource: sky.artworkSource, artworkSignature: sky.artworkSignature,
    placement: sky.placement, depthPlacement: sky.depthPlacement, sourceSkyDistance: sky.sourceSkyDistance,
    angularScale: sky.angularScale, centreElevationDegrees: sky.centreElevationDegrees,
    companionToBlackHoleDiameter: sky.companionToBlackHoleDiameter,
    coronaPeriodSeconds: sky.animation?.coronaPeriodSeconds, streamTransitSeconds: sky.animation?.streamTransitSeconds,
    streamDirection: sky.animation?.streamDirection };
}

function roomIdentity(snapshot, id) {
  assert.equal(snapshot.roomId, id);
  assert.equal(snapshot.workstation?.technology, 'advanced', `${id} must provide an advanced computer regardless of interior style`);
  assert(Number.isInteger(snapshot.workstation.displays) && snapshot.workstation.displays >= 3, `${id} must include at least three actual advanced displays`);
  assert(typeof snapshot.design?.furniture === 'string' && snapshot.design.furniture, `${id} must identify its actual furnishing family`);
  if (id !== 'liminette-student-room') {
    for (const field of ['wallTreatment', 'floorTreatment', 'rugPattern', 'ceilingTreatment', 'curtainTreatment', 'libraryTreatment']) {
      assert(typeof snapshot.design[field] === 'string' && snapshot.design[field], `${id} must identify its ${field}`);
    }
    assert(Array.isArray(snapshot.design.features) && snapshot.design.features.length, `${id} must identify the spatial features used by its design`);
  }
  assert(snapshot.roomSignature && snapshot.geometryAudit?.interior?.vertices > 1000, `${id} must fingerprint its actual furnished geometry`);
  assert(snapshot.render.triangles > 1000 && snapshot.render.calls > 10, `${id} must render actual 3D furnishings`);
  assert(snapshot.collisionCount > 10, `${id} must retain indoor collisions`);
  insideRoom(snapshot, id);
}

function insideRoom(snapshot, label) {
  assert(snapshot.position.length === 3 && snapshot.position.every(Number.isFinite), `${label} camera must remain finite`);
  const [x, , z] = snapshot.position;
  assert(x >= snapshot.bounds.minX && x <= snapshot.bounds.maxX && z >= snapshot.bounds.minZ && z <= snapshot.bounds.maxZ, `${label} camera must stay inside the residence`);
}

async function chooseView(id) {
  await page.locator('#room-menu-toggle').click();
  await page.locator(`#room-viewpoints [data-viewpoint="${id}"]`).click();
  await page.evaluate(() => window.advanceTime(50));
  const current = await state();
  assert.equal(current.view, id);
  assert.equal(current.menuOpen, false, 'Selecting a view must close the menu');
  insideRoom(current, `${phase} ${id}`);
  return current;
}

async function resetRoom() {
  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-reset').click();
  await page.evaluate(() => window.advanceTime(50));
}

async function walk(key, time = 200) {
  await page.keyboard.down(key);
  try { await page.evaluate(milliseconds => window.advanceTime(milliseconds), time); }
  finally { await page.keyboard.up(key); }
  return state();
}

async function representativeViews(initial) {
  await page.setViewportSize(detailViewport);
  await page.evaluate(() => window.advanceTime(50));
  const slug = `${initial.design.furniture}-${initial.roomId}`;
  const views = [];
  for (const view of ['entrance', 'study', 'lounge', 'sleep']) {
    const current = view === 'entrance' ? await state() : await chooseView(view);
    const image = await capture(path.join(output, 'families', `${slug}-${view}.jpg`));
    const movement = [];
    let before = current;
    for (const key of ['w', 'd', 's', 'a']) {
      const after = await walk(key);
      insideRoom(after, `${initial.roomId} ${view} walking ${key}`);
      movement.push({ key, distance: displacement(before.position, after.position), position: after.position });
      before = after;
    }
    assert(movement.some(step => step.distance > .15), `${initial.roomId} ${view} must let the visitor walk away; possible furnishing collision trap`);
    views.push({ view, position: current.position, look: current.look, image, movement });
  }
  await resetRoom();
  const beforeDrag = await state();
  await page.mouse.move(600, 440);
  await page.mouse.down();
  await page.mouse.move(710, 465, { steps: 6 });
  await page.mouse.up();
  const afterDrag = await state();
  assert(Math.abs(afterDrag.look.yaw - beforeDrag.look.yaw) > .1, `${initial.roomId} must support drag-look`);
  await chooseView('outlook');
  const stop = await walk('w', 30_000);
  const held = await walk('w', 4000);
  insideRoom(stop, `${initial.roomId} window boundary`);
  assert(stop.position[2] >= stop.bounds.minZ + .23, 'Visitors must stop before crossing the window wall');
  assert.equal(stop.position[2], held.position[2], 'Continued walking must respect the window wall');
  await resetRoom();
  assert.deepEqual((await state()).position, initial.position, 'Reset must restore the entrance after exploring');
  await page.setViewportSize(viewport);
  await page.evaluate(() => window.advanceTime(50));
  return { views, drag: { before: beforeDrag.look, after: afterDrag.look }, windowStop: stop.position };
}

async function markBeforeNavigation() {
  await page.evaluate(key => {
    const before = { ...window.__diversityDisposals };
    window.addEventListener('pagehide', event => {
      const current = window.__diversityDisposals;
      sessionStorage.setItem(key, JSON.stringify({ url: location.href, persisted: event.persisted,
        textures: current.textures - before.textures, buffers: current.buffers - before.buffers, programs: current.programs - before.programs }));
    }, { once: true });
  }, disposalKey);
}

async function disposalAfterNavigation(id) {
  const audit = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key) ?? 'null'), disposalKey);
  assert(audit?.url.includes(href(id)), `${id} must report its pagehide cleanup`);
  assert.equal(audit.persisted, false);
  assert(audit.textures > 0 && audit.buffers > 0 && audit.programs > 0, `${id} must release GPU resources when leaving the room`);
  return audit;
}

async function sheet(name, title, tiles, columns) {
  const entries = await Promise.all(tiles.map(async tile => `<article><img src="data:image/jpeg;base64,${(await readFile(tile.capture)).toString('base64')}"><p>${escapeHtml(tile.label)}</p></article>`));
  const html = `<!doctype html><html><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#172620;color:#f2eddd;font:13px system-ui}h1{font:25px Georgia;margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(${columns},1fr);gap:12px}article{min-width:0;background:#27372e;border:1px solid #716548}img{width:100%;display:block}p{margin:0;padding:8px;line-height:1.4}</style><h1>${escapeHtml(title)}</h1><div class="grid">${entries.join('')}</div></html>`;
  await writeFile(path.join(output, `${name}.html`), html);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
}

try {
  phase = 'Liminette workstation and preserved exterior';
  await page.goto(`${base}/liminette.html`, { waitUntil: 'domcontentloaded' });
  await waitRoom();
  const reference = await state();
  roomIdentity(reference, 'liminette-student-room');
  const referenceSky = celestialIdentity(reference);
  const originalPreview = await capture(path.join(output, 'renders', 'liminette-student-room.jpg'));
  const originalViews = await representativeViews(reference);
  results.push({ check: reference.roomId, status: 'passed', snapshot: reference, image: originalPreview, representative: originalViews });
  const exercisedFamilies = new Set();
  let previousId = reference.roomId;
  let consecutiveFailures = 0;
  for (const number of numbers) {
    const id = roomId(number);
    phase = id;
    const began = performance.now();
    try {
      await markBeforeNavigation();
      await page.goto(`${base}${href(id)}`, { waitUntil: 'domcontentloaded' });
      const disposal = await disposalAfterNavigation(previousId);
      await waitRoom();
      const snapshot = await state();
      roomIdentity(snapshot, id);
      assert.equal(snapshot.exteriorSignature, reference.exteriorSignature, `${id} must preserve the common Academic District exterior`);
      assert.deepEqual(celestialIdentity(snapshot), referenceSky, `${id} must preserve the exact shared island sky`);
      const image = await capture(path.join(output, 'renders', `${id}.jpg`));
      assert.equal(image.width, 640); assert.equal(image.height, 400);
      const representative = exercisedFamilies.has(snapshot.design.furniture) ? undefined : await representativeViews(snapshot);
      exercisedFamilies.add(snapshot.design.furniture);
      results.push({ check: id, status: 'passed', snapshot, image, representative, previousRoomDisposal: disposal, totalMs: +(performance.now() - began).toFixed(1) });
      previousId = id;
      consecutiveFailures = 0;
      if (results.length % 5 === 0 || number === numbers.at(-1)) {
        console.log(`Diversity audit ${results.length - 1}/${numbers.length}: ${id} · ${snapshot.design.furniture} · ${snapshot.style}`);
        await checkpoint();
      }
    } catch (error) {
      failures.push({ id, message: error.stack });
      console.error(`${id}: ${error.message}`);
      await page.screenshot({ path: path.join(output, `${id}-failure.png`) }).catch(() => {});
      await checkpoint();
      previousId = id;
      if (++consecutiveFailures >= 3) throw new Error('Three consecutive residence failures; resolve the shared integration issue before continuing.');
    }
  }
  await markBeforeNavigation();
  await page.goto(`${base}/apartments.html`, { waitUntil: 'networkidle' });
  await disposalAfterNavigation(previousId);
  const rooms = results.filter(result => /^room-\d{3}$/.test(result.check));
  assert.equal(rooms.length, numbers.length, 'Every requested residence must load successfully');
  assert.equal(new Set(rooms.map(room => room.snapshot.roomSignature)).size, rooms.length, 'Residences must differ in actual constructed geometry');
  assert.equal(new Set(rooms.map(room => room.image.sha256)).size, rooms.length, 'Residences must produce distinct visual captures');
  if (numbers.length === 100) {
    assert.equal(exercisedFamilies.size, 12, 'The collection must contain twelve distinct furniture families');
    for (const field of ['wallTreatment', 'floorTreatment', 'rugPattern', 'ceilingTreatment', 'curtainTreatment', 'libraryTreatment']) {
      assert(new Set(rooms.map(room => room.snapshot.design[field])).size >= 3, `The collection must offer meaningful variation in ${field}`);
    }
  }
  assert.equal(errors.length, 0, `Unexpected browser errors: ${JSON.stringify(errors)}`);
  assert.equal(failures.length, 0, 'Every requested residence must pass before publishing updated previews');
  // No page in this context may still run the app when public/ assets change.
  // Otherwise Vite reloads live scenes while their renders are being captured.
  await page.goto('about:blank');
  if (publishPreviews) {
    await mkdir(previewDirectory, { recursive: true });
    for (const room of rooms) await writeFile(path.join(previewDirectory, `${room.check}.jpg`), await readFile(room.image.capture));
    await writeFile('public/apartments/liminette-preview.jpg', await readFile(originalPreview.capture));
  }
  phase = 'refreshed directory previews';
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/apartments.html`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#room-catalog-grid .catalog-card').count(), 100, 'The directory must preserve all 100 style rooms');
  const previews = page.locator('#room-catalog-grid .catalog-card img');
  assert.equal(await previews.count(), 100, 'Every residence must display a real room preview');
  const decoded = await previews.evaluateAll(async images => {
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode()));
    return images.map(image => ({ id: image.closest('[data-room-id]').dataset.roomId, source: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight }));
  });
  for (const image of decoded) {
    assert(image.source.includes(image.id), `${image.id} must display its own preview`);
    assert.equal(image.width, 640); assert.equal(image.height, 400);
  }
  await page.screenshot({ path: path.join(output, 'directory-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Directory must fit mobile screens');
  await page.screenshot({ path: path.join(output, 'directory-mobile.png') });
  results.push({ check: 'directory previews and mobile layout', status: 'passed', previews: decoded });
  await page.goto('about:blank');
  for (let offset = 0; offset < rooms.length; offset += 25) {
    await sheet(`contact-sheet-${String(offset / 25 + 1).padStart(2, '0')}`, `Vinculum Apartments — redesigned residences ${offset + 1}–${Math.min(offset + 25, rooms.length)}`,
      rooms.slice(offset, offset + 25).map(room => ({ capture: room.image.capture, label: `${room.check} · ${room.snapshot.design.furniture} · ${room.snapshot.style}` })), 5);
  }
  for (const room of results.filter(result => result.representative)) {
    await sheet(`families/${room.snapshot.design.furniture}-${room.check}`, `${room.check} — ${room.snapshot.style} — ${room.snapshot.design.furniture}`,
      room.representative.views.map(view => ({ capture: view.image.capture, label: view.view })), 2);
  }
  assert.equal(errors.length, 0, `Unexpected browser errors: ${JSON.stringify(errors)}`);
  console.log(`Apartment diversity audit passed: ${rooms.length} style rooms + Liminette, ${exercisedFamilies.size} furniture families, ${results.filter(r => r.representative).length * 4} detailed views.`);
} catch (error) {
  failures.push({ phase, message: error.stack });
  console.error(error);
  process.exitCode = 1;
} finally {
  await checkpoint();
  await browser.close();
}
