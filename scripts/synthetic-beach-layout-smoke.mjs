import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Focused geometry contract checks; rendering/navigation integration has its own
// browser smoke. Bundle real TS sources in memory, leaving the workspace clean.
const bundled = await build({
  stdin: {
    contents: `export * from './src/world/syntheticBeachLayout'; export * as THREE from 'three'; export { createSyntheticPier, disposeSyntheticPier } from './src/world/syntheticPier'; export { ISLAND_RADIUS } from './src/config/island';`,
    loader: 'ts', sourcefile: 'synthetic-beach-layout-fixture.ts', resolveDir: resolve('.'),
  },
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
});
const layout = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const { THREE, BEACH_COAST_POINTS: points, BEACH_COAST_LENGTHS: lengths, sampleBeachCoast, beachToScene, sceneToBeach, isBeachLandward } = layout;
const checks = [];
const check = (condition, label) => { assert(condition, label); checks.push(label); };
const scratch = { distance: 0, along: 0, normalX: 0, normalZ: 0 };
const mapped = { x: 0, z: 0 };
const roundTrip = { x: 0, z: 0 };
const close = (a, b, tolerance = 1e-7) => Math.abs(a - b) <= tolerance;

for (const [x, z] of [[0, 0], [0, -19], [-29, layout.beachSeawallZ(-29)], [29, layout.beachSeawallZ(29)], [-8.5, -20.5], [8.5, -20.5]]) {
  check(beachToScene(x, z, mapped) === mapped, 'Mapping reuses caller storage');
  check(sceneToBeach(mapped.x, mapped.z, roundTrip) === roundTrip && close(roundTrip.x, x) && close(roundTrip.z, z), 'Canonical/immersive mapping round trips');
}
beachToScene(0, -19, mapped);
check(close(mapped.x, 42) && close(mapped.z, -4), 'Central shallow shore aligns with the immersive pier');
check(layout.BEACH_OUTER_CURVES.length === 6 && points.length === 770, 'Only the six exposed curves enter the coast field');
check(lengths[0] === 0 && lengths.every((value, index) => index === 0 || value > lengths[index - 1]), 'Coast arclength is continuous and ordered west to east');

let maxContourError = 0;
let maxNormalError = 0;
for (let i = 2; i < lengths.length - 2; i += 5) {
  const x = points[i * 2];
  const z = points[i * 2 + 1];
  check(sampleBeachCoast(x, z, scratch) === scratch, 'Coast sampler reuses caller storage');
  maxContourError = Math.max(maxContourError, Math.abs(scratch.distance));
  maxNormalError = Math.max(maxNormalError, Math.abs(Math.hypot(scratch.normalX, scratch.normalZ) - 1));
  const nx = scratch.normalX;
  const nz = scratch.normalZ;
  const outward = sampleBeachCoast(x + nx, z + nz).distance;
  const inward = sampleBeachCoast(x - nx, z - nz).distance;
  check(outward > 0.9 && inward < -0.9, 'Signed coast distance agrees with outward normals around both wings');
  const tangentX = -nz;
  const tangentZ = nx;
  const before = sampleBeachCoast(x - tangentX * 0.2, z - tangentZ * 0.2).along;
  const after = sampleBeachCoast(x + tangentX * 0.2, z + tangentZ * 0.2).along;
  check(after > before, 'Increasing along follows tangent (-normalZ, normalX)');
}
check(maxContourError < 1e-8 && maxNormalError < 1e-10, 'Exposed polyline lies on the zero contour with unit normals');

const dryPoints = [];
for (const [x, z] of [[-8, -17], [0, -17], [8, -17], [-20, -12], [20, -12], [-3.8, -10.59], [-15, -10.67], [4.33, -8.33]]) {
  beachToScene(x, z, mapped);
  const sample = sampleBeachCoast(mapped.x, mapped.z);
  dryPoints.push({ local: [x, z], scene: [mapped.x, mapped.z], distance: sample.distance });
  check(sample.distance < -1, 'Stairs, both beach wings, under-pier route, club and house lie inland of the surf');
}
for (const side of [-1, 1]) {
  beachToScene(side * 33, -4, mapped);
  const sample = sampleBeachCoast(mapped.x, mapped.z);
  check(sample.distance > 10 && sample.normalX * side > 0.8, 'Water outside a rounded side has positive distance and an outward lateral normal');
}
for (const x of [-18, 0, 18]) {
  beachToScene(x, layout.beachSeawallZ(x) + 0.05, mapped);
  check(isBeachLandward(mapped.x, mapped.z) && sampleBeachCoast(mapped.x, mapped.z).distance < -20, 'Island joins do not become zero-distance swash contours');
}
beachToScene(0, -26, mapped);
check(sampleBeachCoast(mapped.x, mapped.z).distance > 40, 'Open ocean remains positive beyond the shallow central dip');

// Compare field sign against a separately triangulated canonical Shape, not a
// second copy of the sampler's ray-crossing implementation.
const geometry = new THREE.ShapeGeometry(layout.createBeachPerimeter(), 64);
geometry.rotateX(Math.PI / 2);
geometry.scale(layout.BEACH_SCALE, 1, layout.BEACH_SCALE);
geometry.translate(layout.BEACH_ORIGIN_X, 0, layout.BEACH_ORIGIN_Z);
const surface = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const mesh = new THREE.Mesh(geometry, surface);
mesh.updateMatrixWorld(true);
const ray = new THREE.Raycaster();
let polygonProbes = 0;
for (let x = -34; x <= 34; x += 2) {
  for (let z = -25; z <= 20; z += 2.5) {
    beachToScene(x, z, mapped);
    const sample = sampleBeachCoast(mapped.x, mapped.z);
    if (isBeachLandward(mapped.x, mapped.z) || Math.abs(sample.distance) < 0.15) continue;
    ray.set(new THREE.Vector3(mapped.x, 2, mapped.z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(mesh).length > 0;
    check(hit === (sample.distance < 0), 'Signed coast agrees with the triangulated canonical beach');
    polygonProbes += 1;
  }
}
geometry.dispose();
surface.dispose();

const pier = layout.createSyntheticPier();
const sand = pier.getObjectByName('SYNTHETIC_PIER__SILVER_SHORE_APRON');
const vertices = sand.geometry.getAttribute('position');
let mainContourProbes = 0;
let maxMainContourError = 0;
for (let i = 14 * 193; i < vertices.count; i += 1) {
  const x = vertices.getX(i);
  const z = vertices.getZ(i) + layout.ISLAND_RADIUS;
  if (Math.abs(z - layout.beachSeawallZ(x)) < 0.05) continue;
  beachToScene(x, z, mapped);
  const distance = Math.abs(sampleBeachCoast(mapped.x, mapped.z).distance);
  maxMainContourError = Math.max(maxMainContourError, distance);
  mainContourProbes += 1;
}
layout.disposeSyntheticPier(pier);
check(mainContourProbes > 100 && maxMainContourError < 0.035, 'Campus outer mesh maps onto the immersive coast within 3.5 cm');

const started = performance.now();
for (let z = 0; z < 128; z++) {
  for (let x = 0; x < 128; x++) {
    sampleBeachCoast(-200 + 484 * x / 127, -180 + 440 * z / 127, scratch);
  }
}
const result = { status: 'passed', checks: checks.length, polygonProbes, mainContourProbes, maxContourError, maxMainContourError, maxNormalError, dryPoints, coastLengthMetres: layout.BEACH_COAST_LENGTH, sample16384Milliseconds: Math.round(performance.now() - started) };
await mkdir('output/playwright/synthetic-beach-layout', { recursive: true });
await writeFile('output/playwright/synthetic-beach-layout/results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
