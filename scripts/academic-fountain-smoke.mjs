import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_FOUNTAIN_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_FOUNTAIN_OUTPUT ?? 'output/academic-fountain';
const rootName = 'ACADEMIC__WELL_OF_INFINITE_KNOWLEDGE';
const districtId = 'academic-libraries-theoretical-labs';
const expectedParent = `${districtId}__ACADEMIC_PARK__GASLIGHT-READING-COURTS`;
const formerFountainCourt = `${districtId}__ACADEMIC_PARK__BRONZE-SCHOLARS-MEMORIAL-COURT`;
const expectedCenter = [349.5, 1.614, -0.68];
const picturedWalkPosition = [351.65, 1.47];
const picturedWalkTargetY = 2.154;
const expectedObjectGroupCount = 41;
const persistedFountainStateKeys = [
  'sceneMode',
  'waterOn',
  'requestedWaterFlow',
  'infinityLightOn',
  'engravingsHighlighted',
  'cutawayVisible',
  'geometryGridVisible',
  'ringRotating',
  'statueMaterial',
  'restorationMode',
  'cameraPreset',
];
const persistenceRiskStateKeys = [
  ...persistedFountainStateKeys,
  'waterFlow',
  'sheetFlow',
  'residualDrip',
  'ringAngle',
  'quality',
];

const actions = {
  readPlaque: 'read fountain plaque',
  orbit: 'orbit fountain',
  resetCamera: 'reset fountain camera',
  cycleCameraPreset: 'cycle fountain camera preset',
  cycleSceneMode: 'cycle fountain scene mode',
  toggleWater: 'toggle fountain water',
  increaseWaterFlow: 'increase fountain water flow',
  decreaseWaterFlow: 'decrease fountain water flow',
  toggleInfinityLight: 'toggle infinity lighting',
  highlightEngravings: 'highlight scientific engravings',
  describeNextSymbol: 'describe next scientific symbol',
  toggleCutaway: 'toggle fountain cutaway',
  toggleGeometryGrid: 'toggle fountain geometry grid',
  toggleRingRotation: 'toggle orbital ring rotation',
  cycleStatueMaterial: 'cycle Seshat material',
  cycleRestorationView: 'cycle fountain restoration view',
  toggleDebug: 'toggle fountain debug view',
};

const cameraPresets = {
  hero: {
    position: [1.5, 0.75, 1.8],
    target: [0, 0.51, 0],
    up: [0, 1, 0],
    fieldOfView: 45,
  },
  'low-angle': {
    position: [0.8, 0.22, 1.2],
    target: [0, 0.65, 0],
    up: [0, 1, 0],
    fieldOfView: 50,
  },
  'top-down': {
    position: [0.001, 2.4, 0.001],
    target: [0, 0, 0],
    up: [0, 0, -1],
    fieldOfView: 46,
  },
  'side-profile': {
    position: [1.7, 0.6, 0],
    target: [0, 0.48, 0],
    up: [0, 1, 0],
    fieldOfView: 48,
  },
};

const requiredObjectNames = {
  basinFloor: 'WELL__SUNKEN_POLYGONAL_BASIN_FLOOR',
  basinEdge: 'WELL__BLACK_STONE_MEASUREMENT_EDGE',
  water: 'WELL__DARK_REFLECTIVE_POLYGONAL_WATER',
  channels: 'WELL__EIGHT_RADIAL_WATER_CHANNELS',
  reflectingPools: 'WELL__CHANNEL_REFLECTING_POOLS',
  platforms: 'WELL__FLOATING_CEREMONIAL_PLATFORMS',
  accessibleRamp: 'WELL__INTEGRATED_ACCESSIBLE_RAMP',
  plinth: 'WELL__OFFSET_DARK_LIMESTONE_PLINTH',
  cantilever: 'WELL__CANTILEVERED_BLACK_MARBLE_PLANES',
  seshatHigh: 'WELL__SESHAT_HIGH_DETAIL_ORIGINAL_SCULPTURE',
  seshatMedium: 'WELL__SESHAT_MEDIUM_DETAIL_SCULPTURE',
  seshatLow: 'WELL__SESHAT_LONG_DISTANCE_SILHOUETTE',
  raisedArms: 'WELL__SESHAT_HIGH_RAISED_ARMS_AND_CELESTIAL_HEADPIECE',
  infinity: 'WELL__STRUCTURAL_BLACKENED_BRONZE_INFINITY',
  infinityLight: 'WELL__INFINITY_INTEGRATED_AMBER_LIGHT',
  orbitalPivot: 'WELL__TILTED_ORBITAL_RING_PIVOT',
  orbitalRing: 'WELL__BROKEN_ASTROLABE_RING',
  orbitalSupports: 'WELL__ORBITAL_RING_STRUCTURAL_COLUMNS',
  waterSheets: 'WELL__THIN_PLINTH_WATER_SHEETS',
  residualDrips: 'WELL__RESIDUAL_WATER_DRIPS',
  nearDetailLod: 'WELL__NEAR_DETAIL_LOD',
  engravings: 'WELL__SCIENTIFIC_AND_ARCHITECTURAL_ENGRAVINGS',
  geometryGrid: 'WELL__UNDERLYING_GEOMETRIC_CONSTRUCTION_GRID',
  cutaway: 'WELL__INTERNAL_WATER_SYSTEM_CUTAWAY',
  presentation: 'WELL__MUSEUM_WHITE_PRESENTATION_ENVIRONMENT',
  rainAndMist: 'WELL__LOCAL_RAIN_AND_LOW_MIST',
  restoration: 'WELL__CLEAN_WEATHERED_RESTORATION_COMPARISON',
  debug: 'WELL__DEBUG_LIGHTS_COLLISIONS_WATER_PATHS_AND_STATS',
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const near = (actual, expected, tolerance = 0.002) => Math.abs(actual - expected) <= tolerance;

await mkdir(outputDirectory, { recursive: true });

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

const context = await browser.newContext({ viewport: { width: 1698, height: 773 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(180_000);
page.setDefaultNavigationTimeout(120_000);

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

async function waitForMonument() {
  await page.waitForFunction(() => Boolean(window.labIsland?.walkController), null, { timeout: 180_000 });
  await page.waitForFunction(
    ({ districtId: id, root }) => window.labIsland?.objectGroups.get(id)?.getObjectByName(root)?.userData.fountainMounted === true,
    { districtId, root: rootName },
    { timeout: 180_000 },
  );
  await page.waitForTimeout(1_800);
}

async function capturePreset(name, sceneMode, presetId) {
  await page.evaluate(({ actions: interactionActions, desiredMode, preset, root, districtId: id }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());

    // Scene-mode interactions are proximity constrained, so briefly use the
    // accessible southern edge before moving to the requested inspection pose.
    world.setMode('walk');
    world.camera.position.set(center.x, center.y + 0.162, center.z + 0.9);
    for (let index = 0; index < 4 && world.getTextSnapshot().academicDistrict.fountain.state.sceneMode !== desiredMode; index += 1) {
      world.performAcademicInteraction(interactionActions.cycleSceneMode);
    }

    world.setGraphicsQuality('high');
    world.setMode('explore');
    world.camera.up.fromArray(preset.up);
    world.camera.fov = preset.fieldOfView;
    world.camera.near = 0.02;
    world.camera.updateProjectionMatrix();
    world.camera.position.set(
      center.x + preset.position[0],
      center.y + preset.position[1],
      center.z + preset.position[2],
    );
    world.controls.target.set(
      center.x + preset.target[0],
      center.y + preset.target[1],
      center.z + preset.target[2],
    );
    world.camera.lookAt(world.controls.target);
    world.renderer.render(world.scene, world.camera);

    document.querySelectorAll(
      '.atlas, .topbar, #scene-card, .scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, '
      + '.walk-interaction-menu, #fountain-control-panel, .toast-region, #loading-screen, .loading-screen',
    ).forEach((element) => { element.style.display = 'none'; });
  }, { actions, desiredMode: sceneMode, preset: cameraPresets[presetId], root: rootName, districtId });
  await page.waitForTimeout(1_100);
  const path = `${outputDirectory}/${name}.png`;
  await page.screenshot({ path, timeout: 45_000 });
  return path;
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForMonument();

  const staticAudit = await page.evaluate(({ root, districtId: id, expectedParentName, formerCourtName, featureNames }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    if (!district) throw new Error('Academic District missing');
    district.updateMatrixWorld(true);
    const fountain = district.getObjectByName(root);
    if (!fountain) throw new Error('The Well of Infinite Knowledge missing');
    fountain.updateMatrixWorld(true);

    const vector = () => world.camera.position.clone();
    const Box3 = world.selectionBox.box.constructor;
    const allNames = [];
    const mountedRoots = [];
    const rootMatches = [];
    const legacyObjects = [];
    let meshCount = 0;
    let instancedMeshCount = 0;
    let pointLightCount = 0;
    let shadowCastingLightCount = 0;
    const materials = new Set();
    district.traverse((object) => {
      allNames.push(object.name);
      if (object.name === root) rootMatches.push(object.name);
      if (object.userData.fountainMounted === true) mountedRoots.push(object.name);
      if (
        object.name === 'ACADEMIC__FOUNTAIN_OF_QUIET_LEARNING'
        || object.name.endsWith('__BRONZE_SCHOLARS_FOUNTAIN_BASIN')
        || object.name.endsWith('__BRONZE_SCHOLAR_FIGURE')
      ) legacyObjects.push(object.name);
      if (object.isMesh) {
        meshCount += 1;
        if (object.isInstancedMesh) instancedMeshCount += 1;
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.filter(Boolean).forEach((material) => materials.add(material.name));
      }
      if (object.isPointLight) pointLightCount += 1;
      if (object.isLight && object.castShadow) shadowCastingLightCount += 1;
    });

    const formerCourt = district.getObjectByName(formerCourtName);
    const formerCourtMountedRoots = [];
    formerCourt?.traverse((object) => {
      if (object.userData.fountainMounted === true || object.name === root) formerCourtMountedRoots.push(object.name);
    });

    const center = fountain.getWorldPosition(vector());
    const parentCenter = fountain.parent.getWorldPosition(vector());
    const basinFloor = fountain.getObjectByName(featureNames.basinFloor);
    const basinEdge = fountain.getObjectByName(featureNames.basinEdge);
    if (!basinFloor || !basinEdge) throw new Error('Basin geometry missing');
    const basinBounds = new Box3().setFromObject(basinFloor, true);
    const edgeBounds = new Box3().setFromObject(basinEdge, true);
    const silhouetteBounds = new Box3();
    [
      featureNames.plinth,
      featureNames.seshatHigh,
      featureNames.infinity,
      featureNames.orbitalRing,
    ].forEach((name) => {
      const object = fountain.getObjectByName(name);
      if (object) silhouetteBounds.expandByObject(object, true);
    });

    const pointToBasinBounds = (point) => {
      const dx = point.x < edgeBounds.min.x
        ? edgeBounds.min.x - point.x
        : point.x > edgeBounds.max.x ? point.x - edgeBounds.max.x : 0;
      const dz = point.z < edgeBounds.min.z
        ? edgeBounds.min.z - point.z
        : point.z > edgeBounds.max.z ? point.z - edgeBounds.max.z : 0;
      return Math.hypot(dx, dz);
    };

    const pathClearances = [];
    district.traverse((object) => {
      if (!object.userData.academicPathNetworkSegment || !object.userData.roadEndpoints) return;
      const endpoints = object.userData.roadEndpoints;
      object.parent.updateMatrixWorld(true);
      const start = vector().fromArray(endpoints.start).applyMatrix4(object.parent.matrixWorld);
      const end = vector().fromArray(endpoints.end).applyMatrix4(object.parent.matrixWorld);
      const length = start.distanceTo(end);
      const samples = Math.max(24, Math.ceil(length / 0.025));
      let clearance = Number.POSITIVE_INFINITY;
      for (let sampleIndex = 0; sampleIndex <= samples; sampleIndex += 1) {
        const point = start.clone().lerp(end, sampleIndex / samples);
        clearance = Math.min(clearance, pointToBasinBounds(point));
      }
      clearance -= Number(object.userData.pathWidthWorldUnits ?? 0.42) * 0.5;
      pathClearances.push({
        name: object.name,
        role: object.userData.academicPathRole ?? null,
        fountainBypass: object.userData.processionalFountainBypass === true,
        segmentIndex: object.userData.processionalSegmentIndex ?? null,
        clearance,
        clearanceMetres: clearance * 10,
      });
    });
    pathClearances.sort((a, b) => a.clearance - b.clearance);

    const benchRoot = district.getObjectByName(`${id}__ACADEMIC_ZONE__VINTAGE_CAMPUS_BENCHES`);
    const benchClearances = [];
    benchRoot?.updateMatrixWorld(true);
    const benchAnchors = benchRoot?.userData.benchAnchors ?? [];
    benchAnchors.forEach((anchor) => {
      const point = vector().fromArray(anchor.position).applyMatrix4(benchRoot.matrixWorld);
      const clearance = pointToBasinBounds(point) - 0.14;
      benchClearances.push({ id: anchor.id, zone: anchor.zone, clearance, clearanceMetres: clearance * 10 });
    });
    benchClearances.sort((a, b) => a.clearance - b.clearance);

    const treeCollision = district.getObjectByName('ACADEMIC__TREE_TRUNK_PRECISE_WALK_COLLISION');
    const treeClearances = [];
    treeCollision?.updateMatrixWorld(true);
    const treeBarriers = treeCollision?.userData.navBarrierSegments ?? [];
    treeBarriers.forEach((barrier, index) => {
      const point = vector().fromArray(barrier.start).applyMatrix4(treeCollision.matrixWorld);
      const clearance = pointToBasinBounds(point) - Number(barrier.radius ?? 0);
      treeClearances.push({ index, clearance, clearanceMetres: clearance * 10 });
    });
    treeClearances.sort((a, b) => a.clearance - b.clearance);

    const requiredFeatures = Object.fromEntries(
      Object.entries(featureNames).map(([key, name]) => [key, Boolean(fountain.getObjectByName(name))]),
    );
    const navBarriers = fountain.userData.navBarrierSegments ?? [];
    const isPlinthBarrier = (barrier) => [barrier.start, barrier.end].every(
      (point) => Math.abs(point[0]) <= 0.4 && Math.abs(point[2]) <= 0.35,
    );
    const plinthBarriers = navBarriers.filter(isPlinthBarrier);
    const perimeterBarriers = navBarriers.filter((barrier) => !isPlinthBarrier(barrier));
    const processionalPaths = pathClearances.filter((entry) => entry.role === 'main-processional');
    const snapshot = world.getTextSnapshot().academicDistrict.fountain;
    return {
      center: center.toArray(),
      parentName: fountain.parent?.name,
      parentSemanticName: fountain.parent?.userData.semanticName,
      courtCenterDistance: Math.hypot(center.x - parentCenter.x, center.z - parentCenter.z),
      mounted: fountain.userData.fountainMounted === true && fountain.parent !== null,
      visible: fountain.visible && fountain.parent?.visible !== false,
      rootMatches,
      mountedRoots,
      legacyObjects,
      formerCourtExists: Boolean(formerCourt),
      formerCourtMountedRoots,
      metadata: fountain.userData.academicFountain,
      snapshot,
      basinWidthMetres: (edgeBounds.max.x - edgeBounds.min.x) * 10,
      basinDepthMetres: (edgeBounds.max.z - edgeBounds.min.z) * 10,
      basinFloorInsetWidthMetres: (basinBounds.max.x - basinBounds.min.x) * 10,
      basinFloorInsetDepthMetres: (basinBounds.max.z - basinBounds.min.z) * 10,
      centralSilhouetteMetres: (silhouetteBounds.max.y - silhouetteBounds.min.y) * 10,
      barrierSegments: navBarriers.length,
      barrierAudit: {
        total: navBarriers.length,
        perimeter: perimeterBarriers.length,
        plinth: plinthBarriers.length,
        plinthSegments: plinthBarriers,
      },
      requiredFeatures,
      meshCount,
      instancedMeshCount,
      pointLightCount,
      shadowCastingLightCount,
      materials: [...materials].sort(),
      objectGroupCount: world.objectGroups.size,
      nearestPath: pathClearances[0] ?? null,
      processionalPaths,
      nearestBench: benchClearances[0] ?? null,
      nearestTree: treeClearances[0] ?? null,
      intersectingPaths: pathClearances.filter((entry) => entry.clearance <= 0),
      intersectingBenches: benchClearances.filter((entry) => entry.clearance <= 0),
      intersectingTrees: treeClearances.filter((entry) => entry.clearance <= 0),
      expectedParentName,
    };
  }, {
    root: rootName,
    districtId,
    expectedParentName: expectedParent,
    formerCourtName: formerFountainCourt,
    featureNames: requiredObjectNames,
  });

  // Undo serializes through takeSnapshotPayload rather than the toolbar Save
  // route. A missing masterplan scale here used to reinterpret expansion-6
  // coordinates as legacy expansion-3 coordinates and move the complete
  // Academic District (including the fountain) on load.
  const undoPrepared = await page.evaluate(({ root, districtId: id }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    district.updateMatrixWorld(true);
    const fountain = district.getObjectByName(root);
    const payload = world.takeSnapshotPayload();
    const savedAcademic = payload.objects.find((object) => object.id === id);
    const before = {
      districtPosition: district.position.toArray(),
      fountainCenter: fountain.getWorldPosition(world.camera.position.clone()).toArray(),
    };
    world.saveUndoState();
    district.position.x += 12.345;
    district.position.z -= 7.654;
    district.updateMatrixWorld(true);
    return {
      before,
      shifted: {
        districtPosition: district.position.toArray(),
        fountainCenter: fountain.getWorldPosition(world.camera.position.clone()).toArray(),
      },
      snapshotWorldExpansion: payload.masterplan?.worldExpansion ?? null,
      snapshotAcademicPosition: savedAcademic?.state?.position
        ? [savedAcademic.state.position.x, savedAcademic.state.position.y, savedAcademic.state.position.z]
        : null,
    };
  }, { root: rootName, districtId });
  await page.waitForFunction(() => document.querySelector('#undo-action')?.disabled === false, null, { timeout: 10_000 });
  await page.locator('#undo-action').click({ timeout: 10_000 });
  await page.waitForFunction(
    ({ root, districtId: id, expectedDistrict, expectedFountain }) => {
      const world = window.labIsland;
      const district = world?.objectGroups.get(id);
      const fountain = district?.getObjectByName(root);
      if (!district || !fountain || world.objectGroups.size !== 41) return false;
      district.updateMatrixWorld(true);
      const center = fountain.getWorldPosition(world.camera.position.clone()).toArray();
      return district.position.toArray().every((value, index) => Math.abs(value - expectedDistrict[index]) < 1e-6)
        && center.every((value, index) => Math.abs(value - expectedFountain[index]) < 1e-6);
    },
    {
      root: rootName,
      districtId,
      expectedDistrict: undoPrepared.before.districtPosition,
      expectedFountain: undoPrepared.before.fountainCenter,
    },
    { timeout: 180_000 },
  );
  const undoAudit = await page.evaluate(({ root, districtId: id }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    district.updateMatrixWorld(true);
    const fountain = district.getObjectByName(root);
    return {
      objectGroupCount: world.objectGroups.size,
      districtPosition: district.position.toArray(),
      fountainCenter: fountain.getWorldPosition(world.camera.position.clone()).toArray(),
      parentName: fountain.parent?.name,
    };
  }, { root: rootName, districtId });

  const interactionAudit = await page.evaluate(({ root, districtId: id, actionNames }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    const ringPivot = fountain.getObjectByName('WELL__TILTED_ORBITAL_RING_PIVOT');
    const engravingHalo = fountain.getObjectByName('WELL__ENGRAVING_HIGHLIGHT_HALO');
    const cutawayGroup = fountain.getObjectByName('WELL__INTERNAL_WATER_SYSTEM_CUTAWAY');
    const gridGroup = fountain.getObjectByName('WELL__UNDERLYING_GEOMETRIC_CONSTRUCTION_GRID');
    const restorationGroup = fountain.getObjectByName('WELL__CLEAN_WEATHERED_RESTORATION_COMPARISON');
    const debugGroup = fountain.getObjectByName('WELL__DEBUG_LIGHTS_COLLISIONS_WATER_PATHS_AND_STATS');
    const infinityLight = fountain.getObjectByName('WELL__INFINITY_ARCHITECTURAL_LIGHT');
    const waterSheets = fountain.getObjectByName('WELL__THIN_PLINTH_WATER_SHEETS');
    const residualDrips = fountain.getObjectByName('WELL__RESIDUAL_WATER_DRIPS');

    document.querySelector('.mode[data-mode="walk"]')?.click();
    const nearPoint = center.clone().add(world.camera.position.clone().set(0, 0, 0.9));
    const ground = world.walkController.sampleGround(nearPoint.x, nearPoint.z) ?? district.position.y;
    world.camera.position.set(nearPoint.x, ground + 0.162, nearPoint.z);
    world.camera.lookAt(center.x, center.y + 0.54, center.z);

    const plaque = world.performAcademicInteraction(actionNames.readPlaque);
    const initial = { ...world.getTextSnapshot().academicDistrict.fountain.state };

    const stop = world.performAcademicInteraction(actionNames.toggleWater);
    world.advanceTime(2_000);
    const stoppedProgress = { ...world.getTextSnapshot().academicDistrict.fountain.state };
    const stoppedVisuals = { sheetsVisible: waterSheets.visible, dripsVisible: residualDrips.visible };
    const start = world.performAcademicInteraction(actionNames.toggleWater);
    world.advanceTime(2_600);
    const restartedProgress = { ...world.getTextSnapshot().academicDistrict.fountain.state };
    const decrease = world.performAcademicInteraction(actionNames.decreaseWaterFlow);
    world.advanceTime(650);
    const decreaseProgress = { ...world.getTextSnapshot().academicDistrict.fountain.state };
    const increase = world.performAcademicInteraction(actionNames.increaseWaterFlow);
    world.advanceTime(650);
    const increaseProgress = { ...world.getTextSnapshot().academicDistrict.fountain.state };

    const infinityOff = world.performAcademicInteraction(actionNames.toggleInfinityLight);
    const infinityOffIntensity = infinityLight.intensity;
    const infinityOn = world.performAcademicInteraction(actionNames.toggleInfinityLight);
    const infinityOnIntensity = infinityLight.intensity;

    const engravingsOn = world.performAcademicInteraction(actionNames.highlightEngravings);
    const engravingHaloOn = engravingHalo.visible;
    const symbol = world.performAcademicInteraction(actionNames.describeNextSymbol);
    world.performAcademicInteraction(actionNames.highlightEngravings);

    const cutawayOn = world.performAcademicInteraction(actionNames.toggleCutaway);
    const cutawayVisible = cutawayGroup.visible;
    world.performAcademicInteraction(actionNames.toggleCutaway);
    const gridOn = world.performAcademicInteraction(actionNames.toggleGeometryGrid);
    const gridVisible = gridGroup.visible;
    world.performAcademicInteraction(actionNames.toggleGeometryGrid);

    const ringStart = ringPivot.rotation.y;
    const ringOn = world.performAcademicInteraction(actionNames.toggleRingRotation);
    world.advanceTime(1_500);
    const ringEnd = ringPivot.rotation.y;
    world.performAcademicInteraction(actionNames.toggleRingRotation);

    const statueModes = [
      world.performAcademicInteraction(actionNames.cycleStatueMaterial).state.statueMaterial,
      world.performAcademicInteraction(actionNames.cycleStatueMaterial).state.statueMaterial,
      world.performAcademicInteraction(actionNames.cycleStatueMaterial).state.statueMaterial,
    ];
    const restorationModes = [];
    const restorationComparisonVisibility = [];
    for (let index = 0; index < 3; index += 1) {
      restorationModes.push(world.performAcademicInteraction(actionNames.cycleRestorationView).state.restorationMode);
      restorationComparisonVisibility.push(restorationGroup.visible);
    }
    const sceneModes = [
      world.performAcademicInteraction(actionNames.cycleSceneMode).state.sceneMode,
      world.performAcademicInteraction(actionNames.cycleSceneMode).state.sceneMode,
      world.performAcademicInteraction(actionNames.cycleSceneMode).state.sceneMode,
    ];
    const cameraPresetResults = [
      world.performAcademicInteraction(actionNames.cycleCameraPreset).state,
      world.performAcademicInteraction(actionNames.cycleCameraPreset).state,
      world.performAcademicInteraction(actionNames.cycleCameraPreset).state,
      world.performAcademicInteraction(actionNames.cycleCameraPreset).state,
    ];
    const resetCamera = world.performAcademicInteraction(actionNames.resetCamera);
    const debugOn = world.performAcademicInteraction(actionNames.toggleDebug);
    const debugVisible = debugGroup.visible;
    world.performAcademicInteraction(actionNames.toggleDebug);

    world.camera.position.copy(center).add(world.camera.position.clone().set(5, 0.162, 5));
    const remote = world.performAcademicInteraction(actionNames.readPlaque);
    world.camera.position.set(nearPoint.x, ground + 0.162, nearPoint.z);

    return {
      nearby: world.isAcademicFountainNearby(),
      plaque,
      initial,
      stop,
      stoppedProgress,
      stoppedVisuals,
      start,
      restartedProgress,
      decrease,
      decreaseProgress,
      increase,
      increaseProgress,
      infinityOff,
      infinityOffIntensity,
      infinityOn,
      infinityOnIntensity,
      engravingsOn,
      engravingHaloOn,
      symbol,
      cutawayOn,
      cutawayVisible,
      gridOn,
      gridVisible,
      ringOn,
      ringStart,
      ringEnd,
      statueModes,
      restorationModes,
      restorationComparisonVisibility,
      sceneModes,
      cameraPresetIds: cameraPresetResults.map((result) => result.cameraPreset),
      cameraRequests: cameraPresetResults.map((result) => result.cameraRequested),
      resetCamera,
      debugOn,
      debugVisible,
      remote,
      finalState: { ...world.getTextSnapshot().academicDistrict.fountain.state },
    };
  }, { root: rootName, districtId, actionNames: actions });

  // Exercise the real key/menu/click route, rather than only invoking the
  // public interaction method from page.evaluate.
  const beforeOrbit = await page.evaluate(({ root, districtId: id }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    document.querySelector('.mode[data-mode="walk"]')?.click();
    world.clearSelection('system');
    const point = center.clone().add(world.camera.position.clone().set(0, 0, 0.9));
    const ground = world.walkController.sampleGround(point.x, point.z) ?? district.position.y;
    world.camera.up.set(0, 1, 0);
    world.camera.position.set(point.x, ground + 0.162, point.z);
    world.camera.lookAt(center.x, center.y + 0.54, center.z);
    return { position: world.camera.position.toArray(), center: center.toArray() };
  }, { root: rootName, districtId });
  await page.keyboard.press('e');
  await page.waitForTimeout(350);
  const menuAudit = await page.evaluate(() => ({
    hidden: document.querySelector('#walk-interaction-menu')?.hidden,
    title: document.querySelector('#interaction-menu-title')?.textContent,
    buttons: [...document.querySelectorAll('#interaction-menu-buttons button')].map((button) => button.textContent),
  }));
  const orbitButton = page.getByRole('button', { name: 'Open orbit inspection', exact: true });
  await orbitButton.click({ timeout: 30_000 });
  await page.waitForTimeout(1_350);
  const afterOrbit = await page.evaluate(() => ({
    mode: window.labIsland.getTextSnapshot().mode,
    position: window.labIsland.camera.position.toArray(),
    target: window.labIsland.controls.target.toArray(),
    fieldOfView: window.labIsland.camera.fov,
    controlsMinDistance: window.labIsland.controls.minDistance,
    controlsMaxDistance: window.labIsland.controls.maxDistance,
  }));

  const collectPanelAudit = async () => page.evaluate(({ root, districtId: id }) => {
    const world = window.labIsland;
    const state = world.getTextSnapshot().academicDistrict.fountain.state;
    const fountain = world.objectGroups.get(id).getObjectByName(root);
    const panel = document.querySelector('#fountain-control-panel');
    const value = (selector) => document.querySelector(selector)?.value;
    const pressed = (selector) => document.querySelector(selector)?.getAttribute('aria-pressed');
    return {
      hidden: panel?.hidden,
      display: panel ? getComputedStyle(panel).display : null,
      inspectionActive: world.isAcademicFountainInspectionActive(),
      mode: world.getTextSnapshot().mode,
      values: {
        sceneMode: value('#fountain-scene-mode'),
        statueMaterial: value('#fountain-statue-material'),
        cameraPreset: value('#fountain-camera-preset'),
        quality: value('#fountain-quality'),
        worldQuality: world.getGraphicsQuality(),
        waterFlow: Number(value('#fountain-water-flow')),
        waterFlowOutput: document.querySelector('#fountain-water-flow-output')?.textContent,
        waterPressed: pressed('#fountain-water-toggle'),
        infinityPressed: pressed('#fountain-infinity-light'),
        cutawayPressed: pressed('#fountain-cutaway'),
        gridPressed: pressed('#fountain-geometry-grid'),
      },
      state: { ...state },
      cutawayVisualVisible: fountain.getObjectByName('WELL__INTERNAL_WATER_SYSTEM_CUTAWAY')?.visible,
      summary: document.querySelector('#fountain-control-summary')?.textContent,
      footer: document.querySelector('#fountain-control-state')?.textContent,
    };
  }, { root: rootName, districtId });
  await page.waitForFunction(() => document.querySelector('#fountain-control-panel')?.hidden === false, null, { timeout: 10_000 });
  const panelBefore = await collectPanelAudit();
  await page.locator('#fountain-cutaway').click({ timeout: 10_000 });
  await page.waitForTimeout(180);
  const panelAfterCutaway = await collectPanelAudit();
  await page.locator('#fountain-cutaway').click({ timeout: 10_000 });
  await page.waitForTimeout(180);
  const panelRestored = await collectPanelAudit();
  const priorPanelFlow = panelRestored.state.requestedWaterFlow;
  await page.locator('#fountain-water-flow').evaluate((input) => {
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(180);
  const panelAtZeroFlow = await collectPanelAudit();
  await page.evaluate((priorFlow) => window.labIsland.setAcademicFountainWaterFlow(priorFlow), priorPanelFlow);
  // A reversible panel action resynchronizes all displayed values after the
  // exact programmatic cleanup without introducing another scene rebuild.
  await page.locator('#fountain-cutaway').click({ timeout: 10_000 });
  await page.locator('#fountain-cutaway').click({ timeout: 10_000 });
  await page.waitForTimeout(180);
  const panelAfterFlowRestore = await collectPanelAudit();
  const panelAudit = {
    before: panelBefore,
    afterCutaway: panelAfterCutaway,
    restored: panelRestored,
    priorPanelFlow,
    atZeroFlow: panelAtZeroFlow,
    afterFlowRestore: panelAfterFlowRestore,
  };

  const topDownRequest = await page.evaluate(({ root, districtId: id, actionNames }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    world.setMode('walk');
    const nearPoint = center.clone().add(world.camera.position.clone().set(0, 0, 0.9));
    const ground = world.walkController.sampleGround(nearPoint.x, nearPoint.z) ?? district.position.y;
    world.camera.position.set(nearPoint.x, ground + 0.162, nearPoint.z);
    let result = null;
    for (let index = 0; index < 4; index += 1) {
      const state = world.getTextSnapshot().academicDistrict.fountain.state;
      if (state.cameraPreset === 'top-down') break;
      result = world.performAcademicInteraction(actionNames.cycleCameraPreset);
    }
    const state = world.getTextSnapshot().academicDistrict.fountain.state;
    world.setMode('explore');
    const focusAccepted = world.focusAcademicFountain(state.cameraPreset);
    return { result, cameraPreset: state.cameraPreset, focusAccepted };
  }, { root: rootName, districtId, actionNames: actions });
  await page.waitForTimeout(1_150);
  const topDownPose = await page.evaluate(() => ({
    mode: window.labIsland.getTextSnapshot().mode,
    position: window.labIsland.camera.position.toArray(),
    target: window.labIsland.controls.target.toArray(),
    up: window.labIsland.camera.up.toArray(),
    fieldOfView: window.labIsland.camera.fov,
  }));

  const heroResetRequest = await page.evaluate(({ root, districtId: id, actionNames }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    world.setMode('walk');
    const nearPoint = center.clone().add(world.camera.position.clone().set(0, 0, 0.9));
    const ground = world.walkController.sampleGround(nearPoint.x, nearPoint.z) ?? district.position.y;
    world.camera.position.set(nearPoint.x, ground + 0.162, nearPoint.z);
    const result = world.performAcademicInteraction(actionNames.resetCamera);
    world.setMode('explore');
    const focusAccepted = world.focusAcademicFountain(result.state.cameraRequested);
    return { result, focusAccepted };
  }, { root: rootName, districtId, actionNames: actions });
  await page.waitForTimeout(1_150);
  const heroResetPose = await page.evaluate(() => ({
    mode: window.labIsland.getTextSnapshot().mode,
    position: window.labIsland.camera.position.toArray(),
    target: window.labIsland.controls.target.toArray(),
    up: window.labIsland.camera.up.toArray(),
    fieldOfView: window.labIsland.camera.fov,
  }));
  const cameraResetAudit = { topDownRequest, topDownPose, heroResetRequest, heroResetPose };

  // Reproduce the user's photographed empty-court viewpoint exactly, now with
  // the monument centered in it.
  await page.evaluate(({ root, districtId: id, cameraXZ, targetY }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    world.setGraphicsQuality('high');
    world.setSeason('autumn');
    world.setWeather('academic-overcast');
    world.setTimeOfDay('noon');
    world.setMode('walk');
    const ground = world.walkController.sampleGround(cameraXZ[0], cameraXZ[1]) ?? district.position.y;
    world.camera.up.set(0, 1, 0);
    world.camera.fov = 55;
    world.camera.near = 0.02;
    world.camera.updateProjectionMatrix();
    world.camera.position.set(cameraXZ[0], ground + 0.162, cameraXZ[1]);
    world.camera.lookAt(center.x, targetY, center.z);
    world.renderer.render(world.scene, world.camera);
    document.querySelectorAll(
      '.atlas, .topbar, #scene-card, .scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, '
      + '.walk-interaction-menu, #fountain-control-panel, .toast-region, #loading-screen, .loading-screen',
    ).forEach((element) => { element.style.display = 'none'; });
  }, { root: rootName, districtId, cameraXZ: picturedWalkPosition, targetY: picturedWalkTargetY });
  await page.waitForTimeout(1_100);
  const picturedWalkScreenshot = `${outputDirectory}/pictured-gaslight-court-walk.png`;
  await page.screenshot({ path: picturedWalkScreenshot, timeout: 45_000 });

  const presetScreenshots = [
    await capturePreset('hero-courtyard', 'courtyard', 'hero'),
    await capturePreset('low-angle-rainy-night', 'night', 'low-angle'),
    await capturePreset('top-down-presentation', 'presentation', 'top-down'),
    await capturePreset('side-profile-courtyard', 'courtyard', 'side-profile'),
  ];

  const preparedSavedState = await page.evaluate(({ root, districtId: id, actionNames }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    world.setMode('walk');
    const nearPoint = center.clone().add(world.camera.position.clone().set(0, 0, 0.9));
    const ground = world.walkController.sampleGround(nearPoint.x, nearPoint.z) ?? district.position.y;
    world.camera.position.set(nearPoint.x, ground + 0.162, nearPoint.z);
    const state = () => world.getTextSnapshot().academicDistrict.fountain.state;
    const cycleUntil = (key, desired, action, limit) => {
      for (let index = 0; index < limit && state()[key] !== desired; index += 1) {
        world.performAcademicInteraction(action);
      }
    };

    cycleUntil('sceneMode', 'night', actionNames.cycleSceneMode, 3);
    cycleUntil('statueMaterial', 'bronze', actionNames.cycleStatueMaterial, 3);
    cycleUntil('restorationMode', 'comparison', actionNames.cycleRestorationView, 3);
    cycleUntil('cameraPreset', 'top-down', actionNames.cycleCameraPreset, 4);
    if (state().infinityLightOn) world.performAcademicInteraction(actionNames.toggleInfinityLight);
    if (!state().engravingsHighlighted) world.performAcademicInteraction(actionNames.highlightEngravings);
    if (!state().cutawayVisible) world.performAcademicInteraction(actionNames.toggleCutaway);
    if (!state().geometryGridVisible) world.performAcademicInteraction(actionNames.toggleGeometryGrid);
    if (!state().ringRotating) world.performAcademicInteraction(actionNames.toggleRingRotation);
    world.performAcademicInteraction(actionNames.decreaseWaterFlow);
    world.performAcademicInteraction(actionNames.decreaseWaterFlow);
    if (state().waterOn) world.performAcademicInteraction(actionNames.toggleWater);

    const prepared = { ...state() };
    world.setMode('explore');
    const focusAccepted = world.focusAcademicFountain(prepared.cameraPreset);
    return { prepared, focusAccepted };
  }, { root: rootName, districtId, actionNames: actions });
  await page.waitForTimeout(1_150);

  // Use the real Save control so this exercises the same LocalStorage route as
  // the application toolbar.
  await page.locator('#save-project').evaluate((button) => button.click());
  const savedStateAudit = await page.evaluate(({ keys }) => {
    const world = window.labIsland;
    const state = world.getTextSnapshot().academicDistrict.fountain.state;
    const payload = JSON.parse(localStorage.getItem('youtopy_saved_project'));
    return {
      state: Object.fromEntries(keys.map((key) => [key, state[key]])),
      payloadState: payload.editor.academicFountain,
      camera: {
        position: world.camera.position.toArray(),
        target: world.controls.target.toArray(),
        up: world.camera.up.toArray(),
        fieldOfView: world.camera.fov,
        near: world.camera.near,
      },
    };
  }, { keys: persistedFountainStateKeys });

  const mutatedState = await page.evaluate(({ root, districtId: id, actionNames }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const center = fountain.getWorldPosition(world.camera.position.clone());
    world.setMode('walk');
    const nearPoint = center.clone().add(world.camera.position.clone().set(0, 0, 0.9));
    const ground = world.walkController.sampleGround(nearPoint.x, nearPoint.z) ?? district.position.y;
    world.camera.position.set(nearPoint.x, ground + 0.162, nearPoint.z);
    [
      actionNames.toggleWater,
      actionNames.increaseWaterFlow,
      actionNames.toggleInfinityLight,
      actionNames.highlightEngravings,
      actionNames.toggleCutaway,
      actionNames.toggleGeometryGrid,
      actionNames.toggleRingRotation,
      actionNames.cycleStatueMaterial,
      actionNames.cycleRestorationView,
      actionNames.cycleSceneMode,
      actionNames.resetCamera,
    ].forEach((action) => world.performAcademicInteraction(action));
    world.setMode('explore');
    world.focusAcademicFountain('hero');
    return { ...world.getTextSnapshot().academicDistrict.fountain.state };
  }, { root: rootName, districtId, actionNames: actions });
  await page.waitForTimeout(950);

  const waitForSavedState = async () => page.waitForFunction(
    ({ districtId: id, root, expected }) => {
      const world = window.labIsland;
      const fountain = world?.objectGroups.get(id)?.getObjectByName(root);
      const state = world?.getTextSnapshot().academicDistrict.fountain.state;
      if (!fountain || world.objectGroups.size !== 41 || fountain.userData.fountainMounted !== true || !state) return false;
      return Object.entries(expected).every(([key, value]) => (
        typeof value === 'number' ? Math.abs(state[key] - value) < 0.001 : state[key] === value
      ));
    },
    { districtId, root: rootName, expected: savedStateAudit.state },
    { timeout: 180_000 },
  );

  const collectPersistenceAudit = async () => page.evaluate(({ root, districtId: id, formerCourtName, keys }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const mounted = [];
    const legacy = [];
    district.traverse((object) => {
      if (object.userData.fountainMounted === true) mounted.push(object);
      if (object.name === 'ACADEMIC__FOUNTAIN_OF_QUIET_LEARNING') legacy.push(object.name);
    });
    const fountain = district.getObjectByName(root);
    const formerCourt = district.getObjectByName(formerCourtName);
    const formerMounted = [];
    formerCourt?.traverse((object) => {
      if (object.userData.fountainMounted === true || object.name === root) formerMounted.push(object.name);
    });
    const snapshot = world.getTextSnapshot().academicDistrict.fountain;
    const state = snapshot.state;
    const infinityLight = fountain?.getObjectByName('WELL__INFINITY_ARCHITECTURAL_LIGHT');
    return {
      objectGroupCount: world.objectGroups.size,
      definitionCount: world.definitions?.size ?? 0,
      atlasDefinitionCount: document.querySelectorAll('#district-list .district-item').length,
      atlasAcademicCount: document.querySelectorAll(`#district-list .district-item[data-id="${id}"]`).length,
      mountedCount: mounted.length,
      legacy,
      formerMounted,
      parentName: fountain?.parent?.name,
      center: fountain?.getWorldPosition(world.camera.position.clone()).toArray(),
      mounted: snapshot?.mounted,
      visible: snapshot?.visible,
      rootName: snapshot?.rootName,
      version: snapshot?.version,
      state: Object.fromEntries(keys.map((key) => [key, state[key]])),
      visuals: {
        engravingHaloVisible: fountain?.getObjectByName('WELL__ENGRAVING_HIGHLIGHT_HALO')?.visible,
        cutawayVisible: fountain?.getObjectByName('WELL__INTERNAL_WATER_SYSTEM_CUTAWAY')?.visible,
        geometryGridVisible: fountain?.getObjectByName('WELL__UNDERLYING_GEOMETRIC_CONSTRUCTION_GRID')?.visible,
        restorationComparisonVisible: fountain?.getObjectByName('WELL__CLEAN_WEATHERED_RESTORATION_COMPARISON')?.visible,
        rainAndMistVisible: fountain?.getObjectByName('WELL__LOCAL_RAIN_AND_LOW_MIST')?.visible,
        infinityLightIntensity: infinityLight?.intensity,
      },
      camera: {
        position: world.camera.position.toArray(),
        target: world.controls.target.toArray(),
        up: world.camera.up.toArray(),
        fieldOfView: world.camera.fov,
        near: world.camera.near,
      },
      savedProjectPresent: Boolean(localStorage.getItem('youtopy_saved_project')),
    };
  }, { root: rootName, districtId, formerCourtName: formerFountainCourt, keys: persistedFountainStateKeys });

  // Mutate away from the saved state, then exercise the actual Refresh toolbar
  // control and prove the full fountain state and camera return.
  await page.locator('#refresh-project').evaluate((button) => button.click());
  await waitForSavedState();
  await page.waitForTimeout(1_800);
  const refreshAudit = await collectPersistenceAudit();

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.walkController), null, { timeout: 180_000 });
  await waitForSavedState();
  // The constructor first creates a pristine scene, then restores LocalStorage
  // on a zero-delay task. Leave a settling window so this cannot observe only
  // the pristine pre-restore frame.
  await page.waitForTimeout(3_000);
  const reloadAudit = await collectPersistenceAudit();

  const collectPersistenceRiskAudit = async () => page.evaluate(({ root, districtId: id, keys }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get(id);
    const fountain = district.getObjectByName(root);
    const state = world.getTextSnapshot().academicDistrict.fountain.state;
    const payload = JSON.parse(localStorage.getItem('youtopy_saved_project'));
    const water = fountain.getObjectByName('WELL__DARK_REFLECTIVE_POLYGONAL_WATER');
    const waterSheets = fountain.getObjectByName('WELL__THIN_PLINTH_WATER_SHEETS');
    const residualDrips = fountain.getObjectByName('WELL__RESIDUAL_WATER_DRIPS');
    const ringPivot = fountain.getObjectByName('WELL__TILTED_ORBITAL_RING_PIVOT');
    const panel = document.querySelector('#fountain-control-panel');
    const value = (selector) => document.querySelector(selector)?.value;
    const pressed = (selector) => document.querySelector(selector)?.getAttribute('aria-pressed');
    district.updateMatrixWorld(true);
    return {
      state: Object.fromEntries(keys.map((key) => [key, state[key]])),
      payloadState: payload?.editor?.academicFountain ?? null,
      payloadWorldExpansion: payload?.masterplan?.worldExpansion ?? null,
      worldQuality: world.getGraphicsQuality(),
      center: fountain.getWorldPosition(world.camera.position.clone()).toArray(),
      districtPosition: district.position.toArray(),
      visuals: {
        shaderFlow: Number(water?.material?.uniforms?.uFlow?.value),
        waterSheetOpacity: Number(waterSheets?.material?.opacity),
        waterSheetsVisible: Boolean(waterSheets?.visible),
        residualDripsVisible: Boolean(residualDrips?.visible),
        ringPivotAngle: Number(ringPivot?.rotation?.y),
      },
      panel: {
        hidden: panel?.hidden,
        display: panel ? getComputedStyle(panel).display : null,
        inspectionActive: world.isAcademicFountainInspectionActive(),
        mode: world.getTextSnapshot().mode,
        sceneMode: value('#fountain-scene-mode'),
        statueMaterial: value('#fountain-statue-material'),
        cameraPreset: value('#fountain-camera-preset'),
        quality: value('#fountain-quality'),
        waterFlow: Number(value('#fountain-water-flow')),
        waterFlowOutput: document.querySelector('#fountain-water-flow-output')?.textContent,
        waterPressed: pressed('#fountain-water-toggle'),
        infinityPressed: pressed('#fountain-infinity-light'),
        cutawayPressed: pressed('#fountain-cutaway'),
        gridPressed: pressed('#fountain-geometry-grid'),
      },
    };
  }, { root: rootName, districtId, keys: persistenceRiskStateKeys });

  // Exercise a genuinely low positive target through the visible range input.
  // It must remain 10% (the lowest valid range step) in the control, state,
  // water shader, and detailed sheets;
  // there must be no hidden 12%/72% minimum when starting from water-off.
  await page.evaluate(({ root, districtId: id }) => {
    const world = window.labIsland;
    const fountain = world.objectGroups.get(id).getObjectByName(root);
    world.setMode('explore');
    world.setGraphicsQuality('high');
    world.focusAcademicFountain(
      world.getTextSnapshot().academicDistrict.fountain.state.cameraPreset,
    );
    fountain.updateMatrixWorld(true);
    document.querySelector('#fountain-control-panel')?.style.removeProperty('display');
  }, { root: rootName, districtId });
  await page.waitForTimeout(900);
  await page.locator('#fountain-water-flow').evaluate((input) => {
    input.value = '10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.evaluate(() => window.labIsland.advanceTime(12_000));
  await page.waitForTimeout(120);
  const lowPositiveFlowAudit = await collectPersistenceRiskAudit();

  // Create a non-default, partially settled shutdown snapshot: the sheets have
  // fallen below their visibility threshold while a residual drip tail remains.
  // Pause a non-zero ring angle, then choose Low quality so a pristine rebuild
  // (medium / angle zero / 72% water) cannot accidentally satisfy this audit.
  await page.evaluate(({ actionNames }) => {
    const world = window.labIsland;
    const state = () => world.getTextSnapshot().academicDistrict.fountain.state;
    if (!state().ringRotating) world.performAcademicInteraction(actionNames.toggleRingRotation);
    world.advanceTime(1_750);
    if (state().ringRotating) world.performAcademicInteraction(actionNames.toggleRingRotation);
  }, { actionNames: actions });
  await page.locator('#fountain-water-flow').evaluate((input) => {
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.evaluate(() => window.labIsland.advanceTime(4_400));
  await page.locator('#fountain-quality').selectOption('low');
  await page.waitForTimeout(120);
  const persistenceRiskPrepared = await collectPersistenceRiskAudit();

  await page.locator('#save-project').evaluate((button) => button.click());
  const persistenceRiskSaved = await collectPersistenceRiskAudit();

  // Move every risk field away from its saved value before using the real
  // Refresh toolbar action.
  await page.evaluate(({ actionNames }) => {
    const world = window.labIsland;
    world.setGraphicsQuality('high');
    const state = () => world.getTextSnapshot().academicDistrict.fountain.state;
    if (!state().ringRotating) world.performAcademicInteraction(actionNames.toggleRingRotation);
    world.advanceTime(950);
    world.setAcademicFountainWaterFlow(0.72);
  }, { actionNames: actions });
  await page.waitForTimeout(120);
  const persistenceRiskMutated = await collectPersistenceRiskAudit();

  const waitForPersistenceRiskState = async (expected) => page.waitForFunction(
    ({ root, districtId: id, expectedState }) => {
      const world = window.labIsland;
      const fountain = world?.objectGroups.get(id)?.getObjectByName(root);
      const state = world?.getTextSnapshot().academicDistrict.fountain.state;
      if (!fountain || !state || world.objectGroups.size !== 41) return false;
      return state.waterOn === expectedState.waterOn
        && Math.abs(state.requestedWaterFlow - expectedState.requestedWaterFlow) < 1e-6
        && state.ringRotating === expectedState.ringRotating
        && Math.abs(state.ringAngle - expectedState.ringAngle) < 1e-6
        && state.quality === expectedState.quality;
    },
    { root: rootName, districtId, expectedState: expected },
    { timeout: 180_000 },
  );

  await page.locator('#refresh-project').evaluate((button) => button.click());
  await waitForPersistenceRiskState(persistenceRiskSaved.state);
  const persistenceRiskRefresh = await collectPersistenceRiskAudit();

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.walkController), null, { timeout: 180_000 });
  await waitForPersistenceRiskState(persistenceRiskSaved.state);
  // This sample is intentionally taken as soon as the distinctive angle and
  // quality prove deferred LocalStorage restoration has completed.
  const persistenceRiskColdImmediate = await collectPersistenceRiskAudit();
  await page.waitForFunction(
    () => {
      const panel = document.querySelector('#fountain-control-panel');
      return panel?.hidden === false && getComputedStyle(panel).display !== 'none';
    },
    null,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(1_600);
  const persistenceRiskColdSettled = await collectPersistenceRiskAudit();

  const featuresComplete = Object.values(staticAudit.requiredFeatures).every(Boolean);
  assert(featuresComplete, `Monument feature set incomplete: ${JSON.stringify(staticAudit.requiredFeatures)}`);
  assert(staticAudit.rootMatches.length === 1, `Expected one ${rootName}, found ${staticAudit.rootMatches.length}`);
  assert(staticAudit.mountedRoots.length === 1 && staticAudit.mountedRoots[0] === rootName, `Duplicate fountain roots: ${JSON.stringify(staticAudit.mountedRoots)}`);
  assert(staticAudit.legacyObjects.length === 0, `Legacy fountain objects remain: ${JSON.stringify(staticAudit.legacyObjects)}`);
  assert(staticAudit.formerCourtExists && staticAudit.formerCourtMountedRoots.length === 0, `A fountain remains in the former Bronze court: ${JSON.stringify(staticAudit.formerCourtMountedRoots)}`);
  assert(staticAudit.parentName === expectedParent && staticAudit.parentSemanticName === 'Gaslight Reading Courts', `Wrong parent court: ${staticAudit.parentName} / ${staticAudit.parentSemanticName}`);
  assert(staticAudit.center.every((value, index) => near(value, expectedCenter[index])), `Wrong world center: ${JSON.stringify(staticAudit.center)}`);
  assert(staticAudit.courtCenterDistance < 0.001 && staticAudit.mounted && staticAudit.visible, `Fountain mount invalid: ${JSON.stringify({ courtCenterDistance: staticAudit.courtCenterDistance, mounted: staticAudit.mounted, visible: staticAudit.visible })}`);
  assert(
    near(staticAudit.metadata.basinWidthMetres, 14, 0.001)
      && near(staticAudit.metadata.basinDepthMetres, 11.6, 0.001)
      && near(staticAudit.metadata.centralHeightMetres, 10.8, 0.001),
    `Configured dimensions invalid: ${JSON.stringify(staticAudit.metadata)}`,
  );
  // The authored outline is exactly 14 x 11.6m; the structural Box3 also
  // includes the 8cm stone bevel on each exposed side.
  assert(near(staticAudit.basinWidthMetres, 14, 0.2), `Physical outer basin width invalid: ${staticAudit.basinWidthMetres}m`);
  assert(near(staticAudit.basinDepthMetres, 11.6, 0.2), `Physical outer basin depth invalid: ${staticAudit.basinDepthMetres}m`);
  assert(
    staticAudit.basinFloorInsetWidthMetres < staticAudit.basinWidthMetres
      && staticAudit.basinFloorInsetDepthMetres < staticAudit.basinDepthMetres,
    `Basin floor is not inset from the 14 x 11.6m outer edge: ${JSON.stringify({ width: staticAudit.basinFloorInsetWidthMetres, depth: staticAudit.basinFloorInsetDepthMetres })}`,
  );
  assert(staticAudit.centralSilhouetteMetres >= 9.8 && staticAudit.centralSilhouetteMetres <= 11.6, `Physical silhouette implausible: ${staticAudit.centralSilhouetteMetres}m`);
  assert(staticAudit.metadata.performance.lodLevels === 3 && staticAudit.metadata.cameraPresets.length === 4 && staticAudit.metadata.sceneModes.length === 3, 'LOD, camera, or scene metadata incomplete');
  assert(staticAudit.metadata.interactions.length === Object.keys(actions).length, `Expected ${Object.keys(actions).length} contextual actions, found ${staticAudit.metadata.interactions.length}`);
  assert(staticAudit.instancedMeshCount >= 10 && staticAudit.shadowCastingLightCount <= 2, `Performance kit invalid: ${JSON.stringify({ instanced: staticAudit.instancedMeshCount, lights: staticAudit.pointLightCount, shadowCastingLights: staticAudit.shadowCastingLightCount })}`);
  assert(
    staticAudit.barrierAudit.total >= 12
      && staticAudit.barrierAudit.perimeter >= 8
      && staticAudit.barrierAudit.plinth === 4,
    `Basin/plinth navigation barriers invalid: ${JSON.stringify(staticAudit.barrierAudit)}`,
  );
  assert(
    staticAudit.processionalPaths.length >= 5
      && staticAudit.processionalPaths.every((entry) => entry.fountainBypass && entry.clearance > 0.02),
    `Processional Avenue does not safely bypass the basin: ${JSON.stringify(staticAudit.processionalPaths)}`,
  );
  assert(staticAudit.intersectingPaths.length === 0, `Academic path intersects basin: ${JSON.stringify(staticAudit.intersectingPaths)}`);
  assert(staticAudit.intersectingBenches.length === 0, `Academic bench intersects basin: ${JSON.stringify(staticAudit.intersectingBenches)}`);
  assert(staticAudit.intersectingTrees.length === 0, `Academic tree intersects basin: ${JSON.stringify(staticAudit.intersectingTrees)}`);

  assert(undoPrepared.snapshotWorldExpansion === 6, `Undo snapshot omitted expansion 6: ${JSON.stringify(undoPrepared)}`);
  assert(
    undoPrepared.snapshotAcademicPosition?.every((value, index) => near(value, undoPrepared.before.districtPosition[index], 1e-6)),
    `Undo snapshot Academic District position differs from runtime: ${JSON.stringify(undoPrepared)}`,
  );
  assert(
    Math.hypot(...undoPrepared.shifted.districtPosition.map((value, index) => value - undoPrepared.before.districtPosition[index])) > 10,
    `Undo test did not move the Academic District far enough: ${JSON.stringify(undoPrepared)}`,
  );
  assert(
    undoAudit.objectGroupCount === expectedObjectGroupCount
      && undoAudit.districtPosition.every((value, index) => near(value, undoPrepared.before.districtPosition[index], 1e-6))
      && undoAudit.fountainCenter.every((value, index) => near(value, undoPrepared.before.fountainCenter[index], 1e-6))
      && undoAudit.fountainCenter.every((value, index) => near(value, expectedCenter[index], 1e-6))
      && undoAudit.parentName === expectedParent,
    `Undo scaled or displaced the Academic District / fountain: ${JSON.stringify({ undoPrepared, undoAudit })}`,
  );

  assert(interactionAudit.nearby && /Well of Infinite Knowledge/i.test(interactionAudit.plaque.title), 'Nearby dedication interaction failed');
  assert(interactionAudit.stop.state.waterOn === false, 'Water stop action failed');
  assert(interactionAudit.stoppedProgress.waterFlow < interactionAudit.initial.waterFlow && interactionAudit.stoppedProgress.sheetFlow < interactionAudit.initial.sheetFlow, `Water did not weaken gradually: ${JSON.stringify(interactionAudit.stoppedProgress)}`);
  assert(interactionAudit.stoppedProgress.residualDrip > 0 && interactionAudit.stoppedVisuals.dripsVisible, 'Residual dripping was not retained after shutdown');
  assert(interactionAudit.start.state.waterOn === true && interactionAudit.restartedProgress.waterFlow > interactionAudit.stoppedProgress.waterFlow, 'Water restart did not strengthen gradually');
  assert(interactionAudit.decrease.state.requestedWaterFlow < interactionAudit.start.state.requestedWaterFlow, 'Decrease-flow control failed');
  assert(interactionAudit.increase.state.requestedWaterFlow > interactionAudit.decrease.state.requestedWaterFlow, 'Increase-flow control failed');
  assert(interactionAudit.infinityOff.state.infinityLightOn === false && interactionAudit.infinityOffIntensity === 0, 'Infinity light did not switch off');
  assert(interactionAudit.infinityOn.state.infinityLightOn === true && interactionAudit.infinityOnIntensity > 0, 'Infinity light did not switch on');
  assert(interactionAudit.engravingsOn.state.engravingsHighlighted && interactionAudit.engravingHaloOn, 'Engraving highlight failed');
  assert(Boolean(interactionAudit.symbol.title) && /Placement:/i.test(interactionAudit.symbol.message), 'Scientific symbol description failed');
  assert(interactionAudit.cutawayOn.state.cutawayVisible && interactionAudit.cutawayVisible, 'Cutaway toggle failed');
  assert(interactionAudit.gridOn.state.geometryGridVisible && interactionAudit.gridVisible, 'Construction-grid toggle failed');
  assert(interactionAudit.ringOn.state.ringRotating && Math.abs(interactionAudit.ringEnd - interactionAudit.ringStart) > 0.01, 'Orbital-ring inspection did not rotate');
  assert(new Set(interactionAudit.statueModes).size === 3 && interactionAudit.statueModes.at(-1) === 'hybrid', `Statue material cycle failed: ${JSON.stringify(interactionAudit.statueModes)}`);
  assert(new Set(interactionAudit.restorationModes).size === 3 && interactionAudit.restorationModes.at(-1) === 'weathered', `Restoration cycle failed: ${JSON.stringify(interactionAudit.restorationModes)}`);
  assert(
    JSON.stringify(interactionAudit.restorationComparisonVisibility) === JSON.stringify([false, true, false]),
    `Real restoration comparison clone did not follow restoration mode: ${JSON.stringify(interactionAudit.restorationComparisonVisibility)}`,
  );
  assert(new Set(interactionAudit.sceneModes).size === 3 && interactionAudit.sceneModes.at(-1) === 'courtyard', `Scene-mode cycle failed: ${JSON.stringify(interactionAudit.sceneModes)}`);
  assert(JSON.stringify(interactionAudit.cameraPresetIds) === JSON.stringify(['low-angle', 'top-down', 'side-profile', 'hero']), `Camera preset cycle failed: ${JSON.stringify(interactionAudit.cameraPresetIds)}`);
  assert(interactionAudit.resetCamera.state.cameraPreset === 'hero' && interactionAudit.resetCamera.state.cameraRequested === 'hero', 'Reset-camera interaction failed');
  assert(interactionAudit.debugOn.state.debugVisible && interactionAudit.debugVisible, 'Debug-view toggle failed');
  assert(interactionAudit.remote.state.available === false, 'Remote fountain interaction was not rejected');

  const expectedMenuLabels = [
    'Read monument dedication',
    'Open orbit inspection',
    'Reset hero camera',
    'Next camera preset',
    'Cycle presentation / courtyard / night',
    'Stop measured water system',
    'Increase water flow',
    'Decrease water flow',
    'Toggle infinity-loop light',
    'Highlight scientific engravings',
    'Describe next scientific symbol',
    'Toggle hydraulic cutaway',
    'Toggle construction grid',
    'Start / pause ring inspection',
    'Cycle Seshat material',
    'Cycle restoration comparison',
    'Toggle fountain debug view',
  ];
  assert(!menuAudit.hidden && /Well of Infinite Knowledge/i.test(menuAudit.title ?? ''), `Nearby E menu failed: ${JSON.stringify(menuAudit)}`);
  assert(menuAudit.buttons.length === expectedMenuLabels.length && expectedMenuLabels.every((label) => menuAudit.buttons.includes(label)), `E menu actions incomplete: ${JSON.stringify(menuAudit.buttons)}`);
  assert(afterOrbit.mode === 'explore', `Orbit interaction did not enter Explore: ${afterOrbit.mode}`);
  const cameraMovement = Math.hypot(...afterOrbit.position.map((value, index) => value - beforeOrbit.position[index]));
  const cameraTargetDistance = Math.hypot(...afterOrbit.position.map((value, index) => value - afterOrbit.target[index]));
  assert(cameraMovement > 0.5, `Orbit camera did not move: ${cameraMovement}`);
  const expectedHeroPosition = expectedCenter.map((value, index) => value + cameraPresets.hero.position[index]);
  const expectedHeroTarget = expectedCenter.map((value, index) => value + cameraPresets.hero.target[index]);
  const expectedHeroDistance = Math.hypot(...expectedHeroPosition.map((value, index) => value - expectedHeroTarget[index]));
  assert(afterOrbit.position.every((value, index) => near(value, expectedHeroPosition[index], 0.06)), `Orbit camera pose incorrect: ${JSON.stringify(afterOrbit)}`);
  assert(afterOrbit.target.every((value, index) => near(value, expectedHeroTarget[index], 0.06)) && near(afterOrbit.fieldOfView, 45, 0.01), `Orbit target/FOV incorrect: ${JSON.stringify(afterOrbit)}`);
  assert(
    near(cameraTargetDistance, expectedHeroDistance, 0.06)
      && near(afterOrbit.controlsMinDistance, 0.8, 0.001)
      && near(afterOrbit.controlsMaxDistance, 4.2, 0.001),
    `Fountain orbit was clamped or uses wrong controls: ${JSON.stringify({ cameraTargetDistance, expectedHeroDistance, afterOrbit })}`,
  );
  assert(
    panelAudit.before.hidden === false
      && panelAudit.before.display !== 'none'
      && panelAudit.before.inspectionActive
      && panelAudit.before.mode === 'explore',
    `Explore fountain panel did not open after orbit: ${JSON.stringify(panelAudit.before)}`,
  );
  assert(
    panelAudit.before.values.sceneMode === panelAudit.before.state.sceneMode
      && panelAudit.before.values.statueMaterial === panelAudit.before.state.statueMaterial
      && panelAudit.before.values.cameraPreset === panelAudit.before.state.cameraPreset
      && panelAudit.before.values.quality === panelAudit.before.values.worldQuality
      // The range uses 10% steps, so the browser normalizes the 72% default
      // thumb to 70 while the adjacent output retains the exact 72% state.
      && Math.abs(panelAudit.before.values.waterFlow - Math.round(panelAudit.before.state.requestedWaterFlow * 100)) <= 5
      && panelAudit.before.values.waterPressed === String(panelAudit.before.state.waterOn)
      && panelAudit.before.values.infinityPressed === String(panelAudit.before.state.infinityLightOn)
      && panelAudit.before.values.cutawayPressed === String(panelAudit.before.state.cutawayVisible)
      && panelAudit.before.values.gridPressed === String(panelAudit.before.state.geometryGridVisible),
    `Explore fountain panel was not synchronized: ${JSON.stringify(panelAudit.before)}`,
  );
  assert(
    panelAudit.afterCutaway.state.cutawayVisible
      && panelAudit.afterCutaway.values.cutawayPressed === 'true'
      && panelAudit.afterCutaway.cutawayVisualVisible,
    `Explore panel cutaway control did not reach runtime visuals: ${JSON.stringify(panelAudit.afterCutaway)}`,
  );
  assert(
    panelAudit.restored.state.cutawayVisible === false
      && panelAudit.restored.values.cutawayPressed === 'false'
      && panelAudit.restored.cutawayVisualVisible === false,
    `Explore panel cutaway control did not restore state: ${JSON.stringify(panelAudit.restored)}`,
  );
  assert(
    panelAudit.atZeroFlow.state.requestedWaterFlow === 0
      && panelAudit.atZeroFlow.state.waterOn === false
      && panelAudit.atZeroFlow.values.waterFlow === 0
      && panelAudit.atZeroFlow.values.waterFlowOutput === '0%'
      && panelAudit.atZeroFlow.values.waterPressed === 'false',
    `Explore slider did not reach an exact stopped state: ${JSON.stringify(panelAudit.atZeroFlow)}`,
  );
  assert(
    near(panelAudit.afterFlowRestore.state.requestedWaterFlow, panelAudit.priorPanelFlow, 0.001)
      && panelAudit.afterFlowRestore.state.waterOn
      && panelAudit.afterFlowRestore.values.waterFlowOutput === `${Math.round(panelAudit.priorPanelFlow * 100)}%`
      && panelAudit.afterFlowRestore.values.waterPressed === 'true',
    `Explore slider cleanup did not restore the prior ${Math.round(panelAudit.priorPanelFlow * 100)}% target: ${JSON.stringify(panelAudit.afterFlowRestore)}`,
  );

  const expectedTopDownPosition = expectedCenter.map((value, index) => value + cameraPresets['top-down'].position[index]);
  const expectedTopDownTarget = expectedCenter.map((value, index) => value + cameraPresets['top-down'].target[index]);
  assert(
    cameraResetAudit.topDownRequest.focusAccepted
      && cameraResetAudit.topDownRequest.cameraPreset === 'top-down'
      && cameraResetAudit.topDownPose.mode === 'explore',
    `Top-down camera request failed: ${JSON.stringify(cameraResetAudit.topDownRequest)}`,
  );
  assert(
    cameraResetAudit.topDownPose.position.every((value, index) => near(value, expectedTopDownPosition[index], 0.06))
      && cameraResetAudit.topDownPose.target.every((value, index) => near(value, expectedTopDownTarget[index], 0.06))
      && cameraResetAudit.topDownPose.up.every((value, index) => near(value, cameraPresets['top-down'].up[index], 0.01))
      && near(cameraResetAudit.topDownPose.fieldOfView, cameraPresets['top-down'].fieldOfView, 0.01),
    `Top-down camera pose incorrect: ${JSON.stringify(cameraResetAudit.topDownPose)}`,
  );
  assert(
    cameraResetAudit.heroResetRequest.focusAccepted
      && cameraResetAudit.heroResetRequest.result.state.cameraPreset === 'hero'
      && cameraResetAudit.heroResetRequest.result.state.cameraRequested === 'hero',
    `Top-down reset action failed: ${JSON.stringify(cameraResetAudit.heroResetRequest)}`,
  );
  assert(
    cameraResetAudit.heroResetPose.position.every((value, index) => near(value, expectedHeroPosition[index], 0.06))
      && cameraResetAudit.heroResetPose.target.every((value, index) => near(value, expectedHeroTarget[index], 0.06))
      && near(cameraResetAudit.heroResetPose.fieldOfView, cameraPresets.hero.fieldOfView, 0.01),
    `Reset did not return the top-down camera to hero: ${JSON.stringify(cameraResetAudit.heroResetPose)}`,
  );

  const statesMatch = (actual, expected) => persistedFountainStateKeys.every((key) => (
    typeof expected[key] === 'number'
      ? near(actual[key], expected[key], 0.001)
      : actual[key] === expected[key]
  ));
  assert(preparedSavedState.focusAccepted && preparedSavedState.prepared.cameraPreset === 'top-down', `Distinct saved state preparation failed: ${JSON.stringify(preparedSavedState)}`);
  assert(savedStateAudit.state.sceneMode === 'night'
    && savedStateAudit.state.waterOn === false
    && savedStateAudit.state.requestedWaterFlow < 0.6
    && savedStateAudit.state.infinityLightOn === false
    && savedStateAudit.state.engravingsHighlighted
    && savedStateAudit.state.cutawayVisible
    && savedStateAudit.state.geometryGridVisible
    && savedStateAudit.state.ringRotating
    && savedStateAudit.state.statueMaterial === 'bronze'
    && savedStateAudit.state.restorationMode === 'comparison'
    && savedStateAudit.state.cameraPreset === 'top-down', `Saved fountain state was not distinctive: ${JSON.stringify(savedStateAudit.state)}`);
  assert(savedStateAudit.payloadState?.version === 2 && statesMatch(savedStateAudit.payloadState, savedStateAudit.state), `Serialized fountain payload differs from runtime: ${JSON.stringify(savedStateAudit)}`);
  assert(!statesMatch(mutatedState, savedStateAudit.state), 'Refresh precondition failed: fountain state was not mutated away from saved values');
  assert(
    savedStateAudit.camera.position.every((value, index) => near(value, expectedTopDownPosition[index], 0.06))
      && savedStateAudit.camera.target.every((value, index) => near(value, expectedTopDownTarget[index], 0.06))
      && savedStateAudit.camera.up.every((value, index) => near(value, cameraPresets['top-down'].up[index], 0.001))
      && near(savedStateAudit.camera.fieldOfView, cameraPresets['top-down'].fieldOfView, 0.001)
      && near(savedStateAudit.camera.near, 0.02, 0.001),
    `Saved camera was not the top-down pose: ${JSON.stringify(savedStateAudit.camera)}`,
  );

  for (const [label, audit] of [['Refresh', refreshAudit], ['cold bootstrap', reloadAudit]]) {
    assert(audit.savedProjectPresent, `Saved project was missing during ${label}`);
    assert(audit.objectGroupCount === expectedObjectGroupCount, `${label} restored ${audit.objectGroupCount} object groups instead of ${expectedObjectGroupCount}`);
    assert(
      audit.definitionCount >= expectedObjectGroupCount
        && audit.atlasDefinitionCount >= expectedObjectGroupCount
        && audit.atlasAcademicCount === 1,
      `${label} lost runtime or rendered Atlas definitions: ${JSON.stringify({ definitionCount: audit.definitionCount, atlasDefinitionCount: audit.atlasDefinitionCount, atlasAcademicCount: audit.atlasAcademicCount })}`,
    );
    assert(audit.mountedCount === 1 && audit.legacy.length === 0 && audit.formerMounted.length === 0, `${label} duplicated or misplaced fountain: ${JSON.stringify(audit)}`);
    assert(audit.parentName === expectedParent && audit.center.every((value, index) => near(value, expectedCenter[index])), `${label} fountain mount changed: ${JSON.stringify(audit)}`);
    assert(audit.mounted && audit.visible && audit.rootName === rootName && audit.version === 2, `${label} snapshot invalid: ${JSON.stringify(audit)}`);
    assert(statesMatch(audit.state, savedStateAudit.state), `${label} lost fountain state: ${JSON.stringify({ expected: savedStateAudit.state, actual: audit.state })}`);
    assert(
      audit.visuals.engravingHaloVisible
        && audit.visuals.cutawayVisible
        && audit.visuals.geometryGridVisible
        && audit.visuals.restorationComparisonVisible
        && audit.visuals.rainAndMistVisible
        && audit.visuals.infinityLightIntensity === 0,
      `${label} state did not reach fountain visuals: ${JSON.stringify(audit.visuals)}`,
    );
    assert(
      audit.camera.position.every((value, index) => near(value, savedStateAudit.camera.position[index], 0.06))
        && audit.camera.target.every((value, index) => near(value, savedStateAudit.camera.target[index], 0.06))
        && audit.camera.up.every((value, index) => near(value, savedStateAudit.camera.up[index], 0.001))
        && near(audit.camera.fieldOfView, savedStateAudit.camera.fieldOfView, 0.001)
        && near(audit.camera.near, savedStateAudit.camera.near, 0.001),
      `${label} lost the saved camera pose: ${JSON.stringify(audit.camera)}`,
    );
  }

  assert(
    lowPositiveFlowAudit.state.waterOn
      && near(lowPositiveFlowAudit.state.requestedWaterFlow, 0.1, 1e-6)
      && near(lowPositiveFlowAudit.state.waterFlow, 0.1, 0.001)
      && near(lowPositiveFlowAudit.state.sheetFlow, 0.1, 0.001)
      && near(lowPositiveFlowAudit.visuals.shaderFlow, 0.1, 0.001)
      && near(lowPositiveFlowAudit.visuals.waterSheetOpacity, 0.08 + 0.1 * 0.56, 0.002)
      && lowPositiveFlowAudit.visuals.waterSheetsVisible
      && lowPositiveFlowAudit.panel.waterFlow === 10
      && lowPositiveFlowAudit.panel.waterFlowOutput === '10%'
      && lowPositiveFlowAudit.panel.waterPressed === 'true',
    `Low positive flow did not display/render the exact 10% target: ${JSON.stringify(lowPositiveFlowAudit)}`,
  );
  assert(
    persistenceRiskPrepared.state.waterOn === false
      && persistenceRiskPrepared.state.requestedWaterFlow === 0
      && persistenceRiskPrepared.state.waterFlow < 0.012
      && persistenceRiskPrepared.state.sheetFlow < 0.012
      && persistenceRiskPrepared.state.residualDrip > 0.3
      && persistenceRiskPrepared.state.residualDrip < 0.65
      && persistenceRiskPrepared.state.ringRotating === false
      && persistenceRiskPrepared.state.ringAngle > 0.05
      && persistenceRiskPrepared.state.quality === 'low',
    `Risk persistence state was not distinctive and partially settled: ${JSON.stringify(persistenceRiskPrepared)}`,
  );

  const savedRiskState = persistenceRiskSaved.payloadState;
  assert(
    persistenceRiskSaved.payloadWorldExpansion === 6
      && savedRiskState?.version === 2
      && savedRiskState.waterOn === false
      && savedRiskState.requestedWaterFlow === 0
      && savedRiskState.waterFlow < 0.012
      && savedRiskState.sheetFlow < 0.012
      && savedRiskState.residualDrip > 0.3
      && savedRiskState.residualDrip < 0.65
      && savedRiskState.ringRotating === false
      && near(savedRiskState.ringAngle, persistenceRiskSaved.state.ringAngle, 1e-6)
      && savedRiskState.quality === 'low',
    `Saved payload omitted exact hydraulic, quality, ring, or expansion state: ${JSON.stringify(persistenceRiskSaved)}`,
  );
  assert(
    persistenceRiskMutated.state.waterOn
      && near(persistenceRiskMutated.state.requestedWaterFlow, 0.72, 1e-6)
      && persistenceRiskMutated.state.ringRotating
      && persistenceRiskMutated.state.quality === 'high'
      && !near(persistenceRiskMutated.state.ringAngle, savedRiskState.ringAngle, 0.01),
    `Risk persistence mutation did not leave the saved state: ${JSON.stringify(persistenceRiskMutated)}`,
  );

  const assertRestoredRiskState = (label, audit, hydraulicTolerance) => {
    assert(
      audit.payloadWorldExpansion === 6
        && audit.state.waterOn === savedRiskState.waterOn
        && near(audit.state.requestedWaterFlow, savedRiskState.requestedWaterFlow, 1e-6)
        && audit.state.ringRotating === savedRiskState.ringRotating
        && near(audit.state.ringAngle, savedRiskState.ringAngle, 1e-6)
        && audit.state.quality === savedRiskState.quality
        && audit.worldQuality === savedRiskState.quality,
      `${label} lost stable quality/ring/water controls: ${JSON.stringify(audit)}`,
    );
    assert(
      Math.abs(audit.state.waterFlow - savedRiskState.waterFlow) <= hydraulicTolerance
        && Math.abs(audit.state.sheetFlow - savedRiskState.sheetFlow) <= hydraulicTolerance
        && audit.state.residualDrip <= savedRiskState.residualDrip + 0.01
        && savedRiskState.residualDrip - audit.state.residualDrip <= hydraulicTolerance
        && audit.state.waterFlow < 0.05
        && audit.state.sheetFlow < 0.05
        && near(audit.visuals.shaderFlow, audit.state.waterFlow, 0.002),
      `${label} rebuilt water at a default flow instead of restoring actual hydraulics: ${JSON.stringify({ savedRiskState, audit })}`,
    );
    assert(
      audit.center.every((value, index) => near(value, expectedCenter[index], 1e-6))
        && near(audit.visuals.ringPivotAngle, 0.18 + savedRiskState.ringAngle, 1e-6),
      `${label} displaced the fountain or failed to apply the paused ring angle: ${JSON.stringify(audit)}`,
    );
  };
  assertRestoredRiskState('Refresh', persistenceRiskRefresh, 0.02);
  assertRestoredRiskState('cold load immediate sample', persistenceRiskColdImmediate, 0.025);

  const assertRestoredPanel = (label, audit) => assert(
    audit.panel.hidden === false
      && audit.panel.display !== 'none'
      && audit.panel.inspectionActive
      && audit.panel.mode === 'explore'
      && audit.panel.sceneMode === audit.state.sceneMode
      && audit.panel.statueMaterial === audit.state.statueMaterial
      && audit.panel.cameraPreset === audit.state.cameraPreset
      && audit.panel.quality === audit.state.quality
      && audit.panel.waterFlow === Math.round(audit.state.requestedWaterFlow * 100)
      && audit.panel.waterFlowOutput === `${Math.round(audit.state.requestedWaterFlow * 100)}%`
      && audit.panel.waterPressed === String(audit.state.waterOn)
      && audit.panel.infinityPressed === String(audit.state.infinityLightOn)
      && audit.panel.cutawayPressed === String(audit.state.cutawayVisible)
      && audit.panel.gridPressed === String(audit.state.geometryGridVisible),
    `${label} Explore panel did not visibly match restored controls: ${JSON.stringify(audit)}`,
  );
  assertRestoredPanel('Refresh', persistenceRiskRefresh);
  assertRestoredPanel('cold load', persistenceRiskColdSettled);
  assert(
    persistenceRiskColdSettled.state.waterOn === false
      && persistenceRiskColdSettled.state.waterFlow <= persistenceRiskColdImmediate.state.waterFlow + 0.001
      && persistenceRiskColdSettled.state.sheetFlow <= persistenceRiskColdImmediate.state.sheetFlow + 0.001
      && persistenceRiskColdSettled.state.residualDrip < persistenceRiskColdImmediate.state.residualDrip
      && persistenceRiskColdSettled.state.waterFlow < 0.05
      && persistenceRiskColdSettled.state.sheetFlow < 0.05
      && persistenceRiskColdSettled.state.ringAngle === persistenceRiskColdImmediate.state.ringAngle,
    `Cold-loaded stopped hydraulics rebounded while settling: ${JSON.stringify({ immediate: persistenceRiskColdImmediate, settled: persistenceRiskColdSettled })}`,
  );

  assert(consoleErrors.length === 0, `Console/page errors: ${JSON.stringify(consoleErrors)}`);

  const result = {
    staticAudit: {
      center: staticAudit.center,
      parentName: staticAudit.parentName,
      dimensions: {
        basinWidthMetres: staticAudit.basinWidthMetres,
        basinDepthMetres: staticAudit.basinDepthMetres,
        basinFloorInsetWidthMetres: staticAudit.basinFloorInsetWidthMetres,
        basinFloorInsetDepthMetres: staticAudit.basinFloorInsetDepthMetres,
        centralSilhouetteMetres: staticAudit.centralSilhouetteMetres,
      },
      meshCount: staticAudit.meshCount,
      instancedMeshCount: staticAudit.instancedMeshCount,
      requiredFeatures: staticAudit.requiredFeatures,
      barrierAudit: staticAudit.barrierAudit,
      nearestPath: staticAudit.nearestPath,
      processionalPaths: staticAudit.processionalPaths,
      nearestBench: staticAudit.nearestBench,
      nearestTree: staticAudit.nearestTree,
    },
    undoAudit: { prepared: undoPrepared, restored: undoAudit },
    interactionAudit,
    menuAudit,
    orbitAudit: { beforeOrbit, afterOrbit, cameraMovement, cameraTargetDistance },
    panelAudit,
    cameraResetAudit,
    persistenceAudit: {
      savedStateAudit,
      mutatedState,
      refreshAudit,
      reloadAudit,
      lowPositiveFlowAudit,
      risk: {
        prepared: persistenceRiskPrepared,
        saved: persistenceRiskSaved,
        mutated: persistenceRiskMutated,
        refresh: persistenceRiskRefresh,
        coldImmediate: persistenceRiskColdImmediate,
        coldSettled: persistenceRiskColdSettled,
      },
    },
    screenshots: [picturedWalkScreenshot, ...presetScreenshots],
    consoleErrors,
  };
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
