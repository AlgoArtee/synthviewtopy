import * as THREE from 'three';
import { getCityWeatherPreset, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';

export interface WindowHologramRooftop {
  buildingId: number;
  position: [number, number, number];
}

// The three roof huts indicated in the user's reference: left, near right,
// and the next right-hand roof. Roof positions come from the actual buildings.
const PERFORMERS = [
  { id: 'fan-dancer', name: 'Kimono fan dancer', buildingId: 2, height: 4.3, color: '#ff8bdb', yaw: .30 },
  { id: 'synth-singer', name: 'Tokyo synth singer', buildingId: 1, height: 3.5, color: '#73dbff', yaw: -.30 },
  { id: 'parasol', name: 'Luminous parasol', buildingId: 3, height: 5.1, color: '#b2c8ff', yaw: -.20 },
] as const;

/** Fixed world-space projections, with restrained independent cloth and light motion. */
export function createCityWindowHolograms(rooftops: WindowHologramRooftop[]) {
  const group = new THREE.Group();
  group.name = 'North City · Japanese window holograms';
  const performers = PERFORMERS.map(p => {
    const roof = rooftops.find(r => r.buildingId === p.buildingId);
    if (!roof) throw new Error(`Missing roof for window hologram: ${p.buildingId}`);
    return { ...p, x: roof.position[0], y: roof.position[1] + .12 + p.height * .5,
      z: roof.position[2], roofY: roof.position[1] };
  });
  const time = { value: 0 }, fog = { value: .011 }, brightness = { value: .88 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const snapshot = {
    count: PERFORMERS.length, time: 0, reducedMotion: reducedMotion.matches,
    figures: performers.map(p => ({ id: p.id, name: p.name, status: 'loading',
      position: [p.x, p.y, p.z], height: p.height, buildingId: p.buildingId, roofY: p.roofY })),
  };
  group.userData.holograms = snapshot;
  let disposed = false;
  const loader = new THREE.TextureLoader();
  const ready: Promise<void>[] = [];
  const decorativeMaterials: THREE.MeshBasicMaterial[] = [];

  performers.forEach((performer, index) => {
    const root = new THREE.Group(); root.name = `Window hologram · ${performer.name}`;
    root.position.set(performer.x, performer.y, performer.z);
    root.rotation.y = performer.yaw; group.add(root);
    const width = performer.height * 2 / 3;
    const material = new THREE.ShaderMaterial({
      uniforms: { uImage: { value: null }, uTime: time, uFog: fog, uBrightness: brightness,
        uPhase: { value: index * 2.1 } },
      vertexShader: `
        uniform float uTime, uPhase;
        varying vec2 vUv; varying float vDistance;
        void main() {
          vUv = uv; vec3 p = position;
          float hem = pow(1.0 - uv.y, 2.0);
          // Face and shoulders stay steady; the lower fabric drifts very gently.
          p.x += hem * .055 * sin(uTime * .53 + uv.y * 7.0 + uPhase);
          p.z += .09 * sin(uv.x * 3.14159) + hem * .025 * cos(uTime * .41 + uPhase);
          p.y += .018 * sin(uTime * .31 + uPhase);
          vec4 view = modelViewMatrix * vec4(p, 1.0);
          vDistance = length(view.xyz); gl_Position = projectionMatrix * view;
        }`,
      fragmentShader: `
        uniform sampler2D uImage;
        uniform float uTime, uPhase, uBrightness, uFog;
        varying vec2 vUv; varying float vDistance;
        void main() {
          vec4 art = texture2D(uImage, vUv);
          float light = max(art.r, max(art.g, art.b));
          // Original alpha carries the fine hair and luminous fabric edges.
          // Black interior shading emits no light under additive blending.
          float coverage = art.a * smoothstep(.008, .055, light);
          float edge = smoothstep(0.0, .025, vUv.x) * smoothstep(0.0, .025, 1.0-vUv.x)
            * smoothstep(0.0, .015, vUv.y) * smoothstep(0.0, .015, 1.0-vUv.y);
          float scan = .94 + .06 * sin(vUv.y * 690.0 - uTime * 1.7 + uPhase);
          float sweep = pow(.5 + .5 * sin(vUv.y * 8.0 - uTime * .48 + uPhase), 12.0);
          float mist = exp(-uFog * uFog * vDistance * vDistance);
          float alpha = coverage * edge * mist * uBrightness;
          if (alpha < .001) discard;
          gl_FragColor = vec4(art.rgb * (1.15 + sweep * .12) * scan, alpha);
          #include <colorspace_fragment>
        }`,
      transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, toneMapped: false, forceSinglePass: true,
    });
    material.addEventListener('dispose', () => { disposed = true; });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, performer.height, 12, 32), material);
    panel.name = `Window projection · ${performer.id}`;
    panel.geometry.computeBoundingSphere(); panel.geometry.boundingSphere!.radius += .15;
    root.add(panel);
    ready.push(new Promise<void>(resolve => {
      loader.load(`/apartments/assets/north-city/window-holograms/${performer.id}.png`, texture => {
        if (disposed) { texture.dispose(); resolve(); return; }
        texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
        material.uniforms.uImage.value = texture;
        snapshot.figures[index].status = 'ready'; resolve();
      }, undefined, () => {
        snapshot.figures[index].status = 'failed'; panel.visible = false; resolve();
      });
    }));

    // A small physical emitter sits on the roof; the projection grows upward
    // from it instead of floating freely above the street.
    const color = new THREE.Color(performer.color);
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(width * .22, width * .23, .08, 40),
      new THREE.MeshStandardMaterial({ color: '#24313e', metalness: .75, roughness: .35 }));
    emitter.name = 'Window hologram · rooftop projector';
    emitter.position.y = -performer.height * .5 - .08; root.add(emitter);
    for (let ring = 0; ring < 2; ring++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: ring ? .11 : .24,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      mat.userData.baseOpacity = mat.opacity; decorativeMaterials.push(mat);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(width * (.20 + ring * .05), .009, 5, 64), mat);
      halo.name = 'Window hologram · optical halo'; halo.rotation.x = Math.PI / 2;
      halo.position.y = -performer.height * .5 - .035 + ring * .018; root.add(halo);
    }
    const rayPositions: number[] = [];
    for (const side of [-1, 1]) {
      rayPositions.push(0, -performer.height * .50, 0, side * width * .27, -performer.height * .08, -.02);
    }
    const rayMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: .07,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const rays = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',
      new THREE.Float32BufferAttribute(rayPositions, 3)), rayMaterial);
    rays.name = 'Window hologram · faint projection rays'; root.add(rays);
  });

  const positions: number[] = [], seeds: number[] = [], colors: number[] = [];
  performers.forEach((p, index) => {
    for (let i = 0; i < 24; i++) {
      const phase = i * 2.399963 + index;
      positions.push(p.x + Math.sin(phase) * p.height * .25,
        p.y - p.height * .5, p.z + Math.cos(phase) * .45);
      seeds.push((i * .618034) % 1, p.height, phase);
      colors.push(...new THREE.Color(i % 2 ? '#ff95dd' : '#80deff').toArray());
    }
  });
  const particles = new THREE.Points(new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    .setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 3))
    .setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)),
  new THREE.ShaderMaterial({
    uniforms: { uTime: time, uFog: fog, uBrightness: brightness },
    vertexShader: `
      attribute vec3 aSeed; attribute vec3 color; uniform float uTime;
      varying vec3 vColor; varying float vFade; varying float vDistance;
      void main() {
        float life = fract(aSeed.x + uTime * .032);
        vec3 p = position; p.y += life * aSeed.y;
        p.x += .09 * sin(uTime * .3 + aSeed.z); vColor = color;
        vFade = sin(life * 3.14159); vec4 view = modelViewMatrix * vec4(p, 1.0);
        vDistance = length(view.xyz); gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(95.0 / max(1.0, -view.z), 1.0, 5.0);
      }`,
    fragmentShader: `
      uniform float uFog, uBrightness; varying vec3 vColor;
      varying float vFade; varying float vDistance;
      void main() {
        float dotGlow = 1.0 - smoothstep(.05, .5, length(gl_PointCoord - .5));
        float fog = exp(-uFog*uFog*vDistance*vDistance);
        gl_FragColor = vec4(vColor, dotGlow * vFade * fog * uBrightness * .5);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  particles.name = 'Window holograms · rising light motes'; particles.frustumCulled = false; group.add(particles);

  function setWeather(weather: OsCityWeather, timeOfDay: CityTimeOfDay = 'day') {
    fog.value = getCityWeatherPreset(weather, timeOfDay).fog;
    brightness.value = timeOfDay === 'night' ? .69 : timeOfDay === 'day' ? .96 : .83;
    decorativeMaterials.forEach(material => {
      material.opacity = material.userData.baseOpacity * brightness.value;
    });
  }
  function update(elapsed: number) {
    time.value = reducedMotion.matches ? 0 : elapsed;
    snapshot.time = +time.value.toFixed(3); snapshot.reducedMotion = reducedMotion.matches;
  }
  setWeather('rain');
  return { group, ready: Promise.all(ready), setWeather, update, snapshot };
}
