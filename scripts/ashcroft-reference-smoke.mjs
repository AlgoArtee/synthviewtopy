import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const ASHCROFT_ID = 'academic-building-ashcroft-grand-library';
const DEFAULT_INSCRIPTION = 'CEREBRUM EXTERNUM · FOUNDED MDXII';
const EDITED_INSCRIPTION = 'BIBLIOTHECA ASHCROFTIANA · MDXII';

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

async function waitForWorld() {
  await page.waitForFunction(
    (id) => Boolean(window.labIsland?.getDefinition(id)),
    ASHCROFT_ID,
    { timeout: 60_000 },
  );
}

async function frameAshcroft() {
  await page.evaluate((id) => {
    const world = window.labIsland;
    const building = world.objectGroups.get(id);
    if (!building) throw new Error('Ashcroft scene group is missing');
    world.setMode('explore');
    building.updateWorldMatrix(true, true);
    const target = building.localToWorld(world.camera.position.clone().set(0, 4.0, 4.45));
    const cameraPosition = building.localToWorld(world.camera.position.clone().set(0, 4.65, 12.5));
    world.cameraTween = null;
    world.camera.position.copy(cameraPosition);
    world.controls.target.copy(target);
    world.camera.fov = 60;
    world.camera.updateProjectionMatrix();
    world.controls.update();
    world.clearSelection('system');
    world.advanceTime(1200);
  }, ASHCROFT_ID);
  await page.waitForTimeout(250);
}

try {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('youtopy_saved_project'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitForWorld();

  await page.locator('.mode[data-mode="edit"]').click();
  await page.locator(`[data-id="${ASHCROFT_ID}"]`).click();

  const initialAudit = await page.evaluate((id) => {
    const world = window.labIsland;
    const definition = world.getDefinition(id);
    const group = world.objectGroups.get(id);
    const counts = { facade: 0, lancets: 0, turrets: 0, spires: 0, orangeLights: 0, inscriptionSurfaces: 0 };
    let inscriptionTextureUuid = null;
    group?.traverse((object) => {
      if (object.userData.academicReferenceFacade === true) counts.facade += 1;
      if (object.name === 'ACADEMIC__ASHCROFT_TRACERIED_AMBER_WINDOW') counts.lancets += 1;
      if (object.name === 'ACADEMIC__ASHCROFT_OCTAGONAL_STAIR_TURRET') counts.turrets += 1;
      if (object.name === 'ACADEMIC__ASHCROFT_CROCKETED_TURRET_SPIRE') counts.spires += 1;
      if (object.userData.academicNightOrangeLight === true && object.isLight) counts.orangeLights += 1;
      if (object.userData.academicInscriptionSurface === true) {
        counts.inscriptionSurfaces += 1;
        inscriptionTextureUuid = object.material?.map?.uuid ?? null;
      }
    });
    return {
      definition,
      counts,
      referenceStyle: group?.userData.ashcroftReferenceStyle ?? null,
      inscription: group?.userData.academicInscription ?? null,
      inscriptionTextureUuid,
      fieldHidden: document.querySelector('#object-inscription-field')?.hidden ?? true,
      inputValue: document.querySelector('#object-inscription')?.value ?? null,
    };
  }, ASHCROFT_ID);

  if (initialAudit.definition?.inscription !== DEFAULT_INSCRIPTION
    || initialAudit.inscription !== DEFAULT_INSCRIPTION
    || initialAudit.inputValue !== DEFAULT_INSCRIPTION
    || initialAudit.fieldHidden
    || initialAudit.counts.facade !== 1
    || initialAudit.counts.lancets !== 4
    || initialAudit.counts.turrets !== 2
    || initialAudit.counts.spires !== 2
    || initialAudit.counts.orangeLights !== 3
    || initialAudit.counts.inscriptionSurfaces !== 1
    || initialAudit.referenceStyle?.automaticNightLighting !== true) {
    throw new Error(`Ashcroft reference build audit failed: ${JSON.stringify(initialAudit, null, 2)}`);
  }

  await page.locator('#object-inscription').fill(EDITED_INSCRIPTION);
  await page.locator('#save-inspector-changes').click();
  const editedAudit = await page.evaluate(({ id, previousUuid }) => {
    const world = window.labIsland;
    const definition = world.getDefinition(id);
    const group = world.objectGroups.get(id);
    let surfaceInscription = null;
    let textureUuid = null;
    group?.traverse((object) => {
      if (object.userData.academicInscriptionSurface !== true) return;
      surfaceInscription = object.userData.academicInscription;
      textureUuid = object.material?.map?.uuid ?? null;
    });
    const saved = JSON.parse(localStorage.getItem('youtopy_saved_project') ?? '{}');
    return {
      definitionInscription: definition?.inscription ?? null,
      groupInscription: group?.userData.academicInscription ?? null,
      surfaceInscription,
      textureChanged: Boolean(textureUuid && textureUuid !== previousUuid),
      savedInscription: saved.objects?.find((object) => object.id === id)?.inscription ?? null,
    };
  }, { id: ASHCROFT_ID, previousUuid: initialAudit.inscriptionTextureUuid });
  if (Object.values(editedAudit).some((value) => value === false)
    || editedAudit.definitionInscription !== EDITED_INSCRIPTION
    || editedAudit.groupInscription !== EDITED_INSCRIPTION
    || editedAudit.surfaceInscription !== EDITED_INSCRIPTION
    || editedAudit.savedInscription !== EDITED_INSCRIPTION) {
    throw new Error(`Editable inscription audit failed: ${JSON.stringify(editedAudit, null, 2)}`);
  }

  await page.reload({ waitUntil: 'networkidle' });
  await waitForWorld();
  const reloadedInscription = await page.evaluate((id) => window.labIsland.getDefinition(id)?.inscription ?? null, ASHCROFT_ID);
  if (reloadedInscription !== EDITED_INSCRIPTION) throw new Error(`Inscription did not survive reload: ${reloadedInscription}`);

  await page.evaluate(({ id, inscription }) => {
    const world = window.labIsland;
    const definition = world.getDefinition(id);
    world.setObjectMetadata(id, {
      name: definition.name,
      label: definition.label ?? definition.name,
      description: definition.description,
      inscription,
    });
    localStorage.removeItem('youtopy_saved_project');
  }, { id: ASHCROFT_ID, inscription: DEFAULT_INSCRIPTION });

  await fs.mkdir('output/playwright', { recursive: true });
  await page.addStyleTag({ content: `
    .topbar, .atlas, .inspector, .scene-card, .layerbar,
    .mode-switch, .toast-region, .walk-hud { display: none !important; }
  ` });

  await page.evaluate(() => {
    window.labIsland.setWeather('academic-overcast');
    window.labIsland.setTimeOfDay('noon');
  });
  await frameAshcroft();
  const daylightAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const group = world.objectGroups.get('academic-building-ashcroft-grand-library');
    const emissive = [];
    const lights = [];
    group?.traverse((object) => {
      if (object.userData.academicNightOrangeLight !== true) return;
      if (object.isLight) lights.push({ visible: object.visible, intensity: object.intensity });
      else if (object.material?.emissiveIntensity !== undefined) emissive.push(object.material.emissiveIntensity);
    });
    return { snapshot: world.getTextSnapshot(), emissive, lights };
  });
  if (daylightAudit.snapshot.academicDistrict.ashcroftNightLightsOn
    || daylightAudit.lights.some((light) => light.visible || light.intensity > 0)
    || daylightAudit.emissive.some((value) => value > 0.05)) {
    throw new Error(`Daylight light state is incorrect: ${JSON.stringify(daylightAudit, null, 2)}`);
  }
  await page.screenshot({ path: 'output/playwright/ashcroft-reference-day.png' });

  await page.evaluate(() => {
    window.labIsland.setWeather('academic-rainy-dusk');
    window.labIsland.setTimeOfDay('night');
  });
  await frameAshcroft();
  const nightAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const group = world.objectGroups.get('academic-building-ashcroft-grand-library');
    const emissive = [];
    const lights = [];
    group?.traverse((object) => {
      if (object.userData.academicNightOrangeLight !== true) return;
      if (object.isLight) lights.push({ visible: object.visible, intensity: object.intensity });
      else if (object.material?.emissiveIntensity !== undefined) emissive.push(object.material.emissiveIntensity);
    });
    return { snapshot: world.getTextSnapshot(), emissive, lights };
  });
  if (!nightAudit.snapshot.academicDistrict.ashcroftNightLightsOn
    || nightAudit.lights.length !== 3
    || nightAudit.lights.some((light) => !light.visible || light.intensity <= 0)
    || nightAudit.emissive.some((value) => value < 2)) {
    throw new Error(`Night light state is incorrect: ${JSON.stringify(nightAudit, null, 2)}`);
  }
  await page.screenshot({ path: 'output/playwright/ashcroft-reference-night.png' });

  if (consoleErrors.length) throw new Error(`Browser errors: ${consoleErrors.join('\n')}`);
  console.log(JSON.stringify({
    referenceBuild: initialAudit.counts,
    palette: initialAudit.referenceStyle.palette,
    inscription: { editable: true, savedAndReloaded: true, restoredDefault: DEFAULT_INSCRIPTION },
    daylight: { automaticOrangeLights: daylightAudit.snapshot.academicDistrict.ashcroftNightLightsOn },
    night: { automaticOrangeLights: nightAudit.snapshot.academicDistrict.ashcroftNightLightsOn, pointLights: nightAudit.lights.length },
    screenshots: ['output/playwright/ashcroft-reference-day.png', 'output/playwright/ashcroft-reference-night.png'],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
