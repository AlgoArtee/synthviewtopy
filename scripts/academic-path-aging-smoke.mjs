import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_PATH_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_PATH_OUTPUT ?? 'output/academic-path-aging';
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

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    district.updateMatrixWorld(true);
    const paths = [];
    const facadeMaterials = new Set();
    const roofMaterials = new Set();
    let leafLitter = null;
    district.traverse((object) => {
      if (object.userData.academicLeafLitter === true) leafLitter = object;
      if (!object.isMesh) return;
      if (object.userData.academicCampusRoad === true || object.userData.naturalGroundPath === true) {
        object.geometry.computeBoundingBox();
        if (!object.geometry.boundingBox) return;
        const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
        const parameters = object.geometry.parameters ?? {};
        const authoredWidth = (parameters.width ?? 1) * object.scale.x;
        const authoredLength = (parameters.depth ?? 1) * object.scale.z;
        paths.push({
          name: object.name,
          topAboveTerrainMetres: Number(((bounds.max.y - district.position.y) * 10).toFixed(3)),
          widthMetres: Number((authoredWidth * 10).toFixed(2)),
          lengthMetres: Number((authoredLength * 10).toFixed(2)),
          material: object.material?.name,
          texture: object.material?.map?.name,
        });
      }
      const materialList = Array.isArray(object.material) ? object.material : [object.material];
      if (/MASONRY|WALL|BUTTRESS|BELL_TOWER|CHIMNEY/.test(object.name)) {
        materialList.forEach((material) => facadeMaterials.add(`${material.name}|${material.map?.name ?? ''}|${material.bumpMap?.name ?? ''}`));
      }
      if (/ROOF|SLATE|GABLE/.test(object.name)) {
        materialList.forEach((material) => roofMaterials.add(`${material.name}|${material.map?.name ?? ''}|${material.bumpMap?.name ?? ''}`));
      }
    });
    const processional = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_PROCESSIONAL_ROAD');
    const plot = district.getObjectByName('academic-libraries-theoretical-labs__PLOT');
    if (!processional || !plot) throw new Error('Academic path or plot missing');
    const quadLawn = district.getObjectByName('ACADEMIC__OLD_UNEVEN_QUADRANGLE_LAWN');
    const quadPaths = [
      district.getObjectByName('ACADEMIC__QUAD_CROSS_PATH_EW'),
      district.getObjectByName('ACADEMIC__QUAD_CROSS_PATH_NS'),
    ];
    if (!quadLawn) throw new Error('Quadrangle lawn missing');
    const decorativeQuadrangleCrossPathCount = quadPaths.filter(Boolean).length;
    plot.geometry.computeBoundingBox();
    const plotBounds = plot.geometry.boundingBox.clone().applyMatrix4(plot.matrixWorld);

    world.setMode('walk');
    world.walkController.refreshNavigation();
    const controller = world.walkController;
    const crossingStart = processional.localToWorld(world.camera.position.clone().set(-0.5, 0, 0));
    const crossingEnd = processional.localToWorld(world.controls.target.clone().set(0.5, 0, 0));
    const startGround = controller.sampleGround(crossingStart.x, crossingStart.z);
    if (startGround === null) throw new Error('Processional path crossing ground unavailable');
    world.camera.position.set(crossingStart.x, startGround + 0.162, crossingStart.z);
    world.camera.lookAt(crossingEnd.x, startGround + 0.162, crossingEnd.z);
    controller.groundY = startGround;
    controller.grounded = true;
    controller.velocityY = 0;
    controller.isJumping = false;
    controller.setMoveIntent(0, 1, true);
    world.advanceTime(2600);
    controller.setMoveIntent(0, 0, false);
    const crossingDirectionX = crossingEnd.x - crossingStart.x;
    const crossingDirectionZ = crossingEnd.z - crossingStart.z;
    const crossingLength = Math.hypot(crossingDirectionX, crossingDirectionZ);
    const crossingProgress = (
      (world.camera.position.x - crossingStart.x) * crossingDirectionX
      + (world.camera.position.z - crossingStart.z) * crossingDirectionZ
    ) / crossingLength;

    const jumpGround = controller.sampleGround(0, 44);
    if (jumpGround === null) throw new Error('Jump obstacle test ground unavailable');
    const obstacleBounds = controller.obstacleBounds;
    if (!obstacleBounds.length) throw new Error('No obstacle bound template available');
    const syntheticObstacle = obstacleBounds[0].clone();
    syntheticObstacle.min.set(-0.3, jumpGround, 43.8);
    syntheticObstacle.max.set(0.3, jumpGround + 0.1, 43.88);
    obstacleBounds.push(syntheticObstacle);
    const resetJump = () => {
      world.camera.position.set(0, jumpGround + 0.162, 44);
      world.camera.lookAt(0, jumpGround + 0.162, 43);
      controller.groundY = jumpGround;
      controller.grounded = true;
      controller.velocityY = 0;
      controller.isJumping = false;
      controller.jumpHeld = false;
      controller.jumpPeakHeight = 0;
      controller.setMoveIntent(0, 0, false);
    };
    resetJump();
    controller.setMoveIntent(0, 1, true);
    world.advanceTime(900);
    controller.setMoveIntent(0, 0, false);
    const groundedBlockedZ = world.camera.position.z;

    resetJump();
    controller.setMoveIntent(0, 1, true);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
    world.advanceTime(1050);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
    controller.setMoveIntent(0, 0, false);
    const jumpingPassedZ = world.camera.position.z;
    const jumpingPeakMetres = controller.getSnapshot().jumpHeightMetres;
    world.advanceTime(1500);
    const jumpLanded = controller.getSnapshot().grounded;
    obstacleBounds.pop();

    return {
      pathCount: paths.length,
      maximumPathTopMetres: Math.max(...paths.map((path) => path.topAboveTerrainMetres)),
      maximumPathWidthMetres: Math.max(...paths.map((path) => path.widthMetres)),
      processional: paths.find((path) => path.name.endsWith('__ACADEMIC_PROCESSIONAL_ROAD')),
      paths,
      leafClusterCount: leafLitter?.userData.leafClusterCount ?? 0,
      plotHeightMetres: Number(((plotBounds.max.y - plotBounds.min.y) * 10).toFixed(3)),
      plotTopAboveTerrainMetres: Number(((plotBounds.max.y - district.position.y) * 10).toFixed(3)),
      plotObstacle: plot.userData.navObstacle === true,
      decorativeQuadrangleCrossPathCount,
      facadeMaterials: [...facadeMaterials],
      roofMaterials: [...roofMaterials],
      crossingProgressMetres: Number((crossingProgress * 10).toFixed(2)),
      groundedBlockedZ,
      jumpingPassedZ,
      jumpingPeakMetres,
      jumpLanded,
      jumpRange: controller.getSnapshot().jumpHeightRangeMetres,
    };
  });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const path = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_PROCESSIONAL_ROAD');
    const gate = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    const hall = district.children.find((child) => child.userData.semanticName === 'Blackwood University Great Hall');
    document.querySelectorAll('.atlas, .topbar, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region')
      .forEach((element) => { element.style.display = 'none'; });
    const gatePosition = gate.getWorldPosition(world.camera.position.clone());
    const hallPosition = hall.getWorldPosition(world.controls.target.clone());
    const pathCenter = path.getWorldPosition(world.camera.position.clone());
    const outward = gatePosition.clone().sub(hallPosition).setY(0).normalize();
    const side = world.camera.position.clone().crossVectors(outward, world.camera.up).normalize();
    const cameraPosition = pathCenter.clone().addScaledVector(outward, 13).addScaledVector(side, 2.2);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(hallPosition.x, hallPosition.y + 1.8, hallPosition.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.setWeather('academic-overcast');
    world.advanceTime(720);
  });
  await page.screenshot({ path: `${outputDirectory}/leaf-path-to-great-hall.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const path = district.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_PROCESSIONAL_ROAD');
    const { width, depth } = path.geometry.parameters;
    const cameraPosition = path.localToWorld(world.camera.position.clone().set(width * 0.2, 0, -depth * 0.22));
    const target = path.localToWorld(world.controls.target.clone().set(0, 0, -depth * 0.04));
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(target.x, ground + 0.012, target.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.setWeather('academic-autumn');
    world.advanceTime(720);
  });
  await page.screenshot({ path: `${outputDirectory}/leaf-litter-path-close.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const chapel = district.children.find((child) => child.userData.semanticName === 'St Anselm Chapel');
    const routeStart = district.localToWorld(world.camera.position.clone().fromArray(chapel.userData.walkAccess.routeStart));
    const buildingPosition = chapel.getWorldPosition(world.controls.target.clone());
    const outward = routeStart.clone().sub(buildingPosition).setY(0).normalize();
    const side = world.camera.position.clone().crossVectors(outward, world.camera.up).normalize();
    const cameraPosition = routeStart.clone().addScaledVector(outward, 1.2).addScaledVector(side, 1.7);
    const ground = world.walkController.sampleGround(cameraPosition.x, cameraPosition.z) ?? district.position.y;
    world.camera.position.set(cameraPosition.x, ground + 0.162, cameraPosition.z);
    world.camera.lookAt(buildingPosition.x, buildingPosition.y + 2.6, buildingPosition.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.setWeather('academic-overcast');
    world.advanceTime(720);
  });
  await page.screenshot({ path: `${outputDirectory}/weathered-chapel-facade.png` });

  console.log(JSON.stringify({ ...audit, consoleErrors }, null, 2));

  if (audit.pathCount < 20) throw new Error(`Too few natural academic paths: ${audit.pathCount}`);
  if (audit.maximumPathTopMetres > 0.1) throw new Error(`Academic path remains too high: ${audit.maximumPathTopMetres} m`);
  if (audit.maximumPathWidthMetres > 6.1) throw new Error(`Academic path remains oversized: ${audit.maximumPathWidthMetres} m`);
  if (!audit.processional?.texture?.includes('leaf-strewn-earth-path')) throw new Error(`Processional path texture missing: ${JSON.stringify(audit.processional)}`);
  if (audit.leafClusterCount < 100) throw new Error(`Leaf litter is too sparse: ${audit.leafClusterCount}`);
  if (audit.plotHeightMetres > 0.1 || audit.plotTopAboveTerrainMetres > 0.1 || audit.plotObstacle) throw new Error(`Academic plot remains a raised obstacle: ${JSON.stringify({ height: audit.plotHeightMetres, top: audit.plotTopAboveTerrainMetres, obstacle: audit.plotObstacle })}`);
  if (audit.decorativeQuadrangleCrossPathCount !== 0) throw new Error(`Disconnected quadrangle cross paths remain: ${audit.decorativeQuadrangleCrossPathCount}`);
  if (audit.facadeMaterials.filter((entry) => entry.includes('academic-')).length < 4) throw new Error(`Facade aging maps are incomplete: ${JSON.stringify(audit.facadeMaterials)}`);
  if (audit.roofMaterials.some((entry) => !entry.includes('academic-aged-slate'))) throw new Error(`Slate aging maps are incomplete: ${JSON.stringify(audit.roofMaterials)}`);
  if (audit.crossingProgressMetres < 8) throw new Error(`WALK did not cross the processional path: ${audit.crossingProgressMetres} m`);
  if (audit.groundedBlockedZ < 43.9 || audit.jumpingPassedZ > 43.76) throw new Error(`Jump did not change obstacle traversal: ${JSON.stringify({ grounded: audit.groundedBlockedZ, jumping: audit.jumpingPassedZ })}`);
  if (audit.jumpingPeakMetres < 1.45 || !audit.jumpLanded || JSON.stringify(audit.jumpRange) !== JSON.stringify([0.55, 1.6])) throw new Error(`Higher jump audit failed: ${JSON.stringify({ peak: audit.jumpingPeakMetres, landed: audit.jumpLanded, range: audit.jumpRange })}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ...audit,
    screenshots: [
      `${outputDirectory}/leaf-path-to-great-hall.png`,
      `${outputDirectory}/leaf-litter-path-close.png`,
      `${outputDirectory}/weathered-chapel-facade.png`,
    ],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
