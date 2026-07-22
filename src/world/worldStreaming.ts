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

function makeProxy(definition: StreamedWorldDefinition, kind: StreamedPackageKind) {
  const root = new THREE.Group();
  root.name = `STREAMING_HLOD__${definition.id.toUpperCase().replaceAll('-', '_')}`;
  root.position.set(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]);
  root.userData.selectableId = definition.id;
  root.userData.streamingProxy = true;
  root.userData.streamingHlod = true;
  root.userData.exportExcluded = true;

  const baseColor = new THREE.Color(definition.palette[0]).lerp(new THREE.Color(definition.accent), 0.14);
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
  mesh.name = `${root.name}__PRIMARY_MASS`;
  if (kind === 'biome') {
    mesh.position.y = definition.height * 0.25;
    mesh.scale.set(definition.footprint[0], definition.height * 1.9, definition.footprint[1]);
  } else {
    const visibleHeight = Math.max(1.2, definition.height * 0.68);
    mesh.position.y = visibleHeight * 0.5;
    mesh.scale.set(
      Math.max(1.6, definition.footprint[0] * 0.72),
      visibleHeight,
      Math.max(1.6, definition.footprint[1] * 0.72),
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
    // A stepped upper volume, roof profile, and restrained luminous window
    // band preserve a believable skyline in WALK without submitting the
    // district's thousands of near-detail objects.
    const upperMaterial = material.clone();
    upperMaterial.name = `${material.name} · upper volume`;
    upperMaterial.color.copy(baseColor).offsetHSL(0, -0.03, 0.07);
    const upper = new THREE.Mesh(districtProxyGeometry, upperMaterial);
    upper.name = `${root.name}__UPPER_MASS`;
    upper.position.y = Math.max(1.2, definition.height * 0.68) + definition.height * 0.1;
    upper.scale.set(
      Math.max(0.8, definition.footprint[0] * 0.38),
      Math.max(0.35, definition.height * 0.2),
      Math.max(0.8, definition.footprint[1] * 0.4),
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      name: `${material.name} · roof`,
      color: new THREE.Color(definition.palette[1] ?? definition.palette[0]).multiplyScalar(0.62),
      roughness: 0.82,
      metalness: 0.12,
      fog: true,
    });
    const roof = new THREE.Mesh(districtRoofGeometry, roofMaterial);
    roof.name = `${root.name}__ROOF_PROFILE`;
    roof.rotation.y = Math.PI * 0.25;
    roof.position.y = upper.position.y + upper.scale.y * 0.72;
    roof.scale.set(
      Math.max(0.7, definition.footprint[0] * 0.34),
      Math.max(0.22, definition.height * 0.14),
      Math.max(0.7, definition.footprint[1] * 0.36),
    );
    const windowMaterial = new THREE.MeshBasicMaterial({
      name: `${material.name} · atmosphere band`,
      color: new THREE.Color(definition.accent).lerp(new THREE.Color('#ffd7a1'), 0.34),
      transparent: true,
      opacity: 0.38,
      fog: true,
    });
    const windows = new THREE.Mesh(districtProxyGeometry, windowMaterial);
    windows.name = `${root.name}__WINDOW_BAND`;
    windows.position.set(0, Math.max(0.55, definition.height * 0.31), definition.footprint[1] * 0.365);
    windows.scale.set(
      Math.max(0.7, definition.footprint[0] * 0.52),
      Math.max(0.04, definition.height * 0.055),
      0.025,
    );
    [upper, roof, windows].forEach((part) => {
      part.userData.selectableId = definition.id;
      part.userData.streamingProxy = true;
      part.userData.streamingHlod = true;
      part.userData.exportExcluded = true;
      part.castShadow = false;
      part.receiveShadow = false;
    });
    root.add(upper, roof, windows);
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
    this.packages.set(definition.id, {
      id: definition.id,
      kind,
      detailEnvelope,
      detailRoot,
      proxy,
      anchor: new THREE.Vector3(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]),
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
    if (!contextChanged) return false;

    this.lastCameraPosition.copy(context.cameraPosition);
    this.lastMode = context.mode;
    this.lastSelectedPackageId = context.selectedPackageId;
    this.lastInteriorPackageId = context.interiorPackageId;

    const altitude = Math.max(0, context.cameraPosition.y - ISLAND_SURFACE_Y);
    const detailRadius = context.mode === 'walk'
      ? 65
      : context.mode === 'edit'
        ? 96
        : 82;
    let changed = false;

    this.packages.forEach((pkg) => {
      const horizontalWorldUnits = Math.hypot(
        context.cameraPosition.x - pkg.anchor.x,
        context.cameraPosition.z - pkg.anchor.z,
      );
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
        pkg.detailEnvelope.visible = shouldShowDetail;
        changed = true;
      }
      pkg.proxy.visible = this.packageLayerEnabled(pkg) && !shouldShowDetail;
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
