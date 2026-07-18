import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { BiomeDefinition, DistrictDefinition } from '../data/districts';
import {
  BIOME_ECOLOGY_PLANS,
  DISTRICT_CAMPUS_PLANS,
  type CampusFacilityForm,
  type CampusObjectKind,
} from '../data/districtCampusPlans';
import { ISLAND_SURFACE_Y, metresToWorldUnits } from '../config/island';
import { EDITOR_ASSET_CATALOG, createEditorAsset } from './editorAssets';
import {
  buildAcademicDistrictExtension,
  enrichExistingAcademicBuildings,
} from './academicDistrict';
import {
  getAcademicAshlarTextures,
  getAcademicBrickTextures,
  getAcademicLeafPathTextures,
  getAcademicOakTextures,
  getAcademicSlateTextures,
  tileAcademicPathGeometry,
} from './academicSurfaceTextures';
import { buildIndustrialDistrict } from './industrialDistrict';
import { ACADEMIC_FOUNTAIN_COURT_NAME } from '../data/academicFountain';
import { createAcademicGothicFountain } from './academicFountain';

const DEG = Math.PI / 180;
const ACCESS_APPROACH_LENGTH = metresToWorldUnits(2);
const DISTRICT_ACCESS_RAMP_LENGTH = metresToWorldUnits(41);
const DOME_ACCESS_RAMP_LENGTH = metresToWorldUnits(48);
const DISTRICT_FINISHED_FLOOR_Y = 0.34;
const ACADEMIC_FINISHED_FLOOR_Y = metresToWorldUnits(0.04);
const DOME_FINISHED_FLOOR_Y = 0.4;
const TROPICAL_FINISHED_FLOOR_Y = metresToWorldUnits(0.18);
const TROPICAL_ACCESS_RAMP_LENGTH = metresToWorldUnits(2.4);
const DOME_AIRLOCK_DEPTH = 1.2;
const DOME_AIRLOCK_HALF_DEPTH = DOME_AIRLOCK_DEPTH * 0.5;
const HUMAN_GUARDRAIL_HEIGHT = metresToWorldUnits(1.1);
const HUMAN_HANDRAIL_RADIUS = metresToWorldUnits(0.04);
const HUMAN_RAIL_POST_RADIUS = metresToWorldUnits(0.05);
const HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE = HUMAN_GUARDRAIL_HEIGHT - HUMAN_HANDRAIL_RADIUS;
const TROPICAL_CANOPY_PATH_WIDTH = metresToWorldUnits(2.4);
const TROPICAL_CANOPY_DECK_THICKNESS = metresToWorldUnits(0.22);
const TROPICAL_SUSPENSION_PATH_WIDTH = metresToWorldUnits(1.8);
const TROPICAL_SUSPENSION_DECK_THICKNESS = metresToWorldUnits(0.18);
const TROPICAL_PLATFORM_THICKNESS = metresToWorldUnits(0.32);
const surfaceTextureCache = new Map<string, THREE.CanvasTexture>();

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

// Procedural canvas texture helpers for realistic surface detail.
function makeConcreteTexture(size = 256): THREE.CanvasTexture {
  const cacheKey = `concrete-${size}`;
  const cached = surfaceTextureCache.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const random = seededRandom(0xc0c2e7 + size);
  ctx.fillStyle = '#9b9d9c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 4; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const v = Math.floor(random() * 60 - 30);
    const ch = Math.abs(v).toString(16).padStart(2, '0');
    ctx.fillStyle = v > 0 ? `#${ch}${ch}${ch}` : `#000`;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(x, y, 2 + random() * 3, 1);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(35, 40, 42, 0.28)';
  ctx.lineWidth = Math.max(1, size / 256);
  const panel = size / 4;
  for (let index = 1; index < 4; index += 1) {
    ctx.beginPath();
    ctx.moveTo(index * panel, 0);
    ctx.lineTo(index * panel, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, index * panel);
    ctx.lineTo(size, index * panel);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  for (let streak = 0; streak < 18; streak += 1) {
    const x = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, random() * size * 0.25);
    ctx.lineTo(x + (random() - 0.5) * 4, size * (0.55 + random() * 0.45));
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  surfaceTextureCache.set(cacheKey, tex);
  return tex;
}

function makeGroundTexture(baseColor: string, size = 256): THREE.CanvasTexture {
  const cacheKey = `ground-${baseColor}-${size}`;
  const cached = surfaceTextureCache.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  const random = seededRandom(hashString(cacheKey));
  for (let i = 0; i < 3200; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 0.5 + random() * 2;
    ctx.globalAlpha = 0.08 + random() * 0.12;
    ctx.fillStyle = random() > 0.5 ? '#000' : '#fff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  surfaceTextureCache.set(cacheKey, tex);
  return tex;
}

function makeDarkBrickTexture(size = 256): THREE.CanvasTexture {
  const cacheKey = `dark-academia-brick-${size}`;
  const cached = surfaceTextureCache.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;
  const random = seededRandom(0xda4caca + size);
  const courses = 16;
  const courseHeight = size / courses;
  const brickWidth = size / 8;
  context.fillStyle = '#2a211e';
  context.fillRect(0, 0, size, size);
  for (let row = 0; row < courses; row += 1) {
    const offset = row % 2 ? -brickWidth * 0.5 : 0;
    for (let column = -1; column < 9; column += 1) {
      const x = offset + column * brickWidth + 1.5;
      const y = row * courseHeight + 1.5;
      const warmth = Math.floor(random() * 18);
      context.fillStyle = `rgb(${65 + warmth}, ${37 + Math.floor(warmth * 0.48)}, ${30 + Math.floor(warmth * 0.3)})`;
      context.fillRect(x, y, brickWidth - 3, courseHeight - 3);
      context.fillStyle = 'rgba(0, 0, 0, 0.13)';
      context.fillRect(x, y + courseHeight - 5, brickWidth - 3, 2);
    }
  }
  context.globalAlpha = 0.13;
  for (let speck = 0; speck < size * 3; speck += 1) {
    const shade = random() > 0.5 ? '#e8c69a' : '#050403';
    context.fillStyle = shade;
    context.fillRect(random() * size, random() * size, 1 + random() * 2, 1);
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  surfaceTextureCache.set(cacheKey, texture);
  return texture;
}

function makeBrushedMetalTexture(size = 256): THREE.CanvasTexture {
  const cacheKey = `brushed-metal-${size}`;
  const cached = surfaceTextureCache.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const random = seededRandom(0xb7a5ed + size);
  ctx.fillStyle = '#aeb4b5';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    const shade = 135 + Math.floor(random() * 55);
    ctx.fillStyle = `rgba(${shade}, ${shade + 3}, ${shade + 5}, ${0.16 + random() * 0.2})`;
    ctx.fillRect(0, y, size, 1);
  }
  ctx.strokeStyle = 'rgba(30, 38, 42, 0.34)';
  ctx.lineWidth = 1;
  for (let panel = 1; panel < 4; panel += 1) {
    const x = (panel * size) / 4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  surfaceTextureCache.set(cacheKey, texture);
  return texture;
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

function prepareMesh<T extends THREE.Mesh>(mesh: T, id: string, shadows = true): T {
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
  const rampWidth = THREE.MathUtils.clamp(
    plotWidth * 0.08,
    metresToWorldUnits(2.4),
    metresToWorldUnits(4),
  );
  const thickness = metresToWorldUnits(0.25);
  const ramp = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(rampWidth, thickness, length), material), id);
  ramp.name = `${id}__ACCESS_RAMP`;
  const rampAngle = Math.atan2(rise, length);
  ramp.rotation.x = rampAngle;
  // Seat the lower top edge exactly on the building datum while keeping the
  // upper top edge flush with the raised floor.
  ramp.position.set(0, rise * 0.5 - thickness * 0.5 * Math.cos(rampAngle), innerEdgeZ + length * 0.5);
  ramp.userData.walkable = true;
  group.add(ramp);

  // A short, level landing guarantees that the ramp connects to the island's
  // walkable terrain even when its outer edge falls between road meshes.
  const approachThickness = metresToWorldUnits(0.2);
  const outerRampTopY = ramp.position.y
    + thickness * 0.5 * Math.cos(rampAngle)
    - length * 0.5 * Math.sin(rampAngle);
  const approach = prepareMesh(
    new THREE.Mesh(new THREE.BoxGeometry(rampWidth, approachThickness, ACCESS_APPROACH_LENGTH), material),
    id,
  );
  approach.name = `${id}__ACCESS_APPROACH`;
  approach.position.set(
    0,
    outerRampTopY - approachThickness * 0.5,
    innerEdgeZ + length + ACCESS_APPROACH_LENGTH * 0.5 - 0.025,
  );
  approach.userData.walkable = true;
  approach.userData.accessibilityLanding = true;
  group.add(approach);
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

function addDistrictWalkPortal(
  group: THREE.Group,
  id: string,
  width: number,
  depth: number,
  accent: string,
  floorY = DISTRICT_FINISHED_FLOOR_Y,
  rampLength = DISTRICT_ACCESS_RAMP_LENGTH,
) {
  const portalWidth = THREE.MathUtils.clamp(
    width * 0.08,
    metresToWorldUnits(1.8),
    metresToWorldUnits(4.2),
  );
  const floorThickness = Math.min(0.05, floorY);
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

  const floor = prepareMesh(
    new THREE.Mesh(new THREE.BoxGeometry(portalWidth, floorThickness, corridorDepth), floorMaterial),
    id,
  );
  floor.name = `${id}__WALK_FOYER_FLOOR`;
  floor.position.set(0, floorY - floorThickness * 0.5, corridorCenter);
  floor.userData.walkable = true;
  group.add(floor);

  const doorZ = depth * 0.5 + 0.018;
  const doorHeight = metresToWorldUnits(2.6);
  const door = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth * 0.82, doorHeight, 0.035), glassMaterial), id, false);
  door.name = `${id}__WALK_ENTRY_DOOR`;
  door.position.set(0, floorY + doorHeight * 0.5, doorZ);
  group.add(door);

  for (const x of [-portalWidth * 0.5, portalWidth * 0.5]) {
    const jamb = prepareMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          metresToWorldUnits(0.2),
          doorHeight + metresToWorldUnits(0.4),
          metresToWorldUnits(0.5),
        ),
        frameMaterial,
      ),
      id,
      false,
    );
    jamb.position.set(x, floorY + (doorHeight + metresToWorldUnits(0.4)) * 0.5, doorZ);
    group.add(jamb);
  }
  const lintelThickness = metresToWorldUnits(0.2);
  const lintel = prepareMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(portalWidth + metresToWorldUnits(0.4), lintelThickness, metresToWorldUnits(0.5)),
      frameMaterial,
    ),
    id,
    false,
  );
  lintel.position.set(0, floorY + doorHeight + lintelThickness * 0.5, doorZ);
  group.add(lintel);

  const threshold = prepareMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(portalWidth * 0.72, metresToWorldUnits(0.05), metresToWorldUnits(0.4)),
      markAccent(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.1 })),
    ),
    id,
    false,
  );
  threshold.position.set(0, floorY + metresToWorldUnits(0.025), doorZ + metresToWorldUnits(0.2));
  group.add(threshold);
  const accessExteriorZ = depth * 0.5 - 0.04 + rampLength + ACCESS_APPROACH_LENGTH;
  const accessDepth = accessExteriorZ - foyerZ;
  addNavigationAccessVolume(
    group,
    id,
    Math.max(portalWidth * 1.3, metresToWorldUnits(3.2)),
    2.2,
    accessDepth,
    0.85,
    (accessExteriorZ + foyerZ) * 0.5,
    'district',
  );
}

function addDomeWalkPortal(
  group: THREE.Group,
  id: string,
  width: number,
  depth: number,
  accent: string,
  finishedFloorY = DOME_FINISHED_FLOOR_Y,
  rampLength = DOME_ACCESS_RAMP_LENGTH,
) {
  const portalWidth = THREE.MathUtils.clamp(
    width * 0.04,
    metresToWorldUnits(2.2),
    metresToWorldUnits(4.8),
  );
  // Keep the corridor slightly proud of the biome floor so the complete
  // airlock remains visible instead of being bisected by the ground disk.
  const floorY = finishedFloorY + 0.005;
  const airlockCenterZ = depth * 0.47;
  const exteriorZ = airlockCenterZ + DOME_AIRLOCK_HALF_DEPTH + 0.04;
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
    side: THREE.DoubleSide,
  });
  const frameMaterial = standardMaterial('#d5e4e1', { roughness: 0.24, metalness: 0.74 });

  const floor = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth, 0.05, corridorDepth), floorMaterial), id);
  floor.name = `${id}__AIRLOCK_FLOOR`;
  floor.position.set(0, floorY, corridorCenter);
  floor.userData.walkable = true;
  group.add(floor);

  const doorZ = airlockCenterZ + DOME_AIRLOCK_HALF_DEPTH + 0.018;
  const doorHeight = metresToWorldUnits(3);
  const door = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(portalWidth * 0.8, doorHeight, 0.035), glassMaterial), id, false);
  door.name = `${id}__AIRLOCK_ENTRY_DOOR`;
  door.position.set(0, floorY + doorHeight * 0.5, doorZ);
  group.add(door);
  for (const x of [-portalWidth * 0.5, portalWidth * 0.5]) {
    const jamb = prepareMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          metresToWorldUnits(0.2),
          doorHeight + metresToWorldUnits(0.4),
          metresToWorldUnits(0.5),
        ),
        frameMaterial,
      ),
      id,
      false,
    );
    jamb.position.set(x, floorY + (doorHeight + metresToWorldUnits(0.4)) * 0.5, doorZ);
    group.add(jamb);
  }
  const lintelThickness = metresToWorldUnits(0.2);
  const lintel = prepareMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(portalWidth + metresToWorldUnits(0.4), lintelThickness, metresToWorldUnits(0.5)),
      frameMaterial,
    ),
    id,
    false,
  );
  lintel.position.set(0, floorY + doorHeight + lintelThickness * 0.5, doorZ);
  group.add(lintel);
  const accessExteriorZ = airlockCenterZ + DOME_AIRLOCK_HALF_DEPTH + rampLength + ACCESS_APPROACH_LENGTH;
  const accessDepth = accessExteriorZ - interiorZ;
  addNavigationAccessVolume(
    group,
    id,
    Math.max(portalWidth * 1.3, metresToWorldUnits(3.2)),
    2.2,
    accessDepth,
    0.65,
    (accessExteriorZ + interiorZ) * 0.5,
    'dome',
  );
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

function addTree(
  group: THREE.Group,
  id: string,
  x: number,
  z: number,
  scale: number,
  leafColor: string,
  autumn = false,
  groundY = 0.56,
) {
  const trunk = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.045 * scale, 0.07 * scale, 0.55 * scale, 7), standardMaterial('#3b3024', { roughness: 0.92 })),
    id,
  );
  trunk.position.set(x, groundY + 0.275 * scale, z);
  trunk.name = `${id}__${autumn ? 'DECIDUOUS' : 'LANDSCAPE'}_TREE_TRUNK`;
  const crownColor = autumn ? (Math.sin(x * 12.9898 + z * 78.233) > 0 ? '#a84f2e' : '#d58a3a') : leafColor;
  const crown = prepareMesh(
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 * scale, 1), standardMaterial(crownColor, { roughness: 0.86 })),
    id,
  );
  crown.scale.set(1, 1.25, 1);
  crown.position.set(x, groundY + 0.37 + 0.48 * scale, z);
  crown.name = `${id}__${autumn ? 'DECIDUOUS' : 'LANDSCAPE'}_TREE_CANOPY`;
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
  const facadeTex = makeConcreteTexture(512);
  let body = physicalMaterial(secondary, { map: facadeTex, bumpMap: facadeTex, bumpScale: 0.012, roughness: 0.52, metalness: 0.28 });
  let dark = physicalMaterial(base, { map: facadeTex, bumpMap: facadeTex, bumpScale: 0.009, roughness: 0.44, metalness: 0.42 });

  if (definition.id === 'dark-center-lab-megabuilding') {
    body = physicalMaterial('#090a0f', { roughness: 0.16, metalness: 0.65, clearcoat: 0.65, clearcoatRoughness: 0.12 });
    dark = physicalMaterial('#030406', { roughness: 0.12, metalness: 0.75, clearcoat: 0.8, clearcoatRoughness: 0.08 });
  }

  const brushedMetal = makeBrushedMetalTexture();
  const metal = standardMaterial(trim, { map: brushedMetal, bumpMap: brushedMetal, bumpScale: 0.006, roughness: 0.35, metalness: 0.68 });
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

const academicUnitBox = new THREE.BoxGeometry(1, 1, 1);
const academicUnitCone = new THREE.ConeGeometry(0.5, 1, 4);
const academicUnitCrown = new THREE.IcosahedronGeometry(0.5, 1);
const academicGableGeometry = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  geometry.translate(0, 0, -0.5);
  return geometry;
})();

function createAcademicMaterials() {
  const brick = getAcademicBrickTextures();
  const stone = getAcademicAshlarTextures('medieval');
  const limestone = getAcademicAshlarTextures('repair');
  const slate = getAcademicSlateTextures();
  const oak = getAcademicOakTextures();
  const path = getAcademicLeafPathTextures();
  return {
    brick: standardMaterial('#d2c2b7', {
      map: brick.albedo,
      bumpMap: brick.height,
      bumpScale: 0.026,
      roughness: 0.94,
      metalness: 0,
    }),
    stone: standardMaterial('#d0c9bc', {
      map: stone.albedo,
      bumpMap: stone.height,
      bumpScale: 0.03,
      roughness: 0.92,
      metalness: 0,
    }),
    limestone: standardMaterial('#e0dbcf', {
      map: limestone.albedo,
      bumpMap: limestone.height,
      bumpScale: 0.022,
      roughness: 0.87,
      metalness: 0,
    }),
    slate: standardMaterial('#aeb4b3', {
      map: slate.albedo,
      bumpMap: slate.height,
      bumpScale: 0.026,
      roughness: 0.88,
      metalness: 0,
    }),
    wood: standardMaterial('#b29a87', {
      map: oak.albedo,
      bumpMap: oak.height,
      bumpScale: 0.018,
      roughness: 0.88,
      metalness: 0,
    }),
    bronze: standardMaterial('#6f5030', { roughness: 0.48, metalness: 0.74 }),
    window: markAccent(new THREE.MeshStandardMaterial({
      color: '#d7b975',
      emissive: '#c28b42',
      emissiveIntensity: 1.25,
      roughness: 0.22,
      metalness: 0.18,
    })),
    path: standardMaterial('#d2c9b8', {
      map: path.albedo,
      bumpMap: path.height,
      bumpScale: 0.025,
      roughness: 0.96,
      metalness: 0,
    }),
    grass: standardMaterial('#17251a', { roughness: 1, metalness: 0 }),
  };
}

type AcademicBuildingKind = 'library' | 'university' | 'archive';

interface AcademicBuildingSpec {
  readonly name: string;
  readonly kind: AcademicBuildingKind;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly position: THREE.Vector3;
  readonly yaw: number;
  readonly floorY?: number;
  readonly groundY?: number;
  readonly entranceSteps?: number;
  readonly landmark?: boolean;
}

function academicBox(
  definition: DistrictDefinition,
  name: string,
  material: THREE.Material,
  scale: THREE.Vector3,
  position: THREE.Vector3,
) {
  const mesh = prepareMesh(new THREE.Mesh(academicUnitBox, material), definition.id);
  mesh.name = name;
  mesh.scale.copy(scale);
  mesh.position.copy(position);
  return mesh;
}

function setAcademicInstances(
  mesh: THREE.InstancedMesh,
  transforms: ReadonlyArray<{ position: THREE.Vector3; scale: THREE.Vector3 }>,
) {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  transforms.forEach((transform, index) => {
    matrix.compose(transform.position, quaternion, transform.scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function createAccessibleAcademicBuilding(
  definition: DistrictDefinition,
  spec: AcademicBuildingSpec,
  materials: ReturnType<typeof createAcademicMaterials>,
) {
  const building = new THREE.Group();
  const key = campusFeatureKey(spec.name).toUpperCase();
  building.name = `${definition.id}__ACADEMIC_FACILITY__${key}`;
  building.position.copy(spec.position);
  building.rotation.y = spec.yaw;

  const floorY = spec.floorY ?? 0;
  const groundY = spec.groundY ?? floorY;
  const wallThickness = 0.16;
  const doorwayWidth = THREE.MathUtils.clamp(spec.width * 0.075, 0.38, 0.56);
  const doorwayHeight = 0.38;
  const floorThickness = 0.025;
  const halfDepth = spec.depth * 0.5;
  const frontZ = spec.depth * 0.5 - wallThickness * 0.5;
  const wallCenterY = floorY + spec.height * 0.5;
  const floor = academicBox(
    definition,
    `${building.name}__WALKABLE_FLOOR`,
    materials.stone,
    new THREE.Vector3(spec.width - wallThickness * 1.5, floorThickness, spec.depth - wallThickness * 1.5),
    new THREE.Vector3(0, floorY + floorThickness * 0.5, 0),
  );
  floor.userData.walkable = true;
  building.add(floor);

  const rearWall = academicBox(
    definition,
    `${building.name}__REAR_MASONRY_WALL`,
    materials.brick,
    new THREE.Vector3(spec.width, spec.height, wallThickness),
    new THREE.Vector3(0, wallCenterY, -frontZ),
  );
  const leftWall = academicBox(
    definition,
    `${building.name}__LEFT_MASONRY_WALL`,
    materials.brick,
    new THREE.Vector3(wallThickness, spec.height, spec.depth - wallThickness * 2),
    new THREE.Vector3(-spec.width * 0.5 + wallThickness * 0.5, wallCenterY, 0),
  );
  const rightWall = leftWall.clone();
  rightWall.name = `${building.name}__RIGHT_MASONRY_WALL`;
  rightWall.position.x *= -1;
  const frontSegmentWidth = (spec.width - doorwayWidth) * 0.5;
  const frontLeft = academicBox(
    definition,
    `${building.name}__FRONT_LEFT_MASONRY_WALL`,
    materials.brick,
    new THREE.Vector3(frontSegmentWidth, spec.height, wallThickness),
    new THREE.Vector3(-(doorwayWidth + frontSegmentWidth) * 0.5, wallCenterY, frontZ),
  );
  const frontRight = frontLeft.clone();
  frontRight.name = `${building.name}__FRONT_RIGHT_MASONRY_WALL`;
  frontRight.position.x *= -1;
  const doorLintel = academicBox(
    definition,
    `${building.name}__DOOR_LINTEL`,
    materials.limestone,
    new THREE.Vector3(doorwayWidth, spec.height - doorwayHeight, wallThickness * 1.12),
    new THREE.Vector3(0, floorY + doorwayHeight + (spec.height - doorwayHeight) * 0.5, frontZ),
  );
  building.add(rearWall, leftWall, rightWall, frontLeft, frontRight, doorLintel);

  const roof = prepareMesh(new THREE.Mesh(academicGableGeometry, materials.slate), definition.id);
  roof.name = `${building.name}__STEEP_SLATE_GABLE`;
  roof.scale.set(spec.width + 0.42, 0.95 + (spec.landmark ? 0.28 : 0), spec.depth + 0.45);
  roof.position.y = floorY + spec.height;
  building.add(roof);

  for (const z of [-spec.depth * 0.5 - 0.04, spec.depth * 0.5 + 0.04]) {
    const belt = academicBox(
      definition,
      `${building.name}__LIMESTONE_STRING_COURSE`,
      materials.limestone,
      new THREE.Vector3(spec.width + 0.2, 0.1, 0.1),
      new THREE.Vector3(0, floorY + spec.height * 0.46, z),
    );
    building.add(belt);
  }

  const arch = prepareMesh(
    new THREE.Mesh(new THREE.TorusGeometry(doorwayWidth * 0.5, 0.055, 7, 20, Math.PI), materials.limestone),
    definition.id,
    false,
  );
  arch.name = `${building.name}__OPEN_STONE_DOOR_ARCH`;
  arch.position.set(0, floorY + doorwayHeight, spec.depth * 0.5 + 0.012);
  building.add(arch);
  for (const side of [-1, 1]) {
    const openDoor = academicBox(
      definition,
      `${building.name}__OPEN_OAK_DOOR`,
      materials.wood,
      new THREE.Vector3(doorwayWidth * 0.42, doorwayHeight * 0.9, 0.045),
      new THREE.Vector3(side * doorwayWidth * 0.41, floorY + doorwayHeight * 0.45, spec.depth * 0.5 + 0.11),
    );
    openDoor.rotation.y = side * 1.1;
    building.add(openDoor);
  }

  const entranceStepCount = Math.max(0, Math.floor(spec.entranceSteps ?? 0));
  const stairTreadDepth = entranceStepCount > 0 ? 0.15 : 0;
  const stairRun = entranceStepCount * stairTreadDepth;
  if (entranceStepCount > 0) {
    const floorTopY = floorY + floorThickness;
    const stepWidth = Math.max(1.1, doorwayWidth + 0.65);
    for (let index = 0; index < entranceStepCount; index += 1) {
      const stepTopY = THREE.MathUtils.lerp(groundY, floorTopY, (index + 1) / entranceStepCount);
      const stepHeight = Math.max(0.004, stepTopY - groundY);
      const step = prepareMesh(new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, stepHeight, stairTreadDepth + 0.008),
        materials.stone,
      ), definition.id);
      step.name = index === 0
        ? `${definition.id}__ACCESS_STAIRS`
        : `${building.name}__MAIN_ENTRANCE_STEP_${index + 1}`;
      step.position.set(
        0,
        groundY + stepHeight * 0.5,
        halfDepth + (entranceStepCount - index - 0.5) * stairTreadDepth,
      );
      step.userData.walkable = true;
      step.userData.academicMainStep = true;
      step.userData.stepIndex = index;
      step.userData.stepTopY = stepTopY;
      if (index === 0) step.userData.walkAccessRouteMarker = true;
      building.add(step);
    }

    const approachDepth = 0.18;
    const approach = prepareMesh(new THREE.Mesh(
      new THREE.BoxGeometry(stepWidth, 0.006, approachDepth),
      materials.path,
    ), definition.id);
    approach.name = `${definition.id}__ACCESS_APPROACH`;
    approach.position.set(0, groundY - 0.003, halfDepth + stairRun + approachDepth * 0.5);
    approach.userData.walkable = true;
    approach.userData.accessibilityLanding = true;
    approach.userData.academicMainApproach = true;
    building.add(approach);

    const accessExteriorZ = halfDepth + stairRun + approachDepth;
    const accessInteriorZ = halfDepth - 1.25;
    addNavigationAccessVolume(
      building,
      definition.id,
      stepWidth,
      2.2,
      accessExteriorZ - accessInteriorZ,
      0.85,
      (accessExteriorZ + accessInteriorZ) * 0.5,
      'district',
    );
  }

  const windowTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const frontColumns = THREE.MathUtils.clamp(Math.floor(spec.width / 1.35), 4, 9);
  const sideColumns = THREE.MathUtils.clamp(Math.floor(spec.depth / 1.5), 3, 7);
  for (let row = 0; row < 2; row += 1) {
    const y = floorY + spec.height * (0.3 + row * 0.36);
    for (let column = 0; column < frontColumns; column += 1) {
      const x = THREE.MathUtils.lerp(-spec.width * 0.4, spec.width * 0.4, frontColumns === 1 ? 0.5 : column / (frontColumns - 1));
      if (row === 0 && Math.abs(x) < doorwayWidth * 0.75) continue;
      windowTransforms.push(
        { position: new THREE.Vector3(x, y, spec.depth * 0.5 + 0.014), scale: new THREE.Vector3(0.5, 0.62, 0.035) },
        { position: new THREE.Vector3(x, y, -spec.depth * 0.5 - 0.014), scale: new THREE.Vector3(0.5, 0.62, 0.035) },
      );
    }
    for (let column = 0; column < sideColumns; column += 1) {
      const z = THREE.MathUtils.lerp(-spec.depth * 0.36, spec.depth * 0.36, sideColumns === 1 ? 0.5 : column / (sideColumns - 1));
      windowTransforms.push(
        { position: new THREE.Vector3(spec.width * 0.5 + 0.014, y, z), scale: new THREE.Vector3(0.035, 0.62, 0.5) },
        { position: new THREE.Vector3(-spec.width * 0.5 - 0.014, y, z), scale: new THREE.Vector3(0.035, 0.62, 0.5) },
      );
    }
  }
  const windows = prepareMesh(
    new THREE.InstancedMesh(academicUnitBox, materials.window, windowTransforms.length),
    definition.id,
    false,
  );
  windows.name = `${building.name}__LEADED_AMBER_WINDOWS`;
  setAcademicInstances(windows, windowTransforms);
  building.add(windows);

  const buttressTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  for (const side of [-1, 1]) {
    for (const z of [-spec.depth * 0.34, 0, spec.depth * 0.34]) {
      buttressTransforms.push({
        position: new THREE.Vector3(side * (spec.width * 0.5 + 0.1), floorY + spec.height * 0.26, z),
        scale: new THREE.Vector3(0.32, spec.height * 0.52, 0.42),
      });
    }
  }
  const buttresses = prepareMesh(
    new THREE.InstancedMesh(academicUnitBox, materials.stone, buttressTransforms.length),
    definition.id,
  );
  buttresses.name = `${building.name}__GOTHIC_BUTTRESSES`;
  setAcademicInstances(buttresses, buttressTransforms);
  building.add(buttresses);

  const chimneyTransforms = [-0.32, 0.31].map((x) => ({
    position: new THREE.Vector3(spec.width * x, floorY + spec.height + 0.75, -spec.depth * 0.22),
    scale: new THREE.Vector3(0.32, 1.5, 0.32),
  }));
  const chimneys = prepareMesh(
    new THREE.InstancedMesh(academicUnitBox, materials.brick, chimneyTransforms.length),
    definition.id,
  );
  chimneys.name = `${building.name}__BRICK_CHIMNEYS`;
  setAcademicInstances(chimneys, chimneyTransforms);
  building.add(chimneys);

  if (spec.landmark) {
    for (const side of [-1, 1]) {
      const towerHeight = spec.height + 1.75;
      const tower = academicBox(
        definition,
        `${building.name}__COLLEGIATE_TOWER`,
        materials.brick,
        new THREE.Vector3(2.15, towerHeight, 2.15),
        new THREE.Vector3(side * spec.width * 0.32, floorY + towerHeight * 0.5, -spec.depth * 0.16),
      );
      const towerRoof = prepareMesh(new THREE.Mesh(academicUnitCone, materials.slate), definition.id);
      towerRoof.name = `${building.name}__TOWER_SLATE_CAP`;
      towerRoof.scale.set(2.65, 1.4, 2.65);
      towerRoof.position.set(side * spec.width * 0.32, floorY + towerHeight + 0.7, -spec.depth * 0.16);
      building.add(tower, towerRoof);
    }
  }

  const collisionGuide = new THREE.Object3D();
  collisionGuide.name = `${building.name}__PRECISE_WALK_COLLISION`;
  const barrierY = floorY + 0.11;
  const halfWidth = spec.width * 0.5;
  collisionGuide.userData.navBarrierSegments = [
    { start: [-halfWidth, barrierY, -halfDepth], end: [halfWidth, barrierY, -halfDepth], radius: 0.055 },
    { start: [-halfWidth, barrierY, -halfDepth], end: [-halfWidth, barrierY, halfDepth], radius: 0.055 },
    { start: [halfWidth, barrierY, -halfDepth], end: [halfWidth, barrierY, halfDepth], radius: 0.055 },
    { start: [-halfWidth, barrierY, halfDepth], end: [-doorwayWidth * 0.5, barrierY, halfDepth], radius: 0.055 },
    { start: [doorwayWidth * 0.5, barrierY, halfDepth], end: [halfWidth, barrierY, halfDepth], radius: 0.055 },
  ];
  building.add(collisionGuide);

  const frontDirection = new THREE.Vector3(Math.sin(spec.yaw), 0, Math.cos(spec.yaw));
  const routeStart = spec.position.clone().addScaledVector(
    frontDirection,
    halfDepth + (entranceStepCount > 0 ? stairRun + 0.04 : 3.2),
  );
  const threshold = spec.position.clone().addScaledVector(frontDirection, halfDepth + 0.08);
  const interiorTarget = spec.position.clone().addScaledVector(frontDirection, halfDepth - 1.25);
  tagCampusFeature(building, definition, spec.name, 'building');
  building.userData.academicFacility = true;
  building.userData.academicFacilityType = spec.kind;
  building.userData.accessibleInWalk = true;
  building.userData.facilityForm = spec.kind === 'library' || spec.kind === 'archive' ? 'library' : 'administration';
  building.userData.footprint = [spec.width, spec.depth];
  building.userData.entrancePoint = threshold.toArray();
  building.userData.walkAccess = {
    accessible: true,
    buildingKind: spec.kind,
    coordinateSpace: 'district-local',
    routeStart: routeStart.toArray(),
    threshold: threshold.toArray(),
    interiorTarget: interiorTarget.toArray(),
    finishedFloorY: floorY + floorThickness,
    doorwayWidth,
    entranceStepCount,
    stairRun,
  };
  building.userData.meshArchitecture = {
    style: 'dark academia collegiate gothic',
    elements: ['umber brick', 'limestone trim', 'slate gable', 'buttresses', 'chimneys', 'leaded windows', 'open archway'],
  };
  return building;
}

function buildAcademic(group: THREE.Group, definition: DistrictDefinition, _height: number, floorY: number) {
  const [width, depth] = definition.footprint;
  const academicMaterials = createAcademicMaterials();
  const entryOutward = new THREE.Vector3(-definition.position[0], 0, -definition.position[2]);
  if (entryOutward.lengthSq() < 0.0001) entryOutward.set(0, 0, 1);
  entryOutward.normalize();
  const greatHall = createAccessibleAcademicBuilding(definition, {
    name: 'Blackwood University Great Hall',
    kind: 'university',
    width: width * 0.84,
    depth: depth * 0.76,
    height: 4.9,
    position: new THREE.Vector3(),
    yaw: Math.atan2(entryOutward.x, entryOutward.z),
    floorY,
    groundY: 0,
    entranceSteps: 4,
    landmark: true,
  }, academicMaterials);
  greatHall.userData.academicPrimary = true;
  group.add(greatHall);
  group.userData.academicMaterials = {
    brick: '#4A3028',
    stone: '#302C29',
    limestone: '#A99578',
    slate: '#171B1D',
    bronze: '#6F5030',
    windowGlow: '#D7B975',
  };
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

const campusFeatureKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function tagCampusFeature(
  object: THREE.Object3D,
  definition: DistrictDefinition,
  semanticName: string,
  role: 'building' | 'lab' | 'equipment' | 'landscape' | 'prop' | 'connector',
) {
  const featureTag = campusFeatureKey(semanticName);
  object.userData.semanticName = semanticName;
  object.userData.featureTag = featureTag;
  object.userData.featureRole = role;
  object.userData.districtId = definition.id;
  object.traverse((child) => {
    child.userData.selectableId = definition.id;
    child.userData.featureTag = featureTag;
    child.userData.featureRole = role;
    child.userData.districtId = definition.id;
  });
}

const campusUnitGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  dome: new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  sphere: new THREE.SphereGeometry(0.5, 12, 8),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  torus: new THREE.TorusGeometry(0.5, 0.12, 8, 24),
  knot: new THREE.TorusKnotGeometry(0.48, 0.12, 48, 8, 2, 3),
  octahedron: new THREE.OctahedronGeometry(0.5),
};

function createCampusFacility(
  definition: DistrictDefinition,
  name: string,
  form: CampusFacilityForm,
  width: number,
  depth: number,
  random: () => number,
  materials: ReturnType<typeof createMaterials>,
) {
  const facility = new THREE.Group();
  facility.name = `${definition.id}__FACILITY__${campusFeatureKey(name).toUpperCase()}`;
  const tallForms = new Set<CampusFacilityForm>(['arcology', 'tower', 'hotel', 'library', 'hospital', 'detector-hall']);
  const broadForms = new Set<CampusFacilityForm>(['hall', 'hangar', 'detector-hall', 'warehouse', 'transit-hub']);
  const lowForms = new Set<CampusFacilityForm>(['pavilion', 'greenhouse', 'subterranean-bunker', 'service-building']);
  const facilityHeight = tallForms.has(form)
    ? 4.6 + random() * 2.6
    : lowForms.has(form)
      ? 1.9 + random() * 1.2
      : 2.8 + random() * 1.8;
  const buildingWidth = broadForms.has(form) ? width * 1.12 : width;
  const buildingDepth = broadForms.has(form) ? depth * 1.08 : depth;
  const geometry = form === 'observatory'
    ? campusUnitGeometries.dome
    : form === 'subterranean-bunker' || form === 'utility-plant'
      ? campusUnitGeometries.cylinder
      : campusUnitGeometries.box;
  const material = form === 'greenhouse' || form === 'observatory'
    ? materials.glass
    : form === 'subterranean-bunker'
      ? materials.dark
      : form === 'pavilion' || form === 'studio'
        ? materials.accent
        : materials.body;
  const body = prepareMesh(new THREE.Mesh(geometry, material), definition.id, false);
  body.receiveShadow = true;
  body.name = `${facility.name}__PRIMARY_VOLUME`;
  body.scale.set(buildingWidth, facilityHeight, buildingDepth);
  body.position.y = facilityHeight * 0.5;
  body.userData.navObstacle = true;
  facility.add(body);
  const role = /lab|research|clinical|diagnostic|sequenc|analysis|science|biology|chemistry|forensic|accelerator/i.test(name)
    ? 'lab'
    : 'building';
  tagCampusFeature(facility, definition, name, role);
  facility.userData.facilityForm = form;
  facility.userData.footprint = [buildingWidth, buildingDepth];
  facility.userData.facilityHeight = facilityHeight;
  return facility;
}

function createCampusObject(
  definition: DistrictDefinition,
  name: string,
  kind: CampusObjectKind,
  materials: ReturnType<typeof createMaterials>,
) {
  const object = new THREE.Group();
  object.name = `${definition.id}__OBJECT__${campusFeatureKey(name).toUpperCase()}`;
  let geometry: THREE.BufferGeometry = campusUnitGeometries.octahedron;
  let material: THREE.Material = materials.accent;
  const scale = new THREE.Vector3(1, 1, 1);
  let height = 1;
  let rotationX = 0;
  if (kind === 'process-equipment' || kind === 'storage') {
    geometry = campusUnitGeometries.cylinder;
    material = materials.metal;
    scale.set(1.1, 1.8, 1.1);
    height = 1.8;
  } else if (kind === 'robot' || kind === 'public-art') {
    geometry = campusUnitGeometries.knot;
    scale.setScalar(kind === 'public-art' ? 1.45 : 1.05);
    height = kind === 'public-art' ? 1.5 : 1.15;
  } else if (kind === 'vehicle' || kind === 'cargo') {
    geometry = campusUnitGeometries.box;
    material = kind === 'cargo' ? materials.metal : materials.body;
    scale.set(1.9, 0.58, 0.95);
    height = 0.58;
  } else if (kind === 'gantry' || kind === 'medical-equipment') {
    geometry = campusUnitGeometries.torus;
    scale.set(1.7, 1.7, 1.15);
    height = 1.75;
  } else if (kind === 'antenna') {
    geometry = campusUnitGeometries.cone;
    material = materials.metal;
    scale.set(0.55, 2.6, 0.55);
    height = 2.6;
  } else if (kind === 'garden' || kind === 'habitat' || kind === 'water-feature') {
    geometry = campusUnitGeometries.cylinder;
    material = kind === 'water-feature' ? materials.glass : materials.accent;
    scale.set(2.35, 0.12, 2.35);
    height = 0.12;
  } else if (kind === 'energy-system') {
    geometry = campusUnitGeometries.box;
    material = materials.glass;
    scale.set(2.4, 0.12, 1.45);
    height = 0.42;
    rotationX = 0.34;
  } else if (kind === 'security' || kind === 'drone') {
    geometry = campusUnitGeometries.octahedron;
    material = kind === 'security' ? materials.metal : materials.accent;
    scale.setScalar(kind === 'drone' ? 1.15 : 1.35);
    height = kind === 'drone' ? 1.55 : 0.9;
  } else if (kind === 'street-furniture' || kind === 'signage') {
    geometry = campusUnitGeometries.box;
    material = materials.accent;
    scale.set(0.65, 1.25, 0.28);
    height = 1.25;
  }
  const mesh = prepareMesh(new THREE.Mesh(geometry, material), definition.id, false);
  mesh.receiveShadow = true;
  mesh.name = `${object.name}__SYMBOL`;
  mesh.scale.copy(scale);
  mesh.position.y = height * 0.5;
  mesh.rotation.x = rotationX;
  mesh.userData.navObstacle = height > 0.35;
  object.add(mesh);
  const role = kind === 'garden' || kind === 'habitat' || kind === 'water-feature'
    ? 'landscape'
    : kind === 'street-furniture' || kind === 'signage'
      ? 'prop'
      : 'equipment';
  tagCampusFeature(object, definition, name, role);
  object.userData.objectKind = kind;
  return object;
}

function addCampusRoad(
  group: THREE.Group,
  definition: DistrictDefinition,
  startPosition: THREE.Vector3,
  end: THREE.Vector3,
  index: number,
  material: THREE.Material,
  startClearance = 0,
  endClearance = 0,
  width = 0.62,
  thickness = 0.032,
) {
  const fullDelta = end.clone().sub(startPosition);
  const fullLength = fullDelta.length();
  if (fullLength < 1.4) return;
  const direction = fullDelta.normalize();
  const availableClearance = Math.max(0, fullLength - 0.6);
  const clearanceScale = Math.min(1, availableClearance / Math.max(0.001, startClearance + endClearance));
  const start = startPosition.clone().addScaledVector(direction, startClearance * clearanceScale);
  const roadEnd = end.clone().addScaledVector(direction, -endClearance * clearanceScale);
  const delta = roadEnd.clone().sub(start);
  if (delta.length() < 0.5) return;
  const roadGeometry = new THREE.BoxGeometry(width, thickness, delta.length());
  if (definition.id === 'academic-libraries-theoretical-labs') {
    tileAcademicPathGeometry(roadGeometry);
  }
  const connector = prepareMesh(new THREE.Mesh(
    roadGeometry,
    material,
  ), definition.id, false);
  connector.name = `${definition.id}__LOCAL_CAMPUS_ROAD_${index + 1}`;
  connector.position.copy(start).add(roadEnd).multiplyScalar(0.5);
  connector.position.y = thickness * 0.5;
  connector.rotation.y = Math.atan2(delta.x, delta.z);
  connector.userData.walkable = true;
  connector.userData.crossDistrictConnector = false;
  connector.userData.localCampusRoad = true;
  connector.userData.roadEndpoints = {
    start: start.toArray(),
    end: roadEnd.toArray(),
  };
  tagCampusFeature(connector, definition, `Local campus road ${index + 1}`, 'connector');
  group.add(connector);
}

function setSectorAnchor(
  object: THREE.Object3D,
  definition: DistrictDefinition,
  worldPosition: THREE.Vector3,
) {
  const sector = definition.sector!;
  const radialSpan = sector.outerRadius - sector.innerRadius;
  const span = sector.endAngle - sector.startAngle;
  const radius = Math.hypot(worldPosition.x, worldPosition.z);
  const rawAngle = Math.atan2(worldPosition.z, worldPosition.x);
  const angle = sector.centerAngle + Math.atan2(
    Math.sin(rawAngle - sector.centerAngle),
    Math.cos(rawAngle - sector.centerAngle),
  );
  object.userData.sectorAnchor = {
    radius,
    angle,
    normalizedRadial: (radius - sector.innerRadius) / radialSpan,
    normalizedAngular: (angle - sector.startAngle) / span,
  };
}

function createAcademicLandscape(
  definition: DistrictDefinition,
  name: string,
  position: THREE.Vector3,
  radius: number,
  variant: number,
  materials: ReturnType<typeof createAcademicMaterials>,
) {
  const landscape = new THREE.Group();
  landscape.name = `${definition.id}__ACADEMIC_PARK__${campusFeatureKey(name).toUpperCase()}`;
  landscape.position.copy(position);
  const isFountainCourt = name === ACADEMIC_FOUNTAIN_COURT_NAME;
  const planted = variant <= 2;
  const groundGeometry = isFountainCourt
    ? new THREE.RingGeometry(1.62, radius, 64)
    : new THREE.CircleGeometry(radius, 32);
  const ground = prepareMesh(
    new THREE.Mesh(groundGeometry, planted ? materials.grass : materials.path),
    definition.id,
    false,
  );
  ground.name = `${landscape.name}__${planted ? 'PLANTED_LAWN' : 'LEAF_EARTH_COURT'}`;
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.004;
  ground.userData.walkable = true;
  landscape.add(ground);

  // Circulation is authored once from the real building thresholds. The old
  // pair of decorative cross strips in every circular park produced isolated
  // paths that appeared to begin and end at random points in the lawn.
  landscape.userData.decorativeCrossPathsRemoved = true;

  // Mount the monument by semantic identity rather than the object's array
  // index. The photographed target is the former Gaslight Reading Court; the
  // old variant-3 mount silently put the fountain in the adjacent brown court.
  if (isFountainCourt) {
    const fountain = createAcademicGothicFountain(definition.id);
    fountain.position.y = 0.004;
    landscape.add(fountain);
    landscape.userData.academicFountain = fountain.userData.academicFountain;
    landscape.userData.academicFountainState = fountain.userData.academicFountainState;
  }

  // The district extension consumes these anchors and renders all park and
  // avenue benches through one human-scale vintage instancing kit. Keeping
  // anchors here preserves the editable park layout without the old 12 m
  // single-block benches.
  const benchAnchorRatios = variant === 0
    ? [[-0.54, -0.42], [-0.54, 0.42], [1.04, -0.42], [1.04, 0.42]]
    : variant === 1
      ? [[-0.54, -0.38], [-0.54, 0.42], [0.54, -0.42], [0.54, 0.42]]
      : isFountainCourt
        ? [[-0.46875, -0.3125], [-0.54, 0.42], [0.54, -0.68], [0.54, 0.42]]
        : [-0.54, 0.54].flatMap((x) => [-0.42, 0.42].map((z) => [x, z]));
  landscape.userData.academicBenchAnchors = benchAnchorRatios.map(([x, z]) => [x * radius, 0, z * radius]);

  tagCampusFeature(landscape, definition, name, 'landscape');
  landscape.userData.academicPark = true;
  landscape.userData.treeFreeAcademicLandscape = true;
  landscape.userData.landscapeType = isFountainCourt ? 'monumental fountain court' : variant >= 3 ? 'reading court' : 'scholarly park';
  landscape.userData.footprint = [radius * 2, radius * 2];
  return landscape;
}

function populateAcademicPrecinct(
  group: THREE.Group,
  definition: DistrictDefinition,
  plan: (typeof DISTRICT_CAMPUS_PLANS)['academic-libraries-theoretical-labs'],
  campusCenter: THREE.Vector3,
  radialDirection: THREE.Vector3,
  tangentDirection: THREE.Vector3,
  radialSpan: number,
  tangentialSpan: number,
) {
  const materials = createAcademicMaterials();
  const localHub = campusCenter.clone().sub(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
  const facilityLayout = [
    { tangent: -0.62, radial: -0.58, width: 12.8, depth: 8.5, height: 4.8, kind: 'library' as const, landmark: true },
    { tangent: 0.58, radial: -0.72, width: 10.4, depth: 7.2, height: 4.4, kind: 'library' as const },
    { tangent: -0.78, radial: 0.45, width: 11.8, depth: 8, height: 5.1, kind: 'university' as const, landmark: true },
    { tangent: 0.72, radial: 0.58, width: 13, depth: 8.8, height: 4.6, kind: 'university' as const },
    { tangent: 0.06, radial: 0.94, width: 11, depth: 7.5, height: 3.8, kind: 'library' as const },
  ];
  const academicBuildings: THREE.Group[] = [];
  plan.facilities.forEach((facilityPlan, index) => {
    const layout = facilityLayout[index];
    const worldPosition = campusCenter.clone()
      .addScaledVector(tangentDirection, layout.tangent * tangentialSpan)
      .addScaledVector(radialDirection, layout.radial * radialSpan);
    const localPosition = worldPosition.clone().sub(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    const facing = localHub.clone().sub(localPosition).setY(0).normalize();
    const building = createAccessibleAcademicBuilding(definition, {
      name: facilityPlan.name,
      kind: layout.kind,
      width: layout.width,
      depth: layout.depth,
      height: layout.height,
      position: localPosition,
      yaw: Math.atan2(facing.x, facing.z),
      landmark: layout.landmark,
    }, materials);
    setSectorAnchor(building, definition, worldPosition);
    group.add(building);
    academicBuildings.push(building);
  });

  const parkLayout = [
    { tangent: 0.02, radial: -0.05, radius: 5.3 },
    { tangent: 0.38, radial: 0.03, radius: 4.1 },
    { tangent: -0.39, radial: -0.02, radius: 3.8 },
    { tangent: 0.04, radial: 0.47, radius: 3.2 },
    { tangent: -0.02, radial: -0.5, radius: 3.4 },
  ];
  const academicParks: THREE.Group[] = [];
  plan.objects.forEach((objectPlan, index) => {
    const layout = parkLayout[index];
    const worldPosition = campusCenter.clone()
      .addScaledVector(tangentDirection, layout.tangent * tangentialSpan)
      .addScaledVector(radialDirection, layout.radial * radialSpan);
    const localPosition = worldPosition.clone().sub(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    const park = createAcademicLandscape(definition, objectPlan.name, localPosition, layout.radius, index, materials);
    setSectorAnchor(park, definition, worldPosition);
    group.add(park);
    academicParks.push(park);
  });

  const primary = group.children.find((child) => child.userData.academicPrimary) as THREE.Group | undefined;
  let roadIndex = 0;

  const primaryName = primary?.userData.semanticName ?? 'Blackwood University Great Hall';
  const existingAcademicBuildings = primary ? [primary, ...academicBuildings] : academicBuildings;
  enrichExistingAcademicBuildings(existingAcademicBuildings, definition.id);
  const extension = buildAcademicDistrictExtension(
    definition,
    group,
    localHub,
    tangentDirection,
    radialDirection,
  );
  extension.facilities.forEach((building) => {
    const worldPosition = building.position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    setSectorAnchor(building, definition, worldPosition);
  });
  roadIndex += extension.localRoads.length;
  const allAcademicBuildings = [...existingAcademicBuildings, ...extension.facilities];
  const buildingNames = allAcademicBuildings.map((building) => building.userData.semanticName as string);
  const libraryNames = allAcademicBuildings
    .filter((building) => ['library', 'archive'].includes(building.userData.academicFacilityType))
    .map((building) => building.userData.semanticName as string);
  const universityNames = allAcademicBuildings
    .filter((building) => building.userData.academicFacilityType === 'university')
    .map((building) => building.userData.semanticName as string);
  group.userData.academicPrecinct = {
    style: 'dark academia collegiate gothic campus',
    primaryUniversity: primaryName,
    buildingNames,
    libraryNames,
    universityNames,
    parkNames: academicParks.map((park) => park.userData.semanticName as string),
    accessibleBuildingCount: allAcademicBuildings.filter((building) => building.userData.accessibleInWalk).length,
    roadCount: roadIndex,
    architecture: ['English Gothic', 'Collegiate Gothic', 'Neo-Gothic repairs', 'medieval cloisters', 'Victorian interiors', 'restrained Baroque additions'],
    zones: group.userData.academicComponentHierarchy,
    hiddenDiscoveries: group.getObjectByName(`${definition.id}__ACADEMIC_ZONE__HIDDEN_DISCOVERIES`)?.userData.discoveries ?? [],
    accessibleInteriors: ['Ashcroft Grand Library entrance hall', 'Founders Dining Hall', 'St Anselm Chapel nave'],
  };
  group.userData.interactions = [
    'inspect entrance',
    'open main gate',
    'ring chapel bell',
    'toggle reading-room lights',
    'campus map',
  ];
  group.userData.population = {
    plannedFacilities: buildingNames,
    plannedObjects: plan.objects.map((object) => object.name),
    realizedFeatureTags: [...buildingNames, ...academicParks.map((park) => park.userData.semanticName as string)].map(campusFeatureKey),
    realizedFacilityCount: allAcademicBuildings.length,
    realizedObjectCount: academicParks.length + extension.features.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: roadIndex,
    radialCoverage: 0.72,
    angularCoverage: 0.82,
    darkAcademia: true,
    walkAccessibleAcademicBuildings: allAcademicBuildings.length,
  };
}

function populateDistrictSectorCampus(group: THREE.Group, definition: DistrictDefinition, random: () => number) {
  const sector = definition.sector;
  const plan = DISTRICT_CAMPUS_PLANS[definition.id as keyof typeof DISTRICT_CAMPUS_PLANS];
  if (!sector || !plan) return;

  const span = sector.endAngle - sector.startAngle;
  const radialSpan = sector.outerRadius - sector.innerRadius;
  const integratedCore = definition.ring === 'core';
  const boundaryIds = {
    rings: [`RING_${sector.innerRadius.toFixed(3)}`, `RING_${sector.outerRadius.toFixed(3)}`],
    radial: [
      `RADIAL_${sector.startAngle.toFixed(6)}`,
      `RADIAL_${sector.endAngle.toFixed(6)}`,
    ],
  };
  group.userData.districtCell = {
    ...sector,
    angleSpan: span,
    radialSpan,
    boundaryIds,
    integratedCore,
    visibleBoundaryOverlay: false,
    delimiters: 'shared concentric ring roads and six radial dome roads',
    boundedByTwoRadialLines: true,
    boundedByTwoConcentricCircles: true,
  };

  if (definition.id === 'industrial-labs') {
    group.traverse((child) => {
      if (!child.name.startsWith('INDUSTRIAL__')) return;
      child.userData.featureRole ??= 'building';
      child.userData.featureTag ??= campusFeatureKey(child.name.replace(/^INDUSTRIAL__/, ''));
      child.userData.districtId = definition.id;
    });
    group.userData.population = {
      plannedFacilities: plan.facilities.map((facility) => facility.name),
      plannedObjects: plan.objects.map((object) => object.name),
      realizedFacilityCount: 12,
      realizedObjectCount: 32,
      existingRichCampus: true,
      distinct: true,
    };
    return;
  }

  const materials = createMaterials(definition);
  const campusCenter = integratedCore
    ? new THREE.Vector3(
        Math.cos(sector.centerAngle) * (sector.innerRadius + sector.outerRadius) * 0.5,
        0,
        Math.sin(sector.centerAngle) * (sector.innerRadius + sector.outerRadius) * 0.5,
      )
    : new THREE.Vector3(definition.position[0], 0, definition.position[2]);
  const anchorRadius = Math.hypot(campusCenter.x, campusCenter.z);
  const anchorAngle = anchorRadius > 0.001
    ? Math.atan2(campusCenter.z, campusCenter.x)
    : sector.centerAngle;
  const radialDirection = new THREE.Vector3(Math.cos(anchorAngle), 0, Math.sin(anchorAngle));
  const tangentDirection = new THREE.Vector3(-Math.sin(anchorAngle), 0, Math.cos(anchorAngle));
  const clusterRadialSpan = THREE.MathUtils.clamp(radialSpan * 0.36, 12, 26);
  const clusterTangentialSpan = THREE.MathUtils.clamp(
    Math.max(anchorRadius, (sector.innerRadius + sector.outerRadius) * 0.5) * Math.sin(span * 0.5) * 0.58,
    16,
    34,
  );

  if (definition.id === 'academic-libraries-theoretical-labs') {
    populateAcademicPrecinct(
      group,
      definition,
      plan as (typeof DISTRICT_CAMPUS_PLANS)['academic-libraries-theoretical-labs'],
      campusCenter,
      radialDirection,
      tangentDirection,
      clusterRadialSpan,
      clusterTangentialSpan,
    );
    return;
  }

  const facilitySlots: ReadonlyArray<readonly [number, number]> = [
    [-0.8, -0.42],
    [0.28, -0.86],
    [0.86, 0.18],
    [-0.2, 0.86],
  ];
  const realizedTags: string[] = [];
  const localCampusHub = campusCenter.clone().sub(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
  const facilityAnchors: Array<{
    name: string;
    position: THREE.Vector3;
    entrance: THREE.Vector3;
    footprint: readonly [number, number];
  }> = [];
  plan.facilities.forEach((facilityPlan, index) => {
    const [tangentialT, radialT] = facilitySlots[index % facilitySlots.length];
    const worldPosition = campusCenter.clone()
      .addScaledVector(tangentDirection, tangentialT * clusterTangentialSpan)
      .addScaledVector(radialDirection, radialT * clusterRadialSpan);
    const radius = Math.hypot(worldPosition.x, worldPosition.z);
    const rawAngle = Math.atan2(worldPosition.z, worldPosition.x);
    const angle = sector.centerAngle + Math.atan2(
      Math.sin(rawAngle - sector.centerAngle),
      Math.cos(rawAngle - sector.centerAngle),
    );
    const arcWidth = Math.max(8, Math.max(anchorRadius, radius) * span);
    const facilityWidth = THREE.MathUtils.clamp(arcWidth * 0.105, 5.5, 12.5);
    const facilityDepth = THREE.MathUtils.clamp(radialSpan * 0.13, 4.2, 8.2);
    const facility = createCampusFacility(
      definition,
      facilityPlan.name,
      facilityPlan.form,
      facilityWidth,
      facilityDepth,
      random,
      materials,
    );
    facility.position.set(
      worldPosition.x - definition.position[0],
      0,
      worldPosition.z - definition.position[2],
    );
    const facing = localCampusHub.clone().sub(facility.position).setY(0);
    if (facing.lengthSq() < 0.001) facing.copy(radialDirection).negate();
    facing.normalize();
    facility.rotation.y = Math.atan2(facing.x, facing.z);
    facility.userData.sectorAnchor = {
      radius,
      angle,
      normalizedRadial: (radius - sector.innerRadius) / radialSpan,
      normalizedAngular: (angle - sector.startAngle) / span,
    };
    group.add(facility);
    const [buildingWidth, buildingDepth] = facility.userData.footprint as [number, number];
    const entrance = facility.position.clone().addScaledVector(facing, buildingDepth * 0.5 + 0.78);
    facility.userData.entrancePoint = entrance.toArray();
    facilityAnchors.push({
      name: facilityPlan.name,
      position: facility.position.clone(),
      entrance,
      footprint: [buildingWidth, buildingDepth],
    });
    realizedTags.push(campusFeatureKey(facilityPlan.name));
  });

  const objectSlots: ReadonlyArray<readonly [number, number]> = [
    [-0.96, 0.28],
    [0.54, -0.94],
    [0.98, -0.16],
    [-0.46, 0.96],
    [0.14, 0.14],
  ];
  plan.objects.forEach((objectPlan, index) => {
    const [tangentialT, radialT] = objectSlots[index % objectSlots.length];
    const worldPosition = campusCenter.clone()
      .addScaledVector(tangentDirection, tangentialT * clusterTangentialSpan * 1.08)
      .addScaledVector(radialDirection, radialT * clusterRadialSpan * 1.08);
    const radius = Math.hypot(worldPosition.x, worldPosition.z);
    const rawAngle = Math.atan2(worldPosition.z, worldPosition.x);
    const angle = sector.centerAngle + Math.atan2(
      Math.sin(rawAngle - sector.centerAngle),
      Math.cos(rawAngle - sector.centerAngle),
    );
    const object = createCampusObject(definition, objectPlan.name, objectPlan.kind, materials);
    object.position.set(
      worldPosition.x - definition.position[0],
      0,
      worldPosition.z - definition.position[2],
    );
    object.rotation.y = -angle - Math.PI / 2;
    object.userData.sectorAnchor = {
      radius,
      angle,
      normalizedRadial: (radius - sector.innerRadius) / radialSpan,
      normalizedAngular: (angle - sector.startAngle) / span,
    };
    group.add(object);
    realizedTags.push(campusFeatureKey(objectPlan.name));
  });

  const campusRoadMaterial = standardMaterial('#626a6c', { roughness: 0.96, metalness: 0.02 });
  facilityAnchors.forEach((anchor, index) => {
    const delta = anchor.entrance.clone().sub(localCampusHub);
    const direction = delta.clone().normalize();
    const projectedMainClearance = integratedCore
      ? 0.4
      : Math.min(
          Math.abs(direction.x) > 0.001 ? definition.footprint[0] * 0.5 / Math.abs(direction.x) : Number.POSITIVE_INFINITY,
          Math.abs(direction.z) > 0.001 ? definition.footprint[1] * 0.5 / Math.abs(direction.z) : Number.POSITIVE_INFINITY,
        ) + 0.72;
    addCampusRoad(
      group,
      definition,
      localCampusHub,
      anchor.entrance,
      index,
      campusRoadMaterial,
      projectedMainClearance,
      0.08,
      0.72,
    );
  });
  group.userData.population = {
    plannedFacilities: plan.facilities.map((facility) => facility.name),
    plannedObjects: plan.objects.map((object) => object.name),
    realizedFeatureTags: realizedTags,
    realizedFacilityCount: plan.facilities.length,
    realizedObjectCount: plan.objects.length,
    distinct: new Set(realizedTags).size === realizedTags.length,
    asymmetricCampus: true,
    localRoadCount: facilityAnchors.length,
    radialCoverage: 0.64,
    angularCoverage: 0.72,
  };
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
  const isIndustrialDistrict = definition.id === 'industrial-labs';
  const isAcademicDistrict = definition.id === 'academic-libraries-theoretical-labs';
  const finishedFloorY = isIndustrialDistrict
    ? metresToWorldUnits(0.18)
    : isAcademicDistrict
      ? ACADEMIC_FINISHED_FLOOR_Y
      : DISTRICT_FINISHED_FLOOR_Y;
  const accessRampLength = isIndustrialDistrict
    ? metresToWorldUnits(2.4)
    : isAcademicDistrict
      ? metresToWorldUnits(4)
      : DISTRICT_ACCESS_RAMP_LENGTH;
  const foundationTexture = makeConcreteTexture();
  const academicGroundTexture = isAcademicDistrict ? makeGroundTexture('#303b2f') : null;
  const plotMaterial = isAcademicDistrict
    ? physicalMaterial('#d0d4cb', {
      map: academicGroundTexture,
      bumpMap: academicGroundTexture,
      bumpScale: 0.012,
      roughness: 0.98,
      metalness: 0,
      clearcoat: 0,
    })
    : physicalMaterial(definition.palette[0], {
      map: foundationTexture,
      bumpMap: foundationTexture,
      bumpScale: 0.014,
      roughness: 0.7,
      metalness: 0.12,
    });
  if (isAcademicDistrict) plotMaterial.name = 'Academic ground-level lawn datum';
  // A shallow RoundedBoxGeometry does not retain its requested vertical
  // extent at these wide aspect ratios. Use a structural box for the plinth so
  // the visible/collision volume really runs from terrain to finished floor.
  const plot = prepareMesh(
    new THREE.Mesh(new THREE.BoxGeometry(width, finishedFloorY, depth), plotMaterial),
    definition.id,
  );
  plot.position.y = finishedFloorY * 0.5;
  plot.name = `${definition.id}__PLOT`;
  plot.receiveShadow = true;
  plot.userData.walkable = true;
  // The industrial parcel is a curb-height paved yard, not a walled plinth.
  // Its actual buildings remain collision obstacles, while the slab can be
  // approached from every side at normal walking step height.
  plot.userData.navObstacle = !isIndustrialDistrict && !isAcademicDistrict;
  plot.userData.solidFoundation = true;
  if (isAcademicDistrict) plot.userData.academicGroundDatum = true;
  group.add(plot);
  if (!isAcademicDistrict) {
    addAccessRamp(
      group,
      definition.id,
      width,
      depth,
      finishedFloorY,
      accessRampLength,
      plotMaterial,
      depth * 0.5 - 0.04,
    );
  }

  const inset = new THREE.LineSegments(
    new THREE.EdgesGeometry(new RoundedBoxGeometry(width * 0.95, finishedFloorY, depth * 0.95, 2, Math.min(0.26, finishedFloorY * 0.4))),
    new THREE.LineBasicMaterial({ color: definition.accent, transparent: true, opacity: 0.35 }),
  );
  inset.position.y = finishedFloorY * 0.5;
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
      if (definition.id === 'industrial-labs') buildIndustrialDistrict(group, definition);
      else buildInfrastructure(group, definition, height);
      break;
    case 'academic':
      buildAcademic(group, definition, height, finishedFloorY);
      break;
    case 'environmental':
      buildEnvironmental(group, definition, height);
      break;
  }

  if (!isAcademicDistrict) {
    addDistrictWalkPortal(group, definition.id, width, depth, definition.accent, finishedFloorY, accessRampLength);
  }
  if (definition.id === 'academic-libraries-theoretical-labs') {
    const academicPrimaryAccess = group.getObjectByName(`${definition.id}__DISTRICT_ACCESS_VOLUME`);
    if (academicPrimaryAccess) {
      academicPrimaryAccess.userData.academicAccess = true;
      academicPrimaryAccess.userData.servesFacility = 'Blackwood University Great Hall';
    }
  }
  if (definition.id !== 'industrial-labs') addDistrictSignature(group, definition, height, random);
  populateDistrictSectorCampus(group, definition, random);
  addCyberpunkDistrictLife(group, definition, height);

  const lampAccent = markAccent(
    new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 3 }),
  );
  if (definition.id !== 'industrial-labs') {
    addLamp(group, definition.id, -width * 0.43, -depth * 0.41, lampAccent);
    addLamp(group, definition.id, width * 0.43, depth * 0.41, lampAccent);
  }

  group.traverse((child) => {
    child.userData.selectableId = definition.id;
  });

  return {
    group,
    labelHeight: definition.id === 'industrial-labs'
      ? 8.15
      : 2.3 + height * (definition.category === 'core' ? 1.4 : 1.02),
  };
}

function biomeMaterial(palette: readonly string[], index: number, overrides: THREE.MeshStandardMaterialParameters = {}) {
  return standardMaterial(palette[index % palette.length], { roughness: 0.86, metalness: 0.03, ...overrides });
}

function addConifer(group: THREE.Group, id: string, x: number, z: number, scale: number, snowy = false, groundY = DOME_FINISHED_FLOOR_Y) {
  const trunkHeight = 0.45 * scale;
  const foliageHeight = 0.75 * scale;
  const trunk = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.45 * scale, 6), standardMaterial('#3d3027')), id);
  trunk.position.set(x, groundY + trunkHeight * 0.5, z);
  trunk.name = `${id}__ALPINE_CONIFER_TRUNK`;
  const foliage = prepareMesh(
    new THREE.Mesh(new THREE.ConeGeometry(0.25 * scale, 0.75 * scale, 8), standardMaterial(snowy ? '#a7c1c0' : '#1f4b36', { roughness: 0.95 })),
    id,
  );
  foliage.position.set(x, groundY + trunkHeight * 0.72 + foliageHeight * 0.5, z);
  foliage.name = `${id}__ALPINE_CONIFER_CANOPY`;
  group.add(trunk, foliage);
}

function addCactus(group: THREE.Group, id: string, x: number, z: number, scale: number, groundY = DOME_FINISHED_FLOOR_Y) {
  const material = standardMaterial('#3f7049', { roughness: 0.9 });
  const stemHeight = 0.9 * scale;
  const stem = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.11 * scale, stemHeight, 8), material), id);
  stem.position.set(x, groundY + stemHeight * 0.5, z);
  stem.name = `${id}__DESERT_XEROPHYTE_CACTUS`;
  group.add(stem);
  for (const direction of [-1, 1]) {
    const arm = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.045 * scale, 0.06 * scale, 0.4 * scale, 7), material), id);
    arm.position.set(x + direction * 0.13 * scale, groundY + stemHeight * 0.68, z);
    arm.rotation.z = direction * 55 * DEG;
    arm.name = `${id}__DESERT_XEROPHYTE_ARM`;
    group.add(arm);
  }
}

function addAcacia(group: THREE.Group, id: string, x: number, z: number, scale: number, groundY = DOME_FINISHED_FLOOR_Y) {
  const trunkHeight = 0.7 * scale;
  const trunk = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, trunkHeight, 7), standardMaterial('#493722')), id);
  trunk.position.set(x, groundY + trunkHeight * 0.5, z);
  trunk.name = `${id}__SAVANNA_ACACIA_TRUNK`;
  const crown = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 12, 7), standardMaterial('#4e6731', { roughness: 0.92 })), id);
  crown.scale.set(1.55, 0.35, 1);
  crown.position.set(x, groundY + trunkHeight + 0.24 * scale, z);
  crown.name = `${id}__SAVANNA_ACACIA_CANOPY`;
  group.add(trunk, crown);
}

function buildFuturisticTropicalBiodome(
  group: THREE.Group,
  definition: BiomeDefinition,
  radius: number,
  depth: number,
  width: number,
  random: () => number,
  floorY: number,
) {
  const usableRadius = radius * 0.78;
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
    navBarrier = false,
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
    if (navBarrier) {
      mesh.userData.navBarrierSegments = [{
        start: start.toArray(),
        end: end.toArray(),
        radius: radiusValue,
      }];
    }
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

  const makeContinuousRailPath = (
    centerline: readonly THREE.Vector3[],
    offsetDistance: number,
  ) => centerline.map((point, index) => {
    const previous = centerline[Math.max(0, index - 1)];
    const next = centerline[Math.min(centerline.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0).normalize();
    const perpendicular = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return point.clone().addScaledVector(perpendicular, offsetDistance);
  });

  type CircularRailOpening = { centerAngle: number; halfAngle: number };
  const normalizeAngle = (angle: number) => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const circularAngleDistance = (a: number, b: number) => {
    const difference = Math.abs(normalizeAngle(a) - normalizeAngle(b));
    return Math.min(difference, Math.PI * 2 - difference);
  };
  const isInsideRailOpening = (angle: number, openings: readonly CircularRailOpening[]) => (
    openings.some((opening) => circularAngleDistance(angle, opening.centerAngle) <= opening.halfAngle)
  );
  const addCircularGuardrail = (
    parent: THREE.Object3D,
    center: THREE.Vector3,
    radius: number,
    railY: number,
    openings: readonly CircularRailOpening[],
    name: string,
  ) => {
    const openingIntervals: Array<[number, number]> = [];
    openings.forEach((opening) => {
      const start = normalizeAngle(opening.centerAngle - opening.halfAngle);
      const end = normalizeAngle(opening.centerAngle + opening.halfAngle);
      if (start <= end) openingIntervals.push([start, end]);
      else openingIntervals.push([0, end], [start, Math.PI * 2]);
    });
    openingIntervals.sort((a, b) => a[0] - b[0]);
    const mergedOpenings: Array<[number, number]> = [];
    openingIntervals.forEach(([start, end]) => {
      const previous = mergedOpenings[mergedOpenings.length - 1];
      if (previous && start <= previous[1] + 0.001) previous[1] = Math.max(previous[1], end);
      else mergedOpenings.push([start, end]);
    });
    const railIntervals: Array<[number, number]> = [];
    let cursor = 0;
    mergedOpenings.forEach(([start, end]) => {
      if (start - cursor > 0.04) railIntervals.push([cursor, start]);
      cursor = Math.max(cursor, end);
    });
    if (Math.PI * 2 - cursor > 0.04) railIntervals.push([cursor, Math.PI * 2]);
    railIntervals.forEach(([start, end], index) => {
      const arc = end - start;
      const pointCount = Math.max(5, Math.ceil((arc / (Math.PI * 2)) * 48));
      const points = Array.from({ length: pointCount + 1 }, (_, pointIndex) => {
        const angle = THREE.MathUtils.lerp(start, end, pointIndex / pointCount);
        return new THREE.Vector3(
          center.x + Math.cos(angle) * radius,
          railY,
          center.z + Math.sin(angle) * radius,
        );
      });
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
      const rail = prepareMesh(
        new THREE.Mesh(new THREE.TubeGeometry(curve, pointCount * 2, HUMAN_HANDRAIL_RADIUS, 8, false), railMaterial),
        definition.id,
        false,
      );
      rail.name = name;
      rail.userData.circularRailArc = index + 1;
      rail.userData.navBarrierSegments = points.slice(1).map((point, pointIndex) => ({
        start: points[pointIndex].toArray(),
        end: point.toArray(),
        radius: HUMAN_HANDRAIL_RADIUS,
      }));
      parent.add(rail);
    });
    return railIntervals.length;
  };

  // A continuous timber-and-alloy visitor route climbs from the airlock to the waterfall.
  const observationDeckCenterY = 4.35;
  const researchPlatformCenterY = 5.15;
  const deckPosition = new THREE.Vector3(-5.3, observationDeckCenterY, -8.0);
  const deckRadius = 1.45;
  const deckRailRadius = 1.39;
  const canopyDeckApproachDirection = new THREE.Vector3(-1, 0, -0.25).normalize();
  const canopyDeckApproach = deckPosition.clone()
    .addScaledVector(canopyDeckApproachDirection, deckRadius - 0.11);
  const canopyEntryCenterY = floorY
    + metresToWorldUnits(0.16)
    - TROPICAL_CANOPY_DECK_THICKNESS * 0.5;
  const observationDeckConnectionY = observationDeckCenterY
    + TROPICAL_PLATFORM_THICKNESS * 0.5
    - TROPICAL_CANOPY_DECK_THICKNESS * 0.5;
  const routeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, canopyEntryCenterY, 11.4),
    new THREE.Vector3(-7.2, 1.05, 9.0),
    new THREE.Vector3(-10.1, 2.1, 4.2),
    new THREE.Vector3(-10.4, 3.0, -1.8),
    new THREE.Vector3(-8.4, 3.8, -6.5),
    canopyDeckApproach.clone().addScaledVector(canopyDeckApproachDirection, 2.4).setY(4.12),
    canopyDeckApproach.clone().setY(observationDeckConnectionY),
  ]);
  const routePoints = routeCurve.getPoints(38);
  const routeSamplePoints: THREE.Vector3[] = [];
  routePoints.forEach((point) => routeSamplePoints.push(point));
  const pathWidth = TROPICAL_CANOPY_PATH_WIDTH;
  const canopyRailPaths = [-1, 1].map((side) => (
    makeContinuousRailPath(routePoints, pathWidth * 0.48 * side)
  ));

  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const start = routePoints[index];
    const end = routePoints[index + 1];
    const direction = end.clone().sub(start);
    const plank = prepareMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(pathWidth, TROPICAL_CANOPY_DECK_THICKNESS, direction.length() + 0.035),
        pathMaterial,
      ),
      definition.id,
    );
    plank.name = 'TROPICAL__ELEVATED_CANOPY_WALK';
    plank.position.copy(start).add(end).multiplyScalar(0.5);
    orientWalkwaySegment(plank, direction);
    plank.userData.walkable = true;
    if (index === 0) {
      plank.userData.canopyEntryRamp = true;
      plank.userData.entryLocalStart = start.toArray();
      plank.userData.entryLocalEnd = end.toArray();
    }
    group.add(plank);

    for (let sideIndex = 0; sideIndex < canopyRailPaths.length; sideIndex += 1) {
      const railStart = canopyRailPaths[sideIndex][index];
      const railEnd = canopyRailPaths[sideIndex][index + 1];
      addCylinderBetween(
        group,
        railStart.clone().add(new THREE.Vector3(
          0,
          TROPICAL_CANOPY_DECK_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
          0,
        )),
        railEnd.clone().add(new THREE.Vector3(
          0,
          TROPICAL_CANOPY_DECK_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
          0,
        )),
        HUMAN_HANDRAIL_RADIUS,
        railMaterial,
        'TROPICAL__CANOPY_WALK_RAIL',
        false,
        true,
      );
    }

    if (index % 4 === 0) {
      for (const railPath of canopyRailPaths) {
        const railPoint = railPath[index];
        addCylinderBetween(
          group,
          railPoint.clone().add(new THREE.Vector3(0, TROPICAL_CANOPY_DECK_THICKNESS * 0.5, 0)),
          railPoint.clone().add(new THREE.Vector3(
            0,
            TROPICAL_CANOPY_DECK_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
            0,
          )),
          HUMAN_RAIL_POST_RADIUS,
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

  // Keep the waterfall mass on its far/right bank. The former left stack sat
  // directly in the visitor route's sightline and made the elevated walkway
  // appear to tunnel through a solid cliff from WALK, even where the AABBs
  // only narrowly missed. Removing that stack leaves an unmistakably open
  // canopy route around the waterfall.
  for (const side of [1]) {
    for (let tier = 0; tier < 5; tier += 1) {
      const rock = prepareMesh(
        new THREE.Mesh(new THREE.DodecahedronGeometry(1.05 + random() * 0.62, 0), tier % 2 ? mossMaterial : rockMaterial),
        definition.id,
      );
      rock.name = 'TROPICAL__WATERFALL_CLIFF';
      rock.scale.set(1.1, 1.12 + tier * 0.14, 0.86);
      rock.position.set(
        2.1 + tier * 0.22,
        1.2 + tier * 1.18,
        waterfallZ - 0.2 + random() * 0.5,
      );
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

  const pondBasin = prepareMesh(
    new THREE.Mesh(
      new THREE.CylinderGeometry(3.02, 3.16, 0.08, 48),
      standardMaterial('#203e38', { roughness: 0.94, metalness: 0.02 }),
    ),
    definition.id,
  );
  pondBasin.name = 'TROPICAL__WETLAND_BASIN';
  pondBasin.scale.set(1.28, 1, 0.84);
  pondBasin.position.set(0.25, floorY + 0.02, -0.5);
  group.add(pondBasin);

  const pondWaterMaterial = new THREE.MeshStandardMaterial({
    color: '#168fa5',
    emissive: '#063e4c',
    emissiveIntensity: 0.48,
    transparent: true,
    opacity: 0.82,
    // Water must participate in the real depth buffer. The former always-on-
    // top material made this small pond cover trees, rails, and architecture
    // from every camera angle.
    depthTest: true,
    depthWrite: true,
    roughness: 0.18,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  pondWaterMaterial.name = 'TROPICAL_WATER_SURFACE_MATERIAL';
  const pond = prepareMesh(
    new THREE.Mesh(new THREE.CircleGeometry(2.9, 48), pondWaterMaterial),
    definition.id,
    false,
  );
  pond.name = 'TROPICAL__WETLAND_POND';
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1.28, 0.84, 1);
  // Keep a real depth separation from the basin; a near-coplanar water sheet
  // loses precision against the island-scale camera frustum and appears gray.
  pond.position.set(0.25, floorY + 0.085, -0.5);
  pond.renderOrder = 0;
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
  const deck = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(deckRadius, deckRadius, TROPICAL_PLATFORM_THICKNESS, 24), pathMaterial),
    definition.id,
  );
  deck.name = 'TROPICAL__OBSERVATION_DECK';
  deck.position.copy(deckPosition);
  deck.userData.walkable = true;
  group.add(deck);
  const deckBridgeApproachDirection = new THREE.Vector3(1, 0, 0.4).normalize();
  const deckBridgeApproach = deckPosition.clone().addScaledVector(deckBridgeApproachDirection, deckRadius - 0.09);
  const deckRailOpenings: CircularRailOpening[] = [
    {
      centerAngle: Math.atan2(canopyDeckApproachDirection.z, canopyDeckApproachDirection.x),
      halfAngle: Math.asin(Math.min(0.95, pathWidth * 0.5 / deckRailRadius)) + 0.08,
    },
    {
      centerAngle: Math.atan2(deckBridgeApproachDirection.z, deckBridgeApproachDirection.x),
      halfAngle: Math.asin(Math.min(0.95, TROPICAL_SUSPENSION_PATH_WIDTH * 0.5 / deckRailRadius)) + 0.08,
    },
  ];
  const deckRailArcCount = addCircularGuardrail(
    group,
    deckPosition,
    deckRailRadius,
    deckPosition.y + TROPICAL_PLATFORM_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
    deckRailOpenings,
    'TROPICAL__OBSERVATION_DECK_RAIL',
  );
  deck.userData.guardrailOpenings = deckRailOpenings.map((opening) => ({ ...opening }));
  deck.userData.guardrailArcCount = deckRailArcCount;
  addCylinderBetween(group, new THREE.Vector3(deckPosition.x, floorY, deckPosition.z), deckPosition, 0.13, metal, 'TROPICAL__OBSERVATION_SUPPORT');
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    if (isInsideRailOpening(angle, deckRailOpenings)) continue;
    const x = deckPosition.x + Math.cos(angle) * 1.38;
    const z = deckPosition.z + Math.sin(angle) * 1.38;
    addCylinderBetween(
      group,
      new THREE.Vector3(x, deckPosition.y + TROPICAL_PLATFORM_THICKNESS * 0.5, z),
      new THREE.Vector3(
        x,
        deckPosition.y + TROPICAL_PLATFORM_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
        z,
      ),
      HUMAN_RAIL_POST_RADIUS,
      metal,
      'TROPICAL__OBSERVATION_DECK_POST',
    );
  }

  const podPosition = new THREE.Vector3(7.15, researchPlatformCenterY, -5.7);
  const bridgeStartY = observationDeckCenterY
    + TROPICAL_PLATFORM_THICKNESS * 0.5
    - TROPICAL_SUSPENSION_DECK_THICKNESS * 0.5;
  const bridgeEndY = researchPlatformCenterY
    + TROPICAL_PLATFORM_THICKNESS * 0.5
    - TROPICAL_SUSPENSION_DECK_THICKNESS * 0.5;
  const podRailRadius = 1.76;
  const bridgePodApproachDirection = new THREE.Vector3(-1.35, 0, -0.3).normalize();
  const bridgePodEdge = podPosition.clone().addScaledVector(bridgePodApproachDirection, podRailRadius + 0.08);
  // Carry the deck well across the circular platform edge. Previously the
  // bridge stopped at the rim, where ground sampling jumped to the platform
  // before the controller reached the flush bridge endpoint and treated the
  // remaining rise as an unclimbable step.
  const bridgePodApproach = podPosition.clone().addScaledVector(bridgePodApproachDirection, 1.28);
  const bridgeCurve = new THREE.CatmullRomCurve3([
    deckBridgeApproach.clone().setY(bridgeStartY),
    new THREE.Vector3(0.3, 4.12, -7.1),
    new THREE.Vector3(3.5, 4.4, -6.7),
    bridgePodEdge.clone().setY(bridgeEndY),
    bridgePodApproach.clone().setY(bridgeEndY),
  ]);
  const bridgePoints = bridgeCurve.getPoints(28);
  bridgePoints.forEach((point) => routeSamplePoints.push(point));
  const bridgeRailPaths = [-1, 1].map((side) => (
    makeContinuousRailPath(bridgePoints, side * TROPICAL_SUSPENSION_PATH_WIDTH * 0.5)
  ));
  for (let index = 0; index < bridgePoints.length - 1; index += 1) {
    const start = bridgePoints[index];
    const end = bridgePoints[index + 1];
    const direction = end.clone().sub(start);
    const plank = prepareMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          TROPICAL_SUSPENSION_PATH_WIDTH,
          TROPICAL_SUSPENSION_DECK_THICKNESS,
          direction.length() + 0.025,
        ),
        pathMaterial,
      ),
      definition.id,
    );
    plank.name = 'TROPICAL__SUSPENSION_BRIDGE';
    plank.position.copy(start).add(end).multiplyScalar(0.5);
    orientWalkwaySegment(plank, direction);
    plank.userData.walkable = true;
    group.add(plank);
    for (const railPath of bridgeRailPaths) {
      const railStart = railPath[index];
      const railEnd = railPath[index + 1];
      addCylinderBetween(
        group,
        railStart.clone().add(new THREE.Vector3(
          0,
          TROPICAL_SUSPENSION_DECK_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
          0,
        )),
        railEnd.clone().add(new THREE.Vector3(
          0,
          TROPICAL_SUSPENSION_DECK_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
          0,
        )),
        HUMAN_HANDRAIL_RADIUS,
        railMaterial,
        'TROPICAL__SUSPENSION_BRIDGE_RAIL',
        false,
        true,
      );
    }
  }

  const podPlatform = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, TROPICAL_PLATFORM_THICKNESS, 28), darkMetal),
    definition.id,
  );
  podPlatform.name = 'TROPICAL__RESEARCH_STATION';
  podPlatform.position.copy(podPosition);
  podPlatform.userData.walkable = true;
  group.add(podPlatform);
  const podRailOpenings: CircularRailOpening[] = [{
    centerAngle: Math.atan2(bridgePodApproachDirection.z, bridgePodApproachDirection.x),
    halfAngle: Math.asin(Math.min(0.95, TROPICAL_SUSPENSION_PATH_WIDTH * 0.5 / podRailRadius)) + 0.16,
  }];
  const podRailArcCount = addCircularGuardrail(
    group,
    podPosition,
    podRailRadius,
    podPosition.y + TROPICAL_PLATFORM_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
    podRailOpenings,
    'TROPICAL__RESEARCH_STATION_RAIL',
  );
  podPlatform.userData.guardrailOpenings = podRailOpenings.map((opening) => ({ ...opening }));
  podPlatform.userData.guardrailArcCount = podRailArcCount;
  addCylinderBetween(group, new THREE.Vector3(podPosition.x, floorY, podPosition.z), podPosition, 0.22, metal, 'TROPICAL__RESEARCH_STATION_COLUMN');
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    if (isInsideRailOpening(angle, podRailOpenings)) continue;
    const x = podPosition.x + Math.cos(angle) * 1.75;
    const z = podPosition.z + Math.sin(angle) * 1.75;
    addCylinderBetween(
      group,
      new THREE.Vector3(x, podPosition.y + TROPICAL_PLATFORM_THICKNESS * 0.5, z),
      new THREE.Vector3(
        x,
        podPosition.y + TROPICAL_PLATFORM_THICKNESS * 0.5 + HUMAN_HANDRAIL_CENTER_ABOVE_SURFACE,
        z,
      ),
      HUMAN_RAIL_POST_RADIUS,
      metal,
      'TROPICAL__RESEARCH_STATION_POST',
    );
  }
  const stationBody = prepareMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 1.05, 20), physicalMaterial('#b9d8d3', {
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
  const stationPodOffset = new THREE.Vector3(0.58, 0, 0.32);
  stationBody.position.copy(podPosition).add(stationPodOffset).add(new THREE.Vector3(0, 0.57, 0));
  stationBody.userData.viewpointSetback = stationPodOffset.toArray();
  group.add(stationBody);
  const stationRoof = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.58, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), darkMetal), definition.id);
  stationRoof.position.copy(podPosition).add(stationPodOffset).add(new THREE.Vector3(0, 1.1, 0));
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
    if (Math.hypot(point.x - deckPosition.x, point.z - deckPosition.z) < deckRadius + 1.35) continue;
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

function addBiomeEcologyExpansion(
  group: THREE.Group,
  definition: BiomeDefinition,
  radius: number,
  depth: number,
  width: number,
  random: () => number,
  floorY: number,
) {
  if (definition.id === 'tropical-rainforest-dome') return;

  const aspect = depth / width;
  const usableRadius = radius * 0.73;
  const featureManifest: string[] = [];
  const dummy = new THREE.Object3D();
  const tagFeature = (object: THREE.Object3D, feature: string, count = 1) => {
    object.name = `${definition.id}__${feature.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
    object.userData.biomeFeature = feature;
    object.userData.featureRole = 'biome-ecology';
    object.userData.instanceCount = count;
    object.traverse((child) => {
      child.userData.selectableId = definition.id;
      child.userData.biomeFeature = feature;
      child.userData.featureRole = 'biome-ecology';
    });
    featureManifest.push(feature);
    group.add(object);
  };
  const safePoint = (minimumRadius = 1.2, maximumRadius = usableRadius) => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const distance = minimumRadius + random() * Math.max(0.1, maximumRadius - minimumRadius);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance * aspect;
      const clearOfLab = Math.hypot(x, z + radius * 0.24) > 3.2;
      const clearOfAirlock = !(Math.abs(x) < 2.4 && z > depth * 0.18);
      if (clearOfLab && clearOfAirlock) return new THREE.Vector3(x, floorY, z);
    }
    return new THREE.Vector3(usableRadius * 0.65, floorY, 0);
  };

  const mastMaterial = standardMaterial('#5c6f74', { roughness: 0.34, metalness: 0.82 });
  const sensorMaterial = markAccent(new THREE.MeshStandardMaterial({
    color: definition.accent,
    emissive: definition.accent,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.55,
  }));
  const addMonitoringMast = (feature: string, x: number, z: number, height = 2.4) => {
    const mast = new THREE.Group();
    const pole = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, height, 8), mastMaterial), definition.id);
    pole.position.y = floorY + height * 0.5;
    const sensor = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 7), sensorMaterial), definition.id, false);
    sensor.position.y = floorY + height;
    const crossbar = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.04), mastMaterial), definition.id);
    crossbar.position.y = floorY + height * 0.82;
    mast.position.set(x, 0, z);
    mast.add(pole, sensor, crossbar);
    tagFeature(mast, feature);
  };

  if (definition.id === 'alpine-dome') {
    const snowGeometry = new THREE.CircleGeometry(1, 12);
    const snowMaterial = physicalMaterial('#eaf7fb', { roughness: 0.52, metalness: 0.02, transparent: true, opacity: 0.94 });
    const snow = new THREE.InstancedMesh(snowGeometry, snowMaterial, 32);
    for (let index = 0; index < 32; index += 1) {
      const point = safePoint(0.8);
      dummy.position.set(point.x, floorY + 0.008, point.z);
      dummy.rotation.set(-Math.PI / 2, 0, random() * Math.PI);
      dummy.scale.set(0.55 + random() * 1.45, 0.4 + random() * 0.9, 1);
      dummy.updateMatrix();
      snow.setMatrixAt(index, dummy.matrix);
    }
    snow.receiveShadow = true;
    tagFeature(snow, 'layered snowfields', 32);

    const ridge = new THREE.Group();
    const ridgeMaterial = standardMaterial('#68777a', { roughness: 0.93, metalness: 0.04 });
    for (let index = 0; index < 9; index += 1) {
      const h = 1.5 + random() * 2.2;
      const peak = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.7 + random() * 0.65, h, 6), ridgeMaterial), definition.id);
      peak.position.set(-usableRadius * 0.7 + index * usableRadius * 0.18, floorY + h * 0.5, -usableRadius * aspect * (0.55 + random() * 0.18));
      peak.rotation.y = random() * Math.PI;
      ridge.add(peak);
    }
    tagFeature(ridge, 'exposed mountain ridge', 9);

    const tarn = prepareMesh(new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 28),
      physicalMaterial('#77bad0', { roughness: 0.08, metalness: 0.04, transparent: true, opacity: 0.9 }),
    ), definition.id, false);
    tarn.rotation.x = -Math.PI / 2;
    tarn.scale.set(1.7, 0.72, 1);
    tarn.position.set(usableRadius * 0.34, floorY + 0.014, usableRadius * 0.34 * aspect);
    tagFeature(tarn, 'glacial meltwater tarn');
    addMonitoringMast('cold climate weather station', -usableRadius * 0.48, usableRadius * 0.24 * aspect, 2.8);
  } else if (definition.id === 'tundra-dome') {
    const polygonGeometry = new THREE.CircleGeometry(1, 7);
    const polygonMaterial = standardMaterial('#8d9d91', { roughness: 0.97, metalness: 0.01 });
    const polygons = new THREE.InstancedMesh(polygonGeometry, polygonMaterial, 40);
    for (let index = 0; index < 40; index += 1) {
      const point = safePoint(0.5);
      dummy.position.set(point.x, floorY + 0.006, point.z);
      dummy.rotation.set(-Math.PI / 2, 0, random() * Math.PI);
      dummy.scale.set(0.35 + random() * 0.85, 0.35 + random() * 0.85, 1);
      dummy.updateMatrix();
      polygons.setMatrixAt(index, dummy.matrix);
    }
    polygons.receiveShadow = true;
    tagFeature(polygons, 'patterned permafrost terrain', 40);

    const poolMaterial = physicalMaterial('#6fa9ba', { roughness: 0.08, metalness: 0.02, transparent: true, opacity: 0.84 });
    const pools = new THREE.Group();
    for (let index = 0; index < 7; index += 1) {
      const point = safePoint(1.8);
      const pool = prepareMesh(new THREE.Mesh(new THREE.CircleGeometry(0.45 + random() * 0.75, 14), poolMaterial), definition.id, false);
      pool.rotation.x = -Math.PI / 2;
      pool.scale.y = 0.55 + random() * 0.35;
      pool.position.set(point.x, floorY + 0.015, point.z);
      pools.add(pool);
    }
    tagFeature(pools, 'seasonal meltwater network', 7);

    const stakes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.035, 0.75, 6), mastMaterial, 16);
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * usableRadius * 0.62, floorY + 0.375, Math.sin(angle) * usableRadius * 0.48 * aspect);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stakes.setMatrixAt(index, dummy.matrix);
    }
    tagFeature(stakes, 'permafrost borehole array', 16);
    addMonitoringMast('tundra climate mast', usableRadius * 0.46, -usableRadius * 0.34 * aspect, 2.35);
  } else if (definition.id === 'desert-dome') {
    const formation = new THREE.Group();
    const stoneMaterial = standardMaterial('#925d39', { roughness: 0.96, metalness: 0.01 });
    for (let index = 0; index < 11; index += 1) {
      const point = safePoint(1.7);
      const h = 0.75 + random() * 1.9;
      const stone = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.38 + random() * 0.42, 0), stoneMaterial), definition.id);
      stone.scale.set(0.65 + random() * 0.5, h, 0.55 + random() * 0.45);
      stone.position.set(point.x, floorY + h * 0.37, point.z);
      stone.rotation.set((random() - 0.5) * 0.2, random() * Math.PI, (random() - 0.5) * 0.2);
      formation.add(stone);
    }
    tagFeature(formation, 'eroded stone formations', 11);

    const solar = new THREE.Group();
    const solarFrame = standardMaterial('#3c4648', { roughness: 0.32, metalness: 0.86 });
    const solarCell = physicalMaterial('#09264a', { roughness: 0.1, metalness: 0.88, clearcoat: 0.92 });
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        const panel = new THREE.Group();
        const frame = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.72), solarFrame), definition.id);
        const cells = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.075, 0.62), solarCell), definition.id, false);
        cells.position.y = 0.03;
        panel.position.set(-usableRadius * 0.72 + column * 1.35, floorY + 0.28 + row * 0.03, usableRadius * aspect * (0.28 + row * 0.12));
        panel.rotation.x = 0.35;
        panel.add(frame, cells);
        solar.add(panel);
      }
    }
    tagFeature(solar, 'integrated solar research array', 15);
    addMonitoringMast('heat flux research tower', usableRadius * 0.34, -usableRadius * 0.5 * aspect, 3.0);
  } else if (definition.id === 'savanna-dome') {
    const grassGeometry = new THREE.ConeGeometry(0.055, 0.34, 4);
    const grassMaterial = standardMaterial('#b7a64e', { roughness: 0.98, metalness: 0 });
    const grassland = new THREE.InstancedMesh(grassGeometry, grassMaterial, 160);
    for (let index = 0; index < 160; index += 1) {
      const point = safePoint(0.8);
      dummy.position.set(point.x, floorY + 0.17, point.z);
      dummy.rotation.set((random() - 0.5) * 0.18, random() * Math.PI, (random() - 0.5) * 0.18);
      const scale = 0.65 + random() * 1.25;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      grassland.setMatrixAt(index, dummy.matrix);
    }
    grassland.castShadow = true;
    tagFeature(grassland, 'dense golden grassland', 160);

    const stones = new THREE.Group();
    const stoneMaterial = standardMaterial('#81705b', { roughness: 0.95, metalness: 0.01 });
    for (let index = 0; index < 14; index += 1) {
      const point = safePoint(2.2);
      const size = 0.18 + random() * 0.35;
      const stone = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), stoneMaterial), definition.id);
      stone.position.set(point.x, floorY + size * 0.68, point.z);
      stone.rotation.set(random() * 2, random() * 2, random() * 2);
      stones.add(stone);
    }
    tagFeature(stones, 'weathered savanna stone field', 14);

    const hide = new THREE.Group();
    const hideBody = roundedBlock(definition.id, 2.3, 1.2, 1.35, standardMaterial('#5c5237', { roughness: 0.88 }), 0, floorY, 0, 0.08);
    const slit = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 0.04), sensorMaterial), definition.id, false);
    slit.position.set(0, floorY + 0.82, 0.695);
    hide.position.set(-usableRadius * 0.45, 0, -usableRadius * 0.43 * aspect);
    hide.add(hideBody, slit);
    tagFeature(hide, 'wildlife observation hide');
    addMonitoringMast('savanna rainfall station', usableRadius * 0.52, usableRadius * 0.2 * aspect, 2.5);
  } else if (definition.id === 'temperate-deciduous-forest-dome') {
    const streamPoints = [
      new THREE.Vector3(-usableRadius * 0.78, floorY + 0.025, -usableRadius * 0.42 * aspect),
      new THREE.Vector3(-usableRadius * 0.35, floorY + 0.02, -usableRadius * 0.1 * aspect),
      new THREE.Vector3(0, floorY + 0.018, usableRadius * 0.08 * aspect),
      new THREE.Vector3(usableRadius * 0.3, floorY + 0.016, usableRadius * 0.34 * aspect),
      new THREE.Vector3(usableRadius * 0.72, floorY + 0.014, usableRadius * 0.5 * aspect),
    ];
    const stream = prepareMesh(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(streamPoints), 64, 0.34, 8, false),
      physicalMaterial('#4aa8b5', { roughness: 0.08, metalness: 0.03, transparent: true, opacity: 0.9 }),
    ), definition.id, false);
    tagFeature(stream, 'shaded woodland stream');

    const plots = new THREE.Group();
    const plotMaterial = standardMaterial('#425e2f', { roughness: 0.98, metalness: 0 });
    const borderMaterial = standardMaterial('#7d6a4b', { roughness: 0.9, metalness: 0.05 });
    for (let index = 0; index < 6; index += 1) {
      const x = -usableRadius * 0.66 + (index % 3) * 1.65;
      const z = usableRadius * aspect * 0.46 + Math.floor(index / 3) * 1.25;
      const bed = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 0.92), plotMaterial), definition.id);
      bed.position.set(x, floorY + 0.04, z);
      const border = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.055, 1.05), borderMaterial), definition.id);
      border.position.set(x, floorY + 0.018, z);
      plots.add(border, bed);
    }
    tagFeature(plots, 'seasonal woodland research plots', 6);

    const logs = new THREE.Group();
    const logMaterial = standardMaterial('#4b3424', { roughness: 0.96, metalness: 0 });
    for (let index = 0; index < 10; index += 1) {
      const point = safePoint(1.8);
      const log = prepareMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 1.1 + random() * 0.8, 8), logMaterial), definition.id);
      log.position.set(point.x, floorY + 0.13, point.z);
      log.rotation.set(Math.PI / 2, random() * Math.PI, 0);
      logs.add(log);
    }
    tagFeature(logs, 'fallen log habitat', 10);

    const mushrooms = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.09, 8, 5),
      standardMaterial('#d58b56', { roughness: 0.86, metalness: 0 }),
      48,
    );
    for (let index = 0; index < 48; index += 1) {
      const point = safePoint(1.1);
      dummy.position.set(point.x, floorY + 0.08, point.z);
      dummy.rotation.set(0, random() * Math.PI, 0);
      const scale = 0.55 + random() * 0.9;
      dummy.scale.set(scale, 0.45 * scale, scale);
      dummy.updateMatrix();
      mushrooms.setMatrixAt(index, dummy.matrix);
    }
    tagFeature(mushrooms, 'mushroom understory', 48);
    addMonitoringMast('forest phenology station', usableRadius * 0.42, -usableRadius * 0.5 * aspect, 2.25);
  }

  group.userData.biomeEcologyExpansion = {
    populated: true,
    featureManifest,
  };
}

export function createBiomeModel(definition: BiomeDefinition): ProceduralModel {
  const group = new THREE.Group();
  const ecologyPlan = BIOME_ECOLOGY_PLANS[definition.id as keyof typeof BIOME_ECOLOGY_PLANS];
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
    biomeEcologyPlan: ecologyPlan ? {
      fieldLabName: ecologyPlan.fieldLabName,
      plannedFeatures: [...ecologyPlan.features],
      filled: true,
    } : null,
  };
  const [width, depth] = definition.footprint;
  const radius = width * 0.48;
  const isTropicalRainforest = definition.id === 'tropical-rainforest-dome';
  const finishedFloorY = isTropicalRainforest ? TROPICAL_FINISHED_FLOOR_Y : DOME_FINISHED_FLOOR_Y;
  const biomeFloorThickness = isTropicalRainforest ? metresToWorldUnits(0.08) : 0.08;
  // The tropical foundation used to end at the exact same elevation as the
  // visible floor top. Those coplanar faces produced severe depth flicker in
  // WALK. End the foundation at the floor's underside instead.
  const foundationHeight = isTropicalRainforest
    ? TROPICAL_FINISHED_FLOOR_Y - biomeFloorThickness
    : 0.34;
  const random = seededRandom(hashString(definition.id));
  const groundTex = makeGroundTexture(isTropicalRainforest ? '#17472f' : (definition.palette[0] as string));
  const concreteTex = makeConcreteTexture();
  const base = prepareMesh(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.04, foundationHeight, 48),
      new THREE.MeshStandardMaterial({
        color: definition.palette[2],
        roughness: 0.82,
        metalness: 0.1,
        map: concreteTex,
        bumpMap: concreteTex,
        bumpScale: 0.016,
      }),
    ),
    definition.id,
  );
  base.scale.z = depth / width;
  base.position.y = foundationHeight * 0.5;
  base.name = `${definition.id}__SOLID_FOUNDATION`;
  base.userData.navObstacle = !isTropicalRainforest;
  base.userData.solidFoundation = true;
  group.add(base);

  const ground = prepareMesh(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.94, radius * 0.94, biomeFloorThickness, 48),
      new THREE.MeshStandardMaterial({
        color: isTropicalRainforest ? '#17472f' : definition.palette[0],
        roughness: 0.96,
        metalness: 0.02,
        map: groundTex,
      }),
    ),
    definition.id,
  );
  ground.scale.z = depth / width;
  ground.position.y = finishedFloorY - biomeFloorThickness * 0.5;
  ground.name = `${definition.id}__BIOME_FLOOR`;
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
  dome.name = `${definition.id}__DOME_TRANSPARENT_SHELL`;
  dome.scale.set(1, definition.height / radius, depth / width);
  dome.position.y = finishedFloorY;
  dome.renderOrder = 4;
  group.add(dome);

  const wire = prepareMesh(
    new THREE.Mesh(
      domeGeometry.clone(),
      markAccent(
        new THREE.MeshBasicMaterial({
          color: isTropicalRainforest ? '#2ee878' : definition.accent,
          wireframe: true,
          transparent: true,
          opacity: isTropicalRainforest ? 0.56 : 0.18,
          depthWrite: false,
        }),
      ),
    ),
    definition.id,
    false,
  );
  wire.name = `${definition.id}__DOME_WIREFRAME`;
  wire.scale.copy(dome.scale);
  wire.position.copy(dome.position);
  wire.renderOrder = 5;
  group.add(wire);

  const boundary = prepareMesh(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.07, 8, 72), markAccent(new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 2.2 }))), definition.id, false);
  boundary.rotation.x = Math.PI / 2;
  boundary.scale.z = depth / width;
  boundary.position.y = finishedFloorY;
  group.add(boundary);

  const usableRadius = radius * 0.68;
  // The ground/flora Y references in all non-tropical dome branches should use the lowered ground position.
  if (definition.id === 'alpine-dome') {
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const h = 0.7 + random() * 1.2;
      const rock = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.25 + random() * 0.35, h, 5), biomeMaterial(definition.palette, 1)), definition.id);
      rock.name = `${definition.id}__EXPOSED_ALPINE_ROCK`;
      rock.position.set(Math.cos(angle) * distance, finishedFloorY + h * 0.5, Math.sin(angle) * distance * (depth / width));
      rock.rotation.y = random() * Math.PI;
      rock.rotation.x = (random() - 0.5) * 0.15;
      group.add(rock);
    }
    for (let index = 0; index < 14; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      addConifer(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.5 + random() * 0.6, true, finishedFloorY);
    }
    for (let index = 0; index < 15; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const pebbleRadius = 0.08 + random() * 0.08;
      const pebble = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(pebbleRadius, 0), biomeMaterial(definition.palette, 2)), definition.id);
      pebble.name = `${definition.id}__ALPINE_SCREE`;
      pebble.position.set(Math.cos(angle) * distance, finishedFloorY + pebbleRadius * 0.72, Math.sin(angle) * distance * (depth / width));
      pebble.rotation.set(random() * 3, random() * 3, random() * 3);
      group.add(pebble);
    }
  } else if (definition.id === 'tundra-dome') {
    for (let index = 0; index < 30; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const shrub = prepareMesh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + random() * 0.16, 1), biomeMaterial(definition.palette, index % 2)), definition.id);
      shrub.name = `${definition.id}__MOSS_LICHEN_SHRUB`;
      shrub.scale.set(1.1, 0.35 + random() * 0.15, 1.1);
      shrub.position.set(Math.cos(angle) * distance, finishedFloorY + 0.09, Math.sin(angle) * distance * (depth / width));
      group.add(shrub);
    }
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const stoneHeight = 0.15 + random() * 0.25;
      const stone = prepareMesh(new THREE.Mesh(new THREE.BoxGeometry(0.2 + random() * 0.3, stoneHeight, 0.2 + random() * 0.3), biomeMaterial(definition.palette, 1)), definition.id);
      stone.name = `${definition.id}__PERMAFROST_STONE`;
      stone.position.set(Math.cos(angle) * distance, finishedFloorY + stoneHeight * 0.5, Math.sin(angle) * distance * (depth / width));
      stone.rotation.set(random() * 0.2, random() * Math.PI, random() * 0.2);
      group.add(stone);
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const patch = prepareMesh(new THREE.Mesh(new THREE.CircleGeometry(0.3 + random() * 0.5, 8), physicalMaterial('#6fb7c7', { roughness: 0.08, transparent: true, opacity: 0.82 })), definition.id, false);
      patch.name = `${definition.id}__SEASONAL_MELTWATER_POOL`;
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(Math.cos(angle) * distance, finishedFloorY + 0.012, Math.sin(angle) * distance * (depth / width));
      group.add(patch);
    }
  } else if (definition.id === 'desert-dome') {
    for (let index = 0; index < 10; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const dune = prepareMesh(new THREE.Mesh(new THREE.SphereGeometry(0.5 + random() * 0.6, 12, 6), biomeMaterial(definition.palette, index % 2)), definition.id);
      dune.name = `${definition.id}__LAYERED_DUNE`;
      dune.scale.set(2.0, 0.18, 0.8);
      dune.position.set(Math.cos(angle) * distance, finishedFloorY + 0.15, Math.sin(angle) * distance * (depth / width));
      dune.rotation.y = random() * Math.PI;
      group.add(dune);
    }
    for (let index = 0; index < 12; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      addCactus(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.6 + random() * 0.5, finishedFloorY);
    }
    for (let index = 0; index < 15; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      const pebbleRadius = 0.06 + random() * 0.08;
      const pebble = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(pebbleRadius, 0), standardMaterial('#c2b280', { roughness: 0.9 })), definition.id);
      pebble.name = `${definition.id}__DESERT_GRAVEL`;
      pebble.position.set(Math.cos(angle) * distance, finishedFloorY + pebbleRadius * 0.72, Math.sin(angle) * distance * (depth / width));
      group.add(pebble);
    }
  } else if (definition.id === 'savanna-dome') {
    for (let index = 0; index < 10; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      addAcacia(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.65 + random() * 0.5, finishedFloorY);
    }
    const grassMat = standardMaterial('#c2b87f', { roughness: 0.95 });
    for (let index = 0; index < 25; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = random() * usableRadius;
      if (Math.cos(angle) * distance > 0.8 && Math.sin(angle) * distance * (depth / width) < -0.1) continue;
      const tuftHeight = 0.25 + random() * 0.25;
      const tuft = prepareMesh(new THREE.Mesh(new THREE.ConeGeometry(0.06 + random() * 0.06, tuftHeight, 4), grassMat), definition.id);
      tuft.name = `${definition.id}__GOLDEN_GRASS_TUFT`;
      tuft.position.set(Math.cos(angle) * distance, finishedFloorY + tuftHeight * 0.5, Math.sin(angle) * distance * (depth / width));
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
      mound.name = `${definition.id}__TERMITE_MOUND`;
      mound.position.set(Math.cos(angle) * distance, finishedFloorY + h * 0.5, Math.sin(angle) * distance * (depth / width));
      mound.rotation.y = random() * Math.PI;
      group.add(mound);
    }
    const pool = prepareMesh(new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), physicalMaterial('#3e9196', { roughness: 0.08, metalness: 0.05 })), definition.id, false);
    pool.name = `${definition.id}__WATER_HOLE`;
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(1.3, finishedFloorY + 0.015, -0.4);
    group.add(pool);

    const borderRockMat = standardMaterial('#8c7f70', { roughness: 0.88 });
    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const rockRadius = 1.35;
      const rx = 1.3 + Math.cos(theta) * rockRadius;
      const rz = -0.4 + Math.sin(theta) * rockRadius;
      const rScale = 0.08 + random() * 0.08;
      const borderRock = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(rScale, 0), borderRockMat), definition.id);
      borderRock.name = `${definition.id}__WEATHERED_WATERHOLE_STONE`;
      borderRock.position.set(rx, finishedFloorY + rScale * 0.72, rz);
      borderRock.rotation.set(random() * 3, random() * 3, random() * 3);
      group.add(borderRock);
    }
  } else {
    const tropical = definition.id === 'tropical-rainforest-dome';
    if (tropical) {
      buildFuturisticTropicalBiodome(group, definition, radius, depth, width, random, finishedFloorY);
    } else {
      for (let index = 0; index < 22; index += 1) {
        const angle = random() * Math.PI * 2;
        const distance = random() * usableRadius;
        const leafColor = random() > 0.4 ? '#4a6b32' : '#698a3c';
        addTree(group, definition.id, Math.cos(angle) * distance, Math.sin(angle) * distance * (depth / width), 0.55 + random() * 0.65, leafColor, true, finishedFloorY);
      }
      const shrubMat = standardMaterial('#3e5c26', { roughness: 0.92 });
      for (let index = 0; index < 12; index += 1) {
        const angle = random() * Math.PI * 2;
        const distance = random() * usableRadius;
        const shrub = prepareMesh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + random() * 0.12, 1), shrubMat), definition.id);
        shrub.name = `${definition.id}__DECIDUOUS_UNDERSTORY`;
        shrub.position.set(Math.cos(angle) * distance, finishedFloorY + 0.12, Math.sin(angle) * distance * (depth / width));
        group.add(shrub);
      }
      const rockMat = standardMaterial('#5e615b', { roughness: 0.85 });
      for (let index = 0; index < 8; index += 1) {
        const angle = random() * Math.PI * 2;
        const distance = random() * usableRadius;
        const rockRadius = 0.14 + random() * 0.14;
        const rock = prepareMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(rockRadius, 0), rockMat), definition.id);
        rock.name = `${definition.id}__WOODLAND_STONE`;
        rock.position.set(Math.cos(angle) * distance, finishedFloorY + rockRadius * 0.72, Math.sin(angle) * distance * (depth / width));
        rock.rotation.set(random() * 3, random() * 3, random() * 3);
        group.add(rock);
      }
    }
  }

  addBiomeEcologyExpansion(group, definition, radius, depth, width, random, finishedFloorY);

  // Every biome contains a compact, visible field laboratory. It remains part
  // of the dome's editable hierarchy and is positioned clear of the airlock.
  const labCatalogItem = EDITOR_ASSET_CATALOG.find((item) => item.id === 'landscape-modular-wet-lab');
  if (labCatalogItem) {
    const laboratory = createEditorAsset(labCatalogItem, definition.id);
    const fieldLabName = ecologyPlan?.fieldLabName ?? 'Biome Field Laboratory';
    laboratory.name = `${definition.id}__BIOME_FIELD_LABORATORY__${campusFeatureKey(fieldLabName).toUpperCase()}`;
    laboratory.position.set(
      isTropicalRainforest ? radius * 0.43 : 0,
      isTropicalRainforest ? finishedFloorY : 0.38,
      isTropicalRainforest ? -radius * 0.34 : -radius * 0.24,
    );
    laboratory.rotation.y = isTropicalRainforest ? -Math.PI * 0.5 : Math.PI;
    laboratory.scale.setScalar(isTropicalRainforest ? 0.54 : 0.72);
    laboratory.userData.biomeLaboratory = true;
    laboratory.userData.semanticName = fieldLabName;
    laboratory.userData.labType = fieldLabName;
    laboratory.userData.featureRole = 'lab';
    laboratory.userData.featureTag = campusFeatureKey(fieldLabName);
    laboratory.userData.editable = true;
    laboratory.traverse((child) => {
      child.userData.selectableId = definition.id;
      child.userData.biomeLaboratory = true;
      child.userData.labType = fieldLabName;
      child.userData.featureRole = 'lab';
      child.userData.featureTag = campusFeatureKey(fieldLabName);
    });
    const identityBand = prepareMesh(new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.12, 0.22),
      markAccent(new THREE.MeshStandardMaterial({
        color: definition.accent,
        emissive: definition.accent,
        emissiveIntensity: 1.8,
        roughness: 0.24,
        metalness: 0.52,
      })),
    ), definition.id, false);
    identityBand.name = `${definition.id}__BIOME_FIELD_LAB_IDENTITY_BAND`;
    identityBand.position.set(0, 1.65, 1.05);
    identityBand.userData.biomeLaboratory = true;
    identityBand.userData.labType = fieldLabName;
    laboratory.add(identityBand);
    group.add(laboratory);
  }

  const airlockHeight = metresToWorldUnits(4);
  const airlockWidth = Math.min(width * 0.08, metresToWorldUnits(12));
  const airlock = new THREE.Group();
  airlock.name = `${definition.id}__AIRLOCK_SHELL`;
  airlock.position.set(0, 0, depth * 0.47);
  const airlockMaterial = new THREE.MeshStandardMaterial({
    color: isTropicalRainforest ? '#28533f' : definition.palette[2],
    roughness: 0.72,
    metalness: 0.16,
    map: makeConcreteTexture(),
  });
  const wallThickness = metresToWorldUnits(0.4);
  const doorwayWidth = THREE.MathUtils.clamp(
    width * 0.04,
    metresToWorldUnits(2.2),
    metresToWorldUnits(4.8),
  ) + metresToWorldUnits(0.5);
  const facadePanelWidth = Math.max(metresToWorldUnits(0.4), (airlockWidth - doorwayWidth) * 0.5);
  for (const side of [-1, 1]) {
    const facadePanel = prepareMesh(
      new THREE.Mesh(new THREE.BoxGeometry(facadePanelWidth, airlockHeight, wallThickness), airlockMaterial),
      definition.id,
    );
    facadePanel.name = `${definition.id}__AIRLOCK_FRONT_PANEL_${side < 0 ? 'LEFT' : 'RIGHT'}`;
    facadePanel.position.set(
      side * (doorwayWidth * 0.5 + facadePanelWidth * 0.5),
      finishedFloorY + airlockHeight * 0.5,
      DOME_AIRLOCK_HALF_DEPTH - wallThickness * 0.5,
    );
    facadePanel.userData.navObstacle = true;
    airlock.add(facadePanel);

    const sideWall = prepareMesh(
      new THREE.Mesh(new THREE.BoxGeometry(wallThickness, airlockHeight, DOME_AIRLOCK_DEPTH), airlockMaterial),
      definition.id,
    );
    sideWall.name = `${definition.id}__AIRLOCK_SIDE_WALL_${side < 0 ? 'LEFT' : 'RIGHT'}`;
    sideWall.position.set(
      side * (airlockWidth * 0.5 - wallThickness * 0.5),
      finishedFloorY + airlockHeight * 0.5,
      0,
    );
    sideWall.userData.navObstacle = true;
    airlock.add(sideWall);
  }
  const airlockRoof = prepareMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(airlockWidth, metresToWorldUnits(0.4), DOME_AIRLOCK_DEPTH),
      airlockMaterial,
    ),
    definition.id,
  );
  airlockRoof.name = `${definition.id}__AIRLOCK_ROOF`;
  airlockRoof.position.set(0, finishedFloorY + airlockHeight + metresToWorldUnits(0.2), 0);
  airlockRoof.userData.navObstacle = true;
  airlock.add(airlockRoof);
  group.add(airlock);
  const domeAccessRampLength = isTropicalRainforest ? TROPICAL_ACCESS_RAMP_LENGTH : DOME_ACCESS_RAMP_LENGTH;
  addAccessRamp(group, definition.id, width * 0.52, depth, finishedFloorY, domeAccessRampLength, physicalMaterial(definition.palette[2]), depth * 0.47 + DOME_AIRLOCK_HALF_DEPTH);
  const airlockGlow = prepareMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(doorwayWidth * 0.75, metresToWorldUnits(0.2), metresToWorldUnits(0.4)),
      markAccent(new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 2.5 })),
    ),
    definition.id,
    false,
  );
  airlockGlow.name = `${definition.id}__AIRLOCK_HEADER_LIGHT`;
  airlockGlow.position.set(
    0,
    finishedFloorY + airlockHeight + metresToWorldUnits(0.6),
    depth * 0.47 + DOME_AIRLOCK_HALF_DEPTH + metresToWorldUnits(0.25),
  );
  group.add(airlockGlow);
  addDomeWalkPortal(group, definition.id, width, depth, definition.accent, finishedFloorY, domeAccessRampLength);

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
