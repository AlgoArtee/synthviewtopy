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
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, {type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter});
  const probe = new THREE.CubeCamera(.1, 450, cubeTarget);
  probe.position.set(-1.2, 2.4, -.2);
  // Glass and transparent atmosphere must not become opaque occluders in the AO pass.
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some(material => material.transparent)) object.layers.set(1);
  });
  camera.layers.enable(1);
  probe.update(renderer, scene);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromCubemap(cubeTarget.texture);
  scene.environment = environment.texture;
  scene.environmentIntensity = .55;
  cubeTarget.dispose(); pmrem.dispose();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.updateGtaoMaterial({radius: .32, thickness: .6, distanceExponent: 1, distanceFallOff: 1, scale: 1, samples: coarse ? 8 : 16});
  ao.updatePdMaterial({radius: 5, samples: 12, depthPhi: 2, normalPhi: 3});
  ao.blendIntensity = .72;
  const renderAO = ao.render.bind(ao);
  ao.render = (renderer, writeBuffer, readBuffer, deltaTime, maskActive) => {
    camera.layers.disable(1);
    try { renderAO(renderer, writeBuffer, readBuffer, deltaTime, maskActive); }
    finally { camera.layers.enable(1); }
  };
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .12, .35, 1.6);
  composer.addPass(bloom);
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
    render() { renderer.info.reset(); composer.render(); },
    resize,
    dispose() {
      scene.environment = null;
      environment.dispose();
      for (const pass of composer.passes) pass.dispose();
      composer.dispose();
    },
  };
}
