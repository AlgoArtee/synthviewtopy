import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/validation';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const before=await state();await page.evaluate(()=>window.advanceTime(1500));const after=await state();
  assert.deepEqual(after.cityLife,before.cityLife,'Reduced motion must freeze city movement');
  await page.locator('#city-weather-select').selectOption('clear');assert.equal((await state()).weather.mode,'clear');
  await page.locator('#city-controls-toggle').click();assert.equal((await state()).controlsCollapsed,true);
  assert.equal(await page.locator('#city-weather-select').isVisible(),false);
  await page.keyboard.press('h');assert.equal((await state()).controlsCollapsed,false);assert.equal((await state()).weather.mode,'clear');
  await context.close();
  const auditPage=await browser.newPage();
  await auditPage.goto('http://127.0.0.1:5178/north-city.html',{waitUntil:'domcontentloaded',timeout:120000});
  const geometry=await auditPage.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
    const {CITY_BED,CITY_WINDOW,CITY_KITCHEN_OFFSET_Z}=await import('/src/apartments/osCityLayout.ts');
    const room=createOsCityApartment();await room.ready;room.scene.updateMatrixWorld(true);
    const unique=new Set(),problems=[];let uniqueTriangles=0,submittedSceneTriangles=0,meshCount=0;
    const budgetGroups={existing:{unique:new Set(),uniqueTriangles:0,submittedTriangles:0},terrace:{unique:new Set(),uniqueTriangles:0,submittedTriangles:0},district:{unique:new Set(),uniqueTriangles:0,submittedTriangles:0}};
    const terrace=room.scene.getObjectByName('Wraparound circuit balcony'),district=room.scene.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline');
    room.scene.traverse(o=>{if(!o.geometry)return;meshCount++;const g=o.geometry,p=g.attributes.position;
      if(!unique.has(g)){unique.add(g);for(const [name,a]of Object.entries(g.attributes)){for(let i=0;i<a.array.length;i++)if(!Number.isFinite(a.array[i])){problems.push(o.name+': non-finite '+name);break;}}
      if(o.isMesh)uniqueTriangles+=(g.index?.count??p.count)/3;}
      if(o.isMesh){
        const triangles=(g.index?.count??p.count)/3,submitted=triangles*(o.isInstancedMesh?o.count:1);submittedSceneTriangles+=submitted;
        let category='existing';for(let ancestor=o;ancestor;ancestor=ancestor.parent){if(ancestor===terrace){category='terrace';break;}if(ancestor===district){category='district';break;}}
        const bucket=budgetGroups[category];if(!bucket.unique.has(g)){bucket.unique.add(g);bucket.uniqueTriangles+=triangles;}bucket.submittedTriangles+=submitted;
      }
    });
    const triangleBudgets=Object.fromEntries(Object.entries(budgetGroups).map(([name,bucket])=>[name,{uniqueTriangles:Math.round(bucket.uniqueTriangles),submittedTriangles:Math.round(bucket.submittedTriangles),geometries:bucket.unique.size}]));
    const chair=room.scene.getObjectByName('Floating round acrylic lounge chair'),rug=room.scene.getObjectByName('Luminous white lounge rug');
    const direction=new THREE.Vector3(0,0,1).applyQuaternion(chair.quaternion),toKitchen=new THREE.Vector3(4.3,chair.position.y,1.25+CITY_KITCHEN_OFFSET_Z).sub(chair.position).normalize();
    const rugBounds=new THREE.Box3().setFromObject(rug).getSize(new THREE.Vector3());
    const city=room.scene.getObjectByName('North City · behind the island');const cityBounds=new THREE.Box3().setFromObject(city);
    const mattress=room.scene.getObjectByName('Bed · upholstered mattress'),bedBounds=new THREE.Box3().setFromObject(mattress);
    const pillows=[];room.scene.traverse(o=>{if(o.isGroup&&o.name.startsWith('Bed pillow ·')){const b=new THREE.Box3().setFromObject(o,true);pillows.push({name:o.name,supportWall:o.userData.supportWall,min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new THREE.Vector3()).toArray()});}});
    const panes=[];room.scene.traverse(o=>{if(o.name.startsWith('Panoramic window · laminated'))panes.push(o.name);});
    const duvet=room.scene.getObjectByName('Duvet · large filled white cotton blanket');
    const dv=duvet.geometry.attributes.position,half=dv.count/2,lofts=[];
    for(let i=0;i<half;i++)lofts.push(dv.getY(i)-dv.getY(i+half));
    const duvetReport={...duvet.userData.duvet,bounds:new THREE.Box3().setFromObject(duvet,true).getSize(new THREE.Vector3()).toArray(),min:new THREE.Box3().setFromObject(duvet,true).min.toArray(),max:new THREE.Box3().setFromObject(duvet,true).max.toArray(),minThickness:Math.min(...lofts),maxThickness:Math.max(...lofts),meanThickness:lofts.reduce((a,b)=>a+b,0)/lofts.length};
    const edges=new Map(),idx=duvet.geometry.index;
    for(let i=0;i<idx.count;i+=3)for(let j=0;j<3;j++){const a=idx.getX(i+j),b=idx.getX(i+(j+1)%3),key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)??0)+1);}
    duvetReport.nonManifoldEdges=[...edges.values()].filter(n=>n!==2).length;
    duvetReport.wallCrossingVertices=0;
    for(let i=0;i<dv.count;i++)if(dv.getX(i)<CITY_BED.minX-.001||dv.getX(i)>CITY_BED.maxX+.001||dv.getZ(i)<CITY_BED.minZ-.001||(dv.getZ(i)>CITY_BED.maxZ&&dv.getX(i)<-4.79))duvetReport.wallCrossingVertices++;
    // Measure the authored top boundary vertices against all fitted alcove sides.
    const duv=duvet.geometry.attributes.uv;
    let rowLength=0;while(rowLength<half&&Math.abs(duv.getY(rowLength))<1e-6)rowLength++;
    const rowCount=half/rowLength;
    const gaps={west:0,east:0,north:0,southReturn:0};
    for(let j=0;j<rowCount;j++){
      gaps.west=Math.max(gaps.west,Math.abs(dv.getX(j*rowLength)-CITY_BED.minX));
      gaps.east=Math.max(gaps.east,Math.abs(dv.getX(j*rowLength+rowLength-1)-CITY_BED.maxX));
    }
    for(let i=0;i<rowLength;i++){
      gaps.north=Math.max(gaps.north,Math.abs(dv.getZ(i)-CITY_BED.minZ));
      const k=(rowCount-1)*rowLength+i;
      if(dv.getX(k)<-4.79)gaps.southReturn=Math.max(gaps.southReturn,Math.abs(dv.getZ(k)-CITY_BED.maxZ));
    }
    duvetReport.wallGaps=gaps;
    const cabinetBounds=new THREE.Box3().setFromObject(room.scene.getObjectByName('Nightstand · softly rounded lacquer cabinet'),true);
    duvetReport.verticesInsideNightstand=0;
    const cabinetPoint=new THREE.Vector3();
    for(let i=0;i<dv.count;i++)if(cabinetBounds.containsPoint(cabinetPoint.fromBufferAttribute(dv,i)))duvetReport.verticesInsideNightstand++;

    const tv=room.scene.getObjectByName('Left-wall holographic television');
    const screen=room.scene.getObjectByName('TV · translucent animated art channel');
    const screenBounds=new THREE.Box3().setFromObject(screen,true);
    const televisionSightlines=[];
    for(const id of ['sleep','bed-wide','duvet','television','duvet-drape']){
      const camera=room.viewpoints.find(v=>v.id===id).position,ray=new THREE.Raycaster();let occluded=0;
      for(let j=0;j<6;j++)for(let i=0;i<9;i++){
        const target=new THREE.Vector3(-1.855+i*3.71/8,-1.005+j*2.01/5,0).applyMatrix4(screen.matrixWorld);
        const delta=target.clone().sub(camera),distance=delta.length();ray.set(camera,delta.normalize());ray.near=.001;ray.far=distance-.001;
        if(ray.intersectObject(duvet,false).length)occluded++;
      }
      televisionSightlines.push({view:id,samples:54,duvetOccluded:occluded});
    }

    const report={duvet:duvetReport,panoramic:{panes:panes.length,obsoleteArch:!!room.scene.getObjectByName('Arched insulated glass')},pillows,television:{...tv?.userData.television,screenMinY:screenBounds.min.y,centreZ:(screenBounds.min.z+screenBounds.max.z)/2,sightlines:televisionSightlines},exterior:city.userData.exterior,bed:{size:bedBounds.getSize(new THREE.Vector3()).toArray(),min:bedBounds.min.toArray(),max:bedBounds.max.toArray(),contract:CITY_BED},window:CITY_WINDOW,uniqueTriangles:Math.round(uniqueTriangles),submittedSceneTriangles:Math.round(submittedSceneTriangles),triangleBudgets,geometries:unique.size,meshCount,problems,chairKitchenDot:direction.dot(toKitchen),rugSize:rugBounds.toArray(),cityNearestZ:cityBounds.max.z};
    room.dispose();return report;
  });
  console.log(JSON.stringify(geometry));assert.deepEqual(geometry.problems,[]);assert.equal(geometry.panoramic.panes,3);assert.equal(geometry.panoramic.obsoleteArch,false);assert.equal(geometry.pillows.length,13);assert.equal(geometry.pillows.filter(p=>p.supportWall==='east').length,4);for(const p of geometry.pillows.filter(p=>p.supportWall==='east'))assert.ok(Math.abs(p.max[0]-(geometry.bed.contract.maxX-.004))<.001,'Four pillows meet east wall opposite TV');assert.equal(geometry.duvet.nonManifoldEdges,0);assert.ok(geometry.duvet.minThickness>.015&&geometry.duvet.meanThickness>.11);assert.ok(geometry.duvet.width>geometry.bed.contract.width&&geometry.duvet.depth>geometry.bed.contract.depth,'Unfolded duvet is larger than mattress');assert.ok(geometry.duvet.surfaceWidth>geometry.bed.contract.width&&geometry.duvet.surfaceDepth>geometry.bed.contract.depth,'Gathered blanket covers the complete bed depth beneath window pillows');assert.equal(geometry.duvet.wallCrossingVertices,0);assert.equal(geometry.duvet.verticesInsideNightstand,0);for(const side of ['west','southReturn'])assert.ok(geometry.duvet.wallGaps[side]<.001,'Duvet meets uncovered alcove walls');assert.ok(geometry.duvet.wallGaps.north>0&&geometry.duvet.wallGaps.north<.045,'Blanket continues beneath window pillows to a soft hem at the glass');assert.ok(geometry.duvet.wallGaps.east>.85&&geometry.duvet.wallGaps.east<1.35,'Duvet ends at the new decorative cushion fronts');assert.equal(geometry.duvet.stopsAtPillowFronts,false);assert.equal(geometry.duvet.stopsAtEastCushionFronts,true);assert.equal(geometry.duvet.underWindowPillows,2);assert.equal(geometry.pillows.filter(p=>p.supportWall==='compressed duvet').length,2);for(const sightline of geometry.television.sightlines)assert.equal(sightline.duvetOccluded,0,'Duvet must not cover the TV from '+sightline.view);assert.ok(geometry.duvet.max[2]>geometry.bed.contract.maxZ+.25,'Duvet hangs over open foot');assert.ok(geometry.duvet.min[1]>.18,'Duvet clears floor');assert.ok(geometry.television.width===3.72);assert.ok(Math.abs(geometry.television.centreZ-geometry.bed.contract.centerZ)<.001,'TV and bed centre lines align');assert.equal(geometry.exterior.windowLighting.variants,24);for(const category of ['dark','warm','cool','rose','neon'])assert.ok(geometry.exterior.windowLighting.counts[category]>0);assert.equal(geometry.exterior.panoramicLateralBlocks,6);assert.ok(geometry.triangleBudgets.existing.uniqueTriangles<=2000000,'Existing apartment and north street retain the original two-million triangle budget');assert.ok(geometry.triangleBudgets.terrace.uniqueTriangles>0&&geometry.triangleBudgets.terrace.uniqueTriangles<=100000,'Balcony paving, rails and doorway stay within 100k unique triangles');assert.ok(geometry.triangleBudgets.district.uniqueTriangles>0&&geometry.triangleBudgets.district.uniqueTriangles<=300000,'Merged balcony city district stays within 300k unique triangles');for(const p of geometry.pillows){assert.ok(p.min[0]>=geometry.bed.contract.minX-.001&&p.max[0]<=geometry.bed.contract.maxX+.001&&p.min[2]>=geometry.bed.contract.minZ-.001,'Pillow inside alcove');}assert.ok(geometry.chairKitchenDot>.999);assert.ok(Math.abs(geometry.rugSize[0]-geometry.rugSize[2])<.01);assert.ok(Math.abs(geometry.bed.size[0]-8.55)<.001&&Math.abs(geometry.bed.size[2]-8.55)<.001);assert.ok(geometry.cityNearestZ<=geometry.window.z-.49,'All city geometry must stay beyond glazing');assert.deepEqual(errors,[]);
  const report={geometry,reducedMotion:{before:before.cityLife,after:after.cityLife},weatherAndCollapsedControls:true,errors};await writeFile(out+'/audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await browser.close();}

