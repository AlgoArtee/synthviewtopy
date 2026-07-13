import { chromium } from 'playwright';
import { stat } from 'node:fs/promises';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('.loading-screen.done', { timeout: 30_000 });
await page.click('.mode[data-mode="edit"]');
await page.click('#edit-interior');
await page.click('.district-item[data-id="pharmacology-labs"]');
await page.waitForFunction(() => !document.querySelector('#enter-interior')?.disabled);
await page.click('#enter-interior');
await page.waitForFunction(() => document.body.classList.contains('interior-design-active'));

const interiorCatalogCount = await page.locator('#asset-library [data-asset-id]').count();
await page.click('#add-asset');
const firstInteriorId = await page.evaluate(() => window.labIsland.getSelectedDefinition()?.id ?? null);
await page.fill('#pos-x', '0.42');
await page.locator('#pos-x').press('Tab');
await page.locator('#rot-y').evaluate((element) => {
  element.value = '32';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.locator('#scale-uniform').evaluate((element) => {
  element.value = '1.18';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});

const secondCard = page.locator('#asset-library [data-asset-id]').nth(1);
await secondCard.click();
await page.click('#add-asset');
const deletedInteriorId = await page.evaluate(() => window.labIsland.getSelectedDefinition()?.id ?? null);
await page.waitForTimeout(950);
await page.screenshot({ path: 'test-artifacts/interior-design-smoke.png' });
await page.click('#delete-object');

const interiorState = await page.evaluate(({ firstInteriorId, deletedInteriorId }) => ({
  activeBuilding: window.labIsland.getActiveInteriorBuildingId(),
  workspace: window.labIsland.getEditWorkspace(),
  firstAsset: firstInteriorId ? window.labIsland.getObjectState(firstInteriorId) : null,
  deletedAssetStillExists: deletedInteriorId ? Boolean(window.labIsland.getDefinition(deletedInteriorId)) : null,
  snapshot: window.labIsland.getTextSnapshot(),
}), { firstInteriorId, deletedInteriorId });

const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
await page.click('#export-trigger');
const exportDownload = await downloadPromise;
const exportPath = await exportDownload.path();
const exportBytes = exportPath ? (await stat(exportPath)).size : 0;

await page.click('#exit-interior');
await page.click('#edit-landscape');
await page.click('#add-asset');
const landscapeId = await page.evaluate(() => window.labIsland.getSelectedDefinition()?.id ?? null);
await page.click('#delete-object');
const finalState = await page.evaluate((landscapeId) => ({
  activeBuilding: window.labIsland.getActiveInteriorBuildingId(),
  workspace: window.labIsland.getEditWorkspace(),
  landscapeDeleted: landscapeId ? !window.labIsland.getDefinition(landscapeId) : null,
  architectureVisible: window.labIsland.architectureRoot.visible,
  landscapeVisible: window.labIsland.landscapeRoot.visible,
  editorAssetCount: window.labIsland.getTextSnapshot().counts.editorAssets,
}), landscapeId);

console.log(JSON.stringify({
  interiorCatalogCount,
  firstInteriorId,
  deletedInteriorId,
  interiorState,
  export: { filename: exportDownload.suggestedFilename(), bytes: exportBytes },
  finalState,
  consoleErrors,
}, null, 2));
await browser.close();
