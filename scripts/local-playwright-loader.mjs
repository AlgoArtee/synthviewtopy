import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'playwright') {
    return {
      url: pathToFileURL(resolvePath('node_modules/playwright/index.mjs')).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const loaded = await nextLoad(url, context);
  if (!url.endsWith('/develop-web-game/scripts/web_game_playwright_client.js')) return loaded;
  const source = typeof loaded.source === 'string'
    ? loaded.source
    : new TextDecoder().decode(loaded.source);
  return {
    ...loaded,
    source: source.replace(
      'headless: args.headless,',
      'headless: args.headless, executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || undefined,',
    ),
  };
}
