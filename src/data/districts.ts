import { BIOME_PLAN_POSITIONS, PLAN_SCALE_X, PLAN_SCALE_Z } from '../config/island';

/**
 * Declarative plan extracted from YT_LabIsland_Ideas1.png.
 *
 * Coordinates use X for west/east and Z for north/south, with north on negative Z.
 * The source coordinates are unwarped into the exact regular-hex masterplan
 * defined in config/island.ts; one world unit represents ten metres.
 */

export type WorldPosition = readonly [x: number, y: number, z: number];
export type Footprint = readonly [width: number, depth: number];
export type ColorPalette = readonly [base: string, secondary: string, trim: string, glow: string];

export type DistrictCategory =
  | "core"
  | "bioscience"
  | "engineering"
  | "chemistry"
  | "physics"
  | "civic"
  | "commercial"
  | "academic"
  | "security"
  | "environmental"
  | "infrastructure";

export type DistrictRing =
  | "core"
  | "inner"
  | "middle"
  | "outer-middle"
  | "outer"
  | "perimeter";

export interface DistrictDefinition {
  /** Stable key used by selection, persistence, import, and export. */
  id: string;
  /** Clean display name. */
  name: string;
  /** Verbatim sketch label when the display name has been normalized. */
  sourceLabel?: string;
  category: DistrictCategory;
  ring: DistrictRing;
  position: WorldPosition;
  footprint: Footprint;
  /** Representative maximum building height in world units. */
  height: number;
  archetype: string;
  accent: string;
  palette: ColorPalette;
  description: string;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  sourceLabel?: string;
  category: "biome";
  ring: "biome-perimeter";
  position: WorldPosition;
  footprint: Footprint;
  /** Dome apex height in world units. */
  height: number;
  archetype: "geodesic-biome-dome";
  accent: string;
  palette: ColorPalette;
  description: string;
}

const districtBlueprints: readonly DistrictDefinition[] = [
  // Core: the three labels occupy one integrated central arcology complex.
  {
    id: "synthetic-quantum-biosystems",
    name: "Synthetic Quantum Biosystems",
    category: "core",
    ring: "core",
    position: [0, 0, -3.5],
    footprint: [8, 4.5],
    height: 22,
    archetype: "bio-quantum-research-crown",
    accent: "#62F5FF",
    palette: ["#07131C", "#123442", "#8AAAB2", "#62F5FF"],
    description: "A luminous bio-quantum research crown couples living systems laboratories to the island's central computation spine.",
  },
  {
    id: "dark-center-lab-megabuilding",
    name: "Dark Center Lab Megabuilding",
    category: "core",
    ring: "core",
    position: [0, 0, 1.5],
    footprint: [12, 7],
    height: 34,
    archetype: "dark-lab-arcology",
    accent: "#35D8FF",
    palette: ["#03070B", "#0C1822", "#263743", "#35D8FF"],
    description: "The island's tallest landmark is a monolithic black-glass laboratory arcology with a cyan energy spine.",
  },
  {
    id: "corporate-core",
    name: "Corporate Core",
    category: "core",
    ring: "core",
    position: [0, 0, 7.5],
    footprint: [14, 4.5],
    height: 13,
    archetype: "executive-command-campus",
    accent: "#7FD9FF",
    palette: ["#111B24", "#274253", "#B7CBD4", "#7FD9FF"],
    description: "A formal executive and command campus forms the south-facing civic threshold of the central megabuilding.",
  },

  // Inner ring: six molecular and life-science sectors.
  {
    id: "toxicology-labs",
    name: "Toxicology Labs District",
    category: "bioscience",
    ring: "inner",
    position: [-8, 0, -10.5],
    footprint: [9, 6.5],
    height: 12,
    archetype: "sealed-hazard-labs",
    accent: "#E8C84A",
    palette: ["#17201D", "#34483D", "#C5B86A", "#E8C84A"],
    description: "Sealed laboratory blocks, decontamination portals, and visible scrubber stacks signal a tightly controlled toxicology campus.",
  },
  {
    id: "pharmacology-labs",
    name: "Pharmacology Labs District",
    category: "bioscience",
    ring: "inner",
    position: [7, 0, -11],
    footprint: [9, 6.5],
    height: 13,
    archetype: "pharma-research-campus",
    accent: "#8DE8B4",
    palette: ["#10201B", "#275043", "#D3E7DE", "#8DE8B4"],
    description: "Clinical research slabs surround medicinal greenhouses and compact automated compound-handling courts.",
  },
  {
    id: "microbiology-labs",
    name: "Microbiology Labs District",
    sourceLabel: "Micro Bio Labs District",
    category: "bioscience",
    ring: "inner",
    position: [13.5, 0, -2],
    footprint: [8, 7],
    height: 11,
    archetype: "biosafety-lab-cluster",
    accent: "#5EE6A8",
    palette: ["#0D1E19", "#1F4A3B", "#C2DDD2", "#5EE6A8"],
    description: "Sterile biosafety laboratories and glazed culture galleries are grouped around a shared sample-transfer hub.",
  },
  {
    id: "genomics-labs",
    name: "Genomics Labs District",
    category: "bioscience",
    ring: "inner",
    position: [8, 0, 9.5],
    footprint: [9, 6.5],
    height: 12,
    archetype: "sequencing-data-campus",
    accent: "#9A8CFF",
    palette: ["#16142A", "#332C5B", "#CBC5ED", "#9A8CFF"],
    description: "Sequencing halls, sample vaults, and data-rich facades create a precise genomics research campus.",
  },
  {
    id: "proteomics-labs",
    name: "Proteomics Labs District",
    category: "bioscience",
    ring: "inner",
    position: [-8.5, 0, 9],
    footprint: [9, 6.5],
    height: 11,
    archetype: "analytical-wet-lab-campus",
    accent: "#B68CFF",
    palette: ["#1A1327", "#3D2D59", "#D9C8E9", "#B68CFF"],
    description: "Mass-spectrometry suites and modular wet labs share a softly illuminated analytical courtyard.",
  },
  {
    id: "omics-labs",
    name: "OMICS Labs District",
    category: "bioscience",
    ring: "inner",
    position: [-13, 0, -0.5],
    footprint: [8, 7],
    height: 12,
    archetype: "integrated-omics-campus",
    accent: "#6DD9D0",
    palette: ["#0E2221", "#24504E", "#C1E0DD", "#6DD9D0"],
    description: "Linked wet-lab and computation pavilions integrate multi-omics workflows around a shared atrium.",
  },

  // Middle ring: applied laboratory and engineering campuses.
  {
    id: "electronics-microelectronics-labs",
    name: "Electronics & Microelectronics Labs District",
    sourceLabel: "Electronics / Micro EL Labs District",
    category: "engineering",
    ring: "middle",
    position: [-18, 0, -11.5],
    footprint: [10, 7],
    height: 12,
    archetype: "semiconductor-cleanroom-fab",
    accent: "#58C7FF",
    palette: ["#101C26", "#29495D", "#BFCFD8", "#58C7FF"],
    description: "A compact semiconductor fab combines cleanroom boxes, service gantries, and filtered rooftop plant.",
  },
  {
    id: "medical-labs",
    name: "Medical Labs District",
    category: "bioscience",
    ring: "middle",
    position: [17, 0, -11],
    footprint: [10, 7.5],
    height: 14,
    archetype: "medical-research-hospital",
    accent: "#6FE4FF",
    palette: ["#10232A", "#2D5661", "#E4F0F1", "#6FE4FF"],
    description: "A research hospital pairs clinical wings with diagnostic laboratories and a sheltered healing garden.",
  },
  {
    id: "molecular-biology-labs",
    name: "Molecular Biology Labs District",
    sourceLabel: "Mol Bio Labs District",
    category: "bioscience",
    ring: "middle",
    position: [21, 0, -1],
    footprint: [10, 7],
    height: 11,
    archetype: "modular-molecular-labs",
    accent: "#67DFB1",
    palette: ["#11231D", "#2A5747", "#C8E2D8", "#67DFB1"],
    description: "Adaptable molecular laboratories line a transparent central spine for samples, staff, and services.",
  },
  {
    id: "biochemistry-labs",
    name: "Biochemistry Labs District",
    sourceLabel: "Biochem Labs District",
    category: "chemistry",
    ring: "middle",
    position: [18, 0, 10.5],
    footprint: [10, 7],
    height: 12,
    archetype: "bioprocess-lab-campus",
    accent: "#9AD76A",
    palette: ["#182218", "#3B5634", "#D2DFC9", "#9AD76A"],
    description: "Bioprocess laboratories expose stainless fermenters and carefully ordered utility pipework behind glazed screens.",
  },
  {
    id: "computational-biology-labs",
    name: "Computational Biology Labs District",
    sourceLabel: "Comp. Biology Labs District",
    category: "bioscience",
    ring: "middle",
    position: [-18, 0, 10],
    footprint: [10, 7],
    height: 13,
    archetype: "research-data-center",
    accent: "#61BFFF",
    palette: ["#101B2B", "#273F63", "#B9C9DD", "#61BFFF"],
    description: "A high-performance computing campus uses deep facade fins, visible cooling loops, and collaborative analysis rooms.",
  },
  {
    id: "robotics-labs",
    name: "Robotics Labs District",
    category: "engineering",
    ring: "middle",
    position: [-21.5, 0, -0.5],
    footprint: [11, 8],
    height: 12,
    archetype: "robotics-hangar-campus",
    accent: "#FF9D52",
    palette: ["#241B15", "#59412E", "#CFC5B8", "#FF9D52"],
    description: "Assembly hangars open onto fenced outdoor test courts populated by autonomous vehicles and robotic arms.",
  },

  // Outer-middle ring: culture, hospitality, analytics, and restricted research.
  {
    id: "marketing",
    name: "Marketing District",
    sourceLabel: "Marketing",
    category: "commercial",
    ring: "outer-middle",
    position: [-21, 0, -17],
    footprint: [10, 6.5],
    height: 10,
    archetype: "communications-media-pavilion",
    accent: "#FF6FB5",
    palette: ["#251624", "#59334E", "#E1C6D5", "#FF6FB5"],
    description: "A communications pavilion uses media facades, broadcast studios, and flexible public event terraces.",
  },
  {
    id: "scientific-art-labs",
    name: "Scientific Art Labs District",
    category: "civic",
    ring: "outer-middle",
    position: [-28, 0, -12],
    footprint: [11, 8],
    height: 11,
    archetype: "science-art-studio-campus",
    accent: "#FF76D6",
    palette: ["#23182A", "#51375F", "#E4D2E6", "#FF76D6"],
    description: "Sculptural studios, fabrication galleries, and kinetic installations turn research processes into public art.",
  },
  {
    id: "even-hour-hotel",
    name: "Ever Hour Hotel & Guest Scientists District",
    sourceLabel: "Even Hour Hotel / Guest Scientists District",
    category: "civic",
    ring: "outer-middle",
    position: [-30.5, 0, 0],
    footprint: [12, 8],
    height: 14,
    archetype: "research-hotel-conference-campus",
    accent: "#FFB96B",
    palette: ["#2B2119", "#654D37", "#E7D7C5", "#FFB96B"],
    description: "A neon-lit hotel and conference campus provides short-stay apartments, sky lounges, and gardens for visiting scientists.",
  },
  {
    id: "astronomy-astrobiology-labs",
    name: "Astronomy & Astrobiology Labs District",
    sourceLabel: "Astronomy / Astrobiology Labs District",
    category: "physics",
    ring: "outer-middle",
    position: [-27, 0, 14],
    footprint: [11, 8],
    height: 12,
    archetype: "observatory-research-campus",
    accent: "#8A9DFF",
    palette: ["#11162A", "#2D3761", "#C4CAE6", "#8A9DFF"],
    description: "Telescope domes, antenna decks, and sealed planetary greenhouses form a compact observatory campus.",
  },
  {
    id: "secret-labs",
    name: "Secret Labs District",
    category: "security",
    ring: "outer-middle",
    position: [25, 0, -15],
    footprint: [11, 7.5],
    height: 8,
    archetype: "hardened-subterranean-labs",
    accent: "#E34D67",
    palette: ["#170E12", "#382029", "#76656A", "#E34D67"],
    description: "Low-profile hardened structures conceal a deeper laboratory complex behind controlled access courts and sensor fields.",
  },
  {
    id: "bioanalytics-lab",
    name: "Bioanalytics Lab District",
    category: "bioscience",
    ring: "outer-middle",
    position: [30, 0, -1],
    footprint: [11, 8],
    height: 12,
    archetype: "analytical-instrumentation-campus",
    accent: "#52D8CE",
    palette: ["#10211F", "#27534E", "#C6DFDC", "#52D8CE"],
    description: "Glass-fronted instrumentation laboratories surround a secure receiving hall for automated biological sample analysis.",
  },
  {
    id: "organic-chemistry-labs",
    name: "Organic Chemistry Labs District",
    category: "chemistry",
    ring: "outer-middle",
    position: [26, 0, 14],
    footprint: [11, 8],
    height: 12,
    archetype: "organic-chemistry-campus",
    accent: "#B7D84C",
    palette: ["#1D2413", "#46562B", "#D9E0C2", "#B7D84C"],
    description: "Ventilated synthesis laboratories and compact pilot plants are organized around a tanker-safe service court.",
  },

  // Outer ring: housing, heavy research, and island security.
  {
    id: "luxury-entertainment",
    name: "Luxury & Entertainment District",
    sourceLabel: "Luxury / Entertainment",
    category: "commercial",
    ring: "outer",
    position: [-37, 0, -14],
    footprint: [13, 8],
    height: 13,
    archetype: "waterfront-leisure-district",
    accent: "#FF76A9",
    palette: ["#281820", "#614050", "#E8CFD9", "#FF76A9"],
    description: "Terraced restaurants, performance venues, and premium guest suites create a lively waterfront leisure quarter.",
  },
  {
    id: "scientist-residential",
    name: "Scientists' Residential District",
    sourceLabel: "Residential District Scientists",
    category: "civic",
    ring: "outer",
    position: [-40.5, 0, 0],
    footprint: [13, 9],
    height: 12,
    archetype: "modular-residential-campus",
    accent: "#F2B86B",
    palette: ["#282119", "#5E4E39", "#DFD4C5", "#F2B86B"],
    description: "Mid-rise modular homes cluster around shared gardens, childcare, workshops, and a neighborhood greenhouse.",
  },
  {
    id: "materials-science-lab",
    name: "Materials Science Lab District",
    sourceLabel: "Material Science Lab District",
    category: "engineering",
    ring: "outer",
    position: [-36, 0, 15],
    footprint: [13, 9],
    height: 13,
    archetype: "materials-testing-campus",
    accent: "#FF985C",
    palette: ["#241B17", "#574034", "#CFC4B9", "#FF985C"],
    description: "Heavy test halls, furnace blocks, gantry cranes, and outdoor specimen rigs define the materials research campus.",
  },
  {
    id: "security",
    name: "Security District",
    category: "security",
    ring: "outer",
    position: [36, 0, -13],
    footprint: [12, 8],
    height: 14,
    archetype: "island-security-command",
    accent: "#FF555F",
    palette: ["#1C1114", "#45272D", "#918184", "#FF555F"],
    description: "A fortified command center, barracks, checkpoint lanes, and drone pads control the island's eastern approaches.",
  },
  {
    id: "forensic-cyberforensic-lab",
    name: "Forensic & Cyberforensic Lab District",
    sourceLabel: "Forensic / Cyberforensic Lab District",
    category: "security",
    ring: "outer",
    position: [41, 0, 0],
    footprint: [12, 9],
    height: 13,
    archetype: "forensic-cyber-operations-campus",
    accent: "#C47BFF",
    palette: ["#1D1425", "#463156", "#C8BCD1", "#C47BFF"],
    description: "Secure evidence laboratories connect to a shielded cyber-operations tower and controlled vehicle intake bays.",
  },
  {
    id: "inorganic-chemistry",
    name: "Inorganic Chemistry District",
    sourceLabel: "Anorg Chem District",
    category: "chemistry",
    ring: "outer",
    position: [37, 0, 15],
    footprint: [13, 9],
    height: 12,
    archetype: "inorganic-process-campus",
    accent: "#D7A85C",
    palette: ["#251E14", "#57482F", "#D4C8AF", "#D7A85C"],
    description: "Mineral laboratories, ceramics workshops, and high-temperature furnaces frame a rugged sample-storage yard.",
  },

  // Perimeter belt: island-wide support, civic, and large-footprint programs.
  {
    id: "financial-funding",
    name: "Financial & Funding District",
    sourceLabel: "Financial / Funding District",
    category: "commercial",
    ring: "perimeter",
    position: [-29, 0, -26],
    footprint: [14, 8],
    height: 17,
    archetype: "finance-incubator-campus",
    accent: "#65CFFF",
    palette: ["#101C25", "#2A4A5D", "#C7D5DB", "#65CFFF"],
    description: "Slender headquarters and incubator buildings overlook a formal plaza for investors, grants, and venture partnerships.",
  },
  {
    id: "logistics",
    name: "Logistics District",
    sourceLabel: "Logistic District",
    category: "infrastructure",
    ring: "perimeter",
    position: [14, 0, -27],
    footprint: [15, 8],
    height: 10,
    archetype: "automated-logistics-hub",
    accent: "#FFAA55",
    palette: ["#272019", "#5D4832", "#BFB6A9", "#FFAA55"],
    description: "Automated warehouses, cargo drones, loading gantries, and freight lanes feed the bridge and island service network.",
  },
  {
    id: "entry-commercial",
    name: "Entry & Commercial District",
    sourceLabel: "Entry District / Commercial District",
    category: "commercial",
    ring: "perimeter",
    position: [27, 0, -23],
    footprint: [15, 9],
    height: 16,
    archetype: "arrival-commercial-transit-hub",
    accent: "#FF5ACD",
    palette: ["#221527", "#56345F", "#D9C5DD", "#FF5ACD"],
    description: "The bridgehead combines customs, transit, retail, and an illuminated arrival concourse facing the cyberpunk city.",
  },
  {
    id: "environmental-science-labs",
    name: "Environmental Science Labs District",
    category: "environmental",
    ring: "perimeter",
    position: [-51, 0, -1],
    footprint: [14, 10],
    height: 9,
    archetype: "environmental-field-station",
    accent: "#73D47A",
    palette: ["#142318", "#34583A", "#C8DDC9", "#73D47A"],
    description: "Low-impact field laboratories extend into wetlands, sensor gardens, renewable-energy rigs, and coastal monitoring decks.",
  },
  {
    id: "academic-libraries-theoretical-labs",
    name: "Academic District — Libraries & Theoretical Labs",
    sourceLabel: "Academic District Libraries, Theoretical Labs",
    category: "academic",
    ring: "perimeter",
    position: [51, 0, 0],
    footprint: [14, 10],
    height: 15,
    archetype: "library-theory-campus",
    accent: "#8EA6FF",
    palette: ["#151A2B", "#354066", "#D0D4E3", "#8EA6FF"],
    description: "A monumental library anchors lecture halls, quiet cloisters, and daylight-filled institutes for theoretical research.",
  },
  {
    id: "industrial-labs",
    name: "Industrial Labs District",
    sourceLabel: "Industrial District Labs",
    category: "infrastructure",
    ring: "perimeter",
    position: [-29, 0, 28],
    footprint: [16, 9],
    height: 12,
    archetype: "clean-industrial-utility-campus",
    accent: "#F08B45",
    palette: ["#251C16", "#584132", "#BDB5AC", "#F08B45"],
    description: "Fabrication halls, recycling systems, energy plant, and service yards form a clean but visibly industrial campus.",
  },
  {
    id: "particle-physics-labs",
    name: "Particle Physics Labs District",
    sourceLabel: "Particle Physics Labs Districts",
    category: "physics",
    ring: "perimeter",
    position: [26, 0, 29],
    footprint: [16, 9],
    height: 14,
    archetype: "particle-accelerator-campus",
    accent: "#78A7FF",
    palette: ["#11182A", "#304064", "#C5CDDE", "#78A7FF"],
    description: "A mostly buried accelerator feeds a dramatic detector hall, cryogenic plant, and circular service structures above ground.",
  },
];

const biomeBlueprints: readonly BiomeDefinition[] = [
  {
    id: "alpine-dome",
    name: "Alpine Dome",
    category: "biome",
    ring: "biome-perimeter",
    position: [0, 0, -29],
    footprint: [14, 10],
    height: 9,
    archetype: "geodesic-biome-dome",
    accent: "#BDEBFF",
    palette: ["#E7F4F7", "#7895A2", "#3D5661", "#BDEBFF"],
    description: "A crystalline climate dome encloses snowfields, exposed rock, conifers, and a cold alpine research station.",
  },
  {
    id: "tundra-dome",
    name: "Tundra Dome",
    category: "biome",
    ring: "biome-perimeter",
    position: [53, 0, -11],
    footprint: [15, 10],
    height: 8,
    archetype: "geodesic-biome-dome",
    accent: "#A7D9E8",
    palette: ["#DCE9E7", "#819B94", "#445B5B", "#A7D9E8"],
    description: "A cool misted dome preserves permafrost terrain, moss, lichen, low shrubs, and seasonal meltwater pools.",
  },
  {
    id: "desert-dome",
    name: "Desert Dome",
    sourceLabel: "Dessert Dome",
    category: "biome",
    ring: "biome-perimeter",
    position: [53, 0, 18],
    footprint: [15, 11],
    height: 8,
    archetype: "geodesic-biome-dome",
    accent: "#FFB45E",
    palette: ["#D8A35E", "#9C6238", "#4E3124", "#FFB45E"],
    description: "A heat-controlled dome contains layered dunes, eroded stone, sparse xerophytes, and integrated solar research arrays.",
  },
  {
    id: "savanna-dome",
    name: "Savanna Dome",
    category: "biome",
    ring: "biome-perimeter",
    position: [0, 0, 34],
    footprint: [14, 10],
    height: 8,
    archetype: "geodesic-biome-dome",
    accent: "#E7C75A",
    palette: ["#B99A45", "#6B7138", "#344327", "#E7C75A"],
    description: "Golden grasses, acacias, weathered stone, and a compact water hole create a warm savanna ecosystem.",
  },
  {
    id: "temperate-deciduous-forest-dome",
    name: "Temperate Deciduous Forest Dome",
    sourceLabel: "Temperate deciduous forest Dome",
    category: "biome",
    ring: "biome-perimeter",
    position: [-53, 0, 18],
    footprint: [15, 11],
    height: 9,
    archetype: "geodesic-biome-dome",
    accent: "#E28D4F",
    palette: ["#7F923F", "#A75F37", "#3D4C2C", "#E28D4F"],
    description: "A seasonal woodland dome layers broadleaf trees, shaded understory, streams, and autumn-toned research plots.",
  },
  {
    id: "tropical-rainforest-dome",
    name: "Tropical Rainforest Dome",
    sourceLabel: "Tropical rain forest Dome",
    category: "biome",
    ring: "biome-perimeter",
    position: [-53, 0, -11],
    footprint: [15, 11],
    height: 10,
    archetype: "geodesic-biome-dome",
    accent: "#54E58A",
    palette: ["#1E6D43", "#17462F", "#0B2C20", "#54E58A"],
    description: "Dense layered canopy, hanging vines, mist, wetlands, and a small waterfall fill the humid rainforest dome.",
  },
];

const ringTargetRadius: Partial<Record<DistrictRing, number>> = {
  inner: 52.5,
  middle: 75.6,
  'outer-middle': 104.1,
  outer: 137.1,
  perimeter: 190,
};

export const districts: readonly DistrictDefinition[] = districtBlueprints.map((definition) => {
  let x = definition.position[0] * PLAN_SCALE_X;
  let z = definition.position[2] * PLAN_SCALE_Z;
  const targetRadius = ringTargetRadius[definition.ring];
  const currentRadius = Math.hypot(x, z);
  if (targetRadius && currentRadius > 0.001) {
    const radialScale = targetRadius / currentRadius;
    x *= radialScale;
    z *= radialScale;
  }
  // The three central programs stay compact inside the new 420 m plaza.
  if (definition.id === 'corporate-core') z = 12.8;
  return {
    ...definition,
    position: [x, definition.position[1], z] as const,
  };
});

export const biomes: readonly BiomeDefinition[] = biomeBlueprints.map((definition) => {
  const domeScale = 2.15;
  const [x, z] = BIOME_PLAN_POSITIONS[definition.id] ?? [
    definition.position[0] * PLAN_SCALE_X,
    definition.position[2] * PLAN_SCALE_Z,
  ];
  return {
    ...definition,
    position: [x, definition.position[1], z] as const,
    footprint: [definition.footprint[0] * domeScale, definition.footprint[0] * domeScale] as const,
    height: definition.height * domeScale,
  };
});
