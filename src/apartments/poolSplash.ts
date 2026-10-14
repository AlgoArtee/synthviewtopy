import * as THREE from 'three';

/** Reusable entry splash: ballistic droplets, a water crown and fading ripples. */
export function createPoolSplash(scene: THREE.Scene) {
  const group = new THREE.Group(); group.name = 'Pool entry splashes'; scene.add(group);
  const dropGeometry = new THREE.SphereGeometry(1, 6, 4);
  const dropMaterial = new THREE.MeshPhysicalMaterial({ color: '#caf4ff', roughness: .12, metalness: 0,
    transparent: true, opacity: .82, transmission: .20, depthWrite: false });
  const drops = new THREE.InstancedMesh(dropGeometry, dropMaterial, 192);
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage); drops.frustumCulled = false; drops.count = 0; drops.layers.set(1); group.add(drops);
  const ringGeometry = new THREE.RingGeometry(.93, 1.02, 64);
  const rings = Array.from({length: 6}, () => {
    const material = new THREE.MeshBasicMaterial({ color: '#dbf9fb', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(ringGeometry, material); mesh.rotation.x = -Math.PI / 2; mesh.layers.set(1); group.add(mesh); return mesh;
  });
  const segments = 48;
  const crownGeometry = new THREE.BufferGeometry();
  crownGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 1) * 3 * 3), 3));
  const indices = [];
  for (let i = 0; i < segments; i++) for (let j = 0; j < 2; j++) {
    const a = i * 3 + j; indices.push(a, a + 3, a + 4, a, a + 4, a + 1);
  }
  crownGeometry.setIndex(indices);
  const crownMaterial = new THREE.MeshBasicMaterial({color: '#d8f7fb', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false});
  const crown = new THREE.Mesh(crownGeometry, crownMaterial); crown.frustumCulled = false; crown.layers.set(1); group.add(crown);
  const dummy = new THREE.Object3D();
  const bursts: {x: number; z: number; age: number; strength: number; seed: number}[] = [];
  let total = 0, disposed = false, water = -.19;
  const random = (n: number) => THREE.MathUtils.euclideanModulo(Math.sin(n * 12.9898) * 43758.5453, 1);
  return {
    trigger(x: number, z: number, impact: number) {
      if (disposed) return;
      total++; bursts.unshift({x, z, age: 0, strength: THREE.MathUtils.clamp(impact / 6, .6, 1.65), seed: total * 97});
      bursts.length = Math.min(3, bursts.length);
    },
    update(dt: number) {
      if (disposed) return;
      bursts.forEach(b => b.age += dt);
      while (bursts.length && bursts[bursts.length - 1].age > 2.1) bursts.pop();
      let count = 0;
      for (const burst of bursts) for (let i = 0; i < 64; i++) {
        const t = burst.age, angle = i * 2.399963, r = random(i + burst.seed), speed = (1.0 + r * 1.1) * burst.strength;
        const x = burst.x + Math.cos(angle) * speed * t, z = burst.z + Math.sin(angle) * speed * t;
        const y = water + .08 + (2.0 + random(i + 35 + burst.seed) * 2.2) * burst.strength * t - 4.9 * t * t;
        const inWater = Math.abs(x) < 5.45 && Math.abs(z) < 3.45;
        if (t > 1.2 || y < (inWater ? water : .01)) continue;
        dummy.position.set(x, y, z); const size = (.017 + r * .022) * Math.max(.1, 1 - t / 1.3);
        dummy.scale.set(size, size * (1.3 + r), size); dummy.updateMatrix(); drops.setMatrixAt(count++, dummy.matrix);
      }
      drops.count = count; drops.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < rings.length; i++) {
        const burst = bursts[Math.floor(i / 2)], mesh = rings[i], material = mesh.material;
        if (!burst) { material.opacity = 0; continue; }
        const age = burst.age - (i % 2) * .16;
        const radius = Math.max(.04, .18 + age * (1.1 + burst.strength * .55));
        const edge = Math.max(.05, Math.min(5.45 - Math.abs(burst.x), 3.45 - Math.abs(burst.z)));
        mesh.position.set(burst.x, water + .018 + (i % 2) * .001, burst.z);
        mesh.scale.setScalar(Math.min(radius, edge));
        material.opacity = age > 0 ? Math.max(0, .6 * (1 - age / 2.1)) : 0;
      }
      const burst = bursts[0]; crownMaterial.opacity = burst && burst.age < .65 ? .55 * (1 - burst.age / .65) : 0;
      if (burst && burst.age < .65) {
        const attribute = crownGeometry.getAttribute('position'), t = burst.age, radial = .16 + t * .75 * burst.strength;
        crown.position.set(burst.x, water + .025, burst.z);
        for (let i = 0; i <= segments; i++) {
          const a = i / segments * Math.PI * 2, tip = Math.sin(Math.PI * Math.min(1, t / .65)) * (.22 + .23 * random(i + burst.seed)) * burst.strength;
          for (let j = 0; j < 3; j++) {
            const r = radial + j * .08;
            attribute.setXYZ(i * 3 + j, Math.cos(a) * r, j === 1 ? tip : 0, Math.sin(a) * r);
          }
        }
        attribute.needsUpdate = true;
      }
    },
    snapshot: () => ({ total, active: bursts.length, droplets: drops.count, crownVisible: crownMaterial.opacity > 0 }),
    dispose() {
      if (disposed) return; disposed = true; bursts.length = 0;
      dropGeometry.dispose(); dropMaterial.dispose(); ringGeometry.dispose(); crownGeometry.dispose(); crownMaterial.dispose();
      rings.forEach(mesh => mesh.material.dispose()); drops.dispose(); group.removeFromParent(); group.clear();
    },
  };
}
