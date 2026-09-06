// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
import * as THREE from 'three';


export function createReflectionUniforms() {
  return {
    uSceneReflection: { value: null as THREE.Texture | null },
    uReflectionEnvironment: { value: null as THREE.CubeTexture | null },
    uEnvironmentReflectionStrength: { value: 0 },
    uReflectionMatrix: { value: new THREE.Matrix4() },
    uReflectionTexelSize: { value: new THREE.Vector2(1, 1) },
    uReflectionStrength: { value: 0 },
    uReflectionPlaneY: { value: 0 },
    uReflectionSkyColor: { value: new THREE.Color(0x104e7a) },
    uReflectionHorizonColor: { value: new THREE.Color(0x6edbde) },
  };
}
export type ReflectionUniforms = ReturnType<typeof createReflectionUniforms>;

/** HDR samples stay linear until the final material is tone-mapped once. */
export const sceneReflectionGLSL = /* glsl */`
  uniform sampler2D uSceneReflection;
  uniform samplerCube uReflectionEnvironment;
  uniform float uEnvironmentReflectionStrength;
  uniform mat4 uReflectionMatrix;
  uniform vec2 uReflectionTexelSize;
  uniform float uReflectionStrength;
  uniform float uReflectionPlaneY;
  uniform vec3 uReflectionSkyColor;
  uniform vec3 uReflectionHorizonColor;
  vec3 sampleEnvironmentReflection(vec3 direction, float roughness, vec3 fallbackColor) {
    if (uEnvironmentReflectionStrength <= 0.001) return fallbackColor;
    // Filter the whole footprint. Sparse offset taps duplicate small bright
    // stars into visible crosses instead of producing a continuous highlight.
    vec3 radiance = textureCubeLodEXT(uReflectionEnvironment, direction,
      0.5 + roughness * 4.0).rgb;
    return mix(fallbackColor, radiance, uEnvironmentReflectionStrength);
  }
  vec3 reflectionSkyColor(vec3 direction) {
    float up = max(0.0, direction.y);
    vec3 skyColor = mix(uReflectionSkyColor, uReflectionHorizonColor, exp(-up * 10.0) * 0.92)
      + uReflectionSkyColor * exp(-up * 2.0) * 0.25;
    return skyColor;
  }
  vec4 sampleSceneReflectionRGBA(vec3 worldPosition, vec3 normal, vec3 viewDir,
      float roughness, vec3 fallbackColor) {
    vec3 reflectedRay = reflect(-viewDir, normal);
    if (uReflectionStrength <= 0.001) return vec4(sampleEnvironmentReflection(reflectedRay, roughness, fallbackColor), 0.0);
    // A mean-sea mirror is accurate for surf and its thin wet film. It must
    // gracefully give way to the directional sky on a kilometre-high wave.
    float heightWeight = 1.0 - smoothstep(1.5, 8.0, abs(worldPosition.y - uReflectionPlaneY));
    if (heightWeight <= 0.001) return vec4(sampleEnvironmentReflection(reflectedRay, roughness, fallbackColor), 0.0);
    vec3 planePoint = vec3(worldPosition.x, uReflectionPlaneY, worldPosition.z);
    vec4 projected = uReflectionMatrix * vec4(planePoint, 1.0);
    if (projected.w <= 0.0) return vec4(sampleEnvironmentReflection(reflectedRay, roughness, fallbackColor), 0.0);
    vec2 baseUV = projected.xy / projected.w;
    // Project the perturbed reflection ray, rather than interpreting world X/Z
    // as screen axes; highlights then remain correct when the player turns.
    float rayLength = clamp(projected.w * 0.75, 1.0, 800.0);
    vec4 perturbed = uReflectionMatrix * vec4(planePoint + reflectedRay * rayLength, 1.0);
    vec2 rayUV = perturbed.xy / max(0.001, perturbed.w);
    vec2 distortion = clamp(rayUV - baseUV, vec2(-0.10), vec2(0.10));
    vec2 uv = baseUV + distortion * (0.72 - roughness * 0.25);
    vec2 border = min(uv, 1.0 - uv);
    float edgeWeight = smoothstep(0.005, 0.065, min(border.x, border.y));
    if (edgeWeight <= 0.001 || reflectedRay.y < -0.05) return vec4(sampleEnvironmentReflection(reflectedRay, roughness, fallbackColor), 0.0);
    vec2 safeUV = clamp(uv, uReflectionTexelSize * 2.0, 1.0 - uReflectionTexelSize * 2.0);
    vec2 footprintX = dFdx(uv) / uReflectionTexelSize;
    vec2 footprintY = dFdy(uv) / uReflectionTexelSize;
    float footprintLod = 0.5 * log2(max(1.0, max(dot(footprintX, footprintX), dot(footprintY, footprintY))));
    float roughnessLod = log2(1.0 + roughness * roughness * 30.0);
    vec4 sampleColor = texture2DLodEXT(uSceneReflection, safeUV, max(footprintLod, roughnessLod));
    float weight = uReflectionStrength * heightWeight * edgeWeight * smoothstep(0.05, 0.95, sampleColor.a);
    if (weight < 0.999) fallbackColor = sampleEnvironmentReflection(reflectedRay, roughness, fallbackColor);
    return vec4(mix(fallbackColor, sampleColor.rgb, weight), weight);
  }
  vec3 sampleSceneReflection(vec3 worldPosition, vec3 normal, vec3 viewDir,
      float roughness, vec3 fallbackColor) {
    return sampleSceneReflectionRGBA(worldPosition, normal, viewDir, roughness, fallbackColor).rgb;
  }
`;

/** Reflect the actual view, then clip the submerged half-space. */
export function configureReflectionCamera(source: THREE.PerspectiveCamera, mirror: THREE.PerspectiveCamera,
    textureMatrix: THREE.Matrix4, planeY = 0): void {
  source.updateMatrixWorld();
  const position = source.getWorldPosition(new THREE.Vector3());
  const direction = source.getWorldDirection(new THREE.Vector3());
  mirror.position.copy(position);
  mirror.position.y = 2 * planeY - position.y;
  direction.y *= -1;
  mirror.up.set(0, 1, 0).applyQuaternion(source.getWorldQuaternion(new THREE.Quaternion()));
  mirror.up.y *= -1;
  mirror.lookAt(mirror.position.clone().add(direction));
  mirror.near = source.near;
  mirror.far = source.far;
  mirror.projectionMatrix.copy(source.projectionMatrix);
  mirror.updateMatrixWorld();
  textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
    .multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
  // Same oblique near-plane construction used by Three's Reflector. Texture
  // projection keeps its original X/Y rows; only the clip-space Z row changes.
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY)
    .applyMatrix4(mirror.matrixWorldInverse);
  const clip = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
  const elements = mirror.projectionMatrix.elements;
  const q = new THREE.Vector4((Math.sign(clip.x) + elements[8]) / elements[0],
    (Math.sign(clip.y) + elements[9]) / elements[5], -1, (1 + elements[10]) / elements[14]);
  const denominator = clip.dot(q);
  if (Math.abs(denominator) > 1e-8) {
    clip.multiplyScalar(2 / denominator);
    elements[2] = clip.x;
    elements[6] = clip.y;
    elements[10] = clip.z + 1 - 0.00005;
    elements[14] = clip.w;
  }
  mirror.projectionMatrixInverse.copy(mirror.projectionMatrix).invert();
}

