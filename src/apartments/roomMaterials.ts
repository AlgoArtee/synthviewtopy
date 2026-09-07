import * as THREE from 'three';

type PbrMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

/** The maps use metric UVs: one UV unit represents one metre of the surface. */
export function setMetricUVs<T extends THREE.BufferGeometry>(geometry: T): T {
  const positions = geometry.getAttribute('position');
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  const uv = new Float32Array(positions.count * 2);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i);
    if (Math.abs(ny) >= Math.abs(nx) && Math.abs(ny) >= Math.abs(nz)) {
      uv[i * 2] = x;
      uv[i * 2 + 1] = -z * Math.sign(ny || 1);
    } else if (Math.abs(nx) >= Math.abs(nz)) {
      uv[i * 2] = -z * Math.sign(nx || 1);
      uv[i * 2 + 1] = y;
    } else {
      uv[i * 2] = x * Math.sign(nz || 1);
      uv[i * 2 + 1] = y;
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/**
 * Scaled unit-box instances need projection after the instance transform.
 * Opt in for architecture and cabinetry. This overrides existing UVs instead
 * of multiplying them, so it also accepts geometry that already has metric UVs.
 * Cloth and curved upholstery can keep their authored UVs with setMetricUVs.
 */
export function enableWorldSpaceUV<T extends PbrMaterial>(material: T): T {
  if (material.userData.roomWorldSpaceUV) return material;
  material.userData.roomWorldSpaceUV = true;
  const previousCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      #include <project_vertex>
      vec4 roomMetricPosition = vec4(transformed, 1.0);
      #ifdef USE_BATCHING
        roomMetricPosition = batchingMatrix * roomMetricPosition;
      #endif
      #ifdef USE_INSTANCING
        roomMetricPosition = instanceMatrix * roomMetricPosition;
      #endif
      roomMetricPosition = modelMatrix * roomMetricPosition;
      vec3 roomMetricNormal = inverseTransformDirection(transformedNormal, viewMatrix);
      vec3 roomAbsNormal = abs(roomMetricNormal);
      vec2 roomMetricUv;
      if (roomAbsNormal.y >= roomAbsNormal.x && roomAbsNormal.y >= roomAbsNormal.z) {
        roomMetricUv = vec2(roomMetricPosition.x, -roomMetricPosition.z * sign(roomMetricNormal.y));
      } else if (roomAbsNormal.x >= roomAbsNormal.z) {
        roomMetricUv = vec2(-roomMetricPosition.z * sign(roomMetricNormal.x), roomMetricPosition.y);
      } else {
        roomMetricUv = vec2(roomMetricPosition.x * sign(roomMetricNormal.z), roomMetricPosition.y);
      }
      #ifdef USE_MAP
        vMapUv = (mapTransform * vec3(roomMetricUv, 1.0)).xy;
      #endif
      #ifdef USE_NORMALMAP
        vNormalMapUv = (normalMapTransform * vec3(roomMetricUv, 1.0)).xy;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = (roughnessMapTransform * vec3(roomMetricUv, 1.0)).xy;
      #endif
      #ifdef USE_AOMAP
        vAoMapUv = (aoMapTransform * vec3(roomMetricUv, 1.0)).xy;
      #endif
      #ifdef USE_METALNESSMAP
        vMetalnessMapUv = (metalnessMapTransform * vec3(roomMetricUv, 1.0)).xy;
      #endif
      #ifdef USE_BUMPMAP
        vBumpMapUv = (bumpMapTransform * vec3(roomMetricUv, 1.0)).xy;
      #endif
    `);
  };
  material.customProgramCacheKey = () => `room-pbr-v1/world/${material.userData.roomNeutralTint ? 'tinted' : 'original'}`;
  material.needsUpdate = true;
  return material;
}

/** Preserve scanned velvet nap variation while dyeing its red base emerald. */
function dyeVelvet(material: THREE.MeshPhysicalMaterial) {
  material.userData.roomNeutralTint = true;
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 roomFabricSample = texture2D(map, vMapUv);
        float roomFabricTone = clamp(dot(roomFabricSample.rgb, vec3(0.2126, 0.7152, 0.0722)) * 5.6, 0.12, 1.25);
        diffuseColor *= vec4(vec3(roomFabricTone), roomFabricSample.a);
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'room-pbr-v1/metric/tinted';
}

/**
 * Synchronous material creation, asynchronous local image decoding. Await ready
 * before hiding the room loader or capturing an environment map. A missing map
 * rejects ready with its local URL; the caller can show its normal loading error.
 */
export function createRoomMaterials(loadingManager?: THREE.LoadingManager) {
  const loader = new THREE.TextureLoader(loadingManager);
  const textures = new Set<THREE.Texture>();
  const materials = new Set<PbrMaterial>();
  const pending: Promise<void>[] = [];
  let disposed = false;

  function texture(id: string, role: 'basecolor' | 'normal' | 'roughness', width: number, height = width) {
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    pending.push(new Promise<void>((done, failed) => { resolve = done; reject = failed; }));
    const url = `/apartments/materials/${id}_${role}.jpg`;
    const map = loader.load(url, loaded => {
      if (disposed) loaded.dispose();
      resolve();
    }, undefined, () => reject(new Error(`Unable to load apartment material: ${url}`)));
    map.name = `${id}/${role}`;
    map.colorSpace = role === 'basecolor' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1 / width, 1 / height);
    map.anisotropy = 8;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.magFilter = THREE.LinearFilter;
    textures.add(map);
    return map;
  }

  function maps(id: string, width: number, height = width) {
    return { map: texture(id, 'basecolor', width, height), normalMap: texture(id, 'normal', width, height), roughnessMap: texture(id, 'roughness', width, height) };
  }
  function own<T extends PbrMaterial>(name: string, material: T): T {
    material.name = `Liminette / ${name}`;
    material.envMapIntensity = 0.7;
    materials.add(material);
    return material;
  }

  const walnutMaps = maps('smoked_walnut_veneer', .65);
  const walnut = own('smoked walnut', new THREE.MeshPhysicalMaterial({
    ...walnutMaps, color: '#807464', roughness: 0.88, metalness: 0,
    normalScale: new THREE.Vector2(0.17, 0.17), clearcoat: 0.13, clearcoatRoughness: 0.42,
  }));
  const darkWood = own('dark walnut joinery', walnut.clone());
  darkWood.color.set('#66523e');
  darkWood.roughness = 0.88;
  const oak = own('warm wood accents', walnut.clone());
  oak.color.set('#c0a478');

  const parquet = own('oiled herringbone parquet', new THREE.MeshPhysicalMaterial({
    ...maps('herringbone_parquet', 3.4), color: '#887b6a', roughness: 0.94, metalness: 0,
    normalScale: new THREE.Vector2(0.23, 0.23), clearcoat: 0.04, clearcoatRoughness: 0.65,
  }));
  const leather = own('aged saddle leather', new THREE.MeshPhysicalMaterial({
    ...maps('brown_leather', 0.4), color: '#cbb49b', roughness: 0.9, metalness: 0,
    normalScale: new THREE.Vector2(0.24, 0.24), clearcoat: 0.045, clearcoatRoughness: 0.58,
  }));
  const velvet = own('bottle green velvet', new THREE.MeshPhysicalMaterial({
    ...maps('velour_velvet', 0.28423, 0.2735), color: '#2b4939', roughness: 1, metalness: 0,
    normalScale: new THREE.Vector2(0.12, 0.12), sheen: 0.3, sheenRoughness: 0.82, sheenColor: '#4a6f59',
  }));
  dyeVelvet(velvet);
  const linen = own('cotton bed linen', new THREE.MeshPhysicalMaterial({
    ...maps('cotton_jersey', 0.2636, 0.2638), color: '#e3d3b2', roughness: 1, metalness: 0,
    normalScale: new THREE.Vector2(0.16, 0.16), sheen: 0.24, sheenRoughness: 0.92, sheenColor: '#eee1c6',
  }));
  const plaster = own('warm lime plaster', new THREE.MeshStandardMaterial({
    ...maps('white_plaster_02', 1), color: '#c8c6b9', roughness: 0.98, metalness: 0,
    normalScale: new THREE.Vector2(0.1, 0.1),
  }));
  // A limewash softens the scan's broad stains while retaining its fine relief.
  plaster.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 roomPlasterSample = texture2D(map, vMapUv);
        diffuseColor *= vec4(mix(vec3(0.72), roomPlasterSample.rgb, 0.28), roomPlasterSample.a);
      #endif
    `);
  };
  const brass = own('aged brushed brass', new THREE.MeshStandardMaterial({ color: '#af8c4e', metalness: 0.95, roughness: 0.36 }));
  brass.envMapIntensity = 0.85;
  const ceramic = own('ivory porcelain glaze', new THREE.MeshPhysicalMaterial({
    color: '#e1dfd2', metalness: 0, roughness: 0.22, clearcoat: 0.35, clearcoatRoughness: 0.16,
  }));
  const ready = Promise.all(pending).then(() => undefined);

  return {
    walnut, darkWood, wood: walnut, woodDark: darkWood, oak, parquet, leather, velvet, linen, plaster, brass, ceramic,
    ready,
    dispose() {
      if (disposed) return;
      disposed = true;
      materials.forEach(material => material.dispose());
      textures.forEach(map => map.dispose());
    },
  };
}

export type RoomMaterials = ReturnType<typeof createRoomMaterials>;
