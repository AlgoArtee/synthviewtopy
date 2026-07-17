import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outputDirectory = process.env.WORLD_SCALE_OUTPUT_DIRECTORY ?? 'output/world-scale-city';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('.mode[data-mode="walk"]', { state: 'visible', timeout: 30_000 });
await page.waitForTimeout(1_100);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  world.setDaylight(true);
  world.advanceTime(2_000);
  const pond = world.scene.getObjectByName('TROPICAL__WETLAND_POND');
  const basin = world.scene.getObjectByName('TROPICAL__WETLAND_BASIN');
  const mainland = world.scene.getObjectByName('WORLD_END__CYBER_CITY_MAINLAND');
  const seaWall = world.scene.getObjectByName('WORLD_END__CYBER_CITY_SEAWALL');
  const ocean = world.scene.getObjectByName('Animated ocean surface (presentation)');
  const sky = world.scene.getObjectByName('Atmospheric sky (presentation)');
  const plantedSurface = world.scene.getObjectByName('Island planted surface');
  if (!pond || !basin || !mainland || !seaWall || !ocean || !sky || !plantedSurface) {
    throw new Error('One or more world-scale validation features were unavailable');
  }
  const box = new world.selectionBounds.constructor().setFromObject(plantedSurface, true);
  const pondMaterial = pond.material;
  const mainlandBounds = new world.selectionBounds.constructor().setFromObject(mainland, true);
  const districtRadii = Object.fromEntries(
    ['inner', 'middle', 'outer-middle', 'outer', 'perimeter'].map((ring) => [
      ring,
      [...world.objectGroups.entries()]
        .filter(([id]) => world.definitions.get(id)?.ring === ring)
        .map(([, group]) => Number(Math.hypot(group.position.x, group.position.z).toFixed(3))),
    ]),
  );
  const biomeRadii = [...world.objectGroups.entries()]
    .filter(([id]) => world.definitions.get(id)?.category === 'biome')
    .map(([, group]) => Number(Math.hypot(group.position.x, group.position.z).toFixed(3)));
  const textState = JSON.parse(window.render_game_to_text());
  const migrationProbeId = 'toxicology-labs';
  const migrationDefinition = world.definitions.get(migrationProbeId);
  const migrationState = world.getObjectState(migrationProbeId);
  const expectedMigratedPosition = world.objectGroups.get(migrationProbeId).position.clone();
  const migrationLoaded = world.loadProject({
    schema: 'youtopy.lab-island/1.0',
    objects: [{
      id: migrationProbeId,
      accent: migrationDefinition.accent,
      state: {
        ...migrationState,
        position: {
          x: migrationState.position.x * 0.5,
          y: migrationState.position.y,
          z: migrationState.position.z * 0.5,
        },
      },
    }],
  });
  const migratedPosition = world.objectGroups.get(migrationProbeId).position;
  document.querySelectorAll('.atlas, .scene-card, .layerbar').forEach((element) => {
    element.setAttribute('style', 'display:none');
  });
  return {
    textMasterplan: textState.masterplan,
    islandBounds: {
      width: Number((box.max.x - box.min.x).toFixed(3)),
      depth: Number((box.max.z - box.min.z).toFixed(3)),
    },
    districtRadii,
    districtRoadRadii: world.transitRoot.userData.masterplan.districtRoadRadii,
    biomeRadii,
    pond: {
      depthTest: pondMaterial.depthTest,
      depthWrite: pondMaterial.depthWrite,
      transparent: pondMaterial.transparent,
      opacity: pondMaterial.opacity,
      renderOrder: pond.renderOrder,
      clearanceAboveBasin: Number((pond.position.y - basin.position.y).toFixed(3)),
    },
    city: {
      skylineLength: world.cityRoot.userData.skylineLength,
      skylineArcDegrees: world.cityRoot.userData.skylineArcDegrees,
      oceanBeyondCity: world.cityRoot.userData.oceanBeyondCity,
      worldBoundary: world.cityRoot.userData.worldBoundary,
      bridgeheadTowerCount: world.cityRoot.userData.bridgeheadTowerCount,
      horizonTowerCount: world.cityRoot.userData.horizonTowerCount,
      towerCount: world.cityRoot.userData.towerCount,
      worldBoundaryOuterRadius: world.cityRoot.userData.worldBoundaryOuterRadius,
      mainlandOuterRadius: Number(Math.max(
        Math.hypot(mainlandBounds.min.x, mainlandBounds.min.z),
        Math.hypot(mainlandBounds.max.x, mainlandBounds.max.z),
      ).toFixed(1)),
      seaWallInstances: seaWall.count,
    },
    presentation: {
      oceanWidth: ocean.geometry.parameters.width,
      skyRadius: sky.geometry.parameters.radius,
      cameraFar: world.camera.far,
    },
    savedLayoutMigration: {
      loaded: migrationLoaded,
      positionDelta: Number(migratedPosition.distanceTo(expectedMigratedPosition).toFixed(6)),
    },
  };
});

const close = (actual, expected, tolerance = 0.02) => Math.abs(actual - expected) <= tolerance;
if (audit.textMasterplan.worldExpansion !== 6 || audit.textMasterplan.islandRadiusWorldUnits !== 552) {
  throw new Error(`Unexpected masterplan scale: ${JSON.stringify(audit.textMasterplan)}`);
}
if (!close(audit.islandBounds.width, 922.634, 0.1) || !close(audit.islandBounds.depth, 1065.36, 0.2)) {
  throw new Error(`Island footprint was not doubled: ${JSON.stringify(audit.islandBounds)}`);
}
if (audit.biomeRadii.length !== 6 || audit.biomeRadii.some((radius) => !close(radius, 456, 0.05))) {
  throw new Error(`Biome ring was not doubled: ${JSON.stringify(audit.biomeRadii)}`);
}
const expectedDistrictRadii = {
  inner: 105,
  middle: 151.2,
  'outer-middle': 208.2,
  outer: 274.2,
  perimeter: 380,
};
for (const [ring, expectedRadius] of Object.entries(expectedDistrictRadii)) {
  const radii = audit.districtRadii[ring];
  if (!radii.length || radii.some((radius) => !close(radius, expectedRadius, 0.05))) {
    throw new Error(`District ring ${ring} was not doubled: ${JSON.stringify(radii)}`);
  }
}
if (JSON.stringify(audit.districtRoadRadii) !== JSON.stringify([84, 126, 177, 240, 309])) {
  throw new Error(`Road radii were not doubled: ${JSON.stringify(audit.districtRoadRadii)}`);
}
if (!audit.pond.depthTest || !audit.pond.depthWrite || audit.pond.renderOrder !== 0) {
  throw new Error(`Pond still bypasses scene depth: ${JSON.stringify(audit.pond)}`);
}
if (
  audit.city.skylineArcDegrees < 180
  || audit.city.oceanBeyondCity !== false
  || audit.city.worldBoundary !== true
  || audit.city.towerCount < 500
  || audit.city.seaWallInstances < 100
  || audit.city.worldBoundaryOuterRadius < 2_550
) {
  throw new Error(`City world boundary is incomplete: ${JSON.stringify(audit.city)}`);
}
if (audit.presentation.oceanWidth < 3600 || audit.presentation.skyRadius < 2800 || audit.presentation.cameraFar < 3600) {
  throw new Error(`Presentation envelope is too small: ${JSON.stringify(audit.presentation)}`);
}
if (!audit.savedLayoutMigration.loaded || audit.savedLayoutMigration.positionDelta > 0.001) {
  throw new Error(`Legacy saved layout did not migrate to the 2x masterplan: ${JSON.stringify(audit.savedLayoutMigration)}`);
}
if (consoleErrors.length > 0) throw new Error(`Browser console errors: ${consoleErrors.join('\n')}`);

await page.click('.mode[data-mode="walk"]');
await page.waitForTimeout(120);
await page.evaluate(() => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  const pond = dome.getObjectByName('TROPICAL__WETLAND_POND');
  const station = dome.getObjectByName('TROPICAL__RESEARCH_STATION');
  const position = station.getWorldPosition(world.camera.position.clone());
  const pondCenter = pond.getWorldPosition(world.camera.position.clone());
  const pondDirection = pondCenter.clone().sub(position).setY(0).normalize();
  position.addScaledVector(pondDirection, 1.58);
  world.walkController.refreshNavigation();
  const sampledGround = world.walkController.sampleGround(position.x, position.z);
  const stationBounds = new world.selectionBounds.constructor().setFromObject(station, true);
  const ground = sampledGround ?? stationBounds.max.y;
  world.camera.position.set(position.x, ground + 0.162, position.z);
  world.walkController.groundY = ground;
  world.walkController.grounded = true;
  // Aim above the water so the platform edge and guardrail remain in frame
  // while the pond sits below them as real, depth-tested scene geometry.
  world.camera.lookAt(pondCenter.x, pondCenter.y + 1.3, pondCenter.z);
  world.advanceTime(120);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/pond-depth-walk.png` });

await page.click('.mode[data-mode="explore"]');
await page.waitForTimeout(120);
await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.fov = 48;
  world.camera.position.set(-40, 42, 210);
  const cityCenter = world.cityRoot.userData.cityCenter;
  world.controls.target.set(cityCenter[0] * 0.72, 22, cityCenter[2] * 0.72);
  world.camera.lookAt(world.controls.target);
  world.camera.updateProjectionMatrix();
  world.controls.update();
  world.advanceTime(180);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/city-world-boundary.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.fov = 44;
  world.camera.position.set(0, 1_240, 1_520);
  world.controls.target.set(0, 0, -170);
  world.camera.lookAt(world.controls.target);
  world.camera.updateProjectionMatrix();
  world.controls.update();
  world.advanceTime(180);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/double-island-overview.png` });

console.log(JSON.stringify({ audit, consoleErrors }, null, 2));
await browser.close();
