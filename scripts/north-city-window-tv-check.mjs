import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const source = 'src/apartments/osCityWindowTv.ts', code = await fs.readFile(source, 'utf8');
const javascript = ts.transpileModule(code.replace("'three'", JSON.stringify(import.meta.resolve('three'))), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { isCityTvWindow, sampleCityWindowTv, createCityWindowTv, CITY_TV_STRENGTH } = await import('data:text/javascript;base64,' + Buffer.from(javascript).toString('base64'));
let selected = 0, samples = 0;
for (let id = 0; id < 100000; id++) if (isCityTvWindow(id)) selected++;
assert.equal(selected, 40000, 'Requested coverage is 40% of all eligible window IDs');
for (let id = 0; id < 100; id++) {
  const values = new Set(), shadowPositions = new Set();
  for (let frame = 0; frame <= 600; frame++) {
    const value = sampleCityWindowTv(id, frame / 10);
    assert.ok(value.light >= .06 && value.light <= 2.46);
    assert.ok(value.shadowX >= .12 && value.shadowX <= .88);
    assert.ok(value.shadowY >= .395 && value.shadowY <= .545);
    assert.ok(value.color.every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 1));
    assert.deepEqual(value, sampleCityWindowTv(id, frame / 10), 'Timing is repeatable');
    assert.deepEqual(sampleCityWindowTv(id, frame / 10, true), sampleCityWindowTv(id, 0, true), 'Reduced motion is steady');
    values.add(value.light); shadowPositions.add(value.shadowX); samples++;
  }
  assert.ok(values.size > 50 && shadowPositions.size > 100, 'Interior shadows change spatially, not only overall brightness');
}
assert.ok(CITY_TV_STRENGTH.day < CITY_TV_STRENGTH.morning && CITY_TV_STRENGTH.morning < CITY_TV_STRENGTH.night);

const tv = createCityWindowTv('contract'), base = new THREE.MeshStandardMaterial(), tagged = [];
for (let faceId = 0; faceId < 10; faceId++) tagged.push(tv.tagGeometry(new THREE.PlaneGeometry(8, 24), faceId, 'atlas').toNonIndexed());
const merged = mergeGeometries(tagged);
assert.equal(new Set(merged.getAttribute('cityTvFace').array).size, 10, 'Independent IDs survive merged geometry');
assert.equal(tv.snapshot().windowCount, 1920);
assert.ok(Math.abs(tv.snapshot().coverage-.4)<.025, 'TV percentage applies to illuminated rooms');
tv.tagGeometry(new THREE.PlaneGeometry(), 0, 'atlas', false);
assert.equal(tv.snapshot().windowCount, 1920, 'Existing localized overlays do not double-count windows');
let originalHookCalls = 0;
base.onBeforeCompile = shader => { originalHookCalls++; shader.uniforms.existingAtmosphere = { value: 1 }; };
const inPlace = tv.material(base, 'atlas', true);
assert.equal(inPlace, base, 'Existing animated material bindings are retained');
const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
inPlace.onBeforeCompile(shader, {});
assert.equal(originalHookCalls, 1);
assert.equal(shader.uniforms.existingAtmosphere.value, 1, 'Existing atmosphere hook survives TV augmentation');
tv.update(10, false, 'night'); assert.equal(shader.uniforms.cityTvTime.value, 10);
tv.update(100, true, 'night'); assert.equal(shader.uniforms.cityTvTime.value, 0);
const stable = tv.snapshot().samples;
tv.update(200, true, 'night'); assert.deepEqual(tv.snapshot().samples, stable);
const output = 'test-artifacts/north-city/revision-26/helper'; await fs.mkdir(output, { recursive: true });
await fs.writeFile(`${output}/validation.json`, JSON.stringify({ pass: true, source, sourceSha256: crypto.createHash('sha256').update(code).digest('hex'), coverage: { windows: 100000, selected, fraction: selected / 100000 }, samples, scope: 'Coverage, deterministic bounded spatial TV motion, reduced motion, merged geometry IDs and existing shader-hook preservation; rendered visibility is separate.' }, null, 2));
console.log(JSON.stringify({ pass: true, selected, windows: 100000, samples }));
