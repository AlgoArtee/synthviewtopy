import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.HEADER_MENU_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.HEADER_MENU_OUTPUT ?? 'output/header-menu-responsive';
const viewports = [
  { width: 1825, height: 934 },
  { width: 1829, height: 873 },
  { width: 1440, height: 900 },
  { width: 1180, height: 800 },
  { width: 1024, height: 768 },
  { width: 915, height: 768 },
  { width: 860, height: 768 },
  { width: 760, height: 720 },
  { width: 600, height: 720 },
];

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

const page = await browser.newPage({ viewport: viewports[0], deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
const failures = [];
const results = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

function check(condition, message) {
  if (!condition) failures.push(message);
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 });
  await page.waitForSelector('#loading-screen.done', { timeout: 90_000 });
  await page.waitForTimeout(500);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);

    const audit = await page.evaluate(() => {
      const tolerance = 0.75;
      const describe = (element) => {
        if (!(element instanceof HTMLElement)) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const hit = document.elementFromPoint(center.x, center.y);
        return {
          id: element.id,
          className: element.className,
          rect: {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          position: style.position,
          transform: style.transform,
          zIndex: style.zIndex,
          insideViewport:
            rect.left >= -tolerance
            && rect.top >= -tolerance
            && rect.right <= innerWidth + tolerance
            && rect.bottom <= innerHeight + tolerance,
          hitTarget: hit
            ? `${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : ''}${hit.classList.length ? `.${[...hit.classList].join('.')}` : ''}`
            : null,
          centerHitsSelf: Boolean(hit && (hit === element || element.contains(hit))),
        };
      };

      const header = document.querySelector('.topbar');
      const brand = document.querySelector('#home-view');
      const modes = document.querySelector('.mode-switch');
      const actions = document.querySelector('.top-actions');
      const modeButtons = [...document.querySelectorAll('.mode-switch .mode')];
      const actionButtons = [...document.querySelectorAll('.top-actions > button')];
      const keyControls = [brand, ...modeButtons, ...actionButtons].filter(Boolean);
      const insideControls = [brand, modes, actions, ...modeButtons, ...actionButtons].filter(Boolean);

      const modeRect = modes?.getBoundingClientRect();
      const actionRect = actions?.getBoundingClientRect();
      const overlapWidth = modeRect && actionRect
        ? Math.max(0, Math.min(modeRect.right, actionRect.right) - Math.max(modeRect.left, actionRect.left))
        : Number.NaN;
      const overlapHeight = modeRect && actionRect
        ? Math.max(0, Math.min(modeRect.bottom, actionRect.bottom) - Math.max(modeRect.top, actionRect.top))
        : Number.NaN;

      const app = document.querySelector('#app');
      const appDescription = describe(app);
      let authoredAppHeight = null;
      const visitRules = (rules) => {
        for (const rule of rules) {
          if ('selectorText' in rule && rule.selectorText?.split(',').some((selector) => selector.trim() === '#app')) {
            authoredAppHeight = rule.style.height || authoredAppHeight;
          }
          if ('cssRules' in rule) visitRules(rule.cssRules);
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          visitRules(sheet.cssRules);
        } catch {
          // Cross-origin styles are irrelevant to the local application shell.
        }
      }

      const appRect = app?.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      return {
        viewport: {
          width: innerWidth,
          height: innerHeight,
          scrollX,
          scrollY,
          visual: visualViewport
            ? {
                width: visualViewport.width,
                height: visualViewport.height,
                offsetLeft: visualViewport.offsetLeft,
                offsetTop: visualViewport.offsetTop,
                pageLeft: visualViewport.pageLeft,
                pageTop: visualViewport.pageTop,
                scale: visualViewport.scale,
              }
            : null,
        },
        header: describe(header),
        brand: describe(brand),
        modes: describe(modes),
        actions: describe(actions),
        controls: keyControls.map(describe),
        insideControls: insideControls.map(describe),
        overlap: {
          width: overlapWidth,
          height: overlapHeight,
          area: overlapWidth * overlapHeight,
        },
        app: {
          ...appDescription,
          authoredHeight: authoredAppHeight,
          fillsViewport: Boolean(
            appRect
            && Math.abs(appRect.left) <= tolerance
            && Math.abs(appRect.top) <= tolerance
            && Math.abs(appRect.width - innerWidth) <= tolerance
            && Math.abs(appRect.height - innerHeight) <= tolerance
          ),
        },
      };
    });

    const label = `${viewport.width}x${viewport.height}`;
    check(audit.header, `${label}: missing .topbar`);
    check(audit.header?.rect.top >= 0, `${label}: header top is ${audit.header?.rect.top}`);
    check(audit.header?.insideViewport, `${label}: header is outside the viewport`);
    for (const control of audit.insideControls) {
      check(control?.insideViewport, `${label}: ${control?.id || control?.className || 'control'} is outside the viewport`);
    }
    check(audit.overlap.area <= 0, `${label}: mode/actions overlap area is ${audit.overlap.area}`);
    for (const control of audit.controls) {
      check(control?.centerHitsSelf, `${label}: ${control?.id || control?.className || 'control'} center hit ${control?.hitTarget}`);
    }
    check(audit.app?.position === 'fixed', `${label}: #app position is ${audit.app?.position}`);
    check(
      audit.app?.authoredHeight === 'var(--app-viewport-height, 100dvh)',
      `${label}: #app authored height is ${audit.app?.authoredHeight}`,
    );
    check(audit.app?.fillsViewport, `${label}: #app does not fill the dynamic viewport`);
    check(audit.viewport.scrollX === 0 && audit.viewport.scrollY === 0, `${label}: page scrolled to ${audit.viewport.scrollX},${audit.viewport.scrollY}`);

    results.push(audit);
    await page.screenshot({ path: `${outputDirectory}/${label}.png`, fullPage: false });
  }

  const cdpResult = {
    supported: false,
    pageScaleError: null,
    displacementError: null,
    before: null,
    scaled130: null,
    scaledInteraction: null,
    scaled: null,
    displaced: null,
    restored: null,
  };

  try {
    await page.setViewportSize(viewports[0]);
    await page.waitForTimeout(200);
    const session = await page.context().newCDPSession(page);
    const readViewportState = () => page.evaluate(() => {
      const headerRect = document.querySelector('.topbar')?.getBoundingClientRect();
      const appRect = document.querySelector('#app')?.getBoundingClientRect();
      const magnification = Number(document.querySelector('#app')?.dataset.viewportMagnification ?? 1);
      const visual = window.visualViewport;
      return {
        scroll: [scrollX, scrollY],
        header: headerRect
          ? { left: headerRect.left, top: headerRect.top, right: headerRect.right, bottom: headerRect.bottom }
          : null,
        app: appRect
          ? { left: appRect.left, top: appRect.top, right: appRect.right, bottom: appRect.bottom }
          : null,
        magnification,
        visual: visual
          ? {
              width: visual.width,
              height: visual.height,
              offsetLeft: visual.offsetLeft,
              offsetTop: visual.offsetTop,
              pageLeft: visual.pageLeft,
              pageTop: visual.pageTop,
              scale: visual.scale,
            }
          : null,
      };
    });

    cdpResult.before = await readViewportState();
    await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.3 });
    await page.waitForTimeout(250);
    cdpResult.scaled130 = await readViewportState();
    await page.screenshot({ path: `${outputDirectory}/cdp-page-scale-130.png`, fullPage: false });
    await page.locator('.mode[data-mode="plan"]').click();
    await page.waitForTimeout(120);
    const planMode = await page.locator('.mode.active').getAttribute('data-mode');
    await page.locator('.mode[data-mode="explore"]').click();
    await page.waitForTimeout(120);
    const exploreMode = await page.locator('.mode.active').getAttribute('data-mode');
    cdpResult.scaledInteraction = { planMode, exploreMode };
    check(planMode === 'plan', `CDP scale 130%: Plan click activated ${planMode}`);
    check(exploreMode === 'explore', `CDP scale 130%: Explore click activated ${exploreMode}`);

    await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
    await page.waitForTimeout(250);
    cdpResult.scaled = await readViewportState();
    cdpResult.supported = cdpResult.scaled?.visual?.scale > 1;
    await page.screenshot({ path: `${outputDirectory}/cdp-page-scale-200.png`, fullPage: false });

    try {
      await session.send('Input.synthesizeScrollGesture', {
        x: Math.round(viewports[0].width / 2),
        y: Math.round(viewports[0].height / 2),
        yDistance: -140,
        speed: 800,
        gestureSourceType: 'touch',
      });
      await page.waitForTimeout(250);
    } catch (error) {
      cdpResult.displacementError = error instanceof Error ? error.message : String(error);
    }
    cdpResult.displaced = await readViewportState();
    await page.screenshot({ path: `${outputDirectory}/cdp-page-scale-200-displacement.png`, fullPage: false });

    await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    cdpResult.restored = await readViewportState();

    const checkVisualFit = (state, label) => {
      const visual = state?.visual;
      const app = state?.app;
      const header = state?.header;
      if (!visual || !app || !header) {
        check(false, `${label}: missing viewport, app, or header measurements`);
        return;
      }
      const visualLeft = visual.offsetLeft;
      const visualTop = visual.offsetTop;
      const visualRight = visualLeft + visual.width;
      const visualBottom = visualTop + visual.height;
      check(Math.abs(app.left - visualLeft) <= 1, `${label}: app left ${app.left} != ${visualLeft}`);
      check(Math.abs(app.top - visualTop) <= 1, `${label}: app top ${app.top} != ${visualTop}`);
      check(Math.abs(app.right - visualRight) <= 1, `${label}: app right ${app.right} != ${visualRight}`);
      check(Math.abs(app.bottom - visualBottom) <= 1, `${label}: app bottom ${app.bottom} != ${visualBottom}`);
      check(header.left >= visualLeft, `${label}: header left ${header.left} is clipped`);
      check(header.top >= visualTop, `${label}: header top ${header.top} is clipped`);
      check(header.right <= visualRight, `${label}: header right ${header.right} is clipped`);
      check(header.bottom <= visualBottom, `${label}: header bottom ${header.bottom} is clipped`);
      check(
        Math.abs(state.magnification - Math.max(1, visual.scale)) <= 0.001,
        `${label}: recorded magnification ${state.magnification} != ${visual.scale}`,
      );
    };

    checkVisualFit(cdpResult.scaled130, 'CDP scale 130%');
    checkVisualFit(cdpResult.scaled, 'CDP scale 200%');
    checkVisualFit(cdpResult.displaced, 'CDP displacement');
    checkVisualFit(cdpResult.restored, 'CDP restore');
  } catch (error) {
    cdpResult.pageScaleError = error instanceof Error ? error.message : String(error);
  }

  check(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);
  check(pageErrors.length === 0, `Page errors: ${pageErrors.join(' | ')}`);

  console.log(JSON.stringify({
    passed: failures.length === 0,
    url,
    executablePath: executablePath ?? 'Playwright managed browser',
    results,
    cdpResult,
    consoleErrors,
    pageErrors,
    failures,
  }, null, 2));
} finally {
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;
