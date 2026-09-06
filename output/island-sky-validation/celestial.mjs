// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
import * as THREE from 'three';
const SKY_DISTANCE = 9000;
const PLANE_WIDTH = 7600;
const PLANE_HEIGHT = 3800;
const BLACK_HOLE_RADIUS = 112;
const COMPANION_RADIUS = 630;
const CORONA_PERIOD_SECONDS = 8;
const STREAM_SPEED = 0.10;
const BLACK_HOLE_OFFSET = new THREE.Vector2(-1220, -90);
const COMPANION_OFFSET = new THREE.Vector2(1590, 500);
const SKY_DIRECTION = new THREE.Vector3(1, Math.tan(THREE.MathUtils.degToRad(20)), 0).normalize();
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uVisibility;
  uniform float uUnderwater;
  uniform float uDaylight;
  uniform float uCoronaPulse;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    return noise(p) * 0.55 + noise(p * 2.07 + 13.5) * 0.28 + noise(p * 4.19 - 7.6) * 0.17;
  }

  float gaussian(float x) { return exp(-x * x); }

  // Projected, turbulent disk emission, also sampled by the lensed images.
  // Orbital shear speeds up inward; angular coordinates remain seam-free.
  vec3 diskEmission(float radius, float azimuth) {
    float speed = 1.65 / pow(max(radius, 1.3) / 1.3, 1.5);
    float phase = azimuth - uTime * speed;
    vec2 orbit = vec2(cos(phase), sin(phase));
    float turbulence = fbm(orbit * radius * 3.8 + vec2(radius * 2.7, 0.0));
    float shear = sin(radius * 20.0 + 3.0 * sin(phase) + turbulence * 5.0);
    float detailFade = 1.0 - smoothstep(0.25, 1.1, fwidth(radius) * 20.0);
    float texture = 0.40 + 0.60 * turbulence + shear * 0.055 * detailFade;
    float inner = smoothstep(1.25, 1.7, radius);
    float outer = 1.0 - smoothstep(3.6, 5.2, radius);
    float heat = pow(max(radius, 1.5) / 1.5, -1.35);
    float approaching = 0.5 - 0.5 * cos(azimuth);
    float beaming = mix(0.78, 1.35, approaching);
    vec3 hot = mix(vec3(3.2, 2.45, 2.15), vec3(3.0, 3.3, 3.9), approaching * 0.55);
    vec3 color = mix(hot, vec3(1.1, 0.38, 0.23), smoothstep(1.8, 5.4, radius));
    return color * inner * outer * heat * texture * beaming * 1.55;
  }

  void main() {
    // Coordinates are world-plane metres / 2000. Both stellar silhouettes
    // share this scale, keeping the reference's diameter ratio exactly 5.625.
    vec2 p = (vUv - 0.5) * vec2(3.8, 1.9);
    vec2 hole = (p - vec2(-0.61, -0.045)) / 0.056;
    vec2 star = (p - vec2(0.795, 0.25)) / 0.315;
    float hr = length(hole);
    float sr = length(star);
    float starAA = max(fwidth(sr), 0.001);
    float holeAA = max(fwidth(hr), 0.002);
    float starDisc = 1.0 - smoothstep(1.0 - starAA, 1.0 + starAA, sr);
    float core = 1.0 - smoothstep(1.0 - holeAA, 1.0 + holeAA, hr);
    vec3 radiance = vec3(0.0);
    float opacity = 0.0;

    // The photosphere keeps its original radius and nearly steady brightness.
    // Only the surrounding blue gas breathes; this avoids a flashing white disc.
    float mu = sqrt(max(0.0, 1.0 - sr * sr));
    float granulation = fbm(star * 10.0 + vec2(uTime * 0.018, -uTime * 0.009));
    float limb = 0.62 + 0.38 * mu;
    vec3 starColor = mix(vec3(0.20, 1.10, 3.2), vec3(2.7, 3.6, 4.3), pow(mu, 0.65));
    float outside = max(sr - 1.0, 0.0);
    float nightPresence = 1.0 - smoothstep(0.28, 0.82, uDaylight);
    float haloGain = 1.0 + uCoronaPulse * mix(0.12, 0.38, nightPresence);
    float haloRadius = 1.0 + uCoronaPulse * mix(0.045, 0.20, nightPresence);
    float corona = exp(-outside * 4.8 / haloRadius) * 0.62
      + exp(-outside * 1.75 / haloRadius) * 0.12;
    // Soft wisps turn through the corona without sharp spokes or point flares.
    // Four lobes advance slowly, with the complete pattern repeating in 8 s.
    float wispPhase = atan(star.y, star.x) * 4.0 - uTime * 0.7853981634;
    wispPhase += outside * 3.8 + fbm(star * 2.5) * 3.0;
    float wisp = 0.5 + 0.5 * sin(wispPhase);
    float wisps = 0.80 + 0.20 * wisp * wisp;
    // Compact radial support ends before the plane border, even at peak breath.
    float coronaSupport = 1.0 - smoothstep(1.70, 2.10, sr);
    corona *= (1.0 - starDisc) * coronaSupport;
    float haloOpacity = min(0.88, corona * haloGain * wisps * mix(0.48, 1.0, nightPresence));
    radiance += vec3(0.002, 0.25, 1.8) * haloOpacity;
    opacity = max(opacity, haloOpacity);
    radiance += starColor * limb * (0.92 + granulation * 0.13) * starDisc;
    opacity = max(opacity, starDisc);

    // Cygnus X-1 captures a focused stellar wind. A broad translucent plume
    // converges into a denser curved stream at the disk's outer rim. Blue is
    // an illustrative plasma color, not a prediction of naked-eye emission.
    // Features advect to decreasing flowT (star -> disk) in ten seconds.
    float flowT = clamp((p.x + 0.43) / 1.04, 0.0, 1.0);
    float advectedT = flowT + uTime * ${STREAM_SPEED.toFixed(2)};
    float flowY = -0.039 + 0.289 * smoothstep(0.0, 1.0, flowT);
    float flowWidth = max(0.006 + 0.066 * flowT * flowT, fwidth(p.y) * 0.75);
    float bend = sin(flowT * 3.14159265);
    flowY += (noise(vec2(advectedT * 9.0, 4.7)) - 0.5) * 0.018 * bend;
    float signedCross = (p.y - flowY) / flowWidth;
    float flowEnvelope = smoothstep(0.0, 0.028, flowT) * (1.0 - smoothstep(0.94, 1.0, flowT));
    float density = fbm(vec2(advectedT * 13.0, signedCross * 1.1));
    float surge = smoothstep(0.30, 0.78, noise(vec2(advectedT * 19.0, 2.8)));
    float threads = 0.0;
    for (int i = 0; i < 3; i++) {
      float lane = float(i) - 1.0;
      float curl = sin(advectedT * 22.0 + float(i) * 2.1) * 0.22 * bend;
      float crossThread = (signedCross - lane * 0.68 - curl) / 0.40;
      threads += gaussian(crossThread) * (0.10 + density * 0.22 + surge * 0.12);
    }
    float mist = gaussian(signedCross / 1.7) * (0.10 + 0.22 * density);
    float glow = gaussian(signedCross / 3.2) * 0.14;
    float flow = (threads + mist + glow) * flowEnvelope;
    flow *= mix(0.72, 1.0, nightPresence) * (1.0 - starDisc);
    vec3 flowColor = mix(vec3(0.008, 0.30, 2.6), vec3(0.001, 0.12, 1.9), smoothstep(0.0, 0.8, flowT));
    radiance += flowColor * flow;
    opacity = max(opacity, min(0.78, flow * 0.82));

    // Nearly edge-on disk, as in the supplied Interstellar-style reference.
    // A broad lensed far side and the near-side disk crossing the shadow are
    // separate depth layers; a black circle must not erase foreground light.
    float angle = 0.025;
    mat2 tilt = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 d = tilt * hole;
    vec2 orbital = vec2(d.x, d.y / 0.10);
    float orbitRadius = length(orbital);
    float orbitAngle = atan(orbital.y, orbital.x);
    float outerDisc = 1.0 - smoothstep(3.6, 5.2, orbitRadius);
    float innerDisc = smoothstep(1.25, 1.7, orbitRadius);
    float discShape = innerDisc * outerDisc;
    vec3 diskLight = diskEmission(orbitRadius, orbitAngle);
    // Incoming gas circularizes through a blue spiral on the visible disk.
    float captureAngle = orbitAngle - (orbitRadius - 3.2) * 0.60 - 0.08;
    float captureSpiral = gaussian(sin(captureAngle) / 0.19) * smoothstep(0.2, 0.8, cos(captureAngle));
    float captureDensity = 0.62 + 0.38 * noise(vec2(orbitRadius * 3.0 + uTime * 1.8, 3.1));
    float capturedGas = captureSpiral * discShape * (1.0 - smoothstep(3.8, 5.7, orbitRadius)) * captureDensity;
    diskLight += vec3(0.005, 0.30, 3.0) * capturedGas * 0.55;
    radiance += diskLight;
    opacity = max(opacity, min(0.90, max(diskLight.r, max(diskLight.g, diskLight.b)) * 0.38));

    // Approximate primary/secondary images of the SAME disk above/below
    // the shadow. Their emission shares its sheared texture and beaming.
    float lensAngle = atan(d.y, d.x);
    float upper = smoothstep(-0.02, 0.28, d.y);
    float lower = 1.0 - smoothstep(-0.24, 0.02, d.y);
    // Wider at the shoulders, nearly circular overhead. The apparent folds
    // blend back into the horizontal disk instead of forming a detached hoop.
    float lensRadius = length(vec2(d.x / 1.10, d.y));
    float shoulderX = abs(d.x) / 1.50;
    float archY = 1.48 * exp(-pow(shoulderX, 2.65));
    float archSlope = archY * (2.65 / 1.50) * pow(max(shoulderX, 0.001), 1.65);
    float archDistance = (d.y - archY) / sqrt(1.0 + archSlope * archSlope);
    float archExtent = 1.0 - smoothstep(2.5, 4.6, abs(d.x));
    float upperArc = gaussian(archDistance / max(0.28, holeAA * 0.85)) * upper * archExtent;
    float lowerArc = gaussian((lensRadius - 1.30) / max(0.24, holeAA * 0.85)) * lower;
    float sourceRadius = 1.72 + max(0.0, lensRadius - 1.12) * 2.8;
    vec3 lensedLight = diskEmission(sourceRadius, lensAngle);
    float fineBands = sin(lensRadius * 84.0 + 1.1 * sin(lensAngle * 3.0 - uTime * 1.3));
    fineBands *= 1.0 - smoothstep(0.35, 1.2, fwidth(lensRadius) * 84.0);
    float lensTexture = 1.0 + fineBands * 0.065;
    radiance += lensedLight * (upperArc * 2.5 + lowerArc * 1.45) * lensTexture;
    float ringWidth = max(holeAA * 0.55, 0.018);
    float photonRing = gaussian((hr - 1.045) / ringWidth);
    float ringBeaming = 0.7 + 0.6 * (0.5 - 0.5 * cos(lensAngle));
    float warmHalo = gaussian((lensRadius - 1.42) / 0.65) * 0.23;
    radiance += vec3(2.7, 2.2, 2.0) * photonRing * ringBeaming;
    radiance += vec3(1.4, 0.92, 1.05) * warmHalo;
    opacity = max(opacity, max(min(0.94, upperArc * 0.92 + lowerArc * 0.85), max(photonRing * 0.85, warmHalo)));
    radiance *= 1.0 - core;
    radiance += vec3(0.00008, 0.00012, 0.00019) * core;
    opacity = max(opacity, core);

    // The near-side disk lies IN FRONT of the apparent shadow. Integrating
    // its thin edge gives the reference's bright central seam, with a soft
    // optical glow and dark lobes above/below to keep a sense of depth.
    float frontY = d.y + 0.065;
    float frontWidth = max(0.048, fwidth(d.y) * 0.58);
    float frontBand = gaussian(frontY / frontWidth);
    float frontGlow = gaussian(frontY / 0.23) * 0.16;
    float frontExtent = 1.0 - smoothstep(2.5, 4.9, abs(d.x));
    float foregroundRadius = sqrt(d.x * d.x + 2.2 * 2.2);
    vec3 foregroundLight = diskEmission(foregroundRadius, atan(-2.2, d.x));
    // An edge-on line of sight averages many turbulent emitting patches.
    foregroundLight = mix(vec3(1.3, 1.05, 1.0) * pow(foregroundRadius / 2.2, -1.35), foregroundLight, 0.22);
    float front = (frontBand * 2.6 + frontGlow) * frontExtent;
    radiance += foregroundLight * front;
    opacity = max(opacity, min(0.98, (frontBand * 0.92 + frontGlow) * frontExtent));

    // The sky is at astronomical distance. Underwater extinction is handled
    // here as well as in the scene, so neither body shines through deep water.
    float atmosphericVisibility = uVisibility * mix(1.0, 0.06, uUnderwater);
    opacity *= atmosphericVisibility;
    if (opacity < 0.001) discard;
    vec3 color = radiance / max(opacity / max(atmosphericVisibility, 0.001), 0.025);
    gl_FragColor = vec4(color, clamp(opacity, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
/** An art-directed apparent sky system; the supplied reference defines its scale. */
export function createCygnusSystem() {
    const group = new THREE.Group();
    group.name = 'Cygnus X-1 and HDE 226868';
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uVisibility: { value: 1 },
            uUnderwater: { value: 0 },
            uDaylight: { value: 0 },
            uCoronaPulse: { value: -1 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        fog: false,
        side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT), material);
    plane.name = 'Cygnus binary photosphere and accretion flow';
    plane.frustumCulled = false;
    plane.renderOrder = 2;
    group.add(plane);
    // The orientation is computed once in world space, never copied from the
    // view camera: looking around must reveal and hide the distant system.
    group.position.copy(SKY_DIRECTION).multiplyScalar(SKY_DISTANCE);
    group.lookAt(new THREE.Vector3());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(group.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(group.quaternion);
    const directionAtOffset = (offset) => SKY_DIRECTION.clone()
        .multiplyScalar(SKY_DISTANCE)
        .addScaledVector(right, offset.x)
        .addScaledVector(up, offset.y)
        .normalize();
    const companionDirection = directionAtOffset(COMPANION_OFFSET);
    const blackHoleDirection = directionAtOffset(BLACK_HOLE_OFFSET);
    const projected = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const bodyState = (camera, direction) => {
        projected.copy(camera.position).addScaledVector(direction, SKY_DISTANCE).project(camera);
        camera.getWorldDirection(forward);
        const inFront = forward.dot(direction) > 0;
        return {
            inFront,
            inViewport: inFront && Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1
                && projected.z >= -1 && projected.z <= 1,
            elevationDegrees: Number(THREE.MathUtils.radToDeg(Math.asin(direction.y)).toFixed(1)),
            screenPosition: {
                x: Number(((projected.x + 1) * 0.5).toFixed(3)),
                y: Number(((1 - projected.y) * 0.5).toFixed(3)),
            },
        };
    };
    return {
        group,
        companionDirection,
        update(camera, time, underwater, visibility, daylight) {
            group.position.copy(camera.position).addScaledVector(SKY_DIRECTION, SKY_DISTANCE);
            material.uniforms.uTime.value = time;
            material.uniforms.uCoronaPulse.value = -Math.cos(time * Math.PI * 2 / CORONA_PERIOD_SECONDS);
            material.uniforms.uUnderwater.value = underwater ? 1 : 0;
            material.uniforms.uVisibility.value = THREE.MathUtils.clamp(visibility, 0, 1);
            material.uniforms.uDaylight.value = THREE.MathUtils.clamp(daylight, 0, 1);
        },
        getState(camera) {
            return {
                visible: group.visible && material.uniforms.uVisibility.value > 0.1,
                fixedWorldBearing: true,
                companionToBlackHoleDiameter: COMPANION_RADIUS / BLACK_HOLE_RADIUS,
                blackHole: bodyState(camera, blackHoleDirection),
                companion: bodyState(camera, companionDirection),
                animation: {
                    coronaPeriodSeconds: CORONA_PERIOD_SECONDS,
                    coronaPhase: ((material.uniforms.uTime.value % CORONA_PERIOD_SECONDS) + CORONA_PERIOD_SECONDS) % CORONA_PERIOD_SECONDS / CORONA_PERIOD_SECONDS,
                    coronaPulse: material.uniforms.uCoronaPulse.value,
                    streamTransitSeconds: 1 / STREAM_SPEED,
                    streamDirection: 'companion-to-black-hole',
                },
            };
        },
    };
}
