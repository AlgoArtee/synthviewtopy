import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.SYNTHETIC_SHORE_OUTPUT ?? 'output/synthetic-shore-update';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(120_000);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const state = () => page.evaluate(() => window.labIsland.syntheticShore.getSnapshot());
const step = ms => page.evaluate(ms => window.labIsland.advanceTime(ms), ms);
const screenshot = name => page.screenshot({ path: `${output}/${name}.png` });
const move = async (key, ms) => {
  await page.keyboard.down('Shift'); await page.keyboard.down(key); await step(ms);
  await page.keyboard.up(key); await page.keyboard.up('Shift');
};
const position = (x, y, z) => page.evaluate(({x,y,z}) => {
  const s = window.labIsland.syntheticShore;
  s.groundY = y - 1.62; s.grounded = true;
  s.camera.position.set(x,y,z); s.camera.lookAt(x,y,z+100);
}, {x,y,z});
const range = (key, value) => page.locator(`[data-shore-setting="${key}"]`).evaluate((input, value) => {
  input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true }));
}, value);
try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.setTimeOfDay('noon'));
  await step(500);
  const islandCygnus = await page.evaluate(() => window.labIsland.getIslandCygnusSnapshot());
  assert(islandCygnus.fixedWorldBearing && islandCygnus.depthPlacement === 'background-far-plane', 'Island Cygnus must retain its fixed distant sky placement.');
  await screenshot('01-island-cygnus');
  await page.evaluate(() => {
    const w = window.labIsland;
    w.camera.position.set(0, 4, -900); w.controls.target.set(0, 45, 0); w.controls.update();
  });
  await step(100);
  await screenshot('02-main-island-sky');
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => !!window.labIsland.syntheticShore);
  await page.evaluate(() => window.labIsland.syntheticShore.setWalkSpeedKilometresPerHour(19.8));
  await page.click('[data-shore-view="island"]'); await step(200);
  assert(await page.evaluate(() => !window.labIsland.syntheticShore.scene.getObjectByName('Central atmospheric shield')), 'False hemisphere must be absent.');
  await screenshot('03-shore-island-sky');
  await page.click('[data-shore-view="club"]'); await step(200);
  let s = await state();
  const clubEyeY = s.interactions.venues.club.position[1] + 1.62;
  assert(Math.abs(s.position[1] - clubEyeY) < 0.01 && s.interactions.nearby?.id === 'club-bar', 'Club view must spawn on deck near bar.');
  await screenshot('04-beach-club');
  await page.click('[data-shore-interact]');
  for (const [id, name] of [['nebula','Nebula Fizz'], ['silver','Silver Tide'], ['aurora','Aurora Spritz']]) {
    await page.click(`[data-shore-action="serve-${id}"]`);
    assert((await state()).interactions.venues.cocktail === name, `${name} must be served.`);
  }
  await page.click('[data-shore-action="toggle-music"]');
  await page.waitForFunction(() => window.labIsland.syntheticShore.getInteractionState().audio.playing);
  await page.selectOption('[data-shore-track]', 'orbital');
  await page.locator('[data-shore-volume]').fill('47');
  s = await state();
  assert(s.interactions.audio.track === 'orbital' && s.interactions.audio.volume === 0.47, 'Track and volume controls must affect audio.');
  await step(400); await screenshot('05-cocktails-music');
  await page.click('[data-shore-action="toggle-music"]');
  assert(!(await state()).interactions.audio.playing, 'Music must pause.');
  await page.click('[data-shore-action="clear-drink"]');
  assert((await state()).interactions.venues.cocktail === null, 'Cocktail must clear.');
  await page.click('[data-shore-close-interaction]');
  const clubRampY = await page.evaluate(() => window.labIsland.syntheticShore.groundHeight(-48, 23));
  await position(-48, 1.62 + clubRampY, 23);
  await move('w', 2300);
  assert(Math.abs((await state()).position[1] - clubEyeY) < 0.02, 'Club ramp must join deck continuously.');
  await page.click('[data-shore-view="house"]'); await step(200);
  await screenshot('06-beach-house');
  await move('w', 1700);
  assert((await state()).position[2] < 50.6, 'Closed door must block entry.');
  await page.keyboard.press('e');
  await page.click('[data-shore-action="toggle-house-door"]');
  await step(1200);
  assert((await state()).interactions.venues.house.doorProgress > 0.95, 'House door must animate open.');
  await page.click('[data-shore-action="toggle-house-lights"]');
  assert(!(await state()).interactions.venues.house.lightsOn, 'House lighting must turn off.');
  await page.click('[data-shore-action="toggle-house-lights"]');
  await page.click('[data-shore-close-interaction]');
  await move('w', 1400);
  assert((await state()).position[2] > 55, 'Open doorway must permit entry.');
  await screenshot('07-house-interior');
  const houseEyeY = (await state()).interactions.venues.house.position[1] + 1.62;
  await position(68, houseEyeY, 51); await step(30); await page.keyboard.press('e');
  await page.click('[data-shore-action="toggle-house-door"]');
  assert((await state()).interactions.venues.house.doorOpen, 'Door must not close on visitor.');
  await page.click('[data-shore-view="ocean"]');
  await page.click('.shore-controls summary');
  for (const time of ['day', 'sunset', 'night']) {
    await page.selectOption('[data-shore-setting="timeOfDay"]', time);
    for (const weather of ['clear', 'cloudy', 'rain', 'storm']) {
      await page.selectOption('[data-shore-setting="weather"]', weather); await step(100);
      const env = (await state()).environment;
      assert(env.timeOfDay === time && env.weather === weather, 'Environment selection must apply.');
    }
  }
  await screenshot('08-night-storm-controls');
  await page.selectOption('[data-shore-setting="weather"]', 'clear');
  await range('waveHeight', 2.4); await range('waterSpeed', 0); await range('waterColor', '#248f91');
  await page.uncheck('[data-shore-setting="reflections"]');
  const env = (await state()).environment;
  assert(env.waveHeight === 2.4 && env.waterSpeed === 0 && env.waterColor === '#248f91' && !env.reflections, 'Water controls must apply.');
  await page.setViewportSize({ width: 640, height: 800 }); await step(100);
  await screenshot('09-compact-controls');
  await page.click('.shore-controls summary');
  await page.click('[data-shore-view="club"]'); await page.click('[data-shore-interact]');
  await screenshot('10-compact-club-night');
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.shore-control-body,.shore-interaction,.shore-views')].filter(el=>el.getClientRects().length).some(el=>{const r=el.getBoundingClientRect();return r.left<0 || r.right>innerWidth || r.bottom>innerHeight;}));
  assert(!overflow, 'Compact controls must fit viewport.');
  await page.click('[data-shore-action="toggle-music"]');
  await page.waitForFunction(() => window.labIsland.syntheticShore.getInteractionState().audio.playing);
  await page.evaluate(() => { window.retiredShore = window.labIsland.syntheticShore; });
  await page.click('[data-shore-exit]');
  assert(await page.evaluate(() => !window.retiredShore.getInteractionState().audio.playing), 'Leaving must stop music.');
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => !!window.labIsland.syntheticShore);
  const restored = (await state()).environment;
  assert(JSON.stringify(restored) === JSON.stringify(env), 'Environment should persist across visits.');
  assert(!(await state()).interactions.audio.playing, 'Re-entry must wait for user to play music.');
  await page.click('.shore-controls summary'); await page.click('[data-shore-reset]');
  assert((await state()).environment.timeOfDay === 'day' && (await state()).environment.reflections, 'Reset should restore coast defaults.');
  await page.click('[data-shore-exit]');
  assert(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
  await writeFile(`${output}/update-results.json`, JSON.stringify({status:'passed', islandCygnus, environment:env, errors}, null, 2));
  console.log(JSON.stringify({status:'passed', islandCygnus:islandCygnus.placement, errors}));
} finally { await browser.close(); }
