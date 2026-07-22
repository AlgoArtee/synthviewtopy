import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH
    ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(600_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getProductionExportPlan));
  await page.waitForTimeout(900);

  const audit = await page.evaluate(async () => {
    const world = window.labIsland;
    const plan = world.getProductionExportPlan();
    const initialStreaming = world.getStreamingSnapshot();
    const initialLibraryMounted = world.getStreamingSnapshot().cerebrumExternum.mounted;
    const files = [];
    const progress = [];
    let duringStreaming = null;
    let manifest = null;
    let districtRoot = null;
    let lightingSun = null;
    let blenderScript = null;

    const readGlbJson = async (blob) => {
      const header = new Uint8Array(await blob.slice(0, 20).arrayBuffer());
      const view = new DataView(header.buffer);
      const jsonLength = view.getUint32(12, true);
      const json = new Uint8Array(await blob.slice(20, 20 + jsonLength).arrayBuffer());
      return JSON.parse(new TextDecoder().decode(json).trim());
    };

    const summary = await world.exportProductionPackage(async (path, blob) => {
      const record = { path, size: blob.size, glb: path.endsWith('.glb') };
      if (record.glb) {
        const magic = new TextDecoder().decode(new Uint8Array(await blob.slice(0, 4).arrayBuffer()));
        record.magic = magic;
        if (path.includes('04_districts/01_')) {
          const gltf = await readGlbJson(blob);
          districtRoot = gltf.nodes.find((node) => node.name?.startsWith('YOUTOPY_PRODUCTION__')) ?? null;
        } else if (path.endsWith('YouTopy_Global_Lighting.glb')) {
          const gltf = await readGlbJson(blob);
          lightingSun = gltf.nodes.find((node) => node.name === 'YouTopy Production Sun') ?? null;
        }
      } else if (path === '00_PRODUCTION_MANIFEST.json') {
        manifest = JSON.parse(await blob.text());
      } else if (path === 'import_youtopy_production.py') {
        blenderScript = await blob.text();
      }
      files.push(record);
      if (!duringStreaming && record.glb) duringStreaming = world.getStreamingSnapshot();
    }, (entry) => {
      progress.push({ completed: entry.completed, total: entry.total, phase: entry.phase });
    });

    return {
      plan,
      summary,
      files,
      progress,
      manifest,
      districtRoot,
      lightingSun,
      blenderScript,
      initialStreaming,
      duringStreaming,
      finalStreaming: world.getStreamingSnapshot(),
      initialLibraryMounted,
      finalLibraryMounted: world.getStreamingSnapshot().cerebrumExternum.mounted,
    };
  });

  assert.equal(audit.plan.filter((entry) => entry.kind === 'district').length, 35);
  assert.equal(audit.plan.filter((entry) => entry.kind === 'dome').length, 6);
  assert.equal(audit.plan.filter((entry) => entry.kind === 'bridge').length, 1);
  assert.equal(audit.plan.filter((entry) => entry.kind === 'city').length, 1);
  assert.equal(audit.plan.length, 47);
  assert.equal(new Set(audit.plan.map((entry) => entry.path)).size, audit.plan.length);
  assert.equal(audit.summary.schema, 'youtopy.blender-production/1.0');
  assert.equal(audit.summary.assetCount, audit.plan.length);
  assert.equal(audit.files.length, audit.plan.length + 4);
  assert.ok(audit.files.filter((file) => file.glb).every((file) => file.size > 500 && file.magic === 'glTF'));
  assert.equal(audit.manifest.assetCount, audit.plan.length);
  assert.equal(audit.manifest.completeness.districts.exported, 35);
  assert.equal(audit.manifest.completeness.domes.exported, 6);
  assert.equal(audit.manifest.completeness.streamedDetailPackagesLoaded, 41);
  assert.equal(audit.manifest.units.exported, 'metres');
  assert.equal(audit.manifest.units.blenderScale, 1);
  assert.equal(audit.districtRoot.extras.exportedUnits, 'metres');
  assert.ok(audit.districtRoot.scale.every((value) => Math.abs(value - 10) < 1e-6));
  assert.equal(audit.lightingSun.rotation.length, 4);
  assert.ok(audit.lightingSun.rotation.some((value, index) => Math.abs(value - [0, 0, 0, 1][index]) > 1e-6));
  assert.equal(audit.duringStreaming.residentDetailPackages.length, 41);
  assert.equal(audit.duringStreaming.proxyPackageCount, 0);
  assert.deepEqual(audit.finalStreaming.residentDetailPackages, audit.initialStreaming.residentDetailPackages);
  assert.equal(audit.finalStreaming.proxyPackageCount, audit.initialStreaming.proxyPackageCount);
  assert.equal(audit.finalLibraryMounted, audit.initialLibraryMounted);
  assert.ok(audit.progress.some((entry) => entry.phase === 'loading'));
  assert.ok(audit.progress.some((entry) => entry.phase === 'finalizing'));
  const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
  const pythonSyntax = spawnSync(
    pythonCommand,
    [...(process.platform === 'win32' ? ['-3'] : []), '-c', 'import sys; compile(sys.stdin.read(), "import_youtopy_production.py", "exec")'],
    { input: audit.blenderScript, encoding: 'utf8' },
  );
  assert.equal(pythonSyntax.status, 0, pythonSyntax.stderr);
  assert.deepEqual(errors, []);

  console.log(JSON.stringify({
    assets: audit.summary.assetCount,
    districts: audit.manifest.completeness.districts,
    domes: audit.manifest.completeness.domes,
    totalBytes: audit.summary.totalBytes,
    streamedPackagesDuringExport: audit.duringStreaming.residentDetailPackages.length,
    streamingRestored: true,
    metresBaked: audit.districtRoot.scale,
  }, null, 2));
} finally {
  await browser.close();
}
