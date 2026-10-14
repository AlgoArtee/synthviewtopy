import * as THREE from 'three';
import { getCityPrecipitationProfile, getCityWeatherAtmosphere, getCityWeatherLightning, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';

export interface CityPrecipitationVolume {
  name:string; capacity:number;
  minX:number; maxX:number; minY:number; maxY:number; minZ:number; maxZ:number;
}

/** Spatially separate volumes, with one shared world-space weather simulation.
 * Translation-only districts retain the same wind direction and metres/second.
 * Volumes are authored outside glazing and the balcony roof drip line. */
export function createCityPrecipitation(name:string,seed:number,volumes:CityPrecipitationVolume[]){
  const group=new THREE.Group();group.name=name;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const capacity=volumes.reduce((sum,volume)=>sum+volume.capacity,0);
  const positions=new Float32Array(capacity*3),vertices=new Float32Array(capacity*6),speeds=new Float32Array(capacity);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const rainAttribute=new THREE.BufferAttribute(vertices,3).setUsage(THREE.DynamicDrawUsage);
  const rainMaterial=new THREE.LineBasicMaterial({color:'#c2def0',transparent:true,opacity:.36,depthWrite:false,fog:true});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const context=canvas.getContext('2d')!,gradient=context.createRadialGradient(16,16,0,16,16,15);
  gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.35,'#ffffffe0');gradient.addColorStop(1,'#ffffff00');context.fillStyle=gradient;context.fillRect(0,0,32,32);
  const snowTexture=new THREE.CanvasTexture(canvas);
  const snowMaterial=new THREE.PointsMaterial({map:snowTexture,color:'#edf6ff',size:.072,transparent:true,opacity:.82,depthWrite:false,fog:true});
  let offset=0;
  const fields=volumes.map(volume=>{
    const start=offset;offset+=volume.capacity;
    for(let index=start;index<offset;index++){
      const p=index*3;
      positions[p]=volume.minX+random()*(volume.maxX-volume.minX);
      positions[p+1]=volume.minY+random()*(volume.maxY-volume.minY);
      positions[p+2]=volume.minZ+random()*(volume.maxZ-volume.minZ);
      speeds[index]=.76+random()*.52;
    }
    const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',rainAttribute);
    const snowGeometry=new THREE.BufferGeometry();snowGeometry.setAttribute('position',new THREE.BufferAttribute(positions.subarray(start*3,offset*3),3).setUsage(THREE.DynamicDrawUsage));
    const rain=new THREE.LineSegments(rainGeometry,rainMaterial),snow=new THREE.Points(snowGeometry,snowMaterial);
    rain.name=`${name} · ${volume.name} rain`;snow.name=`${name} · ${volume.name} snow`;
    for(const particles of [rain,snow]){particles.frustumCulled=false;particles.layers.set(1);group.add(particles);}
    return {volume,start,count:0,rain,snow,rainGeometry,snowGeometry};
  });
  let mode:OsCityWeather='rain',timeOfDay:CityTimeOfDay='day',profile=getCityPrecipitationProfile(mode,timeOfDay),elapsed=0,motionUpdates=0,disposed=false;
  function writeRain(){
    for(const field of fields)for(let i=field.start;i<field.start+field.count;i++){
      const p=i*3,r=i*6,duration=profile.dropLength/(profile.fallSpeed*speeds[i]);
      vertices[r]=positions[p];vertices[r+1]=positions[p+1];vertices[r+2]=positions[p+2];
      vertices[r+3]=Math.max(field.volume.minX,positions[p]-profile.windX*duration);
      vertices[r+4]=positions[p+1]+profile.dropLength;
      vertices[r+5]=Math.max(field.volume.minZ,positions[p+2]-profile.windZ*duration);
    }
    rainAttribute.needsUpdate=true;
  }
  function setWeather(value:OsCityWeather,time:CityTimeOfDay='day'){
    mode=value;timeOfDay=time;profile=getCityPrecipitationProfile(mode,timeOfDay);
    for(const field of fields){
      field.count=Math.round(field.volume.capacity*profile.amount);
      field.rain.visible=profile.precipitation==='rain';field.snow.visible=profile.precipitation==='snow';
      field.rainGeometry.setDrawRange(field.start*2,field.count*2);field.snowGeometry.setDrawRange(0,field.count);
    }
    rainMaterial.opacity=profile.rainOpacity;rainMaterial.color.set(profile.rainColor);
    snowMaterial.color.set(profile.snowColor);snowMaterial.size=profile.snowSize;snowMaterial.opacity=profile.snowOpacity;
    writeRain();
  }
  const wrap=(value:number,min:number,max:number)=>min+((value-min)%(max-min)+(max-min))%(max-min);
  function update(delta:number,time:number){
    if(disposed)return;
    elapsed=time;
    if(reducedMotion.matches||profile.precipitation==='none')return;
    const dt=THREE.MathUtils.clamp(delta,0,.05),snowy=profile.precipitation==='snow';
    for(const field of fields){
      const volume=field.volume;
      for(let i=field.start;i<field.start+field.count;i++){
        const p=i*3;
        positions[p]=wrap(positions[p]+dt*(profile.windX+(snowy?Math.sin(time*.7+i)*.16:0)),volume.minX,volume.maxX);
        positions[p+1]=wrap(positions[p+1]-dt*profile.fallSpeed*speeds[i],volume.minY,volume.maxY);
        positions[p+2]=wrap(positions[p+2]+dt*(profile.windZ+(snowy?Math.cos(time*.54+i)*.13:0)),volume.minZ,volume.maxZ);
      }
      if(snowy)field.snowGeometry.getAttribute('position').needsUpdate=true;
    }
    if(!snowy)writeRain();motionUpdates++;
  }
  function snapshot(){
    const sample=(index:number)=>Array.from(positions.subarray(index*3,index*3+3)).map(value=>Number(value.toFixed(4)));
    const first=fields[0],far=fields[1]??first;
    let observedMinX=Infinity;
    for(let index=first.start;index<first.start+first.count;index++)observedMinX=Math.min(observedMinX,positions[index*3]);
    return {mode,timeOfDay,sharedWeather:true,precipitation:profile.precipitation,nearCount:first.count,farCount:fields.slice(1).reduce((sum,field)=>sum+field.count,0),particleCount:fields.reduce((sum,field)=>sum+field.count,0),nearBoundaryX:first.volume.minX,observedMinX:Number.isFinite(observedMinX)?observedMinX:null,nearSample:[sample(first.start),sample(first.start+1),sample(first.start+2)],farSample:[sample(far.start),sample(far.start+1)],fallSpeed:profile.fallSpeed,wind:[profile.windX,profile.windZ],dropLength:profile.dropLength,amount:profile.amount,rainOpacity:profile.rainOpacity,rainColor:profile.rainColor,snowSize:profile.snowSize,snowColor:profile.snowColor,lightning:getCityWeatherLightning(mode,elapsed,reducedMotion.matches),reducedMotion:reducedMotion.matches,motionUpdates,elapsed,disposed,atmosphere:getCityWeatherAtmosphere(mode,timeOfDay),volumes:fields.map(field=>({...field.volume,count:field.count,sample:sample(field.start)}))};
  }
  function dispose(){
    if(disposed)return;disposed=true;
    for(const field of fields){field.rainGeometry.dispose();field.snowGeometry.dispose();}
    rainMaterial.dispose();snowMaterial.dispose();snowTexture.dispose();
  }
  setWeather('rain');
  return {group,setWeather,update,snapshot,dispose};
}
