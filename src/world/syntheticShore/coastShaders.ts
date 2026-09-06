// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.


import { shoreGLSL } from './shore';
import { sceneReflectionGLSL } from './reflections';

export const coastVertexShader = /* glsl */`
  uniform float uTime;
  uniform float uMaterialKind;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vTint;
  varying vec3 vLocalPosition;

  void main() {
    vec3 p = position;
    vec3 n = normal;
    vLocalPosition = position;
    vTint = vec3(1.0);
    #ifdef USE_INSTANCING_COLOR
      vTint = instanceColor;
    #endif
    #ifdef USE_INSTANCING
      // Eelgrass bends from its rooted base; individual patches follow the swell.
      if (uMaterialKind > 1.5 && uMaterialKind < 2.5) {
        float phase = instanceMatrix[3].x * 0.17 + instanceMatrix[3].z * 0.09;
        float bend = p.y * p.y;
        p.x += (sin(uTime * 1.15 + phase) * 0.17 + 0.12) * bend;
        p.z += cos(uTime * 0.83 + phase * 1.7) * 0.09 * bend;
      }
      // Inverse-scale correction keeps flattened stones lit correctly.
      n /= vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz),
                dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz),
                dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
      n = mat3(instanceMatrix) * n;
      p = (instanceMatrix * vec4(p, 1.0)).xyz;
    #endif
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * n);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const coastFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uUnderwater;
  uniform float uDaylight;
  uniform float uMaterialKind;
  uniform vec3 uSunDirection;
  uniform vec3 uOceanColor;
  uniform float uMetallicBeach;
  uniform float uFlashlightEnabled;
  uniform vec3 uFlashlightPosition;
  uniform vec3 uFlashlightDirection;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vTint;
  varying vec3 vLocalPosition;
  ${shoreGLSL}
  ${sceneReflectionGLSL}

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float contactFootprint(vec2 p, vec2 center, vec2 halfSize, float feather) {
    vec2 outside = max(abs(p - center) - halfSize, vec2(0.0));
    return exp(-dot(outside, outside) / (feather * feather));
  }
  vec3 bumpNormal(vec3 n, float height) {
    vec3 dpdx = dFdx(vWorldPosition), dpdy = dFdy(vWorldPosition);
    vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
    float determinant = dot(dpdx, r1);
    return normalize(abs(determinant) * n - sign(determinant)
      * (dFdx(height) * r1 + dFdy(height) * r2));
  }
  float causticLace(vec2 p) {
    float t = uTime * 0.47;
    vec2 q = p * 3.7 + vec2(sin(p.y * 1.7 + t), cos(p.x * 1.5 - t)) * 1.4;
    float a = abs(sin(q.x + sin(q.y * 0.87 + t))
      + sin(q.y + sin(q.x * 0.79 - t * 0.7)));
    vec2 r = mat2(0.8, -0.6, 0.6, 0.8) * q * 1.47;
    float b = abs(sin(r.x - t * 0.4) + sin(r.y + sin(r.x + t) * 0.6));
    float widthA = max(0.13, fwidth(a));
    float widthB = max(0.15, fwidth(b));
    float brokenLight = smoothstep(0.24, 0.73, noise(p * 1.15 + vec2(t * 0.08, -t * 0.11)));
    return ((1.0 - smoothstep(0.0, widthA, a)) * 0.72
      + (1.0 - smoothstep(0.0, widthB, b)) * 0.42) * brokenLight;
  }
  void main() {
    vec2 p = vWorldPosition.xz;
    vec4 coast = coastCoordinates(p);
    float depth = max(0.0, -vWorldPosition.y);
    float distanceToEye = length(cameraPosition - vWorldPosition);
    float daylight = clamp(uDaylight, 0.025, 1.2);
    float sediment = noise(p * 0.027) * 0.65 + noise(p * 0.18) * 0.35;
    float footprint = max(length(dFdx(p)), length(dFdy(p)));
    // Sub-pixel grains and ripples are averaged out, avoiding distant shimmer.
    float grainVisibility = 1.0 - smoothstep(0.006, 0.065, footprint);
    float grain = ((noise(p * 93.0) - 0.5) * 0.7 + (noise(p * 247.0 + 13.1) - 0.5) * 0.3) * grainVisibility;
    float ripplePhase = p.x * 14.0 + p.y * 2.1 + noise(p * 0.73) * 7.0 + sin(p.y * 0.91) * 1.4;
    float rippleVisibility = 1.0 - smoothstep(0.35, 1.7, fwidth(ripplePhase));
    float ripplePatches = smoothstep(0.31, 0.73, noise(p * 0.23 + 71.0));
    float submergedRipples = 1.0 - smoothstep(-0.3, 0.4, vWorldPosition.y);
    float ripple = (sin(ripplePhase) + 0.16 * sin(ripplePhase * 1.87)) * rippleVisibility
      * ripplePatches * mix(0.25, 1.0, submergedRipples);
    // Water and the exposed wet sand use the same incoming wave and its recent
    // runup history. Elevated rock surfaces do not inherit a wet terrain mask.
    float shoreSurface = coast.x < 120.0 ? shoreSurfaceGLSL(p).x : 0.0;
    float recentWash = shoreWetnessGLSL(p);
    float rockWetness = 1.0 - smoothstep(shoreSurface - 0.025, shoreSurface + 0.10, vWorldPosition.y);
    float wet = uMaterialKind < 0.5 ? recentWash : rockWetness;
    float film = smoothstep(0.20, 0.95, wet) * (1.0 - smoothstep(0.10, 0.55, max(0.0, shoreSurface - vWorldPosition.y)));
    vec3 drySand = mix(vec3(0.48, 0.36, 0.22), vec3(0.72, 0.60, 0.40), sediment);
    float fineSediment = noise(p * 2.7) * 0.06 + noise(p * 13.0) * 0.035;
    vec3 color = drySand * (0.95 + fineSediment + grain * 0.20 + ripple * 0.022);
    color = mix(color, color * vec3(0.51, 0.57, 0.60), wet * 0.68);
    color = mix(color, vec3(0.20, 0.24, 0.19), smoothstep(12.0, 150.0, depth) * 0.66);
    float bump = ripple * 0.0026 + grain * 0.00055;
    float roughness = mix(0.84, 0.30, wet);
    roughness = mix(roughness, 0.085, film);
    bump *= 1.0 - film * 0.74;
    float sandMask = 1.0 - step(0.5, uMaterialKind);
    float metalMask = uMetallicBeach * sandMask * smoothstep(-0.5, 0.4, vWorldPosition.y);
    vec2 panelUV = p / 2.4;
    panelUV.x += mod(floor(panelUV.y), 2.0) * 0.5;
    vec2 panelEdge = abs(fract(panelUV) - 0.5);
    float seamWidth = max(0.005, max(fwidth(panelUV.x), fwidth(panelUV.y)));
    float panelSeam = smoothstep(0.484 - seamWidth, 0.49 + seamWidth, max(panelEdge.x, panelEdge.y));
    float brushing = (noise(p * vec2(42.0, 1.3)) - 0.5) * (1.0 - smoothstep(0.025, 0.12, footprint));
    vec3 titanium = mix(vec3(0.22, 0.29, 0.34), vec3(0.40, 0.49, 0.53), noise(floor(panelUV)));
    titanium *= 1.0 + brushing * 0.06;
    color = mix(color, titanium * (1.0 - panelSeam * 0.66), metalMask);
    bump = mix(bump, brushing * 0.00035 - panelSeam * 0.003, metalMask);
    roughness = mix(roughness, 0.18 + noise(floor(panelUV) + 19.0) * 0.06, metalMask);
    if (uMaterialKind > 0.5 && uMaterialKind < 1.5) {
      float rockGrain = noise(vWorldPosition.xz * 8.0 + vWorldPosition.y * 3.0);
      float mineral = noise(vWorldPosition.xz * 0.72 + vWorldPosition.y * 1.6);
      color = vTint * mix(0.65, 1.23, mineral) * (0.85 + rockGrain * 0.22);
      color = mix(color, color * vec3(0.49, 0.67, 0.54), wet * 0.36);
      bump = rockGrain * 0.025;
      roughness = mix(0.92, 0.42, wet);
    } else if (uMaterialKind > 1.5 && uMaterialKind < 2.5) {
      color = vTint * (0.48 + vLocalPosition.y * 0.60);
      float centralVein = exp(-abs(vLocalPosition.x) * 90.0) * 0.10;
      color += vec3(0.16, 0.21, 0.06) * centralVein;
      bump = 0.0;
      roughness = 0.64;
    } else if (uMaterialKind > 2.5) {
      color = vTint * (0.78 + noise(p * 95.0) * 0.25);
      bump = sin(atan(vLocalPosition.z, vLocalPosition.x) * 24.0) * 0.001;
      roughness = 0.48;
    }
    vec3 n = normalize(vWorldNormal);
    if (!gl_FrontFacing) n = -n;
    n = bumpNormal(n, bump);
    vec3 lightDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(viewDir + lightDir);
    float ndl = max(0.0, dot(n, lightDir));
    float ndv = max(0.001, dot(n, viewDir));
    vec3 sunlight = mix(vec3(1.0, 0.65, 0.36), vec3(1.0, 0.96, 0.84), smoothstep(0.0, 0.55, lightDir.y));
    vec3 albedo = color;
    color *= vec3(0.20, 0.29, 0.36) * (0.22 + daylight * 0.56)
      + sunlight * ndl * daylight * 1.04;
    // GGX highlight and a grazing-angle sky reflection on the film of wet sand.
    float alpha = roughness * roughness;
    float a2 = alpha * alpha;
    float ndh = max(0.0, dot(n, halfDir));
    float denominator = ndh * ndh * (a2 - 1.0) + 1.0;
    float distribution = a2 / max(0.0001, 3.14159 * denominator * denominator);
    float f0 = mix(0.025, 0.72, metalMask);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - max(0.0, dot(viewDir, halfDir)), 5.0);
    float visibility = 1.0 / max(0.08, 4.0 * (ndv * (1.0 - roughness * 0.5) + roughness * 0.5));
    color += sunlight * min(4.0, distribution * fresnel * visibility) * ndl * daylight * max(wet, metalMask);
    vec3 reflectedDirection = reflect(-viewDir, n);
    vec3 reflection = reflectionSkyColor(reflectedDirection);
    float exposedWet = wet * sandMask * (1.0 - smoothstep(0.02, 0.25, shoreSurface - vWorldPosition.y));
    if ((exposedWet > 0.01 || metalMask > 0.01) && uUnderwater < 0.5) {
      reflection = sampleSceneReflection(vWorldPosition, n, viewDir, roughness, reflection);
    }
    float filmFresnel = 0.02037 + 0.97963 * pow(1.0 - ndv, 5.0);
    float reflectedFilm = exposedWet * filmFresnel * (0.32 + film * 0.68);
    color = mix(color, reflection, reflectedFilm * (1.0 - metalMask));
    vec3 metalFresnel = mix(vec3(0.65, 0.72, 0.76), vec3(1.0), pow(1.0 - ndv, 5.0));
    color = mix(color, color * 0.16 + reflection * metalFresnel, metalMask * 0.92);
    // Local ambient/contact shadows anchor the fixed beach furniture without
    // another shadow-map render of the full ocean. Restrict them to terrain;
    // bottle, grass and creature materials never inherit these footprints.
    float contactShade = 1.0;
    if (sandMask > 0.5 && p.x > -65.0 && p.x < -40.0 && p.y > -15.0 && p.y < 22.0) {
      float chairA = contactFootprint(p, vec2(-44.25, 15.0), vec2(1.04, 0.49), 0.28);
      float chairB = contactFootprint(p, vec2(-43.7, 18.5), vec2(1.04, 0.49), 0.28);
      float tableDistance = max(0.0, length(p - vec2(-43.35, 16.0)) - 0.43);
      float tableShadow = exp(-tableDistance * tableDistance / 0.095);
      float barShadow = contactFootprint(p, vec2(-59.0, -9.0), vec2(2.48, 3.98), 0.25);
      float occlusion = max(max(chairA, chairB), max(tableShadow * 0.83, barShadow));
      contactShade = 1.0 - occlusion * (0.34 + min(daylight, 1.0) * 0.28);
      color *= contactShade;
    }
    // Panel seams emit their own light, so ambient furniture occlusion does
    // not incorrectly extinguish the futuristic beach's embedded lighting.
    color += vec3(0.012, 0.20, 0.29) * panelSeam * metalMask * (0.34 + (1.0 - min(daylight, 1.0)) * 0.66);
    // Small broken bubbles persist briefly on freshly drained sand. The main
    // moving front is rendered on the actual water surface, not painted inland.
    float exposedFilm = smoothstep(0.0, 0.045, vWorldPosition.y - shoreSurface);
    float foamCells = noise(p * 5.7 + vec2(uTime * 0.045, 0.0));
    float foamPatches = smoothstep(0.63, 0.82, noise(p * 0.80 + 19.0));
    float residue = smoothstep(0.69, 0.84, foamCells) * foamPatches * recentWash * exposedFilm
      * smoothstep(0.0, 0.8, uWaveHeight) * smoothstep(-8.0, -3.0, coast.x)
      * (1.0 - smoothstep(0.0, 7.0, coast.x)) * sandMask * 0.19;
    color = mix(color, vec3(0.62, 0.69, 0.65) * (0.12 + daylight * 0.88), residue);
    float submerged = 1.0 - smoothstep(-0.08, 0.03, vWorldPosition.y);
    float caustics = causticLace(p) * exp(-depth * 0.12)
      * (1.0 - smoothstep(6.0, 38.0, distanceToEye))
      * submerged * daylight * (0.25 + ndl * 0.75) * 0.37
      * smoothstep(0.08, 0.55, max(0.0, shoreSurface - vWorldPosition.y));
    color += vec3(0.32, 0.57, 0.47) * caustics;
    // Red light attenuates first; near-eye sand keeps its natural mineral color.
    vec3 transmission = exp(-vec3(0.090, 0.025, 0.014) * depth);
    color *= mix(vec3(1.0), transmission, submerged);
    float submergedPath = mix(min(distanceToEye, depth / max(0.12, abs(viewDir.y))), distanceToEye, uUnderwater);
    submergedPath *= submerged;
    vec3 pathTransmission = exp(-vec3(0.070, 0.031, 0.023) * submergedPath);
    vec3 scatteredLight = mix(vec3(0.012, 0.15, 0.18), uOceanColor * 0.58, 0.45)
      * (0.12 + daylight * 0.88) * exp(-max(0.0, -cameraPosition.y) * 0.006);
    color = color * pathTransmission + scatteredLight * (1.0 - pathTransmission);
    float airHaze = (1.0 - exp(-distanceToEye * 0.00017)) * (1.0 - uUnderwater);
    color = mix(color, mix(vec3(0.15, 0.24, 0.29), sunlight * 0.50, 0.35) * daylight, airHaze);
    // A camera-mounted light illuminates nearby grains and rocks even in the
    // abyss. Its local light path is independent of the sun's surface depth.
    vec3 torchRay = vWorldPosition - uFlashlightPosition;
    float torchDistance = max(0.02, length(torchRay));
    float cone = smoothstep(0.87, 0.965, dot(torchRay / torchDistance, uFlashlightDirection));
    float torchLambert = max(0.0, dot(n, -torchRay / torchDistance));
    float torchFalloff = 18.0 / (1.0 + 0.20 * torchDistance + 0.40 * torchDistance * torchDistance);
    vec3 torchAbsorption = exp(-vec3(0.07, 0.034, 0.022) * torchDistance * uUnderwater);
    color += albedo * vec3(0.78, 0.90, 1.0) * torchAbsorption * cone * torchFalloff
      * (0.12 + torchLambert * 0.88) * uFlashlightEnabled * mix(0.55, 1.0, contactShade);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
