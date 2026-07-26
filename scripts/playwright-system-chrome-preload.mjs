import { chromium } from 'playwright';

const originalLaunch = chromium.launch.bind(chromium);
chromium.launch = (options = {}) => originalLaunch({
  ...options,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH
    ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: [
    ...(options.args ?? []).filter((argument) => (
      argument !== '--use-gl=angle' && argument !== '--use-angle=swiftshader'
    )),
    '--enable-gpu',
    '--ignore-gpu-blocklist',
  ],
});
