import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#loading-screen.done', { timeout: 60_000 });
await page.waitForTimeout(900);

const prepareView = async (camera, target, environment = { time: 'night', weather: 'fog' }) => {
  await page.evaluate(({ camera, target, environment }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
    if (!district) throw new Error('Industrial district was unavailable');
    district.updateMatrixWorld(true);
    world.setMode('explore');
    world.cameraTween = null;
    world.setTimeOfDay(environment.time);
    world.setWeather(environment.weather);
    world.setLayer('labels', false);
    const cameraWorld = world.camera.position.clone().fromArray(camera).applyMatrix4(district.matrixWorld);
    const targetWorld = world.controls.target.clone().fromArray(target).applyMatrix4(district.matrixWorld);
    world.camera.position.copy(cameraWorld);
    world.controls.target.copy(targetWorld);
    world.controls.update();
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(2200);
  }, { camera, target, environment });
  await page.waitForTimeout(350);
};

await prepareView([11.8, 11.5, 13.5], [0, 1.2, 0], { time: 'noon', weather: 'fog' });
await page.screenshot({ path: 'output/industrial-district/elevated-blue-hour.png' });

await prepareView([11.8, 10.6, 13.5], [0, 1.1, 0], { time: 'noon', weather: 'clear' });
await page.screenshot({ path: 'output/industrial-district/elevated-daylight.png' });

await prepareView([-13.4, 0.22, 0.35], [13.2, 0.25, 0.35], { time: 'noon', weather: 'fog' });
await page.screenshot({ path: 'output/industrial-district/central-road-human-eye.png' });

await page.evaluate(() => {
  const world = window.labIsland;
  const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
  const connection = district?.userData.industrialRailExtension?.connectionPoints?.[0];
  if (!district || !connection) throw new Error('Industrial/coastal rail junction was unavailable');
  world.setMode('explore');
  world.setTimeOfDay('noon');
  world.setWeather('fog');
  const point = world.controls.target.clone().set(connection[0], 1.63, connection[1]);
  const centre = district.getWorldPosition(world.camera.position.clone()).setY(1.63);
  const outward = point.clone().sub(centre).setY(0).normalize();
  const side = world.camera.up.clone().set(-outward.z, 0, outward.x);
  world.camera.position.copy(point).addScaledVector(outward, 3.4).addScaledVector(side, 2.2).setY(2.35);
  world.controls.target.copy(point).addScaledVector(outward, -4.5).setY(1.67);
  world.controls.update();
  world.advanceTime(800);
});
await page.waitForTimeout(300);
await page.screenshot({ path: 'output/industrial-district/coastal-rail-junction.png' });

await prepareView([-3.65, 0.5, -0.68], [-3.65, 0.88, -2.4], { time: 'noon', weather: 'fog' });
await page.screenshot({ path: 'output/industrial-district/manufacturing-doorway.png' });

await prepareView([0.1, 0.53, -0.75], [2.15, 1.28, -3.0], { time: 'noon', weather: 'fog' });
await page.screenshot({ path: 'output/industrial-district/power-boiler-silos.png' });

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const district = world.scene.getObjectByName('DISTRICT__industrial-labs');
  if (!district) throw new Error('Industrial district missing during audit');
  district.updateMatrixWorld(true);
  const names = [];
  const animated = [];
  const factoryBlocks = [];
  let meshCount = 0;
  district.traverse((object) => {
    if (object.name) names.push(object.name);
    if (object.isMesh) meshCount += 1;
    if (object.userData.animate) animated.push(object.userData.animate);
    if (object.parent === district && object.name?.match(/^INDUSTRIAL__(NEXUS_LOGISTICS|UNIT_4B|GREY_FOUNDRY|ASSEMBLY_WORKS|NORTH_REAR|SOUTH_REAR)/)) {
      factoryBlocks.push(object.name);
    }
  });
  const localRoadStart = world.camera.position.clone().set(-6.8, 0.05, 0.05).applyMatrix4(district.matrixWorld);
  const worldBounds = (object) => {
    object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
    return { min: bounds.min.toArray(), max: bounds.max.toArray() };
  };
  const centralRoad = district.getObjectByName('INDUSTRIAL__CENTRAL_OVERSIZED_ROAD');
  const centralBallast = district.getObjectByName('INDUSTRIAL__MAINLINE_CONNECTED_TRACK_1__BALLAST_1');
  const centralSteel = district.getObjectByName('INDUSTRIAL__MAINLINE_CONNECTED_TRACK_1__STEEL_RAIL');
  world.walkController.refreshNavigation();
  const ground = world.walkController.sampleGround(localRoadStart.x, localRoadStart.z);
  if (ground === null) throw new Error('Central industrial road has no walkable ground');
  world.setMode('walk');
  world.walkController.refreshNavigation();
  world.camera.position.set(localRoadStart.x, ground + 0.162, localRoadStart.z);
  world.walkController.groundY = ground;
  world.walkController.grounded = true;
  const lookTarget = world.camera.position.clone().set(6.4, 0.5, 0.05).applyMatrix4(district.matrixWorld);
  world.camera.lookAt(lookTarget.x, ground + 0.16, lookTarget.z);
  const start = world.camera.position.clone();
  world.setWalkIntent(0, 1, true);
  world.advanceTime(950);
  world.setWalkIntent(0, 0);
  const walk = world.walkController.getSnapshot();
  const end = world.camera.position.clone();
  return {
    names: [...new Set(names)].sort(),
    animated: [...new Set(animated)].sort(),
    meshCount,
    loadingBays: names.filter((name) => name.startsWith('INDUSTRIAL__LOADING_DOOR_')).length,
    hallWindows: names.filter((name) => name.startsWith('INDUSTRIAL__HALL_') && name.includes('__WINDOW_')).length,
    railTracks: names.filter((name) => name.startsWith('INDUSTRIAL__FREIGHT_RAIL_')).length,
    mainlineRailSegments: names.filter((name) => name.includes('MAINLINE_CONNECTED_TRACK') && name.endsWith('__STEEL_RAIL')).length,
    mainlineSleeperFields: names.filter((name) => name.includes('MAINLINE_CONNECTED_TRACK') && name.endsWith('__SLEEPERS')).length,
    factoryBlocks: [...new Set(factoryBlocks)],
    railExtension: district.userData.industrialRailExtension,
    centralRailGeometry: {
      road: centralRoad?.isMesh ? worldBounds(centralRoad) : null,
      ballast: centralBallast?.isMesh ? worldBounds(centralBallast) : null,
      steel: centralSteel?.isMesh ? worldBounds(centralSteel) : null,
      ballastVisible: centralBallast?.visible,
      steelVisible: centralSteel?.visible,
    },
    mistVolumes: names.filter((name) => name.startsWith('INDUSTRIAL__GROUND_MIST_')).length,
    textState: JSON.parse(window.render_game_to_text()),
    walk: {
      ground,
      eyeClearance: start.y - ground,
      moved: start.distanceTo(end),
      grounded: walk.grounded,
      position: walk.positionWorld,
    },
  };
});

await page.waitForTimeout(300);
await page.screenshot({ path: 'output/industrial-district/walk-central-road.png' });

const required = [
  'INDUSTRIAL__MAIN_MANUFACTURING_HALL',
  'INDUSTRIAL__ABANDONED_WAREHOUSE',
  'INDUSTRIAL__BRICK_POWER_STATION',
  'INDUSTRIAL__ADMINISTRATION_BUILDING',
  'INDUSTRIAL__WATER_TREATMENT_STRUCTURE',
  'INDUSTRIAL__BOILER_HOUSE',
  'INDUSTRIAL__RAIL_MAINTENANCE_SHED',
  'INDUSTRIAL__COLD_STORAGE_FACILITY',
  'INDUSTRIAL__RECYCLING_SORTING_HALL',
  'INDUSTRIAL__STORAGE_SILOS',
  'INDUSTRIAL__SECURITY_CHECKPOINT',
  'INDUSTRIAL__MAINTENANCE_TUNNEL_ENTRANCE',
  'INDUSTRIAL__CENTRAL_OVERSIZED_ROAD',
  'INDUSTRIAL__IMPOSSIBLE_LIVE_SURVEILLANCE_SCREEN',
  'INDUSTRIAL__HARD_HAT_ON_RAILING',
  'INDUSTRIAL__MALFUNCTIONING_AMBER_WARNING_LIGHT',
  'INDUSTRIAL__GREEN_RAIL_SIGNAL',
  'INDUSTRIAL__TRACK_BLOCK_AHEAD',
  'INDUSTRIAL__NEXUS_LOGISTICS_WEST',
  'INDUSTRIAL__UNIT_4B_PROCESS_BLOCK',
  'INDUSTRIAL__GREY_FOUNDRY_EAST',
  'INDUSTRIAL__ASSEMBLY_WORKS_EAST',
  'INDUSTRIAL__NORTH_REAR_FACTORY',
  'INDUSTRIAL__SOUTH_REAR_FACTORY',
  'INDUSTRIAL__MAINLINE_CONNECTED_TRACK_1__SLEEPERS',
  'INDUSTRIAL__MAINLINE_CONNECTED_TRACK_2__SLEEPERS',
];
const missing = required.filter((name) => !audit.names.includes(name));
if (missing.length) throw new Error(`Missing industrial features: ${missing.join(', ')}`);
if (audit.loadingBays < 10) throw new Error(`Expected at least ten loading bays, found ${audit.loadingBays}`);
if (audit.hallWindows < 16) throw new Error(`Manufacturing hall window rhythm is too sparse: ${audit.hallWindows}`);
if (audit.meshCount < 320) throw new Error(`Industrial district lacks sufficient authored detail: ${audit.meshCount} meshes`);
if (audit.mainlineRailSegments < 20 || audit.mainlineSleeperFields !== 2) throw new Error(`Industrial mainline is incomplete: ${JSON.stringify(audit.railExtension)}`);
if (audit.railExtension?.addedFactoryBlocks !== 6 || audit.railExtension?.connectionPoints?.length !== 2) throw new Error('Factory extension or coastal rail connection metadata is incomplete');
if (audit.animated.length < 8) throw new Error(`Industrial district lacks varied automatic systems: ${audit.animated.join(', ')}`);
if (Math.abs(audit.walk.eyeClearance - 0.162) > 0.002) throw new Error(`Walk eye clearance is not 1.62 m: ${audit.walk.eyeClearance}`);
if (!audit.walk.grounded || audit.walk.moved < 0.22) throw new Error(`Walk traversal failed: ${JSON.stringify(audit.walk)}`);
if (audit.textState.industrialDistrict?.facilities?.length !== 12) throw new Error('Text state does not expose all twelve industrial facilities');
if (audit.textState.industrialDistrict?.centralRoadMetres !== 300 || audit.textState.industrialDistrict?.centralRailTracks !== 2) throw new Error('Text state does not expose the expanded industrial rail street');
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify({ audit: { ...audit, names: undefined }, consoleErrors }, null, 2));
await browser.close();
