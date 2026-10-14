import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

/** One room-local reflection probe and restrained photographic finishing. */
export function createRoomRendering(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const coarse = matchMedia('(pointer: coarse)').matches;
  // Glass and transparent atmosphere must not become opaque occluders in the AO pass.
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some(material => material.transparent)) object.layers.set(1);
  });
  camera.layers.enable(1);
  let environment: THREE.WebGLRenderTarget;
  function refreshEnvironment() {
    const citySettings=scene.userData.cityRendering;
    if(citySettings)renderer.toneMappingExposure=citySettings.exposure;
    const cubeTarget = new THREE.WebGLCubeRenderTarget(256, {type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter});
    const probe = new THREE.CubeCamera(.1, 450, cubeTarget);
    probe.position.fromArray(scene.userData.reflectionProbe ?? [-1.2, 2.4, -.2]);
    scene.environment = null;
    renderer.shadowMap.needsUpdate = true;
    probe.update(renderer, scene);
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment?.dispose(); environment = pmrem.fromCubemap(cubeTarget.texture);
    scene.environment = environment.texture;
    scene.environmentIntensity = citySettings?.environmentIntensity ?? (scene.userData.apartment?.northCity ? .38 : .55);
    cubeTarget.dispose(); pmrem.dispose();
    renderer.shadowMap.needsUpdate = true;
  }
  refreshEnvironment();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.updateGtaoMaterial({radius: .32, thickness: .6, distanceExponent: 1, distanceFallOff: 1, scale: 1, samples: coarse ? 8 : 16});
  ao.updatePdMaterial({radius: 5, samples: 12, depthPhi: 2, normalPhi: 3});
  ao.blendIntensity = scene.userData.apartment?.northCity ? .9 : .72;
  // AO is composited after material fog. Without matching its transmittance,
  // dark contact outlines reveal buildings that the atmosphere has obscured.
  // Read the actual opaque depth buffer, retaining essentially full contact
  // shading nearby while allowing distant occlusion to disappear into the fog.
  const aoFogUniforms={
    tSceneDepth:{value:ao.depthTexture},
    aoCameraNear:{value:camera.near},aoCameraFar:{value:camera.far},
    aoFogDensity:{value:0},
  };
  Object.assign(ao.blendMaterial.uniforms,aoFogUniforms);
  ao.blendMaterial.fragmentShader=ao.blendMaterial.fragmentShader
    .replace('uniform float intensity;',`uniform float intensity;
      uniform sampler2D tSceneDepth;
      uniform float aoCameraNear;
      uniform float aoCameraFar;
      uniform float aoFogDensity;
      #include <packing>`)
    .replace('vec4 texel = texture2D( tDiffuse, vUv );',`vec4 texel = texture2D( tDiffuse, vUv );
      float opaqueDepth = texture2D(tSceneDepth, vUv).x;
      float viewDepth = max(0.0, -perspectiveDepthToViewZ(opaqueDepth, aoCameraNear, aoCameraFar));
      float fogTransmittance = exp(-aoFogDensity * aoFogDensity * viewDepth * viewDepth);`)
    .replace('texel.rgb, intensity)', 'texel.rgb, intensity * fogTransmittance)');
  ao.blendMaterial.needsUpdate=true;
  const renderAO = ao.render.bind(ao);
  ao.render = (renderer, writeBuffer, readBuffer, deltaTime, maskActive) => {
    aoFogUniforms.tSceneDepth.value=ao.depthTexture;
    aoFogUniforms.aoCameraNear.value=camera.near;aoFogUniforms.aoCameraFar.value=camera.far;
    aoFogUniforms.aoFogDensity.value=scene.userData.apartment?.northCity&&scene.fog instanceof THREE.FogExp2?scene.fog.density:0;
    camera.layers.disable(1);
    try { renderAO(renderer, writeBuffer, readBuffer, deltaTime, maskActive); }
    finally { camera.layers.enable(1); }
  };
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .12, .35, 1.6);
  composer.addPass(bloom);
  let appliedCitySettings:unknown;
  function updateColorResponse(){
    const settings=scene.userData.cityRendering;
    if(!settings||settings===appliedCitySettings)return;
    appliedCitySettings=settings;
    renderer.toneMappingExposure=settings.exposure;
    bloom.strength=settings.bloomStrength;bloom.radius=settings.bloomRadius;bloom.threshold=settings.bloomThreshold;
    // Expose the actual renderer/pass values for room diagnostics, not only preset intent.
    scene.userData.actualCityRendering={exposure:renderer.toneMappingExposure,environmentIntensity:scene.environmentIntensity,bloomStrength:bloom.strength,bloomRadius:bloom.radius,bloomThreshold:bloom.threshold};
  }
  updateColorResponse();
  const output = new OutputPass();
  composer.addPass(output);
  const antialias = new ShaderPass(FXAAShader);
  composer.addPass(antialias);
  renderer.info.autoReset = false;
  // Furnishings and architecture are static. Reuse their high-resolution
  // shadows while navigating, rather than redrawing the whole district twice.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  function resize(width: number, height: number) {
    composer.setSize(width, height);
    // Half-resolution denoised AO on touch devices keeps navigation responsive.
    const scale = renderer.getPixelRatio() * (coarse ? .5 : .75);
    ao.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
    antialias.uniforms.resolution.value.set(1 / (width * renderer.getPixelRatio()), 1 / (height * renderer.getPixelRatio()));
  }
  resize(innerWidth, innerHeight);
  return {
    render() { updateColorResponse();renderer.info.reset(); composer.render(); },
    resize,
    refreshEnvironment,
    dispose() {
      scene.environment = null;
      environment.dispose();
      for (const pass of composer.passes) pass.dispose();
      composer.dispose();
    },
  };
}
