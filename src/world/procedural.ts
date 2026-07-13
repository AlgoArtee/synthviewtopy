import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { BiomeDefinition, DistrictDefinition } from '../data/districts';
import { ISLAND_SURFACE_Y } from '../config/island';
import { EDITOR_ASSET_CATALOG, createEditorAsset } from './editorAssets';

const DEG = Math.PI / 180;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function standardMaterial(color: THREE.ColorRepresentation, overrides: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.34,
    metalness: 0.38,
    ...overrides,
  });
}

function physicalMaterial(color: THREE.ColorRepresentation, overrides: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.24,
    metalness: 0.48,
    clearcoat: 0.48,
    clearcoatRoughness: 0.24,
    ...overrides,
  });
}

function markAccent(material: THREE.Material) {
  material.userData.isDistrictAccent = true;
  return material;
}

function prepareMesh(mesh: THREE.Mesh, id: string, shadows = true) {
  mesh.userData.selectableId = id;
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
}

function roundedBlock(
  id: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  radius = 0.18,
  walkCollider = true,
) {
  const geometry = new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, width * 0.15, depth * 0.15));
  const mesh = prepareMesh(new THREE.Mesh(geometry, material), id);
  mesh.position.set(x, y + height * 0.5, z);
  if (walkCollider) mesh.userData.navObstacle = true;
  return mesh;
}

function addAccessRamp(
  group: THREE.Group,
  id: string,
  plotWidth: number,
  plotDepth: number,
  rise: number,
  length: number,
  material: THREE.Material,
  innerEdgeZ: number,
) {
  const rampWidth = Math.min(2.2, plotWidth * 0.34);
  const thickness = 0.1;
  const ramp = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(rampWidth, thickness, length), material), id);
  ramp.name = `${id}__ACCESS_RAMP`;
  ramp.rotation.x = Math.atan2(rise, length);
  ramp.position.set(0, rise * 0.5 + thickness * 0.42, innerEdgeZ + length * 0.5);
  ramp.userData.walkable = true;
  group.add(ramp);
}

function addNavigationAccessVolume(
  group: THREE.Group,
  id: string,
  width: number,
  height: number,
  depth: number,
  y: number,
  z: number,
  kind: 'district' | 'dome',
) {
  const volume = prepareMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }),
    ),
    id,
    false,
  );
  volume.name = `${id}__${kind.toUpperCase()}_ACCESS_VOLUME`;
  volume.position.set(0, y, z);
  // Kept only for Walk collision routing; never render or include this helper in GLB exports.
  volume.visible = false;
  volume.userData.navAccess = true;
  volume.userData.accessKind = kind;
  group.add(volume);
}

function addDistrictWalkPortal(group: THREE.Group, id: string, width: number, depth: number, accent: string) {
  const portalWidth = THREE.MathUtils.clamp(width * 0.28, 0.48, 1.15);
  const floorY = 0.365;
  const exteriorZ = depth * 0.5 + 0.08;
  const foyerZ = -Math.min(depth * 0.17, 0.9);
  const corridorDepth = exteriorZ - foyerZ;
  const corridorCenter = (exteriorZ + foyerZ) * 0.5;
  const floorMaterial = physicalMaterial('#1c2a2f', { roughness: 0.36, metalness: 0.62, clearcoat: 0.4 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.34,
    transparent: true,
    opacity: 0.42,
    transmission: 0.22,
    roughness: 0.16,
    metalness: 0.18,
  });
  const frameMaterial = standardMaterial('#cad9d5', { roughness: 0.28, metalness: 0.76 });

  const floor = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth, 0.05, corridorDepth), floorMaterial), id);
  floor.name = `${id}__WALK_FOYER_FLOOR`;
  floor.position.set(0, floorY, corridorCenter);
  floor.userData.walkable = true;
  group.add(floor);

  const doorZ = depth * 0.5 + 0.018;
  const doorHeight = 0.52;
  const door = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth * 0.82, doorHeight, 0.035), glassMaterial), id, false);
  door.name = `${id}__WALK_ENTRY_DOOR`;
  door.position.set(0, floorY + doorHeight * 0.5, doorZ);
  group.add(door);

  for (const x of [-portalWidth * 0.5, portalWidth * 0.5]) {
    const jamb = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.055, doorHeight + 0.08, 0.08), frameMaterial), id, false);
    jamb.position.set(x, floorY + (doorHeight + 0.08) * 0.5, doorZ);
    group.add(jamb);
  }
  const lintel = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth + 0.11, 0.055, 0.08), frameMaterial), id, false);
  lintel.position.set(0, floorY + doorHeight + 0.055, doorZ);
  group.add(lintel);

  const threshold = prepareMesh(
    new THREE.Mesh(new THREE.BoxGeometry(portalWidth * 0.72, 0.018, 0.045), markAccent(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.1 }))),
    id,
    false,
  );
  threshold.position.set(0, floorY + 0.036, doorZ + 0.035);
  group.add(threshold);
  addNavigationAccessVolume(group, id, portalWidth * 1.3, 1.35, corridorDepth + 0.16, floorY + 0.68, corridorCenter, 'district');
}

function addDomeWalkPortal(group: THREE.Group, id: string, width: number, depth: number, accent: string) {
  const portalWidth = THREE.MathUtils.clamp(width * 0.13, 0.46, 0.92);
  const floorY = 0.815;
  const exteriorZ = depth * 0.47 + 0.75;
  const interiorZ = depth * 0.14;
  const corridorDepth = exteriorZ - interiorZ;
  const corridorCenter = (exteriorZ + interiorZ) * 0.5;
  const floorMaterial = physicalMaterial('#203035', { roughness: 0.32, metalness: 0.58, clearcoat: 0.42 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.46,
    transmission: 0.3,
    roughness: 0.1,
    metalness: 0.16,
  });
  const frameMaterial = standardMaterial('#d5e4e1', { roughness: 0.24, metalness: 0.74 });

  const floor = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth, 0.05, corridorDepth), floorMaterial), id);
  floor.name = `${id}__AIRLOCK_FLOOR`;
  floor.position.set(0, floorY, corridorCenter);
  floor.userData.walkable = true;
  group.add(floor);

  const doorZ = depth * 0.47 + 0.615;
  const doorHeight = 0.5;
  const door = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth * 0.8, doorHeight, 0.035), glassMaterial), id, false);
  door.name = `${id}__AIRLOCK_ENTRY_DOOR`;
  door.position.set(0, floorY + doorHeight * 0.5, doorZ);
  group.add(door);
  for (const x of [-portalWidth * 0.5, portalWidth * 0.5]) {
    const jamb = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.05, doorHeight + 0.08, 0.08), frameMaterial), id, false);
    jamb.position.set(x, floorY + (doorHeight + 0.08) * 0.5, doorZ);
    group.add(jamb);
  }
  const lintel = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth + 0.1, 0.05, 0.08), frameMaterial), id, false);
  lintel.position.set(0, floorY + doorHeight + 0.05, doorZ);
  group.add(lintel);
  addNavigationAccessVolume(group, id, portalWidth * 1.3, 1.3, corridorDepth + 0.14, floorY + 0.66, corridorCenter, 'dome');
}

function addFacadeBands(
  group: THREE.Group,
  id: string,
  width: number,
  height: number,
  depth: number,
  x: number,
  z: number,
  accent: string,
  floors = 3,
) {
  const bandMaterial = markAccent(
    new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 2.2,
      roughness: 0.22,
      metalness: 0.18,
    }),
  );
  const floorCount = Math.max(1, Math.min(floors, Math.floor(height / 0.65)));
  for (let floor = 0; floor < floorCount; floor += 1) {
    const y = 0.5 + ((floor + 1) / (floorCount + 1)) * height;
    const frontBand = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.055, 0.035), bandMaterial), id, false);
    frontBand.position.set(x, y, z + depth * 0.502);
    group.add(frontBand);
    if (floor % 2 === 0) {
      const sideBand = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.055, depth * 0.72), bandMaterial), id, false);
      sideBand.position.set(x + width * 0.502, y, z);
      group.add(sideBand);
    }
  }
}

function addRoofPlant(
  group: THREE.Group,
  id: string,
  x: number,
  y: number,
  z: number,
  scale: number,
  metal: THREE.Material,
  accent: THREE.Material,
) {
  const unit = roundedBlock(id, scale * 0.7, scale * 0.22, scale * 0.45, metal, x, y, z, 0.06);
  group.add(unit);
  for (const offset of [-0.22, 0.22]) {
    const vent = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.07, scale * 0.09, scale * 0.28, 10), accent), id);
    vent.position.set(x + offset * scale, y + scale * 0.28, z);
    group.add(vent);
  }
}

function addTree(group: THREE.Group, id: string, x: number, z: number, scale: number, leafColor: string, autumn = false) {
  const trunk = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.045 * scale, 0.07 * scale, 0.55 * scale, 7), standardMaterial('#3b3024', { roughness: 0.92 })),
    id,
  );
  trunk.position.set(x, 0.56 + 0.275 * scale, z);
  const crownColor = autumn ? (Math.sin(x * 12.9898 + z * 78.233) > 0 ? '#a84f2e' : '#d58a3a') : leafColor;
  const crown = prepareMesh(
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 * scale, 1), standardMaterial(crownColor, { roughness: 0.86 })),
    id,
  );
  crown.scale.set(1, 1.25, 1);
  crown.position.set(x, 0.93 + 0.48 * scale, z);
  group.add(trunk, crown);
}

function addLamp(group: THREE.Group, id: string, x: number, z: number, accentMaterial: THREE.Material) {
  const post = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.75, 6), standardMaterial('#253238', { metalness: 0.7 })),
    id,
  );
  post.position.set(x, 0.83, z);
  const light = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), accentMaterial), id, false);
  light.position.set(x, 1.22, z);
  group.add(post, light);
}

function createNeonSignTexture(title: string, subtitle: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 320;
  const context = canvas.getContext('2d')!;
  const glow = new THREE.Color(accent);
  context.fillStyle = '#070b10';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = accent;
  context.lineWidth = 10;
  context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  context.shadowColor = accent;
  context.shadowBlur = 32;
  context.fillStyle = `#${glow.clone().lerp(new THREE.Color('#ffffff'), 0.48).getHexString()}`;
  context.font = '800 78px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(title, canvas.width / 2, 128);
  context.shadowBlur = 18;
  context.fillStyle = accent;
  context.font = '600 34px Arial, sans-serif';
  context.fillText(subtitle, canvas.width / 2, 232);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addCyberpunkDistrictLife(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const featured: Record<string, readonly [title: string, subtitle: string, secondary: string]> = {
    'scientist-residential': ['NIGHT MARKET', 'HOMES · CLINIC · FOOD', '#ffba66'],
    'even-hour-hotel': ['EVER HOUR', 'HOTEL · SKY LOUNGE', '#ff4ecb'],
    'luxury-entertainment': ['NOCTURNE', 'ARCADE · CLUB · THEATRE', '#ff4ecb'],
    'financial-funding': ['Q-EXCHANGE', 'CAPITAL · GRANTS · VENTURES', '#56dfff'],
    'entry-commercial': ['ARRIVAL 01', 'CUSTOMS · RETAIL · TRANSIT', '#ff5acd'],
    marketing: ['SYNTH MEDIA', 'HOLOCAST · DESIGN', '#ff6fb5'],
  };
  const content = featured[definition.id];
  if (!content) return;
  const [width, depth] = definition.footprint;
  const [title, subtitle, secondary] = content;
  const texture = createNeonSignTexture(title, subtitle, definition.accent);
  const signMaterial = markAccent(new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: definition.accent,
    emissiveIntensity: 1.8,
    map: texture,
    emissiveMap: texture,
    roughness: 0.2,
    metalness: 0.28,
  }));
  const sign = prepareMesh(new THREE.Mesh(new THREE.PlaneGeometry(Math.min(width * 0.62, 6.4), 2.15), signMaterial), definition.id, false);
  sign.name = `${definition.id}__NEON_SIGN`;
  sign.position.set(0, Math.min(height * 0.7 + 1.1, 5.3), depth * 0.505);
  group.add(sign);

  const secondaryMaterial = markAccent(new THREE.MeshStandardMaterial({
    color: secondary,
    emissive: secondary,
    emissiveIntensity: 3.4,
    roughness: 0.18,
    metalness: 0.24,
  }));
  for (let index = 0; index < 4; index += 1) {
    const kiosk = roundedBlock(
      definition.id,
      width * 0.14,
      0.75 + (index % 2) * 0.18,
      depth * 0.16,
      physicalMaterial(index % 2 ? '#111a22' : '#202832', { clearcoat: 0.72, roughness: 0.2 }),
      (-1.5 + index) * width * 0.19,
      0.38,
      depth * 0.4,
      0.12,
    );
    kiosk.name = `${definition.id}__STREET_SHOP_${index + 1}`;
    const awning = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.13, 0.06, 0.25), secondaryMaterial), definition.id, false);
    awning.position.set(kiosk.position.x, 1.05 + (index % 2) * 0.18, depth * 0.5);
    group.add(kiosk, awning);
  }
  for (const [x, z] of [[-0.46, -0.44], [0.46, -0.44], [-0.46, 0.44], [0.46, 0.44]] as const) {
    addLamp(group, definition.id, x * width, z * depth, secondaryMaterial);
  }
  const districtGlow = new THREE.PointLight(definition.accent, 3.8, Math.max(width, depth) * 1.7, 2.1);
  districtGlow.name = `${definition.name} neon ambience`;
  districtGlow.position.set(0, 4.2, depth * 0.22);
  group.add(districtGlow);
}

function createMaterials(definition: DistrictDefinition) {
  const [base, secondary, trim, glow] = definition.palette;
  let body = physicalMaterial(secondary);
  let dark = physicalMaterial(base, { roughness: 0.38, metalness: 0.52 });

  if (definition.id === 'dark-center-lab-megabuilding') {
    body = physicalMaterial('#090a0f', { roughness: 0.16, metalness: 0.65, clearcoat: 0.65, clearcoatRoughness: 0.12 });
    dark = physicalMaterial('#030406', { roughness: 0.12, metalness: 0.75, clearcoat: 0.8, clearcoatRoughness: 0.08 });
  }

  const metal = standardMaterial(trim, { roughness: 0.35, metalness: 0.68 });
  const glass = physicalMaterial(glow, {
    roughness: 0.1,
    metalness: 0.08,
    transparent: true,
    opacity: 0.64,
    transmission: 0.18,
    thickness: 0.35,
    emissive: new THREE.Color(glow),
    emissiveIntensity: 0.22,
  });
  const accent = markAccent(
    new THREE.MeshStandardMaterial({
      color: definition.accent,
      emissive: definition.accent,
      emissiveIntensity: 2.4,
      roughness: 0.18,
      metalness: 0.22,
    }),
  );
  return { body, dark, metal, glass, accent };
}

function buildCore(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);

  if (id === 'dark-center-lab-megabuilding') {
    const podium = roundedBlock(id, width * 0.88, 1.1, depth * 0.9, materials.dark, 0, 0.32, 0, 0.36);
    group.add(podium);
    const layers = [
      { w: 0.62, d: 0.58, h: height * 0.7, x: -width * 0.12, z: 0.05 },
      { w: 0.42, d: 0.45, h: height, x: width * 0.12, z: -0.16 },
      { w: 0.24, d: 0.3, h: height * 1.24, x: width * 0.03, z: -0.03 },
    ];
    layers.forEach((layer, index) => {
      const block = roundedBlock(
        id,
        width * layer.w,
        layer.h,
        depth * layer.d,
        index === 1 ? materials.body : materials.dark,
        layer.x,
        0.75,
        layer.z,
        0.24,
      );
      block.rotation.y = (index - 1) * 4 * DEG;
      group.add(block);
      addFacadeBands(group, id, width * layer.w, layer.h, depth * layer.d, layer.x, layer.z, accent, 6 + index);
    });
    const spine = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, height * 1.45, 10), materials.accent), id);
    spine.position.set(0, 0.9 + (height * 1.45) / 2, depth * 0.3);
    group.add(spine);
    for (const level of [0.45, 0.72, 1.03]) {
      const ring = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(width * 0.29, 0.045, 6, 48), materials.accent), id, false);
      ring.rotation.x = Math.PI / 2;
      ring.scale.z = 0.62;
      ring.position.y = 0.85 + height * level;
      group.add(ring);
    }
  } else if (id === 'synthetic-quantum-biosystems') {
    const base = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.44, width * 0.5, 0.9, 48), materials.dark), id);
    base.scale.z = depth / width;
    base.position.y = 0.78;
    group.add(base);
    for (let index = 0; index < 3; index += 1) {
      const orbit = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(width * (0.25 + index * 0.085), 0.05, 7, 64), materials.accent), id, false);
      orbit.position.y = 1.9 + index * 0.55;
      orbit.rotation.set(Math.PI / 2 + index * 0.34, index * 0.42, index * 0.25);
      orbit.scale.z = 0.7;
      group.add(orbit);
    }
    const chamber = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16), materials.glass), id);
    chamber.position.y = 2.5;
    group.add(chamber);
    const core = prepareMesh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), materials.accent), id, false);
    core.position.y = 2.5;
    core.userData.animate = 'quantum-core';
    group.add(core);
  } else {
    const left = roundedBlock(id, width * 0.42, height * 0.72, depth * 0.72, materials.body, -width * 0.24, 0.4, 0, 0.24);
    const right = roundedBlock(id, width * 0.42, height * 0.9, depth * 0.72, materials.dark, width * 0.24, 0.4, 0, 0.24);
    const bridge = roundedBlock(id, width * 0.25, 0.55, depth * 0.32, materials.glass, 0, height * 0.52, 0, 0.12);
    group.add(left, right, bridge);
    addFacadeBands(group, id, width * 0.42, height * 0.72, depth * 0.72, -width * 0.24, 0, accent, 4);
    addFacadeBands(group, id, width * 0.42, height * 0.9, depth * 0.72, width * 0.24, 0, accent, 5);
  }
}

function buildBioscience(group: THREE.Group, definition: DistrictDefinition, height: number, random: () => number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  const blocks = [
    { x: -width * 0.23, z: -depth * 0.16, w: width * 0.42, d: depth * 0.46, h: height * (0.72 + random() * 0.14) },
    { x: width * 0.23, z: depth * 0.14, w: width * 0.38, d: depth * 0.5, h: height * (0.65 + random() * 0.2) },
    { x: width * 0.2, z: -depth * 0.29, w: width * 0.28, d: depth * 0.25, h: height * 0.48 },
  ];
  blocks.forEach((item, index) => {
    group.add(roundedBlock(id, item.w, item.h, item.d, index === 2 ? materials.glass : materials.body, item.x, 0.42, item.z));
    addFacadeBands(group, id, item.w, item.h, item.d, item.x, item.z, accent, index === 2 ? 2 : 4);
    if (index < 2) addRoofPlant(group, id, item.x, 0.42 + item.h, item.z, Math.min(item.w, item.d) * 0.6, materials.metal, materials.accent);
  });
  const connector = roundedBlock(id, width * 0.34, 0.48, depth * 0.16, materials.glass, 0, height * 0.48, 0, 0.08);
  group.add(connector);
  for (const x of [-width * 0.4, width * 0.4]) addTree(group, id, x, depth * 0.34, 0.8, '#315f46');
}

function buildEngineering(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  const hangarHeight = height * 0.58;
  const hangar = roundedBlock(id, width * 0.64, hangarHeight, depth * 0.62, materials.dark, -width * 0.08, 0.4, 0.05, 0.16);
  const cleanroom = roundedBlock(id, width * 0.28, height * 0.92, depth * 0.5, materials.body, width * 0.34, 0.4, -depth * 0.1, 0.13);
  group.add(hangar, cleanroom);
  addFacadeBands(group, id, width * 0.64, hangarHeight, depth * 0.62, -width * 0.08, 0.05, accent, 3);
  addFacadeBands(group, id, width * 0.28, height * 0.92, depth * 0.5, width * 0.34, -depth * 0.1, accent, 4);
  const gantryMaterial = materials.metal;
  for (const x of [-width * 0.31, width * 0.06]) {
    const leg = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, height * 0.95, 0.12), gantryMaterial), id);
    leg.position.set(x, 0.4 + height * 0.475, depth * 0.38);
    group.add(leg);
  }
  const gantry = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.39, 0.12, 0.12), gantryMaterial), id);
  gantry.position.set(-width * 0.125, 0.4 + height * 0.92, depth * 0.38);
  group.add(gantry);
  const craneGlow = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.11, 0.05, 0.05), materials.accent), id, false);
  craneGlow.position.set(-width * 0.08, 0.4 + height * 0.92, depth * 0.4);
  group.add(craneGlow);
}

function buildChemistry(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  const block = roundedBlock(id, width * 0.58, height * 0.72, depth * 0.64, materials.body, -width * 0.13, 0.4, 0, 0.16);
  group.add(block);
  addFacadeBands(group, id, width * 0.58, height * 0.72, depth * 0.64, -width * 0.13, 0, accent, 4);
  for (let index = 0; index < 3; index += 1) {
    const tankHeight = height * (0.45 + index * 0.08);
    const tank = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, tankHeight, 18), index === 1 ? materials.glass : materials.metal), id);
    tank.position.set(width * (0.22 + index * 0.12), 0.4 + tankHeight * 0.5, depth * (0.22 - index * 0.2));
    group.add(tank);
    const cap = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.49, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), materials.accent), id, false);
    cap.position.set(tank.position.x, 0.4 + tankHeight, tank.position.z);
    group.add(cap);
  }
  const pipe = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(width * 0.22, 0.055, 6, 32, Math.PI), materials.accent), id, false);
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(width * 0.22, height * 0.46, 0);
  group.add(pipe);
}

function buildPhysics(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  const hall = roundedBlock(id, width * 0.58, height * 0.62, depth * 0.56, materials.dark, -width * 0.16, 0.4, 0.05, 0.18);
  group.add(hall);
  addFacadeBands(group, id, width * 0.58, height * 0.62, depth * 0.56, -width * 0.16, 0.05, accent, 3);
  const observatoryBase = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.15, width * 0.18, height * 0.35, 24), materials.body), id);
  observatoryBase.position.set(width * 0.29, 0.4 + height * 0.175, -depth * 0.12);
  const dome = prepareMesh(
    new THREE.Mesh(new THREE.SphereGeometry(width * 0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), materials.metal),
    id,
  );
  dome.position.set(width * 0.29, 0.4 + height * 0.35, -depth * 0.12);
  group.add(observatoryBase, dome);
  const ring = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(width * 0.28, 0.08, 8, 56), materials.accent), id, false);
  ring.rotation.x = Math.PI / 2;
  ring.scale.z = 0.62;
  ring.position.set(width * 0.16, 0.56, depth * 0.25);
  group.add(ring);
}

function buildSecurity(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  const bunker = roundedBlock(id, width * 0.68, height * 0.48, depth * 0.68, materials.dark, -width * 0.08, 0.4, 0, 0.12);
  const tower = roundedBlock(id, width * 0.22, height, depth * 0.32, materials.body, width * 0.32, 0.4, -depth * 0.16, 0.12);
  group.add(bunker, tower);
  addFacadeBands(group, id, width * 0.68, height * 0.48, depth * 0.68, -width * 0.08, 0, accent, 2);
  addFacadeBands(group, id, width * 0.22, height, depth * 0.32, width * 0.32, -depth * 0.16, accent, 5);
  for (const z of [-depth * 0.34, depth * 0.34]) {
    const bollard = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.62, 0.08, 0.09), materials.accent), id, false);
    bollard.position.set(-width * 0.05, 0.72, z);
    group.add(bollard);
  }
  const pad = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.13, width * 0.13, 0.08, 24), materials.metal), id);
  pad.position.set(width * 0.29, 0.53, depth * 0.27);
  group.add(pad);
}

function buildCivic(group: THREE.Group, definition: DistrictDefinition, height: number, random: () => number) {
  const { id, footprint, accent, category } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  const count = category === 'commercial' ? 4 : 3;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + 0.4;
    const w = width * (0.22 + random() * 0.08);
    const d = depth * (0.27 + random() * 0.1);
    const h = height * (0.48 + random() * 0.48);
    const x = Math.cos(angle) * width * 0.23;
    const z = Math.sin(angle) * depth * 0.23;
    const block = roundedBlock(id, w, h, d, index % 2 ? materials.dark : materials.body, x, 0.4, z, 0.2);
    block.rotation.y = -angle * 0.2;
    group.add(block);
    addFacadeBands(group, id, w, h, d, x, z, accent, 3 + Math.floor(random() * 3));
  }
  const pavilion = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.12, width * 0.15, 0.85, 24), materials.glass), id);
  pavilion.position.set(0, 0.83, 0);
  group.add(pavilion);
  for (const [x, z] of [[-0.42, -0.38], [0.43, 0.39], [-0.45, 0.36]] as const) {
    addTree(group, id, x * width, z * depth, 0.8, '#3c6548', definition.id.includes('hotel'));
  }
}

function buildInfrastructure(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  for (let index = 0; index < 3; index += 1) {
    const warehouse = roundedBlock(
      id,
      width * 0.3,
      height * (0.42 + index * 0.08),
      depth * 0.62,
      index === 1 ? materials.body : materials.dark,
      (index - 1) * width * 0.31,
      0.4,
      0,
      0.1,
    );
    group.add(warehouse);
    addFacadeBands(group, id, width * 0.3, height * (0.42 + index * 0.08), depth * 0.62, (index - 1) * width * 0.31, 0, accent, 2);
  }
  for (const x of [-width * 0.25, width * 0.25]) {
    const stack = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, height * 0.92, 12), materials.metal), id);
    stack.position.set(x, 0.4 + height * 0.46, -depth * 0.34);
    const cap = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12), materials.accent), id, false);
    cap.position.set(x, 0.43 + height * 0.92, -depth * 0.34);
    group.add(stack, cap);
  }
}

function buildAcademic(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint, accent } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  for (let index = 0; index < 4; index += 1) {
    const slab = roundedBlock(
      id,
      width * (0.52 - index * 0.045),
      height * 0.18,
      depth * 0.44,
      index % 2 ? materials.body : materials.dark,
      -width * 0.12 + index * width * 0.045,
      0.4 + index * height * 0.18,
      0,
      0.12,
    );
    slab.rotation.y = (index - 1.5) * 3 * DEG;
    group.add(slab);
  }
  const rotunda = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.17, width * 0.2, height * 0.75, 32), materials.glass), id);
  rotunda.position.set(width * 0.27, 0.4 + height * 0.375, -depth * 0.12);
  group.add(rotunda);
  const crown = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(width * 0.16, 0.06, 8, 42), materials.accent), id, false);
  crown.rotation.x = Math.PI / 2;
  crown.position.set(width * 0.27, 0.45 + height * 0.75, -depth * 0.12);
  group.add(crown);
  addFacadeBands(group, id, width * 0.46, height * 0.68, depth * 0.44, -width * 0.04, 0, accent, 5);
}

function buildEnvironmental(group: THREE.Group, definition: DistrictDefinition, height: number) {
  const { id, footprint } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);
  for (const x of [-width * 0.2, width * 0.18]) {
    const greenhouse = roundedBlock(id, width * 0.32, height * 0.5, depth * 0.55, materials.glass, x, 0.35, 0, 0.28);
    group.add(greenhouse);
  }
  for (let index = 0; index < 4; index += 1) {
    addTree(group, id, -width * 0.43 + index * width * 0.28, depth * (index % 2 ? 0.34 : -0.34), 0.95, '#347447');
  }
  for (const x of [-width * 0.38, width * 0.39]) {
    const mast = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, height * 0.78, 8), materials.metal), id);
    mast.position.set(x, 0.4 + height * 0.39, -depth * 0.18);
    const rotor = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 5, 24), materials.accent), id, false);
    rotor.position.set(x, 0.4 + height * 0.78, -depth * 0.2);
    rotor.rotation.y = Math.PI / 2;
    group.add(mast, rotor);
  }
}

function signatureBeam(id: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const beam = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 7), material), id);
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return beam;
}

function addDistrictSignature(group: THREE.Group, definition: DistrictDefinition, height: number, random: () => number) {
  const { id, footprint } = definition;
  const [width, depth] = footprint;
  const materials = createMaterials(definition);

  if (id === 'toxicology-labs') {
    for (let index = 0; index < 3; index += 1) {
      const scrubber = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 1.15 + index * 0.18, 10), materials.metal), id);
      scrubber.position.set(width * (0.18 + index * 0.11), 1.05, -depth * 0.34);
      const cap = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 5, 16), materials.accent), id, false);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(scrubber.position.x, 1.64 + index * 0.09, scrubber.position.z);
      group.add(scrubber, cap);
    }
  } else if (id === 'pharmacology-labs') {
    for (const x of [-0.23, 0.23]) {
      const greenhouse = roundedBlock(id, width * 0.24, 0.72, depth * 0.28, materials.glass, x * width, height * 0.66, depth * 0.18, 0.24);
      group.add(greenhouse);
    }
  } else if (id === 'microbiology-labs') {
    for (let index = 0; index < 4; index += 1) {
      const vessel = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), index % 2 ? materials.glass : materials.metal), id);
      vessel.scale.y = 1.35;
      vessel.position.set(-width * 0.26 + index * width * 0.17, 1.05, depth * 0.34);
      group.add(vessel);
    }
  } else if (id === 'genomics-labs') {
    for (let index = 0; index < 15; index += 1) {
      const angle = index * 0.72;
      for (const side of [-1, 1]) {
        const marker = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), side > 0 ? materials.accent : materials.glass), id, false);
        marker.position.set(width * 0.34 + Math.cos(angle) * 0.28 * side, 0.72 + index * 0.105, -depth * 0.28 + Math.sin(angle) * 0.28 * side);
        group.add(marker);
      }
    }
  } else if (id === 'proteomics-labs') {
    for (let index = 0; index < 4; index += 1) {
      const pylon = roundedBlock(id, 0.22, 1.2 + index * 0.14, 0.22, index % 2 ? materials.accent : materials.metal, width * (0.2 + index * 0.09), 0.45, depth * 0.3, 0.05);
      group.add(pylon);
    }
  } else if (id === 'omics-labs' || id === 'computational-biology-labs') {
    for (let index = 0; index < 7; index += 1) {
      const blade = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75 + index * 0.06, depth * 0.32), index % 2 ? materials.accent : materials.metal), id, false);
      blade.position.set(-width * 0.36 + index * width * 0.12, 1.0, depth * 0.29);
      group.add(blade);
    }
  } else if (id === 'medical-labs') {
    const horizontal = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.26), materials.accent), id, false);
    const vertical = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 1.05), materials.accent), id, false);
    horizontal.position.set(width * 0.3, height * 0.94, depth * 0.25);
    vertical.position.copy(horizontal.position);
    group.add(horizontal, vertical);
  } else if (id === 'molecular-biology-labs') {
    for (let index = 0; index < 3; index += 1) {
      const orbit = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(0.45 + index * 0.11, 0.025, 5, 28), materials.accent), id, false);
      orbit.position.set(width * 0.27, 1.55, depth * 0.28);
      orbit.rotation.set(Math.PI / 2 + index * 0.55, index * 0.7, 0);
      group.add(orbit);
    }
  } else if (id === 'robotics-labs') {
    const base = new THREE.Vector3(width * 0.28, 0.62, depth * 0.3);
    const elbow = new THREE.Vector3(width * 0.34, 1.55, depth * 0.2);
    const wrist = new THREE.Vector3(width * 0.16, 2.05, depth * 0.05);
    group.add(signatureBeam(id, base, elbow, 0.11, materials.metal), signatureBeam(id, elbow, wrist, 0.09, materials.accent));
    for (const joint of [base, elbow, wrist]) {
      const sphere = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), materials.dark), id);
      sphere.position.copy(joint);
      group.add(sphere);
    }
  } else if (id === 'scientific-art-labs') {
    const sculpture = prepareMesh(new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.12, 64, 10, 2, 3), materials.accent), id, false);
    sculpture.position.set(width * 0.28, 1.45, depth * 0.25);
    sculpture.scale.y = 1.35;
    group.add(sculpture);
  } else if (id === 'marketing' || id === 'entry-commercial') {
    const screen = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.36, height * 0.34, 0.08), materials.accent), id, false);
    screen.position.set(0, 1.2 + height * 0.23, depth * 0.48);
    group.add(screen);
  } else if (id === 'even-hour-hotel' || id === 'luxury-entertainment') {
    const pool = prepareMesh(new THREE.Mesh(new THREE.CircleGeometry(width * 0.16, 24), materials.glass), id, false);
    pool.rotation.x = -Math.PI / 2;
    pool.scale.y = 0.55;
    pool.position.set(width * 0.28, 0.53, depth * 0.26);
    group.add(pool);
  } else if (id === 'secret-labs') {
    const hatch = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.13, width * 0.13, 0.12, 24), materials.accent), id, false);
    hatch.position.set(width * 0.26, 0.57, depth * 0.24);
    group.add(hatch);
  } else if (id === 'bioanalytics-lab' || id === 'forensic-cyberforensic-lab') {
    const mast = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.8, 7), materials.metal), id);
    mast.position.set(width * 0.34, 1.35, -depth * 0.28);
    const dish = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), materials.accent), id, false);
    dish.rotation.z = Math.PI / 2;
    dish.position.set(width * 0.34, 2.25, -depth * 0.28);
    group.add(mast, dish);
  } else if (id === 'logistics' || id === 'industrial-labs') {
    for (let index = 0; index < 5; index += 1) {
      const container = roundedBlock(id, width * 0.12, 0.42, depth * 0.24, index % 2 ? materials.accent : materials.metal, -width * 0.38 + index * width * 0.16, 0.42, depth * 0.37, 0.04);
      group.add(container);
    }
  } else if (id === 'financial-funding') {
    const crown = prepareMesh(new THREE.Mesh(new THREE.OctahedronGeometry(0.38), materials.accent), id, false);
    crown.position.set(0, height + 1.1, 0);
    crown.rotation.y = random() * Math.PI;
    group.add(crown);
  }
}

export interface ProceduralModel {
  group: THREE.Group;
  labelHeight: number;
}

export function createDistrictModel(definition: DistrictDefinition): ProceduralModel {
  const random = seededRandom(hashString(definition.id));
  const group = new THREE.Group();
  group.name = `DISTRICT__${definition.id}`;
  group.position.set(definition.position[0], definition.position[1] + ISLAND_SURFACE_Y, definition.position[2]);
  group.userData = {
    selectableId: definition.id,
    type: 'district',
    category: definition.category,
    ring: definition.ring,
    archetype: definition.archetype,
    sourceLabel: definition.sourceLabel ?? definition.name,
    description: definition.description,
  };

  const [width, depth] = definition.footprint;
  const plotMaterial = physicalMaterial(definition.palette[0], { roughness: 0.64, metalness: 0.18 });
  const plot = roundedBlock(definition.id, width, 0.34, depth, plotMaterial, 0, 0, 0, 0.34, false);
  plot.name = `${definition.id}__PLOT`;
  plot.receiveShadow = true;
  plot.userData.walkable = true;
  group.add(plot);
  addAccessRamp(group, definition.id, width, depth, 0.34, 1.7, plotMaterial, depth * 0.5 - 0.04);

  const inset = new THREE.LineSegments(
    new THREE.EdgesGeometry(new RoundedBoxGeometry(width * 0.95, 0.355, depth * 0.95, 2, 0.26)),
    new THREE.LineBasicMaterial({ color: definition.accent, transparent: true, opacity: 0.35 }),
  );
  inset.position.y = 0.02;
  inset.userData.selectableId = definition.id;
  group.add(inset);

  const height = definition.id === 'dark-center-lab-megabuilding'
    ? 30
    : THREE.MathUtils.clamp(definition.height * 0.25, 2.4, definition.category === 'core' ? 10.5 : 5.8);
  switch (definition.category) {
    case 'core':
      buildCore(group, definition, height);
      break;
    case 'bioscience':
      buildBioscience(group, definition, height, random);
      break;
    case 'engineering':
      buildEngineering(group, definition, height);
      break;
    case 'chemistry':
      buildChemistry(group, definition, height);
      break;
    case 'physics':
      buildPhysics(group, definition, height);
      break;
    case 'security':
      buildSecurity(group, definition, height);
      break;
    case 'civic':
    case 'commercial':
      buildCivic(group, definition, height, random);
      break;
    case 'infrastructure':
      buildInfrastructure(group, definition, height);
      break;
    case 'academic':
      buildAcademic(group, definition, height);
      break;
    case 'environmental':
      buildEnvironmental(group, definition, height);
      break;
  }

  addDistrictWalkPortal(group, definition.id, width, depth, definition.accent);
  addDistrictSignature(group, definition, height, random);
  addCyberpunkDistrictLife(group, definition, height);

  const lampAccent = markAccent(
    new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 3 }),
  );
  addLamp(group, definition.id, -width * 0.43, -depth * 0.41, lampAccent);
  addLamp(group, definition.id, width * 0.43, depth * 0.41, lampAccent);

  group.traverse((child) => {
    child.userData.selectableId = definition.id;
  });

  return { group, labelHeight: 2.3 + height * (definition.category === 'core' ? 1.4 : 1.02) };
}

function biomeMaterial(palette: readonly string[], index: number, overrides: THREE.MeshStandardMaterialParameters = {}) {
  return standardMaterial(palette[index % palette.length], { roughness: 0.86, metalness: 0.03, ...overrides });
}

function addConifer(group: THREE.Group, id: string, x: number, z: number, scale: number, snowy = false) {
  const trunk = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.45 * scale, 6), standardMaterial('#3d3027')), id);
  trunk.position.set(x, 0.55 + 0.22 * scale, z);
  const foliage = prepareMesh(
    new THREE.Mesh(new THREE.ConeGeometry(0.25 * scale, 0.75 * scale, 8), standardMaterial(snowy ? '#a7c1c0' : '#1f4b36', { roughness: 0.95 })),
    id,
  );
  foliage.position.set(x, 0.78 + 0.48 * scale, z);
  group.add(trunk, foliage);
}

function addCactus(group: THREE.Group, id: string, x: number, z: number, scale: number) {
  const material = standardMaterial('#3f7049', { roughness: 0.9 });
  const stem = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.11 * scale, 0.9 * scale, 8), material), id);
  stem.position.set(x, 0.55 + 0.45 * scale, z);
  group.add(stem);
  for (const direction of [-1, 1]) {
    const arm = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.045 * scale, 0.06 * scale, 0.4 * scale, 7), material), id);
    arm.position.set(x + direction * 0.13 * scale, 0.75 + 0.45 * scale, z);
    arm.rotation.z = direction * 55 * DEG;
    group.add(arm);
  }
}

function addAcacia(group: THREE.Group, id: string, x: number, z: number, scale: number) {
  const trunk = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 0.7 * scale, 7), standardMaterial('#493722')), id);
  trunk.position.set(x, 0.55 + 0.35 * scale, z);
  const crown = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 12, 7), standardMaterial('#4e6731', { roughness: 0.92 })), id);
  crown.scale.set(1.55, 0.35, 1);
  crown.position.set(x, 0.92 + 0.52 * scale, z);
  group.add(trunk, crown);
}

function buildFuturisticTropicalBiodome(
  group: THREE.Group,
  definition: BiomeDefinition,
  radius: number,
  depth: number,
  width: number,
  random: () => number,
) {
  const usableRadius = radius * 0.78;
  const floorY = 0.78;
  const metal = standardMaterial('#34464d', { roughness: 0.34, metalness: 0.82 });
  const darkMetal = standardMaterial('#17252a', { roughness: 0.28, metalness: 0.9 });
  const pathMaterial = standardMaterial('#6b4a2f', { roughness: 0.86 });
  const railMaterial = markAccent(new THREE.MeshStandardMaterial({
    color: '#a9f7d0',
    emissive: definition.accent,
    emissiveIntensity: 1.15,
    metalness: 0.62,
    roughness: 0.28,
  }));
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: '#45d8e9',
    emissive: '#087f9e',
    emissiveIntensity: 1.15,
    transparent: true,
    opacity: 0.82,
    roughness: 0.05,
    transmission: 0.42,
    thickness: 0.28,
    depthWrite: false,
  });

  const addCylinderBetween = (
    parent: THREE.Object3D,
    start: THREE.Vector3,
    end: THREE.Vector3,
    radiusValue: number,
    material: THREE.Material,
    name = '',
    selectable = true,
  ) => {
    const delta = end.clone().sub(start);
    const mesh = prepareMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(radiusValue, radiusValue, delta.length(), 7), material),
      definition.id,
      selectable,
    );
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // Align the deck's local Z axis with the route while keeping its local X axis
  // horizontal. `setFromUnitVectors` alone leaves roll under-constrained, which
  // made curved, climbing sections bank sharply and break the walkable surface.
  const orientWalkwaySegment = (mesh: THREE.Mesh, direction: THREE.Vector3) => {
    const horizontalLength = Math.hypot(direction.x, direction.z);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.set(
      -Math.atan2(direction.y, horizontalLength),
      Math.atan2(direction.x, direction.z),
      0,
      'YXZ',
    );
    mesh.userData.walkwayRollLocked = true;
  };

  // A continuous timber-and-alloy visitor route climbs from the airlock to the waterfall.
  const routeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, 0.94, 11.4),
    new THREE.Vector3(-7.2, 1.35, 9.0),
    new THREE.Vector3(-10.1, 2.1, 4.2),
    new THREE.Vector3(-10.4, 3.0, -1.8),
    new THREE.Vector3(-8.4, 3.8, -6.5),
    new THREE.Vector3(-4.1, 4.35, -8.1),
  ]);
  const routePoints = routeCurve.getPoints(38);
  const routeSamplePoints: THREE.Vector3[] = [];
  routePoints.forEach((point) => routeSamplePoints.push(point));
  const pathWidth = 1.12;

  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const start = routePoints[index];
    const end = routePoints[index + 1];
    const direction = end.clone().sub(start);
    const horizontalPerpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const plank = prepareMesh(
      new THREE.Mesh(new THREE.BoxGeometry(pathWidth, 0.11, direction.length() + 0.035), pathMaterial),
      definition.id,
    );
    plank.name = 'TROPICAL__ELEVATED_CANOPY_WALK';
    plank.position.copy(start).add(end).multiplyScalar(0.5);
    orientWalkwaySegment(plank, direction);
    plank.userData.walkable = true;
    group.add(plank);

    for (const side of [-1, 1]) {
      const offset = horizontalPerpendicular.clone().multiplyScalar(pathWidth * 0.48 * side);
      addCylinderBetween(
        group,
        start.clone().add(offset).add(new THREE.Vector3(0, 0.72, 0)),
        end.clone().add(offset).add(new THREE.Vector3(0, 0.72, 0)),
        0.027,
        railMaterial,
        'TROPICAL__CANOPY_WALK_RAIL',
        false,
      );
    }

    if (index % 4 === 0) {
      for (const side of [-1, 1]) {
        const offset = horizontalPerpendicular.clone().multiplyScalar(pathWidth * 0.48 * side);
        addCylinderBetween(
          group,
          start.clone().add(offset),
          start.clone().add(offset).add(new THREE.Vector3(0, 0.74, 0)),
          0.035,
          metal,
          'TROPICAL__CANOPY_WALK_POST',
        );
      }
      if (index > 1) {
        addCylinderBetween(
          group,
          new THREE.Vector3(start.x, floorY, start.z),
          start,
          0.075,
          metal,
          'TROPICAL__CANOPY_WALK_SUPPORT',
        );
      }
    }
  }

  // Central water axis: a high waterfall, natural stream and broad wetland pond.
  const waterfallX = 0;
  const waterfallZ = -8.25;
  const waterfallTopY = 7.2;
  const rockMaterial = standardMaterial('#414b43', { roughness: 0.96 });
  const mossMaterial = standardMaterial('#245b31', { roughness: 0.98 });

  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 5; tier += 1) {
      const rock = prepareMesh(
        new THREE.Mesh(new THREE.DodecahedronGeometry(1.05 + random() * 0.62, 0), tier % 2 ? mossMaterial : rockMaterial),
        definition.id,
      );
      rock.name = 'TROPICAL__WATERFALL_CLIFF';
      rock.scale.set(1.25, 1.2 + tier * 0.16, 0.9);
      rock.position.set(side * (1.25 + tier * 0.24), 1.2 + tier * 1.18, waterfallZ - 0.2 + random() * 0.5);
      rock.rotation.set(random() * 0.35, random() * Math.PI, random() * 0.25);
      group.add(rock);
    }
  }

  for (let ribbon = 0; ribbon < 7; ribbon += 1) {
    const widthValue = 0.24 + random() * 0.22;
    const fall = prepareMesh(
      new THREE.Mesh(new THREE.PlaneGeometry(widthValue, 6.15), waterMaterial),
      definition.id,
      false,
    );
    fall.name = 'TROPICAL__WATERFALL';
    fall.position.set(waterfallX - 0.95 + ribbon * 0.31, 4.02, waterfallZ + 0.58 + random() * 0.08);
    fall.rotation.z = (random() - 0.5) * 0.035;
    group.add(fall);
  }

  const upperPool = prepareMesh(
    new THREE.Mesh(new THREE.CircleGeometry(1.65, 32), waterMaterial),
    definition.id,
    false,
  );
  upperPool.name = 'TROPICAL__UPPER_POOL';
  upperPool.rotation.x = -Math.PI / 2;
  upperPool.scale.set(1.35, 0.72, 1);
  upperPool.position.set(0, waterfallTopY, waterfallZ - 0.48);
  group.add(upperPool);

  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -6.6),
    new THREE.Vector3(-0.65, 0.03, -4.4),
    new THREE.Vector3(0.72, 0, -2.5),
    new THREE.Vector3(-0.42, 0.02, -1.2),
  ]);
  const stream = prepareMesh(
    new THREE.Mesh(new THREE.TubeGeometry(streamCurve, 64, 0.58, 10, false), waterMaterial),
    definition.id,
    false,
  );
  stream.name = 'TROPICAL__WINDING_STREAM';
  stream.scale.y = 0.13;
  stream.position.y = floorY + 0.04;
  group.add(stream);

  const pond = prepareMesh(
    new THREE.Mesh(new THREE.CircleGeometry(2.85, 48), waterMaterial),
    definition.id,
    false,
  );
  pond.name = 'TROPICAL__WETLAND_POND';
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1.28, 0.84, 1);
  pond.position.set(0.25, floorY + 0.055, -0.5);
  group.add(pond);

  for (let index = 0; index < 25; index += 1) {
    const t = index / 24;
    const point = streamCurve.getPoint(t);
    const tangent = streamCurve.getTangent(t);
    const side = index % 2 ? 1 : -1;
    const bankOffset = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(side * (0.72 + random() * 0.25));
    const stone = prepareMesh(
      new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + random() * 0.2, 0), index % 3 === 0 ? mossMaterial : rockMaterial),
      definition.id,
    );
    stone.name = 'TROPICAL__STREAM_BANK';
    stone.scale.y = 0.62;
    stone.position.copy(point).add(bankOffset).add(new THREE.Vector3(0, floorY + 0.12, 0));
    stone.rotation.set(random(), random() * Math.PI, random());
    group.add(stone);
  }

  const mistMaterial = new THREE.MeshBasicMaterial({
    color: '#d9ffff',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  for (let index = 0; index < 18; index += 1) {
    const mist = prepareMesh(
      new THREE.Mesh(new THREE.SphereGeometry(0.32 + random() * 0.48, 8, 5), mistMaterial),
      definition.id,
      false,
    );
    mist.name = 'TROPICAL__WATERFALL_MIST';
    mist.scale.set(1.8, 0.5, 1);
    mist.position.set((random() - 0.5) * 3.5, floorY + 0.22 + random() * 1.25, waterfallZ + 1.0 + random() * 1.4);
    group.add(mist);
  }

  // Lookout deck beside the waterfall and a suspension bridge to the research pod.
  const deckPosition = new THREE.Vector3(-3.7, 4.35, -8.0);
  const deck = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.14, 24), pathMaterial), definition.id);
  deck.name = 'TROPICAL__OBSERVATION_DECK';
  deck.position.copy(deckPosition);
  deck.userData.walkable = true;
  group.add(deck);
  const deckRail = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(1.39, 0.035, 8, 36), railMaterial), definition.id, false);
  deckRail.name = 'TROPICAL__OBSERVATION_DECK_RAIL';
  deckRail.rotation.x = Math.PI / 2;
  deckRail.position.copy(deckPosition).add(new THREE.Vector3(0, 0.76, 0));
  group.add(deckRail);
  addCylinderBetween(group, new THREE.Vector3(deckPosition.x, floorY, deckPosition.z), deckPosition, 0.13, metal, 'TROPICAL__OBSERVATION_SUPPORT');
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    if (angle > 0.1 && angle < 1.1) continue;
    const x = deckPosition.x + Math.cos(angle) * 1.38;
    const z = deckPosition.z + Math.sin(angle) * 1.38;
    addCylinderBetween(group, new THREE.Vector3(x, deckPosition.y, z), new THREE.Vector3(x, deckPosition.y + 0.78, z), 0.035, metal);
  }

  const podPosition = new THREE.Vector3(7.15, 5.15, -5.7);
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.7, 4.4, -7.6),
    new THREE.Vector3(0.3, 4.12, -7.1),
    new THREE.Vector3(3.5, 4.4, -6.7),
    new THREE.Vector3(5.8, 5.1, -6.0),
  ]);
  const bridgePoints = bridgeCurve.getPoints(24);
  bridgePoints.forEach((point) => routeSamplePoints.push(point));
  for (let index = 0; index < bridgePoints.length - 1; index += 1) {
    const start = bridgePoints[index];
    const end = bridgePoints[index + 1];
    const direction = end.clone().sub(start);
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const plank = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.09, direction.length() + 0.025), pathMaterial), definition.id);
    plank.name = 'TROPICAL__SUSPENSION_BRIDGE';
    plank.position.copy(start).add(end).multiplyScalar(0.5);
    orientWalkwaySegment(plank, direction);
    plank.userData.walkable = true;
    group.add(plank);
    for (const side of [-1, 1]) {
      const offset = perpendicular.clone().multiplyScalar(side * 0.46);
      addCylinderBetween(
        group,
        start.clone().add(offset).add(new THREE.Vector3(0, 0.68, 0)),
        end.clone().add(offset).add(new THREE.Vector3(0, 0.68, 0)),
        0.024,
        railMaterial,
        'TROPICAL__SUSPENSION_BRIDGE_RAIL',
        false,
      );
    }
  }

  const podPlatform = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.16, 28), darkMetal), definition.id);
  podPlatform.name = 'TROPICAL__RESEARCH_STATION';
  podPlatform.position.copy(podPosition);
  podPlatform.userData.walkable = true;
  group.add(podPlatform);
  const podRail = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.04, 8, 40), railMaterial), definition.id, false);
  podRail.rotation.x = Math.PI / 2;
  podRail.position.copy(podPosition).add(new THREE.Vector3(0, 0.8, 0));
  group.add(podRail);
  addCylinderBetween(group, new THREE.Vector3(podPosition.x, floorY, podPosition.z), podPosition, 0.22, metal, 'TROPICAL__RESEARCH_STATION_COLUMN');
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const x = podPosition.x + Math.cos(angle) * 1.75;
    const z = podPosition.z + Math.sin(angle) * 1.75;
    addCylinderBetween(group, new THREE.Vector3(x, podPosition.y, z), new THREE.Vector3(x, podPosition.y + 0.82, z), 0.035, metal);
  }
  const stationBody = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.35, 20), physicalMaterial('#b9d8d3', {
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.58,
      transmission: 0.58,
    })),
    definition.id,
    false,
  );
  stationBody.name = 'TROPICAL__RESEARCH_LAB_POD';
  stationBody.position.copy(podPosition).add(new THREE.Vector3(0, 0.74, 0));
  group.add(stationBody);
  const stationRoof = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.92, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), darkMetal), definition.id);
  stationRoof.position.copy(podPosition).add(new THREE.Vector3(0, 1.4, 0));
  group.add(stationRoof);

  // Glazed propagation house with visible plant benches.
  const greenhouse = new THREE.Group();
  greenhouse.name = 'TROPICAL__PLANT_NURSERY_GREENHOUSE';
  greenhouse.position.set(7.45, floorY, 2.25);
  const greenhouseShape = new THREE.Shape();
  greenhouseShape.moveTo(-1.7, 0);
  greenhouseShape.lineTo(-1.7, 1.25);
  greenhouseShape.lineTo(0, 2.25);
  greenhouseShape.lineTo(1.7, 1.25);
  greenhouseShape.lineTo(1.7, 0);
  greenhouseShape.closePath();
  const greenhouseGeometry = new THREE.ExtrudeGeometry(greenhouseShape, { depth: 2.8, bevelEnabled: false });
  greenhouseGeometry.translate(0, 0, -1.4);
  const greenhouseGlass = prepareMesh(
    new THREE.Mesh(greenhouseGeometry, new THREE.MeshPhysicalMaterial({
      color: '#a6fff0',
      transparent: true,
      opacity: 0.24,
      roughness: 0.06,
      transmission: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
    definition.id,
    false,
  );
  greenhouseGlass.name = 'TROPICAL__NURSERY_SMART_GLASS';
  greenhouse.add(greenhouseGlass);
  const greenhouseFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(greenhouseGeometry, 18),
    new THREE.LineBasicMaterial({ color: '#d2fff4', transparent: true, opacity: 0.8 }),
  );
  greenhouseFrame.userData.selectableId = definition.id;
  greenhouse.add(greenhouseFrame);
  for (const z of [-0.82, 0.82]) {
    const bench = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.56), darkMetal), definition.id);
    bench.position.set(0, 0.48, z);
    greenhouse.add(bench);
    for (let plantIndex = 0; plantIndex < 7; plantIndex += 1) {
      const plant = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42 + random() * 0.25, 6), standardMaterial(plantIndex % 2 ? '#4ce67d' : '#79f2a2')), definition.id);
      plant.position.set(-1.02 + plantIndex * 0.34, 0.74, z);
      greenhouse.add(plant);
    }
  }
  group.add(greenhouse);

  // Closed-loop filtration and composting equipment occupies the front-right service edge.
  const serviceZone = new THREE.Group();
  serviceZone.name = 'TROPICAL__WATER_RECYCLING_HUB';
  serviceZone.position.set(6.2, floorY, 7.0);
  for (let index = 0; index < 3; index += 1) {
    const tank = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.18, 14), darkMetal), definition.id);
    tank.position.set(index * 0.92 - 0.92, 0.59, 0);
    serviceZone.add(tank);
    const statusRing = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 6, 20), railMaterial), definition.id, false);
    statusRing.position.set(index * 0.92 - 0.92, 0.64, 0);
    statusRing.rotation.x = Math.PI / 2;
    serviceZone.add(statusRing);
  }
  group.add(serviceZone);

  // Suspended climate-control rings, irrigation vents and a fine rain curtain.
  const climateRing = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(5.3, 0.11, 10, 64), metal), definition.id);
  climateRing.name = 'TROPICAL__CLIMATE_CONTROL_RING';
  climateRing.rotation.x = Math.PI / 2;
  climateRing.position.set(0, 10.8, -1.8);
  group.add(climateRing);
  const irrigationRing = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.055, 8, 48), railMaterial), definition.id, false);
  irrigationRing.name = 'TROPICAL__IRRIGATION_RING';
  irrigationRing.rotation.x = Math.PI / 2;
  irrigationRing.position.set(0, 10.55, -1.8);
  group.add(irrigationRing);
  const rainMaterial = new THREE.MeshBasicMaterial({ color: '#a8ecff', transparent: true, opacity: 0.34, depthWrite: false });
  for (let index = 0; index < 46; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 4.8;
    const x = Math.cos(angle) * distance;
    const z = -1.8 + Math.sin(angle) * distance;
    const dropLength = 0.28 + random() * 0.7;
    const drop = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, dropLength, 4), rainMaterial), definition.id, false);
    drop.name = 'TROPICAL__MISTING_RAIN';
    drop.position.set(x, 8.2 + random() * 2.05, z);
    group.add(drop);
  }
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const vent = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 0.34, 12), darkMetal), definition.id);
    vent.name = 'TROPICAL__CLIMATE_VENT';
    vent.position.set(Math.cos(angle) * 5.3, 10.55, -1.8 + Math.sin(angle) * 5.3);
    group.add(vent);
  }

  // Layered rainforest canopy. The central water vista and visitor routes remain open.
  const trunkMaterial = standardMaterial('#4b321f', { roughness: 0.98 });
  const vineMaterial = standardMaterial('#327443', { roughness: 0.96 });
  const leafMaterials = [
    standardMaterial('#0d4a2b', { roughness: 0.94 }),
    standardMaterial('#14693b', { roughness: 0.94 }),
    standardMaterial('#23824b', { roughness: 0.94 }),
    standardMaterial('#3b9b58', { roughness: 0.94 }),
  ];
  const distanceToRoute = (point: THREE.Vector3) => routeSamplePoints.reduce(
    (closest, routePoint) => Math.min(closest, Math.hypot(point.x - routePoint.x, point.z - routePoint.z)),
    Number.POSITIVE_INFINITY,
  );

  const addRainforestTree = (treeIndex: number, x: number, z: number, heightValue: number) => {
    const tree = new THREE.Group();
    tree.name = `TROPICAL__CANOPY_TREE_${treeIndex}`;
    const trunkHeight = heightValue * 0.68;
    const trunk = prepareMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(heightValue * 0.032, heightValue * 0.07, trunkHeight, 9), trunkMaterial),
      definition.id,
    );
    trunk.position.y = floorY + trunkHeight * 0.5;
    tree.add(trunk);
    for (let root = 0; root < 3; root += 1) {
      const angle = (root / 3) * Math.PI * 2 + random() * 0.45;
      addCylinderBetween(
        tree,
        new THREE.Vector3(0, floorY + 0.65, 0),
        new THREE.Vector3(Math.cos(angle) * 0.85, floorY + 0.06, Math.sin(angle) * 0.85),
        0.09 + heightValue * 0.006,
        trunkMaterial,
        'TROPICAL__BUTTRESS_ROOT',
      );
    }
    const crownY = floorY + heightValue * 0.76;
    for (let crownIndex = 0; crownIndex < 4; crownIndex += 1) {
      const angle = (crownIndex / 4) * Math.PI * 2 + random() * 0.65;
      const crownRadius = heightValue * (0.105 + random() * 0.025);
      const crown = prepareMesh(
        new THREE.Mesh(new THREE.IcosahedronGeometry(crownRadius, 1), leafMaterials[(treeIndex + crownIndex) % leafMaterials.length]),
        definition.id,
      );
      crown.position.set(Math.cos(angle) * crownRadius * 0.72, crownY + (crownIndex % 2) * crownRadius * 0.55, Math.sin(angle) * crownRadius * 0.72);
      crown.scale.set(1.35, 0.9, 1.15);
      tree.add(crown);
    }
    if (treeIndex % 2 === 0) {
      const vineStart = new THREE.Vector3(heightValue * 0.08, crownY, 0);
      const vineEnd = new THREE.Vector3(heightValue * 0.12, floorY + 1.0 + random() * 1.4, heightValue * 0.04);
      addCylinderBetween(tree, vineStart, vineEnd, 0.025, vineMaterial, 'TROPICAL__HANGING_VINE');
    }
    tree.position.set(x, 0, z);
    group.add(tree);
  };

  let treeCount = 0;
  for (let attempt = 0; attempt < 160 && treeCount < 22; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 6.0 + Math.sqrt(random()) * (usableRadius - 6.0);
    const point = new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
    if (Math.abs(point.x) < 4.2 && point.z > -10.2 && point.z < 9.4) continue;
    if (Math.abs(point.x) < 7.2 && point.z > 0.4) continue;
    if (distanceToRoute(point) < 1.55) continue;
    if (Math.hypot(point.x - podPosition.x, point.z - podPosition.z) < 4.2) continue;
    if (Math.hypot(point.x - 7.45, point.z - 2.25) < 4.0) continue;
    if (Math.hypot(point.x - 6.2, point.z - 7.0) < 2.3) continue;
    if (Math.hypot(point.x - 0.25, point.z - (-0.5)) < 2.2) continue; // Clear pond center
    if (Math.hypot(point.x - (-2.4), point.z - 11.4) < 2.2) continue; // Clear stairs start
    addRainforestTree(treeCount, point.x, point.z, 6.4 + random() * 4.7);
    treeCount += 1;
  }

  // Ferns, broad-leaf understory, wetland flowers and softly bioluminescent pollinator beds.
  const fernMaterial = standardMaterial('#2d8c4b', { roughness: 0.96 });
  for (let index = 0; index < 44; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 2.2 + random() * (usableRadius - 2.4);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    if (Math.abs(x) < 1.5 && z > -7 && z < 8) continue;
    if (Math.hypot(x - (-2.4), z - 11.4) < 2.0) continue; // Clear stairs start
    if (Math.hypot(x - 0.25, z - (-0.5)) < 2.4) continue; // Clear pond
    const fern = new THREE.Group();
    fern.name = 'TROPICAL__FERN_UNDERSTORY';
    fern.position.set(x, floorY + 0.08, z);
    for (let leaf = 0; leaf < 3; leaf += 1) {
      const frond = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.26 + random() * 0.16, 8, 4), fernMaterial), definition.id);
      frond.scale.set(1.55, 0.12, 0.38);
      frond.rotation.y = (leaf / 3) * Math.PI * 2 + random() * 0.3;
      frond.rotation.z = (random() - 0.5) * 0.25;
      fern.add(frond);
    }
    group.add(fern);
  }

  const glowColors = ['#cb6cff', '#6ee7ff', '#ff72c8', '#9cff8a'];
  for (let index = 0; index < 30; index += 1) {
    const angle = random() * Math.PI * 2;
    const pondRadius = 3.15 + random() * 1.25;
    const x = 0.25 + Math.cos(angle) * pondRadius * 1.2;
    const z = -0.5 + Math.sin(angle) * pondRadius * 0.72;
    if (z > 4.2) continue; // Clear entrance area
    const stemHeight = 0.28 + random() * 0.42;
    const stem = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, stemHeight, 5), vineMaterial), definition.id);
    stem.name = 'TROPICAL__POLLINATOR_GARDEN';
    stem.position.set(x, floorY + stemHeight * 0.5, z);
    group.add(stem);
    const color = glowColors[index % glowColors.length];
    const flower = prepareMesh(
      new THREE.Mesh(new THREE.SphereGeometry(0.09 + random() * 0.07, 8, 6), physicalMaterial(color, {
        roughness: 0.22,
        emissive: color,
        emissiveIntensity: 2.8,
      })),
      definition.id,
      false,
    );
    flower.name = 'TROPICAL__BIOLUMINESCENT_FLORA';
    flower.position.set(x, floorY + stemHeight, z);
    group.add(flower);
  }

  // Solar energy integrated into the front-left base skirt.
  const solarCells = new THREE.MeshPhysicalMaterial({ color: '#071b38', roughness: 0.08, metalness: 0.92, clearcoat: 0.9 });
  for (let index = 0; index < 5; index += 1) {
    const angle = Math.PI * 0.68 + index * 0.13;
    const panel = new THREE.Group();
    panel.name = 'TROPICAL__SOLAR_ENERGY_ARRAY';
    panel.position.set(Math.cos(angle) * (radius + 0.16), 0.46, Math.sin(angle) * (radius + 0.16));
    panel.rotation.y = -angle + Math.PI / 2;
    panel.rotation.x = 0.42;
    const frame = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.055, 0.68), metal), definition.id);
    const cells = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.062, 0.59), solarCells), definition.id, false);
    cells.position.y = 0.025;
    panel.add(frame, cells);
    group.add(panel);
  }
}

export function createBiomeModel(definition: BiomeDefinition): ProceduralModel {
  const group = new THREE.Group();
  group.name = `BIOME__${definition.id}`;
  group.position.set(definition.position[0], definition.position[1] + ISLAND_SURFACE_Y, definition.position[2]);
  group.rotation.y = Math.atan2(-definition.position[0], -definition.position[2]);
  group.userData = {
    selectableId: definition.id,
    type: 'biome',
    category: 'biome',
    ring: definition.ring,
    archetype: definition.archetype,
    sourceLabel: definition.sourceLabel ?? definition.name,
    description: definition.description,
  };
  const [width, depth] = definition.footprint;
  const radius = width * 0.48;
  const isTropicalRainforest = definition.id === 'tropical-rainforest-dome';
  const random = seededRandom(hashString(definition.id));
  const base = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, 0.6, 48), biomeMaterial(definition.palette, 2)),
    definition.id,
  );
  base.scale.z = depth / width;
  base.position.y = 0.34;
  group.add(base);

  const ground = prepareMesh(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.94, radius * 0.94, 0.16, 48),
      isTropicalRainforest
        ? standardMaterial('#17472f', { roughness: 0.98 })
        : biomeMaterial(definition.palette, 0),
    ),
    definition.id,
  );
  ground.scale.z = depth / width;
  ground.position.y = 0.7;
  ground.userData.walkable = true;
  group.add(ground);

  const domeGeometry = new THREE.SphereGeometry(radius, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMaterial = new THREE.MeshPhysicalMaterial({
    color: isTropicalRainforest ? '#b9fff0' : definition.accent,
    roughness: 0.08,
    metalness: 0.08,
    transparent: true,
    opacity: isTropicalRainforest ? 0.1 : 0.22,
    transmission: isTropicalRainforest ? 0.68 : 0.42,
    thickness: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const dome = prepareMesh(new THREE.Mesh(domeGeometry, domeMaterial), definition.id, false);
  dome.scale.set(1, definition.height / radius, depth / width);
  dome.position.y = 0.72;
  dome.renderOrder = 4;
  group.add(dome);

  const wire = prepareMesh(
    new THREE.Mesh(
      domeGeometry.clone(),
      markAccent(
        new THREE.MeshBasicMaterial({
          color: isTropicalRainforest ? '#d2fff2' : definition.accent,
          wireframe: true,
          transparent: true,
          opacity: isTropicalRainforest ? 0.22 : 0.18,
          depthWrite: false,
        }),
      ),
    ),
    definition.id,
    false,
  );
  wire.scale.copy(dome.scale);
  wire.position.copy(dome.position);
  wire.renderOrder = 5;
  group.add(wire);

  const boundary = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.1, 8, 72), markAccent(new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 2.2 }))), definition.id, false);
  boundary.rotation.x = Math.PI / 2;
  boundary.scale.z = depth / width;
  boundary.position.y = 0.78;
  group.add(boundary);

  const usableRadius = radius * 0.68;
  if (definition.id === 'alpine-dome') {
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const h = 0.7 + random() * 1.2;
      const rock = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.25 + random() * 0.35, h, 5), biomeMaterial(definition.palette, 1)), definition.id);
      rock.position.set(Math.cos(angle) * distance, 0.7 + (h * 0.4), Math.sin(angle) * distance * (depth / width));
      rock.rotation.y = random() * Math.PI;
      rock.rotation.x = (random() - 0.5) * 0.15;
      group.add(rock);
    }
    for (let index = 0; index < 14; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      addConifer(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.5 + random() * 0.6, true);
    }
    for (let index = 0; index < 15; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const pebble = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + random() * 0.08, 0), biomeMaterial(definition.palette, 2)), definition.id);
      pebble.position.set(Math.cos(angle) * distance, 0.76, Math.sin(angle) * distance * (depth / width));
      pebble.rotation.set(random() * 3, random() * 3, random() * 3);
      group.add(pebble);
    }
  } else if (definition.id === 'tundra-dome') {
    for (let index = 0; index < 30; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const shrub = prepareMesh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + random() * 0.16, 1), biomeMaterial(definition.palette, index % 2)), definition.id);
      shrub.scale.set(1.1, 0.35 + random() * 0.15, 1.1);
      shrub.position.set(Math.cos(angle) * distance, 0.74, Math.sin(angle) * distance * (depth / width));
      group.add(shrub);
    }
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const stone = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.2 + random() * 0.3, 0.15 + random() * 0.25, 0.2 + random() * 0.3), biomeMaterial(definition.palette, 1)), definition.id);
      stone.position.set(Math.cos(angle) * distance, 0.72, Math.sin(angle) * distance * (depth / width));
      stone.rotation.set(random() * 0.2, random() * Math.PI, random() * 0.2);
      group.add(stone);
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const patch = prepareMesh(new THREE.Mesh(new THREE.CircleGeometry(0.3 + random() * 0.5, 8), physicalMaterial('#ffffff', { roughness: 0.1, transparent: true, opacity: 0.75 })), definition.id, false);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(Math.cos(angle) * distance, 0.78, Math.sin(angle) * distance * (depth / width));
      group.add(patch);
    }
  } else if (definition.id === 'desert-dome') {
    for (let index = 0; index < 10; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const dune = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.5 + random() * 0.6, 12, 6), biomeMaterial(definition.palette, index % 2)), definition.id);
      dune.scale.set(2.0, 0.18, 0.8);
      dune.position.set(Math.cos(angle) * distance, 0.72, Math.sin(angle) * distance * (depth / width));
      dune.rotation.y = random() * Math.PI;
      group.add(dune);
    }
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      addCactus(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.6 + random() * 0.5);
    }
    for (let index = 0; index < 15; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const pebble = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + random() * 0.08, 0), standardMaterial('#c2b280', { roughness: 0.9 })), definition.id);
      pebble.position.set(Math.cos(angle) * distance, 0.74, Math.sin(angle) * distance * (depth / width));
      group.add(pebble);
    }
  } else if (definition.id === 'savanna-dome') {
    for (let index = 0; index < 10; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      addAcacia(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.65 + random() * 0.5);
    }
    const grassMat = standardMaterial('#c2b87f', { roughness: 0.95 });
    for (let index = 0; index < 25; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      if (Math.cos(angle) * distance > 0.8 && Math.sin(angle) * distance * (depth / width) < -0.1) continue;
      const tuft = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.06 + random() * 0.06, 0.25 + random() * 0.25, 4), grassMat), definition.id);
      tuft.position.set(Math.cos(angle) * distance, 0.7 + 0.125 * tuft.scale.y, Math.sin(angle) * distance * (depth / width));
      tuft.rotation.x = (random() - 0.5) * 0.25;
      tuft.rotation.z = (random() - 0.5) * 0.25;
      group.add(tuft);
    }
    const clayMat = standardMaterial('#b85c37', { roughness: 0.98 });
    for (let index = 0; index < 3; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius * 0.8;
      const h = 0.5 + random() * 0.5;
      const mound = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.18 + random() * 0.1, h, 5), clayMat), definition.id);
      mound.position.set(Math.cos(angle) * distance, 0.7 + (h * 0.5), Math.sin(angle) * distance * (depth / width));
      mound.rotation.y = random() * Math.PI;
      group.add(mound);
    }
    const pool = prepareMesh(new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), physicalMaterial('#3e9196', { roughness: 0.08, metalness: 0.05 })), definition.id, false);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(1.3, 0.81, -0.4);
    group.add(pool);

    const borderRockMat = standardMaterial('#8c7f70', { roughness: 0.88 });
    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const rockRadius = 1.35;
      const rx = 1.3 + Math.cos(theta) * rockRadius;
      const rz = -0.4 + Math.sin(theta) * rockRadius;
      const rScale = 0.08 + random() * 0.08;
      const borderRock = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(rScale, 0), borderRockMat), definition.id);
      borderRock.position.set(rx, 0.74, rz);
      borderRock.rotation.set(random() * 3, random() * 3, random() * 3);
      group.add(borderRock);
    }
  } else {
    const tropical = definition.id === 'tropical-rainforest-dome';
    if (tropical) {
      buildFuturisticTropicalBiodome(group, definition, radius, depth, width, random);
    } else {
      for (let index = 0; index < 22; index += 1) {
        const angle = random() * Math.PI * 2;
        const distance = random() * usableRadius;
        const leafColor = random() > 0.4 ? '#4a6b32' : '#698a3c';
        addTree(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.55 + random() * 0.65, leafColor, true);
      }
      const shrubMat = standardMaterial('#3e5c26', { roughness: 0.92 });
      for (let index = 0; index < 12; index += 1) {
        const angle = random() * Math.PI * 2;
        const distance = random() * usableRadius;
        const shrub = prepareMesh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + random() * 0.12, 1), shrubMat), definition.id);
        shrub.position.set(Math.cos(angle) * distance, 0.78, Math.sin(angle) * distance * (depth / width));
        group.add(shrub);
      }
      const rockMat = standardMaterial('#5e615b', { roughness: 0.85 });
      for (let index = 0; index < 8; index += 1) {
        const angle = random() * Math.PI * 2;
        const distance = random() * usableRadius;
        const rock = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 + random() * 0.14, 0), rockMat), definition.id);
        rock.position.set(Math.cos(angle) * distance, 0.76, Math.sin(angle) * distance * (depth / width));
        rock.rotation.set(random() * 3, random() * 3, random() * 3);
        group.add(rock);
      }
    }
  }

  // Every biome contains a compact, visible field laboratory. It remains part
  // of the dome's editable hierarchy and is positioned clear of the airlock.
  const labCatalogItem = EDITOR_ASSET_CATALOG.find((item) => item.id === 'landscape-modular-wet-lab');
  if (labCatalogItem) {
    const laboratory = createEditorAsset(labCatalogItem, definition.id);
    laboratory.name = `${definition.id}__BIOME_FIELD_LABORATORY`;
    laboratory.position.set(
      isTropicalRainforest ? radius * 0.43 : 0,
      0.79,
      isTropicalRainforest ? -radius * 0.34 : -radius * 0.24,
    );
    laboratory.rotation.y = isTropicalRainforest ? -Math.PI * 0.5 : Math.PI;
    laboratory.scale.setScalar(isTropicalRainforest ? 0.54 : 0.72);
    laboratory.userData.biomeLaboratory = true;
    laboratory.userData.editable = true;
    laboratory.traverse((child) => {
      child.userData.selectableId = definition.id;
      child.userData.biomeLaboratory = true;
    });
    group.add(laboratory);
  }

  const airlock = roundedBlock(definition.id, width * 0.16, 1.15, 1.2, physicalMaterial(definition.palette[2]), 0, 0.6, depth * 0.47, 0.14);
  group.add(airlock);
  addAccessRamp(group, definition.id, width * 0.52, depth, 0.81, 2.6, physicalMaterial(definition.palette[2]), depth * 0.47 + 0.75 - 0.05);
  const airlockGlow = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(width * 0.09, 0.06, 0.04), markAccent(new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 2.5 }))), definition.id, false);
  airlockGlow.position.set(0, 1.5, depth * 0.47 + 0.62);
  group.add(airlockGlow);
  addDomeWalkPortal(group, definition.id, width, depth, definition.accent);

  group.traverse((child) => {
    child.userData.selectableId = definition.id;
  });
  return { group, labelHeight: definition.height + 2.4 };
}

export function setModelAccent(group: THREE.Object3D, color: string) {
  const accent = new THREE.Color(color);
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material.userData.isDistrictAccent) return;
      const typed = material as THREE.MeshStandardMaterial;
      if (typed.color) typed.color.copy(accent);
      if (typed.emissive) typed.emissive.copy(accent);
    });
  });
}
