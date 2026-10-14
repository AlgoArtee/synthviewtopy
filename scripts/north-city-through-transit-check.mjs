import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const output=process.env.CITY_GEOMETRY_OUTPUT??'test-artifacts/north-city/revision-32/geometry';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();await page.route('**/through-line-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Through railway geometry</body>'}));await page.goto('http://127.0.0.1:5178/through-line-check');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {createOsCityBalconyDistrict}=await import('/src/apartments/osCityBalconyDistrict.ts');
  const {createOsCityTransitRoute,CITY_TRANSIT_SPEED}=await import('/src/apartments/osCityTransit.ts');
  const {cityTransitVisibility,applyCityTransitDistanceFade}=await import('/src/apartments/osCityTransitDistance.ts');
  const district=createOsCityBalconyDistrict();await district.userData.ready;district.updateMatrixWorld(true);
  const route=createOsCityTransitRoute(),transit=district.getObjectByName('City maglev · distant through line'),initial=transit.userData.snapshot(),points=route.getSpacedPoints(4096),duration=route.getLength()/CITY_TRANSIT_SPEED;
  const footprints=[...district.userData.skylineSource.towers,...district.userData.transitGuideway.nearTowerFootprints.map(([x,z,width,depth,height])=>({x,z,width,depth,height}))];
  let minTowerClearance=Infinity,closestTower=null,submittedTriangles=0;const intersections=[];
  for(const b of footprints)for(const p of points){if(cityTransitVisibility(p.z)===0)continue;const clearance=Math.hypot(Math.max(Math.abs(p.x-b.x)-b.width/2,0),Math.max(Math.abs(p.z-b.z)-b.depth/2,0))-1.4;if(clearance<minTowerClearance){minTowerClearance=clearance;closestTower={building:b,point:p.toArray()};}if(clearance<0){intersections.push({building:b,point:p.toArray(),clearance});break;}}
  let previous=initial,wraps=0,visibleWraps=0,minSpeed=Infinity,maxSpeed=0,maxVisibleStep=0;
  for(let i=1;i<=Math.ceil(duration*2/.1);i++){
   transit.userData.pose(i*.1);const s=transit.userData.snapshot();
   s.trainPositions.forEach((p,j)=>{const distance=new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...previous.trainPositions[j]));if(distance>10){wraps++;if(s.trainVisibility[j]>0||previous.trainVisibility[j]>0)visibleWraps++;}else{minSpeed=Math.min(minSpeed,distance/.1);maxSpeed=Math.max(maxSpeed,distance/.1);if(s.trainVisibility[j]>0)maxVisibleStep=Math.max(maxVisibleStep,distance);}});previous=s;
  }
  const club=district.userData.neonClub,rays=[],opaque=[],origin=new THREE.Vector3(),direction=new THREE.Vector3(),ray=new THREE.Raycaster();
  district.traverse(o=>{if(o.isMesh&&!o.material?.transparent)opaque.push(o);});
  for(const side of [-1,1])for(const y of [.7,2.5,4.4,7.0])for(const z of [-4,0,4]){
   origin.set(club.center[0]+side*(club.width/2+1),club.center[1]+y,club.center[2]+z);direction.set(-side,0,0);ray.set(origin,direction);ray.far=1.5;
   const hits=ray.intersectObjects(opaque,false).filter(h=>!h.object.material?.transparent);rays.push({side,y,z,hit:hits.length>0});
  }
  for(const x of [-5,0,5])for(const y of [.7,2.5,4.4,7.0]){
   origin.set(club.center[0]+x,club.center[1]+y,club.center[2]-club.depth/2-1);ray.set(origin,direction.set(0,0,1));ray.far=1.5;const hits=ray.intersectObjects(opaque,false).filter(h=>!h.object.material?.transparent);rays.push({rear:true,x,y,hit:hits.length>0});
  }
  const fadedMaterials=[];district.traverse(o=>{if(o.isMesh){submittedTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.material?.userData.transitDistanceFade)fadedMaterials.push(o.material.userData.transitDistanceFade);}});
  const renderer=new THREE.WebGLRenderer({alpha:true,preserveDrawingBuffer:true});renderer.setSize(16,16);renderer.setClearColor(0,0);
  const fadeScene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,20),g=new THREE.BoxGeometry(2,2,2),mat=applyCityTransitDistanceFade(new THREE.MeshBasicMaterial({color:'#ffffff'})),sample=new THREE.InstancedMesh(g,mat,1);fadeScene.add(sample);
  const pixels=new Uint8Array(4),fadePixels=[];
  for(const z of [-270,-205,0,195,260]){sample.setMatrixAt(0,new THREE.Matrix4().makeTranslation(0,0,z));sample.instanceMatrix.needsUpdate=true;sample.computeBoundingSphere();camera.position.set(0,0,z+8);camera.lookAt(0,0,z);renderer.render(fadeScene,camera);renderer.getContext().readPixels(8,8,1,1,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,pixels);fadePixels.push({z,alpha:pixels[3]/255});}
  g.dispose();mat.dispose();sample.dispose();renderer.dispose();
  const result={initial,duration,minTowerClearance,closestTower,intersections,wraps,visibleWraps,minSpeed,maxSpeed,maxVisibleStep,monotone:points.every((p,i)=>i===0||p.z>points[i-1].z),endpointVisibility:[cityTransitVisibility(points[0].z),cityTransitVisibility(points.at(-1).z)],fadedMaterials,fadePixels,club,rays,submittedTriangles};district.userData.dispose();return result;
 });
 await writeFile(output+'/results.json',JSON.stringify(result,null,2));
 assert.equal(result.initial.routeClosed,false);assert.ok(result.monotone);assert.deepEqual(result.endpointVisibility,[0,0]);assert.ok(result.wraps>=24);assert.equal(result.visibleWraps,0);assert.ok(result.minSpeed>8.35&&result.maxSpeed<8.45);assert.equal(result.intersections.length,0,JSON.stringify(result.intersections));assert.ok(result.rays.every(r=>r.hit));assert.ok(result.fadedMaterials.length>=20);assert.ok(result.submittedTriangles<250000);
 assert.equal(result.fadePixels[0].alpha,0);assert.equal(result.fadePixels[2].alpha,1);assert.equal(result.fadePixels[4].alpha,0);assert.ok(result.fadePixels[1].alpha>.2&&result.fadePixels[1].alpha<.8);assert.ok(result.fadePixels[3].alpha>.2&&result.fadePixels[3].alpha<.8);
 console.log(JSON.stringify({pass:true,routeLength:result.initial.routeLength,wraps:result.wraps,visibleWraps:result.visibleWraps,minSpeed:result.minSpeed,maxSpeed:result.maxSpeed,minTowerClearance:result.minTowerClearance,closestTower:result.closestTower,clubWallRays:result.rays.length,triangles:result.submittedTriangles}));
}finally{await browser.close();}
