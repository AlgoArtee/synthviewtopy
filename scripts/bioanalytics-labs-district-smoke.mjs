import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.BIOANALYTICS_OUTPUT ?? 'output/bioanalytics-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.advanceTime(300));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__bioanalytics-lab');
    const definition = world.definitions.get('bioanalytics-lab');
    if (!district || !definition?.sector) throw new Error('Bioanalytics Labs District is unavailable');
    district.updateMatrixWorld(true);
    world.select('bioanalytics-lab', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(15),
      mode: 'explore',
      selectedPackageId: 'bioanalytics-lab',
      interiorPackageId: null,
      force: true,
    });

    const facilities = [];
    const names = [];
    const materials = new Set();
    const animated = [];
    const scaledMeshParentDetails = [];
    let meshCount = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      if (object.userData.animate) animated.push({ name: object.name, animate: object.userData.animate });
      if (!object.isMesh) return;
      meshCount += 1;
      if (object.parent?.isMesh && (
        Math.abs(object.parent.scale.x - 1) > 0.001
        || Math.abs(object.parent.scale.y - 1) > 0.001
        || Math.abs(object.parent.scale.z - 1) > 0.001
      )) scaledMeshParentDetails.push({ name: object.name, parent: object.parent.name });
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materials.add(material.name));
    });

    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const sector = definition.sector;
    const boundaryViolations = [];
    const facilityBounds = [];
    facilities.forEach((facility) => {
      const minWorld = world.camera.position.clone().set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      const maxWorld = world.camera.position.clone().set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
      facility.updateMatrixWorld(true);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
          minWorld.min(point); maxWorld.max(point);
          const radius = Math.hypot(point.x, point.z);
          const angle = normalizeNear(Math.atan2(point.z, point.x), sector.centerAngle);
          if (radius < sector.innerRadius - 0.3 || radius > sector.outerRadius + 0.3 || angle < sector.startAngle - 0.014 || angle > sector.endAngle + 0.014) {
            boundaryViolations.push({ code: facility.userData.buildingCode, name: object.name, radius, angle });
          }
        }
      });
      facilityBounds.push({ code: facility.userData.buildingCode, min: minWorld.toArray(), max: maxWorld.toArray() });
    });

    const overlapPairs = [];
    for (let first = 0; first < facilityBounds.length; first += 1) for (let second = first + 1; second < facilityBounds.length; second += 1) {
      const a = facilityBounds[first]; const b = facilityBounds[second];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 1.0 && overlapZ > 1.0) overlapPairs.push({ codes: [a.code, b.code], overlapX, overlapZ });
    }

    const routeNames = [
      'BIOANALYTICS__ANALYTICAL_CRESCENT',
      'BIOANALYTICS__CALIBRATION_SPINE',
      ...Array.from({ length: 4 }, (_, index) => `BIOANALYTICS__CONTROLLED_INTERFACE_LINK_${index + 1}`),
      ...Array.from({ length: 15 }, (_, index) => `BIOANALYTICS__BUILDING_APPROACH_BA${index + 1}`),
    ];
    const routes = routeNames.map((name) => district.getObjectByName(name));
    const walkRoute = routes[0];
    if (!walkRoute?.isMesh) throw new Error('Analytical Crescent is missing');
    const positions = walkRoute.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair);
    const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation();
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    const countPrefix = (prefix) => names.filter((name) => name.startsWith(prefix)).length;
    const legacyGenericNames = [
      'Automated Bioanalysis Hall',
      'Instrumentation Laboratory',
      'Secure Sample Receiving House',
      'Method Development Pavilion',
    ].filter((legacy) => names.some((name) => name.includes(legacy.toUpperCase().replace(/[^A-Z0-9]+/g, '_'))));
    const unexpectedTopLevelNames = district.children
      .filter((child) => !child.name.startsWith('BIOANALYTICS__'))
      .map((child) => child.name || '<unnamed>');
    const proxy = world.scene.getObjectByName('STREAMING_HLOD__BIOANALYTICS_LAB');
    const effectivelyVisible = (object) => {
      let cursor = object;
      while (cursor) {
        if (!cursor.visible) return false;
        cursor = cursor.parent;
      }
      return Boolean(object);
    };
    return {
      program: district.userData.bioanalyticsLabsDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((aCode, bCode) => Number(aCode.slice(2)) - Number(bCode.slice(2))),
      meshCount,
      uniqueNames: new Set(names).size,
      materialNames: [...materials].sort(),
      animated,
      scaledMeshParentDetails,
      boundaryViolations,
      overlapPairs,
      facilityBounds,
      legacyGenericNames,
      topLevelChildCount: district.children.length,
      unexpectedTopLevelNames,
      visibility: {
        detailEffective: effectivelyVisible(district),
        proxyEffective: effectivelyVisible(proxy),
        simultaneousDetailAndProxy: effectivelyVisible(district) && effectivelyVisible(proxy),
      },
      missingRoots: Array.from({ length: 15 }, (_, index) => {
        const code = `BA${index + 1}`;
        return facilities.find((facility) => facility.userData.buildingCode === code)?.name ?? null;
      }).filter((name) => !name),
      signatureCounts: {
        opticalWedges: countPrefix('BIOANALYTICS__BA1__OPTICAL_WEDGE_'),
        dichroicFins: countPrefix('BIOANALYTICS__BA1__DICHROIC_FIN_'),
        analyserVaults: countPrefix('BIOANALYTICS__BA2__ANALYSER_VAULT_'),
        tissueSections: countPrefix('BIOANALYTICS__BA3__TISSUE_SECTION_'),
        helixSegments: countPrefix('BIOANALYTICS__BA4__HELICAL_RIBBON_SEGMENT_'),
        landingPadDiscs: countPrefix('BIOANALYTICS__BA5__LANDING_PAD_DISC_'),
        separationColumns: countPrefix('BIOANALYTICS__BA6__SEPARATION_COLUMN_'),
        primaryBranches: countPrefix('BIOANALYTICS__BA7__PRIMARY_BRANCH_'),
        fragmentSpiralSegments: countPrefix('BIOANALYTICS__BA8__BROKEN_FRAGMENT_BAND_'),
        vesiclePods: countPrefix('BIOANALYTICS__BA9__VESICLE_POD_'),
        constrictionTops: names.filter((name) => /^BIOANALYTICS__BA10__CONSTRICTION_FRAME_\d+_TOP$/.test(name)).length,
        timeFramePlates: countPrefix('BIOANALYTICS__BA11__TIME_FRAME_PLATE_'),
        cryoAccessBridges: countPrefix('BIOANALYTICS__BA12__RESTRICTED_ACCESS_BRIDGE_'),
        opticalTrapTowers: countPrefix('BIOANALYTICS__BA13__OPTICAL_TRAP_TOWER_'),
        assayBlocks: countPrefix('BIOANALYTICS__BA14__PLUG_IN_ASSAY_BLOCK_'),
        metronGridLines: countPrefix('BIOANALYTICS__BA15__FACADE_VERTICAL_GRID_') + countPrefix('BIOANALYTICS__BA15__FACADE_HORIZONTAL_GRID_'),
      },
      routeAudit: routes.map((route) => ({ name: route?.name ?? null, walkable: route?.userData.walkable === true, restricted: route?.userData.restrictedServiceRoute === true, resident: Boolean(route?.parent) })),
      roadGround: world.walkController.sampleGround(roadPoint.x, roadPoint.z),
      roadPoint: roadPoint.toArray(),
      textBioanalytics: textState.bioanalyticsLabsDistrict,
      planning: textState.planning,
      revision: textState.masterplan?.specializedDistrictLayoutRevision,
      streaming: streaming.packages.find((entry) => entry.id === 'bioanalytics-lab') ?? null,
    };
  });

  await writeFile(`${OUTPUT}/audit-baseline.json`, `${JSON.stringify({ audit, errors }, null, 2)}\n`);
  if (audit.facilityCount !== 15 || audit.codes.join(',') !== Array.from({ length: 15 }, (_, index) => `BA${index + 1}`).join(',')) throw new Error(`Bioanalytics facility program is incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Bioanalytics roots: ${audit.missingRoots.join(', ')}`);
  if (audit.legacyGenericNames.length) throw new Error(`Legacy generic Bioanalytics buildings remain: ${audit.legacyGenericNames.join(', ')}`);
  if (audit.topLevelChildCount !== 17 || audit.unexpectedTopLevelNames.length) throw new Error(`Generic Bioanalytics top-level placeholders remain: ${JSON.stringify({ count: audit.topLevelChildCount, names: audit.unexpectedTopLevelNames })}`);
  if (!audit.visibility.detailEffective || audit.visibility.proxyEffective || audit.visibility.simultaneousDetailAndProxy) throw new Error(`Bioanalytics detail/proxy visibility is invalid: ${JSON.stringify(audit.visibility)}`);
  if (audit.meshCount < 1500) throw new Error(`Bioanalytics exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.97) throw new Error('Bioanalytics exterior names are not sufficiently deterministic');
  if (audit.scaledMeshParentDetails.length) throw new Error(`Bioanalytics detail inherited a scaled mesh transform: ${JSON.stringify(audit.scaledMeshParentDetails)}`);
  if (audit.boundaryViolations.length) throw new Error(`Bioanalytics facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 18))}`);
  if (audit.overlapPairs.length) throw new Error(`Bioanalytics facility envelopes overlap: ${JSON.stringify(audit.overlapPairs)}`);
  if (audit.animated.length < 90) throw new Error(`Bioanalytics responsive systems are incomplete: ${audit.animated.length}`);
  if (Object.values(audit.signatureCounts).join(',') !== '3,24,2,8,56,216,5,6,81,9,3,8,2,2,12,17') throw new Error(`Bioanalytics signatures are incomplete: ${JSON.stringify(audit.signatureCounts)}`);
  if (audit.routeAudit.some((route, index) => !route.resident || (index !== 1 && !route.walkable))) throw new Error(`Bioanalytics circulation is incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (!audit.routeAudit[1].restricted || audit.routeAudit[1].walkable) throw new Error('Calibration Spine is not marked as a restricted service route');
  if (audit.roadGround === null) throw new Error('Analytical Crescent is not WALK-grounded');
  if (audit.textBioanalytics?.buildingCount !== 15 || audit.textBioanalytics?.identity !== 'Bioanalytics Labs District') throw new Error('Bioanalytics metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 15 || audit.population?.measurementEngineeringDistrict !== true) throw new Error('Bioanalytics population metadata is incomplete');
  if (audit.streaming?.detailResident !== true) throw new Error('Bioanalytics detail package did not remain resident for inspection');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  if (audit.revision !== 5) throw new Error(`Specialized layout revision is stale: ${audit.revision}`);
  for (const material of [
    'Bioanalytics vibration-isolated black basalt',
    'Bioanalytics white technical ceramic',
    'Bioanalytics pale titanium',
    'Bioanalytics smoked electrochromic glass',
    'Bioanalytics dichroic cyan optical coating',
    'Vesicula translucent laminated membrane',
    'Fragmenta clinical dark ruby glass',
    'Analytical Crescent pale calibrated paving',
  ]) if (!audit.materialNames.includes(material)) throw new Error(`Missing Bioanalytics material: ${material}`);

  const staleProxyRepair = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__bioanalytics-lab');
    const proxy = world.scene.getObjectByName('STREAMING_HLOD__BIOANALYTICS_LAB');
    const effectivelyVisible = (object) => {
      let cursor = object;
      while (cursor) {
        if (!cursor.visible) return false;
        cursor = cursor.parent;
      }
      return Boolean(object);
    };
    proxy.visible = true;
    const recreatedOverlap = effectivelyVisible(district) && effectivelyVisible(proxy);
    window.advanceTime(50);
    return {
      recreatedOverlap,
      detailEffective: effectivelyVisible(district),
      proxyEffective: effectivelyVisible(proxy),
      streaming: world.worldStreaming.getSnapshot().packages.find((entry) => entry.id === 'bioanalytics-lab') ?? null,
    };
  });
  if (!staleProxyRepair.recreatedOverlap || !staleProxyRepair.detailEffective || staleProxyRepair.proxyEffective || staleProxyRepair.streaming?.proxyVisible) {
    throw new Error(`Bioanalytics stale proxy visibility was not repaired: ${JSON.stringify(staleProxyRepair)}`);
  }

  await page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none'));
  });

  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ time, plan }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__bioanalytics-lab');
      const min = world.camera.position.clone().set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      const max = world.camera.position.clone().set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
      district.updateMatrixWorld(true);
      district.traverse((object) => {
        if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return;
        object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point);
        }
      });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min);
      world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.clearSelection('system'); world.cameraTween = null;
      if (plan) {
        const verticalExtent = Math.max(size.z, size.x / world.camera.aspect); const altitude = verticalExtent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360);
        world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 90), center.z + 0.001); world.controls.target.set(center.x, 0, center.z);
      } else {
        world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.58, center.y + Math.max(size.x, size.z) * 0.45, center.z + size.z * 0.7); world.controls.target.copy(center).setY(4.2);
      }
      world.controls.update(); world.advanceTime(1_200);
    }, { time, plan });
    await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon');
  await page.screenshot({ path: `${OUTPUT}/bioanalytics-overview.png` });
  await prepareDistrictView('noon', true);
  await page.screenshot({ path: `${OUTPUT}/bioanalytics-plan.png` });
  await prepareDistrictView('night');
  await page.screenshot({ path: `${OUTPUT}/bioanalytics-night.png` });

  const facilityViews = Object.fromEntries(Array.from({ length: 15 }, (_, index) => {
    const code = `BA${index + 1}`;
    const tall = ['BA4', 'BA8', 'BA12'].includes(code);
    const wide = ['BA2', 'BA10', 'BA13', 'BA14'].includes(code);
    return [code, { camera: wide ? [18, 10, 18] : tall ? [13, 14, 17] : [14, 10, 15], target: [0, tall ? 5.2 : 2.8, 0] }];
  }));
  for (const [code, view] of Object.entries(facilityViews)) {
    await page.evaluate(({ code, view }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName('DISTRICT__bioanalytics-lab'); let facility = null;
      district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; });
      facility.updateMatrixWorld(true); world.setMode('explore'); world.setTimeOfDay(['BA1', 'BA8', 'BA12', 'BA15'].includes(code) ? 'night' : 'noon'); world.setWeather('clear'); world.clearSelection('system'); world.cameraTween = null;
      world.camera.up.set(0, 1, 0); world.camera.position.copy(world.camera.position.clone().fromArray(view.camera).applyMatrix4(facility.matrixWorld)); world.controls.target.copy(world.controls.target.clone().fromArray(view.target).applyMatrix4(facility.matrixWorld)); world.controls.update(); world.advanceTime(900);
    }, { code, view });
    await page.waitForTimeout(220);
    await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName('DISTRICT__bioanalytics-lab'); const crescent = district.getObjectByName('BIOANALYTICS__ANALYTICAL_CRESCENT');
    const positions = crescent.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(crescent.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]);
    world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true; world.camera.lookAt(next.x, ground + 0.16, next.z);
    const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot();
    return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002) throw new Error(`Bioanalytics WALK eye clearance is incorrect: ${JSON.stringify(walkAudit)}`);
  if (!walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Analytical Crescent WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/walk-analytical-crescent.png` });

  const report = { audit, staleProxyRepair, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
