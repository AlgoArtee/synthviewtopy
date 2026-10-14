import assert from 'node:assert/strict';
import * as THREE from 'three';
import ts from 'typescript';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const sources=['src/apartments/osCityCamera.ts','src/apartments/osCityLayout.ts'];
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const codes=await Promise.all(sources.map(p=>readFile(p,'utf8'))),layout=url(transpile(codes[1]));
const code=transpile(codes[0]).replace("'three'",JSON.stringify(pathToFileURL(resolve('node_modules/three/build/three.module.js')).href)).replace("'./osCityLayout'",JSON.stringify(layout));
const {applyCityCameraProjection}=await import(url(code));let checks=0,maxDrift=0,maxAimError=0;
const close=(actual,expected,tolerance=1e-8)=>{assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);checks++;};
for(const aspect of [390/844,1,951/892,16/9,21/9])for(const fov of [38,62,82])for(const yaw of [-2.24,-Math.PI/2,-.93])for(const pitch of [-.35,-.309,0,.129,.35]){
 const camera=new THREE.PerspectiveCamera(fov,aspect,.08,450);camera.position.set(3.8,1.65,-4.76);applyCityCameraProjection(camera,yaw,pitch);camera.updateMatrixWorld(true);
 const aim=new THREE.Vector3(0,0,-40).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ')).add(camera.position).project(camera);
 maxAimError=Math.max(maxAimError,Math.abs(aim.x),Math.abs(aim.y));close(aim.x,0);close(aim.y,0);
 const origin=new THREE.Vector3(6,-12,-50).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(camera.position),lower=origin.clone().project(camera),upper=origin.clone().add(new THREE.Vector3(0,20,0)).project(camera);
 const drift=Math.abs(upper.x-lower.x);maxDrift=Math.max(maxDrift,drift);close(drift,0);close(camera.rotation.z,0);
 const identity=camera.projectionMatrix.clone().multiply(camera.projectionMatrixInverse).elements;for(let i=0;i<16;i++)close(identity[i],i%5===0?1:0);
}
const camera=new THREE.PerspectiveCamera(62,951/892,.08,450);camera.position.set(-2.18,1.65,3.7);
for(const pitch of [-1.25,-.31,.4,1.25]){applyCityCameraProjection(camera,-1.5,pitch);close(camera.rotation.x,pitch);close(camera.projectionMatrix.elements[9],0);}
camera.position.set(3.8,1.65,-4.76);
for(const pitch of [-1.25,-.7,.7,1.25]){applyCityCameraProjection(camera,-1.5,pitch);close(camera.rotation.x,pitch);close(camera.projectionMatrix.elements[9],0);}
const doorway=[];for(const z of [-.15,-.30,-.60,-.9]){camera.position.z=z;doorway.push(applyCityCameraProjection(camera,-1.5,-.31).correction);}
assert.ok(doorway[0]===0&&doorway[3]===1&&doorway.every((n,i)=>!i||n>=doorway[i-1]));checks++;
const output='test-artifacts/north-city/revision-28/camera';await mkdir(output,{recursive:true});
await writeFile(`${output}/validation.json`,JSON.stringify({pass:true,checks,maxDrift,maxAimError,doorway,sourceHashes:Object.fromEntries(sources.map((p,i)=>[p,createHash('sha256').update(codes[i]).digest('hex')])),scope:'Native projection geometry: architectural verticals, requested aim, inverse projection, five aspect ratios, three zoom levels, normal interiors, steep free look, smooth doorway transition'},null,2));console.log(JSON.stringify({pass:true,checks,maxDrift,maxAimError}));
