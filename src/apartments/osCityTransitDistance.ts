import * as THREE from 'three';

// The same geographic fade applies to track, supports, lights and train bodies.
// The physical endpoints and vehicle reset lie well beyond the invisible zone.
export const CITY_TRANSIT_FADE_START = 165;
export const CITY_TRANSIT_FADE_END = 245;
export const cityTransitVisibility = (z: number) => 1-THREE.MathUtils.smoothstep(Math.abs(z+5),CITY_TRANSIT_FADE_START,CITY_TRANSIT_FADE_END);

export function applyCityTransitDistanceFade<T extends THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>(material:T):T {
  const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.transparent=true;
  // Preserve self-occlusion of the solid near vehicles; fully faded fragments
  // discard before writing depth. Transparent objects skip the opaque AO pass.
  material.depthWrite=true;
  material.userData.transitDistanceFade={start:CITY_TRANSIT_FADE_START,end:CITY_TRANSIT_FADE_END,axis:'abs(worldZ + 5)'};
  material.onBeforeCompile=(shader,renderer)=>{
    previous.call(material,shader,renderer);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float transitWorldZ;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vec4 transitWorldPosition=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        transitWorldPosition=instanceMatrix*transitWorldPosition;
      #endif
      transitWorldZ=(modelMatrix*transitWorldPosition).z;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float transitWorldZ;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      diffuseColor.a*=1.0-smoothstep(${CITY_TRANSIT_FADE_START.toFixed(1)},${CITY_TRANSIT_FADE_END.toFixed(1)},abs(transitWorldZ+5.0));
      if(diffuseColor.a<0.001) discard;`);
  };
  material.customProgramCacheKey=()=>cacheKey+'|city-transit-distance-v1';
  return material;
}
