import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-artifacts/north-city/revision-20/transit-geometry';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage();
  await page.route('**/transit-helper-check', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>Physical transit geometry checks</body></html>' }));
  await page.goto('http://127.0.0.1:5178/transit-helper-check');
  const result = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createOsCityTransit, createOsCityTransitRoute, CITY_TRANSIT_SPEED } = await import('/src/apartments/osCityTransit.ts');
    const { createOsCityBalconyDistrict } = await import('/src/apartments/osCityBalconyDistrict.ts');
    const transit = createOsCityTransit(), route = createOsCityTransitRoute(), district = createOsCityBalconyDistrict();
    await district.userData.ready;
    const initial = transit.userData.snapshot(), length = route.getLength(), lapSeconds = length / CITY_TRANSIT_SPEED;
    let districtSubmittedTriangles=0;
    district.traverse(mesh=>{if(mesh.isMesh)districtSubmittedTriangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*(mesh.isInstancedMesh?mesh.count:1);});
    const skyline = district.userData.skylineSource, guideway = district.userData.transitGuideway;
    let maxStep = 0, minDirectionDot = 1, minSpeed = Infinity, maxSpeed = 0;
    let previous = initial, previousT = 0;
    const routeSamples = route.getSpacedPoints(4096);
    const footprints = [...skyline.towers, ...guideway.nearTowerFootprints.map(([x,z,width,depth,height]) => ({x,z,width,depth,height}))];
    const intersections = [];
    let minTowerClearance = Infinity;
    for (const tower of footprints) for (const p of routeSamples) {
      const dx = Math.max(Math.abs(p.x-tower.x)-tower.width/2,0), dz = Math.max(Math.abs(p.z-tower.z)-tower.depth/2,0);
      const clearance = Math.hypot(dx,dz)-guideway.deckWidth/2;
      minTowerClearance = Math.min(minTowerClearance,clearance);
      if (clearance<0) { intersections.push({tower,p:p.toArray(),clearance}); break; }
    }
    for (let tick=1;tick<=Math.ceil(lapSeconds*2/.05);tick++) {
      const time=tick*.05;transit.userData.pose(time);const next=transit.userData.snapshot();
      for(let car=0;car<next.trainPositions.length;car++){
        const displacement=new THREE.Vector3(...next.trainPositions[car]).distanceTo(new THREE.Vector3(...previous.trainPositions[car]));
        maxStep=Math.max(maxStep,displacement);minSpeed=Math.min(minSpeed,displacement/(time-previousT));maxSpeed=Math.max(maxSpeed,displacement/(time-previousT));
        minDirectionDot=Math.min(minDirectionDot,new THREE.Vector3(...next.trainDirections[car]).dot(new THREE.Vector3(...previous.trainDirections[car])));
      }
      previous=next;previousT=time;
    }
    // Actual transformed vertices stay above their local rail deck throughout a lap.
    let minDeckClearance=Infinity,vertexSamples=0,triangles=0,meshes=0;
    const transform=new THREE.Matrix4(),point=new THREE.Vector3();
    transit.traverse(mesh=>{if(!mesh.isInstancedMesh)return;meshes++;triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*mesh.count;});
    for(let tick=0;tick<80;tick++){
      const time=tick/80*lapSeconds;transit.userData.pose(time);
      const centers=transit.userData.snapshot().trainPositions;
      transit.children.forEach(mesh=>{
        const style=mesh.name.includes('driving')?0:mesh.name.includes('articulated')?1:2;
        const vertices=mesh.geometry.attributes.position;
        for(let train=0;train<4;train++){
          mesh.getMatrixAt(train,transform);
          const centerT=THREE.MathUtils.euclideanModulo(.065+train/4+(time*CITY_TRANSIT_SPEED-style*5.8)/length,1);
          for(let vertex=0;vertex<vertices.count;vertex+=3){
            point.fromBufferAttribute(vertices,vertex).applyMatrix4(transform);
            const localZ=vertices.getZ(vertex),trackT=THREE.MathUtils.euclideanModulo(centerT+localZ/length,1),deck=route.getPointAt(trackT).y+.22;
            minDeckClearance=Math.min(minDeckClearance,point.y-deck);vertexSamples++;
          }
        }
      });
    }
    transit.userData.pose(lapSeconds);
    const lap=transit.userData.snapshot(),lapClosureError=Math.max(...lap.trainPositions.map((p,i)=>new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...initial.trainPositions[i]))));
    let disposalCalls=0;transit.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.addEventListener('dispose',()=>disposalCalls++);});
    transit.userData.dispose();transit.userData.dispose();district.userData.dispose();
    return {initial,lapSeconds,maxStep,minSpeed,maxSpeed,minDirectionDot,lapClosureError,minDeckClearance,vertexSamples,triangles,districtSubmittedTriangles,meshes,disposalCalls,minTowerClearance,intersections,skylineTowerCount:skyline.towerCount,projection:skyline.projection,guidewayClosed:guideway.closed,removedPhotographicSkyline:skyline.sampledTopFraction===0};
  });
  await mkdir(output,{recursive:true});await writeFile(`${output}/diagnostic.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({maxStep:result.maxStep,minSpeed:result.minSpeed,maxSpeed:result.maxSpeed,minDeckClearance:result.minDeckClearance,minTowerClearance:result.minTowerClearance,intersections:result.intersections,minDirectionDot:result.minDirectionDot,triangles:result.triangles,meshes:result.meshes}));
  assert.equal(result.initial.routeClosed,true);assert.ok(result.initial.routeSeamGap<1e-8);assert.ok(result.initial.routeSeamTangentDot>.99999);
  assert.ok(result.lapClosureError<1e-7);assert.ok(result.maxStep<.422);assert.ok(result.minDirectionDot>.998);
  assert.ok(result.minSpeed>8.35&&result.maxSpeed<8.45);assert.ok(result.minDeckClearance>.10);
  assert.equal(result.intersections.length,0);assert.ok(result.minTowerClearance>.10);
  assert.equal(result.removedPhotographicSkyline,true);assert.ok(result.skylineTowerCount>45);
  assert.ok(result.triangles<14000);assert.ok(result.districtSubmittedTriangles<250000);assert.ok(result.meshes<=15);assert.equal(result.disposalCalls,result.meshes);
  await mkdir(output,{recursive:true});await writeFile(`${output}/results.json`,JSON.stringify({pass:true,...result},null,2));
  console.log(JSON.stringify({pass:true,lapSeconds:result.lapSeconds,routeLength:result.initial.routeLength,maxStep:result.maxStep,minSpeed:result.minSpeed,maxSpeed:result.maxSpeed,minDeckClearance:result.minDeckClearance,minTowerClearance:result.minTowerClearance,triangles:result.triangles,districtTriangles:result.districtSubmittedTriangles,drawCalls:result.meshes,skylineTowers:result.skylineTowerCount,initialTrain:result.initial.trainPositions[0]}));
} finally { await browser.close(); }
