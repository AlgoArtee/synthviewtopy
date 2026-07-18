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

const districtProxyGeometry = new THREE.BoxGeometry(1, 1, 1);
const biomeProxyGeometry = new THREE.SphereGeometry(0.5, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.52);

function makeProxy(definition: StreamedWorldDefinition, kind: StreamedPackageKind) {
  const material = new THREE.MeshBasicMaterial({
    name: `Streamed ${kind} silhouette · ${definition.name}`,
    color: new THREE.Color(definition.palette[0]).lerp(new THREE.Color(definition.accent), 0.16),
    transparent: true,
    opacity: kind === 'biome' ? 0.72 : 0.88,
    depthWrite: true,
    fog: true,
  });
  const mesh = new THREE.Mesh(kind === 'biome' ? biomeProxyGeometry : districtProxyGeometry, material);
  mesh.name = `STREAMING_PROXY__${definition.id.toUpperCase().replaceAll('-', '_')}`;
  mesh.position.set(
    definition.position[0],
    ISLAND_SURFACE_Y + definition.height * (kind === 'biome' ? 0.25 : 0.34),
    definition.position[2],
  );
  if (kind === 'biome') {
    mesh.scale.set(definition.footprint[0], definition.height * 1.9, definition.footprint[1]);
  } else {
    mesh.scale.set(
      Math.max(1.6, definition.footprint[0] * 0.72),
      Math.max(1.2, definition.height * 0.68),
      Math.max(1.6, definition.footprint[1] * 0.72),
    );
  }
  mesh.userData.selectableId = definition.id;
  mesh.userData.streamingProxy = true;
  mesh.userData.exportExcluded = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
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
      if (previous.proxy instanceof THREE.Mesh) {
        const previousMaterials = Array.isArray(previous.proxy.material)
          ? previous.proxy.material
          : [previous.proxy.material];
        previousMaterials.forEach((material) => material.dispose());
      }
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
      ? 72
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

  getSnapshot() {
    const packages = Array.from(this.packages.values());
    return {
      authority: 'web-sandbox' as const,
      strategy: 'detail envelopes with selectable exterior vista proxies',
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
