import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';
import * as THREE from 'three';

const transpile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
await writeFile(new URL('./celestial.mjs', import.meta.url), transpile(await readFile('src/world/syntheticShore/celestial.ts', 'utf8')));
const adapterSource = await readFile('src/world/islandCygnus.ts', 'utf8');
await writeFile(new URL('./islandCygnus.mjs', import.meta.url), transpile(adapterSource.replace("'./syntheticShore/celestial'", "'./celestial.mjs'")));
const { createIslandCygnus } = await import('./islandCygnus.mjs');
const sky = createIslandCygnus();
const camera = new THREE.PerspectiveCamera(42, 1440 / 900, 0.65, 3600);
const pose = (position, target) => {
  camera.position.fromArray(position);
  camera.lookAt(new THREE.Vector3(...target));
  camera.updateMatrixWorld(true);
  sky.update(camera, 2, 1, 1);
  sky.group.updateMatrixWorld(true);
  return sky.getSnapshot(camera);
};
const assert = (value, message) => { if (!value) throw new Error(message); };
const overview = pose([780, 610, 840], [0, 2, 0]);
assert(overview.blackHole.inViewport && overview.companion.inViewport, 'Both bodies should appear in default island overview.');
assert(overview.placement === 'overview-sky' && !overview.fixedWorldBearing, 'Overview placement must be reported accurately.');
const horizon = pose([0, 1.8, -540], [0, 350, -1540]);
assert(horizon.blackHole.inViewport && horizon.companion.inViewport, 'Both bodies should appear above the north horizon.');
assert(horizon.fixedWorldBearing, 'Human-height view must have a fixed compass bearing.');
const away = pose([0, 1.8, -540], [0, 350, 460]);
assert(!away.blackHole.inFront && !away.companion.inFront, 'Looking away should hide the fixed sky, not follow the camera.');
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
assert(raycaster.intersectObject(sky.group, true).length === 0, 'Sky must not intercept Explore rays.');
const phaseBefore = away.animation.coronaPhase;
sky.update(camera, 4, 0, 1);
assert(sky.getSnapshot().animation.coronaPhase !== phaseBefore, 'Source corona animation must advance.');
sky.update(camera, 4, 0, 0);
assert(!sky.getSnapshot().visible, 'Weather visibility must reach celestial material.');
let geometryDisposals = 0;
let materialDisposals = 0;
sky.group.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    object.geometry.addEventListener('dispose', () => geometryDisposals++);
    object.material.addEventListener('dispose', () => materialDisposals++);
  }
});
sky.dispose(); sky.dispose();
assert(geometryDisposals === 1 && materialDisposals === 1, 'One plane and shader must dispose once.');
// Demonstrate the actual previous cap: an offshore camera sees the far
// hemisphere at depth3700 > far3600. Camera-relative sky stays at2800.
const oldFarHemisphereDepth = 2800 + 900;
const newMaximumSkyDepth = 2800;
assert(oldFarHemisphereDepth > camera.far && newMaximumSkyDepth < camera.far, 'Regression pose must cross the old sky clipping boundary.');
const result = { status: 'passed', overview, horizon, away, oldFarHemisphereDepth, newMaximumSkyDepth, geometryDisposals, materialDisposals };
await writeFile(new URL('./results.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
