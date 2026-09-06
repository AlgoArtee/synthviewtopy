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

export interface ShoreEnvironmentState {
  timeOfDay: 'day' | 'sunset' | 'night';
  weather: 'clear' | 'cloudy' | 'rain' | 'storm';
  waveHeight: number;
  waterSpeed: number;
  waterColor: string;
  reflections: boolean;
}

export interface ShoreLightingState {
  background: string;
  fogColor: string;
  fogDensity: number;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  daylight: number;
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
  getEnvironment(): ShoreEnvironmentState;
  setEnvironment(environment: Partial<ShoreEnvironmentState>): ShoreEnvironmentState;
  getLighting(): ShoreLightingState;
  dispose(): void;
}

const daylightPresets = {
  day: {
    sky: '#075c8e', horizon: '#a5d5d9', sun: '#fff8e9', ambient: '#e6f9ff',
    sunDirection: [-0.34, 0.82, -0.36], daylight: 1, ambientIntensity: 2.25, sunIntensity: 2.4,
  },
  sunset: {
    sky: '#353764', horizon: '#ec977b', sun: '#ffc194', ambient: '#b9c1e2',
    sunDirection: [0.78, 0.16, -0.46], daylight: 0.54, ambientIntensity: 1.55, sunIntensity: 1.8,
  },
  night: {
    // Moonlit blues retain readable sand and architecture while revealing stars.
    sky: '#101d3d', horizon: '#355875', sun: '#a8caff', ambient: '#9bbde8',
    sunDirection: [0.46, 0.62, -0.48], daylight: 0.22, ambientIntensity: 1.15, sunIntensity: 0.95,
  },
} as const;

const weatherPresets = {
  clear: { cloud: 0.13, shade: 0, fog: 0.00022, rain: 0, wind: 1.1 },
  cloudy: { cloud: 0.79, shade: 0.28, fog: 0.00036, rain: 0, wind: 1.6 },
  rain: { cloud: 0.88, shade: 0.40, fog: 0.00052, rain: 0.6, wind: 2.1 },
  storm: { cloud: 1, shade: 0.58, fog: 0.0008, rain: 1, wind: 5.8 },
} as const;

/** One static line buffer; the GPU wraps rain around the visitor. */
function createShoreRain(quality: 'low' | 'balanced'): THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const count = quality === 'low' ? 360 : 760;
  const positions = new Float32Array(count * 6);
  const endpoints = new Float32Array(count * 2);
  let seed = 9137;
  const random = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const x = random() * 64, y = random() * 36, z = random() * 64;
    positions.set([x, y, z, x, y, z], i * 6);
    endpoints[i * 2 + 1] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aEndpoint', new THREE.BufferAttribute(endpoints, 1));
  const material = new THREE.ShaderMaterial({
    name: 'Camera-local coastal rainfall',
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uWind;
      attribute float aEndpoint;
      varying float vAlpha;
      void main() {
        vec3 p = vec3(mod(position.x + uTime * uWind, 64.0) - 32.0,
          mod(position.y - uTime * (16.0 + uWind), 36.0) - 5.0,
          position.z - 32.0);
        p += vec3(uWind * 0.025, -0.42 - uWind * 0.035, 0.02) * aEndpoint;
        vAlpha = (1.0 - smoothstep(18.0, 34.0, length(p.xz))) * (0.36 + aEndpoint * 0.30);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity * vAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    uniforms: {
      uTime: { value: 0 }, uWind: { value: 2.1 },
      uColor: { value: new THREE.Color('#c8e4f1') }, uOpacity: { value: 0.65 },
    },
    transparent: true, depthWrite: false, fog: false,
  });
  const rain = new THREE.LineSegments(geometry, material);
  rain.name = 'Synthetic shore rainfall';
  rain.frustumCulled = false;
  rain.visible = false;
  return rain;
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
  const environment: ShoreEnvironmentState = {
    timeOfDay: 'day', weather: 'clear', waveHeight: 1.2,
    waterSpeed: 1, waterColor: '#047888', reflections: true,
  };
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
      uTime: { value: 0 }, uWaveHeight: { value: environment.waveHeight },
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
      uTime: { value: 0 }, uWaveHeight: { value: environment.waveHeight },
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
  const rain = createShoreRain(quality);
  frame.add(rain);
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
  let lastAnimationTime: number | undefined;
  let waterTime = 0;
  let disposed = false;

  const getLighting = (): ShoreLightingState => {
    const light = daylightPresets[environment.timeOfDay];
    const weather = weatherPresets[environment.weather];
    return {
      background: `#${skyColor.getHexString()}`,
      fogColor: `#${horizonColor.getHexString()}`,
      fogDensity: weather.fog,
      ambientColor: light.ambient,
      ambientIntensity: light.ambientIntensity * (1 - weather.shade * 0.28),
      sunColor: light.sun,
      sunIntensity: light.sunIntensity * (1 - weather.shade * 0.83),
      // Rotate the shader's Mizu frame into the scene's world coordinate frame.
      sunPosition: [sunDirection.z * 400, sunDirection.y * 400, -sunDirection.x * 400],
      daylight: light.daylight * (1 - weather.shade * 0.38),
    };
  };

  const applyEnvironment = (): void => {
    const light = daylightPresets[environment.timeOfDay];
    const weather = weatherPresets[environment.weather];
    const stormTint = new THREE.Color(environment.timeOfDay === 'night' ? '#192b41' : '#6c8191');
    skyColor.set(light.sky).lerp(stormTint, weather.shade);
    horizonColor.set(light.horizon).lerp(stormTint, weather.shade * 0.9);
    oceanColor.set(environment.waterColor);
    sunDirection.fromArray(light.sunDirection).normalize();
    const daylight = getLighting().daylight;
    waterMaterial.uniforms.uWaveHeight.value = environment.waveHeight;
    sandMaterial.uniforms.uWaveHeight.value = environment.waveHeight;
    // Use the original Mizu palette at its default color. A color-picker edit
    // shifts both the shallow water and deep absorption, keeping their contrast.
    const baseColor = new THREE.Color('#047888');
    const channelRatio = new THREE.Color(
      oceanColor.r / Math.max(0.015, baseColor.r),
      oceanColor.g / Math.max(0.015, baseColor.g),
      oceanColor.b / Math.max(0.015, baseColor.b),
    );
    if (environment.waterColor === '#047888') channelRatio.setRGB(1, 1, 1);
    waterMaterial.uniforms.uShallowWaterColor.value.set('#168d9c').multiply(channelRatio);
    waterMaterial.uniforms.uDeepWaterColor.value.set('#023b57').multiply(channelRatio);
    waterMaterial.uniforms.uSunColor.value.set(light.sun);
    waterMaterial.uniforms.uDaylight.value = daylight;
    waterMaterial.uniforms.uCloud.value = weather.cloud;
    sandMaterial.uniforms.uDaylight.value = daylight;
    skyMaterial.uniforms.uDaylight.value = daylight;
    skyMaterial.uniforms.uCloud.value = weather.cloud;
    reflectionUniforms.uReflectionSkyColor.value.copy(skyColor);
    reflectionUniforms.uReflectionHorizonColor.value.copy(horizonColor);
    reflectionUniforms.uReflectionStrength.value = 0;
    lastReflectionTime = -Infinity;
    rain.visible = weather.rain > 0;
    rain.geometry.setDrawRange(0, Math.round(rain.geometry.getAttribute('position').count * weather.rain / 2) * 2);
    rain.material.uniforms.uWind.value = weather.wind;
    rain.material.uniforms.uOpacity.value = environment.timeOfDay === 'night' ? 0.42 : 0.66;
  };

  const setEnvironment = (partial: Partial<ShoreEnvironmentState>): ShoreEnvironmentState => {
    if (disposed) return { ...environment };
    if (partial.timeOfDay && Object.hasOwn(daylightPresets, partial.timeOfDay)) environment.timeOfDay = partial.timeOfDay;
    if (partial.weather && Object.hasOwn(weatherPresets, partial.weather)) environment.weather = partial.weather;
    if (typeof partial.waveHeight === 'number' && Number.isFinite(partial.waveHeight)) {
      environment.waveHeight = THREE.MathUtils.clamp(partial.waveHeight, 0, 3);
    }
    if (typeof partial.waterSpeed === 'number' && Number.isFinite(partial.waterSpeed)) {
      environment.waterSpeed = THREE.MathUtils.clamp(partial.waterSpeed, 0, 3);
    }
    if (typeof partial.waterColor === 'string' && /^#[0-9a-f]{6}$/i.test(partial.waterColor)) {
      environment.waterColor = partial.waterColor.toLowerCase();
    }
    if (typeof partial.reflections === 'boolean') environment.reflections = partial.reflections;
    applyEnvironment();
    return { ...environment };
  };
  applyEnvironment();

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
    const currentTime = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : (lastAnimationTime ?? 0);
    waterTime += lastAnimationTime === undefined ? currentTime * environment.waterSpeed
      : Math.max(0, currentTime - lastAnimationTime) * environment.waterSpeed;
    lastAnimationTime = currentTime;
    waterMaterial.uniforms.uTime.value = waterTime;
    sandMaterial.uniforms.uTime.value = waterTime;
    skyMaterial.uniforms.uTime.value = elapsedSeconds;
    rain.position.copy(localCamera.position);
    rain.material.uniforms.uTime.value = currentTime;
    const weather = weatherPresets[environment.weather];
    const daylight = waterMaterial.uniforms.uDaylight.value as number;
    cygnus.update(localCamera, currentTime, false, 0.96 - weather.shade * 0.28, daylight);
    waterMaterial.uniforms.uCompanionDirection.value.copy(cygnus.companionDirection);
    waterMaterial.uniforms.uCompanionGlow.value = 1 - Math.cos(elapsedSeconds * Math.PI / 4) * 0.16;
  };

  const renderReflection = (renderer: THREE.WebGLRenderer, scene: THREE.Scene,
    camera: THREE.PerspectiveCamera, elapsedSeconds: number): void => {
    if (disposed || quality === 'low' || !environment.reflections || !group.visible || elapsedSeconds - lastReflectionTime < 1 / 20) return;
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
    const previousRainVisible = rain.visible;
    renderer.getClearColor(previousClear);
    renderer.getViewport(previousViewport);
    renderer.getScissor(previousScissor);
    // Stop wet sand from sampling the texture currently attached for writing.
    reflectionUniforms.uReflectionStrength.value = 0;
    reflectionUniforms.uSceneReflection.value = null;
    water.visible = false;
    rain.visible = false;
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
      rain.visible = previousRainVisible;
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
    waterHeight: (x, z, elapsedSeconds) => sampleNormalWave(-z, x,
      lastAnimationTime === undefined ? elapsedSeconds * environment.waterSpeed
        : waterTime + Math.max(0, elapsedSeconds - lastAnimationTime) * environment.waterSpeed,
      environment.waveHeight),
    update, renderReflection,
    getCygnusState: () => cygnus.getState(localCamera),
    getEnvironment: () => ({ ...environment }), setEnvironment, getLighting,
    dispose() {
      if (disposed) return;
      disposed = true;
      reflectionTarget?.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.LineSegments)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.removeFromParent();
    },
  };
}
