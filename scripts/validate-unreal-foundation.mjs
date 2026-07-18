import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const unrealProjectRoot = '../YouTopiaProgrammabilis';
const manifest = await readJson(`${unrealProjectRoot}/Bootstrap/world.manifest.json`);
const project = await readJson(`${unrealProjectRoot}/SynthViewTopy.uproject`);
const verticalSlice = await readJson(`${unrealProjectRoot}/Content/YouTopy/CerebrumExternum/VerticalSliceDefinition.json`);
const streamingHeader = await readFile(`${unrealProjectRoot}/Source/SynthViewTopy/Public/YTStreamingEntranceComponent.h`, 'utf8');
const streamingSource = await readFile(`${unrealProjectRoot}/Source/SynthViewTopy/Private/YTStreamingEntranceComponent.cpp`, 'utf8');
const importerSource = await readFile(
  `${unrealProjectRoot}/Plugins/SynthViewTopyMigration/Source/SynthViewTopyMigrationEditor/Private/YTBootstrapImportCommandlet.cpp`,
  'utf8',
);

assert.equal(project.EngineAssociation, '5.8');
assert.ok(project.Modules.some((module) => module.Name === 'SynthViewTopy' && module.Type === 'Runtime'));
assert.ok(project.Plugins.some((plugin) => plugin.Name === 'SynthViewTopyMigration' && plugin.Enabled));

assert.equal(manifest.schema, 'youtopy.unreal-world/1.0');
assert.equal(manifest.productionAuthority, 'unreal-editor');
assert.equal(manifest.sourceAuthority, 'web-sandbox');
assert.equal(manifest.importPolicy, 'bootstrap-only-no-roundtrip');
assert.equal(manifest.packages.length, 41);
assert.equal(manifest.entities.length, 55);
assert.equal(new Set(manifest.entities.map((entity) => entity.id)).size, manifest.entities.length);
assert.ok(manifest.entities.every((entity) => entity.source.disposition === 'bootstrap-placeholder-only'));
assert.ok(manifest.entities.every((entity) => entity.transform.unrealMatrixRowMajorCentimetres.length === 16));
assert.ok(manifest.entities.every((entity) => entity.entityType !== 'editor' && entity.entityType !== 'imported'));

const library = manifest.entities.find((entity) => entity.id === 'academic-building-ashcroft-grand-library');
assert.ok(library);
assert.equal(library.asset.stableActorName, 'YT_academic_building_ashcroft_grand_library');
assert.equal(library.streaming.levelInstance, 'LI_CerebrumExternum');
assert.deepEqual(library.streaming.dataLayers, manifest.dataLayers);
assert.equal(library.streaming.preloadDistanceMetres, 60);
assert.equal(library.streaming.unloadDistanceMetres, 90);
assert.equal(library.streaming.retentionSeconds, 15);

assert.equal(verticalSlice.stableBuildingId, library.id);
assert.equal(verticalSlice.rooms.length, 8);
assert.equal(verticalSlice.streaming.maximumResidentFullInteriors, 1);
assert.equal(verticalSlice.streaming.maximumAdjacentPreloads, 1);
assert.deepEqual(verticalSlice.streaming.dataLayers, manifest.dataLayers);

for (const phase of ['Unloaded', 'Preloading', 'Loaded', 'Active', 'Retention']) {
  assert.ok(streamingHeader.includes(phase), `Missing streaming phase ${phase}`);
}
for (const layer of manifest.dataLayers) {
  assert.ok(streamingHeader.includes(`${layer}Layer`), `Missing C++ Data Layer property ${layer}`);
}
assert.ok(streamingSource.includes('UDataLayerManager::GetDataLayerManager'));
assert.ok(streamingSource.includes('SetDataLayerRuntimeState'));
assert.ok(streamingSource.includes('LoadLevelInstanceBySoftObjectPtr'));
assert.ok(importerSource.includes('bootstrap-only-no-roundtrip'));
assert.ok(importerSource.includes('ImportAssetTasks'));

const blenderFixture = await stat('output/blender-pipeline/self-test.glb');
assert.ok(blenderFixture.size > 500, 'Blender pipeline fixture GLB is unexpectedly small');

console.log(JSON.stringify({
  engineAssociation: project.EngineAssociation,
  packages: manifest.packages.length,
  entities: manifest.entities.length,
  dataLayers: manifest.dataLayers,
  rooms: verticalSlice.rooms.length,
  blenderFixtureBytes: blenderFixture.size,
  authorityPolicy: manifest.importPolicy,
}, null, 2));
