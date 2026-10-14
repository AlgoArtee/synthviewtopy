import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
const page=await browser.newPage();await page.goto('http://127.0.0.1:5178/north-city.html');
const result=await page.evaluate(async()=>{
const THREE=await import('/node_modules/three/build/three.module.js');
const {createCityNavigation,cityFloorHeight,CITY_BED}=await import('/src/apartments/osCityNavigation.ts');
const failures=[];const assert={equal:(a,b,m)=>{if(a!==b)failures.push(m??`${a} !== ${b}`);},ok:(v,m)=>{if(!v)failures.push(m??'Expected truthy');}};
// The new terrace is beyond the bedroom wall; include that physical divider in this isolated navigation check.
const partition=new THREE.Box3(new THREE.Vector3(CITY_BED.maxX,0,CITY_BED.minZ),new THREE.Vector3(CITY_BED.maxX+.13,3.5,-.15));
const nav=createCityNavigation([partition]),p=new THREE.Vector3(-2.22,1.65,-.35),zero=new THREE.Vector3(),north=new THREE.Vector3(0,0,-1),south=new THREE.Vector3(0,0,1);
const step=(d,n,jump=false)=>{for(let i=0;i<n;i++)nav.step(p,d,1/60,jump,false);};
nav.reset(p);step(north,90);assert.equal(cityFloorHeight(p.x,p.z),0,'bed cannot be walked through before climbing');
step(zero,50,true);assert.equal(nav.snapshot().mode,'on-bed');assert.ok(Math.abs(p.y-2.37)<.01);
step(north,600);assert.ok(p.z>=CITY_BED.minZ+.24-.001,'window remains solid');assert.ok(p.z<CITY_BED.minZ+.35,'entire deep bed is walkable');
step(new THREE.Vector3(-1,0,0),600);assert.ok(p.x>=CITY_BED.minX+.24-.001,'west wall remains solid');
step(new THREE.Vector3(1,0,0),600);assert.ok(p.x<=CITY_BED.maxX-.24+.001,'east wall remains solid');
p.set(-3,2.37,CITY_BED.minZ+.4);nav.reset(p);
step(south,260);step(zero,90);assert.equal(cityFloorHeight(p.x,p.z),0);assert.ok(Math.abs(p.y-1.65)<.001,'eye settles after releasing movement');
p.set(0,1.65,3);nav.reset(p);step(south,150);assert.ok(p.z>5.5&&p.z<=5.91,'expanded living area walkable with south boundary');
p.set(2.85,1.65,.7);nav.reset(p);step(north,180);assert.ok(p.z<-4,'Balcony footprint connects continuously through doorway');
p.set(.2,1.65,-4.4);nav.reset(p);step(north,70);assert.ok(p.z<-6.5,'North terrace is walkable around bathroom');
p.set(-3,2.37,-2);nav.reset(p);assert.equal(nav.snapshot().mode,'on-bed');
return {failures,bedSize:[CITY_BED.width,CITY_BED.depth]};
});assert.deepEqual(result.failures,[]);assert.deepEqual(result.bedSize,[8.55,8.55]);console.log('PASS: 8.55m square bed, deliberate climb, complete elevated traversal, three wall stops, step down, living room and alcove footprint');
}finally{await browser.close();}

