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
      { name: 'EXPOSOMA', form: 'lab-block' },
      { name: 'MIMESIS', form: 'hall' },
      { name: 'CAUSALITY ARRAY', form: 'tower' },
      { name: 'PALIMPSEST', form: 'subterranean-bunker' },
      { name: 'MERIDIAN', form: 'lab-block' },
    ],
    objects: [
      { name: 'Dose-Response Promenade', kind: 'street-furniture' },
      { name: 'Independent Air-Handling Towers', kind: 'process-equipment' },
      { name: 'Sealed Sample Courier Lane', kind: 'robot' },
      { name: 'Bioindicator Gardens', kind: 'garden' },
      { name: 'Perimeter Exposure Sensors', kind: 'security' },
      { name: 'Waste-Transfer Isolation Gates', kind: 'storage' },
      { name: 'Decontamination Blade Canopies', kind: 'medical-equipment' },
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
      { name: 'The Atlas Loom', form: 'hall' },
      { name: 'The Perturbome Foundry', form: 'lab-block' },
      { name: 'The Exposome Exchange', form: 'observatory' },
      { name: 'The Flux Cathedral', form: 'observatory' },
      { name: 'The Convergence Vault', form: 'service-building' },
    ],
    objects: [
      { name: 'Omic Continuum', kind: 'signage' },
      { name: 'Autonomous Cryogenic Sample Transit', kind: 'robot' },
      { name: 'Environmental Calibration Masts', kind: 'instrument' },
      { name: 'Sterile Sample-Transfer Hatches', kind: 'storage' },
    ],
  },
  'electronics-microelectronics-labs': {
    facilities: [
      { name: 'Fabrica Ångström', form: 'hall' },
      { name: 'The Interposer Exchange', form: 'lab-block' },
      { name: 'Lumen Weave Institute', form: 'pavilion' },
      { name: 'Kelvin Null Center', form: 'tower' },
      { name: 'Synaptic Stack Laboratory', form: 'tower' },
      { name: 'The Spin-Orbit Vault', form: 'lab-block' },
      { name: 'Aegis Power Bastion', form: 'hall' },
      { name: 'The Terahertz Metrology Spire', form: 'tower' },
      { name: 'The Adaptive Skin Pavilion', form: 'pavilion' },
      { name: 'Sensorium Hive', form: 'lab-block' },
    ],
    objects: [
      { name: 'Signal Spine', kind: 'street-furniture' },
      { name: 'Bond-Pad Plazas', kind: 'street-furniture' },
      { name: 'Backside Power-Delivery Undercroft', kind: 'process-equipment' },
      { name: 'Automated Material-Transfer Arc', kind: 'robot' },
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
      { name: 'Cellularis Nexus', form: 'pavilion' },
      { name: 'Causa Array', form: 'lab-block' },
      { name: 'Proteus Fold', form: 'tower' },
      { name: 'Pangenome Meridian', form: 'lab-block' },
      { name: 'Morphospace Atlas', form: 'lab-block' },
      { name: 'Regula Loom', form: 'tower' },
      { name: 'Immunome Exchange', form: 'pavilion' },
      { name: 'Kinetica Dynamics Array', form: 'tower' },
      { name: 'Aion Evolution Engine', form: 'lab-block' },
      { name: 'Continuum BioTwin Observatory', form: 'tower' },
    ],
    objects: [
      { name: 'Inference Spine', kind: 'street-furniture' },
      { name: 'Branching Inference Paths', kind: 'street-furniture' },
      { name: 'Exposed Data and Cooling Conduits', kind: 'process-equipment' },
      { name: 'Autonomous Courier Track', kind: 'gantry' },
      { name: 'Validation and Uncertainty Landscape', kind: 'public-art' },
      { name: 'Environmental Sensor Network', kind: 'instrument' },
    ],
  },
  'robotics-labs': {
    facilities: [
      { name: 'Corpus Nexus', form: 'tower' },
      { name: 'Tactus Hall', form: 'hall' },
      { name: 'Myomer Pavilion', form: 'pavilion' },
      { name: 'Murmuration Array', form: 'tower' },
      { name: 'Symbiont Conservatory', form: 'pavilion' },
      { name: 'Magnetotaxis Vault', form: 'lab-block' },
      { name: 'Avatar Spine', form: 'tower' },
      { name: 'Terminus Range', form: 'hangar' },
      { name: 'Autopoiesis Yard', form: 'hall' },
      { name: 'Palingenesis Works', form: 'lab-block' },
    ],
    objects: [
      { name: 'Kinematic Walk', kind: 'street-furniture' },
      { name: 'Autonomous Machine Lanes', kind: 'vehicle' },
      { name: 'Induction Charging Strips', kind: 'instrument' },
      { name: 'Machine-Readable Fiducials', kind: 'instrument' },
      { name: 'Robot-Height Traffic Signals', kind: 'street-furniture' },
      { name: 'Human Machine Refuges', kind: 'security' },
      { name: 'Active Test Landscape', kind: 'robot' },
      { name: 'District Observation Sensors', kind: 'instrument' },
    ],
  },
  marketing: {
    facilities: [
      { name: 'Signal House', form: 'administration' },
      { name: 'The Launch Array', form: 'hall' },
      { name: 'The Narrative Engine Media Foundry', form: 'studio' },
      { name: 'The Audience Dynamics Observatory', form: 'lab-block' },
      { name: 'The Prototype Identity Works', form: 'hall' },
      { name: 'The Beacon Exchange Tower', form: 'tower' },
      { name: 'The Evidence Commons', form: 'pavilion' },
    ],
    objects: [
      { name: 'Spectrum Spine Outer Half', kind: 'street-furniture' },
      { name: 'Prism Forum', kind: 'public-art' },
      { name: 'Translation Garden', kind: 'garden' },
      { name: 'Unfinished Promenade', kind: 'street-furniture' },
    ],
  },
  'scientific-art-labs': {
    facilities: [
      { name: 'The Parallax Institute for Scientific Visualization', form: 'lab-block' },
      { name: 'The Morphogenesis Fabrication Hall', form: 'hall' },
      { name: 'The Chromaflux Bioart Conservatory', form: 'pavilion' },
      { name: 'The Resonance Foundry', form: 'studio' },
      { name: 'The Lumen Observatory for Photonic Art', form: 'tower' },
      { name: 'The Atlas of Invisible Worlds', form: 'lab-block' },
      { name: 'The Archive of Future Materials', form: 'administration' },
      { name: 'The Null Field Gallery', form: 'pavilion' },
    ],
    objects: [
      { name: 'Spectrum Spine Inner Half', kind: 'street-furniture' },
      { name: 'Prism Forum', kind: 'public-art' },
      { name: 'Translation Garden', kind: 'garden' },
      { name: 'Unfinished Promenade', kind: 'street-furniture' },
    ],
  },
  'even-hour-hotel': {
    facilities: [
      { name: 'The Ever Hour', form: 'hotel' },
      { name: 'Ever Hour Exchange Hotel', form: 'hotel' },
      { name: 'Meridian Visiting Scholars Hotel', form: 'hotel' },
      { name: 'Interim House', form: 'residential-block' },
      { name: 'Null Hour Transit Lodge', form: 'hotel' },
      { name: "Fellows' Cloister Guesthouse", form: 'residential-block' },
      { name: 'Scientific Interchange Forum', form: 'hall' },
      { name: 'Access and Protocol House', form: 'administration' },
      { name: 'Benchlight Laboratory Arcade', form: 'lab-block' },
      { name: 'The Instrument Lantern', form: 'lab-block' },
      { name: 'QuickMatter Materials and Chemistry Studios', form: 'lab-block' },
      { name: 'BioMinute Sample Laboratories', form: 'lab-block' },
      { name: 'Circuit Yard Electronics and Robotics Studios', form: 'hall' },
      { name: 'DryLab 24', form: 'tower' },
      { name: 'Aqua Meridian Covered Pool', form: 'pavilion' },
      { name: 'Blue Hour Recovery Baths', form: 'pavilion' },
      { name: 'Orbit Leisure Pavilion', form: 'pavilion' },
      { name: 'The Perpetual Table', form: 'hall' },
      { name: 'The Greenhouse Refectory', form: 'greenhouse' },
      { name: 'Afterlight Sky Restaurant', form: 'tower' },
      { name: 'Minute Market', form: 'hall' },
      { name: 'Null Hour Arcade Mall', form: 'hall' },
      { name: 'Orbit Supply Court', form: 'transit-hub' },
    ],
    objects: [
      { name: 'Continuum Walk', kind: 'street-furniture' },
      { name: 'Chronogarden', kind: 'garden' },
      { name: 'Rain Court', kind: 'garden' },
      { name: 'The 03:17 Garden', kind: 'garden' },
      { name: 'Redshift Grove', kind: 'garden' },
      { name: 'Pool Commons', kind: 'garden' },
      { name: 'Bench Garden', kind: 'garden' },
      { name: 'Passage Gardens', kind: 'garden' },
      { name: 'Controlled Laboratory Service Lanes', kind: 'cargo' },
    ],
  },
  'astronomy-astrobiology-labs': {
    facilities: [
      { name: 'The Coronagraph Crown', form: 'observatory' },
      { name: 'The Chronos Array', form: 'lab-block' },
      { name: 'Concordance Spire', form: 'tower' },
      { name: 'Hydrogen Horizon House', form: 'lab-block' },
      { name: 'The Heliomagnetic Bastion', form: 'observatory' },
      { name: 'The Parallax Foundry', form: 'hall' },
      { name: 'Asterion Shield', form: 'lab-block' },
      { name: 'The Noctis Signal Vault', form: 'lab-block' },
      { name: 'The Aether Spectrum Gardens', form: 'greenhouse' },
      { name: 'The Cryocean Institute', form: 'lab-block' },
      { name: 'Genesis Ventworks', form: 'lab-block' },
      { name: 'The Aegis Exomaterial Sanctuary', form: 'lab-block' },
      { name: 'The Extremis Analog Ecologies Campus', form: 'greenhouse' },
      { name: 'The Chirality Ark', form: 'pavilion' },
      { name: 'The Protostellar Loom', form: 'observatory' },
    ],
    objects: [
      { name: 'Ecliptic Walk', kind: 'street-furniture' },
      { name: 'Orrery Court', kind: 'public-art' },
      { name: 'Dark-Sky Service Route', kind: 'street-furniture' },
      { name: 'Atmospheric Monitoring Stations', kind: 'instrument' },
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
      { name: 'The Aurelia Crown', form: 'tower' },
      { name: 'Tidal Glass', form: 'pavilion' },
      { name: 'The Helix Table', form: 'tower' },
      { name: 'Ember & Ice', form: 'hall' },
      { name: 'The Orion Room', form: 'observatory' },
      { name: 'Velvet Circuit', form: 'tower' },
      { name: 'Pulse Cathedral', form: 'hall' },
      { name: 'Halo Nine', form: 'tower' },
      { name: 'Eclipse Cabaret', form: 'pavilion' },
      { name: 'Aurora Grand Cinema', form: 'hall' },
      { name: 'Horizon Screen Gardens', form: 'pavilion' },
      { name: 'Meridian Pool Palace', form: 'pavilion' },
      { name: 'Neon Grotto Aquaclub', form: 'pavilion' },
      { name: 'The Prismarium', form: 'pavilion' },
      { name: 'Synesthesia Hall', form: 'hall' },
      { name: 'Zero-G Ballroom', form: 'pavilion' },
      { name: 'Dream Arcade', form: 'tower' },
      { name: 'Probability Palace', form: 'hall' },
      { name: 'Chrono Carousel', form: 'tower' },
      { name: 'The Phantom Menagerie', form: 'pavilion' },
    ],
    objects: [
      { name: 'Lumen Boulevard', kind: 'street-furniture' },
      { name: 'Halo Walk', kind: 'street-furniture' },
      { name: 'Luminous Tree Allée', kind: 'garden' },
      { name: 'Crescent Reflecting Pools', kind: 'water-feature' },
      { name: 'Integrated Architectural Marquees', kind: 'signage' },
    ],
  },
  'scientist-residential': {
    facilities: [
      { name: 'Meridian Crescent Residences', form: 'residential-block' },
      { name: 'Helix Terraces', form: 'residential-block' },
      { name: 'Circadian House', form: 'residential-block' },
      { name: 'Rootline Garden Homes', form: 'residential-block' },
      { name: 'Lattice Twin Residences', form: 'tower' },
      { name: 'Parallax Long-Stay Apartments', form: 'residential-block' },
      { name: 'Archive Court Residences', form: 'residential-block' },
      { name: 'Orbit Family Blocks', form: 'residential-block' },
      { name: 'Commons Cooperative', form: 'residential-block' },
      { name: 'Horizon Accessible Residences', form: 'residential-block' },
      { name: 'Resident Commons Hall', form: 'hall' },
      { name: 'Neighborhood Laboratory House', form: 'lab-block' },
      { name: 'Fabrication Mews', form: 'hall' },
      { name: 'Solstice Covered Pool', form: 'pavilion' },
      { name: 'Wintergarden Recreation Hall', form: 'greenhouse' },
      { name: 'Resident Loop Mall', form: 'hall' },
      { name: 'The Common Table Market Hall', form: 'hall' },
      { name: 'Nocturne Cafe and Reading Pavilion', form: 'pavilion' },
      { name: 'Night Clinic and Pharmacy', form: 'hospital' },
      { name: 'Seedling House', form: 'pavilion' },
      { name: 'Neon Horizon Arcology', form: 'arcology' },
      { name: 'Quantum Terrace Megablock', form: 'arcology' },
      { name: 'Outerlight Scientist Residences', form: 'tower' },
      { name: 'Southline Habitat Stack', form: 'tower' },
      { name: 'Chromatic Skybridge Apartments', form: 'tower' },
      { name: 'Continuum Gate Residences', form: 'arcology' },
      { name: 'Nightshift Vertical Quarter', form: 'tower' },
      { name: 'Western Aurora Residences', form: 'arcology' },
      { name: 'Neon Orchard Apartments', form: 'arcology' },
      { name: 'Helix Coast Habitat', form: 'arcology' },
      { name: 'Lumina Family Terraces', form: 'arcology' },
      { name: 'Parallax Garden Towers', form: 'arcology' },
      { name: 'Midnight Researcher Housing', form: 'arcology' },
      { name: 'Coastal Circuit Residences', form: 'arcology' },
      { name: 'Prism Commons Apartments', form: 'arcology' },
      { name: 'Outer Meridian Residential Gate', form: 'arcology' },
    ],
    objects: [
      { name: 'Continuum Walk', kind: 'street-furniture' },
      { name: 'Long Horizon Park', kind: 'garden' },
      { name: 'Rootline Park', kind: 'garden' },
      { name: 'Family Orbit Garden', kind: 'garden' },
      { name: 'The 03:17 Garden', kind: 'garden' },
      { name: 'Pool Commons', kind: 'garden' },
      { name: 'Passage Gardens', kind: 'garden' },
      { name: 'Screened Residential Service Courts', kind: 'cargo' },
      { name: 'Cyberpunk Neon Public Realm', kind: 'signage' },
      { name: 'Outer Arcology Crescent', kind: 'street-furniture' },
      { name: 'Southline Neon Promenade', kind: 'street-furniture' },
      { name: 'Continuum Gate Neon Walk', kind: 'street-furniture' },
      { name: 'Green Pocket Residential Weave', kind: 'street-furniture' },
      { name: 'Green Pocket Corner Courts', kind: 'street-furniture' },
    ],
  },
  'materials-science-lab': {
    facilities: [
      { name: 'The Matter Compiler', form: 'arcology' },
      { name: 'Laminaris Institute', form: 'lab-block' },
      { name: 'Topologica Hall', form: 'hall' },
      { name: 'Morphostructure Pavilion', form: 'pavilion' },
      { name: 'Polyphase Forge', form: 'utility-plant' },
      { name: 'Aegis Bastion', form: 'lab-block' },
      { name: 'Ceramatrix Works', form: 'utility-plant' },
      { name: 'The Ion Vault', form: 'lab-block' },
      { name: 'Photon Weave Institute', form: 'tower' },
      { name: 'Porosium Towers', form: 'tower' },
      { name: 'Symbiomatter Conservatory', form: 'greenhouse' },
      { name: 'Vitrimer House', form: 'pavilion' },
      { name: 'Fourth-Form Foundry', form: 'hangar' },
      { name: 'Second-Life Materials Exchange', form: 'hall' },
      { name: 'Atomic Cartography Observatory', form: 'observatory' },
    ],
    objects: [
      { name: 'Matter Crescent', kind: 'street-furniture' },
      { name: 'Phase Diagram Plaza', kind: 'public-art' },
      { name: 'Adaptive Belt Route', kind: 'street-furniture' },
      { name: 'Outer Forge Freight Route', kind: 'vehicle' },
      { name: 'Crystallographic Crossings', kind: 'signage' },
      { name: 'Exposure Specimen Fields', kind: 'instrument' },
      { name: 'Silver Grass Landscape', kind: 'garden' },
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
      { name: 'Tellus Earth Systems Convergence', form: 'administration' },
      { name: 'Aeolian Atmospheric Observatory', form: 'tower' },
      { name: 'Hydrological Extremes Institute', form: 'lab-block' },
      { name: 'Littoral Exchange Laboratory', form: 'lab-block' },
      { name: 'Biotic Continuum Observatory', form: 'lab-block' },
      { name: 'Critical Zone and Rhizosphere Institute', form: 'lab-block' },
      { name: 'Carbon Transformation Foundry', form: 'hall' },
      { name: 'Anthropocene Forensics Centre', form: 'lab-block' },
      { name: 'Climate Resilience Proving House', form: 'hall' },
      { name: 'Gaia Field Systems Fleetworks', form: 'service-building' },
    ],
    objects: [
      { name: 'Transect Walk', kind: 'street-furniture' },
      { name: 'Instrumented Wetlands and Stormwater Basins', kind: 'habitat' },
      { name: 'Climate-Controlled Soil Plots', kind: 'garden' },
      { name: 'Atmospheric Sensor Fields', kind: 'instrument' },
      { name: 'Long-Term Ecological Observation Zones', kind: 'habitat' },
      { name: 'Mineral Weathering Beds', kind: 'instrument' },
      { name: 'Aerosol Deposition Collectors', kind: 'instrument' },
      { name: 'Satellite and Drone Calibration Targets', kind: 'instrument' },
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
      { name: 'The Shift Meridian', form: 'transit-hub' },
      { name: 'The Continuous Works', form: 'hall' },
      { name: 'The Black Kiln', form: 'utility-plant' },
      { name: 'The Vacuum Casting Cathedral', form: 'utility-plant' },
      { name: 'The Metamaterial Loomworks', form: 'hall' },
      { name: 'The Cryogenic Forming Plant', form: 'utility-plant' },
      { name: 'The Additive Megafabrication Yard', form: 'hangar' },
      { name: 'The Autonomous Microfactory Hive', form: 'service-building' },
      { name: 'The Biogenic Materials Foundry', form: 'utility-plant' },
      { name: 'The Machine Genesis Hall', form: 'hall' },
      { name: 'The Destructive Testing Monolith', form: 'tower' },
      { name: 'Platform Zero', form: 'transit-hub' },
      { name: 'The Thermal Recovery and Process Power Station', form: 'utility-plant' },
      { name: 'The Closed-Loop Reclamation Works', form: 'utility-plant' },
      { name: 'Building Ø', form: 'warehouse' },
    ],
    objects: [
      { name: 'Production Meridian', kind: 'street-furniture' },
      { name: 'Seawall Service Loop', kind: 'street-furniture' },
      { name: 'Platform Zero Rail Fan', kind: 'vehicle' },
      { name: 'Elevated Process Pipe Racks', kind: 'process-equipment' },
      { name: 'Enclosed Conveyor Bridges', kind: 'gantry' },
      { name: 'Permanent Amber Guidance Strips', kind: 'signage' },
      { name: 'Legacy Automatic Works Annex', kind: 'storage' },
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
