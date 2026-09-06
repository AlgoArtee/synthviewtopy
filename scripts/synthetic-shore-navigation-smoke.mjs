import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.SYNTHETIC_SHORE_OUTPUT ?? 'output/synthetic-shore';
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
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const state = () => page.evaluate(() => window.labIsland.syntheticShore.getSnapshot());
const step = milliseconds => page.evaluate(ms => window.labIsland.advanceTime(ms), milliseconds);
const move = async (key, milliseconds, running = true) => {
  if (running) await page.keyboard.down('Shift');
  await page.keyboard.down(key);
  await step(milliseconds);
  await page.keyboard.up(key);
  if (running) await page.keyboard.up('Shift');
};
// Fixture positions select particular junctions without spending a minute walking
// the entire pier. All tested transitions use real keyboard input and update().
const position = (x, groundY, z) => page.evaluate(({ x, groundY, z }) => {
  const shore = window.labIsland.syntheticShore;
  shore.groundY = groundY;
  shore.grounded = true;
  shore.camera.position.set(x, groundY + 1.62, z);
  shore.camera.lookAt(x, groundY + 1.62, z + 100);
}, { x, groundY, z });

try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => window.labIsland.getSyntheticShoreSnapshot().active && !!window.labIsland.syntheticShore);
  // Keep route timing at the original 5.5 m/s using the authoritative speed field.
  await page.evaluate(() => window.labIsland.syntheticShore.setWalkSpeedKilometresPerHour(19.8));
  await page.click('[data-shore-view="island"]');
  await step(100);
  await page.screenshot({ path: `${output}/navigation-01-island.png` });
  await page.click('[data-shore-view="pier"]');
  await step(100);
  await page.screenshot({ path: `${output}/navigation-02-stairs.png` });

  await position(30.5, 27.5 * 0.04, 27.5);
  await move('w', 5700);
  const ascent = await state();
  assert(ascent.position[2] > 58 && ascent.position[2] < 61.5, `Stairs must reach landing: ${JSON.stringify(ascent)}`);
  assert(Math.abs(ascent.position[1] - 9.62) < 0.025 && ascent.surface === 'anchor pier', 'Ascent must reach the 8 m deck continuously.');
  await move('a', 2100);
  const landing = await state();
  assert(landing.position[0] > 40 && landing.position[0] < 45, 'Landing must connect stairs to pier stem.');
  assert(Math.abs(landing.position[1] - 9.62) < 0.025, 'Crossing landing must retain deck height.');
  await move('s', 1500);
  const stem = await state();
  assert(stem.position[2] < 54 && stem.surface === 'anchor pier', 'Stem must remain walkable beyond landing.');

  await position(42, 8, -57);
  await move('s', 1100);
  await move('d', 1200);
  const anchor = await state();
  assert(anchor.position[0] < 37.9 && anchor.surface === 'anchor pier', 'Stem must connect to the curved anchor deck.');
  assert(Math.abs(anchor.position[1] - 9.62) < 0.025, 'Anchor junction must not drop to ocean.');
  await move('d', 3000);
  const railing = await state();
  assert(Math.hypot(railing.position[0] - 42, railing.position[2] + 39) <= 27.71, 'Crescent outer railing must stop movement.');
  assert(Math.abs(railing.position[1] - 9.62) < 0.025, 'Railing must prevent stepping into water.');

  const middleHeight = 1.12 + (44 - 28) / 30 * (8 - 1.12);
  await position(30.5, middleHeight, 44);
  await move('d', 1500);
  const stairRailing = await state();
  assert(stairRailing.position[0] >= 28.11, 'Stair side must not permit stepping through the handrail.');
  assert(stairRailing.position[1] > 6.3, 'Stair rail must prevent falling onto sand.');

  await position(30.5, 8, 60.5);
  await move('s', 6000);
  const descent = await state();
  assert(descent.position[2] < 28 && descent.position[2] > 24, 'Descent must reach the beach.');
  assert(descent.surface === 'silver sand', 'Stair foot must connect to sand.');
  assert(Math.abs(descent.position[1] - (descent.position[2] * 0.04 + 1.62)) < 0.025, 'Descent must end at the sand height.');

  await position(42, 8, 117);
  await move('w', 700);
  const exit = await page.evaluate(() => window.labIsland.getSyntheticShoreSnapshot());
  assert(!exit.active, 'Walking inland beyond the pier must return to Lab Island.');
  assert(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
  const results = { status: 'passed', ascent, landing, stem, anchor, railing, stairRailing, descent, exit, errors };
  await writeFile(`${output}/navigation-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: 'passed', ascentY: ascent.position[1], descentY: descent.position[1], anchor: anchor.position, railRadius: Math.hypot(railing.position[0] - 42, railing.position[2] + 39), errors }));
} finally {
  await browser.close();
}
