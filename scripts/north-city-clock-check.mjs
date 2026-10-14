import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual room update/frame functions with inert scene objects.
// This exercises frame timing without substituting advanceTime for real frames.
const path = 'src/apartments/room.ts';
const source = await readFile(path, 'utf8');
const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const nodes = [];
function visit(node) { nodes.push(node); ts.forEachChild(node, visit); }
visit(ast);
const namedFunction = name => nodes.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
const loop = nodes.find(n => ts.isCallExpression(n) && n.expression.getText(ast) === 'renderer.setAnimationLoop' && ts.isArrowFunction(n.arguments[0]));
const preference = nodes.find(n => ts.isVariableDeclaration(n) && n.name.getText(ast) === 'motionPreference');
const visibility = nodes.find(n => ts.isCallExpression(n) && n.expression.getText(ast) === 'document.addEventListener' && n.arguments[0]?.getText(ast) === "'visibilitychange'" && n.arguments[1]?.getText(ast) === 'resetFrameClock');
for (const [name, node] of Object.entries({ update: namedFunction('update'), resetFrameClock: namedFunction('resetFrameClock'), loop, preference, visibility })) assert.ok(node, `Missing actual room ${name}`);
const compile = code => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
let checks = 0;
function near(actual, expected, label) { assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`); checks++; }
function createClock(isCity, reduced) {
  const media = { matches: reduced }, listeners = {}, calls = [];
  const context = {
    matchMedia: () => media, document: { hidden: false, addEventListener: (name, handler) => { listeners[name] = handler; } },
    room: { update: time => calls.push(time) }, sky: null, citySound: null,
    keys: new Set(), menu: { hidden: true }, camera: { position: { x: 0, y: 1.65, z: 0 } },
    direction: { set() {}, normalize() {} }, refreshBalconyDoor() {}, rendering: { render() {} },
  };
  vm.createContext(context);
  vm.runInContext(compile(`
    const isCity = ${isCity};
    let elapsed = 0, lastFrameSeconds = 0, lastNavigationStepSeconds = 0, previous: number | null = null;
    const ${preference.getText(ast)};
    ${namedFunction('update').getText(ast)}
    ${namedFunction('resetFrameClock').getText(ast)}
    ${visibility.getText(ast)};
    const frame = ${loop.arguments[0].getText(ast)};
    globalThis.clock = { frame, snapshot: () => ({elapsed, lastFrameSeconds, lastNavigationStepSeconds}) };
  `), context);
  return {
    ...context.clock, media, calls,
    setHidden(hidden) { context.document.hidden = hidden; listeners.visibilitychange(); },
  };
}

const city = createClock(true, true);
city.frame(0); city.frame(200);
near(city.calls.at(-1), .2, 'City clock is not pinned to zero when reduction was enabled at startup');
city.media.matches = false;
city.frame(400);
near(city.calls.at(-1), .4, 'City clock resumes normal subsystem timing after the live preference changes');
city.media.matches = true;
city.frame(600);
near(city.calls.at(-1), .6, 'City time stays monotonic while individual systems apply reduced motion');

const slowCity = createClock(true, false);
slowCity.frame(1000);
for (let frame = 1; frame <= 5; frame++) slowCity.frame(1000 + frame * 200);
near(slowCity.snapshot().elapsed, 1, 'Five FPS preserves one second of ambient wall time');
near(slowCity.snapshot().lastNavigationStepSeconds, .05, 'Navigation still uses a bounded collision step');
near(slowCity.snapshot().lastFrameSeconds, .2, 'Diagnostics retain the real frame interval');
slowCity.setHidden(true);
slowCity.frame(10000);
near(slowCity.snapshot().elapsed, 1, 'Hidden frames do not advance the scene');
slowCity.setHidden(false);
slowCity.frame(60000);
near(slowCity.snapshot().elapsed, 1, 'First resumed frame excludes hidden wall time');
slowCity.frame(60200);
near(slowCity.snapshot().elapsed, 1.2, 'Normal ambient time continues after resume');
// Browsers can suspend animation callbacks entirely while hidden.
slowCity.setHidden(true); slowCity.setHidden(false); slowCity.frame(120000);
near(slowCity.snapshot().elapsed, 1.2, 'Visibility events also reset time when no hidden frame was delivered');

const otherRoom = createClock(false, true);
otherRoom.frame(0); otherRoom.frame(200);
near(otherRoom.calls.at(-1), 0, 'Non-city room animation retains reduced-motion freeze');
near(otherRoom.snapshot().elapsed, .05, 'Non-city rooms retain their previous capped timing');
otherRoom.media.matches = false; otherRoom.frame(400);
near(otherRoom.calls.at(-1), .1, 'Non-city rooms observe a live preference change');
otherRoom.media.matches = true; otherRoom.frame(600);
near(otherRoom.calls.at(-1), 0, 'Non-city rooms pause again when reduced motion returns');

const output = 'test-artifacts/north-city/revision-25/clock';
await mkdir(output, { recursive: true });
const result = { result: 'PASS', checks, source: path, sourceSha256: createHash('sha256').update(source).digest('hex'),
  method: 'AST-extracted actual update and renderer frame callback with inert room/navigation objects',
  scenarios: ['initial reduced motion and live changes', 'five FPS ambient wall-time clock', 'capped navigation delta', 'hidden/resume with and without hidden animation callbacks', 'non-city reduced-motion behavior'] };
await writeFile(`${output}/validation.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
