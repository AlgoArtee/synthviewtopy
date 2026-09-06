import * as THREE from 'three';
import { createCygnusSystem, type CygnusSkyState } from './syntheticShore/celestial';
import { oceanVertexShader, oceanFragmentShader } from './syntheticShore/ocean';
import { coastVertexShader, coastFragmentShader } from './syntheticShore/coastShaders';
import { skyFragmentShader } from './syntheticShore/atmosphere';
import { createReflectionUniforms, configureReflectionCamera } from './syntheticShore/reflections';
import { seafloorHeight, sampleNormalWave } from './syntheticShore/simulation';

export interface SyntheticShoreEffectsOptions {
  quality?: 'low' | 'balanced';
}

export interface SyntheticShoreEffects {
  group: THREE.Group;
  water: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  sand: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  groundHeight(x: number, z: number): number;
  waterHeight(x: number, z: number, elapsedSeconds: number): number;
  update(camera: THREE.Camera, elapsedSeconds: number): void;
  renderReflection(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, elapsedSeconds: number): void;
  getCygnusState(): CygnusSkyState;
  dispose(): void;
}

/**
 * The surf and Cygnus shaders are ported from the user's MizuTopia project.
 * Mizu's +X offshore axis is rotated onto this scene's -Z axis. One unit is
 * one metre. Land rises inland at 4%, sharing exactly the water's bathymetry.
 */
export function syntheticShoreGroundHeight(x: number, z: number): number {
  return seafloorHeight(-z, x);
}

function gradedOceanGeometry(quality: 'low' | 'balanced'): THREE.BufferGeometry {
  const segments = quality === 'low' ? 112 : 160;
  const extent = 14000;
  const curve = 7;
  const scale = extent / Math.sinh(curve);
  const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let row = 0; row <= segments; row++) {
    const lateral = Math.sinh((row * 2 / segments - 1) * curve) * scale;
    for (let column = 0; column <= segments; column++) {
      const offshore = Math.sinh((column * 2 / segments - 1) * curve) * scale;
      positions.setXYZ(row * (segments + 1) + column, offshore, 0, lateral);
    }
  }
  geometry.computeBoundingSphere();
  return geometry;
}

function sandGeometry(): THREE.BufferGeometry {
  // Dense around the swash, coarse inland. Offshore sand is integrated into
  // the water shader, so there is no invisible kilometre-scale seabed mesh.
  const offshoreAxis: number[] = [];
  for (let x = -110; x < -12; x += 2) offshoreAxis.push(x);
  for (let x = -12; x <= 30; x += 0.75) offshoreAxis.push(x);
  for (let x = 33; x <= 165; x += 6) offshoreAxis.push(x);
  const lateralSegments = 96;
  const positions = new Float32Array(offshoreAxis.length * (lateralSegments + 1) * 3);
  const indices: number[] = [];
  let vertex = 0;
  for (let row = 0; row <= lateralSegments; row++) {
    const lateral = -145 + row / lateralSegments * 290;
    for (const offshore of offshoreAxis) {
      positions[vertex++] = offshore;
      positions[vertex++] = seafloorHeight(offshore, lateral);
      positions[vertex++] = lateral;
    }
  }
  for (let row = 0; row < lateralSegments; row++) {
    for (let column = 0; column < offshoreAxis.length - 1; column++) {
      const a = row * offshoreAxis.length + column;
      const b = a + 1, c = a + offshoreAxis.length, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

const shoreFrameUniforms = /* glsl */`
  uniform mat4 uShoreToWorld;
  uniform mat4 uWorldToShore;
`;

// Preserve the original surf math in its own coordinate system while all
// camera projection and scene reflection matrices operate in real world space.
const waterVertex = shoreFrameUniforms + oceanVertexShader
  .replace('vec4 world = modelMatrix * vec4(position, 1.0);',
    'vec4 world = uWorldToShore * modelMatrix * vec4(position, 1.0);')
  .replace('projectionMatrix * viewMatrix * world;',
    'projectionMatrix * viewMatrix * uShoreToWorld * world;');

const sandVertex = shoreFrameUniforms + coastVertexShader
  .replace('vec4 world = modelMatrix * vec4(p, 1.0);',
    'vec4 world = uWorldToShore * modelMatrix * vec4(p, 1.0);')
  .replace('normalize(mat3(modelMatrix) * n)',
    'normalize(mat3(uWorldToShore * modelMatrix) * n)')
  .replace('projectionMatrix * viewMatrix * world;',
    'projectionMatrix * viewMatrix * uShoreToWorld * world;');

const silverSandFragment = 'uniform vec3 uShoreCameraPosition;\n' + coastFragmentShader
  .replaceAll('cameraPosition', 'uShoreCameraPosition')
  // This beach is granular silver sand, so retain the natural ripples and
  // wet film rather than Mizu's optional metallic floor-panel material.
  .replace('vec3(0.48, 0.36, 0.22), vec3(0.72, 0.60, 0.40)',
    'vec3(0.38, 0.44, 0.49), vec3(0.77, 0.81, 0.85)')
  .replace('vec3(0.51, 0.57, 0.60)', 'vec3(0.57, 0.65, 0.72)')
  .replace('float bump = ripple * 0.0026 + grain * 0.00055;',
    'float bump = ripple * 0.0026 + grain * 0.0011;')
  .replace('float contactShade = 1.0;', /* glsl */`
    // Sparse mica facets glitter with view/light direction. Pixel filtering
    // averages tiny grains at a distance instead of producing screen noise.
    vec2 micaCell = floor(p * 68.0);
    float mica = step(0.982, hash(micaCell + 75.8));
    vec3 facet = normalize(vec3((hash(micaCell + 2.1) - 0.5) * 0.48,
      1.0, (hash(micaCell + 49.3) - 0.5) * 0.48));
    float sparkle = pow(max(0.0, dot(facet, halfDir)), 170.0) * mica;
    float sparkleFootprint = 1.0 - smoothstep(0.02, 0.12, footprint);
    color += vec3(1.35, 1.52, 1.7) * sparkle * sparkleFootprint
      * daylight * (1.0 - wet * 0.4) * sandMask;
    float contactShade = 1.0;
  `)
  // These contact footprints belong to Mizu's furniture, not this scene.
  .replace('if (sandMask > 0.5 && p.x > -65.0', 'if (false && sandMask > 0.5 && p.x > -65.0');

const silverWaterFragment = oceanFragmentShader
  .replace('vec3(0.12, 0.13, 0.10), vec3(0.28, 0.27, 0.20)',
    'vec3(0.17, 0.22, 0.25), vec3(0.37, 0.43, 0.47)');

export function createSyntheticShoreEffects(options: SyntheticShoreEffectsOptions = {}): SyntheticShoreEffects {
  const quality = options.quality ?? 'balanced';
  const group = new THREE.Group();
  group.name = 'Synthetic shore · MizuTopia ocean and Cygnus X-1';
  const frame = new THREE.Group();
  frame.name = 'MizuTopia metre coordinate frame';
  frame.rotation.y = Math.PI / 2;
  group.add(frame);

  const reflectionUniforms = createReflectionUniforms();
  const shoreToWorld = new THREE.Matrix4();
  const worldToShore = new THREE.Matrix4();
  const cameraPosition = new THREE.Vector3();
  const sunDirection = new THREE.Vector3(-0.34, 0.82, -0.36).normalize();
  const skyColor = new THREE.Color(0x075c8e);
  const horizonColor = new THREE.Color(0xa5d5d9);
  const oceanColor = new THREE.Color(0x047888);
  const waveHeight = 1.2;
  reflectionUniforms.uReflectionSkyColor.value.copy(skyColor);
  reflectionUniforms.uReflectionHorizonColor.value.copy(horizonColor);
  const frameUniforms = {
    uShoreToWorld: { value: shoreToWorld },
    uWorldToShore: { value: worldToShore },
  };

  const waterMaterial = new THREE.ShaderMaterial({
    name: 'MizuTopia surf, Fresnel water and advected foam',
    vertexShader: waterVertex,
    fragmentShader: silverWaterFragment,
    uniforms: {
      ...reflectionUniforms, ...frameUniforms,
      uTime: { value: 0 }, uWaveHeight: { value: waveHeight },
      uMillerActive: { value: 0 }, uMillerX: { value: -100000 }, uMillerTime: { value: 0 },
      uShallowWaterColor: { value: new THREE.Color(0x168d9c) },
      uDeepWaterColor: { value: new THREE.Color(0x023b57) },
      uHorizonColor: { value: horizonColor }, uSkyColor: { value: skyColor },
      uSunColor: { value: new THREE.Color(1, 0.98, 0.94) },
      uCameraPosition: { value: cameraPosition }, uSunDirection: { value: sunDirection },
      uCompanionDirection: { value: new THREE.Vector3() }, uCompanionGlow: { value: 1 },
      uCityPosition: { value: new THREE.Vector3(650, 0, 550) },
      uCygnus: { value: 1 }, uCloud: { value: 0.13 },
      uUnderwater: { value: 0 }, uDaylight: { value: 1 },
      uRefraction: { value: null }, uRefractionDepth: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) }, uRefractionEnabled: { value: 0 },
      uCameraNear: { value: 0.05 }, uCameraFar: { value: 16000 },
    },
    side: THREE.DoubleSide,
    fog: false,
  });
  const water = new THREE.Mesh(gradedOceanGeometry(quality), waterMaterial);
  water.name = 'Synthetic shore ocean · graded surf grid';
  water.frustumCulled = false;
  frame.add(water);

  const sandMaterial = new THREE.ShaderMaterial({
    name: 'Glittering silver sand with shared tidal wetness',
    vertexShader: sandVertex,
    fragmentShader: silverSandFragment,
    uniforms: {
      ...reflectionUniforms, ...frameUniforms,
      uShoreCameraPosition: { value: cameraPosition },
      uTime: { value: 0 }, uWaveHeight: { value: waveHeight },
      uUnderwater: { value: 0 }, uDaylight: { value: 1 }, uMaterialKind: { value: 0 },
      uSunDirection: { value: sunDirection }, uOceanColor: { value: oceanColor },
      uMetallicBeach: { value: 0 }, uFlashlightEnabled: { value: 0 },
      uFlashlightPosition: { value: new THREE.Vector3() },
      uFlashlightDirection: { value: new THREE.Vector3(1, 0, 0) },
    },
    fog: false,
  });
  const sand = new THREE.Mesh(sandGeometry(), sandMaterial);
  sand.name = 'Synthetic silver sand · continuous tidal beach';
  frame.add(sand);

  const skyMaterial = new THREE.ShaderMaterial({
    name: 'MizuTopia coastal sky and drifting clouds',
    vertexShader: /* glsl */`
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: skyFragmentShader,
    uniforms: {
      uTop: { value: skyColor }, uHorizon: { value: horizonColor },
      uSunDirection: { value: sunDirection }, uCloud: { value: 0.13 },
      uTime: { value: 0 }, uDaylight: { value: 1 },
      uUnderwater: { value: 0 }, uDepth: { value: 0 }, uWaterColor: { value: oceanColor },
    },
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(12000, 32, 20), skyMaterial);
  sky.name = 'Synthetic shore blue atmosphere';
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  frame.add(sky);

  const cygnus = createCygnusSystem();
  frame.add(cygnus.group);
  const localCamera = new THREE.PerspectiveCamera();
  const localCameraMatrix = new THREE.Matrix4();
  const reflectionCamera = new THREE.PerspectiveCamera();
  const reflectionMatrix = new THREE.Matrix4();
  const rendererSize = new THREE.Vector2();
  const previousClear = new THREE.Color();
  const previousViewport = new THREE.Vector4();
  const previousScissor = new THREE.Vector4();
  let reflectionTarget: THREE.WebGLRenderTarget | undefined;
  let lastReflectionTime = -Infinity;
  let disposed = false;

  const update = (camera: THREE.Camera, elapsedSeconds: number): void => {
    if (disposed) return;
    group.updateWorldMatrix(true, true);
    shoreToWorld.copy(frame.matrixWorld);
    worldToShore.copy(shoreToWorld).invert();
    camera.updateWorldMatrix(true, false);
    localCameraMatrix.multiplyMatrices(worldToShore, camera.matrixWorld);
    localCameraMatrix.decompose(localCamera.position, localCamera.quaternion, localCamera.scale);
    localCamera.projectionMatrix.copy(camera.projectionMatrix);
    localCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    localCamera.updateMatrixWorld();
    cameraPosition.copy(localCamera.position);
    sky.position.copy(localCamera.position);
    // Moving the graded grid maintains dense metre-scale wave geometry near
    // the visitor without CPU vertex updates or rebuilding GPU buffers.
    water.position.set(localCamera.position.x, 0, localCamera.position.z);
    waterMaterial.uniforms.uTime.value = elapsedSeconds;
    sandMaterial.uniforms.uTime.value = elapsedSeconds;
    skyMaterial.uniforms.uTime.value = elapsedSeconds;
    cygnus.update(localCamera, elapsedSeconds, false, 0.96, 1);
    waterMaterial.uniforms.uCompanionDirection.value.copy(cygnus.companionDirection);
    waterMaterial.uniforms.uCompanionGlow.value = 1 - Math.cos(elapsedSeconds * Math.PI / 4) * 0.16;
  };

  const renderReflection = (renderer: THREE.WebGLRenderer, scene: THREE.Scene,
    camera: THREE.PerspectiveCamera, elapsedSeconds: number): void => {
    if (disposed || quality === 'low' || !group.visible || elapsedSeconds - lastReflectionTime < 1 / 20) return;
    if (!reflectionTarget) {
      reflectionTarget = new THREE.WebGLRenderTarget(1, 1, {
        type: THREE.HalfFloatType, minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter, depthBuffer: true, generateMipmaps: true,
      });
      reflectionTarget.texture.name = 'Synthetic shore live skyline and Cygnus reflection';
      reflectionUniforms.uSceneReflection.value = reflectionTarget.texture;
    }
    renderer.getDrawingBufferSize(rendererSize);
    const scale = Math.min(0.45, 704 / Math.max(rendererSize.x, rendererSize.y));
    const width = Math.max(2, Math.round(rendererSize.x * scale));
    const height = Math.max(2, Math.round(rendererSize.y * scale));
    if (reflectionTarget.width !== width || reflectionTarget.height !== height) reflectionTarget.setSize(width, height);
    configureReflectionCamera(camera, reflectionCamera, reflectionMatrix, 0);
    reflectionUniforms.uReflectionMatrix.value.copy(reflectionMatrix).multiply(shoreToWorld);
    reflectionUniforms.uReflectionTexelSize.value.set(1 / width, 1 / height);
    const previousTarget = renderer.getRenderTarget();
    const previousAlpha = renderer.getClearAlpha();
    const previousAutoClear = renderer.autoClear;
    const previousScissorTest = renderer.getScissorTest();
    const previousXr = renderer.xr.enabled;
    const previousShadowUpdate = renderer.shadowMap.autoUpdate;
    const previousWaterVisible = water.visible;
    renderer.getClearColor(previousClear);
    renderer.getViewport(previousViewport);
    renderer.getScissor(previousScissor);
    // Stop wet sand from sampling the texture currently attached for writing.
    reflectionUniforms.uReflectionStrength.value = 0;
    reflectionUniforms.uSceneReflection.value = null;
    water.visible = false;
    try {
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.autoClear = true;
      renderer.setRenderTarget(reflectionTarget);
      renderer.setScissorTest(false);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, reflectionCamera);
      reflectionUniforms.uReflectionStrength.value = 0.82;
      lastReflectionTime = elapsedSeconds;
    } finally {
      reflectionUniforms.uSceneReflection.value = reflectionTarget.texture;
      water.visible = previousWaterVisible;
      renderer.setRenderTarget(previousTarget);
      renderer.setViewport(previousViewport);
      renderer.setScissor(previousScissor);
      renderer.setScissorTest(previousScissorTest);
      renderer.setClearColor(previousClear, previousAlpha);
      renderer.autoClear = previousAutoClear;
      renderer.xr.enabled = previousXr;
      renderer.shadowMap.autoUpdate = previousShadowUpdate;
    }
  };

  return {
    group, water, sand, sky,
    groundHeight: syntheticShoreGroundHeight,
    waterHeight: (x, z, elapsedSeconds) => sampleNormalWave(-z, x, elapsedSeconds, waveHeight),
    update, renderReflection,
    getCygnusState: () => cygnus.getState(localCamera),
    dispose() {
      if (disposed) return;
      disposed = true;
      reflectionTarget?.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.removeFromParent();
    },
  };
}
