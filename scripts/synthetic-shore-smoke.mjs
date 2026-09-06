import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'output/synthetic-shore';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120_000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const state = () => page.evaluate(() => window.labIsland.getSyntheticShoreSnapshot());
const step = (milliseconds) => page.evaluate((ms) => window.labIsland.advanceTime(ms), milliseconds);
const waitForShore = () => page.waitForFunction(() => {
  const state = window.labIsland.getSyntheticShoreSnapshot();
  return state.active && !state.loading && state.scene;
});
try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.setTimeOfDay('noon'));
  await page.click('#locate-synthetic-shore');
  await page.waitForTimeout(1400);
  await step(800);
  await page.screenshot({ path: `${output}/01-anchor-pier.png` });
  const before = await page.evaluate(() => ({
    position: window.labIsland.camera.position.toArray(),
    target: window.labIsland.controls.target.toArray(),
    geometries: window.labIsland.renderer.info.memory.geometries,
  }));
  const click = await page.evaluate(() => {
    const world = window.labIsland;
    const point = world.camera.position.clone().set(0, 1.62, -568).project(world.camera);
    const rect = world.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 };
  });
  await page.mouse.click(click.x, click.y);
  await waitForShore();
  await step(800);
  const ocean = await state();
  assert(ocean.entrySource === 'explore-click', 'Explore mesh click must open the shore.');
  const { animationStart, animationEnd } = await page.evaluate(() => {
    const world = window.labIsland;
    const animationStart = world.syntheticShore.getSnapshot();
    world.advanceTime(1700);
    return { animationStart, animationEnd: world.getSyntheticShoreSnapshot() };
  });
  assert(animationStart.cygnusX1.blackHole.inViewport && animationStart.cygnusX1.companion.inViewport, 'Both Cygnus bodies must be visible from the ocean viewpoint.');
  assert(Math.abs(animationStart.cygnusX1.animation.coronaPhase - animationEnd.scene.cygnusX1.animation.coronaPhase) > 0.01, 'Cygnus corona must animate over time.');
  await page.screenshot({ path: `${output}/02-ocean-cygnus.png` });
  await page.keyboard.down('w');
  await step(800);
  await page.keyboard.up('w');
  const moved = await state();
  assert(JSON.stringify(moved.scene.position) !== JSON.stringify(ocean.scene.position), 'W must move on the beach.');
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await step(650);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.mouse.move(720, 480);
  await page.mouse.down();
  await page.mouse.move(830, 500, { steps: 5 });
  await page.mouse.up();
  await step(150);
  assert(JSON.stringify((await state()).scene.direction) !== JSON.stringify(ocean.scene.direction), 'Drag must change shore look.');
  await page.click('[data-shore-view="island"]');
  await step(300);
  await page.screenshot({ path: `${output}/03-island-behind.png` });
  await page.click('[data-shore-view="pier"]');
  await step(300);
  await page.screenshot({ path: `${output}/04-pier-stairs.png` });
  const stats = await page.evaluate(() => ({
    calls: window.labIsland.renderer.info.render.calls,
    triangles: window.labIsland.renderer.info.render.triangles,
    snapshot: JSON.parse(window.render_game_to_text()),
  }));
  assert(stats.calls < 220, `Shore draw budget exceeded: ${stats.calls}`);
  assert(stats.snapshot.performance.islandUpdatePaused === true, 'Island updates should pause while visiting shore.');
  await page.setViewportSize({ width: 640, height: 800 });
  await step(150);
  await page.screenshot({ path: `${output}/05-compact-shore.png` });
  const aspect = await page.evaluate(() => window.labIsland.syntheticShore.camera.aspect);
  assert(Math.abs(aspect - 0.8) < 0.01, 'Shore camera must resize with viewport.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.click('[data-shore-exit]');
  await step(200);
  assert(!(await state()).active, 'Return button must dispose the shore.');
  const after = await page.evaluate(() => ({
    position: window.labIsland.camera.position.toArray(),
    target: window.labIsland.controls.target.toArray(),
    orbitEnabled: window.labIsland.controls.enabled,
    overlayCount: document.querySelectorAll('.synthetic-shore-ui').length,
  }));
  assert(after.position.every((v, i) => Math.abs(v - before.position[i]) < 0.01), 'Explore camera must be preserved.');
  assert(after.orbitEnabled && after.overlayCount === 0, 'Island controls/UI must restore.');
  await page.evaluate(() => {
    const world = window.labIsland;
    void world.enterSyntheticShore();
    world.exitSyntheticShore();
  });
  await step(150);
  assert(!(await state()).active, 'Cancelling an in-flight scene load must not reopen the shore.');
  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('walk');
    world.walkController.enter(world.camera.position.clone().set(0, 1.61, -545.8), world.camera.position.clone().set(0, 0, -1));
    world.walkController.setMoveIntent(0, 1, true);
  });
  await step(4500);
  await waitForShore();
  assert((await state()).entrySource === 'walk-approach', 'Walking to the pier must open the shore.');
  await page.keyboard.press('Escape');
  await step(250);
  assert(!(await state()).active, 'Escape must return without retriggering while standing at entry.');
  const walkRestored = await page.evaluate(() => window.labIsland.walkController.getSnapshot());
  assert(walkRestored.active && Math.abs(walkRestored.positionWorld[0]) < 2.2, 'Walk must resume at pier.');
  // Repeated visits must release shore GPU resources and event handlers.
  const memory = [];
  for (let visit = 0; visit < 3; visit++) {
    await page.evaluate(() => window.labIsland.enterSyntheticShore());
    await waitForShore();
    await step(100);
    await page.click('[data-shore-exit]');
    await step(100);
    memory.push(await page.evaluate(() => ({ ...window.labIsland.renderer.info.memory })));
  }
  assert(memory[2].geometries <= memory[0].geometries + 2 && memory[2].textures <= memory[0].textures, `Shore resources leaked across visits: ${JSON.stringify(memory)}`);
  assert(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
  await writeFile(`${output}/results.json`, JSON.stringify({ ocean, moved, animationStart, stats, before, after, walkRestored, memory, errors }, null, 2));
  console.log(JSON.stringify({ status: 'passed', drawCalls: stats.calls, triangles: stats.triangles, memory, errors }));
} finally {
  await browser.close();
}
