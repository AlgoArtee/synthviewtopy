import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_CANAL_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_CANAL_OUTPUT ?? 'output/academic-canal-river';
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
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 });
  await page.waitForTimeout(1_000);

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    const canal = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__BLACKWATER_CANAL_EDGE');
    const water = district.getObjectByName('ACADEMIC__BLACKWATER_CANAL');
    const bridge = district.getObjectByName('ACADEMIC__ARCHED_PEDESTRIAN_BRIDGE');
    const boathouse = district.children.find((child) => child.userData.semanticName === 'Blackwater Rowing House');
    if (!canal || !water?.isMesh || !bridge || !boathouse) throw new Error('Canal, bridge, water, or Rowing House missing');

    district.updateMatrixWorld(true);
    const vector = () => world.camera.position.clone().set(0, 0, 0);
    const objectBounds = (root) => {
      const minimum = vector().set(Infinity, Infinity, Infinity);
      const maximum = vector().set(-Infinity, -Infinity, -Infinity);
      root.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) {
          for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
              const corner = vector().set(x, y, z).applyMatrix4(object.matrixWorld);
              minimum.min(corner);
              maximum.max(corner);
            }
          }
        }
      });
      return { minimum, maximum };
    };
    const horizontalDistanceToBounds = (point, bounds) => {
      const dx = Math.max(bounds.minimum.x - point.x, 0, point.x - bounds.maximum.x);
      const dz = Math.max(bounds.minimum.z - point.z, 0, point.z - bounds.maximum.z);
      return Math.hypot(dx, dz);
    };
    const horizontalBoundsGap = (left, right) => {
      const dx = Math.max(left.minimum.x - right.maximum.x, right.minimum.x - left.maximum.x, 0);
      const dz = Math.max(left.minimum.z - right.maximum.z, right.minimum.z - left.maximum.z, 0);
      return Math.hypot(dx, dz);
    };

    const boathouseBounds = objectBounds(boathouse);
    const bridgeBounds = objectBounds(bridge);
    const metadata = canal.userData.academicCanal;
    const centerlineWorld = metadata.centerline.map((point) => canal.localToWorld(vector().fromArray(point)));
    const minimumCenterlineDistance = Math.min(...centerlineWorld.map((point) => horizontalDistanceToBounds(point, boathouseBounds)));
    const waterClearance = minimumCenterlineDistance - metadata.waterWidth * 0.5;
    const bankClearance = minimumCenterlineDistance - metadata.bankOuterWidth * 0.5;
    const bridgeClearance = horizontalBoundsGap(bridgeBounds, boathouseBounds);

    const crossing = bridge.userData.walkCrossing;
    const crossingPoints = [crossing.start, ...crossing.deckTargets, crossing.end]
      .map((point) => bridge.localToWorld(vector().fromArray(point)));
    const controller = world.walkController;
    controller.refreshNavigation();
    const startGround = controller.sampleGround(crossingPoints[0].x, crossingPoints[0].z);
    if (startGround === null) throw new Error('Bridge start has no WALK ground');
    world.camera.position.set(crossingPoints[0].x, startGround + 0.162, crossingPoints[0].z);
    controller.groundY = startGround;
    controller.grounded = true;
    controller.velocityY = 0;
    let blockedSteps = 0;
    let groundGaps = 0;
    let largestStep = 0;
    let priorGround = startGround;
    const blockedSamples = [];
    for (let targetIndex = 1; targetIndex < crossingPoints.length; targetIndex += 1) {
      const start = world.camera.position.clone().setY(0);
      const end = crossingPoints[targetIndex].clone().setY(0);
      const delta = end.clone().sub(start);
      const steps = Math.max(2, Math.ceil(delta.length() / 0.02));
      for (let index = 1; index <= steps; index += 1) {
        const sample = start.clone().addScaledVector(delta, index / steps);
        const ground = controller.sampleGround(sample.x, sample.z);
        if (ground === null) {
          groundGaps += 1;
          continue;
        }
        largestStep = Math.max(largestStep, Math.abs(ground - priorGround));
        priorGround = ground;
        const before = world.camera.position.clone();
        controller.tryAxisMove(sample.x - before.x, 0);
        controller.tryAxisMove(0, sample.z - world.camera.position.z);
        if (Math.hypot(sample.x - world.camera.position.x, sample.z - world.camera.position.z) > 0.012) {
          blockedSteps += 1;
          blockedSamples.push({
            targetIndex,
            substep: index,
            target: sample.toArray(),
            reached: world.camera.position.toArray(),
          });
          break;
        }
        world.camera.position.y = ground + 0.162;
      }
      if (blockedSteps) break;
    }
    const crossingEnd = crossingPoints.at(-1);
    const crossingEndDistance = Math.hypot(
      crossingEnd.x - world.camera.position.x,
      crossingEnd.z - world.camera.position.z,
    );
    const textCanal = JSON.parse(window.render_game_to_text()).academicDistrict?.canal;
    return {
      metadata,
      textCanal,
      waterClearance,
      bankClearance,
      bridgeClearance,
      crossing: {
        pointCount: crossingPoints.length,
        blockedSteps,
        groundGaps,
        largestStep,
        endDistance: crossingEndDistance,
        blockedSamples,
      },
      names: {
        water: water.name,
        bridge: bridge.name,
        boathouse: boathouse.userData.semanticName,
      },
    };
  });

  if (audit.waterClearance < 1.2) throw new Error(`River is only ${audit.waterClearance.toFixed(3)} units clear of the Rowing House`);
  if (audit.bankClearance < 0.25) throw new Error(`River bank is only ${audit.bankClearance.toFixed(3)} units clear of the Rowing House`);
  if (audit.bridgeClearance < 2) throw new Error(`Bridge is only ${audit.bridgeClearance.toFixed(3)} units clear of the Rowing House`);
  if (!audit.metadata.bridgeRelocatedFromRowingHouse || audit.metadata.centerlineControlCount < 8) throw new Error('Canal reroute metadata is incomplete');
  if (!audit.metadata.animatedRippleTexture || audit.metadata.flowGlintCount < 30 || audit.metadata.reedStemCount < 80) throw new Error('Natural water detail is incomplete');
  if (audit.metadata.cattailHeadCount < 40 || audit.metadata.bankRockCount < 40 || audit.metadata.waterlineMossStripCount !== 2) throw new Error('Natural riverbank detail is incomplete');
  if (JSON.stringify(audit.textCanal) !== JSON.stringify(audit.metadata)) throw new Error('Text-state canal metadata does not match the rendered canal');
  if (audit.crossing.blockedSteps || audit.crossing.groundGaps || audit.crossing.endDistance > 0.08) throw new Error(`Bridge WALK crossing failed: ${JSON.stringify(audit.crossing)}`);
  if (audit.crossing.largestStep > 0.039) throw new Error(`Bridge rise exceeds WALK step height: ${audit.crossing.largestStep}`);

  await page.evaluate(() => {
    document.querySelectorAll('.atlas, .topbar, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region')
      .forEach((element) => { element.style.display = 'none'; });
    const world = window.labIsland;
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('academic-overcast');
    world.advanceTime(620);
  });

  const stageView = async (view) => page.evaluate(({ view }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const bridge = district.getObjectByName('ACADEMIC__ARCHED_PEDESTRIAN_BRIDGE');
    const boathouse = district.children.find((child) => child.userData.semanticName === 'Blackwater Rowing House');
    const crossing = bridge.userData.walkCrossing;
    const makeVector = (point) => world.camera.position.clone().fromArray(point);
    const start = bridge.localToWorld(makeVector(crossing.start));
    const end = bridge.localToWorld(makeVector(crossing.end));
    const center = start.clone().lerp(end, 0.5);
    const crossingDirection = end.clone().sub(start).setY(0).normalize();
    let riverDirection = world.camera.position.clone().set(-crossingDirection.z, 0, crossingDirection.x).normalize();
    const boathousePosition = boathouse.getWorldPosition(world.controls.target.clone());
    if (boathousePosition.clone().sub(center).dot(riverDirection) < 0) riverDirection.negate();
    const target = center.clone().addScaledVector(riverDirection, view === 'overhead' ? 4.8 : 2.7);
    if (view === 'human') target.addScaledVector(crossingDirection, 0.35);
    target.y += view === 'overhead' ? 0.15 : 0.13;
    const cameraPosition = center.clone()
      .addScaledVector(riverDirection, view === 'overhead' ? -5.5 : -4.6)
      .addScaledVector(crossingDirection, view === 'overhead' ? -4.8 : -2.95);
    cameraPosition.y += view === 'overhead' ? 11 : 0.48;
    world.camera.position.copy(cameraPosition);
    world.controls.target.copy(target);
    world.camera.lookAt(target);
    world.controls.update();
    world.advanceTime(280);
  }, { view });

  await stageView('overhead');
  await page.screenshot({ path: `${outputDirectory}/river-bridge-rowing-house-overhead.png` });
  await stageView('human');
  await page.screenshot({ path: `${outputDirectory}/river-bridge-human-view.png` });

  if (consoleErrors.length || pageErrors.length) {
    throw new Error(`Browser errors: ${[...consoleErrors, ...pageErrors].join(' | ')}`);
  }
  console.log(JSON.stringify({ ...audit, consoleErrors, pageErrors }, null, 2));
} finally {
  await browser.close();
}
