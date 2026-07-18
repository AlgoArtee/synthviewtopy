import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_EXTENSION_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_EXTENSION_OUTPUT ?? 'output/academic-district-extension';
await mkdir(outputDirectory, { recursive: true });

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 });
  await page.waitForTimeout(1_200);

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    const facilities = district.children.filter((child) => child.userData.academicFacility === true);
    const configured = facilities.map((facility) => facility.userData.academicBuildingData).filter(Boolean);
    const interiors = [];
    const features = [];
    const hidden = [];
    district.traverse((object) => {
      if (object.userData.academicInterior) interiors.push(object.userData.academicInterior);
      if (object.userData.academicFeatureType) features.push(object.userData.academicFeatureType);
      if (object.userData.academicHiddenDetail) hidden.push(object.userData.academicHiddenDetail);
    });

    const gateLeaves = [];
    district.traverse((object) => {
      if (object.userData.academicGateLeaf === true) gateLeaves.push(object);
    });
    world.setTimeOfDay('night');
    const closedYaw = gateLeaves.map((leaf) => leaf.rotation.y);
    const gateResult = world.performAcademicInteraction('open main gate');
    const openYaw = gateLeaves.map((leaf) => leaf.rotation.y);
    const gateMoved = openYaw.every((yaw, index) => Math.abs(yaw - closedYaw[index]) > 0.5);
    world.performAcademicInteraction('open main gate');
    world.setTimeOfDay('noon');

    const litMaterials = new Set();
    district.traverse((object) => {
      if (!object.isMesh || object.userData.academicReadingLights !== true) return;
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => litMaterials.add(material));
    });
    const lightBefore = [...litMaterials].map((material) => material.emissiveIntensity);
    const lightResult = world.performAcademicInteraction('toggle reading-room lights');
    const lightAfter = [...litMaterials].map((material) => material.emissiveIntensity);
    const lightsChanged = lightAfter.some((value, index) => Math.abs(value - lightBefore[index]) > 0.2);
    world.performAcademicInteraction('toggle reading-room lights');
    const bellResult = world.performAcademicInteraction('ring chapel bell');

    const weather = [];
    ['academic-autumn', 'academic-overcast', 'academic-rainy-dusk', 'academic-foggy-night'].forEach((preset) => {
      world.setWeather(preset);
      world.advanceTime(180);
      weather.push(JSON.parse(window.render_game_to_text()).atmosphere);
    });
    ['low', 'medium', 'high'].forEach((quality) => world.setGraphicsQuality(quality));
    world.setGraphicsQuality('medium');
    world.setDebugMode(true);
    const debugHelpers = world.debugRoot.children.length;
    const stats = world.getSceneStatistics();
    world.setDebugMode(false);
    world.setWeather('academic-autumn');
    world.advanceTime(480);

    return {
      facilityCount: facilities.length,
      configuredCount: configured.length,
      configuredHistories: configured.filter((record) => record.history?.split('.').filter(Boolean).length >= 2).length,
      interiorKinds: [...new Set(interiors)].sort(),
      componentHierarchy: district.userData.academicComponentHierarchy,
      optimization: district.userData.academicOptimization,
      materialNames: district.userData.academicMaterialsProcedural,
      hiddenDetailCount: new Set(hidden).size,
      hiddenPlanCount: district.userData.academicPrecinct?.hiddenDiscoveries?.length ?? 0,
      featureTypes: [...new Set(features)].sort(),
      interactions: district.userData.interactions,
      gateLeaves: gateLeaves.length,
      gateMoved,
      gateResult,
      readingLightMaterials: litMaterials.size,
      lightsChanged,
      lightResult,
      bellResult,
      weather,
      debugHelpers,
      stats,
    };
  });

  // Exercise the visible WALK interaction menu, map, marker, editor, and local save.
  await page.locator('.mode[data-mode="walk"]').click();
  await page.evaluate(() => {
    const world = window.labIsland;
    world.clearSelection('ui');
    world.select('academic-libraries-theoretical-labs', 'scene');
  });
  const interactionMenuState = await page.evaluate(() => ({
    hidden: document.querySelector('#walk-interaction-menu')?.hidden,
    buttons: [...document.querySelectorAll('#interaction-menu-buttons button')].map((button) => button.textContent),
    interactions: window.labIsland.getObjectState('academic-libraries-theoretical-labs')?.interactions,
  }));
  console.log(JSON.stringify({ interactionMenuState }, null, 2));
  if (interactionMenuState.buttons.some((label) => /main gate/i.test(label))) {
    throw new Error(`Remote academic selection exposed the main-gate control: ${JSON.stringify(interactionMenuState)}`);
  }
  await page.getByRole('button', { name: 'Open campus map' }).click();
  await page.waitForSelector('#academic-campus-map:not([hidden])');
  await page.screenshot({ path: `${outputDirectory}/campus-map.png` });
  await page.getByRole('button', { name: /Cerebrum Externum/ }).click();
  await page.waitForSelector('#academic-building-card:not([hidden])');
  const historyEditor = page.locator('#academic-history-editor');
  const originalHistory = await historyEditor.inputValue();
  await historyEditor.fill(`${originalHistory} Editable smoke note.`);
  await page.locator('#academic-history-save').click();
  const historySaved = await page.evaluate(() => Boolean(localStorage.getItem('blackwood-history:ashcroft-grand-library')?.includes('Editable smoke note.')));
  await page.evaluate(() => localStorage.removeItem('blackwood-history:ashcroft-grand-library'));
  await page.locator('#academic-building-close').click();

  const hideUi = async () => page.evaluate(() => {
    document.querySelectorAll('.atlas, .topbar, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region')
      .forEach((element) => { element.style.display = 'none'; });
  });
  await hideUi();

  const gateShot = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    if (!gate || !hall) return false;
    const gatePosition = gate.getWorldPosition(world.camera.position.clone());
    const hallPosition = hall.getWorldPosition(world.controls.target.clone());
    const outward = gatePosition.clone().sub(hallPosition).setY(0).normalize();
    const cameraPosition = gatePosition.clone().addScaledVector(outward, 11);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? 1.61;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(hallPosition.x, hallPosition.y + 4.3, hallPosition.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    if (district.userData.academicGateOpen !== true) world.performAcademicInteraction('open main gate');
    world.setWeather('academic-autumn');
    world.advanceTime(900);
    return true;
  });
  if (gateShot) await page.screenshot({ path: `${outputDirectory}/gate-to-clock-tower-autumn.png` });

  const stageInterior = async (name, filename) => {
    const staged = await page.evaluate(({ name }) => {
      const world = window.labIsland;
      const district = world.objectGroups.get('academic-libraries-theoretical-labs');
      const facility = district.children.find((child) => child.userData.semanticName === name);
      if (!facility) return false;
      const footprint = facility.userData.footprint;
      const zoneZ = footprint[1] * 0.5 - 2.35;
      const cameraLocal = world.camera.position.clone().set(0, 0.162, footprint[1] * 0.5 - 0.72);
      const targetLocal = world.controls.target.clone().set(0, 0.18, zoneZ - 1.15);
      facility.localToWorld(cameraLocal);
      facility.localToWorld(targetLocal);
      world.camera.position.copy(cameraLocal);
      world.camera.lookAt(targetLocal);
      world.walkController.groundY = cameraLocal.y - 0.162;
      world.walkController.grounded = true;
      world.setWeather('academic-rainy-dusk');
      world.advanceTime(600);
      return true;
    }, { name });
    if (staged) await page.screenshot({ path: `${outputDirectory}/${filename}` });
    return staged;
  };
  const chapelShot = await stageInterior('St Anselm Chapel', 'chapel-nave.png');
  const diningShot = await stageInterior('Founders Dining Hall', 'dining-hall.png');

  const canalShot = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const canal = district.getObjectByName('ACADEMIC__BLACKWATER_CANAL');
    if (!canal) return false;
    canal.geometry.computeBoundingBox();
    if (!canal.geometry.boundingBox) return false;
    const bounds = canal.geometry.boundingBox.clone().applyMatrix4(canal.matrixWorld);
    const center = bounds.getCenter(world.controls.target.clone());
    const size = bounds.getSize(world.camera.position.clone());
    world.setMode('explore');
    world.camera.position.set(center.x + size.x * 0.28 + 9, center.y + 7, center.z + size.z * 0.8 + 9);
    world.controls.target.copy(center);
    world.camera.lookAt(center);
    world.controls.update();
    world.setWeather('academic-foggy-night');
    world.advanceTime(720);
    return true;
  });
  if (canalShot) await page.screenshot({ path: `${outputDirectory}/canal-foggy-night.png` });

  if (audit.facilityCount < 14 || audit.configuredCount !== audit.facilityCount) throw new Error(`Campus data coverage failed: ${audit.configuredCount}/${audit.facilityCount}`);
  if (audit.configuredHistories !== audit.configuredCount) throw new Error(`Two-sentence history coverage failed: ${audit.configuredHistories}/${audit.configuredCount}`);
  if (JSON.stringify(audit.interiorKinds) !== JSON.stringify(['chapel-nave', 'dining-hall', 'library-entrance'])) throw new Error(`Interior set is incomplete: ${JSON.stringify(audit.interiorKinds)}`);
  if (!audit.componentHierarchy || Object.keys(audit.componentHierarchy).length < 8) throw new Error('Academic component hierarchy is incomplete');
  if (!audit.optimization?.sharedGeometry || !audit.optimization?.sharedProceduralMaterials) throw new Error('Optimization metadata missing');
  if (audit.materialNames.length < 10) throw new Error(`Procedural material kit incomplete: ${audit.materialNames.length}`);
  if (audit.hiddenDetailCount < 6 || audit.hiddenPlanCount < 10) throw new Error(`Hidden detail coverage incomplete: ${audit.hiddenDetailCount}/${audit.hiddenPlanCount}`);
  if (!audit.gateMoved || audit.gateLeaves !== 2) throw new Error(`Main gate interaction failed: ${JSON.stringify(audit.gateResult)}`);
  if (!audit.lightsChanged || audit.readingLightMaterials < 1) throw new Error(`Reading light interaction failed: ${JSON.stringify(audit.lightResult)}`);
  if (audit.weather.some((entry) => !String(entry.weather).startsWith('academic-'))) throw new Error(`Academic weather preset failed: ${JSON.stringify(audit.weather)}`);
  if (audit.debugHelpers < 10 || audit.stats.visibleMeshes < 1_000) throw new Error(`Debug/statistics mode failed: ${JSON.stringify({ helpers: audit.debugHelpers, stats: audit.stats })}`);
  if (!historySaved) throw new Error('Editable history was not saved through the visible UI');
  if (!gateShot || !chapelShot || !diningShot || !canalShot) throw new Error('A required focused screenshot could not be staged');
  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ...audit,
    historySaved,
    screenshots: [
      `${outputDirectory}/campus-map.png`,
      `${outputDirectory}/gate-to-clock-tower-autumn.png`,
      `${outputDirectory}/chapel-nave.png`,
      `${outputDirectory}/dining-hall.png`,
      `${outputDirectory}/canal-foggy-night.png`,
    ],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
