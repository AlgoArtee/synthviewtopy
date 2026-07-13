// Lets the bundled web-game smoke-test client resolve this project's Playwright install.
const playwrightUrl = new URL('../node_modules/playwright/index.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'playwright') {
    return { url: playwrightUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
