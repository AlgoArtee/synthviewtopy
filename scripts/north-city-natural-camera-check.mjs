import assert from 'node:assert/strict';
import * as THREE from 'three';
import ts from 'typescript';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const output='test-artifacts/north-city/revision-41';await mkdir(output,{recursive:true});
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const layout=url(transpile(await readFile('src/apartments/osCityLayout.ts','utf8')));
const load=async path=>import(url(transpile(await readFile(path,'utf8')).replace("'three'",JSON.stringify(pathToFileURL(resolve('node_modules/three/build/three.module.js')).href)).replace("'./osCityLayout'",JSON.stringify(layout))));
const {applyCityCameraProjection:apply}=await load('src/apartments/osCityCamera.ts');
const report={checks:[],samples:0,maxProjectionError:0,maxRayError:0};
const check=(condition,name,evidence)=>{report.checks.push({passed:!!condition,name,evidence});assert.ok(condition,name);};
const close=(a,b)=>Math.abs(a-b)<1e-9;
const positions=[[3.8,1.65,-5],[4.775,1.65,-5],[2.85,1.65,.3],[2.85,1.65,-.15],[2.85,1.65,-.3],[2.85,1.65,-.6],[2.85,1.65,-.9],[-2.18,1.65,3.7]];
let fixedEye=true,fixedLens=true,exactRotation=true,correctInverse=true;
for(const aspect of [390/844,1,1110/892,16/9,21/9])for(const fov of [38,62,82])for(const yaw of [-2.24,-Math.PI/2,-.93]){
 const camera=new THREE.PerspectiveCamera(fov,aspect,.08,700),reference=camera.clone(),baseline=camera.projectionMatrix.elements.slice();
 for(const position of positions)for(const pitch of [-1.25,-.9,-.701,-.7,-.55,-.381,-.38,-.25,0,.25,.38,.55,.7,.9,1.25]){
  camera.position.fromArray(position);apply(camera,yaw,pitch);camera.updateMatrixWorld(true);
  reference.position.fromArray(position);reference.rotation.set(pitch,yaw,0,'YXZ');reference.updateMatrixWorld(true);
  fixedEye&&=camera.position.toArray().every((v,i)=>close(v,position[i]));fixedLens&&=camera.fov===fov&&camera.projectionMatrix.elements.every((v,i)=>close(v,baseline[i]));
  exactRotation&&=close(camera.rotation.x,pitch)&&close(camera.rotation.y,yaw)&&camera.rotation.z===0;
  const inverse=camera.projectionMatrix.clone().multiply(camera.projectionMatrixInverse).elements;correctInverse&&=inverse.every((v,i)=>close(v,i%5===0?1:0));
  // Actual mall/plaza landmarks must project exactly like an ordinary pinhole camera.
  for(const p of [[88.6,-38,-30.75],[88.6,-4.4,20.75],[11,-37.93,-5],[62,-37.93,-5]]){
   const a=new THREE.Vector3(...p).project(camera),b=new THREE.Vector3(...p).project(reference);
   report.maxProjectionError=Math.max(report.maxProjectionError,a.distanceTo(b));
  }
  // Off-center picking rays must also match the rendered perspective, including mobile/zoom.
  for(const ndc of [[0,0],[.7,.6],[-.6,-.8]]){
   const a=new THREE.Raycaster(),b=new THREE.Raycaster();a.setFromCamera(new THREE.Vector2(...ndc),camera);b.setFromCamera(new THREE.Vector2(...ndc),reference);
   report.maxRayError=Math.max(report.maxRayError,a.ray.direction.distanceTo(b.ray.direction));
  }
  report.samples++;
 }
}
check(fixedEye,'Looking around never translates the eye');
check(fixedLens,'Projection/zoom stays constant across pitch, yaw and doorway location');
check(exactRotation,'Physical camera rotation matches requested look through the full range');
check(correctInverse,'Inverse projection stays consistent');
check(report.maxProjectionError<1e-8,'Plaza and mall landmarks match standard perspective at every angle',report.maxProjectionError);
check(report.maxRayError<1e-8,'Picking rays match the view at five aspect ratios and three zoom levels',report.maxRayError);
const camera=new THREE.PerspectiveCamera(62,1,.08,700);camera.position.set(3.8,1.65,-5);apply(camera,-1.5,-.4);
camera.fov=46;camera.aspect=390/844;camera.zoom=1.2;apply(camera,-1.5,-.4);
const ref=new THREE.PerspectiveCamera(46,390/844,.08,700);ref.zoom=1.2;ref.updateProjectionMatrix();
check(camera.projectionMatrix.elements.every((v,i)=>close(v,ref.projectionMatrix.elements[i])),'Zoom and resize refresh the projection even with unchanged look angles');
const gains=fn=>{let min=Infinity,max=-Infinity,last;const c=new THREE.PerspectiveCamera(62,1,.08,700);c.position.set(3.8,1.65,-5);for(let i=0;i<=2500;i++){const p=-1.25+i*.001;fn(c,-Math.PI/2,p);if(last!==undefined){const gain=(c.rotation.x-last)/.001;min=Math.min(min,gain);max=Math.max(max,gain);}last=c.rotation.x;}return{min,max};};
report.rotationGain=gains(apply);check(close(report.rotationGain.min,1)&&close(report.rotationGain.max,1),'Continuous up/down sweep has constant rotation response',report.rotationGain);
try{const old=await load(output+'/osCityCamera-before.ts');report.previousRotationGain=gains(old.applyCityCameraProjection);}catch(error){if(error.code!=='ENOENT')throw error;}
await writeFile(output+'/camera-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
