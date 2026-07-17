import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_SMOKE_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_SMOKE_OUTPUT_DIRECTORY
  ?? 'output/academic-district';
await mkdir(outputDirectory, { recursive: true });

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 });
  await page.waitForSelector('.mode[data-mode="plan"]', { state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(1_000);

  const audit = await page.evaluate(() => {
    const districtId = 'academic-libraries-theoretical-labs';
    const world = window.labIsland;
    const district = world.objectGroups.get(districtId)
      ?? world.scene.getObjectByName(`DISTRICT__${districtId}`);
    if (!district) throw new Error('Academic district is missing');
    district.updateMatrixWorld(true);

    const isActuallyVisible = (object) => {
      let cursor = object;
      while (cursor) {
        if (cursor.visible === false) return false;
        cursor = cursor.parent;
      }
      return true;
    };
    const getSemanticName = (object) => object.userData.semanticName ?? object.name;
    const getFacilityType = (object) => String(
      object.userData.academicFacilityType ?? '',
    ).trim().toLowerCase();
    const isLibrary = (object) => getFacilityType(object).includes('library');
    const isUniversity = (object) => {
      const type = getFacilityType(object);
      return type.includes('university') || type.includes('college');
    };
    const architectureMeshes = (root) => {
      const meshes = [];
      root.traverse((object) => {
        if (
          object.isMesh
          && isActuallyVisible(object)
          && object.userData.navAccess !== true
          && object.userData.localCampusRoad !== true
          && object.userData.academicEntrancePath !== true
        ) {
          meshes.push(object);
        }
      });
      return meshes;
    };
    const worldBoundsForMeshes = (meshes) => {
      let bounds = null;
      meshes.forEach((mesh) => {
        mesh.geometry.computeBoundingBox();
        if (!mesh.geometry.boundingBox) return;
        const meshBounds = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if (meshBounds.isEmpty()) return;
        if (!bounds) bounds = meshBounds;
        else bounds.union(meshBounds);
      });
      return bounds;
    };
    const serialiseBounds = (bounds) => bounds
      ? { min: bounds.min.toArray(), max: bounds.max.toArray() }
      : null;
    const horizontalGap = (left, right) => {
      const gapX = Math.max(0, left.min.x - right.max.x, right.min.x - left.max.x);
      const gapZ = Math.max(0, left.min.z - right.max.z, right.min.z - left.max.z);
      return Math.hypot(gapX, gapZ);
    };
    const pointInsideHorizontalBounds = (point, bounds, padding = 0) => (
      point.x >= bounds.min.x - padding
      && point.x <= bounds.max.x + padding
      && point.z >= bounds.min.z - padding
      && point.z <= bounds.max.z + padding
    );

    const facilityRoots = district.children.filter(
      (child) => child.userData.academicFacility === true,
    );
    const facilityRecords = facilityRoots.map((root) => {
      const meshes = architectureMeshes(root);
      const bounds = worldBoundsForMeshes(meshes);
      const walkAccess = root.userData.walkAccess;
      return {
        root,
        bounds,
        record: {
          name: getSemanticName(root),
          type: getFacilityType(root),
          directChild: root.parent === district,
          meshCount: meshes.length,
          geometryCount: new Set(meshes.map((mesh) => mesh.geometry.uuid)).size,
          bounds: serialiseBounds(bounds),
          accessibleInWalk: root.userData.accessibleInWalk === true,
          hasWalkAccess: Boolean(walkAccess && typeof walkAccess === 'object'),
          walkAccessFields: walkAccess && typeof walkAccess === 'object'
            ? Object.keys(walkAccess).sort()
            : [],
        },
      };
    });

    const spacing = [];
    for (let leftIndex = 0; leftIndex < facilityRecords.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < facilityRecords.length; rightIndex += 1) {
        const left = facilityRecords[leftIndex];
        const right = facilityRecords[rightIndex];
        if (!left.bounds || !right.bounds) continue;
        spacing.push({
          left: left.record.name,
          right: right.record.name,
          gap: horizontalGap(left.bounds, right.bounds),
        });
      }
    }

    const parks = district.children.filter((child) => {
      const type = String(
        child.userData.academicFeatureType
        ?? child.userData.campusFeatureType
        ?? child.userData.featureRole
        ?? '',
      ).toLowerCase();
      return child.userData.academicPark === true
        || ['park', 'garden', 'quadrangle'].some((token) => type.includes(token));
    }).map((park) => ({
      name: getSemanticName(park),
      type: String(
        park.userData.academicFeatureType
        ?? park.userData.campusFeatureType
        ?? park.userData.featureRole
        ?? '',
      ),
      directChild: park.parent === district,
    }));

    const localRoads = [];
    district.traverse((object) => {
      if (
        !object.isMesh
        || object.userData.localCampusRoad !== true
        || !isActuallyVisible(object)
      ) return;
      object.geometry.computeBoundingBox();
      if (!object.geometry.boundingBox) return;
      const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
      if (bounds.isEmpty()) return;
      const center = bounds.getCenter(world.camera.position.clone());
      const exposedAtCenter = facilityRecords.every(
        (facility) => !facility.bounds || !pointInsideHorizontalBounds(center, facility.bounds, 0.05),
      );
      localRoads.push({
        name: object.name,
        width: bounds.max.x - bounds.min.x,
        depth: bounds.max.z - bounds.min.z,
        exposedAtCenter,
      });
    });

    const pointToVector = (rawPoint) => {
      if (Array.isArray(rawPoint) && rawPoint.length >= 3) {
        return world.camera.position.clone().fromArray(rawPoint);
      }
      if (
        rawPoint
        && Number.isFinite(rawPoint.x)
        && Number.isFinite(rawPoint.y)
        && Number.isFinite(rawPoint.z)
      ) {
        return world.camera.position.clone().set(rawPoint.x, rawPoint.y, rawPoint.z);
      }
      return null;
    };
    const accessPointToWorld = (root, access, key) => {
      const rawPoint = access?.[key];
      const point = pointToVector(rawPoint);
      if (!point) return null;
      const pointSpace = String(rawPoint?.space ?? access.coordinateSpace ?? access.space ?? 'facility-local')
        .toLowerCase();
      if (pointSpace === 'world' || pointSpace === 'world-space') return point;
      if (
        pointSpace === 'district'
        || pointSpace === 'district-local'
        || pointSpace === 'district-space'
      ) {
        return point.applyMatrix4(district.matrixWorld);
      }
      return point.applyMatrix4(root.matrixWorld);
    };

    world.setMode('walk');
    world.walkController.refreshNavigation();
    const accessResults = facilityRecords
      .filter(({ root }) => root.userData.accessibleInWalk === true)
      .map(({ root, record }) => {
        const access = root.userData.walkAccess;
        const routeKeys = ['routeStart', 'threshold', 'interiorTarget'];
        const route = routeKeys.map((key) => accessPointToWorld(root, access, key));
        const result = {
          name: record.name,
          type: record.type,
          accessibleInWalk: record.accessibleInWalk,
          hasWalkAccess: record.hasWalkAccess,
          routeComplete: route.every(Boolean),
          routeDistances: [],
          startGround: null,
          finalGround: null,
          blockedSteps: 0,
          maximumRemaining: 0,
          reachedInterior: false,
          passed: false,
        };
        if (!result.accessibleInWalk || !result.hasWalkAccess || !result.routeComplete) return result;

        result.routeDistances = [
          route[0].distanceTo(route[1]),
          route[1].distanceTo(route[2]),
        ];
        const startGround = world.walkController.sampleGround(route[0].x, route[0].z);
        result.startGround = startGround;
        if (startGround === null) return result;

        world.camera.position.set(route[0].x, startGround + 0.162, route[0].z);
        world.walkController.groundY = startGround;
        world.walkController.grounded = true;

        for (let segmentIndex = 0; segmentIndex < route.length - 1; segmentIndex += 1) {
          const segmentStart = route[segmentIndex];
          const segmentEnd = route[segmentIndex + 1];
          const distance = segmentStart.distanceTo(segmentEnd);
          const steps = Math.max(2, Math.ceil(distance / 0.03));
          for (let step = 1; step <= steps; step += 1) {
            const sample = segmentStart.clone().lerp(segmentEnd, step / steps);
            const before = world.camera.position.clone();
            world.walkController.tryAxisMove(sample.x - before.x, 0);
            world.walkController.tryAxisMove(0, sample.z - world.camera.position.z);
            const remaining = Math.hypot(
              sample.x - world.camera.position.x,
              sample.z - world.camera.position.z,
            );
            result.maximumRemaining = Math.max(result.maximumRemaining, remaining);
            if (remaining > 0.045) result.blockedSteps += 1;
            if (world.walkController.groundY !== null) {
              world.camera.position.y = world.walkController.groundY + 0.162;
            }
          }
        }

        result.finalGround = world.walkController.sampleGround(route[2].x, route[2].z);
        const finalDistance = Math.hypot(
          route[2].x - world.camera.position.x,
          route[2].z - world.camera.position.z,
        );
        result.reachedInterior = finalDistance <= 0.12;
        result.finalDistance = finalDistance;
        result.passed = result.blockedSteps === 0
          && result.reachedInterior
          && result.finalGround !== null;
        return result;
      });
    world.setWalkIntent(0, 0);

    return {
      districtId,
      precinct: district.userData.academicPrecinct ?? null,
      facilities: facilityRecords.map(({ record }) => record),
      facilityCount: facilityRecords.length,
      libraryCount: facilityRecords.filter(({ root }) => isLibrary(root)).length,
      universityCount: facilityRecords.filter(({ root }) => isUniversity(root)).length,
      walkEligibleCount: facilityRecords.filter(({ root }) => root.userData.accessibleInWalk === true).length,
      parks,
      localRoads,
      exposedRoadCount: localRoads.filter((road) => road.exposedAtCenter).length,
      spacing: spacing.sort((left, right) => left.gap - right.gap),
      minimumBuildingGap: spacing.length
        ? Math.min(...spacing.map((entry) => entry.gap))
        : null,
      accessResults,
    };
  });

  const hideNonEssentialUi = async ({ keepWalkHud = false } = {}) => {
    await page.evaluate(({ keepWalkHud }) => {
      document.querySelectorAll(
        '.atlas, .topbar, #scene-card, .scene-card, .layerbar, .compass, .interaction-hint',
      ).forEach((element) => element.setAttribute('style', 'display:none'));
      const walkHud = document.querySelector('.walk-hud');
      if (!walkHud) return;
      if (keepWalkHud) walkHud.style.removeProperty('display');
      else walkHud.style.display = 'none';
    }, { keepWalkHud });
  };

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const facilities = district.children.filter((child) => child.userData.academicFacility === true);
    const focus = district.getWorldPosition(world.controls.target.clone()).setY(0);
    if (facilities.length) {
      focus.set(0, 0, 0);
      facilities.forEach((facility) => focus.add(facility.getWorldPosition(world.camera.position.clone())));
      focus.multiplyScalar(1 / facilities.length).setY(0.8);
    }
    const outward = focus.clone().setY(0).normalize();
    const tangent = world.camera.up.clone().set(-outward.z, 0, outward.x).normalize();
    world.setMode('plan');
    world.setDaylight(true);
    world.setWeather?.('clear');
    world.cameraTween = null;
    world.camera.fov = 46;
    world.camera.position.copy(focus)
      .addScaledVector(outward, 76)
      .addScaledVector(tangent, 62)
      .add(world.camera.up.clone().multiplyScalar(90));
    world.controls.target.copy(focus);
    world.camera.lookAt(focus);
    world.camera.updateProjectionMatrix();
    world.controls.update();
    world.advanceTime(250);
  });
  await hideNonEssentialUi();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/academic-plan-overview.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const facilities = district.children.filter((child) => child.userData.academicFacility === true);
    const focus = district.getWorldPosition(world.controls.target.clone()).setY(0.9);
    if (facilities.length) {
      focus.set(0, 0, 0);
      facilities.forEach((facility) => focus.add(facility.getWorldPosition(world.camera.position.clone())));
      focus.multiplyScalar(1 / facilities.length).setY(0.9);
    }
    const outward = focus.clone().setY(0).normalize();
    const tangent = world.camera.up.clone().set(-outward.z, 0, outward.x).normalize();
    world.setMode('explore');
    world.setDaylight(true);
    world.setWeather?.('clear');
    world.cameraTween = null;
    world.camera.fov = 54;
    world.camera.position.copy(focus)
      .addScaledVector(outward, 27)
      .addScaledVector(tangent, 34)
      .add(world.camera.up.clone().multiplyScalar(13));
    world.controls.target.copy(focus);
    world.camera.lookAt(focus);
    world.camera.updateProjectionMatrix();
    world.controls.update();
    world.advanceTime(350);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/academic-explore-courtyard.png` });

  const walkShot = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const library = district.children.find((child) => (
      child.userData.academicFacility === true
      && String(child.userData.academicFacilityType ?? '').toLowerCase().includes('library')
      && child.userData.accessibleInWalk === true
      && child.userData.walkAccess
    ));
    if (!library) return { available: false };
    district.updateMatrixWorld(true);
    const access = library.userData.walkAccess;
    const makePoint = (raw) => {
      if (Array.isArray(raw) && raw.length >= 3) return world.camera.position.clone().fromArray(raw);
      if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y) && Number.isFinite(raw.z)) {
        return world.camera.position.clone().set(raw.x, raw.y, raw.z);
      }
      return null;
    };
    const toWorld = (raw) => {
      const point = makePoint(raw);
      if (!point) return null;
      const space = String(raw?.space ?? access.coordinateSpace ?? access.space ?? 'facility-local').toLowerCase();
      if (space === 'world' || space === 'world-space') return point;
      if (space === 'district' || space === 'district-local' || space === 'district-space') {
        return point.applyMatrix4(district.matrixWorld);
      }
      return point.applyMatrix4(library.matrixWorld);
    };
    const start = toWorld(access.routeStart);
    const target = toWorld(access.interiorTarget) ?? toWorld(access.threshold);
    if (!start || !target) return { available: false };
    world.setMode('walk');
    world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(start.x, start.z);
    if (ground === null) return { available: false };
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.camera.lookAt(target.x, ground + 0.155, target.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.setDaylight(true);
    world.setWeather?.('clear');
    world.advanceTime(180);
    return {
      available: true,
      facility: library.userData.semanticName ?? library.name,
      ground,
    };
  });
  await hideNonEssentialUi({ keepWalkHud: true });
  await page.waitForTimeout(350);
  if (walkShot.available) {
    await page.screenshot({ path: `${outputDirectory}/academic-walk-library-access.png` });
  }

  if (!audit.precinct || typeof audit.precinct !== 'object') {
    throw new Error('Academic district lacks academicPrecinct metadata');
  }
  const style = String(audit.precinct.style ?? audit.precinct.architecturalStyle ?? '')
    .toLowerCase();
  if (!style.includes('dark') || !style.includes('academ')) {
    throw new Error(`Academic precinct style is not dark academia: ${style || '(missing)'}`);
  }
  if (audit.facilityCount < 4) {
    throw new Error(`Expected at least four academic facility roots, found ${audit.facilityCount}`);
  }
  if (audit.libraryCount < 2 || audit.universityCount < 2) {
    throw new Error(
      `Academic programme is incomplete: ${audit.libraryCount} libraries, ${audit.universityCount} university buildings`,
    );
  }
  const invalidFacilities = audit.facilities.filter((facility) => (
    !facility.directChild
    || facility.meshCount < 4
    || !facility.bounds
  ));
  if (invalidFacilities.length) {
    throw new Error(`Academic facilities are not authored multi-mesh roots: ${JSON.stringify(invalidFacilities)}`);
  }
  if (new Set(audit.facilities.map((facility) => facility.name)).size !== audit.facilityCount) {
    throw new Error('Academic facility semantic names are not unique');
  }
  if (audit.parks.length < 2 || audit.parks.some((park) => !park.directChild)) {
    throw new Error(`Expected two direct-child academic parks: ${JSON.stringify(audit.parks)}`);
  }
  console.log(JSON.stringify({ closestAcademicBuildingPairs: audit.spacing.slice(0, 12) }, null, 2));
  if (audit.minimumBuildingGap === null || audit.minimumBuildingGap < 1.2) {
    throw new Error(
      `Academic buildings remain clumped; minimum visible-architecture gap is ${audit.minimumBuildingGap}`,
    );
  }
  const minimumRoadCount = Math.max(4, audit.facilityCount - 1);
  if (audit.localRoads.length < minimumRoadCount || audit.exposedRoadCount < minimumRoadCount) {
    throw new Error(
      `Campus roads are missing or hidden by buildings: ${audit.exposedRoadCount}/${audit.localRoads.length} exposed, expected ${minimumRoadCount}`,
    );
  }
  if (audit.localRoads.some((road) => road.width < 0.08 || road.depth < 0.08)) {
    throw new Error(`A campus road has no visible surface: ${JSON.stringify(audit.localRoads)}`);
  }
  const inaccessible = audit.accessResults.filter((result) => !result.passed);
  if (audit.accessResults.length !== audit.walkEligibleCount || inaccessible.length) {
    throw new Error(`Academic WALK access failed: ${JSON.stringify(inaccessible)}`);
  }
  if (!walkShot.available) throw new Error('Could not stage an academic library WALK-access screenshot');
  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    district: audit.districtId,
    style,
    facilities: audit.facilities,
    libraries: audit.libraryCount,
    universityBuildings: audit.universityCount,
    parks: audit.parks,
    localRoads: audit.localRoads.length,
    exposedRoads: audit.exposedRoadCount,
    minimumBuildingGap: audit.minimumBuildingGap,
    walkAccess: audit.accessResults,
    screenshots: [
      `${outputDirectory}/academic-plan-overview.png`,
      `${outputDirectory}/academic-explore-courtyard.png`,
      `${outputDirectory}/academic-walk-library-access.png`,
    ],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
