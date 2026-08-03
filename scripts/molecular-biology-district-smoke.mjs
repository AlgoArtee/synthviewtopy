import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.MOLECULAR_BIOLOGY_OUTPUT ?? 'output/molecular-biology-district';
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
  await page.waitForTimeout(700);
  await page.evaluate(() => window.advanceTime(240));
  await page.evaluate(() => window.labIsland.select('molecular-biology-labs', 'scene'));
  await page.waitForFunction(() => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === 'molecular-biology-labs' && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'));

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__molecular-biology-labs');
    const definition = world.definitions.get('molecular-biology-labs');
    if (!district || !definition?.sector) throw new Error('Molecular Biology Labs District is unavailable');
    district.updateMatrixWorld(true);
    world.select('molecular-biology-labs', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.worldStreaming.update({
      cameraPosition: district.getWorldPosition(world.camera.position.clone()).setY(15),
      mode: 'explore',
      selectedPackageId: 'molecular-biology-labs',
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
      const animationProfile = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animationProfile) animated.push({ name: object.name, animate: animationProfile });
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
        for (const x of [bounds.min.x, bounds.max.x]) {
          for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
              const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
              minWorld.min(point);
              maxWorld.max(point);
              const radius = Math.hypot(point.x, point.z);
              const angle = normalizeNear(Math.atan2(point.z, point.x), sector.centerAngle);
              if (
                radius < sector.innerRadius - 0.3
                || radius > sector.outerRadius + 0.3
                || angle < sector.startAngle - 0.014
                || angle > sector.endAngle + 0.014
              ) boundaryViolations.push({ code: facility.userData.buildingCode, name: object.name, radius, angle });
            }
          }
        }
      });
      facilityBounds.push({ code: facility.userData.buildingCode, min: minWorld.toArray(), max: maxWorld.toArray() });
    });

    const overlapPairs = [];
    for (let first = 0; first < facilityBounds.length; first += 1) {
      for (let second = first + 1; second < facilityBounds.length; second += 1) {
        const a = facilityBounds[first]; const b = facilityBounds[second];
        const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
        const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
        if (overlapX > 1.0 && overlapZ > 1.0) overlapPairs.push({ codes: [a.code, b.code], overlapX, overlapZ });
      }
    }

    const routeNames = [
      'MOLECULAR__MOLECULAR_MERIDIAN',
      'MOLECULAR__INNER_PAIRED_INTERACTION_ARC',
      'MOLECULAR__MIDDLE_TRIPLET_INTERACTION_ARC',
      'MOLECULAR__OUTER_PAIRED_INTERACTION_ARC',
      'MOLECULAR__TRIPLET_BRANCH_1',
      'MOLECULAR__TRIPLET_BRANCH_2',
      'MOLECULAR__TRIPLET_BRANCH_3',
      ...Array.from({ length: 10 }, (_, index) => `MOLECULAR__BUILDING_APPROACH_MB${index + 1}`),
    ];
    const routes = routeNames.map((name) => district.getObjectByName(name));
    const walkRoute = routes[0];
    if (!walkRoute?.isMesh) throw new Error('Molecular Meridian is missing');
    const positions = walkRoute.geometry.attributes.position;
    const pair = Math.floor(positions.count / 4) * 2;
    const a = world.camera.position.clone().fromBufferAttribute(positions, pair);
    const b = world.camera.position.clone().fromBufferAttribute(positions, pair + 1);
    const roadPoint = a.add(b).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation();
    const textState = JSON.parse(window.render_game_to_text());
    const streaming = world.worldStreaming.getSnapshot();
    return {
      program: district.userData.molecularBiologyDistrict,
      population: district.userData.population,
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((a, b) => Number(a.slice(2)) - Number(b.slice(2))),
      meshCount,
      uniqueNames: new Set(names).size,
      materialNames: [...materials].sort(),
      animated,
      scaledMeshParentDetails,
      boundaryViolations,
      overlapPairs,
      facilityBounds,
      missingRoots: [
        'MOLECULAR__MB1__GENESIS_FORGE',
        'MOLECULAR__MB2__XENOCODON_BASTION',
        'MOLECULAR__MB3__THE_PROTOSPHERE_COMPLEX',
        'MOLECULAR__MB4__ASTERION_EXOBIOLOGY_ARRAY',
        'MOLECULAR__MB5__PALIMPSEST_TOWER',
        'MOLECULAR__MB6__SYMBIOGENESIS_ARC',
        'MOLECULAR__MB7__MOLECULAR_AUTOMATA_LOOM',
        'MOLECULAR__MB8__THE_DARWIN_ENGINE',
        'MOLECULAR__MB9__MORPHOGEN_EXCHANGE',
        'MOLECULAR__MB10__CRYPTOBIOSIS_VAULT',
      ].filter((name) => !district.getObjectByName(name)),
      signatureCounts: {
        codonPanels: names.filter((name) => name.startsWith('MOLECULAR__MB1__CODON_PANEL_')).length,
        kineticShutters: names.filter((name) => name.startsWith('MOLECULAR__MB2__KINETIC_SHUTTER_')).length,
        protocells: names.filter((name) => name.startsWith('MOLECULAR__MB3__PROTOCELL_')).length,
        planetaryWings: names.filter((name) => name.match(/^MOLECULAR__MB4__.+_WING$/)).length,
        chromatinFins: names.filter((name) => name.startsWith('MOLECULAR__MB5__CHROMATIN_FIN_')).length,
        organellePods: names.filter((name) => name.startsWith('MOLECULAR__MB6__SPECIALIZED_ORGANELLE_POD_')).length,
        braidedBands: names.filter((name) => name.startsWith('MOLECULAR__MB7__BRAIDED_STRUCTURAL_BAND_')).length,
        evolutionaryStrata: names.filter((name) => name.startsWith('MOLECULAR__MB8__EVOLUTIONARY_STRATUM_')).length,
        gradientWings: names.filter((name) => name.startsWith('MOLECULAR__MB9__GRADIENT_WING_')).length,
        glacialPlanes: names.filter((name) => name.startsWith('MOLECULAR__MB10__GLACIAL_CERAMIC_PLANE_')).length,
        interactionPlazas: names.filter((name) => name.match(/^MOLECULAR__INTERACTION_PLAZA_\d+$/)).length,
      },
      routeAudit: routes.map((route) => ({ name: route?.name ?? null, walkable: route?.userData.walkable === true, resident: Boolean(route?.parent) })),
      roadGround: world.walkController.sampleGround(roadPoint.x, roadPoint.z),
      roadPoint: roadPoint.toArray(),
      textMolecular: textState.molecularBiologyDistrict,
      planning: textState.planning,
      revision: textState.masterplan?.specializedDistrictLayoutRevision,
      streaming: streaming.packages.find((entry) => entry.id === 'molecular-biology-labs') ?? null,
    };
  });

  await writeFile(`${OUTPUT}/audit-baseline.json`, `${JSON.stringify({ audit, errors }, null, 2)}\n`);
  if (audit.facilityCount !== 10 || audit.codes.join(',') !== 'MB1,MB2,MB3,MB4,MB5,MB6,MB7,MB8,MB9,MB10') throw new Error(`Molecular Biology facility program is incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing Molecular Biology roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshCount < 700) throw new Error(`Molecular Biology exterior detail is too sparse: ${audit.meshCount} meshes`);
  if (audit.uniqueNames < audit.meshCount * 0.97) throw new Error('Molecular Biology exterior names are not sufficiently deterministic');
  if (audit.scaledMeshParentDetails.length) throw new Error(`Molecular Biology detail inherited a scaled mesh transform: ${JSON.stringify(audit.scaledMeshParentDetails)}`);
  if (audit.boundaryViolations.length) throw new Error(`Molecular Biology facilities cross their district cell: ${JSON.stringify(audit.boundaryViolations.slice(0, 18))}`);
  if (audit.overlapPairs.length) throw new Error(`Molecular Biology facility envelopes overlap: ${JSON.stringify(audit.overlapPairs)}`);
  if (audit.animated.length < 40) throw new Error(`Molecular Biology responsive systems are incomplete: ${audit.animated.length}`);
  if (Object.values(audit.signatureCounts).join(',') !== '42,30,7,3,44,6,12,12,5,4,5') throw new Error(`Molecular Biology signatures are incomplete: ${JSON.stringify(audit.signatureCounts)}`);
  if (audit.routeAudit.some((route) => !route.walkable || !route.resident)) throw new Error(`Molecular Biology public routes are incomplete: ${JSON.stringify(audit.routeAudit)}`);
  if (audit.roadGround === null) throw new Error('Molecular Meridian is not WALK-grounded');
  if (audit.textMolecular?.buildingCount !== 10 || audit.textMolecular?.identity !== 'Molecular Biology Labs District') throw new Error('Molecular Biology metadata is missing from render_game_to_text()');
  if (audit.population?.realizedFacilityCount !== 10 || audit.population?.distributedMolecularCircuit !== true) throw new Error('Molecular Biology population metadata is incomplete');
  if (audit.streaming?.detailResident !== true) throw new Error('Molecular Biology detail package did not remain resident for inspection');
  if (audit.planning?.cellViolations !== 0) throw new Error(`Masterplan sector anchors regressed: ${audit.planning.cellViolations}`);
  if (audit.revision !== 10) throw new Error(`Specialized layout revision is stale: ${audit.revision}`);
  for (const material of [
    'Molecular Biology satin white bioceramic',
    'Molecular Biology graphite titanium',
    'Xenocodon black iridescent titanium ceramic',
    'Protosphere pearlescent translucent membrane',
    'Asterion iron-rich Mars ceramic',
    'Asterion Titan smoked amber glass',
    'Molecular Meridian information-circuit light',
  ]) if (!audit.materialNames.includes(material)) throw new Error(`Missing Molecular Biology material: ${material}`);

  await page.evaluate(() => {
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none'));
  });

  const prepareDistrictView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ time, plan }) => {
      const world = window.labIsland;
      const district = world.scene.getObjectByName('DISTRICT__molecular-biology-labs');
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
        const verticalExtent = Math.max(size.z, size.x / world.camera.aspect);
        const altitude = verticalExtent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360);
        world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 90), center.z + 0.001); world.controls.target.set(center.x, 0, center.z);
      } else {
        world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.82, center.y + Math.max(size.x, size.z) * 0.72, center.z + size.z * 0.58); world.controls.target.copy(center).setY(3.8);
      }
      world.controls.update(); world.advanceTime(1_200);
    }, { time, plan });
    await page.waitForTimeout(350);
  };
  await prepareDistrictView('noon');
  await page.screenshot({ path: `${OUTPUT}/molecular-biology-overview.png` });
  await prepareDistrictView('noon', true);
  await page.screenshot({ path: `${OUTPUT}/molecular-biology-plan.png` });
  await prepareDistrictView('night');
  await page.screenshot({ path: `${OUTPUT}/molecular-biology-night.png` });

  const facilityViews = {
    MB1: { camera: [15, 9, 17], target: [0, 2.5, 0] }, MB2: { camera: [13, 9, 14], target: [0, 2.7, 0] },
    MB3: { camera: [17, 9, 15], target: [0, 1.5, 0] }, MB4: { camera: [19, 12, 20], target: [0, 2.8, 0] },
    MB5: { camera: [11, 10, 13], target: [0, 4.0, 0] }, MB6: { camera: [17, 9, 15], target: [0, 2.3, 0] },
    MB7: { camera: [19, 8, 13], target: [0, 2.0, 0] }, MB8: { camera: [12, 12, 15], target: [0, 4.6, 0] },
    MB9: { camera: [17, 10, 16], target: [0, 2.6, 0] }, MB10: { camera: [17, 7, 15], target: [0, 1.7, 0] },
  };
  for (const [code, view] of Object.entries(facilityViews)) {
    await page.evaluate(({ code, view }) => {
      const world = window.labIsland; const district = world.scene.getObjectByName('DISTRICT__molecular-biology-labs'); let facility = null;
      district.traverse((object) => { if (object.userData.buildingCode === code && object.userData.exteriorProgram === true) facility = object; });
      facility.updateMatrixWorld(true); world.setMode('explore'); world.setTimeOfDay(['MB2', 'MB4', 'MB10'].includes(code) ? 'night' : 'noon'); world.setWeather('clear'); world.clearSelection('system'); world.cameraTween = null;
      world.camera.up.set(0, 1, 0); world.camera.position.copy(world.camera.position.clone().fromArray(view.camera).applyMatrix4(facility.matrixWorld)); world.controls.target.copy(world.controls.target.clone().fromArray(view.target).applyMatrix4(facility.matrixWorld)); world.controls.update(); world.advanceTime(900);
    }, { code, view });
    await page.waitForTimeout(260);
    await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudit = await page.evaluate(({ roadPoint }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName('DISTRICT__molecular-biology-labs'); const spine = district.getObjectByName('MOLECULAR__MOLECULAR_MERIDIAN');
    const positions = spine.geometry.attributes.position; const pair = Math.floor(positions.count / 4) * 2;
    const nextA = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 8, positions.count - 2)); const nextB = world.camera.position.clone().fromBufferAttribute(positions, Math.min(pair + 9, positions.count - 1)); const next = nextA.add(nextB).multiplyScalar(0.5).applyMatrix4(spine.matrixWorld);
    world.setMode('walk'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.walkController.refreshNavigation(); const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]);
    world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true; world.camera.lookAt(next.x, ground + 0.16, next.z);
    const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const walk = world.walkController.getSnapshot();
    return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: walk.grounded, position: walk.positionWorld };
  }, { roadPoint: audit.roadPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002) throw new Error(`Molecular Biology WALK eye clearance is incorrect: ${JSON.stringify(walkAudit)}`);
  if (!walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Molecular Meridian WALK traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/walk-molecular-meridian.png` });

  const report = { audit, walkAudit, errors };
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
