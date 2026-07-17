import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_BOUNDARY_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_BOUNDARY_OUTPUT ?? 'output/academic-gothic-boundary';
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
  const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 });
  await page.waitForTimeout(1_500);

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    const boundary = district.getObjectByName(
      'academic-libraries-theoretical-labs__ACADEMIC_ZONE__COLLEGIATE_GOTHIC_BOUNDARY',
    );
    if (!boundary) throw new Error('Collegiate Gothic boundary missing');
    district.updateMatrixWorld(true);

    const forbiddenTreeNames = [];
    let clippedHedges = 0;
    let ivyLeaves = 0;
    let ivyStems = 0;
    let reeds = 0;
    let fallenWallLeaves = 0;
    let parkCount = 0;
    const componentCounts = {
      stonePiers: 0,
      carvedCrests: 0,
      ironBars: 0,
      pointedArches: 0,
      quatrefoils: 0,
      botanicalMotifs: 0,
    };
    district.traverse((object) => {
      if (/ANCIENT_OAK_(TRUNKS|CROWNS)|OAK_GROVE|PROCESSIONAL_TREE|ANCIENT_GARDEN_TREE|CHAPEL_GRAVEYARD_YEW/.test(object.name)) {
        forbiddenTreeNames.push(object.name);
      }
      if (object.name === 'ACADEMIC__CLIPPED_YEW_HEDGE') clippedHedges += 1;
      if (object.name.endsWith('__IVY_LEAVES')) ivyLeaves += Number(object.userData.ivyLeafCount ?? object.count ?? 0);
      if (object.name.endsWith('__CLIMBING_IVY_STEMS')) ivyStems += Number(object.userData.ivyStemCount ?? object.count ?? 0);
      if (object.name === 'ACADEMIC__CANAL_REED') reeds += 1;
      if (object.name === 'ACADEMIC__FALLEN_LEAVES_AT_WALL') fallenWallLeaves += 1;
      if (object.userData.academicPark === true) parkCount += 1;
      if (object.name === 'ACADEMIC__GOTHIC_STONE_PIER_COMPONENTS') componentCounts.stonePiers += object.count ?? 0;
      if (object.name === 'ACADEMIC__GOTHIC_CARVED_CRESTS') componentCounts.carvedCrests += object.count ?? 0;
      if (object.name === 'ACADEMIC__GOTHIC_WROUGHT_IRON_BARS') componentCounts.ironBars += object.count ?? 0;
      if (object.name === 'ACADEMIC__GOTHIC_POINTED_ARCH_TRACERY') componentCounts.pointedArches += object.count ?? 0;
      if (object.name === 'ACADEMIC__GOTHIC_QUATREFOILS') componentCounts.quatrefoils += object.count ?? 0;
      if (object.name === 'ACADEMIC__GOTHIC_BOTANICAL_LEAF_MOTIFS') componentCounts.botanicalMotifs += object.count ?? 0;
    });

    const coastal = world.scene.getObjectByName('Coastal rocks and planting');
    const eastCoastalTrees = [];
    coastal?.children.forEach((object) => {
      if (!['CylinderGeometry', 'IcosahedronGeometry'].includes(object.geometry?.type)) return;
      if (object.position.x > 400 && Math.abs(object.position.z) < 250) {
        eastCoastalTrees.push({ type: object.geometry.type, position: object.position.toArray() });
      }
    });

    const barrierSegments = [];
    boundary.traverse((object) => {
      const segments = object.userData.navBarrierSegments ?? [];
      segments.forEach((segment) => barrierSegments.push(segment));
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
    const openings = boundary.userData.openings.map((opening) => {
      const minimumBarrierClearance = Math.min(...barrierSegments.map((barrier) => (
        pointSegmentDistance(opening.localPoint, barrier.start, barrier.end) - Number(barrier.radius)
      )));
      const local = world.camera.position.clone().fromArray(opening.localPoint);
      const groundWorld = district.localToWorld(local.clone());
      const sampledGround = world.walkController.sampleGround(groundWorld.x, groundWorld.z);
      return {
        ...opening,
        minimumBarrierClearance,
        grounded: sampledGround !== null,
      };
    });
    const boundaryRuns = boundary.children.filter((child) => child.userData.academicBoundaryRun === true);
    const gates = [
      'ACADEMIC__TUNDRA_DOME_GARDEN_ENTRANCE',
      'ACADEMIC__DESERT_DOME_GARDEN_ENTRANCE',
      'ACADEMIC__MONUMENTAL_COASTAL_RAIL_GATE',
    ].map((name) => {
      const gate = boundary.getObjectByName(name);
      return {
        name,
        exists: Boolean(gate),
        alwaysOpen: gate?.userData.alwaysOpen === true,
        sign: gate?.userData.agedBrassSign ?? null,
        climbingIvy: gate?.userData.climbingIvy === true,
      };
    });
    const benches = district.getObjectByName(
      'academic-libraries-theoretical-labs__ACADEMIC_ZONE__VINTAGE_CAMPUS_BENCHES',
    );
    const academicTreePopulation = district.userData.academicTreePopulation;
    return {
      forbiddenTreeNames,
      eastCoastalTrees,
      clippedHedges,
      ivyLeaves,
      ivyStems,
      reeds,
      fallenWallLeaves,
      parkCount,
      vintageBenchCount: Number(benches?.userData.academicVintageBenchCount ?? 0),
      academicTreePopulation: academicTreePopulation ? {
        count: Number(
          academicTreePopulation.count
          ?? academicTreePopulation.treeCount
          ?? academicTreePopulation.totalTrees
          ?? 0
        ),
        speciesCount: Number(
          academicTreePopulation.speciesCount
          ?? academicTreePopulation.species?.length
          ?? academicTreePopulation.speciesIds?.length
          ?? 0
        ),
      } : null,
      componentCounts,
      boundaryRuns: boundaryRuns.length,
      fenceBayCount: Number(boundary.userData.fenceBayCount ?? 0),
      pierCount: Number(boundary.userData.pierCount ?? 0),
      carvedCrestCount: Number(boundary.userData.carvedCrestCount ?? 0),
      preciseBarrierCount: Number(boundary.userData.preciseBarrierCount ?? 0),
      heightMultiplier: Number(boundary.userData.heightMultiplier ?? 0),
      fenceHeightMetres: Number(boundary.userData.fenceHeightMetres ?? 0),
      pierHeightMetres: Number(boundary.userData.pierHeightMetres ?? 0),
      visuallyPermeable: boundary.userData.visuallyPermeable === true,
      patterns: boundary.userData.patterns,
      openings,
      gates,
      existingMainGate: Boolean(district.getObjectByName(
        'academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE',
      )),
    };
  });

  const crossingAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const boundary = district.getObjectByName(
      'academic-libraries-theoretical-labs__ACADEMIC_ZONE__COLLEGIATE_GOTHIC_BOUNDARY',
    );
    const controller = world.walkController;
    world.setTimeOfDay('noon');
    controller.refreshNavigation();

    const walkLine = (start, end, spacing = 0.025) => {
      const startGround = controller.sampleGround(start.x, start.z);
      if (startGround === null) return { reached: false, blockedSteps: 0, groundGaps: 1, endDistance: Infinity };
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
        if (Math.hypot(sample.x - world.camera.position.x, sample.z - world.camera.position.z) > 0.012) {
          blockedSteps += 1;
          break;
        }
        world.camera.position.y = ground + 0.162;
      }
      const endDistance = Math.hypot(end.x - world.camera.position.x, end.z - world.camera.position.z);
      return { reached: endDistance < 0.1, blockedSteps, groundGaps, endDistance };
    };

    const openings = boundary.userData.openings.map((opening) => {
      const center = district.localToWorld(world.camera.position.clone().fromArray(opening.localPoint));
      const direction = world.camera.position.clone().fromArray(opening.crossingDirection).setY(0).normalize();
      const extent = opening.id === 'main-avenue' ? 3.4 : 0.9;
      return {
        id: opening.id,
        result: walkLine(
          center.clone().addScaledVector(direction, -extent),
          center.clone().addScaledVector(direction, extent),
        ),
      };
    });

    const solidGuide = boundary.children
      .find((child) => child.userData.academicBoundaryRun === true)
      ?.children.find((child) => child.userData.navBarrierSegments?.length);
    const solid = solidGuide.userData.navBarrierSegments[0];
    const localStart = world.camera.position.clone().fromArray(solid.start);
    const localEnd = world.controls.target.clone().fromArray(solid.end);
    const localMid = localStart.clone().add(localEnd).multiplyScalar(0.5);
    const along = localEnd.clone().sub(localStart).setY(0).normalize();
    const normal = world.camera.position.clone().set(-along.z, 0, along.x);
    const solidMid = district.localToWorld(localMid.clone());
    const solidCrossing = walkLine(
      solidMid.clone().addScaledVector(normal, -0.34),
      solidMid.clone().addScaledVector(normal, 0.34),
    );
    return {
      openings,
      solidCrossing,
      mainGateOpenAtNoon: district.userData.academicGateOpen === true,
    };
  });

  const hideUi = async () => page.evaluate(() => {
    document.querySelectorAll(
      '.atlas, .topbar, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region',
    ).forEach((element) => { element.style.display = 'none'; });
  });
  await hideUi();

  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.setWeather('academic-overcast');
    world.setTimeOfDay('noon');
    const visibleIds = new Set([
      'academic-libraries-theoretical-labs',
      'tundra-dome',
      'desert-dome',
    ]);
    world.objectGroups.forEach((group, id) => {
      if (visibleIds.has(id)) return;
      group.userData.academicBoundaryOverviewVisible = group.visible;
      group.visible = false;
    });
    world.scene.traverse((object) => {
      if (!/^(Ring road|Radial district boundary road)/.test(object.name)) return;
      object.userData.academicBoundaryOverviewVisible = object.visible;
      object.visible = false;
    });
    world.camera.position.set(500, 245, 0);
    world.controls.target.set(355, 1.6, 0);
    world.controls.update();
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${outputDirectory}/full-academic-sector-boundary.png` });
  await page.evaluate(() => {
    const world = window.labIsland;
    world.objectGroups.forEach((group) => {
      if (group.userData.academicBoundaryOverviewVisible === undefined) return;
      group.visible = group.userData.academicBoundaryOverviewVisible;
      delete group.userData.academicBoundaryOverviewVisible;
    });
    world.scene.traverse((object) => {
      if (object.userData.academicBoundaryOverviewVisible === undefined) return;
      object.visible = object.userData.academicBoundaryOverviewVisible;
      delete object.userData.academicBoundaryOverviewVisible;
    });
  });

  const stageOpening = async (openingId, distance, lateral = 0) => page.evaluate(({ id, distanceFromGate, lateralOffset }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const boundary = district.getObjectByName(
      'academic-libraries-theoretical-labs__ACADEMIC_ZONE__COLLEGIATE_GOTHIC_BOUNDARY',
    );
    const opening = boundary.userData.openings.find((entry) => entry.id === id);
    const center = district.localToWorld(world.camera.position.clone().fromArray(opening.localPoint));
    const inward = world.camera.position.clone().fromArray(opening.crossingDirection).setY(0).normalize();
    const side = world.controls.target.clone().crossVectors(inward, world.camera.up).normalize();
    const cameraPosition = center.clone().addScaledVector(inward, distanceFromGate).addScaledVector(side, lateralOffset);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.setMode('walk');
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    const fenceHeight = Number(boundary.userData.fenceHeightMetres ?? 3.3) / 10;
    world.camera.lookAt(center.x, ground + Math.max(0.33, fenceHeight * 0.62), center.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(600);
  }, { id: openingId, distanceFromGate: distance, lateralOffset: lateral });

  await stageOpening('tundra-biodome', 4.8, 1.1);
  await page.screenshot({ path: `${outputDirectory}/tundra-ivy-garden-entrance.png` });
  await stageOpening('coastal-railway', -6.2, 1.7);
  await page.screenshot({ path: `${outputDirectory}/monumental-coastal-rail-gate.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const boundary = district.getObjectByName(
      'academic-libraries-theoretical-labs__ACADEMIC_ZONE__COLLEGIATE_GOTHIC_BOUNDARY',
    );
    const rear = boundary.userData.openings.find((entry) => entry.id === 'coastal-railway');
    const fenceLocal = world.camera.position.clone().fromArray(rear.localPoint).add(world.controls.target.set(0, 0, 18));
    const fenceWorld = district.localToWorld(fenceLocal);
    const cameraPosition = fenceWorld.clone().add(world.controls.target.set(-3.1, 0, -4.35));
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.setMode('walk');
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(fenceWorld.x, ground + 1.05, fenceWorld.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${outputDirectory}/gothic-ironwork-closeup.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    const gatePosition = gate.getWorldPosition(world.camera.position.clone());
    const hallPosition = hall.getWorldPosition(world.controls.target.clone());
    const inward = hallPosition.clone().sub(gatePosition).setY(0).normalize();
    const cameraPosition = gatePosition.clone().addScaledVector(inward, -2.2);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.setMode('walk');
    world.setTimeOfDay('noon');
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(hallPosition.x, ground + 0.2, hallPosition.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${outputDirectory}/tree-free-main-avenue.png` });

  const result = { audit, crossingAudit, consoleErrors };
  await writeFile(`${outputDirectory}/audit.json`, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));

  if (audit.forbiddenTreeNames.length || audit.eastCoastalTrees.length) {
    throw new Error(`Obsolete Academic proxy/coastal trees returned: ${JSON.stringify(audit)}`);
  }
  if (audit.academicTreePopulation?.count !== 79 || audit.academicTreePopulation?.speciesCount !== 15) {
    throw new Error(`Academic tree population metadata regression: ${JSON.stringify(audit.academicTreePopulation)}`);
  }
  if (audit.clippedHedges !== 9 || audit.reeds !== 34 || audit.fallenWallLeaves !== 24 || audit.parkCount !== 5 || audit.vintageBenchCount !== 32) {
    throw new Error(`Preserved landscape regression: ${JSON.stringify(audit)}`);
  }
  if (audit.boundaryRuns !== 8 || audit.fenceBayCount < 600 || audit.pierCount < 600 || audit.carvedCrestCount !== audit.pierCount) {
    throw new Error(`Boundary enclosure incomplete: ${JSON.stringify(audit)}`);
  }
  if (audit.heightMultiplier !== 5 || audit.fenceHeightMetres !== 16.5 || audit.pierHeightMetres !== 24.5) {
    throw new Error(`Five-times Academic fence height regression: ${JSON.stringify(audit)}`);
  }
  if (!audit.visuallyPermeable || audit.patterns.length !== 4 || Object.values(audit.componentCounts).some((count) => count < 500)) {
    throw new Error(`Gothic component kit incomplete: ${JSON.stringify(audit)}`);
  }
  if (audit.openings.length !== 4 || audit.openings.some((opening) => !opening.passable || !opening.grounded || opening.minimumBarrierClearance < 0.45)) {
    throw new Error(`Boundary opening metadata/clearance failed: ${JSON.stringify(audit.openings)}`);
  }
  if (audit.gates.some((gate) => !gate.exists || !gate.alwaysOpen)
    || !audit.gates[0].sign || !audit.gates[1].sign
    || !audit.gates[0].climbingIvy || !audit.gates[1].climbingIvy
    || !audit.existingMainGate) {
    throw new Error(`Gate kit incomplete: ${JSON.stringify(audit.gates)}`);
  }
  if (!crossingAudit.mainGateOpenAtNoon
    || crossingAudit.openings.some((opening) => !opening.result.reached || opening.result.blockedSteps || opening.result.groundGaps)
    || crossingAudit.solidCrossing.reached
    || crossingAudit.solidCrossing.blockedSteps < 1) {
    throw new Error(`WALK boundary traversal failed: ${JSON.stringify(crossingAudit)}`);
  }
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);
} finally {
  await browser.close();
}
