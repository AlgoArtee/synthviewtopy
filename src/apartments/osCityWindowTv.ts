import * as THREE from 'three';
import type { CityTimeOfDay } from './osCityWeather';

type Layout = 'atlas' | 'room';
export const CITY_TV_STRENGTH: Record<CityTimeOfDay, number> = { night: 1, evening: 1, morning: .82, day: .42 };
export interface CityWindowSettings { shadowsPercent: number; illuminatedPercent: number; tvPercent: number }
export const CITY_WINDOW_DEFAULTS: CityWindowSettings = { shadowsPercent: 40, illuminatedPercent: 65, tvPercent: 40 };
export function normalizeCityWindowSettings(value: Partial<CityWindowSettings>, fallback = CITY_WINDOW_DEFAULTS): CityWindowSettings {
  const percent = (key: keyof CityWindowSettings) => Number.isFinite(value[key]) ? Math.round(THREE.MathUtils.clamp(value[key]!, 0, 100)) : fallback[key];
  return { shadowsPercent: percent('shadowsPercent'), illuminatedPercent: percent('illuminatedPercent'), tvPercent: percent('tvPercent') };
}

// Three different permutations keep coverage stable as a slider moves and
// distribute each percentage evenly through every hundred residential rooms.
export function cityWindowRank(id: number, channel: number) {
  const block = Math.floor(id / 100), multiplier = channel === 0 ? 37 : channel === 1 ? 53 : 71;
  return ((id % 100) * multiplier + (block * 17 + Math.floor(block / 13) * 11 + channel * 29) % 100) % 100;
}
export function cityWindowFlags(id: number, settings = CITY_WINDOW_DEFAULTS) {
  const illuminated = cityWindowRank(id, 0) + .5 < settings.illuminatedPercent;
  return { illuminated, shadows: illuminated && cityWindowRank(id, 1) + .5 < settings.shadowsPercent,
    tv: illuminated && cityWindowRank(id, 2) + .5 < settings.tvPercent };
}

/** Default TV selection. Integer rank arithmetic is shared with the shader. */
export function isCityTvWindow(id: number) {
  return cityWindowRank(id, 2) < 40;
}
const hash = (id: number) => {
  const value = Math.sin(id * 12.9898 + 1.7) * 43758.5453;
  return value - Math.floor(value);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function sampleCityWindowTv(id: number, elapsed: number, reducedMotion = false) {
  const time = reducedMotion ? 0 : Math.max(0, elapsed);
  const age = time / (1.6 + hash(id + 3) * 2.2) + hash(id + 17) * 80;
  const cut = Math.floor(age), phase = age - cut;
  const transition = Math.min(1, phase / .24), blend = transition * transition * (3 - 2 * transition);
  const program = mix(hash(id + cut * 7), hash(id + (cut + 1) * 7), blend);
  return {
    id, selected: isCityTvWindow(id), light: .06 + 2.4 * program * program,
    shadowX: .12 + .76 * (.5 + .5 * Math.sin(time * (.62 + hash(id + 11) * .37) + id)),
    shadowY: .47 + .075 * Math.sin(time * .37 + id * .61),
    color: [mix(.30, 1, program), mix(.57, .48, program), mix(1, .36, program)],
  };
}

/** GPU-only interior light/shadow animation. All window geometry and maps stay
 * static. Per-face IDs survive batching and keep repeated atlases independent. */
export function createCityWindowTv(label: string) {
  const timeUniform = { value: 0 }, strengthUniform = { value: CITY_TV_STRENGTH.day };
  const coverageUniform = { value: new THREE.Vector3(40, 65, 40) };
  const materials = new Set<THREE.MeshStandardMaterial>();
  const faces = new Set<string>(), sampleIds: number[] = [], windowIds: number[] = [];
  let settings = { ...CITY_WINDOW_DEFAULTS };
  let windowCount = 0, animatedWindowCount = 0, illuminatedWindowCount = 0, shadowWindowCount = 0, elapsed = 0, reducedMotion = false, timeOfDay: CityTimeOfDay = 'day';
  function countWindow(id: number) {
    const flags = cityWindowFlags(id, settings);
    if (flags.illuminated) illuminatedWindowCount++;
    if (flags.shadows) shadowWindowCount++;
    if (flags.tv) animatedWindowCount++;
  }
  function setSettings(value: Partial<CityWindowSettings>) {
    settings = normalizeCityWindowSettings(value, settings);
    coverageUniform.value.set(settings.shadowsPercent, settings.illuminatedPercent, settings.tvPercent);
    illuminatedWindowCount = shadowWindowCount = animatedWindowCount = 0;
    windowIds.forEach(countWindow);
  }

  function material(source: THREE.MeshStandardMaterial, layout: Layout, inPlace = false, fullOpening = false) {
    const result = inPlace ? source : source.clone();
    if (materials.has(result)) return result;
    const columns = layout === 'atlas' ? 8 : 1, rows = layout === 'atlas' ? 24 : 1;
    const previous = result.onBeforeCompile, cacheKey = result.customProgramCacheKey();
    result.name += ' · TV-lit rooms';
    result.userData.cityWindowTv = { layout, columns, rows, targetCoverage: .4, fullOpening };
    result.onBeforeCompile = (shader, renderer) => {
      previous.call(result, shader, renderer);
      shader.uniforms.cityTvTime = timeUniform;
      shader.uniforms.cityTvStrength = strengthUniform;
      shader.uniforms.cityWindowCoverage = coverageUniform;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
        attribute float cityTvFace;
        varying float vCityTvFace;
        varying vec2 vCityTvUv;`);
      shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
        vCityTvFace = cityTvFace;
        vCityTvUv = uv;`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        uniform float cityTvTime;
        uniform float cityTvStrength;
        uniform vec3 cityWindowCoverage;
        varying float vCityTvFace;
        varying vec2 vCityTvUv;
        float cityTvHash(float id) { return fract(sin(id * 12.9898 + 1.7) * 43758.5453); }
        float cityWindowRank(float id, float channel) {
          float block = floor(id / 100.0);
          float multiplier = channel < .5 ? 37.0 : channel < 1.5 ? 53.0 : 71.0;
          return mod(mod(id, 100.0) * multiplier + mod(block * 17.0 + floor(block / 13.0) * 11.0 + channel * 29.0, 100.0), 100.0);
        }`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        // Canvas atlas rows run downwards. Keep light off frames and masonry.
        vec2 tvGrid = vec2(${columns.toFixed(1)}, ${rows.toFixed(1)});
        vec2 tvCellUv = clamp(vec2(vCityTvUv.x, 1.0 - vCityTvUv.y), vec2(0.0), vec2(.999999)) * tvGrid;
        vec2 tvCell = floor(tvCellUv);
        vec2 tvLocal = fract(tvCellUv);
        float tvId = floor(vCityTvFace + .5) * ${columns * rows}.0 + tvCell.y * ${columns}.0 + tvCell.x;
        vec2 tvMin = ${layout === 'atlas' ? 'vec2(.125, .1875)' : 'vec2(.035, .045)'};
        vec2 tvMax = ${layout === 'atlas' ? 'vec2(.859375, .6328125)' : 'vec2(.965, .955)'};
        vec2 tvP = (tvLocal - tvMin) / (tvMax - tvMin);
        float tvOpening = ${fullOpening ? '1.0' : 'smoothstep(0.0, .055, tvP.x) * (1.0 - smoothstep(.945, 1.0, tvP.x)) * smoothstep(0.0, .055, tvP.y) * (1.0 - smoothstep(.945, 1.0, tvP.y))'};
        float roomLit = 1.0 - step(cityWindowCoverage.y, cityWindowRank(tvId, 0.0) + .5);
        float roomShadows = roomLit * (1.0 - step(cityWindowCoverage.x, cityWindowRank(tvId, 1.0) + .5));
        float roomTv = roomLit * (1.0 - step(cityWindowCoverage.z, cityWindowRank(tvId, 2.0) + .5));
        float tvMask = tvOpening * roomTv;
        float tvAge = cityTvTime / (1.6 + cityTvHash(tvId + 3.0) * 2.2) + cityTvHash(tvId + 17.0) * 80.0;
        float tvCut = floor(tvAge);
        float tvProgram = mix(cityTvHash(tvId + tvCut * 7.0), cityTvHash(tvId + (tvCut + 1.0) * 7.0), smoothstep(0.0, .24, fract(tvAge)));
        float tvLight = .06 + 2.4 * tvProgram * tvProgram;
        vec2 tvShadowCenter = vec2(.12 + .76 * (.5 + .5 * sin(cityTvTime * (.62 + cityTvHash(tvId + 11.0) * .37) + tvId)), .47 + .075 * sin(cityTvTime * .37 + tvId * .61));
        // A broad cast shadow slides over the interior, with a softer seated
        // silhouette. Changing the spatial pattern matters more than flashing.
        float tvCast = 1.0 - smoothstep(.18, .52, abs(tvP.x - tvShadowCenter.x + (tvP.y - .5) * .24));
        float tvHead = 1.0 - smoothstep(.095, .19, length((tvP - tvShadowCenter) * vec2(1.0, 1.20)));
        float tvBody = (1.0 - smoothstep(.13, .30, abs(tvP.x - tvShadowCenter.x))) * smoothstep(tvShadowCenter.y, tvShadowCenter.y + .20, tvP.y);
        float tvShadow = min(.96, tvCast * .84 + max(tvHead, tvBody) * .30) * roomShadows;
        vec3 tvColor = mix(vec3(.30, .57, 1.0), vec3(1.0, .48, .36), tvProgram);
        float tvWash = tvLight * (1.0 - tvShadow);
        // These rooms have their overhead lights off. Replace their steady
        // emission, rather than laying a small TV ripple over bright static lamps.
        // A broad shadow and scene-to-scene contrast survive a 3–8 pixel window.
        float tvDetail = clamp(dot(diffuseColor.rgb, vec3(.3, .5, .2)) * 2.0, .40, .80);
        vec3 steadyRoomLight = max(totalEmissiveRadiance, vec3(.85, .75, .60) * (.15 + cityTvStrength * .25) * tvDetail);
        steadyRoomLight *= 1.0 - tvShadow * cityTvStrength * .88;
        totalEmissiveRadiance = mix(totalEmissiveRadiance, steadyRoomLight, tvOpening * roomLit);
        vec3 tvInteriorLight = tvColor * (.018 + tvWash * tvDetail * 3.8);
        totalEmissiveRadiance = mix(totalEmissiveRadiance, tvInteriorLight, tvMask * cityTvStrength);
        diffuseColor.rgb *= 1.0 - tvMask * cityTvStrength * (.66 + tvShadow * .26);
        diffuseColor.rgb *= 1.0 - tvOpening * roomShadows * (1.0 - roomTv) * tvShadow * cityTvStrength * .55;
        totalEmissiveRadiance *= 1.0 - tvOpening * (1.0 - roomLit);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.012, .022, .032), tvOpening * (1.0 - roomLit) * .97);
      `);
    };
    result.customProgramCacheKey = () => cacheKey + '|city-window-appearance-v4-' + layout + (fullOpening ? '-whole-quad' : '');
    result.needsUpdate = true;
    materials.add(result);
    return result;
  }

  function tagGeometry<T extends THREE.BufferGeometry>(geometry: T, faceId: number, layout: Layout, count = true): T {
    if (!Number.isInteger(faceId) || faceId < 0 || faceId > 60000) throw new Error('Invalid TV window face ID');
    geometry.setAttribute('cityTvFace', new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count).fill(faceId), 1));
    const key = `${layout}:${faceId}`;
    if (count && !faces.has(key)) {
      faces.add(key);
      const cells = layout === 'atlas' ? 192 : 1;
      for (let cell = 0; cell < cells; cell++) {
        const id = faceId * cells + cell;
        windowCount++; windowIds.push(id); countWindow(id);
        if (isCityTvWindow(id)) {
          if (sampleIds.length < 12) sampleIds.push(id);
        }
      }
    }
    return geometry;
  }
  function update(time: number, reduced: boolean, selectedTime: CityTimeOfDay) {
    elapsed = Math.max(0, time); reducedMotion = reduced; timeOfDay = selectedTime;
    timeUniform.value = reduced ? 0 : elapsed;
    strengthUniform.value = CITY_TV_STRENGTH[timeOfDay];
  }
  function snapshot() {
    return { label, settings: { ...settings }, windowCount, illuminatedWindowCount, shadowWindowCount, animatedWindowCount,
      coverage: illuminatedWindowCount ? animatedWindowCount / illuminatedWindowCount : 0, targetCoverage: settings.tvPercent / 100,
      shadowCoverage: illuminatedWindowCount ? shadowWindowCount / illuminatedWindowCount : 0,
      illuminatedCoverage: windowCount ? illuminatedWindowCount / windowCount : 0,
      faceCount: faces.size, materialCount: materials.size, elapsed, reducedMotion, timeOfDay, strength: strengthUniform.value,
      staticGeometry: true, animatedTextures: false, extraPointLights: 0,
      samples: sampleIds.map(id => ({ ...sampleCityWindowTv(id, elapsed, reducedMotion), ...cityWindowFlags(id, settings) })) };
  }
  return { material, tagGeometry, update, snapshot, setSettings, getSettings: () => ({ ...settings }) };
}
