import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const output=process.env.CITY_GEOMETRY_OUTPUT??'test-artifacts/north-city/revision-34/geometry';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();await page.route('**/guardrail-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Balcony navigation and circuit clearance</body>'}));await page.goto('http://127.0.0.1:5178/guardrail-check');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),{createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
  const room=createOsCityApartment(),scene=room.scene;scene.updateMatrixWorld(true);const checks=[];
  const check=(passed,description,evidence)=>checks.push({passed,description,evidence});
  const p=new THREE.Vector3(),nav=room.navigation,reset=(x,z)=>{p.set(x,1.65,z);nav.reset(p);},step=(x,z,dt,n)=>{const d=new THREE.Vector3(x,0,z).normalize();for(let i=0;i<n;i++)nav.step(p,d,dt,false,false);};
  const approaches=[];
  for(const dt of [1/144,1/60,1/20]){
   reset(3.8,-5);step(1,0,dt,Math.ceil(4/dt));const east=p.toArray();check(p.x>4.779&&p.x<=4.78,'East rail reached and contained at dt '+dt,east);
   step(0,-1,dt,Math.ceil(6/dt));const corner=p.toArray();check(p.z>=-9.44&&p.z< -9.439&&p.x<=4.78,'North/east corner remains contained at dt '+dt,corner);
   step(1,-1,dt,Math.ceil(8/dt));check(p.x<=4.78&&p.z>=-9.44,'Sustained diagonal input cannot leave balcony at dt '+dt,p.toArray());
   step(-1,0,dt,Math.ceil(.7/dt));check(p.x<3.3,'Can retreat and slide along the rail at dt '+dt,p.toArray());approaches.push({dt,east,corner});
  }
  reset(2.5,-2);step(-1,0,1/60,150);check(p.x>=1.86&&p.x<1.87,'Bathroom wall retains 24cm body clearance',p.toArray());
  reset(0,-6);step(-1,0,1/60,150);check(p.x>=-.88&&p.x<-.879,'Bedroom wall retains body clearance',p.toArray());
  reset(2.85,.7);step(0,-1,1/60,150);check(p.z< -4,'Normal doorway route reaches balcony',p.toArray());step(0,1,1/60,150);check(p.z>.65,'Normal doorway route returns indoors',p.toArray());
  const opaque=[];scene.traverse(o=>{let visible=true;for(let a=o;a;a=a.parent)visible&&=a.visible;if(o.isMesh&&!o.isInstancedMesh&&visible&&!o.material.transparent)opaque.push(o);});
  const rays=[],ray=new THREE.Raycaster(),origin=new THREE.Vector3(4.779,1.65,-5);
  for(let lane=0;lane<13;lane++)for(const x of [11,15,19]){
   const side=-3.9+lane*.61,z=-5+1.3*(-side-Math.sign(side||1)*4),target=new THREE.Vector3(x,-37.93,z);ray.set(origin,target.clone().sub(origin).normalize());ray.far=origin.distanceTo(target)+.1;
   const hit=ray.intersectObjects(opaque,false)[0],sample={lane,x,z,firstHit:hit?.object.name,material:hit?.object.material.name,point:hit?.point.toArray()};rays.push(sample);
   check(hit?.object.material.name.includes('circuitry')&&Math.abs(hit.point.y+37.93)<.002,'Near circuit visible from guardrail: lane '+lane+' at x '+x,sample);
  }
  const supports=[];
  for(const [x,z] of [[11.4,-14.1],[18.5,-30.2]])for(const dx of [-3,0,3]){
   const origin=new THREE.Vector3(x-2.525+dx,-34.65,z-6.46);ray.set(origin,new THREE.Vector3(0,-1,0));ray.far=.15;const hit=ray.intersectObjects(opaque,false)[0];supports.push(hit?.point.toArray());check(hit&&Math.abs(hit.point.y+34.71)<.002,'Lateral building retains podium support '+[x,z,dx],hit?.point.toArray());
  }
  return{checks,approaches,rays,supports};
 });await writeFile(output+'/results.json',JSON.stringify(result,null,2));assert.ok(result.checks.every(c=>c.passed),JSON.stringify(result.checks.filter(c=>!c.passed)));console.log(JSON.stringify({pass:true,checks:result.checks.length,output}));
}finally{await browser.close();}
