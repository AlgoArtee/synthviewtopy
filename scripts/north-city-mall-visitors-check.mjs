import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-39';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();await page.route('**/mall-visitor-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Mall visitor and market placement check</body>'}));await page.goto('http://127.0.0.1:5178/mall-visitor-check');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {createOsCityMall}=await import('/src/apartments/osCityMall.ts'),{createCityNeonAtmosphere}=await import('/src/apartments/osCityNeonAtmosphere.ts');
  const mall=createOsCityMall(createCityNeonAtmosphere('Visitor checks')),checks=[],check=(passed,name,evidence)=>checks.push({passed,name,evidence});
  const initial=mall.snapshot();mall.setStreamSpeed(0);mall.update(2);const moving=mall.snapshot();
  check(moving.visitorCount===106&&moving.visitors.lanes.length===31,'All 106 visitors use the ten floors and entrance');
  check(moving.visitors.positions.every((p,i)=>Math.hypot(p[0]-initial.visitors.positions[i][0],p[2]-initial.visitors.positions[i][2])>.4),'Every visitor moves while circuit speed is zero');
  check(JSON.stringify(initial.stream.headPositions)===JSON.stringify(moving.stream.headPositions),'Circuit pause remains independent');
  const poses=()=>{const values=[];mall.group.getObjectByName('Data Mall · walking gallery visitors').traverse(o=>{if(o.isInstancedMesh)values.push(Array.from(o.instanceMatrix.array));});return JSON.stringify(values);};
  const before=poses();mall.update(100,true);check(poses()===before,'Reduced motion freezes position and limb poses');
  mall.update(100.016,false);const resumed=mall.snapshot();check(resumed.visitors.positions.every((p,i)=>Math.hypot(p[0]-moving.visitors.positions[i][0],p[2]-moving.visitors.positions[i][2])<.02),'Resume has no catch-up teleport');
  const lanes=resumed.visitors.lanes.flatMap(l=>Array.from({length:l.count},()=>l));
  const violations=[],overlaps=[];let samples=0,geometryFrames=0;
  const matrix=new THREE.Matrix4(),box=new THREE.Box3();
  for(let frame=0;frame<=600;frame++){
   mall.update(100.016+frame*.2);const s=mall.snapshot().visitors;
   for(let i=0;i<s.positions.length;i++){
    const p=s.positions[i],l=lanes[i];samples++;
    if(Math.abs(p[1]-l.y)>1e-6||Math.abs(p[0]-l.x)>l.halfLength+l.radius+1e-6||Math.abs(p[2]-l.z)>l.radius+1e-6)violations.push({frame,i,p});
    for(let j=i+1;j<s.positions.length;j++)if(l===lanes[j]&&Math.hypot(p[0]-s.positions[j][0],p[2]-s.positions[j][2])<.52)overlaps.push({frame,i,j});
   }
   if(frame%25===0){
    geometryFrames++;mall.group.getObjectByName('Data Mall · walking gallery visitors').traverse(mesh=>{
     if(!mesh.isInstancedMesh)return;mesh.geometry.computeBoundingBox();const perVisitor=mesh.count/106;
     for(let n=0;n<mesh.count;n++){
      const i=Math.floor(n/perVisitor),l=lanes[i];mesh.getMatrixAt(n,matrix);box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix);
      const wing=Math.abs(l.x)>0,entry=l.y===.18;
      const minX=l.x-(wing?8:entry?5.2:8),maxX=l.x+(wing?8:entry?5.2:8),minZ=wing?4.9:entry?5.71:-5.7,maxZ=wing?6.4:entry?7.04:-.6;
      if(box.min.y<l.y-.002||box.max.y>l.y+2||box.min.x<minX||box.max.x>maxX||box.min.z<minZ||box.max.z>maxZ)violations.push({frame,mesh:mesh.name,i,min:box.min.toArray(),max:box.max.toArray()});
     }
    });
   }
  }
  check(!violations.length,'Bodies, hands and feet remain on floors, behind rails and clear of glazing',{samples,geometryFrames,violations:violations.slice(0,10)});
  check(!overlaps.length,'Visitors keep personal space through complete route laps',{overlaps:overlaps.slice(0,10)});
  const {createOsCityBalconyDistrict}=await import('/src/apartments/osCityBalconyDistrict.ts');
  const district=createOsCityBalconyDistrict(),state=district.userData.getSnapshot(),moved=state.market.stalls.filter(s=>['myco','spice'].includes(s.type));
  const towerConflicts=[],stallConflicts=[],routeConflicts=[];
  for(const stall of moved){
   const f=state.market.footprints.find(f=>f.x===stall.x&&f.z===stall.z);
   check(f.x-f.halfWidth>88.6&&f.z-f.halfDepth>21.5,'Relocated '+stall.name+' is outside the plaza on the balcony-right side of the mall',f);
   for(const [x,z,w,d] of state.transitGuideway.nearTowerFootprints)if(Math.abs(x-f.x)<w/2+f.halfWidth+.5&&Math.abs(z-f.z)<d/2+f.halfDepth+.5)towerConflicts.push({stall,tower:[x,z,w,d]});
   for(const o of state.life.pedestrianObstacles){if(o.x===f.x&&o.z===f.z)continue;if(Math.abs(o.x-f.x)<o.halfWidth+f.halfWidth&&Math.abs(o.z-f.z)<o.halfDepth+f.halfDepth)stallConflicts.push({stall,o});}
  }
  const px=x=>8+(x-8)*1.3,pz=z=>-5+(z+5)*1.3;
  for(const [route,points] of state.life.pedestrianRoutes.entries()){
   const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(px(x),-14.018,pz(z))),true,'catmullrom',.05);
   for(let i=0;i<1500;i++)for(const side of [-.64,.64]){
    const t=i/1500,p=curve.getPointAt(t),tan=curve.getTangentAt(t);p.x+=tan.z*side;p.z-=tan.x*side;
    if(state.life.pedestrianObstacles.some(o=>Math.abs(p.x-o.x)<o.halfWidth+.35&&Math.abs(p.z-o.z)<o.halfDepth+.35))routeConflicts.push({route,p:p.toArray()});
   }
  }
  check(!towerConflicts.length&&!stallConflicts.length&&!routeConflicts.length,'Moved stands clear buildings, other stalls and all pedestrian routes',{towerConflicts,stallConflicts,routeConflicts:routeConflicts.slice(0,5),routeSamples:18000});
  return {checks,moved,visitorCount:106,visitorDrawCalls:moving.visitors.drawCalls};
 });await writeFile(output+'/geometry-motion.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));assert.ok(result.checks.every(c=>c.passed));
}finally{await browser.close();}
