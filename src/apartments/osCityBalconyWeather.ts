import * as THREE from 'three';
import { getCityWeatherPreset, getCityLeafMotion, getCityWeatherLightning, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';
import { createCityPrecipitation } from './osCityPrecipitation';
import { CITY_RESIDENCE_ELEVATION } from './osCityLayout';

/** Precipitation starts outside the roof drip-line, never over the covered terrace. */
export function createOsCityBalconyWeather() {
  const group=new THREE.Group();group.name='Circuit Market · exterior weather beyond covered balcony';
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const minX=5.08;
  const precipitation=createCityPrecipitation('Balcony weather',951774,[
    {name:'roof edge',capacity:1300,minX,maxX:27.08,minY:-13.9,maxY:18.1+CITY_RESIDENCE_ELEVATION,minZ:-23,maxZ:18},
    {name:'market and transit approach',capacity:1400,minX:27.08,maxX:140,minY:-13.9,maxY:44.1+CITY_RESIDENCE_ELEVATION,minZ:-62,maxZ:58},
    {name:'distant transit loop',capacity:700,minX:140,maxX:286,minY:-13.9,maxY:70.1+CITY_RESIDENCE_ELEVATION,minZ:-110,maxZ:125},
  ]);
  group.add(precipitation.group);
  let seed=375019;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const leafCanvas=document.createElement('canvas');leafCanvas.width=leafCanvas.height=64;
  const lc=leafCanvas.getContext('2d')!;lc.fillStyle='#fff';lc.beginPath();lc.moveTo(8,36);lc.bezierCurveTo(7,16,34,8,57,11);lc.bezierCurveTo(57,32,37,57,8,36);lc.fill();lc.strokeStyle='#665234';lc.lineWidth=2;lc.beginPath();lc.moveTo(8,36);lc.lineTo(51,15);lc.stroke();
  const leafTexture=new THREE.CanvasTexture(leafCanvas),leafGeometry=new THREE.PlaneGeometry(.19,.12);
  const leafMaterial=new THREE.MeshStandardMaterial({map:leafTexture,color:'#ac8653',emissive:'#705132',emissiveIntensity:.17,roughness:.95,alphaTest:.4,side:THREE.DoubleSide});
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,88);leaves.name='Balcony weather · wind-blown autumn leaves outside roof';leaves.frustumCulled=false;group.add(leaves);
  const leafSeeds=Array.from({length:88},()=>({x:5.8+random()*28,z:-24+random()*43,phase:random()*6.28,speed:.30+random()*.42}));
  const dummy=new THREE.Object3D();
  for(let i=0;i<88;i++)leaves.setColorAt(i,new THREE.Color(['#82612d','#a56b31','#bd8542','#806943','#9c542f'][i%5]));
  let mode:OsCityWeather='rain',lastElapsed=0,disposed=false;
  function writeLeaves(elapsed:number){
    leafSeeds.forEach((leaf,i)=>{
      const fallHeight=24+CITY_RESIDENCE_ELEVATION,motion=getCityLeafMotion(mode,elapsed,leaf.phase,leaf.speed,fallHeight);
      dummy.position.set(Math.max(minX,leaf.x+motion.dx),10+CITY_RESIDENCE_ELEVATION-motion.age*fallHeight,leaf.z+motion.dz);
      dummy.rotation.set(motion.rx,motion.ry,motion.rz);dummy.scale.setScalar(.7+(i%5)*.11);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
    });leaves.instanceMatrix.needsUpdate=true;
  }
  function setWeather(value:OsCityWeather,timeOfDay:CityTimeOfDay='day'){
    mode=value;const preset=getCityWeatherPreset(mode,timeOfDay);
    precipitation.setWeather(mode,timeOfDay);
    leaves.visible=preset.autumn;leaves.count=mode==='academic-rainy-dusk'?52:88;
    leafMaterial.emissiveIntensity=.17*preset.fixtureIntensity;
  }
  function update(delta:number,elapsed:number){
    if(disposed)return;
    lastElapsed=elapsed;precipitation.update(delta,elapsed);
    if(!reducedMotion.matches&&leaves.visible)writeLeaves(elapsed);
  }
  function snapshot(){
    const leafSample=leaves.visible?[0,1,2].map(index=>{leaves.getMatrixAt(index,dummy.matrix);return [12,13,14].map(component=>Number(dummy.matrix.elements[component].toFixed(4)));}):[];
    return {...precipitation.snapshot(),shelterDry:true,autumnLeaves:leaves.visible?leaves.count:0,leafSample,disposed};
  }
  function dispose(){
    if(disposed)return;disposed=true;
    precipitation.dispose();leaves.dispose();leafGeometry.dispose();leafMaterial.dispose();leafTexture.dispose();
  }
  writeLeaves(0);setWeather('rain');
  return {group,setWeather,update,snapshot,dispose,getLightning:()=>getCityWeatherLightning(mode,lastElapsed,reducedMotion.matches)};
}
