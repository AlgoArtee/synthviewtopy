import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { applyCityTransitDistanceFade, cityTransitVisibility, CITY_TRANSIT_FADE_START, CITY_TRANSIT_FADE_END } from './osCityTransitDistance';

/** Clears the tripled mall, including its roof plant, from the balcony sightline. */
export const CITY_TRANSIT_ELEVATION_LIFT=34;

/** One through route for track and vehicles, receding into the north/south distance. */
export function createOsCityTransitRoute(): THREE.CatmullRomCurve3 {
  const route = new THREE.CatmullRomCurve3([
    [300,11,-330], [220,10,-230], [150,8,-140], [118,6,-90],
    [112,4,-40], [111,3,10], [114,2,65], [150,5,130],
    [220,8,230], [300,10,330],
  ].map(([x, y, z]) => new THREE.Vector3(x, y+CITY_TRANSIT_ELEVATION_LIFT, z)), false, 'centripetal');
  // Arc-length sampling preserves steady velocity and coupler spacing.
  route.arcLengthDivisions = 32768;
  route.updateArcLengths();
  return route;
}

export const CITY_TRANSIT_SPEED = 8.4;
export const CITY_TRANSIT_TRAINS = 4;
const CAR_SPACING = 5.8;

type Section = [z: number, width: number, height: number, center: number];

/** Aerodynamic trains are instanced by car style/material: only 15 draw calls for 12 cars. */
export function createOsCityTransit(): THREE.Group {
  const transit = new THREE.Group(); transit.name = 'City maglev · distant through line';
  const route = createOsCityTransitRoute(), length = route.getLength();
  const materials = [
    new THREE.MeshStandardMaterial({ color: '#c7d6df', metalness: .58, roughness: .31, emissive: '#62899e', emissiveIntensity: .70 }),
    new THREE.MeshStandardMaterial({ color: '#101f2e', metalness: .57, roughness: .29 }),
    new THREE.MeshStandardMaterial({ color: '#123e55', metalness: .52, roughness: .17, emissive: '#5babce', emissiveIntensity: .83 }),
    new THREE.MeshBasicMaterial({ color: '#81ecff', toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: '#f096cd', toneMapped: false }),
  ].map(material=>applyCityTransitDistanceFade(material));
  const geometries = new Set<THREE.BufferGeometry>();
  const carParts: THREE.InstancedMesh[][] = [];
  const headSections: Section[] = [
    [-2.42, .79, .53, .94], [-2.2, 1.00, .70, 1.02], [-1.3, 1.07, .76, 1.04],
    [.55, 1.07, .76, 1.04], [1.35, .99, .69, 1.01], [2.10, .80, .53, .89],
    [2.78, .46, .30, .70], [3.20, .10, .095, .56],
  ];
  const middleSections: Section[] = [[-2.46, .85, .60, 1.00], [-2.2, 1.04, .73, 1.04], [2.2, 1.04, .73, 1.04], [2.46, .85, .60, 1.00]];

  function loft(sections: Section[], fromAngle = 0, toAngle = Math.PI * 2, segments = 16, lift = 0) {
    const positions: number[] = [], indices: number[] = [];
    for (const [z, width, height, center] of sections) for (let i = 0; i <= segments; i++) {
      const angle = fromAngle + (toAngle - fromAngle) * i / segments;
      positions.push(Math.cos(angle) * (width + lift), center + Math.sin(angle) * (height + lift), z);
    }
    for (let r = 1; r < sections.length; r++) for (let i = 0; i < segments; i++) {
      const a = (r - 1) * (segments + 1) + i, b = a + segments + 1;
      indices.push(a, a + 1, b + 1, a, b + 1, b);
    }
    if (toAngle - fromAngle === Math.PI * 2) {
      // Hulls are watertight, including the small nose tip; glazing patches stay open.
      for (const end of [0, sections.length - 1]) {
        const [z, , , center] = sections[end], cap = positions.length / 3;
        positions.push(0, center, z);
        for (let i = 0; i < segments; i++) {
          const a = end * (segments + 1) + i;
          if (end === 0) indices.push(cap, a + 1, a); else indices.push(cap, a, a + 1);
        }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices); g.computeVertexNormals(); return g;
  }
  function block(w: number, h: number, d: number, x: number, y: number, z: number) {
    return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  }
  for (let style = 0; style < 3; style++) {
    const parts: THREE.BufferGeometry[][] = materials.map(() => []);
    const sections = style === 1 ? middleSections : headSections;
    parts[0].push(loft(sections));
    // Recessed magnetic running gear and a continuous smoked-glass upper ribbon.
    parts[1].push(block(1.44, .23, 3.9, 0, .30, -.18));
    const cabin = style === 1 ? middleSections.slice(1, 3) : headSections.slice(1, 5);
    parts[2].push(loft(cabin, .17, Math.PI - .17, 12, .017));
    if (style !== 1) parts[2].push(loft(headSections.slice(4, 7), .33, Math.PI - .33, 10, .012));
    // Thin roof spine and door divisions preserve scale without a rectangular roof cap.
    parts[0].push(block(.10, .052, 3.3, 0, 1.81, -.38));
    for (const side of [-1, 1]) {
      for (const z of [-1.72, -.65, .43]) parts[0].push(block(.043, .55, .042, side * 1.061, 1.14, z));
      parts[3].push(block(.040, .085, 3.66, side * 1.045, .76, -.23));
      parts[3].push(block(.075, .085, 3.95, side * .74, .27, -.18));
      if (style === 0) {
        const lamp = block(.36, .064, .058, side * .41, .735, 2.76); lamp.rotateY(side * -.28); parts[3].push(lamp);
      }
      if (style === 2) parts[4].push(block(.23, .065, .055, side * .42, .735, 2.75));
    }
    parts[1].push(block(1.19, .84, .19, 0, 1.0, -2.49));
    if (style === 1) parts[1].push(block(1.19, .84, .19, 0, 1.0, 2.49));
    const meshes: THREE.InstancedMesh[] = [];
    parts.forEach((items, materialIndex) => {
      if (!items.length) return;
      const compatible = items.map(item => { const non = item.index ? item.toNonIndexed() : item; if (non !== item) item.dispose(); non.deleteAttribute('uv'); return non; });
      const g = mergeGeometries(compatible, false)!; compatible.forEach(item => item.dispose());
      if (style === 2) g.rotateY(Math.PI);
      geometries.add(g);
      const object = new THREE.InstancedMesh(g, materials[materialIndex], CITY_TRANSIT_TRAINS);
      object.name = `Maglev · ${['tapered driving cab', 'articulated cabin', 'tapered trailing cab'][style]} · ${['alloy shell', 'magnetic running gear', 'panoramic glazing', 'cyan running lights', 'tail lights'][materialIndex]}`;
      object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      object.boundingSphere = new THREE.Sphere(new THREE.Vector3(205, 6+CITY_TRANSIT_ELEVATION_LIFT, 0), 350);
      transit.add(object); meshes.push(object);
    });
    carParts.push(meshes);
  }
  const positions = Array.from({ length: CITY_TRANSIT_TRAINS * 3 }, () => new THREE.Vector3());
  const tangents = positions.map(() => new THREE.Vector3());
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion(), euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const scale = new THREE.Vector3(1, 1, 1);
  let animationTime = 0, disposed = false;
  function pose(time: number) {
    animationTime = time;
    for (let train = 0; train < CITY_TRANSIT_TRAINS; train++) for (let car = 0; car < 3; car++) {
      const index = train * 3 + car;
      const t = THREE.MathUtils.euclideanModulo(.065 + train / CITY_TRANSIT_TRAINS + (time * CITY_TRANSIT_SPEED - car * CAR_SPACING) / length, 1);
      const p = positions[index].copy(route.getPointAt(t)), tangent = tangents[index].copy(route.getTangentAt(t));
      p.y += .35;
      // Each end is fully invisible before a car wraps to the opposite side.
      // Hide distant instances as well as fading their individual fragments.
      scale.setScalar(Math.abs(p.z+5)>CITY_TRANSIT_FADE_END+5?0:1);
      euler.set(-Math.asin(tangent.y), Math.atan2(tangent.x, tangent.z), 0, 'YXZ'); quaternion.setFromEuler(euler);
      matrix.compose(p, quaternion, scale);
      for (const part of carParts[car]) part.setMatrixAt(train, matrix);
    }
    carParts.flat().forEach(part => { part.instanceMatrix.needsUpdate = true; });
  }
  transit.userData.pose = pose;
  transit.userData.route = route;
  transit.userData.snapshot = () => ({
    trainCount: CITY_TRANSIT_TRAINS, trainCarCount: positions.length, speedMetersPerSecond: CITY_TRANSIT_SPEED,
    carSpacingMeters: CAR_SPACING, animationTime, routeClosed: false, routeLength: length,elevationLift:CITY_TRANSIT_ELEVATION_LIFT,
    distantFade:{start:CITY_TRANSIT_FADE_START,end:CITY_TRANSIT_FADE_END,axis:'abs(worldZ + 5)',resetOnlyBeyondFade:true},
    routeEndpoints:[route.getPointAt(0).toArray(),route.getPointAt(1).toArray()],
    trainVisibility:positions.map(p=>cityTransitVisibility(p.z)),
    routePoints: route.getSpacedPoints(48).map(p => p.toArray()),
    trainPositions: positions.map(p => p.toArray()), trainDirections: tangents.map(t => t.toArray()),
    vehicleStyle: 'tapered aerodynamic alloy shell, panoramic canopy, magnetic running gear',
    rendering: 'open through line; track and trains fade into distance, then reset invisibly at the opposite end',
    drawCalls: carParts.flat().length,
  });
  transit.userData.dispose = () => {
    if (disposed) return; disposed = true;
    carParts.flat().forEach(part => part.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  pose(0); return transit;
}
