import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outputDirectory = process.env.DISTRICT_BIOME_OUTPUT_DIRECTORY ?? 'output/district-biome-population';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('.mode[data-mode="plan"]', { state: 'attached', timeout: 90_000 }).catch(async (error) => {
  throw new Error(`${error.message}\nurl=${page.url()} title=${await page.title()} body=${(await page.locator('body').innerText()).slice(0, 500)} console=${consoleErrors.join(' | ')}`);
});
await page.waitForFunction(() => Boolean(window.labIsland), null, { timeout: 90_000 }).catch(async (error) => {
  throw new Error(`${error.message}\nurl=${page.url()} title=${await page.title()} console=${consoleErrors.join(' | ')}`);
});
await page.waitForTimeout(1_500);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  world.setDaylight(true);
  world.advanceTime(1_000);
  const textState = JSON.parse(window.render_game_to_text());
  const normalize = (angle) => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const districtResults = [];
  const ringIntervals = {};
  const infrastructure = {
    ringRoads: 0,
    radialRoadDiameters: 0,
    districtBoundaryOverlays: 0,
    localCampusRoads: 0,
  };
  world.scene.traverse((child) => {
    if (child.name.startsWith('District boundary ring road ')) infrastructure.ringRoads += 1;
    if (child.name.startsWith('Radial district boundary road ')) infrastructure.radialRoadDiameters += 1;
    if (child.userData.masterplanBoundary) infrastructure.districtBoundaryOverlays += 1;
    if (child.userData.localCampusRoad) infrastructure.localCampusRoads += 1;
  });
  for (const [id, group] of world.objectGroups.entries()) {
    const definition = world.definitions.get(id);
    if (!definition || definition.category === 'biome' || definition.category === 'editor') continue;
    const cell = group.userData.districtCell;
    const population = group.userData.population;
    const sectorAnchors = [];
    const semanticRoots = [];
    group.traverse((child) => {
      if (child.userData.sectorAnchor) {
        sectorAnchors.push({
          name: child.userData.semanticName ?? child.name,
          ...child.userData.sectorAnchor,
        });
      }
      if (child.parent === group && ['building', 'lab', 'equipment', 'landscape', 'prop'].includes(child.userData.featureRole)) {
        semanticRoots.push({ name: child.userData.semanticName ?? child.name, role: child.userData.featureRole });
      }
    });
    const boundary = group.getObjectByName(`${id}__ANNULAR_SECTOR_BOUNDARIES`);
    const containedAnchors = sectorAnchors.filter((anchor) => (
      anchor.radius >= cell.innerRadius - 0.001
      && anchor.radius <= cell.outerRadius + 0.001
      && anchor.normalizedRadial >= -0.001
      && anchor.normalizedRadial <= 1.001
      && anchor.normalizedAngular >= -0.001
      && anchor.normalizedAngular <= 1.001
    )).length;
    (ringIntervals[definition.ring] ??= []).push({
      id,
      start: cell.startAngle,
      end: cell.endAngle,
      inner: cell.innerRadius,
      outer: cell.outerRadius,
    });
    districtResults.push({
      id,
      ring: definition.ring,
      cell,
      population,
      sectorAnchorCount: sectorAnchors.length,
      containedAnchors,
      violatingAnchors: sectorAnchors.filter((anchor) => !(
        anchor.radius >= cell.innerRadius - 0.001
        && anchor.radius <= cell.outerRadius + 0.001
        && anchor.normalizedRadial >= -0.001
        && anchor.normalizedRadial <= 1.001
        && anchor.normalizedAngular >= -0.001
        && anchor.normalizedAngular <= 1.001
      )),
      semanticRootCount: semanticRoots.length,
      semanticNames: semanticRoots.map((entry) => entry.name),
      boundaryPresent: Boolean(boundary),
      centerAngleNormalized: normalize(cell.centerAngle),
    });
  }

  const ringCoverage = Object.fromEntries(Object.entries(ringIntervals).map(([ring, intervals]) => {
    const uniqueIntervals = [...new Map(
      intervals.map((interval) => [`${interval.start.toFixed(6)}:${interval.end.toFixed(6)}`, interval]),
    ).values()];
    const sorted = uniqueIntervals.sort((left, right) => left.start - right.start);
    const totalSpan = sorted.reduce((sum, interval) => sum + interval.end - interval.start, 0);
    const maximumGap = sorted.slice(0, -1).reduce(
      (maximum, interval, index) => Math.max(maximum, Math.abs(interval.end - sorted[index + 1].start)),
      0,
    );
    const radialBounds = [...new Set(sorted.map((interval) => `${interval.inner}:${interval.outer}`))];
    return [ring, {
      campusCount: intervals.length,
      uniqueCellCount: sorted.length,
      totalSpan,
      maximumGap,
      radialBounds,
    }];
  }));

  const biomeTokens = {
    'alpine-dome': ['SNOWFIELD', 'ALPINE_ROCK', 'CONIFER', 'MELTWATER', 'WEATHER_STATION'],
    'tundra-dome': ['PERMAFROST', 'MOSS_LICHEN', 'MELTWATER', 'BOREHOLE', 'CLIMATE_MAST'],
    'desert-dome': ['DUNE', 'ERODED_STONE', 'CACTUS', 'SOLAR_RESEARCH', 'HEAT_FLUX'],
    'savanna-dome': ['GOLDEN_GRASS', 'ACACIA', 'WATER_HOLE', 'SAVANNA_STONE', 'OBSERVATION_HIDE'],
    'temperate-deciduous-forest-dome': ['DECIDUOUS', 'UNDERSTORY', 'WOODLAND_STREAM', 'RESEARCH_PLOTS', 'FALLEN_LOG'],
    'tropical-rainforest-dome': ['CANOPY', 'WATERFALL', 'STREAM', 'CANOPY_WALK', 'GREENHOUSE', 'RESEARCH_STATION'],
  };
  const biomeResults = Object.entries(biomeTokens).map(([id, tokens]) => {
    const group = world.objectGroups.get(id);
    const names = [];
    const realizedEcologyFeatures = new Set();
    let fieldLabCount = 0;
    group.traverse((child) => {
      if (child.name) names.push(child.name.toUpperCase());
      if (child.userData.biomeFeature) realizedEcologyFeatures.add(child.userData.biomeFeature);
      if (child.parent === group && child.name.includes('BIOME_FIELD_LABORATORY')) fieldLabCount += 1;
    });
    const tokenCoverage = Object.fromEntries(tokens.map((token) => [token, names.some((name) => name.includes(token))]));
    return {
      id,
      plan: group.userData.biomeEcologyPlan,
      expansion: group.userData.biomeEcologyExpansion ?? null,
      fieldLabCount,
      fieldLabName: group.children.find((child) => child.name.includes('BIOME_FIELD_LABORATORY'))?.userData.semanticName,
      tokenCoverage,
      realizedEcologyFeatures: [...realizedEcologyFeatures],
      namedObjectCount: names.length,
    };
  });

  return {
    planning: textState.planning,
    infrastructure,
    districtResults,
    ringCoverage,
    biomeResults,
    renderer: {
      calls: world.renderer.info.render.calls,
      triangles: world.renderer.info.render.triangles,
      geometries: world.renderer.info.memory.geometries,
      textures: world.renderer.info.memory.textures,
    },
  };
});

if (JSON.stringify(audit.planning) !== JSON.stringify({
  boundedDistricts: 35,
  populatedDistricts: 35,
  distinctDistricts: 35,
  filledBiomeDomes: 6,
  cellViolations: 0,
})) {
  throw new Error(`Planning summary is incomplete: ${JSON.stringify(audit.planning)} violations=${JSON.stringify(audit.districtResults.filter((district) => district.violatingAnchors.length > 0).map((district) => ({ id: district.id, anchors: district.violatingAnchors })))}`);
}
if (audit.districtResults.length !== 35) {
  throw new Error(`Expected 35 district cells, found ${audit.districtResults.length}`);
}
for (const district of audit.districtResults) {
  if (
    !district.cell?.boundedByTwoRadialLines
    || !district.cell?.boundedByTwoConcentricCircles
    || district.cell.outerRadius <= district.cell.innerRadius
    || district.cell.endAngle <= district.cell.startAngle
    || district.cell.delimiterModel !== 'shared-ring-roads-and-six-spokes'
    || district.cell.visibleBoundaryOverlay !== false
    || district.boundaryPresent
  ) {
    throw new Error(`Invalid annular sector for ${district.id}: ${JSON.stringify(district)}`);
  }
  const industrial = district.id === 'industrial-labs';
  if (
    district.population?.realizedFacilityCount < 4
    || district.population?.realizedObjectCount < 4
    || district.population?.distinct !== true
    || (!industrial && district.population?.asymmetricCampus !== true)
    || (!industrial && district.population?.localRoadCount < 3)
  ) {
    throw new Error(`District ${district.id} is under-populated: ${JSON.stringify(district.population)}`);
  }
  if (!industrial && (
    district.sectorAnchorCount < 8
    || district.containedAnchors !== district.sectorAnchorCount
    || district.semanticRootCount < 8
    || new Set(district.semanticNames).size !== district.semanticNames.length
  )) {
    throw new Error(`District ${district.id} has invalid semantic sector content: ${JSON.stringify(district)}`);
  }
}
if (
  audit.infrastructure.ringRoads !== 5
  || audit.infrastructure.radialRoadDiameters !== 3
  || audit.infrastructure.districtBoundaryOverlays !== 0
  || audit.infrastructure.localCampusRoads < 120
) {
  throw new Error(`Shared district delimiters or local roads are invalid: ${JSON.stringify(audit.infrastructure)}`);
}
for (const [ring, coverage] of Object.entries(audit.ringCoverage)) {
  if (
    Math.abs(coverage.totalSpan - Math.PI * 2) > 0.0001
    || coverage.maximumGap > 0.0001
    || coverage.radialBounds.length !== 1
    || (ring !== 'core' && coverage.uniqueCellCount !== 6)
  ) {
    throw new Error(`Ring ${ring} does not form a complete annular partition: ${JSON.stringify(coverage)}`);
  }
}
for (const biome of audit.biomeResults) {
  const missingTokens = Object.entries(biome.tokenCoverage).filter(([, found]) => !found).map(([token]) => token);
  if (
    biome.plan?.filled !== true
    || biome.plan?.plannedFeatures?.length < 7
    || biome.fieldLabCount !== 1
    || !biome.fieldLabName
    || missingTokens.length > 0
  ) {
    throw new Error(`Biome ${biome.id} is incomplete; missing ${missingTokens.join(', ')}: ${JSON.stringify(biome)}`);
  }
}
// The complete authored world includes the industrial railway, detailed
// Tropical dome, city horizon, Academic sector fence, and two shadow-map
// passes. Keep the authored world below a measured ceiling instead of
// comparing against a tiny demo scene; the instanced Gothic enclosure adds
// 208 calls in the all-island overview while remaining cullable in WALK.
if (audit.renderer.calls > 11_400 || audit.renderer.geometries > 5_000) {
  throw new Error(`Population layer exceeded the scene budget: ${JSON.stringify(audit.renderer)}`);
}
if (consoleErrors.length > 0) throw new Error(`Browser console errors: ${consoleErrors.join('\n')}`);

await page.click('.mode[data-mode="plan"]');
await page.waitForTimeout(150);
await page.evaluate(() => {
  const world = window.labIsland;
  document.querySelectorAll('.atlas, .scene-card, .layerbar').forEach((element) => {
    element.setAttribute('style', 'display:none');
  });
  world.camera.fov = 44;
  world.camera.position.set(0, 1_080, 1_180);
  world.controls.target.set(0, 0, 0);
  world.camera.lookAt(world.controls.target);
  world.camera.updateProjectionMatrix();
  world.controls.update();
  world.advanceTime(180);
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${outputDirectory}/all-district-campuses.png` });

const districtShots = [
  'pharmacology-labs',
  'robotics-labs',
  'astronomy-astrobiology-labs',
  'materials-science-lab',
  'environmental-science-labs',
  'particle-physics-labs',
];
for (const id of districtShots) {
  await page.evaluate((districtId) => {
    const world = window.labIsland;
    const Vector3 = world.camera.position.constructor;
    const group = world.objectGroups.get(districtId);
    const target = group.getWorldPosition(new Vector3()).add(new Vector3(0, 2.8, 0));
    const outward = target.clone().setY(0).normalize();
    const tangent = new Vector3(-outward.z, 0, outward.x);
    world.camera.fov = 48;
    world.camera.position.copy(target).addScaledVector(outward, 48).addScaledVector(tangent, 32).add(new Vector3(0, 42, 0));
    world.controls.target.copy(target);
    world.camera.lookAt(target);
    world.camera.updateProjectionMatrix();
    world.controls.update();
    world.advanceTime(120);
  }, id);
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${outputDirectory}/district-${id}.png` });
}

const biomeIds = [
  'alpine-dome',
  'tundra-dome',
  'desert-dome',
  'savanna-dome',
  'temperate-deciduous-forest-dome',
  'tropical-rainforest-dome',
];
for (const id of biomeIds) {
  await page.evaluate((biomeId) => {
    const world = window.labIsland;
    const Vector3 = world.camera.position.constructor;
    const group = world.objectGroups.get(biomeId);
    const target = group.getWorldPosition(new Vector3()).add(new Vector3(0, 2.8, 0));
    const outward = target.clone().setY(0).normalize();
    const tangent = new Vector3(-outward.z, 0, outward.x);
    world.camera.fov = 46;
    world.camera.position.copy(target).addScaledVector(outward, 27).addScaledVector(tangent, 18).add(new Vector3(0, 17, 0));
    world.controls.target.copy(target);
    world.camera.lookAt(target);
    world.camera.updateProjectionMatrix();
    world.controls.update();
    world.advanceTime(120);
  }, id);
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${outputDirectory}/biome-${id}.png` });
}

console.log(JSON.stringify({
  planning: audit.planning,
  infrastructure: audit.infrastructure,
  ringCoverage: audit.ringCoverage,
  districts: audit.districtResults.map((district) => ({
    id: district.id,
    facilities: district.population.realizedFacilityCount,
    objects: district.population.realizedObjectCount,
    localRoads: district.population.localRoadCount ?? 0,
    sharedCellCount: district.cell.sharedCellCount,
  })),
  biomes: audit.biomeResults.map((biome) => ({
    id: biome.id,
    features: biome.plan.plannedFeatures.length,
    fieldLab: biome.fieldLabName,
  })),
  renderer: audit.renderer,
  consoleErrors,
}, null, 2));
await browser.close();
