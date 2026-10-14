import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getCityWeatherPreset, type OsCityWeather, type CityTimeOfDay } from './osCityWeather';
import { sampleCityDistantNeonPulse, type createCityDistantNeon } from './osCityDistantNeon';
import type { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import type { createCityWindowTv } from './osCityWindowTv';

const ROOT='/apartments/assets/north-city/skyline-r29/';
// Normalized coordinates on the authored unlit plate. Geometry remains planar,
// preserving architectural verticals instead of bending a photo around a cylinder.
const SCREEN_ANCHORS=[
  [.075,.342,.017,.068],[.184,.475,.014,.047],[.341,.438,.026,.122],
  [.202,.880,.043,.135],[.270,.735,.022,.095],[.375,.655,.016,.059],
  [.460,.670,.024,.073],[.546,.485,.014,.055],[.730,.410,.036,.090],
  [.724,.742,.026,.100],[.803,.515,.017,.076],[.884,.715,.038,.080],[.944,.398,.019,.041],
];
const ACCENTS=[
  [.073,.328,.0018,.11],[.256,.483,.0017,.19],[.348,.227,.0015,.20],
  [.431,.817,.0018,.14],[.625,.403,.0015,.12],[.708,.256,.0019,.19],
  [.739,.654,.0017,.19],[.827,.708,.0015,.15],[.920,.447,.0014,.13],
];
type ScreenEdit={tile?:number;position?:[number,number,number];width?:number;height?:number;color?:string};

/** Image-backed far district; all active emitters remain economical 3D geometry. */
export function createOsCityBackdrop(atmosphere:ReturnType<typeof createCityNeonAtmosphere>,
  neon:ReturnType<typeof createCityDistantNeon>,windows:ReturnType<typeof createCityWindowTv>,graphic:THREE.MeshStandardMaterial){
  const group=new THREE.Group();group.name='Circuit Market · image-backed distant district';
  const width=630,height=210,bottom=-14.02;
  const panels=[{name:'East',x:310,z:-5,rotation:-Math.PI/2},{name:'North',x:-5,z:-320,rotation:0},{name:'South',x:-5,z:310,rotation:Math.PI}];
  const locate=(panel:typeof panels[number],u:number,v:number,out=0)=>{
    const x=(u-.5)*width,y=bottom+(1-v)*height,c=Math.cos(panel.rotation),s=Math.sin(panel.rotation);
    return new THREE.Vector3(panel.x+c*x+s*out,y,panel.z-s*x+c*out);
  };
  const daylight={value:.85},tint={value:new THREE.Color('#d7e8f2')},snow={value:0};
  let weather:OsCityWeather='rain',time:CityTimeOfDay='day',windowCount=0,loaded=false;
  let texture!:THREE.Texture;
  const imageReady=new Promise<void>((resolve,reject)=>{texture=new THREE.TextureLoader().load(ROOT+'unlit-city.png',()=>resolve(),undefined,()=>reject(new Error('Distant city matte did not load')));});texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  // Offset the photographic depth slightly behind its mounted light geometry;
  // centimetre separation is below 24-bit depth precision at this distance.
  const body=new THREE.MeshBasicMaterial({map:texture,alphaTest:.12,transparent:true,depthWrite:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:4,fog:true});body.name='Distant city matte · transparent sky, unlit architecture';
  body.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{cityMatteDay:daylight,cityMatteTint:tint,cityMatteSnow:snow});
    // The flat proxy stands behind the full orbital route. Its front pictured
    // buildings represent the last skyline band, at 70% of proxy distance.
    // All weather still uses the same scene fog density and color.
    shader.vertexShader=shader.vertexShader.replace('#include <fog_vertex>','#include <fog_vertex>\n#ifdef USE_FOG\n vFogDepth *= .70;\n#endif');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float cityMatteDay; uniform vec3 cityMatteTint; uniform float cityMatteSnow;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float cityMatteLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      vec3 cityDayAlbedo=cityMatteTint*(.11+sqrt(max(0.0,cityMatteLuma))*.78);
      diffuseColor.rgb=mix(diffuseColor.rgb*3.2,cityDayAlbedo,cityMatteDay);
      float cityRoof=diffuseColor.a*(1.0-texture2D(map,vMapUv+vec2(0.0,2.0/724.0)).a);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.88,.94),cityMatteSnow*cityRoof*.9);`);
  };
  body.customProgramCacheKey=()=> 'city-unlit-matte-weather-v1';
  const plateGeometry=new THREE.PlaneGeometry(width,height);
  for(const panel of panels){const mesh=new THREE.Mesh(plateGeometry,body);mesh.name=`Distant city matte · ${panel.name} planar sector`;mesh.position.set(panel.x,bottom+height/2,panel.z);mesh.rotation.y=panel.rotation;mesh.userData.imageBacked=true;group.add(mesh);}

  const descriptors=panels.flatMap((panel,sector)=>SCREEN_ANCHORS.map(([u,v,w,h],index)=>({
    name:`${panel.name} skyline screen ${index+1}`,position:locate(panel,u,v,.003).toArray() as [number,number,number],
    width:w*width,height:h*height,rotation:panel.rotation,tile:(index+sector*3)%8,color:'#ffffff',pulse:1,
  })));
  const count=descriptors.length,tiles=new THREE.InstancedBufferAttribute(new Float32Array(count),1),pulses=new THREE.InstancedBufferAttribute(new Float32Array(count).fill(1),1);
  pulses.setUsage(THREE.DynamicDrawUsage);
  const signGeometry=new THREE.PlaneGeometry(.94,.94).translate(0,0,.245);signGeometry.setAttribute('cityBoardTile',tiles);signGeometry.setAttribute('cityBoardPulse',pulses);
  const signMaterial=graphic.clone();signMaterial.emissiveIntensity=3.0;signMaterial.name='Editable far neon screens · shared eight-design atlas';
  // Graphic face and its mount are only 5 mm apart. At a few hundred metres
  // ordinary depth precision lets the subsequently drawn frame erase the face.
  signMaterial.polygonOffset=true;signMaterial.polygonOffsetFactor=-1;signMaterial.polygonOffsetUnits=-4;
  signMaterial.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float cityBoardTile; attribute float cityBoardPulse; varying float vCityBoardPulse;');
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vMapUv=vec2((mod(cityBoardTile,2.0)+.006+uv.x*.988)/2.0,1.0-(floor(cityBoardTile/2.0)+.994-uv.y*.988)/4.0);
      vEmissiveMapUv=vMapUv;vCityBoardPulse=cityBoardPulse;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vCityBoardPulse;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vCityBoardPulse;\n#ifdef USE_COLOR\n totalEmissiveRadiance*=vColor;\n#endif');
  };
  signMaterial.customProgramCacheKey=()=> 'city-editable-instanced-neon-v1';atmosphere.register(signMaterial,'neon',signMaterial.name);
  const signs=new THREE.InstancedMesh(signGeometry,signMaterial,count);signs.name='Editable 3D skyline boards · individually transformable instances';group.add(signs);
  const frames=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,.24).translate(0,0,.12),new THREE.MeshStandardMaterial({color:'#172b3b',roughness:.55,metalness:.68}),count);frames.name='Skyline screen mounting plates · backs rest on image facade';group.add(frames);
  const dummy=new THREE.Object3D();
  function writeScreen(index:number){const d=descriptors[index];dummy.position.fromArray(d.position);dummy.rotation.set(0,d.rotation,0);dummy.scale.set(d.width,d.height,1);dummy.updateMatrix();signs.setMatrixAt(index,dummy.matrix);frames.setMatrixAt(index,dummy.matrix);signs.setColorAt(index,new THREE.Color(d.color));tiles.setX(index,d.tile);tiles.needsUpdate=true;signs.instanceMatrix.needsUpdate=true;frames.instanceMatrix.needsUpdate=true;if(signs.instanceColor)signs.instanceColor.needsUpdate=true;}
  function setScreen(index:number,edit:ScreenEdit){
    if(!Number.isInteger(index)||index<0||index>=count)throw new Error('Unknown skyline screen');const d=descriptors[index];
    if(edit.position?.every(Number.isFinite))d.position=[...edit.position];
    if(Number.isFinite(edit.width)&&edit.width!>0)d.width=edit.width!;if(Number.isFinite(edit.height)&&edit.height!>0)d.height=edit.height!;
    if(Number.isFinite(edit.tile))d.tile=THREE.MathUtils.euclideanModulo(Math.round(edit.tile!),8);if(edit.color)d.color=edit.color;
    writeScreen(index);signs.computeBoundingSphere();frames.computeBoundingSphere();
  }
  descriptors.forEach((_,i)=>writeScreen(i));signs.computeBoundingSphere();frames.computeBoundingSphere();group.userData.setScreen=setScreen;

  const accentBatches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  panels.forEach((panel,sector)=>ACCENTS.forEach(([u,v,w,h],i)=>{const g=new THREE.PlaneGeometry(w*width,h*height),p=locate(panel,u,v,.004);g.rotateY(panel.rotation);g.translate(p.x,p.y,p.z);const material=neon.material((i+sector*2)%7),list=accentBatches.get(material)??[];list.push(g.toNonIndexed());g.dispose();accentBatches.set(material,list);}));
  for(const [material,parts] of accentBatches){const mesh=new THREE.Mesh(mergeGeometries(parts,false)!,material);mesh.name='Picture-mounted architectural neon strips';parts.forEach(g=>g.dispose());group.add(mesh);}
  const ready=Promise.all([
    imageReady,
    fetch(ROOT+'windows.json').then(response=>{if(!response.ok)throw new Error('Distant window placement data missing');return response.json();}).then((data:{placements:number[][]})=>{
      const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),palette=['#ffd598','#67e3ff','#e496ef'];
      // These quads contain only glass, with no baked frame texture. Coverage
      // must include every pixel, or a bright rim survives even at 0% lights.
      const materials=palette.map((color,index)=>{const material=windows.material(new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.0,roughness:.48,metalness:.05}),'room',false,true);material.name='Picture-mounted controllable rooms '+index;return atmosphere.register(material,'window',material.name);});
      panels.forEach((panel,sector)=>data.placements.forEach(([u,v,w,h,palette],i)=>{const p=locate(panel,u,v,.006),g=windows.tagGeometry(new THREE.PlaneGeometry(w*width,h*height),40000+sector*5000+i,'room');g.rotateY(panel.rotation);g.translate(p.x,p.y,p.z);const material=materials[palette%materials.length],list=batches.get(material)??[];list.push(g.toNonIndexed());g.dispose();batches.set(material,list);windowCount++;}));
      for(const [material,parts] of batches){const mesh=new THREE.Mesh(mergeGeometries(parts,false)!,material);mesh.name='Picture-mounted windows · shared illumination, shadow and TV controls';parts.forEach(g=>g.dispose());group.add(mesh);}
    }),
  ]).then(()=>{atmosphere.setWeather(weather,time);loaded=true;});
  function setWeather(mode:OsCityWeather,selectedTime:CityTimeOfDay){weather=mode;time=selectedTime;const profile=getCityWeatherPreset(mode,time);daylight.value={night:0,evening:.28,morning:.62,day:.86}[time];tint.value.set(profile.ambientColor);snow.value=mode==='snow'?1:0;}
  function update(elapsed:number,reducedMotion:boolean){descriptors.forEach((d,i)=>{d.pulse=sampleCityDistantNeonPulse(71317+i*173,elapsed,reducedMotion,time);pulses.setX(i,d.pulse);});pulses.needsUpdate=true;}
  const snapshot=()=>({loaded,asset:ROOT+'unlit-city.png',panels:panels.length,geometry:'Three upright flat image sectors; no cylindrical warp or photographic rails',windowCount,editableBoardCount:count,boardDrawCalls:2,accentCount:ACCENTS.length*panels.length,extraRealtimeLights:0,windowControlsShared:true,transparentSky:true,bakedWindowLights:false,weather,timeOfDay:time,daylight:daylight.value,snow:snow.value,opticalDepthScale:.70,screens:descriptors.map(d=>({...d,position:[...d.position]}))});
  group.userData.snapshot=snapshot;setWeather('rain','day');return{group,ready,setWeather,update,snapshot,setScreen,dispose:()=>{signs.dispose();frames.dispose();}};
}
