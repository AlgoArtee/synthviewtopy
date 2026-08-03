/**
 * Semantic campus-program data used to populate each masterplan district.
 *
 * The vocabulary is intentionally finite so the procedural world builder can
 * map every entry to a deterministic architectural or prop generator while the
 * human-facing names preserve each district's specific scientific identity.
 */

export const CAMPUS_FACILITY_FORMS = [
  'arcology',
  'tower',
  'lab-block',
  'pavilion',
  'hall',
  'greenhouse',
  'utility-plant',
  'hangar',
  'residential-block',
  'hotel',
  'library',
  'transit-hub',
  'warehouse',
  'subterranean-bunker',
  'observatory',
  'hospital',
  'studio',
  'detector-hall',
  'administration',
  'service-building',
] as const;

export type CampusFacilityForm = (typeof CAMPUS_FACILITY_FORMS)[number];

export const CAMPUS_OBJECT_KINDS = [
  'instrument',
  'process-equipment',
  'robot',
  'vehicle',
  'storage',
  'gantry',
  'antenna',
  'garden',
  'water-feature',
  'energy-system',
  'security',
  'public-art',
  'street-furniture',
  'medical-equipment',
  'cargo',
  'habitat',
  'signage',
  'drone',
] as const;

export type CampusObjectKind = (typeof CAMPUS_OBJECT_KINDS)[number];

export interface CampusFacility {
  readonly name: string;
  readonly form: CampusFacilityForm;
}

export interface CampusObject {
  readonly name: string;
  readonly kind: CampusObjectKind;
}

export interface DistrictCampusPlan {
  readonly facilities: readonly CampusFacility[];
  readonly objects: readonly CampusObject[];
}

export type DistrictCampusId =
  | 'synthetic-quantum-biosystems'
  | 'dark-center-lab-megabuilding'
  | 'corporate-core'
  | 'toxicology-labs'
  | 'pharmacology-labs'
  | 'microbiology-labs'
  | 'genomics-labs'
  | 'proteomics-labs'
  | 'omics-labs'
  | 'electronics-microelectronics-labs'
  | 'medical-labs'
  | 'molecular-biology-labs'
  | 'biochemistry-labs'
  | 'computational-biology-labs'
  | 'robotics-labs'
  | 'marketing'
  | 'scientific-art-labs'
  | 'even-hour-hotel'
  | 'astronomy-astrobiology-labs'
  | 'secret-labs'
  | 'bioanalytics-lab'
  | 'organic-chemistry-labs'
  | 'luxury-entertainment'
  | 'scientist-residential'
  | 'materials-science-lab'
  | 'security'
  | 'forensic-cyberforensic-lab'
  | 'inorganic-chemistry'
  | 'financial-funding'
  | 'logistics'
  | 'entry-commercial'
  | 'environmental-science-labs'
  | 'academic-libraries-theoretical-labs'
  | 'industrial-labs'
  | 'particle-physics-labs';

export const DISTRICT_CAMPUS_PLANS = {
  'synthetic-quantum-biosystems': {
    facilities: [
      { name: 'Quantum Living Systems Crown', form: 'arcology' },
      { name: 'Synthetic Cell Foundry', form: 'lab-block' },
      { name: 'Entanglement Measurement Pavilion', form: 'pavilion' },
      { name: 'Biological Computation Greenhouse', form: 'greenhouse' },
    ],
    objects: [
      { name: 'Quantum Bioreactor Array', kind: 'process-equipment' },
      { name: 'Photon Correlation Benches', kind: 'instrument' },
      { name: 'Living Data Totems', kind: 'public-art' },
      { name: 'Cryogenic Sample Pods', kind: 'storage' },
    ],
  },
  'dark-center-lab-megabuilding': {
    facilities: [
      { name: 'Black Glass Research Arcology', form: 'arcology' },
      { name: 'Cyan Energy Spine Tower', form: 'tower' },
      { name: 'Deep Systems Laboratory', form: 'subterranean-bunker' },
      { name: 'Central Utility Exchange', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Luminous Computation Core', kind: 'energy-system' },
      { name: 'Autonomous Service Drones', kind: 'drone' },
      { name: 'Secure Data Vaults', kind: 'storage' },
      { name: 'Arcology Access Scanners', kind: 'security' },
    ],
  },
  'corporate-core': {
    facilities: [
      { name: 'Island Executive Headquarters', form: 'tower' },
      { name: 'Research Command Forum', form: 'administration' },
      { name: 'Diplomatic Briefing Pavilion', form: 'pavilion' },
      { name: 'Operations Coordination Hall', form: 'hall' },
    ],
    objects: [
      { name: 'Orbital Plaza Beacon', kind: 'public-art' },
      { name: 'Executive Arrival Vehicles', kind: 'vehicle' },
      { name: 'Holographic Campus Directory', kind: 'signage' },
      { name: 'Formal Reflecting Pools', kind: 'water-feature' },
      { name: 'Civic Shade Gardens', kind: 'garden' },
    ],
  },
  'toxicology-labs': {
    facilities: [
      { name: 'Acute Exposure Laboratory', form: 'lab-block' },
      { name: 'Decontamination Portal House', form: 'service-building' },
      { name: 'Hazardous Sample Vault', form: 'subterranean-bunker' },
      { name: 'Air Scrubber Plant', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Negative-Pressure Scrubber Stacks', kind: 'process-equipment' },
      { name: 'Sealed Specimen Canisters', kind: 'storage' },
      { name: 'Emergency Wash Stations', kind: 'medical-equipment' },
      { name: 'Contamination Warning Beacons', kind: 'signage' },
      { name: 'Perimeter Exposure Sensors', kind: 'security' },
    ],
  },
  'pharmacology-labs': {
    facilities: [
      { name: 'Pharmakon Nexus', form: 'lab-block' },
      { name: 'The Ternary Gate', form: 'tower' },
      { name: 'Scriptorium Therapeutica', form: 'hall' },
      { name: 'Vectorium Aegis', form: 'pavilion' },
      { name: 'Chronopharm Observatory', form: 'tower' },
    ],
    objects: [
      { name: 'Dose-Response Promenade', kind: 'street-furniture' },
      { name: 'Ligand Field', kind: 'public-art' },
      { name: 'Pharmacokinetic Water Channels', kind: 'water-feature' },
      { name: 'Microfluidic Capsule Network', kind: 'robot' },
      { name: 'Dose Dial Plaza', kind: 'public-art' },
    ],
  },
  'microbiology-labs': {
    facilities: [
      { name: 'The Lytic Crown', form: 'tower' },
      { name: 'The Symbiome Terraces', form: 'lab-block' },
      { name: 'The Metabolite Foundry', form: 'hall' },
      { name: 'The Black Brine Observatory', form: 'observatory' },
      { name: 'The One Health Sentinel', form: 'tower' },
    ],
    objects: [
      { name: 'Microbial Communication Network', kind: 'signage' },
      { name: 'Colony Plazas', kind: 'street-furniture' },
      { name: 'Biosensor Gardens', kind: 'garden' },
      { name: 'Shallow Research Water Channels', kind: 'water-feature' },
      { name: 'Environmental Sampling Pylons', kind: 'instrument' },
    ],
  },
  'genomics-labs': {
    facilities: [
      { name: 'The Pangenome Confluence', form: 'hall' },
      { name: 'Helix Meridian', form: 'tower' },
      { name: 'Tessera Vitae', form: 'lab-block' },
      { name: 'Fabrica Genomica', form: 'utility-plant' },
      { name: 'The Variant Constellation', form: 'observatory' },
    ],
    objects: [
      { name: 'Base-Pair Promenade', kind: 'signage' },
      { name: 'Spectral Sequence Traces', kind: 'instrument' },
      { name: 'Coordinate Gardens', kind: 'garden' },
      { name: 'Genomic Water Channels', kind: 'water-feature' },
      { name: 'Environmental Sampling Masts', kind: 'instrument' },
    ],
  },
  'proteomics-labs': {
    facilities: [
      { name: 'The Monocell Proteome Array', form: 'tower' },
      { name: 'The Tissue Cartography Hall', form: 'hall' },
      { name: 'The Proteoform Resonance Basilica', form: 'observatory' },
      { name: 'The Interactome Constellation', form: 'lab-block' },
      { name: 'The Amino-Pore Sequencing Veil', form: 'hall' },
    ],
    objects: [
      { name: 'Polypeptide Walk', kind: 'signage' },
      { name: 'Molecular Backbone Lights', kind: 'instrument' },
      { name: 'Side-Chain Paths', kind: 'garden' },
      { name: 'Heterogeneous Cell Gardens', kind: 'garden' },
      { name: 'Specimen Tree Islands', kind: 'public-art' },
    ],
  },
  'omics-labs': {
    facilities: [
      { name: 'Integrated Multi-Omics Laboratory', form: 'lab-block' },
      { name: 'Cross-Platform Analysis Hall', form: 'hall' },
      { name: 'Shared Informatics Atrium', form: 'pavilion' },
      { name: 'Sample Integration Vault', form: 'service-building' },
    ],
    objects: [
      { name: 'Automated Aliquot Robots', kind: 'robot' },
      { name: 'Cross-Omics Instrument Pods', kind: 'instrument' },
      { name: 'Federated Data Totems', kind: 'signage' },
      { name: 'Shared Cryostorage Bank', kind: 'storage' },
    ],
  },
  'electronics-microelectronics-labs': {
    facilities: [
      { name: 'Semiconductor Cleanroom Fab', form: 'hall' },
      { name: 'Nanoelectronics Laboratory', form: 'lab-block' },
      { name: 'Photolithography Service Plant', form: 'utility-plant' },
      { name: 'Device Packaging Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Filtered Rooftop Air Handlers', kind: 'process-equipment' },
      { name: 'Wafer Transfer Robots', kind: 'robot' },
      { name: 'Chemical Delivery Cabinets', kind: 'storage' },
      { name: 'Service Gantry Network', kind: 'gantry' },
    ],
  },
  'medical-labs': {
    facilities: [
      { name: 'Atlas Pathologica', form: 'lab-block' },
      { name: 'Hemolumen Spire', form: 'tower' },
      { name: 'Vitrivivarium', form: 'greenhouse' },
      { name: 'Editorium Genomicum', form: 'tower' },
      { name: 'Immunis Bastion', form: 'hospital' },
      { name: 'Astra Theranostica', form: 'lab-block' },
      { name: 'Regenera Forge', form: 'hall' },
      { name: 'Concordia Xenomedica', form: 'pavilion' },
      { name: 'Aegis Phagica', form: 'lab-block' },
      { name: 'Clinica Simulacra', form: 'tower' },
    ],
    objects: [
      { name: 'Diagnostic Crescent', kind: 'street-furniture' },
      { name: 'Therapeutic Spine', kind: 'street-furniture' },
      { name: 'Restricted Specimen Vein', kind: 'security' },
      { name: 'Sealed Autonomous Specimen Capsules', kind: 'vehicle' },
    ],
  },
  'molecular-biology-labs': {
    facilities: [
      { name: 'Genesis Forge', form: 'lab-block' },
      { name: 'Xenocodon Bastion', form: 'tower' },
      { name: 'Protosphere Complex', form: 'pavilion' },
      { name: 'Asterion Exobiology Array', form: 'hall' },
      { name: 'Palimpsest Tower', form: 'tower' },
      { name: 'Symbiogenesis Arc', form: 'lab-block' },
      { name: 'Molecular Automata Loom', form: 'hall' },
      { name: 'Darwin Engine', form: 'tower' },
      { name: 'Morphogen Exchange', form: 'pavilion' },
      { name: 'Cryptobiosis Vault', form: 'service-building' },
    ],
    objects: [
      { name: 'Molecular Meridian', kind: 'street-furniture' },
      { name: 'Interaction Plazas', kind: 'public-art' },
      { name: 'Information Circuit Lines', kind: 'instrument' },
      { name: 'Atmospheric Sensor Network', kind: 'instrument' },
    ],
  },
  'biochemistry-labs': {
    facilities: [
      { name: 'Aminoform Foundry', form: 'lab-block' },
      { name: 'Cryostratum', form: 'observatory' },
      { name: 'Metabolome Atlas', form: 'hall' },
      { name: 'Vesica Genesis', form: 'pavilion' },
      { name: 'Evozyme Loop', form: 'utility-plant' },
      { name: 'Coacervum', form: 'pavilion' },
      { name: 'Glycan Cipher', form: 'tower' },
      { name: 'Proteostasis Citadel', form: 'tower' },
      { name: 'Chronocatalysis Spire', form: 'tower' },
      { name: 'Ferrum Vita Forge', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Reaction Gradient', kind: 'street-furniture' },
      { name: 'Molecular Flux Traces', kind: 'instrument' },
      { name: 'Outer Utility Spine', kind: 'gantry' },
      { name: 'Circular Reaction Plazas', kind: 'public-art' },
      { name: 'Microfluidic Water Channels', kind: 'water-feature' },
      { name: 'Environmental Reaction Samplers', kind: 'instrument' },
    ],
  },
  'computational-biology-labs': {
    facilities: [
      { name: 'Biological Supercomputing Tower', form: 'tower' },
      { name: 'Collaborative Analysis Pavilion', form: 'pavilion' },
      { name: 'Machine Learning Laboratory', form: 'lab-block' },
      { name: 'District Cooling Plant', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Liquid-Cooled Compute Racks', kind: 'instrument' },
      { name: 'Visible Cooling Loop', kind: 'process-equipment' },
      { name: 'Protein Simulation Display', kind: 'signage' },
      { name: 'Backup Energy Cells', kind: 'energy-system' },
    ],
  },
  'robotics-labs': {
    facilities: [
      { name: 'Autonomous Systems Assembly Hangar', form: 'hangar' },
      { name: 'Human-Robot Interaction Laboratory', form: 'lab-block' },
      { name: 'Mobility Test Hall', form: 'hall' },
      { name: 'Robotics Control Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Six-Axis Assembly Arms', kind: 'robot' },
      { name: 'Autonomous Ground Vehicles', kind: 'vehicle' },
      { name: 'Fenced Obstacle Course', kind: 'security' },
      { name: 'Overhead Test Gantry', kind: 'gantry' },
      { name: 'Survey Drone Swarm', kind: 'drone' },
    ],
  },
  marketing: {
    facilities: [
      { name: 'Science Communications Pavilion', form: 'pavilion' },
      { name: 'Broadcast Production Studio', form: 'studio' },
      { name: 'Public Demonstration Hall', form: 'hall' },
      { name: 'Campaign Administration House', form: 'administration' },
    ],
    objects: [
      { name: 'Animated Media Facade', kind: 'signage' },
      { name: 'Outdoor Broadcast Cameras', kind: 'instrument' },
      { name: 'Modular Event Stage', kind: 'street-furniture' },
      { name: 'Research Story Light Columns', kind: 'public-art' },
    ],
  },
  'scientific-art-labs': {
    facilities: [
      { name: 'Bio-Art Studio', form: 'studio' },
      { name: 'Digital Fabrication Hall', form: 'hall' },
      { name: 'Kinetic Research Gallery', form: 'pavilion' },
      { name: 'Materials Atelier', form: 'lab-block' },
    ],
    objects: [
      { name: 'Kinetic Orbital Sculpture', kind: 'public-art' },
      { name: 'Robotic Carving Arm', kind: 'robot' },
      { name: 'Interactive Light Garden', kind: 'garden' },
      { name: 'Outdoor Maker Tables', kind: 'street-furniture' },
    ],
  },
  'even-hour-hotel': {
    facilities: [
      { name: 'Ever Hour Research Hotel', form: 'hotel' },
      { name: 'Visiting Scientists Residence', form: 'residential-block' },
      { name: 'International Conference Hall', form: 'hall' },
      { name: 'Sky Lounge Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Neon Arrival Canopy', kind: 'signage' },
      { name: 'Guest Mobility Pods', kind: 'vehicle' },
      { name: 'Rooftop Scientist Garden', kind: 'garden' },
      { name: 'Luminous Conference Totems', kind: 'street-furniture' },
    ],
  },
  'astronomy-astrobiology-labs': {
    facilities: [
      { name: 'Optical Telescope Observatory', form: 'observatory' },
      { name: 'Astrobiology Containment Laboratory', form: 'lab-block' },
      { name: 'Planetary Habitat Greenhouse', form: 'greenhouse' },
      { name: 'Radio Astronomy Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Steerable Radio Dish', kind: 'antenna' },
      { name: 'Planetary Rover Testbed', kind: 'vehicle' },
      { name: 'Meteorite Sample Vaults', kind: 'storage' },
      { name: 'Exoplanet Orrery', kind: 'public-art' },
    ],
  },
  'secret-labs': {
    facilities: [
      { name: 'Subsurface Research Complex', form: 'subterranean-bunker' },
      { name: 'Hardened Access Block', form: 'service-building' },
      { name: 'Classified Test Hall', form: 'hall' },
      { name: 'Shielded Control Tower', form: 'tower' },
    ],
    objects: [
      { name: 'Adaptive Sensor Field', kind: 'security' },
      { name: 'Retractable Vehicle Barriers', kind: 'security' },
      { name: 'Encrypted Antenna Array', kind: 'antenna' },
      { name: 'Unmarked Equipment Containers', kind: 'storage' },
    ],
  },
  'bioanalytics-lab': {
    facilities: [
      { name: 'Prisma Cytometrica', form: 'hall' },
      { name: 'Astral Forge', form: 'hall' },
      { name: 'Atlas In Situ', form: 'lab-block' },
      { name: 'Nativa Helix Observatory', form: 'tower' },
      { name: 'Proteoform Cipher House', form: 'lab-block' },
      { name: 'Metabolis Aerarium', form: 'observatory' },
      { name: 'Glycan Arbor', form: 'lab-block' },
      { name: 'Fragmenta Beacon', form: 'tower' },
      { name: 'Vesicula Halo Array', form: 'lab-block' },
      { name: 'Rheocell Rapids', form: 'hall' },
      { name: 'Chronocellum', form: 'observatory' },
      { name: 'CryoTomos Vault', form: 'subterranean-bunker' },
      { name: 'Molecular Tension Bridge', form: 'lab-block' },
      { name: 'Automata Assay Foundry', form: 'hall' },
      { name: 'Metron Bio', form: 'lab-block' },
    ],
    objects: [
      { name: 'Analytical Crescent', kind: 'street-furniture' },
      { name: 'Calibration Spine', kind: 'gantry' },
      { name: 'Autonomous Sample Vehicles', kind: 'robot' },
      { name: 'Visible Vascular Utility Galleries', kind: 'process-equipment' },
      { name: 'Calibrated Research Landscape', kind: 'garden' },
    ],
  },
  'organic-chemistry-labs': {
    facilities: [
      { name: 'Autocatalytic Synthesis Exchange', form: 'lab-block' },
      { name: 'Skeletal Editing Cathedral', form: 'hall' },
      { name: 'Photon-Electron Catalysis Prism', form: 'pavilion' },
      { name: 'Meridian Institute for Selective C-H Activation', form: 'tower' },
      { name: 'Chemoenzymatic Cascade Conservatory', form: 'greenhouse' },
      { name: 'Chiral Synthesis Twin', form: 'lab-block' },
      { name: 'Catenane Forum for Molecular Machines', form: 'pavilion' },
      { name: 'Organic Photonics and Semiconductor Loom', form: 'hall' },
      { name: 'Circular Carbon Reforging Works', form: 'utility-plant' },
      { name: 'Atlas of Natural Products and Macrocyclic Space', form: 'observatory' },
    ],
    objects: [
      { name: 'Synthesis Arc', kind: 'street-furniture' },
      { name: 'Reaction-Scheme Metallic Lines', kind: 'signage' },
      { name: 'Shielded Reagent Logistics Road', kind: 'cargo' },
      { name: 'Partially Buried Solvent Stores', kind: 'storage' },
      { name: 'District Neutralization Network', kind: 'process-equipment' },
      { name: 'Wind Beacons and Fire-Suppression Pylons', kind: 'security' },
    ],
  },
  'luxury-entertainment': {
    facilities: [
      { name: 'Waterfront Culinary Hall', form: 'hall' },
      { name: 'Island Performance Pavilion', form: 'pavilion' },
      { name: 'Premium Guest Hotel', form: 'hotel' },
      { name: 'Terraced Leisure Club', form: 'service-building' },
    ],
    objects: [
      { name: 'Luminous Waterfront Stage', kind: 'street-furniture' },
      { name: 'Sculptural Fire Gardens', kind: 'garden' },
      { name: 'Terrace Reflecting Pools', kind: 'water-feature' },
      { name: 'Autonomous Dining Carts', kind: 'robot' },
      { name: 'Leisure Quarter Marquees', kind: 'signage' },
    ],
  },
  'scientist-residential': {
    facilities: [
      { name: 'Modular Scientist Residences', form: 'residential-block' },
      { name: 'Neighborhood Childcare Pavilion', form: 'pavilion' },
      { name: 'Resident Workshop Hall', form: 'hall' },
      { name: 'Community Food Greenhouse', form: 'greenhouse' },
    ],
    objects: [
      { name: 'Shared Courtyard Gardens', kind: 'garden' },
      { name: 'Neighborhood Mobility Pods', kind: 'vehicle' },
      { name: 'Outdoor Play Structures', kind: 'street-furniture' },
      { name: 'Parcel Delivery Robots', kind: 'robot' },
    ],
  },
  'materials-science-lab': {
    facilities: [
      { name: 'Structural Materials Test Hall', form: 'hall' },
      { name: 'High-Temperature Furnace Block', form: 'utility-plant' },
      { name: 'Advanced Composites Laboratory', form: 'lab-block' },
      { name: 'Specimen Preparation Hangar', form: 'hangar' },
    ],
    objects: [
      { name: 'Bridge-Scale Load Frame', kind: 'instrument' },
      { name: 'Outdoor Specimen Rigs', kind: 'gantry' },
      { name: 'Heavy Gantry Crane', kind: 'gantry' },
      { name: 'Materials Sample Racks', kind: 'storage' },
      { name: 'Slag and Aggregate Bins', kind: 'cargo' },
    ],
  },
  security: {
    facilities: [
      { name: 'Porta Aegis', form: 'hall' },
      { name: 'Praesidium Nexus', form: 'administration' },
      { name: 'Sentinel Crown', form: 'tower' },
      { name: 'Scutum Blackglass', form: 'lab-block' },
      { name: 'Forum Meridian', form: 'pavilion' },
      { name: 'Celeritas Response Arc', form: 'hangar' },
      { name: 'Strix Aviary', form: 'tower' },
      { name: 'Cerberus Yard', form: 'hangar' },
      { name: 'Via Custos', form: 'transit-hub' },
      { name: 'Janus Clean Gate', form: 'lab-block' },
      { name: 'Custodia Vault', form: 'subterranean-bunker' },
      { name: 'Silentium Bureau', form: 'administration' },
      { name: 'Aegis Proving Hall', form: 'hall' },
      { name: 'Concordia Court', form: 'administration' },
      { name: 'Limes Forge', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Aegis Arc Boulevard', kind: 'street-furniture' },
      { name: 'Embedded Credential Pylons', kind: 'security' },
      { name: 'Autonomous Patrol Drone Cells', kind: 'drone' },
      { name: 'Long-Range Sensor Crown', kind: 'antenna' },
      { name: 'Black Reflecting Pools', kind: 'water-feature' },
      { name: 'Geometric Basalt Planters', kind: 'garden' },
      { name: 'Perimeter Systems Test Platforms', kind: 'process-equipment' },
      { name: 'Emergency Route Light Seams', kind: 'signage' },
    ],
  },
  'forensic-cyberforensic-lab': {
    facilities: [
      { name: 'Evidentia Nexus', form: 'administration' },
      { name: 'Helix Trace Institute', form: 'tower' },
      { name: 'Proteomic Residue Observatory', form: 'lab-block' },
      { name: 'Microbiome Provenance Conservatory', form: 'greenhouse' },
      { name: 'Thanatoscan Monolith', form: 'tower' },
      { name: 'Ridge Morphology Institute', form: 'lab-block' },
      { name: 'Isotope Geolocation Spire', form: 'tower' },
      { name: 'Nanotrace Materials Foundry', form: 'utility-plant' },
      { name: 'Ecological Evidence Terraces', form: 'greenhouse' },
      { name: 'Silicon Autopsy Foundry', form: 'lab-block' },
      { name: 'Malware Ecology Containment Tower', form: 'tower' },
      { name: 'Network Reconstruction Array', form: 'tower' },
      { name: 'Veritas Prism', form: 'lab-block' },
      { name: 'Quantum Evidence Vault', form: 'subterranean-bunker' },
      { name: 'Cyber-Physical Reconstruction Range', form: 'hangar' },
    ],
    objects: [
      { name: 'Evidence Line Boulevard', kind: 'street-furniture' },
      { name: 'Chainline Hermetic Courier', kind: 'vehicle' },
      { name: 'Embedded Sample and Hash Markers', kind: 'signage' },
      { name: 'Exposed Environmental Sampling Drains', kind: 'process-equipment' },
      { name: 'Controlled Silver-Grass and Moss Landscape', kind: 'garden' },
    ],
  },
  'inorganic-chemistry': {
    facilities: [
      { name: 'The Crystal Genome Foundry', form: 'utility-plant' },
      { name: 'The Monatomic Catalyst Spire', form: 'tower' },
      { name: 'The Halide Ion Citadel', form: 'lab-block' },
      { name: 'The Breathing Framework Ark', form: 'hall' },
      { name: 'The Solar-Fuels Leafworks', form: 'pavilion' },
      { name: 'The Nitrogen Triple-Bond Forge', form: 'utility-plant' },
      { name: 'The F-Block Containment Monastery', form: 'subterranean-bunker' },
      { name: 'The Lanthanide Cascade Refinery', form: 'utility-plant' },
      { name: 'The Polyoxometalate Basilica', form: 'hall' },
      { name: 'The Quantum Oxide Terraces', form: 'lab-block' },
      { name: 'The Megabar Diamond-Anvil Tower', form: 'tower' },
      { name: 'The Molten-Salt Thermal Keep', form: 'utility-plant' },
      { name: 'The Biomineral Hybrid Conservatory', form: 'greenhouse' },
      { name: 'The Carbon Mineralization Ramparts', form: 'service-building' },
      { name: 'The Valence Nexus and Coordination Crown', form: 'arcology' },
    ],
    objects: [
      { name: 'Valence Avenue', kind: 'street-furniture' },
      { name: 'Stoichiometric Loop', kind: 'vehicle' },
      { name: 'Crystal Axis', kind: 'public-art' },
      { name: 'F-Block Passage', kind: 'security' },
      { name: 'Coordination Polyhedron Courts', kind: 'public-art' },
      { name: 'Sealed Mineral Sample Fields', kind: 'storage' },
      { name: 'Gas-Flow and Oxidation-State Pylons', kind: 'instrument' },
    ],
  },
  'financial-funding': {
    facilities: [
      { name: 'Research Funding Headquarters', form: 'tower' },
      { name: 'Venture Incubator Pavilion', form: 'pavilion' },
      { name: 'Grant Review Hall', form: 'hall' },
      { name: 'Partnership Administration House', form: 'administration' },
    ],
    objects: [
      { name: 'Investment Data Totems', kind: 'signage' },
      { name: 'Formal Venture Plaza', kind: 'street-furniture' },
      { name: 'Founder Pitch Stage', kind: 'public-art' },
      { name: 'Executive Mobility Pods', kind: 'vehicle' },
      { name: 'Grants Garden Court', kind: 'garden' },
    ],
  },
  logistics: {
    facilities: [
      { name: 'Skydeck Parking House', form: 'service-building' },
      { name: 'Northfield Airport Terminal', form: 'transit-hub' },
      { name: 'Airfield Operations and Control Tower', form: 'tower' },
      { name: 'Aircraft Maintenance Hangar One', form: 'hangar' },
      { name: 'Cargo Inspection and Transfer Depot', form: 'warehouse' },
      { name: 'Cold-Chain Distribution Center', form: 'warehouse' },
      { name: 'Ground Fleet Maintenance Depot', form: 'service-building' },
    ],
    objects: [
      { name: 'Northfield Short Runway', kind: 'energy-system' },
      { name: 'Controlled Freight Service Spine', kind: 'vehicle' },
      { name: 'Landscaped Acoustic Berm', kind: 'garden' },
      { name: 'Translucent Security Wall', kind: 'security' },
      { name: 'Airfield Navigation Lights', kind: 'signage' },
    ],
  },
  'entry-commercial': {
    facilities: [
      { name: 'Bridgehead Tunnel and Island Gate', form: 'transit-hub' },
      { name: 'Welcome and Registration Hall', form: 'hall' },
      { name: 'Meridian Transit Pavilion', form: 'transit-hub' },
      { name: 'Clearline Glassfront Cafe', form: 'pavilion' },
      { name: 'Ringwalk Galleria Mall', form: 'hall' },
      { name: 'The Catwalk Fashion Runway Club', form: 'studio' },
      { name: 'Old Circuit Arcade', form: 'hall' },
      { name: 'Bridgeview Arrival Hotel', form: 'hotel' },
      { name: 'Dock Market Hall', form: 'hall' },
      { name: 'Island Showcase Pavilion', form: 'pavilion' },
      { name: 'Beacon Picture House', form: 'hall' },
      { name: 'East Quay Water-Taxi Pavilion', form: 'transit-hub' },
      { name: 'Cityline Orientation Tower', form: 'tower' },
    ],
    objects: [
      { name: 'Welcome Oval Arrival Plaza', kind: 'street-furniture' },
      { name: 'Welcome Reflecting Pool', kind: 'water-feature' },
      { name: 'Public Arrival Road', kind: 'vehicle' },
      { name: 'Pedestrian Commercial Street', kind: 'street-furniture' },
      { name: 'Protected Alpine View Corridor', kind: 'garden' },
    ],
  },
  'environmental-science-labs': {
    facilities: [
      { name: 'Coastal Ecology Field Laboratory', form: 'lab-block' },
      { name: 'Wetland Research Pavilion', form: 'pavilion' },
      { name: 'Renewable Systems Hall', form: 'hall' },
      { name: 'Monitoring Equipment House', form: 'service-building' },
    ],
    objects: [
      { name: 'Constructed Sensor Wetlands', kind: 'habitat' },
      { name: 'Coastal Monitoring Buoys', kind: 'instrument' },
      { name: 'Solar and Wind Test Rigs', kind: 'energy-system' },
      { name: 'Native Pollinator Gardens', kind: 'garden' },
      { name: 'Water Sampling Drones', kind: 'drone' },
    ],
  },
  'academic-libraries-theoretical-labs': {
    facilities: [
      { name: 'Cerebrum Externum', form: 'library' },
      { name: 'Wren Rare Books Library', form: 'library' },
      { name: 'Institute for Theoretical Sciences', form: 'administration' },
      { name: 'Blackwood Collegiate Lecture Hall', form: 'hall' },
      { name: 'Scholars Cloister and Archive', form: 'library' },
    ],
    objects: [
      { name: 'Founders Quadrangle Park', kind: 'garden' },
      { name: 'Philosophers Reading Garden', kind: 'garden' },
      { name: 'Open Scholars Lawn', kind: 'garden' },
      { name: 'Bronze Scholars Memorial Court', kind: 'street-furniture' },
      { name: 'Gaslight Reading Courts', kind: 'water-feature' },
    ],
  },
  'industrial-labs': {
    facilities: [
      { name: 'Unit 04 Manufacturing Hall', form: 'hall' },
      { name: 'Eleven-Bay Distribution Warehouse', form: 'warehouse' },
      { name: 'Brick Power Station and Boiler House', form: 'utility-plant' },
      { name: 'Rail Maintenance and Cold Storage Complex', form: 'hangar' },
    ],
    objects: [
      { name: 'Four-Stack Storage Silo Battery', kind: 'storage' },
      { name: 'Abandoned Rail Wagons', kind: 'vehicle' },
      { name: 'Automatic Pump and Pipe Bridges', kind: 'process-equipment' },
      { name: 'Intermittent Warning Beacons', kind: 'signage' },
      { name: 'Rain-Darkened Loading Gantries', kind: 'gantry' },
    ],
  },
  'particle-physics-labs': {
    facilities: [
      { name: 'Conventus Orbis', form: 'hall' },
      { name: 'Chronos Relay', form: 'tower' },
      { name: 'The Event Loom', form: 'lab-block' },
      { name: 'Scalaris', form: 'pavilion' },
      { name: 'Chromodynamic Court', form: 'lab-block' },
      { name: 'Oscilla', form: 'hall' },
      { name: 'The Asymmetry House', form: 'tower' },
      { name: 'Noctis', form: 'pavilion' },
      { name: 'Symmetria', form: 'hall' },
      { name: 'The Quantum Silence Pavilion', form: 'pavilion' },
      { name: 'The Lattice Citadel', form: 'arcology' },
      { name: 'Amplituhedron House', form: 'lab-block' },
      { name: 'The Renormalization Tower', form: 'tower' },
      { name: 'Genesis Spiral', form: 'hall' },
      { name: 'The Signal Coast Archive', form: 'service-building' },
    ],
    objects: [
      { name: 'Event Track Promenade', kind: 'street-furniture' },
      { name: 'Interaction Plazas', kind: 'public-art' },
      { name: 'Feynman Rain Channels', kind: 'water-feature' },
      { name: 'Fibre-Optic Ground Field', kind: 'signage' },
      { name: 'Data Coast Storm Barrier', kind: 'security' },
    ],
  },
} as const satisfies Readonly<Record<DistrictCampusId, DistrictCampusPlan>>;

export interface BiomeEcologyPlan {
  readonly fieldLabName: string;
  readonly features: readonly string[];
}

export type BiomeEcologyId =
  | 'alpine-dome'
  | 'tundra-dome'
  | 'desert-dome'
  | 'savanna-dome'
  | 'temperate-deciduous-forest-dome'
  | 'tropical-rainforest-dome';

export const BIOME_ECOLOGY_PLANS = {
  'alpine-dome': {
    fieldLabName: 'High Elevation Cryosphere Field Station',
    features: [
      'Wind-Sculpted Snowfield',
      'Exposed Granite Ridge',
      'Dwarf Conifer Grove',
      'Seasonal Avalanche Chute',
      'Glacial Meltwater Rill',
      'Alpine Lichen Garden',
      'Cold-Climate Weather Mast',
    ],
  },
  'tundra-dome': {
    fieldLabName: 'Permafrost Dynamics Field Laboratory',
    features: [
      'Polygonal Permafrost Ground',
      'Sphagnum Moss Carpet',
      'Reindeer Lichen Terrace',
      'Dwarf Willow Thicket',
      'Seasonal Meltwater Pools',
      'Thermokarst Monitoring Trench',
      'Low Arctic Mist Field',
    ],
  },
  'desert-dome': {
    fieldLabName: 'Arid Systems and Solar Research Station',
    features: [
      'Layered Crescent Dunes',
      'Wind-Eroded Stone Arch',
      'Xerophyte Succulent Garden',
      'Dry Wash Channel',
      'Desert Pavement Field',
      'Tracking Solar Array',
      'Nocturnal Pollinator Plot',
    ],
  },
  'savanna-dome': {
    fieldLabName: 'Tropical Grassland Ecology Field Station',
    features: [
      'Golden Tallgrass Plain',
      'Umbrella Acacia Grove',
      'Seasonal Water Hole',
      'Weathered Kopje Outcrop',
      'Termite Mound Cluster',
      'Grazing Exclosure Plot',
      'Controlled Fire Research Strip',
    ],
  },
  'temperate-deciduous-forest-dome': {
    fieldLabName: 'Seasonal Woodland Phenology Laboratory',
    features: [
      'Mature Oak and Maple Canopy',
      'Autumn Research Grove',
      'Shaded Fern Understory',
      'Meandering Woodland Stream',
      'Leaf-Litter Decomposition Plot',
      'Fallen Log Microhabitat',
      'Canopy Phenology Tower',
    ],
  },
  'tropical-rainforest-dome': {
    fieldLabName: 'Canopy Climate and Biodiversity Station',
    features: [
      'Layered Emergent Rainforest Canopy',
      'Tall Ribbon Waterfall',
      'Winding Wetland Stream',
      'Bioluminescent Pollinator Garden',
      'Elevated Canopy Visitor Walk',
      'Smart-Glass Propagation Nursery',
      'Active Climate-Control Rings',
      'Rain Curtain and Mist Field',
    ],
  },
} as const satisfies Readonly<Record<BiomeEcologyId, BiomeEcologyPlan>>;
