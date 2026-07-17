import fs from 'node:fs';

const bundledClientPath = 'C:/Users/Mewxy/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js';
const playwrightModule = 'file:///C:/Users/Mewxy/Documents/ProjecTopy/SynthViewTopy/node_modules/playwright/index.mjs';
const source = fs
  .readFileSync(bundledClientPath, 'utf8')
  .replace('from "playwright"', `from "${playwrightModule}"`)
  .replace(
    'headless: args.headless,',
    'headless: args.headless, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",',
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
