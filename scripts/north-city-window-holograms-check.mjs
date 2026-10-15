import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-artifacts/north-city/revision-47/native';
await mkdir(output, { recursive: true });
const report = { checks: [], errors: [], captures: [] };
function check(condition, name, evidence) {
  report.checks.push({ passed: !!condition, name, evidence }); assert.ok(condition, name);
}
const browser = await chromium.launch({ headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
try {
  await page.route(/\/src\/apartments\/room\.ts(?:\?.*)?$/, async route => {
    const response = await route.fetch(), source = await response.text();
    await route.fulfill({ response, body: source.replace('await room.ready;', 'await room.ready; window.__qaRoom = room; window.__qaThree = THREE;') });
  });
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 300000 });
  console.log('Actual room ready');
  const state = () => page.evaluate(() => window.__qaRoom.scene.getObjectByName('North City · Japanese window holograms').userData.holograms);
  check((await state()).figures.every(f => f.status === 'ready'), 'All three character textures loaded', await state());
  const positions = await page.evaluate(() => {
    const group = window.__qaRoom.scene.getObjectByName('North City · Japanese window holograms');
    group.updateWorldMatrix(true, true);
    const THREE = window.__qaThree, architecture = [];
    window.__qaRoom.scene.traverse(o => {
      if (!o.isMesh || o.name !== 'Batched city architecture') return;
      for (let ancestor = o; ancestor; ancestor = ancestor.parent) if (!ancestor.visible) return;
      architecture.push(o);
    });
    const exterior = group.parent;
    return group.children.filter(o => o.name.startsWith('Window hologram ·')).map((o, index) => {
      const figure = group.userData.holograms.figures[index];
      const origin = exterior.localToWorld(new THREE.Vector3(figure.position[0], figure.roofY + .25, figure.position[2]));
      const hit = new THREE.Raycaster(origin, new THREE.Vector3(0, -1, 0), 0, 2).intersectObjects(architecture, false)[0];
      const roofGap = hit ? origin.y - .25 - hit.point.y : null;
      return { name: o.name, world: o.matrixWorld.elements.slice(12, 15), buildingId: figure.buildingId, height: figure.height, roofGap };
    });
  });
  check(positions.length === 3 && positions.every(p => p.world[2] < -20 && p.height <= 5.1 && p.roofGap !== null && Math.abs(p.roofGap) < .002)
    && positions[0].world[0] < -9.8 && positions.slice(1).every(p => p.world[0] > -1.25),
    'Smaller performers sit on actual roofs left and right of the street; projector bases contact the architecture', positions);
  const pixels = await page.evaluate(() => {
    const group = window.__qaRoom.scene.getObjectByName('North City · Japanese window holograms');
    return group.children.filter(o => o.name.startsWith('Window hologram ·')).map(o => {
      const image = o.children[0].material.uniforms.uImage.value.image;
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const c = canvas.getContext('2d'); c.drawImage(image, 0, 0);
      const data = c.getImageData(0, 0, image.width, image.height).data;
      let transparent = 0; for (let i = 3; i < data.length; i += 4) if (data[i] < 8) transparent++;
      return { name: o.name, transparentFraction: transparent / (data.length / 4) };
    });
  });
  check(pixels.every(p => p.transparentFraction > .15), 'Original images have transparent backgrounds', pixels);
  const before = (await state()).time; await page.evaluate(() => window.advanceTime(3500));
  check((await state()).time > before + 3, 'Cloth, light sweep and particles advance');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(() => window.advanceTime(3500));
  check((await state()).time === 0 && (await state()).reducedMotion, 'Reduced motion freezes all new projection animations');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const view of ['on-bed', 'panorama']) {
    if (await page.locator('body').evaluate(el => el.classList.contains('city-controls-collapsed'))) await page.locator('#city-controls-toggle').click();
    await page.locator('#room-menu-toggle').click(); await page.locator(`[data-viewpoint="${view}"]`).click();
    for (const time of ['day', 'night']) {
      if (await page.locator('body').evaluate(el => el.classList.contains('city-controls-collapsed'))) await page.locator('#city-controls-toggle').click();
      await page.locator('#city-time-select').selectOption(time);
      await page.locator('#city-controls-toggle').click(); await page.waitForTimeout(1000);
      const name = `${view}-${time}.png`; await page.screenshot({ path: `${output}/${name}` }); report.captures.push(name);
    }
  }
  check(report.errors.length === 0, 'No browser or WebGL errors', report.errors);
} catch (error) {
  report.failure = error.stack; await page.screenshot({ path: `${output}/failure.png`, timeout: 10000 }).catch(() => {});
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2)); await browser.close();
}
console.log(JSON.stringify(report, null, 2)); assert.equal(report.failure, undefined);
