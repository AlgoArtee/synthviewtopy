import * as THREE from 'three';

export type EditorWorkspace = 'landscape' | 'interior';

export interface EditorAssetCatalogItem {
  id: string;
  name: string;
  workspace: EditorWorkspace;
  category: string;
  kind: 'building' | 'prop' | 'interior';
  accent: string;
  description: string;
  footprint: [number, number];
  height: number;
}

/**
 * World scale follows the island editor convention: one unit is approximately ten metres.
 * Interior assets are therefore intentionally expressed in fractions of a world unit.
 */
export const EDITOR_ASSET_CATALOG: EditorAssetCatalogItem[] = [
  {
    id: 'landscape-research-pavilion',
    name: 'Research Pavilion',
    workspace: 'landscape',
    category: 'buildings',
    kind: 'building',
    accent: '#63f1d6',
    description: 'Low-rise glass research pavilion with twin laboratory wings, an atrium, and a planted roof.',
    footprint: [6.4, 4.8],
    height: 2.5,
  },
  {
    id: 'landscape-modular-wet-lab',
    name: 'Modular Wet Lab',
    workspace: 'landscape',
    category: 'buildings',
    kind: 'building',
    accent: '#74c8ff',
    description: 'Expandable clean laboratory blocks with service spines, exhaust stacks, and a glazed link.',
    footprint: [6.8, 5.2],
    height: 3.1,
  },
  {
    id: 'landscape-observation-tower',
    name: 'Observation Tower',
    workspace: 'landscape',
    category: 'buildings',
    kind: 'building',
    accent: '#d9ff66',
    description: 'Slender scientific lookout with a panoramic observation pod and luminous communications crown.',
    footprint: [3.6, 3.6],
    height: 5.8,
  },
  {
    id: 'landscape-transit-shelter',
    name: 'Autonomous Transit Shelter',
    workspace: 'landscape',
    category: 'buildings',
    kind: 'building',
    accent: '#ffcc70',
    description: 'Open pedestrian shelter with smart glass, seating, route display, and a solar canopy.',
    footprint: [3.8, 1.8],
    height: 0.75,
  },
  {
    id: 'landscape-solar-canopy',
    name: 'Heliostat Solar Canopy',
    workspace: 'landscape',
    category: 'energy',
    kind: 'prop',
    accent: '#7de6ff',
    description: 'Tracking photovoltaic canopy with battery plinth and illuminated charging points.',
    footprint: [2.6, 1.7],
    height: 0.75,
  },
  {
    id: 'landscape-data-sculpture',
    name: 'Kinetic Data Sculpture',
    workspace: 'landscape',
    category: 'public-realm',
    kind: 'prop',
    accent: '#f58cff',
    description: 'Layered orbital sculpture that visualizes live research and environmental telemetry.',
    footprint: [1.2, 1.2],
    height: 1.65,
  },
  {
    id: 'landscape-bioswale-planter',
    name: 'Bioswale Planter',
    workspace: 'landscape',
    category: 'landscape',
    kind: 'prop',
    accent: '#91e772',
    description: 'Modular rain garden with native planting, moisture sensors, and a timber sitting edge.',
    footprint: [2.2, 0.9],
    height: 0.34,
  },
  {
    id: 'landscape-drone-dock',
    name: 'Service Drone Dock',
    workspace: 'landscape',
    category: 'infrastructure',
    kind: 'prop',
    accent: '#ff986c',
    description: 'Weatherproof autonomous drone pad with guidance beacons, charging arm, and service cabinet.',
    footprint: [1.45, 1.45],
    height: 0.42,
  },
  {
    id: 'landscape-smart-lamp-array',
    name: 'Smart Lamp Array',
    workspace: 'landscape',
    category: 'public-realm',
    kind: 'prop',
    accent: '#b7f5ff',
    description: 'Three adaptive pathway lights with environmental sensors and softly shielded luminaires.',
    footprint: [1.8, 0.45],
    height: 0.9,
  },
  {
    id: 'landscape-field-rover',
    name: 'Autonomous Field Rover',
    workspace: 'landscape',
    category: 'infrastructure',
    kind: 'prop',
    accent: '#ffc45c',
    description: 'Compact electric science rover with sensor mast, sample bay, and articulated wheel modules.',
    footprint: [1.15, 0.72],
    height: 0.58,
  },
  {
    id: 'interior-wet-lab-bench',
    name: 'Wet Lab Bench',
    workspace: 'interior',
    category: 'lab',
    kind: 'interior',
    accent: '#56e5ca',
    description: 'Double-pedestal laboratory bench with sink, reagent rail, drawers, and integrated task light.',
    footprint: [0.3, 0.1],
    height: 0.105,
  },
  {
    id: 'interior-biosafety-cabinet',
    name: 'Biosafety Cabinet',
    workspace: 'interior',
    category: 'lab',
    kind: 'interior',
    accent: '#68cbff',
    description: 'Glazed biosafety enclosure with stainless work tray, extraction hood, and control display.',
    footprint: [0.19, 0.095],
    height: 0.225,
  },
  {
    id: 'interior-holo-microscope',
    name: 'Holographic Microscope Station',
    workspace: 'interior',
    category: 'lab',
    kind: 'interior',
    accent: '#ad85ff',
    description: 'Optical analysis station with articulated microscope, specimen deck, and holographic display.',
    footprint: [0.18, 0.13],
    height: 0.155,
  },
  {
    id: 'interior-cryo-freezer',
    name: 'Cryogenic Sample Freezer',
    workspace: 'interior',
    category: 'lab',
    kind: 'interior',
    accent: '#6ee8ff',
    description: 'High-density sample freezer with insulated drawers, status panel, and backup coolant cylinder.',
    footprint: [0.13, 0.105],
    height: 0.225,
  },
  {
    id: 'interior-focus-workstation',
    name: 'Research Workstation',
    workspace: 'interior',
    category: 'office',
    kind: 'interior',
    accent: '#78aaff',
    description: 'Height-adjustable desk with dual displays, keyboard, desk light, and compact task chair.',
    footprint: [0.24, 0.13],
    height: 0.145,
  },
  {
    id: 'interior-conference-table',
    name: 'Collaboration Table',
    workspace: 'interior',
    category: 'office',
    kind: 'interior',
    accent: '#ffa66f',
    description: 'Eight-seat collaboration table with recessed power rail and central holographic projector.',
    footprint: [0.4, 0.2],
    height: 0.13,
  },
  {
    id: 'interior-ergonomic-chair',
    name: 'Ergonomic Task Chair',
    workspace: 'interior',
    category: 'furniture',
    kind: 'interior',
    accent: '#9bb3c7',
    description: 'Adjustable mesh-backed swivel chair with five-star base and articulated armrests.',
    footprint: [0.075, 0.075],
    height: 0.125,
  },
  {
    id: 'interior-modular-sofa',
    name: 'Modular Lounge Sofa',
    workspace: 'interior',
    category: 'furniture',
    kind: 'interior',
    accent: '#e3b8ff',
    description: 'Soft three-seat lounge module with separate cushions, side arms, and illuminated plinth.',
    footprint: [0.24, 0.105],
    height: 0.105,
  },
  {
    id: 'interior-storage-shelf',
    name: 'Modular Storage Shelf',
    workspace: 'interior',
    category: 'furniture',
    kind: 'interior',
    accent: '#b8dc72',
    description: 'Open laboratory shelving with adjustable trays, labeled bins, and a lockable lower cabinet.',
    footprint: [0.17, 0.065],
    height: 0.22,
  },
  {
    id: 'interior-server-rack',
    name: 'Compute Server Rack',
    workspace: 'interior',
    category: 'systems',
    kind: 'interior',
    accent: '#52e4ff',
    description: 'Liquid-cooled compute rack with removable blade modules, vented doors, and status lighting.',
    footprint: [0.1, 0.12],
    height: 0.235,
  },
  {
    id: 'interior-cleanroom-airlock',
    name: 'Cleanroom Airlock',
    workspace: 'interior',
    category: 'systems',
    kind: 'interior',
    accent: '#72f4d2',
    description: 'Pass-through glazed airlock with sliding door leaves, pressure indicator, and floor threshold.',
    footprint: [0.22, 0.18],
    height: 0.27,
  },
  {
    id: 'interior-utility-console',
    name: 'Building Systems Console',
    workspace: 'interior',
    category: 'systems',
    kind: 'interior',
    accent: '#ffca70',
    description: 'Angled facility-control console with touch display, emergency controls, and service access.',
    footprint: [0.15, 0.085],
    height: 0.15,
  },
];

interface AssetMaterials {
  shell: THREE.MeshPhysicalMaterial;
  pale: THREE.MeshPhysicalMaterial;
  dark: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshStandardMaterial;
  fabric: THREE.MeshStandardMaterial;
  plant: THREE.MeshStandardMaterial;
}

interface PartOptions {
  obstacle?: boolean;
  walkable?: boolean;
  shadows?: boolean;
  surface?: 'floor' | 'worktop' | 'seat' | 'shelf' | 'threshold' | 'charging-pad';
}

function material<T extends THREE.Material>(value: T, name: string): T {
  value.name = `EDITOR_MAT__${name}`;
  return value;
}

function makeMaterials(accent: string): AssetMaterials {
  return {
    shell: material(
      new THREE.MeshPhysicalMaterial({
        color: '#d8e1df',
        roughness: 0.3,
        metalness: 0.3,
        clearcoat: 0.32,
        clearcoatRoughness: 0.28,
      }),
      'ARCHITECTURAL_SHELL',
    ),
    pale: material(
      new THREE.MeshPhysicalMaterial({
        color: '#f1f5f2',
        roughness: 0.27,
        metalness: 0.12,
        clearcoat: 0.24,
      }),
      'PALE_COMPOSITE',
    ),
    dark: material(new THREE.MeshStandardMaterial({ color: '#172429', roughness: 0.4, metalness: 0.62 }), 'DARK_FRAME'),
    metal: material(new THREE.MeshStandardMaterial({ color: '#74858a', roughness: 0.28, metalness: 0.82 }), 'BRUSHED_METAL'),
    accent: material(
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 1.8,
        roughness: 0.2,
        metalness: 0.32,
      }),
      'ACCENT_GLOW',
    ),
    glass: material(
      new THREE.MeshPhysicalMaterial({
        color: accent,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.14,
        transparent: true,
        opacity: 0.54,
        transmission: 0.26,
        thickness: 0.12,
        roughness: 0.12,
        metalness: 0.08,
        side: THREE.DoubleSide,
      }),
      'SMART_GLASS',
    ),
    rubber: material(new THREE.MeshStandardMaterial({ color: '#111719', roughness: 0.78, metalness: 0.08 }), 'RUBBER'),
    fabric: material(new THREE.MeshStandardMaterial({ color: '#52646d', roughness: 0.92, metalness: 0.02 }), 'TEXTILE'),
    plant: material(new THREE.MeshStandardMaterial({ color: '#4f8755', roughness: 0.88, metalness: 0 }), 'FOLIAGE'),
  };
}

function addMesh(
  parent: THREE.Object3D,
  name: string,
  geometry: THREE.BufferGeometry,
  meshMaterial: THREE.Material,
  position: [number, number, number],
  options: PartOptions = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = options.shadows ?? true;
  mesh.receiveShadow = options.shadows ?? true;
  mesh.userData.editorPart = name;
  if (options.obstacle) mesh.userData.navObstacle = true;
  if (options.walkable) mesh.userData.walkable = true;
  if (options.surface) {
    mesh.userData.surfaceKind = options.surface;
    mesh.userData.interactionSurface = true;
  }
  parent.add(mesh);
  return mesh;
}

function box(
  parent: THREE.Object3D,
  name: string,
  width: number,
  height: number,
  depth: number,
  meshMaterial: THREE.Material,
  x: number,
  y: number,
  z: number,
  options: PartOptions = {},
) {
  return addMesh(parent, name, new THREE.BoxGeometry(width, height, depth), meshMaterial, [x, y, z], options);
}

function cylinder(
  parent: THREE.Object3D,
  name: string,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
  meshMaterial: THREE.Material,
  x: number,
  y: number,
  z: number,
  options: PartOptions = {},
) {
  return addMesh(
    parent,
    name,
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    meshMaterial,
    [x, y, z],
    options,
  );
}

function sphere(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  meshMaterial: THREE.Material,
  x: number,
  y: number,
  z: number,
  options: PartOptions = {},
) {
  return addMesh(parent, name, new THREE.SphereGeometry(radius, 16, 10), meshMaterial, [x, y, z], options);
}

function torus(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  tube: number,
  meshMaterial: THREE.Material,
  x: number,
  y: number,
  z: number,
  options: PartOptions = {},
) {
  return addMesh(parent, name, new THREE.TorusGeometry(radius, tube, 8, 32), meshMaterial, [x, y, z], options);
}

function addFoundation(group: THREE.Group, width: number, depth: number, materials: AssetMaterials) {
  box(group, 'FOUNDATION__WALKABLE_PLAZA', width, 0.12, depth, materials.dark, 0, 0.06, 0, {
    walkable: true,
    surface: 'floor',
  });
  const inset = box(group, 'FOUNDATION__ACCENT_INLAY', width * 0.82, 0.016, depth * 0.82, materials.accent, 0, 0.128, 0, {
    shadows: false,
  });
  inset.userData.decorative = true;
}

function addEntryFacade(
  group: THREE.Group,
  width: number,
  frontZ: number,
  baseY: number,
  doorHeight: number,
  materials: AssetMaterials,
) {
  const doorWidth = Math.max(0.38, Math.min(width * 0.2, 0.9));
  box(group, 'ENTRY__GLAZED_DOOR', doorWidth, doorHeight, 0.035, materials.glass, 0, baseY + doorHeight * 0.5, frontZ, {
    shadows: false,
  });
  for (const x of [-doorWidth * 0.55, doorWidth * 0.55]) {
    box(group, `ENTRY__JAMB_${x < 0 ? 'LEFT' : 'RIGHT'}`, 0.055, doorHeight + 0.12, 0.09, materials.metal, x, baseY + doorHeight * 0.5, frontZ, {
      obstacle: true,
    });
  }
  box(group, 'ENTRY__LINTEL', doorWidth + 0.16, 0.06, 0.1, materials.metal, 0, baseY + doorHeight + 0.03, frontZ, {
    obstacle: true,
  });
  box(group, 'ENTRY__THRESHOLD', doorWidth * 0.9, 0.02, 0.22, materials.accent, 0, baseY + 0.01, frontZ + 0.08, {
    walkable: true,
    shadows: false,
    surface: 'threshold',
  });
}

function buildResearchPavilion(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  addFoundation(group, width, depth, m);
  const base = 0.14;
  const wingHeight = height * 0.66;
  box(group, 'PAVILION__WEST_LAB_WING', width * 0.38, wingHeight, depth * 0.68, m.shell, -width * 0.25, base + wingHeight * 0.5, 0, {
    obstacle: true,
  });
  box(group, 'PAVILION__EAST_LAB_WING', width * 0.38, wingHeight * 0.88, depth * 0.68, m.pale, width * 0.25, base + wingHeight * 0.44, 0, {
    obstacle: true,
  });
  box(group, 'PAVILION__GLASS_ATRIUM', width * 0.18, wingHeight * 0.78, depth * 0.52, m.glass, 0, base + wingHeight * 0.39, 0, {
    obstacle: true,
    shadows: false,
  });
  box(group, 'PAVILION__FLOATING_ROOF', width * 0.93, 0.13, depth * 0.77, m.dark, 0, base + wingHeight + 0.16, 0, {
    obstacle: true,
  });
  for (const x of [-width * 0.33, -width * 0.17, width * 0.17, width * 0.33]) {
    box(group, `PAVILION__FACADE_FIN_${Math.round(x * 100)}`, 0.065, wingHeight * 0.7, 0.12, m.accent, x, base + wingHeight * 0.48, depth * 0.35, {
      shadows: false,
    });
  }
  const roofSoil = box(group, 'PAVILION__GREEN_ROOF_BED', width * 0.54, 0.08, depth * 0.4, m.rubber, 0, base + wingHeight + 0.27, -depth * 0.03, {
    obstacle: true,
    surface: 'shelf',
  });
  roofSoil.userData.plantingBed = true;
  for (const x of [-0.26, -0.13, 0, 0.13, 0.26]) {
    sphere(group, `PAVILION__ROOF_PLANT_${x}`, Math.min(width, depth) * 0.045, m.plant, x * width, base + wingHeight + 0.39, 0);
  }
  addEntryFacade(group, width, depth * 0.345 + 0.025, base, Math.min(0.52, wingHeight * 0.55), m);
}

function buildModularWetLab(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  addFoundation(group, width, depth, m);
  const base = 0.14;
  const modules = [
    { x: -0.27, z: -0.17, w: 0.42, d: 0.45, h: 0.72 },
    { x: 0.2, z: 0.12, w: 0.44, d: 0.5, h: 0.86 },
    { x: 0.24, z: -0.3, w: 0.28, d: 0.26, h: 0.58 },
  ];
  modules.forEach((module, index) => {
    const moduleHeight = height * module.h;
    box(
      group,
      `WET_LAB__MODULE_${index + 1}`,
      width * module.w,
      moduleHeight,
      depth * module.d,
      index === 1 ? m.pale : m.shell,
      width * module.x,
      base + moduleHeight * 0.5,
      depth * module.z,
      { obstacle: true },
    );
    for (let band = 1; band <= 3; band += 1) {
      box(
        group,
        `WET_LAB__MODULE_${index + 1}_LIGHT_BAND_${band}`,
        width * module.w * 0.78,
        0.045,
        0.035,
        m.accent,
        width * module.x,
        base + moduleHeight * (band / 4),
        depth * module.z + depth * module.d * 0.505,
        { shadows: false },
      );
    }
  });
  box(group, 'WET_LAB__GLAZED_LINK', width * 0.3, height * 0.2, depth * 0.17, m.glass, 0, base + height * 0.46, 0, {
    obstacle: true,
    shadows: false,
  });
  for (const x of [-width * 0.31, -width * 0.2, width * 0.2, width * 0.31]) {
    const stackHeight = height * (0.18 + Math.abs(x / width) * 0.12);
    cylinder(group, `WET_LAB__EXHAUST_${Math.round(x * 100)}`, 0.1, 0.13, stackHeight, 12, m.metal, x, base + height * 0.74 + stackHeight * 0.5, -depth * 0.17, {
      obstacle: true,
    });
    cylinder(group, `WET_LAB__EXHAUST_CAP_${Math.round(x * 100)}`, 0.15, 0.11, 0.08, 12, m.accent, x, base + height * 0.74 + stackHeight + 0.04, -depth * 0.17);
  }
  addEntryFacade(group, width, depth * 0.38, base, Math.min(0.56, height * 0.22), m);
}

function buildObservationTower(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  addFoundation(group, width, depth, m);
  const base = 0.14;
  cylinder(group, 'TOWER__PODIUM', width * 0.34, width * 0.39, height * 0.12, 24, m.dark, 0, base + height * 0.06, 0, {
    obstacle: true,
  });
  cylinder(group, 'TOWER__CENTRAL_SHAFT', width * 0.12, width * 0.17, height * 0.7, 18, m.shell, 0, base + height * 0.43, 0, {
    obstacle: true,
  });
  for (let level = 1; level <= 5; level += 1) {
    torus(group, `TOWER__SHAFT_LIGHT_RING_${level}`, width * 0.13, 0.035, m.accent, 0, base + height * (0.18 + level * 0.1), 0, {
      shadows: false,
    }).rotation.x = Math.PI / 2;
  }
  const pod = sphere(group, 'TOWER__PANORAMIC_POD', width * 0.3, m.glass, 0, base + height * 0.78, 0, {
    obstacle: true,
    shadows: false,
  });
  pod.scale.y = 0.52;
  torus(group, 'TOWER__POD_FRAME', width * 0.3, 0.07, m.metal, 0, base + height * 0.78, 0, { obstacle: true }).rotation.x = Math.PI / 2;
  cylinder(group, 'TOWER__ANTENNA', 0.035, 0.06, height * 0.2, 8, m.metal, 0, base + height * 0.94, 0, {
    obstacle: true,
  });
  sphere(group, 'TOWER__BEACON', 0.09, m.accent, 0, base + height * 1.045, 0, { shadows: false });
  addEntryFacade(group, width, depth * 0.37, base, Math.min(0.5, height * 0.1), m);
}

function buildTransitShelter(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  addFoundation(group, width, depth, m);
  const base = 0.14;
  for (const x of [-width * 0.42, width * 0.42]) {
    for (const z of [-depth * 0.33, depth * 0.33]) {
      cylinder(group, `SHELTER__POST_${Math.round(x * 100)}_${Math.round(z * 100)}`, 0.04, 0.055, height * 0.78, 8, m.metal, x, base + height * 0.39, z, {
        obstacle: true,
      });
    }
  }
  const roof = box(group, 'SHELTER__SOLAR_ROOF', width * 0.96, 0.09, depth * 0.9, m.dark, 0, base + height * 0.82, 0, {
    obstacle: true,
  });
  roof.rotation.z = THREE.MathUtils.degToRad(-4);
  for (const x of [-0.33, -0.11, 0.11, 0.33]) {
    box(group, `SHELTER__SOLAR_CELL_${x}`, width * 0.19, 0.012, depth * 0.72, m.glass, width * x, base + height * 0.875, 0, {
      shadows: false,
    }).rotation.z = THREE.MathUtils.degToRad(-4);
  }
  box(group, 'SHELTER__REAR_SMART_GLASS', width * 0.82, height * 0.58, 0.025, m.glass, 0, base + height * 0.34, -depth * 0.36, {
    obstacle: true,
    shadows: false,
  });
  box(group, 'SHELTER__BENCH_SEAT', width * 0.55, 0.07, depth * 0.22, m.fabric, -width * 0.08, base + 0.16, -depth * 0.13, {
    obstacle: true,
    surface: 'seat',
  });
  box(group, 'SHELTER__BENCH_BACK', width * 0.55, 0.22, 0.055, m.fabric, -width * 0.08, base + 0.27, -depth * 0.22, { obstacle: true });
  box(group, 'SHELTER__ROUTE_DISPLAY', width * 0.15, height * 0.46, 0.045, m.accent, width * 0.35, base + height * 0.34, -depth * 0.32, {
    shadows: false,
  });
}

function buildSolarCanopy(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'SOLAR_CANOPY__CHARGING_DECK', width, 0.07, depth, m.dark, 0, 0.035, 0, {
    walkable: true,
    surface: 'charging-pad',
  });
  for (const x of [-width * 0.38, width * 0.38]) {
    cylinder(group, `SOLAR_CANOPY__SUPPORT_${x < 0 ? 'LEFT' : 'RIGHT'}`, 0.05, 0.07, height * 0.72, 8, m.metal, x, height * 0.36 + 0.07, 0, {
      obstacle: true,
    });
  }
  const roof = box(group, 'SOLAR_CANOPY__TRACKING_PANEL', width * 0.94, 0.07, depth * 0.82, m.glass, 0, height * 0.8, 0, {
    obstacle: true,
    shadows: false,
  });
  roof.rotation.z = THREE.MathUtils.degToRad(-8);
  for (let index = -2; index <= 2; index += 1) {
    box(group, `SOLAR_CANOPY__CELL_DIVIDER_${index + 3}`, 0.018, 0.012, depth * 0.76, m.accent, index * width * 0.17, height * 0.84, 0, {
      shadows: false,
    }).rotation.z = THREE.MathUtils.degToRad(-8);
  }
  box(group, 'SOLAR_CANOPY__BATTERY_PLINTH', width * 0.22, height * 0.28, depth * 0.22, m.shell, width * 0.35, height * 0.14 + 0.07, -depth * 0.31, {
    obstacle: true,
  });
  box(group, 'SOLAR_CANOPY__BATTERY_STATUS', width * 0.13, height * 0.08, 0.018, m.accent, width * 0.35, height * 0.21, -depth * 0.425, {
    shadows: false,
  });
}

function buildDataSculpture(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  cylinder(group, 'DATA_SCULPTURE__PLINTH', width * 0.38, width * 0.46, height * 0.12, 24, m.dark, 0, height * 0.06, 0, {
    obstacle: true,
  });
  cylinder(group, 'DATA_SCULPTURE__CORE_STEM', 0.04, 0.07, height * 0.76, 10, m.metal, 0, height * 0.48, 0, {
    obstacle: true,
  });
  [0.26, 0.34, 0.42].forEach((scale, index) => {
    const ring = torus(group, `DATA_SCULPTURE__ORBIT_${index + 1}`, width * scale, 0.035, index === 1 ? m.glass : m.accent, 0, height * (0.38 + index * 0.16), 0, {
      obstacle: true,
      shadows: index !== 1,
    });
    ring.rotation.set(Math.PI / 2 + index * 0.35, index * 0.42, index * 0.28);
    ring.scale.z = depth / width;
  });
  sphere(group, 'DATA_SCULPTURE__LUMINOUS_CORE', width * 0.12, m.accent, 0, height * 0.64, 0, { shadows: false });
}

function buildBioswale(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'BIOSWALE__STONE_PLINTH', width, height * 0.45, depth, m.dark, 0, height * 0.225, 0, { obstacle: true });
  box(group, 'BIOSWALE__SOIL_BED', width * 0.84, height * 0.18, depth * 0.68, m.rubber, 0, height * 0.52, 0, {
    obstacle: true,
    surface: 'shelf',
  });
  box(group, 'BIOSWALE__TIMBER_SEAT_EDGE', width * 0.88, height * 0.13, depth * 0.16, m.shell, 0, height * 0.57, depth * 0.43, {
    obstacle: true,
    surface: 'seat',
  });
  for (let index = 0; index < 7; index += 1) {
    const x = -width * 0.34 + (index / 6) * width * 0.68;
    const plantHeight = height * (0.35 + (index % 3) * 0.15);
    cylinder(group, `BIOSWALE__PLANT_STEM_${index + 1}`, 0.012, 0.017, plantHeight, 6, m.plant, x, height * 0.62 + plantHeight * 0.5, (index % 2 ? 1 : -1) * depth * 0.14);
    sphere(group, `BIOSWALE__PLANT_CROWN_${index + 1}`, height * 0.11, index % 3 === 0 ? m.accent : m.plant, x, height * 0.62 + plantHeight, (index % 2 ? 1 : -1) * depth * 0.14);
  }
  cylinder(group, 'BIOSWALE__MOISTURE_SENSOR', 0.018, 0.024, height * 0.62, 8, m.metal, width * 0.4, height * 0.62, -depth * 0.28, {
    obstacle: true,
  });
  sphere(group, 'BIOSWALE__SENSOR_HEAD', 0.035, m.accent, width * 0.4, height * 0.94, -depth * 0.28, { shadows: false });
}

function buildDroneDock(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  cylinder(group, 'DRONE_DOCK__LANDING_PAD', width * 0.43, width * 0.49, height * 0.18, 24, m.dark, 0, height * 0.09, 0, {
    obstacle: true,
    surface: 'charging-pad',
  });
  torus(group, 'DRONE_DOCK__GUIDANCE_RING', width * 0.31, 0.035, m.accent, 0, height * 0.195, 0, { shadows: false }).rotation.x = Math.PI / 2;
  box(group, 'DRONE_DOCK__SERVICE_CABINET', width * 0.22, height * 0.62, depth * 0.28, m.shell, width * 0.36, height * 0.31, -depth * 0.27, {
    obstacle: true,
  });
  box(group, 'DRONE_DOCK__STATUS_DISPLAY', width * 0.12, height * 0.15, 0.015, m.accent, width * 0.36, height * 0.38, -depth * 0.415, {
    shadows: false,
  });
  const arm = box(group, 'DRONE_DOCK__CHARGING_ARM', width * 0.32, 0.045, 0.045, m.metal, width * 0.14, height * 0.42, 0, { obstacle: true });
  arm.rotation.z = THREE.MathUtils.degToRad(-22);
  for (const [x, z] of [[-0.38, -0.38], [-0.38, 0.38], [0.38, -0.38], [0.38, 0.38]] as [number, number][]) {
    cylinder(group, `DRONE_DOCK__BEACON_${x}_${z}`, 0.02, 0.03, height * 0.48, 8, m.metal, width * x, height * 0.24, depth * z, {
      obstacle: true,
    });
    sphere(group, `DRONE_DOCK__BEACON_LIGHT_${x}_${z}`, 0.04, m.accent, width * x, height * 0.5, depth * z, { shadows: false });
  }
}

function buildSmartLamps(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  for (let index = 0; index < 3; index += 1) {
    const x = -width * 0.4 + index * width * 0.4;
    cylinder(group, `SMART_LAMP__POST_${index + 1}`, 0.026, 0.045, height * (0.72 + index * 0.1), 8, m.dark, x, height * (0.36 + index * 0.05), 0, {
      obstacle: true,
    });
    box(group, `SMART_LAMP__SHIELDED_LIGHT_${index + 1}`, width * 0.13, height * 0.08, depth * 0.42, m.accent, x, height * (0.75 + index * 0.1), 0, {
      shadows: false,
    });
    sphere(group, `SMART_LAMP__SENSOR_${index + 1}`, 0.035, m.glass, x, height * (0.67 + index * 0.1), 0, { shadows: false });
  }
  box(group, 'SMART_LAMP__GROUND_POWER_RAIL', width * 0.9, 0.045, depth * 0.5, m.metal, 0, 0.0225, 0, { obstacle: true });
}

function buildFieldRover(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'FIELD_ROVER__CHASSIS', width * 0.7, height * 0.28, depth * 0.64, m.shell, 0, height * 0.38, 0, { obstacle: true });
  box(group, 'FIELD_ROVER__SAMPLE_BAY', width * 0.34, height * 0.18, depth * 0.42, m.dark, -width * 0.08, height * 0.58, 0, { obstacle: true });
  for (const x of [-width * 0.31, width * 0.31]) {
    for (const z of [-depth * 0.32, depth * 0.32]) {
      const wheel = cylinder(group, `FIELD_ROVER__WHEEL_${x}_${z}`, height * 0.18, height * 0.18, depth * 0.16, 12, m.rubber, x, height * 0.2, z, {
        obstacle: true,
      });
      wheel.rotation.x = Math.PI / 2;
    }
  }
  cylinder(group, 'FIELD_ROVER__SENSOR_MAST', 0.025, 0.04, height * 0.56, 8, m.metal, width * 0.2, height * 0.79, 0, { obstacle: true });
  sphere(group, 'FIELD_ROVER__LIDAR_HEAD', height * 0.11, m.glass, width * 0.2, height * 1.08, 0, { obstacle: true, shadows: false });
  box(group, 'FIELD_ROVER__STATUS_BAR', width * 0.36, 0.035, 0.03, m.accent, 0, height * 0.48, depth * 0.335, { shadows: false });
}

function addCabinetDrawers(group: THREE.Group, prefix: string, x: number, width: number, height: number, depth: number, m: AssetMaterials) {
  box(group, `${prefix}__CABINET`, width, height, depth, m.pale, x, height * 0.5, 0, { obstacle: true });
  for (let row = 0; row < 3; row += 1) {
    box(group, `${prefix}__DRAWER_${row + 1}`, width * 0.84, height * 0.22, 0.008, m.shell, x, height * (0.2 + row * 0.28), depth * 0.505, {
      obstacle: false,
    });
    box(group, `${prefix}__DRAWER_HANDLE_${row + 1}`, width * 0.28, 0.009, 0.012, m.metal, x, height * (0.2 + row * 0.28), depth * 0.53);
  }
}

function buildWetLabBench(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  const cabinetHeight = height * 0.68;
  addCabinetDrawers(group, 'LAB_BENCH__LEFT', -width * 0.34, width * 0.25, cabinetHeight, depth * 0.82, m);
  addCabinetDrawers(group, 'LAB_BENCH__RIGHT', width * 0.34, width * 0.25, cabinetHeight, depth * 0.82, m);
  box(group, 'LAB_BENCH__WORKTOP', width, height * 0.09, depth, m.metal, 0, cabinetHeight + height * 0.045, 0, {
    obstacle: true,
    surface: 'worktop',
  });
  box(group, 'LAB_BENCH__SINK', width * 0.2, height * 0.045, depth * 0.45, m.dark, 0, cabinetHeight + height * 0.09, 0, { surface: 'worktop' });
  const faucet = torus(group, 'LAB_BENCH__FAUCET', height * 0.15, height * 0.035, m.metal, width * 0.08, cabinetHeight + height * 0.27, -depth * 0.25);
  faucet.rotation.y = Math.PI / 2;
  box(group, 'LAB_BENCH__REAGENT_RAIL', width * 0.84, height * 0.055, depth * 0.13, m.shell, 0, height * 0.96, -depth * 0.35, { obstacle: true, surface: 'shelf' });
  for (let index = 0; index < 6; index += 1) {
    cylinder(group, `LAB_BENCH__REAGENT_VIAL_${index + 1}`, height * 0.027, height * 0.03, height * (0.16 + (index % 2) * 0.05), 8, index % 2 ? m.accent : m.glass, -width * 0.32 + index * width * 0.13, height * 1.07, -depth * 0.35, {
      shadows: false,
    });
  }
  box(group, 'LAB_BENCH__TASK_LIGHT', width * 0.72, height * 0.025, depth * 0.05, m.accent, 0, height * 1.28, -depth * 0.42, { shadows: false });
}

function buildBiosafetyCabinet(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'BSC__LOWER_CABINET', width * 0.9, height * 0.34, depth * 0.86, m.pale, 0, height * 0.17, 0, { obstacle: true });
  box(group, 'BSC__WORK_TRAY', width * 0.94, height * 0.045, depth * 0.92, m.metal, 0, height * 0.37, 0, {
    obstacle: true,
    surface: 'worktop',
  });
  for (const x of [-width * 0.44, width * 0.44]) {
    box(group, `BSC__SIDE_FRAME_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.08, height * 0.48, depth * 0.82, m.shell, x, height * 0.63, 0, { obstacle: true });
  }
  box(group, 'BSC__REAR_PANEL', width * 0.8, height * 0.43, depth * 0.055, m.metal, 0, height * 0.62, -depth * 0.42, { obstacle: true });
  box(group, 'BSC__SASH_GLASS', width * 0.78, height * 0.34, depth * 0.025, m.glass, 0, height * 0.66, depth * 0.43, {
    obstacle: true,
    shadows: false,
  });
  box(group, 'BSC__EXTRACTION_HOOD', width, height * 0.19, depth, m.dark, 0, height * 0.905, 0, { obstacle: true });
  box(group, 'BSC__CONTROL_DISPLAY', width * 0.24, height * 0.075, 0.012, m.accent, width * 0.28, height * 0.92, depth * 0.505, { shadows: false });
}

function buildHoloMicroscope(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'MICROSCOPE__ANALYSIS_DESK', width, height * 0.12, depth, m.shell, 0, height * 0.42, 0, {
    obstacle: true,
    surface: 'worktop',
  });
  for (const x of [-width * 0.4, width * 0.4]) {
    box(group, `MICROSCOPE__DESK_LEG_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.09, height * 0.39, depth * 0.75, m.dark, x, height * 0.195, 0, { obstacle: true });
  }
  cylinder(group, 'MICROSCOPE__ROTATING_STAGE', width * 0.16, width * 0.18, height * 0.05, 16, m.metal, -width * 0.12, height * 0.52, 0, { surface: 'worktop' });
  const arm = torus(group, 'MICROSCOPE__OPTICAL_ARM', height * 0.19, height * 0.04, m.dark, -width * 0.13, height * 0.73, -depth * 0.04, { obstacle: true });
  arm.rotation.x = Math.PI / 2;
  cylinder(group, 'MICROSCOPE__OBJECTIVE', height * 0.045, height * 0.06, height * 0.2, 10, m.metal, -width * 0.13, height * 0.66, depth * 0.05, { obstacle: true });
  sphere(group, 'MICROSCOPE__SPECIMEN_GLOW', height * 0.045, m.accent, -width * 0.12, height * 0.57, 0, { shadows: false });
  const screen = box(group, 'MICROSCOPE__HOLOGRAPHIC_DISPLAY', width * 0.36, height * 0.38, 0.012, m.glass, width * 0.24, height * 0.74, -depth * 0.08, { shadows: false });
  screen.rotation.y = THREE.MathUtils.degToRad(-14);
  box(group, 'MICROSCOPE__DISPLAY_BASE', width * 0.26, height * 0.045, depth * 0.24, m.dark, width * 0.24, height * 0.53, -depth * 0.08, { obstacle: true });
}

function buildCryoFreezer(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'CRYO_FREEZER__INSULATED_BODY', width * 0.8, height * 0.94, depth * 0.86, m.pale, -width * 0.07, height * 0.47, 0, { obstacle: true });
  for (let row = 0; row < 5; row += 1) {
    box(group, `CRYO_FREEZER__DRAWER_${row + 1}`, width * 0.66, height * 0.13, 0.012, row === 0 ? m.accent : m.shell, -width * 0.07, height * (0.18 + row * 0.155), depth * 0.44, {
      shadows: row !== 0,
    });
    box(group, `CRYO_FREEZER__HANDLE_${row + 1}`, width * 0.25, height * 0.022, 0.018, m.metal, -width * 0.07, height * (0.18 + row * 0.155), depth * 0.46);
  }
  box(group, 'CRYO_FREEZER__STATUS_PANEL', width * 0.34, height * 0.1, 0.015, m.accent, -width * 0.07, height * 0.87, depth * 0.45, { shadows: false });
  cylinder(group, 'CRYO_FREEZER__COOLANT_CYLINDER', width * 0.1, width * 0.12, height * 0.62, 12, m.metal, width * 0.39, height * 0.31, -depth * 0.12, { obstacle: true });
  torus(group, 'CRYO_FREEZER__COOLANT_HOSE', width * 0.16, width * 0.025, m.rubber, width * 0.29, height * 0.6, -depth * 0.12, { obstacle: true }).rotation.y = Math.PI / 2;
}

function addTaskChair(group: THREE.Group, prefix: string, x: number, z: number, scale: number, m: AssetMaterials) {
  cylinder(group, `${prefix}__GAS_LIFT`, 0.012 * scale, 0.018 * scale, 0.06 * scale, 8, m.metal, x, 0.04 * scale, z, { obstacle: true });
  box(group, `${prefix}__SEAT`, 0.055 * scale, 0.018 * scale, 0.055 * scale, m.fabric, x, 0.078 * scale, z, {
    obstacle: true,
    surface: 'seat',
  });
  const back = box(group, `${prefix}__BACK`, 0.058 * scale, 0.07 * scale, 0.012 * scale, m.fabric, x, 0.118 * scale, z - 0.025 * scale, { obstacle: true });
  back.rotation.x = THREE.MathUtils.degToRad(-8);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const spoke = box(group, `${prefix}__BASE_SPOKE_${index + 1}`, 0.045 * scale, 0.008 * scale, 0.009 * scale, m.dark, x + Math.cos(angle) * 0.018 * scale, 0.012 * scale, z + Math.sin(angle) * 0.018 * scale, { obstacle: true });
    spoke.rotation.y = -angle;
  }
}

function buildWorkstation(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'WORKSTATION__DESK_TOP', width, height * 0.08, depth * 0.78, m.shell, 0, height * 0.53, -depth * 0.1, {
    obstacle: true,
    surface: 'worktop',
  });
  for (const x of [-width * 0.42, width * 0.42]) {
    box(group, `WORKSTATION__LEG_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.055, height * 0.51, depth * 0.57, m.metal, x, height * 0.255, -depth * 0.1, { obstacle: true });
  }
  for (const x of [-width * 0.2, width * 0.2]) {
    box(group, `WORKSTATION__DISPLAY_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.3, height * 0.25, 0.012, m.glass, x, height * 0.76, -depth * 0.35, {
      obstacle: true,
      shadows: false,
    });
    cylinder(group, `WORKSTATION__DISPLAY_STEM_${x < 0 ? 'LEFT' : 'RIGHT'}`, 0.008, 0.012, height * 0.16, 8, m.metal, x, height * 0.59, -depth * 0.35, { obstacle: true });
  }
  box(group, 'WORKSTATION__KEYBOARD', width * 0.36, height * 0.018, depth * 0.19, m.dark, 0, height * 0.585, -depth * 0.02, { surface: 'worktop' });
  addTaskChair(group, 'WORKSTATION__CHAIR', 0, depth * 0.34, Math.max(0.75, height / 0.145), m);
}

function buildConferenceTable(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'CONFERENCE__TABLE_TOP', width, height * 0.12, depth * 0.62, m.shell, 0, height * 0.55, 0, {
    obstacle: true,
    surface: 'worktop',
  });
  box(group, 'CONFERENCE__CENTRAL_PEDESTAL', width * 0.16, height * 0.5, depth * 0.35, m.dark, 0, height * 0.25, 0, { obstacle: true });
  box(group, 'CONFERENCE__POWER_RAIL', width * 0.62, height * 0.025, depth * 0.08, m.accent, 0, height * 0.625, 0, { shadows: false, surface: 'worktop' });
  cylinder(group, 'CONFERENCE__HOLO_PROJECTOR', width * 0.075, width * 0.09, height * 0.14, 16, m.metal, 0, height * 0.73, 0, { obstacle: true });
  const hologram = sphere(group, 'CONFERENCE__HOLOGRAM', width * 0.095, m.glass, 0, height * 0.9, 0, { shadows: false });
  hologram.scale.y = 1.35;
  for (let side = -1; side <= 1; side += 2) {
    for (let index = 0; index < 4; index += 1) {
      addTaskChair(group, `CONFERENCE__CHAIR_${side < 0 ? 'NORTH' : 'SOUTH'}_${index + 1}`, -width * 0.36 + index * width * 0.24, side * depth * 0.42, Math.max(0.6, height / 0.16), m);
    }
  }
}

function buildChair(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  const scale = Math.min(width / 0.075, depth / 0.075, height / 0.125);
  addTaskChair(group, 'TASK_CHAIR', 0, 0, scale, m);
  for (const x of [-width * 0.45, width * 0.45]) {
    box(group, `TASK_CHAIR__ARMREST_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.09, height * 0.035, depth * 0.52, m.dark, x, height * 0.72, -depth * 0.02, { obstacle: true });
  }
}

function buildSofa(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'SOFA__ILLUMINATED_PLINTH', width * 0.94, height * 0.12, depth * 0.84, m.accent, 0, height * 0.06, 0, { obstacle: true, shadows: false });
  box(group, 'SOFA__BASE', width, height * 0.28, depth, m.dark, 0, height * 0.2, 0, { obstacle: true });
  for (let index = 0; index < 3; index += 1) {
    box(group, `SOFA__SEAT_CUSHION_${index + 1}`, width * 0.28, height * 0.22, depth * 0.62, m.fabric, -width * 0.3 + index * width * 0.3, height * 0.43, depth * 0.08, {
      obstacle: true,
      surface: 'seat',
    });
    const back = box(group, `SOFA__BACK_CUSHION_${index + 1}`, width * 0.28, height * 0.46, depth * 0.2, m.fabric, -width * 0.3 + index * width * 0.3, height * 0.67, -depth * 0.36, { obstacle: true });
    back.rotation.x = THREE.MathUtils.degToRad(-7);
  }
  for (const x of [-width * 0.47, width * 0.47]) {
    box(group, `SOFA__ARM_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.08, height * 0.42, depth * 0.88, m.shell, x, height * 0.43, 0, { obstacle: true });
  }
}

function buildStorageShelf(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  for (const x of [-width * 0.46, width * 0.46]) {
    box(group, `SHELF__UPRIGHT_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.06, height, depth, m.metal, x, height * 0.5, 0, { obstacle: true });
  }
  for (let level = 0; level < 5; level += 1) {
    const y = height * (0.1 + level * 0.2);
    box(group, `SHELF__TRAY_${level + 1}`, width * 0.9, height * 0.035, depth * 0.92, m.shell, 0, y, 0, { obstacle: true, surface: 'shelf' });
    if (level > 0) {
      for (const x of [-width * 0.27, 0, width * 0.27]) {
        box(group, `SHELF__BIN_${level}_${Math.round(x * 1000)}`, width * 0.22, height * 0.11, depth * 0.66, level % 2 ? m.pale : m.dark, x, y + height * 0.07, 0, { obstacle: true });
        box(group, `SHELF__BIN_LABEL_${level}_${Math.round(x * 1000)}`, width * 0.1, height * 0.025, 0.008, m.accent, x, y + height * 0.07, depth * 0.34, { shadows: false });
      }
    }
  }
}

function buildServerRack(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'SERVER_RACK__ENCLOSURE', width, height, depth, m.dark, 0, height * 0.5, 0, { obstacle: true });
  box(group, 'SERVER_RACK__GLASS_FRONT', width * 0.82, height * 0.88, 0.012, m.glass, 0, height * 0.5, depth * 0.51, {
    obstacle: true,
    shadows: false,
  });
  for (let slot = 0; slot < 8; slot += 1) {
    const y = height * (0.12 + slot * 0.1);
    box(group, `SERVER_RACK__BLADE_${slot + 1}`, width * 0.72, height * 0.055, depth * 0.78, slot % 3 === 0 ? m.metal : m.shell, 0, y, 0, { obstacle: true });
    for (let led = 0; led < 3; led += 1) {
      sphere(group, `SERVER_RACK__STATUS_${slot + 1}_${led + 1}`, width * 0.018, led === 0 ? m.accent : m.glass, -width * 0.24 + led * width * 0.08, y, depth * 0.405, { shadows: false });
    }
  }
  for (const x of [-width * 0.32, width * 0.32]) {
    cylinder(group, `SERVER_RACK__COOLANT_PIPE_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.035, width * 0.035, height * 0.78, 8, m.accent, x, height * 0.5, -depth * 0.43, { obstacle: true, shadows: false });
  }
}

function buildCleanroomAirlock(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'AIRLOCK__WALKABLE_THRESHOLD', width * 0.88, height * 0.035, depth, m.dark, 0, height * 0.0175, 0, {
    walkable: true,
    surface: 'threshold',
  });
  for (const x of [-width * 0.46, width * 0.46]) {
    box(group, `AIRLOCK__SIDE_FRAME_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.08, height, depth, m.metal, x, height * 0.5, 0, { obstacle: true });
    box(group, `AIRLOCK__SIDE_GLASS_${x < 0 ? 'LEFT' : 'RIGHT'}`, width * 0.025, height * 0.78, depth * 0.78, m.glass, x * 0.93, height * 0.46, 0, {
      obstacle: true,
      shadows: false,
    });
  }
  box(group, 'AIRLOCK__CEILING', width, height * 0.1, depth, m.dark, 0, height * 0.95, 0, { obstacle: true });
  for (const z of [-depth * 0.49, depth * 0.49]) {
    box(group, `AIRLOCK__SLIDING_DOOR_LEFT_${z < 0 ? 'BACK' : 'FRONT'}`, width * 0.34, height * 0.75, 0.014, m.glass, -width * 0.28, height * 0.43, z, { shadows: false });
    box(group, `AIRLOCK__SLIDING_DOOR_RIGHT_${z < 0 ? 'BACK' : 'FRONT'}`, width * 0.34, height * 0.75, 0.014, m.glass, width * 0.28, height * 0.43, z, { shadows: false });
    box(group, `AIRLOCK__DOOR_SENSOR_${z < 0 ? 'BACK' : 'FRONT'}`, width * 0.16, height * 0.07, 0.02, m.accent, 0, height * 0.86, z * 1.02, { shadows: false });
  }
}

function buildUtilityConsole(group: THREE.Group, width: number, depth: number, height: number, m: AssetMaterials) {
  box(group, 'UTILITY_CONSOLE__BASE_CABINET', width, height * 0.58, depth, m.dark, 0, height * 0.29, 0, { obstacle: true });
  const control = box(group, 'UTILITY_CONSOLE__ANGLED_CONTROL_SURFACE', width * 0.94, height * 0.12, depth * 0.72, m.shell, 0, height * 0.63, -depth * 0.08, {
    obstacle: true,
    surface: 'worktop',
  });
  control.rotation.x = THREE.MathUtils.degToRad(-18);
  const screen = box(group, 'UTILITY_CONSOLE__TOUCH_DISPLAY', width * 0.62, height * 0.28, 0.012, m.glass, 0, height * 0.82, -depth * 0.32, { shadows: false });
  screen.rotation.x = THREE.MathUtils.degToRad(-12);
  for (let index = 0; index < 4; index += 1) {
    sphere(group, `UTILITY_CONSOLE__CONTROL_${index + 1}`, width * 0.025, index === 3 ? m.accent : m.metal, -width * 0.27 + index * width * 0.18, height * 0.69, depth * 0.18, { shadows: index === 3 ? false : true });
  }
  box(group, 'UTILITY_CONSOLE__SERVICE_PANEL', width * 0.7, height * 0.22, 0.012, m.metal, 0, height * 0.29, depth * 0.51, { obstacle: false });
}

function buildGenericAsset(
  group: THREE.Group,
  item: EditorAssetCatalogItem,
  width: number,
  depth: number,
  height: number,
  m: AssetMaterials,
) {
  if (item.kind === 'building') {
    addFoundation(group, width, depth, m);
    box(group, 'GENERIC_BUILDING__MAIN_VOLUME', width * 0.76, height * 0.74, depth * 0.7, m.shell, 0, 0.14 + height * 0.37, 0, {
      obstacle: true,
    });
    box(group, 'GENERIC_BUILDING__ROOF', width * 0.84, height * 0.09, depth * 0.78, m.dark, 0, 0.14 + height * 0.78, 0, {
      obstacle: true,
    });
    addEntryFacade(group, width, depth * 0.355, 0.14, Math.min(0.5, height * 0.32), m);
    return;
  }
  box(group, 'GENERIC_ASSET__BASE', width, height * 0.18, depth, m.dark, 0, height * 0.09, 0, {
    obstacle: true,
    surface: item.workspace === 'landscape' ? 'charging-pad' : 'worktop',
  });
  box(group, 'GENERIC_ASSET__BODY', width * 0.72, height * 0.72, depth * 0.72, m.shell, 0, height * 0.54, 0, { obstacle: true });
  box(group, 'GENERIC_ASSET__ACCENT', width * 0.48, height * 0.08, depth * 0.76, m.accent, 0, height * 0.58, depth * 0.37, { shadows: false });
}

function finalizeAssetGroup(group: THREE.Group, item: EditorAssetCatalogItem, selectableId: string) {
  group.name = `EDITOR_ASSET__${item.id.toUpperCase().replace(/-/g, '_')}`;
  group.userData = {
    ...group.userData,
    selectableId,
    editorAssetId: item.id,
    editorWorkspace: item.workspace,
    entityKind: item.kind,
    category: item.category,
    displayName: item.name,
    editable: true,
    canDelete: true,
    exportable: true,
    parentId: null,
    interiorId: item.kind === 'building' ? `${selectableId}__INTERIOR` : null,
    footprint: [...item.footprint],
    nominalHeight: item.height,
    accent: item.accent,
  };
  group.traverse((child) => {
    child.userData.selectableId = selectableId;
    child.userData.editorAssetId = item.id;
    child.userData.editorWorkspace = item.workspace;
    child.userData.entityKind = item.kind;
    if (child instanceof THREE.Mesh) {
      child.castShadow = child.castShadow !== false;
      child.receiveShadow = child.receiveShadow !== false;
    }
  });
  return group;
}

/** Create one self-contained, editable and GLB-safe catalog asset at local ground level. */
export function createEditorAsset(item: EditorAssetCatalogItem, selectableId: string): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(0.035, item.footprint[0]);
  const depth = Math.max(0.035, item.footprint[1]);
  const height = Math.max(0.035, item.height);
  const materials = makeMaterials(item.accent);

  switch (item.id) {
    case 'landscape-research-pavilion':
      buildResearchPavilion(group, width, depth, height, materials);
      break;
    case 'landscape-modular-wet-lab':
      buildModularWetLab(group, width, depth, height, materials);
      break;
    case 'landscape-observation-tower':
      buildObservationTower(group, width, depth, height, materials);
      break;
    case 'landscape-transit-shelter':
      buildTransitShelter(group, width, depth, height, materials);
      break;
    case 'landscape-solar-canopy':
      buildSolarCanopy(group, width, depth, height, materials);
      break;
    case 'landscape-data-sculpture':
      buildDataSculpture(group, width, depth, height, materials);
      break;
    case 'landscape-bioswale-planter':
      buildBioswale(group, width, depth, height, materials);
      break;
    case 'landscape-drone-dock':
      buildDroneDock(group, width, depth, height, materials);
      break;
    case 'landscape-smart-lamp-array':
      buildSmartLamps(group, width, depth, height, materials);
      break;
    case 'landscape-field-rover':
      buildFieldRover(group, width, depth, height, materials);
      break;
    case 'interior-wet-lab-bench':
      buildWetLabBench(group, width, depth, height, materials);
      break;
    case 'interior-biosafety-cabinet':
      buildBiosafetyCabinet(group, width, depth, height, materials);
      break;
    case 'interior-holo-microscope':
      buildHoloMicroscope(group, width, depth, height, materials);
      break;
    case 'interior-cryo-freezer':
      buildCryoFreezer(group, width, depth, height, materials);
      break;
    case 'interior-focus-workstation':
      buildWorkstation(group, width, depth, height, materials);
      break;
    case 'interior-conference-table':
      buildConferenceTable(group, width, depth, height, materials);
      break;
    case 'interior-ergonomic-chair':
      buildChair(group, width, depth, height, materials);
      break;
    case 'interior-modular-sofa':
      buildSofa(group, width, depth, height, materials);
      break;
    case 'interior-storage-shelf':
      buildStorageShelf(group, width, depth, height, materials);
      break;
    case 'interior-server-rack':
      buildServerRack(group, width, depth, height, materials);
      break;
    case 'interior-cleanroom-airlock':
      buildCleanroomAirlock(group, width, depth, height, materials);
      break;
    case 'interior-utility-console':
      buildUtilityConsole(group, width, depth, height, materials);
      break;
    default:
      buildGenericAsset(group, item, width, depth, height, materials);
      break;
  }

  return finalizeAssetGroup(group, item, selectableId);
}

/**
 * Create a reusable cutaway room for Interior Design mode. The front (+Z) is intentionally
 * open; the centred rear doorway remains physically traversable and the floor is walkable.
 */
export function createInteriorShell(buildingId: string, width: number, depth: number, accent: string): THREE.Group {
  const safeWidth = Math.max(0.8, width);
  const safeDepth = Math.max(0.8, depth);
  const roomHeight = THREE.MathUtils.clamp(Math.min(safeWidth, safeDepth) * 0.09, 0.38, 0.56);
  const wallThickness = THREE.MathUtils.clamp(Math.min(safeWidth, safeDepth) * 0.008, 0.028, 0.055);
  const doorWidth = THREE.MathUtils.clamp(safeWidth * 0.12, 0.16, 0.28);
  const doorHeight = Math.min(roomHeight * 0.74, 0.3);
  const materials = makeMaterials(accent);
  const group = new THREE.Group();
  group.name = `INTERIOR_SHELL__${buildingId.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  group.userData = {
    selectableId: buildingId,
    editorWorkspace: 'interior',
    entityKind: 'interior-shell',
    buildingId,
    interiorId: `${buildingId}__INTERIOR`,
    editable: true,
    exportable: true,
    cutawaySide: 'front-positive-z',
    footprint: [safeWidth, safeDepth],
    roomHeight,
    accent,
  };

  box(group, 'INTERIOR_SHELL__WALKABLE_FLOOR', safeWidth, 0.035, safeDepth, materials.dark, 0, -0.0175, 0, {
    walkable: true,
    surface: 'floor',
  });
  box(group, 'INTERIOR_SHELL__FLOOR_FINISH', safeWidth * 0.97, 0.008, safeDepth * 0.97, materials.pale, 0, 0.004, 0, {
    walkable: true,
    surface: 'floor',
  });

  // Left and right walls form two of the three cutaway walls.
  box(group, 'INTERIOR_SHELL__WALL_LEFT', wallThickness, roomHeight, safeDepth, materials.shell, -safeWidth * 0.5, roomHeight * 0.5, 0, {
    obstacle: true,
  });
  box(group, 'INTERIOR_SHELL__WALL_RIGHT', wallThickness, roomHeight, safeDepth, materials.shell, safeWidth * 0.5, roomHeight * 0.5, 0, {
    obstacle: true,
  });

  // The rear wall is split around a real opening instead of using a decorative door texture.
  const rearSideWidth = (safeWidth - doorWidth) * 0.5;
  box(
    group,
    'INTERIOR_SHELL__REAR_WALL_LEFT',
    rearSideWidth,
    roomHeight,
    wallThickness,
    materials.shell,
    -(doorWidth + rearSideWidth) * 0.5,
    roomHeight * 0.5,
    -safeDepth * 0.5,
    { obstacle: true },
  );
  box(
    group,
    'INTERIOR_SHELL__REAR_WALL_RIGHT',
    rearSideWidth,
    roomHeight,
    wallThickness,
    materials.shell,
    (doorWidth + rearSideWidth) * 0.5,
    roomHeight * 0.5,
    -safeDepth * 0.5,
    { obstacle: true },
  );
  box(
    group,
    'INTERIOR_SHELL__REAR_WALL_HEADER',
    doorWidth,
    roomHeight - doorHeight,
    wallThickness,
    materials.shell,
    0,
    doorHeight + (roomHeight - doorHeight) * 0.5,
    -safeDepth * 0.5,
    { obstacle: true },
  );

  for (const x of [-doorWidth * 0.53, doorWidth * 0.53]) {
    box(group, `INTERIOR_SHELL__ENTRY_JAMB_${x < 0 ? 'LEFT' : 'RIGHT'}`, wallThickness, doorHeight, wallThickness * 1.8, materials.metal, x, doorHeight * 0.5, -safeDepth * 0.5, {
      obstacle: true,
    });
  }
  box(group, 'INTERIOR_SHELL__ENTRY_LINTEL', doorWidth + wallThickness * 2, wallThickness, wallThickness * 1.8, materials.metal, 0, doorHeight, -safeDepth * 0.5, {
    obstacle: true,
  });
  // Door leaves are parked open against the jambs so the opening remains accessible.
  box(group, 'INTERIOR_SHELL__OPEN_DOOR_LEFT', doorWidth * 0.42, doorHeight * 0.9, wallThickness * 0.35, materials.glass, -doorWidth * 0.34, doorHeight * 0.45, -safeDepth * 0.5 - wallThickness * 0.7, {
    shadows: false,
  });
  box(group, 'INTERIOR_SHELL__OPEN_DOOR_RIGHT', doorWidth * 0.42, doorHeight * 0.9, wallThickness * 0.35, materials.glass, doorWidth * 0.34, doorHeight * 0.45, -safeDepth * 0.5 - wallThickness * 0.7, {
    shadows: false,
  });
  box(group, 'INTERIOR_SHELL__ENTRY_THRESHOLD', doorWidth * 0.9, 0.012, wallThickness * 4, materials.accent, 0, 0.008, -safeDepth * 0.5, {
    walkable: true,
    shadows: false,
    surface: 'threshold',
  });

  const ceilingPanel = box(group, 'INTERIOR_SHELL__CEILING_PANEL', safeWidth, wallThickness, safeDepth, materials.dark, 0, roomHeight + wallThickness * 0.5, 0, {
    obstacle: true,
  });
  ceilingPanel.userData.editorCutawayCeiling = true;
  ceilingPanel.userData.exportAlways = true;
  const beamCountX = Math.max(2, Math.min(8, Math.round(safeWidth / 0.75)));
  const beamCountZ = Math.max(2, Math.min(8, Math.round(safeDepth / 0.75)));
  for (let index = 0; index <= beamCountX; index += 1) {
    const x = -safeWidth * 0.46 + (index / beamCountX) * safeWidth * 0.92;
    box(group, `INTERIOR_SHELL__CEILING_BEAM_Z_${index + 1}`, wallThickness * 0.8, wallThickness * 1.5, safeDepth * 0.94, materials.metal, x, roomHeight - wallThickness * 0.35, 0, {
      obstacle: true,
    });
  }
  for (let index = 0; index <= beamCountZ; index += 1) {
    const z = -safeDepth * 0.46 + (index / beamCountZ) * safeDepth * 0.92;
    box(group, `INTERIOR_SHELL__CEILING_BEAM_X_${index + 1}`, safeWidth * 0.94, wallThickness * 1.5, wallThickness * 0.8, materials.metal, 0, roomHeight - wallThickness * 0.37, z, {
      obstacle: true,
    });
  }

  const lightRows = safeDepth > 2.5 ? 3 : 2;
  const lightColumns = safeWidth > 2.5 ? 3 : 2;
  for (let row = 0; row < lightRows; row += 1) {
    for (let column = 0; column < lightColumns; column += 1) {
      const x = -safeWidth * 0.28 + (column / (lightColumns - 1)) * safeWidth * 0.56;
      const z = -safeDepth * 0.28 + (row / (lightRows - 1)) * safeDepth * 0.56;
      box(group, `INTERIOR_SHELL__LIGHT_PANEL_${row + 1}_${column + 1}`, safeWidth * 0.16, wallThickness * 0.28, safeDepth * 0.11, materials.accent, x, roomHeight - wallThickness * 1.2, z, {
        shadows: false,
      });
    }
  }

  for (const x of [-safeWidth * 0.27, safeWidth * 0.27]) {
    const light = new THREE.PointLight(accent, 1.8, Math.max(safeWidth, safeDepth) * 0.85, 2);
    light.name = `INTERIOR_SHELL__PUNCTUAL_LIGHT_${x < 0 ? 'LEFT' : 'RIGHT'}`;
    light.position.set(x, roomHeight * 0.84, 0);
    light.castShadow = false;
    group.add(light);
  }

  group.traverse((child) => {
    child.userData.selectableId = buildingId;
    child.userData.editorWorkspace = 'interior';
    child.userData.entityKind = 'interior-shell';
    child.userData.buildingId = buildingId;
  });
  return group;
}
