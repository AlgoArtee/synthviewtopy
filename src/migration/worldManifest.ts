import * as THREE from 'three';

export const UNREAL_WORLD_MANIFEST_SCHEMA = 'youtopy.unreal-world/1.0' as const;
export const UNREAL_DATA_LAYERS = [
  'ExteriorHigh',
  'ExteriorHLOD',
  'Interior',
  'InteriorVista',
  'InteriorLighting',
  'InteriorAudio',
] as const;

export type UnrealDataLayerName = typeof UNREAL_DATA_LAYERS[number];

export interface UnrealMigrationEntity {
  id: string;
  name: string;
  label: string;
  description: string;
  inscription?: string;
  entityType: string;
  parentPackageId: string | null;
  source: {
    authority: 'web-sandbox';
    disposition: 'bootstrap-placeholder-only';
  };
  transform: {
    webMatrixColumnMajor: number[];
    unrealMatrixRowMajorCentimetres: number[];
  };
  bounds: {
    webMin: [number, number, number];
    webMax: [number, number, number];
    unrealMinCentimetres: [number, number, number];
    unrealMaxCentimetres: [number, number, number];
  };
  asset: {
    placeholderGlb: string;
    stableActorName: string;
  };
  streaming: {
    dataLayers: UnrealDataLayerName[];
    levelInstance?: string;
    preloadDistanceMetres?: number;
    unloadDistanceMetres?: number;
    retentionSeconds?: number;
  };
  interactionArchetypes: string[];
  persistentStateKey: string;
}

export interface UnrealWorldManifest {
  schema: typeof UNREAL_WORLD_MANIFEST_SCHEMA;
  generatedAt: string;
  productionAuthority: 'unreal-editor';
  sourceAuthority: 'web-sandbox';
  importPolicy: 'bootstrap-only-no-roundtrip';
  coordinateSystem: {
    web: '+X east, +Y up, +Z south; 1 unit = 10 metres';
    unreal: '+X east, +Y south, +Z up; centimetres';
    mapping: 'Unreal X = Web X * 1000; Unreal Y = Web Z * 1000; Unreal Z = Web Y * 1000';
  };
  dataLayers: readonly UnrealDataLayerName[];
  packages: Array<{
    id: string;
    kind: 'district' | 'biome';
    exteriorHighLayer: 'ExteriorHigh';
    exteriorHlodLayer: 'ExteriorHLOD';
  }>;
  entities: UnrealMigrationEntity[];
}

const webToUnreal = new THREE.Matrix4().set(
  1000, 0, 0, 0,
  0, 0, 1000, 0,
  0, 1000, 0, 0,
  0, 0, 0, 1,
);
const unrealToWeb = webToUnreal.clone().invert();

export function webMatrixToUnrealRowMajor(matrix: THREE.Matrix4) {
  const converted = webToUnreal.clone().multiply(matrix).multiply(unrealToWeb);
  const e = converted.elements;
  return [
    e[0], e[4], e[8], e[12],
    e[1], e[5], e[9], e[13],
    e[2], e[6], e[10], e[14],
    e[3], e[7], e[11], e[15],
  ].map((value) => Number(value.toFixed(6)));
}

export function webPointToUnrealCentimetres(point: THREE.Vector3): [number, number, number] {
  return [
    Number((point.x * 1000).toFixed(3)),
    Number((point.z * 1000).toFixed(3)),
    Number((point.y * 1000).toFixed(3)),
  ];
}

export function stableUnrealName(id: string) {
  return `YT_${id.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
}
