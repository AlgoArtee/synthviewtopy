/**
 * Editable source of truth for the Academic District's monumental fountain.
 * All distances are authored in metres; runtime geometry converts them through
 * the island's shared metres-to-world-units scale.
 */

export const ACADEMIC_FOUNTAIN_ROOT_NAME = 'ACADEMIC__WELL_OF_INFINITE_KNOWLEDGE';
export const ACADEMIC_FOUNTAIN_COURT_NAME = 'Gaslight Reading Courts';

export type AcademicFountainSceneMode = 'presentation' | 'courtyard' | 'night';
export type AcademicFountainStatueMaterialMode = 'bronze' | 'dark-stone' | 'hybrid';
export type AcademicFountainCameraPresetId = 'hero' | 'low-angle' | 'top-down' | 'side-profile';
export type AcademicFountainRestorationMode = 'weathered' | 'clean' | 'comparison';
export type AcademicFountainQuality = 'low' | 'medium' | 'high';
export type AcademicFountainWaterDetail = 'still' | 'animated' | 'detailed';
export type AcademicFountainReflectionDetail = 'none' | 'environment' | 'enhanced';
export type AcademicFountainStatueLod = 'silhouette' | 'detailed' | 'high';

export interface AcademicFountainDimensionsMetres {
  readonly courtClearRadius: number;
  readonly basinWidth: number;
  readonly basinDepth: number;
  readonly basinRecessDepth: number;
  readonly basinWaterDepth: number;
  readonly basinEdgeWidth: number;
  readonly basinEdgeHeight: number;
  readonly radialChannelReach: number;
  readonly radialChannelWidth: number;
  readonly radialChannelDepth: number;
  readonly reflectingPoolWidth: number;
  readonly plinthWidth: number;
  readonly plinthDepth: number;
  readonly plinthHeight: number;
  readonly cantileverProjection: number;
  readonly statueHeight: number;
  readonly infinityWidth: number;
  readonly infinityHeight: number;
  readonly infinityThickness: number;
  readonly orbitalRingDiameter: number;
  readonly orbitalRingThickness: number;
  readonly orbitalRingSupportCount: number;
  readonly floatingPlatformWidth: number;
  readonly floatingPlatformGap: number;
  readonly accessibleRampWidth: number;
  readonly accessibleRampMaximumSlope: number;
  readonly reservoirDiameter: number;
  readonly reservoirDepth: number;
  readonly totalHeight: number;
}

export interface AcademicFountainScientificSymbol {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly placement: string;
}

export interface AcademicFountainSceneModeDefinition {
  readonly id: AcademicFountainSceneMode;
  readonly label: string;
  readonly description: string;
  readonly background: string;
  readonly ambientLight: string;
  readonly keyLight: string;
  readonly keyLightIntensity: number;
  readonly fogColor: string;
  readonly fogDensity: number;
  readonly wetness: number;
  readonly rain: boolean;
  readonly mist: boolean;
  readonly warmWindows: boolean;
  readonly isolateMonument: boolean;
  readonly infinityLightIntensity: number;
}

export interface AcademicFountainMaterialDefinition {
  readonly id: string;
  readonly label: string;
  readonly baseColor: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly clearcoat?: number;
  readonly transmission?: number;
  readonly opacity?: number;
  readonly weathering: string;
}

export interface AcademicFountainStatueMaterialDefinition {
  readonly id: AcademicFountainStatueMaterialMode;
  readonly label: string;
  readonly description: string;
  readonly robeMaterial: string;
  readonly skinMaterial: string;
  readonly accentMaterial: string;
}

export interface AcademicFountainCameraPreset {
  readonly id: AcademicFountainCameraPresetId;
  readonly label: string;
  readonly description: string;
  readonly positionMetres: readonly [x: number, y: number, z: number];
  readonly targetMetres: readonly [x: number, y: number, z: number];
  readonly up: readonly [x: number, y: number, z: number];
  readonly fieldOfView: number;
}

export interface AcademicFountainRestorationDefinition {
  readonly id: AcademicFountainRestorationMode;
  readonly label: string;
  readonly description: string;
  readonly weatheringAmount: number;
  readonly comparisonSplit?: number;
}

export interface AcademicFountainQualityDefinition {
  readonly id: AcademicFountainQuality;
  readonly label: string;
  readonly statueLod: AcademicFountainStatueLod;
  readonly waterDetail: AcademicFountainWaterDetail;
  readonly reflectionDetail: AcademicFountainReflectionDetail;
  readonly maxDevicePixelRatio: number;
  readonly shadowMapSize: number;
  readonly shadowCastingLights: number;
  readonly animateRing: boolean;
  readonly showRainMist: boolean;
  readonly showFineEngravings: boolean;
}

export const ACADEMIC_FOUNTAIN_DIMENSIONS_METRES = {
  courtClearRadius: 19,
  basinWidth: 14,
  basinDepth: 11.6,
  basinRecessDepth: 0.22,
  basinWaterDepth: 0.18,
  basinEdgeWidth: 0.42,
  basinEdgeHeight: 0.38,
  radialChannelReach: 8.2,
  radialChannelWidth: 0.24,
  radialChannelDepth: 0.12,
  reflectingPoolWidth: 1.6,
  plinthWidth: 3.4,
  plinthDepth: 2.8,
  plinthHeight: 2.4,
  cantileverProjection: 1.2,
  statueHeight: 6.2,
  infinityWidth: 4.8,
  infinityHeight: 2.35,
  infinityThickness: 0.32,
  orbitalRingDiameter: 8.6,
  orbitalRingThickness: 0.18,
  orbitalRingSupportCount: 3,
  floatingPlatformWidth: 4,
  floatingPlatformGap: 0.12,
  accessibleRampWidth: 2.4,
  accessibleRampMaximumSlope: 0.05,
  reservoirDiameter: 4,
  reservoirDepth: 2.1,
  totalHeight: 10.8,
} as const satisfies AcademicFountainDimensionsMetres;

export const ACADEMIC_FOUNTAIN_TITLE = 'The Well of Infinite Knowledge';

export const ACADEMIC_FOUNTAIN_DEDICATION =
  'To all who measure the known, record the unknown, and leave both open to those who follow.';

export const ACADEMIC_FOUNTAIN_HISTORY =
  'The Blackwood Senate commissioned the Well of Infinite Knowledge to unite the university\'s historic courts with its contemporary research culture. Its original interpretation of Seshat raises a structural infinity sculpture above a basin composed as an architectural drawing, while the measured channels, astronomical alignments, and engraved timeline recognize scholarship as a continuous public inheritance.';

export const ACADEMIC_FOUNTAIN_SCIENTIFIC_SYMBOLS = [
  {
    id: 'coordinate-origin',
    name: 'Coordinate Origin',
    description: 'The brass datum beneath the plinth establishes the shared origin from which every channel and construction line is measured.',
    placement: 'Central plinth floor plate',
  },
  {
    id: 'true-north-line',
    name: 'True North Line',
    description: 'A single uninterrupted brass line points to geographic north and recalls the university surveyors who mapped the first campus.',
    placement: 'Northern radial water channel',
  },
  {
    id: 'solstice-axis',
    name: 'Solstice Axis',
    description: 'Two restrained markers record the extreme seasonal paths of the sun without turning the plaza into a literal observatory.',
    placement: 'North-east and south-west basin edges',
  },
  {
    id: 'equinox-axis',
    name: 'Equinox Axis',
    description: 'Paired inlays mark the equal division of day and night and provide the composition with a precise east-west reference.',
    placement: 'East-west channel alignment',
  },
  {
    id: 'lemniscate',
    name: 'Lemniscate of Continuity',
    description: 'The raised infinity form represents knowledge repeatedly revised, preserved, and returned to public study.',
    placement: 'Infinity sculpture above Seshat',
  },
  {
    id: 'discipline-timeline',
    name: 'Timeline of Disciplines',
    description: 'A sparse sequence of dates records the fictional founding of Blackwood faculties from rhetoric and astronomy to computation.',
    placement: 'Southern basin measurement edge',
  },
  {
    id: 'knowledge-network',
    name: 'Knowledge Network',
    description: 'Constellation-like pins connect fields that share methods, instruments, and archives rather than presenting knowledge as isolated departments.',
    placement: 'Western smoked-glass panel',
  },
  {
    id: 'celestial-rosette',
    name: 'Celestial Rosette',
    description: 'Seshat\'s restrained radial headpiece combines a star, compass divisions, and calibrated observation marks.',
    placement: 'Seshat headpiece',
  },
] as const satisfies readonly AcademicFountainScientificSymbol[];

export const ACADEMIC_FOUNTAIN_SCENE_MODES = [
  {
    id: 'presentation',
    label: 'Museum White',
    description: 'An isolated architectural-visualization setting with neutral studio illumination and clean contact shadows.',
    background: '#f3f3f0',
    ambientLight: '#ffffff',
    keyLight: '#ffffff',
    keyLightIntensity: 2.1,
    fogColor: '#f3f3f0',
    fogDensity: 0,
    wetness: 0.18,
    rain: false,
    mist: false,
    warmWindows: false,
    isolateMonument: true,
    infinityLightIntensity: 0.12,
  },
  {
    id: 'courtyard',
    label: 'Overcast Courtyard',
    description: 'Cool diffuse daylight, wet paving, restrained moss, and historic university facades behind the monument.',
    background: '#7d8587',
    ambientLight: '#aeb7b9',
    keyLight: '#d8dddc',
    keyLightIntensity: 1.1,
    fogColor: '#7d8587',
    fogDensity: 0.0022,
    wetness: 0.72,
    rain: false,
    mist: false,
    warmWindows: true,
    isolateMonument: false,
    infinityLightIntensity: 0.16,
  },
  {
    id: 'night',
    label: 'Rainy Night',
    description: 'Blue-grey rain, warm academic windows, dark reflections, low mist, and restrained amber monument lighting.',
    background: '#101820',
    ambientLight: '#334452',
    keyLight: '#8293a0',
    keyLightIntensity: 0.48,
    fogColor: '#1d2931',
    fogDensity: 0.0046,
    wetness: 1,
    rain: true,
    mist: true,
    warmWindows: true,
    isolateMonument: false,
    infinityLightIntensity: 0.42,
  },
] as const satisfies readonly AcademicFountainSceneModeDefinition[];

export const ACADEMIC_FOUNTAIN_MATERIALS = [
  { id: 'weathered-dark-limestone', label: 'Weathered dark limestone', baseColor: '#343937', roughness: 0.9, metalness: 0.02, weathering: 'Fine rain streaks, dark joints, pale mineral traces, and restrained edge polish.' },
  { id: 'black-marble', label: 'Black veined marble', baseColor: '#171a1c', roughness: 0.38, metalness: 0.03, clearcoat: 0.16, weathering: 'Subtle pale veins, shallow scratches, and polished contact edges.' },
  { id: 'patinated-bronze', label: 'Patinated bronze', baseColor: '#365c54', roughness: 0.56, metalness: 0.78, weathering: 'Green-brown patina concentrated below seams and protected recesses.' },
  { id: 'tarnished-brass', label: 'Tarnished brass', baseColor: '#8b713b', roughness: 0.48, metalness: 0.82, weathering: 'Darkened engraved lines with brighter edges from repeated touch.' },
  { id: 'oxidized-copper', label: 'Oxidized copper', baseColor: '#326d67', roughness: 0.62, metalness: 0.72, weathering: 'Controlled blue-green oxidation with rain-led vertical variation.' },
  { id: 'smoked-glass', label: 'Smoked glass', baseColor: '#273136', roughness: 0.2, metalness: 0, transmission: 0.38, opacity: 0.72, weathering: 'Faint water spotting and clean protected edges.' },
  { id: 'wet-stone', label: 'Rain-darkened stone', baseColor: '#292f2e', roughness: 0.32, metalness: 0.02, clearcoat: 0.28, weathering: 'Persistent moisture below overhangs and beside active water paths.' },
  { id: 'dark-water', label: 'Green-black reflective water', baseColor: '#152826', roughness: 0.12, metalness: 0, transmission: 0.18, opacity: 0.9, weathering: 'Slow ripples, controlled overflow, and slight low-basin mist.' },
  { id: 'engraved-metal', label: 'Blackened engraved metal', baseColor: '#242522', roughness: 0.5, metalness: 0.86, weathering: 'Sparse measurement cuts with tarnish held inside the incisions.' },
  { id: 'moss-covered-joint', label: 'Moss-covered joint', baseColor: '#344234', roughness: 1, metalness: 0, weathering: 'Thin shaded growth limited to drainage joints and persistent damp.' },
] as const satisfies readonly AcademicFountainMaterialDefinition[];

export const ACADEMIC_FOUNTAIN_STATUE_MATERIALS = [
  {
    id: 'bronze',
    label: 'Patinated Bronze',
    description: 'A unified bronze Seshat with controlled green-brown patina and polished contact edges.',
    robeMaterial: 'patinated-bronze',
    skinMaterial: 'patinated-bronze',
    accentMaterial: 'tarnished-brass',
  },
  {
    id: 'dark-stone',
    label: 'Dark Stone',
    description: 'A solemn black-marble figure whose robe folds read as architectural masses.',
    robeMaterial: 'black-marble',
    skinMaterial: 'weathered-dark-limestone',
    accentMaterial: 'engraved-metal',
  },
  {
    id: 'hybrid',
    label: 'Stone and Metal',
    description: 'Dark stone robes and face are joined by bronze arms, headpiece, and measured architectural accents.',
    robeMaterial: 'weathered-dark-limestone',
    skinMaterial: 'black-marble',
    accentMaterial: 'patinated-bronze',
  },
] as const satisfies readonly AcademicFountainStatueMaterialDefinition[];

export const ACADEMIC_FOUNTAIN_CAMERA_PRESETS = [
  {
    id: 'hero',
    label: 'Hero View',
    description: 'Frames Seshat, the infinity sculpture, orbital ring, floating approach, and basin reflections together.',
    positionMetres: [15, 7.5, 18],
    targetMetres: [0, 5.1, 0],
    up: [0, 1, 0],
    fieldOfView: 45,
  },
  {
    id: 'low-angle',
    label: 'Low Angle',
    description: 'Emphasizes the raised infinity sculpture, cantilevered plinth, ring, and strong vertical geometry.',
    positionMetres: [8, 2.2, 12],
    targetMetres: [0, 6.5, 0],
    up: [0, 1, 0],
    fieldOfView: 50,
  },
  {
    id: 'top-down',
    label: 'Top Down',
    description: 'Reveals the radial channels, split basin, coordinate axes, scientific alignments, and floating platforms.',
    positionMetres: [0.01, 24, 0.01],
    targetMetres: [0, 0, 0],
    up: [0, 0, -1],
    fieldOfView: 46,
  },
  {
    id: 'side-profile',
    label: 'Side Profile',
    description: 'Shows the asymmetrical plinth, thin water sheets, structural ring supports, and statue balance.',
    positionMetres: [17, 6, 0],
    targetMetres: [0, 4.8, 0],
    up: [0, 1, 0],
    fieldOfView: 48,
  },
] as const satisfies readonly AcademicFountainCameraPreset[];

export const ACADEMIC_FOUNTAIN_RESTORATION_MODES = [
  {
    id: 'weathered',
    label: 'Maintained Weathering',
    description: 'Shows prestigious but rain-exposed materials with patina, mineral deposits, moss, scratches, and moisture masks.',
    weatheringAmount: 1,
  },
  {
    id: 'clean',
    label: 'Newly Commissioned',
    description: 'Suppresses most patina and staining while retaining the material differences and engraved construction.',
    weatheringAmount: 0.08,
  },
  {
    id: 'comparison',
    label: 'Restoration Comparison',
    description: 'Places a clean conservation reference beside the weathered original for direct material and silhouette inspection.',
    weatheringAmount: 1,
    comparisonSplit: 0.5,
  },
] as const satisfies readonly AcademicFountainRestorationDefinition[];

export const ACADEMIC_FOUNTAIN_QUALITY_PRESETS = [
  {
    id: 'low',
    label: 'Low',
    statueLod: 'silhouette',
    waterDetail: 'still',
    reflectionDetail: 'none',
    maxDevicePixelRatio: 1,
    shadowMapSize: 512,
    shadowCastingLights: 0,
    animateRing: false,
    showRainMist: false,
    showFineEngravings: false,
  },
  {
    id: 'medium',
    label: 'Medium',
    statueLod: 'detailed',
    waterDetail: 'animated',
    reflectionDetail: 'environment',
    maxDevicePixelRatio: 1.35,
    shadowMapSize: 1024,
    shadowCastingLights: 1,
    animateRing: true,
    showRainMist: true,
    showFineEngravings: false,
  },
  {
    id: 'high',
    label: 'High',
    statueLod: 'high',
    waterDetail: 'detailed',
    reflectionDetail: 'enhanced',
    maxDevicePixelRatio: 1.8,
    shadowMapSize: 2048,
    shadowCastingLights: 2,
    animateRing: true,
    showRainMist: true,
    showFineEngravings: true,
  },
] as const satisfies readonly AcademicFountainQualityDefinition[];

export const ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS = {
  readPlaque: 'read fountain plaque',
  orbit: 'orbit fountain',
  resetCamera: 'reset fountain camera',
  cycleCameraPreset: 'cycle fountain camera preset',
  cycleSceneMode: 'cycle fountain scene mode',
  toggleWater: 'toggle fountain water',
  increaseWaterFlow: 'increase fountain water flow',
  decreaseWaterFlow: 'decrease fountain water flow',
  toggleInfinityLight: 'toggle infinity lighting',
  highlightEngravings: 'highlight scientific engravings',
  describeNextSymbol: 'describe next scientific symbol',
  toggleCutaway: 'toggle fountain cutaway',
  toggleGeometryGrid: 'toggle fountain geometry grid',
  toggleRingRotation: 'toggle orbital ring rotation',
  cycleStatueMaterial: 'cycle Seshat material',
  cycleRestorationView: 'cycle fountain restoration view',
  toggleDebug: 'toggle fountain debug view',
} as const;

export type AcademicFountainInteractionAction =
  (typeof ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS)[keyof typeof ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS];

export const ACADEMIC_FOUNTAIN_CONTEXTUAL_INTERACTIONS = Object.values(
  ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS,
) as readonly AcademicFountainInteractionAction[];

export const ACADEMIC_FOUNTAIN_CONFIG = {
  version: 2,
  rootName: ACADEMIC_FOUNTAIN_ROOT_NAME,
  title: ACADEMIC_FOUNTAIN_TITLE,
  dedication: ACADEMIC_FOUNTAIN_DEDICATION,
  history: ACADEMIC_FOUNTAIN_HISTORY,
  patron: 'Seshat, patron of writing, measurement, architecture, memory, and scholarship',
  dimensionsMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES,
  scientificSymbols: ACADEMIC_FOUNTAIN_SCIENTIFIC_SYMBOLS,
  sceneModes: ACADEMIC_FOUNTAIN_SCENE_MODES,
  materials: ACADEMIC_FOUNTAIN_MATERIALS,
  statueMaterials: ACADEMIC_FOUNTAIN_STATUE_MATERIALS,
  cameraPresets: ACADEMIC_FOUNTAIN_CAMERA_PRESETS,
  restorationModes: ACADEMIC_FOUNTAIN_RESTORATION_MODES,
  qualityPresets: ACADEMIC_FOUNTAIN_QUALITY_PRESETS,
  interactions: ACADEMIC_FOUNTAIN_CONTEXTUAL_INTERACTIONS,
  defaultState: {
    sceneMode: 'courtyard' as AcademicFountainSceneMode,
    statueMaterial: 'hybrid' as AcademicFountainStatueMaterialMode,
    cameraPreset: 'hero' as AcademicFountainCameraPresetId,
    restorationMode: 'weathered' as AcademicFountainRestorationMode,
    quality: 'medium' as AcademicFountainQuality,
    waterOn: true,
    waterFlow: 0.72,
    infinityLightOn: true,
    engravingsHighlighted: false,
    cutawayVisible: false,
    geometryGridVisible: false,
    ringRotating: false,
  },
  water: {
    minimumFlow: 0,
    maximumFlow: 1,
    flowStep: 0.1,
    sheetStopSeconds: 3.5,
    residualDripSeconds: 8,
    rippleSettleSeconds: 5.5,
    activeColor: '#152826',
  },
  orbit: {
    minimumDistanceMetres: 8,
    maximumDistanceMetres: 42,
    minimumPolarAngle: 0.16,
    maximumPolarAngle: 1.48,
  },
} as const;
