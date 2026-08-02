import * as THREE from 'three';
import type { BiomeDefinition, DistrictDefinition } from '../data/districts';
import { ISLAND_SURFACE_Y } from '../config/island';

export type StreamedWorldDefinition = DistrictDefinition | BiomeDefinition;
export type StreamedPackageKind = 'district' | 'biome';
export type StreamingViewMode = 'explore' | 'plan' | 'edit' | 'walk';

export interface StreamingUpdateContext {
  cameraPosition: THREE.Vector3;
  mode: StreamingViewMode;
  selectedPackageId: string | null;
  interiorPackageId: string | null;
  force?: boolean;
}

export interface StreamingPackageSnapshot {
  id: string;
  kind: StreamedPackageKind;
  detailResident: boolean;
  proxyVisible: boolean;
  distanceMetres: number;
}

interface StreamingPackage {
  id: string;
  kind: StreamedPackageKind;
  detailEnvelope: THREE.Group;
  detailRoot: THREE.Group;
  proxy: THREE.Object3D;
  anchor: THREE.Vector3;
  detailAnchorObjects: THREE.Object3D[];
  detailResident: boolean;
  distanceMetres: number;
}

interface ProductionVisibilityState {
  detailResident: boolean;
  detailEnvelopeVisible: boolean;
  proxyVisible: boolean;
}

const districtProxyGeometry = new THREE.BoxGeometry(1, 1, 1);
const districtRoofGeometry = new THREE.ConeGeometry(0.72, 1, 4);
const biomeProxyGeometry = new THREE.SphereGeometry(0.5, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.52);
const DISTRICT_SILHOUETTE_PROFILES = [
  { x: -0.29, z: -0.08, width: 0.27, depth: 0.46, height: 0.68 },
  { x: 0.02, z: 0.08, width: 0.3, depth: 0.35, height: 1 },
  { x: 0.31, z: -0.1, width: 0.2, depth: 0.4, height: 0.58 },
  { x: -0.08, z: -0.32, width: 0.24, depth: 0.2, height: 0.45 },
  { x: 0.06, z: 0.32, width: 0.42, depth: 0.17, height: 0.36 },
] as const;

function makeProxy(definition: StreamedWorldDefinition, kind: StreamedPackageKind) {
  const root = new THREE.Group();
  root.name = `STREAMING_HLOD__${definition.id.toUpperCase().replaceAll('-', '_')}`;
  root.position.set(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]);
  root.userData.selectableId = definition.id;
  root.userData.streamingProxy = true;
  root.userData.streamingHlod = true;
  root.userData.exportExcluded = true;
  root.userData.streamingSilhouetteProfile = kind === 'district'
    ? 'multi-mass-building-silhouette'
    : 'atmospheric-biome-shell';

  const authoredPalette = definition.palette.map((color) => new THREE.Color(color));
  const baseColor = authoredPalette[0].clone();
  root.userData.streamingPaletteSource = 'authored-definition-palette';
  root.userData.streamingPalette = authoredPalette.map((color) => color.getHexString());
  const material = new THREE.MeshStandardMaterial({
    name: `Streamed ${kind} exterior HLOD · ${definition.name}`,
    color: baseColor,
    roughness: kind === 'biome' ? 0.28 : 0.7,
    metalness: kind === 'biome' ? 0.14 : 0.08,
    transparent: kind === 'biome',
    opacity: kind === 'biome' ? 0.68 : 1,
    depthWrite: true,
    fog: true,
  });
  const mesh = new THREE.Mesh(kind === 'biome' ? biomeProxyGeometry : districtProxyGeometry, material);
  mesh.name = `${root.name}__${kind === 'biome' ? 'PRIMARY_SHELL' : 'LOW_PODIUM'}`;
  if (kind === 'biome') {
    mesh.position.y = definition.height * 0.25;
    mesh.scale.set(definition.footprint[0], definition.height * 1.9, definition.footprint[1]);
  } else {
    const visibleHeight = Math.max(1.2, definition.height * 0.68);
    const podiumHeight = Math.max(0.22, visibleHeight * 0.14);
    mesh.position.y = podiumHeight * 0.5;
    mesh.scale.set(
      Math.max(1.6, definition.footprint[0] * 0.78),
      podiumHeight,
      Math.max(1.6, definition.footprint[1] * 0.76),
    );
  }
  mesh.userData.selectableId = definition.id;
  mesh.userData.streamingProxy = true;
  mesh.userData.streamingHlod = true;
  mesh.userData.exportExcluded = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  root.add(mesh);

  if (kind === 'district') {
    // A low podium plus five offset volumes reads as a district skyline from
    // WALK. The former single full-height box saved draw calls but made even
    // nearby laboratories look like colored cubes.
    const visibleHeight = Math.max(1.2, definition.height * 0.68);
    const podiumHeight = Math.max(0.22, visibleHeight * 0.14);
    const silhouetteMasses = DISTRICT_SILHOUETTE_PROFILES.map((profile, index) => {
      const massMaterial = material.clone();
      massMaterial.name = `${material.name} · silhouette mass ${index + 1}`;
      massMaterial.color.copy(authoredPalette[[1, 2, 1, 0, 2][index] ?? 1] ?? baseColor);
      const mass = new THREE.Mesh(districtProxyGeometry, massMaterial);
      const totalHeight = Math.max(0.52, visibleHeight * profile.height);
      const lowerHeight = totalHeight * 0.66;
      mass.name = `${root.name}__SILHOUETTE_LOWER_MASS_${index + 1}`;
      mass.position.set(
        definition.footprint[0] * profile.x,
        podiumHeight + lowerHeight * 0.5,
        definition.footprint[1] * profile.z,
      );
      mass.scale.set(
        Math.max(0.55, definition.footprint[0] * profile.width),
        lowerHeight,
        Math.max(0.55, definition.footprint[1] * profile.depth),
      );
      mass.userData.silhouetteTotalHeight = totalHeight;
      return mass;
    });
    const silhouetteSetbacks = silhouetteMasses.map((mass, index) => {
      const setbackMaterial = material.clone();
      setbackMaterial.name = `${material.name} · silhouette setback ${index + 1}`;
      setbackMaterial.color.copy(authoredPalette[[2, 1, 3, 2, 1][index] ?? 2] ?? baseColor);
      const setback = new THREE.Mesh(districtProxyGeometry, setbackMaterial);
      const totalHeight = Number(mass.userData.silhouetteTotalHeight);
      const upperHeight = totalHeight - mass.scale.y;
      setback.name = `${root.name}__SILHOUETTE_UPPER_SETBACK_${index + 1}`;
      setback.position.set(
        mass.position.x + definition.footprint[0] * (index % 2 ? 0.012 : -0.009),
        podiumHeight + mass.scale.y + upperHeight * 0.5,
        mass.position.z + definition.footprint[1] * (index % 2 ? -0.01 : 0.012),
      );
      setback.scale.set(
        mass.scale.x * (0.66 + (index % 3) * 0.05),
        upperHeight,
        mass.scale.z * (0.68 + ((index + 1) % 3) * 0.045),
      );
      return setback;
    });
    const roofMaterial = new THREE.MeshStandardMaterial({
      name: `${material.name} · roof`,
      color: authoredPalette[0],
      roughness: 0.82,
      metalness: 0.12,
      fog: true,
    });
    const roofCaps = silhouetteSetbacks.map((setback, index) => {
      const cap = new THREE.Mesh(districtProxyGeometry, roofMaterial);
      cap.name = `${root.name}__ROOF_CAP_${index + 1}`;
      cap.position.set(
        setback.position.x,
        setback.position.y + setback.scale.y * 0.5 + 0.035,
        setback.position.z,
      );
      cap.scale.set(setback.scale.x * 1.08, 0.07, setback.scale.z * 1.08);
      return cap;
    });
    const roof = new THREE.Mesh(districtRoofGeometry, roofMaterial);
    roof.name = `${root.name}__ROOF_PROFILE`;
    roof.rotation.y = Math.PI * 0.25;
    const crownMass = silhouetteSetbacks[1];
    const roofHeight = Math.max(0.18, definition.height * 0.11);
    roof.position.set(
      crownMass.position.x,
      crownMass.position.y + crownMass.scale.y * 0.5 + roofHeight * 0.5,
      crownMass.position.z,
    );
    roof.scale.set(
      Math.max(0.45, definition.footprint[0] * 0.19),
      roofHeight,
      Math.max(0.45, definition.footprint[1] * 0.22),
    );
    const windowMaterial = new THREE.MeshBasicMaterial({
      name: `${material.name} · atmosphere band`,
      color: authoredPalette[3] ?? new THREE.Color(definition.accent),
      transparent: true,
      opacity: 0.38,
      fog: true,
    });
    const windowBands = silhouetteMasses.slice(0, 3).map((mass, index) => {
      const windows = new THREE.Mesh(districtProxyGeometry, windowMaterial);
      windows.name = `${root.name}__WINDOW_BAND_${index + 1}`;
      windows.position.set(
        mass.position.x,
        podiumHeight + mass.scale.y * (0.3 + index * 0.12),
        mass.position.z + mass.scale.z * 0.5 + 0.018,
      );
      windows.scale.set(
        Math.max(0.25, mass.scale.x * 0.66),
        Math.max(0.035, mass.scale.y * 0.045),
        0.025,
      );
      return windows;
    });
    [...silhouetteMasses, ...silhouetteSetbacks, ...roofCaps, roof, ...windowBands].forEach((part) => {
      part.userData.selectableId = definition.id;
      part.userData.streamingProxy = true;
      part.userData.streamingHlod = true;
      part.userData.exportExcluded = true;
      part.castShadow = false;
      part.receiveShadow = false;
    });
    root.userData.streamingSilhouetteMassCount = silhouetteMasses.length + silhouetteSetbacks.length;
    root.add(...silhouetteMasses, ...silhouetteSetbacks, ...roofCaps, roof, ...windowBands);
  }
  return root;
}

/**
 * Visibility-level scene streaming for the browser preview.
 *
 * Detailed roots remain editable and keep their own user visibility flag. The
 * manager only toggles identity envelopes around them, so streaming never
 * overwrites an object's saved/editor visibility.
 */
export class WorldStreamingManager {
  readonly vistaRoot = new THREE.Group();
  private readonly packages = new Map<string, StreamingPackage>();
  private districtLayerEnabled = true;
  private biomeLayerEnabled = true;
  private lastCameraPosition = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0);
  private lastMode: StreamingViewMode | null = null;
  private lastSelectedPackageId: string | null = null;
  private lastInteriorPackageId: string | null = null;
  private productionVisibilityState: Map<string, ProductionVisibilityState> | null = null;
  private readonly detailAnchorWorld = new THREE.Vector3();

  constructor() {
    this.vistaRoot.name = 'STREAMING__EXTERIOR_VISTA_PROXIES';
    this.vistaRoot.userData.exportExcluded = true;
    this.vistaRoot.renderOrder = 1;
  }

  register(
    definition: StreamedWorldDefinition,
    kind: StreamedPackageKind,
    detailRoot: THREE.Group,
    parent: THREE.Group,
  ) {
    const previous = this.packages.get(definition.id);
    if (previous) {
      previous.detailEnvelope.removeFromParent();
      previous.proxy.removeFromParent();
      previous.proxy.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const previousMaterials = Array.isArray(object.material) ? object.material : [object.material];
        previousMaterials.forEach((material) => material.dispose());
      });
      this.packages.delete(definition.id);
    }
    const detailEnvelope = new THREE.Group();
    detailEnvelope.name = `STREAMING_ENVELOPE__${definition.id.toUpperCase().replaceAll('-', '_')}`;
    detailEnvelope.userData.streamingPackageId = definition.id;
    detailEnvelope.userData.streamingPackageKind = kind;
    detailEnvelope.add(detailRoot);
    parent.add(detailEnvelope);

    const proxy = makeProxy(definition, kind);
    this.vistaRoot.add(proxy);
    detailRoot.updateMatrixWorld(true);
    const packageAnchor = new THREE.Vector3(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]);
    const detailAnchorObjects: THREE.Object3D[] = [];
    detailRoot.traverse((object) => {
      if (!(object instanceof THREE.Group)) return;
      if (object.userData.exteriorProgram !== true && object.userData.academicFacility !== true) return;
      detailAnchorObjects.push(object);
    });
    this.packages.set(definition.id, {
      id: definition.id,
      kind,
      detailEnvelope,
      detailRoot,
      proxy,
      anchor: packageAnchor,
      detailAnchorObjects,
      detailResident: true,
      distanceMetres: Number.POSITIVE_INFINITY,
    });
    return detailEnvelope;
  }

  findPackageId(object: THREE.Object3D | null | undefined) {
    let cursor: THREE.Object3D | null = object ?? null;
    while (cursor) {
      if (typeof cursor.userData.streamingPackageId === 'string') {
        return cursor.userData.streamingPackageId as string;
      }
      cursor = cursor.parent;
    }
    return null;
  }

  setLayerEnabled(kind: StreamedPackageKind, enabled: boolean) {
    if (kind === 'district') this.districtLayerEnabled = enabled;
    else this.biomeLayerEnabled = enabled;
    this.updateProxyLayerVisibility();
  }

  private packageLayerEnabled(pkg: StreamingPackage) {
    return pkg.kind === 'district' ? this.districtLayerEnabled : this.biomeLayerEnabled;
  }

  private updateProxyLayerVisibility() {
    this.packages.forEach((pkg) => {
      pkg.proxy.visible = this.packageLayerEnabled(pkg) && !pkg.detailResident;
    });
  }

  update(context: StreamingUpdateContext) {
    // Production export serializes every high-detail package. Hold the detail
    // envelopes resident while it runs so the live animation loop cannot swap
    // them back to overview proxies between individual GLB writes.
    if (this.productionVisibilityState) return false;
    const movedEnough = this.lastCameraPosition.distanceToSquared(context.cameraPosition) > 0.25;
    const contextChanged = context.force
      || movedEnough
      || context.mode !== this.lastMode
      || context.selectedPackageId !== this.lastSelectedPackageId
      || context.interiorPackageId !== this.lastInteriorPackageId;
    if (!contextChanged) {
      // The visibility flags are presentation state rather than authored
      // object state. Reconcile them even when the camera is stationary so a
      // stale HLOD flag (for example after a view/persistence transition)
      // cannot leave a proxy rendered over its resident detailed package.
      let repaired = false;
      this.packages.forEach((pkg) => {
        if (pkg.detailEnvelope.visible !== pkg.detailResident) {
          pkg.detailEnvelope.visible = pkg.detailResident;
          repaired = true;
        }
        const shouldShowProxy = this.packageLayerEnabled(pkg) && !pkg.detailResident;
        if (pkg.proxy.visible !== shouldShowProxy) {
          pkg.proxy.visible = shouldShowProxy;
          repaired = true;
        }
      });
      return repaired;
    }

    this.lastCameraPosition.copy(context.cameraPosition);
    this.lastMode = context.mode;
    this.lastSelectedPackageId = context.selectedPackageId;
    this.lastInteriorPackageId = context.interiorPackageId;

    const altitude = Math.max(0, context.cameraPosition.y - ISLAND_SURFACE_Y);
    const detailRadius = context.mode === 'walk'
      ? 90
      : context.mode === 'edit'
        ? 96
        : 82;
    let changed = false;

    this.packages.forEach((pkg) => {
      let horizontalWorldUnits = Math.hypot(
        context.cameraPosition.x - pkg.anchor.x,
        context.cameraPosition.z - pkg.anchor.z,
      );
      pkg.detailAnchorObjects.forEach((object) => {
        object.getWorldPosition(this.detailAnchorWorld);
        horizontalWorldUnits = Math.min(
          horizontalWorldUnits,
          Math.hypot(
            context.cameraPosition.x - this.detailAnchorWorld.x,
            context.cameraPosition.z - this.detailAnchorWorld.z,
          ),
        );
      });
      pkg.distanceMetres = horizontalWorldUnits * 10;
      const selected = context.mode === 'edit' && context.selectedPackageId === pkg.id;
      const interiorOwner = context.interiorPackageId === pkg.id;
      const closeEnough = horizontalWorldUnits <= detailRadius;
      const overview = context.mode === 'plan'
        || (context.mode !== 'walk' && altitude > 115)
        || horizontalWorldUnits > detailRadius * 2.2;
      const shouldShowDetail = this.packageLayerEnabled(pkg)
        && (context.interiorPackageId
          ? interiorOwner
          : context.mode === 'explore'
            ? true
            : selected || (!overview && closeEnough));

      if (pkg.detailResident !== shouldShowDetail) {
        pkg.detailResident = shouldShowDetail;
        changed = true;
      }
      if (pkg.detailEnvelope.visible !== shouldShowDetail) {
        pkg.detailEnvelope.visible = shouldShowDetail;
        changed = true;
      }
      const shouldShowProxy = this.packageLayerEnabled(pkg) && !shouldShowDetail;
      if (pkg.proxy.visible !== shouldShowProxy) {
        pkg.proxy.visible = shouldShowProxy;
        changed = true;
      }
    });
    return changed;
  }

  beginProductionExport() {
    if (this.productionVisibilityState) {
      throw new Error('A Production export is already preparing streamed world packages.');
    }
    this.productionVisibilityState = new Map();
    this.packages.forEach((pkg) => {
      this.productionVisibilityState!.set(pkg.id, {
        detailResident: pkg.detailResident,
        detailEnvelopeVisible: pkg.detailEnvelope.visible,
        proxyVisible: pkg.proxy.visible,
      });
      pkg.detailResident = true;
      pkg.detailEnvelope.visible = true;
      pkg.proxy.visible = false;
    });

    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      const states = this.productionVisibilityState;
      this.productionVisibilityState = null;
      states?.forEach((state, id) => {
        const pkg = this.packages.get(id);
        if (!pkg) return;
        pkg.detailResident = state.detailResident;
        pkg.detailEnvelope.visible = state.detailEnvelopeVisible;
        pkg.proxy.visible = state.proxyVisible;
      });
    };
  }

  getSnapshot() {
    const packages = Array.from(this.packages.values());
    return {
      authority: 'web-sandbox' as const,
      strategy: 'all exterior packages in Explore; near detail plus atmospheric exterior HLODs in Walk',
      totalPackages: packages.length,
      residentDetailPackages: packages.filter((pkg) => pkg.detailResident).map((pkg) => pkg.id),
      proxyPackageCount: packages.filter((pkg) => pkg.proxy.visible).length,
      packages: packages.map((pkg): StreamingPackageSnapshot => ({
        id: pkg.id,
        kind: pkg.kind,
        detailResident: pkg.detailResident,
        proxyVisible: pkg.proxy.visible,
        distanceMetres: Number.isFinite(pkg.distanceMetres) ? Math.round(pkg.distanceMetres) : -1,
      })),
    };
  }

  dispose() {
    const materials = new Set<THREE.Material>();
    this.vistaRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materials.add(material));
    });
    materials.forEach((material) => material.dispose());
    this.vistaRoot.clear();
    this.packages.clear();
  }
}

export function isEffectivelyVisible(object: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    if (!cursor.visible) return false;
    cursor = cursor.parent;
  }
  return true;
}
