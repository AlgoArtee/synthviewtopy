import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.SYNTHETIC_SHORE_SWIM_OUTPUT ?? 'output/synthetic-shore-swimming';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(120_000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const step = milliseconds => page.evaluate(ms => window.labIsland.advanceTime(ms), milliseconds);
const snapshot = () => page.evaluate(() => window.labIsland.syntheticShore.getSnapshot());
const fixture = (x, z, dx = 0, dz = -1) => page.evaluate(({ x, z, dx, dz }) => {
  const shore = window.labIsland.syntheticShore;
  shore.setView('ocean');
  shore.groundY = shore.groundHeight(x, z);
  shore.camera.position.set(x, shore.groundY + shore.getMovementState().eyeHeightMetres, z);
  shore.camera.lookAt(x + dx, shore.camera.position.y, z + dz);
  shore.canvas.focus({ preventScroll: true });
}, { x, z, dx, dz });
const travel = async (key, milliseconds) => {
  await page.keyboard.down(key); await step(milliseconds); await page.keyboard.up(key);
  return snapshot();
};
const results = { status: 'running', errors };
try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => Boolean(window.labIsland.syntheticShore));
  await page.evaluate(() => {
    const world = window.labIsland;
    world.renderer.setAnimationLoop(null);
    world.syntheticShore.setEnvironment({ waveHeight: 0, waterSpeed: 0, weather: 'clear', timeOfDay: 'day' });
    world.syntheticShore.setTurboEnabled(false);
    world.syntheticShore.setWalkSpeedKilometresPerHour(6.5);
  });

  const wings = [];
  for (const [x, z] of [[-112, 165], [195, 170]]) {
    await fixture(x, z, x < 0 ? 1 : -1, 0);
    await step(20);
    const before = await snapshot();
    const after = await travel('w', 900);
    assert(before.coast.distance < -1 && before.swimming.mode === 'walking', 'Both expanded beach wings must be dry walkable sand.');
    const distance = Math.hypot(after.position[0] - before.position[0], after.position[2] - before.position[2]);
    assert(distance > 1.4, 'The former rectangular bounds must not block either beach wing.');
    wings.push({ before, after, distance });
  }
  results.wings = wings;
  await fixture(-65, 168, 0, 1);
  await travel('w', 3500);
  const seawall = await snapshot();
  assert(seawall.position[2] <= 110 + Math.abs(seawall.position[0] - 42) / Math.sqrt(3), 'Solid island seawall must block landward walking.');
  results.seawall = seawall;

  await fixture(0, 18);
  await page.keyboard.press('Space'); await step(1200);
  const jump = await snapshot();
  assert(jump.movement.grounded && Math.abs(jump.movement.jumpHeightMetres - 0.55) < 0.08, 'Dry beach must preserve its normal tap jump.');
  results.jump = jump.movement;
  await page.evaluate(() => window.labIsland.syntheticShore.setTurboEnabled(true));
  const shoreline = [];
  await page.keyboard.down('w');
  for (let i = 0; i < 35; i++) {
    await step(1000);
    const state = await snapshot();
    shoreline.push({ position: state.position, swimming: state.swimming });
    if (state.swimming.swimming && state.swimming.waterDepthMetres >= 10) break;
  }
  await page.keyboard.up('w'); await step(800);
  const floating = await snapshot();
  assert(floating.position[2] < 0 && floating.swimming.mode === 'surface-swimming', 'Walking seaward must continue into surface swimming beyond the old shoreline bound.');
  assert(floating.swimming.waterDepthMetres >= 7, 'Test route must reach water deep enough for an intentional dive.');
  assert(floating.position[1] - floating.swimming.waterHeightMetres >= 0.39 && floating.position[1] - floating.swimming.waterHeightMetres < 0.9, 'Surface swimmer must float above water without sinking.');
  results.shoreline = shoreline;
  results.floating = floating;
  await page.screenshot({ path: `${output}/surface-swimming.png` });

  await page.evaluate(() => window.labIsland.syntheticShore.setEnvironment({ waveHeight: 3, waterSpeed: 1, weather: 'storm' }));
  const waveFloat = [];
  for (let i = 0; i < 16; i++) {
    await step(250);
    const state = await snapshot();
    assert(state.swimming.mode === 'surface-swimming' && !state.swimming.underwater,
      'Storm waves must not submerge a swimmer without a deliberate dive.');
    assert(state.position[1] - state.swimming.waterHeightMetres >= 0.389, 'Surface buoyancy must follow the same moving water height as the shader.');
    waveFloat.push({ eye: state.position[1], water: state.swimming.waterHeightMetres });
  }
  assert(Math.max(...waveFloat.map(value => value.water)) - Math.min(...waveFloat.map(value => value.water)) > 0.1,
    'Storm float check must exercise a moving, non-flat water surface.');
  results.waveFloat = waveFloat;
  await page.evaluate(() => window.labIsland.syntheticShore.setEnvironment({ waveHeight: 0, waterSpeed: 0, weather: 'clear' }));
  await step(1000);

  await travel('q', 1800);
  const diving = await snapshot();
  assert(diving.swimming.underwater && diving.swimming.depthMetres > 2, 'Q must dive underwater.');
  assert(diving.swimming.floorClearanceMetres >= 0.649, 'Diving must preserve seabed clearance.');
  assert(await page.locator('[data-shore-swim-status]').textContent().then(text => text.includes('Underwater')), 'HUD must show underwater depth and controls.');
  await step(1600);
  const neutralStart = await snapshot();
  await step(2200);
  const neutralEnd = await snapshot();
  assert(neutralEnd.swimming.underwater && Math.abs(neutralEnd.position[1] - neutralStart.position[1]) < 0.10, 'Releasing Dive must retain neutral buoyancy.');
  await page.screenshot({ path: `${output}/underwater-neutral.png` });
  const directional = await page.evaluate(() => {
    const shore = window.labIsland.syntheticShore;
    const before = shore.camera.position.toArray();
    shore.camera.lookAt(shore.camera.position.x, shore.camera.position.y - 0.3, shore.camera.position.z - 1);
    return before;
  });
  const steered = await travel('w', 700);
  assert(steered.position[2] < directional[2] - 2 && steered.position[1] < directional[1] - 0.1, 'Underwater forward swimming must follow the camera pitch.');
  results.diving = { diving, neutralStart, neutralEnd, steered };

  await travel('e', 2600); await step(600);
  const surfaced = await snapshot();
  assert(!surfaced.swimming.underwater && surfaced.swimming.mode === 'surface-swimming', 'E must ascend and restore surface buoyancy away from interactions.');
  await travel('Control', 1200);
  assert((await snapshot()).swimming.underwater, 'Ctrl must also dive.');
  await travel('Space', 2400); await step(500);
  assert(!(await snapshot()).swimming.underwater, 'Space must also ascend.');
  results.surfaced = surfaced;

  await page.evaluate(() => {
    const shore = window.labIsland.syntheticShore;
    shore.camera.lookAt(shore.camera.position.x, shore.camera.position.y, shore.camera.position.z + 1);
  });
  await page.keyboard.down('w');
  for (let i = 0; i < 45; i++) {
    await step(1000);
    const state = await snapshot();
    if (state.position[2] >= 12 && !state.swimming.swimming) break;
  }
  await page.keyboard.up('w'); await step(800);
  const reentry = await snapshot();
  assert(reentry.position[2] >= 12 && reentry.swimming.mode === 'walking' && reentry.movement.grounded, 'Swimming ashore must return continuously to grounded walking.');
  assert(Math.abs(reentry.position[1] - reentry.movement.groundY - reentry.movement.eyeHeightMetres) < 0.025, 'Shore reentry must restore standing eye height.');
  results.reentry = reentry;

  // Close the scene while Dive is still held, then recreate it before keyup.
  // This exercises disposal of a live submerged input/optics state rather than
  // the already-covered surface visit lifecycle.
  await fixture(floating.position[0], floating.position[2]);
  await page.evaluate(() => {
    const shore = window.labIsland.syntheticShore;
    shore.camera.position.y = shore.effects.waterHeight(shore.camera.position.x, shore.camera.position.z, shore.elapsed) + 0.6;
  });
  await step(300);
  await page.keyboard.down('q'); await step(1800);
  const underwaterExit = await page.evaluate(() => {
    const shore = window.labIsland.syntheticShore;
    window.retiredSwimmingShore = shore;
    return { state: shore.getSnapshot(), keys: [...shore.keys], fogDensity: shore.scene.fog.density };
  });
  assert(underwaterExit.state.swimming.underwater && underwaterExit.keys.includes('KeyQ'), 'Cleanup fixture must exit with native Dive input held underwater.');
  assert(underwaterExit.fogDensity > 0.01 && !underwaterExit.state.cygnusX1.visible, 'Submerged exit must exercise underwater fog and hidden Cygnus.');
  await page.click('[data-shore-exit]');
  await page.waitForFunction(() => !window.labIsland.isSyntheticShoreActive());
  assert(await page.locator('.synthetic-shore-ui').count() === 0, 'Returning underwater must remove the old shore UI.');
  const retired = await page.evaluate(() => {
    const shore = window.retiredSwimmingShore;
    return { disposed: shore.disposed, keys: [...shore.keys], elapsed: shore.elapsed, position: shore.camera.position.toArray() };
  });
  assert(retired.disposed && retired.keys.length === 0, 'Underwater scene disposal must clear held input.');
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => Boolean(window.labIsland.syntheticShore));
  await page.evaluate(() => window.labIsland.renderer.setAnimationLoop(null));
  await step(800);
  const fresh = await page.evaluate(() => {
    const shore = window.labIsland.syntheticShore;
    const retired = window.retiredSwimmingShore;
    return {
      differentInstance: shore !== retired,
      state: shore.getSnapshot(), keys: [...shore.keys], velocityY: shore.velocityY,
      swimVelocity: shore.swimVelocity.toArray(), fogDensity: shore.scene.fog.density,
      waterUnderwater: shore.effects.water.material.uniforms.uUnderwater.value,
      skyUnderwater: shore.effects.sky.material.uniforms.uUnderwater.value,
      retiredElapsed: retired.elapsed, retiredPosition: retired.camera.position.toArray(),
    };
  });
  await page.keyboard.up('q');
  assert(fresh.differentInstance && fresh.state.swimming.mode === 'walking' && fresh.state.movement.grounded,
    'Re-entering after an underwater exit must create a new grounded walking scene.');
  assert(fresh.keys.length === 0 && fresh.velocityY === 0 && fresh.swimVelocity.every(value => value === 0),
    'Recreated shore must not retain dive input or swimming velocity.');
  assert(fresh.fogDensity < 0.001 && fresh.waterUnderwater === 0 && fresh.skyUnderwater === 0 && fresh.state.cygnusX1.visible,
    'Re-entering must restore above-water lighting, water/sky optics, and Cygnus.');
  assert(fresh.retiredElapsed === retired.elapsed && fresh.retiredPosition.every((value, i) => value === retired.position[i]),
    'The retired submerged scene must stop responding to subsequent updates.');
  results.underwaterCleanup = { underwaterExit, retired, fresh };
  await page.screenshot({ path: `${output}/after-underwater-return.png` });
  assert(errors.length === 0, errors.join('\n'));
  results.status = 'passed';
  console.log(JSON.stringify({ status: results.status, wingDistances: wings.map(wing => wing.distance), floatingDepth: floating.swimming.waterDepthMetres, diveDepth: diving.swimming.depthMetres, neutralDrift: Math.abs(neutralEnd.position[1] - neutralStart.position[1]), reentry: reentry.swimming, underwaterCleanup: { newInstance: fresh.differentInstance, mode: fresh.state.swimming.mode, fogDensity: fresh.fogDensity, cygnusVisible: fresh.state.cygnusX1.visible, staleKeys: fresh.keys.length }, errors }, null, 2));
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
