import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const userProfile = process.env.USERPROFILE ?? process.env.HOME;
if (!userProfile) throw new Error('Cannot locate the user profile for the bundled web-game client.');
const codexHome = process.env.CODEX_HOME ?? path.join(userProfile, '.codex');
const bundledClientPath = path.join(
  codexHome,
  'skills',
  'develop-web-game',
  'scripts',
  'web_game_playwright_client.js',
);
const playwrightModule = pathToFileURL(path.resolve('node_modules/playwright/index.mjs')).href;
const chromePath = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const source = fs
  .readFileSync(bundledClientPath, 'utf8')
  .replace('from "playwright"', `from "${playwrightModule}"`)
  .replace(
    'headless: args.headless,',
    `headless: args.headless, executablePath: ${JSON.stringify(chromePath)},`,
  )
  .replace(
    'args: ["--use-gl=angle", "--use-angle=swiftshader"],',
    'args: ["--enable-gpu", "--ignore-gpu-blocklist"],',
  )
  .replace(
    'const page = await browser.newPage();',
    'const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });',
  )
  .replace(
    'await captureScreenshot(page, canvas, shotPath);',
    'const directDataUrl = await page.evaluate(() => { const world = window.labIsland; world.renderer.render(world.scene, world.camera); return world.renderer.domElement.toDataURL("image/png"); }); fs.writeFileSync(shotPath, Buffer.from(directDataUrl.split(",")[1], "base64"));',
  )
  .replace(
    'await page.goto(args.url, { waitUntil: "domcontentloaded" });',
    'console.log("bundled-client: goto"); await page.goto(args.url, { waitUntil: "domcontentloaded" }); console.log("bundled-client: loaded");',
  )
  .replace(
    'await page.waitForTimeout(500);',
    'await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot), null, { timeout: 180000 }); await page.waitForTimeout(500);',
  )
  .replace(
    'await page.click(args.clickSelector, { timeout: 5000 });',
    'await page.evaluate((selector) => document.querySelector(selector)?.click(), args.clickSelector);',
  )
  .replace(
    'await doChoreography(page, canvas, steps);',
    'console.log("bundled-client: choreography"); await doChoreography(page, canvas, steps); console.log("bundled-client: choreography complete");',
  )
  .replace(
    'await sleep(args.pauseMs);',
    'console.log("bundled-client: capture");',
  )
  .replace(
    'await browser.close();',
    'console.log("bundled-client: closing"); await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 5000))]); console.log("bundled-client: complete");',
  )
  .replace('main().catch((err) => {', 'await main().catch((err) => {');

await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
process.exit(0);
