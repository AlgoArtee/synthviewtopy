import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.SPECIALIZED_DISTRICT_LAYOUT_OUTPUT
  ?? 'test-artifacts/specialized-district-layout-migration';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtIds = ['security', 'secret-labs', 'medical-labs', 'pharmacology-labs'];
const roadNames = {
  security: 'SECURITY__MAIN_CURVED_BOULEVARD',
  'secret-labs': 'SECRET__BIOLOGICAL_ARC',
  'medical-labs': 'MEDICAL__DIAGNOSTIC_CRESCENT',
  'pharmacology-labs': 'PHARMACOLOGY__DOSE_RESPONSE_PROMENADE',
};

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

async function waitForWorld() {
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.waitForTimeout(600);
  await page.evaluate(() => window.advanceTime(180));
}

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await waitForWorld();

  const seeded = await page.evaluate(async (ids) => {
    const world = window.labIsland;
    const canonical = Object.fromEntries(ids.map((id) => [id, world.getObjectState(id)]));
    const payload = world.buildProjectPayload();
    delete payload.masterplan.specializedDistrictLayoutRevision;
    ids.forEach((id, index) => {
      const record = payload.objects.find((object) => object.id === id);
      if (!record?.state) throw new Error(`Cannot seed stale transform for ${id}`);
      record.state.position = { x: index * 0.45 - 0.45, y: record.state.position.y, z: index * 0.35 - 0.35 };
      record.state.rotationY = 27 + index * 11;
      record.state.scale = 1.45 + index * 0.18;
      delete record.state.scale3D;
    });
    await world.persistence.saveProject(payload);
    localStorage.setItem('youtopy_saved_project', JSON.stringify(payload));
    return { canonical, staleRevision: payload.masterplan.specializedDistrictLayoutRevision ?? null };
  }, districtIds);

  if (seeded.staleRevision !== null) throw new Error('The stale payload unexpectedly retained a specialized district revision');

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
  await waitForWorld();

  const audit = await page.evaluate(async ({ ids, roads, expected }) => {
    const world = window.labIsland;
    const normalizeNear = (angle, reference) => reference + Math.atan2(
      Math.sin(angle - reference),
      Math.cos(angle - reference),
    );
    const restored = {};
    const boundaryViolations = [];
    const roadViolations = [];

    ids.forEach((id) => {
      const district = world.scene.getObjectByName(`DISTRICT__${id}`);
      const definition = world.definitions.get(id);
      if (!district || !definition?.sector) throw new Error(`Missing restored district ${id}`);
      district.updateMatrixWorld(true);
      const state = world.getObjectState(id);
      const canonical = expected[id];
      restored[id] = {
        position: state.position,
        rotationY: state.rotationY,
        scale: state.scale,
        positionError: Math.hypot(
          state.position.x - canonical.position.x,
          state.position.y - canonical.position.y,
          state.position.z - canonical.position.z,
        ),
        rotationError: Math.abs(state.rotationY - canonical.rotationY),
        scaleError: Math.abs(state.scale - canonical.scale),
      };

      const sector = definition.sector;
      district.traverse((facility) => {
        if (facility.userData.exteriorProgram !== true) return;
        facility.traverse((object) => {
          if (!object.isMesh || !object.geometry) return;
          object.geometry.computeBoundingBox();
          const bounds = object.geometry.boundingBox;
          if (!bounds) return;
          for (const x of [bounds.min.x, bounds.max.x]) {
            for (const y of [bounds.min.y, bounds.max.y]) {
              for (const z of [bounds.min.z, bounds.max.z]) {
                const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
                const radius = Math.hypot(point.x, point.z);
                const angle = normalizeNear(Math.atan2(point.z, point.x), sector.centerAngle);
                if (
                  radius < sector.innerRadius - 0.3
                  || radius > sector.outerRadius + 0.3
                  || angle < sector.startAngle - 0.015
                  || angle > sector.endAngle + 0.015
                ) {
                  boundaryViolations.push({ id, facility: facility.name, point: [point.x, point.z], radius, angle });
                  return;
                }
              }
            }
          }
        });
      });

      const road = district.getObjectByName(roads[id]);
      const positions = road?.geometry?.attributes?.position;
      if (!road || !positions) throw new Error(`Missing primary road for ${id}`);
      road.updateMatrixWorld(true);
      const stride = Math.max(2, Math.floor(positions.count / 18));
      for (let index = 0; index < positions.count; index += stride) {
        const point = world.camera.position.clone().fromBufferAttribute(positions, index).applyMatrix4(road.matrixWorld);
        const radius = Math.hypot(point.x, point.z);
        const angle = normalizeNear(Math.atan2(point.z, point.x), sector.centerAngle);
        if (
          radius < sector.innerRadius - 0.2
          || radius > sector.outerRadius + 0.2
          || angle < sector.startAngle - 0.012
          || angle > sector.endAngle + 0.012
        ) roadViolations.push({ id, point: [point.x, point.z], radius, angle });
      }
    });

    const stored = await world.persistence.loadProject();
    const text = JSON.parse(window.render_game_to_text());
    return {
      restored,
      boundaryViolations,
      roadViolations,
      storedRevision: stored?.payload?.masterplan?.specializedDistrictLayoutRevision ?? null,
      textRevision: text.masterplan?.specializedDistrictLayoutRevision ?? null,
      planningViolations: text.planning?.cellViolations ?? null,
    };
  }, { ids: districtIds, roads: roadNames, expected: seeded.canonical });

  Object.entries(audit.restored).forEach(([id, state]) => {
    if (state.positionError > 1e-6 || state.rotationError > 1e-6 || state.scaleError > 1e-6) {
      throw new Error(`Canonical transform was not restored for ${id}: ${JSON.stringify(state)}`);
    }
  });
  if (audit.boundaryViolations.length) {
    throw new Error(`Migrated facilities left their sector cells: ${JSON.stringify(audit.boundaryViolations.slice(0, 12))}`);
  }
  if (audit.roadViolations.length) {
    throw new Error(`Migrated roads left their sector cells: ${JSON.stringify(audit.roadViolations.slice(0, 12))}`);
  }
  if (audit.storedRevision !== 2 || audit.textRevision !== 2) {
    throw new Error(`Migration revision was not persisted: ${JSON.stringify({ stored: audit.storedRevision, text: audit.textRevision })}`);
  }
  if (audit.planningViolations !== 0) throw new Error(`Master-plan cell violations remain: ${audit.planningViolations}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('plan');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.camera.position.set(0, 128, 0.001);
    world.camera.up.set(0, 0, -1);
    world.camera.lookAt(0, 0, 0);
    world.controls.target.set(0, 0, 0);
    world.controls.update();
    window.advanceTime(180);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT}/restored-masterplan.png` });
  await page.evaluate(() => {
    const world = window.labIsland;
    const focus = { x: 106, z: -184 };
    world.setMode('explore');
    world.worldStreaming.update({
      cameraPosition: world.camera.position.clone().set(focus.x, 14, focus.z),
      mode: 'explore',
      selectedPackageId: null,
      interiorPackageId: null,
      force: true,
    });
    world.camera.position.set(focus.x, 154, focus.z + 0.001);
    world.camera.up.set(0, 0, -1);
    world.camera.lookAt(focus.x, 0, focus.z);
    world.controls.target.set(focus.x, 0, focus.z);
    world.controls.update();
    window.advanceTime(180);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT}/restored-specialized-districts.png` });
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify(audit, null, 2));
} finally {
  await browser.close();
}
