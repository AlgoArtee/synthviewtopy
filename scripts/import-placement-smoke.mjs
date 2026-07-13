import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#loading-screen.done', { timeout: 30_000 });
await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.position.set(70, 180, 70.1);
  world.controls.target.set(70, 0, 70);
  world.controls.update();
});
await page.waitForTimeout(500);

// Headless Chromium auto-cancels programmatically opened native file dialogs.
// Suppress that harness-only event so the chosen placement remains available
// while setInputFiles supplies the same input a real user would select.
await page.evaluate(() => {
  document.addEventListener('cancel', (event) => event.stopImmediatePropagation(), true);
});

await page.click('#import-trigger');
const choosingState = await page.evaluate(() => window.labIsland.getImportPlacementState());
const canvas = page.locator('canvas').first();
const bounds = await canvas.boundingBox();
if (!bounds) throw new Error('3D canvas was unavailable');
const clickX = bounds.x + bounds.width * 0.5;
const clickY = bounds.y + bounds.height * 0.5;
await page.mouse.move(clickX, clickY);
await page.waitForTimeout(250);

await page.mouse.click(clickX, clickY);
await page.waitForTimeout(250);
const chosenState = await page.evaluate(() => window.labIsland.getImportPlacementState());
await page.screenshot({ path: 'output/import-placement-client/placement-selected.png' });

const obj = `o PlacementBuilding
v -1 0 -1
v 1 0 -1
v 1 0 1
v -1 0 1
v -1 2 -1
v 1 2 -1
v 1 2 1
v -1 2 1
f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;
await page.locator('#mesh-file').setInputFiles({
  name: 'placement-building.obj',
  mimeType: 'text/plain',
  buffer: Buffer.from(obj),
});
await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).counts.importedAssets === 1, undefined, { timeout: 30_000 });
await page.waitForTimeout(900);

const imported = await page.evaluate(() => {
  const world = window.labIsland;
  const selected = world.getSelectedDefinition();
  return {
    selectedId: selected?.id,
    selectedState: selected ? world.getObjectState(selected.id) : null,
    placement: world.getImportPlacementState(),
    textState: JSON.parse(window.render_game_to_text()),
    markerVisible: world.scene.getObjectByName('EDITOR__IMPORT_PLACEMENT_MARKER')?.visible,
  };
});
await page.screenshot({ path: 'output/import-placement-client/imported-at-selected-place.png' });
await canvas.screenshot({ path: 'output/import-placement-client/imported-at-selected-place-canvas.png' });

await page.click('#import-trigger');
const cancelBefore = await page.evaluate(() => window.labIsland.getImportPlacementState());
await page.keyboard.press('Escape');
const cancelAfter = await page.evaluate(() => window.labIsland.getImportPlacementState());

const positionDelta = chosenState.position && imported.selectedState
  ? Math.hypot(
      imported.selectedState.position.x - chosenState.position[0],
      imported.selectedState.position.z - chosenState.position[2],
    )
  : null;

console.log(JSON.stringify({
  choosingState,
  chosenState,
  imported,
  positionDelta,
  cancelBefore,
  cancelAfter,
  consoleErrors,
}, null, 2));
await browser.close();
