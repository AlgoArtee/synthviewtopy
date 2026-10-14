// Use the unchanged bundled action client with this room's asynchronous readiness.
// The ordinary room suite remains the authority for geometry and navigation.
export { resolve } from './local-playwright-loader.mjs';
import { load as loadLocal } from './local-playwright-loader.mjs';
export async function load(url, context, nextLoad) {
  const loaded = await loadLocal(url, context, nextLoad);
  if (!url.endsWith('/develop-web-game/scripts/web_game_playwright_client.js')) return loaded;
  const source = typeof loaded.source === 'string' ? loaded.source : new TextDecoder().decode(loaded.source);
  return { ...loaded, source: source
    .replace('["--use-gl=angle", "--use-angle=swiftshader"]', '["--enable-gpu", "--ignore-gpu-blocklist"]')
    .replace('await page.goto(args.url, { waitUntil: "domcontentloaded" });', 'await page.goto(args.url, { waitUntil: "domcontentloaded", timeout: 120000 });\n  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && JSON.parse(window.render_game_to_text()).ready, null, {timeout: 300000});') };
}
