import {
  BIOME_PLAN_POSITIONS,
  BIOME_RING_RADIUS,
  DISTRICT_ROAD_RADII,
  MASTERPLAN_RESCALE,
  PLAN_SCALE_X,
  PLAN_SCALE_Z,
} from '../config/island';

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

export interface DistrictSectorDefinition {
  /** Inner/outer concentric-road boundaries in world units. */
  innerRadius: number;
  outerRadius: number;
  /** Counter-clockwise polar bearings in radians; endAngle is always greater. */
  startAngle: number;
  endAngle: number;
  centerAngle: number;
  sectorIndex: number;
  sectorCount: number;
  /** Multiple named campuses may share one of the six road-bounded wedges. */
  sharedCellIndex: number;
  sharedCellCount: number;
  /** The only visible delimiters are the shared ring roads and six dome spokes. */
  delimiterModel: 'shared-ring-roads-and-six-spokes';
  areaWorldUnitsSquared: number;
}

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
  /** Populated on the exported, masterplan-scaled definitions. */
  sector?: DistrictSectorDefinition;
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
    archetype: "dose-mechanism-countermeasure-campus",
    accent: "#FFD28A",
    palette: ["#101619", "#303438", "#C8C8BF", "#E2E1D8"],
    description: "Five instrument-like institutes sequence exposure detection, human microphysiology, causal modelling, persistent-contaminant containment, and rapid countermeasures along the Dose-Response Promenade.",
  },
  {
    id: "pharmacology-labs",
    name: "Pharmacology Labs District",
    category: "bioscience",
    ring: "inner",
    position: [7, 0, -11],
    footprint: [9, 6.5],
    height: 13,
    archetype: "therapeutic-gradient-pharmacology-campus",
    accent: "#A8FFD1",
    palette: ["#101517", "#AEB9B8", "#ECE9DF", "#A8FFD1"],
    description: "The Therapeutic Gradient turns molecular docking, induced proximity, encoded medicines, membrane delivery, and concentration-time control into five instrument-like landmarks along the Dose-Response Promenade.",
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
    archetype: "microbial-systems-research-landscape",
    accent: "#72F2D0",
    palette: ["#10191B", "#577B78", "#E7ECE7", "#72F2D0"],
    description: "Five research landmarks translate phage conflict, symbiotic communities, fermentation, extreme life, and planetary surveillance into an interconnected microbial landscape.",
  },
  {
    id: "genomics-labs",
    name: "Genomics Labs District",
    category: "bioscience",
    ring: "inner",
    position: [8, 0, 9.5],
    footprint: [9, 6.5],
    height: 12,
    archetype: "genomic-code-landscape",
    accent: "#B7F4FF",
    palette: ["#090D12", "#87969B", "#ECEDE8", "#B7F4FF"],
    description: "Five genomic landmarks translate pangenome graphs, long reads, spatial mosaics, chromosome writing, and regulatory-variant networks into a shared basalt, pearl ceramic, titanium, and electrochromic-glass district.",
  },
  {
    id: "proteomics-labs",
    name: "Proteomics Labs District",
    category: "bioscience",
    ring: "inner",
    position: [-8.5, 0, 9],
    footprint: [9, 6.5],
    height: 11,
    archetype: "folded-proteome-landscape",
    accent: "#B68CFF",
    palette: ["#1A1327", "#3D2D59", "#D9C8E9", "#B68CFF"],
    description: "Five proteomic landmarks translate single-cell measurement, tissue cartography, intact proteoforms, interaction networks, and experimental protein reading into folds, cavities, nodes, and porous membranes.",
  },
  {
    id: "omics-labs",
    name: "Omics Labs District",
    category: "bioscience",
    ring: "inner",
    position: [-13, 0, -0.5],
    footprint: [8, 7],
    height: 12,
    archetype: "causal-contextual-pan-omics-landscape",
    accent: "#6DD9D0",
    palette: ["#10171A", "#A5AFAD", "#E9E6D9", "#6DD9D0"],
    description: "Five integrated-omics landmarks map living systems, perturb their causes, expose them to environmental context, measure molecular flux, and converge longitudinal evidence into biological digital twins.",
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
    archetype: "signal-spine-semiconductor-ecosystem",
    accent: "#8FEAFF",
    palette: ["#101719", "#8B593E", "#D9D8D0", "#8FEAFF"],
    description: "Ten device-scale landmarks progress from soft bioelectronics and in-sensor computing through photonics, neuromorphic and spintronic systems to hybrid-bonded chiplets, stacked logic, cryogenic control, wide-bandgap power, and terahertz metrology along the Signal Spine.",
  },
  {
    id: "medical-labs",
    name: "Medical Labs District",
    category: "bioscience",
    ring: "middle",
    position: [17, 0, -11],
    footprint: [10, 7.5],
    height: 15,
    archetype: "anatomical-crescent-medical-research-city",
    accent: "#6FE4FF",
    palette: ["#0C1012", "#A8B1B1", "#E8E5DC", "#6FE4FF"],
    description: "The Anatomical Crescent enlarges diagnostic instruments into an urban quarter, progressing from spatial disease observation and molecular diagnosis to experimental treatment and protected clinical translation.",
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
    archetype: "distributed-molecular-machines-campus",
    accent: "#72F2CE",
    palette: ["#101619", "#263238", "#E7E9E4", "#72F2CE"],
    description: "Ten molecular landmarks translate synthetic genomes, alternative biochemistry, protocells, epigenetic memory, organelle integration, biological computation, directed evolution, signalling gradients, extraterrestrial systems, and deep-time preservation into one distributed research circuit.",
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
    archetype: "reaction-gradient-biochemistry-campus",
    accent: "#B7F778",
    palette: ["#101417", "#59646D", "#E7E8E1", "#B7F778"],
    description: "Ten molecular landmarks progress from generative protein architecture and native molecular observation through synthetic cells, enzyme evolution, phase behaviour, glycoprofiling, proteostasis, ultrafast catalysis, and programmable cell-free metabolism.",
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
    archetype: "inference-spine-computational-biology-campus",
    accent: "#61BFFF",
    palette: ["#101B2B", "#273F63", "#B9C9DD", "#61BFFF"],
    description: "Ten frontier-research landmarks progress from virtual cells, causal perturbation and generative biomolecules through graph genomes, spatial tissues, regulatory grammar, immune recognition, dynamics, evolution and predictive biological digital twins.",
  },
  {
    id: "robotics-labs",
    name: "Robotics Labs District",
    category: "engineering",
    ring: "middle",
    position: [-21.5, 0, -0.5],
    footprint: [11, 8],
    height: 18,
    archetype: "kinematic-walk-advanced-robotics-campus",
    accent: "#6DE0E2",
    palette: ["#151B1E", "#676B6B", "#DEDDD5", "#6DE0E2"],
    description: "Ten behaviorally expressive robotics institutes turn embodied intelligence, dexterity, soft and biohybrid machines, swarms, microrobotics, telepresence, disaster response, construction, and self-repair into one active machine-test district along the Kinematic Walk.",
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
    description: "The outward-facing half of the Scientific Art and Marketing translation district contains seven civic media institutions along the Spectrum Spine, using directional integrated media, restrained signal lighting, and public evidence infrastructure.",
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
    description: "The inward-facing half of the Scientific Art and Marketing translation district contains eight experimental institutes along the Spectrum Spine, turning scientific knowledge into images, objects, sound, living displays, light, materials, and abstraction.",
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
    archetype: "ever-hour-live-work-visit-campus",
    accent: "#FFB96B",
    palette: ["#2B2119", "#654D37", "#E7D7C5", "#FFB96B"],
    description: "Twenty-three guest, conference, bookable-laboratory, aquatic, dining, transit, and nonstop-retail facilities center on the monumental Ever Hour flagship hotel and stay visibly awake along the covered Continuum Walk while shielded southern edges protect Astronomy's dark sky.",
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
    description: "Fifteen dark-sky facilities progress from precision astronomy and planetary defense through exoplanet science to ocean worlds, origins-of-life research, and experimental astrobiology along the Ecliptic Walk.",
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
    name: "Bioanalytics Labs District",
    category: "bioscience",
    ring: "outer-middle",
    position: [30, 0, -1],
    footprint: [11, 8],
    height: 12,
    archetype: "analytical-instrumentation-campus",
    accent: "#52D8CE",
    palette: ["#10211F", "#27534E", "#C6DFDC", "#52D8CE"],
    description: "Instrument-scale prisms, detector arrays, flow cells, columns and microscope forms convert biological samples into calibrated images, spectra, sequences and mechanical profiles.",
  },
  {
    id: "organic-chemistry-labs",
    name: "Organic Chemistry Labs District",
    category: "chemistry",
    ring: "outer-middle",
    position: [26, 0, 14],
    footprint: [11, 8],
    height: 12,
    archetype: "molecular-synthesis-quarter",
    accent: "#D59BFF",
    palette: ["#101417", "#343C43", "#E9E9E2", "#D59BFF"],
    description: "Ten molecular landmarks follow the curved Synthesis Arc from selective bond activation and skeletal editing through autonomous synthesis, molecular machines, programmable photonics, natural-product chemical space, and circular carbon reforging.",
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
    archetype: "inhabited-scientist-neighborhood",
    accent: "#55F4FF",
    palette: ["#080713", "#321747", "#55F4FF", "#FF5EDB"],
    description: "Thirty-six permanent-home, civic, wellness, workshop, medical, childcare, and huge scientist-apartment facilities form an organic cyberpunk neighborhood whose northwestern edge pocket remains entirely inside the Residential sector and glows in cyan, magenta, and violet neon.",
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
    archetype: "matter-crescent-materials-masterplan",
    accent: "#A9E8F2",
    palette: ["#12191D", "#394148", "#D5D3C9", "#A9E8F2"],
    description: "The Matter Crescent arrays fifteen autonomous-discovery, quantum, alloy, ceramic, ionic, photonic, porous, living, adaptive, additive, circular, and atom-resolved research facilities as a physical catalogue of possible matter.",
  },
  {
    id: "security",
    name: "Security District",
    category: "security",
    ring: "outer",
    position: [36, 0, -13],
    footprint: [12, 8],
    height: 14,
    archetype: "aegis-arc-security-masterplan",
    accent: "#8EDCF0",
    palette: ["#11191D", "#35454A", "#DCE6E4", "#8EDCF0"],
    description: "The Aegis Arc layers fifteen shield-like command, response, biosecurity, cyberdefense, evidence, mobility, autonomous patrol, and perimeter facilities along the island's eastern curved roads.",
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
    archetype: "persistent-signature-forensic-masterplan",
    accent: "#FFC675",
    palette: ["#080B0E", "#303B40", "#E5E8E5", "#FFC675"],
    description: "Fifteen forensic and cyberforensic institutes form one analytical system along the Evidence Line and its elevated sealed Chainline courier, progressing from biological traces and material residues to hardware, networks, synthetic media, cryptographic archives, and cyber-physical reconstruction.",
  },
  {
    id: "inorganic-chemistry",
    name: "Inorganic Chemistry Labs District",
    sourceLabel: "Anorg Chem District",
    category: "chemistry",
    ring: "outer",
    position: [37, 0, 15],
    footprint: [13, 9],
    height: 12,
    archetype: "mineral-lattice-inorganic-campus",
    accent: "#D7A85C",
    palette: ["#11171A", "#40505A", "#DDD4C2", "#D7A85C"],
    description: "Fifteen inorganic chemistry laboratories form a mineral-lattice research landscape along Valence Avenue, spanning crystal discovery, atomically dispersed catalysis, solid electrolytes, porous frameworks, solar fuels, f-block containment, rare-earth refining, quantum oxides, megabar synthesis, molten salts, biominerals, and carbon mineralization.",
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
    description: "A controlled northern freight and airfield belt links parking, passenger aviation, tower operations, aircraft maintenance, cargo inspection, cold-chain distribution, and ground-fleet service without crossing the public arrival plaza.",
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
    description: "A city-facing bridgehead sequences visitors through the island gate, Welcome Hall, transit pavilion, commercial galleria, evening quarter, hotel, market, science showcase, water taxi, and orientation landmark.",
  },
  {
    id: "environmental-science-labs",
    name: "Environmental Science Labs District",
    category: "environmental",
    ring: "perimeter",
    position: [-51, 0, -1],
    footprint: [14, 10],
    height: 11,
    archetype: "living-transect-instrument-campus",
    accent: "#73D47A",
    palette: ["#14201E", "#394D48", "#D6D8D0", "#73D47A"],
    description: "The Living Transect links ten instrument-like institutes from a coastal exchange pier through atmosphere, water, soil, ecosystems, contaminants, carbon, adaptation, field robotics, and an integrated planetary model.",
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
    accent: "#C6A56B",
    palette: ["#171311", "#4A3028", "#A08D70", "#D7B975"],
    description: "A dark-academia university precinct of umber-brick libraries, collegiate halls, slate roofs, cloisters, quadrangles, and quiet scholarly parks.",
  },
  {
    id: "industrial-labs",
    name: "Industrial Labs District",
    sourceLabel: "Industrial District Labs",
    category: "infrastructure",
    ring: "perimeter",
    position: [-29, 0, 28],
    footprint: [30, 18],
    height: 12,
    archetype: "classified-continuous-production-landscape",
    accent: "#C4783B",
    palette: ["#182126", "#485052", "#9AA09D", "#C4783B"],
    description: "Fifteen classified production facilities form one continuous machine landscape of assembly halls, foundries, vacuum vessels, fabrication yards, freight platforms, process power, reclamation systems, and unexplained reserve manufacturing; the earlier evacuated works survives as a relocated legacy annex.",
  },
  {
    id: "particle-physics-labs",
    name: "Particle Physics Labs District",
    sourceLabel: "Particle Physics Labs Districts",
    category: "physics",
    ring: "perimeter",
    position: [26, 0, 29],
    footprint: [27, 21.5],
    height: 11.6,
    archetype: "event-field-particle-physics-campus",
    accent: "#78A7FF",
    palette: ["#10161B", "#323C43", "#DDE1DE", "#78A7FF"],
    description: "Fifteen surface institutes translate detector layers, event tracks, symmetry breaking, interference, probability fields, and scientific data into architecture around a symbolic convention ring and fortified Data Coast.",
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
    description: "A layered tropical canopy frames a tall waterfall, winding wetland stream, elevated visitor walk, smart-glass nursery, and raised research station beneath active climate-control rings.",
  },
];

const ringTargetRadius: Partial<Record<DistrictRing, number>> = {
  inner: 52.5 * MASTERPLAN_RESCALE,
  middle: 75.6 * MASTERPLAN_RESCALE,
  'outer-middle': 104.1 * MASTERPLAN_RESCALE,
  outer: 137.1 * MASTERPLAN_RESCALE,
  perimeter: 190 * MASTERPLAN_RESCALE,
};

const positionedDistricts: readonly DistrictDefinition[] = districtBlueprints.map((definition) => {
  let x = definition.position[0] * PLAN_SCALE_X * MASTERPLAN_RESCALE;
  let z = definition.position[2] * PLAN_SCALE_Z * MASTERPLAN_RESCALE;
  const targetRadius = ringTargetRadius[definition.ring];
  const currentRadius = Math.hypot(x, z);
  if (targetRadius && currentRadius > 0.001) {
    const radialScale = targetRadius / currentRadius;
    x *= radialScale;
    z *= radialScale;
  }
  // The three central programs preserve their relative placement inside the
  // correspondingly enlarged central plaza while retaining human-size shells.
  if (definition.id === 'corporate-core') z = 12.8 * MASTERPLAN_RESCALE;
  return {
    ...definition,
    position: [x, definition.position[1], z] as const,
  };
});

const TAU = Math.PI * 2;
const DISTRICT_WEDGE_COUNT = 6;
const DISTRICT_WEDGE_SPAN = TAU / DISTRICT_WEDGE_COUNT;
const normalizeAngle = (angle: number) => ((angle % TAU) + TAU) % TAU;
const signedAngleDelta = (angle: number, reference: number) => Math.atan2(
  Math.sin(angle - reference),
  Math.cos(angle - reference),
);
const ringRadialBounds: Readonly<Record<DistrictRing, readonly [number, number]>> = {
  core: [0, DISTRICT_ROAD_RADII[0]],
  inner: [DISTRICT_ROAD_RADII[0], DISTRICT_ROAD_RADII[1]],
  middle: [DISTRICT_ROAD_RADII[1], DISTRICT_ROAD_RADII[2]],
  'outer-middle': [DISTRICT_ROAD_RADII[2], DISTRICT_ROAD_RADII[3]],
  outer: [DISTRICT_ROAD_RADII[3], DISTRICT_ROAD_RADII[4]],
  // Preserve a clear service belt between the populated perimeter and biome domes.
  perimeter: [DISTRICT_ROAD_RADII[4], BIOME_RING_RADIUS - 40],
};

// The three central programs share one arcology, but their surrounding public,
// research, and command campuses still occupy explicit thirds of the core.
const coreSectorAngles: Readonly<Record<string, number>> = {
  'synthetic-quantum-biosystems': normalizeAngle(-Math.PI / 2),
  'dark-center-lab-megabuilding': normalizeAngle(Math.PI / 6),
  'corporate-core': normalizeAngle((5 * Math.PI) / 6),
};

const sectorById = new Map<string, DistrictSectorDefinition>();
const recenteredPositionById = new Map<string, WorldPosition>();
const ringOrder: readonly DistrictRing[] = ['core', 'inner', 'middle', 'outer-middle', 'outer', 'perimeter'];

ringOrder.forEach((ring) => {
  const ringDistricts = positionedDistricts
    .filter((definition) => definition.ring === ring)
    .map((definition) => ({
      definition,
      angle: ring === 'core'
        ? coreSectorAngles[definition.id]
        : normalizeAngle(Math.atan2(definition.position[2], definition.position[0])),
    }))
    .sort((left, right) => left.angle - right.angle);

  const [innerRadius, outerRadius] = ringRadialBounds[ring];
  if (ring === 'core') {
    ringDistricts.forEach(({ definition, angle }, index) => {
      const previous = index === 0
        ? ringDistricts[ringDistricts.length - 1].angle - TAU
        : ringDistricts[index - 1].angle;
      const next = index === ringDistricts.length - 1
        ? ringDistricts[0].angle + TAU
        : ringDistricts[index + 1].angle;
      const startAngle = (previous + angle) * 0.5;
      const endAngle = (angle + next) * 0.5;
      sectorById.set(definition.id, {
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        centerAngle: (startAngle + endAngle) * 0.5,
        sectorIndex: index,
        sectorCount: ringDistricts.length,
        sharedCellIndex: 0,
        sharedCellCount: 1,
        delimiterModel: 'shared-ring-roads-and-six-spokes',
        areaWorldUnitsSquared: 0.5 * (outerRadius ** 2 - innerRadius ** 2) * (endAngle - startAngle),
      });
      recenteredPositionById.set(definition.id, definition.position);
    });
    return;
  }

  const wedgeGroups = new Map<number, typeof ringDistricts>();
  const sixDistrictSequence = ringDistricts.length === DISTRICT_WEDGE_COUNT
    ? (() => {
        const zeroIndex = ringDistricts.reduce((bestIndex, entry, index) => (
          Math.abs(signedAngleDelta(entry.angle, 0)) < Math.abs(signedAngleDelta(ringDistricts[bestIndex].angle, 0))
            ? index
            : bestIndex
        ), 0);
        return [...ringDistricts.slice(zeroIndex), ...ringDistricts.slice(0, zeroIndex)];
      })()
    : null;
  ringDistricts.forEach((entry) => {
    const wedgeIndex = sixDistrictSequence
      ? sixDistrictSequence.indexOf(entry)
      : Math.round(normalizeAngle(entry.angle) / DISTRICT_WEDGE_SPAN) % DISTRICT_WEDGE_COUNT;
    const entries = wedgeGroups.get(wedgeIndex) ?? [];
    entries.push(entry);
    wedgeGroups.set(wedgeIndex, entries);
  });

  wedgeGroups.forEach((entries, wedgeIndex) => {
    const centerAngle = wedgeIndex * DISTRICT_WEDGE_SPAN;
    const ordered = [...entries].sort(
      (left, right) => signedAngleDelta(left.angle, centerAngle) - signedAngleDelta(right.angle, centerAngle),
    );
    ordered.forEach(({ definition }, sharedCellIndex) => {
      const sharedOffset = sharedCellIndex - (ordered.length - 1) * 0.5;
      const campusAngle = centerAngle + sharedOffset * DISTRICT_WEDGE_SPAN * 0.18;
      const campusRadius = (innerRadius + outerRadius) * 0.5
        + sharedOffset * (outerRadius - innerRadius) * 0.1;
      const startAngle = centerAngle - DISTRICT_WEDGE_SPAN * 0.5;
      const endAngle = centerAngle + DISTRICT_WEDGE_SPAN * 0.5;
      recenteredPositionById.set(definition.id, [
        Math.cos(campusAngle) * campusRadius,
        definition.position[1],
        Math.sin(campusAngle) * campusRadius,
      ]);
      sectorById.set(definition.id, {
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        centerAngle,
        sectorIndex: wedgeIndex,
        sectorCount: DISTRICT_WEDGE_COUNT,
        sharedCellIndex,
        sharedCellCount: ordered.length,
        delimiterModel: 'shared-ring-roads-and-six-spokes',
        areaWorldUnitsSquared: 0.5 * (outerRadius ** 2 - innerRadius ** 2) * DISTRICT_WEDGE_SPAN,
      });
    });
  });
});

export const districts: readonly DistrictDefinition[] = positionedDistricts.map((definition) => ({
  ...definition,
  position: recenteredPositionById.get(definition.id) ?? definition.position,
  sector: sectorById.get(definition.id),
}));

export const districtSectors: Readonly<Record<string, DistrictSectorDefinition>> = Object.fromEntries(
  districts.map((definition) => [definition.id, definition.sector!]),
);

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
