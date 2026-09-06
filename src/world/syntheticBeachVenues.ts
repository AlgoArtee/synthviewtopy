import * as THREE from 'three';

export type BeachVenueHotspot = {
  id: string;
  name: string;
  position: THREE.Vector3;
  radius: number;
  actions: { id: string; label: string }[];
};

export type BeachVenueResult = { message: string; kind?: 'cocktail' | 'door' | 'lights' | 'music'; cocktail?: string };

type Placement = { position: THREE.Vector3; scale: THREE.Vector3; rotation: number };

/** Batches all fixed box architecture per venue/material into instanced draws. */
class VenueBatch {
  private buckets = new Map<THREE.Material, Placement[]>();
  add(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0) {
    const placements = this.buckets.get(material) ?? [];
    placements.push({ position: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(w, h, d), rotation });
    this.buckets.set(material, placements);
  }
  finish(parent: THREE.Object3D) {
    const geometry = new THREE.BoxGeometry();
    const dummy = new THREE.Object3D();
    for (const [material, placements] of this.buckets) {
      const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
      mesh.name = material.name;
      placements.forEach((p, i) => {
        dummy.position.copy(p.position);
        dummy.scale.copy(p.scale);
        dummy.rotation.set(0, p.rotation, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.computeBoundingSphere();
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
  }
}

function material(name: string, color: THREE.ColorRepresentation, metalness = 0.15, roughness = 0.6) {
  const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  m.name = name;
  return m;
}

function emissive(name: string, color: THREE.ColorRepresentation, intensity = 1) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
  m.name = name;
  return m;
}

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, surface: THREE.Material, x: number, y: number, z: number, name: string) {
  const object = new THREE.Mesh(geometry, surface);
  object.name = name;
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function sign(parent: THREE.Object3D, text: string, subtitle: string, color: string, x: number, y: number, z: number, width: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#092431';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = '500 78px system-ui, sans-serif';
  ctx.fillText(text, 512, 116);
  ctx.fillStyle = '#d5eef0';
  ctx.font = '26px ui-monospace, monospace';
  ctx.fillText(subtitle, 512, 184);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const surface = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide });
  const object = mesh(parent, new THREE.PlaneGeometry(width, width / 4), surface, x, y, z, text);
  object.rotation.y = Math.PI;
  return object;
}

/** Low, open ocean-facing architecture, with real walkable floors and collision. */
export function createSyntheticBeachVenues(sampleGround: (x: number, z: number) => number) {
  const group = new THREE.Group();
  group.name = 'Synthetic shore / beach club and beach house';
  const club = new THREE.Group();
  const bar = new THREE.Group();
  const house = new THREE.Group();
  club.name = 'SILVER FREQUENCY / beach club';
  bar.name = 'LIQUID ORBIT / cocktail bar';
  house.name = 'TIDAL HOUSE / private beach lounge';
  club.userData.beachHotspotId = 'club-dj';
  bar.userData.beachHotspotId = 'club-bar';
  house.userData.beachHotspotId = 'beach-house';
  group.add(club, bar, house);
  const clubY = sampleGround(-48, 60) + 0.2;
  const houseY = sampleGround(68, 72) + 0.2;
  const clubCanopyClearHeight = 8.4;
  const clubRoofTop = clubCanopyClearHeight + 0.6;
  const clubSignHeight = 4;
  const clubSignBottom = clubRoofTop + 0.3;
  const titanium = material('Pearl aluminium frames', '#d8e4e3', 0.55, 0.38);
  const graphite = material('Deep marine structure', '#102d3c', 0.5, 0.44);
  const deck = material('Silver teak deck', '#90a5a3', 0.2, 0.78);
  const walnut = material('Smoked wood slats', '#795d48', 0.08, 0.8);
  const upholstery = material('Ice-blue linen', '#8dc5cd', 0.05, 0.96);
  const cream = material('Warm woven linen', '#ede3cc', 0.02, 0.94);
  const cyan = emissive('Tidal cyan guidance', '#68e9f2', 1.2);
  const pink = emissive('Ultraviolet club lights', '#c875ec', 1.25);
  const amber = emissive('House warm lamps', '#ffd29c', 1.1);
  const green = material('Sea-grass leaves', '#628b77', 0, 0.88);
  const glass = new THREE.MeshStandardMaterial({ color: '#8ce4ea', transparent: true, opacity: 0.2, metalness: 0.2, roughness: 0.14, depthWrite: false, side: THREE.DoubleSide });
  glass.name = 'Blue safety glass';

  const clubBatch = new VenueBatch();
  clubBatch.add(graphite, -48, clubY - 0.45, 46, 39, 0.8, 28);
  clubBatch.add(deck, -48, clubY - 0.04, 46, 39, 0.08, 28);
  // The canopy stays above standing/jumping sightlines across the sea and city.
  // Keep fascia, soffit and corner posts tied to the same clear-height datum.
  clubBatch.add(titanium, -48, clubY + clubCanopyClearHeight + 0.3, 47, 40, 0.3, 25);
  clubBatch.add(graphite, -48, clubY + clubRoofTop - 0.08, 48.5, 34, 0.16, 18);
  clubBatch.add(cyan, -48, clubY + clubCanopyClearHeight + 0.12, 34.4, 39.5, 0.08, 0.08);
  clubBatch.add(pink, -48, clubY + 0.12, 32.2, 39, 0.045, 0.1);
  for (const x of [-66.6, -29.4]) {
    const postHeight = clubCanopyClearHeight + 0.2;
    for (const z of [35, 58]) clubBatch.add(titanium, x, clubY + postHeight / 2, z, 0.32, postHeight, 0.4);
    clubBatch.add(glass, x, clubY + 1.3, 48.5, 0.05, 2.5, 18);
    clubBatch.add(titanium, x, clubY + 2.58, 48.5, 0.12, 0.1, 18);
  }
  clubBatch.add(graphite, -48, clubY + 2.3, 58.5, 38, 4.6, 0.32);
  for (let x = -66; x < -29; x += 0.65) clubBatch.add(walnut, x, clubY + 2.3, 58.27, 0.18, 4.6, 0.18);
  for (let x = -65; x <= -30; x += 2) clubBatch.add(deck, x, clubY + clubCanopyClearHeight + 0.075, 46.5, 0.16, 0.15, 22);
  // Main ramp gives seamless access from the silver sand to the entire club deck.
  const rampStart = 23;
  const rampEnd = 32;
  const rampLow = sampleGround(-48, rampStart);
  const rampLength = Math.hypot(rampEnd - rampStart, clubY - rampLow);
  const ramp = mesh(club, new THREE.BoxGeometry(12, 0.12, rampLength), deck, -48, (clubY + rampLow) / 2 - 0.06, (rampStart + rampEnd) / 2, 'Accessible beach-club boardwalk');
  ramp.rotation.x = -Math.atan2(clubY - rampLow, rampEnd - rampStart);
  for (let x = -65.5; x <= -30; x += 1.5) clubBatch.add(graphite, x, clubY + 0.008, 46, 0.025, 0.015, 27);

  // Low lounge seating keeps ocean sightlines open.
  for (const [x, z] of [[-60, 38.5], [-36, 38.5]]) {
    clubBatch.add(graphite, x, clubY + 0.3, z, 7.2, 0.5, 2.3);
    clubBatch.add(upholstery, x, clubY + 0.66, z, 6.9, 0.28, 2.1);
    clubBatch.add(upholstery, x, clubY + 1.05, z + 0.88, 7.1, 0.9, 0.4);
    clubBatch.add(titanium, x, clubY + 0.55, z - 3, 3, 0.13, 1.8);
    clubBatch.add(graphite, x, clubY + 0.25, z - 3, 0.35, 0.5, 0.7);
  }
  // DJ console and two slim speakers: only light output changes during playback.
  clubBatch.add(graphite, -36, clubY + 0.9, 51.5, 6.7, 1.8, 2.2);
  clubBatch.add(titanium, -36, clubY + 1.83, 51.5, 7, 0.1, 2.5);
  clubBatch.add(pink, -36, clubY + 1, 50.38, 6.2, 0.09, 0.06);
  for (const x of [-42, -30]) {
    clubBatch.add(graphite, x, clubY + 1.9, 55.3, 1.2, 3.8, 1.05);
    for (const y of [1.15, 2.3, 3.05]) {
      const speaker = mesh(club, new THREE.CylinderGeometry(0.38, 0.38, 0.05, 18), titanium, x, clubY + y, 54.73, 'Speaker driver');
      speaker.rotation.x = Math.PI / 2;
    }
  }
  const recordMaterial = material('DJ turntables', '#172636', 0.68, 0.3);
  const turntables: THREE.Mesh[] = [];
  for (const x of [-38, -34]) {
    const record = mesh(club, new THREE.CylinderGeometry(0.69, 0.69, 0.055, 28), recordMaterial, x, clubY + 1.93, 51.5, 'Animated DJ platter');
    turntables.push(record);
    mesh(record, new THREE.BoxGeometry(0.53, 0.025, 0.055), cyan, 0.27, 0.035, 0, 'Platter tracking light');
  }
  for (let i = 0; i < 8; i++) clubBatch.add(cyan, -36.7 + i * 0.2, clubY + 1.94, 51.4, 0.06, 0.025, 0.65);
  const clubSign = sign(club, 'SILVER FREQUENCY', 'BEACH CLUB  /  SOUND FROM ORBIT', '#94f6ff', -48, clubY + clubSignBottom + clubSignHeight / 2, 34.35, 16);
  // The approach reads correctly from the ocean; the lounge never sees reversed
  // lettering. The complete panel sits above the roof instead of hanging below.
  (clubSign.material as THREE.MeshBasicMaterial).side = THREE.FrontSide;
  clubSign.userData.facesOcean = true;
  for (const x of [-53, -43]) clubBatch.add(titanium, x, clubY + clubRoofTop + 0.1, 34.48, 0.14, 0.4, 0.14);
  sign(club, 'DJ / TIDAL SESSIONS', 'CHILL HOUSE  /  ORIGINAL SIGNAL', '#e2b2ff', -36, clubY + 3.1, 58.03, 9);
  clubBatch.finish(club);

  const barBatch = new VenueBatch();
  barBatch.add(graphite, -55.5, clubY + 0.75, 50.7, 13.2, 1.5, 2.8);
  barBatch.add(titanium, -55.5, clubY + 1.55, 50.7, 13.6, 0.14, 3.1);
  barBatch.add(cyan, -55.5, clubY + 1.2, 49.25, 12.5, 0.075, 0.075);
  for (let x = -61; x < -49; x += 0.6) barBatch.add(walnut, x, clubY + 0.68, 49.26, 0.16, 1.2, 0.1);
  for (const y of [2.25, 3.3]) {
    barBatch.add(titanium, -55.5, clubY + y, 57.3, 13.6, 0.11, 1.1);
    barBatch.add(pink, -55.5, clubY + y - 0.1, 56.75, 13.4, 0.045, 0.065);
  }
  for (const x of [-60.5, -57.2, -53.9, -50.6]) {
    mesh(bar, new THREE.CylinderGeometry(0.6, 0.6, 0.16, 18), upholstery, x, clubY + 0.94, 47.8, 'Cocktail stool');
    mesh(bar, new THREE.CylinderGeometry(0.07, 0.12, 0.83, 8), titanium, x, clubY + 0.46, 47.8, 'Stool stem');
    mesh(bar, new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12), graphite, x, clubY + 0.055, 47.8, 'Stool foot');
  }
  const bottleColors = ['#76d9e7', '#d99aed', '#efc28b'].map((color, i) => material(`Botanical bottle ${i}`, color, 0.32, 0.27));
  for (let i = 0; i < 24; i++) {
    const x = -61.5 + (i % 12) * 1.05;
    const y = clubY + (i < 12 ? 2.25 : 3.3) + 0.34;
    const bottle = bottleColors[i % 3];
    barBatch.add(bottle, x, y, 57.25, 0.28, 0.5, 0.28);
    barBatch.add(titanium, x, y + 0.3, 57.25, 0.12, 0.15, 0.12);
  }
  sign(bar, 'LIQUID ORBIT', 'NEBULA FIZZ  /  SILVER TIDE  /  AURORA SPRITZ', '#a0edf3', -55.5, clubY + 4.2, 58.02, 12.5);
  barBatch.finish(bar);
  const servedDrink = new THREE.Group();
  servedDrink.name = 'Your freshly mixed cocktail';
  servedDrink.position.set(-55.5, clubY + 1.63, 49.8);
  servedDrink.visible = false;
  bar.add(servedDrink);
  const liquid = emissive('Freshly served cocktail', '#b982ea', 0.35);
  const cocktailGlass = new THREE.MeshPhysicalMaterial({ color: '#e5fdff', transparent: true, opacity: 0.36, roughness: 0.08, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  mesh(servedDrink, new THREE.CylinderGeometry(0.3, 0.22, 0.65, 20, 1, true), cocktailGlass, 0, 0.42, 0, 'Crystal highball glass');
  mesh(servedDrink, new THREE.CylinderGeometry(0.27, 0.21, 0.5, 20), liquid, 0, 0.38, 0, 'Cocktail');
  for (const [x, z] of [[-0.09, 0.03], [0.09, -0.04]]) mesh(servedDrink, new THREE.BoxGeometry(0.18, 0.14, 0.18), titanium, x, 0.62, z, 'Luminous ice');
  const straw = mesh(servedDrink, new THREE.CylinderGeometry(0.019, 0.019, 1, 6), pink, 0.19, 0.63, 0.03, 'Reusable titanium straw');
  straw.rotation.z = 0.18;
  const garnish = mesh(servedDrink, new THREE.TorusGeometry(0.17, 0.035, 5, 18), green, -0.21, 0.75, 0, 'Citrus garnish');
  garnish.rotation.y = Math.PI / 2;

  const houseBatch = new VenueBatch();
  houseBatch.add(graphite, 68, houseY - 0.44, 56, 31, 0.8, 32);
  houseBatch.add(deck, 68, houseY - 0.04, 56, 31, 0.08, 32);
  houseBatch.add(cream, 68, houseY + 4.5, 61, 27, 0.24, 23);
  houseBatch.add(graphite, 68, houseY + 4.69, 61.5, 25, 0.15, 21);
  houseBatch.add(amber, 68, houseY + 4.34, 49.5, 26, 0.06, 0.08);
  houseBatch.add(walnut, 68, houseY + 2.2, 71.2, 24, 4.4, 0.35);
  for (const x of [55.8, 80.2]) {
    houseBatch.add(titanium, x, houseY + 2.2, 61, 0.25, 4.4, 20.5);
    houseBatch.add(glass, x + (x < 68 ? 0.15 : -0.15), houseY + 2.15, 61, 0.045, 4.1, 19.8);
    for (const z of [51, 61, 71]) houseBatch.add(graphite, x, houseY + 2.2, z, 0.4, 4.4, 0.32);
  }
  for (const x of [60.75, 75.25]) {
    houseBatch.add(glass, x, houseY + 2.1, 51, 9.8, 4.2, 0.045);
    houseBatch.add(graphite, x, houseY + 4.22, 51, 9.9, 0.12, 0.12);
  }
  for (const x of [65.8, 70.2]) houseBatch.add(titanium, x, houseY + 2.15, 51, 0.22, 4.3, 0.25);
  houseBatch.add(titanium, 68, houseY + 4.26, 51, 4.5, 0.16, 0.28);
  houseBatch.add(walnut, 68, houseY + 0.4, 68.4, 9.6, 0.8, 3);
  houseBatch.add(cream, 68, houseY + 0.88, 68.2, 9.4, 0.26, 2.8);
  houseBatch.add(cream, 68, houseY + 1.5, 69.35, 9.4, 1.15, 0.4);
  for (const x of [63.5, 72.5]) houseBatch.add(upholstery, x, houseY + 1.18, 68.6, 0.85, 0.64, 1.5);
  houseBatch.add(walnut, 68, houseY + 0.57, 64, 4.5, 0.16, 2.2);
  houseBatch.add(graphite, 68, houseY + 0.27, 64, 0.6, 0.55, 1.2);
  houseBatch.add(cream, 68, houseY + 0.025, 64.7, 13, 0.045, 9);
  // Ocean-facing terrace loungers, a low table and warm canopy lights.
  for (const x of [58.5, 77.5]) {
    houseBatch.add(walnut, x, houseY + 0.25, 45.7, 2.8, 0.5, 4.6);
    houseBatch.add(cream, x, houseY + 0.63, 45.7, 2.7, 0.25, 4.5);
    houseBatch.add(upholstery, x, houseY + 0.96, 47.3, 2.65, 0.65, 0.8);
    houseBatch.add(graphite, x + (x < 68 ? 2.1 : -2.1), houseY + 0.62, 45.2, 1.1, 0.16, 1.5);
  }
  for (const x of [58.2, 77.8]) {
    houseBatch.add(graphite, x, houseY + 1.25, 68, 0.11, 2.5, 0.11);
    mesh(house, new THREE.CylinderGeometry(0.5, 0.65, 0.65, 18), amber, x, houseY + 2.6, 68, 'Warm lounge floor lamp');
  }
  for (let x = 54; x < 83; x += 0.85) houseBatch.add(graphite, x, houseY + 0.006, 56, 0.024, 0.012, 31);
  const houseRampStart = 31;
  const houseRampEnd = 40;
  const houseRampLow = sampleGround(68, houseRampStart);
  const houseRamp = mesh(house, new THREE.BoxGeometry(8, 0.12, Math.hypot(9, houseY - houseRampLow)), deck, 68, (houseY + houseRampLow) / 2 - 0.06, 35.5, 'Beach-house boardwalk ramp');
  houseRamp.rotation.x = -Math.atan2(houseY - houseRampLow, 9);
  sign(house, 'TIDAL HOUSE', 'SLOW LIVING  /  OPEN OCEAN', '#ffd9a9', 68, houseY + 3.65, 49.3, 9);
  houseBatch.finish(house);

  const doorHinge = new THREE.Group();
  doorHinge.name = 'Beach house / interactive front door';
  doorHinge.position.set(65.95, houseY, 51);
  house.add(doorHinge);
  const doorBatch = new VenueBatch();
  doorBatch.add(glass, 2.05, 2.1, 0, 4.1, 4.1, 0.065);
  for (const x of [0.08, 4.02]) doorBatch.add(titanium, x, 2.1, 0, 0.14, 4.2, 0.12);
  for (const y of [0.08, 4.14]) doorBatch.add(titanium, 2.05, y, 0, 4.1, 0.12, 0.12);
  doorBatch.add(amber, 3.65, 1.85, -0.16, 0.06, 0.8, 0.06);
  doorBatch.finish(doorHinge);

  // Sparse grass planters frame the venues without adding repeated draw calls.
  const landscaping = new THREE.Group();
  const plants = new VenueBatch();
  for (const [x, z, y] of [[-66, 33, clubY], [-30, 33, clubY], [54.2, 41.5, houseY], [81.8, 41.5, houseY]]) {
    plants.add(titanium, x, y + 0.4, z, 1.65, 0.8, 1.65);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.399;
      plants.add(green, x + Math.sin(a) * 0.5, y + 1.05 + (i % 3) * 0.12, z + Math.cos(a) * 0.5, 0.075, 1.3 + (i % 3) * 0.3, 0.12, a);
    }
  }
  plants.finish(landscaping);
  group.add(landscaping);

  const hotspots: BeachVenueHotspot[] = [
    { id: 'club-dj', name: 'Silver Frequency · Beach club', position: new THREE.Vector3(-36, clubY + 1, 48), radius: 9, actions: [{ id: 'toggle-music', label: 'Play / pause music' }, { id: 'track-tidal', label: 'Tidal · chill lounge' }, { id: 'track-orbital', label: 'Orbital · beach house' }] },
    { id: 'club-bar', name: 'Liquid Orbit · Cocktail bar', position: new THREE.Vector3(-55.5, clubY + 1, 47), radius: 18, actions: [{ id: 'serve-nebula', label: 'Nebula Fizz · violet citrus' }, { id: 'serve-silver', label: 'Silver Tide · sparkling mint' }, { id: 'serve-aurora', label: 'Aurora Spritz · peach & lime' }, { id: 'clear-drink', label: 'Clear glass' }, { id: 'toggle-music', label: 'Play / pause music' }] },
    { id: 'beach-house', name: 'Tidal House · Beach lounge', position: new THREE.Vector3(68, houseY + 1, 49), radius: 15, actions: [{ id: 'toggle-house-door', label: 'Open / close front door' }, { id: 'toggle-house-lights', label: 'Warm lights on / off' }, { id: 'toggle-music', label: 'Play / pause music' }] },
  ];
  let doorOpen = false;
  let doorAmount = 0;
  let houseLights = true;
  let cocktail: string | null = null;
  let lastTime: number | null = null;
  let musicPlaying = false;
  let disposed = false;
  const colliderPadding = 0.32;
  const inRect = (x: number, z: number, cx: number, cz: number, halfX: number, halfZ: number, padding = 0) => Math.abs(x - cx) <= halfX + padding && Math.abs(z - cz) <= halfZ + padding;

  return {
    group,
    hotspots,
    groundHeight(x: number, z: number): number | null {
      if (inRect(x, z, -48, 46, 19.5, 14)) return clubY;
      if (x >= -54 && x <= -42 && z >= rampStart && z <= rampEnd) return THREE.MathUtils.lerp(rampLow, clubY, (z - rampStart) / (rampEnd - rampStart));
      if (inRect(x, z, 68, 56, 15.5, 16)) return houseY;
      if (x >= 64 && x <= 72 && z >= houseRampStart && z <= houseRampEnd) return THREE.MathUtils.lerp(houseRampLow, houseY, (z - houseRampStart) / (houseRampEnd - houseRampStart));
      return null;
    },
    blocksMovement(x: number, z: number) {
      if (inRect(x, z, -48, 58.5, 19, 0.16, colliderPadding)) return true;
      if ([-66.6, -29.4].some((side) => inRect(x, z, side, 48.5, 0.16, 10, colliderPadding))) return true;
      if (inRect(x, z, -55.5, 50.7, 6.6, 1.4, colliderPadding)) return true;
      if (inRect(x, z, -36, 51.5, 3.35, 1.1, colliderPadding)) return true;
      if ([-60, -36].some((seat) => inRect(x, z, seat, 38.5, 3.6, 1.15, colliderPadding))) return true;
      if ([55.8, 80.2].some((side) => inRect(x, z, side, 61, 0.2, 10.3, colliderPadding))) return true;
      if (inRect(x, z, 68, 71.2, 12.3, 0.18, colliderPadding)) return true;
      if ([60.75, 75.25].some((side) => inRect(x, z, side, 51, 4.9, 0.12, colliderPadding))) return true;
      if (doorAmount < 0.86 && inRect(x, z, 68, 51, 2.05, 0.13, colliderPadding)) return true;
      if (doorAmount >= 0.86 && inRect(x, z, 65.95, 53.05, 0.13, 2.05, colliderPadding)) return true;
      if (inRect(x, z, 68, 68.4, 4.8, 1.5, colliderPadding)) return true;
      return false;
    },
    perform(actionId: string): BeachVenueResult {
      const drinks: Record<string, { name: string; color: string }> = {
        'serve-nebula': { name: 'Nebula Fizz', color: '#be8bfd' },
        'serve-silver': { name: 'Silver Tide', color: '#bdeee4' },
        'serve-aurora': { name: 'Aurora Spritz', color: '#ffb377' },
      };
      const drink = drinks[actionId];
      if (drink) {
        cocktail = drink.name;
        liquid.color.set(drink.color);
        liquid.emissive.set(drink.color);
        servedDrink.visible = true;
        return { kind: 'cocktail', cocktail: drink.name, message: `${drink.name} is freshly mixed and waiting on the bar.` };
      }
      if (actionId === 'clear-drink') {
        cocktail = null;
        servedDrink.visible = false;
        return { kind: 'cocktail', message: 'Glass cleared. Your next orbit awaits.' };
      }
      if (actionId === 'toggle-house-door') {
        doorOpen = !doorOpen;
        return { kind: 'door', message: doorOpen ? 'Tidal House is open. Step inside and make yourself comfortable.' : 'Tidal House front door closed.' };
      }
      if (actionId === 'toggle-house-lights') {
        houseLights = !houseLights;
        amber.emissiveIntensity = houseLights ? 1.1 : 0;
        amber.color.set(houseLights ? '#ffd29c' : '#5a5145');
        return { kind: 'lights', message: houseLights ? 'Warm house lighting is on.' : 'House lighting is off.' };
      }
      if (actionId === 'toggle-music' || actionId.startsWith('track-')) return { kind: 'music', message: 'Beach-club music selected.' };
      return { message: 'Choose an action at the club, cocktail bar or beach house.' };
    },
    update(time: number, isMusicPlaying = false) {
      if (disposed) return;
      const delta = lastTime === null ? 1 / 60 : Math.max(0, Math.min(0.1, time - lastTime));
      lastTime = time;
      musicPlaying = isMusicPlaying;
      doorAmount = THREE.MathUtils.damp(doorAmount, doorOpen ? 1 : 0, 7, delta);
      doorHinge.rotation.y = -Math.PI / 2 * doorAmount;
      const pulse = isMusicPlaying ? 1.3 + 0.65 * (0.5 + 0.5 * Math.sin(time * Math.PI * 86 / 30)) : 0.8;
      pink.emissiveIntensity = pulse;
      if (isMusicPlaying) for (const record of turntables) record.rotation.y += delta * 2.6;
      if (servedDrink.visible) liquid.emissiveIntensity = 0.28 + Math.sin(time * 2) * 0.07;
    },
    getSnapshot() {
      return { club: { name: 'Silver Frequency', position: [-48, clubY, 46], musicPlaying, canopyClearHeight: clubCanopyClearHeight, canopySoffitY: clubY + clubCanopyClearHeight, roofTopY: clubY + clubRoofTop, signBottomY: clubY + clubSignBottom, signTopY: clubY + clubSignBottom + clubSignHeight, signFacesOcean: true, signDoubleSided: false }, house: { name: 'Tidal House', position: [68, houseY, 60], doorOpen, doorProgress: Math.round(doorAmount * 100) / 100, lightsOn: houseLights }, cocktail, hotspotIds: hotspots.map((hotspot) => hotspot.id) };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>();
      const surfaces = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const surface of Array.isArray(object.material) ? object.material : [object.material]) {
          surfaces.add(surface);
          const mapped = surface as THREE.MeshBasicMaterial;
          if (mapped.map) textures.add(mapped.map);
        }
        if (object instanceof THREE.InstancedMesh) object.dispose();
      });
      geometries.forEach((geometry) => geometry.dispose());
      surfaces.forEach((surface) => surface.dispose());
      textures.forEach((texture) => texture.dispose());
      group.removeFromParent();
      group.clear();
    },
  };
}
