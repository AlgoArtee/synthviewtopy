import { chromium as installedChromium } from '../node_modules/playwright/index.mjs';

const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE;

export const chromium = {
  launch(options = {}) {
    return installedChromium.launch({
      ...options,
      ...(executablePath ? { executablePath } : {}),
    });
  },
};
