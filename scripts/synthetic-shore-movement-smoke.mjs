import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.SYNTHETIC_SHORE_OUTPUT ?? 'output/synthetic-shore-controls';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120_000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const results = { status: 'running', simulatedSeconds: 0, errors };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const step = async milliseconds => {
  results.simulatedSeconds += Math.max(1, Math.round(milliseconds / (1000 / 60))) / 60;
  await page.evaluate(ms => window.labIsland.advanceTime(ms), milliseconds);
};
const snapshot = () => page.evaluate(() => {
  const shore = window.labIsland.syntheticShore;
  return { position: shore.camera.position.toArray(), direction: shore.camera.getWorldDirection(shore.navigationDirection).toArray(),
    movement: shore.getMovementState(), surface: shore.getSnapshot().surface };
});
const enter = async () => {
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => window.labIsland.getSyntheticShoreSnapshot().active && !window.labIsland.getSyntheticShoreSnapshot().loading);
  await page.evaluate(() => window.labIsland.renderer.setAnimationLoop(null));
};
// Fixture placement selects an unobstructed route or a particular stair segment.
// Movement, jumping, locking, and UI edits below use the actual event handlers.
const fixture = (options = {}) => page.evaluate(options => {
  const shore = window.labIsland.syntheticShore;
  const x = options.x ?? 0, z = options.z ?? 18;
  const ground = options.groundY ?? shore.groundHeight(x, z);
  const eye = shore.getMovementState().eyeHeightMetres;
  shore.keys.clear();
  shore.groundY = ground;
  shore.grounded = true;
  shore.velocityY = 0;
  shore.jumpHeld = false;
  shore.jumpPeakHeight = 0;
  shore.moving = false;
  shore.surface = options.surface ?? 'silver sand';
  shore.camera.position.set(x, ground + eye, z);
  shore.camera.lookAt(x + (options.dx ?? 0), ground + eye + (options.dy ?? 0), z + (options.dz ?? -100));
  shore.euler.setFromQuaternion(shore.camera.quaternion, 'YXZ');
  shore.canvas.focus({ preventScroll: true });
}, options);
const travel = async (keys, milliseconds) => {
  const before = await snapshot();
  for (const key of keys) await page.keyboard.down(key);
  await step(milliseconds);
  const after = await snapshot();
  for (const key of [...keys].reverse()) await page.keyboard.up(key);
  const distance = Math.hypot(after.position[0] - before.position[0], after.position[2] - before.position[2]);
  return { before, after, distance };
};

try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.renderer.setAnimationLoop(null));
  await enter();
  await page.locator('[data-shore-speed]').fill('6.5');
  await page.locator('[data-shore-speed]').press('Tab');
  await fixture();

  const beforeLock = await page.evaluate(() => ({
    island: window.labIsland.camera.quaternion.toArray(),
    shore: window.labIsland.syntheticShore.camera.quaternion.toArray(),
  }));
  await page.click('[data-shore-look]');
  await page.waitForFunction(() => window.labIsland.syntheticShore.getMovementState().pointerLocked, null, { timeout: 8000 });
  await page.mouse.move(865, 330, { steps: 5 });
  const afterLook = await page.evaluate(() => ({
    island: window.labIsland.camera.quaternion.toArray(),
    shore: window.labIsland.syntheticShore.camera.quaternion.toArray(),
    movement: window.labIsland.syntheticShore.getMovementState(),
    islandMovement: window.labIsland.walkController.getSnapshot(),
  }));
  assert(afterLook.shore.some((value, i) => Math.abs(value - beforeLock.shore[i]) > 0.005), 'Native mouse lock must rotate the shore camera.');
  assert(afterLook.island.every((value, i) => Math.abs(value - beforeLock.island[i]) < 1e-9), 'Shore mouse look must preserve the saved island quaternion.');
  assert(!afterLook.islandMovement.active && !afterLook.islandMovement.pointerLocked, 'Inactive island WALK must not claim shore pointer lock.');
  await page.keyboard.press('Escape');
  let nativeEscapeReleased = true;
  try {
    await page.waitForFunction(() => !document.pointerLockElement, null, { timeout: 1500 });
  } catch {
    // Some headless Chrome builds swallow synthetic Escape at browser level.
    // Report this explicitly instead of claiming that native Escape succeeded.
    nativeEscapeReleased = false;
    await page.evaluate(() => document.exitPointerLock());
    await page.waitForFunction(() => !document.pointerLockElement);
  }
  assert(await page.evaluate(() => window.labIsland.isSyntheticShoreActive()), 'The first Escape/release must keep the visitor on the shore.');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.labIsland.isSyntheticShoreActive());
  const afterReturn = await page.evaluate(() => window.labIsland.camera.quaternion.toArray());
  assert(afterReturn.every((value, i) => Math.abs(value - beforeLock.island[i]) < 1e-9), 'Returning from locked shore view must preserve island orientation.');
  results.pointerLock = { nativeLockAcquired: true, nativeEscapeReleased, releaseFallbackUsed: !nativeEscapeReleased, beforeLock, afterLook, afterReturn };

  await enter();
  await page.locator('[data-shore-speed]').fill('6.5');
  await page.locator('[data-shore-speed]').press('Tab');
  await fixture();
  const straight = await travel(['w'], 600);
  await fixture();
  const diagonal = await travel(['w', 'd'], 600);
  await fixture();
  const shifted = await travel(['Shift', 'w'], 600);
  const expectedNormal = 6.5 / 3.6 * 0.6;
  for (const [name, run] of Object.entries({ straight, diagonal, shifted })) {
    assert(Math.abs(run.distance - expectedNormal) < 0.02, `${name} must obey the 6.5 km/h speed field, including diagonal normalization and no Shift boost: ${run.distance}`);
    assert(Math.abs(run.after.movement.speedKilometresPerHour - 6.5) < 0.01, `${name} speed snapshot must agree with configured speed.`);
  }
  const directional = {};
  for (const key of ['w', 'a', 's', 'd']) {
    await fixture();
    directional[key] = await travel([key], 150);
  }
  assert(directional.w.after.position[2] < 18 && directional.s.after.position[2] > 18 && directional.a.after.position[0] < 0 && directional.d.after.position[0] > 0, 'All WASD directions must agree with the camera.');
  await fixture();
  await page.click('[data-shore-turbo]');
  await fixture();
  const turbo = await travel(['w'], 400);
  assert(turbo.after.movement.turboEnabled && Math.abs(turbo.distance - 4.8) < 0.02 && Math.abs(turbo.after.movement.speedKilometresPerHour - 43.2) < 0.01, 'Turbo must traverse at 12 m/s.');
  await page.click('[data-shore-turbo]');
  results.walking = { straight, diagonal, shifted, directional, turbo };

  await fixture();
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await step(800);
  const tap = await snapshot();
  assert(tap.movement.grounded && Math.abs(tap.movement.jumpHeightMetres - 0.55) < 0.08, `Tap jump must rise about 0.55 m and land: ${JSON.stringify(tap.movement)}`);

  await fixture();
  await page.keyboard.down('Space');
  await step(300);
  await page.keyboard.down('Space'); // Real repeated keydown while Space is held.
  await step(1000);
  const held = await snapshot();
  assert(held.movement.grounded && Math.abs(held.movement.jumpHeightMetres - 1.6) < 0.09, `Held jump must rise about 1.6 m and land: ${JSON.stringify(held.movement)}`);
  await page.keyboard.down('Space');
  await step(200);
  const repeat = await snapshot();
  assert(repeat.movement.grounded && Math.abs(repeat.position[1] - held.position[1]) < 1e-9, 'Holding/repeating Space after landing must not auto-jump.');
  await page.keyboard.up('Space');

  await fixture();
  await page.keyboard.down('Space');
  await step(100);
  await page.keyboard.up('Space');
  await step(67);
  const velocityBeforeSecondPress = await page.evaluate(() => window.labIsland.syntheticShore.velocityY);
  await page.keyboard.down('Space');
  const velocityAfterSecondPress = await page.evaluate(() => window.labIsland.syntheticShore.velocityY);
  assert(Math.abs(velocityAfterSecondPress - velocityBeforeSecondPress) < 1e-9, 'A fresh Space press in midair must not reset upward velocity.');
  await page.keyboard.up('Space');
  await step(1000);
  const doubleJump = await snapshot();
  assert(doubleJump.movement.grounded, 'Rejected double jump must still return to the ground.');

  await fixture();
  const beforeMovingJump = await snapshot();
  await page.keyboard.down('w');
  await page.keyboard.down('Space');
  await step(1250);
  await page.keyboard.up('Space');
  await page.keyboard.up('w');
  const movingJump = await snapshot();
  assert(movingJump.position[2] < beforeMovingJump.position[2] - 2 && movingJump.movement.grounded, 'Forward movement must continue through jumping and landing.');
  assert(Math.abs(movingJump.position[1] - movingJump.movement.groundY - 1.62) < 0.001, 'Moving jump must land at the new terrain height.');
  results.jumping = { tap, held, repeat, doubleJump, velocityBeforeSecondPress, velocityAfterSecondPress, movingJump };

  const stairBottom = await page.evaluate(() => window.labIsland.syntheticShore.groundHeight(30.5, 28));
  const stairGround = stairBottom + (44 - 28) / 30 * (8 - stairBottom);
  await fixture({ x: 30.5, z: 44, groundY: stairGround, dz: 100, surface: 'pier stairs' });
  const ascent = await travel(['w'], 700);
  assert(ascent.after.position[2] > 45 && ascent.after.movement.groundY > stairGround && ascent.after.surface === 'pier stairs', 'Normal-speed walking must climb the stairs.');
  await fixture({ x: 28.25, z: 44, groundY: stairGround, dz: 100, surface: 'pier stairs' });
  await page.keyboard.down('Space');
  const jumpIntoRail = await travel(['d'], 1100);
  await page.keyboard.up('Space');
  await step(100);
  const stairRail = await snapshot();
  assert(stairRail.position[0] >= 28.11 && stairRail.position[1] > 6 && stairRail.movement.grounded, 'Jumping against the stair side must keep the visitor inside the railing and on the stair layer.');
  results.stairs = { ascent, jumpIntoRail, stairRail };

  await fixture();
  const beforeFocusedInput = await snapshot();
  await page.locator('[data-shore-speed]').focus();
  await page.keyboard.down('w');
  await page.keyboard.down('Space');
  await step(300);
  await page.keyboard.up('Space');
  await page.keyboard.up('w');
  const afterFocusedInput = await snapshot();
  assert(afterFocusedInput.position.every((value, i) => Math.abs(value - beforeFocusedInput.position[i]) < 1e-9) && afterFocusedInput.movement.grounded, 'Typing in speed input must not move or jump the visitor.');
  results.focusedInput = { beforeFocusedInput, afterFocusedInput };

  await fixture();
  await page.evaluate(() => {
    const canvas = window.labIsland.syntheticShore.canvas;
    window.shorePointerLockFixture = {
      canvas,
      ownDescriptor: Object.getOwnPropertyDescriptor(canvas, 'requestPointerLock'),
      original: canvas.requestPointerLock,
    };
    canvas.requestPointerLock = () => Promise.reject(new DOMException('Pointer lock deliberately unavailable in regression fixture.', 'NotAllowedError'));
  });
  try {
    await page.click('[data-shore-look]');
    await page.waitForFunction(() => {
      const movement = window.labIsland.syntheticShore.getMovementState();
      return !movement.pointerLocked && movement.lookMode === 'drag';
    });
    const fallbackBefore = await page.evaluate(() => window.labIsland.syntheticShore.camera.quaternion.toArray());
    await page.mouse.move(600, 400);
    const fallbackSeeded = await page.evaluate(() => window.labIsland.syntheticShore.camera.quaternion.toArray());
    assert(fallbackSeeded.every((value, i) => Math.abs(value - fallbackBefore[i]) < 1e-9), 'First fallback pointer movement must seed coordinates without rotating the camera.');
    await page.mouse.move(700, 430);
    const fallbackMoved = await page.evaluate(() => window.labIsland.syntheticShore.camera.quaternion.toArray());
    assert(fallbackMoved.some((value, i) => Math.abs(value - fallbackSeeded[i]) > 0.005), 'Subsequent fallback pointer movement must rotate the shore camera.');
    await page.keyboard.press('Escape');
    assert(await page.evaluate(() => window.labIsland.isSyntheticShoreActive()), 'Escape must release fallback mouse look while remaining on the shore.');
    const fallbackReleased = await snapshot();
    assert(fallbackReleased.movement.lookMode === 'idle' && !fallbackReleased.movement.pointerLocked, 'Escape must fully clear the fallback look mode.');
    results.pointerLockFallback = { requestRejected: true, fallbackBefore, fallbackSeeded, fallbackMoved, fallbackReleased };
  } finally {
    await page.evaluate(() => {
      const saved = window.shorePointerLockFixture;
      if (!saved) return;
      if (saved.ownDescriptor) Object.defineProperty(saved.canvas, 'requestPointerLock', saved.ownDescriptor);
      else delete saved.canvas.requestPointerLock;
      if (saved.canvas.requestPointerLock !== saved.original) throw new Error('Pointer lock fixture did not restore the original API.');
      delete window.shorePointerLockFixture;
    });
  }

  const clubY = await page.evaluate(() => window.labIsland.syntheticShore.venues.groundHeight(-48,46));
  assert(Number.isFinite(clubY), 'Club deck fixture must resolve its authored floor.');
  await fixture({ x: -48, z: 46, groundY: clubY, surface: 'beach pavilion' });
  await step(0);
  await page.screenshot({ path: `${output}/01-club-inside-ocean.png` });
  await fixture({ x: -48, z: 12, dz: 34, dy: clubY + 6.5 });
  await step(0);
  await page.screenshot({ path: `${output}/02-club-roof-sign.png` });
  results.club = { clubY, interior: [-48, clubY + 1.62, 46] };
  assert(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
  results.status = 'passed';
  console.log(JSON.stringify({ status: results.status, simulatedSeconds: results.simulatedSeconds,
    nativeEscapeReleased, pointerLockFallbackPassed: !!results.pointerLockFallback, walkDistance: straight.distance, turboDistance: turbo.distance,
    tapHeight: tap.movement.jumpHeightMetres, heldHeight: held.movement.jumpHeightMetres, errors }));
} catch (error) {
  results.status = 'failed';
  results.failure = String(error.stack ?? error);
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await writeFile(`${output}/movement-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
