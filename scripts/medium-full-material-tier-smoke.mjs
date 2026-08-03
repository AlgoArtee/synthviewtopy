import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH
    ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(90_000);

const settle = async () => {
  await page.evaluate(() => window.labIsland.advanceTime(300));
  await page.waitForTimeout(120);
};

const audit = () => page.evaluate(() => {
  let optimized = 0;
  let physical = 0;
  let transmitting = 0;
  window.labIsland.scene.traverse((object) => {
    if (!object.isMesh || object.userData.gpuBatchSource === true) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.userData?.mediumFullIslandMaterialTier === true) optimized += 1;
      if (material.isMeshPhysicalMaterial) {
        physical += 1;
        if (material.transmission > 0) transmitting += 1;
      }
    });
  });
  const stats = window.labIsland.getSceneStatistics();
  return {
    mode: window.labIsland.getMode(),
    quality: window.labIsland.getGraphicsQuality(),
    full: window.labIsland.isFullIslandDetail(),
    optimized,
    physical,
    transmitting,
    materialTier: stats.renderer.mediumFullMaterialTier,
    transmissionPass: stats.renderer.transmissionPassActive,
  };
});

try {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178');
  await page.waitForFunction(() => Boolean(window.labIsland?.getSceneStatistics));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => {
    window.labIsland.setGraphicsQuality('medium');
    window.labIsland.setMode('explore');
    window.labIsland.setFullIslandDetail(true);
  });
  await page.waitForFunction(() => window.labIsland.getStreamingSnapshot().fullIslandDetailReady);
  await settle();
  const medium = await audit();
  console.log(`medium ${JSON.stringify(medium)}`);

  await page.evaluate(() => window.labIsland.setGraphicsQuality('high'));
  await settle();
  const high = await audit();
  console.log(`high ${JSON.stringify(high)}`);

  await page.evaluate(() => {
    window.labIsland.setGraphicsQuality('medium');
    window.labIsland.setMode('edit');
  });
  await settle();
  const edit = await audit();

  await page.evaluate(() => {
    window.labIsland.setMode('explore');
    window.labIsland.setFullIslandDetail(false);
  });
  await settle();
  const streamed = await audit();

  if (!medium.materialTier.active
    || medium.materialTier.runtimeMeshCount <= 0
    || medium.optimized <= 0
    || medium.transmitting !== 0
    || medium.transmissionPass
    || high.materialTier.active
    || high.optimized !== 0
    || !edit.materialTier.active
    || edit.optimized <= 0
    || edit.transmitting !== 0
    || edit.transmissionPass
    || streamed.materialTier.active
    || streamed.optimized !== 0) {
    throw new Error(`Medium Full material tier audit failed: ${JSON.stringify({ medium, high, edit, streamed }, null, 2)}`);
  }
  console.log(JSON.stringify({ medium, high, edit, streamed }, null, 2));
} finally {
  await browser.close();
}
