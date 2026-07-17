import { existsSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.ACADEMIC_ARBORETUM_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.ACADEMIC_ARBORETUM_OUTPUT ?? 'output/academic-arboretum';
await mkdir(outputDirectory, { recursive: true });

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

const EXPECTED_SPECIES_COUNTS = {
  'english-oak': 6,
  'european-beech': 8,
  'copper-beech': 5,
  linden: 6,
  'horse-chestnut': 6,
  'london-plane': 7,
  'english-yew': 4,
  'irish-yew': 4,
  holly: 3,
  'cedar-of-lebanon': 2,
  'scots-pine': 5,
  hawthorn: 4,
  rowan: 6,
  willow: 5,
  alder: 8,
};

const EXPECTED_ZONE_BY_SPECIES = {
  'english-oak': 'quadrangles',
  'horse-chestnut': 'quadrangles',
  linden: 'ceremonial-avenue',
  'london-plane': 'ceremonial-avenue',
  'copper-beech': 'libraries-administration',
  'english-yew': 'chapel-graveyard',
  'irish-yew': 'chapel-graveyard',
  holly: 'chapel-graveyard',
  hawthorn: 'chapel-graveyard',
  'cedar-of-lebanon': 'professors-garden',
  'scots-pine': 'observatory',
  willow: 'canal-damp-ground',
  alder: 'canal-damp-ground',
  'european-beech': 'boundary-secluded-walks',
  rowan: 'residential-courtyards',
};

const REQUIRED_CONTROLS = [
  'age',
  'canopy-density',
  'leaf-retention',
  'moss',
  'ivy',
  'deadwood',
  'lean',
  'wind-exposure',
];

const REQUIRED_AUTUMN_PALETTE = [
  'dark-green',
  'olive',
  'copper',
  'russet',
  'ochre',
  'grey-brown',
  'muted-gold',
];

const REQUIRED_WET_LEAF_CONTEXTS = [
  'walls',
  'drains',
  'benches',
  'exposed-roots',
  'cloisters',
  'bicycle-racks',
];

try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 });
  await page.waitForTimeout(1_500);

  const audit = await page.evaluate(({ expectedSpeciesCounts, expectedZoneBySpecies }) => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) throw new Error('Academic District missing');
    district.updateMatrixWorld(true);

    const token = (value) => String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const speciesKey = (value) => {
      const valueToken = token(value)
        .replace(/^ancient-/, '')
        .replace(/^common-/, '')
        .replace(/-tree$/, '');
      const aliases = {
        oak: 'english-oak',
        'english-oak': 'english-oak',
        'pedunculate-oak': 'english-oak',
        beech: 'european-beech',
        'european-beech': 'european-beech',
        'copper-beech': 'copper-beech',
        lime: 'linden',
        'lime-tree': 'linden',
        linden: 'linden',
        'horse-chestnut': 'horse-chestnut',
        'london-plane': 'london-plane',
        'plane-tree': 'london-plane',
        yew: 'english-yew',
        'english-yew': 'english-yew',
        'irish-yew': 'irish-yew',
        holly: 'holly',
        'cedar-of-lebanon': 'cedar-of-lebanon',
        'lebanon-cedar': 'cedar-of-lebanon',
        'scots-pine': 'scots-pine',
        'scotch-pine': 'scots-pine',
        hawthorn: 'hawthorn',
        rowan: 'rowan',
        'mountain-ash': 'rowan',
        willow: 'willow',
        alder: 'alder',
      };
      return aliases[valueToken] ?? valueToken;
    };

    const zoneKey = (value) => {
      const valueToken = token(value);
      if (valueToken.includes('quadrangle') || valueToken.includes('second-court')) return 'quadrangles';
      if (valueToken.includes('ceremonial') || valueToken.includes('avenue')) return 'ceremonial-avenue';
      if (valueToken.includes('librar') || valueToken.includes('administration')) return 'libraries-administration';
      if (valueToken.includes('chapel') || valueToken.includes('graveyard') || valueToken.includes('churchyard')) return 'chapel-graveyard';
      if (valueToken.includes('professor') && valueToken.includes('garden')) return 'professors-garden';
      if (valueToken.includes('observatory')) return 'observatory';
      if (valueToken.includes('canal') || valueToken.includes('damp') || valueToken.includes('pond')) return 'canal-damp-ground';
      if (valueToken.includes('boundary') || valueToken.includes('secluded')) return 'boundary-secluded-walks';
      if (valueToken.includes('residen') || valueToken.includes('marlowe')) return 'residential-courtyards';
      return valueToken;
    };

    const controlKey = (value) => {
      const valueToken = token(value);
      const aliases = {
        canopy: 'canopy-density',
        canopydensity: 'canopy-density',
        'canopy-density': 'canopy-density',
        retention: 'leaf-retention',
        leafretention: 'leaf-retention',
        'leaf-retention': 'leaf-retention',
        mossamount: 'moss',
        'moss-amount': 'moss',
        ivyamount: 'ivy',
        'ivy-amount': 'ivy',
        deadwoodamount: 'deadwood',
        'deadwood-amount': 'deadwood',
        windexposure: 'wind-exposure',
        'wind-exposure': 'wind-exposure',
      };
      return aliases[valueToken] ?? valueToken;
    };

    const leafContextKey = (value) => {
      const valueToken = token(value);
      if (valueToken.includes('wall')) return 'walls';
      if (valueToken.includes('drain')) return 'drains';
      if (valueToken.includes('bench')) return 'benches';
      if (valueToken.includes('root')) return 'exposed-roots';
      if (valueToken.includes('cloister')) return 'cloisters';
      if (valueToken.includes('bicycle') || valueToken.includes('bike')) return 'bicycle-racks';
      return valueToken;
    };

    const paletteCategoryKey = (value) => {
      const valueToken = token(value);
      if (valueToken === 'gray-brown') return 'grey-brown';
      if (valueToken.includes('dark') && valueToken.includes('green')) return 'dark-green';
      if (valueToken.includes('muted') && valueToken.includes('gold')) return 'muted-gold';
      return valueToken;
    };

    const rootCandidates = [];
    district.traverse((object) => {
      if (Array.isArray(object.userData.treeRecords)) rootCandidates.push(object);
    });
    const arboretum = rootCandidates.find((object) => /ACADEMIC_TREE|ARBORETUM/i.test(object.name))
      ?? rootCandidates[0]
      ?? null;
    const population = district.userData.academicTreePopulation ?? null;
    const records = Array.isArray(arboretum?.userData.treeRecords) ? arboretum.userData.treeRecords : [];
    world.setWeather('academic-autumn');
    world.advanceTime(600);

    const nestedValue = (record, names) => {
      const sources = [record, record?.parameters, record?.controls, record?.traits, record?.settings];
      for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const name of names) {
          if (source[name] !== undefined) return source[name];
        }
        const matchingKey = Object.keys(source).find((key) => names.some((name) => controlKey(key) === controlKey(name)));
        if (matchingKey) return source[matchingKey];
      }
      return undefined;
    };

    const normalizedRecords = records.map((record, index) => ({
      id: String(record.id ?? record.treeId ?? `tree-${index + 1}`),
      species: speciesKey(record.speciesId ?? record.species ?? record.commonName),
      rawSpecies: record.speciesId ?? record.species ?? record.commonName ?? null,
      zone: zoneKey(record.zoneId ?? record.zone ?? record.placementZone),
      rawZone: record.zoneId ?? record.zone ?? record.placementZone ?? null,
      variant: String(record.structuralVariant ?? record.variant ?? record.variantId ?? ''),
      age: nestedValue(record, ['age', 'ageYears', 'ageNormalized']),
      canopyDensity: nestedValue(record, ['canopyDensity', 'canopy-density']),
      leafRetention: nestedValue(record, ['leafRetention', 'leaf-retention']),
      moss: nestedValue(record, ['moss', 'mossAmount']),
      ivy: nestedValue(record, ['ivy', 'ivyAmount']),
      deadwood: nestedValue(record, ['deadwood', 'deadwoodAmount']),
      lean: nestedValue(record, ['lean', 'leanAmount']),
      windExposure: nestedValue(record, ['windExposure', 'wind-exposure']),
      windPhase: nestedValue(record, ['windPhase', 'phase']),
      canopyState: token(record.canopyState ?? record.autumnCanopy ?? ''),
      ancient: record.ancient === true || token(record.ageClass).includes('ancient'),
      defects: record.defects ?? record.ancientDefects ?? {},
      position: record.worldPoint ?? record.positionWorld ?? record.localPoint ?? record.position ?? record.location ?? null,
    }));

    const speciesCounts = {};
    const zonesBySpecies = {};
    normalizedRecords.forEach((record) => {
      speciesCounts[record.species] = (speciesCounts[record.species] ?? 0) + 1;
      zonesBySpecies[record.species] ??= [];
      if (!zonesBySpecies[record.species].includes(record.zone)) zonesBySpecies[record.species].push(record.zone);
    });
    Object.values(zonesBySpecies).forEach((zones) => zones.sort());

    const requiredZoneSpeciesSource = population?.requiredZoneSpecies ?? {};
    const declaredZonePairs = [];
    Object.entries(requiredZoneSpeciesSource).forEach(([key, value]) => {
      const keyAsSpecies = speciesKey(key);
      if (expectedZoneBySpecies[keyAsSpecies]) {
        const zones = Array.isArray(value) ? value : [value];
        zones.forEach((zone) => declaredZonePairs.push({ species: keyAsSpecies, zone: zoneKey(zone) }));
        return;
      }
      const speciesValues = Array.isArray(value) ? value : [value];
      speciesValues.forEach((species) => declaredZonePairs.push({ species: speciesKey(species), zone: zoneKey(key) }));
    });

    const controlsSource = population?.proceduralControls
      ?? population?.controls
      ?? arboretum?.userData.proceduralControls
      ?? [];
    const controlNames = Array.isArray(controlsSource)
      ? controlsSource.map((entry) => controlKey(typeof entry === 'string' ? entry : entry?.id ?? entry?.name))
      : Object.keys(controlsSource ?? {}).map(controlKey);
    const requiredControlAliases = {
      age: ['age', 'ageYears', 'ageNormalized'],
      'canopy-density': ['canopyDensity', 'canopy-density'],
      'leaf-retention': ['leafRetention', 'leaf-retention'],
      moss: ['moss', 'mossAmount'],
      ivy: ['ivy', 'ivyAmount'],
      deadwood: ['deadwood', 'deadwoodAmount'],
      lean: ['lean', 'leanAmount'],
      'wind-exposure': ['windExposure', 'wind-exposure'],
    };
    const recordControlCoverage = Object.fromEntries(Object.entries(requiredControlAliases).map(([name, aliases]) => [
      name,
      normalizedRecords.filter((record) => {
        if (name === 'canopy-density') return record.canopyDensity !== undefined;
        if (name === 'leaf-retention') return record.leafRetention !== undefined;
        if (name === 'wind-exposure') return record.windExposure !== undefined;
        return aliases.some((alias) => nestedValue(records[normalizedRecords.indexOf(record)], [alias]) !== undefined);
      }).length,
    ]));

    const variants = [...new Set(normalizedRecords.map((record) => record.variant).filter(Boolean))].sort();
    const variantsBySpecies = {};
    normalizedRecords.forEach((record) => {
      variantsBySpecies[record.species] ??= new Set();
      if (record.variant) variantsBySpecies[record.species].add(record.variant);
    });
    const variantCountsBySpecies = Object.fromEntries(
      Object.entries(variantsBySpecies).map(([species, values]) => [species, values.size]),
    );
    const structuralVariantsSource = population?.structuralVariants
      ?? arboretum?.userData.structuralVariants
      ?? variants;
    const structuralVariantCount = Array.isArray(structuralVariantsSource)
      ? structuralVariantsSource.length
      : typeof structuralVariantsSource === 'object' && structuralVariantsSource
        ? Object.keys(structuralVariantsSource).length
        : Number(structuralVariantsSource ?? 0);

    const numericOrState = (value) => {
      if (Number.isFinite(Number(value))) return Number(value);
      const valueToken = token(value);
      if (valueToken.includes('nearly-bare') || valueToken === 'bare') return 0.12;
      if (valueToken.includes('thin')) return 0.48;
      if (valueToken.includes('full')) return 0.9;
      return Number.NaN;
    };
    const canopyStates = { full: 0, thinning: 0, nearlyBare: 0 };
    normalizedRecords.forEach((record) => {
      const retention = Number.isFinite(numericOrState(record.leafRetention))
        ? numericOrState(record.leafRetention)
        : numericOrState(record.canopyState);
      if (!Number.isFinite(retention)) return;
      if (retention >= 0.72) canopyStates.full += 1;
      else if (retention <= 0.28) canopyStates.nearlyBare += 1;
      else canopyStates.thinning += 1;
    });

    const isPresent = (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'number') return value > 0;
      if (typeof value === 'boolean') return value;
      return Boolean(value);
    };
    const defectValue = (record, aliases) => {
      const sources = [record.defects, record, records[normalizedRecords.indexOf(record)]?.traits];
      for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const alias of aliases) {
          if (source[alias] !== undefined) return source[alias];
        }
        const matching = Object.keys(source).find((key) => aliases.some((alias) => token(key) === token(alias)));
        if (matching) return source[matching];
      }
      return undefined;
    };
    const ancientRecords = normalizedRecords.filter((record) => {
      const age = Number(record.age);
      return record.ancient || age >= (age > 1 ? 180 : 0.78);
    });
    const ancientDefectAliases = {
      irregularTrunk: ['irregularTrunk', 'trunkIrregularity'],
      asymmetricalCrown: ['asymmetricalCrown', 'asymmetricCrown', 'crownAsymmetry'],
      exposedRoots: ['exposedRoots', 'rootCount'],
      pruningScars: ['pruningScars', 'pruningScarCount'],
      hollowSections: ['hollowSections', 'hollows', 'hollowCount'],
      deadSecondaryBranches: ['deadSecondaryBranches', 'deadBranches'],
      layeredBark: ['layeredBark', 'barkLayers'],
    };
    const ancientDefectCoverage = Object.fromEntries(Object.entries(ancientDefectAliases).map(([name, aliases]) => [
      name,
      ancientRecords.filter((record) => isPresent(defectValue(record, aliases))).length,
    ]));
    const completeAncientSpecimens = ancientRecords.filter((record) => (
      Object.values(ancientDefectAliases).every((aliases) => isPresent(defectValue(record, aliases)))
      && Number(record.moss) > 0
      && Number(record.ivy) > 0
      && Number(record.deadwood) > 0
    )).map((record) => record.id);

    const sourceEntries = (source) => {
      if (Array.isArray(source)) return source.map((value, index) => [String(index), value]);
      if (source && typeof source === 'object') return Object.entries(source);
      return [];
    };
    const paletteSource = population?.autumnPalette
      ?? population?.autumn?.palette
      ?? arboretum?.userData.autumnPalette
      ?? [];
    const paletteEntries = sourceEntries(paletteSource).map(([key, value]) => ({
      category: paletteCategoryKey(typeof value === 'string' && !value.startsWith('#') ? value : value?.id ?? value?.name ?? value?.label ?? key),
      color: String(typeof value === 'string' && value.startsWith('#') ? value : value?.color ?? value?.hex ?? value?.value ?? ''),
    }));
    const paletteCategories = [...new Set(paletteEntries.map((entry) => entry.category).filter(Boolean))];
    const paletteColors = [...new Set(paletteEntries.map((entry) => entry.color.toLowerCase()).filter(Boolean))];

    const foliageColors = new Set();
    arboretum?.traverse((object) => {
      if (!object.isMesh) return;
      const role = token(`${object.name} ${object.userData.academicTreeComponent ?? ''} ${object.userData.componentRole ?? ''}`);
      if (!/(canopy|foliage|leaf)/.test(role) || /(fallen|litter)/.test(role)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material?.color) foliageColors.add(`#${material.color.getHexString()}`);
      });
      if (object.isInstancedMesh && object.instanceColor) {
        const color = materials.find((material) => material?.color)?.color.clone();
        if (!color) return;
        const sampleCount = Math.min(object.count, 512);
        for (let index = 0; index < sampleCount; index += 1) {
          object.getColorAt(index, color);
          foliageColors.add(`#${color.getHexString()}`);
        }
      }
      Object.entries(object.geometry?.attributes ?? {}).forEach(([name, attribute]) => {
        if (!name.toLowerCase().includes('color') || attribute.itemSize < 3) return;
        const sampleCount = Math.min(attribute.count, 512);
        const color = materials.find((material) => material?.color)?.color.clone();
        if (!color) return;
        for (let index = 0; index < sampleCount; index += 1) {
          color.setRGB(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
          foliageColors.add(`#${color.getHexString()}`);
        }
      });
    });

    const wetLeafSource = population?.wetLeafContexts
      ?? population?.autumn?.wetLeafContexts
      ?? arboretum?.userData.wetLeafContexts
      ?? [];
    const wetLeafEntries = sourceEntries(wetLeafSource).map(([key, value]) => ({
      context: leafContextKey(typeof value === 'string' ? value : value?.context ?? value?.id ?? value?.name ?? key),
      count: Number(typeof value === 'number' ? value : value?.count ?? value?.clusters ?? 1),
      wet: typeof value === 'object' && value ? value.wet !== false : true,
    }));
    const actualWetLeafContexts = [];
    arboretum?.traverse((object) => {
      const context = object.userData.wetLeafContext ?? object.userData.leafContext;
      if (context) actualWetLeafContexts.push(leafContextKey(context));
    });
    const wetLeafContexts = [...new Set([
      ...wetLeafEntries.filter((entry) => entry.count > 0 && entry.wet).map((entry) => entry.context),
      ...actualWetLeafContexts,
    ])];

    const lodSource = population?.lodTiers
      ?? population?.levels
      ?? arboretum?.userData.lodTiers
      ?? arboretum?.userData.levels
      ?? [];
    const metadataLodTiers = Array.isArray(lodSource)
      ? lodSource.map((entry) => token(typeof entry === 'string' ? entry : entry?.id ?? entry?.name ?? entry?.tier))
      : typeof lodSource === 'number'
        ? Array.from({ length: lodSource }, (_, index) => `level-${index}`)
        : Object.keys(lodSource ?? {}).map(token);
    const actualLodTiers = new Set();
    let lodObjects = 0;
    let maximumLodLevels = 0;
    arboretum?.traverse((object) => {
      if (object.isLOD) {
        lodObjects += 1;
        maximumLodLevels = Math.max(maximumLodLevels, object.levels?.length ?? 0);
      }
      const tier = object.userData.academicTreeLodTier
        ?? object.userData.academicTreeLodLevel
        ?? object.userData.lodTier
        ?? object.userData.lodLevel;
      if (tier !== undefined) actualLodTiers.add(token(tier));
    });

    let instancedMeshes = 0;
    let instancedInstances = 0;
    let treeInstancedMeshes = 0;
    let treeInstancedInstances = 0;
    const instancedRoles = new Set();
    arboretum?.traverse((object) => {
      if (!object.isInstancedMesh) return;
      instancedMeshes += 1;
      instancedInstances += Number(object.count ?? 0);
      const role = token(`${object.name} ${object.userData.academicTreeComponent ?? ''} ${object.userData.componentRole ?? ''}`);
      instancedRoles.add(role);
      if (!/(fallen|litter)/.test(role)) {
        treeInstancedMeshes += 1;
        treeInstancedInstances += Number(object.count ?? 0);
      }
    });

    const windProfilesSource = population?.windProfiles
      ?? arboretum?.userData.windProfiles
      ?? [];
    const windProfiles = sourceEntries(windProfilesSource).map(([key, value]) => ({
      species: speciesKey(value?.speciesId ?? value?.species ?? key),
      id: String(value?.id ?? value?.profile ?? key),
      amplitude: Number(value?.amplitude ?? value?.bendAmplitude ?? value?.sway ?? Number.NaN),
      frequency: Number(value?.frequency ?? value?.speed ?? Number.NaN),
    }));
    const windProfileSpecies = [...new Set(windProfiles.map((profile) => profile.species).filter(Boolean))];
    const populationPhases = Array.isArray(population?.windPhases)
      ? population.windPhases
      : Array.isArray(arboretum?.userData.windPhases)
        ? arboretum.userData.windPhases
        : [];
    const windPhases = normalizedRecords.map((record) => Number(record.windPhase)).filter(Number.isFinite);
    if (!windPhases.length) windPhases.push(...populationPhases.map(Number).filter(Number.isFinite));
    const uniqueWindPhases = new Set(windPhases.map((phase) => phase.toFixed(5))).size;

    const collisionGuides = [];
    let collisionBarrierCount = 0;
    arboretum?.traverse((object) => {
      const barriers = object.userData.navBarrierSegments ?? [];
      const isGuide = object.userData.academicTreeCollisionGuide === true
        || object.userData.treeCollisionGuide === true
        || /(ACADEMIC.*TREE|ARBORETUM).*COLLISION/i.test(object.name);
      if (isGuide || barriers.length) {
        collisionGuides.push(object.name || '(unnamed)');
        collisionBarrierCount += barriers.length;
      }
    });

    const autumnSnapshot = JSON.parse(window.render_game_to_text());

    const expectedSpecies = Object.keys(expectedSpeciesCounts);
    const unexpectedSpecies = Object.keys(speciesCounts).filter((species) => !expectedSpecies.includes(species));
    const missingSpecies = expectedSpecies.filter((species) => !speciesCounts[species]);
    const countMismatches = expectedSpecies.filter((species) => speciesCounts[species] !== expectedSpeciesCounts[species]);
    const zoneMismatches = normalizedRecords
      .filter((record) => expectedZoneBySpecies[record.species] && record.zone !== expectedZoneBySpecies[record.species])
      .map((record) => ({ id: record.id, species: record.species, zone: record.zone, expected: expectedZoneBySpecies[record.species] }));

    return {
      populationPresent: Boolean(population),
      arboretumPresent: Boolean(arboretum),
      arboretumName: arboretum?.name ?? null,
      academicTreeSystem: arboretum?.userData.academicTreeSystem === true,
      treeCountMetadata: Number(population?.treeCount ?? population?.count ?? 0),
      speciesCountMetadata: Number(population?.speciesCount ?? 0),
      recordCount: records.length,
      speciesCounts,
      missingSpecies,
      unexpectedSpecies,
      countMismatches,
      zonesBySpecies,
      zoneMismatches,
      declaredZonePairs,
      controlNames: [...new Set(controlNames)].sort(),
      recordControlCoverage,
      structuralVariantCount,
      variants,
      variantCountsBySpecies,
      canopyStates,
      ancientCount: ancientRecords.length,
      ancientIds: ancientRecords.map((record) => record.id),
      ancientDefectCoverage,
      completeAncientSpecimens,
      paletteEntries,
      paletteCategories,
      paletteColors,
      actualFoliageColors: [...foliageColors].sort(),
      wetLeafEntries,
      wetLeafContexts,
      metadataLodTiers,
      actualLodTiers: [...actualLodTiers].sort(),
      lodObjects,
      maximumLodLevels,
      instancedMeshes,
      instancedInstances,
      treeInstancedMeshes,
      treeInstancedInstances,
      instancedRoles: [...instancedRoles].sort(),
      windProfiles,
      windProfileSpecies,
      windPhaseCount: windPhases.length,
      uniqueWindPhases,
      collisionGuides,
      collisionBarrierCount,
      preciseBarrierCountMetadata: Number(population?.preciseBarrierCount ?? population?.collision?.preciseBarrierCount ?? 0),
      instancingMetadata: population?.instancing ?? null,
      autumnAtmosphere: autumnSnapshot.atmosphere,
      snapshotTreePopulation: autumnSnapshot.academicDistrict?.treePopulation ?? null,
    };
  }, { expectedSpeciesCounts: EXPECTED_SPECIES_COUNTS, expectedZoneBySpecies: EXPECTED_ZONE_BY_SPECIES });

  const exportPath = `${outputDirectory}/academic-arboretum-near-detail.glb`;
  const downloadPromise = page.waitForEvent('download', { timeout: 180_000 });
  await page.evaluate(() => window.labIsland.exportGLB('academic-arboretum-near-detail.glb'));
  const exportDownload = await downloadPromise;
  await exportDownload.saveAs(exportPath);
  const exportBytes = (await stat(exportPath)).size;

  const windAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    let arboretum = null;
    district?.traverse((object) => {
      if (!arboretum && Array.isArray(object.userData.treeRecords) && /ACADEMIC_TREE|ARBORETUM/i.test(object.name)) arboretum = object;
    });
    if (!arboretum) return { accessible: false, updated: false, transformSamples: 0, uniformSamples: 0 };

    const uniformValue = (candidate) => {
      const value = candidate?.value ?? candidate;
      return Number.isFinite(Number(value)) ? Number(value) : null;
    };
    const sample = () => {
      arboretum.updateMatrixWorld(true);
      const transforms = [];
      const uniforms = [];
      arboretum.traverse((object) => {
        const animate = String(object.userData.animate ?? '');
        const windRig = object.userData.academicTreeWind === true
          || object.userData.windAnimated === true
          || /academic.*tree.*wind|tree.*sway/i.test(animate);
        if (windRig) {
          transforms.push([
            object.uuid,
            ...object.position.toArray(),
            ...object.rotation.toArray().slice(0, 3),
            ...object.scale.toArray(),
          ]);
        }
        if (object.isInstancedMesh && windRig && object.count > 0) {
          const matrix = world.camera.matrixWorld.clone();
          [0, Math.max(0, object.count - 1)].forEach((index) => {
            object.getMatrixAt(index, matrix);
            transforms.push([`${object.uuid}:${index}`, ...matrix.elements]);
          });
        }
        const materials = object.isMesh
          ? (Array.isArray(object.material) ? object.material : [object.material])
          : [];
        materials.forEach((material) => {
          const candidates = [
            material?.uniforms?.uTime,
            material?.uniforms?.time,
            material?.userData?.windUniforms?.uTime,
            material?.userData?.windUniforms?.time,
            material?.userData?.windTimeUniform,
            material?.userData?.shaderUniforms?.uWindTime,
          ];
          candidates.forEach((candidate, index) => {
            const value = uniformValue(candidate);
            if (value !== null) uniforms.push([`${material.uuid}:${index}`, value]);
          });
        });
      });
      const rootTime = uniformValue(arboretum.userData.windTime);
      if (rootTime !== null) uniforms.push(['root.windTime', rootTime]);
      return { transforms, uniforms };
    };

    const before = sample();
    world.advanceTime(1_375);
    const after = sample();
    const transformUpdated = JSON.stringify(before.transforms) !== JSON.stringify(after.transforms);
    const uniformUpdated = JSON.stringify(before.uniforms) !== JSON.stringify(after.uniforms);
    return {
      accessible: before.transforms.length > 0 || before.uniforms.length > 0,
      updated: transformUpdated || uniformUpdated,
      transformUpdated,
      uniformUpdated,
      transformSamples: before.transforms.length,
      uniformSamples: before.uniforms.length,
      beforeUniforms: before.uniforms,
      afterUniforms: after.uniforms,
    };
  });

  const openingAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const boundary = district?.getObjectByName(
      'academic-libraries-theoretical-labs__ACADEMIC_ZONE__COLLEGIATE_GOTHIC_BOUNDARY',
    );
    const openings = boundary?.userData.openings ?? [];
    const controller = world.walkController;
    world.setTimeOfDay('noon');
    world.setMode('walk');
    controller.refreshNavigation();

    const walkLine = (start, end, spacing = 0.025) => {
      const startGround = controller.sampleGround(start.x, start.z);
      if (startGround === null) return { reached: false, blockedSteps: 0, groundGaps: 1, endDistance: null };
      world.camera.position.set(start.x, startGround + 0.162, start.z);
      controller.groundY = startGround;
      controller.grounded = true;
      controller.velocityY = 0;
      controller.isJumping = false;
      const delta = end.clone().sub(start);
      const steps = Math.max(2, Math.ceil(delta.length() / spacing));
      let blockedSteps = 0;
      let groundGaps = 0;
      for (let index = 1; index <= steps; index += 1) {
        const point = start.clone().addScaledVector(delta, index / steps);
        const ground = controller.sampleGround(point.x, point.z);
        if (ground === null) {
          groundGaps += 1;
          continue;
        }
        const before = world.camera.position.clone();
        controller.tryAxisMove(point.x - before.x, 0);
        controller.tryAxisMove(0, point.z - world.camera.position.z);
        if (Math.hypot(point.x - world.camera.position.x, point.z - world.camera.position.z) > 0.012) {
          blockedSteps += 1;
          break;
        }
        world.camera.position.y = ground + 0.162;
      }
      const endDistance = Math.hypot(end.x - world.camera.position.x, end.z - world.camera.position.z);
      return { reached: endDistance < 0.1, blockedSteps, groundGaps, endDistance };
    };

    return openings.map((opening) => {
      const center = district.localToWorld(world.camera.position.clone().fromArray(opening.localPoint));
      const direction = world.controls.target.clone().fromArray(opening.crossingDirection).setY(0).normalize();
      const extent = opening.id === 'main-avenue' ? 3.4 : 0.9;
      return {
        id: opening.id,
        result: walkLine(
          center.clone().addScaledVector(direction, -extent),
          center.clone().addScaledVector(direction, extent),
        ),
      };
    });
  });

  await page.evaluate(() => {
    document.querySelectorAll(
      '.atlas, .topbar, #scene-card, .scene-card, .layerbar, .compass, .interaction-hint, .walk-hud, .walk-interaction-menu, .toast-region',
    ).forEach((element) => { element.style.display = 'none'; });
    const world = window.labIsland;
    world.setWeather('academic-autumn');
    world.setGraphicsQuality('high');
    world.objectGroups.forEach((group, id) => {
      if (['academic-libraries-theoretical-labs', 'tundra-dome', 'desert-dome'].includes(id)) return;
      group.visible = false;
    });
  });

  const screenshots = [];
  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.camera.position.set(470, 38, 108);
    world.controls.target.set(382, 1.8, 0);
    world.camera.fov = 45;
    world.camera.updateProjectionMatrix();
    world.controls.update();
    world.advanceTime(700);
  });
  const overviewPath = `${outputDirectory}/autumn-arboretum-overview.png`;
  await page.screenshot({ path: overviewPath });
  screenshots.push(overviewPath);

  const stageSpeciesView = async (species, offset, targetHeight = 1.25) => page.evaluate((options) => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    let arboretum = null;
    district?.traverse((object) => {
      if (!arboretum && Array.isArray(object.userData.treeRecords) && /ACADEMIC_TREE|ARBORETUM/i.test(object.name)) arboretum = object;
    });
    if (!arboretum) return false;
    district.updateMatrixWorld(true);

    const token = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const speciesKey = (value) => {
      const key = token(value).replace(/^ancient-/, '').replace(/-tree$/, '');
      return ({ oak: 'english-oak', beech: 'european-beech', lime: 'linden', yew: 'english-yew', 'lebanon-cedar': 'cedar-of-lebanon', 'mountain-ash': 'rowan' })[key] ?? key;
    };
    const recordPoint = (record) => {
      const objectName = record.objectName ?? record.anchorName;
      const object = objectName ? arboretum.getObjectByName(objectName) : null;
      if (object) return object.getWorldPosition(world.camera.position.clone());
      const worldPoint = record.worldPoint ?? record.positionWorld;
      if (Array.isArray(worldPoint) && worldPoint.length >= 3) return world.camera.position.clone().fromArray(worldPoint);
      const raw = record.localPoint ?? record.position ?? record.location;
      if (!Array.isArray(raw)) return null;
      if (raw.length === 2) return district.localToWorld(world.camera.position.clone().set(raw[1], 0, raw[0]));
      if (raw.length >= 3) {
        const point = world.camera.position.clone().fromArray(raw);
        const space = token(record.coordinateSpace ?? record.space ?? 'district-local');
        if (space.includes('world') || Math.abs(point.x) > 200) return point;
        if (space.includes('arboretum')) return arboretum.localToWorld(point);
        return district.localToWorld(point);
      }
      return null;
    };

    const requested = new Set(options.species);
    const points = arboretum.userData.treeRecords
      .filter((record) => requested.has(speciesKey(record.speciesId ?? record.species ?? record.commonName)))
      .map(recordPoint)
      .filter(Boolean);
    if (!points.length) return false;
    const center = points.reduce((sum, point) => sum.add(point), world.camera.position.clone().set(0, 0, 0)).multiplyScalar(1 / points.length);
    const cameraPoint = center.clone().add(world.camera.position.clone().set(options.offset[0], 0, options.offset[1]));
    const ground = world.walkController.sampleGround(cameraPoint.x, cameraPoint.z) ?? district.position.y;
    world.setMode('walk');
    world.camera.position.set(cameraPoint.x, ground + 0.162, cameraPoint.z);
    world.camera.lookAt(center.x, center.y + options.targetHeight, center.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.advanceTime(600);
    return true;
  }, { species, offset, targetHeight });

  const capture = async (filename, species, offset, targetHeight) => {
    const staged = await stageSpeciesView(species, offset, targetHeight);
    if (!staged) return;
    const path = `${outputDirectory}/${filename}`;
    await page.screenshot({ path });
    screenshots.push(path);
  };

  await capture('ancient-oak-horse-chestnut-quadrangle.png', ['english-oak', 'horse-chestnut'], [-12, -13], 1.3);
  await capture('linden-plane-ceremonial-avenue.png', ['linden', 'london-plane'], [-18, -4], 1.25);
  await capture('copper-beech-library-frame.png', ['copper-beech'], [-11, -11], 1.2);
  await capture('chapel-yew-holly-hawthorn.png', ['english-yew', 'irish-yew', 'holly', 'hawthorn'], [-12, -10], 1.1);
  await capture('cedar-professors-garden.png', ['cedar-of-lebanon'], [-11, 10], 1.25);
  await capture('scots-pine-observatory.png', ['scots-pine'], [-10, 12], 1.3);
  await capture('willow-alder-canal-edge.png', ['willow', 'alder'], [-14, -12], 1.15);
  await capture('boundary-beech-secluded-walk.png', ['european-beech'], [-12, -12], 1.2);
  await capture('rowan-residential-courtyard.png', ['rowan'], [-12, -10], 1.0);

  const result = { audit, windAudit, openingAudit, exportBytes, screenshots, consoleErrors };
  await writeFile(`${outputDirectory}/audit.json`, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));

  const failures = [];
  if (!audit.populationPresent) failures.push('district.userData.academicTreePopulation is missing');
  if (!audit.arboretumPresent || !/ACADEMIC_TREE|ARBORETUM/i.test(audit.arboretumName ?? '')) failures.push(`arboretum root missing or misnamed: ${audit.arboretumName}`);
  if (!audit.academicTreeSystem) failures.push('arboretum root is not tagged academicTreeSystem=true');
  if (audit.treeCountMetadata !== 79 || audit.recordCount !== 79) failures.push(`tree count must be 79 in metadata and records: ${audit.treeCountMetadata}/${audit.recordCount}`);
  if (audit.speciesCountMetadata !== 15) failures.push(`speciesCount metadata must be 15: ${audit.speciesCountMetadata}`);
  if (audit.missingSpecies.length || audit.unexpectedSpecies.length || audit.countMismatches.length) {
    failures.push(`species population mismatch: ${JSON.stringify({ missing: audit.missingSpecies, unexpected: audit.unexpectedSpecies, counts: audit.speciesCounts })}`);
  }
  if (audit.zoneMismatches.length) failures.push(`required species placement zones failed: ${JSON.stringify(audit.zoneMismatches.slice(0, 12))}`);
  const missingDeclaredZones = Object.entries(EXPECTED_ZONE_BY_SPECIES).filter(([species, zone]) => (
    !audit.declaredZonePairs.some((pair) => pair.species === species && pair.zone === zone)
  ));
  if (missingDeclaredZones.length) failures.push(`requiredZoneSpecies metadata incomplete: ${JSON.stringify(missingDeclaredZones)}`);
  const missingControls = REQUIRED_CONTROLS.filter((control) => !audit.controlNames.includes(control));
  if (missingControls.length) failures.push(`procedural controls missing from metadata: ${missingControls.join(', ')}`);
  const incompleteControls = REQUIRED_CONTROLS.filter((control) => audit.recordControlCoverage[control] !== 79);
  if (incompleteControls.length) failures.push(`procedural controls missing on tree records: ${incompleteControls.map((control) => `${control}=${audit.recordControlCoverage[control]}`).join(', ')}`);
  if (audit.structuralVariantCount < 3 || audit.variants.length < 3) failures.push(`too few structural variants: ${audit.structuralVariantCount}/${audit.variants.length}`);
  const singleVariantSpecies = Object.entries(audit.speciesCounts)
    .filter(([, count]) => count > 1)
    .filter(([species]) => Number(audit.variantCountsBySpecies[species] ?? 0) < 2)
    .map(([species]) => species);
  if (singleVariantSpecies.length) failures.push(`repeated species use only one structural variant: ${singleVariantSpecies.join(', ')}`);
  if (!audit.canopyStates.full || !audit.canopyStates.thinning || !audit.canopyStates.nearlyBare) failures.push(`autumn canopy retention mix incomplete: ${JSON.stringify(audit.canopyStates)}`);
  if (audit.ancientCount < 3 || !audit.completeAncientSpecimens.length || Object.values(audit.ancientDefectCoverage).some((count) => count < 1)) {
    failures.push(`ancient-tree defect controls incomplete: ${JSON.stringify({ count: audit.ancientCount, coverage: audit.ancientDefectCoverage, complete: audit.completeAncientSpecimens })}`);
  }
  const missingPaletteCategories = REQUIRED_AUTUMN_PALETTE.filter((category) => !audit.paletteCategories.includes(category));
  if (audit.paletteColors.length !== 7 || missingPaletteCategories.length) failures.push(`autumn palette must contain the seven requested named colors: ${JSON.stringify(audit.paletteEntries)}`);
  if (audit.actualFoliageColors.length < 7) failures.push(`fewer than seven foliage colors are present in live tree meshes: ${audit.actualFoliageColors.length}`);
  const missingLeafContexts = REQUIRED_WET_LEAF_CONTEXTS.filter((context) => !audit.wetLeafContexts.includes(context));
  if (missingLeafContexts.length) failures.push(`wet fallen-leaf contexts missing: ${missingLeafContexts.join(', ')}`);
  if (audit.metadataLodTiers.length !== 3 || Math.max(audit.maximumLodLevels, audit.actualLodTiers.length) < 3) {
    failures.push(`three metadata and live LOD tiers required: ${JSON.stringify({ metadata: audit.metadataLodTiers, actual: audit.actualLodTiers, maximumLevels: audit.maximumLodLevels })}`);
  }
  if (audit.treeInstancedMeshes < 1 || audit.treeInstancedInstances < 79) failures.push(`tree structures are not instanced: ${audit.treeInstancedMeshes} meshes / ${audit.treeInstancedInstances} instances`);
  const missingWindSpecies = Object.keys(EXPECTED_SPECIES_COUNTS).filter((species) => !audit.windProfileSpecies.includes(species));
  if (missingWindSpecies.length) failures.push(`species-specific wind profiles missing: ${missingWindSpecies.join(', ')}`);
  if (audit.windPhaseCount !== 79 || audit.uniqueWindPhases < 15) failures.push(`wind phases are incomplete or synchronous: ${audit.windPhaseCount} records / ${audit.uniqueWindPhases} unique`);
  if (windAudit.accessible && !windAudit.updated) failures.push('accessible CPU/shader wind state did not advance');
  if (!audit.collisionGuides.length || audit.collisionBarrierCount < 79 || audit.preciseBarrierCountMetadata < 79) failures.push(`tree collision guide incomplete: ${audit.collisionGuides.length} guides / ${audit.collisionBarrierCount} live barriers / ${audit.preciseBarrierCountMetadata} metadata barriers`);
  if (openingAudit.length !== 4 || openingAudit.some((opening) => !opening.result.reached || opening.result.blockedSteps || opening.result.groundGaps)) {
    failures.push(`Academic boundary opening traversal failed: ${JSON.stringify(openingAudit)}`);
  }
  if (audit.autumnAtmosphere?.weather !== 'academic-autumn' || audit.autumnAtmosphere?.season !== 'autumn') failures.push(`Academic autumn state failed: ${JSON.stringify(audit.autumnAtmosphere)}`);
  if (exportBytes < 1_000_000) failures.push(`near-detail GLB export is unexpectedly small: ${exportBytes} bytes`);
  if (screenshots.length < 8) failures.push(`too few focused autumn screenshots were staged: ${screenshots.length}`);
  if (consoleErrors.length) failures.push(`browser console/page errors: ${consoleErrors.join(' | ')}`);
  if (failures.length) throw new Error(`Academic arboretum smoke failed:\n- ${failures.join('\n- ')}`);
} finally {
  await browser.close();
}
