import * as THREE from 'three';

export interface AcademicTexturePair {
  readonly albedo: THREE.CanvasTexture;
  readonly height: THREE.CanvasTexture;
}

const texturePairs = new Map<string, AcademicTexturePair>();

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makeTexture(canvas: HTMLCanvasElement, name: string, repeat: readonly [number, number], albedo: boolean) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = name;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 8;
  texture.colorSpace = albedo ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return texture;
}

function createPair(
  key: string,
  size: number,
  repeat: readonly [number, number],
  draw: (
    albedo: CanvasRenderingContext2D,
    height: CanvasRenderingContext2D,
    random: () => number,
    size: number,
  ) => void,
) {
  const cached = texturePairs.get(key);
  if (cached) return cached;
  const albedoCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  albedoCanvas.width = albedoCanvas.height = size;
  heightCanvas.width = heightCanvas.height = size;
  const albedoContext = albedoCanvas.getContext('2d');
  const heightContext = heightCanvas.getContext('2d');
  if (!albedoContext || !heightContext) throw new Error(`Unable to create ${key} academic texture`);
  draw(albedoContext, heightContext, seededRandom(key.length * 0x9e3779b1 + size), size);
  const pair = {
    albedo: makeTexture(albedoCanvas, `${key}-albedo`, repeat, true),
    height: makeTexture(heightCanvas, `${key}-height`, repeat, false),
  };
  texturePairs.set(key, pair);
  return pair;
}

function drawFinePits(
  albedo: CanvasRenderingContext2D,
  height: CanvasRenderingContext2D,
  random: () => number,
  size: number,
  count: number,
) {
  for (let index = 0; index < count; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 0.4 + random() * 1.8;
    albedo.fillStyle = random() > 0.82 ? 'rgba(202, 194, 170, 0.2)' : 'rgba(20, 24, 21, 0.17)';
    albedo.beginPath();
    albedo.arc(x, y, radius, 0, Math.PI * 2);
    albedo.fill();
    height.fillStyle = `rgba(24, 24, 24, ${0.12 + random() * 0.28})`;
    height.beginPath();
    height.arc(x, y, radius * 0.72, 0, Math.PI * 2);
    height.fill();
  }
}

export function getAcademicAshlarTextures(variant: 'medieval' | 'repair' = 'medieval') {
  return createPair(`academic-${variant}-ashlar`, 512, [5, 5], (albedo, height, random, size) => {
    albedo.fillStyle = variant === 'repair' ? '#5e5d56' : '#4d504a';
    height.fillStyle = '#171717';
    albedo.fillRect(0, 0, size, size);
    height.fillRect(0, 0, size, size);
    const courses = 13;
    const courseHeight = size / courses;
    const blockWidth = size / 4.3;
    for (let row = 0; row < courses; row += 1) {
      const offset = row % 2 ? -blockWidth * 0.5 : 0;
      for (let column = -1; column < 6; column += 1) {
        const x = offset + column * blockWidth + 2.2;
        const y = row * courseHeight + 2.1;
        const warmth = Math.floor(random() * (variant === 'repair' ? 24 : 30));
        const base = variant === 'repair' ? 125 : 103;
        const red = base + warmth;
        const green = base - 3 + Math.floor(warmth * 0.72);
        const blue = base - 12 + Math.floor(warmth * 0.46);
        const gradient = albedo.createLinearGradient(x, y, x, y + courseHeight - 4);
        gradient.addColorStop(0, `rgb(${red + 7}, ${green + 7}, ${blue + 5})`);
        gradient.addColorStop(1, `rgb(${red - 8}, ${green - 8}, ${blue - 7})`);
        albedo.fillStyle = gradient;
        albedo.fillRect(x, y, blockWidth - 4.2, courseHeight - 4.1);
        albedo.fillStyle = 'rgba(16, 19, 17, 0.16)';
        albedo.fillRect(x, y + courseHeight - 7, blockWidth - 4.2, 2.2);
        height.fillStyle = `rgb(${variant === 'repair' ? 198 : 182}, ${variant === 'repair' ? 198 : 182}, ${variant === 'repair' ? 198 : 182})`;
        height.fillRect(x, y, blockWidth - 4.2, courseHeight - 4.1);
      }
    }
    albedo.globalAlpha = variant === 'repair' ? 0.07 : 0.15;
    for (let streak = 0; streak < 26; streak += 1) {
      const x = random() * size;
      const streakGradient = albedo.createLinearGradient(x, 0, x + 5, size);
      streakGradient.addColorStop(0, '#101715');
      streakGradient.addColorStop(0.7, '#27352b');
      streakGradient.addColorStop(1, 'rgba(38, 55, 39, 0)');
      albedo.fillStyle = streakGradient;
      albedo.fillRect(x, 0, 1.5 + random() * 5, size * (0.25 + random() * 0.65));
    }
    albedo.globalAlpha = 1;
    drawFinePits(albedo, height, random, size, 900);
  });
}

export function getAcademicBrickTextures() {
  return createPair('academic-aged-umber-brick', 512, [8, 6], (albedo, height, random, size) => {
    albedo.fillStyle = '#312b28';
    height.fillStyle = '#1a1a1a';
    albedo.fillRect(0, 0, size, size);
    height.fillRect(0, 0, size, size);
    const courses = 22;
    const courseHeight = size / courses;
    const brickWidth = size / 7;
    for (let row = 0; row < courses; row += 1) {
      const offset = row % 2 ? -brickWidth * 0.5 : 0;
      for (let column = -1; column < 9; column += 1) {
        const x = offset + column * brickWidth + 1.8;
        const y = row * courseHeight + 1.7;
        const variation = Math.floor(random() * 34);
        const soot = random() > 0.91 ? -28 : 0;
        const red = 88 + variation + soot;
        const green = 49 + Math.floor(variation * 0.48) + soot;
        const blue = 36 + Math.floor(variation * 0.3) + soot;
        albedo.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        albedo.fillRect(x, y, brickWidth - 3.6, courseHeight - 3.4);
        albedo.fillStyle = 'rgba(12, 10, 9, 0.18)';
        albedo.fillRect(x, y + courseHeight - 5.5, brickWidth - 3.6, 2);
        height.fillStyle = `rgb(${174 + Math.floor(random() * 42)}, ${174 + Math.floor(random() * 42)}, ${174 + Math.floor(random() * 42)})`;
        height.fillRect(x, y, brickWidth - 3.6, courseHeight - 3.4);
      }
    }
    albedo.globalAlpha = 0.065;
    for (let stain = 0; stain < 16; stain += 1) {
      const x = random() * size;
      const y = random() * size * 0.72;
      const width = 3 + random() * 13;
      const length = 55 + random() * 180;
      const streak = albedo.createLinearGradient(x, y, x + random() * 3, y + length);
      const color = random() > 0.72 ? '225, 212, 181' : '9, 15, 14';
      streak.addColorStop(0, `rgba(${color}, 0)`);
      streak.addColorStop(0.22, `rgba(${color}, 0.8)`);
      streak.addColorStop(1, `rgba(${color}, 0)`);
      albedo.fillStyle = streak;
      albedo.fillRect(x, y, width, length);
    }
    albedo.globalAlpha = 1;
    drawFinePits(albedo, height, random, size, 520);
  });
}

export function getAcademicSlateTextures() {
  return createPair('academic-aged-slate', 512, [5, 7], (albedo, height, random, size) => {
    albedo.fillStyle = '#11181b';
    height.fillStyle = '#191919';
    albedo.fillRect(0, 0, size, size);
    height.fillRect(0, 0, size, size);
    const rows = 18;
    const rowHeight = size / rows;
    const tileWidth = size / 7;
    for (let row = 0; row < rows; row += 1) {
      const offset = row % 2 ? -tileWidth * 0.5 : 0;
      for (let column = -1; column < 9; column += 1) {
        const x = offset + column * tileWidth + 1.5;
        const y = row * rowHeight + 1.5;
        const tone = 35 + Math.floor(random() * 28);
        albedo.fillStyle = `rgb(${tone - 5}, ${tone + 2}, ${tone + 7})`;
        albedo.fillRect(x, y, tileWidth - 3, rowHeight - 2.8);
        albedo.fillStyle = 'rgba(0, 0, 0, 0.28)';
        albedo.fillRect(x, y + rowHeight - 5, tileWidth - 3, 2.5);
        height.fillStyle = `rgb(${156 + Math.floor(random() * 60)}, ${156 + Math.floor(random() * 60)}, ${156 + Math.floor(random() * 60)})`;
        height.fillRect(x, y, tileWidth - 3, rowHeight - 2.8);
      }
    }
    albedo.globalAlpha = 0.24;
    for (let lichen = 0; lichen < 110; lichen += 1) {
      albedo.fillStyle = random() > 0.45 ? '#718064' : '#9a8d67';
      albedo.beginPath();
      albedo.arc(random() * size, random() * size, 0.7 + random() * 3.2, 0, Math.PI * 2);
      albedo.fill();
    }
    albedo.globalAlpha = 1;
  });
}

export function getAcademicOakTextures() {
  return createPair('academic-aged-oak', 384, [3, 5], (albedo, height, random, size) => {
    albedo.fillStyle = '#3d2419';
    height.fillStyle = '#8e8e8e';
    albedo.fillRect(0, 0, size, size);
    height.fillRect(0, 0, size, size);
    for (let grain = 0; grain < 180; grain += 1) {
      const x = random() * size;
      const width = 0.5 + random() * 2.4;
      albedo.strokeStyle = random() > 0.5 ? 'rgba(116, 73, 44, 0.38)' : 'rgba(18, 10, 7, 0.32)';
      height.strokeStyle = random() > 0.5 ? 'rgba(220, 220, 220, 0.2)' : 'rgba(35, 35, 35, 0.2)';
      albedo.lineWidth = height.lineWidth = width;
      albedo.beginPath();
      height.beginPath();
      albedo.moveTo(x, 0);
      height.moveTo(x, 0);
      for (let y = 0; y <= size; y += 32) {
        const wave = Math.sin(y * 0.045 + grain) * (2 + random() * 3);
        albedo.lineTo(x + wave, y);
        height.lineTo(x + wave, y);
      }
      albedo.stroke();
      height.stroke();
    }
  });
}

export function getAcademicLeafPathTextures() {
  return createPair('academic-leaf-strewn-earth-path', 512, [1, 1], (albedo, height, random, size) => {
    albedo.fillStyle = '#514638';
    height.fillStyle = '#777';
    albedo.fillRect(0, 0, size, size);
    height.fillRect(0, 0, size, size);
    for (let grain = 0; grain < 5200; grain += 1) {
      const tone = 50 + Math.floor(random() * 76);
      const radius = 0.35 + random() * 1.8;
      const x = random() * size;
      const y = random() * size;
      albedo.fillStyle = `rgba(${tone + 20}, ${tone + 10}, ${tone}, ${0.18 + random() * 0.38})`;
      albedo.beginPath();
      albedo.arc(x, y, radius, 0, Math.PI * 2);
      albedo.fill();
      height.fillStyle = `rgba(${90 + tone}, ${90 + tone}, ${90 + tone}, 0.35)`;
      height.fillRect(x, y, radius, radius);
    }
    const leafColors = ['#7e3824', '#9f5428', '#b47a32', '#59402b', '#6c2e24'];
    for (let leaf = 0; leaf < 180; leaf += 1) {
      const x = random() * size;
      const y = random() * size;
      const radiusX = 2.1 + random() * 4.5;
      const radiusY = 0.8 + random() * 2.2;
      const rotation = random() * Math.PI;
      albedo.fillStyle = leafColors[Math.floor(random() * leafColors.length)];
      albedo.beginPath();
      albedo.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
      albedo.fill();
      height.fillStyle = '#dadada';
      height.beginPath();
      height.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
      height.fill();
    }
  });
}

/** Put metre-scaled UVs directly on each lightweight path box so every path can
 * share the same albedo/height textures without per-path GPU texture clones. */
export function tileAcademicPathGeometry(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const uvs = geometry.getAttribute('uv');
  if (!positions || !normals || !uvs) return geometry;
  const tileWorldUnits = 0.55;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const nx = Math.abs(normals.getX(index));
    const ny = Math.abs(normals.getY(index));
    const nz = Math.abs(normals.getZ(index));
    if (ny >= nx && ny >= nz) {
      uvs.setXY(index, x / tileWorldUnits, z / tileWorldUnits);
    } else if (nx >= nz) {
      uvs.setXY(index, z / tileWorldUnits, y / tileWorldUnits);
    } else {
      uvs.setXY(index, x / tileWorldUnits, y / tileWorldUnits);
    }
  }
  uvs.needsUpdate = true;
  geometry.userData.academicPathTileMetres = 5.5;
  return geometry;
}
