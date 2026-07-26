import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.WALK_NOCLIP_OUTPUT ?? 'output/walk-noclip-safety';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(900);

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const hall = world.objectGroups.get('entry-logistics-building-e2');
    if (!hall) throw new Error('Welcome and Registration Hall was not registered');
    hall.updateWorldMatrix(true, true);
    const hallAnchor = hall.getWorldPosition(world.camera.position.clone());
    world.setMode('explore');
    world.select('entry-logistics-building-e2', 'system');
    world.camera.position.set(hallAnchor.x, hallAnchor.y + 18, hallAnchor.z + 12);
    world.controls.target.copy(hallAnchor);
    world.camera.lookAt(hallAnchor);
    world.updateWorldStreaming(false, true);
    world.setMode('walk');
    world.updateWorldStreaming(false, true);
    const controller = world.walkController;
    controller.refreshNavigation();
    const interior = hall.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    const base = hall.getObjectByName('ENTRY__E2__ELLIPTICAL_PALE_STONE_BASE');
    const staircaseAccess = hall.getObjectByName('ENTRY__E2__STAIRCASE_NAVIGATION_ACCESS');
    const podiumCollision = hall.getObjectByName('ENTRY__E2__PRECISE_PODIUM_COLLISION');
    if (!interior || !base || !staircaseAccess || !podiumCollision) {
      throw new Error('Hall safety geometry is incomplete');
    }

    const eyeHeight = 0.162;
    const localPoint = (x, z) => hall.localToWorld(world.camera.position.clone().set(x, 0, z));
    const toHallLocal = () => hall.worldToLocal(world.camera.position.clone());
    const placeOnHighestGround = (x, z) => {
      const point = localPoint(x, z);
      const ground = controller.sampleGround(point.x, point.z, { spawnSearch: true });
      if (ground === null) throw new Error(`No ground at Hall local ${x},${z}`);
      world.camera.position.set(point.x, ground + eyeHeight, point.z);
      controller.groundY = ground;
      controller.grounded = true;
      controller.isJumping = false;
      controller.rememberSafePosition();
      return { point, ground };
    };
    const moveToLocal = (x, z, steps = 48) => {
      const target = localPoint(x, z);
      for (let index = 0; index < steps; index += 1) {
        const remaining = steps - index;
        const dx = (target.x - world.camera.position.x) / remaining;
        const dz = (target.z - world.camera.position.z) / remaining;
        controller.tryAxisMove(dx, 0);
        controller.tryAxisMove(0, dz);
      }
      return toHallLocal();
    };

    const podiumRadiusX = 6.45;
    const podiumRadiusZ = 4.38;
    const perimeter = [];
    for (let degrees = 0; degrees < 360; degrees += 5) {
      if (degrees >= 55 && degrees <= 125) continue;
      const angle = degrees * Math.PI / 180;
      placeOnHighestGround(
        Math.cos(angle) * podiumRadiusX * 1.22,
        Math.sin(angle) * podiumRadiusZ * 1.22,
      );
      const result = moveToLocal(
        Math.cos(angle) * podiumRadiusX * 0.68,
        Math.sin(angle) * podiumRadiusZ * 0.68,
      );
      const normalizedRadius = Math.hypot(
        result.x / podiumRadiusX,
        result.z / podiumRadiusZ,
      );
      perimeter.push({ degrees, x: result.x, z: result.z, normalizedRadius });
    }
    const perimeterBreaches = perimeter.filter((entry) => entry.normalizedRadius < 0.96);

    const formerSideSeams = [-2.66, 2.66].map((x) => {
      placeOnHighestGround(x, 6.15);
      const result = moveToLocal(x, 3.45, 64);
      const ground = controller.sampleGround(
        world.camera.position.x,
        world.camera.position.z,
      );
      const bodyBottom = ground === null ? null : ground + 0.015;
      const bodyTop = ground === null ? null : ground + eyeHeight;
      const blocker = ground === null
        ? null
        : controller.findUnderwalkSurface(
          world.camera.position.x,
          world.camera.position.z,
          ground,
          bodyBottom,
          bodyTop,
        );
      return {
        requestedX: x,
        result: result.toArray(),
        ground,
        blocker: blocker?.name ?? null,
        insideNavigationAccess: ground === null
          ? false
          : controller.isInsideNavigationAccess(
            world.camera.position.x,
            world.camera.position.z,
            bodyBottom,
            bodyTop,
          ),
        underwalkSurfaceNames: controller.underwalkSurfaces.map((entry) => entry.object.name),
        underwalkAccessVolumes: controller.underwalkAccessVolumes.length,
        normalizedRadius: Math.hypot(
          result.x / podiumRadiusX,
          result.z / podiumRadiusZ,
        ),
      };
    });

    placeOnHighestGround(0, 7.72);
    const stairResult = moveToLocal(0, 3.55, 96);
    const stairGround = controller.groundY;
    const baseBounds = base.geometry.boundingBox
      ? base.geometry.boundingBox.clone().applyMatrix4(base.matrixWorld)
      : null;
    if (!baseBounds) {
      base.geometry.computeBoundingBox();
    }
    const finishedBaseBounds = base.geometry.boundingBox.clone().applyMatrix4(base.matrixWorld);

    const safe = placeOnHighestGround(0, 8.15);
    const safeEye = world.camera.position.clone();
    const recoveriesBefore = controller.safetyRecoveries;
    const buried = localPoint(0, 0);
    controller.groundY = safe.ground;
    const buriedGround = controller.sampleGround(buried.x, buried.z);
    const highestGround = controller.sampleGround(buried.x, buried.z, { spawnSearch: true });
    if (buriedGround === null || highestGround === null) {
      throw new Error('Could not resolve both Hall navigation layers');
    }
    world.camera.position.set(buried.x, buriedGround + eyeHeight, buried.z);
    controller.groundY = buriedGround;
    controller.grounded = true;
    world.syncAuthoredRuntimeInteriorVisibility();
    const interiorVisibleWhileBuried = interior.visible;
    const currentInteriorWhileBuried = world.getCurrentInteriorBuildingId();
    controller.update(0.016);
    const recoveredEye = world.camera.position.clone();
    const recoveryDistance = recoveredEye.distanceTo(safeEye);
    const recoveriesAfter = controller.safetyRecoveries;

    const ringRadii = [84, 126, 177, 240, 309];
    let islandSurfaceSamples = 0;
    const islandSurfaceFailures = [];
    for (const radius of ringRadii) {
      for (let degrees = 0; degrees < 360; degrees += 3) {
        const angle = degrees * Math.PI / 180;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const ground = controller.sampleGround(x, z, { spawnSearch: true });
        islandSurfaceSamples += 1;
        if (ground === null) islandSurfaceFailures.push({ kind: 'ring', radius, degrees });
      }
    }
    for (let degrees = 0; degrees < 360; degrees += 60) {
      const angle = degrees * Math.PI / 180;
      for (let radius = 72; radius <= 324; radius += 3) {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const ground = controller.sampleGround(x, z, { spawnSearch: true });
        islandSurfaceSamples += 1;
        if (ground === null) islandSurfaceFailures.push({ kind: 'radial', radius, degrees });
      }
    }

    controller.groundY = highestGround;
    controller.isJumping = false;
    const rejectsDeepGroundTransition = !controller.canTraverseGroundTransition(buriedGround);
    controller.groundY = safe.ground;
    world.camera.position.copy(safeEye);
    controller.grounded = true;
    controller.rememberSafePosition();
    world.camera.lookAt(localPoint(0, 0).setY(safeEye.y));
    world.advanceTime(120);

    return {
      safetyGeometry: {
        basePreventUnderwalk: base.userData.preventUnderwalk === true,
        staircaseAccessRegistered: controller.accessBounds.length > 0
          && staircaseAccess.userData.navAccess === true,
        podiumBarrierSegmentCount: podiumCollision.userData.navBarrierSegments?.length ?? 0,
      },
      perimeter: {
        samples: perimeter.length,
        breaches: perimeterBreaches,
        minimumNormalizedRadius: Math.min(...perimeter.map((entry) => entry.normalizedRadius)),
      },
      formerSideSeams,
      staircase: {
        result: stairResult.toArray(),
        ground: stairGround,
        baseTop: finishedBaseBounds.max.y,
        reachedFinishedFloor: stairGround !== null
          && Math.abs(stairGround - finishedBaseBounds.max.y) < 0.025,
      },
      forcedRecovery: {
        buriedGround,
        highestGround,
        layerDifference: highestGround - buriedGround,
        interiorVisibleWhileBuried,
        currentInteriorWhileBuried,
        recoveriesBefore,
        recoveriesAfter,
        recoveryDistance,
      },
      islandSurfaceSweep: {
        samples: islandSurfaceSamples,
        failures: islandSurfaceFailures,
      },
      rejectsDeepGroundTransition,
      finalWalk: controller.getSnapshot(),
      runtime: world.getTextSnapshot().runtimePolicies,
    };
  });

  const failures = [];
  if (!audit.safetyGeometry.basePreventUnderwalk) failures.push('Hall base missing under-walk guard');
  if (!audit.safetyGeometry.staircaseAccessRegistered) failures.push('Hall stair access was not registered');
  if (audit.safetyGeometry.podiumBarrierSegmentCount < 70) failures.push('Hall podium barrier is incomplete');
  if (audit.perimeter.breaches.length) failures.push(`${audit.perimeter.breaches.length} Hall perimeter breaches`);
  for (const seam of audit.formerSideSeams) {
    if (seam.normalizedRadius < 0.96) failures.push(`Former side seam ${seam.requestedX} still breaches podium`);
  }
  if (!audit.staircase.reachedFinishedFloor) failures.push('Valid Hall staircase no longer reaches the finished floor');
  if (audit.forcedRecovery.layerDifference < 0.2) failures.push('Hall lower-layer reproduction was not deep enough');
  if (audit.forcedRecovery.interiorVisibleWhileBuried) failures.push('Hall interior activated below its floor');
  if (audit.forcedRecovery.currentInteriorWhileBuried !== null) failures.push('Buried camera was classified as an interior occupant');
  if (audit.forcedRecovery.recoveriesAfter !== audit.forcedRecovery.recoveriesBefore + 1) {
    failures.push('Forced lower-layer position did not trigger one recovery');
  }
  if (audit.forcedRecovery.recoveryDistance > 0.001) failures.push('Recovery did not return to the last safe position');
  if (audit.islandSurfaceSweep.failures.length) {
    failures.push(`${audit.islandSurfaceSweep.failures.length} ring/radial ground gaps`);
  }
  if (!audit.rejectsDeepGroundTransition) failures.push('Ground controller accepts a deep layer drop');
  if (!audit.finalWalk.grounded) failures.push('Final WALK state is not grounded');
  if (errors.length) failures.push(`${errors.length} browser errors`);

  await writeFile(
    `${OUTPUT}/audit.json`,
    JSON.stringify({ audit, errors, failures }, null, 2),
  );
  await page.click('[data-mode="walk"]');
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUTPUT}/hall-safe-walk.png` });
  if (failures.length) throw new Error(failures.join('; '));
  console.log(JSON.stringify({
    hallPerimeterSamples: audit.perimeter.samples,
    minimumNormalizedRadius: audit.perimeter.minimumNormalizedRadius,
    islandSurfaceSamples: audit.islandSurfaceSweep.samples,
    recoveryCount: audit.forcedRecovery.recoveriesAfter,
    finalGround: audit.finalWalk.groundY,
    errors: errors.length,
  }, null, 2));
} finally {
  await browser.close();
}
