import * as THREE from 'three';
import { getCityWeatherPreset, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';

type LightingKind = 'window' | 'neon' | 'fixture' | 'surface';
type LuminousMaterial = THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.SpriteMaterial;

/** Keep body fog untouched. Only actual emissive pixels receive a longer,
 * Beer-Lambert scattering path; the HDR bloom pass spreads their light cores. */
export function createCityNeonAtmosphere(label:string) {
  const density={value:.01};
  let weather:OsCityWeather='rain',timeOfDay:CityTimeOfDay='day';
  let profile=getCityWeatherPreset(weather,timeOfDay);
  const entries=new Map<LuminousMaterial,{kind:LightingKind;base:number;color:THREE.Color;pulse:number;label:string}>();
  const lights=new Map<THREE.Light,{base:number;pulse:number}>();
  const multiplier=(kind:LightingKind)=>kind==='window'?profile.windowGlow:kind==='surface'?profile.ambient/.28:kind==='fixture'?profile.fixtureIntensity:profile.neonIntensity;
  function write(material:LuminousMaterial){
    const entry=entries.get(material)!;const scale=multiplier(entry.kind)*entry.pulse;
    if(material instanceof THREE.MeshStandardMaterial)material.emissiveIntensity=entry.base*scale;
    else material.color.copy(entry.color).multiplyScalar(scale);
  }
  function register<T extends THREE.Material>(material:T,kind:LightingKind,name=material.name):T {
    if(!(material instanceof THREE.MeshStandardMaterial||material instanceof THREE.MeshBasicMaterial||material instanceof THREE.SpriteMaterial)||entries.has(material))return material;
    const base=material instanceof THREE.MeshStandardMaterial?material.emissiveIntensity:1;
    entries.set(material,{kind,base,color:material.color.clone(),pulse:1,label:name||kind});
    if(kind!=='surface'){
      const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
      material.onBeforeCompile=(shader,renderer)=>{
        previous.call(material,shader,renderer);
        shader.uniforms.cityNeonFogDensity=density;
        shader.fragmentShader=shader.fragmentShader.replace('#include <fog_pars_fragment>','#include <fog_pars_fragment>\nuniform float cityNeonFogDensity;');
        // EffectComposer's HDR render target is linear here, before OutputPass.
        // The normal fog result already contains emission * bodyTransmittance.
        // Add only its missing luminous component, never diffuse/albedo pixels.
        const radiance=material instanceof THREE.MeshStandardMaterial?'totalEmissiveRadiance':'diffuseColor.rgb';
        shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              float cityBodyTransmission = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #else
              float cityBodyTransmission = 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
            #endif
            float cityLightTransmission = exp(-cityNeonFogDensity * max(0.0, vFogDepth));
            gl_FragColor.rgb += ${radiance} * max(0.0, cityLightTransmission - cityBodyTransmission);
          #endif`);
      };
      material.customProgramCacheKey=()=>cacheKey+'|city-emissive-fog-v1';
      material.needsUpdate=true;
    }
    material.userData.cityAtmosphere={kind,baseIntensity:base,emissionOnly:kind!=='surface'};
    return material;
  }
  function registerLight(light:THREE.Light){if(!lights.has(light))lights.set(light,{base:light.intensity,pulse:1});return light;}
  function setWeather(mode:OsCityWeather,time:CityTimeOfDay='day'){
    weather=mode;timeOfDay=time;profile=getCityWeatherPreset(mode,time);density.value=profile.neonFogDensity;
    entries.forEach((_,material)=>write(material));lights.forEach((entry,light)=>{light.intensity=entry.base*profile.fixtureIntensity*entry.pulse;});
  }
  function setPulse(material:LuminousMaterial,pulse:number){const entry=entries.get(material);if(entry){entry.pulse=pulse;write(material);}}
  function setLightPulse(light:THREE.Light,pulse:number){const entry=lights.get(light);if(entry){entry.pulse=pulse;light.intensity=entry.base*profile.fixtureIntensity*pulse;}}
  function snapshot(){return {label,weather,timeOfDay,emissionOnlyFog:true,bodyFogDensity:profile.fog,neonFogDensity:density.value,
    multipliers:{neonIntensity:profile.neonIntensity,windowGlow:profile.windowGlow,fixtureIntensity:profile.fixtureIntensity,surfaceAmbient:profile.ambient/.28},
    materials:[...entries].map(([material,entry])=>({name:entry.label,kind:entry.kind,baseEmission:entry.base,emission:material instanceof THREE.MeshStandardMaterial?material.emissiveIntensity:null,color:material.color.toArray(),pulse:entry.pulse,emissiveMap:material instanceof THREE.MeshStandardMaterial&&!!material.emissiveMap,fog:material.fog})),
    lights:[...lights].map(([light,entry])=>({name:light.name,baseIntensity:entry.base,intensity:light.intensity,pulse:entry.pulse})),
    transmission:[30,75,150,250].map(distance=>({distance,body:Math.exp(-((profile.fog*distance)**2)),emission:Math.max(Math.exp(-profile.neonFogDensity*distance),Math.exp(-((profile.fog*distance)**2)))})),
  };}
  return {register,registerLight,setWeather,setPulse,setLightPulse,snapshot};
}
