import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.CEREBRUM_OUTPUT ?? 'output/cerebrum-library';
const CAPTURE_SCREENSHOTS = process.env.CEREBRUM_CAPTURE !== '0';
const FAST_DIAGNOSTIC = process.env.CEREBRUM_FAST === '1';
const BUILDING_ID = 'academic-building-ashcroft-grand-library';
const ROOT_NAME = 'CEREBRUM_LIBRARY__PROCEDURAL_INTERIOR';

await mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH
    ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({
  viewport: FAST_DIAGNOSTIC ? { width: 960, height: 640 } : { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(90_000);
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(
    (id) => Boolean(window.labIsland?.getDefinition(id)),
    BUILDING_ID,
    { timeout: 180_000 },
  );
  // Cerebrum is now a disposable streamed package rather than boot content.
  // An architectural-orbit request is the explicit immediate-load path.
  await page.evaluate(() => {
    if (!window.labIsland.focusCerebrumLibrary()) {
      throw new Error('Cerebrum Externum could not be mounted for the focused suite');
    }
  });
  await page.waitForFunction(
    ({ id, rootName }) => Boolean(
      window.labIsland?.getDefinition(id)
      && window.labIsland.objectGroups.get(id)?.getObjectByName(rootName),
    ),
    { id: BUILDING_ID, rootName: ROOT_NAME },
    { timeout: 180_000 },
  );
  await page.waitForTimeout(1_500);

  const structuralAudit = await page.evaluate(({ id, rootName }) => {
    const world = window.labIsland;
    const building = world.objectGroups.get(id);
    const root = building?.getObjectByName(rootName);
    if (!building || !root) throw new Error('Cerebrum Externum authored root is missing');
    const snapshot = world.getTextSnapshot().academicDistrict?.cerebrumExternum;
    if (!snapshot) throw new Error('Cerebrum Externum text snapshot is missing');

    const requiredNamedFeatures = [
      'CEREBRUM__ROOM__ENTRANCE_VESTIBULE',
      'CEREBRUM__ROOM__GRAND_STAIR_HALL',
      'CEREBRUM__ROOM__MAIN_READING_ROOM',
      'CEREBRUM__ROOM__LABYRINTHINE_STACKS',
      'CEREBRUM__ROOM__CARD_CATALOGUE',
      'CEREBRUM__ROOM__LIBRARIANS_OFFICE',
      'CEREBRUM_OCCULTUM__RESTRICTED_ARCHIVE',
      'CEREBRUM_OCCULTUM__RARE_BOOK_ROOM',
      'CEREBRUM__PORTERS_DESK',
      'CEREBRUM__UNIVERSITY_SEAL_FLOOR_INLAY',
      'CEREBRUM__VESTIBULE_DIRECTIONAL_SIGN',
      'CEREBRUM__WET_UMBRELLA_RACK',
      'CEREBRUM__LECTURES_AND_READING_GROUP_NOTICE_BOARD',
      'CEREBRUM__REFERENCE_GLOBE',
      'CEREBRUM_OCCULTUM__OPEN_FACSIMILE_LEFT_PAGE',
      'CEREBRUM__OFFICE_STONE_FIREPLACE',
    ];
    const missingFeatures = requiredNamedFeatures.filter((name) => !root.getObjectByName(name));
    const navigationGroups = [
      root.getObjectByName('CEREBRUM__GROUND_NAVIGATION_SURFACES'),
      root.getObjectByName('CEREBRUM__UPPER_GALLERY_NAVIGATION_SURFACES'),
      root.getObjectByName('CEREBRUM_OCCULTUM__NAVIGATION_SURFACES'),
    ];
    const pointLights = [];
    root.traverse((object) => {
      if (object.isPointLight) pointLights.push({ visible: object.visible, castShadow: object.castShadow });
    });

    return {
      definitionName: world.getDefinition(id)?.name,
      definitionDescription: world.getDefinition(id)?.description,
      inscription: world.getDefinition(id)?.inscription,
      missingFeatures,
      rooms: snapshot.rooms.map((room) => room.id),
      counts: snapshot.counts,
      navigation: snapshot.navigation,
      performance: snapshot.performance,
      navGroupsAllVisible: navigationGroups.every((group) => group?.visible),
      navGroupCount: navigationGroups.filter(Boolean).length,
      legacyFloorDisabled: building.children
        .filter((child) => child.name.endsWith('__WALKABLE_FLOOR'))
        .every((child) => child.visible === false && child.userData.walkable === false),
      pointLightCount: pointLights.length,
      shadowLightCount: pointLights.filter((light) => light.castShadow).length,
      mutedByDefault: snapshot.state.muted,
      roomAtOverview: snapshot.state.navigationLevel,
    };
  }, { id: BUILDING_ID, rootName: ROOT_NAME });

  if (structuralAudit.definitionName !== 'Cerebrum Externum'
    || !structuralAudit.definitionDescription.includes('Cerebrum Occultum')
    || structuralAudit.inscription !== 'CEREBRUM EXTERNUM · FOUNDED MDXII'
    || structuralAudit.rooms.length !== 8
    || structuralAudit.missingFeatures.length
    || structuralAudit.navGroupCount !== 3
    || !structuralAudit.navGroupsAllVisible
    || !structuralAudit.legacyFloorDisabled
    || structuralAudit.counts.books < 500
    || structuralAudit.counts.shelves < 80
    || structuralAudit.counts.lamps < 20
    || structuralAudit.performance.instancedMeshes < 10
    || structuralAudit.navigation.maximumStepRiseWorldUnits > structuralAudit.navigation.controllerStepLimitWorldUnits
    || structuralAudit.shadowLightCount > 2
    || !structuralAudit.mutedByDefault
    || structuralAudit.roomAtOverview !== 'ground') {
    throw new Error(`Structural audit failed: ${JSON.stringify(structuralAudit, null, 2)}`);
  }

  const doorBarrierAudit = await page.evaluate(({ id, rootName }) => {
    const root = window.labIsland.objectGroups.get(id)?.getObjectByName(rootName);
    const guide = root?.getObjectByName('CEREBRUM__PRECISE_DYNAMIC_COLLISION_GUIDE');
    if (!root || !guide) throw new Error('Cerebrum collision guide is missing');
    const segments = guide.userData.navBarrierSegments ?? [];
    const inspect = (doorId) => {
      const pivot = root.getObjectByName(`CEREBRUM__DOOR_PIVOT__${doorId.toUpperCase()}`);
      const leaf = pivot?.getObjectByName(`CEREBRUM__DOOR_LEAF__${doorId.toUpperCase()}`);
      if (!pivot || !leaf) return null;
      leaf.geometry.computeBoundingBox();
      const expectedHeight = leaf.geometry.boundingBox.max.y - leaf.geometry.boundingBox.min.y;
      const barrier = segments.find((segment) => (
        Math.hypot(segment.start[0] - pivot.position.x, segment.start[2] - pivot.position.z) < 0.001
        && Math.abs(segment.start[1] - pivot.position.y) < 0.001
        && Math.abs(segment.end[1] - segment.start[1]) > expectedHeight * 0.8
      ));
      return {
        expectedHeight,
        blockerHeight: barrier ? Math.abs(barrier.end[1] - barrier.start[1]) : 0,
      };
    };
    return {
      occultumGate: inspect('occultum-iron-gate'),
      rareBookDoor: inspect('rare-book-inner-door'),
    };
  }, { id: BUILDING_ID, rootName: ROOT_NAME });
  if (!doorBarrierAudit.occultumGate
    || !doorBarrierAudit.rareBookDoor
    || doorBarrierAudit.occultumGate.blockerHeight < doorBarrierAudit.occultumGate.expectedHeight * 0.95
    || doorBarrierAudit.rareBookDoor.blockerHeight < doorBarrierAudit.rareBookDoor.expectedHeight * 0.95) {
    throw new Error(`Closed-door barrier audit failed: ${JSON.stringify(doorBarrierAudit, null, 2)}`);
  }

  await page.evaluate(({ id }) => {
    const world = window.labIsland;
    world.select(id, 'system');
  }, { id: BUILDING_ID });
  const orbitUiDispatchMs = await page.evaluate(() => {
    const button = document.querySelector('#cerebrum-orbit-button');
    if (!(button instanceof HTMLButtonElement)) throw new Error('Orbit interior button is missing');
    const started = performance.now();
    button.click();
    return performance.now() - started;
  });
  await page.waitForTimeout(1_200);
  if (CAPTURE_SCREENSHOTS) await page.screenshot({ path: `${OUTPUT}/architectural-orbit.png`, fullPage: true, timeout: 120_000 });

  const orbitAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const snapshot = world.getTextSnapshot();
    const cutawayPattern = /MASONRY_WALL|STEEP_SLATE_GABLE|LIMESTONE_STRING_COURSE|OPEN_STONE_DOOR_ARCH|OPEN_OAK_DOOR|LEADED_AMBER_WINDOWS|GOTHIC_BUTTRESSES|BRICK_CHIMNEYS|COLLEGIATE_TOWER|TOWER_SLATE_CAP|ASHCROFT_REFERENCE_GOTHIC_FACADE/;
    const cutawayHiddenTargets = world.objectGroups
      .get('academic-building-ashcroft-grand-library')
      ?.children.filter((object) => cutawayPattern.test(object.name))
      .map((object) => object.visible) ?? [];
    return {
      active: snapshot.academicDistrict?.cerebrumExternum?.architecturalOrbitActive,
      cutaway: snapshot.academicDistrict?.cerebrumExternum?.state.cutawayVisible,
      camera: snapshot.camera,
      allCutawayTargetsHidden: cutawayHiddenTargets.length > 0 && cutawayHiddenTargets.every((visible) => !visible),
      persistentSoundVisible: !document.querySelector('#cerebrum-sound-controls')?.hidden,
    };
  });
  if (!orbitAudit.active || !orbitAudit.cutaway || !orbitAudit.allCutawayTargetsHidden) {
    throw new Error(`Architectural orbit audit failed: ${JSON.stringify(orbitAudit, null, 2)}`);
  }

  // Enter through the real UI so the walkthrough HUD, mode buttons, pointer-lock
  // affordances, and persistent library controls are exercised together.
  const walkUiDispatchMs = await page.evaluate(() => {
    const button = document.querySelector('#cerebrum-walk-button');
    if (!(button instanceof HTMLButtonElement)) throw new Error('Explore interior button is missing');
    const started = performance.now();
    button.click();
    return performance.now() - started;
  });
  await page.waitForTimeout(250);
  await page.evaluate(({ id, rootName }) => {
    const world = window.labIsland;
    const root = world.objectGroups.get(id)?.getObjectByName(rootName);
    if (!root) throw new Error('Cerebrum root unavailable for first-person framing');
    const spawn = root.localToWorld(world.camera.position.clone().set(-2.6, 0.04, 0.45));
    const target = root.localToWorld(world.camera.position.clone().set(-2.2, 0.27, -2.15));
    world.walkController.refreshNavigation();
    world.walkController.enter(spawn, target.clone().sub(spawn).normalize(), spawn);
    world.advanceTime(160);
  }, { id: BUILDING_ID, rootName: ROOT_NAME });
  await page.waitForTimeout(350);
  if (CAPTURE_SCREENSHOTS) await page.screenshot({ path: `${OUTPUT}/main-reading-room-walk.png`, fullPage: true, timeout: 120_000 });

  const readingAudit = await page.evaluate(() => {
    const snapshot = window.labIsland.getTextSnapshot();
    return {
      inside: snapshot.academicDistrict?.cerebrumExternum?.inside,
      roomId: snapshot.walk.roomId,
      surface: snapshot.walk.surfaceKind,
      grounded: snapshot.walk.grounded,
      soundControlsVisible: !document.querySelector('#cerebrum-sound-controls')?.hidden,
    };
  });
  if (!readingAudit.inside || readingAudit.roomId !== 'main-reading-room'
    || !readingAudit.grounded || !readingAudit.soundControlsVisible) {
    throw new Error(`Reading-room WALK audit failed: ${JSON.stringify(readingAudit, null, 2)}`);
  }

  const eInteractionBefore = await page.evaluate(() => (
    window.labIsland.getCerebrumLibraryState()?.lamps['reading-lamp-1']
  ));
  await page.evaluate(({ id, rootName }) => {
    const world = window.labIsland;
    const root = world.objectGroups.get(id)?.getObjectByName(rootName);
    const proxy = root?.getObjectByName('CEREBRUM__HOTSPOT__READING-LAMP-1');
    if (!root || !proxy) throw new Error('Reading lamp hotspot proxy unavailable');
    const target = proxy.getWorldPosition(world.camera.position.clone());
    const localTarget = root.worldToLocal(target.clone());
    // Lamp 2 sits on the positive-Z half of this same table. Approach lamp 1
    // from the opposite side so the real ray correctly resolves the requested
    // fixture rather than the physically nearer neighbour.
    const eye = root.localToWorld(world.camera.position.clone().set(localTarget.x, localTarget.y + 0.03, localTarget.z - 0.34));
    world.camera.position.copy(eye);
    world.camera.lookAt(target);
    world.camera.updateMatrixWorld(true);
    world.walkController.groundY = world.camera.position.y - 0.162;
    world.walkController.grounded = true;
  }, { id: BUILDING_ID, rootName: ROOT_NAME });
  const eRayDiagnostic = await page.evaluate(() => {
    const world = window.labIsland;
    world.raycaster.setFromCamera({ x: 0, y: 0 }, world.camera);
    world.raycaster.far = 0.45;
    return world.raycaster.intersectObjects(
      [world.architectureRoot, world.landscapeRoot, world.importedRoot, world.interiorsRoot],
      true,
    ).slice(0, 16).map((intersection) => {
      let cursor = intersection.object;
      let hotspot = null;
      while (cursor) {
        if (cursor.userData?.cerebrumHotspot) {
          hotspot = cursor.userData.cerebrumHotspot.id;
          break;
        }
        cursor = cursor.parent;
      }
      return {
        name: intersection.object.name,
        distance: Number(intersection.distance.toFixed(4)),
        hotspot,
      };
    });
  });
  await page.keyboard.press('e');
  await page.locator('#walk-interaction-menu:not([hidden])').waitFor({ timeout: 5_000 });
  const eInteractionHotspot = await page.evaluate(() => window.labIsland.getActiveCerebrumLibraryHotspot()?.id ?? null);
  if (eInteractionHotspot !== 'reading-lamp-1') {
    throw new Error(`Real E ray selected ${JSON.stringify(eInteractionHotspot)} instead of reading-lamp-1: ${JSON.stringify(eRayDiagnostic)}`);
  }
  await page.locator('#interaction-menu-buttons .interaction-menu-btn').first().click();
  const eInteractionAfter = await page.evaluate(() => (
    window.labIsland.getCerebrumLibraryState()?.lamps['reading-lamp-1']
  ));
  if (eInteractionBefore === eInteractionAfter) throw new Error('Real E interaction did not toggle reading-lamp-1');

  const interactionAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const locked = world.performCerebrumLibraryInteraction('rare-book-inner-door');
    const drawer = world.performCerebrumLibraryInteraction('catalogue-drawer-r7');
    const ladder = world.performCerebrumLibraryInteraction('reading-room-rolling-ladder');
    const book = world.performCerebrumLibraryInteraction('book-memory-and-measure');
    const catalogue = world.performCerebrumLibraryInteraction('card-catalogue-search');
    const opened = world.performCerebrumLibraryInteraction('rare-book-inner-door');
    const occultumGate = world.performCerebrumLibraryInteraction('occultum-iron-gate');
    world.setGraphicsQuality('high');
    world.advanceTime(80);
    const high = world.getTextSnapshot().academicDistrict.cerebrumExternum;
    world.setGraphicsQuality('low');
    world.advanceTime(80);
    const low = world.getTextSnapshot().academicDistrict.cerebrumExternum;
    world.setGraphicsQuality('medium');
    return {
      lockedMessage: locked.message,
      drawerOpened: drawer.state.drawers['catalogue-drawer-r7'],
      ladderStop: ladder.state.ladderStop,
      bookTitle: book.titleCard?.title,
      catalogueLocation: catalogue.state.rareBookLocation,
      catalogueUnlocked: catalogue.state.rareBookDoorUnlocked,
      innerDoorOpened: opened.state.doors['rare-book-inner-door'],
      occultumGateOpened: occultumGate.state.doors['occultum-iron-gate'],
      highShadowLights: high.counts.shadowCastingLights,
      highInstances: high.performance.visibleInstances,
      lowShadowLights: low.counts.shadowCastingLights,
      lowInstances: low.performance.visibleInstances,
    };
  });
  if (!interactionAudit.lockedMessage.includes('locked')
    || !interactionAudit.drawerOpened
    || interactionAudit.ladderStop < 1
    || interactionAudit.bookTitle !== 'Memory and Measure'
    || !interactionAudit.catalogueLocation?.includes('Cerebrum Occultum')
    || !interactionAudit.catalogueUnlocked
    || !interactionAudit.innerDoorOpened
    || !interactionAudit.occultumGateOpened
    || interactionAudit.highShadowLights > 2
    || interactionAudit.lowShadowLights !== 0
    || interactionAudit.lowInstances >= interactionAudit.highInstances) {
    throw new Error(`Interaction/quality audit failed: ${JSON.stringify(interactionAudit, null, 2)}`);
  }

  const navigationAudit = await page.evaluate(({ id, rootName }) => {
    const world = window.labIsland;
    const root = world.objectGroups.get(id)?.getObjectByName(rootName);
    if (!root) throw new Error('Cerebrum root unavailable for navigation audit');
    const controller = world.walkController;
    world.setMode('walk');
    controller.refreshNavigation();

    const treadTop = (step) => {
      step.geometry.computeBoundingBox();
      return step.localToWorld(world.camera.position.clone().set(0, step.geometry.boundingBox.max.y, 0));
    };
    const collect = (pattern) => {
      const result = [];
      root.traverse((object) => {
        if (object.isMesh && pattern.test(object.name)) result.push(treadTop(object));
      });
      return result.sort((a, b) => a.y - b.y);
    };
    const traverseTargets = (targets) => {
      const start = targets[0];
      world.camera.position.set(start.x, start.y + 0.162, start.z);
      controller.groundY = start.y;
      controller.grounded = true;
      controller.velocityY = 0;
      let completed = 0;
      let maximumRemaining = 0;
      let ungroundedFrames = 0;
      for (const target of targets.slice(1)) {
        for (let step = 0; step < 14; step += 1) {
          const remaining = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
          if (remaining < 0.045) break;
          world.camera.lookAt(target.x, world.camera.position.y, target.z);
          controller.setMoveIntent(0, 1, true);
          controller.update(0.05);
          if (!controller.getSnapshot().grounded) ungroundedFrames += 1;
        }
        const remaining = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
        maximumRemaining = Math.max(maximumRemaining, remaining);
        if (remaining < 0.07) completed += 1;
      }
      controller.setMoveIntent(0, 0, false);
      return {
        completed,
        expected: targets.length - 1,
        maximumRemainingMetres: Number((maximumRemaining * 10).toFixed(3)),
        ungroundedFrames,
        snapshot: controller.getSnapshot(),
      };
    };

    const grand = collect(/CEREBRUM__GRAND_OAK_STAIR_TREAD_/);
    const occultum = collect(/CEREBRUM_OCCULTUM__DESCENDING_STONE_STEP_/);
    const grandUp = traverseTargets(grand);
    const grandDown = traverseTargets([...grand].reverse());
    const occultumUp = traverseTargets(occultum);
    const occultumDown = traverseTargets([...occultum].reverse());
    return { grandTreadCount: grand.length, occultumTreadCount: occultum.length, grandUp, grandDown, occultumUp, occultumDown };
  }, { id: BUILDING_ID, rootName: ROOT_NAME });

  for (const route of ['grandUp', 'grandDown', 'occultumUp', 'occultumDown']) {
    const result = navigationAudit[route];
    if (result.completed !== result.expected || result.ungroundedFrames > 0 || !result.snapshot.grounded) {
      throw new Error(`${route} navigation failed: ${JSON.stringify(result, null, 2)}`);
    }
  }

  await page.evaluate(({ id, rootName }) => {
    const world = window.labIsland;
    const root = world.objectGroups.get(id)?.getObjectByName(rootName);
    if (!root) return;
    // Stand at normal eye height in the first clear compact-shelving aisle and
    // look along it. The former checkpoint sat inside a shelf bay at knee
    // height, which made the proof image look clipped even though traversal
    // and collision were correct.
    const point = root.localToWorld(world.camera.position.clone().set(0.42, -0.558, -2.84));
    const target = root.localToWorld(world.camera.position.clone().set(0.42, -0.56, 0.72));
    world.camera.position.copy(point);
    world.camera.lookAt(target);
    world.walkController.groundY = point.y - 0.162;
    world.walkController.grounded = true;
    world.advanceTime(160);
  }, { id: BUILDING_ID, rootName: ROOT_NAME });
  await page.waitForTimeout(300);
  if (CAPTURE_SCREENSHOTS) await page.screenshot({ path: `${OUTPUT}/cerebrum-occultum-walk.png`, fullPage: true, timeout: 120_000 });

  await page.locator('#cerebrum-persistent-quiet').click();
  const quietAudit = await page.evaluate(() => ({
    state: window.labIsland.getCerebrumLibraryState()?.quietMode,
    bodyClass: document.body.classList.contains('library-quiet-mode'),
    controlsVisible: !document.querySelector('#cerebrum-sound-controls')?.hidden,
    ambience: window.labIsland.getTextSnapshot().academicDistrict.cerebrumExternum.ambience,
  }));
  if (!quietAudit.state || !quietAudit.bodyClass || !quietAudit.controlsVisible || !quietAudit.ambience.quiet) {
    throw new Error(`Quiet-mode audit failed: ${JSON.stringify(quietAudit, null, 2)}`);
  }
  await page.keyboard.press('q');
  await page.waitForTimeout(100);
  const quietExited = await page.evaluate(() => !document.body.classList.contains('library-quiet-mode')
    && window.labIsland.getCerebrumLibraryState()?.quietMode === false);
  if (!quietExited) throw new Error('Q did not exit quiet mode');

  const persistenceAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const expected = world.getCerebrumLibraryState();
    world.saveProjectToLocalStorage();
    world.performCerebrumLibraryInteraction('reading-lamp-2');
    const loaded = world.loadProjectFromLocalStorage();
    const restored = world.getCerebrumLibraryState();
    return {
      loaded,
      expectedLamp: expected.lamps['reading-lamp-2'],
      restoredLamp: restored.lamps['reading-lamp-2'],
      expectedDrawer: expected.drawers['catalogue-drawer-r7'],
      restoredDrawer: restored.drawers['catalogue-drawer-r7'],
      expectedLadder: expected.ladderStop,
      restoredLadder: restored.ladderStop,
      expectedLocation: expected.rareBookLocation,
      restoredLocation: restored.rareBookLocation,
      restoredMuted: restored.muted,
    };
  });
  if (!persistenceAudit.loaded
    || persistenceAudit.expectedLamp !== persistenceAudit.restoredLamp
    || persistenceAudit.expectedDrawer !== persistenceAudit.restoredDrawer
    || persistenceAudit.expectedLadder !== persistenceAudit.restoredLadder
    || persistenceAudit.expectedLocation !== persistenceAudit.restoredLocation
    || !persistenceAudit.restoredMuted) {
    throw new Error(`Persistence audit failed: ${JSON.stringify(persistenceAudit, null, 2)}`);
  }

  if (consoleErrors.length) throw new Error(`Browser errors: ${JSON.stringify(consoleErrors, null, 2)}`);

  const report = {
    structuralAudit,
    orbitAudit,
    uiDispatchMs: { orbit: orbitUiDispatchMs, walk: walkUiDispatchMs },
    readingAudit,
    realEInteraction: { hotspot: eInteractionHotspot, ray: eRayDiagnostic, before: eInteractionBefore, after: eInteractionAfter },
    interactionAudit,
    navigationAudit,
    quietAudit,
    persistenceAudit,
    consoleErrors,
  };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
