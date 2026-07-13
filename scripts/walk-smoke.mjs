import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consoleErrors = [];

// Exercise the exact browser capability gap reported by the user: no native
// pointer lock. The Walk controller must fall back to drag-based mouse look.
await page.addInitScript(() => {
  HTMLElement.prototype.requestPointerLock = function requestPointerLockFallback() {
    document.dispatchEvent(new Event('pointerlockerror'));
  };
});

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#walk-mode', { state: 'visible', timeout: 30_000 });
await page.click('#walk-mode');
await page.waitForTimeout(700);

const readState = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const before = await readState();

await page.click('#walk-look-button');
await page.waitForTimeout(100);
const afterLookActivation = await readState();

const canvas = page.locator('canvas');
const canvasBox = await canvas.boundingBox();
if (!canvasBox) throw new Error('Walk viewport canvas was not available');
await page.mouse.move(canvasBox.x + canvasBox.width * 0.45, canvasBox.y + canvasBox.height * 0.42);
await page.mouse.down();
await page.mouse.move(canvasBox.x + canvasBox.width * 0.64, canvasBox.y + canvasBox.height * 0.52, { steps: 6 });
await page.mouse.up();
const afterLook = await readState();

await page.keyboard.down('ArrowUp');
await page.evaluate(() => window.advanceTime(1000));
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(100);

const after = await readState();
console.log(JSON.stringify({
  before: before.walk,
  afterLookActivation: afterLookActivation.walk,
  afterLook: afterLook.walk,
  afterMove: after.walk,
  directionChanged: JSON.stringify(before.walk.direction) !== JSON.stringify(afterLook.walk.direction),
  mode: after.mode,
  consoleErrors,
}, null, 2));
await Promise.race([
  browser.close(),
  new Promise((resolve) => setTimeout(resolve, 3000)),
]);
process.exit(0);
