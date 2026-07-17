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
      { name: 'Medicinal Chemistry Laboratory', form: 'lab-block' },
      { name: 'Therapeutics Screening Hall', form: 'hall' },
      { name: 'Medicinal Plant Conservatory', form: 'greenhouse' },
      { name: 'Automated Compound Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'High-Throughput Screening Robots', kind: 'robot' },
      { name: 'Compound Carousel', kind: 'storage' },
      { name: 'Dissolution Analyzer Benches', kind: 'instrument' },
      { name: 'Medicinal Herb Beds', kind: 'garden' },
    ],
  },
  'microbiology-labs': {
    facilities: [
      { name: 'Biosafety Culture Laboratory', form: 'lab-block' },
      { name: 'Glazed Microbe Gallery', form: 'pavilion' },
      { name: 'Shared Sample Transfer Hub', form: 'service-building' },
      { name: 'Sterilization Utility House', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Incubator Banks', kind: 'process-equipment' },
      { name: 'Laminar Flow Cabinets', kind: 'instrument' },
      { name: 'Autoclave Cluster', kind: 'process-equipment' },
      { name: 'Biosecure Transfer Carts', kind: 'vehicle' },
    ],
  },
  'genomics-labs': {
    facilities: [
      { name: 'Genome Sequencing Hall', form: 'hall' },
      { name: 'Population Genomics Laboratory', form: 'lab-block' },
      { name: 'Cryogenic Sample Vault', form: 'subterranean-bunker' },
      { name: 'Genomic Data Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Sequencer Racks', kind: 'instrument' },
      { name: 'Robotic Library Preparation Cells', kind: 'robot' },
      { name: 'Liquid Nitrogen Sample Tanks', kind: 'storage' },
      { name: 'Genome Data Facade', kind: 'signage' },
    ],
  },
  'proteomics-labs': {
    facilities: [
      { name: 'Mass Spectrometry Hall', form: 'hall' },
      { name: 'Protein Chemistry Laboratory', form: 'lab-block' },
      { name: 'Sample Preparation Pavilion', form: 'pavilion' },
      { name: 'Cold Reagent Store', form: 'service-building' },
    ],
    objects: [
      { name: 'Orbitrap Instrument Suite', kind: 'instrument' },
      { name: 'Chromatography Columns', kind: 'process-equipment' },
      { name: 'Automated Sample Freezers', kind: 'storage' },
      { name: 'Protein Fold Light Sculpture', kind: 'public-art' },
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
      { name: 'Translational Research Hospital', form: 'hospital' },
      { name: 'Diagnostic Imaging Wing', form: 'lab-block' },
      { name: 'Clinical Trials Pavilion', form: 'pavilion' },
      { name: 'Regenerative Medicine Greenhouse', form: 'greenhouse' },
    ],
    objects: [
      { name: 'Diagnostic Scanner Suite', kind: 'medical-equipment' },
      { name: 'Autonomous Patient Shuttles', kind: 'vehicle' },
      { name: 'Sheltered Healing Garden', kind: 'garden' },
      { name: 'Emergency Landing Drone', kind: 'drone' },
    ],
  },
  'molecular-biology-labs': {
    facilities: [
      { name: 'Molecular Assembly Laboratory', form: 'lab-block' },
      { name: 'Transparent Sample Spine', form: 'pavilion' },
      { name: 'Cell Engineering Hall', form: 'hall' },
      { name: 'Reagent Utility House', form: 'service-building' },
    ],
    objects: [
      { name: 'PCR Instrument Banks', kind: 'instrument' },
      { name: 'Automated Pipetting Robots', kind: 'robot' },
      { name: 'Reagent Cold Stores', kind: 'storage' },
      { name: 'Molecular Model Sculpture', kind: 'public-art' },
    ],
  },
  'biochemistry-labs': {
    facilities: [
      { name: 'Bioprocess Research Laboratory', form: 'lab-block' },
      { name: 'Fermentation Pilot Hall', form: 'hall' },
      { name: 'Enzyme Analysis Pavilion', form: 'pavilion' },
      { name: 'Clean Utility Plant', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Stainless Fermenter Battery', kind: 'process-equipment' },
      { name: 'Ordered Utility Pipe Racks', kind: 'gantry' },
      { name: 'Process Chromatography Skids', kind: 'instrument' },
      { name: 'Buffer Preparation Tanks', kind: 'storage' },
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
      { name: 'Automated Bioanalysis Hall', form: 'hall' },
      { name: 'Instrumentation Laboratory', form: 'lab-block' },
      { name: 'Secure Sample Receiving House', form: 'service-building' },
      { name: 'Method Development Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Mass Spectrometer Pods', kind: 'instrument' },
      { name: 'Robotic Sample Track', kind: 'robot' },
      { name: 'Temperature-Controlled Intake Lockers', kind: 'storage' },
      { name: 'Analysis Status Beacons', kind: 'signage' },
    ],
  },
  'organic-chemistry-labs': {
    facilities: [
      { name: 'Organic Synthesis Laboratory', form: 'lab-block' },
      { name: 'Pilot Reaction Hall', form: 'hall' },
      { name: 'Solvent Recovery Plant', form: 'utility-plant' },
      { name: 'Analytical Chemistry Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Ventilated Fume Stacks', kind: 'process-equipment' },
      { name: 'Jacketed Reactor Skids', kind: 'process-equipment' },
      { name: 'Tanker-Safe Unloading Station', kind: 'cargo' },
      { name: 'Flammable Solvent Cabinets', kind: 'storage' },
      { name: 'Emergency Foam Monitors', kind: 'security' },
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
      { name: 'Island Security Command Center', form: 'subterranean-bunker' },
      { name: 'Response Team Barracks', form: 'residential-block' },
      { name: 'Eastern Checkpoint Hall', form: 'hall' },
      { name: 'Drone Operations Hangar', form: 'hangar' },
    ],
    objects: [
      { name: 'Checkpoint Barrier Lanes', kind: 'security' },
      { name: 'Patrol Drone Pads', kind: 'drone' },
      { name: 'Armored Response Vehicles', kind: 'vehicle' },
      { name: 'Long-Range Sensor Masts', kind: 'antenna' },
      { name: 'Emergency Warning Beacons', kind: 'signage' },
    ],
  },
  'forensic-cyberforensic-lab': {
    facilities: [
      { name: 'Forensic Evidence Laboratory', form: 'lab-block' },
      { name: 'Cyber Operations Tower', form: 'tower' },
      { name: 'Controlled Vehicle Intake Hall', form: 'hall' },
      { name: 'Shielded Evidence Vault', form: 'subterranean-bunker' },
    ],
    objects: [
      { name: 'Digital Forensics Workstations', kind: 'instrument' },
      { name: 'Evidence Transfer Lockers', kind: 'storage' },
      { name: 'Vehicle Examination Lift', kind: 'process-equipment' },
      { name: 'Encrypted Communications Mast', kind: 'antenna' },
      { name: 'Chain-of-Custody Scanners', kind: 'security' },
    ],
  },
  'inorganic-chemistry': {
    facilities: [
      { name: 'Mineral Analysis Laboratory', form: 'lab-block' },
      { name: 'Technical Ceramics Workshop', form: 'studio' },
      { name: 'High-Temperature Kiln Hall', form: 'hall' },
      { name: 'Inorganic Pilot Plant', form: 'utility-plant' },
    ],
    objects: [
      { name: 'Ore Sample Racks', kind: 'storage' },
      { name: 'Ceramic Kiln Battery', kind: 'process-equipment' },
      { name: 'Rugged Aggregate Hoppers', kind: 'cargo' },
      { name: 'Mineral Diffraction Instruments', kind: 'instrument' },
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
      { name: 'Automated Distribution Warehouse', form: 'warehouse' },
      { name: 'Cargo Consolidation Hall', form: 'hall' },
      { name: 'Freight Control Tower', form: 'tower' },
      { name: 'Fleet Service Hangar', form: 'hangar' },
    ],
    objects: [
      { name: 'Autonomous Cargo Drones', kind: 'drone' },
      { name: 'Container Loading Gantries', kind: 'gantry' },
      { name: 'Electric Freight Tractors', kind: 'vehicle' },
      { name: 'Stacked Smart Containers', kind: 'cargo' },
      { name: 'Freight Lane Signals', kind: 'signage' },
    ],
  },
  'entry-commercial': {
    facilities: [
      { name: 'Cyber City Arrival Concourse', form: 'transit-hub' },
      { name: 'Island Customs Hall', form: 'hall' },
      { name: 'Bridgehead Retail Pavilion', form: 'pavilion' },
      { name: 'Visitor Services Tower', form: 'tower' },
    ],
    objects: [
      { name: 'Automated Border Gates', kind: 'security' },
      { name: 'Neon Arrival Totems', kind: 'signage' },
      { name: 'Transit Shuttle Pods', kind: 'vehicle' },
      { name: 'Bridgehead Luggage Robots', kind: 'robot' },
      { name: 'Customs Inspection Scanners', kind: 'instrument' },
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
      { name: 'Ashcroft Grand Library', form: 'library' },
      { name: 'Wren Rare Books Library', form: 'library' },
      { name: 'Institute for Theoretical Sciences', form: 'administration' },
      { name: 'Blackwood Collegiate Lecture Hall', form: 'hall' },
      { name: 'Scholars Cloister and Archive', form: 'library' },
    ],
    objects: [
      { name: 'Founders Quadrangle Park', kind: 'garden' },
      { name: 'Philosophers Reading Garden', kind: 'garden' },
      { name: 'Open Scholars Lawn', kind: 'garden' },
      { name: 'Bronze Scholars Fountain', kind: 'water-feature' },
      { name: 'Gaslight Reading Courts', kind: 'street-furniture' },
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
      { name: 'Subsurface Accelerator Ring', form: 'subterranean-bunker' },
      { name: 'Grand Particle Detector Hall', form: 'detector-hall' },
      { name: 'Cryogenic Services Plant', form: 'utility-plant' },
      { name: 'Accelerator Control Pavilion', form: 'pavilion' },
    ],
    objects: [
      { name: 'Superconducting Magnet Modules', kind: 'instrument' },
      { name: 'Liquid Helium Storage Tanks', kind: 'storage' },
      { name: 'Circular Service Gantries', kind: 'gantry' },
      { name: 'Radiation Exclusion Beacons', kind: 'security' },
      { name: 'Detector Component Transporter', kind: 'vehicle' },
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
