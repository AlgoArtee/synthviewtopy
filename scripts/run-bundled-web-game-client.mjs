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
    'await page.screenshot({ path: shotPath, type: "png", omitBackground: false });',
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
    'console.log("bundled-client: closing"); await browser.close(); console.log("bundled-client: complete");',
  );

await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
