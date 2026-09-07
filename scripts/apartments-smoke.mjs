import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:5178').replace(/\/$/, '');
const output = process.env.APARTMENTS_OUTPUT ?? 'test-artifacts/apartments';
const scope = process.env.APARTMENTS_SCOPE ?? 'all';
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
const errors = [];
const results = [];
const textureRequests = new Map();
const roomImageRequests = new Set();
let phase = 'startup';
const recordErrors = target => {
  target.on('pageerror', error => errors.push({ url: target.url(), phase, type: 'pageerror', message: error.message, stack: error.stack }));
  target.on('console', message => {
    if (message.type() === 'error') errors.push({ url: target.url(), type: 'console', message: message.text() });
  });
  target.on('request', request => {
    if (request.resourceType() === 'image' && target.url().includes('/liminette.html')) roomImageRequests.add(request.url());
  });
  target.on('requestfailed', request => {
    if (request.url().includes('/apartments/materials/')) errors.push({ type: 'texture request failed', url: request.url(), phase, message: request.failure()?.errorText });
  });
  target.on('response', response => {
    if (!response.url().includes('/apartments/materials/')) return;
    textureRequests.set(new URL(response.url()).pathname, response.status());
    if (response.status() >= 400) errors.push({ type: 'texture HTTP failure', url: response.url(), phase, status: response.status() });
  });
};
recordErrors(page);
const roomState = target => target.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (target, ms) => target.evaluate(time => window.advanceTime(time), ms);
const screenshot = (target, name, options = {}) => target.screenshot({ path: `${output}/${name}.png`, ...options });
const hasPath = (target, path) => assert.equal(new URL(target.url()).pathname, path);

async function menuIs(target, prefix, open) {
  assert.equal(await target.locator(`#${prefix}-menu-toggle`).getAttribute('aria-expanded'), String(open));
  assert.equal(await target.locator(`#${prefix}-menu`).isVisible(), open);
}

async function insideViewport(target, selector) {
  const rect = await target.locator(selector).boundingBox();
  const size = target.viewportSize();
  assert(rect && rect.width > 0 && rect.height > 0, `${selector} must be rendered`);
  assert(rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= size.width + 1
    && rect.y + rect.height <= size.height + 1, `${selector} must fit ${size.width} × ${size.height}: ${JSON.stringify(rect)}`);
}

async function waitRoom(target) {
  await target.waitForFunction(() => typeof window.render_game_to_text === 'function'
    && JSON.parse(window.render_game_to_text()).ready === true, null, { timeout: 90_000 });
  await target.locator('#room-loading').waitFor({ state: 'hidden' });
  assert.equal(await target.locator('#apartment-viewport canvas').count(), 1);
  await advance(target, 100);
}

async function renderedRoom(target) {
  const rendering = await target.evaluate(() => {
    const canvas = document.querySelector('#apartment-viewport canvas');
    const sample = document.createElement('canvas');
    sample.width = 64;
    sample.height = 48;
    const drawing = sample.getContext('2d');
    drawing.drawImage(canvas, 0, 0, sample.width, sample.height);
    const pixels = drawing.getImageData(0, 0, sample.width, sample.height).data;
    const colors = new Set();
    let minimum = 255;
    let maximum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      colors.add(`${pixels[i] >> 3},${pixels[i + 1] >> 3},${pixels[i + 2] >> 3}`);
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      minimum = Math.min(minimum, brightness);
      maximum = Math.max(maximum, brightness);
    }
    return { colorCount: colors.size, brightnessRange: maximum - minimum, width: canvas.width, height: canvas.height };
  });
  assert(rendering.colorCount > 40 && rendering.brightnessRange > 25,
    `Room canvas must contain a lit scene: ${JSON.stringify(rendering)}`);
  return rendering;
}

async function sampleRoomPixels(target) {
  return target.evaluate(() => {
    const sample = document.createElement('canvas');
    sample.width = 96;
    sample.height = 64;
    const drawing = sample.getContext('2d');
    drawing.drawImage(document.querySelector('#apartment-viewport canvas'), 0, 0, sample.width, sample.height);
    return Array.from(drawing.getImageData(0, 0, sample.width, sample.height).data);
  });
}

async function measureFrameTiming(target) {
  return target.evaluate(async () => {
    const samples = [];
    let previous;
    for (let i = 0; i < 46; i++) {
      const now = await new Promise(resolve => requestAnimationFrame(resolve));
      if (previous !== undefined && i > 5) samples.push(now - previous);
      previous = now;
    }
    samples.sort((a, b) => a - b);
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return { sampleFrames: samples.length, approximateFps: +(1000 / mean).toFixed(1), meanFrameMs: +mean.toFixed(2),
      p50FrameMs: +samples[Math.floor(samples.length * .5)].toFixed(2), p95FrameMs: +samples[Math.floor(samples.length * .95)].toFixed(2) };
  });
}

async function outlookChecks() {
  phase = 'Lux Umbrarum outlook';
  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-viewpoints [data-viewpoint="outlook"]').click();
  const initial = await roomState(page);
  assert.match(initial.location, /Lux Umbrarum/);
  assert.equal(initial.outlook.location, 'Lux Umbrarum');
  assert.equal(initial.outlook.districtId, 'academic-libraries-theoretical-labs');
  const buildingIds = initial.outlook.buildings.map(building => building.id);
  for (const id of ['ashcroft-grand-library', 'blackwood-great-hall', 'halley-observatory']) {
    assert(buildingIds.includes(id), `The outlook must contain the island's ${id}`);
  }
  assert(buildingIds.length >= 7, 'The academic outlook must describe its surrounding campus buildings');
  await page.keyboard.down('a');
  await advance(page, 200);
  await page.keyboard.up('a');
  const left = await roomState(page);
  const leftPixels = await sampleRoomPixels(page);
  await screenshot(page, 'room-outlook-parallax-left');
  await page.keyboard.down('d');
  await advance(page, 400);
  await page.keyboard.up('d');
  const right = await roomState(page);
  const rightPixels = await sampleRoomPixels(page);
  await screenshot(page, 'room-outlook-parallax-right');
  const displacement = Math.hypot(right.position[0] - left.position[0], right.position[2] - left.position[2]);
  const imageDifference = leftPixels.reduce((sum, value, index) => sum + Math.abs(value - rightPixels[index]), 0) / leftPixels.length;
  assert(displacement > .4, 'Both sides of the window viewpoint must be accessible by strafing');
  assert.equal(left.look.yaw, right.look.yaw, 'The parallax comparison must preserve the viewing direction');
  assert.equal(left.look.fov, right.look.fov, 'The parallax comparison must preserve the field of view');
  assert(imageDifference > 2, `Window frames and the shared exterior must visibly shift while strafing: ${imageDifference}`);

  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-viewpoints [data-viewpoint="outlook"]').click();
  await page.keyboard.down('w');
  await advance(page, 30_000);
  await page.keyboard.up('w');
  const windowStop = await roomState(page);
  assert(windowStop.position[2] >= windowStop.bounds.minZ + .23,
    `The window boundary must stop the viewer inside the residence: ${JSON.stringify(windowStop.position)}`);
  await page.keyboard.down('w');
  await advance(page, 4_000);
  await page.keyboard.up('w');
  const alongWindow = await roomState(page);
  assert.equal(alongWindow.position[2], windowStop.position[2], 'Walking toward the outlook must stop at the window while allowing sideways sliding');
  assert(alongWindow.position[0] >= alongWindow.bounds.minX && alongWindow.position[0] <= alongWindow.bounds.maxX,
    'Sliding along the window must stay inside the room');
  await screenshot(page, 'room-outlook-window-boundary');
  const nonMaterialImages = [...roomImageRequests].filter(url => !new URL(url).pathname.startsWith('/apartments/materials/'));
  assert.deepEqual(nonMaterialImages, [], 'The apartment must render its outlook without fetching a 2D background image');
  results.push({ check: 'Lux Umbrarum exterior, strafing parallax, window boundary', status: 'passed',
    location: initial.location, buildingIds, left: left.position, right: right.position, displacement, imageDifference,
    windowStop: windowStop.position, imageRequests: [...roomImageRequests] });
}

async function islandChecks() {
  phase = 'island initial load';
  console.log('Checking consolidated island menu…');
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot), null, { timeout: 120_000 });
  await page.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 120_000 });
  await page.waitForTimeout(1500);
  await menuIs(page, 'island', false);
  await screenshot(page, 'island-desktop-closed');
  await page.locator('#island-menu-toggle').click();
  await menuIs(page, 'island', true);
  await insideViewport(page, '#island-menu');
  for (const selector of ['.topbar', '#atlas-panel', '#scene-card', '.layerbar', '#debug-stats',
    '#atmosphere-menu', '#full-island-status-card', '.top-actions', '#interaction-hint', '.compass']) {
    assert(await page.locator(selector).evaluate(element => Boolean(element.closest('#island-menu'))),
      `${selector} must be contained by the consolidated menu`);
  }
  assert.equal(await page.locator('.island-apartments-link').getAttribute('href'), '/apartments.html');
  assert.match(await page.locator('.island-apartments-link').innerText(), /Vinculum Apartments/);
  await screenshot(page, 'island-desktop-open');
  await page.keyboard.press('Escape');
  await menuIs(page, 'island', false);
  assert.equal(await page.locator('#island-menu-toggle').evaluate(element => element === document.activeElement), true);
  await page.locator('#island-menu-toggle').click();
  phase = 'island plan mode';
  await page.locator('[data-mode="plan"]').click();
  await menuIs(page, 'island', false);
  assert.equal((await page.locator('#island-menu-mode').innerText()).trim(), 'Plan');
  await page.locator('#island-menu-toggle').click();
  phase = 'island explore mode';
  await page.locator('[data-mode="explore"]').click();
  await menuIs(page, 'island', false);
  await page.locator('#island-menu-toggle').click();
  phase = 'island district selection';
  await page.locator('#district-list .district-item').first().click();
  await menuIs(page, 'island', false);
  await page.setViewportSize(mobile);
  await insideViewport(page, '#island-menu-toggle');
  await screenshot(page, 'island-mobile-closed');
  await page.locator('#island-menu-toggle').click();
  await insideViewport(page, '#island-menu');
  await screenshot(page, 'island-mobile-open');
  phase = 'island navigation to directory';
  await Promise.all([
    page.waitForURL('**/apartments.html'),
    page.locator('.island-apartments-link').click(),
  ]);
  hasPath(page, '/apartments.html');
  results.push({ check: 'island menu', status: 'passed', viewport: ['1440×900', '390×844'], navigation: 'island → apartments' });
  await page.setViewportSize(desktop);
}

async function directoryChecks() {
  phase = 'apartment directory';
  console.log('Checking apartment directory…');
  await page.goto(`${base}/apartments.html`, { waitUntil: 'networkidle' });
  const card = page.getByRole('link', { name: 'Liminette Student Room — enter the 3D apartment', exact: true });
  assert.equal(await card.count(), 1);
  assert.equal(await card.getAttribute('href'), '/liminette.html');
  const imageLoaded = await page.locator('.apartment-image img').evaluate(image => image.complete && image.naturalWidth > 0);
  assert(imageLoaded, 'The apartment card must display its room preview');
  await screenshot(page, 'directory-desktop', { fullPage: true });
  await page.setViewportSize(mobile);
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(horizontalOverflow, false, 'The directory must not scroll horizontally on a phone');
  await screenshot(page, 'directory-mobile', { fullPage: true });
  await page.setViewportSize(desktop);
  await Promise.all([page.waitForURL('**/liminette.html'), card.click()]);
  await waitRoom(page);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  hasPath(page, '/apartments.html');
  assert(await card.isVisible(), 'Browser Back must return to the apartment directory');
  await page.goForward({ waitUntil: 'domcontentloaded' });
  hasPath(page, '/liminette.html');
  await waitRoom(page);
  results.push({ check: 'directory and browser history', status: 'passed' });
}

async function roomChecks() {
  phase = 'room interactions';
  console.log('Checking room viewpoints and navigation…');
  await page.goto(`${base}/liminette.html`, { waitUntil: 'domcontentloaded' });
  await waitRoom(page);
  await menuIs(page, 'room', false);
  const initial = await roomState(page);
  assert(initial.collisionCount > 10, 'The furnished apartment must define colliders');
  assert(initial.render.calls > 10 && initial.render.triangles > 1000, 'The apartment must render 3D geometry');
  results.push({ check: 'initial render', state: initial, pixels: await renderedRoom(page), frameTiming: await measureFrameTiming(page) });
  await screenshot(page, 'room-entrance');
  await page.locator('#room-menu-toggle').click();
  await menuIs(page, 'room', true);
  await insideViewport(page, '#room-menu');
  await screenshot(page, 'room-guide');
  await page.keyboard.press('Escape');
  await menuIs(page, 'room', false);
  assert(await page.locator('#room-menu-toggle').evaluate(element => document.activeElement === element));
  const viewpoints = await page.locator('#room-viewpoints [data-viewpoint]').evaluateAll(buttons => buttons.map(button => button.dataset.viewpoint));
  assert(viewpoints.length >= 7 && viewpoints.includes('outlook'), 'The apartment guide must offer its living spaces and Lux Umbrarum outlook');
  let previous = initial;
  for (const id of viewpoints) {
    await page.locator('#room-menu-toggle').click();
    await page.locator(`#room-viewpoints [data-viewpoint="${id}"]`).click();
    await menuIs(page, 'room', false);
    await advance(page, 100);
    const current = await roomState(page);
    assert.equal(current.view, id);
    assert(Math.hypot(...current.position.map((value, index) => value - previous.position[index])) > 0.1,
      `${id} must move the camera to a distinct viewpoint`);
    results.push({ check: `viewpoint ${id}`, state: current, pixels: await renderedRoom(page) });
    await screenshot(page, `room-${id}`);
    previous = current;
  }
  await outlookChecks();

  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-reset').click();
  assert.deepEqual((await roomState(page)).position, initial.position);
  const beforeDrag = await roomState(page);
  await page.mouse.move(750, 440);
  await page.mouse.down();
  await page.mouse.move(930, 485, { steps: 10 });
  await page.mouse.up();
  const afterDrag = await roomState(page);
  assert(Math.abs(afterDrag.look.yaw - beforeDrag.look.yaw) > 0.1, 'Dragging must change horizontal look');
  assert(Math.abs(afterDrag.look.pitch - beforeDrag.look.pitch) > 0.03, 'Dragging must change vertical look');
  await page.mouse.wheel(0, -350);
  await page.waitForFunction(fov => JSON.parse(window.render_game_to_text()).look.fov < fov, beforeDrag.look.fov);
  assert((await roomState(page)).look.fov >= 38, 'Zoom must respect its minimum field of view');

  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-reset').click();
  const movementStart = await roomState(page);
  await page.keyboard.down('w');
  await advance(page, 400);
  await page.keyboard.up('w');
  const moved = await roomState(page);
  assert(Math.hypot(...moved.position.map((value, index) => value - movementStart.position[index])) > 0.15,
    'W must move the camera through the room');
  assert.equal(moved.view, 'walking');
  for (const key of ['w', 'd', 's', 'a']) {
    await page.keyboard.down(key);
    await advance(page, 30_000);
    await page.keyboard.up(key);
    const stopped = await roomState(page);
    const { minX, maxX, minZ, maxZ } = stopped.bounds;
    assert(stopped.position[0] >= minX && stopped.position[0] <= maxX
      && stopped.position[2] >= minZ && stopped.position[2] <= maxZ,
    `Long ${key} movement must remain inside the room: ${JSON.stringify(stopped.position)}`);
    const beforeBlocked = stopped.position;
    await page.keyboard.down(key);
    await advance(page, 4_000);
    await page.keyboard.up(key);
    assert.deepEqual((await roomState(page)).position, beforeBlocked, `A wall or furnishing must stop sustained ${key} movement`);
  }
  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-reset').click();
  const reset = await roomState(page);
  assert.deepEqual(reset.position, initial.position);
  assert.equal(reset.look.fov, initial.look.fov);
  assert.equal(reset.view, 'entrance');
  await page.locator('#room-menu-toggle').click();
  await page.locator('#room-fullscreen').click();
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  await page.keyboard.press('f');
  await page.waitForFunction(() => !document.fullscreenElement);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1024, height: 700 });
  // Browser emulation can acknowledge the size before its native resize event.
  // Wait for both CSS and drawing-buffer dimensions, rather than racing it.
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#apartment-viewport canvas');
    const rect = canvas?.getBoundingClientRect();
    return canvas instanceof HTMLCanvasElement && rect && innerWidth === 1024 && innerHeight === 700
      && Math.abs(rect.width - innerWidth) < 1 && Math.abs(rect.height - innerHeight) < 1
      && Math.abs(canvas.width / canvas.height - innerWidth / innerHeight) < .002;
  }, null, { timeout: 5000 });
  await insideViewport(page, '#apartment-viewport canvas');
  await insideViewport(page, '.room-header');
  results.push({ check: 'look, zoom, walk, collision, reset, fullscreen, resize', status: 'passed' });

  await Promise.all([page.waitForURL('**/apartments.html'), page.getByRole('link', { name: 'Back to Vinculum Apartments', exact: true }).click()]);
  hasPath(page, '/apartments.html');
  await page.goto('about:blank');
  const mobileContext = await browser.newContext({ viewport: mobile, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const phone = await mobileContext.newPage();
  recordErrors(phone);
  try {
    await phone.goto(`${base}/liminette.html`, { waitUntil: 'domcontentloaded' });
    await waitRoom(phone);
    await menuIs(phone, 'room', false);
    await insideViewport(phone, '.room-header');
    await insideViewport(phone, '.touch-walk');
    assert.equal(await phone.locator('.touch-walk [data-walk]').count(), 4);
    await screenshot(phone, 'room-mobile');
    await phone.locator('#room-menu-toggle').tap();
    await insideViewport(phone, '#room-menu');
    await screenshot(phone, 'room-mobile-guide');
    await phone.locator('#room-reset').tap();
    const touchStart = await roomState(phone);
    const forward = await phone.locator('[data-walk="forward"]').boundingBox();
    const touch = await mobileContext.newCDPSession(phone);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: forward.x + forward.width / 2, y: forward.y + forward.height / 2 }] });
    await advance(phone, 400);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.notDeepEqual((await roomState(phone)).position, touchStart.position, 'On-screen walk buttons must move the camera');
    const beforePinch = (await roomState(phone)).look.fov;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 145, y: 400 }, { x: 245, y: 400 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 125, y: 400 }, { x: 265, y: 400 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 105, y: 400 }, { x: 285, y: 400 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert((await roomState(phone)).look.fov < beforePinch, 'Spreading two fingers must zoom in');
    await touch.detach();
    await renderedRoom(phone);
    results.push({ check: 'mobile layout and on-screen walk controls', status: 'passed', viewport: mobile, frameTiming: await measureFrameTiming(phone) });
  } finally {
    await mobileContext.close();
  }
}

async function loadingFailureCheck() {
  phase = 'intentional missing texture';
  console.log('Checking missing-texture loading fallback…');
  const isolatedContext = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
  const failedPage = await isolatedContext.newPage();
  const expectedErrors = [];
  const unexpectedPageErrors = [];
  const blockedMap = '/apartments/materials/smoked_walnut_veneer_basecolor.jpg';
  let blockedRequests = 0;
  failedPage.on('console', message => { if (message.type() === 'error') expectedErrors.push(message.text()); });
  failedPage.on('pageerror', error => unexpectedPageErrors.push(error.stack));
  await failedPage.route(`**${blockedMap}`, async route => {
    blockedRequests += 1;
    await route.abort('failed');
  });
  try {
    await failedPage.goto(`${base}/liminette.html`, { waitUntil: 'networkidle' });
    const fallback = failedPage.locator('#room-loading');
    await fallback.getByText('The room could not finish loading.', { exact: false }).waitFor({ timeout: 30_000 });
    assert.equal(blockedRequests, 1, 'The failure fixture must block exactly the requested scanned map');
    assert(await fallback.isVisible(), 'A failed required map must leave the readable fallback visible');
    const claimsReady = await failedPage.evaluate(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready === true);
    assert.equal(claimsReady, false, 'A scene with a missing required texture must never claim to be ready');
    const back = fallback.getByRole('link', { name: 'Back to Vinculum Apartments', exact: true });
    assert.equal(await back.getAttribute('href'), '/apartments.html');
    await screenshot(failedPage, 'room-missing-texture-fallback');
    assert.deepEqual(unexpectedPageErrors, [], 'Missing texture handling must not throw an uncaught exception');
    assert(expectedErrors.some(message => message.includes('Unable to open Liminette')), 'The controlled failure must be reported for diagnosis');
    const unrelatedErrors = expectedErrors.filter(message => !message.includes('Unable to open Liminette') && !message.includes('ERR_FAILED'));
    assert.deepEqual(unrelatedErrors, [], 'The intentional asset failure must not hide unrelated console errors');
    await Promise.all([failedPage.waitForURL('**/apartments.html'), back.click()]);
    assert(await failedPage.locator('a.apartment-card').isVisible(), 'The fallback link must return to the usable directory');
    results.push({ check: 'required scanned-map failure', status: 'passed', blockedMap, expectedErrors });
  } finally {
    await isolatedContext.close();
  }
}

try {
  if (scope === 'all' || scope === 'island') await islandChecks();
  if (scope === 'all' || scope === 'directory') await directoryChecks();
  if (scope === 'all' || scope === 'room') await roomChecks();
  if (scope === 'all' || scope === 'room' || scope === 'failure') await loadingFailureCheck();
  if (scope === 'all' || scope === 'room' || scope === 'directory') {
    assert(textureRequests.size >= 18, 'Successful room loads must request all 18 locally stored PBR maps');
    results.push({ check: 'local scanned PBR requests', status: 'passed', responses: Object.fromEntries(textureRequests) });
  }
  assert.equal(errors.length, 0, `Browser errors: ${JSON.stringify(errors)}`);
  console.log(`Apartments smoke passed (${scope}); ${results.length} checks. Artifacts: ${output}`);
} catch (error) {
  results.push({ check: 'failure', message: error.stack });
  await screenshot(page, 'failure').catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/results-${scope}.json`, JSON.stringify({ base, scope, results, errors }, null, 2));
  await browser.close();
}
