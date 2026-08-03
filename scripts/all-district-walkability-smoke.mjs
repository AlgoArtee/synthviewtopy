import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.DISTRICT_WALKABILITY_OUTPUT ?? 'output/all-district-walkability';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
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

  const audit = await page.evaluate(async () => {
    const world = window.labIsland;
    const controller = world.walkController;

    const ringRadii = [];
    world.modelRoot.traverse((object) => {
      if (!object.isMesh || object.userData.districtDelimiter !== true || object.userData.roadType !== 'ring') return;
      const positions = object.geometry.attributes.position;
      let minimum = Infinity;
      let maximum = -Infinity;
      for (let index = 0; index < positions.count; index += 1) {
        const radius = Math.hypot(positions.getX(index), positions.getZ(index));
        minimum = Math.min(minimum, radius);
        maximum = Math.max(maximum, radius);
      }
      ringRadii.push((minimum + maximum) * 0.5);
    });
    ringRadii.sort((left, right) => left - right);

    // Collision is intentionally disabled in PLAN. Run every cell with WALK
    // active and stream the camera to that district so the audit uses exactly
    // the resident collider set a player encounters there.
    world.setMode('walk');
    world.updateWorldStreaming(false, true);

    const broadPhaseHit = (x, z, bodyBottom, bodyTop) => controller.obstacleBounds.some((bounds) => (
      x >= bounds.min.x - 0.03
      && x <= bounds.max.x + 0.03
      && z >= bounds.min.z - 0.03
      && z <= bounds.max.z + 0.03
      && bodyTop >= bounds.min.y
      && bodyBottom <= bounds.max.y
    ));
    const inspectPoint = (districtId, boundary, x, z) => {
      const ground = controller.sampleGround(x, z, { spawnSearch: true });
      if (ground === null) return { districtId, boundary, x, z, ground: null, clear: false, broadOnly: false };
      const bodyBottom = ground + 0.015;
      const bodyTop = ground + 0.162;
      const broad = broadPhaseHit(x, z, bodyBottom, bodyTop);
      const precise = controller.collidesWithObstacle(x, z, bodyBottom, bodyTop, false);
      const blockerIndex = controller.findObstacleCollisionIndex(x, z, bodyBottom, bodyTop, false);
      const blocker = blockerIndex >= 0 ? controller.navigationObstacles[blockerIndex] : null;
      return {
        districtId,
        boundary,
        x,
        z,
        ground,
        clear: controller.isSpawnClear(x, z, ground),
        broadOnly: broad && !precise,
        blocker: blockerIndex < 0 ? null : {
          index: blockerIndex,
          name: blocker?.object?.name || null,
          parent: blocker?.object?.parent?.name || null,
          selectableId: blocker?.object?.userData?.selectableId ?? null,
          geometry: blocker?.object?.geometry?.type ?? null,
        },
      };
    };

    const districtResults = [];
    const allSamples = [];
    let maximumObstacleCount = 0;
    let maximumPreciseObstacleCount = 0;
    const SAMPLE_SPACING = 0.75;
    for (const [id, group] of world.objectGroups.entries()) {
      const cell = group.userData.districtCell;
      const population = group.userData.population;
      if (!cell || !population) continue;
      group.updateWorldMatrix(true, true);
      const anchor = group.getWorldPosition(world.camera.position.clone());
      world.camera.position.set(anchor.x, 6, anchor.z);
      world.updateWorldStreaming(false, true);
      // Detail activation is asynchronous and bounded to 8 ms slices. Wait for
      // pre-arrival collision residency before auditing this district cell.
      await new Promise((resolve) => setTimeout(resolve, 30));
      world.updateWorldStreaming(false, true);
      controller.refreshNavigation();
      maximumObstacleCount = Math.max(maximumObstacleCount, controller.obstacleBounds.length);
      maximumPreciseObstacleCount = Math.max(
        maximumPreciseObstacleCount,
        controller.navigationObstacles.filter(Boolean).length,
      );
      const samples = [];
      const movementProbes = [];
      const roadRadius = (radius) => ringRadii.some((candidate) => Math.abs(candidate - radius) < 0.1);
      const probePath = (label, start, end) => {
        const startGround = controller.sampleGround(start.x, start.z, { spawnSearch: true });
        if (startGround === null || !controller.isSpawnClear(start.x, start.z, startGround)) {
          movementProbes.push({ label, passed: false, reason: 'blocked-start', startGround });
          return;
        }
        world.camera.position.set(start.x, startGround + 0.162, start.z);
        controller.groundY = startGround;
        controller.grounded = true;
        controller.velocityY = 0;
        controller.isJumping = false;
        const distance = Math.hypot(end.x - start.x, end.z - start.z);
        const steps = Math.max(2, Math.ceil(distance / 0.03));
        let blockContext = null;
        for (let index = 1; index <= steps; index += 1) {
          const targetX = start.x + (end.x - start.x) * (index / steps);
          const targetZ = start.z + (end.z - start.z) * (index / steps);
          const previousGround = controller.groundY;
          const targetGround = controller.sampleGround(targetX, targetZ);
          controller.tryAxisMove(targetX - world.camera.position.x, 0);
          controller.tryAxisMove(0, targetZ - world.camera.position.z);
          if (controller.groundY !== null) world.camera.position.y = controller.groundY + 0.162;
          const remainingAtStep = Math.hypot(targetX - world.camera.position.x, targetZ - world.camera.position.z);
          if (!blockContext && remainingAtStep > 0.055) {
            blockContext = {
              index,
              target: [targetX, targetZ],
              previousGround,
              targetGround,
              groundDelta: previousGround === null || targetGround === null ? null : targetGround - previousGround,
            };
          }
        }
        const remaining = Math.hypot(end.x - world.camera.position.x, end.z - world.camera.position.z);
        movementProbes.push({
          label,
          passed: remaining < 0.055,
          reason: remaining < 0.055 ? null : 'movement-blocked',
          remaining,
          startGround,
          endGround: controller.groundY,
          blockContext,
        });
      };
      const addRing = (radius, label) => {
        if (!roadRadius(radius)) return;
        const arcLength = Math.max(0.001, radius * (cell.endAngle - cell.startAngle));
        const steps = Math.max(2, Math.ceil(arcLength / SAMPLE_SPACING));
        for (let index = 0; index <= steps; index += 1) {
          const angle = cell.startAngle + (cell.endAngle - cell.startAngle) * (index / steps);
          samples.push(inspectPoint(id, label, Math.cos(angle) * radius, Math.sin(angle) * radius));
        }
      };
      const addRadial = (angle, label) => {
        const length = cell.outerRadius - cell.innerRadius;
        const steps = Math.max(2, Math.ceil(length / SAMPLE_SPACING));
        for (let index = 0; index <= steps; index += 1) {
          const radius = cell.innerRadius + length * (index / steps);
          samples.push(inspectPoint(id, label, Math.cos(angle) * radius, Math.sin(angle) * radius));
        }
      };
      addRing(cell.innerRadius, 'inner-ring-road');
      addRing(cell.outerRadius, 'outer-ring-road');
      addRadial(cell.startAngle, 'start-radial-road');
      addRadial(cell.endAngle, 'end-radial-road');

      for (const [radius, label] of [
        [cell.innerRadius, 'inner-ring-road-movement'],
        [cell.outerRadius, 'outer-ring-road-movement'],
      ]) {
        if (!roadRadius(radius) || radius <= 0) continue;
        const halfAngle = Math.min(0.6 / radius, (cell.endAngle - cell.startAngle) * 0.12);
        probePath(
          label,
          { x: Math.cos(cell.centerAngle - halfAngle) * radius, z: Math.sin(cell.centerAngle - halfAngle) * radius },
          { x: Math.cos(cell.centerAngle + halfAngle) * radius, z: Math.sin(cell.centerAngle + halfAngle) * radius },
        );
      }
      const radialMidpoint = (cell.innerRadius + cell.outerRadius) * 0.5;
      for (const [angle, label] of [
        [cell.startAngle, 'start-radial-road-movement'],
        [cell.endAngle, 'end-radial-road-movement'],
      ]) {
        probePath(
          label,
          { x: Math.cos(angle) * (radialMidpoint - 0.6), z: Math.sin(angle) * (radialMidpoint - 0.6) },
          { x: Math.cos(angle) * (radialMidpoint + 0.6), z: Math.sin(angle) * (radialMidpoint + 0.6) },
        );
      }
      if (id === 'dark-center-lab-megabuilding') {
        probePath(
          'dark-center-covered-delimiter-passage',
          { x: 0, z: -3.5 },
          { x: 0, z: 6.5 },
        );
      }
      const accessRamp = group.getObjectByName(`${id}__ACCESS_RAMP`);
      const accessOwner = accessRamp?.parent;
      const accessVolume = accessOwner?.children.find((child) => child.userData.navAccess === true);
      if (accessRamp?.isMesh && accessOwner && accessVolume?.isMesh) {
        accessOwner.updateWorldMatrix(true, true);
        const rampLength = accessRamp.geometry.parameters.depth;
        const accessDepth = accessVolume.geometry.parameters.depth;
        const outsideZ = accessRamp.position.z + rampLength * 0.5 + 0.16;
        const insideZ = accessVolume.position.z - accessDepth * 0.5 + 0.24;
        const start = world.camera.position.clone().set(0, 0, outsideZ).applyMatrix4(accessOwner.matrixWorld);
        const end = world.camera.position.clone().set(0, 0, insideZ).applyMatrix4(accessOwner.matrixWorld);
        probePath(`${id}-district-entrance`, start, end);
      }
      allSamples.push(...samples);
      const failures = samples.filter((sample) => !sample.clear);
      const movementFailures = movementProbes.filter((probe) => !probe.passed);
      districtResults.push({
        id,
        sampleCount: samples.length,
        clearCount: samples.length - failures.length,
        broadOnlyMarginsAvoided: samples.filter((sample) => sample.broadOnly).length,
        movementProbeCount: movementProbes.length,
        movementFailures,
        failures: failures.slice(0, 12),
      });
    }

    const representative = allSamples.find((sample) => sample.broadOnly && sample.clear)
      ?? allSamples.find((sample) => sample.clear);
    const failedDistricts = districtResults.filter((result) => (
      result.failures.length || result.movementFailures.length
    ));
    const textState = JSON.parse(window.render_game_to_text());
    return {
      districtCount: districtResults.length,
      ringRadii,
      obstacleCount: maximumObstacleCount,
      preciseObstacleCount: maximumPreciseObstacleCount,
      sampleCount: allSamples.length,
      clearCount: allSamples.filter((sample) => sample.clear).length,
      broadOnlyMarginsAvoided: allSamples.filter((sample) => sample.broadOnly).length,
      movementProbeCount: districtResults.reduce((sum, result) => sum + result.movementProbeCount, 0),
      failedDistricts,
      districtResults,
      representative,
      textState: {
        mode: textState.mode,
        districts: textState.world?.districts ?? textState.districts,
        runtimePolicies: textState.runtimePolicies,
      },
    };
  });

  if (audit.representative) {
    await page.click('[data-mode="walk"]');
    await page.evaluate((point) => {
      const world = window.labIsland;
      const controller = world.walkController;
      world.setMode('walk');
      world.cameraTween = null;
      world.camera.position.set(point.x, 4, point.z);
      world.updateWorldStreaming(false, true);
      controller.refreshNavigation();
      const ground = controller.sampleGround(point.x, point.z, { spawnSearch: true });
      if (ground === null) throw new Error('Representative delimiter-road screenshot has no ground');
      const radial = Math.hypot(point.x, point.z) || 1;
      const tangent = world.camera.position.clone().set(-point.z / radial, 0, point.x / radial);
      controller.enter(
        world.camera.position.clone().set(point.x, ground, point.z),
        tangent,
        world.camera.position.clone().set(point.x, ground, point.z),
      );
      world.advanceTime(180);
    }, audit.representative);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUTPUT}/walkable-delimiter-road.png` });
  }

  await page.evaluate(() => {
    const world = window.labIsland;
    const controller = world.walkController;
    const district = world.objectGroups.get('dark-center-lab-megabuilding');
    if (!district) throw new Error('Dark Center district was unavailable for passage review');
    district.updateWorldMatrix(true, true);
    const start = world.camera.position.clone().set(0, 0, -4.1).applyMatrix4(district.matrixWorld);
    const target = world.camera.position.clone().set(0, 0, 4.3).applyMatrix4(district.matrixWorld);
    world.camera.position.set(start.x, 4, start.z);
    world.updateWorldStreaming(false, true);
    controller.refreshNavigation();
    const ground = controller.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error('Dark Center covered passage has no WALK ground');
    controller.enter(
      start.clone().setY(ground),
      target.clone().sub(start).setY(0).normalize(),
      start.clone().setY(ground),
    );
    world.advanceTime(180);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUTPUT}/dark-center-covered-passage.png` });

  const failures = [];
  if (audit.districtCount !== 35) failures.push(`Expected 35 districts, found ${audit.districtCount}`);
  if (audit.ringRadii.length !== 5) failures.push(`Expected five ring roads, found ${audit.ringRadii.length}`);
  if (audit.preciseObstacleCount < 100) failures.push('Precise obstacle registry was not populated');
  if (audit.failedDistricts.length) failures.push(`${audit.failedDistricts.length} districts retain blocked delimiter-road samples`);
  if (audit.clearCount !== audit.sampleCount) failures.push(`${audit.sampleCount - audit.clearCount} delimiter-road samples are blocked`);
  if (audit.movementProbeCount < 100) failures.push(`Only ${audit.movementProbeCount} delimiter movement probes ran`);
  if (audit.broadOnlyMarginsAvoided < 1) failures.push('Audit did not exercise an avoided world-AABB margin');
  if (errors.length) failures.push(`${errors.length} browser errors`);
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify({ audit, errors, failures }, null, 2));
  if (failures.length) throw new Error(failures.join('; '));
  console.log(JSON.stringify({
    districts: audit.districtCount,
    ringRoads: audit.ringRadii.length,
    obstacleCount: audit.obstacleCount,
    preciseObstacleCount: audit.preciseObstacleCount,
    delimiterSamples: audit.sampleCount,
    movementProbes: audit.movementProbeCount,
    broadOnlyMarginsAvoided: audit.broadOnlyMarginsAvoided,
    errors: errors.length,
  }, null, 2));
} finally {
  await browser.close();
}
