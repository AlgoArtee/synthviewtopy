import * as THREE from 'three';
import { createIslandCygnus, type IslandCygnusSnapshot } from '../world/islandCygnus';

/** The exact Lab Island artwork, composed above the shared north-facing campus. */
export const APARTMENT_SKY_METADATA = {
  name: 'Cygnus X-1 and HDE 226868',
  source: 'src/world/islandCygnus.ts',
  artworkSource: 'src/world/syntheticShore/celestial.ts',
  sharedFactory: 'createIslandCygnus',
  shaderAndGeometry: 'identical-to-lab-island',
  placement: 'fixed-north-sky',
  centreElevationDegrees: 20,
  angularScale: 1,
  proxyScale: 0.2,
  renderLayer: 1,
  daylight: 1,
  visibility: 0.96,
} as const;

// The 1260 m island proxy is uniformly reduced to 252 m. The shader still
// writes far-background depth, so real campus buildings always occlude it.
// All room cameras currently use far=450; 320 also encloses this proxy.
export const APARTMENT_SKY_MINIMUM_CAMERA_FAR = 320;

/** Fast deterministic content fingerprint for diagnostics, not a security hash. */
function fingerprint(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export interface ApartmentSkyArtworkSignature {
  vertexShader: string;
  fragmentShader: string;
  geometry: string;
  meshCount: number;
  geometryType: string;
  planeWidth: number;
  planeHeight: number;
  angularWidthDegrees: number;
  angularHeightDegrees: number;
}

export interface ApartmentSkySnapshot extends Omit<IslandCygnusSnapshot, 'skyDistance'> {
  skyDistance: number;
  sourceSkyDistance: number;
  source: typeof APARTMENT_SKY_METADATA.source;
  artworkSource: typeof APARTMENT_SKY_METADATA.artworkSource;
  shaderAndGeometry: typeof APARTMENT_SKY_METADATA.shaderAndGeometry;
  centreElevationDegrees: number;
  angularScale: 1;
  renderLayer: 1;
  minimumCameraFar: number;
  artworkSignature: ApartmentSkyArtworkSignature;
}

export interface ApartmentSky {
  group: THREE.Group;
  update(camera: THREE.Camera, elapsedSeconds: number): void;
  getSnapshot(camera?: THREE.Camera): ApartmentSkySnapshot;
  dispose(): void;
}

/**
 * A placement adapter only: this does not copy or replace any celestial shader,
 * uniform model, mesh geometry, stellar radius, spacing or animation. Changes
 * to the island's shared artwork therefore reach every apartment automatically.
 */
export function createApartmentSky(): ApartmentSky {
  const island = createIslandCygnus();
  const group = island.group;
  const sourceSkyDistance = island.getSnapshot().skyDistance;
  const sourceMeshes: THREE.Mesh[] = [];
  group.traverse(object => { if (object instanceof THREE.Mesh) sourceMeshes.push(object); });
  const artwork = sourceMeshes[0];
  const artworkMaterial = artwork.material as THREE.ShaderMaterial;
  const artworkGeometry = artwork.geometry as THREE.PlaneGeometry;
  const sourcePlaneDistance = group.children[0].position.length();
  const artworkSignature: ApartmentSkyArtworkSignature = Object.freeze({
    vertexShader: fingerprint(artworkMaterial.vertexShader),
    fragmentShader: fingerprint(artworkMaterial.fragmentShader),
    geometry: fingerprint(JSON.stringify({
      type: artworkGeometry.type,
      parameters: artworkGeometry.parameters,
      index: Array.from(artworkGeometry.index!.array),
      attributes: Object.fromEntries(['position', 'normal', 'uv'].map(name => [name, Array.from(artworkGeometry.getAttribute(name).array)])),
    })),
    meshCount: sourceMeshes.length,
    geometryType: artworkGeometry.type,
    planeWidth: artworkGeometry.parameters.width,
    planeHeight: artworkGeometry.parameters.height,
    angularWidthDegrees: Number(THREE.MathUtils.radToDeg(2 * Math.atan(artworkGeometry.parameters.width / (2 * sourcePlaneDistance))).toFixed(6)),
    angularHeightDegrees: Number(THREE.MathUtils.radToDeg(2 * Math.atan(artworkGeometry.parameters.height / (2 * sourcePlaneDistance))).toFixed(6)),
  });
  const sourceDirection = group.children[0].position.clone().applyQuaternion(group.quaternion).normalize();
  const sourceElevation = Math.asin(sourceDirection.y);
  const elevationChange = THREE.MathUtils.degToRad(APARTMENT_SKY_METADATA.centreElevationDegrees) - sourceElevation;
  group.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), elevationChange));
  group.scale.multiplyScalar(APARTMENT_SKY_METADATA.proxyScale);
  group.name = 'Apartment Cygnus · exact Lab Island artwork';
  group.userData.apartmentSky = APARTMENT_SKY_METADATA;
  group.userData.exterior = true;
  group.userData.presentationOnly = true;
  let elapsed = 0;
  let lastCamera: THREE.Camera = new THREE.Camera();
  let disposed = false;

  function positionForCamera(camera: THREE.Camera) {
    island.update(camera, elapsed, APARTMENT_SKY_METADATA.daylight, APARTMENT_SKY_METADATA.visibility);
    group.updateWorldMatrix(true, true);
  }

  group.traverse(object => {
    object.layers.set(APARTMENT_SKY_METADATA.renderLayer);
    object.userData.apartmentSky = APARTMENT_SKY_METADATA;
    object.userData.navObstacle = false;
    if (!(object instanceof THREE.Mesh)) return;
    // Astronomical backgrounds must not be culled using their proxy distance.
    // The unchanged island vertex shader performs the actual far-depth placement.
    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;
    // A vanity reflection uses its own virtual camera. Translating for that
    // render as well prevents nearby-mirror parallax in this astronomical sky.
    object.onBeforeRender = (_renderer, _scene, renderCamera) => {
      if (!disposed) positionForCamera(renderCamera);
    };
  });

  return {
    group,
    update(camera, elapsedSeconds) {
      if (disposed) return;
      lastCamera = camera;
      elapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : elapsed;
      positionForCamera(camera);
    },
    getSnapshot(camera = lastCamera) {
      const state = island.getSnapshot(camera);
      // Island diagnostics project a 1260 m sample. Far-background artwork is
      // visible at the far plane even when this diagnostic sample exceeds the
      // room camera's 450 m frustum; screen x/y and world bearings remain exact.
      const bodyState = (body: IslandCygnusSnapshot['blackHole']) => ({
        ...body,
        inViewport: body.inFront && body.screenPosition.x >= 0 && body.screenPosition.x <= 1
          && body.screenPosition.y >= 0 && body.screenPosition.y <= 1,
      });
      return {
        ...state,
        visible: !disposed && state.visible,
        blackHole: bodyState(state.blackHole),
        companion: bodyState(state.companion),
        skyDistance: sourceSkyDistance * APARTMENT_SKY_METADATA.proxyScale,
        sourceSkyDistance,
        source: APARTMENT_SKY_METADATA.source,
        artworkSource: APARTMENT_SKY_METADATA.artworkSource,
        shaderAndGeometry: APARTMENT_SKY_METADATA.shaderAndGeometry,
        centreElevationDegrees: APARTMENT_SKY_METADATA.centreElevationDegrees,
        angularScale: APARTMENT_SKY_METADATA.angularScale,
        renderLayer: APARTMENT_SKY_METADATA.renderLayer,
        minimumCameraFar: APARTMENT_SKY_MINIMUM_CAMERA_FAR,
        artworkSignature,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      island.dispose();
    },
  };
}
