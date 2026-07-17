import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outputDirectory = process.env.TROPICAL_OUTPUT_DIRECTORY ?? 'output/tropical-dome';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('.mode[data-mode="explore"]', { state: 'visible', timeout: 30_000 });
await page.waitForTimeout(800);

const aimAtTropicalDome = async (localCamera, localTarget) => page.evaluate(({ localCamera, localTarget }) => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  if (!dome) throw new Error('Tropical Rainforest Dome was unavailable');
  dome.updateMatrixWorld(true);
  const cameraPosition = world.camera.position.clone().fromArray(localCamera).applyMatrix4(dome.matrixWorld);
  const target = world.controls.target.clone().fromArray(localTarget).applyMatrix4(dome.matrixWorld);
  world.setMode('explore');
  world.setDaylight(true);
  world.setWeather('clear');
  world.camera.position.copy(cameraPosition);
  world.controls.target.copy(target);
  world.controls.update();
  document.querySelector('.atlas')?.setAttribute('style', 'display:none');
  document.querySelector('.topbar')?.setAttribute('style', 'display:none');
  world.advanceTime(1800);
}, { localCamera, localTarget });

await aimAtTropicalDome([0, 10.5, 30], [0, 4.4, 0]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/front.png` });

await aimAtTropicalDome([0, 6.8, 24], [0, 2.3, 0.4]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/entry-and-pond.png` });

await aimAtTropicalDome([0, 2.45, 22], [0, 0.85, 15.1]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/airlock-close.png` });

await aimAtTropicalDome([0, 1.2, 13.65], [0, 0.84, 16.2]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/airlock-inside.png` });

await aimAtTropicalDome([2.2, 1.45, 13.5], [-3.8, 0.72, 10.7]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/canopy-entry.png` });

await aimAtTropicalDome([-23, 14, 20], [0, 4.2, -1]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/three-quarter.png` });

await aimAtTropicalDome([3.5, 6.2, 15.5], [-8.4, 2.65, 1.1]);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outputDirectory}/canopy-walk-close.png` });

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  const namedFeatures = [];
  const canopyWalkSegments = [];
  let meshCount = 0;
  dome?.traverse((child) => {
    if (child.isMesh) meshCount += 1;
    if (child.name.startsWith('TROPICAL__')) namedFeatures.push(child.name);
    if (child.name === 'TROPICAL__ELEVATED_CANOPY_WALK') canopyWalkSegments.push(child);
  });

  const worldBounds = (object) => {
    object.geometry.computeBoundingBox();
    return object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
  };
  const pond = dome?.getObjectByName('TROPICAL__WETLAND_POND');
  const pondBasin = dome?.getObjectByName('TROPICAL__WETLAND_BASIN');
  const biomeFloor = dome?.getObjectByName('tropical-rainforest-dome__BIOME_FLOOR');
  const airlockShell = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_SHELL');
  const airlockFrontLeft = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_FRONT_PANEL_LEFT');
  const airlockFrontRight = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_FRONT_PANEL_RIGHT');
  const airlockSideLeft = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_SIDE_WALL_LEFT');
  const airlockSideRight = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_SIDE_WALL_RIGHT');
  const airlockRoof = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_ROOF');
  const airlockFloor = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_FLOOR');
  const airlockDoor = dome?.getObjectByName('tropical-rainforest-dome__AIRLOCK_ENTRY_DOOR');
  const accessRamp = dome?.getObjectByName('tropical-rainforest-dome__ACCESS_RAMP');
  const transparentShell = dome?.getObjectByName('tropical-rainforest-dome__DOME_TRANSPARENT_SHELL');
  const domeWireframe = dome?.getObjectByName('tropical-rainforest-dome__DOME_WIREFRAME');
  const observationDeck = dome?.getObjectByName('TROPICAL__OBSERVATION_DECK');
  const observationDeckRails = [];
  const waterfallCliffs = [];
  const suspensionBridgeSegments = [];
  dome?.traverse((child) => {
    if (child.name === 'TROPICAL__OBSERVATION_DECK_RAIL') observationDeckRails.push(child);
    if (child.name === 'TROPICAL__WATERFALL_CLIFF') waterfallCliffs.push(child);
    if (child.name === 'TROPICAL__SUSPENSION_BRIDGE') suspensionBridgeSegments.push(child);
  });
  const pondBounds = pond?.isMesh ? worldBounds(pond) : null;
  const basinBounds = pondBasin?.isMesh ? worldBounds(pondBasin) : null;
  const floorBounds = biomeFloor?.isMesh ? worldBounds(biomeFloor) : null;
  const airlockParts = [airlockFrontLeft, airlockFrontRight, airlockSideLeft, airlockSideRight, airlockRoof];
  const shellPartBounds = airlockParts.filter((part) => part?.isMesh).map(worldBounds);
  const airlockFloorBounds = airlockFloor?.isMesh ? worldBounds(airlockFloor) : null;
  const observationDeckBounds = observationDeck?.isMesh ? worldBounds(observationDeck) : null;
  const lastCanopySegmentBounds = canopyWalkSegments.length ? worldBounds(canopyWalkSegments[canopyWalkSegments.length - 1]) : null;
  const firstBridgeSegmentBounds = suspensionBridgeSegments.length ? worldBounds(suspensionBridgeSegments[0]) : null;
  const deckRockIntersections = observationDeckBounds
    ? waterfallCliffs.filter((rock) => rock.isMesh && worldBounds(rock).intersectsBox(observationDeckBounds)).length
    : null;
  const openingWidth = airlockFrontLeft?.isMesh && airlockFrontRight?.isMesh
    ? (airlockFrontRight.position.x - airlockFrontRight.geometry.parameters.width * 0.5)
      - (airlockFrontLeft.position.x + airlockFrontLeft.geometry.parameters.width * 0.5)
    : null;
  const doorWidth = airlockDoor?.isMesh ? airlockDoor.geometry.parameters.width : null;

  world.walkController.refreshNavigation();
  const segmentAudit = canopyWalkSegments.map((segment) => {
    const position = world.camera.position.clone();
    const quaternion = world.camera.quaternion.clone();
    segment.getWorldPosition(position);
    segment.getWorldQuaternion(quaternion);
    const up = world.camera.up.clone().set(0, 1, 0).applyQuaternion(quaternion);
    const right = world.camera.up.clone().set(1, 0, 0).applyQuaternion(quaternion);
    return {
      position,
      upDot: up.dot(world.camera.up),
      crossSlope: Math.abs(right.y),
      ground: world.walkController.sampleGround(position.x, position.z),
      rollLocked: segment.userData.walkwayRollLocked === true,
    };
  });

  const canopyEntryRamp = canopyWalkSegments.find((segment) => segment.userData.canopyEntryRamp === true);
  const entryLocalStart = canopyEntryRamp?.userData.entryLocalStart ?? null;
  const entryWorldStart = entryLocalStart && dome
    ? world.camera.position.clone().fromArray(entryLocalStart).applyMatrix4(dome.matrixWorld)
    : null;
  const entryStartGround = entryWorldStart
    ? world.walkController.sampleGround(entryWorldStart.x, entryWorldStart.z)
    : null;
  const entryTargetCount = 7;
  let completedEntryTargets = 0;
  let entryMaximumUngroundedSteps = 0;
  let entryConsecutiveUngroundedSteps = 0;
  if (entryWorldStart && entryStartGround !== null) {
    world.setMode('walk');
    world.walkController.refreshNavigation();
    world.camera.position.set(entryWorldStart.x, entryStartGround + 0.162, entryWorldStart.z);
    world.walkController.groundY = entryStartGround;
    world.walkController.grounded = true;

    for (let index = 0; index < entryTargetCount; index += 1) {
      const target = segmentAudit[index].position;
      for (let step = 0; step < 30; step += 1) {
        const distance = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
        if (distance < 0.16) break;
        world.camera.lookAt(target.x, world.camera.position.y, target.z);
        world.setWalkIntent(0, 1, true);
        world.advanceTime(80);
        if (world.walkController.getSnapshot().grounded) {
          entryConsecutiveUngroundedSteps = 0;
        } else {
          entryConsecutiveUngroundedSteps += 1;
          entryMaximumUngroundedSteps = Math.max(entryMaximumUngroundedSteps, entryConsecutiveUngroundedSteps);
        }
      }
      const remaining = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
      if (remaining < 0.22) completedEntryTargets += 1;
    }
    world.setWalkIntent(0, 0);
  }
  const entryWalkSnapshot = world.walkController.getSnapshot();

  const startIndex = 14;
  const endIndex = 24;
  const start = segmentAudit[startIndex];
  let completedTargets = 0;
  let maximumUngroundedSteps = 0;
  let consecutiveUngroundedSteps = 0;
  if (start?.ground !== null && start?.ground !== undefined) {
    world.setMode('walk');
    world.walkController.refreshNavigation();
    world.camera.position.set(start.position.x, start.ground + 0.162, start.position.z);
    world.walkController.groundY = start.ground;
    world.walkController.grounded = true;

    for (let index = startIndex + 1; index <= endIndex; index += 1) {
      const target = segmentAudit[index].position;
      for (let step = 0; step < 26; step += 1) {
        const distance = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
        if (distance < 0.16) break;
        world.camera.lookAt(target.x, world.camera.position.y, target.z);
        world.setWalkIntent(0, 1, true);
        world.advanceTime(80);
        if (world.walkController.getSnapshot().grounded) {
          consecutiveUngroundedSteps = 0;
        } else {
          consecutiveUngroundedSteps += 1;
          maximumUngroundedSteps = Math.max(maximumUngroundedSteps, consecutiveUngroundedSteps);
        }
      }
      const remaining = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
      if (remaining < 0.22) completedTargets += 1;
    }
    world.setWalkIntent(0, 0);
  }
  const walkSnapshot = world.walkController.getSnapshot();

  const deckApproachStartIndex = Math.max(0, segmentAudit.length - 9);
  const deckWorldPosition = observationDeck?.getWorldPosition(world.camera.position.clone()) ?? null;
  const deckGround = deckWorldPosition
    ? world.walkController.sampleGround(deckWorldPosition.x, deckWorldPosition.z)
    : null;
  const deckTargets = [
    ...segmentAudit.slice(deckApproachStartIndex + 1).map((segment) => segment.position),
    ...(deckWorldPosition ? [deckWorldPosition] : []),
  ];
  let completedDeckTargets = 0;
  let deckMaximumUngroundedSteps = 0;
  let deckConsecutiveUngroundedSteps = 0;
  const deckApproachStart = segmentAudit[deckApproachStartIndex];
  if (deckApproachStart?.ground !== null && deckApproachStart?.ground !== undefined && deckGround !== null) {
    world.setMode('walk');
    world.walkController.refreshNavigation();
    world.camera.position.set(
      deckApproachStart.position.x,
      deckApproachStart.ground + 0.162,
      deckApproachStart.position.z,
    );
    world.walkController.groundY = deckApproachStart.ground;
    world.walkController.grounded = true;
    for (const target of deckTargets) {
      for (let step = 0; step < 42; step += 1) {
        const distance = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
        if (distance < 0.16) break;
        world.camera.lookAt(target.x, world.camera.position.y, target.z);
        world.setWalkIntent(0, 1, true);
        world.advanceTime(80);
        if (world.walkController.getSnapshot().grounded) {
          deckConsecutiveUngroundedSteps = 0;
        } else {
          deckConsecutiveUngroundedSteps += 1;
          deckMaximumUngroundedSteps = Math.max(deckMaximumUngroundedSteps, deckConsecutiveUngroundedSteps);
        }
      }
      const remaining = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
      if (remaining < 0.22) completedDeckTargets += 1;
    }
    world.setWalkIntent(0, 0);
  }
  const deckWalkSnapshot = world.walkController.getSnapshot();
  world.setMode('explore');

  return {
    meshCount,
    namedFeatures: [...new Set(namedFeatures)].sort(),
    canEnterInterior: world.canEnterInterior('tropical-rainforest-dome'),
    pondAndEntry: {
      pondPresent: Boolean(pondBounds),
      basinPresent: Boolean(basinBounds),
      pondVisible: pond?.visible ?? null,
      pondParentVisible: pond?.parent?.visible ?? null,
      pondMaterialVisible: pond?.isMesh ? pond.material.visible : null,
      pondMaterialColor: pond?.isMesh ? `#${pond.material.color.getHexString()}` : null,
      pondWorldPosition: pond?.isMesh ? pond.getWorldPosition(world.camera.position.clone()).toArray() : null,
      pondWorldBounds: pondBounds ? { min: pondBounds.min.toArray(), max: pondBounds.max.toArray() } : null,
      basinWorldBounds: basinBounds ? { min: basinBounds.min.toArray(), max: basinBounds.max.toArray() } : null,
      domeWorldPosition: dome ? dome.getWorldPosition(world.camera.position.clone()).toArray() : null,
      pondClearanceAboveFloor: pondBounds && floorBounds ? pondBounds.max.y - floorBounds.max.y : null,
      basinTopAboveFloor: basinBounds && floorBounds ? basinBounds.max.y - floorBounds.max.y : null,
      airlockShellPresent: Boolean(airlockShell && shellPartBounds.length === airlockParts.length),
      airlockShellBottomAboveFloor: shellPartBounds.length && floorBounds
        ? Math.min(...shellPartBounds.map((bounds) => bounds.min.y)) - floorBounds.max.y
        : null,
      airlockFloorTopAboveBiomeFloor: airlockFloorBounds && floorBounds ? airlockFloorBounds.max.y - floorBounds.max.y : null,
      doorExteriorOffset: airlockDoor && airlockShell ? airlockDoor.position.z - airlockShell.position.z : null,
      doorDoubleSided: airlockDoor?.isMesh ? airlockDoor.material.side === 2 : false,
      doorwayOpeningWidth: openingWidth,
      doorWidth,
      doorwayClearance: openingWidth !== null && doorWidth !== null ? openingWidth - doorWidth : null,
      rampInnerEdgeOffset: accessRamp && airlockShell
        ? accessRamp.position.z - accessRamp.geometry.parameters.depth * 0.5 - airlockShell.position.z
        : null,
    },
    domeExterior: {
      transparentShellPresent: Boolean(transparentShell?.isMesh),
      shellTransparent: transparentShell?.isMesh ? transparentShell.material.transparent : null,
      shellOpacity: transparentShell?.isMesh ? transparentShell.material.opacity : null,
      wireframePresent: Boolean(domeWireframe?.isMesh),
      wireframeEnabled: domeWireframe?.isMesh ? domeWireframe.material.wireframe : null,
      wireframeColor: domeWireframe?.isMesh ? `#${domeWireframe.material.color.getHexString()}` : null,
      wireframeOpacity: domeWireframe?.isMesh ? domeWireframe.material.opacity : null,
    },
    canopyWalk: {
      segmentCount: segmentAudit.length,
      rollLockedCount: segmentAudit.filter((segment) => segment.rollLocked).length,
      sampledGroundCount: segmentAudit.filter((segment) => segment.ground !== null).length,
      minimumUpDot: Math.min(...segmentAudit.map((segment) => segment.upDot)),
      maximumCrossSlope: Math.max(...segmentAudit.map((segment) => segment.crossSlope)),
      entryRampPresent: Boolean(canopyEntryRamp),
      entryToeRiseAboveBiomeFloor: entryWorldStart && floorBounds
        ? entryWorldStart.y - floorBounds.max.y
        : null,
      entryToeGround: entryStartGround,
      completedEntryTargets,
      expectedEntryTargets: entryTargetCount,
      entryMaximumUngroundedSteps,
      entryFinalGrounded: entryWalkSnapshot.grounded,
      completedMiddleTargets: completedTargets,
      expectedMiddleTargets: endIndex - startIndex,
      maximumUngroundedSteps,
      finalGrounded: walkSnapshot.grounded,
      observationDeckPresent: Boolean(observationDeckBounds),
      observationDeckRailArcCount: observationDeckRails.length,
      observationDeckOpeningCount: observationDeck?.userData.guardrailOpenings?.length ?? 0,
      observationDeckTouchesCanopyWalk: Boolean(observationDeckBounds && lastCanopySegmentBounds?.intersectsBox(observationDeckBounds)),
      observationDeckTouchesSuspensionBridge: Boolean(observationDeckBounds && firstBridgeSegmentBounds?.intersectsBox(observationDeckBounds)),
      observationDeckRockIntersections: deckRockIntersections,
      completedDeckTargets,
      expectedDeckTargets: deckTargets.length,
      deckMaximumUngroundedSteps,
      deckFinalGrounded: deckWalkSnapshot.grounded,
      deckGround,
    },
    textState: JSON.parse(window.render_game_to_text()),
  };
});

await page.evaluate(() => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  const deck = dome?.getObjectByName('TROPICAL__OBSERVATION_DECK');
  const segments = [];
  dome?.traverse((child) => {
    if (child.name === 'TROPICAL__ELEVATED_CANOPY_WALK') segments.push(child);
  });
  if (!dome || !deck || segments.length < 5) throw new Error('Observation-deck WALK screenshot setup failed');
  world.setMode('walk');
  world.walkController.refreshNavigation();
  const viewpoint = segments[segments.length - 5].getWorldPosition(world.camera.position.clone());
  const target = deck.getWorldPosition(world.controls.target.clone());
  const ground = world.walkController.sampleGround(viewpoint.x, viewpoint.z);
  if (ground === null) throw new Error('Observation-deck WALK screenshot viewpoint has no ground');
  world.camera.position.set(viewpoint.x, ground + 0.162, viewpoint.z);
  world.camera.lookAt(target.x, target.y + 0.15, target.z);
  world.walkController.groundY = ground;
  world.walkController.grounded = true;
  document.querySelectorAll('#scene-card, .layerbar, .compass, .interaction-hint').forEach((element) => {
    element.setAttribute('style', 'display:none');
  });
  world.advanceTime(250);
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${outputDirectory}/observation-deck-walk.png` });
await page.evaluate(() => window.labIsland.setMode('explore'));

if (process.env.TROPICAL_DIAGNOSTIC === '1') {
  await page.evaluate(() => {
    const world = window.labIsland;
    const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
    const keep = new Set(['TROPICAL__WETLAND_POND', 'TROPICAL__WETLAND_BASIN']);
    dome?.traverse((child) => {
      if (child.isMesh || child.isLine || child.isLineSegments) child.visible = keep.has(child.name);
    });
    const pond = dome?.getObjectByName('TROPICAL__WETLAND_POND');
    const basin = dome?.getObjectByName('TROPICAL__WETLAND_BASIN');
    for (const object of [pond, basin]) {
      if (!object?.isMesh) continue;
      object.frustumCulled = false;
      object.renderOrder = 999;
      object.material.depthTest = false;
    }
    dome?.updateMatrixWorld(true);
    if (!dome) return;
    const cameraPosition = world.camera.position.clone().set(0, 6.8, 24).applyMatrix4(dome.matrixWorld);
    const target = world.controls.target.clone().set(0, 0.4, -0.5).applyMatrix4(dome.matrixWorld);
    world.camera.position.copy(cameraPosition);
    world.controls.target.copy(target);
    world.controls.update();
    world.advanceTime(160);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outputDirectory}/pond-isolation.png` });
}

const requiredFeatures = [
  'TROPICAL__WATERFALL',
  'TROPICAL__WINDING_STREAM',
  'TROPICAL__WETLAND_POND',
  'TROPICAL__ELEVATED_CANOPY_WALK',
  'TROPICAL__OBSERVATION_DECK',
  'TROPICAL__SUSPENSION_BRIDGE',
  'TROPICAL__RESEARCH_STATION',
  'TROPICAL__PLANT_NURSERY_GREENHOUSE',
  'TROPICAL__CLIMATE_CONTROL_RING',
  'TROPICAL__MISTING_RAIN',
];
const missingFeatures = requiredFeatures.filter((feature) => !audit.namedFeatures.includes(feature));
if (missingFeatures.length) throw new Error(`Missing tropical dome features: ${missingFeatures.join(', ')}`);
if (!audit.canEnterInterior) throw new Error('Tropical dome interior editing is unavailable');
if (!audit.pondAndEntry.pondPresent || !audit.pondAndEntry.basinPresent) throw new Error('Wetland pond or basin is missing');
if (audit.pondAndEntry.pondClearanceAboveFloor < 0.045) throw new Error('Wetland pond remains buried in the biome floor');
if (audit.pondAndEntry.basinTopAboveFloor < 0.04) throw new Error('Wetland basin remains buried in the biome floor');
if (!audit.pondAndEntry.airlockShellPresent) throw new Error('Dome airlock shell is missing');
if (audit.pondAndEntry.airlockShellBottomAboveFloor < -0.01) throw new Error('Dome airlock shell remains buried in the biome floor');
if (audit.pondAndEntry.airlockFloorTopAboveBiomeFloor < 0.02) throw new Error('Dome airlock floor remains cut by the biome floor');
if (audit.pondAndEntry.doorExteriorOffset < 0.6) throw new Error('Dome airlock door remains hidden inside its shell');
if (!audit.pondAndEntry.doorDoubleSided) throw new Error('Dome airlock door is not visible from both sides');
if (audit.pondAndEntry.doorwayClearance < 0.14) throw new Error('Dome airlock facade does not leave a clear doorway opening');
if (audit.pondAndEntry.rampInnerEdgeOffset < 0.59) throw new Error('Dome access ramp remains cut into its airlock shell');
if (!audit.domeExterior.transparentShellPresent || !audit.domeExterior.shellTransparent || audit.domeExterior.shellOpacity > 0.11) {
  throw new Error('Tropical dome shell is not transparent');
}
if (!audit.domeExterior.wireframePresent || !audit.domeExterior.wireframeEnabled || audit.domeExterior.wireframeColor !== '#2ee878') {
  throw new Error(`Tropical dome wireframe is not green: ${JSON.stringify(audit.domeExterior)}`);
}
if (audit.canopyWalk.segmentCount !== 38) throw new Error(`Expected 38 canopy-walk segments, found ${audit.canopyWalk.segmentCount}`);
if (audit.canopyWalk.rollLockedCount !== audit.canopyWalk.segmentCount) throw new Error('Not every canopy-walk segment has a stable roll frame');
if (audit.canopyWalk.sampledGroundCount !== audit.canopyWalk.segmentCount) throw new Error('Not every canopy-walk segment is detected as walkable ground');
if (audit.canopyWalk.maximumCrossSlope > 0.001) throw new Error(`Canopy walk still banks sideways by ${audit.canopyWalk.maximumCrossSlope}`);
if (!audit.canopyWalk.entryRampPresent || audit.canopyWalk.entryToeRiseAboveBiomeFloor > 0.1) throw new Error('Canopy-walk ramp toe remains too high above the biome floor');
if (audit.canopyWalk.entryToeGround === null) throw new Error('Canopy-walk ramp toe has no walkable ground');
if (audit.canopyWalk.completedEntryTargets !== audit.canopyWalk.expectedEntryTargets) throw new Error('Walk controller could not climb the canopy-walk entry ramp');
if (audit.canopyWalk.entryMaximumUngroundedSteps > 0 || !audit.canopyWalk.entryFinalGrounded) throw new Error('Walk controller lost grounding on the canopy-walk entry ramp');
if (audit.canopyWalk.completedMiddleTargets !== audit.canopyWalk.expectedMiddleTargets) throw new Error('Walk controller could not traverse the canopy walk middle section');
if (audit.canopyWalk.maximumUngroundedSteps > 0 || !audit.canopyWalk.finalGrounded) throw new Error('Walk controller lost grounding on the canopy walk');
if (!audit.canopyWalk.observationDeckPresent) throw new Error('Observation deck is missing');
if (audit.canopyWalk.observationDeckOpeningCount !== 2 || audit.canopyWalk.observationDeckRailArcCount < 2) throw new Error('Observation deck guardrail openings are incomplete');
if (!audit.canopyWalk.observationDeckTouchesCanopyWalk || !audit.canopyWalk.observationDeckTouchesSuspensionBridge) throw new Error('Observation deck has a gap to an attached walkway');
if (audit.canopyWalk.observationDeckRockIntersections !== 0) throw new Error('Waterfall cliff still intersects the observation deck');
if (audit.canopyWalk.completedDeckTargets !== audit.canopyWalk.expectedDeckTargets) {
  throw new Error(`Walk controller reached ${audit.canopyWalk.completedDeckTargets}/${audit.canopyWalk.expectedDeckTargets} observation-deck targets`);
}
if (audit.canopyWalk.deckMaximumUngroundedSteps > 0 || !audit.canopyWalk.deckFinalGrounded || audit.canopyWalk.deckGround === null) throw new Error('Walk controller lost grounding at the observation deck');
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify({ audit, consoleErrors }, null, 2));
await browser.close();
