import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = resolve(
  process.env.UNREAL_MANIFEST_OUTPUT
    ?? '../YouTopiaProgrammabilis/Bootstrap/world.manifest.json',
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH
    ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.createUnrealBootstrapManifest));
  const manifest = await page.evaluate(() => window.labIsland.createUnrealBootstrapManifest());
  if (manifest.schema !== 'youtopy.unreal-world/1.0'
    || manifest.productionAuthority !== 'unreal-editor'
    || manifest.importPolicy !== 'bootstrap-only-no-roundtrip') {
    throw new Error('Browser returned a manifest that the Unreal importer must reject');
  }
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.entities.length} entities and ${manifest.packages.length} packages to ${OUTPUT}`);
} finally {
  await browser.close();
}
