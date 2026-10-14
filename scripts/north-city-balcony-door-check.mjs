import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const output='test-artifacts/north-city/revision-20/door-helper';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
  const page=await browser.newPage();
  await page.route('**/balcony-door-helper',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Balcony door geometry and acoustic checks</title>'}));
  await page.goto('http://127.0.0.1:5178/balcony-door-helper');
  const result=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {createOsCityBalconyDoor}=await import('/src/apartments/osCityBalconyDoor.ts');
    const {createCityNavigation}=await import('/src/apartments/osCityNavigation.ts');
    const {citySoundAdmission}=await import('/src/apartments/osCityAmbience.ts');
    const failures=[],checks=[];const check=(value,label)=>{checks.push(label);if(!value)failures.push(label);};
    const colliders=[new THREE.Box3(new THREE.Vector3(1.4,0,-.37),new THREE.Vector3(2.1,3.5,-.15)),new THREE.Box3(new THREE.Vector3(3.6,0,-.37),new THREE.Vector3(4.91,3.5,-.15))];
    const door=createOsCityBalconyDoor(colliders),nav=createCityNavigation(colliders),north=new THREE.Vector3(0,0,-1),south=new THREE.Vector3(0,0,1);
    const setMode=mode=>{door.setMode(mode);for(let i=0;i<240;i++)door.update(1/60);return door.getSnapshot();};
    const walk=(x,outside=false)=>{const p=new THREE.Vector3(x,1.65,outside?-1:1);nav.reset(p);for(let i=0;i<120;i++)nav.step(p,outside?south:north,1/60,false,false);return p.toArray();};
    const geometry=[];let minimumMovingWallClearance=Infinity;
    for(const mode of ['closed','half','open']){
      const snapshot=setMode(mode);door.group.updateMatrixWorld(true);
      snapshot.leaves.forEach((leaf,i)=>{
        const actual=new THREE.Box3().setFromObject(door.group.getObjectByName('Balcony door · sliding leaf '+(i+1)));
        const collider=colliders[i+2];
        check(collider.min.x<=actual.min.x+1e-6&&collider.max.x>=actual.max.x-1e-6&&collider.min.z<=actual.min.z+1e-6&&collider.max.z>=actual.max.z-1e-6,mode+' collider encloses actual leaf '+i);
        const wallClearance=actual.min.z-colliders[1].max.z;minimumMovingWallClearance=Math.min(minimumMovingWallClearance,wallClearance);
        check(wallClearance>=.009,mode+' actual leaf and rear pull clear parking wall '+i);
        check(colliders.slice(0,2).every(wall=>!actual.intersectsBox(wall)),mode+' actual moving leaf never intersects adjacent walls '+i);
        geometry.push({mode,i,actual:{min:actual.min.toArray(),max:actual.max.toArray()},wallClearance,collision:leaf});
      });
      check(!snapshot.transitioning,mode+' settles');
    }
    const closed=setMode('closed');check(closed.clearWidth===0,'closed has no aperture');
    const closedWalks=[];
    for(let x=2.35;x<=3.35;x+=.05)for(const outside of [false,true]){const p=walk(x,outside);closedWalks.push(p);check(outside?p[2]<-.3:p[2]>.2,'closed prevents passage at x '+x.toFixed(2)+' outside '+outside);}
    const half=setMode('half');check(half.clearWidth>.7&&half.clearWidth<.8,'half door leaves approximately .75m passage');
    const halfBlocked=walk(2.85),halfThrough=walk(2.47),halfReturn=walk(2.47,true);
    check(halfBlocked[2]>.2,'half panel blocks centerline');check(halfThrough[2]<-3,'half opening permits its real left gap');check(halfReturn[2]>1,'half opening permits return');
    const open=setMode('open'),openThrough=walk(2.85),openReturn=walk(2.85,true);
    check(open.clearWidth===1.5,'open clears full aperture');check(openThrough[2]<-3&&openReturn[2]>1,'open permits both directions');
    const body={x:2.85,y:1.65,z:-.1};door.setMode('closed');let obstructionSeen=false;
    for(let i=0;i<240;i++){
      door.update(1/60,body);obstructionSeen||=door.getSnapshot().obstructed;
      check(!colliders.slice(2).some(b=>body.x>b.min.x-.24&&body.x<b.max.x+.24&&body.z>b.min.z-.24&&body.z<b.max.z+.24),'moving leaves never intersect player '+i);
    }
    const paused=door.getSnapshot();check(obstructionSeen&&paused.transitioning&&paused.openFraction>0,'obstruction pauses closure');
    for(let i=0;i<240;i++)door.update(1/60,{x:2.85,y:1.65,z:1});check(door.getSnapshot().clearWidth===0&&!door.getSnapshot().obstructed,'closure resumes when doorway clears');
    const reduced=createOsCityBalconyDoor([],true);reduced.setMode('closed');reduced.update(0);check(reduced.getSnapshot().clearWidth===0,'reduced-motion closing is immediate');reduced.setMode('half');reduced.update(0);check(reduced.getSnapshot().mode==='half'&&!reduced.getSnapshot().transitioning,'reduced-motion half remains usable');
    reduced.setMode('open');reduced.update(0);reduced.setMode('closed');reduced.update(0,body);check(reduced.getSnapshot().obstructed&&reduced.getSnapshot().openFraction===1,'reduced-motion prevents closure onto listener');
    const indoor={x:2.85,y:1.65,z:1},outdoor={x:3.8,y:1.65,z:-4.76},windowOpen={turnDegrees:90},windowTilt={topOpeningMetres:.33};
    const audio={sealed:citySoundAdmission({},closed,indoor,0),half:citySoundAdmission({},half,indoor,0),door:citySoundAdmission({},open,indoor,0),window:citySoundAdmission(windowOpen,closed,indoor,0),tilt:citySoundAdmission(windowTilt,closed,indoor,0),both:citySoundAdmission(windowOpen,open,indoor,0),outsideSealed:citySoundAdmission({},closed,outdoor,0),outsideOpen:citySoundAdmission(windowOpen,open,outdoor,0)};
    check(audio.sealed.admission===0,'both closed silence indoors');check(audio.half.admission>0&&audio.half.admission<audio.door.admission,'half door gives intermediate sound');check(audio.half.lowpassHz<audio.door.lowpassHz,'half door filters sound more');check(audio.tilt.admission<audio.window.admission,'tilt quieter than full window');check(audio.both.admission>audio.door.admission&&audio.both.admission<=1,'aperture combination remains bounded');check(audio.outsideSealed.listenerOutside&&audio.outsideSealed.admission===1&&audio.outsideOpen.admission===1,'balcony hearing independent of indoor openings');
    return {failures,checks:checks.length,closed,half,open,geometry,minimumMovingWallClearance,closedWalks,halfBlocked,halfThrough,halfReturn,openThrough,openReturn,paused,audio};
  });
  await mkdir(output,{recursive:true});await writeFile(output+'/geometry-navigation-acoustics.json',JSON.stringify(result,null,2));
  assert.deepEqual(result.failures,[]);console.log('PASS: '+result.checks+' balcony door geometry, navigation, obstruction and acoustic checks.');
}finally{await browser.close();}
