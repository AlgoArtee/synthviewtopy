import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.FINANCIAL_FUNDING_OUTPUT ?? 'output/financial-funding-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'financial-funding';
const requiredRoots = [
  'FINANCE__F01__THE_AEQUITAS_EXCHANGE', 'FINANCE__F02__MERIDIAN_RESEARCH_BANK', 'FINANCE__F03__VENTURE_PRISM',
  'FINANCE__F04__HELIX_GRANT_HOUSE', 'FINANCE__F05__THE_PATENT_LANTERN', 'FINANCE__F06__BLACK_SWAN_RISK_TOWER',
  'FINANCE__F07__THE_IMPACT_LEDGER', 'FINANCE__F08__PATRON_CONSTELLATION_HALL', 'FINANCE__F09__SOVEREIGN_SCIENCE_FUND_FORUM',
  'FINANCE__F10__THE_CLEARING_VAULT', 'FINANCE__F11__ASTRA_CONFLUENCE_CONVENTION_CENTRE',
  'FINANCE__F12__THE_MODULAR_CONGRESS_YARDS', 'FINANCE__F13__THE_DELEGATE_SPIRE',
  'FINANCE__F14__THE_ARBITRATION_BASILICA', 'FINANCE__F15__CHRONOS_FUTURES_OBSERVATORY',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
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
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident), districtId);

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const definition = world.definitions.get(districtId);
    if (!district || !definition?.sector) throw new Error('Financial / Funding / Convention district is unavailable');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    const restore = world.worldStreaming.mountPackageAuthoritySources(districtId);
    district.updateMatrixWorld(true);
    const facilities = [];
    const names = [];
    const materials = new Set();
    const animations = new Map();
    let meshes = 0;
    let triangles = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      const animation = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animation) animations.set(animation, (animations.get(animation) ?? 0) + 1);
      if (!object.isMesh || !object.geometry) return;
      meshes += 1;
      const index = object.geometry.index;
      const position = object.geometry.attributes.position;
      triangles += index ? index.count / 3 : position ? position.count / 3 : 0;
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((entry) => materials.add(entry.name));
    });
    const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
    const boxes = [];
    const boundaryViolations = [];
    facilities.forEach((facility) => {
      facility.updateMatrixWorld(true);
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      facility.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
          min.min(point); max.max(point);
          const radius = Math.hypot(point.x, point.z);
          const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
          if (radius < definition.sector.innerRadius - 0.35 || radius > definition.sector.outerRadius + 0.35 || angle < definition.sector.startAngle - 0.015 || angle > definition.sector.endAngle + 0.015) {
            boundaryViolations.push({ code: facility.userData.buildingCode, feature: object.name, radius: Number(radius.toFixed(3)), degrees: Number((angle * 180 / Math.PI).toFixed(3)) });
          }
        }
      });
      boxes.push({ code: facility.userData.buildingCode, name: facility.userData.buildingName, min: min.toArray(), max: max.toArray() });
    });
    const overlaps = [];
    for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left]; const b = boxes[right];
      const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
      const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
      if (overlapX > 0.35 && overlapZ > 0.35) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
    }
    const routeNames = [
      'FINANCE__CAPITAL_CRESCENT_PROMENADE', 'FINANCE__FUNDING_SPINE_PROMENADE', 'FINANCE__CONFLUENCE_GROUNDS_PROMENADE',
      ...Array.from({ length: 15 }, (_, index) => `FINANCE__F${String(index + 1).padStart(2, '0')}__EXACT_PEDESTRIAN_APPROACH`),
      'FINANCE__DIRECT_CONVENTION_TRANSIT_LINE',
    ];
    const routes = routeNames.map((name) => world.scene.getObjectByName(name));
    const walkRoute = routes[1];
    const positions = walkRoute.geometry.attributes.position;
    const pair = Math.floor((positions.count / 2 - 4) * 0.52) * 2;
    const roadPoint = world.camera.position.clone().fromBufferAttribute(positions, pair).add(world.camera.position.clone().fromBufferAttribute(positions, pair + 1)).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    const nextPair = Math.min(pair + 10, positions.count - 2);
    const roadNext = world.camera.position.clone().fromBufferAttribute(positions, nextPair).add(world.camera.position.clone().fromBufferAttribute(positions, nextPair + 1)).multiplyScalar(0.5).applyMatrix4(walkRoute.matrixWorld);
    world.walkController.refreshNavigation();
    const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
    const compact = JSON.parse(window.render_game_to_text());
    const deep = world.getTextSnapshot();
    const program = district.userData.financialFundingDistrict;
    const signatureExpressions = {
      aequitasLedgerBands: /^FINANCE__F01__LEDGER_DATA_BAND_\d+$/,
      patentNotationPanels: /^FINANCE__F05__PERFORATED_NOTATION_PANEL_\d+$/,
      sovereignPartnerFins: /^FINANCE__F09__EQUAL_PARTNER_STONE_FIN_\d+$/,
      clearingEncryptionCells: /^FINANCE__F10__ENCRYPTION_CELL_\d+_\d+_\d+$/,
      astraCrescentBays: /^FINANCE__F11__TRANSPARENT_CRESCENT_BAY_\d+$/,
      congressHallRoots: /^FINANCE__F12__RECONFIGURABLE_HALL_\d+$/,
      delegateTorsionFloors: /^FINANCE__F13__ROTATED_TREATY_FLOOR_\d+$/,
      chronosFutureDomains: /^FINANCE__F15__FUTURE_DOMAIN_PATH_\d+$/,
    };
    const signatureCounts = Object.fromEntries(Object.entries(signatureExpressions).map(([key, expression]) => [key, names.filter((name) => expression.test(name)).length]));
    const result = {
      facilityCount: facilities.length,
      codes: facilities.map((facility) => facility.userData.buildingCode).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      boxes, meshes, triangles, uniqueNames: new Set(names).size, materials: [...materials].sort(), animations: Object.fromEntries(animations),
      missingRoots: requiredRoots.filter((name) => !world.scene.getObjectByName(name)), boundaryViolations, overlaps,
      routes: routes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })),
      roadPoint: roadPoint.toArray(), roadNext: roadNext.toArray(), roadGround, program,
      compact: compact.financialFundingDistrict, deepProgram: deep.financialFundingDistrict,
      specializedRevision: deep.masterplan?.specializedDistrictLayoutRevision, planning: deep.planning, population: district.userData.population, signatureCounts,
    };
    restore?.();
    return result;
  }, { districtId, requiredRoots });
  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshes: audit.meshes, triangles: audit.triangles, signatureCounts: audit.signatureCounts, overlaps: audit.overlaps, boundaryViolations: audit.boundaryViolations.slice(0, 20) }, null, 2));
  const expectedCodes = Array.from({ length: 15 }, (_, index) => `F${String(index + 1).padStart(2, '0')}`).join(',');
  if (audit.facilityCount !== 15 || audit.codes.join(',') !== expectedCodes) throw new Error(`Financial facilities incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing authored roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshes < 500 || audit.uniqueNames < audit.meshes * 0.94 || audit.triangles > 360_000) throw new Error(`Detail budget failed: ${JSON.stringify({ meshes: audit.meshes, uniqueNames: audit.uniqueNames, triangles: audit.triangles })}`);
  if (audit.boundaryViolations.length) throw new Error(`Buildings cross district boundary: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
  if (audit.overlaps.length) throw new Error(`Building envelopes overlap: ${JSON.stringify(audit.overlaps)}`);
  if (audit.routes.length !== 19 || audit.routes.some((route) => !route.resident || !route.walkable) || audit.roadGround === null) throw new Error(`Financial circulation incomplete: ${JSON.stringify({ routes: audit.routes, ground: audit.roadGround })}`);
  if (audit.program?.buildingCount !== 15 || audit.compact?.buildingCount !== 15 || audit.deepProgram?.buildingCount !== 15 || audit.specializedRevision !== 30 || audit.planning?.cellViolations !== 0) throw new Error('Financial integration metadata incomplete');
  if (audit.program.zones.capitalCrescent.length !== 5 || audit.program.zones.fundingSpine.length !== 6 || audit.program.zones.confluenceGrounds.length !== 4 || audit.population?.threeZoneMasterplan !== true || audit.population?.conventionTransitIntegrated !== true) throw new Error('Financial zoning/public realm metadata incomplete');
  const expected = { aequitasLedgerBands: 17, patentNotationPanels: 28, sovereignPartnerFins: 24, clearingEncryptionCells: 144, astraCrescentBays: 19, congressHallRoots: 6, delegateTorsionFloors: 16, chronosFutureDomains: 12 };
  for (const [key, count] of Object.entries(expected)) if (audit.signatureCounts[key] !== count) throw new Error(`Expected ${count} ${key}, found ${audit.signatureCounts[key]}`);
  for (const name of ['Finance black basalt', 'Finance pale engineered stone', 'Finance brushed titanium', 'Finance pale bronze', 'Finance satin ceramic', 'Finance data cyan light', 'Finance venture violet light']) if (!audit.materials.includes(name)) throw new Error(`Missing architectural material: ${name}`);

  const bounds = { min: [0, 1, 2].map((axis) => Math.min(...audit.boxes.map((entry) => entry.min[axis]))), max: [0, 1, 2].map((axis) => Math.max(...audit.boxes.map((entry) => entry.max[axis]))) };
  await page.evaluate(() => {
    const world = window.labIsland;
    world.clearSelection('system');
    world.selectionBox.material.visible = false;
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer').forEach((element) => element.setAttribute('style', 'display:none'));
  });
  const prepareView = async (time = 'noon', plan = false) => {
    await page.evaluate(({ time, plan, bounds }) => {
      const world = window.labIsland;
      const min = world.camera.position.clone().fromArray(bounds.min);
      const max = world.camera.position.clone().fromArray(bounds.max);
      const center = min.clone().add(max).multiplyScalar(0.5);
      const size = max.clone().sub(min);
      world.select('financial-funding', 'scene'); world.setMode('explore'); world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null; world.selectionBox.visible = false;
      if (plan) {
        const extent = Math.max(size.z, size.x / world.camera.aspect);
        const altitude = extent * 0.7 / Math.tan(world.camera.fov * Math.PI / 360);
        world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 145), center.z + 0.001); world.controls.target.set(center.x, 0, center.z);
      } else {
        world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.7, center.y + Math.max(size.x, size.z) * 0.34, center.z + size.z * 0.72); world.controls.target.copy(center).setY(4.2);
      }
      world.controls.update(); world.advanceTime(900); world.selectionBox.visible = false;
    }, { time, plan, bounds });
    await page.waitForTimeout(300);
  };
  await prepareView('noon'); await page.screenshot({ path: `${OUTPUT}/financial-district-day.png` });
  await prepareView('noon', true); await page.screenshot({ path: `${OUTPUT}/financial-district-plan.png` });
  await prepareView('night'); await page.screenshot({ path: `${OUTPUT}/financial-district-night.png` });
  for (const box of audit.boxes) {
    await page.evaluate(({ box }) => {
      const world = window.labIsland;
      const min = world.camera.position.clone().fromArray(box.min); const max = world.camera.position.clone().fromArray(box.max);
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min); const distance = Math.max(size.x, size.z) * 1.05 + size.y * 0.72;
      world.select('financial-funding', 'scene'); world.setMode('explore'); world.setTimeOfDay(['F02', 'F04', 'F07', 'F09', 'F11', 'F12', 'F14'].includes(box.code) ? 'noon' : 'night'); world.cameraTween = null; world.selectionBox.visible = false;
      world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - distance * 0.62, center.y + distance * 0.38, center.z + distance * 0.72); world.controls.target.copy(center); world.controls.update(); world.advanceTime(550);
    }, { box });
    await page.waitForTimeout(130);
    await page.screenshot({ path: `${OUTPUT}/${box.code.toLowerCase()}-${box.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png` });
  }
  const walkAudit = await page.evaluate(({ roadPoint, roadNext }) => {
    const world = window.labIsland;
    const preferred = world.camera.position.clone().fromArray(roadPoint); const next = world.camera.position.clone().fromArray(roadNext); const heading = next.clone().sub(preferred).setY(0).normalize();
    world.setMode('walk'); world.setTimeOfDay('night'); world.walkController.refreshNavigation(); world.walkController.enter(preferred, heading, preferred);
    const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const state = world.walkController.getSnapshot();
    return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: state.grounded, position: state.positionWorld };
  }, { roadPoint: audit.roadPoint, roadNext: audit.roadNext });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.12) throw new Error(`Funding Spine WALK failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/funding-spine-human-height.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilities: audit.facilityCount, meshes: audit.meshes, triangles: audit.triangles, routes: audit.routes.length, walkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
