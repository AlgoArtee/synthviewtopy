import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ENTERTAINMENT_OUTPUT ?? 'output/entertainment-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'luxury-entertainment';
const requiredRoots = [
  'ENTERTAINMENT__E01__THE_AURELIA_CROWN', 'ENTERTAINMENT__E02__TIDAL_GLASS', 'ENTERTAINMENT__E03__THE_HELIX_TABLE',
  'ENTERTAINMENT__E04__EMBER_ICE', 'ENTERTAINMENT__E05__THE_ORION_ROOM', 'ENTERTAINMENT__E06__VELVET_CIRCUIT',
  'ENTERTAINMENT__E07__PULSE_CATHEDRAL', 'ENTERTAINMENT__E08__HALO_NINE', 'ENTERTAINMENT__E09__ECLIPSE_CABARET',
  'ENTERTAINMENT__E10__AURORA_GRAND_CINEMA', 'ENTERTAINMENT__E11__HORIZON_SCREEN_GARDENS',
  'ENTERTAINMENT__E12__MERIDIAN_POOL_PALACE', 'ENTERTAINMENT__E13__NEON_GROTTO_AQUACLUB',
  'ENTERTAINMENT__E14__THE_PRISMARIUM', 'ENTERTAINMENT__E15__SYNESTHESIA_HALL', 'ENTERTAINMENT__E16__ZERO_G_BALLROOM',
  'ENTERTAINMENT__E17__DREAM_ARCADE', 'ENTERTAINMENT__E18__PROBABILITY_PALACE',
  'ENTERTAINMENT__E19__CHRONO_CAROUSEL', 'ENTERTAINMENT__E20__THE_PHANTOM_MENAGERIE',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => { localStorage.removeItem('youtopy_saved_project'); localStorage.removeItem('youtopy_walk_speed_kmh'); });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland; const district = world.scene.getObjectByName(`DISTRICT__${districtId}`); const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Luxury / Entertainment district is unavailable');
    world.setMode('explore'); world.setTimeOfDay('noon'); world.setWeather('clear'); world.setLayer('labels', false);
    const restore = world.worldStreaming.mountPackageAuthoritySources(districtId); district.updateMatrixWorld(true);
    const facilities = []; const names = []; const materials = new Set(); const animations = new Map(); let meshes = 0; let triangles = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animation = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animation) animations.set(animation, (animations.get(animation) ?? 0) + 1);
      if (!object.isMesh || !object.geometry) return; meshes += 1; const index = object.geometry.index; const position = object.geometry.attributes.position; triangles += index ? index.count / 3 : position ? position.count / 3 : 0;
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((entry) => materials.add(entry.name));
    });
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const boxes = []; const boundaryViolations = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity); const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return; object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point);
          const radius = Math.hypot(point.x, point.z); const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
          if (radius < definition.sector.innerRadius - 0.35 || radius > definition.sector.outerRadius + 0.35 || angle < definition.sector.startAngle - 0.015 || angle > definition.sector.endAngle + 0.015) boundaryViolations.push({ code: facility.userData.buildingCode, feature: object.name, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
        }
      });
      boxes.push({ code: facility.userData.buildingCode, name: facility.userData.buildingName, min: min.toArray(), max: max.toArray() });
    });
    const overlaps = [];
    for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left]; const b = boxes[right]; const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]); const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.35 && overlapZ > 0.35) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }
    const routeNames = ['ENTERTAINMENT__LUMEN_BOULEVARD', ...Array.from({ length: 20 }, (_, index) => `ENTERTAINMENT__E${String(index + 1).padStart(2, '0')}__LUMEN_APPROACH`), ...Array.from({ length: 3 }, (_, index) => `ENTERTAINMENT__HALO_WALK_SEGMENT_${index + 1}`)];
    const routes = routeNames.map((name) => world.scene.getObjectByName(name)); const walkRoute = routes[0]; const positions = walkRoute.geometry.attributes.position; const pair = Math.floor((positions.count / 2 - 4) * 0.55) * 2;
    const roadPoint = world.camera.position.clone().fromBufferAttribute(positions, pair).add(world.camera.position.clone().fromBufferAttribute(positions, pair + 1)).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    const nextPair = Math.min(pair + 12, positions.count - 2); const roadNext = world.camera.position.clone().fromBufferAttribute(positions, nextPair).add(world.camera.position.clone().fromBufferAttribute(positions, nextPair + 1)).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation(); const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z); const compact = JSON.parse(window.render_game_to_text()); const deep = world.getTextSnapshot(); const program = district.userData.entertainmentDistrict;
    const signatureExpressions = {
      aureliaFloors: /^ENTERTAINMENT__E01__ELLIPTICAL_FLOOR_\d+$/, tidalScales: /^ENTERTAINMENT__E02__PHOTOVOLTAIC_WAVE_SCALE_\d+$/,
      helixPromenade: /^ENTERTAINMENT__E03__SPIRAL_PROMENADE_SEGMENT_\d+$/, velvetRibbons: /^ENTERTAINMENT__E06__KINETIC_VELVET_RIBBON_\d+$/,
      pulseButtresses: /^ENTERTAINMENT__E07__ACOUSTIC_BUTTRESS_\d+$/, haloPools: /^ENTERTAINMENT__E08__REFLECTING_POOL_\d+$/,
      synesthesiaPanels: /^ENTERTAINMENT__E15__RESPONSIVE_PANEL_\d+_\d+$/, dreamCapsules: /^ENTERTAINMENT__E17__DREAM_CAPSULE_\d+$/,
      chronoRings: /^ENTERTAINMENT__E19__MECHANICAL_TIME_RING_\d+$/, phantomCells: /^ENTERTAINMENT__E20__TRANSLUCENT_BIOME_CELL_\d+$/,
    };
    const signatureCounts = Object.fromEntries(Object.entries(signatureExpressions).map(([key, expression]) => [key, names.filter((name) => expression.test(name)).length]));
    const result = { facilityCount: facilities.length, codes: facilities.map((facility) => facility.userData.buildingCode).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), boxes, meshes, triangles, uniqueNames: new Set(names).size, materials: [...materials].sort(), animations: Object.fromEntries(animations), missingRoots: requiredRoots.filter((name) => !world.scene.getObjectByName(name)), boundaryViolations, overlaps, routes: routes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })), roadPoint: roadPoint.toArray(), roadNext: roadNext.toArray(), roadGround, program, compact: compact.entertainmentDistrict, deepProgram: deep.entertainmentDistrict, specializedRevision: deep.masterplan?.specializedDistrictLayoutRevision, planning: deep.planning, population: district.userData.population, signatureCounts };
    restore?.(); return result;
  }, { districtId, requiredRoots });
  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshes: audit.meshes, triangles: audit.triangles, signatureCounts: audit.signatureCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 20) }, null, 2));
  if (audit.facilityCount !== 20 || audit.codes.join(',') !== Array.from({ length: 20 }, (_, index) => `E${String(index + 1).padStart(2, '0')}`).join(',')) throw new Error(`Entertainment facilities incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing authored roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshes < 650 || audit.uniqueNames < audit.meshes * 0.93 || audit.triangles > 320_000) throw new Error(`Detail budget failed: ${JSON.stringify({ meshes: audit.meshes, uniqueNames: audit.uniqueNames, triangles: audit.triangles })}`);
  if (audit.boundaryViolations.length) throw new Error(`Buildings cross district boundary: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Building envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routes.length !== 24 || audit.routes.some((route) => !route.resident || !route.walkable) || audit.roadGround === null) throw new Error(`Lumen/Halo circulation incomplete: ${JSON.stringify({ routes: audit.routes, ground: audit.roadGround })}`);
  if (audit.program?.buildingCount !== 20 || audit.compact?.buildingCount !== 20 || audit.deepProgram?.buildingCount !== 20 || audit.specializedRevision !== 30 || audit.planning?.cellViolations !== 0) throw new Error('Entertainment integration metadata incomplete');
  if (audit.program.zones.outerNorthern.length !== 5 || audit.program.zones.artMarketing.length !== 6 || audit.program.zones.residentialQuiet.length !== 5 || audit.program.zones.tropicalEcological.length !== 4 || audit.population?.lumenBoulevardWalkable !== true || audit.population?.haloWalkOpenAir !== true) throw new Error('Entertainment zoning/public realm metadata incomplete');
  const expected = { aureliaFloors: 5, tidalScales: 11, helixPromenade: 30, velvetRibbons: 42, pulseButtresses: 8, haloPools: 9, synesthesiaPanels: 70, dreamCapsules: 12, chronoRings: 3, phantomCells: 4 };
  for (const [key, count] of Object.entries(expected)) if (audit.signatureCounts[key] !== count) throw new Error(`Expected ${count} ${key}, found ${audit.signatureCounts[key]}`);
  for (const name of ['Entertainment champagne titanium', 'Entertainment matte black ceramic', 'Entertainment pale polished stone', 'Entertainment low-iron smoked glass', 'Entertainment wet-look black basalt', 'Entertainment cyan structural neon', 'Entertainment magenta structural neon']) if (!audit.materials.includes(name)) throw new Error(`Missing architectural material: ${name}`);

  const bounds = { min: [0, 1, 2].map((axis) => Math.min(...audit.boxes.map((entry) => entry.min[axis]))), max: [0, 1, 2].map((axis) => Math.max(...audit.boxes.map((entry) => entry.max[axis]))) };
  await page.evaluate(() => { const world = window.labIsland; world.clearSelection('system'); world.selectionBox.material.visible = false; document.querySelector('.atlas')?.setAttribute('style', 'display:none'); document.querySelector('.topbar')?.setAttribute('style', 'display:none'); document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer').forEach((element) => element.setAttribute('style', 'display:none')); });
  const prepareView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ time, plan, bounds }) => { const world = window.labIsland; const min = world.camera.position.clone().fromArray(bounds.min); const max = world.camera.position.clone().fromArray(bounds.max); const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); world.select('luxury-entertainment', 'scene'); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false; if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.7 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 125), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); } else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.72, center.y + Math.max(size.x, size.z) * 0.34, center.z + size.z * 0.72); world.controls.target.copy(center).setY(3.5); } world.controls.update(); world.advanceTime(900); world.selectionBox.visible = false; }, { time, plan, bounds });
    await page.waitForTimeout(300);
  };
  await prepareView('noon'); await page.screenshot({ path: `${OUTPUT}/luminous-crescent-day.png` });
  await prepareView('noon', true); await page.screenshot({ path: `${OUTPUT}/luminous-crescent-plan.png` });
  await prepareView('night'); await page.screenshot({ path: `${OUTPUT}/luminous-crescent-night.png` });
  for (const box of audit.boxes) {
    await page.evaluate(({ box }) => { const world = window.labIsland; const min = world.camera.position.clone().fromArray(box.min); const max = world.camera.position.clone().fromArray(box.max); const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.05 + size.y * 0.7; world.select('luxury-entertainment', 'scene'); world.setMode('explore'); world.setTimeOfDay(['E02', 'E03', 'E10', 'E11', 'E12', 'E14', 'E15'].includes(box.code) ? 'noon' : 'night'); world.cameraTween = null; world.selectionBox.visible = false; world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.38, center.z + distance * 0.72); world.controls.target.copy(center); world.controls.update(); world.advanceTime(550); }, { box });
    await page.waitForTimeout(130); await page.screenshot({ path: `${OUTPUT}/${box.code.toLowerCase()}-${box.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png` });
  }
  const walkAudit = await page.evaluate(({ roadPoint, roadNext }) => { const world = window.labIsland; const preferred = world.camera.position.clone().fromArray(roadPoint); const next = world.camera.position.clone().fromArray(roadNext); const heading = next.clone().sub(preferred).setY(0).normalize(); world.setMode('walk'); world.setTimeOfDay('night'); world.walkController.refreshNavigation(); world.walkController.enter(preferred, heading, preferred); const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const state = world.walkController.getSnapshot(); return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: state.grounded, position: state.positionWorld }; }, { roadPoint: audit.roadPoint, roadNext: audit.roadNext });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Lumen Boulevard WALK failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/lumen-boulevard-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilities: audit.facilityCount, meshes: audit.meshes, triangles: audit.triangles, routes: audit.routes.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
