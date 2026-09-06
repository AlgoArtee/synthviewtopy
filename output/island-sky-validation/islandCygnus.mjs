import * as THREE from 'three';
import { createCygnusSystem } from './celestial.mjs';
// The shore sky is authored in metres. Preserve its apparent angular size
// while bringing the single plane inside the island camera's far plane.
const SKY_SCALE = 0.14;
const SKY_DISTANCE = 9000 * SKY_SCALE;
const WALK_SKY_DIRECTION = new THREE.Vector3(0, Math.tan(THREE.MathUtils.degToRad(20)), -1).normalize();
const OVERVIEW_OFFSET = Math.tan(THREE.MathUtils.degToRad(12));
/** Reuses the complete MizuTopia binary artwork and animation in the island sky. */
export function createIslandCygnus() {
    const system = createCygnusSystem();
    const group = new THREE.Group();
    group.name = 'Island Cygnus X-1 sky';
    group.scale.setScalar(SKY_SCALE);
    group.userData.presentationOnly = true;
    group.userData.navObstacle = false;
    group.add(system.group);
    // This is presentation artwork; it must never intercept Explore selection.
    system.group.traverse((object) => {
        object.raycast = () => { };
        object.userData.navObstacle = false;
    });
    const initialOrientationInverse = system.group.quaternion.clone().invert();
    const localRight = new THREE.Vector3(1, 0, 0).applyQuaternion(system.group.quaternion);
    const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(system.group.quaternion);
    // Offsets are the shared artwork's black-hole centre in its authored plane.
    const blackHoleDirection = system.group.position.clone()
        .addScaledVector(localRight, -1220).addScaledVector(localUp, -90).normalize();
    const originCamera = new THREE.Camera();
    const orientationTarget = new THREE.Object3D();
    const cameraPosition = new THREE.Vector3();
    const cameraRotation = new THREE.Quaternion();
    const forward = new THREE.Vector3();
    const up = new THREE.Vector3();
    const desiredDirection = new THREE.Vector3();
    const bodyDirection = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const zero = new THREE.Vector3();
    let lastCamera = originCamera;
    let overviewMix = 0;
    let disposed = false;
    function bodyState(camera, localDirection) {
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
            if (disposed)
                return;
            lastCamera = camera;
            camera.getWorldPosition(cameraPosition);
            camera.getWorldQuaternion(cameraRotation);
            camera.getWorldDirection(forward);
            up.set(0, 1, 0).applyQuaternion(cameraRotation);
            overviewMix = THREE.MathUtils.smoothstep(cameraPosition.y, 80, 240);
            // A survey camera looks down: a physically fixed star would sit outside
            // its view. Raise the artwork within that overview, then return smoothly
            // to a fixed compass bearing as the visitor descends to human height.
            desiredDirection.copy(forward).addScaledVector(up, OVERVIEW_OFFSET).normalize();
            desiredDirection.lerp(WALK_SKY_DIRECTION, 1 - overviewMix).normalize();
            orientationTarget.position.copy(desiredDirection);
            orientationTarget.lookAt(zero);
            group.position.copy(cameraPosition);
            group.quaternion.copy(orientationTarget.quaternion).multiply(initialOrientationInverse);
            system.update(originCamera, time, false, visibility, daylight);
        },
        getSnapshot(camera = lastCamera) {
            const state = system.getState(camera);
            return {
                ...state,
                visible: !disposed && group.visible && state.visible,
                fixedWorldBearing: overviewMix === 0,
                blackHole: bodyState(camera, blackHoleDirection),
                companion: bodyState(camera, system.companionDirection),
                placement: overviewMix === 0 ? 'fixed-north-sky' : overviewMix === 1 ? 'overview-sky' : 'transition',
                overviewMix: Number(overviewMix.toFixed(3)),
                skyDistance: SKY_DISTANCE,
            };
        },
        dispose() {
            if (disposed)
                return;
            disposed = true;
            group.removeFromParent();
            system.group.traverse((object) => {
                if (!(object instanceof THREE.Mesh))
                    return;
                object.geometry.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach((material) => material.dispose());
            });
            group.clear();
        },
    };
}
