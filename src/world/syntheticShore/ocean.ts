// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
import * as THREE from 'three';
import { millerWaveGLSL, oceanBathymetryGLSL, oceanWaveGLSL } from './simulation';
import { sceneReflectionGLSL } from './reflections';
import type { QualityId } from './types';

/** A camera-centred grid: metre-scale surf nearby, sparse triangles at the horizon.
 * The mesh remains in XY, matching PlaneGeometry; rotate -PI/2 about X.
 */
export function createOceanGeometry(quality: QualityId, millerActive = false): THREE.BufferGeometry {
  const segments = { low: 144, balanced: 224, cinematic: 320 }[quality];
  const extent = 14000;
  const curve = 7;
  const scale = extent / Math.sinh(curve);
  const gradedAxis = Array.from({ length: segments + 1 }, (_, i) => Math.sinh((i * 2 / segments - 1) * curve) * scale);
  let xAxis = [...gradedAxis];
  let zAxis = gradedAxis;
  const eventMaxSpacing = millerActive ? { low: 24, balanced: 16, cinematic: 10 }[quality] : 0;
  if (millerActive) {
    // The ordinary logarithmic grid needs only a few distant triangles. A
    // kilometre-tall crest needs dense columns already at its 2.6 km origin,
    // throughout approach and recession, while retaining close surf detail.
    for (let x = -3600; x <= 3600; x += eventMaxSpacing) xAxis.push(x);
    xAxis.sort((a, b) => a - b);
    xAxis = xAxis.filter((x, i, values) => i === 0 || x - values[i - 1] > 0.025);
    // Preserve the dense centre and split only distant lateral gaps. This
    // resolves the organic crest line without a uniformly dense ocean mesh.
    zAxis = [];
    for (let i = 0; i < gradedAxis.length - 1; i++) {
      const a = gradedAxis[i], b = gradedAxis[i + 1];
      const divisions = b >= -3000 && a <= 3000 ? Math.ceil((b - a) / 48) : 1;
      for (let part = 0; part < divisions; part++) zAxis.push(a + (b - a) * part / divisions);
    }
    zAxis.push(gradedAxis[gradedAxis.length - 1]);
  }
  const geometry = new THREE.PlaneGeometry(2, 2, xAxis.length - 1, zAxis.length - 1);
  const positions = geometry.getAttribute('position');
  for (let row = 0; row < zAxis.length; row++) {
    const y = -zAxis[row];
    for (let column = 0; column < xAxis.length; column++) positions.setXY(row * xAxis.length + column, xAxis[column], y);
  }
  geometry.userData = {
    millerEnhanced: millerActive, layout: millerActive ? 'miller-dense' : 'graded',
    columns: xAxis.length, rows: zAxis.length, eventBandHalfWidth: millerActive ? 3600 : 0, eventMaxSpacing,
    eventMaxSpacingZ: millerActive ? 48 : 0, eventBandHalfWidthZ: millerActive ? 3000 : 0,
  };
  positions.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
}

const waveUniforms = /* glsl */`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uMillerActive;
  uniform float uMillerX;
  uniform float uMillerTime;
`;

export const oceanVertexShader = /* glsl */`
  ${waveUniforms}
  ${oceanBathymetryGLSL}
  ${oceanWaveGLSL}
  ${millerWaveGLSL}
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying float vMiller;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vElevation = regularWave(world.xz);
    vMiller = millerWave(world.xz).x;
    world.y = vElevation + vMiller;
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const oceanFragmentShader = /* glsl */`
  ${waveUniforms}
  uniform vec3 uShallowWaterColor;
  uniform vec3 uDeepWaterColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSkyColor;
  uniform vec3 uSunColor;
  uniform vec3 uCameraPosition;
  uniform vec3 uSunDirection;
  uniform vec3 uCompanionDirection;
  uniform vec3 uCityPosition;
  uniform float uCompanionGlow;
  uniform float uCygnus;
  uniform float uCloud;
  uniform float uUnderwater;
  uniform float uDaylight;
  uniform sampler2D uRefraction;
  uniform sampler2D uRefractionDepth;
  uniform vec2 uResolution;
  uniform float uRefractionEnabled;
  uniform float uCameraNear;
  uniform float uCameraFar;
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying float vMiller;
  ${oceanBathymetryGLSL}
  ${oceanWaveGLSL}
  ${millerWaveGLSL}
  ${sceneReflectionGLSL}

  float hash(vec2 p) {
    // Bounded coordinates avoid the loss of precision in a large-world hash.
    p = mod(p, 4096.0);
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
  float foamTurbulence(vec2 p) {
    // Rotated octaves and domain warping avoid visible square noise cells.
    mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
    float value = noise(p) * 0.53;
    p = turn * p * 2.07 + 17.3;
    value += noise(p) * 0.27;
    p = turn * p * 2.13 - 8.1;
    value += noise(p) * 0.13;
    return value + noise(turn * p * 2.03 + 29.7) * 0.07;
  }
  // Millimetre/centimetre pores inside froth. Draw variable round openings,
  // never nearest-neighbour polygon edges: those produced the honeycomb.
  float foamPores(vec2 p, float aa) {
    vec2 cell = floor(p), local = fract(p);
    float signedDistance = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = vec2(hash(cell + neighbor + 3.1), hash(cell + neighbor + 83.7));
        float radius = mix(0.055, 0.38, pow(hash(cell + neighbor + 57.8), 2.0));
        vec2 delta = neighbor + 0.08 + point * 0.84 - local;
        signedDistance = min(signedDistance, length(delta) - radius);
      }
    }
    return 1.0 - smoothstep(-aa, aa, signedDistance);
  }
  float linearDepth(float depth) {
    return uCameraNear * uCameraFar / max(0.0001, uCameraFar - depth * (uCameraFar - uCameraNear));
  }
  vec3 environmentColor(vec3 direction) {
    float up = max(0.0, direction.y);
    // Use the same altitude falloff as atmosphere.ts so the ocean horizon and
    // the reflected sky remain continuous across all time-of-day presets.
    float haze = exp(-up * 10.0);
    vec3 sky = mix(uSkyColor, uHorizonColor, haze * 0.92);
    sky += uSkyColor * exp(-up * 2.0) * 0.25;
    vec2 cloudUV = direction.xz / max(0.16, up + 0.25) * 3.0 + uTime * vec2(0.004, 0.001);
    float cloud = smoothstep(0.40, 0.78, noise(cloudUV)) * uCloud;
    sky = mix(sky, mix(uHorizonColor, vec3(0.17, 0.21, 0.23), uCloud), cloud * 0.6);
    float sunAlignment = max(0.0, dot(direction, uSunDirection));
    sky += uSunColor * pow(sunAlignment, 100.0) * 0.22 * (1.0 - uCloud * 0.8);
    float companionAlignment = max(0.0, dot(direction, uCompanionDirection));
    sky += vec3(0.20, 0.61, 1.0) * (pow(companionAlignment, 120.0) * 0.35
      + pow(companionAlignment, 950.0) * 2.2) * uCygnus * uCompanionGlow * (1.0 - uCloud * 0.75);
    // The city is inland behind the beach. Only rays facing back toward that
    // actual skyline can reflect neon; the offshore ocean stays unobstructed.
    if (direction.x < -0.05 && vWorldPosition.x > uCityPosition.x) {
      float travel = (uCityPosition.x - vWorldPosition.x) / direction.x;
      vec2 cityHit = (vWorldPosition.zy + direction.zy * travel - uCityPosition.zy) / 0.75;
      float heightMask = smoothstep(-35.0, 45.0, cityHit.y) * (1.0 - smoothstep(280.0, 480.0, cityHit.y));
      float z = cityHit.x / 800.0;
      float cyan = exp(-z * z * 12.0) + exp(-(z + 1.0) * (z + 1.0) * 16.0);
      float pink = exp(-(z - 1.0) * (z - 1.0) * 14.0);
      float night = 1.0 - smoothstep(0.23, 0.85, uDaylight);
      sky += (vec3(0.015, 0.17, 0.25) * cyan + vec3(0.18, 0.01, 0.09) * pink) * heightMask * night;
    }
    return sky;
  }
  // GGX microfacet BRDF. Water's air-interface reflectance is 2.04 percent.
  float waterSpecular(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
    vec3 halfVector = normalize(viewDir + lightDir);
    float nv = max(0.001, dot(normal, viewDir));
    float nl = max(0.0, dot(normal, lightDir));
    float nh = max(0.0, dot(normal, halfVector));
    float vh = max(0.0, dot(viewDir, halfVector));
    float a2 = roughness * roughness;
    a2 *= a2;
    float d = nh * nh * (a2 - 1.0) + 1.0;
    float distribution = a2 / max(0.000001, 3.14159265 * d * d);
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    float visibility = nv / (nv * (1.0 - k) + k) * nl / (nl * (1.0 - k) + k);
    float fresnel = 0.02037 + 0.97963 * pow(1.0 - vh, 5.0);
    return min(12.0, distribution * visibility * fresnel / max(0.004, 4.0 * nv));
  }

  void main() {
    vec2 p = vWorldPosition.xz;
    float floorY = seafloorHeightGLSL(p.x, p.y);
    float waterDepth = vWorldPosition.y - floorY;
    // A genuine wet/dry boundary. Raising a whole ocean mesh onto the sand
    // creates a reflective carpet extending uphill, so dry fragments are cut.
    if (waterDepth <= 0.008) discard;

    float distanceToEye = length(uCameraPosition - vWorldPosition);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    vec3 spectrum = waveSpectrumGLSL(p);
    float amplitude = normalWaveAmplitudeGLSL(p);
    vec3 normalSurface = normalWaveSurfaceGLSL(p);
    vec4 shoreState = shoreFoamState(p);
    vec3 giantSurface = millerWave(p);
    float giantFace = smoothstep(25.0, 130.0, giantSurface.x);
    float regularNormalWeight = 1.0 - giantFace;
    vec2 slopes = normalSurface.yz * regularNormalWeight;
    slopes += giantSurface.yz;

    // Analytic ripple slopes, filtered by the pixel footprint to prevent
    // distant shimmer and repeating bright grid patterns at grazing angles.
    float footprint = max(length(dFdx(p)), length(dFdy(p)));
    float rippleFade = 1.0 / (1.0 + footprint * footprint * 3.0);
    float wind = smoothstep(0.0, 4.0, uWaveHeight);
    float shallowFade = smoothstep(0.0, 0.3, waterDepth);
    float seaActivity = smoothstep(0.0, 0.3, uWaveHeight);
    float rippleGain = (0.009 + wind * 0.075) * rippleFade * shallowFade * regularNormalWeight * seaActivity;
    float drift = noise(p * 0.055 + uTime * 0.012) * 4.0;
    slopes += vec2(0.82, 0.57) * sin(dot(p, vec2(1.82, 1.26)) + uTime * 3.2 + drift) * rippleGain;
    slopes += vec2(-0.91, 0.42) * sin(dot(p, vec2(-3.51, 1.62)) + uTime * 4.8 - drift) * rippleGain * 0.7;
    slopes += vec2(0.31, -0.95) * sin(dot(p, vec2(6.41, -4.32)) - uTime * 6.2) * rippleGain * 0.38;
    vec2 rippleDrift = vec2(uTime * 0.11, -uTime * 0.075);
    vec2 irregularRipples = vec2(noise(p * 1.8 + rippleDrift), noise(p * 1.67 - rippleDrift + 23.6)) - 0.5;
    slopes += irregularRipples * rippleGain * 1.6;
    float capillaryFade = 1.0 / (1.0 + footprint * footprint * 38.0);
    slopes += vec2(sin(dot(p, vec2(12.1, 5.4)) + uTime * 8.2),
      cos(dot(p, vec2(-8.3, 13.7)) - uTime * 7.6)) * 0.012 * wind * capillaryFade * regularNormalWeight;
    vec3 normal = normalize(vec3(-slopes.x, 1.0, -slopes.y));
    float crestRatio = 0.0, faceFilter = 0.0;
    float faceFlow = 0.5, faceRills = 0.5, crestBreakup = 0.5, crestBillows = 0.5;
    if (uMillerActive > 0.001) {
      // Use the analytic surface here, rather than the triangle-interpolated
      // varying: the foam edge must never reveal the underlying mesh cells.
      crestRatio = max(0.0, giantSurface.x / max(1.0, millerCrestHeight(p.y)));
      // A tall face needs texture in its own vertical surface coordinates.
      // XZ-projected foam stretches into a patterned sheet on a steep wave.
      vec2 faceUV = vec2(p.y * 0.018, (giantSurface.x + uMillerTime * 8.0) * 0.006);
      float faceFootprint = max(length(dFdx(faceUV)), length(dFdy(faceUV)));
      faceFilter = 1.0 - smoothstep(0.15, 0.55, faceFootprint);
      float faceWarp = noise(faceUV * 0.43 + 8.7);
      faceFlow = noise(faceUV + vec2(faceWarp * 1.8, faceWarp * 0.45));
      faceRills = noise(faceUV * vec2(2.7, 0.71) + vec2(faceWarp, 5.2));
      crestBreakup = noise(vec2(p.y * 0.014, uMillerTime * 0.14));
      vec2 fineFaceUV = vec2(p.y, giantSurface.x + uMillerTime * 11.0) * 0.075;
      float fineFootprint = max(length(dFdx(fineFaceUV)), length(dFdy(fineFaceUV)));
      float fineFaceFilter = 1.0 - smoothstep(0.18, 0.70, fineFootprint);
      vec2 fineFlow = vec2(noise(fineFaceUV + faceWarp * 2.4), noise(fineFaceUV * 0.83 + 17.3)) - 0.5;
      vec2 billowUV = vec2(p.y * 0.035, (giantSurface.x + uMillerTime * 9.0) * 0.018);
      crestBillows = noise(billowUV + (noise(billowUV * 0.43) - 0.5) * 2.6);
      vec3 tangentAlongCrest = normalize(vec3(0.0, slopes.y, 1.0));
      vec3 tangentDownFace = normalize(cross(tangentAlongCrest, normal));
      normal = normalize(normal + ((tangentAlongCrest * (faceRills - 0.5) * 0.090
        + tangentDownFace * (faceFlow - 0.5) * 0.060) * faceFilter
        + (tangentAlongCrest * fineFlow.x + tangentDownFace * fineFlow.y) * 0.075 * fineFaceFilter) * giantFace);
    }
    float daylight = clamp(uDaylight, 0.0, 1.0);
    float ambientLight = 0.10 + daylight * 0.90;
    vec3 waterBody = mix(uShallowWaterColor * 0.45, uDeepWaterColor * 0.58, smoothstep(3.0, 80.0, waterDepth));
    vec3 giantWaterBody = vec3(0.004, 0.048, 0.056) * (0.20 + daylight * 0.90)
      + uShallowWaterColor * 0.10;
    giantWaterBody *= 0.94 + faceFlow * 0.12;
    waterBody = mix(waterBody, giantWaterBody, giantFace);

    // Refraction through a finite water column reveals ripple sand in the
    // shallows. Wavelength-dependent attenuation removes red first.
    vec3 refracted = refract(-viewDir, normal, 1.0 / 1.333);
    float bottomPath = waterDepth / max(0.22, -refracted.y);
    vec2 bottomUV = p + refracted.xz * min(60.0, bottomPath);
    float sandNoise = noise(bottomUV * 0.32) * 0.7 + noise(bottomUV * 1.6) * 0.3;
    float sandRidge = sin(bottomUV.x * 3.2 + sin(bottomUV.y * 0.38) * 2.4 + sandNoise * 1.5);
    vec3 bottomColor = mix(vec3(0.12, 0.13, 0.10), vec3(0.28, 0.27, 0.20), sandNoise);
    bottomColor *= (0.90 + sandRidge * 0.10) * ambientLight;
    float causticA = sin(bottomUV.x * 1.14 + sin(bottomUV.y * 0.77 + uTime * 0.55) * 2.1 + uTime * 0.70);
    float causticB = sin(bottomUV.y * 1.36 + sin(bottomUV.x * 0.62 - uTime * 0.48) * 1.8 - uTime * 0.61);
    float caustics = pow(max(0.0, 1.0 - abs(causticA + causticB) * 0.65), 12.0)
      * smoothstep(0.08, 0.55, waterDepth);
    bottomColor += vec3(0.034, 0.050, 0.036) * caustics * exp(-waterDepth * 0.20) * daylight;
    vec3 transmittance = exp(-vec3(0.36, 0.115, 0.065) * min(180.0, bottomPath));
    vec3 transmission = bottomColor * transmittance + waterBody * (1.0 - transmittance);

    // The live scene target reveals actual rippled sand, rocks and vegetation.
    // Check depth before accepting a distortion, avoiding foreground-object
    // halos and refracted sky leaking into the wet/dry edge.
    if (uRefractionEnabled > 0.5 && uUnderwater < 0.5 && waterDepth < 18.0) {
      vec2 screenUV = gl_FragCoord.xy / uResolution;
      vec2 pixelBorder = 1.0 / uResolution;
      vec2 offset = slopes * 0.006 * smoothstep(0.08, 0.70, waterDepth);
      vec2 refractedUV = clamp(screenUV + offset, pixelBorder, vec2(1.0) - pixelBorder);
      float surfaceViewDepth = linearDepth(gl_FragCoord.z);
      float sceneDepth = texture2D(uRefractionDepth, refractedUV).r;
      float sceneViewDepth = linearDepth(sceneDepth);
      if (sceneViewDepth <= surfaceViewDepth + 0.015 || sceneDepth > 0.999999) {
        refractedUV = screenUV;
        sceneDepth = texture2D(uRefractionDepth, refractedUV).r;
        sceneViewDepth = linearDepth(sceneDepth);
      }
      if (sceneViewDepth > surfaceViewDepth + 0.015 && sceneDepth < 0.999999) {
        vec3 sceneColor = texture2D(uRefraction, refractedUV).rgb;
        float refractedPath = max(0.0, sceneViewDepth - surfaceViewDepth)
          * distanceToEye / max(0.01, surfaceViewDepth);
        // The coast target already includes submerged terrain absorption.
        // Only the small extra optical path caused by the surface is added.
        vec3 surfaceTransmission = exp(-vec3(0.02, 0.010, 0.006) * min(40.0, refractedPath));
        vec3 actualTransmission = sceneColor * surfaceTransmission + waterBody * (1.0 - surfaceTransmission);
        float realSceneBlend = 0.90 * (1.0 - smoothstep(8.0, 18.0, waterDepth))
          * (1.0 - smoothstep(70.0, 180.0, distanceToEye));
        transmission = mix(transmission, actualTransmission, realSceneBlend);
      }
    }

    float nv = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = 0.02037 + 0.97963 * pow(1.0 - nv, 5.0);
    // A vanishingly thin wash exposes the sand through its edge. This soft
    // transition also keeps a straight mesh/sand intersection from reading as
    // a sharp mirror cutout before the irregular foam fingers arrive.
    float washFilm = smoothstep(0.008, 0.065, waterDepth);
    fresnel *= mix(washFilm, 1.0, smoothstep(12.0, 30.0, p.x));
    float roughness = 0.095 + wind * 0.07 + uCloud * 0.035 + shoreState.x * 0.045 + shoreState.z * 0.012;
    roughness = mix(roughness, 0.225, giantFace * 0.85);
    vec3 reflectionFallback = environmentColor(reflect(-viewDir, normal));
    vec4 sceneReflection = sampleSceneReflectionRGBA(vWorldPosition, normal, viewDir, roughness, reflectionFallback);
    vec3 color = mix(transmission, sceneReflection.rgb, fresnel);
    // Both scene captures already contain the real bright celestial objects.
    // Keep a small microfacet glint, without adding their energy a second time.
    float specularAssistance = 1.0 - max(sceneReflection.a, uEnvironmentReflectionStrength) * 0.9;
    color += uSunColor * waterSpecular(normal, viewDir, uSunDirection, roughness)
      * (0.3 + daylight * 1.7) * (1.0 - uCloud * 0.8) * specularAssistance;
    color += vec3(0.24, 0.64, 1.0) * waterSpecular(normal, viewDir, uCompanionDirection, roughness + 0.04)
      * uCygnus * uCompanionGlow * 2.0 * (1.0 - uCloud * 0.75) * specularAssistance;

    // Forward-scattered light shows thin green crests without painting every
    // wave cyan. The shoreline/deep-water mix comes from actual column depth.
    float backlit = pow(max(0.0, dot(viewDir, -uSunDirection)), 5.0);
    float thinCrest = smoothstep(0.18, 0.85, spectrum.x) * (1.0 - fresnel);
    color += vec3(0.016, 0.12, 0.10) * thinCrest * backlit * wind * daylight * regularNormalWeight;
    float thinBreaker = shoreState.x * smoothstep(0.06, 0.8, waterDepth) * regularNormalWeight;
    color += vec3(0.007, 0.13, 0.079) * thinBreaker * (0.28 + backlit * 0.72) * daylight * (1.0 - fresnel);
    // Only the thin upper shoulder admits much light through the wall. Most
    // of the event stays dark teal, with coherent sky reflections over it.
    float translucentLip = smoothstep(0.70, 0.96, crestRatio) * giantFace;
    color += vec3(0.008, 0.12, 0.095) * translucentLip * (0.30 + backlit * 0.70)
      * daylight * (1.0 - fresnel);
    color += vec3(0.002, 0.008, 0.018) * translucentLip * uCygnus * uCompanionGlow;

    // Offshore whitecaps remain tied to steepness. Shore foam uses the exact
    // incoming breaker/swash phase from the CPU/GPU shared shoreline model.
    vec2 foamUV = p * 0.65 + vec2(uTime * 0.065, uTime * 0.026);
    float foamNoise = noise(foamUV + noise(foamUV * 0.47) * 2.5);
    float foamCells = mix(0.55, noise(foamUV * 3.7 - uTime * 0.045), 1.0 - smoothstep(0.05, 0.45, footprint));
    float foamTexture = smoothstep(0.23, 0.65, foamNoise) * (0.55 + 0.45 * foamCells);
    foamTexture = mix(0.48, foamTexture, 1.0 - smoothstep(0.3, 2.0, footprint));
    float steepness = length(spectrum.yz) * amplitude;
    float breaking = smoothstep(0.24, 0.60, steepness) * smoothstep(0.30, 0.95, spectrum.x);
    float shoreFoam = 0.0, shoreFoamLight = 1.0;
    if (shoreState.x + shoreState.y + shoreState.z > 0.001 && giantFace < 0.99) {
      float arrival = shorePhaseGLSL(vec2(0.0, p.y), uTime) - 1.45;
      float swashPhase = arrival + 0.30 * cos(arrival);
      float wash = 0.5 + 0.5 * cos(swashPhase);
      float washRate = -0.5 * sin(swashPhase) * (1.0 - 0.30 * sin(arrival));
      float uprush = smoothstep(-0.025, 0.18, washRate);
      // The shallow foam reverses with the real wash, slows at maximum runup,
      // then stretches seaward. Outer whitewater follows the incoming bore.
      float travel = mix(wash * 5.0, shoreState.w * 3.2, smoothstep(4.0, 22.0, p.x));
      vec2 flow = vec2(p.x + travel, p.y);
      vec2 warp = vec2(noise(flow * 0.71 + uTime * 0.025),
        noise(flow * 0.63 + 19.4 - uTime * 0.018)) - 0.5;
      vec2 foamUV = flow * 1.8 + warp * 2.4;
      float broadPatches = foamTurbulence(flow * 0.64 + warp * 1.3 + 47.1);
      float flecks = foamTurbulence(foamUV + vec2(uTime * 0.045, -uTime * 0.018));
      float detailAA = clamp(footprint * 1.4, 0.018, 0.11);
      float rafts = smoothstep(0.46 - detailAA, 0.565 + detailAA, flecks + (broadPatches - 0.5) * 0.34);
      // Open holes have curved, turbulent boundaries, with no closed-cell
      // network. Higher-frequency texture breaks small clumps off their edges.
      float brokenRafts = rafts * smoothstep(0.22, 0.43, foamTurbulence(foamUV * 3.1 + 8.4));
      float fringeShape = foamTurbulence(vec2(p.y * 2.0, uTime * 0.16));
      float fringeDepth = waterDepth - 0.010 - fringeShape * 0.019;
      float fringeWet = smoothstep(0.0, 0.008 + min(0.012, footprint * 0.04), fringeDepth);
      float rolledEdge = exp(-pow((fringeDepth - 0.010) / (0.010 + fringeShape * 0.014), 2.0)) * fringeWet;
      float swashBand = (1.0 - smoothstep(0.055, 0.19, waterDepth)) * fringeWet;
      float advancingFringe = max(rolledEdge * (0.62 + 0.30 * flecks),
        swashBand * brokenRafts * 0.94) * (0.34 + uprush * 0.66)
        * (1.0 - smoothstep(5.0, 16.0, p.x));
      float freshFoam = shoreState.x * (0.15 + brokenRafts * 0.85);
      float rills = foamTurbulence(vec2(flow.x * 0.75, flow.y * 5.6) + warp * 2.0);
      float stretchedFlecks = smoothstep(0.54 - detailAA, 0.70 + detailAA, rills);
      float remnants = max(brokenRafts * 0.42, stretchedFlecks * (1.0 - uprush) * 0.66);
      float backwashFoam = shoreState.z * remnants * (1.0 - smoothstep(0.22, 0.75, waterDepth));
      shoreFoam = max(freshFoam, advancingFringe) + backwashFoam * (1.0 - freshFoam);
      float bubbleScale = 42.0;
      float bubbleVisibility = 1.0 - smoothstep(0.13, 0.65, footprint * bubbleScale);
      if (bubbleVisibility > 0.01) {
        float bubbleAA = max(0.025, footprint * bubbleScale * 0.6);
        float pores = foamPores((flow + warp * 0.06) * bubbleScale, bubbleAA);
        shoreFoam *= 1.0 - pores * bubbleVisibility * 0.64;
        shoreFoamLight = 1.0 - pores * bubbleVisibility * 0.12;
      }
      vec3 frothNormal = normalize(normal + vec3(noise(foamUV * 4.1) - 0.5, 0.0,
        noise(foamUV * 3.9 + 31.6) - 0.5) * 0.32);
      shoreFoamLight *= (0.82 + 0.18 * max(0.0, dot(frothNormal, uSunDirection)))
        * (0.90 + flecks * 0.10);
      shoreFoam *= seaActivity * regularNormalWeight;
    }
    float billowedRatio = crestRatio + (crestBillows - 0.5) * 0.024;
    float crestWhitewater = smoothstep(0.890 + crestBreakup * 0.014, 0.977, billowedRatio)
      * (0.76 + crestBillows * 0.24);
    float fallingStreaks = smoothstep(0.54, 0.87, faceRills) * smoothstep(0.80, 0.955, crestRatio)
      * (1.0 - crestWhitewater * 0.80) * faceFilter;
    float giantFoam = (crestWhitewater * 0.92 + fallingStreaks * 0.055) * giantFace;
    float ordinaryFoam = breaking * foamTexture * smoothstep(85.0, 200.0, p.x)
      * seaActivity * (1.0 - giantFace * 0.97);
    float foam = clamp(ordinaryFoam + shoreFoam * 0.94 + giantFoam, 0.0, 0.95);
    float foamDetail = mix(foamCells, 0.5 + crestBreakup * 0.5, giantFace);
    vec3 foamColor = mix(vec3(0.40, 0.50, 0.53), vec3(0.86, 0.91, 0.86), daylight)
      * (0.70 + foamDetail * 0.30);
    foamColor += uHorizonColor * 0.13 + vec3(0.02, 0.05, 0.08) * uCygnus;
    foamColor *= mix(1.0, shoreFoamLight, smoothstep(0.02, 0.25, shoreFoam) * regularNormalWeight);
    color = mix(color, foamColor, clamp(foam, 0.0, 0.95));

    if (uUnderwater > 0.5) {
      // Snell's window and total internal reflection at the water/air boundary.
      // Outside the critical cone, the underside reflects the aquatic scene.
      vec3 inwardNormal = -normal;
      float cosIncidence = max(0.0, dot(inwardNormal, viewDir));
      vec3 skyRay = refract(-viewDir, inwardNormal, 1.333);
      float criticalCos = 0.66144;
      float windowMask = smoothstep(criticalCos - 0.015, criticalCos + 0.015, cosIncidence);
      float underwaterFresnel = 0.02037 + 0.97963 * pow(1.0 - cosIncidence, 5.0);
      vec3 underside = mix(waterBody * 1.8, uShallowWaterColor * 0.50, 0.25);
      underside += vec3(0.017, 0.037, 0.034) * caustics;
      vec3 throughSurface = environmentColor(normalize(skyRay + vec3(0.0, 0.00001, 0.0))) * (1.0 - underwaterFresnel);
      color = mix(underside, throughSurface, windowMask);
      color = mix(color, foamColor * 0.65, clamp(foam * 0.75, 0.0, 1.0));
      vec3 attenuation = exp(-vec3(0.10, 0.032, 0.019) * distanceToEye);
      vec3 inScattering = mix(vec3(0.012, 0.15, 0.18), uShallowWaterColor * 0.58, 0.45)
        * (0.12 + daylight * 0.88) * exp(-max(0.0, -uCameraPosition.y) * 0.006);
      color = color * attenuation + inScattering * (1.0 - attenuation);
    } else {
      float atmosphere = 1.0 - exp(-distanceToEye * (0.00006 + uCloud * 0.000045));
      color = mix(color, uHorizonColor, atmosphere * 0.75);
    }

    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
