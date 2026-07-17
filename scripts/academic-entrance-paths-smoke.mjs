import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_PATH_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_ENTRANCE_PATH_OUTPUT ?? 'output/academic-entrance-paths';
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
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.scene), null, { timeout: 180_000 });
  await page.waitForTimeout(750);

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    district.updateMatrixWorld(true);
    const vector = () => world.camera.position.clone();
    const paths = [];
    const barriers = [];
    const facilities = [];
    const forbiddenPaths = [];
    let leafClusterCount = 0;

    district.traverse((object) => {
      if (object.userData.academicLeafLitter === true) {
        leafClusterCount = Number(object.userData.leafClusterCount ?? 0);
      }
      if (object.userData.academicPathNetworkSegment === true) {
        const endpoints = object.userData.roadEndpoints;
        const parameters = object.geometry?.parameters ?? {};
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
        paths.push({
          name: object.name,
          role: object.userData.academicPathRole,
          width: Number(parameters.width),
          material: object.material,
          materialName: object.material?.name,
          textureName: object.material?.map?.name,
          top: bounds.max.y,
          start: vector().fromArray(endpoints.start).applyMatrix4(object.parent.matrixWorld).toArray(),
          end: vector().fromArray(endpoints.end).applyMatrix4(object.parent.matrixWorld).toArray(),
        });
      }
      if (object.userData.academicFacility === true) {
        facilities.push({
          name: String(object.userData.semanticName),
          threshold: object.userData.walkAccess.threshold,
          routeStart: object.userData.walkAccess.routeStart,
          connection: object.userData.academicPathConnection,
        });
      }
      if (object.userData.navBarrierSegments?.length && (object.name.includes('TREE') || object.name.includes('BENCH'))) {
        object.userData.navBarrierSegments.forEach((segment) => {
          barriers.push({
            owner: object.name,
            start: vector().fromArray(segment.start).applyMatrix4(object.parent.matrixWorld).toArray(),
            end: vector().fromArray(segment.end).applyMatrix4(object.parent.matrixWorld).toArray(),
            radius: Number(segment.radius),
          });
        });
      }
      if (
        object.name.includes('LOCAL_CAMPUS_ROAD')
        || object.name.includes('ACADEMIC_LOCAL_ROAD')
        || object.name.includes('CROSS_PATH')
        || object.name === 'ACADEMIC__COVERED_CHAPEL_PASSAGE_FLOOR'
      ) forbiddenPaths.push(object.name);
    });

    const pointToSegmentDistance = (point, start, end) => {
      const dx = end[0] - start[0];
      const dz = end[2] - start[2];
      const lengthSq = dx * dx + dz * dz;
      const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (
        (point[0] - start[0]) * dx + (point[2] - start[2]) * dz
      ) / lengthSq));
      return Math.hypot(point[0] - start[0] - dx * t, point[2] - start[2] - dz * t);
    };
    const cross = (a, b, c) => (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    const segmentDistance = (a, b, c, d) => {
      const firstLengthSq = (b[0] - a[0]) ** 2 + (b[2] - a[2]) ** 2;
      const secondLengthSq = (d[0] - c[0]) ** 2 + (d[2] - c[2]) ** 2;
      const boundsOverlap = Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0]))
          <= Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0])) + 1e-8
        && Math.max(Math.min(a[2], b[2]), Math.min(c[2], d[2]))
          <= Math.min(Math.max(a[2], b[2]), Math.max(c[2], d[2])) + 1e-8;
      const intersects = firstLengthSq > 1e-10
        && secondLengthSq > 1e-10
        && boundsOverlap
        && cross(a, b, c) * cross(a, b, d) <= 0
        && cross(c, d, a) * cross(c, d, b) <= 0;
      if (intersects) return 0;
      return Math.min(
        pointToSegmentDistance(a, c, d),
        pointToSegmentDistance(b, c, d),
        pointToSegmentDistance(c, a, b),
        pointToSegmentDistance(d, a, b),
      );
    };
    const obstacleIntrusions = [];
    paths.forEach((path) => {
      barriers.forEach((barrier) => {
        const clearance = segmentDistance(path.start, path.end, barrier.start, barrier.end)
          - path.width * 0.5 - barrier.radius;
        if (clearance < 0) obstacleIntrusions.push({
          path: path.name,
          owner: barrier.owner,
          clearance: Number(clearance.toFixed(4)),
        });
      });
    });

    const adjacency = paths.map(() => new Set());
    for (let left = 0; left < paths.length; left += 1) {
      for (let right = left + 1; right < paths.length; right += 1) {
        if (segmentDistance(paths[left].start, paths[left].end, paths[right].start, paths[right].end) <= 0.012) {
          adjacency[left].add(right);
          adjacency[right].add(left);
        }
      }
    }
    const processionalIndex = paths.findIndex((path) => path.role === 'main-processional');
    const connected = new Set(processionalIndex >= 0 ? [processionalIndex] : []);
    const queue = [...connected];
    while (queue.length) {
      const current = queue.shift();
      adjacency[current].forEach((next) => {
        if (connected.has(next)) return;
        connected.add(next);
        queue.push(next);
      });
    }

    const pathEndpoints = paths.flatMap((path) => [path.start, path.end]);
    const entranceConnections = facilities.map((facility) => {
      const endpoint = facility.name === 'Blackwood University Great Hall' ? facility.routeStart : facility.threshold;
      const worldEndpoint = vector().fromArray(endpoint).applyMatrix4(district.matrixWorld).toArray();
      return {
        name: facility.name,
        endpointType: facility.connection?.endpointType,
        nearestEndpoint: Number(Math.min(...pathEndpoints.map((candidate) => (
          Math.hypot(candidate[0] - worldEndpoint[0], candidate[2] - worldEndpoint[2])
        ))).toFixed(5)),
        pathNames: facility.connection?.pathNames ?? [],
      };
    });

    world.setMode('walk');
    world.walkController.refreshNavigation();
    const walkAprons = facilities.map((facility) => {
      const start = vector().fromArray(facility.routeStart).applyMatrix4(district.matrixWorld);
      const end = vector().fromArray(facility.threshold).applyMatrix4(district.matrixWorld);
      const distance = start.distanceTo(end);
      const steps = Math.max(2, Math.ceil(distance / 0.03));
      const startGround = world.walkController.sampleGround(start.x, start.z);
      let blockedSteps = 0;
      let groundGaps = 0;
      if (startGround !== null) {
        world.camera.position.set(start.x, startGround + 0.162, start.z);
        world.walkController.groundY = startGround;
        world.walkController.grounded = true;
        for (let step = 1; step <= steps; step += 1) {
          const target = start.clone().lerp(end, step / steps);
          const ground = world.walkController.sampleGround(target.x, target.z);
          if (ground === null) groundGaps += 1;
          const beforeX = world.camera.position.x;
          const beforeZ = world.camera.position.z;
          world.walkController.tryAxisMove(target.x - beforeX, 0);
          world.walkController.tryAxisMove(0, target.z - beforeZ);
          if (Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z) > 0.015) blockedSteps += 1;
        }
      } else {
        groundGaps = steps;
      }
      return {
        name: facility.name,
        blockedSteps,
        groundGaps,
        endDistance: Number(Math.hypot(
          end.x - world.camera.position.x,
          end.z - world.camera.position.z,
        ).toFixed(4)),
      };
    });

    const processional = paths[processionalIndex];
    return {
      metadata: { ...district.userData.academicPathNetwork, segments: undefined },
      pathCount: paths.length,
      secondaryPathCount: paths.filter((path) => path.role !== 'main-processional').length,
      connectedPathCount: connected.size,
      processionalWidth: processional?.width ?? 0,
      secondaryWidths: [...new Set(paths.filter((path) => path.role !== 'main-processional').map((path) => path.width))],
      allShareMainMaterial: paths.every((path) => path.material === processional.material),
      textureNames: [...new Set(paths.map((path) => path.textureName))],
      maximumPathTopAboveTerrain: Math.max(...paths.map((path) => path.top - district.position.y), 0),
      entranceConnections,
      walkAprons,
      forbiddenPaths,
      barrierCount: barriers.length,
      obstacleIntrusions,
      leafClusterCount,
    };
  });

  const hideInterface = async () => page.evaluate(() => {
    document.querySelectorAll('.atlas, .topbar, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region')
      .forEach((element) => { element.style.display = 'none'; });
  });
  await hideInterface();
  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const center = district.getWorldPosition(world.controls.target.clone());
    world.setMode('explore');
    world.setGraphicsQuality('high');
    world.setWeather('academic-autumn');
    world.camera.up.set(0, 0, -1);
    world.camera.position.set(center.x, center.y + 145, center.z + 0.01);
    world.camera.lookAt(center.x, center.y, center.z);
    world.advanceTime(500);
  });
  await page.screenshot({ path: `${outputDirectory}/overhead-complete-entrance-network.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    world.setMode('walk');
    world.camera.up.set(0, 1, 0);
    const ashcroft = district.children.find((child) => child.userData.semanticName === 'Ashcroft Grand Library');
    const threshold = district.localToWorld(world.controls.target.clone().fromArray(ashcroft.userData.walkAccess.threshold));
    const routeStart = district.localToWorld(world.camera.position.clone().fromArray(ashcroft.userData.walkAccess.routeStart));
    const outward = routeStart.clone().sub(threshold).setY(0).normalize();
    const side = world.camera.position.clone().crossVectors(outward, world.camera.up.set(0, 1, 0)).normalize();
    const position = routeStart.clone().addScaledVector(outward, 0.9).addScaledVector(side, 0.55);
    const ground = world.walkController.sampleGround(position.x, position.z) ?? district.position.y;
    world.camera.position.set(position.x, ground + 0.162, position.z);
    world.camera.lookAt(threshold.x, threshold.y + 0.15, threshold.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(500);
  });
  await page.screenshot({ path: `${outputDirectory}/ashcroft-path-to-open-entrance.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    world.setMode('walk');
    world.camera.up.set(0, 1, 0);
    const junction = district.localToWorld(world.camera.position.clone().set(-5.5, 0, -8.3));
    const target = district.localToWorld(world.controls.target.clone().set(5.5, 0, -8.3));
    const ground = world.walkController.sampleGround(junction.x, junction.z) ?? district.position.y;
    world.camera.position.set(junction.x - 0.8, ground + 0.162, junction.z - 0.55);
    world.camera.lookAt(target.x, ground + 0.03, target.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(500);
  });
  await page.screenshot({ path: `${outputDirectory}/narrow-leaf-path-junction.png` });

  if (audit.metadata.entranceCount !== 14 || audit.metadata.connectedEntranceCount !== 14) throw new Error(`Entrance metadata incomplete: ${JSON.stringify(audit.metadata)}`);
  if (audit.pathCount !== audit.metadata.segmentCount || audit.connectedPathCount !== audit.pathCount) throw new Error(`Path graph is disconnected: ${JSON.stringify({ pathCount: audit.pathCount, connected: audit.connectedPathCount, metadata: audit.metadata.segmentCount })}`);
  if (audit.processionalWidth !== 0.58 || audit.secondaryWidths.length !== 1 || audit.secondaryWidths[0] !== 0.42) throw new Error(`Path widths are incorrect: ${JSON.stringify({ main: audit.processionalWidth, secondary: audit.secondaryWidths })}`);
  if (!audit.allShareMainMaterial || audit.textureNames.length !== 1 || !audit.textureNames[0]?.includes('leaf-strewn-earth-path')) throw new Error(`Path styling diverges from the main path: ${JSON.stringify({ shared: audit.allShareMainMaterial, textures: audit.textureNames })}`);
  if (audit.maximumPathTopAboveTerrain > 0.01) throw new Error(`A path is raised too high: ${audit.maximumPathTopAboveTerrain}`);
  if (audit.entranceConnections.some((entry) => entry.nearestEndpoint > 0.01 || !entry.pathNames.length)) throw new Error(`A building entrance lacks an exact path endpoint: ${JSON.stringify(audit.entranceConnections)}`);
  if (audit.walkAprons.some((entry) => entry.blockedSteps || entry.groundGaps || entry.endDistance > 0.08)) throw new Error(`A WALK entrance apron failed: ${JSON.stringify(audit.walkAprons)}`);
  if (audit.forbiddenPaths.length) throw new Error(`Legacy random paths remain: ${JSON.stringify(audit.forbiddenPaths)}`);
  if (audit.obstacleIntrusions.length) throw new Error(`Path intersects a tree or bench: ${JSON.stringify(audit.obstacleIntrusions)}`);
  if (audit.leafClusterCount < 200) throw new Error(`Path leaf litter is unexpectedly sparse: ${audit.leafClusterCount}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ...audit,
    screenshots: [
      `${outputDirectory}/overhead-complete-entrance-network.png`,
      `${outputDirectory}/ashcroft-path-to-open-entrance.png`,
      `${outputDirectory}/narrow-leaf-path-junction.png`,
    ],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
