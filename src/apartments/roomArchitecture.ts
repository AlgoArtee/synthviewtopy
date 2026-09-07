import * as THREE from 'three';

export const ROOM_WINDOWS = [-5.25, -1.85, 1.55] as const;
const WINDOW_RADIUS = 1.08;
const WINDOW_BASE = 1.15;
const WINDOW_SPRING = 3.57;

function archPath<T extends THREE.Path>(path: T): T {
  path.moveTo(-WINDOW_RADIUS, WINDOW_BASE);
  path.lineTo(WINDOW_RADIUS, WINDOW_BASE);
  path.lineTo(WINDOW_RADIUS, WINDOW_SPRING);
  path.absarc(0, WINDOW_SPRING, WINDOW_RADIUS, 0, Math.PI, false);
  path.lineTo(-WINDOW_RADIUS, WINDOW_BASE);
  return path;
}

/** Actual apertures through a thick wall; each window shares the same outdoor world. */
export function createArchedNorthWall(material: THREE.Material) {
  const outline = new THREE.Shape();
  outline.moveTo(-8.15, 0); outline.lineTo(8.15, 0); outline.lineTo(8.15, 5.62); outline.lineTo(-8.15, 5.62); outline.closePath();
  for (const center of ROOM_WINDOWS) {
    const hole = new THREE.Path();
    hole.moveTo(center - WINDOW_RADIUS, WINDOW_BASE);
    hole.lineTo(center - WINDOW_RADIUS, WINDOW_SPRING);
    hole.absarc(center, WINDOW_SPRING, WINDOW_RADIUS, Math.PI, 0, true);
    hole.lineTo(center + WINDOW_RADIUS, WINDOW_BASE);
    hole.closePath();
    outline.holes.push(hole);
  }
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(outline, {depth: .28, bevelEnabled: false, curveSegments: 40}), material);
  wall.name = 'Lux Umbrarum / masonry with three open arches';
  wall.position.z = -6.1;
  wall.castShadow = wall.receiveShadow = true;
  return wall;
}

export function createWindowGlass(x: number, material: THREE.Material) {
  const geometry = new THREE.ShapeGeometry(archPath(new THREE.Shape()), 40);
  const uv = geometry.getAttribute('uv');
  const position = geometry.getAttribute('position');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (position.getX(i) + WINDOW_RADIUS) / (WINDOW_RADIUS * 2), (position.getY(i) - WINDOW_BASE) / (WINDOW_SPRING + WINDOW_RADIUS - WINDOW_BASE));
  const glass = new THREE.Mesh(geometry, material);
  glass.position.set(x, 0, -5.86);
  glass.name = 'Lux Umbrarum / clear leaded glass';
  glass.castShadow = false;
  return glass;
}

/** Cloth narrows at the tie-back and fans out into irregular hanging folds. */
export function createPleatedCurtains(windowX: number, velvet: THREE.Material, cord: THREE.Material) {
  const group = new THREE.Group();
  group.name = 'Hand-sewn velvet curtains with gathered folds';
  for (const side of [-1, 1]) {
    const columns = 32; const rows = 64;
    const positions: number[] = []; const uvs: number[] = []; const indices: number[] = [];
    for (let iy = 0; iy <= rows; iy++) {
      const v = iy / rows;
      const y = .67 + v * 4.18;
      const gather = Math.exp(-(((y - 2.04) / .48) ** 2));
      const width = .73 - .42 * gather;
      for (let ix = 0; ix <= columns; ix++) {
        const u = ix / columns;
        const pleat = Math.cos(u * Math.PI * 10 + .1 * Math.sin(v * 10));
        const x = windowX + side * (1.29 + .13 * gather + (u - .5) * width);
        const z = -5.48 + pleat * (.058 - .033 * gather) + .045 * Math.sin(v * Math.PI);
        const hem = .024 * Math.cos(u * 30) * (1 - v) ** 10;
        positions.push(x, y + hem, z);
        uvs.push(u * .73, v * 4.18);
        if (ix < columns && iy < rows) {
          const a = iy * (columns + 1) + ix; const b = a + columns + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const panel = new THREE.Mesh(geometry, velvet);
    panel.castShadow = panel.receiveShadow = true;
    group.add(panel);
    const center = windowX + side * 1.42;
    const points = [new THREE.Vector3(center - .19, 2.075, -5.49), new THREE.Vector3(center - .12, 2.025, -5.34), new THREE.Vector3(center + .12, 2.025, -5.34), new THREE.Vector3(center + .19, 2.075, -5.49)];
    const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, .012, 6, false), cord);
    group.add(rope);
    // Suspension rings sit at the top of each pleat instead of attaching to empty space.
    for (let i = 0; i < 7; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.037, .008, 6, 12), cord);
      ring.position.set(windowX + side * (1.29 + (i / 6 - .5) * .73), 4.87, -5.43);
      ring.rotation.y = Math.PI / 2;
      group.add(ring);
    }
  }
  return group;
}
