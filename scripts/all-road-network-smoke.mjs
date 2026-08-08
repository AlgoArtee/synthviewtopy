import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ROAD_NETWORK_OUTPUT ?? 'output/all-road-network';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const CONNECTOR_EXCEPTIONS = [
  'academic-libraries-theoretical-labs',
  'entry-commercial',
  'logistics',
];

// These districts own bespoke circulation generators. Every other district
// uses the shared collector-loop and local-approach model.
const SPECIALIZED_NETWORKS = [
  ...CONNECTOR_EXCEPTIONS,
  'industrial-labs',
  'security',
  'secret-labs',
  'medical-labs',
  'pharmacology-labs',
  'microbiology-labs',
  'molecular-biology-labs',
  'bioanalytics-lab',
  'forensic-cyberforensic-lab',
  'genomics-labs',
  'proteomics-labs',
  'computational-biology-labs',
  'biochemistry-labs',
  'organic-chemistry-labs',
  'inorganic-chemistry',
  'particle-physics-labs',
  'materials-science-lab',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const browserErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(message.text());
});
page.on('pageerror', (error) => browserErrors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(900);

  const audit = await page.evaluate(({ connectorExceptions, specializedNetworks }) => {
    const world = window.labIsland;
    const failures = [];
    const exceptionIds = new Set(connectorExceptions);
    const specializedIds = new Set(specializedNetworks);
    const normalizeToken = (value) => String(value ?? '').trim().toLowerCase();
    const routeId = (route) => String(route?.roadId ?? route?.id ?? '').trim();
    const routeClass = (route) => normalizeToken(route?.roadClass);
    const toPoint = (value) => {
      if (Array.isArray(value) && value.length >= 3) {
        return [Number(value[0]), Number(value[1]), Number(value[2])];
      }
      if (value && typeof value === 'object') {
        return [Number(value.x), Number(value.y), Number(value.z)];
      }
      return [Number.NaN, Number.NaN, Number.NaN];
    };
    const finitePoint = (point) => point.length === 3 && point.every(Number.isFinite);
    const centerline = (route) => Array.isArray(route?.centerline)
      ? route.centerline.map(toPoint)
      : [];
    const arterialCenterline = (route) => {
      if (Array.isArray(route?.centerline)) return route.centerline.map(toPoint);
      const specification = route?.centerline;
      const kind = normalizeToken(specification?.kind ?? route?.centerlineType);
      if (kind === 'segment') {
        return [
          toPoint(specification?.start ?? route?.centerlineStart),
          toPoint(specification?.end ?? route?.centerlineEnd),
        ];
      }
      if (kind === 'ring') {
        const center = toPoint(specification?.center ?? [0, route?.centerlineY, 0]);
        const radius = Number(specification?.radius ?? route?.centerlineRadius ?? route?.ringRadius);
        if (!finitePoint(center) || !Number.isFinite(radius) || radius <= 0) return [];
        return Array.from({ length: 97 }, (_, index) => {
          const angle = index / 96 * Math.PI * 2;
          return [
            center[0] + Math.cos(angle) * radius,
            center[1],
            center[2] + Math.sin(angle) * radius,
          ];
        });
      }
      return [];
    };
    const endpointKinds = (route) => {
      const value = route?.endpointKinds;
      if (Array.isArray(value)) {
        return value.map((entry) => normalizeToken(
          typeof entry === 'string' ? entry : entry?.kind ?? entry?.type,
        ));
      }
      if (value && typeof value === 'object') {
        return [value.start, value.end].map((entry) => normalizeToken(
          typeof entry === 'string' ? entry : entry?.kind ?? entry?.type,
        ));
      }
      return [];
    };
    const distanceXZ = (left, right) => Math.hypot(left[0] - right[0], left[2] - right[2]);
    const pointToSegmentDistanceXZ = (point, start, end) => {
      const dx = end[0] - start[0];
      const dz = end[2] - start[2];
      const lengthSquared = dx * dx + dz * dz;
      const t = lengthSquared <= 1e-12 ? 0 : Math.max(0, Math.min(1, (
        (point[0] - start[0]) * dx + (point[2] - start[2]) * dz
      ) / lengthSquared));
      return Math.hypot(point[0] - start[0] - dx * t, point[2] - start[2] - dz * t);
    };
    const pointToPolylineDistanceXZ = (point, points) => {
      if (points.length < 2) return Number.POSITIVE_INFINITY;
      let minimum = Number.POSITIVE_INFINITY;
      for (let index = 1; index < points.length; index += 1) {
        minimum = Math.min(minimum, pointToSegmentDistanceXZ(point, points[index - 1], points[index]));
      }
      return minimum;
    };
    const angularDistance = (left, right) => {
      const fullTurn = Math.PI * 2;
      const delta = Math.abs(left - right) % fullTurn;
      return Math.min(delta, fullTurn - delta);
    };
    const validateRoute = (route, ownerLabel) => {
      const id = routeId(route);
      const cls = routeClass(route);
      const points = centerline(route);
      const kinds = endpointKinds(route);
      const width = Number(route?.width);
      if (!id) failures.push(`${ownerLabel} has a route without id/roadId`);
      if (!cls) failures.push(`${ownerLabel}/${id || '<unknown>'} has no roadClass`);
      if (!Number.isFinite(width) || width <= 0) {
        failures.push(`${ownerLabel}/${id || '<unknown>'} has invalid width ${String(route?.width)}`);
      }
      if (points.length < 2 || points.some((point) => !finitePoint(point))) {
        failures.push(`${ownerLabel}/${id || '<unknown>'} has an invalid centerline`);
      }
      if (kinds.length !== 2 || kinds.some((kind) => !kind)) {
        failures.push(`${ownerLabel}/${id || '<unknown>'} must declare two endpointKinds`);
      }
      return { id, cls, points, kinds, width };
    };
    const validateArterial = (route, ownerLabel) => {
      const id = routeId(route);
      const cls = routeClass(route);
      const points = arterialCenterline(route);
      const width = Number(route?.width);
      if (!id) failures.push(`${ownerLabel} has no id/roadId`);
      if (!cls) failures.push(`${ownerLabel}/${id || '<unknown>'} has no roadClass`);
      if (route?.transitRoad !== true) failures.push(`${ownerLabel}/${id || '<unknown>'} is not tagged transitRoad`);
      if (!Array.isArray(route?.centerline)) {
        failures.push(`${ownerLabel}/${id || '<unknown>'} centerline must be a finite point array`);
      }
      if (!Number.isFinite(width) || width <= 0) {
        failures.push(`${ownerLabel}/${id || '<unknown>'} has invalid width ${String(route?.width)}`);
      }
      if (points.length < 2 || points.some((point) => !finitePoint(point))) {
        failures.push(`${ownerLabel}/${id || '<unknown>'} has an invalid centerline specification`);
      }
      return { id, cls, points, width };
    };

    const arterialCandidates = new Map();
    const visitedObjects = new Set();
    const registerArterial = (candidate, ownerName = '') => {
      if (!candidate || typeof candidate !== 'object') return;
      const cls = routeClass(candidate);
      const legacyType = normalizeToken(candidate.roadType);
      const label = `${routeId(candidate)} ${ownerName}`.toLowerCase();
      const isRing = (cls.includes('ring') && (cls.includes('arterial') || cls.includes('delimiter')))
        || legacyType === 'ring'
        || label.includes('district boundary ring road');
      const isRadial = ((cls.includes('radial') || cls.includes('axis'))
          && (cls.includes('arterial') || cls.includes('delimiter')))
        || legacyType === 'radial'
        || label.includes('radial district boundary road');
      if (!isRing && !isRadial) return;
      const id = routeId(candidate) || ownerName;
      if (!id || arterialCandidates.has(id)) return;
      const normalized = validateArterial(candidate, `arterial/${ownerName || id}`);
      arterialCandidates.set(id, {
        ...normalized,
        type: isRing ? 'ring' : 'radial-axis',
        standardized: Boolean(routeId(candidate) && routeClass(candidate)),
      });
    };
    const inspectArterialRoot = (root) => {
      root?.traverse?.((object) => {
        if (visitedObjects.has(object)) return;
        visitedObjects.add(object);
        const data = object.userData ?? {};
        registerArterial(data, object.name);
        for (const key of ['roadNetworkRoute', 'transitRoad', 'arterialRoad']) {
          registerArterial(data[key], object.name);
        }
        for (const key of ['roadNetwork', 'transitRoadNetwork', 'arterialRoadNetwork']) {
          const network = data[key];
          for (const route of network?.arterials ?? []) registerArterial(route, object.name);
          for (const route of network?.routes ?? []) registerArterial(route, object.name);
        }
        for (const route of data.arterials ?? []) registerArterial(route, object.name);
      });
    };
    inspectArterialRoot(world.transitNetworkRoot);
    inspectArterialRoot(world.transitRoot);
    inspectArterialRoot(world.globalEnvironmentBatching?.authorityRoot);

    const ringCurbs = [];
    const visitedCurbs = new Set();
    [world.transitNetworkRoot, world.transitRoot, world.globalEnvironmentBatching?.authorityRoot]
      .filter(Boolean)
      .forEach((root) => root.traverse((object) => {
        if (visitedCurbs.has(object) || object.userData?.transitCurb !== true) return;
        visitedCurbs.add(object);
        ringCurbs.push({
          name: object.name,
          parentRoadId: String(object.userData.parentRoadId ?? ''),
          radius: Number(object.userData.curbRadius),
          openingWidth: Number(object.userData.junctionOpeningWidth),
          openingAngles: Array.isArray(object.userData.junctionOpeningAngles)
            ? object.userData.junctionOpeningAngles.map(Number)
            : [],
          districtJunctionOpenings: object.userData.districtJunctionOpenings === true,
        });
      }));

    const arterials = [...arterialCandidates.values()];
    const ringArterials = arterials.filter((arterial) => arterial.type === 'ring');
    const radialArterials = arterials.filter((arterial) => arterial.type === 'radial-axis');
    if (ringArterials.length !== 5) {
      failures.push(`Expected 5 standardized ring arterials, found ${ringArterials.length}`);
    }
    if (radialArterials.length !== 3) {
      failures.push(`Expected 3 standardized radial-axis arterials, found ${radialArterials.length}`);
    }
    for (const arterial of radialArterials) {
      if (arterial.points.length !== 2) {
        failures.push(`Radial-axis arterial ${arterial.id} must have exactly two centerline points`);
      }
    }
    if (arterials.some((arterial) => !arterial.standardized)) {
      failures.push('One or more delimiter arterials lack standardized id/roadId or roadClass metadata');
    }
    const ringDatums = ringArterials.map((arterial) => {
      const radii = arterial.points.map((point) => Math.hypot(point[0], point[2]));
      const radius = radii.reduce((sum, value) => sum + value, 0) / Math.max(1, radii.length);
      const datumY = arterial.points.reduce((sum, point) => sum + point[1], 0)
        / Math.max(1, arterial.points.length);
      const radialSpread = radii.length
        ? Math.max(...radii.map((value) => Math.abs(value - radius)))
        : Number.POSITIVE_INFINITY;
      if (!Number.isFinite(radius) || !Number.isFinite(datumY) || radialSpread > 0.02) {
        failures.push(`Ring arterial ${arterial.id} has an invalid circular centerline`);
      }
      if (arterial.points.length >= 2
        && distanceXZ(arterial.points[0], arterial.points.at(-1)) > 0.02) {
        failures.push(`Ring arterial ${arterial.id} centerline is not closed`);
      }
      return { id: arterial.id, radius, datumY, width: arterial.width };
    }).sort((left, right) => left.radius - right.radius);

    const restoreAuthority = [];
    const districtResults = [];
    const seamResults = [];
    const obstacleResults = [];
    const academicRadialConnections = [];
    let totalRoutes = 0;
    try {
      for (const [id, group] of world.objectGroups.entries()) {
        const cell = group.userData.districtCell;
        const population = group.userData.population;
        if (!cell || !population) continue;
        let network = group.userData.districtRoadNetwork;
        if (!network) {
          const restore = world.worldStreaming?.mountPackageAuthoritySources?.(id);
          if (typeof restore === 'function') restoreAuthority.push(restore);
          network = group.userData.districtRoadNetwork;
        }
        const definition = world.definitions.get(id);
        const ring = String(definition?.ring ?? network?.ring ?? '').trim();
        const rawRoutes = Array.isArray(network?.routes) ? network.routes : [];
        if (!network || rawRoutes.length === 0) failures.push(`District ${id} has no districtRoadNetwork routes`);
        const normalizedRoutes = rawRoutes.map((route) => ({
          source: route,
          ...validateRoute(route, `district/${id}`),
        }));
        totalRoutes += normalizedRoutes.length;

        const ids = normalizedRoutes.map((route) => route.id).filter(Boolean);
        if (new Set(ids).size !== ids.length) failures.push(`District ${id} contains duplicate road ids`);

        const ringConnectors = normalizedRoutes.filter((route) => (
          route.kinds.some((kind) => kind.includes('ring'))
          && route.cls.includes('connector')
        ));
        const expectedConnectorCount = ring === 'core' || ring === 'perimeter' ? 1 : 2;
        const declaredException = network?.existingNetworkException === true
          || network?.connectorException === true
          || (typeof network?.exceptionReason === 'string' && network.exceptionReason.trim().length > 0);
        if (declaredException && !exceptionIds.has(id)) {
          failures.push(`District ${id} declares an unauthorized connector exception`);
        }
        const connectorExempt = exceptionIds.has(id) && declaredException;
        if (!connectorExempt && ringConnectors.length !== expectedConnectorCount) {
          failures.push(
            `District ${id} (${ring || 'unknown ring'}) has ${ringConnectors.length} ring connectors; expected ${expectedConnectorCount}`,
          );
        }

        group.updateWorldMatrix(true, false);
        const connectorRings = new Set();
        for (const connector of connectorExempt ? [] : ringConnectors) {
          for (let endpointIndex = 0; endpointIndex < connector.kinds.length; endpointIndex += 1) {
            if (!connector.kinds[endpointIndex].includes('ring')) continue;
            const localPoint = endpointIndex === 0 ? connector.points[0] : connector.points.at(-1);
            if (!finitePoint(localPoint) || !ringDatums.length) continue;
            const worldPoint = group.localToWorld(world.camera.position.clone().fromArray(localPoint));
            const endpointRadius = Math.hypot(worldPoint.x, worldPoint.z);
            const nearestRing = ringDatums.reduce((nearest, candidate) => (
              Math.abs(candidate.radius - endpointRadius) < Math.abs(nearest.radius - endpointRadius)
                ? candidate
                : nearest
            ), ringDatums[0]);
            const radiusGap = Math.abs(nearestRing.radius - endpointRadius);
            const yGap = Math.abs(nearestRing.datumY - worldPoint.y);
            connectorRings.add(nearestRing.id);
            const seam = {
              districtId: id,
              connectorId: connector.id,
              arterialId: nearestRing.id,
              endpointIndex,
              endpoint: [worldPoint.x, worldPoint.y, worldPoint.z],
              centerline: connector.points.map((point) => (
                group.localToWorld(world.camera.position.clone().fromArray(point)).toArray()
              )),
              endpointRadius,
              arterialRadius: nearestRing.radius,
              radiusGap,
              yGap,
            };
            seamResults.push(seam);
            if (radiusGap > 0.02) {
              failures.push(`District ${id} connector ${connector.id} misses ${nearestRing.id} by ${radiusGap.toFixed(5)}`);
            }
            if (yGap > 0.01) {
              failures.push(`District ${id} connector ${connector.id} differs from the arterial datum by ${yGap.toFixed(5)}`);
            }
          }
        }
        if (!connectorExempt && connectorRings.size !== expectedConnectorCount) {
          failures.push(`District ${id} connectors do not reach ${expectedConnectorCount} distinct rings`);
        }

        const generatedConnectors = normalizedRoutes.filter((route) => (
          route.source?.generated === true && route.cls.includes('connector')
        ));
        if (generatedConnectors.length) {
          const restoreObstacles = world.worldStreaming?.mountPackageAuthoritySources?.(id);
          try {
            group.updateWorldMatrix(true, true);
            world.walkController.refreshNavigation();
            for (const connector of generatedConnectors) {
              const worldPoints = connector.points.map((localPoint) => {
                const worldPoint = world.camera.position.clone().fromArray(localPoint);
                group.localToWorld(worldPoint);
                return worldPoint;
              });
              let collision = null;
              for (let segmentIndex = 1; segmentIndex < worldPoints.length && !collision; segmentIndex += 1) {
                const segmentLength = worldPoints[segmentIndex - 1].distanceTo(worldPoints[segmentIndex]);
                const sampleCount = Math.max(1, Math.ceil(segmentLength / 0.1));
                for (let sampleIndex = 0; sampleIndex <= sampleCount && !collision; sampleIndex += 1) {
                  const sample = worldPoints[segmentIndex - 1].clone().lerp(
                    worldPoints[segmentIndex],
                    sampleIndex / sampleCount,
                  );
                  const collisionIndex = world.walkController.findObstacleCollisionIndex(
                    sample.x,
                    sample.z,
                    sample.y + 0.015,
                    sample.y + 0.162,
                    false,
                  );
                  if (collisionIndex >= 0) {
                    collision = {
                      districtId: id,
                      connectorId: connector.id,
                      collisionIndex,
                      sample: [sample.x, sample.y, sample.z],
                    };
                  }
                }
              }
              if (collision) {
                obstacleResults.push(collision);
                failures.push(
                  `District ${id} connector ${connector.id} is blocked in WALK at ${collision.sample.join(',')}`,
                );
              }
            }
          } finally {
            if (typeof restoreObstacles === 'function') restoreObstacles();
          }
        }

        if (id === 'academic-libraries-theoretical-labs') {
          const gatePaths = normalizedRoutes.filter((route) => (
            /(?:TUNDRA|DESERT)_DOME_GARDEN_GATE_PATH/i.test(String(route.source?.name ?? ''))
          ));
          for (const route of gatePaths) {
            const worldPoints = route.points.map((localPoint) => {
              const worldPoint = world.camera.position.clone().fromArray(localPoint);
              group.localToWorld(worldPoint);
              return [worldPoint.x, worldPoint.y, worldPoint.z];
            });
            let nearest = null;
            radialArterials.forEach((arterial) => {
              worldPoints.forEach((worldPoint, endpointIndex) => {
                const centerlineGap = pointToPolylineDistanceXZ(worldPoint, arterial.points);
                const edgeGap = centerlineGap - route.width * 0.5 - arterial.width * 0.5;
                if (!nearest || edgeGap < nearest.edgeGap) {
                  nearest = {
                    routeId: route.id,
                    arterialId: arterial.id,
                    endpointIndex,
                    centerlineGap,
                    edgeGap,
                    yGap: Math.abs(worldPoint[1] - arterial.points[0][1]),
                  };
                }
              });
            });
            if (nearest) {
              academicRadialConnections.push(nearest);
              if (nearest.edgeGap > 0.02 || nearest.yGap > 0.01) {
                failures.push(
                  `Academic gate path ${route.id} misses ${nearest.arterialId} by ${nearest.edgeGap.toFixed(5)} edge / ${nearest.yGap.toFixed(5)} Y`,
                );
              }
            }
          }
          if (gatePaths.length !== 2) failures.push(`Expected 2 Academic radial gate paths, found ${gatePaths.length}`);
        }

        const generic = !specializedIds.has(id);
        let collectorCount = 0;
        let localApproachCount = 0;
        let maximumApproachGap = 0;
        if (generic) {
          const collectors = normalizedRoutes.filter((route) => route.cls.includes('collector'));
          // A district may also contain a separate perimeter access ramp. Only
          // routes explicitly normalized onto the generated collector are the
          // local campus approaches governed by this invariant.
          const localApproaches = normalizedRoutes.filter((route) => (
            route.kinds[0]?.includes('collector')
            && (route.cls.includes('local') || route.cls.includes('approach'))
            && !route.cls.includes('connector')
          ));
          collectorCount = collectors.length;
          localApproachCount = localApproaches.length;
          if (!collectors.length) failures.push(`Generic district ${id} has no collector loop`);
          if (!localApproaches.length) failures.push(`Generic district ${id} has no local approaches`);
          for (const collector of collectors) {
            if (collector.points.length >= 2
              && distanceXZ(collector.points[0], collector.points.at(-1)) > 0.02) {
              failures.push(`Generic district ${id} collector ${collector.id} is not a closed loop`);
            }
          }
          for (const approach of localApproaches) {
            const start = approach.points[0];
            const gap = collectors.reduce((minimum, collector) => Math.min(
              minimum,
              pointToPolylineDistanceXZ(start, collector.points),
            ), Number.POSITIVE_INFINITY);
            maximumApproachGap = Math.max(maximumApproachGap, gap);
            if (gap > 0.02) {
              failures.push(`Generic district ${id} approach ${approach.id} starts ${gap.toFixed(5)} from its collector`);
            }
          }
        }

        districtResults.push({
          id,
          ring,
          routeCount: normalizedRoutes.length,
          connectorCount: ringConnectors.length,
          expectedConnectorCount,
          connectorExempt,
          connectedRingCount: connectorRings.size,
          generic,
          collectorCount,
          localApproachCount,
          maximumApproachGap,
        });
      }
    } finally {
      restoreAuthority.reverse().forEach((restore) => restore());
    }

    if (districtResults.length !== 35) failures.push(`Expected 35 district networks, found ${districtResults.length}`);
    if (districtResults.some((district) => district.routeCount === 0)) {
      failures.push('At least one district road network is empty');
    }
    if (ringCurbs.length !== 10) failures.push(`Expected 10 segmented ring curbs, found ${ringCurbs.length}`);
    let curbJunctionChecks = 0;
    seamResults.forEach((seam) => {
      const endpointAngle = Math.atan2(seam.endpoint[2], seam.endpoint[0]);
      const curbs = ringCurbs.filter((curb) => curb.parentRoadId === seam.arterialId);
      if (curbs.length !== 2) {
        failures.push(`Arterial ${seam.arterialId} does not expose two curb records`);
        return;
      }
      curbs.forEach((curb) => {
        curbJunctionChecks += 1;
        const nearestOpening = Math.min(
          Number.POSITIVE_INFINITY,
          ...curb.openingAngles.map((angle) => angularDistance(endpointAngle, angle) * curb.radius),
        );
        if (!curb.districtJunctionOpenings
          || !Number.isFinite(nearestOpening)
          || nearestOpening > curb.openingWidth * 0.5 + 0.05) {
          failures.push(
            `${curb.name} crosses district connector ${seam.connectorId} (opening gap ${nearestOpening.toFixed(5)})`,
          );
        }
      });
    });
    const worstSeam = seamResults.reduce((worst, seam) => {
      const score = Math.max(seam.radiusGap / 0.02, seam.yGap / 0.01);
      const worstScore = worst ? Math.max(worst.radiusGap / 0.02, worst.yGap / 0.01) : -1;
      return score > worstScore ? seam : worst;
    }, null);
    const representativeSeam = seamResults
      .filter((seam) => !exceptionIds.has(seam.districtId) && seam.centerline.length >= 2)
      .map((seam) => {
        const adjacentIndex = seam.endpointIndex === 0 ? 1 : seam.centerline.length - 2;
        const adjacent = seam.centerline[adjacentIndex];
        const approachX = seam.endpoint[0] - adjacent[0];
        const approachZ = seam.endpoint[2] - adjacent[2];
        const approachLength = Math.hypot(approachX, approachZ) || 1;
        const radius = seam.endpointRadius || 1;
        return {
          ...seam,
          radialApproachAlignment: Math.abs(
            (approachX * seam.endpoint[0] + approachZ * seam.endpoint[2])
              / (approachLength * radius),
          ),
        };
      })
      .sort((left, right) => right.radialApproachAlignment - left.radialApproachAlignment)[0]
      ?? worstSeam;

    return {
      districtCount: districtResults.length,
      totalRoutes,
      arterials: {
        ringCount: ringArterials.length,
        radialAxisCount: radialArterials.length,
        rings: ringDatums,
        radialAxes: radialArterials.map((arterial) => ({
          id: arterial.id,
          width: arterial.width,
          pointCount: arterial.points.length,
        })),
      },
      seamCount: seamResults.length,
      maximumRadiusGap: Math.max(0, ...seamResults.map((seam) => seam.radiusGap)),
      maximumYGap: Math.max(0, ...seamResults.map((seam) => seam.yGap)),
      obstacleCollisionCount: obstacleResults.length,
      obstacleResults,
      academicRadialConnections,
      ringCurbs: {
        count: ringCurbs.length,
        junctionChecks: curbJunctionChecks,
        minimumOpeningCount: Math.min(...ringCurbs.map((curb) => curb.openingAngles.length)),
      },
      worstSeam,
      representativeSeam,
      districtResults,
      failures,
    };
  }, { connectorExceptions: CONNECTOR_EXCEPTIONS, specializedNetworks: SPECIALIZED_NETWORKS });

  const dynamicRefreshAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-l1';
    const building = world.objectGroups.get(buildingId);
    const district = world.objectGroups.get('logistics');
    if (!building || !district || typeof world.notifyTransform !== 'function') {
      return { available: false };
    }
    const routeSignature = () => JSON.stringify(
      (district.userData.districtRoadNetwork?.routes ?? [])
        .filter((route) => String(route.id ?? route.roadId).includes('l1-'))
        .map((route) => route.centerline),
    );
    const proxyRecord = () => {
      const mesh = world.worldStreaming.vistaRoot.getObjectByName('LOGISTICS__FAR_HLOD_ROAD_NETWORK');
      const positions = mesh?.geometry?.getAttribute('position')?.array ?? [];
      let hash = 0;
      for (let index = 0; index < positions.length; index += 1) {
        hash += Number(positions[index]) * ((index % 97) + 1);
      }
      return { mesh, hash: Number(hash.toFixed(5)), vertices: positions.length / 3 };
    };
    const originalPosition = building.position.clone();
    const initialNetwork = district.userData.districtRoadNetwork;
    const initialRouteSignature = routeSignature();
    const initialProxy = proxyRecord();
    let movedNetwork = initialNetwork;
    let movedRouteSignature = initialRouteSignature;
    let movedProxy = initialProxy;
    let restoredRouteSignature = initialRouteSignature;
    try {
      building.position.x += 0.6;
      world.notifyTransform(buildingId);
      world.advanceTime(32);
      movedNetwork = district.userData.districtRoadNetwork;
      movedRouteSignature = routeSignature();
      movedProxy = proxyRecord();
    } finally {
      building.position.copy(originalPosition);
      world.notifyTransform(buildingId);
      world.advanceTime(32);
      restoredRouteSignature = routeSignature();
    }
    return {
      available: true,
      networkReplaced: movedNetwork !== initialNetwork,
      routesChanged: movedRouteSignature !== initialRouteSignature,
      proxyReplaced: movedProxy.mesh !== initialProxy.mesh,
      proxyChanged: movedProxy.hash !== initialProxy.hash,
      vertexCountStable: movedProxy.vertices === initialProxy.vertices,
      restored: restoredRouteSignature === initialRouteSignature,
    };
  });

  const hideInterface = async () => page.evaluate(() => {
    document.querySelectorAll([
      '.atlas',
      '.topbar',
      '#scene-card',
      '#inspector-panel',
      '#edit-workspace',
      '.layerbar',
      '.compass',
      '.interaction-hint',
      '.walk-hud',
      '.mode-help',
      '.toast-region',
    ].join(',')).forEach((element) => { element.style.display = 'none'; });
  });

  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('plan');
    world.clearSelection('system');
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.cameraTween = null;
    world.camera.up.set(0, 0, -1);
    world.camera.position.set(0.1, 1_350, 0.1);
    world.controls.target.set(0, 1.61, 0);
    world.controls.update();
    world.advanceTime(1_200);
  });
  await hideInterface();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/full-island-road-plan.png` });
  const planProxyAudit = await page.evaluate(() => {
    const roads = [];
    window.labIsland.worldStreaming.vistaRoot.traverse((object) => {
      if (!object.isMesh || object.userData.proxyRoadNetwork !== true) return;
      let visible = true;
      let cursor = object;
      while (cursor) {
        if (!cursor.visible) { visible = false; break; }
        cursor = cursor.parent;
      }
      if (!visible) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      roads.push({
        name: object.name,
        depthTest: materials.every((material) => material.depthTest === false),
        depthWrite: materials.every((material) => material.depthWrite === false),
      });
    });
    return { count: roads.length, roads };
  });

  await page.evaluate((representativeSeam) => {
    const world = window.labIsland;
    const fallback = [0, 1.616, 84];
    const point = representativeSeam?.endpoint ?? fallback;
    const radius = Math.hypot(point[0], point[2]) || 1;
    const radialX = point[0] / radius;
    const radialZ = point[2] / radius;
    const tangentX = -radialZ;
    const tangentZ = radialX;
    world.setMode('explore');
    world.clearSelection('system');
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.cameraTween = null;
    world.worldStreaming.ensurePackageResident(world.objectGroups.get('robotics-labs'));
    world.updateWorldStreaming(false, true);
    world.advanceTime(600);
    world.cameraTween = null;
    world.controls.enableDamping = false;
    world.camera.up.set(0, 1, 0);
    world.camera.position.set(
      point[0] + radialX * 10 + tangentX * 20,
      point[1] + 22,
      point[2] + radialZ * 10 + tangentZ * 20,
    );
    world.controls.target.set(
      point[0] - radialX * 4,
      point[1],
      point[2] - radialZ * 4,
    );
    world.controls.update();
    world.updateWorldStreaming(false, true);
    world.advanceTime(32);
  }, audit.representativeSeam);
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${OUTPUT}/representative-road-junction.png` });
  const representativeCamera = await page.evaluate(() => ({
    mode: window.labIsland.getMode(),
    position: window.labIsland.camera.position.toArray(),
    target: window.labIsland.controls.target.toArray(),
    distance: window.labIsland.camera.position.distanceTo(window.labIsland.controls.target),
  }));

  const exploreProxyAudit = await page.evaluate(() => {
    const roads = [];
    window.labIsland.worldStreaming.vistaRoot.traverse((object) => {
      if (!object.isMesh || object.userData.proxyRoadNetwork !== true || !object.name.includes('__FAR_HLOD_')) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      roads.push({
        name: object.name,
        depthTest: materials.every((material) => material.depthTest === true),
        depthWrite: materials.every((material) => material.depthWrite === true),
      });
    });
    return { count: roads.length, roads };
  });

  const failures = [...audit.failures];
  if (planProxyAudit.count !== 35
    || planProxyAudit.roads.some((road) => !road.depthTest || !road.depthWrite)) {
    failures.push(`Plan HLOD road overlay is incomplete (${planProxyAudit.count}/35 visible)`);
  }
  if (exploreProxyAudit.count !== 35
    || exploreProxyAudit.roads.some((road) => !road.depthTest || !road.depthWrite)) {
    failures.push(`Explore FAR HLOD roads are not depth-occluded (${exploreProxyAudit.count}/35)`);
  }
  if (!dynamicRefreshAudit.available
    || !dynamicRefreshAudit.networkReplaced
    || !dynamicRefreshAudit.routesChanged
    || !dynamicRefreshAudit.proxyReplaced
    || !dynamicRefreshAudit.proxyChanged
    || !dynamicRefreshAudit.vertexCountStable
    || !dynamicRefreshAudit.restored) {
    failures.push('Editable Logistics road metadata/HLOD did not rebuild and restore with its live entrance');
  }
  if (browserErrors.length) failures.push(`${browserErrors.length} browser/page errors`);
  const report = {
    audit,
    dynamicRefreshAudit,
    planProxyAudit,
    exploreProxyAudit,
    representativeCamera,
    browserErrors,
    failures,
  };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  if (failures.length) throw new Error(failures.join('; '));

  console.log(JSON.stringify({
    districts: audit.districtCount,
    routes: audit.totalRoutes,
    ringArterials: audit.arterials.ringCount,
    radialAxisArterials: audit.arterials.radialAxisCount,
    seams: audit.seamCount,
    maximumRadiusGap: audit.maximumRadiusGap,
    maximumYGap: audit.maximumYGap,
    obstacleCollisions: audit.obstacleCollisionCount,
    curbJunctionChecks: audit.ringCurbs.junctionChecks,
    planRoadProxies: planProxyAudit.count,
    dynamicRefresh: dynamicRefreshAudit,
    browserErrors,
  }, null, 2));
} finally {
  await browser.close();
}
