import { chromium } from 'playwright';

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
await page.waitForSelector('#walk-mode', { state: 'visible', timeout: 30_000 });
await page.waitForTimeout(800);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  world.setMode('walk');
  world.walkController.refreshNavigation();

  const entrances = [];
  world.modelRoot.traverse((object) => {
    if (!object.isMesh || !object.name.endsWith('__ACCESS_RAMP')) return;
    const owner = object.parent;
    const id = owner?.userData.selectableId;
    if (!owner || !id) return;
    const access = owner.children.find((child) => child.userData.navAccess === true);
    if (!access?.isMesh) return;
    entrances.push({ id, owner, ramp: object, access, kind: access.userData.accessKind });
  });

  const foundations = [];
  const approaches = [];
  world.modelRoot.traverse((object) => {
    if (!object.isMesh) return;
    if (object.userData.solidFoundation === true) {
      object.geometry.computeBoundingBox();
      const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
      foundations.push({
        name: object.name,
        minY: bounds.min.y,
        maxY: bounds.max.y,
        height: bounds.max.y - bounds.min.y,
        navObstacle: object.userData.navObstacle === true,
      });
    }
    if (object.name.endsWith('__ACCESS_APPROACH')) {
      object.geometry.computeBoundingBox();
      const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
      approaches.push({ name: object.name, topY: bounds.max.y });
    }
  });

  const plantedSurfaceY = 1.61;
  const foundationAudit = {
    total: foundations.length,
    grounded: foundations.filter((entry) => Math.abs(entry.minY - plantedSurfaceY) <= 0.005).length,
    collisionSolid: foundations.filter((entry) => entry.navObstacle && entry.height >= 0.3).length,
    failed: foundations.filter(
      (entry) => Math.abs(entry.minY - plantedSurfaceY) > 0.005 || !entry.navObstacle || entry.height < 0.3,
    ),
    approachTotal: approaches.length,
    groundedApproaches: approaches.filter((entry) => Math.abs(entry.topY - plantedSurfaceY) <= 0.005).length,
    failedApproaches: approaches.filter((entry) => Math.abs(entry.topY - plantedSurfaceY) > 0.005),
  };

  const results = entrances.map(({ id, owner, ramp, access, kind }) => {
    owner.updateMatrixWorld(true);
    const rampLength = ramp.geometry.parameters.depth;
    const accessDepth = access.geometry.parameters.depth;
    const outsideZ = ramp.position.z + rampLength * 0.5 + 0.16;
    const insideZ = access.position.z - accessDepth * 0.5 + 0.24;
    const distance = outsideZ - insideZ;
    const steps = Math.max(2, Math.ceil(distance / 0.035));
    const samples = [];

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const localZ = outsideZ + (insideZ - outsideZ) * t;
      const point = world.camera.position.clone().set(0, 0, localZ).applyMatrix4(owner.matrixWorld);
      samples.push({
        localZ,
        point,
        ground: world.walkController.sampleGround(point.x, point.z),
      });
    }

    const first = samples[0];
    let failure = first.ground === null ? 'no-ground-at-start' : null;
    let failureLocalZ = failure ? first.localZ : null;
    let maximumRise = 0;
    let maximumDrop = 0;
    let blockedSteps = 0;

    if (!failure) {
      world.camera.position.set(first.point.x, first.ground + 0.162, first.point.z);
      world.walkController.groundY = first.ground;
      world.walkController.grounded = true;

      for (let index = 1; index < samples.length; index += 1) {
        const previousGround = samples[index - 1].ground;
        const sample = samples[index];
        if (sample.ground === null) {
          failure ??= 'ground-gap';
          failureLocalZ ??= sample.localZ;
          blockedSteps += 1;
          continue;
        }
        if (previousGround !== null) {
          maximumRise = Math.max(maximumRise, sample.ground - previousGround);
          maximumDrop = Math.max(maximumDrop, previousGround - sample.ground);
        }

        const beforeX = world.camera.position.x;
        const beforeZ = world.camera.position.z;
        world.walkController.tryAxisMove(sample.point.x - beforeX, 0);
        world.walkController.tryAxisMove(0, sample.point.z - beforeZ);
        const remaining = Math.hypot(sample.point.x - world.camera.position.x, sample.point.z - world.camera.position.z);
        if (remaining > 0.012) {
          failure ??= 'movement-blocked';
          failureLocalZ ??= sample.localZ;
          blockedSteps += 1;
        }
      }
    }

    const end = samples.at(-1);
    const reachedInterior = end
      ? Math.hypot(end.point.x - world.camera.position.x, end.point.z - world.camera.position.z) < 0.08
      : false;
    const grounded = world.walkController.getSnapshot().grounded;
    return {
      id,
      kind,
      steps,
      startGround: first.ground,
      endGround: end?.ground ?? null,
      maximumRise,
      maximumDrop,
      blockedSteps,
      failure,
      failureLocalZ,
      reachedInterior,
      grounded,
    };
  });

  // Dome portals must also work from the biome interior toward the exterior.
  // This catches one-sided doors and airlock facades that look open outside but
  // become collision traps when the player tries to leave in Walk mode.
  const domeExitResults = entrances.filter(({ kind }) => kind === 'dome').map(({ id, owner, ramp, access }) => {
    owner.updateMatrixWorld(true);
    const rampLength = ramp.geometry.parameters.depth;
    const accessDepth = access.geometry.parameters.depth;
    const exteriorZ = ramp.position.z + rampLength * 0.5 + 0.16;
    const interiorZ = access.position.z - accessDepth * 0.5 + 0.24;
    const distance = exteriorZ - interiorZ;
    const steps = Math.max(2, Math.ceil(distance / 0.035));
    const samples = [];

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const localZ = interiorZ + (exteriorZ - interiorZ) * t;
      const point = world.camera.position.clone().set(0, 0, localZ).applyMatrix4(owner.matrixWorld);
      samples.push({ localZ, point, ground: world.walkController.sampleGround(point.x, point.z) });
    }

    const first = samples[0];
    let failure = first.ground === null ? 'no-ground-at-interior-start' : null;
    let failureLocalZ = failure ? first.localZ : null;
    let blockedSteps = 0;
    if (!failure) {
      world.camera.position.set(first.point.x, first.ground + 0.162, first.point.z);
      world.walkController.groundY = first.ground;
      world.walkController.grounded = true;

      for (let index = 1; index < samples.length; index += 1) {
        const sample = samples[index];
        if (sample.ground === null) {
          failure ??= 'ground-gap';
          failureLocalZ ??= sample.localZ;
          blockedSteps += 1;
          continue;
        }
        const beforeX = world.camera.position.x;
        const beforeZ = world.camera.position.z;
        world.walkController.tryAxisMove(sample.point.x - beforeX, 0);
        world.walkController.tryAxisMove(0, sample.point.z - beforeZ);
        const remaining = Math.hypot(sample.point.x - world.camera.position.x, sample.point.z - world.camera.position.z);
        if (remaining > 0.012) {
          failure ??= 'movement-blocked';
          failureLocalZ ??= sample.localZ;
          blockedSteps += 1;
        }
      }
    }

    const end = samples.at(-1);
    const reachedExterior = end
      ? Math.hypot(end.point.x - world.camera.position.x, end.point.z - world.camera.position.z) < 0.08
      : false;
    return {
      id,
      steps,
      startGround: first.ground,
      endGround: end?.ground ?? null,
      blockedSteps,
      failure,
      failureLocalZ,
      reachedExterior,
      grounded: world.walkController.getSnapshot().grounded,
    };
  });

  const tropical = entrances.find((entrance) => entrance.id === 'tropical-rainforest-dome');
  let tropicalLiveTraversal = null;
  if (tropical) {
    const { owner, ramp, access } = tropical;
    owner.updateMatrixWorld(true);
    const rampLength = ramp.geometry.parameters.depth;
    const accessDepth = access.geometry.parameters.depth;
    const outsideZ = ramp.position.z + rampLength * 0.5 + 0.16;
    const insideZ = access.position.z - accessDepth * 0.5 + 0.24;
    const start = world.camera.position.clone().set(0, 0, outsideZ).applyMatrix4(owner.matrixWorld);
    const target = world.camera.position.clone().set(0, 0, insideZ - 0.5).applyMatrix4(owner.matrixWorld);
    const startGround = world.walkController.sampleGround(start.x, start.z);
    if (startGround !== null) {
      world.camera.position.set(start.x, startGround + 0.162, start.z);
      world.camera.lookAt(target.x, world.camera.position.y, target.z);
      world.walkController.groundY = startGround;
      world.walkController.grounded = true;
      world.setWalkIntent(0, 1, true);
      world.advanceTime(Math.ceil(((outsideZ - insideZ + 0.65) / 0.45) * 1000));
      world.setWalkIntent(0, 0);
      const endLocal = owner.worldToLocal(world.camera.position.clone());
      const snapshot = world.walkController.getSnapshot();
      tropicalLiveTraversal = {
        startLocalZ: outsideZ,
        targetInteriorLocalZ: insideZ,
        endLocalZ: endLocal.z,
        reachedInterior: endLocal.z <= insideZ + 0.12,
        grounded: snapshot.grounded,
      };
    }
  }

  let tropicalSideCollision = null;
  if (tropical) {
    const { owner } = tropical;
    const foundation = owner.children.find((child) => child.userData.solidFoundation === true);
    if (foundation?.isMesh) {
      owner.updateMatrixWorld(true);
      const radius = foundation.geometry.parameters.radiusTop;
      const start = world.camera.position.clone().set(radius + 0.85, 0, 0).applyMatrix4(owner.matrixWorld);
      const target = world.camera.position.clone().set(0, 0, 0).applyMatrix4(owner.matrixWorld);
      const startGround = world.walkController.sampleGround(start.x, start.z);
      if (startGround !== null) {
        world.camera.position.set(start.x, startGround + 0.162, start.z);
        world.walkController.groundY = startGround;
        world.walkController.grounded = true;
        const direction = target.sub(start).setY(0).normalize().multiplyScalar(0.04);
        for (let step = 0; step < 90; step += 1) {
          world.walkController.tryAxisMove(direction.x, 0);
          world.walkController.tryAxisMove(0, direction.z);
        }
        const endLocal = owner.worldToLocal(world.camera.position.clone());
        tropicalSideCollision = {
          radius,
          startLocalX: radius + 0.85,
          endLocalX: endLocal.x,
          blockedOutsideFoundation: endLocal.x >= radius,
          remainedOnTerrain: Math.abs(world.walkController.groundY - plantedSurfaceY) <= 0.005,
          grounded: world.walkController.getSnapshot().grounded,
        };
      }
    }
  }

  world.setWalkIntent(0, 0);
  world.setMode('explore');
  return {
    total: results.length,
    passed: results.filter((entry) => !entry.failure && entry.reachedInterior && entry.grounded).length,
    failed: results.filter((entry) => entry.failure || !entry.reachedInterior || !entry.grounded),
    results,
    domeExitAudit: {
      total: domeExitResults.length,
      passed: domeExitResults.filter((entry) => !entry.failure && entry.reachedExterior && entry.grounded).length,
      failed: domeExitResults.filter((entry) => entry.failure || !entry.reachedExterior || !entry.grounded),
      results: domeExitResults,
    },
    foundationAudit,
    tropicalLiveTraversal,
    tropicalSideCollision,
  };
});

await page.evaluate(() => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  const ramp = dome?.getObjectByName('tropical-rainforest-dome__ACCESS_RAMP');
  if (!dome || !ramp) throw new Error('Tropical dome entrance was unavailable');
  dome.updateMatrixWorld(true);
  const cameraPosition = world.camera.position.clone().set(4.4, 2.8, ramp.position.z + 4.8).applyMatrix4(dome.matrixWorld);
  const target = world.controls.target.clone().set(0, 0.7, ramp.position.z - 0.8).applyMatrix4(dome.matrixWorld);
  world.setMode('explore');
  world.setDaylight(true);
  world.setWeather('clear');
  world.camera.position.copy(cameraPosition);
  world.controls.target.copy(target);
  world.controls.update();
  document.querySelector('.atlas')?.setAttribute('style', 'display:none');
  document.querySelector('.topbar')?.setAttribute('style', 'display:none');
  world.advanceTime(2200);
});
await page.waitForTimeout(350);
await page.screenshot({ path: 'output/accessibility/tropical-dome-ramp.png' });

await page.evaluate(() => {
  const world = window.labIsland;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  const ramp = dome?.getObjectByName('tropical-rainforest-dome__ACCESS_RAMP');
  if (!dome || !ramp) throw new Error('Tropical dome entrance was unavailable');
  dome.updateMatrixWorld(true);
  const cameraPosition = world.camera.position.clone().set(7.2, 1.35, ramp.position.z + 4.8).applyMatrix4(dome.matrixWorld);
  const target = world.controls.target.clone().set(0, 0.3, ramp.position.z - 1.1).applyMatrix4(dome.matrixWorld);
  world.camera.position.copy(cameraPosition);
  world.controls.target.copy(target);
  world.controls.update();
  world.advanceTime(160);
});
await page.waitForTimeout(350);
await page.screenshot({ path: 'output/accessibility/tropical-dome-grounded-base.png' });

const reportedAudit = process.env.STRICT_ACCESSIBILITY === '1'
  ? {
      total: audit.total,
      passed: audit.passed,
      failed: audit.failed,
      domeExitAudit: audit.domeExitAudit,
      foundationAudit: audit.foundationAudit,
      tropicalLiveTraversal: audit.tropicalLiveTraversal,
      tropicalSideCollision: audit.tropicalSideCollision,
    }
  : audit;
console.log(JSON.stringify({ audit: reportedAudit, consoleErrors }, null, 2));
if (process.env.STRICT_ACCESSIBILITY === '1') {
  if (audit.total !== 41) throw new Error(`Expected 41 entrances, found ${audit.total}`);
  if (audit.passed !== audit.total) throw new Error(`${audit.total - audit.passed} entrances remain inaccessible`);
  if (audit.domeExitAudit.total !== 6 || audit.domeExitAudit.passed !== audit.domeExitAudit.total) {
    throw new Error(`Dome exit audit failed: ${JSON.stringify(audit.domeExitAudit.failed)}`);
  }
  if (audit.foundationAudit.total !== 41 || audit.foundationAudit.grounded !== 41 || audit.foundationAudit.collisionSolid !== 41) {
    throw new Error(`Foundation audit failed: ${JSON.stringify(audit.foundationAudit)}`);
  }
  if (audit.foundationAudit.approachTotal !== 41 || audit.foundationAudit.groundedApproaches !== 41) {
    throw new Error(`Ramp approach grounding failed: ${JSON.stringify(audit.foundationAudit.failedApproaches)}`);
  }
  if (!audit.tropicalLiveTraversal?.reachedInterior || !audit.tropicalLiveTraversal.grounded) {
    throw new Error('Live Walk-mode traversal could not enter the Tropical Rainforest Dome');
  }
  if (
    !audit.tropicalSideCollision?.blockedOutsideFoundation ||
    !audit.tropicalSideCollision.remainedOnTerrain ||
    !audit.tropicalSideCollision.grounded
  ) {
    throw new Error(`Tropical dome side collision failed: ${JSON.stringify(audit.tropicalSideCollision)}`);
  }
  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
}

await browser.close();
