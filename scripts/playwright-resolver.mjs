// Lets the bundled web-game smoke-test client resolve this project's Playwright install
// and use the locally installed browser when Playwright's managed binary is absent.
const playwrightUrl = new URL('./playwright-system-browser.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'playwright') {
    return { url: playwrightUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
