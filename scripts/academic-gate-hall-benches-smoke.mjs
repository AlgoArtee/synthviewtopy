import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_GATE_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_GATE_OUTPUT ?? 'output/academic-gate-hall-benches';
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
  await page.waitForTimeout(1_000);

  const staticAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    world.setTimeOfDay('noon');
    district.updateMatrixWorld(true);
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    const path = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_PROCESSIONAL_ROAD');
    const benches = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__VINTAGE_CAMPUS_BENCHES');
    if (!gate || !hall || !path || !benches) throw new Error('Gate, Great Hall, path, or vintage benches missing');

    const leaves = [];
    const closedColliders = [];
    const steps = [];
    const benchMeshes = [];
    let leafCollisionSegmentCount = 0;
    let legacyBenchMeshes = 0;
    district.traverse((object) => {
      if (object.userData.academicGateLeaf === true) leaves.push(object);
      if (object.userData.academicGateCollider === true) closedColliders.push(object);
      if (object.userData.academicVintageBenches === true) benchMeshes.push(object);
      if (object.userData.academicGateLeafCollision === true) {
        leafCollisionSegmentCount += object.userData.navBarrierSegments?.length ?? 0;
      }
      if (object.name.endsWith('__OAK_READING_BENCHES')) legacyBenchMeshes += 1;
    });
    hall.traverse((object) => {
      if (object.userData.academicMainStep === true) steps.push(object);
    });
    const route = hall.userData.walkAccess;
    const pathStart = world.camera.position.clone().fromArray(path.userData.roadEndpoints.start);
    const pathEnd = world.camera.position.clone().fromArray(path.userData.roadEndpoints.end);
    const routeStart = world.camera.position.clone().fromArray(route.routeStart);
    const threshold = world.camera.position.clone().fromArray(route.threshold);
    const pathDirection = pathEnd.clone().sub(pathStart).setY(0).normalize();
    const hallOutward = world.camera.position.clone().set(0, 0, 1).applyQuaternion(hall.quaternion).setY(0).normalize();
    const arch = hall.children.find((child) => child.name.endsWith('__OPEN_STONE_DOOR_ARCH'));
    const archPosition = arch.getWorldPosition(world.camera.position.clone());
    const thresholdWorld = district.localToWorld(threshold.clone());
    const stepTops = steps
      .map((step) => Number(step.userData.stepTopY))
      .sort((left, right) => left - right);
    const stepRisers = stepTops.map((top, index) => top - (index === 0 ? 0 : stepTops[index - 1]));
    world.walkController.refreshNavigation();
    const benchAnchors = benches.userData.benchAnchors;
    const benchGroundAudit = benchAnchors.map((anchor) => {
      const localPosition = world.camera.position.clone().fromArray(anchor.position);
      const worldPosition = district.localToWorld(localPosition.clone());
      const ground = world.walkController.sampleGround(worldPosition.x, worldPosition.z);
      const localGroundY = ground === null
        ? Number.NaN
        : district.worldToLocal(worldPosition.clone().setY(ground)).y;
      return {
        id: anchor.id,
        groundDeltaMetres: Number((localPosition.y - localGroundY) * 10),
        seatHeightMetres: Number((localPosition.y + 0.049 - localGroundY) * 10),
      };
    });
    const pointSegmentDistance = (point, start, end) => {
      const dx = end[0] - start[0];
      const dz = end[2] - start[2];
      const lengthSquared = dx * dx + dz * dz;
      const along = lengthSquared > 0
        ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[2] - start[2]) * dz) / lengthSquared))
        : 0;
      return Math.hypot(point[0] - (start[0] + dx * along), point[2] - (start[2] + dz * along));
    };
    const cross = (a, b, c) => (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    const segmentDistance = (a, b, c, d) => {
      const boundsOverlap = Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) <= Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0]))
        && Math.max(Math.min(a[2], b[2]), Math.min(c[2], d[2])) <= Math.min(Math.max(a[2], b[2]), Math.max(c[2], d[2]));
      const crosses = boundsOverlap && cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0;
      if (crosses) return 0;
      return Math.min(
        pointSegmentDistance(a, c, d),
        pointSegmentDistance(b, c, d),
        pointSegmentDistance(c, a, b),
        pointSegmentDistance(d, a, b),
      );
    };
    const benchBarriers = benches.getObjectByName('ACADEMIC__VINTAGE_BENCH_PRECISE_WALK_COLLISION')
      ?.userData.navBarrierSegments ?? [];
    const campusPaths = [];
    district.traverse((child) => {
      if (child.userData.roadEndpoints && Number(child.geometry?.parameters?.width) > 0) campusPaths.push(child);
    });
    let minimumPathClearance = { metres: Infinity, benchId: null, path: null };
    benchBarriers.forEach((barrier, benchIndex) => {
      campusPaths.forEach((campusPath) => {
        const endpoints = campusPath.userData.roadEndpoints;
        const start = district.worldToLocal(
          world.camera.position.clone().fromArray(endpoints.start).applyMatrix4(campusPath.parent.matrixWorld),
        ).toArray();
        const end = district.worldToLocal(
          world.camera.position.clone().fromArray(endpoints.end).applyMatrix4(campusPath.parent.matrixWorld),
        ).toArray();
        const clearance = segmentDistance(barrier.start, barrier.end, start, end)
          - Number(campusPath.geometry.parameters.width) * 0.5
          - Number(barrier.radius)
          - 0.03;
        if (clearance < minimumPathClearance.metres) {
          minimumPathClearance = {
            metres: clearance,
            benchId: benchAnchors[benchIndex]?.id ?? null,
            path: campusPath.name,
          };
        }
      });
    });
    const zoneCounts = benchAnchors.reduce((counts, anchor) => {
      counts[anchor.zone] = (counts[anchor.zone] ?? 0) + 1;
      return counts;
    }, {});
    const statue = district.getObjectByName('ACADEMIC__STATUE_PLINTH');
    const fountainBench = benchAnchors.find((anchor) => anchor.id === 'blackwood-bench-13');
    statue.geometry.computeBoundingBox();
    const statueBounds = statue.geometry.boundingBox.clone().applyMatrix4(statue.matrixWorld);
    const fountainBenchWorld = district.localToWorld(world.camera.position.clone().fromArray(fountainBench.position));
    const fountainBenchClearanceMetres = Number(((statueBounds.distanceToPoint(fountainBenchWorld) - 0.17) * 10).toFixed(3));
    hall.updateMatrix();
    const hallCollision = hall.children.find((child) => child.name.endsWith('__PRECISE_WALK_COLLISION'));
    const hallBarriers = hallCollision.userData.navBarrierSegments.map((barrier) => ({
      start: world.camera.position.clone().fromArray(barrier.start).applyMatrix4(hall.matrix).toArray(),
      end: world.camera.position.clone().fromArray(barrier.end).applyMatrix4(hall.matrix).toArray(),
      radius: Number(barrier.radius),
    }));
    const hallBenchClearanceMetres = Math.min(...['blackwood-bench-03', 'blackwood-bench-04', 'blackwood-bench-26'].flatMap((id) => {
      const benchIndex = benchAnchors.findIndex((entry) => entry.id === id);
      const benchBarrier = benchBarriers[benchIndex];
      return hallBarriers.map((hallBarrier) => (
        segmentDistance(benchBarrier.start, benchBarrier.end, hallBarrier.start, hallBarrier.end)
          - Number(benchBarrier.radius)
          - hallBarrier.radius
          - 0.06
      ) * 10);
    }));
    return {
      initialTime: world.getTimeOfDay(),
      initialGateOpen: district.userData.academicGateOpen === true,
      leafCount: leaves.length,
      leafCollisionSegmentCount,
      leavesAtOpenYaw: leaves.every((leaf) => Math.abs(leaf.rotation.y - Number(leaf.userData.openYaw)) < 0.001),
      gateColliderCount: closedColliders.length,
      gateColliderBlocking: closedColliders.some((collider) => collider.userData.navObstacle === true),
      hallYaw: hall.rotation.y,
      pathToEntranceDot: pathDirection.dot(hallOutward),
      pathEndToRouteStartMetres: Number((pathEnd.distanceTo(routeStart) * 10).toFixed(3)),
      archToThresholdMetres: Number((Math.hypot(archPosition.x - thresholdWorld.x, archPosition.z - thresholdWorld.z) * 10).toFixed(3)),
      stepCount: steps.length,
      stepTops,
      stepIndices: steps.map((step) => Number(step.userData.stepIndex)).sort((left, right) => left - right),
      stepsWalkable: steps.every((step) => step.userData.walkable === true),
      routeEntranceStepCount: Number(route.entranceStepCount),
      stairRunMetres: Number((Number(route.stairRun) * 10).toFixed(3)),
      maximumStepRiserMetres: Number((Math.max(...stepRisers) * 10).toFixed(3)),
      finishedFloorDeltaMetres: Number((Math.abs(Number(route.finishedFloorY) - stepTops.at(-1)) * 10).toFixed(3)),
      duplicateWalkDoorCount: district.getObjectByName('academic-libraries-theoretical-labs__WALK_ENTRY_DOOR') ? 1 : 0,
      benchCount: Number(benches.userData.academicVintageBenchCount ?? 0),
      benchMeshCount: benchMeshes.length,
      benchBarrierCount: Number(
        benches.getObjectByName('ACADEMIC__VINTAGE_BENCH_PRECISE_WALK_COLLISION')
          ?.userData.academicBenchBarrierCount ?? 0,
      ),
      maximumBenchGroundDeltaMetres: Number(Math.max(...benchGroundAudit.map((entry) => Math.abs(entry.groundDeltaMetres))).toFixed(3)),
      benchGroundOutliers: benchGroundAudit.filter((entry) => Math.abs(entry.groundDeltaMetres) > 0.025),
      minimumBenchSeatHeightMetres: Number(Math.min(...benchGroundAudit.map((entry) => entry.seatHeightMetres)).toFixed(3)),
      maximumBenchSeatHeightMetres: Number(Math.max(...benchGroundAudit.map((entry) => entry.seatHeightMetres)).toFixed(3)),
      minimumPathClearanceMetres: Number((minimumPathClearance.metres * 10).toFixed(3)),
      minimumPathClearanceBench: minimumPathClearance.benchId,
      minimumPathClearancePath: minimumPathClearance.path,
      fountainBenchClearanceMetres,
      hallBenchClearanceMetres: Number(hallBenchClearanceMetres.toFixed(3)),
      zoneCounts,
      legacyBenchMeshes,
      snapshotBenchCount: world.getTextSnapshot().academicDistrict?.vintageBenchCount,
    };
  });

  const stageGateView = async (time, openByInteraction = false, viewDistance = 0.35) => page.evaluate(({ requestedTime, interact, distance }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    const gatePosition = gate.getWorldPosition(world.camera.position.clone());
    const hallPosition = hall.getWorldPosition(world.camera.position.clone());
    const inward = hallPosition.clone().sub(gatePosition).setY(0).normalize();
    world.setTimeOfDay(requestedTime);
    if (interact && district.userData.academicGateOpen !== true) world.performAcademicInteraction('open main gate');
    world.setMode('walk');
    const cameraPosition = gatePosition.clone().addScaledVector(inward, -distance);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(gatePosition.x, ground + 0.145, gatePosition.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(480);
    document.querySelectorAll('.atlas, .topbar, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region')
      .forEach((element) => { element.style.display = 'none'; });
    return district.userData.academicGateOpen === true;
  }, { requestedTime: time, interact: openByInteraction, distance: viewDistance });

  await page.click('#walk-mode');
  await stageGateView('noon', false, 2.2);
  await page.screenshot({ path: `${outputDirectory}/day-open-gate-to-great-hall.png` });
  await stageGateView('night', false, 2.2);
  await page.screenshot({ path: `${outputDirectory}/night-closed-main-gate.png` });
  await stageGateView('night');

  // Restore interaction feedback, then exercise the real single-key E flow at night.
  await page.evaluate(() => {
    document.querySelectorAll('.walk-interaction-menu, .toast-region').forEach((element) => { element.style.display = ''; });
  });
  await page.keyboard.press('KeyE');
  const eInteractionAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const leaves = [];
    gate.traverse((object) => {
      if (object.userData.academicGateLeaf === true) {
        leaves.push({ yaw: object.rotation.y, openYaw: Number(object.userData.openYaw) });
      }
    });
    const collider = gate.getObjectByName('ACADEMIC__MAIN_GATE_CLOSED_COLLIDER');
    const cameraY = world.camera.position.y;
    const edgeSamples = [-0.48, 0.48].map((ratio) => {
      const point = collider.localToWorld(world.camera.position.clone().set(0, 0, 8.3 * ratio));
      world.camera.position.set(point.x, cameraY, point.z);
      return world.isAcademicMainGateNearby();
    });
    return {
      gateOpen: district.userData.academicGateOpen === true,
      snapshotGateOpen: world.getTextSnapshot().academicDistrict?.gateOpen === true,
      leafCount: leaves.length,
      leavesAtOpenYaw: leaves.every((leaf) => Math.abs(leaf.yaw - leaf.openYaw) < 1e-6),
      colliderDisabled: collider.userData.navObstacle !== true,
      menuStayedHidden: document.querySelector('#walk-interaction-menu').hidden === true,
      edgeSamples,
    };
  });
  const eInteractionOpened = eInteractionAudit.gateOpen
    && eInteractionAudit.snapshotGateOpen
    && eInteractionAudit.leafCount === 2
    && eInteractionAudit.leavesAtOpenYaw
    && eInteractionAudit.colliderDisabled
    && eInteractionAudit.menuStayedHidden
    && eInteractionAudit.edgeSamples.every(Boolean);
  await stageGateView('night', false, 2.2);
  await page.screenshot({ path: `${outputDirectory}/night-opened-with-e.png` });

  const traversalAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    const path = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_PROCESSIONAL_ROAD');
    const controller = world.walkController;
    const route = hall.userData.walkAccess;
    const pathStart = district.localToWorld(world.camera.position.clone().fromArray(path.userData.roadEndpoints.start));
    const interior = district.localToWorld(world.camera.position.clone().fromArray(route.interiorTarget));
    const gatePosition = gate.getWorldPosition(world.camera.position.clone());
    const direction = interior.clone().sub(pathStart).setY(0).normalize();
    const closedCollider = gate.getObjectByName('ACADEMIC__MAIN_GATE_CLOSED_COLLIDER');

    const walkLine = (start, end, spacing = 0.025, refreshNavigation = true) => {
      if (refreshNavigation) controller.refreshNavigation();
      const startGround = controller.sampleGround(start.x, start.z);
      if (startGround === null) return { reached: false, blockedSteps: 1, groundGaps: 1, endDistance: Infinity };
      world.camera.position.set(start.x, startGround + 0.162, start.z);
      controller.groundY = startGround;
      controller.grounded = true;
      controller.velocityY = 0;
      controller.isJumping = false;
      const delta = end.clone().sub(start);
      const steps = Math.max(2, Math.ceil(delta.length() / spacing));
      let blockedSteps = 0;
      let groundGaps = 0;
      for (let index = 1; index <= steps; index += 1) {
        const sample = start.clone().addScaledVector(delta, index / steps);
        const ground = controller.sampleGround(sample.x, sample.z);
        if (ground === null) {
          groundGaps += 1;
          continue;
        }
        const before = world.camera.position.clone();
        controller.tryAxisMove(sample.x - before.x, 0);
        controller.tryAxisMove(0, sample.z - world.camera.position.z);
        const remaining = Math.hypot(sample.x - world.camera.position.x, sample.z - world.camera.position.z);
        if (remaining > 0.012) {
          blockedSteps += 1;
          break;
        }
        world.camera.position.y = ground + 0.162;
      }
      const endDistance = Math.hypot(end.x - world.camera.position.x, end.z - world.camera.position.z);
      return { reached: endDistance < 0.1, blockedSteps, groundGaps, endDistance };
    };

    world.setTimeOfDay('noon');
    const dayGateOpen = district.userData.academicGateOpen === true;
    const fullDayRoute = walkLine(pathStart, interior);

    world.setTimeOfDay('night');
    const nightGateClosed = district.userData.academicGateOpen !== true;
    const closedStart = gatePosition.clone().addScaledVector(direction, -0.8);
    const closedEnd = gatePosition.clone().addScaledVector(direction, 0.8);
    const closedAttempt = walkLine(closedStart, closedEnd, 0.02);

    const interaction = world.performAcademicInteraction('open main gate');
    const nightGateOpened = district.userData.academicGateOpen === true;
    const openedAttempt = walkLine(closedStart, closedEnd, 0.02);

    const thresholdGround = controller.sampleGround(gatePosition.x, gatePosition.z) ?? district.position.y;
    world.camera.position.set(gatePosition.x, thresholdGround + 0.162, gatePosition.z);
    const occupiedCloseResult = world.performAcademicInteraction('open main gate');
    const occupiedCloseDeferred = district.userData.academicGateOpen === true;
    const clearGround = controller.sampleGround(closedStart.x, closedStart.z) ?? district.position.y;
    world.camera.position.set(closedStart.x, clearGround + 0.162, closedStart.z);
    const clearCloseResult = world.performAcademicInteraction('open main gate');
    const clearCloseSucceeded = district.userData.academicGateOpen !== true;
    world.performAcademicInteraction('open main gate');

    world.setTimeOfDay('noon');
    world.camera.position.set(gatePosition.x, thresholdGround + 0.162, gatePosition.z);
    world.setTimeOfDay('night');
    const automaticCloseDeferred = district.userData.academicGateOpen === true
      && district.userData.academicGateClosePending === true
      && closedCollider.userData.navObstacle !== true;
    world.camera.position.set(closedStart.x, clearGround + 0.162, closedStart.z);
    world.advanceTime(100);
    const automaticCloseRetried = district.userData.academicGateOpen !== true
      && district.userData.academicGateClosePending !== true
      && closedCollider.userData.navObstacle === true;
    const automaticClosedAttempt = walkLine(closedStart, closedEnd, 0.02, false);
    world.setTimeOfDay('noon');
    world.setObjectCollision('academic-libraries-theoretical-labs', false);
    world.setObjectCollision('academic-libraries-theoretical-labs', true);
    const openCollisionTogglePreserved = district.userData.academicGateOpen === true
      && closedCollider.userData.navObstacle !== true;

    return {
      dayGateOpen,
      fullDayRoute,
      nightGateClosed,
      closedAttempt,
      nightGateOpened,
      openedAttempt,
      occupiedCloseDeferred,
      occupiedCloseResult,
      clearCloseSucceeded,
      clearCloseResult,
      automaticCloseDeferred,
      automaticCloseRetried,
      automaticClosedAttempt,
      openCollisionTogglePreserved,
      interaction,
      finalSnapshot: world.getTextSnapshot().academicDistrict,
    };
  });

  const persistenceAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const summarizeMaterials = (root) => {
      const materials = new Map();
      root.traverse((object) => {
        if (!object.material) return;
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.forEach((material) => materials.set(material.uuid, material));
      });
      const descriptors = [...materials.values()]
        .map((material) => ({
          name: material.name,
          color: material.color?.getHexString() ?? null,
          map: material.map ? material.map.name || '(unnamed)' : null,
          bumpMap: material.bumpMap ? material.bumpMap.name || '(unnamed)' : null,
        }))
        .sort((left, right) => `${left.name}|${left.color}|${left.map}|${left.bumpMap}`.localeCompare(`${right.name}|${right.color}|${right.map}|${right.bumpMap}`));
      const representativeAging = Object.fromEntries([
        ['brick', 'academic-aged-umber-brick-albedo'],
        ['slate', 'academic-aged-slate-albedo'],
        ['path', 'academic-leaf-strewn-earth-path-albedo'],
      ].map(([label, mapName]) => [label, descriptors.find((entry) => entry.map === mapName) ?? null]));
      return {
        uniqueCount: materials.size,
        mappedCount: descriptors.filter((entry) => Boolean(entry.map)).length,
        bumpMappedCount: descriptors.filter((entry) => Boolean(entry.bumpMap)).length,
        whiteCount: descriptors.filter((entry) => entry.color === 'ffffff').length,
        customizedCount: descriptors.filter((entry) => entry.name.includes('_customized')).length,
        representativeAging,
        descriptorKeys: descriptors.map((entry) => JSON.stringify(entry)),
        signature: JSON.stringify(descriptors),
      };
    };
    world.setWeather('academic-rainy-dusk');
    const districtBeforeSave = world.objectGroups.get('academic-libraries-theoretical-labs');
    const before = summarizeMaterials(districtBeforeSave);
    world.saveProjectToLocalStorage();
    const pristinePayload = JSON.parse(localStorage.getItem('youtopy_saved_project'));
    const pristineAcademic = pristinePayload.objects.find((object) => object.id === 'academic-libraries-theoretical-labs');
    const styleFields = ['primaryColor', 'secondaryColor', 'patternType', 'patternScale'];
    const pristineStyleSerialization = pristineAcademic.state.styleCustomized === false
      && styleFields.every((field) => !Object.prototype.hasOwnProperty.call(pristineAcademic, field))
      && styleFields.every((field) => !Object.prototype.hasOwnProperty.call(pristineAcademic.state, field));
    world.setWeather('academic-foggy-night');
    const loaded = world.loadProjectFromLocalStorage();
    const restoredDistrict = world.objectGroups.get('academic-libraries-theoretical-labs');
    const after = summarizeMaterials(restoredDistrict);
    const { signature: beforeSignature, descriptorKeys: beforeKeys, ...beforeMaterials } = before;
    const { signature: afterSignature, descriptorKeys: afterKeys, ...afterMaterials } = after;
    const materialDifferences = beforeKeys
      .map((entry, index) => ({ before: entry, after: afterKeys[index] }))
      .filter((entry) => entry.before !== entry.after)
      .slice(0, 12);
    const restored = {
      loaded,
      timeOfDay: world.getTimeOfDay(),
      weather: world.getWeather(),
      gateOpen: restoredDistrict.userData.academicGateOpen === true,
      beforeMaterials,
      afterMaterials,
      materialsPreserved: beforeSignature === afterSignature,
      materialDifferences,
      pristineStyleSerialization,
    };
    const contaminatedLegacyPayload = structuredClone(pristinePayload);
    const contaminatedAcademic = contaminatedLegacyPayload.objects.find((object) => object.id === 'academic-libraries-theoretical-labs');
    delete contaminatedAcademic.state.styleCustomized;
    Object.assign(contaminatedAcademic, {
      primaryColor: '#ffffff',
      secondaryColor: '#74858a',
      patternType: 'solid',
      patternScale: 1,
    });
    Object.assign(contaminatedAcademic.state, {
      primaryColor: '#ffffff',
      secondaryColor: '#74858a',
      patternType: 'solid',
      patternScale: 1,
    });
    const contaminatedLegacyLoaded = world.loadProject(contaminatedLegacyPayload);
    const recoveredLegacyMaterials = summarizeMaterials(world.objectGroups.get('academic-libraries-theoretical-labs'));
    restored.contaminatedLegacyRecovery = {
      loaded: contaminatedLegacyLoaded,
      materialsPreserved: recoveredLegacyMaterials.signature === beforeSignature,
      uniqueCount: recoveredLegacyMaterials.uniqueCount,
      mappedCount: recoveredLegacyMaterials.mappedCount,
      customizedCount: recoveredLegacyMaterials.customizedCount,
    };
    world.setWeather('academic-foggy-night');
    world.setTimeOfDay('noon');
    world.saveProjectToLocalStorage();
    world.setWeather('academic-rainy-dusk');
    const independentLoaded = world.loadProjectFromLocalStorage();
    const independentDistrict = world.objectGroups.get('academic-libraries-theoretical-labs');
    restored.independentCombination = {
      loaded: independentLoaded,
      timeOfDay: world.getTimeOfDay(),
      weather: world.getWeather(),
      gateOpen: independentDistrict.userData.academicGateOpen === true,
    };
    world.setWeather('academic-overcast');
    world.setTimeOfDay('noon');
    return restored;
  });

  await page.evaluate(() => {
    const world = window.labIsland;
    document.querySelectorAll('.toast-region').forEach((element) => { element.style.display = 'none'; });
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    const routeStart = district.localToWorld(world.camera.position.clone().fromArray(hall.userData.walkAccess.routeStart));
    const threshold = district.localToWorld(world.camera.position.clone().fromArray(hall.userData.walkAccess.threshold));
    const outward = routeStart.clone().sub(threshold).setY(0).normalize();
    const side = world.camera.position.clone().crossVectors(outward, world.camera.up).normalize();
    const cameraPosition = routeStart.clone().addScaledVector(outward, 0.85).addScaledVector(side, 0.7);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(threshold.x, threshold.y + 0.13, threshold.z);
    world.setTimeOfDay('noon');
    world.advanceTime(480);
  });
  await page.screenshot({ path: `${outputDirectory}/great-hall-stairs-and-open-door.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    document.querySelectorAll('.toast-region').forEach((element) => { element.style.display = 'none'; });
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const benches = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__VINTAGE_CAMPUS_BENCHES');
    const anchor = benches.userData.benchAnchors.find((entry) => entry.zone === 'processional avenue');
    const center = district.localToWorld(world.camera.position.clone().fromArray(anchor.position));
    const facing = world.camera.position.clone().fromArray(anchor.facing);
    const side = world.camera.position.clone().crossVectors(facing, world.camera.up).normalize();
    const cameraPosition = center.clone().addScaledVector(facing, 0.34).addScaledVector(side, 0.34);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(center.x, center.y + 0.055, center.z);
    world.setWeather('academic-autumn');
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${outputDirectory}/vintage-bench-on-leaf-avenue.png` });

  const result = { staticAudit, eInteractionOpened, traversalAudit, persistenceAudit, consoleErrors };
  console.log(JSON.stringify(result, null, 2));

  if (staticAudit.initialTime !== 'noon' || !staticAudit.initialGateOpen || !staticAudit.leavesAtOpenYaw || staticAudit.gateColliderBlocking) {
    throw new Error(`Daytime gate default failed: ${JSON.stringify(staticAudit)}`);
  }
  if (staticAudit.leafCount !== 2 || staticAudit.leafCollisionSegmentCount !== 2 || staticAudit.gateColliderCount !== 1) {
    throw new Error(`Gate structure invalid: ${JSON.stringify(staticAudit)}`);
  }
  if (staticAudit.pathToEntranceDot > -0.995 || staticAudit.pathEndToRouteStartMetres > 0.05 || staticAudit.archToThresholdMetres > 1.5) {
    throw new Error(`Great Hall axis is misaligned: ${JSON.stringify(staticAudit)}`);
  }
  if (staticAudit.stepCount !== 4 || staticAudit.routeEntranceStepCount !== 4 || staticAudit.stepIndices.join(',') !== '0,1,2,3'
    || !staticAudit.stepsWalkable || staticAudit.stairRunMetres !== 6 || staticAudit.maximumStepRiserMetres > 0.38
    || staticAudit.finishedFloorDeltaMetres > 0.001 || staticAudit.duplicateWalkDoorCount !== 0) {
    throw new Error(`Great Hall stairs/door audit failed: ${JSON.stringify(staticAudit)}`);
  }
  if (staticAudit.benchCount !== 32 || staticAudit.benchMeshCount !== 3 || staticAudit.benchBarrierCount !== 32 || staticAudit.legacyBenchMeshes !== 0 || staticAudit.snapshotBenchCount !== 32) {
    throw new Error(`Vintage bench audit failed: ${JSON.stringify(staticAudit)}`);
  }
  const expectedBenchZoneCounts = {
    'Founders Quadrangle Park': 4,
    'Philosophers Reading Garden': 4,
    'Open Scholars Lawn': 4,
    'Bronze Scholars Fountain': 4,
    'Gaslight Reading Courts': 4,
    'processional avenue': 4,
    'Founders Quadrangle': 2,
    'library close': 2,
    'Old Science Court': 1,
    'Blackwater canal bank': 2,
    'St Anselm Chapel close': 1,
  };
  if (JSON.stringify(staticAudit.zoneCounts) !== JSON.stringify(expectedBenchZoneCounts)
    || staticAudit.maximumBenchGroundDeltaMetres > 0.03
    || staticAudit.minimumBenchSeatHeightMetres < 0.44
    || staticAudit.maximumBenchSeatHeightMetres > 0.5
    || staticAudit.minimumPathClearanceMetres <= 0
    || staticAudit.fountainBenchClearanceMetres <= 0
    || staticAudit.hallBenchClearanceMetres <= 0) {
    throw new Error(`Vintage bench placement failed: ${JSON.stringify(staticAudit)}`);
  }
  if (!eInteractionOpened) throw new Error(`Single-key E interaction did not open the night gate: ${JSON.stringify(eInteractionAudit)}`);
  if (!traversalAudit.dayGateOpen || !traversalAudit.fullDayRoute.reached || traversalAudit.fullDayRoute.blockedSteps || traversalAudit.fullDayRoute.groundGaps) {
    throw new Error(`Day gate-to-interior WALK failed: ${JSON.stringify(traversalAudit.fullDayRoute)}`);
  }
  if (!traversalAudit.nightGateClosed || traversalAudit.closedAttempt.reached || !traversalAudit.nightGateOpened || !traversalAudit.openedAttempt.reached) {
    throw new Error(`Night gate blocking/opening failed: ${JSON.stringify(traversalAudit)}`);
  }
  if (!traversalAudit.occupiedCloseDeferred || !traversalAudit.clearCloseSucceeded
    || !traversalAudit.automaticCloseDeferred || !traversalAudit.automaticCloseRetried
    || traversalAudit.automaticClosedAttempt.reached || !traversalAudit.openCollisionTogglePreserved) {
    throw new Error(`Night gate safe-closing failed: ${JSON.stringify(traversalAudit)}`);
  }
  const expectedRepresentativeAging = {
    brick: {
      color: 'd2c2b7',
      map: 'academic-aged-umber-brick-albedo',
      bumpMap: 'academic-aged-umber-brick-height',
    },
    slate: {
      color: 'aeb4b3',
      map: 'academic-aged-slate-albedo',
      bumpMap: 'academic-aged-slate-height',
    },
    path: {
      color: 'd2c9b8',
      map: 'academic-leaf-strewn-earth-path-albedo',
      bumpMap: 'academic-leaf-strewn-earth-path-height',
    },
  };
  const representativeAgingValid = Object.entries(expectedRepresentativeAging).every(([key, expected]) => {
    const actual = persistenceAudit.beforeMaterials.representativeAging[key];
    return actual && expected.color === actual.color && expected.map === actual.map && expected.bumpMap === actual.bumpMap;
  });
  if (!persistenceAudit.loaded || persistenceAudit.timeOfDay !== 'sunset' || persistenceAudit.weather !== 'academic-rainy-dusk' || !persistenceAudit.gateOpen
    || !persistenceAudit.materialsPreserved || persistenceAudit.beforeMaterials.mappedCount === 0
    || persistenceAudit.beforeMaterials.bumpMappedCount === 0
    || persistenceAudit.beforeMaterials.customizedCount !== 0
    || !representativeAgingValid
    || !persistenceAudit.pristineStyleSerialization
    || !persistenceAudit.contaminatedLegacyRecovery.loaded
    || !persistenceAudit.contaminatedLegacyRecovery.materialsPreserved
    || persistenceAudit.contaminatedLegacyRecovery.customizedCount !== 0
    || !persistenceAudit.independentCombination.loaded
    || persistenceAudit.independentCombination.timeOfDay !== 'noon'
    || persistenceAudit.independentCombination.weather !== 'academic-foggy-night'
    || !persistenceAudit.independentCombination.gateOpen) {
    throw new Error(`Gate dusk persistence failed: ${JSON.stringify(persistenceAudit)}`);
  }
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ...result,
    screenshots: [
      `${outputDirectory}/day-open-gate-to-great-hall.png`,
      `${outputDirectory}/night-closed-main-gate.png`,
      `${outputDirectory}/night-opened-with-e.png`,
      `${outputDirectory}/great-hall-stairs-and-open-door.png`,
      `${outputDirectory}/vintage-bench-on-leaf-avenue.png`,
    ],
  }, null, 2));
} finally {
  await browser.close();
}
