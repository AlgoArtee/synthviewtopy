import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.WELCOME_INTERIOR_OUTPUT
  ?? 'output/welcome-registration-interior';
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

const rootNames = [
  'COLLECTION__DISTRICT_ARCHITECTURE',
  'COLLECTION__TERRAIN_AND_BIOMES',
  'COLLECTION__TRANSIT_AND_BRIDGE',
  'COLLECTION__DISTANT_CYBERPUNK_CITY',
  'PRESENTATION_ONLY__DO_NOT_EXPORT',
  'EDITOR__LABELS',
];

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_500);

  const entrySetup = await page.evaluate((visibilityRoots) => {
    const world = window.labIsland;
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const interior = facility?.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    if (!facility || !interior) throw new Error('Welcome Registration interior is not mounted');
    world.setMode('walk');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setWalkSpeedKilometresPerHour(18);
    world.walkController.refreshNavigation();
    facility.updateMatrixWorld(true);
    const start = facility.localToWorld(world.camera.position.clone().set(0, 0.008, 7.7));
    const target = facility.localToWorld(world.controls.target.clone().set(0, 0.008, -4));
    const ground = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error('Welcome Registration entrance has no WALK ground');
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target.x, ground + 0.162, target.z);
    world.advanceTime(120);
    return {
      rootsBefore: Object.fromEntries(visibilityRoots.map((name) => [
        name,
        world.scene.getObjectByName(name)?.visible ?? null,
      ])),
      interiorInitiallyHidden: interior.visible === false,
      startLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
    };
  }, rootNames);

  await page.keyboard.down('w');
  await page.evaluate(() => window.labIsland.advanceTime(10_000));
  await page.keyboard.up('w');
  await page.evaluate(() => window.labIsland.advanceTime(180));

  const audit = await page.evaluate((setup) => {
    const world = window.labIsland;
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const interior = facility.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    const effectiveVisible = (object) => {
      let current = object;
      while (current) {
        if (!current.visible) return false;
        current = current.parent;
      }
      return true;
    };
    const projections = [];
    const rings = [];
    const privateRooms = [];
    const securityGates = [];
    const walkableObjects = [];
    const aggregateBoxObstacles = [];
    const architecturalWalls = [];
    const ceilingSurfaces = [];
    const sharedMaterials = new Set();
    interior.traverse((object) => {
      if (object.userData.exteriorWindowProjection === true
        && object.name.startsWith('ENTRY__E2__WINDOW_PROJECTION_')
        && object.parent === interior) projections.push(object);
      if (object.userData.animate === 'welcome-interior-ring') rings.push(object);
      if (/ENTRY__E2__PRIVATE_REGISTRATION_ROOM_\d+$/.test(object.name)) {
        privateRooms.push(object);
      }
      if (/ENTRY__E2__SECURITY_PORTAL_\d+_HIDDEN_GLASS_GATE$/.test(object.name)) {
        securityGates.push(object);
      }
      if (object.userData.walkable === true) walkableObjects.push(object);
      if (object.userData.navObstacle === true
        && object.geometry?.type === 'BoxGeometry') {
        aggregateBoxObstacles.push(object.name);
      }
      const isPrivateWall = /^ENTRY__E2__PRIVATE_REGISTRATION_ROOM_\d+__(WEST|NORTH|SOUTH)_WALL$/
        .test(object.name);
      const isUpperRoomWall = (
        object.name.startsWith('ENTRY__E2__UPPER_INSTITUTIONAL_MEETING_ROOM_')
        || object.name.startsWith('ENTRY__E2__UPPER_QUIET_LOW_STIMULATION_ARRIVAL_SUITE')
      ) && /__(OUTER|NORTH|SOUTH)_WALL$/.test(object.name);
      if (
        object.name.startsWith('ENTRY__E2__ATRIUM_LOW_IRON_GLASS_WALL_')
        || object.name === 'ENTRY__E2__ATRIUM_REAR_MINERAL_WALL'
        || object.name.startsWith('ENTRY__E2__ATRIUM_FRONT_GLASS_WING_')
        || object.name.startsWith('ENTRY__E2__THRESHOLD_CHARCOAL_WALL_')
        || isPrivateWall
        || /^ENTRY__E2__CREDENTIAL_LAB_GLASS_ENCLOSURE__(WEST|NORTH|SOUTH)_WALL$/
          .test(object.name)
        || isUpperRoomWall
      ) architecturalWalls.push(object);
      if (
        object.name.endsWith('__CEILING')
        || object.name === 'ENTRY__E2__CONTINUOUS_LIGHT_IVORY_CEILING_SKIN'
        || object.name === 'ENTRY__E2__TWENTY_FOUR_RADIAL_ACOUSTIC_COFFERS'
        || object.name === 'ENTRY__E2__ELLIPTICAL_LUMINOUS_CEILING_MEMBRANE'
      ) ceilingSurfaces.push(object);
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => sharedMaterials.add(material.uuid));
      }
    });
    const podBodies = interior.getObjectByName(
      'ENTRY__E2__TWELVE_SELF_REGISTRATION_POD_BODIES',
    );
    const registrationCounters = interior.getObjectByName(
      'ENTRY__E2__FOURTEEN_ACCESSIBLE_STAFFED_REGISTRATION_COUNTERS',
    );
    const forumSeats = interior.getObjectByName(
      'ENTRY__E2__ORIENTATION_FORUM_NINETY_SEATS',
    );
    const plants = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_INSTANCED_CURATED_PLANTS',
    );
    const livingIndex = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_SCIENTIFIC_GARDEN',
    );
    const botanicalLabels = ['WEST', 'EAST'].map((side) => interior.getObjectByName(
      `ENTRY__E2__LIVING_INDEX_SIX_SECTION_SCIENTIFIC_LABEL_STRIP_${side}`,
    )).filter(Boolean);
    const gardenGlassPanels = ['WEST', 'EAST', 'NORTH', 'SOUTH'].map(
      (side) => interior.getObjectByName(
        `ENTRY__E2__LIVING_INDEX_LOW_GLASS_CASE_${side}`,
      ),
    ).filter(Boolean);
    const gardenGrowLights = Array.from({ length: 3 }, (_, index) => (
      interior.getObjectByName(`ENTRY__E2__LIVING_INDEX_SUSPENDED_GROW_LIGHT_${index + 1}`)
    )).filter(Boolean);
    const gardenGrowLightCables = Array.from({ length: 6 }, (_, index) => (
      interior.getObjectByName(`ENTRY__E2__LIVING_INDEX_GROW_LIGHT_CABLE_${index + 1}`)
    )).filter(Boolean);
    const gardenMist = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_NINE_LOCALIZED_MIST_PLUMES',
    );
    const gardenFreshLeaves = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_THIRTY_SIX_FRESH_BROAD_LEAVES',
    );
    const gardenShrubCanopies = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_TWENTY_FOUR_DENSE_SHRUB_CANOPIES',
    );
    const gardenFernFronds = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_THIRTY_ARCHING_FERN_FRONDS',
    );
    const gardenGrassBlades = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_FORTY_TWO_COASTAL_GRASS_BLADES',
    );
    const gardenMossCushions = interior.getObjectByName(
      'ENTRY__E2__LIVING_INDEX_THIRTY_MOSS_CUSHIONS',
    );
    const gardenFlowerClusters = [
      'ENTRY__E2__LIVING_INDEX_TWELVE_VIOLET_MEDICINAL_FLOWERS',
      'ENTRY__E2__LIVING_INDEX_TWELVE_AMBER_MEDICINAL_FLOWERS',
    ].map((name) => interior.getObjectByName(name)).filter(Boolean);
    const coffers = interior.getObjectByName(
      'ENTRY__E2__TWENTY_FOUR_RADIAL_ACOUSTIC_COFFERS',
    );
    const ceilingSkin = interior.getObjectByName(
      'ENTRY__E2__CONTINUOUS_LIGHT_IVORY_CEILING_SKIN',
    );
    const exteriorRoof = facility.getObjectByName(
      'ENTRY__E2__FLOATING_ELLIPTICAL_ROOF',
    );
    const exteriorGlass = Array.from({ length: 40 }, (_, index) => facility.getObjectByName(
      `ENTRY__E2__TRANSPARENT_GLASS_DRUM_PANEL_${index + 1}`,
    )).find(Boolean);
    const interiorGlass = interior.getObjectByName(
      'ENTRY__E2__ATRIUM_LOW_IRON_GLASS_WALL_WEST',
    );
    const upperPlatforms = [
      'ENTRY__E2__UPPER_OBSERVATION_DECK_WEST',
      'ENTRY__E2__UPPER_OBSERVATION_DECK_EAST',
      'ENTRY__E2__UPPER_REAR_VIEWING_PLATFORM',
      'ENTRY__E2__UPPER_FRONT_ATRIUM_BRIDGE',
      'ENTRY__E2__UPPER_SCULPTURAL_STAIR_LANDING',
    ].map((name) => interior.getObjectByName(name)).filter(Boolean);
    const upperRooms = [
      'ENTRY__E2__UPPER_INSTITUTIONAL_MEETING_ROOM_1',
      'ENTRY__E2__UPPER_INSTITUTIONAL_MEETING_ROOM_2',
      'ENTRY__E2__UPPER_QUIET_LOW_STIMULATION_ARRIVAL_SUITE',
    ].map((name) => interior.getObjectByName(name)).filter(Boolean);
    const stairSteps = Array.from({ length: 26 }, (_, index) => (
      interior.getObjectByName(`ENTRY__E2__BROAD_SCULPTURAL_STAIR_STEP_${index + 1}`)
    )).filter(Boolean);
    const text = world.getTextSnapshot();
    return {
      ...setup,
      endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      groundedAfterEntry: world.walkController.getSnapshot().grounded,
      interiorVisible: effectiveVisible(interior),
      isolationActive: interior.userData.exteriorIsolationActive === true,
      runtimePolicies: text.runtimePolicies,
      rootsInside: Object.fromEntries(Object.keys(setup.rootsBefore).map((name) => [
        name,
        world.scene.getObjectByName(name)?.visible ?? null,
      ])),
      program: {
        roomId: interior.userData.roomId,
        zones: interior.userData.interiorZones,
        materials: interior.userData.materials,
        lightingStates: interior.userData.lightingStates,
        coloredLightPolicy: interior.userData.coloredLightPolicy,
        modularRealTimeStrategy: interior.userData.modularRealTimeStrategy,
        runtimeInteriorBounds: interior.userData.runtimeInteriorBounds,
        exteriorIsolationStrategy: interior.userData.exteriorIsolationStrategy,
        exteriorProjectionCount: projections.length,
        visibleProjectionCount: projections.filter(effectiveVisible).length,
        entranceDoorLayerCount: interior.userData.entranceDoorLayerCount,
        automaticDoorLeafCount: Array.from({ length: 3 }, (_, layer) => (
          ['WEST', 'EAST'].map((side) => interior.getObjectByName(
            `ENTRY__E2__VESTIBULE_LAYER_${layer + 1}_AUTOMATIC_GLASS_DOOR_${side}`,
          ))
        )).flat().filter(Boolean).length,
        thresholdDisplayCount: [
          'WEATHER',
          'ISLAND_ENERGY',
          'SEAWATER',
          'TRANSIT',
          'PUBLIC_SCIENCE',
        ].filter((name) => interior.getObjectByName(
          `ENTRY__E2__THRESHOLD_LIVE_DISPLAY_${name}`,
        )).length,
        islandModelPresent: Boolean(interior.getObjectByName(
          'ENTRY__E2__SIX_METRE_INTERACTIVE_ISLAND_MODEL',
        )),
        consoleCount: Array.from({ length: 6 }, (_, index) => interior.getObjectByName(
          `ENTRY__E2__ISLAND_MODEL_INTERACTIVE_CONSOLE_${index + 1}`,
        )).filter(Boolean).length,
        suspendedRingCount: rings.length,
        animatedRingCount: rings.filter((ring) => ring.userData.rotationSpeed > 0).length,
        selfRegistrationPodCount: podBodies?.count ?? 0,
        staffedRegistrationStationCount: registrationCounters?.count ?? 0,
        privateRegistrationRoomCount: privateRooms.length,
        credentialLabPresent: Boolean(interior.getObjectByName(
          'ENTRY__E2__GLASS_CREDENTIAL_FABRICATION_LABORATORY',
        )),
        forumTierCount: Array.from({ length: 5 }, (_, index) => interior.getObjectByName(
          `ENTRY__E2__ORIENTATION_FORUM_TIER_${index + 1}`,
        )).filter(Boolean).length,
        forumSeatCount: forumSeats?.count ?? 0,
        orientationTableCount: Array.from({ length: 4 }, (_, index) => interior.getObjectByName(
          `ENTRY__E2__INTERACTIVE_ORIENTATION_TABLE_${index + 1}`,
        )).filter(Boolean).length,
        livingIndexLengthMetres: interior.userData.livingIndexLengthMetres,
        livingIndexPlantCount: plants?.count ?? 0,
        livingIndexReferenceModel: livingIndex?.userData.referenceModel ?? null,
        livingIndexBotanicalLabelFaceCount: botanicalLabels.length,
        livingIndexBotanicalSectionCount: botanicalLabels.every(
          (label) => label.userData.botanicalSectionCount === 6,
        ) ? 6 : 0,
        livingIndexBotanicalLabelsFrontFacing: botanicalLabels.every(
          (label) => label.material?.side === 0,
        ),
        livingIndexBotanicalLabelAisles: botanicalLabels.map(
          (label) => label.userData.readableFromGardenAisle,
        ).sort(),
        livingIndexBotanicalLabelRotations: botanicalLabels.map(
          (label) => Number(label.rotation.y.toFixed(6)),
        ).sort((a, b) => a - b),
        livingIndexGlassPanelCount: gardenGlassPanels.length,
        livingIndexFreshLeafCount: gardenFreshLeaves?.count ?? 0,
        livingIndexShrubCanopyCount: gardenShrubCanopies?.count ?? 0,
        livingIndexFernFrondCount: gardenFernFronds?.count ?? 0,
        livingIndexGrassBladeCount: gardenGrassBlades?.count ?? 0,
        livingIndexMossCushionCount: gardenMossCushions?.count ?? 0,
        livingIndexFlowerCount: gardenFlowerClusters.reduce(
          (total, flowers) => total + (flowers.count ?? 0),
          0,
        ),
        livingIndexFlowerColorCount: new Set(gardenFlowerClusters.map(
          (flowers) => flowers.material?.color?.getHexString?.(),
        )).size,
        livingIndexGrowLightCount: gardenGrowLights.length,
        livingIndexGrowLightCableCount: gardenGrowLightCables.length,
        livingIndexMistPlumeCount: gardenMist?.count ?? 0,
        livingIndexMistLocalized: gardenMist?.userData.animate
          === 'living-index-humidity-drift',
        securityPortalCount: securityGates.length,
        securityGatesNonBlocking: securityGates.every((gate) => gate.userData.navObstacle !== true),
        routeLineCount: [
          'LABS',
          'BIODOMES',
          'RESIDENTIAL',
          'MALL',
          'HOTEL',
          'AIRPORT',
          'TRANSIT',
        ].filter((route) => interior.getObjectByName(
          `ENTRY__E2__TRANSIT_ROUTE_LINE_${route}`,
        )).length,
        upperDeckCount: ['WEST', 'EAST'].filter((side) => interior.getObjectByName(
          `ENTRY__E2__UPPER_OBSERVATION_DECK_${side}`,
        )).length,
        panoramicLiftCount: ['WEST', 'EAST'].filter((side) => interior.getObjectByName(
          `ENTRY__E2__PANORAMIC_GLASS_LIFT_${side}`,
        )).length,
        sculpturalStairStepCount: stairSteps.length,
        ceilingCofferCount: coffers?.count ?? 0,
        luminousMembranePresent: Boolean(interior.getObjectByName(
          'ENTRY__E2__ELLIPTICAL_LUMINOUS_CEILING_MEMBRANE',
        )),
        continuousCeilingPresent: Boolean(ceilingSkin),
        ceilingColor: ceilingSkin?.material?.color?.getHexString?.() ?? null,
        exteriorRoofColor: exteriorRoof?.material?.color?.getHexString?.() ?? null,
        ceilingMatchesExteriorRoof: Boolean(
          ceilingSkin?.material?.color
          && exteriorRoof?.material?.color
          && ceilingSkin.material.color.equals(exteriorRoof.material.color),
        ),
        exteriorGlassColor: exteriorGlass?.material?.color?.getHexString?.() ?? null,
        interiorGlassColor: interiorGlass?.material?.color?.getHexString?.() ?? null,
        exteriorGlassOpacity: exteriorGlass?.material?.opacity ?? null,
        interiorGlassOpacity: interiorGlass?.material?.opacity ?? null,
        architecturalWallCount: architecturalWalls.length,
        architecturalWallColors: [
          ...new Set(architecturalWalls.map(
            (wall) => wall.material?.color?.getHexString?.() ?? null,
          )),
        ],
        ceilingSurfaceCount: ceilingSurfaces.length,
        ceilingSurfaceColors: [
          ...new Set(ceilingSurfaces.map(
            (surface) => surface.material?.color?.getHexString?.() ?? null,
          )),
        ],
        upperPlatformCount: upperPlatforms.length,
        upperPlatformsWalkable: upperPlatforms.every(
          (platform) => platform.userData.walkable === true,
        ),
        upperLevelLoopComplete: interior.userData.upperLevelLoopComplete,
        furnishedUpperRoomCount: upperRooms.filter((room) => (
          room.getObjectByName(`${room.name}__COLLABORATION_TABLE`)
          || room.getObjectByName(`${room.name}__LOW_STIMULATION_LOUNGE_1`)
        )).length,
        upperLevelDirectoryPresent: Boolean(interior.getObjectByName(
          'ENTRY__E2__UPPER_LEVEL_DIRECTORY',
        )),
        preciseWalkBarrierCount: interior.getObjectByName(
          'ENTRY__E2__PRECISE_INTERIOR_WALK_COLLISION',
        )?.userData.navBarrierSegments?.length ?? 0,
        aggregateBoxObstacleNames: aggregateBoxObstacles,
        walkCollisionPolicy: interior.userData.walkCollisionPolicy,
        walkTestZones: interior.userData.walkTestZones,
        walkableObjectCount: walkableObjects.length,
        uniqueMaterialCount: sharedMaterials.size,
      },
    };
  }, entrySetup);

  const expected = audit.program;
  if (!audit.interiorInitiallyHidden
    || !audit.interiorVisible
    || !audit.isolationActive
    || !audit.groundedAfterEntry
    || audit.endLocal[2] > 4.35
    || !audit.runtimePolicies.isolatedWalkInteriorActive
    || audit.runtimePolicies.isolatedWalkInteriorName
      !== 'ENTRY__E2__WELCOME_REGISTRATION_INTERIOR'
    || audit.runtimePolicies.isolatedExteriorObjectCount < 5
    || audit.runtimePolicies.exteriorProjectionCount !== 6
    || expected.zones.length !== 10
    || expected.exteriorProjectionCount !== 6
    || expected.visibleProjectionCount !== 6
    || expected.entranceDoorLayerCount !== 3
    || expected.automaticDoorLeafCount !== 6
    || expected.thresholdDisplayCount !== 5
    || !expected.islandModelPresent
    || expected.consoleCount !== 6
    || expected.suspendedRingCount !== 5
    || expected.animatedRingCount !== 5
    || expected.selfRegistrationPodCount !== 12
    || expected.staffedRegistrationStationCount !== 14
    || expected.privateRegistrationRoomCount !== 8
    || !expected.credentialLabPresent
    || expected.forumTierCount !== 5
    || expected.forumSeatCount !== 90
    || expected.orientationTableCount !== 4
    || expected.livingIndexLengthMetres !== 22
    || expected.livingIndexPlantCount !== 48
    || expected.livingIndexReferenceModel !== 'low-glass botanical research display'
    || expected.livingIndexBotanicalLabelFaceCount !== 2
    || expected.livingIndexBotanicalSectionCount !== 6
    || !expected.livingIndexBotanicalLabelsFrontFacing
    || expected.livingIndexBotanicalLabelAisles.join(',') !== 'EAST,WEST'
    || expected.livingIndexBotanicalLabelRotations.join(',')
      !== '-1.570796,1.570796'
    || expected.livingIndexGlassPanelCount !== 4
    || expected.livingIndexFreshLeafCount !== 36
    || expected.livingIndexShrubCanopyCount !== 24
    || expected.livingIndexFernFrondCount !== 30
    || expected.livingIndexGrassBladeCount !== 42
    || expected.livingIndexMossCushionCount !== 30
    || expected.livingIndexFlowerCount !== 24
    || expected.livingIndexFlowerColorCount !== 2
    || expected.livingIndexGrowLightCount !== 3
    || expected.livingIndexGrowLightCableCount !== 6
    || expected.livingIndexMistPlumeCount !== 9
    || !expected.livingIndexMistLocalized
    || expected.securityPortalCount !== 6
    || !expected.securityGatesNonBlocking
    || expected.routeLineCount !== 7
    || expected.upperDeckCount !== 2
    || expected.panoramicLiftCount !== 2
    || expected.sculpturalStairStepCount !== 26
    || expected.ceilingCofferCount !== 24
    || !expected.luminousMembranePresent
    || !expected.continuousCeilingPresent
    || expected.ceilingColor !== 'e3e5df'
    || !expected.ceilingMatchesExteriorRoof
    || expected.exteriorGlassColor !== '8fbac2'
    || expected.interiorGlassColor !== expected.exteriorGlassColor
    || expected.interiorGlassOpacity !== expected.exteriorGlassOpacity
    || expected.architecturalWallCount !== 43
    || expected.architecturalWallColors.length !== 1
    || expected.architecturalWallColors[0] !== '8fbac2'
    || expected.ceilingSurfaceCount !== 15
    || expected.ceilingSurfaceColors.length !== 1
    || expected.ceilingSurfaceColors[0] !== 'e3e5df'
    || expected.upperPlatformCount !== 5
    || !expected.upperPlatformsWalkable
    || !expected.upperLevelLoopComplete
    || expected.furnishedUpperRoomCount !== 3
    || !expected.upperLevelDirectoryPresent
    || expected.preciseWalkBarrierCount < 60
    || expected.aggregateBoxObstacleNames.length !== 0
    || expected.walkTestZones.length < 20
    || expected.walkableObjectCount < 34
    || expected.uniqueMaterialCount > 30) {
    throw new Error(`Welcome Registration program or isolation failed: ${
      JSON.stringify(audit, null, 2)
    }`);
  }

  const walkRouteAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    if (!facility) throw new Error('Cannot run Welcome Hall WALK route audit');
    facility.updateMatrixWorld(true);
    world.setMode('walk');
    world.walkController.refreshNavigation();

    const privateRoomRoutes = Array.from({ length: 8 }, (_, index) => {
      const z = -8.2 - index * 1.1;
      return {
        name: `private-registration-room-${index + 1}`,
        points: [[-5.25, z], [-5.95, z], [-6.45, z]],
        level: 'ground',
      };
    });
    const portalRoutes = Array.from({ length: 6 }, (_, index) => {
      const x = -5.25 + index * 2.1;
      return {
        name: `security-portal-${index + 1}`,
        points: [[x, -15.55], [x, -16.45], [x, -17.25], [x, -19.35]],
        level: 'ground',
      };
    });
    const upperRoomRoutes = [
      ['upper-meeting-room-1', -4],
      ['upper-meeting-room-2', -8.1],
      ['upper-quiet-suite', -12.2],
    ].map(([name, z]) => ({
      name,
      points: [[5.55, Number(z)], [6.45, Number(z)], [6.85, Number(z)]],
      level: 'upper',
    }));
    const stairPoints = [
      [4.75, -10],
      ...Array.from({ length: 26 }, (_, index) => [4.75, -10.3 - index * 0.18]),
      [4.75, -15.15],
      [5.55, -15.45],
    ];
    const stairReturnPoints = [
      [5.55, -15.45],
      [4.75, -15.15],
      ...Array.from(
        { length: 26 },
        (_, index) => [4.75, -10.3 - (25 - index) * 0.18],
      ),
      [4.75, -10],
    ];
    const routes = [
      {
        name: 'entrance-vestibule-threshold',
        points: [[0, 3.8], [0, 2.4], [0, 0.8], [0, -2]],
        level: 'ground',
      },
      {
        name: 'atrium-west-bypass',
        points: [[0, -2], [-1.55, -3.5], [-1.55, -6.5], [-1.55, -10]],
        level: 'ground',
      },
      {
        name: 'atrium-east-bypass',
        points: [[0, -2], [1.55, -3.5], [1.55, -6.5], [1.55, -10]],
        level: 'ground',
      },
      {
        name: 'self-registration-pod-aisle',
        points: [[-1.5, -2.6], [-3.65, -2.6], [-3.65, -6.6]],
        level: 'ground',
      },
      {
        name: 'staffed-registration-counter-arc',
        points: [[-1.55, -7.5], [-2.75, -8.3], [-4.45, -10.3]],
        level: 'ground',
      },
      ...privateRoomRoutes,
      {
        name: 'credential-fabrication-lab',
        points: [[0, -14.5], [-1.05, -14.5], [-1.8, -14.5], [-3.4, -14.5]],
        level: 'ground',
      },
      {
        name: 'orientation-forum',
        points: [[1.55, -3.1], [2.65, -4.4], [2.65, -7.1]],
        level: 'ground',
      },
      {
        name: 'orientation-table-zone',
        points: [[1.55, -9], [2.15, -10], [2.15, -11.2]],
        level: 'ground',
      },
      {
        name: 'living-index-west-side',
        points: [[0, -10], [-0.05, -12.4], [-0.05, -14]],
        level: 'ground',
      },
      {
        name: 'living-index-east-side',
        points: [[1.55, -10], [1.55, -12.4], [1.55, -14]],
        level: 'ground',
      },
      {
        name: 'living-index-complete-perimeter',
        points: [
          [-0.05, -11],
          [-0.05, -13.8],
          [1.55, -13.8],
          [1.55, -11],
          [-0.05, -11],
        ],
        level: 'ground',
      },
      ...portalRoutes,
      {
        name: 'transit-concourse-cross-route',
        points: [[-5, -18.7], [0, -19], [5, -18.7]],
        level: 'ground',
      },
      {
        name: 'sculptural-stair',
        points: stairPoints,
        level: 'stair',
      },
      {
        name: 'east-upper-observation-deck',
        points: [[5.55, -15.45], [5.55, -12], [5.55, -8], [5.55, -4], [5.55, 0.4]],
        level: 'upper',
      },
      ...upperRoomRoutes,
      {
        name: 'upper-rear-crossover',
        points: [[6, -16.5], [5.15, -17], [0, -17], [-5.15, -17], [-6, -16.5]],
        level: 'upper',
      },
      {
        name: 'upper-front-atrium-bridge',
        points: [[5.55, 0.4], [4.2, 0.4], [0, 0.4], [-4.2, 0.4], [-5.3, 0.4]],
        level: 'upper',
      },
      {
        name: 'complete-upper-mezzanine-loop',
        points: [
          [5.55, -15.45],
          [5.5, -10],
          [5.5, 0.4],
          [0, 0.4],
          [-5.3, 0.4],
          [-5.3, -10],
          [-5.3, -17.2],
          [0, -17.35],
          [5.55, -17.2],
          [5.55, -15.45],
        ],
        level: 'upper',
      },
      {
        name: 'west-upper-science-gallery',
        points: [[-6.9, -16], [-6.9, -14], [-6.9, -10], [-6.9, -6], [-6.9, -2.5]],
        level: 'upper',
      },
      {
        name: 'west-panoramic-lift',
        points: [[-5.9, -16], [-6.35, -17.45]],
        level: 'upper',
      },
      {
        name: 'east-panoramic-lift',
        points: [[5.9, -16], [6.35, -17.45]],
        level: 'upper',
      },
      {
        name: 'sculptural-stair-return-to-ground',
        points: stairReturnPoints,
        level: 'stair-return',
      },
      {
        name: 'return-to-exit-vestibule',
        points: [[0, -2], [0, 0.8], [0, 2.4], [0, 3.8]],
        level: 'ground',
      },
    ];

    const toWorld = ([x, z]) => facility.localToWorld(
      world.camera.position.clone().set(Number(x), 0, Number(z)),
    );
    const groundReferencePoint = toWorld([0, -2]);
    const groundReference = world.walkController.sampleGround(
      groundReferencePoint.x,
      groundReferencePoint.z,
      { spawnSearch: true },
    );
    if (groundReference === null) {
      throw new Error('Welcome Hall ground-floor reference is unavailable');
    }
    const results = routes.map((route) => {
      world.walkController.refreshNavigation();
      const startWorld = toWorld(route.points[0]);
      const startGround = route.level === 'ground'
        ? groundReference
        : world.walkController.sampleGround(
          startWorld.x,
          startWorld.z,
          { spawnSearch: true },
        );
      if (startGround === null) {
        return {
          name: route.name,
          level: route.level,
          startGround: null,
          blockedSteps: 0,
          maximumTargetError: Infinity,
          endGap: Infinity,
          grounded: false,
          groundGain: null,
          maximumGroundRise: null,
        };
      }
      world.camera.position.set(startWorld.x, startGround + 0.162, startWorld.z);
      world.walkController.groundY = startGround;
      world.walkController.grounded = true;
      const groundTrace = [startGround];
      let blockedSteps = 0;
      let maximumTargetError = 0;
      route.points.slice(1).forEach((point) => {
        const segmentTarget = toWorld(point);
        const segmentStart = world.camera.position.clone();
        const segmentDistance = Math.hypot(
          segmentTarget.x - segmentStart.x,
          segmentTarget.z - segmentStart.z,
        );
        const stepCount = Math.max(1, Math.ceil(segmentDistance / 0.035));
        for (let step = 1; step <= stepCount; step += 1) {
          const target = segmentStart.clone().lerp(segmentTarget, step / stepCount);
          const before = world.camera.position.clone();
          world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
          world.camera.position.y = world.walkController.groundY + 0.162;
          world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
          world.camera.position.y = world.walkController.groundY + 0.162;
          const moved = Math.hypot(
            world.camera.position.x - before.x,
            world.camera.position.z - before.z,
          );
          const error = Math.hypot(
            world.camera.position.x - target.x,
            world.camera.position.z - target.z,
          );
          if (moved < 0.0005) blockedSteps += 1;
          maximumTargetError = Math.max(maximumTargetError, error);
          groundTrace.push(world.walkController.groundY);
        }
      });
      world.advanceTime(32);
      const finalTarget = toWorld(route.points.at(-1));
      return {
        name: route.name,
        level: route.level,
        startGround,
        endGround: world.walkController.groundY,
        blockedSteps,
        maximumTargetError,
        endGap: Math.hypot(
          world.camera.position.x - finalTarget.x,
          world.camera.position.z - finalTarget.z,
        ),
        grounded: world.walkController.getSnapshot().grounded,
        groundGain: world.walkController.groundY - startGround,
        maximumGroundRise: Math.max(
          0,
          ...groundTrace.slice(1).map((ground, index) => ground - groundTrace[index]),
        ),
        minimumGround: Math.min(...groundTrace),
        maximumGround: Math.max(...groundTrace),
      };
    });
    return {
      routeCount: results.length,
      failedRoutes: results.filter((route) => (
        route.startGround === null
        || route.blockedSteps > 0
        || route.maximumTargetError > 0.025
        || route.endGap > 0.025
        || !route.grounded
      )).map((route) => route.name),
      results,
    };
  });
  audit.walkRoutes = walkRouteAudit;
  const stairAudit = walkRouteAudit.results.find((route) => route.name === 'sculptural-stair');
  const stairReturnAudit = walkRouteAudit.results.find(
    (route) => route.name === 'sculptural-stair-return-to-ground',
  );
  const upperAudits = walkRouteAudit.results.filter((route) => route.level === 'upper');
  if (walkRouteAudit.routeCount < 39
    || walkRouteAudit.failedRoutes.length
    || !stairAudit
    || stairAudit.groundGain < 0.48
    || stairAudit.maximumGroundRise > 0.022
    || !stairReturnAudit
    || stairReturnAudit.groundGain > -0.48
    || upperAudits.some((route) => (
      route.startGround < stairAudit.endGround - 0.03
      || route.endGround < stairAudit.endGround - 0.03
    ))) {
    throw new Error(`Welcome Registration WALK route audit failed: ${
      JSON.stringify(walkRouteAudit, null, 2)
    }`);
  }

  await page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll(
      '#inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud',
    ).forEach((element) => element.setAttribute('style', 'display:none'));
  });

  const frameInterior = async (
    fileName,
    eyeLocal,
    targetLocal,
    useGround = true,
  ) => {
    await page.evaluate(({ eye, target, groundCamera }) => {
      const world = window.labIsland;
      const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
      facility.updateMatrixWorld(true);
      const eyeWorld = facility.localToWorld(world.camera.position.clone().fromArray(eye));
      const targetWorld = facility.localToWorld(world.controls.target.clone().fromArray(target));
      if (groundCamera) {
        const ground = world.walkController.sampleGround(
          eyeWorld.x,
          eyeWorld.z,
          { spawnSearch: true },
        );
        if (ground === null) throw new Error('Interior screenshot camera has no WALK ground');
        eyeWorld.y = ground + 0.162;
        world.walkController.groundY = ground;
        world.walkController.grounded = true;
      }
      world.camera.position.copy(eyeWorld);
      world.camera.lookAt(targetWorld);
      world.advanceTime(650);
      world.renderer.render(world.scene, world.camera);
    }, { eye: eyeLocal, target: targetLocal, groundCamera: useGround });
    await page.waitForTimeout(220);
    await page.screenshot({ path: `${OUTPUT}/${fileName}` });
  };

  await frameInterior(
    '01-grand-atrium-and-island-installation.png',
    [0, 0, 2.15],
    [0, 0.34, -3.3],
  );
  await frameInterior(
    '02-registration-and-credential-services.png',
    [-1.5, 0, -4.0],
    [-5.25, 0.34, -6.4],
  );
  await frameInterior(
    '03-orientation-forum.png',
    [1.6, 0, -10.4],
    [5.25, 0.38, -7.2],
  );
  await frameInterior(
    '04-living-index-security-and-transit.png',
    [2.9, 0, -13.8],
    [0, 0.34, -16.7],
  );
  await frameInterior(
    '05-upper-observation-and-science-gallery.png',
    [6.35, 0, -4.4],
    [0, 2.3, -7.9],
  );
  await frameInterior(
    '06-credential-lab-open-door.png',
    [-3.4, 0, -14.5],
    [-1.1, 0.34, -14.5],
  );
  await frameInterior(
    '07-six-open-security-portals.png',
    [0, 0, -15.45],
    [0, 0.34, -18.8],
  );
  await frameInterior(
    '08-sculptural-stair-and-upper-landing.png',
    [5.5, 2.32, -15.5],
    [4.75, 1.35, -11.2],
    false,
  );
  await frameInterior(
    '09-furnished-upper-meeting-room.png',
    [5.8, 2.32, -7.2],
    [6.85, 2.32, -8.1],
    false,
  );
  await frameInterior(
    '10-complete-upper-mezzanine-ring.png',
    [0, 2.32, 0.35],
    [-5.45, 2.32, -8.5],
    false,
  );
  await frameInterior(
    '11-light-continuous-ceiling.png',
    [0, 0, -1.4],
    [0, 2.25, -6.2],
  );
  await frameInterior(
    '12-matched-blue-walls-and-beige-ceiling.png',
    [0, 0, -2.2],
    [7.25, 2.05, -7.4],
  );
  await frameInterior(
    '13-realistic-living-index-garden.png',
    [-0.45, 0, -10.95],
    [0.75, 0.105, -12.55],
  );
  await frameInterior(
    '14-living-index-west-labels-forward.png',
    [-0.45, 0, -12.72],
    [0.326, 0.03, -12.72],
  );
  await frameInterior(
    '15-living-index-east-labels-forward.png',
    [1.95, 0, -12.08],
    [1.174, 0.03, -12.08],
  );

  await page.evaluate(() => {
    const world = window.labIsland;
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const eye = facility.localToWorld(world.camera.position.clone().set(0, 0, 3.1));
    const target = facility.localToWorld(world.controls.target.clone().set(0, 0, -3));
    const ground = world.walkController.sampleGround(eye.x, eye.z, { spawnSearch: true });
    world.camera.position.set(eye.x, ground + 0.162, eye.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target.x, ground + 0.162, target.z);
    world.advanceTime(120);
  });
  await page.keyboard.down('s');
  await page.evaluate(() => window.labIsland.advanceTime(8_000));
  await page.keyboard.up('s');
  await page.evaluate(() => window.labIsland.advanceTime(180));

  const exitAudit = await page.evaluate(({ visibilityRoots, rootsBefore }) => {
    const world = window.labIsland;
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const interior = facility.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    const rootsAfter = Object.fromEntries(visibilityRoots.map((name) => [
      name,
      world.scene.getObjectByName(name)?.visible ?? null,
    ]));
    return {
      endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      grounded: world.walkController.getSnapshot().grounded,
      interiorHidden: interior.visible === false,
      isolationInactive: interior.userData.exteriorIsolationActive === false,
      runtimePolicies: world.getTextSnapshot().runtimePolicies,
      rootsBefore,
      rootsAfter,
      exactRootVisibilityRestored: visibilityRoots.every((name) => (
        rootsAfter[name] === rootsBefore[name]
      )),
    };
  }, { visibilityRoots: rootNames, rootsBefore: audit.rootsBefore });
  audit.exit = exitAudit;

  if (exitAudit.endLocal[2] < 4.35
    || !exitAudit.grounded
    || !exitAudit.interiorHidden
    || !exitAudit.isolationInactive
    || exitAudit.runtimePolicies.isolatedWalkInteriorActive
    || !exitAudit.exactRootVisibilityRestored) {
    throw new Error(`Welcome Registration exit/restoration failed: ${
      JSON.stringify(exitAudit, null, 2)
    }`);
  }

  if (errors.length) {
    throw new Error(`Browser errors: ${JSON.stringify(errors, null, 2)}`);
  }
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify({ audit, errors }, null, 2));
  console.log(JSON.stringify({
    output: OUTPUT,
    endLocalAfterEntry: audit.endLocal,
    isolatedExteriorObjectCount: audit.runtimePolicies.isolatedExteriorObjectCount,
    exteriorProjectionCount: audit.program.exteriorProjectionCount,
    walkableObjectCount: audit.program.walkableObjectCount,
    exitLocal: exitAudit.endLocal,
    exteriorRestored: exitAudit.exactRootVisibilityRestored,
  }, null, 2));
} catch (error) {
  await writeFile(
    `${OUTPUT}/report.json`,
    JSON.stringify({ errors, failure: error.stack ?? error.message }, null, 2),
  );
  throw error;
} finally {
  await browser.close();
}
