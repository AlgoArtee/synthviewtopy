import { getCityWeatherPreset, type CityTimeOfDay } from './osCityWeather';
import { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CityRoundedBoxGeometry } from './osCityGeometry';
import type { OsCityWeather } from './osCityExterior';
import { createCityGhostHolograms } from './osCityHolograms';

// Exterior miniatures use 0.70 scene units per metre, calibrated to the 1.05-unit car height.
export const CITY_SCALE = {unitsPerMetre:.70,carHeightMetres:1.50,personMinMetres:1.60,personMaxMetres:1.84,previousMeanScale:.89,personMeshHeight:1.628};
export const CITY_BRIDGES = [{z:-31,y:5.7,width:12.8,count:28},{z:-53,y:-2.4,width:13.8,count:24},{z:-91,y:-1.9,width:16,count:16}];

/** Instanced traffic and people, dimensional holograms and one soft steam particle system. */
export function createOsCityLife() {
  const group = new THREE.Group(); group.name = 'North City · moving street life';
  const neonAtmosphere=createCityNeonAtmosphere('North city moving traffic');
  let seed=88321; const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  const roadY=-10.685;
  function joined(parts:THREE.BufferGeometry[]) {const flat=parts.map(g=>{if(!g.index)return g;const f=g.toNonIndexed();g.dispose();return f;});const g=mergeGeometries(flat,false)!;flat.forEach(p=>p.dispose());return g;}
  function box(w:number,h:number,d:number,x=0,y=0,z=0,r=.025) {const g=new CityRoundedBoxGeometry(w,h,d,2,Math.min(r,w*.3,h*.3,d*.3));g.translate(x,y,z);return g;}
  function sphere(r:number,x:number,y:number,z:number,sx=1,sy=1,sz=1) {const g=new THREE.SphereGeometry(r,16,10);g.scale(sx,sy,sz);g.translate(x,y,z);return g;}
  function limb(a:THREE.Vector3,b:THREE.Vector3,r1:number,r2=r1) {const direction=b.clone().sub(a),g=new THREE.CylinderGeometry(r2,r1,direction.length(),10);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0,1,0),direction.normalize()));const center=a.clone().add(b).multiplyScalar(.5);g.translate(center.x,center.y,center.z);return g;}
  function instances(name:string,geometry:THREE.BufferGeometry,material:THREE.Material,count:number) {const m=new THREE.InstancedMesh(geometry,material,count);m.name=name;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=false;m.receiveShadow=false;group.add(m);return m;}
  const dummy=new THREE.Object3D();
  function matrix(x:number,y:number,z:number,ry=0,rx=0) {dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,0);dummy.scale.set(1,1,1);dummy.updateMatrix();return dummy.matrix;}
  function texture(draw:(c:CanvasRenderingContext2D)=>void,size=128) {const canvas=document.createElement('canvas');canvas.width=canvas.height=size;draw(canvas.getContext('2d')!);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
  const glowMap=texture(c=>{
    // Overlapping anisotropic pools fade irregularly, with no rectangular or periodic stripe edge.
    for(let i=0;i<160;i++){
      const y=7+rnd()*114,fade=Math.sin(y/128*Math.PI),x=64+(rnd()-.5)*24;
      c.save();c.translate(x,y);c.scale(5+rnd()*22,1.3+rnd()*4.0);
      const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(255,255,255,${fade*(.08+rnd()*.22)})`);g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
    }
  });
  const glowMat=(color:string,opacity:number)=>{
    const m=new THREE.MeshBasicMaterial({color,map:glowMap,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
    m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWetPosition;').replace('#include <project_vertex>',`#include <project_vertex>
      vec4 wetPosition = vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      wetPosition = instanceMatrix * wetPosition;
      #endif
      vWetPosition = (modelMatrix * wetPosition).xyz;`);shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vWetPosition;
      float wetHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float wetNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(wetHash(i),wetHash(i+vec2(1,0)),f.x),mix(wetHash(i+vec2(0,1)),wetHash(i+vec2(1,1)),f.x),f.y);}`)
      .replace('#include <color_fragment>','#include <color_fragment>\nfloat puddle = wetNoise(vWetPosition.xz * vec2(2.1,5.2)) * .55 + wetNoise(vWetPosition.xz * vec2(.6,1.3)) * .45; diffuseColor.a *= .26 + .74 * smoothstep(.12,.88,puddle);');};
    m.customProgramCacheKey=()=> 'north-city-wet-reflection-v2';return m;
  };

  const carCount=44;
  const cars=Array.from({length:carCount},(_,i)=>({lane:i%4,slot:Math.floor(i/4),paint:i%7,paintSlot:0,phase:rnd()*3,stretch:.82+rnd()*.65,width:.86+rnd()*.35,z:0}));
  const paintCounts=[0,0,0,0,0,0,0];cars.forEach(c=>c.paintSlot=paintCounts[c.paint]++);
  const bodyGeometries=Array.from({length:4},(_,style)=>joined([
    box(1.18,.29,2.55,0,.405,0,.12),box(1.10,.14,2.37,0,.60,0,.065),
    box(1.01,.34,style===1?1.68:style===2?1.45:1.25,0,.79,style===1?.27:.08,.14),
    box(.94,.045,style===1?1.42:style===2?1.19:.97,0,.976,style===1?.27:.10,.02),
    ...(style===2?[box(.11,.045,1.22,-.39,1.015,.12),box(.11,.045,1.22,.39,1.015,.12)]:[]),
    ...(style===3?[box(.33,.12,.27,0,1.048,.10,.04)]:[]),
  ]));
  const paints=['#657b8e','#a5b0b5','#4c6b78','#8d5c62','#53676a','#8f876d','#303d4a'].map((color,i)=>instances('Traffic · varied sedan, hatchback, SUV and taxi '+i,bodyGeometries[i%4],new THREE.MeshPhysicalMaterial({color,metalness:.58,roughness:.24,clearcoat:.9,emissive:color,emissiveIntensity:.14}),paintCounts[i]));
  const glazingMaterial=new THREE.MeshStandardMaterial({color:'#294555',metalness:.65,roughness:.15,emissive:'#b7d4dc',emissiveIntensity:.15});
  const vehicleGlass=Array.from({length:7},(_,i)=>{
    const hatch=i%4===1,back=hatch?1.115:.74,center=hatch?.27:.08,length=hatch?1.51:1.04;
    return instances('Traffic · varied recessed vehicle glazing '+i,joined([box(.92,.25,.035,0,.80,-.58,.01),box(.92,.23,.035,0,.80,back,.01),box(.028,.24,length,-.514,.80,center,.01),box(.028,.24,length,.514,.80,center,.01)]),glazingMaterial,paintCounts[i]);
  });
  const wheelParts:THREE.BufferGeometry[]=[],rimParts:THREE.BufferGeometry[]=[];
  for(const x of [-.60,.60])for(const z of [-.86,.86]) {const g=new THREE.CylinderGeometry(.225,.225,.15,12);g.rotateZ(Math.PI/2);g.translate(x,.225,z);wheelParts.push(g);const rim=new THREE.CylinderGeometry(.115,.115,.155,10);rim.rotateZ(Math.PI/2);rim.translate(x,.225,z);rimParts.push(rim);}
  const wheels=instances('Traffic · road-contact tyres',joined(wheelParts),new THREE.MeshStandardMaterial({color:'#121a21',roughness:.95}),carCount);
  const trim=instances('Traffic · wheel rims and bumpers',joined([...rimParts,box(1.12,.08,.08,0,.30,-1.27),box(1.12,.08,.08,0,.30,1.27)]),new THREE.MeshStandardMaterial({color:'#6b7a86',metalness:.86,roughness:.23}),carCount);
  const headlights=instances('Traffic · paired warm headlights',joined([box(.25,.09,.026,-.40,.48,-1.29),box(.25,.09,.026,.40,.48,-1.29)]),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe6ad').multiplyScalar(3.8),toneMapped:false}),carCount);
  const tailLights=instances('Traffic · paired red tail lamps',joined([box(.27,.065,.026,-.40,.49,1.29),box(.27,.065,.026,.40,.49,1.29)]),new THREE.MeshBasicMaterial({color:new THREE.Color('#ff453b').multiplyScalar(3.3),toneMapped:false}),carCount);
  const reflect=(z:number,length:number)=>{const pieces:THREE.BufferGeometry[]=[];for(const x of [-.40,.40]) {const p=new THREE.PlaneGeometry(.84,length);p.rotateX(-Math.PI/2);p.translate(x,.017,z);pieces.push(p);}return joined(pieces);};
  const headReflections=instances('Traffic · wet headlight reflections',reflect(-2.8,4.8),glowMat('#ffdc91',.63),carCount);
  const tailReflections=instances('Traffic · wet red taillight reflections',reflect(2.4,3.5),glowMat('#ff294c',.63),carCount);
  const underglow=instances('Traffic · restrained cyan road glow',(()=>{const g=new THREE.PlaneGeometry(1.05,2.4);g.rotateX(-Math.PI/2);g.translate(0,.012,0);return g;})(),glowMat('#39bcdf',.085),carCount);
  const carParts=[wheels,trim,headlights,tailLights,headReflections,tailReflections,underglow];

  const neonPools=new THREE.Group();neonPools.name='Wet street · broad irregular neon reflection pools';group.add(neonPools);
  for(let i=0;i<18;i++){
    const side=i%2?-1:1,material=glowMat(i%3===0?'#49b6cf':i%3===1?'#e45d9d':'#d3b593',.17+rnd()*.16);
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.8+rnd()*2.4,5+rnd()*8),material);plane.rotation.x=-Math.PI/2;plane.rotation.z=(rnd()-.5)*.2;
    plane.position.set(-3+side*(1.7+rnd()*1.4),roadY+.012,-16-Math.floor(i/2)*11.3-rnd()*5);neonPools.add(plane);
  }

  const people=CITY_BRIDGES.flatMap((b,bridge)=>Array.from({length:b.count},(_,i)=>({bridge,index:i,phase:(Math.floor(i/2)+[0,.21,-.10,.17,-.18][Math.floor(i/2)%5]+rnd()*.08)/Math.ceil(b.count/2),height:(CITY_SCALE.personMinMetres+rnd()*(CITY_SCALE.personMaxMetres-CITY_SCALE.personMinMetres))*CITY_SCALE.unitsPerMetre/CITY_SCALE.personMeshHeight,width:.86+rnd()*.38,gait:rnd(),speed:i%5===0?0:.034,z:b.z+(i%5===0?.51:i%2?-.22:.22),x:0})));
  const bodyParts=[sphere(.098,0,1.53,0),box(.34,.53,.25,0,1.12,0,.09),box(.29,.19,.24,0,.77,0,.06)];
  const personBody=instances('Bridges · pedestrian heads and coats',joined(bodyParts),new THREE.MeshStandardMaterial({color:'#283643',roughness:.86,emissive:'#4e7890',emissiveIntensity:.045}),people.length);
  const personColors=['#6b7580','#89939a','#6a808b','#a38a79','#617f80','#a1a5a1','#566b76'];
  people.forEach((_,i)=>personBody.setColorAt(i,new THREE.Color(personColors[i%personColors.length])));
  const longCoats=instances('Bridges · varied long coats and carried bags',joined([box(.33,.40,.25,0,.68,0,.09),box(.12,.24,.13,.22,.82,.07,.03)]),new THREE.MeshStandardMaterial({color:'#44525c',roughness:.92}),people.length);
  const trouser=new THREE.CylinderGeometry(.045,.055,.74,7);trouser.translate(0,-.37,0);
  const legGeo=joined([trouser,box(.095,.055,.18,0,-.742,.035,.015)]);
  const armGeo=new THREE.CylinderGeometry(.034,.045,.59,7);armGeo.translate(0,-.295,0);
  const legs=instances('Bridges · walking legs',legGeo,new THREE.MeshStandardMaterial({color:'#1a2631',roughness:.9}),people.length*2);
  const arms=instances('Bridges · swinging arms',armGeo,new THREE.MeshStandardMaterial({color:'#32404c',roughness:.88}),people.length*2);

  const ghosts=createCityGhostHolograms();group.add(ghosts.group);group.userData.ready=ghosts.ready;

  const steamMap=texture(c=>{for(let i=0;i<15;i++){const x=30+rnd()*68,y=30+rnd()*68,r=18+rnd()*28;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff75');g.addColorStop(.45,'#ffffff38');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,128,128);}});
  const vents=[v(-7.97,3.3,-16),v(1.98,.9,-24),v(-7.97,-4.3,-29),v(2.0,-5.7,-41),v(-7.96,7.5,-38),v(2.0,4.4,-60),v(-7.96,-8,-13),v(2.0,-8,-19)];
  const steamCount=vents.length*18,steamPositions=new Float32Array(steamCount*3),steamSizes=new Float32Array(steamCount),steamOpacities=new Float32Array(steamCount),steamPhases=Array.from({length:steamCount},()=>rnd());
  const steamGeo=new THREE.BufferGeometry();steamGeo.setAttribute('position',new THREE.BufferAttribute(steamPositions,3));steamGeo.setAttribute('aSize',new THREE.BufferAttribute(steamSizes,1));steamGeo.setAttribute('aOpacity',new THREE.BufferAttribute(steamOpacities,1));
  const steamMat=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uMap:{value:steamMap},uTint:{value:new THREE.Color('#b7c9d4')},uDensity:{value:.42}}]),vertexShader:`attribute float aSize; attribute float aOpacity; varying float vOpacity;
    #include <fog_pars_vertex>
    void main(){ vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mvPosition; gl_PointSize=clamp(aSize*660.0/max(1.0,-mvPosition.z),1.0,160.0); vOpacity=aOpacity;
    #include <fog_vertex>
    }`,fragmentShader:`uniform sampler2D uMap; uniform vec3 uTint; uniform float uDensity; varying float vOpacity;
    #include <fog_pars_fragment>
    void main(){float a=texture2D(uMap,gl_PointCoord).a*vOpacity*uDensity; if(a<.002)discard; gl_FragColor=vec4(uTint,a);
    #include <fog_fragment>
    }`,transparent:true,depthWrite:false,fog:true});
  const steam=new THREE.Points(steamGeo,steamMat);steam.name='Rising vent steam · expanding and fading puffs';steam.frustumCulled=false;group.add(steam);
  let weather:OsCityWeather='rain';
  const heights=people.map(p=>p.height*CITY_SCALE.personMeshHeight);
  const scaleReport={...CITY_SCALE,personSceneHeights:[Math.min(...heights),Math.max(...heights)],meanPersonScale:people.reduce((n,p)=>n+p.height,0)/people.length,reductionFraction:1-(people.reduce((n,p)=>n+p.height,0)/people.length)/CITY_SCALE.previousMeanScale,headLengthsReduced:(1-(people.reduce((n,p)=>n+p.height,0)/people.length)/CITY_SCALE.previousMeanScale)*7.5};
  group.traverse(object=>{const material=(object as THREE.Mesh).material;if(material)(Array.isArray(material)?material:[material]).forEach(mat=>{if(mat instanceof THREE.MeshBasicMaterial)neonAtmosphere.register(mat,'neon',object.name);else if(mat instanceof THREE.MeshStandardMaterial)neonAtmosphere.register(mat,'surface',object.name);});});
  const snapshot={scale:scaleReport,carCount,pedestrianCount:people.length,hologramCount:2,steamVentCount:vents.length,time:0,timeOfDay:'day' as CityTimeOfDay,lighting:neonAtmosphere.snapshot(),carZ:[] as number[],pedestrianX:[] as number[],steamSample:[] as number[],hologramYaw:[] as number[],holograms:ghosts.snapshot};group.userData.animation=snapshot;
  function setWeather(mode:OsCityWeather,timeOfDay:CityTimeOfDay='day'){weather=mode;const p=getCityWeatherPreset(mode,timeOfDay),raining=p.wetness>.2;headReflections.visible=tailReflections.visible=raining;underglow.visible=neonPools.visible=raining;steamMat.uniforms.uDensity.value=raining?.34:mode==='snow'?.32:.21;neonAtmosphere.setWeather(mode,timeOfDay);snapshot.timeOfDay=timeOfDay;snapshot.lighting=neonAtmosphere.snapshot();}
  let lastTime=-1;
  const personBase=new THREE.Matrix4(), personCombined=new THREE.Matrix4(), reflectionMatrix=new THREE.Matrix4(), hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0).setPosition(-3,-30,-60), reflectionScale=new THREE.Vector3();
  function update(elapsed:number){
    if(elapsed===lastTime)return;lastTime=elapsed;
    ghosts.update(elapsed);
    const carLanes=[-6.23,-4.09,-1.91,.23];
    cars.forEach((car,i)=>{const direction=car.lane<2?-1:1,speed=[2.25,2.8,2.55,3.1][car.lane];const distance=(car.slot*(126/11)+car.lane*2.13+car.phase-elapsed*speed*direction+12600)%126;car.z=-8-distance;matrix(carLanes[car.lane],roadY,car.z,direction<0?0:Math.PI);dummy.scale.set(1.12,1,1.12+(car.paint%4)*.075);dummy.updateMatrix();const m=dummy.matrix;paints[car.paint].setMatrixAt(car.paintSlot,m);vehicleGlass[car.paint].setMatrixAt(car.paintSlot,m);carParts.forEach(p=>p.setMatrixAt(i,m));reflectionMatrix.copy(m).scale(reflectionScale.set(car.width,1,car.stretch));headReflections.setMatrixAt(i,reflectionMatrix);tailReflections.setMatrixAt(i,reflectionMatrix);});
    [...paints,...vehicleGlass,...carParts].forEach(m=>m.instanceMatrix.needsUpdate=true);
    people.forEach((person,i)=>{const b=CITY_BRIDGES[person.bridge],u=(person.phase+elapsed*person.speed)%1,forward=person.index%2===0;person.x=-3-b.width*.49+(forward?u:1-u)*b.width*.98;const y=b.y+.366+(weather==='snow'?.12:0),yaw=forward?-Math.PI/2:Math.PI/2,stride=person.speed===0?.07:Math.sin(elapsed*(3.3+person.gait*1.2)+person.phase*19)*.32;
      matrix(person.x,y,person.z,yaw);dummy.scale.set(person.height*person.width,person.height,person.height);dummy.updateMatrix();personBase.copy(dummy.matrix);personBody.setMatrixAt(i,personBase);longCoats.setMatrixAt(i,person.index%3===0?personBase:hiddenMatrix);
      dummy.scale.set(1,1,1);
      for(let side=0;side<2;side++){dummy.position.set((side?1:-1)*.085,.77,0);dummy.rotation.set((side?1:-1)*stride,0,0);dummy.updateMatrix();legs.setMatrixAt(i*2+side,personCombined.multiplyMatrices(personBase,dummy.matrix));dummy.position.set((side?1:-1)*.19,1.34,0);dummy.rotation.set((side?-1:1)*stride*.7,0,(side?1:-1)*.11);dummy.updateMatrix();arms.setMatrixAt(i*2+side,personCombined.multiplyMatrices(personBase,dummy.matrix));}
    });[personBody,longCoats,legs,arms].forEach(m=>m.instanceMatrix.needsUpdate=true);
    for(let i=0;i<steamCount;i++){const origin=vents[Math.floor(i/18)],age=(steamPhases[i]+elapsed*(.075+(i%3)*.006))%1,side=origin.x<-3?1:-1,p=i*3;steamPositions[p]=origin.x+side*(.16+age*.65)+Math.sin(age*8+i)*age*.18;steamPositions[p+1]=origin.y+age*3.9;steamPositions[p+2]=origin.z+Math.sin(age*5+i)*age*.38;steamSizes[i]=.28+age*1.45;steamOpacities[i]=Math.sin(age*Math.PI)**1.6;}
    for(const a of ['position','aSize','aOpacity'])steamGeo.getAttribute(a).needsUpdate=true;
    snapshot.time=+elapsed.toFixed(3);snapshot.carZ=cars.slice(0,4).map(c=>+c.z.toFixed(3));snapshot.pedestrianX=people.slice(0,4).map(p=>+p.x.toFixed(3));snapshot.steamSample=Array.from(steamPositions.slice(0,3),n=>+n.toFixed(3));snapshot.hologramYaw=ghosts.snapshot.yaw;
  }
  setWeather('rain');update(0);
  return {group,setWeather,update};
}
