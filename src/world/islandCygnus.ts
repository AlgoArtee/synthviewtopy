import * as THREE from 'three';
import { createCygnusSystem, type CygnusSkyState } from './syntheticShore/celestial';

// Preserve the shore artwork's angular size. Geometry distance only supplies
// perspective: its shader writes the far background depth, never island depth.
const SKY_SCALE = 0.14;
const SKY_DISTANCE = 9000 * SKY_SCALE;
// Explore cannot tilt above the horizon. This fixed low elevation keeps the
// complete binary visible at its shallowest allowed orbit angle, below the UI.
const SKY_DIRECTION = new THREE.Vector3(0, Math.tan(THREE.MathUtils.degToRad(7)), -1).normalize();

export interface IslandCygnusSnapshot extends CygnusSkyState {
  placement: 'fixed-north-sky';
  depthPlacement: 'background-far-plane';
  cameraTranslationOnly: true;
  skyDistance: number;
}

export interface IslandCygnus {
  group: THREE.Group;
  update(camera: THREE.Camera, time: number, daylight: number, visibility: number): void;
  getSnapshot(camera?: THREE.Camera): IslandCygnusSnapshot;
  dispose(): void;
}

/** Reuses the complete MizuTopia binary artwork and animation in the island sky. */
export function createIslandCygnus(): IslandCygnus {
  const system = createCygnusSystem();
  const group = new THREE.Group();
  group.name = 'Island Cygnus X-1 sky';
  group.scale.setScalar(SKY_SCALE);
  // Transparent island glass must composite over the sky, after opaque
  // foreground geometry has already populated the depth buffer.
  group.renderOrder = -100;
  group.userData.presentationOnly = true;
  group.userData.navObstacle = false;
  group.add(system.group);
  // This is presentation artwork; it must never intercept Explore selection.
  system.group.traverse((object) => {
    object.raycast = () => {};
    object.userData.navObstacle = false;
    if (!(object instanceof THREE.Mesh)) return;
    object.renderOrder = -100;
    const material = object.material as THREE.ShaderMaterial;
    // Keep the full shared fragment shader and its animation. Only the depth
    // projection differs: astronomical objects belong behind every island
    // surface, even when their angular proxy plane is closer to the camera.
    // Three's reverse depth mode uses clip-control [0, 1] with far at zero.
    material.vertexShader = /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #ifdef USE_REVERSEDEPTHBUF
          gl_Position.z = 0.0;
        #else
          gl_Position.z = gl_Position.w;
        #endif
      }
    `;
    material.depthTest = true;
    material.depthWrite = false;
  });

  const initialOrientationInverse = system.group.quaternion.clone().invert();
  const localRight = new THREE.Vector3(1, 0, 0).applyQuaternion(system.group.quaternion);
  const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(system.group.quaternion);
  // Offsets are the shared artwork's black-hole centre in its authored plane.
  const blackHoleDirection = system.group.position.clone()
    .addScaledVector(localRight, -1220).addScaledVector(localUp, -90).normalize();
  const originCamera = new THREE.Camera();
  const orientationTarget = new THREE.Object3D();
  orientationTarget.position.copy(SKY_DIRECTION);
  orientationTarget.lookAt(new THREE.Vector3());
  group.quaternion.copy(orientationTarget.quaternion).multiply(initialOrientationInverse);
  const cameraPosition = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const bodyDirection = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let lastCamera: THREE.Camera = originCamera;
  let disposed = false;

  function bodyState(camera: THREE.Camera, localDirection: THREE.Vector3) {
    bodyDirection.copy(localDirection).applyQuaternion(group.quaternion).normalize();
    camera.getWorldPosition(cameraPosition);
    projected.copy(cameraPosition).addScaledVector(bodyDirection, SKY_DISTANCE).project(camera);
    camera.getWorldDirection(forward);
    const inFront = forward.dot(bodyDirection) > 0;
    return {
      inFront,
      inViewport: inFront && Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1
        && projected.z >= -1 && projected.z <= 1,
      elevationDegrees: Number(THREE.MathUtils.radToDeg(Math.asin(bodyDirection.y)).toFixed(1)),
      screenPosition: {
        x: Number(((projected.x + 1) * 0.5).toFixed(3)),
        y: Number(((1 - projected.y) * 0.5).toFixed(3)),
      },
    };
  }

  return {
    group,
    update(camera, time, daylight, visibility) {
      if (disposed) return;
      lastCamera = camera;
      camera.getWorldPosition(cameraPosition);
      // Translation alone removes parallax. The orientation is set once:
      // orbiting, walking, and changing altitude reveal/hide the same sky.
      group.position.copy(cameraPosition);
      system.update(originCamera, time, false, visibility, daylight);
    },
    getSnapshot(camera = lastCamera) {
      const state = system.getState(camera);
      return {
        ...state,
        visible: !disposed && group.visible && state.visible,
        fixedWorldBearing: true,
        blackHole: bodyState(camera, blackHoleDirection),
        companion: bodyState(camera, system.companionDirection),
        placement: 'fixed-north-sky',
        depthPlacement: 'background-far-plane',
        cameraTranslationOnly: true,
        skyDistance: SKY_DISTANCE,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      system.group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      group.clear();
    },
  };
}
