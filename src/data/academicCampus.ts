/**
 * Editable source of truth for the Academic District.
 * Locations are expressed in district-local campus axes: tangent runs across
 * the road-bounded wedge and radial runs from the island centre to the coast.
 */
export type AcademicInteriorKind = 'library-entrance' | 'dining-hall' | 'chapel-nave';

export interface AcademicCampusBuilding {
  readonly id: string;
  readonly name: string;
  readonly founded: number;
  readonly zone: string;
  readonly kind: string;
  readonly description: string;
  readonly history: string;
  readonly location: readonly [tangent: number, radial: number];
  readonly footprint: readonly [width: number, depth: number];
  readonly height: number;
  readonly interior?: AcademicInteriorKind;
  readonly existing?: boolean;
  readonly landmark?: boolean;
}

export const ACADEMIC_CAMPUS_BUILDINGS: readonly AcademicCampusBuilding[] = [
  {
    id: 'blackwood-great-hall',
    name: 'Blackwood University Great Hall',
    founded: 1428,
    zone: 'Grand Central Quadrangle',
    kind: 'university',
    description: 'The clock-towered ceremonial heart of Blackwood University.',
    history: 'The hall began as a collegiate refectory and acquired its Baroque clock stage after the fire of 1739. Its worn steps still carry the shallow grooves left by six centuries of formal processions.',
    location: [0, 0],
    footprint: [11.8, 7.6],
    height: 5.1,
    existing: true,
    landmark: true,
  },
  {
    id: 'ashcroft-grand-library',
    name: 'Ashcroft Grand Library',
    founded: 1512,
    zone: 'Library Court',
    kind: 'library',
    description: 'A monumental library of lancet windows, deep buttresses, and amber reading rooms.',
    history: 'Ashcroft was built around the bequest of jurist Eleanor Vale and enlarged during the Victorian catalogue reforms. Its north stair was deliberately worn into a shallow central channel by generations of readers.',
    location: [-21, -15],
    footprint: [12.8, 8.5],
    height: 4.8,
    interior: 'library-entrance',
    existing: true,
    landmark: true,
  },
  {
    id: 'wren-rare-books',
    name: 'Wren Rare Books Library',
    founded: 1664,
    zone: 'Library Court',
    kind: 'library',
    description: 'A guarded rare-books range linked to Ashcroft by an upper stone bridge.',
    history: 'The Wren range was added after the Restoration to house manuscripts removed from damp college cellars. Its narrow archive windows and copper fire doors reflect a cautious 1911 renovation.',
    location: [20, -18],
    footprint: [10.4, 7.2],
    height: 4.4,
    existing: true,
  },
  {
    id: 'institute-theoretical-sciences',
    name: 'Institute for Theoretical Sciences',
    founded: 1876,
    zone: 'Old Science Court',
    kind: 'university',
    description: 'A high collegiate range for mathematics, astronomy, and natural philosophy.',
    history: 'The institute united Blackwood\'s scattered mathematical chairs under one roof during the university reforms. Brass meridian lines in the entrance floor still align with the old observatory slit.',
    location: [-26, 12],
    footprint: [11.8, 8],
    height: 5.1,
    existing: true,
    landmark: true,
  },
  {
    id: 'blackwood-lecture-hall',
    name: 'Blackwood Collegiate Lecture Hall',
    founded: 1893,
    zone: 'Humanities Close',
    kind: 'university',
    description: 'A steep-roofed lecture hall lined with memorial niches and faculty rooms.',
    history: 'This late collegiate-Gothic hall replaced three cramped tutorial houses while retaining their medieval foundations. The newer east masonry is intentionally paler where bomb damage was repaired in 1948.',
    location: [24, 15],
    footprint: [13, 8.8],
    height: 4.6,
    existing: true,
  },
  {
    id: 'scholars-cloister-archive',
    name: 'Scholars Cloister and Archive',
    founded: 1479,
    zone: 'Grand Central Quadrangle',
    kind: 'archive',
    description: 'A quiet cloister concealing the university archive behind an iron-bound oak door.',
    history: 'The cloister joined two early colleges and later absorbed their muniment rooms. One blocked arch bears chalk survey marks from an abandoned wartime tunnel proposal.',
    location: [2, 24],
    footprint: [11, 7.5],
    height: 3.8,
    existing: true,
  },
  {
    id: 'st-anselm-chapel',
    name: 'St Anselm Chapel',
    founded: 1441,
    zone: 'Chapel Close',
    kind: 'chapel',
    description: 'A narrow Gothic chapel, bell tower, candlelit nave, and weathered stone graveyard.',
    history: 'St Anselm began as the private chapel of the first college and survived two proposed demolitions. Its uneven south wall follows an older boundary whose stones are visible beneath the choir stalls.',
    location: [-44, 9],
    footprint: [7.2, 14.5],
    height: 5.2,
    interior: 'chapel-nave',
    landmark: true,
  },
  {
    id: 'erasmus-humanities-hall',
    name: 'Erasmus Humanities Hall',
    founded: 1588,
    zone: 'Humanities Close',
    kind: 'humanities',
    description: 'An irregular teaching range assembled from medieval, Georgian, and Victorian phases.',
    history: 'Erasmus Hall grew by annexing three scholars\' houses, leaving stairs and floor levels charmingly misaligned. Busts of fictional poets and historians occupy niches added during the 1862 facade campaign.',
    location: [-42, -16],
    footprint: [16.5, 7.5],
    height: 4.3,
  },
  {
    id: 'halley-observatory',
    name: 'Halley Observatory',
    founded: 1784,
    zone: 'Old Science Court',
    kind: 'observatory',
    description: 'A circular observing tower beneath a weathered copper dome.',
    history: 'The observatory was financed by a maritime almanac subscription and once set the town\'s public clocks. Its original transit instrument remains visible through the narrow meridian window.',
    location: [40, 25],
    footprint: [8.5, 8.5],
    height: 6.4,
    landmark: true,
  },
  {
    id: 'faraday-physics-building',
    name: 'Faraday Natural Philosophy Building',
    founded: 1859,
    zone: 'Old Science Court',
    kind: 'science',
    description: 'A severe Victorian laboratory block with narrow windows and carved scientific emblems.',
    history: 'Faraday House introduced purpose-built teaching laboratories, vibration tables, and a basement battery room. Later copper drainpipes mark the route of a still-functioning rainwater cooling circuit.',
    location: [45, 7],
    footprint: [13.5, 7.4],
    height: 4.5,
  },
  {
    id: 'founders-dining-hall',
    name: 'Founders Dining Hall',
    founded: 1536,
    zone: 'Second Court',
    kind: 'dining',
    description: 'A ceremonial timber-roofed hall with a busy kitchen wing and tall smoking chimneys.',
    history: 'The hall was raised when the university adopted common dining and still displays the founders\' fictional portraits. A restrained Baroque entrance was fitted in 1718 without replacing the medieval hammerbeam roof.',
    location: [-23, 37],
    footprint: [15.5, 8.6],
    height: 5,
    interior: 'dining-hall',
    landmark: true,
  },
  {
    id: 'marlowe-residences',
    name: 'Marlowe Student Residences',
    founded: 1907,
    zone: 'Marlowe Courts',
    kind: 'residence',
    description: 'Interconnected residence ranges enclosing two intimate, bicycle-filled courts.',
    history: 'Marlowe was planned as a reforming residential college with daylight in every study. Students have softened its disciplined window rhythm with bicycles, laundry, potted herbs, and erratically lit rooms.',
    location: [43, -36],
    footprint: [18, 10.5],
    height: 4.2,
  },
  {
    id: 'north-service-yard',
    name: 'North Service and Boiler Court',
    founded: 1926,
    zone: 'Service Quarter',
    kind: 'service',
    description: 'A functional back court of boiler house, coal doors, maintenance sheds, and deliveries.',
    history: 'The service court consolidated kitchens, heating, and workshops behind the ceremonial campus frontage. Its soot-dark brick and chalked maintenance door remain deliberately unpolished.',
    location: [-45, -37],
    footprint: [13.5, 7.5],
    height: 3.4,
  },
  {
    id: 'blackwater-boathouse',
    name: 'Blackwater Rowing House',
    founded: 1882,
    zone: 'Canal Edge',
    kind: 'boathouse',
    description: 'A low slate-roofed rowing shed set into the misty stone embankment.',
    history: 'The rowing house occupies a former university granary beside the Blackwater Canal. Moss-covered steps record earlier water levels, while repaired doors bear the colours of defunct college crews.',
    location: [5, 48],
    footprint: [9.5, 5.8],
    height: 3.2,
  },
] as const;

export const ACADEMIC_CAMPUS_HIDDEN_DETAILS = [
  'Locked archive door',
  'Broken scholar statue with concealed inscription',
  'Narrow passage called Rook Alley',
  'Faintly lit basement map room',
  'Forgotten plague court',
  'Blocked tunnel entrance',
  'Oxidized rooftop weather vane',
  'One occupied fellows office',
  'Raven on the chapel parapet',
  'Chalk markings on the boiler-house door',
] as const;

export const ACADEMIC_WEATHER_PRESETS = [
  { id: 'academic-autumn', label: 'Late-autumn after rain' },
  { id: 'academic-overcast', label: 'Overcast afternoon' },
  { id: 'academic-rainy-dusk', label: 'Rainy dusk' },
  { id: 'academic-foggy-night', label: 'Foggy night' },
] as const;

export const academicCampusBuildingByName = new Map(
  ACADEMIC_CAMPUS_BUILDINGS.map((building) => [building.name, building]),
);

export const academicCampusBuildingById = new Map(
  ACADEMIC_CAMPUS_BUILDINGS.map((building) => [building.id, building]),
);
