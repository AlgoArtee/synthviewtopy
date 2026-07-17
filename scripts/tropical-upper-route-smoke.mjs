import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outputDirectory = process.env.TROPICAL_UPPER_OUTPUT_DIRECTORY ?? 'output/tropical-upper-route';
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
await page.waitForTimeout(900);
await page.click('.mode[data-mode="walk"]');
await page.waitForTimeout(150);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const controller = world.walkController;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  if (!dome) throw new Error('Tropical Rainforest Dome was unavailable');
  dome.updateMatrixWorld(true);
  controller.refreshNavigation();

  const canopy = [];
  const bridge = [];
  const cliff = [];
  dome.traverse((child) => {
    if (child.name === 'TROPICAL__ELEVATED_CANOPY_WALK') canopy.push(child);
    if (child.name === 'TROPICAL__SUSPENSION_BRIDGE') bridge.push(child);
    if (child.name === 'TROPICAL__WATERFALL_CLIFF') cliff.push(child);
  });
  const boundsOf = (object) => new world.selectionBounds.constructor().setFromObject(object, true);
  const canopyRockIntersections = [];
  canopy.forEach((segment, segmentIndex) => {
    const segmentBounds = boundsOf(segment);
    cliff.forEach((rock, rockIndex) => {
      if (segmentBounds.intersectsBox(boundsOf(rock))) canopyRockIntersections.push({ segmentIndex, rockIndex });
    });
  });

  const station = dome.getObjectByName('TROPICAL__RESEARCH_STATION');
  const stationBody = dome.getObjectByName('TROPICAL__RESEARCH_LAB_POD');
  if (!bridge.length || !station || !stationBody) throw new Error('Upper bridge or research viewpoint was unavailable');
  const stationCenter = station.getWorldPosition(world.camera.position.clone());
  const bridgeCenters = bridge.map((segment) => segment.getWorldPosition(world.camera.position.clone()));
  const finalBridgeCenter = bridgeCenters.at(-1);
  const entryDirection = finalBridgeCenter.clone().sub(stationCenter).setY(0).normalize();
  const stationEntryTarget = stationCenter.clone().addScaledVector(entryDirection, 1.35);
  const targets = [...bridgeCenters.slice(1), stationEntryTarget];
  const startGround = controller.sampleGround(bridgeCenters[0].x, bridgeCenters[0].z);
  if (startGround === null) throw new Error('Suspension bridge start had no WALK ground');
  world.camera.position.set(bridgeCenters[0].x, startGround + 0.162, bridgeCenters[0].z);
  controller.groundY = startGround;
  controller.grounded = true;
  const targetRemainingMetres = [];
  let maximumUngroundedSteps = 0;
  let ungroundedSteps = 0;
  for (const target of targets) {
    for (let step = 0; step < 50; step += 1) {
      const distance = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
      if (distance < 0.15) break;
      world.camera.lookAt(target.x, world.camera.position.y, target.z);
      controller.setMoveIntent(0, 1, true);
      world.advanceTime(70);
      if (controller.getSnapshot().grounded) ungroundedSteps = 0;
      else {
        ungroundedSteps += 1;
        maximumUngroundedSteps = Math.max(maximumUngroundedSteps, ungroundedSteps);
      }
    }
    targetRemainingMetres.push(Number((Math.hypot(
      target.x - world.camera.position.x,
      target.z - world.camera.position.z,
    ) * 10).toFixed(3)));
  }
  controller.setMoveIntent(0, 0, false);
  const finalSnapshot = controller.getSnapshot();
  const stationGround = controller.sampleGround(stationEntryTarget.x, stationEntryTarget.z);
  const finalPosition = world.camera.position.clone();

  const lastBridgeBounds = boundsOf(bridge.at(-1));
  const stationBounds = boundsOf(station);
  const bodyBounds = boundsOf(stationBody);
  const stationBodyCenter = stationBody.getWorldPosition(world.camera.position.clone());
  const stationBodySetbackMetres = Math.hypot(
    stationBodyCenter.x - stationCenter.x,
    stationBodyCenter.z - stationCenter.z,
  ) * 10;

  document.querySelectorAll('.atlas, .scene-card, .layerbar').forEach((element) => {
    element.setAttribute('style', 'display:none');
  });
  window.__tropicalUpperRouteView = {
    canopyCenter: canopy[Math.min(29, canopy.length - 2)].getWorldPosition(world.camera.position.clone()).toArray(),
    canopyLookAt: canopy.at(-1).getWorldPosition(world.camera.position.clone()).toArray(),
    stationCenter: stationCenter.toArray(),
    stationBodyCenter: stationBodyCenter.toArray(),
    finalBridgeCenter: finalBridgeCenter.toArray(),
  };
  return {
    canopySegmentCount: canopy.length,
    cliffRockCount: cliff.length,
    canopyRockIntersections,
    bridgeSegmentCount: bridge.length,
    bridgeTargetCount: targets.length,
    completedBridgeTargets: targetRemainingMetres.filter((remaining) => remaining < 2.2).length,
    targetRemainingMetres,
    maximumUngroundedSteps,
    finalGrounded: finalSnapshot.grounded,
    stationGround,
    lastBridgeTouchesStation: lastBridgeBounds.intersectsBox(stationBounds),
    lastBridgeTop: lastBridgeBounds.max.y,
    stationTop: stationBounds.max.y,
    stationBodyBottom: bodyBounds.min.y,
    stationPlatformTopClearanceToBody: bodyBounds.min.y - stationBounds.max.y,
    stationBodySetbackMetres: Number(stationBodySetbackMetres.toFixed(3)),
    finalPositionLocal: dome.worldToLocal(finalPosition.clone()).toArray().map((value) => Number(value.toFixed(3))),
    stationEntryTargetLocal: dome.worldToLocal(stationEntryTarget.clone()).toArray().map((value) => Number(value.toFixed(3))),
    stationGuardrailOpenings: station.userData.guardrailOpenings,
  };
});

if (audit.cliffRockCount !== 5) {
  throw new Error(`Expected only the five far-bank cliff rocks, found ${audit.cliffRockCount}`);
}
if (audit.canopyRockIntersections.length > 0) {
  throw new Error(`Canopy route still intersects cliff rocks: ${JSON.stringify(audit.canopyRockIntersections)}`);
}
if (audit.completedBridgeTargets !== audit.bridgeTargetCount) {
  throw new Error(`WALK stopped at ${audit.completedBridgeTargets}/${audit.bridgeTargetCount} upper-route targets`);
}
if (audit.maximumUngroundedSteps !== 0 || !audit.finalGrounded || audit.stationGround === null) {
  throw new Error('WALK did not remain grounded while entering the upper viewpoint');
}
if (!audit.lastBridgeTouchesStation || Math.abs(audit.lastBridgeTop - audit.stationTop) > 0.02) {
  throw new Error('Upper bridge is not flush with and overlapping the research platform');
}
if (audit.stationBodySetbackMetres < 6) {
  throw new Error(`Research pod still obstructs the viewpoint (${audit.stationBodySetbackMetres} m setback)`);
}
if (consoleErrors.length > 0) {
  throw new Error(`Browser console errors: ${consoleErrors.join('\n')}`);
}

await page.evaluate(() => {
  const world = window.labIsland;
  const controller = world.walkController;
  const view = window.__tropicalUpperRouteView;
  const position = new world.camera.position.constructor().fromArray(view.canopyCenter);
  const target = new world.camera.position.constructor().fromArray(view.canopyLookAt);
  const ground = controller.sampleGround(position.x, position.z);
  if (ground === null) throw new Error('Cleared canopy screenshot position had no WALK ground');
  world.camera.position.set(position.x, ground + 0.162, position.z);
  controller.groundY = ground;
  controller.grounded = true;
  world.camera.lookAt(target.x, target.y + 0.08, target.z);
  world.advanceTime(100);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/cleared-waterfall-walkway.png` });

await page.evaluate(() => {
  const world = window.labIsland;
  const controller = world.walkController;
  const view = window.__tropicalUpperRouteView;
  const center = new world.camera.position.constructor().fromArray(view.stationCenter);
  const body = new world.camera.position.constructor().fromArray(view.stationBodyCenter);
  const bridge = new world.camera.position.constructor().fromArray(view.finalBridgeCenter);
  const awayFromBody = center.clone().sub(body).setY(0).normalize();
  const position = center.clone().addScaledVector(awayFromBody, 0.035);
  const ground = controller.sampleGround(position.x, position.z);
  if (ground === null) throw new Error('Upper viewpoint screenshot position had no WALK ground');
  world.camera.position.set(position.x, ground + 0.162, position.z);
  controller.groundY = ground;
  controller.grounded = true;
  world.camera.lookAt(bridge.x, bridge.y + 0.08, bridge.z);
  world.advanceTime(100);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/research-viewpoint-walk.png` });
console.log(JSON.stringify({ audit, consoleErrors }, null, 2));
await browser.close();
