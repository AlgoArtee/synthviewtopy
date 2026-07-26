import * as THREE from 'three';
import { metresToWorldUnits } from '../config/island';

type Placement = {
  position: readonly [number, number, number];
  rotationY?: number;
  scale?: readonly [number, number, number];
};

type DetailedPlacement = {
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: readonly [number, number, number];
};

export type WelcomeRegistrationInteriorOptions = {
  floorY: number;
  verticalScale: number;
  frontDoorZ: number;
};

const REGISTRATION_GARDEN_ASSET_URL =
  '/assets/interiors/registration-hall/garden.glb';
const REGISTRATION_GARDEN_ASSET_SHA256 =
  '19b639141178cf50726c8fc515caea5b83cd8a661f97552db969fd1e6d591144';

function material(
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.68,
    metalness: 0.16,
    ...options,
  });
}

function createPalette() {
  return {
    mineral: material('#aaa49a', { roughness: 0.78, metalness: 0.03 }),
    ceilingIvory: material('#e3e5df', { roughness: 0.42, metalness: 0.12 }),
    wallBlue: material('#8fbac2', { roughness: 0.54, metalness: 0.06 }),
    terrazzo: material('#7a7670', { roughness: 0.74, metalness: 0.03 }),
    terrazzoDark: material('#414548', { roughness: 0.78, metalness: 0.05 }),
    titanium: material('#6d7b7e', { roughness: 0.28, metalness: 0.84 }),
    bronze: material('#9f7a50', { roughness: 0.34, metalness: 0.76 }),
    charcoal: material('#252a2d', { roughness: 0.78, metalness: 0.18 }),
    blackGlass: material('#111a20', { roughness: 0.16, metalness: 0.66 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#8fbac2',
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.62,
      transmission: 0.24,
      side: THREE.DoubleSide,
    }),
    cyan: material('#a5dbe0', {
      emissive: '#75c9d3',
      emissiveIntensity: 1.65,
      roughness: 0.24,
      metalness: 0.24,
    }),
    whiteLight: material('#bccbc6', {
      emissive: '#a6bbb5',
      emissiveIntensity: 0.82,
      roughness: 0.2,
      metalness: 0.18,
    }),
    amber: material('#d9aa67', {
      emissive: '#d59243',
      emissiveIntensity: 1.28,
      roughness: 0.28,
      metalness: 0.28,
    }),
    violet: material('#a99ac5', {
      emissive: '#7565a8',
      emissiveIntensity: 1.1,
      roughness: 0.28,
      metalness: 0.24,
    }),
    projection: material('#1d343d', {
      emissive: '#365f6a',
      emissiveIntensity: 0.82,
      roughness: 0.5,
      metalness: 0.12,
    }),
    projectionSilhouette: material('#7da9ad', {
      emissive: '#5b8f94',
      emissiveIntensity: 0.68,
      roughness: 0.52,
      metalness: 0.22,
    }),
    garden: material('#43624d', { roughness: 0.92, metalness: 0 }),
    gardenDark: material('#263f32', { roughness: 0.95, metalness: 0 }),
    gardenMoss: material('#58734b', { roughness: 0.98, metalness: 0 }),
    gardenLeafDeep: material('#183b2a', { roughness: 0.88, metalness: 0 }),
    gardenLeafFresh: material('#70854e', { roughness: 0.86, metalness: 0 }),
    gardenMist: new THREE.MeshPhysicalMaterial({
      color: '#d9f1e8',
      roughness: 0.18,
      metalness: 0,
      transparent: true,
      opacity: 0.11,
      transmission: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };
}

function addBox(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  mat: THREE.Material,
  position: readonly [number, number, number],
  options: { obstacle?: boolean; walkable?: boolean; castShadow?: boolean } = {},
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(position[0], position[1] + size[1] * 0.5, position[2]);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = true;
  if (options.obstacle === true) mesh.userData.navObstacle = true;
  if (options.walkable) mesh.userData.walkable = true;
  parent.add(mesh);
  return mesh;
}

function addPlane(
  parent: THREE.Object3D,
  name: string,
  width: number,
  depth: number,
  mat: THREE.Material,
  position: readonly [number, number, number],
  rotationY = 0,
  walkable = true,
) {
  const mesh = addBox(
    parent,
    name,
    [width, 0.025, depth],
    mat,
    position,
    { obstacle: false, walkable, castShadow: false },
  );
  mesh.rotation.y = rotationY;
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  height: number,
  mat: THREE.Material,
  position: readonly [number, number, number],
  segments = 24,
  obstacle = true,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    mat,
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1] + height * 0.5, position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (obstacle) mesh.userData.navObstacle = true;
  parent.add(mesh);
  return mesh;
}

function addInstancedBoxes(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  mat: THREE.Material,
  placements: readonly Placement[],
) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(...size),
    mat,
    placements.length,
  );
  mesh.name = name;
  const helper = new THREE.Object3D();
  placements.forEach((placement, index) => {
    helper.position.set(...placement.position);
    helper.rotation.set(0, placement.rotationY ?? 0, 0);
    helper.scale.set(...(placement.scale ?? [1, 1, 1]));
    helper.updateMatrix();
    mesh.setMatrixAt(index, helper.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.navObstacle = false;
  mesh.userData.instancedInteriorFeature = true;
  mesh.userData.instanceCount = placements.length;
  parent.add(mesh);
  return mesh;
}

function addInstancedGeometry(
  parent: THREE.Object3D,
  name: string,
  geometry: THREE.BufferGeometry,
  mat: THREE.Material,
  placements: readonly DetailedPlacement[],
  castShadow = true,
) {
  const mesh = new THREE.InstancedMesh(geometry, mat, placements.length);
  mesh.name = name;
  const helper = new THREE.Object3D();
  placements.forEach((placement, index) => {
    helper.position.set(...placement.position);
    helper.rotation.set(...(placement.rotation ?? [0, 0, 0]));
    helper.scale.set(...(placement.scale ?? [1, 1, 1]));
    helper.updateMatrix();
    mesh.setMatrixAt(index, helper.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  mesh.userData.navObstacle = false;
  mesh.userData.instancedInteriorFeature = true;
  mesh.userData.instanceCount = placements.length;
  parent.add(mesh);
  return mesh;
}

function addWayfindingSign(
  parent: THREE.Object3D,
  name: string,
  title: string,
  subtitle: string,
  position: readonly [number, number, number],
  rotationY = 0,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#111a20';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#9f7a50';
  context.lineWidth = 12;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#e7ece8';
  context.font = '700 74px Inter, Arial, sans-serif';
  context.fillText(title, canvas.width * 0.5, 98);
  context.fillStyle = '#9ed2d8';
  context.font = '500 31px Inter, Arial, sans-serif';
  context.fillText(subtitle, canvas.width * 0.5, 174);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.38),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  sign.name = name;
  sign.position.set(...position);
  sign.rotation.y = rotationY;
  sign.userData.navObstacle = false;
  sign.userData.interiorWayfinding = true;
  parent.add(sign);
  return sign;
}

function addBotanicalLabelStrip(
  parent: THREE.Object3D,
  name: string,
  sections: readonly { title: string; detail: string }[],
  position: readonly [number, number, number],
  rotationY: number,
  verticalMetres: (metres: number) => number,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 3072;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = 'rgba(18, 38, 32, 0.90)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const sectionWidth = canvas.width / sections.length;
  sections.forEach((section, index) => {
    const x = index * sectionWidth;
    if (index > 0) {
      context.strokeStyle = 'rgba(196, 224, 211, 0.42)';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x, 42);
      context.lineTo(x, canvas.height - 42);
      context.stroke();
    }
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#eef5ec';
    context.font = '700 41px Inter, Arial, sans-serif';
    context.fillText(section.title, x + 30, 92, sectionWidth - 54);
    context.fillStyle = '#b9d5c5';
    context.font = '500 25px Inter, Arial, sans-serif';
    context.fillText(section.detail, x + 30, 185, sectionWidth - 54);
    context.fillStyle = '#83a994';
    context.font = '500 20px Inter, Arial, sans-serif';
    context.fillText(`LIVING INDEX  ${String(index + 1).padStart(2, '0')}`, x + 30, 340);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.16, verticalMetres(0.36)),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      toneMapped: false,
      transparent: true,
    }),
  );
  label.name = name;
  label.position.set(...position);
  label.rotation.y = rotationY;
  label.renderOrder = 8;
  label.userData.navObstacle = false;
  label.userData.botanicalSectionCount = sections.length;
  parent.add(label);
  return label;
}

type NavigationBarrier = {
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
};

function addNavigationGuide(
  interior: THREE.Group,
  barriers: NavigationBarrier[],
) {
  const guide = new THREE.Group();
  guide.name = 'ENTRY__E2__PRECISE_INTERIOR_WALK_COLLISION';
  guide.userData.navBarrierSegments = barriers;
  guide.userData.preciseInteriorCollision = true;
  guide.userData.collisionPolicy = 'architectural wall segments with explicit open door gaps';
  guide.userData.navObstacle = false;
  interior.add(guide);
  return guide;
}

function addProjection(
  interior: THREE.Group,
  name: string,
  position: readonly [number, number, number],
  rotationY: number,
  subject: 'bridge' | 'biodomes' | 'laboratories' | 'coast' | 'transit' | 'city',
  verticalMetres: (metres: number) => number,
  projectionMaterial: THREE.Material,
  silhouetteMaterial: THREE.Material,
) {
  const projection = new THREE.Group();
  projection.name = `ENTRY__E2__WINDOW_PROJECTION_${name}`;
  projection.position.set(...position);
  projection.rotation.y = rotationY;
  projection.userData.exteriorWindowProjection = true;
  projection.userData.projectionSubject = subject;
  projection.userData.lightweightExteriorProxy = true;
  interior.add(projection);
  addBox(
    projection,
    `${projection.name}__LUMINOUS_BACKDROP`,
    [2.8, verticalMetres(5.2), 0.025],
    projectionMaterial,
    [0, 0, 0],
    { obstacle: false, castShadow: false },
  );
  if (subject === 'biodomes') {
    for (let index = 0; index < 3; index += 1) {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.26 + index * 0.05,
          12,
          7,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.5,
        ),
        silhouetteMaterial,
      );
      dome.name = `${projection.name}__DOME_${index + 1}`;
      dome.position.set(-0.72 + index * 0.72, verticalMetres(0.35), 0.04);
      projection.add(dome);
    }
  } else if (subject === 'bridge' || subject === 'transit') {
    addBox(
      projection,
      `${projection.name}__LINEAR_DECK`,
      [2.15, verticalMetres(0.22), 0.06],
      silhouetteMaterial,
      [0, verticalMetres(1.2), 0.04],
      { obstacle: false, castShadow: false },
    );
    [-0.88, -0.44, 0, 0.44, 0.88].forEach((x, index) => {
      addBox(
        projection,
        `${projection.name}__SUPPORT_${index + 1}`,
        [0.035, verticalMetres(1.1), 0.05],
        silhouetteMaterial,
        [x, verticalMetres(0.1), 0.04],
        { obstacle: false, castShadow: false },
      );
    });
  } else {
    const heights = subject === 'city'
      ? [1.1, 2.1, 1.5, 2.6, 1.8, 1.25, 2.2]
      : [0.9, 1.3, 1.05, 1.55, 1.2, 0.8, 1.4];
    heights.forEach((height, index) => {
      addBox(
        projection,
        `${projection.name}__SILHOUETTE_${index + 1}`,
        [0.25, verticalMetres(height), 0.055],
        silhouetteMaterial,
        [-1.05 + index * 0.35, verticalMetres(0.25), 0.04],
        { obstacle: false, castShadow: false },
      );
    });
  }
  projection.traverse((object) => {
    object.userData.navObstacle = false;
  });
  return projection;
}

export function buildWelcomeRegistrationInterior(
  facility: THREE.Group,
  options: WelcomeRegistrationInteriorOptions,
) {
  const { floorY, verticalScale, frontDoorZ } = options;
  const verticalMetres = (metres: number) => metresToWorldUnits(metres) / verticalScale;
  const palette = createPalette();
  const width = 15.2;
  const depth = 25.2;
  const centerZ = -8.25;
  const frontZ = frontDoorZ + 0.2;
  const backZ = centerZ - depth * 0.5;
  const roomHeight = verticalMetres(12);
  const upperY = floorY + verticalMetres(5.2);
  const interior = new THREE.Group();
  interior.name = 'ENTRY__E2__WELCOME_REGISTRATION_INTERIOR';
  interior.visible = false;
  interior.userData = {
    runtimeInterior: true,
    roomId: 'welcome-registration-hall',
    isolatedWalkInterior: true,
    visibleOnlyInWalk: true,
    exteriorIsolationStrategy: 'ancestry-isolation-with-window-projections',
    runtimeInteriorBounds: {
      width,
      // Activate only after the camera is over the pocket floor. The generic
      // runtime-interior test adds 0.12 units of entry tolerance.
      depth: depth - 0.6,
      height: roomHeight + 0.6,
      center: [0, centerZ],
    },
    interiorZones: [
      'three-layer entrance vestibule',
      'dark threshold corridor',
      'grand atrium',
      'central scientific installation',
      'registration and credential fabrication',
      'orientation forum',
      'Living Index garden and waiting',
      'credential security threshold',
      'transit concourse',
      'upper observation ring and science gallery',
    ],
    materials: [
      'pale mineral stone',
      'warm gray terrazzo',
      'low-iron glass',
      'exterior-matched light blue walls',
      'satin titanium',
      'brushed champagne bronze',
      'charcoal acoustic panels',
      'continuous light ivory ceiling matching the exterior roof',
      'cyan-white interface lighting',
      'amber seating light',
    ],
    lightingStates: {
      daylight: 'bright mineral surfaces and soft projected exterior light',
      evening: 'scientific installation and ring emphasis',
      night: 'dim ceiling with illuminated routes, registration, garden, and model',
    },
    coloredLightPolicy: {
      white: 'neutral',
      cyan: 'active',
      amber: 'assistance',
      red: 'emergency only',
      violet: 'special events only',
    },
    modularRealTimeStrategy: {
      sharedPbrMaterials: true,
      compressedTextureTarget: 'mostly 1K; 2K reserved for hero terrazzo and island model',
      bakedHybridLighting: true,
      instancedRepeatedElements: [
        'registration pods',
        'forum seats',
        'garden plants',
        'ceiling coffers',
      ],
      simplifiedCollision: true,
      occlusionZones: [
        'vestibule',
        'threshold corridor',
        'atrium',
        'private rooms',
        'upper gallery',
        'transit concourse',
      ],
      transparentSurfacePolicy:
        'limited to entrances, room fronts, lifts, balustrades, and exterior projections',
      lodFeatures: [
        'island model',
        'suspended rings',
        'plants',
        'furniture',
        'gallery objects',
      ],
    },
  };
  facility.add(interior);
  const navigationBarriers: NavigationBarrier[] = [];
  const navigationGuide = addNavigationGuide(interior, navigationBarriers);
  const addBarrier = (
    start: [number, number, number],
    end: [number, number, number],
    radius = 0.045,
  ) => {
    navigationBarriers.push({ start, end, radius });
  };
  addBarrier([-width * 0.5, floorY, backZ], [-width * 0.5, floorY, frontZ]);
  addBarrier([width * 0.5, floorY, backZ], [width * 0.5, floorY, frontZ]);
  addBarrier([-width * 0.5, floorY, backZ], [width * 0.5, floorY, backZ]);
  addBarrier([-width * 0.5, floorY, frontZ], [-2.3, floorY, frontZ]);
  addBarrier([2.3, floorY, frontZ], [width * 0.5, floorY, frontZ]);

  const floor = addPlane(
    interior,
    'ENTRY__E2__INTERIOR_TERRAZZO_FLOOR',
    width,
    depth,
    palette.terrazzo,
    [0, floorY, centerZ],
  );
  floor.userData.surfaceKind = 'terrazzo';
  floor.userData.libraryRoom = 'welcome-registration-hall';
  floor.userData.heroSurfaceTextureBudget = '2K';
  [-1.15, 1.15].forEach((x, index) => {
    const band = addPlane(
      interior,
      `ENTRY__E2__PRIMARY_WALKING_BAND_${index + 1}`,
      0.34,
      depth - 1.4,
      palette.terrazzoDark,
      [x, floorY + 0.018, centerZ],
    );
    band.userData.libraryRoom = 'welcome-registration-hall';
  });
  for (let index = -7; index <= 7; index += 1) {
    addPlane(
      interior,
      `ENTRY__E2__BRONZE_COORDINATE_GRID_X_${index + 8}`,
      0.016,
      depth - 0.6,
      palette.bronze,
      [index, floorY + 0.026, centerZ],
      0,
      false,
    );
  }
  for (let index = 0; index <= 12; index += 1) {
    addPlane(
      interior,
      `ENTRY__E2__BRONZE_COORDINATE_GRID_Z_${index + 1}`,
      width - 0.6,
      0.016,
      palette.bronze,
      [0, floorY + 0.026, frontZ - 0.5 - index * 2],
      0,
      false,
    );
  }

  // Optimized shell: the real island will be hidden while these authored
  // projection panels provide the views through low-iron glass.
  [-1, 1].forEach((side) => {
    addBox(
      interior,
      `ENTRY__E2__ATRIUM_LOW_IRON_GLASS_WALL_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.14, roomHeight, depth],
      palette.glass,
      [side * width * 0.5, floorY, centerZ],
      { obstacle: false, castShadow: false },
    );
  });
  addBox(
    interior,
    'ENTRY__E2__ATRIUM_REAR_MINERAL_WALL',
    [width, roomHeight, 0.18],
    palette.wallBlue,
    [0, floorY, backZ],
  );
  const frontWingWidth = (width - 4.6) * 0.5;
  [-1, 1].forEach((side) => {
    addBox(
      interior,
      `ENTRY__E2__ATRIUM_FRONT_GLASS_WING_${side < 0 ? 'WEST' : 'EAST'}`,
      [frontWingWidth, roomHeight, 0.14],
      palette.glass,
      [side * (2.3 + frontWingWidth * 0.5), floorY, frontZ],
      { obstacle: false, castShadow: false },
    );
  });
  [
    ['WEST_BRIDGE', -7.51, -3.4, Math.PI * 0.5, 'bridge'],
    ['WEST_BIODOMES', -7.51, -10.2, Math.PI * 0.5, 'biodomes'],
    ['WEST_COAST', -7.51, -16.5, Math.PI * 0.5, 'coast'],
    ['EAST_LABS', 7.51, -3.4, -Math.PI * 0.5, 'laboratories'],
    ['EAST_TRANSIT', 7.51, -10.2, -Math.PI * 0.5, 'transit'],
    ['EAST_CITY', 7.51, -16.5, -Math.PI * 0.5, 'city'],
  ].forEach(([name, x, z, rotationY, subject]) => {
    addProjection(
      interior,
      String(name),
      [Number(x), floorY + verticalMetres(1), Number(z)],
      Number(rotationY),
      subject as 'bridge' | 'biodomes' | 'laboratories' | 'coast' | 'transit' | 'city',
      verticalMetres,
      palette.projection,
      palette.projectionSilhouette,
    );
  });

  const vestibule = new THREE.Group();
  vestibule.name = 'ENTRY__E2__THREE_LAYER_GLASS_ENTRANCE_VESTIBULE';
  vestibule.userData.interiorZone = 'entrance-and-threshold';
  interior.add(vestibule);
  [4.1, 3.45, 2.8].forEach((z, layerIndex) => {
    [-1, 1].forEach((side) => {
      addBox(
        vestibule,
        `ENTRY__E2__VESTIBULE_LAYER_${layerIndex + 1}_AUTOMATIC_GLASS_DOOR_${side < 0 ? 'WEST' : 'EAST'}`,
        [1.0, verticalMetres(3.1), 0.045],
        palette.glass,
        [side * 1.55, floorY, z],
        { obstacle: false, castShadow: false },
      );
      addBox(
        vestibule,
        `ENTRY__E2__VESTIBULE_LAYER_${layerIndex + 1}_TITANIUM_JAMB_${side < 0 ? 'WEST' : 'EAST'}`,
        [0.06, verticalMetres(3.35), 0.07],
        palette.titanium,
        [side * 2.25, floorY, z],
        { obstacle: false },
      );
    });
  });
  [-1.5, -0.5, 0.5, 1.5].forEach((x, index) => {
    addPlane(
      vestibule,
      `ENTRY__E2__VESTIBULE_DRAINAGE_CHANNEL_${index + 1}`,
      0.035,
      1.55,
      palette.charcoal,
      [x, floorY + 0.03, 3.45],
      0,
      false,
    );
  });
  [-1, 1].forEach((side) => {
    addBox(
      vestibule,
      `ENTRY__E2__UMBRELLA_DRYING_RECESS_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.7, verticalMetres(1.15), 0.42],
      palette.charcoal,
      [side * 2.75, floorY, 3.22],
    );
    addBox(
      vestibule,
      `ENTRY__E2__LUGGAGE_SPACE_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.9, verticalMetres(0.48), 0.5],
      palette.titanium,
      [side * 3.6, floorY, 3.22],
    );
    const planter = addBox(
      vestibule,
      `ENTRY__E2__COASTAL_GRASS_PLANTER_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.85, verticalMetres(0.35), 0.34],
      palette.bronze,
      [side * 4.65, floorY, 3.22],
    );
    planter.userData.plantCollection = 'coastal grasses';
  });
  addPlane(
    vestibule,
    'ENTRY__E2__ISLAND_DIRECTION_FLOOR_MARKING',
    2.8,
    0.08,
    palette.cyan,
    [0, floorY + 0.033, 2.55],
    0,
    false,
  );

  const threshold = new THREE.Group();
  threshold.name = 'ENTRY__E2__CHARCOAL_THRESHOLD_CORRIDOR';
  threshold.userData.interiorZone = 'threshold-corridor';
  interior.add(threshold);
  addBarrier([-2.3, floorY, 0.025], [-2.3, floorY, 2.475], 0.035);
  addBarrier([2.3, floorY, 0.025], [2.3, floorY, 2.475], 0.035);
  [-1, 1].forEach((side) => {
    addBox(
      threshold,
      `ENTRY__E2__THRESHOLD_CHARCOAL_WALL_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.12, verticalMetres(3.8), 2.45],
      palette.wallBlue,
      [side * 2.3, floorY, 1.25],
    );
  });
  for (let index = 0; index < 6; index += 1) {
    addBox(
      threshold,
      `ENTRY__E2__THRESHOLD_THIN_WHITE_CEILING_LIGHT_${index + 1}`,
      [0.055, verticalMetres(0.06), 1.8],
      palette.whiteLight,
      [-1.5 + index * 0.6, floorY + verticalMetres(3.55), 1.25],
      { obstacle: false, castShadow: false },
    );
  }
  ['WEATHER', 'ISLAND_ENERGY', 'SEAWATER', 'TRANSIT', 'PUBLIC_SCIENCE'].forEach(
    (label, index) => {
      const display = addBox(
        threshold,
        `ENTRY__E2__THRESHOLD_LIVE_DISPLAY_${label}`,
        [0.025, verticalMetres(0.44), 0.68],
        index === 4 ? palette.violet : palette.cyan,
        [
          index % 2 ? 2.225 : -2.225,
          floorY + verticalMetres(1.25),
          2.05 - Math.floor(index / 2) * 0.8,
        ],
        { obstacle: false, castShadow: false },
      );
      display.userData.displayMetric = label.toLowerCase().replaceAll('_', ' ');
      display.userData.liveDisplay = true;
    },
  );

  const installation = new THREE.Group();
  installation.name = 'ENTRY__E2__CENTRAL_SCIENTIFIC_INSTALLATION';
  installation.position.set(0, 0, -5);
  installation.userData.interiorZone = 'central-scientific-installation';
  interior.add(installation);
  addCylinder(
    installation,
    'ENTRY__E2__ISLAND_MODEL_BLACK_GLASS_BASIN',
    0.46,
    verticalMetres(0.16),
    palette.blackGlass,
    [0, floorY, 0],
    48,
  );
  const islandModel = addCylinder(
    installation,
    'ENTRY__E2__SIX_METRE_INTERACTIVE_ISLAND_MODEL',
    0.3,
    verticalMetres(0.3),
    palette.mineral,
    [0, floorY + verticalMetres(0.17), 0],
    48,
    false,
  );
  islandModel.scale.z = 0.78;
  islandModel.userData.modelDiameterMetres = 6;
  islandModel.userData.modelFeatures = [
    'terrain',
    'districts',
    'roads',
    'railway',
    'biodomes',
    'bridge',
    'airport',
    'coastline',
    'major laboratories',
  ];
  for (let index = 0; index < 15; index += 1) {
    const angle = index / 15 * Math.PI * 2;
    const radius = 0.08 + (index % 4) * 0.045;
    addBox(
      installation,
      `ENTRY__E2__ISLAND_MODEL_DISTRICT_${index + 1}`,
      [0.025, verticalMetres(0.12 + (index % 3) * 0.05), 0.025],
      index % 5 === 0 ? palette.cyan : palette.titanium,
      [
        Math.cos(angle) * radius,
        floorY + verticalMetres(0.46),
        Math.sin(angle) * radius,
      ],
      { obstacle: false, castShadow: false },
    );
  }
  for (let index = 0; index < 6; index += 1) {
    const angle = index / 6 * Math.PI * 2;
    const consoleGroup = new THREE.Group();
    consoleGroup.name = `ENTRY__E2__ISLAND_MODEL_INTERACTIVE_CONSOLE_${index + 1}`;
    consoleGroup.position.set(
      Math.cos(angle) * 0.72,
      floorY,
      Math.sin(angle) * 0.72,
    );
    consoleGroup.rotation.y = -angle + Math.PI * 0.5;
    installation.add(consoleGroup);
    addBox(
      consoleGroup,
      `${consoleGroup.name}__BASE`,
      [0.24, verticalMetres(0.72), 0.18],
      palette.charcoal,
      [0, 0, 0],
    );
    const panel = addBox(
      consoleGroup,
      `${consoleGroup.name}__ANGLED_INTERFACE`,
      [0.2, verticalMetres(0.08), 0.16],
      palette.cyan,
      [0, verticalMetres(0.72), -0.02],
      { obstacle: false, castShadow: false },
    );
    panel.rotation.x = -0.35;
  }
  const ringMaterials = [
    palette.titanium,
    palette.bronze,
    palette.glass,
    palette.cyan,
    palette.titanium,
  ];
  const ringRotations = [
    [0.15, 0, 0],
    [Math.PI * 0.5, 0.35, 0],
    [0.7, 0.55, 0.35],
    [1.15, -0.4, 0.65],
    [0.4, 1.0, -0.5],
  ] as const;
  for (let index = 0; index < 5; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.62 + index * 0.16,
        0.018 + index * 0.002,
        8,
        64,
      ),
      ringMaterials[index],
    );
    ring.name = `ENTRY__E2__SUSPENDED_ARMILLARY_RING_${index + 1}`;
    ring.position.set(0, floorY + verticalMetres(5.6), 0);
    const ringRotation = ringRotations[index];
    ring.rotation.set(ringRotation[0], ringRotation[1], ringRotation[2]);
    ring.userData.animate = 'welcome-interior-ring';
    ring.userData.rotationSpeed = 0.018 + index * 0.006;
    ring.userData.rotationAxis = index % 2 ? 'y' : 'z';
    ring.userData.lodLevels = 3;
    ring.userData.navObstacle = false;
    installation.add(ring);
  }

  const registration = new THREE.Group();
  registration.name = 'ENTRY__E2__REGISTRATION_AND_CREDENTIAL_ZONE';
  registration.userData.interiorZone = 'registration';
  interior.add(registration);
  addPlane(
    registration,
    'ENTRY__E2__REGISTRATION_DARK_TERRAZZO_ZONE',
    5.9,
    13.4,
    palette.terrazzoDark,
    [-4.55, floorY + 0.031, -9.25],
  );
  addWayfindingSign(
    registration,
    'ENTRY__E2__REGISTRATION_WAYFINDING',
    'REGISTRATION',
    'SELF-SERVICE  ·  STAFFED  ·  CREDENTIALS',
    [-7.48, floorY + verticalMetres(2.75), -5.8],
    Math.PI * 0.5,
  );
  const podPlacements: Placement[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let index = 0; index < 6; index += 1) {
      podPlacements.push({
        position: [
          -4.4 - row * 0.72 - Math.cos(index / 5 * Math.PI) * 0.32,
          floorY + verticalMetres(0.72),
          -2.6 - index * 0.78,
        ],
        rotationY: -0.18 + index / 5 * 0.36,
      });
    }
  }
  addInstancedBoxes(
    registration,
    'ENTRY__E2__TWELVE_SELF_REGISTRATION_POD_BODIES',
    [0.22, verticalMetres(1.44), 0.18],
    palette.mineral,
    podPlacements,
  ).userData.registrationPodCount = 12;
  addInstancedBoxes(
    registration,
    'ENTRY__E2__TWELVE_TRANSPARENT_POD_INTERFACES',
    [0.18, verticalMetres(0.5), 0.025],
    palette.cyan,
    podPlacements.map((placement) => ({
      ...placement,
      position: [
        placement.position[0],
        floorY + verticalMetres(1.25),
        placement.position[2] + 0.095,
      ],
    })),
  );
  const counterPlacements: Placement[] = Array.from({ length: 14 }, (_, index) => {
    const angle = THREE.MathUtils.lerp(2.05, 4.24, index / 13);
    return {
      position: [
        Math.cos(angle) * 5.55,
        floorY + verticalMetres(0.48),
        -9.2 + Math.sin(angle) * 4.65,
      ],
      rotationY: -angle - Math.PI * 0.5,
    };
  });
  addInstancedBoxes(
    registration,
    'ENTRY__E2__FOURTEEN_ACCESSIBLE_STAFFED_REGISTRATION_COUNTERS',
    [0.78, verticalMetres(0.96), 0.32],
    palette.bronze,
    counterPlacements,
  ).userData.staffedRegistrationStationCount = 14;
  addInstancedBoxes(
    registration,
    'ENTRY__E2__FOURTEEN_TRANSPARENT_ACOUSTIC_FINS',
    [0.025, verticalMetres(1.35), 0.38],
    palette.glass,
    counterPlacements.map((placement) => ({
      ...placement,
      position: [
        placement.position[0],
        floorY + verticalMetres(0.96),
        placement.position[2],
      ],
    })),
  );
  addBox(
    registration,
    'ENTRY__E2__WELCOME_AND_INFORMATION_DESK',
    [1.55, verticalMetres(0.88), 0.48],
    palette.mineral,
    [-3.7, floorY, -1.35],
  );
  for (let index = 0; index < 8; index += 1) {
    const roomZ = -8.2 - index * 1.1;
    const room = new THREE.Group();
    room.name = `ENTRY__E2__PRIVATE_REGISTRATION_ROOM_${index + 1}`;
    room.userData.privateRegistrationRoom = true;
    room.userData.openDoorwayWidthMetres = 5.6;
    registration.add(room);
    const roomMaterial = palette.wallBlue;
    addBox(
      room,
      `${room.name}__WEST_WALL`,
      [0.05, verticalMetres(3.2), 0.95],
      roomMaterial,
      [-7.2, floorY, roomZ],
      { castShadow: index % 2 !== 0 },
    );
    [-1, 1].forEach((side) => {
      addBox(
        room,
        `${room.name}__${side < 0 ? 'NORTH' : 'SOUTH'}_WALL`,
        [1.5, verticalMetres(3.2), 0.04],
        roomMaterial,
        [-6.45, floorY, roomZ + side * 0.475],
        { castShadow: index % 2 !== 0 },
      );
      addBox(
        room,
        `${room.name}__EAST_DOOR_JAMB_${side < 0 ? 'NORTH' : 'SOUTH'}`,
        [0.05, verticalMetres(3.2), 0.195],
        roomMaterial,
        [-5.7, floorY, roomZ + side * 0.3775],
        { castShadow: index % 2 !== 0 },
      );
    });
    addBox(
      room,
      `${room.name}__CEILING`,
      [1.5, verticalMetres(0.08), 0.95],
      palette.ceilingIvory,
      [-6.45, floorY + verticalMetres(3.2), roomZ],
      { obstacle: false },
    );
    addBarrier([-7.2, floorY, roomZ - 0.475], [-7.2, floorY, roomZ + 0.475], 0.025);
    addBarrier([-7.2, floorY, roomZ - 0.475], [-5.7, floorY, roomZ - 0.475], 0.025);
    addBarrier([-7.2, floorY, roomZ + 0.475], [-5.7, floorY, roomZ + 0.475], 0.025);
    addBarrier([-5.7, floorY, roomZ - 0.475], [-5.7, floorY, roomZ - 0.28], 0.025);
    addBarrier([-5.7, floorY, roomZ + 0.28], [-5.7, floorY, roomZ + 0.475], 0.025);
  }
  const credentialLab = new THREE.Group();
  credentialLab.name = 'ENTRY__E2__GLASS_CREDENTIAL_FABRICATION_LABORATORY';
  credentialLab.position.set(-3.4, 0, -14.5);
  credentialLab.userData.credentialFabricationLab = true;
  registration.add(credentialLab);
  const credentialEnclosure = new THREE.Group();
  credentialEnclosure.name = 'ENTRY__E2__CREDENTIAL_LAB_GLASS_ENCLOSURE';
  credentialEnclosure.userData.openDoorwayWidthMetres = 7;
  credentialLab.add(credentialEnclosure);
  addBox(
    credentialEnclosure,
    `${credentialEnclosure.name}__WEST_WALL`,
    [0.05, verticalMetres(3.5), 1.55],
    palette.glass,
    [-2.025, floorY, 0],
    { castShadow: false },
  );
  [-1, 1].forEach((side) => {
    addBox(
      credentialEnclosure,
      `${credentialEnclosure.name}__${side < 0 ? 'NORTH' : 'SOUTH'}_WALL`,
      [4.05, verticalMetres(3.5), 0.05],
      palette.glass,
      [0, floorY, side * 0.75],
      { castShadow: false },
    );
    addBox(
      credentialEnclosure,
      `${credentialEnclosure.name}__EAST_DOOR_JAMB_${side < 0 ? 'NORTH' : 'SOUTH'}`,
      [0.05, verticalMetres(3.5), 0.4],
      palette.glass,
      [2.025, floorY, side * 0.55],
      { castShadow: false },
    );
  });
  addBox(
    credentialEnclosure,
    `${credentialEnclosure.name}__CEILING`,
    [4.1, verticalMetres(0.08), 1.55],
    palette.ceilingIvory,
    [0, floorY + verticalMetres(3.5), 0],
    { obstacle: false },
  );
  addBarrier([-5.425, floorY, -15.25], [-5.425, floorY, -13.75], 0.025);
  addBarrier([-5.425, floorY, -15.25], [-1.375, floorY, -15.25], 0.025);
  addBarrier([-5.425, floorY, -13.75], [-1.375, floorY, -13.75], 0.025);
  addBarrier([-1.375, floorY, -15.25], [-1.375, floorY, -14.85], 0.025);
  addBarrier([-1.375, floorY, -14.15], [-1.375, floorY, -13.75], 0.025);
  const labX = [-1.25, -0.42, 0.42, 1.25];
  addInstancedBoxes(
    credentialLab,
    'ENTRY__E2__CREDENTIAL_LAB_MODULAR_WORKBENCHES',
    [0.7, verticalMetres(0.86), 0.32],
    palette.titanium,
    labX.map((x) => ({
      position: [x, floorY + verticalMetres(0.43), 0],
    })),
  );
  addInstancedBoxes(
    credentialLab,
    'ENTRY__E2__CREDENTIAL_LAB_BADGE_PRINTERS_AND_SMALL_MACHINES',
    [0.24, verticalMetres(0.32), 0.22],
    palette.charcoal,
    labX.map((x) => ({
      position: [x, floorY + verticalMetres(1.02), 0],
    })),
  );
  addBox(
    credentialLab,
    'ENTRY__E2__CREDENTIAL_LAB_ROBOTIC_STORAGE',
    [0.55, verticalMetres(2.35), 0.42],
    palette.titanium,
    [-1.72, floorY, 0],
  );

  const forum = new THREE.Group();
  forum.name = 'ENTRY__E2__OVAL_ORIENTATION_FORUM';
  forum.userData.interiorZone = 'orientation-forum';
  interior.add(forum);
  addPlane(
    forum,
    'ENTRY__E2__ORIENTATION_FORUM_DARK_TERRAZZO_ZONE',
    5.25,
    8.8,
    palette.terrazzoDark,
    [4.75, floorY + 0.031, -7.5],
  );
  addWayfindingSign(
    forum,
    'ENTRY__E2__ORIENTATION_FORUM_WAYFINDING',
    'ORIENTATION FORUM',
    'ISLAND BRIEFINGS  ·  PUBLIC LABS  ·  RESTRICTED AREAS',
    [7.48, floorY + verticalMetres(2.75), -7],
    -Math.PI * 0.5,
  );
  const seatPlacements: Placement[] = [];
  for (let tier = 0; tier < 5; tier += 1) {
    const tierBase = floorY + verticalMetres(tier * 0.16);
    const tierFloor = addBox(
      forum,
      `ENTRY__E2__ORIENTATION_FORUM_TIER_${tier + 1}`,
      [3.85 - tier * 0.16, verticalMetres(0.16), 0.68],
      palette.terrazzoDark,
      [4.85, tierBase, -5.2 - tier * 0.73],
      { obstacle: false, walkable: true },
    );
    tierFloor.userData.libraryRoom = 'welcome-orientation-forum';
    for (let seat = 0; seat < 18; seat += 1) {
      seatPlacements.push({
        position: [
          3.12 + seat * 0.2,
          tierBase + verticalMetres(0.44),
          -5.2 - tier * 0.73,
        ],
        rotationY: Math.PI * 0.5,
      });
    }
  }
  addInstancedBoxes(
    forum,
    'ENTRY__E2__ORIENTATION_FORUM_NINETY_SEATS',
    [0.055, verticalMetres(0.48), 0.055],
    palette.mineral,
    seatPlacements,
  ).userData.forumSeatCount = 90;
  addBox(
    forum,
    'ENTRY__E2__SEAMLESS_MATTE_PRESENTATION_WALL',
    [0.14, verticalMetres(4.1), 4.8],
    palette.charcoal,
    [7.15, floorY, -7],
  );
  addBarrier([7.15, floorY, -9.4], [7.15, floorY, -4.6], 0.04);
  addBox(
    forum,
    'ENTRY__E2__FLOOR_RETRACTABLE_LECTERN',
    [0.28, verticalMetres(1.05), 0.28],
    palette.titanium,
    [6.48, floorY, -7],
  );
  for (let index = 0; index < 4; index += 1) {
    const table = addCylinder(
      forum,
      `ENTRY__E2__INTERACTIVE_ORIENTATION_TABLE_${index + 1}`,
      0.24,
      verticalMetres(0.78),
      index % 2 ? palette.titanium : palette.bronze,
      [
        2.7 + (index % 2) * 0.8,
        floorY,
        -10 - Math.floor(index / 2) * 1.2,
      ],
      24,
    );
    table.userData.orientationTopics = [
      'island districts',
      'transport routes',
      'public laboratories',
      'restricted areas',
      'accommodation',
      'weather',
    ];
  }

  const livingIndex = new THREE.Group();
  livingIndex.name = 'ENTRY__E2__LIVING_INDEX_SCIENTIFIC_GARDEN';
  livingIndex.position.set(0.75, 0, -12.4);
  livingIndex.userData.interiorZone = 'Living Index';
  livingIndex.userData.gardenLengthMetres = 22;
  livingIndex.userData.referenceModel = 'low-glass botanical research display';
  livingIndex.userData.botanicalSectionCount = 6;
  livingIndex.userData.plantMorphologyTypes = [
    'broadleaf canopy',
    'fern fronds',
    'coastal grasses',
    'moss cushions',
    'flowering medicinal plants',
  ];
  livingIndex.userData.growLightCount = 3;
  livingIndex.userData.mistEmitterCount = 9;
  interior.add(livingIndex);
  addWayfindingSign(
    interior,
    'ENTRY__E2__LIVING_INDEX_WAYFINDING',
    'LIVING INDEX',
    'COASTAL  ·  MEDICINAL  ·  EARLY LINEAGES',
    [7.48, floorY + verticalMetres(2.35), -13.2],
    -Math.PI * 0.5,
  );

  // A low, genuinely hollow glass case replaces the former translucent solid
  // block. The four visible panels and matching navigation segments make the
  // exhibit boundary legible from both long circulation aisles.
  addBox(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_DARK_RECESSED_PLANTER_BASE',
    [0.8, verticalMetres(0.18), 2.26],
    palette.charcoal,
    [0, floorY, 0],
    { castShadow: true },
  );
  addBox(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_RICH_SOIL_BED',
    [0.73, verticalMetres(0.12), 2.18],
    palette.gardenDark,
    [0, floorY + verticalMetres(0.18), 0],
  );
  const caseHeight = verticalMetres(0.54);
  [
    ['WEST', [0.024, caseHeight, 2.3], [-0.41, floorY, 0]],
    ['EAST', [0.024, caseHeight, 2.3], [0.41, floorY, 0]],
    ['NORTH', [0.82, caseHeight, 0.024], [0, floorY, -1.15]],
    ['SOUTH', [0.82, caseHeight, 0.024], [0, floorY, 1.15]],
  ].forEach(([side, size, position]) => {
    addBox(
      livingIndex,
      `ENTRY__E2__LIVING_INDEX_LOW_GLASS_CASE_${side}`,
      size as [number, number, number],
      palette.glass,
      position as [number, number, number],
      { castShadow: false },
    );
  });
  [-0.41, 0.41].forEach((x, index) => {
    addBox(
      livingIndex,
      `ENTRY__E2__LIVING_INDEX_TITANIUM_TOP_RAIL_${index + 1}`,
      [0.025, verticalMetres(0.025), 2.3],
      palette.titanium,
      [x, floorY + caseHeight, 0],
      { obstacle: false, castShadow: false },
    );
  });

  const botanicalSections = [
    { title: 'COASTAL', detail: 'salt-tolerant species' },
    { title: 'MEDICINAL', detail: 'therapeutic lineages' },
    { title: 'MATERIALS', detail: 'renewable biomatter' },
    { title: 'EARLY FLORA', detail: 'land-plant lineages' },
    { title: 'SHADE LIFE', detail: 'fern and understory' },
    { title: 'ATMOSPHERE', detail: 'air-quality sentinels' },
  ] as const;
  [
    {
      side: 'WEST',
      position: [-0.424, floorY + verticalMetres(0.3), 0] as const,
      rotationY: -Math.PI * 0.5,
    },
    {
      side: 'EAST',
      position: [0.424, floorY + verticalMetres(0.3), 0] as const,
      rotationY: Math.PI * 0.5,
    },
  ].forEach(({ side, position, rotationY }) => {
    const label = addBotanicalLabelStrip(
      livingIndex,
      `ENTRY__E2__LIVING_INDEX_SIX_SECTION_SCIENTIFIC_LABEL_STRIP_${side}`,
      botanicalSections,
      position,
      rotationY,
      verticalMetres,
    );
    if (label) label.userData.readableFromGardenAisle = side;
  });

  const sectionCenter = (section: number) => -0.88 + section * 0.352;
  const stemPlacements: DetailedPlacement[] = Array.from({ length: 18 }, (_, index) => {
    const section = Math.floor(index / 3);
    const member = index % 3;
    const heightScale = 0.58 + ((section + member * 2) % 5) * 0.16;
    return {
      position: [
        -0.22 + member * 0.22 + (section % 2) * 0.03,
        floorY + verticalMetres(0.3 + 0.52 * heightScale),
        sectionCenter(section) + (member - 1) * 0.085,
      ],
      rotation: [
        (member - 1) * 0.15,
        section * 0.73 + member * 1.4,
        (section % 2 ? -1 : 1) * (0.09 + member * 0.04),
      ],
      scale: [0.82 + member * 0.08, heightScale, 0.82 + member * 0.08],
    };
  });
  addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_EIGHTEEN_NATURAL_BRANCHING_STEMS',
    new THREE.CylinderGeometry(0.008, 0.013, verticalMetres(1.04), 7),
    palette.gardenDark,
    stemPlacements,
  );

  const plantPlacements: DetailedPlacement[] = Array.from({ length: 48 }, (_, index) => {
    const section = Math.floor(index / 8);
    const member = index % 8;
    const layer = Math.floor(member / 4);
    return {
      position: [
        -0.27 + (member % 4) * 0.18 + (section % 2) * 0.018,
        floorY + verticalMetres(0.48 + layer * 0.48 + ((section + member) % 3) * 0.12),
        sectionCenter(section) + (member % 2 ? 0.075 : -0.075) + layer * 0.025,
      ],
      rotation: [
        0.38 + (member % 3) * 0.17,
        section * 1.17 + member * 0.91,
        (member % 2 ? 1 : -1) * (0.48 + (member % 4) * 0.08),
      ],
      scale: [
        0.26 + (member % 3) * 0.07,
        0.12 + ((section + member) % 4) * 0.035,
        1.02 + (member % 4) * 0.16,
      ],
    };
  });
  const plants = addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_INSTANCED_CURATED_PLANTS',
    new THREE.SphereGeometry(0.055, 12, 8),
    palette.gardenLeafDeep,
    plantPlacements,
  );
  plants.userData.instanceCount = 48;
  plants.userData.collections = [
    'coastal plants',
    'medicinal plants',
    'early plant lineages',
    'material-producing species',
    'shade-adapted species',
    'atmospheric monitoring plants',
  ];
  plants.userData.lodLevels = 3;

  const shrubPlacements: DetailedPlacement[] = Array.from({ length: 24 }, (_, index) => {
    const section = Math.floor(index / 4);
    const member = index % 4;
    return {
      position: [
        -0.25 + member * 0.17 + (section % 2) * 0.025,
        floorY + verticalMetres(0.48 + (member % 2) * 0.18 + (section % 3) * 0.08),
        sectionCenter(section) + (member % 2 ? 0.09 : -0.09),
      ],
      rotation: [index * 0.17, index * 0.83, index * 0.11],
      scale: [
        0.58 + (member % 3) * 0.13,
        0.52 + ((section + member) % 3) * 0.14,
        0.62 + (section % 3) * 0.12,
      ],
    };
  });
  addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_TWENTY_FOUR_DENSE_SHRUB_CANOPIES',
    new THREE.IcosahedronGeometry(0.052, 1),
    palette.gardenLeafDeep,
    shrubPlacements,
  );

  const freshLeafPlacements: DetailedPlacement[] = Array.from(
    { length: 36 },
    (_, index) => {
      const section = Math.floor(index / 6);
      const member = index % 6;
      return {
        position: [
          -0.25 + (member % 3) * 0.25,
          floorY + verticalMetres(0.42 + (member % 2) * 0.34 + (section % 3) * 0.08),
          sectionCenter(section) - 0.105 + Math.floor(member / 3) * 0.2,
        ],
        rotation: [
          0.5 + (member % 2) * 0.22,
          index * 1.37,
          (member % 2 ? 1 : -1) * (0.42 + (member % 3) * 0.14),
        ],
        scale: [0.3, 0.13, 1.32 + (member % 3) * 0.18],
      };
    },
  );
  addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_THIRTY_SIX_FRESH_BROAD_LEAVES',
    new THREE.SphereGeometry(0.047, 10, 7),
    palette.gardenLeafFresh,
    freshLeafPlacements,
  );

  const fernPlacements: DetailedPlacement[] = Array.from({ length: 30 }, (_, index) => {
    const section = [1, 3, 4][Math.floor(index / 10)];
    const member = index % 10;
    const angle = member / 10 * Math.PI * 2;
    return {
      position: [
        Math.cos(angle) * (0.12 + (member % 3) * 0.035),
        floorY + verticalMetres(0.38 + (member % 2) * 0.1),
        sectionCenter(section) + Math.sin(angle) * 0.12,
      ],
      rotation: [0.2 + (member % 3) * 0.12, angle, (member % 2 ? 1 : -1) * 0.32],
      scale: [0.28, 0.16, 1.62],
    };
  });
  addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_THIRTY_ARCHING_FERN_FRONDS',
    new THREE.SphereGeometry(0.043, 10, 6),
    palette.garden,
    fernPlacements,
  );

  const grassPlacements: DetailedPlacement[] = Array.from({ length: 42 }, (_, index) => {
    const section = index < 21 ? 0 : 5;
    const member = index % 21;
    return {
      position: [
        -0.29 + (member % 7) * 0.095,
        floorY + verticalMetres(0.34),
        sectionCenter(section) - 0.12 + Math.floor(member / 7) * 0.12,
      ],
      rotation: [0, index * 1.91, (member % 2 ? 1 : -1) * 0.12],
      scale: [0.7, 0.72 + (member % 5) * 0.12, 0.7],
    };
  });
  addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_FORTY_TWO_COASTAL_GRASS_BLADES',
    new THREE.ConeGeometry(0.011, verticalMetres(0.74), 5),
    palette.gardenLeafFresh,
    grassPlacements,
  );

  const mossPlacements: DetailedPlacement[] = Array.from({ length: 30 }, (_, index) => ({
    position: [
      -0.3 + (index % 6) * 0.12,
      floorY + verticalMetres(0.34),
      -0.98 + Math.floor(index / 6) * 0.49 + (index % 2) * 0.06,
    ],
    rotation: [0, index * 0.63, 0],
    scale: [0.82 + (index % 3) * 0.25, 0.24 + (index % 2) * 0.08, 0.72],
  }));
  addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_THIRTY_MOSS_CUSHIONS',
    new THREE.SphereGeometry(0.045, 10, 6),
    palette.gardenMoss,
    mossPlacements,
  );

  const flowerPlacements: DetailedPlacement[] = Array.from({ length: 24 }, (_, index) => {
    const section = index < 12 ? 1 : 2;
    const member = index % 12;
    return {
      position: [
        -0.28 + (member % 4) * 0.18,
        floorY + verticalMetres(0.52 + (member % 3) * 0.12),
        sectionCenter(section) - 0.12 + Math.floor(member / 4) * 0.11,
      ],
      scale: [0.7 + (member % 2) * 0.25, 0.62, 0.7 + (member % 2) * 0.25],
    };
  });
  const violetFlowers = addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_TWELVE_VIOLET_MEDICINAL_FLOWERS',
    new THREE.SphereGeometry(0.014, 9, 6),
    palette.violet,
    flowerPlacements.slice(0, 12),
    false,
  );
  violetFlowers.userData.botanicalFlowerCount = 12;
  const amberFlowers = addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_TWELVE_AMBER_MEDICINAL_FLOWERS',
    new THREE.SphereGeometry(0.012, 9, 6),
    palette.amber,
    flowerPlacements.slice(12),
    false,
  );
  amberFlowers.userData.botanicalFlowerCount = 12;

  // The suspended horticultural system follows the reference's long linear
  // luminaires, with restrained white light and a localized humidification
  // cloud rather than a scene-wide fog volume.
  [-0.25, 0, 0.25].forEach((x, index) => {
    addBox(
      livingIndex,
      `ENTRY__E2__LIVING_INDEX_SUSPENDED_GROW_LIGHT_${index + 1}`,
      [0.145, verticalMetres(0.065), 2.08],
      palette.whiteLight,
      [x, floorY + verticalMetres(2.62), 0],
      { obstacle: false, castShadow: false },
    );
    [-0.78, 0.78].forEach((z, cableIndex) => {
      addCylinder(
        livingIndex,
        `ENTRY__E2__LIVING_INDEX_GROW_LIGHT_CABLE_${index * 2 + cableIndex + 1}`,
        0.004,
        verticalMetres(1.75),
        palette.charcoal,
        [x, floorY + verticalMetres(2.685), z],
        6,
        false,
      );
    });
    const horticulturalLight = new THREE.PointLight('#d8eadc', 0.52, 2.7, 2);
    horticulturalLight.name = `ENTRY__E2__LIVING_INDEX_HORTICULTURAL_LIGHT_${index + 1}`;
    horticulturalLight.position.set(x, floorY + verticalMetres(2.53), 0);
    horticulturalLight.castShadow = false;
    livingIndex.add(horticulturalLight);
  });

  const mistPlacements: DetailedPlacement[] = Array.from({ length: 9 }, (_, index) => ({
    position: [
      -0.23 + (index % 3) * 0.23,
      floorY + verticalMetres(1.72 + (index % 2) * 0.22),
      -0.72 + Math.floor(index / 3) * 0.72,
    ],
    rotation: [0, index * 0.74, 0],
    scale: [1.35 + (index % 2) * 0.35, 0.28, 1.08],
  }));
  const mist = addInstancedGeometry(
    livingIndex,
    'ENTRY__E2__LIVING_INDEX_NINE_LOCALIZED_MIST_PLUMES',
    new THREE.SphereGeometry(0.11, 12, 7),
    palette.gardenMist,
    mistPlacements,
    false,
  );
  mist.renderOrder = 6;
  mist.userData.animate = 'living-index-humidity-drift';

  // This stable authored anchor replaces the former browser-only import. Its
  // invisible proxy registers it as one editable interior component before
  // the large GLB is lazy-loaded by IslandWorld. Consequently Save/Refresh
  // persists the wrapper transform without serializing a 26.7 MB binary into
  // LocalStorage, while the project-owned source is rebuilt every time.
  livingIndex.children.forEach((child) => {
    child.userData.projectAssetFallback = true;
  });
  const persistentGarden = new THREE.Group();
  persistentGarden.name = 'ENTRY__E2__LIVING_INDEX_PERSISTENT_GLB_GARDEN';
  persistentGarden.position.set(0, floorY, 0);
  persistentGarden.userData = {
    projectAssetUrl: REGISTRATION_GARDEN_ASSET_URL,
    projectAssetSha256: REGISTRATION_GARDEN_ASSET_SHA256,
    projectAssetState: 'unloaded',
    projectAssetKind: 'registration-hall-interior-garden',
    projectAssetSource: 'authored-project-asset',
    projectAssetLazyPolicy: 'load-when-registration-interior-is-visible',
    // The supplied source is 18.58 x 13.32 x 4.82 m. Its long source axis is
    // rotated north/south at load time; these local targets compensate the
    // Hall's compressed Y scale so the final world dimensions remain a
    // proportionate 13.4 x 18.8 x 4.85 m rather than a flattened miniature.
    projectAssetTargetSize: [1.34, verticalMetres(4.85), 1.88],
    projectAssetFallbackGroupName: livingIndex.name,
    editable: true,
    collisionEnabled: false,
  };
  const persistenceProxy = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, verticalMetres(4.85), 1.88),
    palette.garden,
  );
  persistenceProxy.name = 'ENTRY__E2__LIVING_INDEX_GARDEN_PERSISTENCE_PROXY';
  persistenceProxy.position.y = verticalMetres(2.425);
  persistenceProxy.visible = false;
  persistenceProxy.userData.navObstacle = false;
  persistenceProxy.userData.walkable = false;
  persistentGarden.add(persistenceProxy);
  livingIndex.add(persistentGarden);

  addBarrier([0.08, floorY, -13.34], [0.08, floorY, -11.46], 0.018);
  addBarrier([1.42, floorY, -13.34], [1.42, floorY, -11.46], 0.018);
  addBarrier([0.08, floorY, -13.34], [1.42, floorY, -13.34], 0.018);
  addBarrier([0.08, floorY, -11.46], [1.42, floorY, -11.46], 0.018);

  addInstancedBoxes(
    interior,
    'ENTRY__E2__WAITING_ACOUSTIC_SEATS_AND_WHEELCHAIR_CLUSTERS',
    [0.65, verticalMetres(0.5), 0.42],
    palette.mineral,
    [
      [-1.8, -11.3, 0.1],
      [-1.8, -12.4, -0.15],
      [-1.8, -13.5, 0.08],
      [2.8, -11.3, -0.12],
      [2.8, -12.4, 0.14],
      [2.8, -13.5, -0.08],
    ].map(([x, z, rotationY]) => ({
      position: [x, floorY + verticalMetres(0.46), z],
      rotationY,
    })),
  ).userData.accessibleWaitingLayout = true;
  const hydration = addCylinder(
    interior,
    'ENTRY__E2__UNBRANDED_CIRCULAR_HYDRATION_STATION',
    0.34,
    verticalMetres(0.95),
    palette.bronze,
    [3.65, floorY, -13.6],
    32,
  );
  hydration.userData.services = ['water', 'tea', 'coffee', 'reusable cups'];

  const security = new THREE.Group();
  security.name = 'ENTRY__E2__CREDENTIAL_AND_SECURITY_THRESHOLD';
  security.userData.interiorZone = 'security-threshold';
  interior.add(security);
  addPlane(
    security,
    'ENTRY__E2__SECURITY_THRESHOLD_DARK_TERRAZZO_ZONE',
    13.4,
    1.55,
    palette.terrazzoDark,
    [0, floorY + 0.031, -16.45],
  );
  addWayfindingSign(
    security,
    'ENTRY__E2__SECURITY_AND_TRANSIT_WAYFINDING',
    'SECURITY & TRANSIT',
    'LABS  ·  BIODOMES  ·  HOTEL  ·  AIRPORT',
    [0, floorY + verticalMetres(2.75), -16.58],
  );
  for (let portal = 0; portal < 6; portal += 1) {
    const x = -5.25 + portal * 2.1;
    [-1, 1].forEach((side) => {
      addBox(
        security,
        `ENTRY__E2__SECURITY_PORTAL_${portal + 1}_PALE_SENSOR_${side < 0 ? 'WEST' : 'EAST'}`,
        [0.13, verticalMetres(2.8), 0.28],
        palette.mineral,
        [x + side * 0.62, floorY, -16.45],
      );
    });
    addBox(
      security,
      `ENTRY__E2__SECURITY_PORTAL_${portal + 1}_HIDDEN_GLASS_GATE`,
      [1.12, verticalMetres(1.18), 0.025],
      palette.glass,
      [x, floorY, -16.45],
      { obstacle: false, castShadow: false },
    );
    addPlane(
      security,
      `ENTRY__E2__SECURITY_PORTAL_${portal + 1}_FLOOR_CONFIRMATION`,
      0.82,
      0.12,
      palette.cyan,
      [x, floorY + 0.032, -16.15],
      0,
      false,
    );
  }
  [-1, 1].forEach((side) => {
    addBox(
      security,
      `ENTRY__E2__LOW_SECURITY_CONSOLE_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.85, verticalMetres(0.78), 0.45],
      palette.titanium,
      [side * 6.45, floorY, -16],
    );
  });

  const concourse = new THREE.Group();
  concourse.name = 'ENTRY__E2__POST_SECURITY_TRANSIT_CONCOURSE';
  concourse.userData.interiorZone = 'transit-concourse';
  interior.add(concourse);
  const routeNames = [
    'LABS',
    'BIODOMES',
    'RESIDENTIAL',
    'MALL',
    'HOTEL',
    'AIRPORT',
    'TRANSIT',
  ];
  routeNames.forEach((routeName, index) => {
    addPlane(
      concourse,
      `ENTRY__E2__TRANSIT_ROUTE_LINE_${routeName}`,
      0.1,
      3.4,
      index === 4 ? palette.amber : index === 6 ? palette.violet : palette.cyan,
      [-4.8 + index * 1.6, floorY + 0.034, -18.7],
      (index - 3) * 0.035,
      false,
    );
  });
  const transitDirectory = addBox(
    concourse,
    'ENTRY__E2__TRANSIT_CONCOURSE_DIRECTORY',
    [4.8, verticalMetres(0.62), 0.055],
    palette.blackGlass,
    [0, floorY + verticalMetres(2.1), backZ + 0.11],
    { obstacle: false, castShadow: false },
  );
  transitDirectory.userData.destinations = routeNames;

  const upper = new THREE.Group();
  upper.name = 'ENTRY__E2__UPPER_OBSERVATION_RING';
  upper.userData.interiorZone = 'upper-observation-and-science-gallery';
  upper.userData.completeMezzanineLevel = true;
  upper.userData.connectedCirculation = [
    'sculptural stair landing',
    'east observation and meeting wing',
    'front atrium bridge',
    'rear gallery bridge',
    'west science gallery wing',
  ];
  interior.add(upper);
  const upperFloorY = upperY + verticalMetres(0.16);
  const sideDeckCenterX = 6;
  const sideDeckWidth = 2.35;
  const innerDeckX = sideDeckCenterX - sideDeckWidth * 0.5;
  const addUpperBalustrade = (
    name: string,
    start: readonly [number, number],
    end: readonly [number, number],
  ) => {
    const deltaX = end[0] - start[0];
    const deltaZ = end[1] - start[1];
    const length = Math.hypot(deltaX, deltaZ);
    const midpoint: [number, number, number] = [
      (start[0] + end[0]) * 0.5,
      upperFloorY,
      (start[1] + end[1]) * 0.5,
    ];
    const glass = addBox(
      upper,
      `${name}__GLASS`,
      [length, verticalMetres(1.15), 0.055],
      palette.glass,
      midpoint,
      { obstacle: false, castShadow: false },
    );
    glass.rotation.y = Math.atan2(-deltaZ, deltaX);
    const handrail = addBox(
      upper,
      `${name}__BRONZE_HANDRAIL`,
      [length, verticalMetres(0.08), 0.075],
      palette.bronze,
      [midpoint[0], upperFloorY + verticalMetres(1.18), midpoint[2]],
      { obstacle: false, castShadow: false },
    );
    handrail.rotation.y = glass.rotation.y;
    addBarrier(
      [start[0], upperFloorY, start[1]],
      [end[0], upperFloorY, end[1]],
      0.03,
    );
  };
  [-1, 1].forEach((side) => {
    const deck = addBox(
      upper,
      `ENTRY__E2__UPPER_OBSERVATION_DECK_${side < 0 ? 'WEST' : 'EAST'}`,
      [sideDeckWidth, verticalMetres(0.16), 18.6],
      palette.mineral,
      [side * sideDeckCenterX, upperY, -7.9],
      { obstacle: false, walkable: true },
    );
    deck.userData.libraryRoom = 'welcome-upper-observation-ring';
    if (side < 0) {
      addUpperBalustrade(
        'ENTRY__E2__UPPER_WEST_INNER_BALUSTRADE',
        [-innerDeckX, -16.25],
        [-innerDeckX, -0.65],
      );
    } else {
      addUpperBalustrade(
        'ENTRY__E2__UPPER_EAST_INNER_BALUSTRADE',
        [innerDeckX, -14.15],
        [innerDeckX, -0.65],
      );
    }
    addBarrier(
      [side * width * 0.5, upperFloorY, -17],
      [side * width * 0.5, upperFloorY, 1.4],
      0.035,
    );
  });
  const rearDeck = addBox(
    upper,
    'ENTRY__E2__UPPER_REAR_VIEWING_PLATFORM',
    [12, verticalMetres(0.16), 2.2],
    palette.mineral,
    [0, upperY, -17.35],
    { obstacle: false, walkable: true },
  );
  rearDeck.userData.libraryRoom = 'welcome-upper-observation-ring';
  rearDeck.userData.upperLevelBridge = 'rear';
  const frontDeck = addBox(
    upper,
    'ENTRY__E2__UPPER_FRONT_ATRIUM_BRIDGE',
    [12, verticalMetres(0.16), 2.1],
    palette.mineral,
    [0, upperY, 0.4],
    { obstacle: false, walkable: true },
  );
  frontDeck.userData.libraryRoom = 'welcome-upper-observation-ring';
  frontDeck.userData.upperLevelBridge = 'front';
  const stairLanding = addBox(
    upper,
    'ENTRY__E2__UPPER_SCULPTURAL_STAIR_LANDING',
    [2.6, verticalMetres(0.16), 1.7],
    palette.ceilingIvory,
    [5, upperY, -15.7],
    { obstacle: false, walkable: true },
  );
  stairLanding.userData.libraryRoom = 'welcome-upper-observation-ring';
  stairLanding.userData.upperLevelStairLanding = true;
  addUpperBalustrade(
    'ENTRY__E2__UPPER_FRONT_BRIDGE_INNER_BALUSTRADE',
    [-innerDeckX, -0.65],
    [innerDeckX, -0.65],
  );
  addUpperBalustrade(
    'ENTRY__E2__UPPER_FRONT_BRIDGE_OUTER_BALUSTRADE',
    [-innerDeckX, 1.45],
    [innerDeckX, 1.45],
  );
  addUpperBalustrade(
    'ENTRY__E2__UPPER_REAR_BRIDGE_INNER_BALUSTRADE',
    [-innerDeckX, -16.25],
    [3.7, -16.25],
  );
  addUpperBalustrade(
    'ENTRY__E2__UPPER_REAR_BRIDGE_OUTER_BALUSTRADE',
    [-6, -18.45],
    [6, -18.45],
  );
  addUpperBalustrade(
    'ENTRY__E2__UPPER_STAIR_LANDING_WEST_BALUSTRADE',
    [3.7, -16.25],
    [3.7, -14.95],
  );
  addWayfindingSign(
    upper,
    'ENTRY__E2__UPPER_LEVEL_DIRECTORY',
    'UPPER LEVEL',
    'MEETING · SCIENCE GALLERY · QUIET SUITE',
    [5.95, upperFloorY + verticalMetres(2.15), -16.1],
    Math.PI,
  );
  const stairCount = 26;
  const stairRiseMetres = 5.2 / stairCount;
  for (let index = 0; index < stairCount; index += 1) {
    const rise = verticalMetres(stairRiseMetres);
    const step = addBox(
      upper,
      `ENTRY__E2__BROAD_SCULPTURAL_STAIR_STEP_${index + 1}`,
      [1.7, rise, 0.18],
      index % 4 === 0 ? palette.bronze : palette.mineral,
      [4.75, floorY + index * rise, -10.3 - index * 0.18],
      { obstacle: false, walkable: true },
    );
    step.userData.libraryRoom = 'welcome-sculptural-stair';
    step.userData.riserMetres = stairRiseMetres;
  }
  addBarrier([3.9, floorY, -10.3], [3.9, upperY, -14.8], 0.025);
  addBarrier([5.6, floorY, -10.3], [5.6, upperY, -14.8], 0.025);
  [-1, 1].forEach((side) => {
    addBox(
      upper,
      `ENTRY__E2__PANORAMIC_GLASS_LIFT_${side < 0 ? 'WEST' : 'EAST'}`,
      [1.1, roomHeight - verticalMetres(0.6), 1.1],
      palette.glass,
      [side * sideDeckCenterX, floorY, -17.45],
      { castShadow: false },
    );
    const liftLanding = addPlane(
      upper,
      `ENTRY__E2__PANORAMIC_GLASS_LIFT_${side < 0 ? 'WEST' : 'EAST'}_UPPER_LANDING`,
      1,
      1,
      palette.titanium,
      [side * sideDeckCenterX, upperY + verticalMetres(0.17), -17.45],
    );
    liftLanding.userData.libraryRoom = 'welcome-panoramic-lift';
    liftLanding.userData.liftLanding = 'upper';
  });
  [
    ['MATERIAL_SAMPLES', -3, palette.bronze],
    ['TRANSPARENT_BIOREACTOR', -6, palette.glass],
    ['ROBOTIC_MECHANISMS', -9, palette.titanium],
    ['GEOLOGICAL_CORES', -12, palette.terrazzoDark],
    ['ENVIRONMENTAL_SENSORS', -14.6, palette.cyan],
  ].forEach(([name, z, exhibitMaterial], index) => {
    addCylinder(
      upper,
      `ENTRY__E2__UPPER_SCIENCE_GALLERY_${name}_PLINTH`,
      0.38 + index * 0.02,
      verticalMetres(0.18),
      palette.ceilingIvory,
      [-6.25, upperFloorY, Number(z)],
      24,
      false,
    );
    const exhibit = addCylinder(
      upper,
      `ENTRY__E2__UPPER_SCIENCE_GALLERY_${name}`,
      0.28 + index * 0.02,
      verticalMetres(1.25 + index * 0.12),
      exhibitMaterial as THREE.Material,
      [-6.25, upperFloorY + verticalMetres(0.18), Number(z)],
      18,
    );
    exhibit.userData.lodLevels = 3;
  });
  addWayfindingSign(
    upper,
    'ENTRY__E2__UPPER_SCIENCE_GALLERY_DIRECTORY',
    'SCIENCE GALLERY',
    'MATERIALS · ROBOTICS · ENVIRONMENT',
    [-6.85, upperFloorY + verticalMetres(2.1), -2.1],
    Math.PI * 0.5,
  );
  [-2.7, 2.7].forEach((x, index) => {
    addBox(
      upper,
      `ENTRY__E2__UPPER_FRONT_BRIDGE_VIEWING_BENCH_${index + 1}`,
      [1.1, verticalMetres(0.44), 0.28],
      palette.bronze,
      [x, upperFloorY, 0.65],
      { obstacle: false },
    );
    addCylinder(
      upper,
      `ENTRY__E2__UPPER_FRONT_BRIDGE_VIEWING_SCOPE_${index + 1}`,
      0.09,
      verticalMetres(1.2),
      palette.titanium,
      [x, upperFloorY, -0.05],
      16,
      false,
    );
  });
  for (let index = 0; index < 3; index += 1) {
    const roomZ = -4 - index * 4.1;
    const room = new THREE.Group();
    room.name = index === 2
      ? 'ENTRY__E2__UPPER_QUIET_LOW_STIMULATION_ARRIVAL_SUITE'
      : `ENTRY__E2__UPPER_INSTITUTIONAL_MEETING_ROOM_${index + 1}`;
    room.userData.upperRoom = true;
    room.userData.openToObservationDeck = true;
    upper.add(room);
    const roomMaterial = palette.wallBlue;
    addBox(
      room,
      `${room.name}__OUTER_WALL`,
      [0.05, verticalMetres(3.1), 2.2],
      roomMaterial,
      [7.16, upperY + verticalMetres(0.16), roomZ],
      { castShadow: index === 2 },
    );
    [-1, 1].forEach((side) => {
      addBox(
        room,
        `${room.name}__${side < 0 ? 'NORTH' : 'SOUTH'}_WALL`,
        [0.72, verticalMetres(3.1), 0.04],
        roomMaterial,
        [6.8, upperY + verticalMetres(0.16), roomZ + side * 1.08],
        { castShadow: index === 2 },
      );
    });
    addBox(
      room,
      `${room.name}__CEILING`,
      [0.72, verticalMetres(0.08), 2.2],
      palette.ceilingIvory,
      [6.8, upperY + verticalMetres(3.26), roomZ],
      { obstacle: false },
    );
    addBarrier(
      [7.16, upperY + verticalMetres(0.16), roomZ - 1.1],
      [7.16, upperY + verticalMetres(0.16), roomZ + 1.1],
      0.025,
    );
    addBarrier(
      [6.44, upperY + verticalMetres(0.16), roomZ - 1.08],
      [7.16, upperY + verticalMetres(0.16), roomZ - 1.08],
      0.025,
    );
    addBarrier(
      [6.44, upperY + verticalMetres(0.16), roomZ + 1.08],
      [7.16, upperY + verticalMetres(0.16), roomZ + 1.08],
      0.025,
    );
    if (index < 2) {
      addBox(
        room,
        `${room.name}__COLLABORATION_TABLE`,
        [0.3, verticalMetres(0.06), 0.82],
        palette.bronze,
        [6.8, upperFloorY + verticalMetres(0.72), roomZ],
        { obstacle: false },
      );
      addBox(
        room,
        `${room.name}__COLLABORATION_TABLE_PEDESTAL`,
        [0.08, verticalMetres(0.72), 0.12],
        palette.titanium,
        [6.8, upperFloorY, roomZ],
        { obstacle: false },
      );
      const meetingSeatPlacements: Placement[] = [-0.42, 0, 0.42].flatMap(
        (zOffset) => ([
          {
            position: [
              6.56,
              upperFloorY + verticalMetres(0.46),
              roomZ + zOffset,
            ],
          },
          {
            position: [
              7.04,
              upperFloorY + verticalMetres(0.46),
              roomZ + zOffset,
            ],
          },
        ]),
      );
      addInstancedBoxes(
        room,
        `${room.name}__SIX_ACCESSIBLE_MEETING_SEATS`,
        [0.055, verticalMetres(0.08), 0.055],
        palette.ceilingIvory,
        meetingSeatPlacements,
      );
      addInstancedBoxes(
        room,
        `${room.name}__SIX_ACCESSIBLE_MEETING_SEAT_BACKS`,
        [0.035, verticalMetres(0.52), 0.055],
        palette.ceilingIvory,
        [-0.42, 0, 0.42].flatMap((zOffset) => ([
          {
            position: [
              6.5,
              upperFloorY + verticalMetres(0.74),
              roomZ + zOffset,
            ],
          },
          {
            position: [
              7.1,
              upperFloorY + verticalMetres(0.74),
              roomZ + zOffset,
            ],
          },
        ])) as Placement[],
      );
      addBox(
        room,
        `${room.name}__SHARED_DISPLAY`,
        [0.025, verticalMetres(1.05), 0.82],
        palette.blackGlass,
        [7.11, upperFloorY + verticalMetres(1.05), roomZ],
        { obstacle: false, castShadow: false },
      );
    } else {
      [-0.48, 0.48].forEach((zOffset, seatIndex) => {
        addBox(
          room,
          `${room.name}__LOW_STIMULATION_LOUNGE_${seatIndex + 1}`,
          [0.3, verticalMetres(0.08), 0.48],
          palette.ceilingIvory,
          [6.8, upperFloorY + verticalMetres(0.42), roomZ + zOffset],
          { obstacle: false },
        );
        addBox(
          room,
          `${room.name}__LOW_STIMULATION_LOUNGE_${seatIndex + 1}_BACK`,
          [0.055, verticalMetres(0.58), 0.48],
          palette.ceilingIvory,
          [7.02, upperFloorY + verticalMetres(0.42), roomZ + zOffset],
          { obstacle: false },
        );
      });
      addCylinder(
        room,
        `${room.name}__LOW_STIMULATION_SIDE_TABLE`,
        0.1,
        verticalMetres(0.52),
        palette.bronze,
        [6.56, upperFloorY, roomZ],
        20,
        false,
      );
      addBox(
        room,
        `${room.name}__ACOUSTIC_WARM_LIGHT_PANEL`,
        [0.025, verticalMetres(1.25), 0.9],
        palette.amber,
        [7.11, upperFloorY + verticalMetres(0.9), roomZ],
        { obstacle: false, castShadow: false },
      );
    }
  }

  const ceiling = new THREE.Group();
  ceiling.name = 'ENTRY__E2__RADIAL_ACOUSTIC_CEILING_SYSTEM';
  ceiling.userData.interiorZone = 'ceiling-and-lighting';
  ceiling.userData.finishMatchesExteriorRoof = true;
  interior.add(ceiling);
  const ceilingSkin = addBox(
    ceiling,
    'ENTRY__E2__CONTINUOUS_LIGHT_IVORY_CEILING_SKIN',
    [width - 0.12, verticalMetres(0.1), depth - 0.12],
    palette.ceilingIvory,
    [0, floorY + roomHeight - verticalMetres(0.11), centerZ],
    { obstacle: false, castShadow: false },
  );
  ceilingSkin.userData.exteriorRoofColor = '#e3e5df';
  ceilingSkin.userData.continuousCeiling = true;
  const cofferPlacements: Placement[] = Array.from({ length: 24 }, (_, index) => {
    const angle = index / 24 * Math.PI * 2;
    return {
      position: [
        Math.cos(angle) * 3.8,
        floorY + roomHeight - verticalMetres(0.18),
        -5 + Math.sin(angle) * 5.2,
      ],
      rotationY: -angle,
      scale: [1, 1, 0.7 + Math.abs(Math.sin(angle)) * 0.45],
    };
  });
  const coffers = addInstancedBoxes(
    ceiling,
    'ENTRY__E2__TWENTY_FOUR_RADIAL_ACOUSTIC_COFFERS',
    [0.16, verticalMetres(0.32), 5.4],
    palette.ceilingIvory,
    cofferPlacements,
  );
  coffers.userData.integratedSystems = [
    'ventilation',
    'speakers',
    'sensors',
    'fire systems',
    'linear lights',
  ];
  const membrane = addCylinder(
    ceiling,
    'ENTRY__E2__ELLIPTICAL_LUMINOUS_CEILING_MEMBRANE',
    4.2,
    verticalMetres(0.08),
    palette.ceilingIvory,
    [0, floorY + roomHeight - verticalMetres(0.14), -5],
    64,
    false,
  );
  membrane.scale.z = 0.58;
  membrane.userData.artificialSkylight = true;
  navigationGuide.userData.barrierCount = navigationBarriers.length;
  navigationGuide.userData.doorwayGaps = [
    'main entrance',
    'eight private registration rooms',
    'credential fabrication laboratory',
    'six security portals',
    'sculptural stair landing',
    'east and west observation-deck links',
    'front and rear upper bridges',
    'two meeting rooms',
    'quiet arrival suite',
  ];

  Object.assign(interior.userData, {
    exteriorProjectionCount: 6,
    entranceDoorLayerCount: 3,
    selfRegistrationPodCount: 12,
    staffedRegistrationStationCount: 14,
    privateRegistrationRoomCount: 8,
    credentialFabricationLabCount: 1,
    orientationForumTierCount: 5,
    orientationForumSeatCount: 90,
    orientationTableCount: 4,
    livingIndexLengthMetres: 22,
    securityPortalCount: 6,
    suspendedRingCount: 5,
    upperObservationLevel: true,
    upperMezzaninePlatformCount: 5,
    upperFurnishedRoomCount: 3,
    upperLevelLoopComplete: true,
    wallFinishColor: '#8fbac2',
    ceilingFinishColor: '#e3e5df',
    continuousLightCeiling: true,
    broadSculpturalStairCount: stairCount,
    walkableFloorCount: 1 + 5 + 2 + 2 + 1 + 2 + stairCount,
    preciseWalkBarrierCount: navigationBarriers.length,
    walkCollisionPolicy:
      'rotated aggregate bounds disabled; visible architecture uses precise local barrier segments',
    walkTestZones: [
      'entrance vestibule',
      'threshold corridor',
      'central atrium west bypass',
      'central atrium east bypass',
      'self-registration pods',
      'staffed registration counters',
      'eight private registration rooms',
      'credential fabrication laboratory',
      'orientation forum',
      'four orientation tables',
      'Living Index on both sides',
      'six security portals',
      'transit concourse',
      'sculptural stair and upper landing',
      'east upper deck',
      'three upper rooms',
      'rear upper crossover',
      'west science gallery',
      'front upper atrium bridge',
      'complete upper mezzanine loop',
      'two panoramic lifts',
      'exit vestibule',
    ],
  });
  Object.assign(facility.userData, {
    runtimeInteriorCenter: [0, centerZ],
    runtimeInteriorHeight: roomHeight + 0.6,
    runtimeInteriorFootprint: [width, depth],
    welcomeInteriorRoomCount: 10,
    welcomeInteriorStrategy: 'isolated-pocket-space-with-window-projections',
    welcomeInteriorProgramComplete: true,
  });
  return interior;
}
