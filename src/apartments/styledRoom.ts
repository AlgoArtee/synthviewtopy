import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createRoomMaterials, enableWorldSpaceUV } from './roomMaterials';
import { createArchedNorthWall, createWindowGlass, createPleatedCurtains, ROOM_WINDOWS } from './roomArchitecture';
import { createAcademicOutlook, ACADEMIC_OUTLOOK_METADATA } from './academicOutlook';
import { createWritingDesk, createDeskChair, createBankerLamp, createBath, createVanity, createToilet, createKitchenSink, createMug, createTeapot, type FurnitureMaterials } from './realisticFurniture';
import { createStyleSofa, createStyleChair, createStyleCoffeeTable, createStyleBed } from './diverseFurniture';
import { createAdvancedWorkstation } from './advancedWorkstation';
import { getRoomDesign } from './roomDesign';
import { createDesignSurfaces } from './designSurfaces';
import type { RoomDefinition } from './roomCatalog';
import type { LiminetteRoom } from './liminetteRoom';
import { fingerprintScene } from './sceneAudit';
import { createStyleInstallation } from './styleInstallation';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

/** Independent apartment scenes use the same north façade and exterior coordinates. */
export function createStyledRoom(definition: RoomDefinition): LiminetteRoom {
  const design = getRoomDesign(definition);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#79a9c1');
  scene.fog = new THREE.Fog('#98b8c5', 105, 360);
  const interior = new THREE.Group(); interior.name = `Interior / ${definition.id}`; scene.add(interior);
  const exterior = createAcademicOutlook(); scene.add(exterior);
  const pbr = createRoomMaterials();
  pbr.walnut.color.set(definition.palette.wood);
  pbr.darkWood.color.set(definition.palette.wood).multiplyScalar(.61);
  pbr.plaster.color.set(definition.palette.wall);
  pbr.velvet.color.set(definition.palette.upholstery);
  pbr.brass.color.set(definition.palette.metal);
  pbr.parquet.color.set(definition.palette.wood).lerp(new THREE.Color('#9e917f'), .55);
  [pbr.walnut, pbr.darkWood, pbr.oak, pbr.plaster, pbr.parquet].forEach(enableWorldSpaceUV);
  pbr.velvet.side = THREE.DoubleSide;
  const surfaces = createDesignSurfaces(design, definition);
  const ownMaterials: THREE.Material[] = [surfaces.wall, surfaces.floor, surfaces.rug];
  const ownTextures: THREE.Texture[] = [];
  const plain = (color: string, roughness = .65, metalness = 0) => {
    const material = new THREE.MeshStandardMaterial({color, roughness, metalness}); ownMaterials.push(material); return material;
  };
  const accent = plain(definition.palette.accent, .45);
  const iron = plain('#202628', .46, .7);
  const paper = plain('#ddd1b1', .92);
  const ceiling = plain(new THREE.Color(surfaces.wallColor).lerp(new THREE.Color('#e1dac9'), .55).getStyle(), .9);
  const luminous = new THREE.MeshStandardMaterial({color: '#fff3d5', emissive: '#ffe2a6', emissiveIntensity: 1.35}); ownMaterials.push(luminous);
  const furniture: FurnitureMaterials = {walnut: pbr.walnut, darkWood: pbr.darkWood, brass: pbr.brass, iron, upholstery: pbr.velvet, leather: pbr.leather, linen: pbr.linen, teal: pbr.velvet, burgundy: accent, ceramic: pbr.ceramic, paper, black: iron, luminous};
  const colliders: THREE.Box3[] = [];
  const batches = new Map<string, {geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[]}>();
  const transform = new THREE.Object3D();
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const roundedGeometry = new RoundedBoxGeometry(1, 1, 1, 2, .07);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20);
  const sphereGeometry = new THREE.SphereGeometry(1, 20, 12);
  const geometries = new Set<THREE.BufferGeometry>([boxGeometry, roundedGeometry, cylinderGeometry, sphereGeometry]);
  function put(geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, scale = v(1, 1, 1), rotation = new THREE.Euler()) {
    geometries.add(geometry);
    const key = `${geometry.uuid}/${material.uuid}`;
    if (!batches.has(key)) batches.set(key, {geometry, material, matrices: []});
    transform.position.copy(position); transform.rotation.copy(rotation); transform.scale.copy(scale); transform.updateMatrix();
    batches.get(key)!.matrices.push(transform.matrix.clone());
  }
  function box(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0, rounded = false) {
    put(rounded ? roundedGeometry : boxGeometry, material, v(x, y, z), v(w, h, d), new THREE.Euler(0, rotation, 0));
  }
  function cylinder(material: THREE.Material, x: number, y: number, z: number, radius: number, height: number) {
    put(cylinderGeometry, material, v(x, y, z), v(radius, height, radius));
  }
  function orb(material: THREE.Material, x: number, y: number, z: number, radius: number) {
    put(sphereGeometry, material, v(x, y, z), v(radius, radius, radius));
  }
  function tube(material: THREE.Material, points: THREE.Vector3[], radius = .018, closed = false) {
    put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(24, points.length * 6), radius, 7, closed), material, v(0, 0, 0));
  }
  function collider(x: number, z: number, w: number, d: number, height = 2) {
    colliders.push(new THREE.Box3(v(x - w / 2, 0, z - d / 2), v(x + w / 2, height, z + d / 2)));
  }
  function furnish(group: THREE.Group, x: number, y: number, z: number, rotation = 0) {
    group.position.set(x, y, z); group.rotation.y = rotation; interior.add(group); return group;
  }
  let seed = definition.seed;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  // Fixed exterior envelope: every room looks through identical openings at the same campus.
  box(design.floorTreatment === 'parquet' ? pbr.parquet : surfaces.floor, 0, -.09, 0, 16.3, .18, 12.3);
  interior.add(createArchedNorthWall(surfaces.wall));
  for (const x of [-8.07, 8.07]) box(surfaces.wall, x, 2.8, 0, .18, 5.6, 12.3);
  box(surfaces.wall, 0, 2.8, 6.07, 16.3, 5.6, .18);
  box(ceiling, 0, 5.55, 0, 16.3, .15, 12.3);
  for (const side of [-1, 1]) {
    if (['panels','wallpaper'].includes(design.wallTreatment)) for (let n = 0; n < 10; n++) {
      const z = -5.35 + n * 1.13;
      box(pbr.walnut, side * 7.94, .73, z, .1, 1.35, 1.08);
      box(pbr.darkWood, side * 7.87, .72, z, .045, 1.09, .88);
    }
    if (['slats','fluted'].includes(design.wallTreatment)) for (let n=0;n<55;n++) {
      box(design.wallTreatment==='fluted'?accent:pbr.walnut, side*7.94, 2.8, -5.8+n*.215, .065, 5.2, .075);
    }
    const trims = ['panels','wallpaper','fluted'].includes(design.wallTreatment) ? [.13,1.44,4.96,5.11] : [.13,5.17];
    for (const y of trims) {
      box(pbr.walnut, side * 7.88, y, 0, .2, .11, 12);
      box(pbr.walnut, 0, y, side * 5.89, 16, .11, .22);
    }
  }
  if (design.ceilingTreatment==='beams'||design.ceilingTreatment==='coffers'||design.ceilingTreatment==='lattice') {
    const lattice = design.ceilingTreatment==='lattice';
    for (let i=0;i<(lattice?9:5);i++) box(pbr.walnut,-6.3+i*(lattice?1.575:3.15),5.36,0,lattice?.07:.18,lattice?.08:.24,12);
    if (design.ceilingTreatment!=='beams') for(let i=0;i<5;i++) box(pbr.walnut,0,5.36,-4.8+i*2.4,16,.16,.13);
  } else if(design.ceilingTreatment==='pipes') {
    for(let n=0;n<5;n++) tube(n%2?iron:pbr.brass,[v(-7.7,5.29,-4.5+n*.5),v(7.7,5.29,-4.5+n*.5)],.045+n*.008);
    for(let n=0;n<6;n++)box(iron,-6+n*2.4,5.18,-3.5,.035,.17,2.7);
  } else if(design.ceilingTreatment==='orbits') {
    for(const [x,z,r] of [[-3.4,.2,2.45],[3.7,-3.1,1.85]]) {
      put(new THREE.CylinderGeometry(r,r,.055,64),ceiling,v(x,5.24,z));
      put(new THREE.TorusGeometry(r,.028,8,80),luminous,v(x,5.2,z),v(1,1,1),new THREE.Euler(PI/2,0,0));
    }
  } else {
    for(const x of [-7.6,7.6])box(luminous,x,5.31,0,.035,.035,11.6);
    for(const z of [-5.5,5.5])box(luminous,0,5.31,z,15.2,.035,.035);
  }
  const glass = new THREE.MeshPhysicalMaterial({color: '#d2e3de', transparent: true, opacity: .07, roughness: .12, metalness: .04, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: .3}); ownMaterials.push(glass);
  for (const x of ROOM_WINDOWS) {
    interior.add(createWindowGlass(x, glass));
    if(design.curtainTreatment==='screen') {
      // Raised blinds reveal the same complete arched aperture and courtyard.
      for(let n=0;n<10;n++)box(design.furniture==='space'?ceiling:pbr.oak,x,4.84+n*.037,-5.59,2.18,.032,.055);
      for(const dx of[-.8,.8])tube(pbr.linen,[v(x+dx,4.77,-5.55),v(x+dx,5.2,-5.55)],.007);
    } else interior.add(createPleatedCurtains(x, design.curtainTreatment==='linen'?pbr.linen:pbr.velvet, pbr.brass));
    box(pbr.walnut, x, 1.135, -5.78, 2.36, .14, .42);
    for (const dx of [-1.105, 1.105]) box(pbr.walnut, x + dx, 2.36, -5.78, .11, 2.44, .16);
    tube(pbr.walnut, Array.from({length: 49}, (_, i) => { const a = i / 48 * PI; return v(x + Math.cos(a) * 1.105, 3.57 + Math.sin(a) * 1.105, -5.78); }), .065);
    box(pbr.brass, x, 2.9, -5.69, .034, 3.42, .033);
    for (const dx of [-.54, .54]) box(pbr.brass, x + dx, 2.75, -5.69, .023, 3.05, .03);
    for (const y of [2.04, 2.86, 3.57]) box(pbr.brass, x, y, -5.69, 2.13, .027, .03);
  }

  // Twelve actual floor plans alternate alcove orientation, library wall and seating arrangement.
  const plan = definition.layout % 12;
  const leftBed = plan === 3 || plan === 7 || plan === 11;
  const eastBed = !leftBed && plan % 3 === 1;
  const bedX = leftBed ? -5.65 : 5.85;
  const bedZ = -3.55 + (plan % 3) * .16;
  const bedRotation = leftBed ? PI / 2 : eastBed ? -PI / 2 : 0;
  furnish(createStyleBed(design.furniture, furniture), bedX, 0, bedZ, bedRotation);
  collider(bedX, bedZ, bedRotation ? 3.1 : 2.38, bedRotation ? 2.38 : 3.1);
  // East-facing beds with a privacy screen need a south-side three-quarter
  // viewpoint; the straight foot-of-bed sightline passes through the slats.
  const bedEnd = eastBed && plan % 2 === 0
    ? v(bedX - .75, 1.65, bedZ + 2.3)
    : v(bedX + Math.sin(bedRotation) * 2.55, 1.65, bedZ + Math.cos(bedRotation) * 2.55);
  const bedSideX = bedRotation ? bedX + 1.1 : bedX - 1.42;
  const bedSideZ = bedRotation ? bedZ + 1.45 : bedZ - .9;
  box(pbr.walnut, bedSideX, .42, bedSideZ, .65, .78, .63, 0, true);
  orb(luminous, bedSideX, 1.02, bedSideZ, .13);
  collider(bedSideX, bedSideZ, .68, .68, 1.1);
  // Freestanding slat / arch screens give the sleeping zone real spatial boundaries.
  const screenX = leftBed ? -3.78 : 4.08;
  if (plan % 2 === 0) {
    for (let i = 0; i < 9; i++) box(i % 3 ? pbr.walnut : accent, screenX, 1.36, -5.0 + i * .22, .055, 2.72, .045);
    box(pbr.walnut, screenX, 2.74, -4.12, .11, .12, 2.05);
    collider(screenX, -4.12, .2, 2.08, 2.85);
  }

  const deskX = leftBed ? -.35 : -1.35 + (plan % 3 - 1) * .35;
  const deskZ = -3.22 + Math.floor(plan / 4) * .12;
  furnish(createWritingDesk(furniture), deskX, 0, deskZ);
  collider(deskX, deskZ, 3.51, 1.2, .95);
  furnish(createDeskChair(furniture), deskX + .3, 0, deskZ + 1.26, PI);
  collider(deskX + .3, deskZ + 1.26, .72, .73, 1.4);
  furnish(createBankerLamp(furniture), deskX - 1.1, .914, deskZ);
  const workstation = furnish(createAdvancedWorkstation(), deskX + .28, .914, deskZ - .08);
  const projection = workstation.getObjectByName('Atlas volumetric model');
  furnish(createMug(furniture), deskX + 1.22, .914, deskZ + .18);
  for (let n = 0; n < 4; n++) box(paper, deskX - .62, .919 + n * .008, deskZ + .27, .4, .006, .3, n * .018);

  // Books retain covers, page blocks, raised spine bands and mixed-height groupings.
  const bookColors = ['#314b43', '#764139', '#63543a', '#304f61', '#74614e', definition.palette.accent].map(c => plain(c, .88));
  const libraryX = leftBed ? 7.5 : -7.5;
  const bays = leftBed ? [-.9, .5] : [-3.9, -1.55, .8];
  const shelfRows = design.libraryTreatment==='low'?3:design.libraryTreatment==='open'?4:6;
  const shelfHeight = .52 + (shelfRows-1)*.57;
  const shelfFrame = design.libraryTreatment==='steel'?iron:pbr.walnut;
  for (const z of bays) {
    const width = leftBed ? 1.32 : 2.24;
    if(design.libraryTreatment==='ornate'||design.libraryTreatment==='low') box(pbr.darkWood, libraryX, shelfHeight/2, z, .13, shelfHeight+.2, width);
    for (const dz of [-width / 2, width / 2]) box(shelfFrame, libraryX - Math.sign(libraryX) * .26, (shelfHeight+.25)/2, z + dz, design.libraryTreatment==='steel'?.08:.66, shelfHeight+.25, .07);
    for (let row = 0; row < shelfRows; row++) {
      const y = .3 + row * .57;
      box(shelfFrame, libraryX - Math.sign(libraryX) * .25, y, z, .7, .065, width);
      let offset = -width / 2 + .085;
      while (offset < width / 2 - .1) {
        if(design.libraryTreatment==='modular'&&offset>-.22&&offset<.25&&row%2===0){offset=.28;continue;}
        const w = .045 + random() * .075, h = .26 + random() * .24;
        const mat = bookColors[Math.floor(random() * bookColors.length)];
        const spineX = libraryX - Math.sign(libraryX) * .59;
        box(mat, spineX + Math.sign(libraryX) * .18, y + .035 + h / 2, z + offset, .37, h, w);
        for (const f of [.15, .83]) box(pbr.brass, spineX, y + .035 + h * f, z + offset, .014, .012, w * .93);
        if (random() > .67) box(paper, spineX - Math.sign(libraryX) * .005, y + .035 + h * .62, z + offset, .014, .035, w * .6);
        offset += w + .009 + (random() > .91 ? .09 : 0);
      }
    }
    box(shelfFrame, libraryX - Math.sign(libraryX) * .25, shelfHeight+.27, z, .82, .13, width + .18);
    collider(libraryX - Math.sign(libraryX) * .28, z, .89, width + .13, shelfHeight+.4);
    if(design.libraryTreatment==='low'||design.libraryTreatment==='open') {
      for(let n=0;n<3;n++) {
        const az=z+(n-1)*width*.27, ay=3.35+(n%2)*.24;
        box(pbr.walnut,libraryX,ay,az,.13,.72,.58);
        box(n%2?paper:accent,libraryX-Math.sign(libraryX)*.08,ay,az,.025,.61,.48);
        put(new THREE.TorusGeometry(.15,.011,6,32),pbr.brass,v(libraryX-Math.sign(libraryX)*.11,ay,az),v(1,1,1),new THREE.Euler(0,PI/2,0));
      }
    }
  }

  const sideSofa = plan % 3 === 2;
  const sofaX = sideSofa ? -5.87 : -3.3 + (plan % 2) * .45;
  const sofaZ = sideSofa ? .44 : 1.6 + (plan % 3) * .12;
  const sofaRotation = sideSofa ? -PI / 2 : 0;
  furnish(createStyleSofa(design.furniture, furniture), sofaX, 0, sofaZ, sofaRotation);
  collider(sofaX, sofaZ, sideSofa ? 1.35 : 3.1, sideSofa ? 3.1 : 1.35, 1.5);
  const tableX = sofaX - Math.sin(sofaRotation) * 1.45, tableZ = sofaZ - Math.cos(sofaRotation) * 1.45;
  furnish(createStyleCoffeeTable(design.furniture, furniture), tableX, 0, tableZ, sofaRotation);
  collider(tableX, tableZ, sideSofa ? .93 : 1.7, sideSofa ? 1.7 : .93, .7);
  const onTable = (x: number, z: number) => ({x:tableX+Math.cos(sofaRotation)*x+Math.sin(sofaRotation)*z, z:tableZ-Math.sin(sofaRotation)*x+Math.cos(sofaRotation)*z});
  const teapotPlace=onTable(-.3,0), mugPlace=onTable(.28,-.1), bookPlace=onTable(.42,.05);
  furnish(createTeapot(furniture),teapotPlace.x,.51,teapotPlace.z,sofaRotation);
  furnish(createMug(furniture),mugPlace.x,.51,mugPlace.z,sofaRotation);
  box(paper,bookPlace.x,.54,bookPlace.z,.4,.075,.32,sofaRotation-.1);
  const chairX = sideSofa ? -2.24 : -5.72, chairZ = sideSofa ? -.02 : -.23;
  furnish(createStyleChair(design.furniture, furniture), chairX, 0, chairZ, sideSofa ? PI / 2 : .4);
  collider(chairX, chairZ, 1.2, 1.2, 1.6);

  const rugX=sideSofa?-4.35:-3.65;
  if(design.rugPattern==='orbital'||design.rugPattern==='organic') put(new THREE.CylinderGeometry(1,1,.026,80),surfaces.rug,v(rugX,.018,.32),v(2.85,1,2.1));
  else box(surfaces.rug,rugX,.018,.32,design.furniture==='nordic'?4.8:5.55,.026,design.furniture==='nordic'?3.35:4.05);
  if(design.furniture==='bohemian')box(surfaces.rug,rugX+.35,.038,.75,3.5,.014,2.75,.18);
  if(design.furniture==='bohemian') {
    box(surfaces.rug,-3.1,3.73,5.885,2.65,1.38,.022);
    box(pbr.walnut,-3.1,4.46,5.83,2.9,.06,.06);
    for(let n=0;n<25;n++)tube(paper,[v(-4.38+n*.107,3.02,5.84),v(-4.38+n*.107,2.89,5.84)],.006);
  }
  if(design.furniture==='organic') {
    const foliage=plain(definition.palette.upholstery,.9);
    for(const x of[-5.75,-2.1]) {
      box(pbr.darkWood,x,3.81,5.81,1.3,1.63,.15);
      for(let n=0;n<32;n++) {
        const px=x+(random()-.5)*1.13,py=3.81+(random()-.5)*1.46;
        put(sphereGeometry,n%3?foliage:accent,v(px,py,5.65),v(.1+random()*.07,.055,.16),new THREE.Euler(.5,0,random()*PI));
      }
    }
  }
  if(design.wallTreatment==='lacquer') {
    for(let n=0;n<4;n++)box(n%2?accent:paper,-6.3+n*.75,4.32,5.86,.54,.62+(n%2)*.3,.035);
  }

  // Full kitchen keeps common utilities at the south edge and varies the cabinet rhythm.
  const kitchenStart = -5.8 + (plan % 3) * .22;
  const cabinetCount = 5 + plan % 2;
  for (let i = 0; i < cabinetCount; i++) {
    const x = kitchenStart + i * 1.06;
    box(pbr.velvet, x, .48, 5.43, 1.02, .94, .93, 0, true);
    box(pbr.walnut, x, .49, 4.946, .94, .79, .025);
    box(accent, x, .49, 4.925, .77, .64, .02);
    box(pbr.brass, x, .77, 4.9, .25, .025, .033);
    box(pbr.ceramic, x, .98, 5.4, 1.06, .085, 1.0);
    if (i !== 1) {
      box(pbr.walnut, x, 2.31, 5.68, 1.01, .89, .49, 0, true);
      box(accent, x, 2.3, 5.413, .88, .76, .025);
      box(pbr.brass, x + .31, 2.21, 5.387, .023, .18, .024);
    }
    collider(x, 5.42, 1.07, 1.05, 2.8);
  }
  const sinkX = kitchenStart + 3 * 1.06;
  furnish(createKitchenSink(furniture), sinkX, 1.21, 5.37);
  box(iron, kitchenStart + 1.06, 1.034, 5.36, .84, .04, .7);
  for (let i = 0; i < 4; i++) cylinder(pbr.brass, kitchenStart + 1.06 + (i % 2 - .5) * .41, 1.066, 5.36 + (Math.floor(i / 2) - .5) * .31, .12, .016);
  furnish(createTeapot(furniture), kitchenStart + 1.13, 1.071, 5.39);
  box(iron, kitchenStart + 1.06, 2.48, 5.5, 1.04, .32, .69, 0, true);
  box(iron, kitchenStart + 1.06, 3.39, 5.8, .4, 1.55, .3);
  box(pbr.ceramic, kitchenStart - 1.02, 1.18, 5.42, .84, 2.33, 1.0, 0, true);
  box(pbr.brass, kitchenStart - .77, 1.3, 4.886, .036, .62, .046);
  collider(kitchenStart - 1.02, 5.42, .92, 1.07, 2.4);

  // Enclosed washroom with a traversable doorway, mirror, bath and basin.
  box(pbr.plaster, 6.11, 2.37, 1.85, 3.79, 4.74, .17);
  collider(6.11, 1.85, 3.79, .25, 4.8);
  for (const [z, length] of [[2.27, .82], [5.18, 1.65]]) { box(pbr.plaster, 4.22, 2.37, z, .16, 4.74, length); collider(4.22, z, .24, length, 4.8); }
  box(pbr.walnut, 4.22, 3.17, 3.52, .23, .17, 1.84);
  for (const z of [2.64, 4.38]) box(pbr.walnut, 4.22, 1.57, z, .23, 3.14, .09);
  for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) box((x + z) % 2 ? pbr.ceramic : accent, 4.48 + x * .292, .023, 2.2 + z * .31, .285, .024, .303);
  furnish(createBath(furniture), 7.16, 0, 3.26); collider(7.16, 3.26, 1.28, 2.12, 1.1);
  furnish(createVanity(furniture), 5.45, 0, 5.48); collider(5.45, 5.48, 1.6, .96, 1.12);
  furnish(createToilet(furniture), 7.18, 0, 5.34); collider(7.18, 5.34, .78, 1.03, 1.3);
  const mirror = new Reflector(new THREE.CircleGeometry(.54, 64), {color: 0xbfc6c2, textureWidth: 512, textureHeight: 512, clipBias: .003, multisample: 2});
  mirror.position.set(5.45, 2.1, 5.76); mirror.rotation.y = PI; mirror.scale.y = 1.2; mirror.layers.set(1); mirror.camera.layers.enable(1); interior.add(mirror);
  put(new THREE.TorusGeometry(.565, .023, 8, 64), pbr.brass, v(5.45, 2.1, 5.73), v(1, 1.2, 1));
  orb(luminous, 4.78, 2.1, 5.69, .085); orb(luminous, 6.12, 2.1, 5.69, .085);

  // Each vocabulary changes the room's architectural centrepiece and wall installations.
  const installation = createStyleInstallation(definition, {wood: pbr.walnut, darkWood: pbr.darkWood, accent, metal: pbr.brass, glass, luminous, paper});
  interior.add(installation);
  const pedestalX = 2.72 + (definition.number % 7) * .045;
  cylinder(pbr.walnut, pedestalX, .54, -.2, .36, 1.06);
  cylinder(pbr.brass, pedestalX, 1.085, -.2, .37, .034);
  collider(pedestalX, -.2, .84, .84, 2.2);
  installation.userData.pedestal = [pedestalX, 1.105, -.2];
  const sculpture = installation.getObjectByName('desk sculpture');
  if (sculpture) { sculpture.position.set(pedestalX, 1.105, -.2); sculpture.scale.setScalar(.82); }
  // Small dining station in the broad circulation space before the washroom.
  cylinder(pbr.walnut, 1.5, .76, 4.01, .62, .09);
  cylinder(pbr.brass, 1.5, .38, 4.01, .047, .7);
  cylinder(pbr.darkWood, 1.5, .06, 4.01, .33, .08);
  collider(1.5, 4.01, 1.3, 1.3, .85);
  for (const x of [.55, 2.45]) {
    cylinder(pbr.velvet, x, .48, 4.01, .27, .1);
    for (const dz of [-.16, .16]) for (const dx of [-.16, .16]) cylinder(pbr.walnut, x + dx, .23, 4.01 + dz, .018, .45);
    collider(x, 4.01, .59, .6, .65);
  }
  furnish(createMug(furniture), 1.68, .81, 4.01);

  for (const {geometry, material, matrices} of batches.values()) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = mesh.receiveShadow = true; mesh.computeBoundingSphere(); interior.add(mesh);
  }
  const hemisphere = new THREE.HemisphereLight('#c4dce7', '#504034', .38); scene.add(hemisphere, new THREE.AmbientLight('#ede0cb', .08));
  const daylight = new THREE.DirectionalLight('#e1ecf0', 2.2); daylight.position.set(-12, 20, -36); daylight.target.position.set(-1, 0, 0); daylight.castShadow = true;
  daylight.shadow.mapSize.set(2048, 2048); Object.assign(daylight.shadow.camera, {left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 100}); daylight.shadow.normalBias = .025; scene.add(daylight, daylight.target);
  const overhead = new THREE.SpotLight('#ffe8c5', 55, 20, 1.15, .8, 2); overhead.position.set(-.5, 4.85, -1.3); overhead.target.position.set(-1.4, 0, .8); overhead.castShadow = true; overhead.shadow.mapSize.set(1024, 1024); overhead.shadow.normalBias = .025; scene.add(overhead, overhead.target);
  for (const [x, y, z, intensity, distance] of [[-1.3, 3.95, .5, 48, 20], [-2.8, 3.55, -5, 22, 16], [-5.8, 3.3, -3.8, 14, 16], [6.1, 3.45, 4.1, 26, 7], [-2.1, 3.28, 4.2, 30, 10]]) {
    const light = new THREE.PointLight('#ffe4bd', intensity, distance, 2); light.position.set(x, y, z); scene.add(light);
  }
  const audit = {interior: fingerprintScene(interior), exterior: fingerprintScene(exterior)};
  scene.userData.apartment = {id: definition.id, name: definition.name, location: 'Lux Umbrarum · Academic District', style: `${definition.style} × Dark Academia`, layout: definition.layout, seed: definition.seed, floorArea: 192, outlook: ACADEMIC_OUTLOOK_METADATA, design, workstation: workstation.userData.advancedWorkstation, audit};
  return {
    scene, ready: pbr.ready, spawn: v(2.73, 1.65, 2.56), lookAt: v(-2.4, 1.9, -3.25), colliders,
    bounds: {minX: -7.65, maxX: 7.65, minZ: -5.65, maxZ: 5.65},
    viewpoints: [
      {id: 'outlook', label: 'Lux Umbrarum outlook', position: v(-1.85, 1.65, -4.72), target: v(-3, -.8, -45)},
      {id: 'study', label: 'The study', position: v(deskX + 1.88, 1.65, deskZ + 1.82), target: v(deskX, 1.3, deskZ)},
      {id: 'library', label: 'The library', position: v(leftBed ? 5.5 : -5.1, 1.65, leftBed ? .35 : -1.8), target: v(libraryX, 1.85, leftBed ? 0 : -2.2)},
      {id: 'lounge', label: 'The lounge', position: v(sideSofa ? -.9 : -.5, 1.65, sideSofa ? 1.5 : -.25), target: v(sofaX, .94, sofaZ)},
      {id: 'sleep', label: 'Sleeping alcove', position: bedEnd, target: v(bedX, 1, bedZ)},
      {id: 'kitchen', label: 'The kitchen', position: v(-2.6, 1.65, 3.2), target: v(kitchenStart + 2.2, 1.4, 5.4)},
      {id: 'bathroom', label: 'Bath & wash', position: v(5.0, 1.65, 3.1), target: v(6.65, 1.2, 4.88)},
    ],
    update: elapsed => { if (sculpture && definition.motif === 'celestial') sculpture.rotation.y = elapsed * .055; if(projection)projection.rotation.y=elapsed*.28; },
    dispose: () => {
      mirror.dispose();
      const materialSet = new Set(ownMaterials); const textureSet = new Set(ownTextures);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) { geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materialSet.add(material); }
        if (object instanceof THREE.Light && object.shadow) object.shadow.dispose();
      });
      materialSet.forEach(material => { Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textureSet.add(value); }); material.dispose(); });
      geometries.forEach(geometry => geometry.dispose()); textureSet.forEach(texture => texture.dispose()); pbr.dispose(); scene.clear();
    },
  };
}
