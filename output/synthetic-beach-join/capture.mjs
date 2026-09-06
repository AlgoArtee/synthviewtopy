import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'output/synthetic-beach-join';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 850 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.goto('http://127.0.0.1:5182', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot), { timeout: 120000 });
  await page.waitForSelector('#loading-screen', { state: 'hidden', timeout: 120000 });
  await page.evaluate(() => window.labIsland.setTimeOfDay('noon'));
  await page.click('#locate-synthetic-shore');
  await page.waitForTimeout(1600);
  const capture = await page.evaluate(() => {
    const world = window.labIsland;
    world.advanceTime(1000);
    world.controls.enabled = false;
    world.controls.target.set(0, 0, -555.5);
    world.camera.position.set(0, 78, -530);
    world.camera.fov = 44;
    world.camera.lookAt(world.controls.target);
    world.camera.updateProjectionMatrix();
    world.renderer.render(world.scene, world.camera);
    return { image: world.renderer.domElement.toDataURL('image/png'), state: JSON.parse(window.render_game_to_text()) };
  });
  await writeFile(`${output}/joined-beach.png`, Buffer.from(capture.image.split(',')[1], 'base64'));
  await writeFile(`${output}/state.json`, JSON.stringify({ state: capture.state, errors }, null, 2));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ status: 'passed', screenshot: `${output}/joined-beach.png`, errors }));
} finally {
  await browser.close();
}
