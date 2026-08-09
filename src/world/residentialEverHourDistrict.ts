import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type DistrictKind = 'residential' | 'ever-hour';

export interface LiveWorkBuildingProgram {
  code: string;
  name: string;
  form: string;
  purpose: string;
  exteriorMotif: string;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  zone: string;
  lighting: string;
}

export const RESIDENTIAL_SCIENTISTS_BUILDING_PROGRAM: readonly LiveWorkBuildingProgram[] = [
  { code: 'R01', name: 'Meridian Crescent Residences', form: 'five-part-crescent', purpose: 'landmark permanent apartments opening toward Long Horizon Park', exteriorMotif: 'five rotated brick and ceramic sections with deep inhabited balconies, bronze portals, planted terraces, and a green photovoltaic crown', footprintMetres: [132, 62], heightMetres: 25, radialT: 0.48, angularT: 0.37, zone: 'permanent residential heart', lighting: 'irregular warm inhabited windows' },
  { code: 'R02', name: 'Helix Terraces', form: 'intertwined-terraces', purpose: 'family-oriented stepped housing', exteriorMotif: 'two curving strands descending from seven to four storeys with planted balcony channels, cylindrical stairs, bridges, and greenhouse roofs', footprintMetres: [116, 68], heightMetres: 24, radialT: 0.67, angularT: 0.37, zone: 'Family Orbit Garden edge', lighting: 'soft translucent stair lanterns' },
  { code: 'R03', name: 'Circadian House', form: 'shielded-shift-house', purpose: 'quiet accommodation for rotating and nocturnal staff', exteriorMotif: 'heavy charcoal ceramic shell, deeply recessed constellation windows, double shutters, acoustic entrance court, and circadian roof band', footprintMetres: [82, 60], heightMetres: 22, radialT: 0.29, angularT: 0.13, zone: 'quiet southern shift-worker band', lighting: 'low amber and protected roof phase band' },
  { code: 'R04', name: 'Rootline Garden Homes', form: 'terrain-homes', purpose: 'domestic clusters at the Environmental Science transition', exteriorMotif: 'earth-embedded two and three storey clusters, sloping planted roofs, copper vents, rain channels, ponds, and small covered gates', footprintMetres: [126, 72], heightMetres: 12, radialT: 0.86, angularT: 0.13, zone: 'Rootline ecological edge', lighting: 'sparse shielded amber' },
  { code: 'R05', name: 'Lattice Twin Residences', form: 'lattice-twin-towers', purpose: 'apartments for single residents, couples, and early-career researchers', exteriorMotif: 'two angled eleven-storey towers wrapped in champagne structural lattices with two translucent bridges and open sensor crowns', footprintMetres: [92, 58], heightMetres: 42, radialT: 0.86, angularT: 0.87, zone: 'northern residential landmark', lighting: 'two horizontal bridge lanterns' },
  { code: 'R06', name: 'Parallax Long-Stay Apartments', form: 'shifted-terrace-blocks', purpose: 'adaptable months-to-years accommodation', exteriorMotif: 'three laterally shifted reddish ceramic blocks with bronze glass, movable screens, tree-filled terraces, and a photovoltaic Continuum canopy', footprintMetres: [104, 58], heightMetres: 29, radialT: 0.10, angularT: 0.37, zone: 'residential to guest transition', lighting: 'warm domestic terraces' },
  { code: 'R07', name: 'Archive Court Residences', form: 'scholarly-quadrangle', purpose: 'quiet housing for senior and retired researchers and long-term fellows', exteriorMotif: 'four black-brick wings around a narrow court, parabolic bronze arcades, observatory-like copper-capped corner towers, and reflecting channel', footprintMetres: [92, 70], heightMetres: 16, radialT: 0.29, angularT: 0.37, zone: '03:17 Garden quiet edge', lighting: 'minimal scholarly amber' },
  { code: 'R08', name: 'Orbit Family Blocks', form: 'six-block-orbit', purpose: 'family apartments surrounding a protected park', exteriorMotif: 'six rounded polygonal blocks linked by a continuous low canopy, broad screened balconies, uneven green roofs, photovoltaic sails, and ventilation chimneys', footprintMetres: [118, 76], heightMetres: 21, radialT: 0.86, angularT: 0.37, zone: 'Family Orbit Garden', lighting: 'warm porch and canopy light' },
  { code: 'R09', name: 'Commons Cooperative', form: 'modular-courtyard', purpose: 'communal housing for doctoral researchers, technicians, apprentices, and temporary teams', exteriorMotif: 'four framed modular wings around a sheltered courtyard with glass bridges and a luminous elevated garden canopy', footprintMetres: [92, 68], heightMetres: 19, radialT: 0.67, angularT: 0.63, zone: 'active residential center', lighting: 'moving silhouettes and diffuse courtyard light' },
  { code: 'R10', name: 'Horizon Accessible Residences', form: 'accessible-terraces', purpose: 'universally accessible and adaptable housing', exteriorMotif: 'low limestone bars around broad courts with landscape ramps, sheltered docking porches, transparent roof-loop windscreens, and photovoltaic canopies', footprintMetres: [120, 72], heightMetres: 15, radialT: 0.48, angularT: 0.13, zone: 'quiet accessible garden band', lighting: 'integrated handrail and entrance light' },
  { code: 'R11', name: 'Resident Commons Hall', form: 'interlocking-civic-hall', purpose: 'social and civic center of the residential district', exteriorMotif: 'three rotated stone, timber-glass, and translucent volumes above a public planted stair beneath branching bronze roof supports', footprintMetres: [86, 58], heightMetres: 18, radialT: 0.10, angularT: 0.63, zone: 'Continuum gateway and Long Horizon Park', lighting: 'warm upper pavilion landmark' },
  { code: 'R12', name: 'Neighborhood Laboratory House', form: 'residential-lab-court', purpose: 'bookable low-risk resident laboratories', exteriorMotif: 'three-storey ceramic and brick square around a planted light court with projecting modules, status panels, bronze mesh, greenhouse, and screened service edge', footprintMetres: [76, 62], heightMetres: 13, radialT: 0.10, angularT: 0.87, zone: 'eastern resident work edge', lighting: 'cyan green amber and ultraviolet status indicators' },
  { code: 'R13', name: 'Fabrication Mews', form: 'eight-workshop-mews', purpose: 'bookable electronics, repair, fabrication, and artistic-technology workshops', exteriorMotif: 'eight narrow workshops facing a covered service court under a folded photovoltaic roof with copper-orange safety edges and a planted acoustic wall', footprintMetres: [128, 58], heightMetres: 10, radialT: 0.29, angularT: 0.87, zone: 'screened resident service edge', lighting: 'restrained workshop thresholds' },
  { code: 'R14', name: 'Solstice Covered Pool', form: 'timber-oval-pool', purpose: 'quiet residential swimming and wellness', exteriorMotif: 'low oval timber-rib roof with glass and photovoltaic strips above a rough stone base, water-glimpse band, bronze rain chains, and planted mechanical mounds', footprintMetres: [94, 64], heightMetres: 13, radialT: 0.67, angularT: 0.20, zone: 'Pool Commons south', lighting: 'contained warm roof glow' },
  { code: 'R15', name: 'Wintergarden Recreation Hall', form: 'three-conservatories', purpose: 'covered garden, exercise, indoor courts, and communal recreation', exteriorMotif: 'three asymmetrical glass conservatories on a dark-brick base with climbing cables, shade panels, exercise terrace, ventilation fins, and kinetic weather panels', footprintMetres: [98, 66], heightMetres: 17, radialT: 0.67, angularT: 0.76, zone: 'Family Orbit leisure edge', lighting: 'soft conservatory glow' },
  { code: 'R16', name: 'Resident Loop Mall', form: 'covered-retail-ring', purpose: 'small nonstop neighborhood mall', exteriorMotif: 'two-storey ceramic and bronze ring around a tree-pierced covered court with deep shop recesses, parcel wall, external balcony, and four broad stairs', footprintMetres: [86, 74], heightMetres: 10, radialT: 0.48, angularT: 0.63, zone: 'Long Horizon Park retail edge', lighting: 'controlled shared signage band' },
  { code: 'R17', name: 'The Common Table Market Hall', form: 'food-market-hall', purpose: 'principal neighborhood restaurant and food market', exteriorMotif: 'long low brick-colonnaded hall beneath a folded zinc roof with glass lanterns, sculptural extraction chimneys, communal tables, and rain-garden bridges', footprintMetres: [112, 52], heightMetres: 12, radialT: 0.48, angularT: 0.87, zone: 'northern social edge', lighting: 'warm all-hour counter and cafe light' },
  { code: 'R18', name: 'Nocturne Cafe and Reading Pavilion', form: 'water-reading-pavilion', purpose: 'continuously open quiet cafe and reading place', exteriorMotif: 'narrow bronze-glass pavilion on dark stone surrounded by reflecting water, bridges, planting, adjustable shutters, and a sharply projecting timber-lined roof', footprintMetres: [64, 46], heightMetres: 9, radialT: 0.29, angularT: 0.63, zone: '03:17 Garden', lighting: 'narrow amber soffit and occupancy beacon' },
  { code: 'R19', name: 'Night Clinic and Pharmacy', form: 'night-clinic', purpose: 'urgent basic care, occupational assessment, telemedicine, pharmacy, and minor treatment', exteriorMotif: 'compact pale stone block with silver metal, translucent green glass, deep horizontal frames, medical arrival canopy, planted setback, and screened rear service', footprintMetres: [72, 52], heightMetres: 16, radialT: 0.10, angularT: 0.13, zone: 'visible residential to Ever Hour boundary', lighting: 'calm green pharmacy and entrance light' },
  { code: 'R20', name: 'Seedling House', form: 'rounded-childcare-cluster', purpose: 'childcare, after-school activities, family support, and introductory science education', exteriorMotif: 'rounded ceramic, timber, and colored-glass pavilions beneath one undulating photovoltaic roof in a protected observation garden', footprintMetres: [92, 64], heightMetres: 11, radialT: 0.86, angularT: 0.63, zone: 'Family Orbit Garden', lighting: 'small warm colored entrance lights' },
  { code: 'R21', name: 'Neon Horizon Arcology', form: 'cyberpunk-scientist-megablock', purpose: 'high-capacity permanent apartments for local scientists and their families', exteriorMotif: 'three staggered black-alloy apartment towers with suspended cyan bridges, magenta balcony rails, luminous service cores, rooftop gardens, and an orbital communications crown', footprintMetres: [86, 50], heightMetres: 105, radialT: 0.985, angularT: 0.24, zone: 'red-contour outer crescent south', lighting: 'cyan vertical cores with magenta inhabited balcony bands' },
  { code: 'R22', name: 'Quantum Terrace Megablock', form: 'cyberpunk-scientist-megablock', purpose: 'dense adaptable homes for laboratory teams and multigenerational scientist households', exteriorMotif: 'offset violet apartment slabs rising from a public undercroft with two aerial garden streets, holographic address fins, and a radiant quantum-loop crown', footprintMetres: [96, 48], heightMetres: 118, radialT: 0.985, angularT: 0.51, zone: 'red-contour outer crescent center', lighting: 'violet sky terraces, cyan windows, and animated magenta wayfinding' },
  { code: 'R23', name: 'Outerlight Scientist Residences', form: 'cyberpunk-scientist-megablock', purpose: 'large long-term apartment quarter for senior researchers, resident engineers, and shared households', exteriorMotif: 'three asymmetrical indigo towers with stepped dwelling pods, luminous exoskeleton rails, high sky gardens, and a faceted neon observatory deck', footprintMetres: [88, 50], heightMetres: 98, radialT: 0.985, angularT: 0.79, zone: 'red-contour outer crescent north', lighting: 'cool cyan exoskeleton with violet and rose apartment lights' },
  { code: 'R24', name: 'Southline Habitat Stack', form: 'cyberpunk-scientist-megablock', purpose: 'shift-friendly vertical apartments for local scientists working in southern research districts', exteriorMotif: 'slender paired habitat stacks above a shielded night plaza with chamfered skybridges, magenta lift cores, and low-glare cyan residential bands', footprintMetres: [54, 126], heightMetres: 110, radialT: 0.30, angularT: 0.012, zone: 'red-contour southern perimeter west', lighting: 'shielded violet and cyan bands with a magenta arrival portal' },
  { code: 'R25', name: 'Chromatic Skybridge Apartments', form: 'cyberpunk-scientist-megablock', purpose: 'large family and cooperative apartments spanning the southern residential edge', exteriorMotif: 'three narrow high-rise blocks linked by inhabited chromatic skybridges, suspended gardens, photovoltaic fins, and a prismatic rooftop beacon', footprintMetres: [56, 118], heightMetres: 94, radialT: 0.68, angularT: 0.012, zone: 'red-contour southern perimeter east', lighting: 'alternating cyan, violet, and rose skybridge light' },
  { code: 'R26', name: 'Continuum Gate Residences', form: 'cyberpunk-scientist-megablock', purpose: 'permanent scientist apartments at the live-work transition to the Ever Hour district', exteriorMotif: 'two tall graphite apartment towers and one lower social tower around an open neon gate, with elevated communal laboratories and luminous circulation bridges', footprintMetres: [90, 48], heightMetres: 104, radialT: 0.012, angularT: 0.31, zone: 'red-contour inner Continuum edge south', lighting: 'cyan gate, magenta circulation rails, and violet residential windows' },
  { code: 'R27', name: 'Nightshift Vertical Quarter', form: 'cyberpunk-scientist-megablock', purpose: 'twenty-four-hour apartment quarter for nocturnal and rotating local research staff', exteriorMotif: 'three irregular midnight towers with protected sleep pods, neon wintergardens, suspended reading rooms, and a crown calibrated to the residential circadian cycle', footprintMetres: [96, 48], heightMetres: 122, radialT: 0.012, angularT: 0.72, zone: 'red-contour inner Continuum edge north', lighting: 'deep violet facade with cyan circulation and sparse rose occupancy signals' },
  { code: 'R28', name: 'Western Aurora Residences', form: 'cyberpunk-residential-edge-ensemble', purpose: 'permanent apartments in the northwestern Residential pocket', exteriorMotif: 'two staggered graphite dwelling slabs, a lower commons house, cyan wintergardens, magenta balcony ribbons, and a planted photovoltaic crown', footprintMetres: [104, 58], heightMetres: 78, radialT: 0.08, angularT: 0.995, zone: 'green-contour Residential edge inner gate', lighting: 'cyan circulation cores with rose inhabited terraces' },
  { code: 'R29', name: 'Neon Orchard Apartments', form: 'cyberpunk-residential-edge-ensemble', purpose: 'family apartments with shared gardens inside the Residential boundary', exteriorMotif: 'paired indigo residential bars around a neon orchard court with suspended play decks, luminous lift towers, and violet garden bridges', footprintMetres: [110, 60], heightMetres: 72, radialT: 0.20, angularT: 0.93, zone: 'green-contour Residential edge orchard court', lighting: 'violet garden bridges and cyan entry lanterns' },
  { code: 'R30', name: 'Helix Coast Habitat', form: 'cyberpunk-residential-edge-ensemble', purpose: 'adaptable homes for coastal and environmental research teams within the Residential district', exteriorMotif: 'three offset apartment terraces stepping around an open climate court with holographic screens, diagonal exoskeletons, and a rotating-looking static helix crown', footprintMetres: [112, 62], heightMetres: 88, radialT: 0.32, angularT: 0.995, zone: 'green-contour Residential edge climate court', lighting: 'alternating cyan and magenta climate-status bands' },
  { code: 'R31', name: 'Lumina Family Terraces', form: 'cyberpunk-residential-edge-ensemble', purpose: 'large multigenerational homes with childcare and common rooms', exteriorMotif: 'stepped black-violet family terraces linked by broad luminous conservatories, rooftop allotments, and sheltered neon arrival courts', footprintMetres: [116, 64], heightMetres: 82, radialT: 0.38, angularT: 0.93, zone: 'green-contour Residential edge family court', lighting: 'warm rose occupancy signals within cool cyan frames' },
  { code: 'R32', name: 'Parallax Garden Towers', form: 'cyberpunk-residential-edge-ensemble', purpose: 'high-capacity scientist apartments overlooking the Environmental Science transition without occupying it', exteriorMotif: 'two misaligned residential towers with a transparent central garden spine, sky lounges, photovoltaic fins, and long cyan balcony edges', footprintMetres: [102, 58], heightMetres: 96, radialT: 0.56, angularT: 0.995, zone: 'green-contour Residential edge garden court', lighting: 'cyan balcony edges with violet garden spine' },
  { code: 'R33', name: 'Midnight Researcher Housing', form: 'cyberpunk-residential-edge-ensemble', purpose: 'quiet shielded apartments for rotating and nocturnal researchers', exteriorMotif: 'dark acoustic dwelling slabs around a recessed night garden with protected magenta windows, cyan service cores, and a low-glare orbital roof marker', footprintMetres: [100, 56], heightMetres: 92, radialT: 0.68, angularT: 0.93, zone: 'green-contour Residential edge night court', lighting: 'shielded violet and magenta windows with cyan emergency wayfinding' },
  { code: 'R34', name: 'Coastal Circuit Residences', form: 'cyberpunk-residential-edge-ensemble', purpose: 'permanent homes at the Residential ecological interface', exteriorMotif: 'circuit-like stepped apartment bars, an elevated communal laboratory bridge, prismatic rain collectors, and neon-lined planted terraces', footprintMetres: [108, 58], heightMetres: 84, radialT: 0.80, angularT: 0.995, zone: 'green-contour Residential edge circuit court', lighting: 'cyan circuit traces and violet terrace beacons' },
  { code: 'R35', name: 'Prism Commons Apartments', form: 'cyberpunk-residential-edge-ensemble', purpose: 'cooperative apartments and shared work rooms inside the Residential district', exteriorMotif: 'faceted dark residential wings flanking a translucent prismatic commons, with staggered sky decks, rooftop gardens, and magenta wayfinding fins', footprintMetres: [110, 60], heightMetres: 86, radialT: 0.90, angularT: 0.93, zone: 'green-contour Residential edge prism court', lighting: 'prismatic cyan-violet commons glow and rose balcony rails' },
  { code: 'R36', name: 'Outer Meridian Residential Gate', form: 'cyberpunk-residential-edge-ensemble', purpose: 'apartment landmark at the outer end of the northwestern Residential pocket', exteriorMotif: 'three slender midnight apartment stacks framing an open meridian gate with twin inhabited skybridges, a vertical cyan beacon, and a circular magenta crown', footprintMetres: [118, 62], heightMetres: 102, radialT: 0.99, angularT: 0.995, zone: 'green-contour Residential edge outer gate', lighting: 'vertical cyan meridian with magenta crown and violet apartment bands' },
] as const;

export const EVER_HOUR_BUILDING_PROGRAM: readonly LiveWorkBuildingProgram[] = [
  { code: 'H01', name: 'Ever Hour Exchange Hotel', form: 'chronometer-crescent', purpose: 'central guest hotel and district landmark', exteriorMotif: 'eight-storey basalt-to-opaline crescent around Chronogarden with bronze glazing, moving chronometer fins, collaboration-time crown, and brass-lined oval forecourt', footprintMetres: [136, 68], heightMetres: 33, radialT: 0.78, angularT: 0.66, zone: 'hotel and Chronogarden heart', lighting: 'warm silver and pale gold with time crown' },
  { code: 'H02', name: 'Meridian Visiting Scholars Hotel', form: 'four-part-twisted-hotel', purpose: 'high-capacity visiting scholar accommodation beside the laboratory zone', exteriorMotif: 'four rotated ceramic and titanium tower sections with deep sample-tray windows above a sheltered public plaza, Bench Street bridge, sensors, and weather beacon', footprintMetres: [94, 60], heightMetres: 38, radialT: 0.44, angularT: 0.34, zone: 'Bench Street hotel interface', lighting: 'pale bridge and weather beacon' },
  { code: 'H03', name: 'Interim House', form: 'suspended-garden-slabs', purpose: 'apartment-style accommodation for several weeks to one year', exteriorMotif: 'two shifted six-storey slabs around a planted court with smoked bronze glass, mesh screens, recessed passage, and suspended garden bridges', footprintMetres: [104, 62], heightMetres: 23, radialT: 0.78, angularT: 0.34, zone: 'domestic hotel transition', lighting: 'warm individually occupied balconies' },
  { code: 'H04', name: 'Null Hour Transit Lodge', form: 'mesh-transit-lodge', purpose: 'compact late-arrival and early-departure lodging', exteriorMotif: 'black metal rectangle with scattered square windows behind expanded mesh, continuous numbered arcade, cut triangular arrival court, and 00:00 transit sign', footprintMetres: [76, 48], heightMetres: 19, radialT: 0.94, angularT: 0.20, zone: 'southern transit edge', lighting: 'individually controlled window frames' },
  { code: 'H05', name: "Fellows' Cloister Guesthouse", form: 'water-cloister', purpose: 'guesthouse for senior visitors, lecturers, historians, and artists in residence', exteriorMotif: 'three-storey black-brick quadrangle with parabolic arcades, bronze inner walks, planted zinc roofs, engraved copper-capped towers, and long water garden', footprintMetres: [92, 68], heightMetres: 16, radialT: 0.78, angularT: 0.12, zone: 'quiet 03:17 Garden edge', lighting: 'low amber cloister light' },
  { code: 'H06', name: 'Scientific Interchange Forum', form: 'walkable-conference-ring', purpose: 'principal conference, lecture, collaboration, and event venue', exteriorMotif: 'low basalt and concrete ring with four illuminated foyer wedges, one rising walkable roof, planted discussion terraces, and retractable petal canopies', footprintMetres: [124, 86], heightMetres: 18, radialT: 0.44, angularT: 0.12, zone: 'southern conference band', lighting: 'shielded foyer wedges' },
  { code: 'H07', name: 'Access and Protocol House', form: 'ceramic-lab-gate', purpose: 'laboratory registration, certification, equipment authorization, and safety access', exteriorMotif: 'two engraved pale ceramic volumes joined by an upper bridge around a transparent gate passage with standardized status strips and credential service ports', footprintMetres: [72, 52], heightMetres: 16, radialT: 0.27, angularT: 0.80, zone: 'Bench Street gate', lighting: 'standard cyan green amber ultraviolet access strips' },
  { code: 'H08', name: 'Benchlight Laboratory Arcade', form: 'twin-micro-lab-arcade', purpose: 'principal collection of bookable micro-laboratories', exteriorMotif: 'two long modular laboratory bars facing Bench Street beneath a transparent photovoltaic roof with ordered utilities, switchable windows, booking strips, and separate rear service interfaces', footprintMetres: [128, 66], heightMetres: 12, radialT: 0.27, angularT: 0.58, zone: 'bookable laboratory street', lighting: 'module vacancy preparation occupancy cleaning indicators' },
  { code: 'H09', name: 'The Instrument Lantern', form: 'hovering-channel-glass-cube', purpose: 'imaging, spectroscopy, microscopy, and precision measurement', exteriorMotif: 'milky channel-glass cube hovering above a vibration plinth with black grid, brass calibration lines, transparent cooling spine, freight tower, and nanometre plaza scales', footprintMetres: [74, 68], heightMetres: 22, radialT: 0.10, angularT: 0.34, zone: 'inner precision laboratory edge', lighting: 'uniform pale analytical lantern' },
  { code: 'H10', name: 'QuickMatter Materials and Chemistry Studios', form: 'sawtooth-chemistry-studios', purpose: 'bookable coatings, polymer, electrochemistry, microfluidics, and formulation work', exteriorMotif: 'low repeating sawtooth bays in chemical ceramic with dark loading recesses, staggered silver exhaust towers, rain-garden front, and screened technical rear', footprintMetres: [122, 58], heightMetres: 11, radialT: 0.27, angularT: 0.20, zone: 'southern technical edge', lighting: 'small shielded bay status lights' },
  { code: 'H11', name: 'BioMinute Sample Laboratories', form: 'triangular-bioceramic-lab', purpose: 'contained low-risk sample preparation, microscopy, cell-free assays, and environmental testing', exteriorMotif: 'rounded triangular bioceramic complex around an isolation garden with three filtration towers, green glazing, bioswale bridges, frosted status bands, and cold-chain porch', footprintMetres: [84, 76], heightMetres: 14, radialT: 0.27, angularT: 0.42, zone: 'southern controlled laboratory edge', lighting: 'entrance and bridge light only' },
  { code: 'H12', name: 'Circuit Yard Electronics and Robotics Studios', form: 'five-hall-test-yard', purpose: 'electronics, sensors, small robots, drones, and hardware assembly', exteriorMotif: 'five folded-roof halls opening to a grid test yard with obstacles, charging pylons, motion-capture fence, overhead rails, drone pads, and copper-orange safety edges', footprintMetres: [126, 78], heightMetres: 12, radialT: 0.10, angularT: 0.66, zone: 'Robotics interface', lighting: 'controlled crossings and charging points' },
  { code: 'H13', name: 'DryLab 24', form: 'faceted-data-tower', purpose: 'computational studios, simulation, visualization, remote instruments, and digital twins', exteriorMotif: 'slender faceted seven-storey smoked-glass tower with matte black electronic-ink fields, vertical opaline data strips, solid southern face, sunken planted plaza, and Instrument Lantern bridge', footprintMetres: [58, 48], heightMetres: 28, radialT: 0.10, angularT: 0.12, zone: 'inner scientific ring and dark-sky edge', lighting: 'north and east data strips only' },
  { code: 'H14', name: 'Aqua Meridian Covered Pool', form: 'transparent-airship-pool', purpose: 'principal guest swimming complex and leisure landmark', exteriorMotif: 'flattened elliptical timber and dark-steel shell with clear, photovoltaic, and shaded panels above a sheltered stone promenade and reed rain basins', footprintMetres: [118, 78], heightMetres: 18, radialT: 0.61, angularT: 0.42, zone: 'Pool Commons landmark', lighting: 'gentle water-reflected shell glow' },
  { code: 'H15', name: 'Blue Hour Recovery Baths', form: 'frosted-vessel-baths', purpose: 'quiet warm-water recovery and wellness', exteriorMotif: 'low frosted cylindrical vessels wrapped in bronze rings beneath a branching glass canopy with steam vents, grasses, water channels, and winding arrival', footprintMetres: [88, 66], heightMetres: 10, radialT: 0.61, angularT: 0.20, zone: 'quiet southern Pool Commons', lighting: 'soft frosted glow through mist' },
  { code: 'H16', name: 'Orbit Leisure Pavilion', form: 'mesh-leisure-loop', purpose: 'exercise, climbing, sports, movement classes, and informal team recreation', exteriorMotif: 'circular glazed loop behind folded silver mesh with diagonal structure, protected climbing surfaces, rooftop running path, gradual ramps, cross-building view passages, and kinetic wind fins', footprintMetres: [96, 88], heightMetres: 14, radialT: 0.61, angularT: 0.58, zone: 'Pool Commons active edge', lighting: 'warm recreation perimeter' },
  { code: 'H17', name: 'The Perpetual Table', form: 'all-hour-food-hall', purpose: 'primary 24-hour food hall', exteriorMotif: 'long two-storey colonnaded hall beneath dark metal roof and irregular lanterns with controlled restaurant fronts, retractable weather walls, sculptural chimneys, and world-time plaza', footprintMetres: [116, 54], heightMetres: 12, radialT: 0.61, angularT: 0.80, zone: 'northern nonstop promenade', lighting: 'warm continuous dining light' },
  { code: 'H18', name: 'The Greenhouse Refectory', form: 'edible-glass-gables', purpose: 'restaurant, orchard terrace, and visible edible growing', exteriorMotif: 'connected glass gables with black steel, bronze vents, trees, vines, raised beds, water channels, suspended canopy, orchard terrace, and herb-wall service screen', footprintMetres: [96, 64], heightMetres: 16, radialT: 0.78, angularT: 0.88, zone: 'Residential and Environmental transition', lighting: 'botanical shadowed interior glow' },
  { code: 'H19', name: 'Afterlight Sky Restaurant', form: 'cantilevered-sky-prism', purpose: 'formal restaurant and northern visual landmark', exteriorMotif: 'bronze glass prism cantilevered from dark stone tower above a reflecting pool with wrapping stair, glass lift, black-chrome canopy, reflective underside, and roof terrace', footprintMetres: [72, 54], heightMetres: 24, radialT: 0.94, angularT: 0.80, zone: 'northern visual edge', lighting: 'suspended afterlight silhouettes' },
  { code: 'H20', name: 'Minute Market', form: 'opaline-courtyard-market', purpose: 'primary general-purpose nonstop mall', exteriorMotif: 'two-storey rounded opaline rectangle around a membrane-covered tree court with champagne frames, curved corners, recessed fronts, monochrome sign band, pickup wall, balcony, and four stairs', footprintMetres: [88, 72], heightMetres: 10, radialT: 0.44, angularT: 0.66, zone: 'central nonstop retail', lighting: 'restrained monochrome retail bands' },
  { code: 'H21', name: 'Null Hour Arcade Mall', form: 'triangular-vertical-arcade', purpose: 'dense nocturnal retail beside the Transit Lodge', exteriorMotif: 'five-storey wedge of black brick, steel, glass block, projecting canopies, open stairs, small upper shopfronts, sheltered automat alley, steam vents, and intermittent time sign', footprintMetres: [72, 62], heightMetres: 19, radialT: 0.44, angularT: 0.88, zone: 'northern transit and nightlife edge', lighting: 'amber white red and pale cyan blade signs' },
  { code: 'H22', name: 'Orbit Supply Court', form: 'incomplete-transit-ring', purpose: 'scientific supply retail wrapped around a covered ring-transit stop', exteriorMotif: 'incomplete modular retail ring with five directional gaps under a broad roof, dark red steel, translucent glazing, route-map light band, transit pulses, photovoltaic terraces, collectors, and communications mast', footprintMetres: [94, 86], heightMetres: 11, radialT: 0.10, angularT: 0.88, zone: 'Robotics and laboratory supply interface', lighting: 'animated transit and route band' },
  { code: 'H23', name: 'The Ever Hour', form: 'four-quadrant-grand-hotel', purpose: 'flagship all-hour hotel, arrival hall, sky lobby, observatory lounge, and civic heart of the guest district', exteriorMotif: 'four monumental basalt and bronze-glass hotel towers around the public Continuum crossing, joined by elevated opaline sky lobbies beneath an illuminated time crown and THE EVER HOUR facade', footprintMetres: [196, 132], heightMetres: 132, radialT: 0.53, angularT: 0.50, zone: 'exact civic middle of the Ever Hour District', lighting: 'continuous pale-gold room bands, opaline sky lobbies, illuminated name facade, and slow astronomical crown' },
] as const;

const FLOOR_Y = 0.036;
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const CYLINDER_16 = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
const SPHERE = new THREE.SphereGeometry(0.5, 14, 9);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type Materials = ReturnType<typeof createMaterials>;

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.66, metalness: 0.12, ...options });
}

function createMaterials(kind: DistrictKind) {
  const cyberpunk = kind === 'residential';
  const blackBrick = material('Live-work warm black brick', cyberpunk ? '#080713' : '#1d1a18', { roughness: cyberpunk ? 0.7 : 0.95, metalness: cyberpunk ? 0.24 : 0.01 });
  const brownBrick = material('Live-work dark brown brick', cyberpunk ? '#141027' : '#3b2921', { roughness: cyberpunk ? 0.68 : 0.94, metalness: cyberpunk ? 0.18 : 0.01 });
  const redCeramic = material('Live-work reddish ceramic', cyberpunk ? '#321747' : '#854c3d', { roughness: cyberpunk ? 0.5 : 0.73, metalness: cyberpunk ? 0.2 : 0.03 });
  const paleCeramic = material('Live-work pale technical ceramic', cyberpunk ? '#8a92ad' : '#dedbd0', { roughness: cyberpunk ? 0.4 : 0.56, metalness: cyberpunk ? 0.28 : 0.04 });
  const charcoalCeramic = material('Live-work charcoal acoustic ceramic', cyberpunk ? '#111126' : '#24272a', { roughness: cyberpunk ? 0.58 : 0.82, metalness: cyberpunk ? 0.26 : 0.04 });
  const limestone = material('Live-work pale limestone', cyberpunk ? '#3a3854' : '#c9c0a9', { roughness: cyberpunk ? 0.68 : 0.91, metalness: cyberpunk ? 0.16 : 0.01 });
  const concrete = material('Live-work textured concrete', '#777772', { roughness: 0.96, metalness: 0.01 });
  const basalt = material('Ever Hour dark basalt', '#15191c', { roughness: 0.91, metalness: 0.04 });
  const timber = material('Live-work dark timber composite', cyberpunk ? '#21143d' : '#4d3827', { roughness: cyberpunk ? 0.62 : 0.83, metalness: cyberpunk ? 0.14 : 0.01 });
  const bronze = material('Live-work weathered bronze', cyberpunk ? '#7153c7' : '#8c6945', { roughness: cyberpunk ? 0.31 : 0.43, metalness: 0.76 });
  const copper = material('Live-work weathered copper', cyberpunk ? '#198998' : '#6c725b', { roughness: cyberpunk ? 0.34 : 0.52, metalness: 0.73 });
  const champagne = material('Ever Hour champagne metal', '#bda777', { roughness: 0.34, metalness: 0.82 });
  const titanium = material('Ever Hour matte titanium', '#9ca5a6', { roughness: 0.31, metalness: 0.88 });
  const blackSteel = material('Ever Hour black structural steel', '#101419', { roughness: 0.53, metalness: 0.82 });
  const darkGreenGlass = material(cyberpunk ? 'Residential opaque indigo glazing' : 'Residential dark green glass', cyberpunk ? '#101a36' : '#16332d', { emissive: cyberpunk ? '#152c5e' : '#183e34', emissiveIntensity: cyberpunk ? 0.48 : 0.22, roughness: 0.08, metalness: 0.18, transparent: !cyberpunk, opacity: cyberpunk ? 1 : 0.76, depthWrite: cyberpunk });
  const smokedGlass = material('Ever Hour smoked glazing', '#17262c', { emissive: '#243a40', emissiveIntensity: 0.22, roughness: 0.07, metalness: 0.18, transparent: true, opacity: 0.68, depthWrite: false });
  const opalineGlass = material(cyberpunk ? 'Residential opaque opaline panel' : 'Ever Hour opaline glass', '#d5e3df', { emissive: '#99b9b6', emissiveIntensity: 0.5, roughness: 0.13, metalness: 0.05, transparent: !cyberpunk, opacity: cyberpunk ? 1 : 0.72, depthWrite: cyberpunk });
  const clearGlass = material(cyberpunk ? 'Residential opaque cyan canopy panel' : 'Live-work transparent canopy glass', cyberpunk ? '#69dcff' : '#a5c9c5', { emissive: cyberpunk ? '#155b85' : '#517975', emissiveIntensity: cyberpunk ? 0.35 : 0.12, roughness: 0.05, metalness: 0.03, transparent: !cyberpunk, opacity: cyberpunk ? 1 : 0.32, side: THREE.DoubleSide, depthWrite: cyberpunk });
  const pvGlass = material(cyberpunk ? 'Residential opaque photovoltaic panel' : 'Live-work transparent photovoltaic glass', cyberpunk ? '#171d52' : '#294b51', { emissive: cyberpunk ? '#19225e' : '#183d44', emissiveIntensity: cyberpunk ? 0.42 : 0.21, roughness: 0.16, metalness: 0.46, transparent: !cyberpunk, opacity: cyberpunk ? 1 : 0.64, side: THREE.DoubleSide, depthWrite: true });
  const warmWindow = material('Residential inhabited amber window', cyberpunk ? '#ff73df' : '#ffd18c', { emissive: cyberpunk ? '#e52cc2' : '#e69442', emissiveIntensity: cyberpunk ? 2.25 : 1.3, roughness: 0.12, metalness: 0.02 });
  const silverLight = material('Ever Hour warm silver promenade light', '#eef3e7', { emissive: '#cbd8c8', emissiveIntensity: 1.85, roughness: 0.08, metalness: 0.06 });
  const goldLight = material('Ever Hour pale gold hospitality light', '#ffdda0', { emissive: '#e5a441', emissiveIntensity: 2.0, roughness: 0.08, metalness: 0.05 });
  const cyan = material('Live-work cyan laboratory status', '#6ce4e8', { emissive: '#24aeb7', emissiveIntensity: 2.2, roughness: 0.08, metalness: 0.05 });
  const green = material('Live-work green laboratory status', '#72e6a2', { emissive: '#27a95b', emissiveIntensity: 2.0, roughness: 0.08, metalness: 0.04 });
  const amber = material('Live-work amber laboratory status', '#ffbd68', { emissive: '#d57620', emissiveIntensity: 2.1, roughness: 0.08, metalness: 0.05 });
  const ultraviolet = material('Live-work ultraviolet laboratory status', '#b692ff', { emissive: '#7050cf', emissiveIntensity: 2.0, roughness: 0.08, metalness: 0.05 });
  const redGuide = material('Live-work shielded red dark-sky guide', '#7f1918', { emissive: '#6a0f0e', emissiveIntensity: 1.25, roughness: 0.11, metalness: 0.03 });
  const grass = material('Live-work planted roof and park grass', cyberpunk ? '#154841' : '#395f3f', { roughness: 0.98, metalness: 0 });
  const darkGrass = material('Live-work dark ecological grass', cyberpunk ? '#0b2428' : '#263f32', { roughness: 0.99, metalness: 0 });
  const redFoliage = material('Redshift Grove deep red foliage', '#542c2e', { roughness: 0.99, metalness: 0 });
  const water = material('Live-work shallow reflecting water', '#173e46', { emissive: '#163c43', emissiveIntensity: 0.13, roughness: 0.08, metalness: 0.13, transparent: true, opacity: 0.8 });
  const palePaving = material('Continuum Walk pale weatherproof paving', cyberpunk ? '#292941' : '#969895', { roughness: cyberpunk ? 0.75 : 0.96, metalness: cyberpunk ? 0.2 : 0.02 });
  const darkPaving = material('Continuum Walk dark weatherproof paving', '#2d3234', { roughness: 0.94, metalness: 0.05 });
  const residentialLane = material('Residential compacted mineral garden lane', '#17172b', { roughness: 0.82, metalness: 0.18 });
  const everHourLane = material('Ever Hour charcoal pedestrian lane', '#3d4343', { roughness: 0.96, metalness: 0.04 });
  const cyberpunkAlloy = material('Residential cyberpunk black-violet alloy', '#090a19', { roughness: 0.34, metalness: 0.82 });
  const neonCyan = material('Residential cyberpunk cyan neon', '#77f7ff', { emissive: '#13ddeb', emissiveIntensity: 3.25, roughness: 0.06, metalness: 0.08 });
  const neonMagenta = material('Residential cyberpunk magenta neon', '#ff5edb', { emissive: '#ef18bc', emissiveIntensity: 3.1, roughness: 0.06, metalness: 0.08 });
  const neonViolet = material('Residential cyberpunk violet neon', '#aa79ff', { emissive: '#6f31e8', emissiveIntensity: 2.9, roughness: 0.06, metalness: 0.08 });
  const holographicGlass = material('Residential opaque cyan-violet holographic panel', '#627dff', { emissive: '#273dd5', emissiveIntensity: 1.15, roughness: 0.05, metalness: 0.25, transparent: false, opacity: 1, depthWrite: true });
  return { blackBrick, brownBrick, redCeramic, paleCeramic, charcoalCeramic, limestone, concrete, basalt, timber, bronze, copper, champagne, titanium, blackSteel, darkGreenGlass, smokedGlass, opalineGlass, clearGlass, pvGlass, warmWindow, silverLight, goldLight, cyan, green, amber, ultraviolet, redGuide, grass, darkGrass, redFoliage, water, palePaving, darkPaving, residentialLane, everHourLane, cyberpunkAlloy, neonCyan, neonMagenta, neonViolet, holographicGlass };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, districtId: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = districtId;
  object.userData.districtId = districtId;
  if (object instanceof THREE.Mesh) {
    object.castShadow = obstacle;
    object.receiveShadow = true;
    object.userData.navObstacle = obstacle;
  }
  return object;
}

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], districtId: string, obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(BOX, mat), name, districtId, obstacle);
  mesh.scale.set(...size); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], districtId: string, obstacle = false, segments = 16, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(segments <= 8 ? CYLINDER_8 : CYLINDER_16, mat), name, districtId, obstacle);
  mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function ellipsoid(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], districtId: string, obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(SPHERE, mat), name, districtId, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], districtId: string, rotation: readonly [number, number, number] = [0, 0, 0], arc = Math.PI * 2) {
  const key = `${radius.toFixed(2)}|${tube.toFixed(2)}|${arc.toFixed(3)}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, 8, 48, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, mat), name, districtId); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, districtId: string, obstacle = false) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(CYLINDER_8, mat), name, districtId, obstacle);
  mesh.scale.set(radius * 2, direction.length(), radius * 2); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize()); parent.add(mesh); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, mat: THREE.Material, districtId: string, obstacle = false) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(BOX, mat), name, districtId, obstacle);
  mesh.scale.set(direction.length(), height, width); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(X_AXIS, direction.normalize()); parent.add(mesh); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.18, maxIntensity = 2.8) {
  object.userData.animate = 'residential-ever-hour-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'residential-ever-hour-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function ribbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function ribbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, districtId: string) {
  const mesh = prepare(new THREE.Mesh(ribbonGeometry(points, width), mat), name, districtId); mesh.userData.walkable = true; mesh.userData.navObstacle = false; mesh.userData.continuumRoute = true; parent.add(mesh); return mesh;
}

function addWindowField(root: THREE.Group, code: string, width: number, depth: number, height: number, floors: number, districtId: string, m: Materials, kind: DistrictKind, shutters = false) {
  const columns = Math.max(3, Math.min(8, Math.round(width / 1.15)));
  for (let floor = 0; floor < floors; floor += 1) for (let column = 0; column < columns; column += 1) {
    const x = -width * 0.42 + column * width * 0.84 / Math.max(1, columns - 1); const y = 0.65 + floor * (height - 0.9) / Math.max(1, floors - 1);
    const active = (floor * 5 + column * 7 + code.charCodeAt(code.length - 1)) % 4 !== 0;
    const windowMat = kind === 'residential' && active ? m.warmWindow : kind === 'residential' ? m.darkGreenGlass : active ? m.opalineGlass : m.smokedGlass;
    box(root, `LIVEWORK__${code}__${active ? 'INHABITED' : 'DARK'}_WINDOW_${floor + 1}_${column + 1}`, [Math.min(0.7, width / (columns + 2)), 0.34, 0.045], windowMat, [x, y, depth * 0.505], districtId);
    if (shutters) box(root, `LIVEWORK__${code}__ADJUSTABLE_SHUTTER_${floor + 1}_${column + 1}`, [0.12, 0.52, 0.06], floor % 2 ? m.bronze : m.charcoalCeramic, [x + ((column + floor) % 2 ? -0.28 : 0.28), y, depth * 0.535], districtId);
  }
}

function addPlantedRoof(root: THREE.Group, code: string, width: number, depth: number, y: number, districtId: string, m: Materials, pv = true) {
  box(root, `LIVEWORK__${code}__PLANTED_ROOF`, [width * 0.84, 0.14, depth * 0.74], m.grass, [0, y, 0], districtId);
  if (pv) for (let panel = 0; panel < 4; panel += 1) box(root, `LIVEWORK__${code}__ROOF_PHOTOVOLTAIC_${panel + 1}`, [width * 0.17, 0.055, depth * 0.3], m.pvGlass, [-width * 0.3 + panel * width * 0.2, y + 0.16, 0], districtId, false, [-0.12, 0, 0]);
}

function addPortal(root: THREE.Group, code: string, depth: number, districtId: string, m: Materials, lab = false) {
  const portalMat = lab ? m.paleCeramic : m.bronze;
  for (const x of [-0.95, 0.95]) box(root, `LIVEWORK__${code}__ENTRANCE_PORTAL_POST_${x < 0 ? 'L' : 'R'}`, [0.16, 1.5, 0.22], portalMat, [x, 0.82, depth * 0.54], districtId, true);
  box(root, `LIVEWORK__${code}__ENTRANCE_PORTAL_HEADER`, [2.06, 0.16, 0.24], portalMat, [0, 1.54, depth * 0.54], districtId);
  box(root, `LIVEWORK__${code}__OPEN_ENTRANCE`, [1.65, 1.32, 0.055], lab ? m.clearGlass : m.darkGreenGlass, [0, 0.75, depth * 0.55], districtId);
}

function addStandardBlock(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, m: Materials, kind: DistrictKind, options: { width?: number; depth?: number; height?: number; material?: THREE.Material; roof?: boolean; shutters?: boolean; portal?: boolean } = {}) {
  const width = options.width ?? record.footprintMetres[0] / 10; const depth = options.depth ?? record.footprintMetres[1] / 10; const height = options.height ?? record.heightMetres / 10;
  box(root, `LIVEWORK__${record.code}__FOUNDATION`, [width, 0.22, depth], kind === 'residential' ? m.brownBrick : m.basalt, [0, 0.11, 0], districtId, true);
  box(root, `LIVEWORK__${record.code}__PRIMARY_MASS`, [width * 0.92, height, depth * 0.86], options.material ?? (kind === 'residential' ? m.redCeramic : m.paleCeramic), [0, 0.22 + height * 0.5, 0], districtId, true);
  addWindowField(root, record.code, width * 0.88, depth * 0.86, height, Math.max(2, Math.round(height / 0.48)), districtId, m, kind, options.shutters);
  if (options.roof !== false) addPlantedRoof(root, record.code, width, depth, 0.28 + height, districtId, m, kind === 'ever-hour');
  if (options.portal !== false) addPortal(root, record.code, depth * 0.86, districtId, m, /lab|studio|protocol|clinic/i.test(record.form));
  return { width, depth, height };
}

function addCrescent(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, m: Materials, kind: DistrictKind, hotel = false) {
  const width = record.footprintMetres[0] / 10; const depth = record.footprintMetres[1] / 10; const height = record.heightMetres / 10;
  for (let section = 0; section < 5; section += 1) {
    const t = section / 4; const angle = (t - 0.5) * 0.48; const x = (t - 0.5) * width * 0.73; const z = Math.abs(t - 0.5) * depth * 0.36;
    const group = new THREE.Group(); group.name = `LIVEWORK__${record.code}__CRESCENT_SECTION_${section + 1}`; group.position.set(x, 0, z); group.rotation.y = angle; root.add(group);
    const sectionWidth = width * 0.24; box(group, `LIVEWORK__${record.code}__SECTION_MASS_${section + 1}`, [sectionWidth, height, depth * 0.62], section < 2 ? (kind === 'residential' ? m.brownBrick : m.basalt) : (hotel ? m.opalineGlass : m.paleCeramic), [0, height * 0.5 + 0.18, 0], districtId, true);
    addWindowField(group, `${record.code}_S${section + 1}`, sectionWidth, depth * 0.62, height, hotel ? 6 : 5, districtId, m, kind, kind === 'residential');
    for (let balcony = 0; balcony < 4; balcony += 1) box(group, `LIVEWORK__${record.code}__DEEP_BALCONY_${section + 1}_${balcony + 1}`, [sectionWidth * 0.82, 0.09, 0.48], balcony % 2 ? m.bronze : m.champagne, [0, 0.75 + balcony * height * 0.2, depth * 0.37], districtId);
  }
  addPlantedRoof(root, record.code, width * 0.46, depth * 0.4, height + 0.32, districtId, m, true); addPortal(root, record.code, depth * 0.56, districtId, m);
  if (hotel) for (let arc = 0; arc < 3; arc += 1) torus(root, `LIVEWORK__${record.code}__COLLABORATION_TIME_CROWN_${arc + 1}`, 1.5 + arc * 0.38, 0.055, [m.goldLight, m.silverLight, m.cyan][arc], [0, height + 0.85, 0], districtId, [Math.PI / 2 + arc * 0.22, arc * 0.5, 0]);
}

const HOTEL_WORDMARK_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  T: ['111', '010', '010', '010', '010'],
  H: ['101', '101', '111', '101', '101'],
  E: ['111', '100', '110', '100', '111'],
  V: ['101', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'],
  O: ['111', '101', '101', '101', '111'],
  U: ['101', '101', '101', '101', '111'],
};

function addHotelWordmark(root: THREE.Group, text: string, y: number, z: number, districtId: string, m: Materials) {
  const pixel = 0.205;
  const glyphAdvance = pixel * 4;
  const totalWidth = [...text].reduce((width, character) => width + (character === ' ' ? glyphAdvance * 0.72 : glyphAdvance), 0) - pixel;
  let cursor = -totalWidth * 0.5;
  let pixelIndex = 0;
  [...text].forEach((character) => {
    const glyph = HOTEL_WORDMARK_GLYPHS[character];
    if (glyph) glyph.forEach((row, rowIndex) => [...row].forEach((value, columnIndex) => {
      if (value !== '1') return;
      pixelIndex += 1;
      box(root, `LIVEWORK__H23__THE_EVER_HOUR_WORDMARK_PIXEL_${pixelIndex}`, [pixel * 0.78, pixel * 0.78, 0.075], m.goldLight, [cursor + columnIndex * pixel, y + (2 - rowIndex) * pixel, z], districtId);
    }));
    cursor += character === ' ' ? glyphAdvance * 0.72 : glyphAdvance;
  });
  root.userData.wordmark = { text, pixelCount: pixelIndex };
}

function addGrandEverHourHotel(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, m: Materials) {
  const width = record.footprintMetres[0] / 10;
  const depth = record.footprintMetres[1] / 10;
  const height = record.heightMetres / 10;
  const quadrantWidth = width * 0.34;
  const quadrantDepth = depth * 0.33;
  const offsetX = width * 0.26;
  const offsetZ = depth * 0.27;
  const radialPassageWidth = offsetX * 2 - quadrantWidth;
  const crossPassageWidth = offsetZ * 2 - quadrantDepth;

  for (const sideX of [-1, 1]) for (const sideZ of [-1, 1]) {
    const quadrant = `${sideZ > 0 ? 'INNER' : 'OUTER'}_${sideX > 0 ? 'NORTH' : 'SOUTH'}`;
    const x = sideX * offsetX;
    const z = sideZ * offsetZ;
    const towerHeight = sideZ > 0 ? height * 0.78 : height * 0.96;
    box(root, `LIVEWORK__H23__${quadrant}_FOUNDATION`, [quadrantWidth + 0.46, 0.24, quadrantDepth + 0.46], m.basalt, [x, 0.12, z], districtId, true);
    box(root, `LIVEWORK__H23__${quadrant}_GRAND_PODIUM`, [quadrantWidth, 2.15, quadrantDepth], sideX === sideZ ? m.basalt : m.blackBrick, [x, 1.315, z], districtId, true);
    box(root, `LIVEWORK__H23__${quadrant}_HOTEL_TOWER`, [quadrantWidth * 0.84, towerHeight - 2.15, quadrantDepth * 0.82], sideX === sideZ ? m.smokedGlass : m.opalineGlass, [x, 2.39 + (towerHeight - 2.15) * 0.5, z], districtId, true);
    box(root, `LIVEWORK__H23__${quadrant}_BRONZE_FRAME`, [quadrantWidth * 0.9, towerHeight * 0.045, quadrantDepth * 0.9], m.champagne, [x, towerHeight * 0.62, z], districtId);

    const outwardZ = z + sideZ * quadrantDepth * 0.43;
    for (let floor = 0; floor < 18; floor += 1) {
      const floorY = 2.72 + floor * ((towerHeight - 3.1) / 18);
      if (floorY > towerHeight - 0.28) continue;
      box(root, `LIVEWORK__H23__${quadrant}_ROOM_LIGHT_BAND_${floor + 1}`, [quadrantWidth * 0.72, 0.12, 0.075], floor % 5 === 0 ? m.silverLight : m.goldLight, [x, floorY, outwardZ], districtId);
    }
    for (let fin = -2; fin <= 2; fin += 1) box(root, `LIVEWORK__H23__${quadrant}_VERTICAL_BRONZE_FIN_${fin + 3}`, [0.11, towerHeight * 0.72, 0.14], m.bronze, [x + fin * quadrantWidth * 0.135, towerHeight * 0.56, outwardZ + sideZ * 0.07], districtId);

    const terraceY = towerHeight + 0.14;
    box(root, `LIVEWORK__H23__${quadrant}_SKY_GARDEN_TERRACE`, [quadrantWidth * 0.72, 0.18, quadrantDepth * 0.7], m.darkGrass, [x, terraceY, z], districtId);
    for (let tree = 0; tree < 3; tree += 1) {
      const treeX = x - quadrantWidth * 0.22 + tree * quadrantWidth * 0.22;
      cylinder(root, `LIVEWORK__H23__${quadrant}_SKY_TREE_${tree + 1}__TRUNK`, 0.12, 0.72, m.timber, [treeX, terraceY + 0.42, z], districtId, false, 8);
      ellipsoid(root, `LIVEWORK__H23__${quadrant}_SKY_TREE_${tree + 1}__CROWN`, [0.36, 0.52, 0.36], m.grass, [treeX, terraceY + 1.08, z], districtId);
    }
  }

  box(root, 'LIVEWORK__H23__CONTINUUM_SKY_LOBBY', [radialPassageWidth, 0.82, depth * 0.78], m.opalineGlass, [0, height * 0.43, 0], districtId);
  box(root, 'LIVEWORK__H23__CROSSING_SKY_LOBBY', [width * 0.76, 0.82, crossPassageWidth], m.opalineGlass, [0, height * 0.53, 0], districtId);
  for (const side of [-1, 1]) {
    box(root, `LIVEWORK__H23__CONTINUUM_PASSAGE_BRONZE_EDGE_${side < 0 ? 'SOUTH' : 'NORTH'}`, [0.12, 0.08, depth * 0.96], m.champagne, [side * radialPassageWidth * 0.47, 0.095, 0], districtId);
    box(root, `LIVEWORK__H23__CROSS_PASSAGE_BRONZE_EDGE_${side < 0 ? 'OUTER' : 'INNER'}`, [width * 0.96, 0.08, 0.12], m.champagne, [0, 0.095, side * crossPassageWidth * 0.47], districtId);
  }
  for (let bay = 0; bay < 9; bay += 1) for (const side of [-1, 1]) {
    const z = -depth * 0.4 + bay * depth * 0.1;
    box(root, `LIVEWORK__H23__CONTINUUM_PASSAGE_LIGHT_${bay + 1}_${side < 0 ? 'SOUTH' : 'NORTH'}`, [0.075, 1.8, 0.12], bay % 3 === 0 ? m.silverLight : m.goldLight, [side * radialPassageWidth * 0.415, 1.18, z], districtId);
  }

  const arrivalZ = depth * 0.54;
  for (const side of [-1, 1]) cylinder(root, `LIVEWORK__H23__GRAND_ARRIVAL_COLUMN_${side < 0 ? 'SOUTH' : 'NORTH'}`, 0.22, 2.5, m.champagne, [side * 1.72, 1.25, arrivalZ], districtId, true, 16);
  box(root, 'LIVEWORK__H23__GRAND_ARRIVAL_CANOPY', [4.15, 0.16, 2.15], m.opalineGlass, [0, 2.42, arrivalZ - 0.62], districtId);
  box(root, 'LIVEWORK__H23__OPEN_24_HOUR_ENTRANCE_HEADER', [3.7, 0.24, 0.34], m.champagne, [0, 2.2, depth * 0.49], districtId);
  for (const side of [-1, 1]) box(root, `LIVEWORK__H23__OPEN_24_HOUR_ENTRANCE_JAMB_${side < 0 ? 'SOUTH' : 'NORTH'}`, [0.18, 2.2, 0.34], m.champagne, [side * 1.76, 1.1, depth * 0.49], districtId, true);

  box(root, 'LIVEWORK__H23__OBSERVATORY_LOUNGE_CROWN', [width * 0.72, 1.32, depth * 0.25], m.smokedGlass, [0, height * 0.84, 0], districtId);
  box(root, 'LIVEWORK__H23__CROWN_CHAMPAGNE_SILL', [width * 0.75, 0.18, depth * 0.28], m.champagne, [0, height * 0.79, 0], districtId);
  addHotelWordmark(root, 'THE EVER HOUR', height * 0.86, depth * 0.128 + 0.06, districtId, m);

  for (let ring = 0; ring < 4; ring += 1) rotate(torus(root, `LIVEWORK__H23__ASTRONOMICAL_TIME_CROWN_RING_${ring + 1}`, 1.65 + ring * 0.43, 0.075, [m.goldLight, m.silverLight, m.champagne, m.cyan][ring], [0, height + 1.45, 0], districtId, [Math.PI / 2 + ring * 0.17, ring * 0.38, 0]), 0.0007 + ring * 0.00012, ring % 2 ? 'z' : 'y');
  for (let tick = 0; tick < 24; tick += 1) {
    const angle = tick / 24 * Math.PI * 2;
    const radius = 3.08;
    box(root, `LIVEWORK__H23__TIME_CROWN_TICK_${tick + 1}`, [tick % 6 === 0 ? 0.16 : 0.09, 0.42, 0.09], tick % 6 === 0 ? m.goldLight : m.titanium, [Math.cos(angle) * radius, height + 1.45, Math.sin(angle) * radius], districtId, false, [0, -angle, 0.14]);
  }
  cylinder(root, 'LIVEWORK__H23__MIDNIGHT_BEACON', 0.22, 3.3, m.blackSteel, [0, height + 2.5, 0], districtId, false, 16);
  pulse(ellipsoid(root, 'LIVEWORK__H23__MIDNIGHT_BEACON_LIGHT', [0.34, 0.34, 0.34], m.goldLight.clone(), [0, height + 4.18, 0], districtId), 0.0015, 0.4, 0.45, 2.6);

  root.userData.flagshipHotel = true;
  root.userData.publicPassages = {
    continuumWidth: radialPassageWidth,
    crosswalkWidth: crossPassageWidth,
    openAtGround: true,
  };
  root.userData.signature = 'four hotel quadrants + open Continuum crossing + twin sky lobbies + astronomical crown + THE EVER HOUR wordmark';
}

function ringSegments(root: THREE.Group, prefix: string, count: number, radiusX: number, radiusZ: number, height: number, mat: THREE.Material, districtId: string, gaps: number[] = []) {
  for (let segment = 0; segment < count; segment += 1) {
    if (gaps.includes(segment)) continue;
    const angle = segment / count * Math.PI * 2; const x = Math.cos(angle) * radiusX; const z = Math.sin(angle) * radiusZ;
    box(root, `${prefix}_${segment + 1}`, [Math.max(0.9, Math.PI * radiusX * 1.65 / count), height, 1.15], mat, [x, height * 0.5 + 0.18, z], districtId, true, [0, -angle, 0]);
  }
}

function addTree(parent: THREE.Object3D, name: string, x: number, z: number, districtId: string, m: Materials, red = false, scale = 1) {
  cylinder(parent, `${name}__TRUNK`, 0.18 * scale, 1.15 * scale, m.timber, [x, 0.58 * scale, z], districtId, true, 8);
  ellipsoid(parent, `${name}__CROWN`, [0.56 * scale, 0.72 * scale, 0.56 * scale], red ? m.redFoliage : m.grass, [x, 1.45 * scale, z], districtId);
}

function addCyberpunkScientistMegablock(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, m: Materials) {
  const w = record.footprintMetres[0] / 10;
  const d = record.footprintMetres[1] / 10;
  const h = record.heightMetres / 10;
  const codeNumber = Number(record.code.slice(1));
  const accents = [m.neonCyan, m.neonMagenta, m.neonViolet] as const;
  box(root, `LIVEWORK__${record.code}__MEGABLOCK_FOUNDATION`, [w * 0.96, 0.28, d * 0.92], m.cyberpunkAlloy, [0, 0.14, 0], districtId, true);
  for (const side of [-1, 1]) {
    box(root, `LIVEWORK__${record.code}__OPEN_UNDERCROFT_PODIUM_${side < 0 ? 'A' : 'B'}`, [w * 0.38, 1.05, d * 0.72], side < 0 ? m.blackBrick : m.charcoalCeramic, [side * w * 0.25, 0.805, 0], districtId, true);
    box(root, `LIVEWORK__${record.code}__NEON_ARRIVAL_PORTAL_${side < 0 ? 'A' : 'B'}`, [w * 0.31, 0.11, 0.16], accents[(codeNumber + (side > 0 ? 1 : 0)) % accents.length], [side * w * 0.25, 1.38, d * 0.38], districtId);
  }
  const towerHeights = [h * 0.78, h, h * 0.88];
  const towerZ = [-d * 0.1, d * 0.08, -d * 0.035];
  for (let tower = 0; tower < 3; tower += 1) {
    const x = (tower - 1) * w * 0.29;
    const towerHeight = towerHeights[(tower + codeNumber) % towerHeights.length];
    const towerWidth = w * (tower === 1 ? 0.25 : 0.23);
    const towerDepth = d * (tower === 1 ? 0.59 : 0.53);
    const z = towerZ[(tower + codeNumber) % towerZ.length];
    box(root, `LIVEWORK__${record.code}__APARTMENT_TOWER_${tower + 1}`, [towerWidth, towerHeight, towerDepth], tower === 1 ? m.holographicGlass : m.cyberpunkAlloy, [x, 1.05 + towerHeight * 0.5, z], districtId, true, [0, (tower - 1) * 0.035, (tower - 1) * 0.018]);
    for (let floor = 0; floor < 16; floor += 1) {
      const y = 1.55 + floor * (towerHeight - 1.15) / 16;
      const accent = accents[(floor + tower + codeNumber) % accents.length];
      for (const facade of [-1, 1]) box(root, `LIVEWORK__${record.code}__TOWER_${tower + 1}_INHABITED_NEON_BALCONY_${facade < 0 ? 'BACK' : 'FRONT'}_${floor + 1}`, [towerWidth * 0.78, 0.075, 0.07], accent, [x, y, z + facade * towerDepth * 0.505], districtId);
      if (floor % 2 === tower % 2) for (const side of [-1, 1]) box(root, `LIVEWORK__${record.code}__TOWER_${tower + 1}_DWELLING_POD_${floor + 1}_${side < 0 ? 'L' : 'R'}`, [0.13, 0.28, towerDepth * 0.72], m.warmWindow, [x + side * towerWidth * 0.51, y, z], districtId);
    }
    for (const side of [-1, 1]) box(root, `LIVEWORK__${record.code}__TOWER_${tower + 1}_LUMINOUS_SERVICE_CORE_${side < 0 ? 'L' : 'R'}`, [0.09, towerHeight * 0.88, 0.1], accents[(tower + (side > 0 ? 1 : 0) + codeNumber) % accents.length], [x + side * towerWidth * 0.42, 1.1 + towerHeight * 0.5, z + towerDepth * 0.51], districtId);
    box(root, `LIVEWORK__${record.code}__TOWER_${tower + 1}_SKY_GARDEN`, [towerWidth * 0.82, 0.18, towerDepth * 0.72], m.grass, [x, 1.18 + towerHeight, z], districtId);
    for (let fin = 0; fin < 3; fin += 1) box(root, `LIVEWORK__${record.code}__TOWER_${tower + 1}_PHOTOVOLTAIC_CROWN_FIN_${fin + 1}`, [towerWidth * 0.18, 0.62 + fin * 0.18, towerDepth * 0.52], m.pvGlass, [x - towerWidth * 0.27 + fin * towerWidth * 0.27, 1.54 + towerHeight + fin * 0.09, z], districtId, false, [0, 0, (fin - 1) * 0.12]);
  }
  for (let bridge = 0; bridge < 2; bridge += 1) {
    const x = (bridge ? 1 : -1) * w * 0.145;
    const y = h * (bridge ? 0.58 : 0.38) + 1.05;
    box(root, `LIVEWORK__${record.code}__INHABITED_CHROMATIC_SKYBRIDGE_${bridge + 1}`, [w * 0.33, 0.68, d * 0.22], m.holographicGlass, [x, y, 0], districtId);
    for (const edge of [-1, 1]) box(root, `LIVEWORK__${record.code}__SKYBRIDGE_${bridge + 1}_NEON_EDGE_${edge < 0 ? 'BACK' : 'FRONT'}`, [w * 0.33, 0.08, 0.08], accents[(bridge + codeNumber + (edge > 0 ? 1 : 0)) % accents.length], [x, y - 0.28, edge * d * 0.115], districtId);
  }
  torus(root, `LIVEWORK__${record.code}__ORBITAL_RESIDENTIAL_CROWN`, Math.min(w, d) * 0.23, 0.09, accents[codeNumber % accents.length], [0, h + 2.05, 0], districtId, [Math.PI / 2, 0, 0]);
  cylinder(root, `LIVEWORK__${record.code}__PRISMATIC_ROOFTOP_BEACON`, 0.18, 2.2, accents[(codeNumber + 1) % accents.length], [0, h + 2.15, 0], districtId, false, 8);
  root.userData.cyberpunkMegablock = { towerCount: 3, skybridgeCount: 2, apartmentBalconyBands: 96, expansionBand: record.zone };
}

function addCyberpunkResidentialEdgeEnsemble(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, m: Materials) {
  const w = record.footprintMetres[0] / 10;
  const d = record.footprintMetres[1] / 10;
  const h = record.heightMetres / 10;
  const codeNumber = Number(record.code.slice(1));
  const accents = [m.neonCyan, m.neonMagenta, m.neonViolet] as const;
  box(root, `LIVEWORK__${record.code}__RESIDENTIAL_EDGE_FOUNDATION`, [w * 0.96, 0.24, d * 0.92], m.cyberpunkAlloy, [0, 0.12, 0], districtId, true);
  box(root, `LIVEWORK__${record.code}__OPEN_GARDEN_COMMONS_BASE`, [w * 0.9, 0.72, d * 0.72], m.charcoalCeramic, [0, 0.6, 0], districtId, true);
  box(root, `LIVEWORK__${record.code}__NEON_ORCHARD_COURT`, [w * 0.28, 0.08, d * 0.52], m.darkGrass, [0, 1.0, 0], districtId);
  for (let tree = 0; tree < 3; tree += 1) addTree(root, `LIVEWORK__${record.code}__ELEVATED_ORCHARD_TREE_${tree + 1}`, 0, -d * 0.18 + tree * d * 0.18, districtId, m, false, 0.55 + (tree % 2) * 0.12);

  const towerHeights = [h * (0.78 + (codeNumber % 3) * 0.04), h * (0.9 + (codeNumber % 2) * 0.06)];
  for (let tower = 0; tower < 2; tower += 1) {
    const side = tower ? 1 : -1;
    const towerHeight = towerHeights[tower];
    const towerWidth = w * (tower ? 0.31 : 0.34);
    const towerDepth = d * (tower ? 0.62 : 0.56);
    const x = side * w * 0.25;
    const z = side * ((codeNumber % 3) - 1) * d * 0.045;
    box(root, `LIVEWORK__${record.code}__RESIDENTIAL_EDGE_APARTMENT_SLAB_${tower + 1}`, [towerWidth, towerHeight, towerDepth], tower === codeNumber % 2 ? m.holographicGlass : m.cyberpunkAlloy, [x, 1.0 + towerHeight * 0.5, z], districtId, true, [0, side * (0.035 + (codeNumber % 4) * 0.012), side * 0.012]);
    for (let floor = 0; floor < 12; floor += 1) {
      const y = 1.38 + floor * (towerHeight - 0.72) / 12;
      for (const facade of [-1, 1]) box(root, `LIVEWORK__${record.code}__SLAB_${tower + 1}_INHABITED_BALCONY_${facade < 0 ? 'BACK' : 'FRONT'}_${floor + 1}`, [towerWidth * (0.72 + (floor % 3) * 0.06), 0.075, 0.07], accents[(floor + tower + codeNumber) % accents.length], [x + (floor % 2 ? side * 0.08 : 0), y, z + facade * towerDepth * 0.505], districtId);
    }
    for (const edge of [-1, 1]) box(root, `LIVEWORK__${record.code}__SLAB_${tower + 1}_LUMINOUS_LIFT_CORE_${edge < 0 ? 'L' : 'R'}`, [0.085, towerHeight * 0.82, 0.1], accents[(codeNumber + tower + (edge > 0 ? 1 : 0)) % accents.length], [x + edge * towerWidth * 0.43, 1.08 + towerHeight * 0.5, z + towerDepth * 0.51], districtId);
    box(root, `LIVEWORK__${record.code}__SLAB_${tower + 1}_ROOFTOP_ALLOTMENT`, [towerWidth * 0.8, 0.17, towerDepth * 0.68], m.grass, [x, 1.1 + towerHeight, z], districtId);
    for (let fin = 0; fin < 3; fin += 1) box(root, `LIVEWORK__${record.code}__SLAB_${tower + 1}_PHOTOVOLTAIC_FIN_${fin + 1}`, [towerWidth * 0.2, 0.58 + fin * 0.12, towerDepth * 0.5], m.pvGlass, [x - towerWidth * 0.26 + fin * towerWidth * 0.26, 1.43 + towerHeight + fin * 0.07, z], districtId, false, [0, 0, (fin - 1) * 0.11]);
  }
  const bridgeCount = record.code === 'R36' ? 2 : 1;
  for (let bridge = 0; bridge < bridgeCount; bridge += 1) {
    const y = h * (0.43 + bridge * 0.2) + 1.0;
    box(root, `LIVEWORK__${record.code}__INHABITED_GARDEN_SKYBRIDGE_${bridge + 1}`, [w * 0.54, 0.62, d * 0.2], m.holographicGlass, [0, y, bridge ? -d * 0.12 : d * 0.08], districtId);
    for (const edge of [-1, 1]) box(root, `LIVEWORK__${record.code}__SKYBRIDGE_${bridge + 1}_NEON_EDGE_${edge < 0 ? 'BACK' : 'FRONT'}`, [w * 0.54, 0.07, 0.07], accents[(codeNumber + bridge + (edge > 0 ? 1 : 0)) % accents.length], [0, y - 0.26, (bridge ? -d * 0.12 : d * 0.08) + edge * d * 0.105], districtId);
  }
  box(root, `LIVEWORK__${record.code}__TRANSPARENT_COMMUNAL_GARDEN_SPINE`, [w * 0.15, h * 0.64, d * 0.34], m.holographicGlass, [0, 1.05 + h * 0.32, 0], districtId);
  cylinder(root, `LIVEWORK__${record.code}__GREEN_POCKET_BEACON`, 0.16, 1.65, accents[(codeNumber + 1) % accents.length], [0, h + 1.6, 0], districtId, false, 8);
  torus(root, `LIVEWORK__${record.code}__RESIDENTIAL_EDGE_CROWN`, Math.min(w, d) * 0.19, 0.075, accents[codeNumber % accents.length], [0, h + 1.65, 0], districtId, [Math.PI / 2, 0, 0]);
  root.userData.greenHighlightedResidentialPocket = true;
  root.userData.cyberpunkResidentialEdge = { apartmentSlabCount: 2, skybridgeCount: bridgeCount, inhabitedBalconyBands: 48, pocketZone: record.zone };
}

function addResidentialCyberpunkEnvelope(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, m: Materials) {
  const w = record.footprintMetres[0] / 10;
  const d = record.footprintMetres[1] / 10;
  const h = Math.max(0.95, record.heightMetres / 10);
  const codeNumber = Number(record.code.slice(1));
  const accents = [m.neonCyan, m.neonMagenta, m.neonViolet] as const;
  for (const xSide of [-1, 1]) for (const zSide of [-1, 1]) box(root, `LIVEWORK__${record.code}__CYBERPUNK_CORNER_RAIL_${xSide < 0 ? 'W' : 'E'}_${zSide < 0 ? 'BACK' : 'FRONT'}`, [0.055, h * 0.86, 0.055], accents[(codeNumber + (xSide > 0 ? 1 : 0) + (zSide > 0 ? 2 : 0)) % accents.length], [xSide * w * 0.43, 0.35 + h * 0.48, zSide * d * 0.43], districtId);
  for (let band = 0; band < 4; band += 1) {
    const y = 0.42 + (band + 1) * h * 0.18;
    box(root, `LIVEWORK__${record.code}__CYBERPUNK_FACADE_BAND_${band + 1}`, [w * 0.76, 0.052, 0.06], accents[(codeNumber + band) % accents.length], [0, y, d * 0.435], districtId);
  }
  box(root, `LIVEWORK__${record.code}__HOLOGRAPHIC_ADDRESS_FIN`, [Math.min(1.6, w * 0.28), 0.42, 0.055], m.holographicGlass, [w * 0.22, Math.min(h + 0.42, 1.2 + h * 0.55), d * 0.445], districtId, false, [0, 0, -0.08]);
  root.userData.cyberpunkEnvelope = true;
  root.userData.cyberpunkAccentFamily = ['cyan', 'magenta', 'violet'];
}

function createResidentialFacility(record: LiveWorkBuildingProgram, m: Materials) {
  const districtId = 'scientist-residential'; const root = new THREE.Group(); root.name = `LIVEWORK__RESIDENTIAL__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  const w = record.footprintMetres[0] / 10; const d = record.footprintMetres[1] / 10; const h = record.heightMetres / 10;
  switch (record.code) {
    case 'R01': addCrescent(root, record, districtId, m, 'residential'); break;
    case 'R02':
      for (const strand of [-1, 1]) for (let section = 0; section < 5; section += 1) { const height = h - section * 0.24; const x = -w * 0.34 + section * w * 0.17; const z = strand * (1.25 + Math.sin(section * 0.8) * 0.45); box(root, `LIVEWORK__R02__HELIX_STRAND_${strand < 0 ? 'A' : 'B'}_${section + 1}`, [w * 0.2, height, 2.0], section % 2 ? m.paleCeramic : m.timber, [x, height * 0.5 + 0.18, z], districtId, true, [0, strand * (section - 2) * 0.07, 0]); for (let floor = 0; floor < 4; floor += 1) box(root, `LIVEWORK__R02__PLANTED_BALCONY_${strand}_${section}_${floor}`, [w * 0.17, 0.08, 0.42], m.grass, [x, 0.75 + floor * 0.45, z + strand * 1.05], districtId); }
      for (let bridge = 0; bridge < 3; bridge += 1) box(root, `LIVEWORK__R02__SHELTERED_GARDEN_BRIDGE_${bridge + 1}`, [1.0, 0.55, 3.6], m.clearGlass, [-2.8 + bridge * 2.8, 1.1 + bridge * 0.45, 0], districtId); addPlantedRoof(root, record.code, w, d, h + 0.24, districtId, m); break;
    case 'R03': { const mass = addStandardBlock(root, record, districtId, m, 'residential', { material: m.charcoalCeramic, shutters: true }); pulse(box(root, 'LIVEWORK__R03__CIRCADIAN_ROOFLINE_PHASE_BAND', [mass.width * 0.9, 0.08, mass.depth * 0.9], m.amber.clone(), [0, mass.height + 0.38, 0], districtId), 0.0018, 0, 0.15, 1.4); box(root, 'LIVEWORK__R03__ACOUSTIC_ENTRANCE_COURT', [3.6, 0.12, 2.5], m.blackBrick, [0, 0.07, mass.depth * 0.62], districtId); break; }
    case 'R04':
      for (let cluster = 0; cluster < 6; cluster += 1) { const x = -w * 0.34 + (cluster % 3) * w * 0.34; const z = -d * 0.25 + Math.floor(cluster / 3) * d * 0.5; const height = 0.75 + (cluster % 3) * 0.18; box(root, `LIVEWORK__R04__GARDEN_HOME_CLUSTER_${cluster + 1}`, [w * 0.27, height, d * 0.34], cluster % 2 ? m.brownBrick : m.timber, [x, height * 0.5 + 0.12, z], districtId, true, [0, (cluster % 3 - 1) * 0.09, 0]); box(root, `LIVEWORK__R04__SLOPING_PLANTED_ROOF_${cluster + 1}`, [w * 0.3, 0.14, d * 0.38], m.grass, [x, height + 0.18, z], districtId, false, [0.08 * (cluster % 2 ? 1 : -1), 0, 0]); cylinder(root, `LIVEWORK__R04__COPPER_VENT_${cluster + 1}`, 0.26, 1.0, m.copper, [x + 0.5, height + 0.55, z], districtId); }
      for (let channel = 0; channel < 4; channel += 1) box(root, `LIVEWORK__R04__VISIBLE_RAIN_CHANNEL_${channel + 1}`, [w * 0.82, 0.04, 0.15], m.water, [0, 0.06, -d * 0.38 + channel * d * 0.25], districtId); break;
    case 'R05':
      for (const side of [-1, 1]) { const x = side * 2.15; box(root, `LIVEWORK__R05__LATTICE_TOWER_${side < 0 ? 'A' : 'B'}`, [2.8, h, 3.4], m.darkGreenGlass, [x, h * 0.5 + 0.16, side * 0.35], districtId, true, [0, side * 0.09, 0]); for (let rail = 0; rail < 7; rail += 1) { box(root, `LIVEWORK__R05__CHAMPAGNE_LATTICE_VERTICAL_${side}_${rail}`, [0.09, h + 0.25, 0.12], m.champagne, [x - 1.25 + rail * 0.42, h * 0.5 + 0.18, side * 2.05], districtId); if (rail < 6) pipe(root, `LIVEWORK__R05__LATTICE_DIAGONAL_${side}_${rail}`, new THREE.Vector3(x - 1.25 + rail * 0.42, 0.25 + (rail % 2) * 0.6, side * 2.05), new THREE.Vector3(x - 0.83 + rail * 0.42, h - (rail % 2) * 0.6, side * 2.05), 0.045, m.champagne, districtId); } }
      for (const level of [1.65, 3.05]) box(root, `LIVEWORK__R05__ENCLOSED_BRIDGE_${level}`, [4.5, 0.56, 0.85], m.opalineGlass, [0, level, 0], districtId); addPlantedRoof(root, record.code, w, d, 0.35, districtId, m); break;
    case 'R06':
      for (let block = 0; block < 3; block += 1) { const height = 1.6 + block * 0.58; box(root, `LIVEWORK__R06__SHIFTED_TERRACE_BLOCK_${block + 1}`, [w * (0.82 - block * 0.12), height, d * 0.76], block % 2 ? m.redCeramic : m.brownBrick, [(-1 + block) * 0.65, height * 0.5 + 0.16, -block * 0.28], districtId, true); box(root, `LIVEWORK__R06__TREE_TERRACE_${block + 1}`, [w * (0.7 - block * 0.12), 0.12, 1.0], m.grass, [(-1 + block) * 0.65, height + 0.23, d * 0.32 - block * 0.28], districtId); } addWindowField(root, record.code, w * 0.8, d * 0.8, h, 5, districtId, m, 'residential', true); box(root, 'LIVEWORK__R06__CONTINUUM_PHOTOVOLTAIC_CANOPY', [w * 0.72, 0.09, 1.7], m.pvGlass, [0, 1.25, d * 0.55], districtId); break;
    case 'R07':
      for (const [x, z, sx, sz] of [[0, -d * 0.37, w, 1.45], [0, d * 0.37, w, 1.45], [-w * 0.42, 0, 1.45, d * 0.62], [w * 0.42, 0, 1.45, d * 0.62]] as const) box(root, `LIVEWORK__R07__BLACK_BRICK_WING_${x}_${z}`, [sx, h * 0.72, sz], m.blackBrick, [x, h * 0.36 + 0.15, z], districtId, true);
      for (let corner = 0; corner < 4; corner += 1) { const x = (corner % 2 ? 1 : -1) * w * 0.42; const z = (corner < 2 ? -1 : 1) * d * 0.37; box(root, `LIVEWORK__R07__OBSERVATORY_STAIR_TOWER_${corner + 1}`, [1.2, h, 1.2], m.brownBrick, [x, h * 0.5 + 0.15, z], districtId, true); cylinder(root, `LIVEWORK__R07__COPPER_TOWER_CAP_${corner + 1}`, 1.45, 0.45, m.copper, [x, h + 0.38, z], districtId, false, 8); }
      box(root, 'LIVEWORK__R07__NARROW_GARDEN_COURT', [w * 0.62, 0.08, d * 0.42], m.grass, [0, 0.06, 0], districtId); box(root, 'LIVEWORK__R07__REFLECTING_CHANNEL', [w * 0.56, 0.04, 0.32], m.water, [0, 0.07, d * 0.54], districtId); break;
    case 'R08':
      for (let block = 0; block < 6; block += 1) { const angle = block / 6 * Math.PI * 2; const height = 1.55 + (block % 3) * 0.28; const x = Math.cos(angle) * w * 0.32; const z = Math.sin(angle) * d * 0.31; cylinder(root, `LIVEWORK__R08__ORBIT_FAMILY_BLOCK_${block + 1}`, 3.0, height, block % 2 ? m.paleCeramic : m.darkGreenGlass, [x, height * 0.5 + 0.15, z], districtId, true, 8, [0, -angle, 0]); box(root, `LIVEWORK__R08__SCREENED_BALCONY_${block + 1}`, [1.55, 0.12, 0.48], m.bronze, [x + Math.cos(angle) * 1.5, 1.05, z + Math.sin(angle) * 1.5], districtId, false, [0, -angle, 0]); }
      torus(root, 'LIVEWORK__R08__CONTINUOUS_FAMILY_CANOPY', 3.65, 0.12, m.pvGlass, [0, 0.72, 0], districtId, [Math.PI / 2, 0, 0]); cylinder(root, 'LIVEWORK__R08__PROTECTED_CENTRAL_PARK', 4.6, 0.08, m.grass, [0, 0.06, 0], districtId); break;
    case 'R09':
      for (const [x, z, sx, sz] of [[0, -2.45, w, 1.35], [0, 2.45, w, 1.35], [-w * 0.42, 0, 1.35, d * 0.55], [w * 0.42, 0, 1.35, d * 0.55]] as const) { box(root, `LIVEWORK__R09__MODULAR_FRAME_WING_${x}_${z}`, [sx, h, sz], m.blackSteel, [x, h * 0.5 + 0.14, z], districtId, true); }
      for (let module = 0; module < 24; module += 1) box(root, `LIVEWORK__R09__INTERCHANGEABLE_FACADE_MODULE_${module + 1}`, [0.62, 0.42, 0.08], [m.warmWindow, m.darkGreenGlass, m.redCeramic, m.grass][module % 4], [-w * 0.4 + (module % 12) * w * 0.8 / 11, 0.62 + Math.floor(module / 12) * 0.78, d * 0.48], districtId);
      for (let bridge = 0; bridge < 3; bridge += 1) box(root, `LIVEWORK__R09__COURTYARD_GLASS_BRIDGE_${bridge + 1}`, [w * 0.56, 0.46, 0.58], m.clearGlass, [0, 0.95 + bridge * 0.5, -0.7 + bridge * 0.7], districtId); box(root, 'LIVEWORK__R09__ELEVATED_GARDEN_CANOPY', [w * 0.68, 0.12, d * 0.52], m.pvGlass, [0, h + 0.45, 0], districtId); break;
    case 'R10':
      for (let bar = 0; bar < 3; bar += 1) box(root, `LIVEWORK__R10__ACCESSIBLE_LIMESTONE_BAR_${bar + 1}`, [w * 0.28, h - bar * 0.12, d * 0.78], m.limestone, [(-1 + bar) * w * 0.31, (h - bar * 0.12) * 0.5 + 0.14, 0], districtId, true);
      for (let ramp = 0; ramp < 6; ramp += 1) box(root, `LIVEWORK__R10__LANDSCAPE_ACCESS_RAMP_${ramp + 1}`, [w * 0.22, 0.09, 1.2], ramp % 2 ? m.grass : m.limestone, [-w * 0.36 + ramp * w * 0.145, 0.08 + ramp * 0.08, d * 0.52], districtId, false, [-0.07, 0, 0]); torus(root, 'LIVEWORK__R10__ACCESSIBLE_ROOF_WALK_LOOP', 3.9, 0.12, m.limestone, [0, h + 0.35, 0], districtId, [Math.PI / 2, 0, 0]); break;
    case 'R11':
      box(root, 'LIVEWORK__R11__DARK_STONE_BASE', [w, 0.9, d * 0.8], m.basalt, [0, 0.48, 0], districtId, true); box(root, 'LIVEWORK__R11__TIMBER_GLASS_CENTRAL_HALL', [w * 0.72, 1.2, d], m.darkGreenGlass, [-0.3, 1.35, 0], districtId, true, [0, 0.08, 0]); box(root, 'LIVEWORK__R11__TRANSLUCENT_UPPER_PAVILION', [w * 0.48, 0.75, d * 0.62], m.opalineGlass, [0.65, 2.18, -0.15], districtId, true, [0, -0.12, 0]); for (let step = 0; step < 8; step += 1) box(root, `LIVEWORK__R11__PUBLIC_PLANTED_STAIR_${step + 1}`, [w * (0.85 - step * 0.055), 0.08, 0.58], step % 2 ? m.grass : m.limestone, [0, 0.06 + step * 0.08, d * 0.56 + step * 0.46], districtId); for (let branch = 0; branch < 6; branch += 1) pipe(root, `LIVEWORK__R11__MOLECULAR_BOND_ROOF_SUPPORT_${branch + 1}`, new THREE.Vector3(-w * 0.35 + branch * w * 0.14, 0.3, d * 0.4), new THREE.Vector3(-w * 0.28 + branch * w * 0.11, 2.6, d * 0.26), 0.06, m.bronze, districtId, true); break;
    case 'R12':
      for (const [x, z, sx, sz] of [[0, -d * 0.36, w, 1.45], [0, d * 0.36, w, 1.45], [-w * 0.4, 0, 1.45, d * 0.52], [w * 0.4, 0, 1.45, d * 0.52]] as const) box(root, `LIVEWORK__R12__LABORATORY_COURT_WING_${x}_${z}`, [sx, h, sz], x === 0 ? m.paleCeramic : m.brownBrick, [x, h * 0.5 + 0.13, z], districtId, true);
      box(root, 'LIVEWORK__R12__PLANTED_LIGHT_COURT', [w * 0.56, 0.08, d * 0.42], m.grass, [0, 0.06, 0], districtId); for (let module = 0; module < 12; module += 1) pulse(box(root, `LIVEWORK__R12__LAB_STATUS_PANEL_${module + 1}`, [0.11, 0.5, 0.06], [m.cyan, m.green, m.amber, m.ultraviolet][module % 4].clone(), [-w * 0.38 + module * w * 0.76 / 11, 0.62, d * 0.49], districtId), 0.004 + (module % 3) * 0.0004, module * 0.42); box(root, 'LIVEWORK__R12__ROOFTOP_GREENHOUSE', [2.5, 0.75, 1.8], m.clearGlass, [0, h + 0.5, 0], districtId); break;
    case 'R13':
      for (let workshop = 0; workshop < 8; workshop += 1) { const x = -w * 0.42 + workshop * w * 0.84 / 7; box(root, `LIVEWORK__R13__WORKSHOP_${workshop + 1}`, [w * 0.105, h, d * 0.58], workshop % 2 ? m.blackBrick : m.charcoalCeramic, [x, h * 0.5 + 0.12, -0.5], districtId, true); box(root, `LIVEWORK__R13__DARK_GLASS_WORKSHOP_DOOR_${workshop + 1}`, [w * 0.07, 0.78, 0.06], m.darkGreenGlass, [x, 0.52, d * 0.22], districtId); box(root, `LIVEWORK__R13__FOLDED_PHOTOVOLTAIC_ROOF_${workshop + 1}`, [w * 0.11, 0.1, d * 0.7], m.pvGlass, [x, h + 0.2 + (workshop % 2) * 0.25, -0.2], districtId, false, [0, 0, workshop % 2 ? 0.16 : -0.16]); box(root, `LIVEWORK__R13__COPPER_SAFETY_EDGE_${workshop + 1}`, [w * 0.08, 0.06, 0.08], m.bronze, [x, 0.08, d * 0.32], districtId); }
      box(root, 'LIVEWORK__R13__PLANTED_ACOUSTIC_SCREEN', [w, 1.45, 0.28], m.grass, [0, 0.75, -d * 0.5], districtId, true); break;
    case 'R14':
      cylinder(root, 'LIVEWORK__R14__ROUGH_STONE_POOL_BASE', 8.6, 0.65, m.basalt, [0, 0.34, 0], districtId, true, 16, [0, 0, 0]); ellipsoid(root, 'LIVEWORK__R14__LOW_OVAL_POOL_ROOF', [w * 0.5, 1.25, d * 0.5], m.pvGlass, [0, 1.25, 0], districtId); box(root, 'LIVEWORK__R14__CONTINUOUS_WATER_GLIMPSE_BAND', [w * 0.88, 0.46, d * 0.72], m.darkGreenGlass, [0, 0.72, 0], districtId); for (let rib = 0; rib < 11; rib += 1) torus(root, `LIVEWORK__R14__LAMINATED_TIMBER_RIB_${rib + 1}`, d * 0.39, 0.06, m.timber, [-w * 0.42 + rib * w * 0.084, 1.15, 0], districtId, [0, Math.PI / 2, 0], Math.PI); for (let chain = 0; chain < 6; chain += 1) cylinder(root, `LIVEWORK__R14__BRONZE_RAIN_CHAIN_${chain + 1}`, 0.07, 1.1, m.bronze, [-w * 0.4 + chain * w * 0.16, 0.62, d * 0.46], districtId); break;
    case 'R15':
      box(root, 'LIVEWORK__R15__DARK_BRICK_RECREATION_BASE', [w, 0.72, d], m.blackBrick, [0, 0.38, 0], districtId, true); for (let house = 0; house < 3; house += 1) { const width = w * [0.34, 0.28, 0.3][house]; const height = 1.25 + house * 0.32; const x = -w * 0.32 + house * w * 0.32; box(root, `LIVEWORK__R15__CONSERVATORY_${house + 1}`, [width, height, d * 0.76], m.clearGlass, [x, 0.72 + height * 0.5, 0], districtId, true); box(root, `LIVEWORK__R15__ASYMMETRIC_RIDGE_${house + 1}`, [width * 1.05, 0.09, d * 0.8], m.pvGlass, [x, 0.78 + height, 0], districtId, false, [0, 0, house % 2 ? 0.18 : -0.12]); cylinder(root, `LIVEWORK__R15__VENTILATION_FIN_${house + 1}`, 0.22, height + 0.7, m.blackSteel, [x + width * 0.42, 0.8 + height * 0.5, 0], districtId); } box(root, 'LIVEWORK__R15__EXTERNAL_EXERCISE_TERRACE', [w * 0.82, 0.09, 1.8], m.concrete, [0, 0.09, d * 0.58], districtId);
      for (let panel = 0; panel < 4; panel += 1) rotate(box(root, `LIVEWORK__R15__KINETIC_WEATHER_PANEL_${panel + 1}`, [0.52, 0.08, 0.24], m.champagne, [-2.1 + panel * 1.4, h + 0.55, 0], districtId), 0.0012 + panel * 0.00008); break;
    case 'R16':
      ringSegments(root, 'LIVEWORK__R16__RETAIL_RING_SEGMENT', 18, w * 0.38, d * 0.37, h, m.paleCeramic, districtId, [0, 4, 9, 13]); torus(root, 'LIVEWORK__R16__CONTINUOUS_WEATHER_CANOPY', w * 0.42, 0.18, m.bronze, [0, 0.86, 0], districtId, [Math.PI / 2, 0, 0]); cylinder(root, 'LIVEWORK__R16__COVERED_CIRCULAR_COURT', d * 0.52, 0.08, m.darkPaving, [0, 0.06, 0], districtId); for (let tree = 0; tree < 4; tree += 1) addTree(root, `LIVEWORK__R16__COURT_TREE_${tree + 1}`, Math.cos(tree * Math.PI / 2) * 1.25, Math.sin(tree * Math.PI / 2) * 1.25, districtId, m, false, 0.65); break;
    case 'R17': { const mass = addStandardBlock(root, record, districtId, m, 'residential', { material: m.brownBrick, roof: false }); box(root, 'LIVEWORK__R17__FOLDED_DARK_ZINC_ROOF', [mass.width * 1.04, 0.24, mass.depth * 1.08], m.blackSteel, [0, mass.height + 0.34, 0], districtId, false, [0, 0, -0.06]); for (let lantern = 0; lantern < 5; lantern += 1) box(root, `LIVEWORK__R17__GLASS_ROOF_LANTERN_${lantern + 1}`, [1.1 + (lantern % 2) * 0.35, 0.55 + (lantern % 3) * 0.16, 1.15], m.opalineGlass, [-mass.width * 0.36 + lantern * mass.width * 0.18, mass.height + 0.66, 0], districtId); for (let chimney = 0; chimney < 7; chimney += 1) cylinder(root, `LIVEWORK__R17__SCULPTURAL_EXTRACTION_CHIMNEY_${chimney + 1}`, 0.22, 0.8 + (chimney % 3) * 0.35, chimney % 2 ? m.copper : m.titanium, [-mass.width * 0.4 + chimney * mass.width * 0.13, mass.height + 0.75, -mass.depth * 0.34], districtId); break; }
    case 'R18':
      box(root, 'LIVEWORK__R18__BLACK_REFLECTING_POOL', [w, 0.08, d], m.water, [0, 0.05, 0], districtId); box(root, 'LIVEWORK__R18__DARK_STONE_PAVILION_BASE', [w * 0.68, 0.42, d * 0.55], m.basalt, [0, 0.24, 0], districtId, true); box(root, 'LIVEWORK__R18__BRONZE_GLASS_READING_ROOM', [w * 0.58, h * 0.62, d * 0.48], m.darkGreenGlass, [0, 0.45 + h * 0.31, 0], districtId, true); box(root, 'LIVEWORK__R18__SHARPLY_PROJECTING_TIMBER_ROOF', [w * 0.94, 0.18, d * 0.88], m.timber, [0, h + 0.18, 0], districtId); for (const x of [-1.4, 1.4]) box(root, `LIVEWORK__R18__APPROACH_BRIDGE_${x < 0 ? 'A' : 'B'}`, [0.75, 0.08, d * 0.8], m.limestone, [x, 0.11, d * 0.46], districtId); break;
    case 'R19': { const mass = addStandardBlock(root, record, districtId, m, 'residential', { material: m.limestone, roof: false }); for (let band = 0; band < 3; band += 1) box(root, `LIVEWORK__R19__TRANSLUCENT_GREEN_CLINIC_BAND_${band + 1}`, [mass.width * 0.84, 0.28, 0.06], m.darkGreenGlass, [0, 0.62 + band * 0.48, mass.depth * 0.45], districtId); pulse(box(root, 'LIVEWORK__R19__PHARMACY_CORNER_SIGN', [1.4, 0.34, 0.08], m.green.clone(), [mass.width * 0.32, 0.78, mass.depth * 0.48], districtId), 0.0025, 0.3, 0.5, 1.8); box(root, 'LIVEWORK__R19__MEDICAL_ARRIVAL_CANOPY', [3.8, 0.12, 1.8], m.opalineGlass, [0, 1.22, mass.depth * 0.64], districtId); break; }
    case 'R20':
      for (let pavilion = 0; pavilion < 6; pavilion += 1) { const angle = pavilion / 6 * Math.PI * 2; const height = 0.65 + (pavilion % 3) * 0.24; cylinder(root, `LIVEWORK__R20__ROUNDED_CHILDCARE_PAVILION_${pavilion + 1}`, 2.4 + (pavilion % 2) * 0.45, height, pavilion % 3 === 0 ? m.paleCeramic : pavilion % 3 === 1 ? m.timber : m.opalineGlass, [Math.cos(angle) * w * 0.26, height * 0.5 + 0.13, Math.sin(angle) * d * 0.24], districtId, true, 16); }
      ellipsoid(root, 'LIVEWORK__R20__UNDULATING_PHOTOVOLTAIC_ROOF', [w * 0.5, 0.45, d * 0.5], m.pvGlass, [0, h + 0.15, 0], districtId); for (let observation = 0; observation < 5; observation += 1) cylinder(root, `LIVEWORK__R20__CHILD_SCIENCE_OBSERVATION_STRUCTURE_${observation + 1}`, 0.35, 1.15, [m.cyan, m.green, m.amber, m.ultraviolet, m.bronze][observation], [-w * 0.32 + observation * w * 0.16, 0.6, d * 0.42], districtId, false, 8); break;
    case 'R21':
    case 'R22':
    case 'R23':
    case 'R24':
    case 'R25':
    case 'R26':
    case 'R27': addCyberpunkScientistMegablock(root, record, districtId, m); break;
    case 'R28':
    case 'R29':
    case 'R30':
    case 'R31':
    case 'R32':
    case 'R33':
    case 'R34':
    case 'R35':
    case 'R36': addCyberpunkResidentialEdgeEnsemble(root, record, districtId, m); break;
    default: addStandardBlock(root, record, districtId, m, 'residential');
  }
  addResidentialCyberpunkEnvelope(root, record, districtId, m);
  root.userData.opaqueResidentialArchitecture = true;
  return assignMetadata(root, record, districtId, 'residential');
}

function createEverHourFacility(record: LiveWorkBuildingProgram, m: Materials) {
  const districtId = 'even-hour-hotel'; const root = new THREE.Group(); root.name = `LIVEWORK__EVER_HOUR__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  const w = record.footprintMetres[0] / 10; const d = record.footprintMetres[1] / 10; const h = record.heightMetres / 10;
  switch (record.code) {
    case 'H01': addCrescent(root, record, districtId, m, 'ever-hour', true); for (let fin = 0; fin < 28; fin += 1) box(root, `LIVEWORK__H01__CHRONOMETER_SUN_FIN_${fin + 1}`, [0.08, h * 0.72, 0.34], fin % 5 === 0 ? m.goldLight : m.titanium, [-w * 0.42 + fin * w * 0.84 / 27, h * 0.5, d * 0.37 + Math.abs(fin - 13.5) * 0.018], districtId, false, [0, (fin - 13.5) * 0.015, 0]); break;
    case 'H02':
      for (let section = 0; section < 4; section += 1) { const x = (-1.5 + section) * 1.7; const z = (section - 1.5) * 0.28; box(root, `LIVEWORK__H02__ROTATED_HOTEL_SECTION_${section + 1}`, [2.45, h, d * 0.72], section % 2 ? m.paleCeramic : m.titanium, [x, h * 0.5 + 0.16, z], districtId, true, [0, (section - 1.5) * 0.07, 0]); for (let floor = 0; floor < 8; floor += 1) for (let bay = 0; bay < 2; bay += 1) box(root, `LIVEWORK__H02__SAMPLE_TRAY_WINDOW_${section + 1}_${floor + 1}_${bay + 1}`, [0.75, 0.3, 0.36], (floor + bay + section) % 3 ? m.opalineGlass : m.smokedGlass, [x + (bay ? 0.55 : -0.55), 0.55 + floor * 0.42, d * 0.39 + z], districtId); }
      box(root, 'LIVEWORK__H02__SHELTERED_PUBLIC_PLAZA', [w, 0.08, d], m.darkPaving, [0, 0.06, 0], districtId); box(root, 'LIVEWORK__H02__BENCH_STREET_ENCLOSED_BRIDGE', [5.8, 0.62, 1.0], m.opalineGlass, [w * 0.56, 2.25, 0], districtId); rotate(torus(root, 'LIVEWORK__H02__CIRCULAR_WEATHER_BEACON', 0.76, 0.08, m.cyan, [0, h + 0.55, 0], districtId, [Math.PI / 2, 0, 0]), 0.015); break;
    case 'H03':
      for (const side of [-1, 1]) { box(root, `LIVEWORK__H03__SHIFTED_APARTMENT_SLAB_${side < 0 ? 'A' : 'B'}`, [w * 0.44, h, d * 0.76], side < 0 ? m.brownBrick : m.paleCeramic, [side * w * 0.25, h * 0.5 + 0.15, side * 0.36], districtId, true, [0, side * 0.06, 0]); addWindowField(root, `H03_${side}`, w * 0.38, d * 0.74, h, 5, districtId, m, 'residential', true); }
      for (let bridge = 0; bridge < 3; bridge += 1) { box(root, `LIVEWORK__H03__SUSPENDED_GARDEN_BRIDGE_${bridge + 1}`, [w * 0.52, 0.52, 1.05], m.clearGlass, [0, 0.9 + bridge * 0.62, -1.2 + bridge * 1.2], districtId); box(root, `LIVEWORK__H03__BRIDGE_PLANTER_${bridge + 1}`, [w * 0.54, 0.14, 1.18], m.grass, [0, 0.62 + bridge * 0.62, -1.2 + bridge * 1.2], districtId); } break;
    case 'H04': { const mass = addStandardBlock(root, record, districtId, m, 'ever-hour', { material: m.blackSteel, roof: false }); for (let window = 0; window < 45; window += 1) box(root, `LIVEWORK__H04__SCATTERED_SQUARE_WINDOW_${window + 1}`, [0.28, 0.28, 0.07], window % 4 ? m.goldLight : m.smokedGlass, [-mass.width * 0.4 + (window % 9) * mass.width * 0.1, 0.58 + Math.floor(window / 9) * 0.36, mass.depth * 0.46], districtId); box(root, 'LIVEWORK__H04__EXPANDED_METAL_SECOND_SKIN', [mass.width * 0.96, mass.height * 0.74, mass.depth * 0.92], m.smokedGlass, [0, 0.65 + mass.height * 0.37, 0], districtId); pulse(box(root, 'LIVEWORK__H04__ZERO_HOUR_TRANSIT_SIGN', [0.52, 2.6, 0.16], m.amber.clone(), [mass.width * 0.47, 1.45, mass.depth * 0.48], districtId), 0.003, 0.5); break; }
    case 'H05':
      for (const [x, z, sx, sz] of [[0, -d * 0.37, w, 1.5], [0, d * 0.37, w, 1.5], [-w * 0.42, 0, 1.5, d * 0.62], [w * 0.42, 0, 1.5, d * 0.62]] as const) box(root, `LIVEWORK__H05__CLOISTER_WING_${x}_${z}`, [sx, h * 0.72, sz], m.blackBrick, [x, h * 0.36 + 0.14, z], districtId, true); for (let corner = 0; corner < 4; corner += 1) { const x = (corner % 2 ? 1 : -1) * w * 0.42; const z = (corner < 2 ? -1 : 1) * d * 0.37; box(root, `LIVEWORK__H05__ENGRAVED_STAIR_TOWER_${corner + 1}`, [1.1, h, 1.1], m.brownBrick, [x, h * 0.5 + 0.14, z], districtId, true); cylinder(root, `LIVEWORK__H05__ANGLED_COPPER_CAP_${corner + 1}`, 1.35, 0.4, m.copper, [x, h + 0.34, z], districtId, false, 8); } box(root, 'LIVEWORK__H05__NARROW_WATER_GARDEN', [w * 0.6, 0.07, d * 0.4], m.water, [0, 0.06, 0], districtId); break;
    case 'H06':
      ringSegments(root, 'LIVEWORK__H06__CONFERENCE_RING_SEGMENT', 24, w * 0.39, d * 0.38, h * 0.72, m.basalt, districtId, [0, 6, 12, 18]); cylinder(root, 'LIVEWORK__H06__OPEN_CENTRAL_FORUM', d * 0.56, 0.08, m.darkPaving, [0, 0.06, 0], districtId); for (let foyer = 0; foyer < 4; foyer += 1) { const angle = foyer * Math.PI / 2; box(root, `LIVEWORK__H06__ILLUMINATED_FOYER_WEDGE_${foyer + 1}`, [2.2, h, 1.35], m.opalineGlass, [Math.cos(angle) * w * 0.42, h * 0.5 + 0.15, Math.sin(angle) * d * 0.42], districtId, true, [0, -angle, 0]); } for (let petal = 0; petal < 8; petal += 1) rotate(box(root, `LIVEWORK__H06__RETRACTABLE_FORUM_PETAL_${petal + 1}`, [2.2, 0.08, 0.85], m.pvGlass, [Math.cos(petal * Math.PI / 4) * 2.1, 2.1, Math.sin(petal * Math.PI / 4) * 2.1], districtId, false, [0.2, -petal * Math.PI / 4, 0]), 0.001 + petal * 0.00003, 'y'); break;
    case 'H07':
      for (const side of [-1, 1]) box(root, `LIVEWORK__H07__ENGRAVED_CERAMIC_GATE_VOLUME_${side < 0 ? 'A' : 'B'}`, [w * 0.36, h, d * 0.8], m.paleCeramic, [side * w * 0.3, h * 0.5 + 0.15, 0], districtId, true); box(root, 'LIVEWORK__H07__TRANSPARENT_GATE_PASSAGE', [w * 0.22, h * 0.72, d], m.clearGlass, [0, h * 0.36 + 0.15, 0], districtId); box(root, 'LIVEWORK__H07__UPPER_PROTOCOL_BRIDGE', [w * 0.32, 0.6, d * 0.72], m.opalineGlass, [0, h * 0.78, 0], districtId); for (let strip = 0; strip < 8; strip += 1) pulse(box(root, `LIVEWORK__H07__ACCESS_STATUS_STRIP_${strip + 1}`, [0.09, 1.1, 0.07], [m.cyan, m.green, m.amber, m.ultraviolet][strip % 4].clone(), [-w * 0.44 + strip * w * 0.88 / 7, 0.78, d * 0.44], districtId), 0.004, strip * 0.5); break;
    case 'H08':
      for (const side of [-1, 1]) { box(root, `LIVEWORK__H08__MICRO_LAB_BAR_${side < 0 ? 'A' : 'B'}`, [w, h, 2.15], m.paleCeramic, [0, h * 0.5 + 0.13, side * 2.15], districtId, true); for (let module = 0; module < 12; module += 1) { const x = -w * 0.44 + module * w * 0.88 / 11; box(root, `LIVEWORK__H08__LAB_MODULE_VESTIBULE_${side}_${module + 1}`, [0.68, 0.86, 0.28], m.clearGlass, [x, 0.57, side * 3.27], districtId); pulse(box(root, `LIVEWORK__H08__LAB_MODULE_STATUS_${side}_${module + 1}`, [0.06, 0.72, 0.08], [m.cyan, m.green, m.amber, m.ultraviolet][module % 4].clone(), [x + 0.35, 0.6, side * 3.42], districtId), 0.005, module * 0.4 + side); } }
      box(root, 'LIVEWORK__H08__BENCH_STREET_PHOTOVOLTAIC_ROOF', [w * 1.04, 0.11, 2.45], m.pvGlass, [0, 2.45, 0], districtId); for (let conduit = 0; conduit < 8; conduit += 1) box(root, `LIVEWORK__H08__ORDERED_UTILITY_CONDUIT_${conduit + 1}`, [w, 0.035, 0.04], [m.titanium, m.cyan, m.green, m.amber][conduit % 4], [0, 2.34 - conduit * 0.055, -0.7 + conduit * 0.2], districtId); break;
    case 'H09':
      box(root, 'LIVEWORK__H09__VIBRATION_ISOLATED_PLINTH', [w, 0.72, d], m.basalt, [0, 0.36, 0], districtId, true); box(root, 'LIVEWORK__H09__HOVERING_CHANNEL_GLASS_CUBE', [w * 0.82, h, d * 0.82], m.opalineGlass, [0, 0.94 + h * 0.5, 0], districtId, true); for (let grid = 0; grid < 9; grid += 1) { box(root, `LIVEWORK__H09__BLACK_CALIBRATION_GRID_VERTICAL_${grid + 1}`, [0.08, h, d * 0.86], m.blackSteel, [-w * 0.36 + grid * w * 0.09, 0.94 + h * 0.5, 0], districtId); box(root, `LIVEWORK__H09__BRASS_REFERENCE_SCALE_${grid + 1}`, [w * 0.76, 0.05, 0.06], m.champagne, [0, 1.25 + grid * h * 0.095, d * 0.43], districtId); } box(root, 'LIVEWORK__H09__TRANSPARENT_COOLING_SPINE', [1.1, h * 1.05, 1.2], m.clearGlass, [w * 0.48, 1 + h * 0.5, 0], districtId); break;
    case 'H10':
      for (let bay = 0; bay < 10; bay += 1) { const x = -w * 0.44 + bay * w * 0.88 / 9; box(root, `LIVEWORK__H10__CHEMISTRY_STUDIO_BAY_${bay + 1}`, [w * 0.095, h, d * 0.68], bay % 2 ? m.paleCeramic : m.charcoalCeramic, [x, h * 0.5 + 0.12, 0], districtId, true); box(root, `LIVEWORK__H10__SAWTOOTH_DAYLIGHT_ROOF_${bay + 1}`, [w * 0.105, 0.1, d * 0.74], m.pvGlass, [x, h + 0.22 + (bay % 2) * 0.22, 0], districtId, false, [0, 0, bay % 2 ? 0.18 : -0.18]); cylinder(root, `LIVEWORK__H10__PERFORATED_EXHAUST_TOWER_${bay + 1}`, 0.32, 1.0 + (bay % 4) * 0.22, m.titanium, [x, h + 0.58 + (bay % 4) * 0.11, -d * 0.34], districtId); } box(root, 'LIVEWORK__H10__SCREENED_TECHNICAL_SERVICE_EDGE', [w, 1.45, 0.25], m.blackSteel, [0, 0.75, -d * 0.52], districtId, true); break;
    case 'H11':
      cylinder(root, 'LIVEWORK__H11__ISOLATION_GARDEN', d * 0.5, 0.08, m.grass, [0, 0.06, 0], districtId); for (let wing = 0; wing < 3; wing += 1) { const angle = wing / 3 * Math.PI * 2; box(root, `LIVEWORK__H11__ROUNDED_BIOCERAMIC_WING_${wing + 1}`, [w * 0.5, h, 2.2], wing % 2 ? m.paleCeramic : m.darkGreenGlass, [Math.cos(angle) * 2.4, h * 0.5 + 0.14, Math.sin(angle) * 2.4], districtId, true, [0, -angle, 0]); cylinder(root, `LIVEWORK__H11__FILTRATION_TOWER_${wing + 1}`, 1.25, h + 1.0, m.titanium, [Math.cos(angle) * w * 0.38, (h + 1) * 0.5, Math.sin(angle) * d * 0.38], districtId, true); pulse(box(root, `LIVEWORK__H11__FROSTED_STATUS_BAND_${wing + 1}`, [0.2, h * 0.72, 0.08], [m.green, m.cyan, m.amber][wing].clone(), [Math.cos(angle) * 4.7, h * 0.5, Math.sin(angle) * 4.7], districtId), 0.004, wing); } torus(root, 'LIVEWORK__H11__PUBLIC_BIOSWALE', d * 0.45, 0.18, m.water, [0, 0.08, 0], districtId, [Math.PI / 2, 0, 0]); break;
    case 'H12':
      for (let hall = 0; hall < 5; hall += 1) { const x = -w * 0.38 + hall * w * 0.19; box(root, `LIVEWORK__H12__ELECTRONICS_ROBOTICS_HALL_${hall + 1}`, [w * 0.17, h, d * 0.42], m.blackSteel, [x, h * 0.5 + 0.12, -d * 0.2], districtId, true); box(root, `LIVEWORK__H12__FOLDED_SOLAR_ROOF_${hall + 1}`, [w * 0.18, 0.12, d * 0.48], m.pvGlass, [x, h + 0.24 + hall * 0.05, -d * 0.2], districtId, false, [0, 0, (hall - 2) * 0.055]); box(root, `LIVEWORK__H12__GRAPHITE_GLASS_STUDIO_DOOR_${hall + 1}`, [w * 0.12, 0.8, 0.08], m.smokedGlass, [x, 0.52, d * 0.02], districtId); }
      box(root, 'LIVEWORK__H12__EXTERNAL_POSITIONING_TEST_YARD', [w * 0.92, 0.08, d * 0.46], m.concrete, [0, 0.06, d * 0.27], districtId); for (let marker = 0; marker < 20; marker += 1) box(root, `LIVEWORK__H12__TEST_YARD_POSITION_MARKER_${marker + 1}`, [0.04, 0.03, d * 0.36], marker % 5 === 0 ? m.amber : m.titanium, [-w * 0.4 + marker * w * 0.8 / 19, 0.12, d * 0.27], districtId); for (let obstacle = 0; obstacle < 8; obstacle += 1) box(root, `LIVEWORK__H12__MODULAR_TEST_OBSTACLE_${obstacle + 1}`, [0.55 + (obstacle % 3) * 0.18, 0.18 + (obstacle % 4) * 0.16, 0.62], obstacle % 2 ? m.basalt : m.titanium, [-w * 0.36 + obstacle * w * 0.1, 0.15 + (obstacle % 4) * 0.08, d * 0.26 + (obstacle % 2) * 1.4], districtId, true); break;
    case 'H13':
      cylinder(root, 'LIVEWORK__H13__FACETED_DRYLAB_TOWER', 4.8, h, m.smokedGlass, [0, h * 0.5 + 0.16, 0], districtId, true, 8, [0, Math.PI / 8, 0]); for (let strip = 0; strip < 6; strip += 1) pulse(box(root, `LIVEWORK__H13__VERTICAL_DATA_STRIP_${strip + 1}`, [0.12, h * 0.86, 0.08], m.opalineGlass.clone(), [-1.8 + strip * 0.72, h * 0.5 + 0.2, 2.43], districtId), 0.003 + strip * 0.0002, strip * 0.6); for (let field = 0; field < 18; field += 1) box(root, `LIVEWORK__H13__ELECTRONIC_INK_DATA_FIELD_${field + 1}`, [0.52, 0.34, 0.05], field % 4 ? m.blackSteel : m.cyan, [-1.65 + (field % 6) * 0.66, 0.55 + Math.floor(field / 6) * 0.72, 2.48], districtId); box(root, 'LIVEWORK__H13__SUNKEN_PLANTED_PLAZA', [w, 0.12, d], m.darkGrass, [0, 0.02, 0], districtId); break;
    case 'H14':
      box(root, 'LIVEWORK__H14__STONE_POOL_TERRACE', [w, 0.38, d], m.limestone, [0, 0.2, 0], districtId, true); ellipsoid(root, 'LIVEWORK__H14__TRANSPARENT_AIRSHIP_SHELL', [w * 0.5, h * 0.62, d * 0.5], m.clearGlass, [0, h * 0.55, 0], districtId); box(root, 'LIVEWORK__H14__POOL_WATER_BODY', [w * 0.72, 0.08, d * 0.52], m.water, [0, 0.42, 0], districtId); for (let rib = 0; rib < 14; rib += 1) torus(root, `LIVEWORK__H14__TIMBER_STEEL_SHELL_RIB_${rib + 1}`, d * 0.43, 0.065, rib % 3 ? m.timber : m.blackSteel, [-w * 0.44 + rib * w * 0.88 / 13, h * 0.55, 0], districtId, [0, Math.PI / 2, 0], Math.PI); break;
    case 'H15':
      for (let vessel = 0; vessel < 6; vessel += 1) { const angle = vessel / 6 * Math.PI * 2; const radius = vessel % 2 ? 2.35 : 1.55; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius; cylinder(root, `LIVEWORK__H15__FROSTED_RECOVERY_VESSEL_${vessel + 1}`, 2.4, 1.15, m.opalineGlass, [x, 0.7, z], districtId, true, 16); for (let ring = 0; ring < 3; ring += 1) torus(root, `LIVEWORK__H15__BRONZE_VESSEL_RING_${vessel + 1}_${ring + 1}`, 1.2, 0.045, m.bronze, [x, 0.35 + ring * 0.35, z], districtId, [Math.PI / 2, 0, 0]); pulse(ellipsoid(root, `LIVEWORK__H15__STEAM_VENT_${vessel + 1}`, [0.22, 0.48, 0.22], m.opalineGlass.clone(), [x, 1.65, z], districtId), 0.002, vessel * 0.6, 0.08, 0.8); } ellipsoid(root, 'LIVEWORK__H15__BRANCHING_GLASS_CANOPY', [w * 0.5, 0.35, d * 0.5], m.clearGlass, [0, 2.2, 0], districtId); break;
    case 'H16':
      ringSegments(root, 'LIVEWORK__H16__LEISURE_LOOP_SEGMENT', 22, w * 0.39, d * 0.4, h, m.smokedGlass, districtId, [0, 6, 11, 17]); torus(root, 'LIVEWORK__H16__FOLDED_SILVER_MESH_SCREEN', w * 0.43, 0.2, m.titanium, [0, h * 0.56, 0], districtId, [Math.PI / 2, 0, 0]); torus(root, 'LIVEWORK__H16__ROOFTOP_RUNNING_PATH', w * 0.38, 0.18, m.palePaving, [0, h + 0.28, 0], districtId, [Math.PI / 2, 0, 0]); for (let fin = 0; fin < 8; fin += 1) rotate(box(root, `LIVEWORK__H16__KINETIC_WIND_FIN_${fin + 1}`, [0.12, 1.1, 0.48], m.champagne, [-w * 0.46, 0.75 + (fin % 2) * 0.35, -d * 0.34 + fin * d * 0.095], districtId), 0.0015 + fin * 0.00005); break;
    case 'H17': { const mass = addStandardBlock(root, record, districtId, m, 'ever-hour', { material: m.basalt, roof: false }); box(root, 'LIVEWORK__H17__DARK_METAL_MARKET_ROOF', [mass.width * 1.04, 0.22, mass.depth * 1.05], m.blackSteel, [0, mass.height + 0.3, 0], districtId); for (let lantern = 0; lantern < 6; lantern += 1) box(root, `LIVEWORK__H17__IRREGULAR_GLASS_LANTERN_${lantern + 1}`, [1.0 + (lantern % 3) * 0.28, 0.5 + (lantern % 2) * 0.28, 1.0], m.opalineGlass, [-mass.width * 0.4 + lantern * mass.width * 0.16, mass.height + 0.62, 0], districtId, false, [0, 0, (lantern % 3 - 1) * 0.12]); for (let chimney = 0; chimney < 8; chimney += 1) cylinder(root, `LIVEWORK__H17__FOOD_HALL_CHIMNEY_${chimney + 1}`, 0.24, 0.8 + (chimney % 4) * 0.24, chimney % 2 ? m.copper : m.titanium, [-mass.width * 0.42 + chimney * mass.width * 0.12, mass.height + 0.72, -mass.depth * 0.36], districtId); break; }
    case 'H18':
      box(root, 'LIVEWORK__H18__DARK_CERAMIC_SERVICE_BASE', [w, 0.56, d], m.charcoalCeramic, [0, 0.3, 0], districtId, true); for (let gable = 0; gable < 4; gable += 1) { const width = w * (0.22 + (gable % 2) * 0.05); const x = -w * 0.34 + gable * w * 0.225; const height = 1.05 + (gable % 3) * 0.35; box(root, `LIVEWORK__H18__EDIBLE_GLASS_GABLE_${gable + 1}`, [width, height, d * 0.78], m.clearGlass, [x, 0.58 + height * 0.5, 0], districtId, true); box(root, `LIVEWORK__H18__PV_GABLE_ROOF_${gable + 1}`, [width * 1.08, 0.1, d * 0.82], m.pvGlass, [x, 0.65 + height, 0], districtId, false, [0, 0, gable % 2 ? 0.18 : -0.18]); for (let vine = 0; vine < 4; vine += 1) box(root, `LIVEWORK__H18__VERTICAL_EDIBLE_PLANT_SUPPORT_${gable + 1}_${vine + 1}`, [0.05, height * 0.82, 0.06], m.grass, [x - width * 0.36 + vine * width * 0.24, 0.7 + height * 0.4, d * 0.42], districtId); } break;
    case 'H19':
      box(root, 'LIVEWORK__H19__DARK_STONE_SERVICE_TOWER', [2.4, h, 2.8], m.basalt, [-w * 0.26, h * 0.5 + 0.14, 0], districtId, true); box(root, 'LIVEWORK__H19__CANTILEVERED_BRONZE_GLASS_PRISM', [w * 0.74, 1.35, d * 0.62], m.smokedGlass, [w * 0.08, h * 0.72, 0], districtId, true); box(root, 'LIVEWORK__H19__POLISHED_REFLECTIVE_UNDERSIDE', [w * 0.74, 0.08, d * 0.62], m.titanium, [w * 0.08, h * 0.72 - 0.7, 0], districtId); box(root, 'LIVEWORK__H19__SUSPENDED_AFTERLIGHT_INTERIOR', [w * 0.58, 0.18, d * 0.45], m.goldLight, [w * 0.08, h * 0.72, 0], districtId); box(root, 'LIVEWORK__H19__WARM_SOFFIT_REFLECTION', [w * 0.5, 0.045, d * 0.38], m.amber, [w * 0.08, h * 0.72 - 0.76, 0], districtId); box(root, 'LIVEWORK__H19__REFLECTING_POOL', [w, 0.08, d], m.water, [0, 0.05, 0], districtId); box(root, 'LIVEWORK__H19__GLASS_LIFT_SHAFT', [0.9, h * 0.85, 0.9], m.clearGlass, [w * 0.42, h * 0.425, d * 0.28], districtId, true); break;
    case 'H20':
      ringSegments(root, 'LIVEWORK__H20__OPALINE_MARKET_SEGMENT', 20, w * 0.38, d * 0.36, h, m.opalineGlass, districtId, [0, 5, 10, 15]); torus(root, 'LIVEWORK__H20__CHAMPAGNE_MARKET_FRAME', w * 0.42, 0.16, m.champagne, [0, 0.82, 0], districtId, [Math.PI / 2, 0, 0]); cylinder(root, 'LIVEWORK__H20__MEMBRANE_COVERED_COURTYARD', d * 0.54, 0.08, m.darkPaving, [0, 0.06, 0], districtId); for (let tree = 0; tree < 4; tree += 1) addTree(root, `LIVEWORK__H20__COURTYARD_TREE_${tree + 1}`, Math.cos(tree * Math.PI / 2) * 1.2, Math.sin(tree * Math.PI / 2) * 1.2, districtId, m, false, 0.62); break;
    case 'H21':
      for (let floor = 0; floor < 5; floor += 1) { const scale = 1 - floor * 0.1; const z = -d * 0.18 + floor * 0.2; const triangle = new THREE.Group(); triangle.name = `LIVEWORK__H21__TRIANGULAR_RETAIL_FLOOR_${floor + 1}`; root.add(triangle); for (let side = 0; side < 3; side += 1) { const angle = side * Math.PI * 2 / 3; box(triangle, `LIVEWORK__H21__WEDGE_SIDE_${floor + 1}_${side + 1}`, [w * 0.62 * scale, 0.55, 1.0], side % 2 ? m.blackBrick : m.smokedGlass, [Math.cos(angle) * w * 0.18 * scale, 0.42 + floor * 0.58, z + Math.sin(angle) * d * 0.18 * scale], districtId, true, [0, -angle, 0]); } }
      for (let sign = 0; sign < 12; sign += 1) pulse(box(root, `LIVEWORK__H21__RESTRICTED_BLADE_SIGN_${sign + 1}`, [0.42, 0.18, 0.08], [m.amber, m.silverLight, m.redGuide, m.cyan][sign % 4].clone(), [-w * 0.38 + (sign % 6) * w * 0.15, 0.65 + Math.floor(sign / 6) * 0.7, d * 0.42], districtId), 0.004, sign * 0.35); pulse(box(root, 'LIVEWORK__H21__INTERMITTENT_TIME_SIGN', [0.38, 2.2, 0.12], m.amber.clone(), [w * 0.45, 1.3, 0], districtId), 0.0018, 1.7, 0.02, 2.1); break;
    case 'H22':
      ringSegments(root, 'LIVEWORK__H22__SUPPLY_RING_MODULE', 24, w * 0.39, d * 0.4, h, m.opalineGlass, districtId, [0, 5, 10, 15, 20]); torus(root, 'LIVEWORK__H22__DARK_RED_TRANSIT_ROOF', w * 0.43, 0.2, m.redCeramic, [0, h + 0.12, 0], districtId, [Math.PI / 2, 0, 0]); cylinder(root, 'LIVEWORK__H22__COVERED_RING_TRANSIT_STOP', d * 0.56, 0.08, m.darkPaving, [0, 0.06, 0], districtId); for (let segment = 0; segment < 28; segment += 1) pulse(box(root, `LIVEWORK__H22__TRANSIT_ROUTE_LIGHT_${segment + 1}`, [0.36, 0.06, 0.08], [m.cyan, m.green, m.goldLight][segment % 3].clone(), [Math.cos(segment / 28 * Math.PI * 2) * w * 0.43, 1.05, Math.sin(segment / 28 * Math.PI * 2) * d * 0.43], districtId, false, [0, -segment / 28 * Math.PI * 2, 0]), 0.007, segment * 0.24); cylinder(root, 'LIVEWORK__H22__COMMUNICATIONS_MAST', 0.18, 3.2, m.titanium, [0, h + 1.6, 0], districtId); break;
    case 'H23': addGrandEverHourHotel(root, record, districtId, m); break;
    default: addStandardBlock(root, record, districtId, m, 'ever-hour');
  }
  return assignMetadata(root, record, districtId, 'ever-hour');
}

function assignMetadata(root: THREE.Group, record: LiveWorkBuildingProgram, districtId: string, kind: DistrictKind) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.semanticName = record.name;
  root.userData.purpose = record.purpose;
  root.userData.facilityForm = record.form;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.zone;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.lighting = record.lighting;
  root.userData.liveWorkDistrictKind = kind;
  root.userData.navObstacle = record.code !== 'H23';
  if (record.code === 'H23') root.userData.preciseChildCollision = true;
  root.traverse((object) => { object.userData.selectableId = districtId; object.userData.districtId = districtId; });
  return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 5.8; const angularMargin = (sector.endAngle - sector.startAngle) * 0.045;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function seededUnit(label: string, salt: number) {
  let hash = (2166136261 ^ salt) >>> 0;
  for (let index = 0; index < label.length; index += 1) {
    hash ^= label.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return (hash % 10_007) / 10_006;
}

function organicPlacement(record: LiveWorkBuildingProgram, kind: DistrictKind) {
  if (record.code === 'H23') return { radialT: record.radialT, angularT: record.angularT, rotationOffset: 0 };
  const expansionRotations: Readonly<Record<string, number>> = {
    R21: 0.09,
    R22: -0.115,
    R23: 0.13,
    R24: 0.025,
    R25: -0.035,
    R26: -0.12,
    R27: 0.105,
    R28: -0.11,
    R29: 0.14,
    R30: 0.08,
    R31: -0.16,
    R32: 0.18,
    R33: -0.09,
    R34: 0.13,
    R35: -0.18,
    R36: 0.055,
  };
  if (record.code in expansionRotations) return { radialT: record.radialT, angularT: record.angularT, rotationOffset: expansionRotations[record.code] };
  const authoredNudges: Readonly<Record<string, readonly [number, number, number]>> = {
    R03: [-0.015, 0.035, -0.05],
    R10: [0, -0.025, 0.04],
    H02: [0.012, -0.04, -0.03],
    H11: [-0.012, 0.035, 0.02],
    H16: [0, 0.14, 0],
  };
  const nudge = authoredNudges[record.code] ?? [0, 0, 0];
  const broadness = THREE.MathUtils.clamp(Math.max(...record.footprintMetres) / 136, 0, 1);
  const radialAmplitude = THREE.MathUtils.lerp(0.044, 0.026, broadness);
  const angularAmplitude = THREE.MathUtils.lerp(0.052, 0.03, broadness);
  const radialT = THREE.MathUtils.clamp(record.radialT + (seededUnit(record.code, 17) * 2 - 1) * radialAmplitude + nudge[0], 0.065, 0.935);
  const angularT = THREE.MathUtils.clamp(record.angularT + (seededUnit(record.code, 53) * 2 - 1) * angularAmplitude + nudge[1], 0.065, 0.935);
  const rotationAmplitude = kind === 'residential'
    ? THREE.MathUtils.lerp(0.48, 0.24, broadness)
    : THREE.MathUtils.lerp(0.4, 0.2, broadness);
  const rotationOffset = (seededUnit(record.code, 97) * 2 - 1) * rotationAmplitude + nudge[2];
  return { radialT, angularT, rotationOffset };
}

function corneredDistrictPath(definition: DistrictDefinition, controls: readonly (readonly [number, number])[]) {
  const anchors = controls.map(([radialT, angularT]) => pointInDistrict(definition, radialT, angularT, FLOOR_Y));
  return chamferPolyline(anchors, 0.56).map((point) => point.setY(FLOOR_Y));
}

function chamferPolyline(points: readonly THREE.Vector3[], amount = 0.22) {
  if (points.length < 3) return points.map((point) => point.clone());
  const result = [points[0].clone()];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]; const current = points[index]; const next = points[index + 1];
    const incoming = current.clone().sub(previous); const outgoing = next.clone().sub(current);
    const inset = Math.min(amount, incoming.length() * 0.28, outgoing.length() * 0.28);
    result.push(current.clone().addScaledVector(incoming.normalize(), -inset));
    result.push(current.clone().addScaledVector(outgoing.normalize(), inset));
  }
  result.push(points[points.length - 1].clone());
  return result;
}

function densifyPolyline(points: readonly THREE.Vector3[], spacing = 0.45) {
  const result: THREE.Vector3[] = [];
  points.slice(0, -1).forEach((start, index) => {
    const end = points[index + 1]; const length = start.distanceTo(end); const steps = Math.max(1, Math.ceil(length / spacing));
    for (let step = 0; step < steps; step += 1) result.push(start.clone().lerp(end, step / steps));
  });
  if (points.length) result.push(points[points.length - 1].clone());
  return result;
}

function continuumPoints(definition: DistrictDefinition, segments = 121) {
  const sector = definition.sector!; const angle = sector.centerAngle;
  return Array.from({ length: segments }, (_, index) => {
    const t = index / (segments - 1); const radius = THREE.MathUtils.lerp(sector.outerRadius, sector.innerRadius, t);
    return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], FLOOR_Y, Math.sin(angle) * radius - definition.position[2]);
  });
}

function nearestPoint(points: readonly THREE.Vector3[], target: THREE.Vector3) {
  return points.reduce((closest, point) => point.distanceToSquared(target) < closest.distanceToSquared(target) ? point : closest, points[0]);
}

function addOrganicLaneNetwork(infrastructure: THREE.Group, definition: DistrictDefinition, kind: DistrictKind, continuum: readonly THREE.Vector3[], m: Materials) {
  const prefix = kind === 'residential' ? 'RESIDENTIAL' : 'EVER_HOUR';
  const laneMaterial = kind === 'residential' ? m.residentialLane : m.everHourLane;
  const laneWidth = kind === 'residential' ? 0.52 : 0.62;
  const laneControls: readonly { readonly id: string; readonly controls: readonly (readonly [number, number])[] }[] = kind === 'residential'
    ? [
        { id: 'ROOTLINE_GARDEN_SPINE', controls: [[0.08, 0.16], [0.33, 0.14], [0.59, 0.18], [0.93, 0.15]] },
        { id: 'COMMONS_INNER_SPINE', controls: [[0.08, 0.38], [0.34, 0.35], [0.61, 0.39], [0.92, 0.36]] },
        { id: 'ARCHIVE_INNER_SPINE', controls: [[0.07, 0.62], [0.32, 0.65], [0.6, 0.61], [0.92, 0.64]] },
        { id: 'FAMILY_ORBIT_SPINE', controls: [[0.07, 0.84], [0.3, 0.87], [0.56, 0.82], [0.79, 0.86], [0.92, 0.83]] },
        { id: 'COMMONS_CROSSWALK_WEST', controls: [[0.19, 0.16], [0.19, 0.34], [0.21, 0.5]] },
        { id: 'ARCHIVE_CROSSWALK_EAST', controls: [[0.37, 0.5], [0.37, 0.67], [0.37, 0.85]] },
        { id: 'POOL_COMMONS_CROSSWALK_WEST', controls: [[0.62, 0.17], [0.62, 0.34], [0.63, 0.5]] },
        { id: 'FAMILY_GARDEN_CROSSWALK_EAST', controls: [[0.81, 0.5], [0.81, 0.67], [0.8, 0.85]] },
        { id: 'OUTER_ARCOLOGY_CRESCENT', controls: [[0.97, 0.08], [0.985, 0.28], [0.965, 0.5], [0.99, 0.72], [0.97, 0.92]] },
        { id: 'SOUTHLINE_NEON_PROMENADE', controls: [[0.08, 0.055], [0.31, 0.025], [0.53, 0.065], [0.72, 0.025], [0.92, 0.07]] },
        { id: 'CONTINUUM_GATE_NEON_WALK', controls: [[0.035, 0.1], [0.015, 0.31], [0.05, 0.5], [0.015, 0.72], [0.04, 0.9]] },
      ]
    : [
        { id: 'CHRONOGARDEN_GUEST_SPINE', controls: [[0.07, 0.15], [0.31, 0.12], [0.56, 0.18], [0.79, 0.13], [0.93, 0.17]] },
        { id: 'EXCHANGE_INNER_SPINE', controls: [[0.07, 0.37], [0.31, 0.34], [0.56, 0.39], [0.8, 0.35], [0.93, 0.38]] },
        { id: 'BENCH_STREET_INNER_SPINE', controls: [[0.07, 0.63], [0.3, 0.67], [0.55, 0.61], [0.8, 0.66], [0.93, 0.62]] },
        { id: 'BENCHLIGHT_LAB_SPINE', controls: [[0.07, 0.85], [0.3, 0.88], [0.55, 0.83], [0.8, 0.88], [0.93, 0.84]] },
        { id: 'NULL_HOUR_CROSSWALK_WEST', controls: [[0.16, 0.14], [0.18, 0.33], [0.19, 0.5]] },
        { id: 'INTERCHANGE_CROSSWALK_EAST', controls: [[0.33, 0.5], [0.34, 0.67], [0.35, 0.86]] },
        { id: 'POOL_COMMONS_CROSSWALK_WEST', controls: [[0.53, 0.17], [0.54, 0.34], [0.55, 0.5]] },
        { id: 'MINUTE_MARKET_CROSSWALK_EAST', controls: [[0.71, 0.5], [0.71, 0.68], [0.7, 0.86]] },
        { id: 'AFTERLIGHT_CROSSWALK_WEST', controls: [[0.88, 0.16], [0.88, 0.34], [0.87, 0.5]] },
      ];
  const networkPoints = continuum.map((point) => point.clone());
  const laneNames: string[] = [];
  laneControls.forEach(({ id, controls }) => {
    const points = corneredDistrictPath(definition, controls);
    const lane = ribbon(infrastructure, `LIVEWORK__${prefix}__ORGANIC_LANE__${id}`, points, laneWidth, laneMaterial, definition.id);
    lane.userData.routeStyle = 'shared-organic-campus-lane';
    lane.userData.networkHierarchy = id.includes('SPINE') ? 'neighborhood-spine' : 'cornered-crosswalk';
    if (kind === 'residential') {
      const neonPoints = points.map((point) => point.clone().setY(FLOOR_Y + 0.022));
      const light = ribbon(infrastructure, `LIVEWORK__RESIDENTIAL__CYBERPUNK_LANE_CENTERLIGHT__${id}`, neonPoints, 0.055, [m.neonCyan, m.neonMagenta, m.neonViolet][laneNames.length % 3], definition.id);
      light.userData.routeStyle = 'cyberpunk-neon-organic-lane-light';
      light.userData.networkHierarchy = lane.userData.networkHierarchy;
    }
    networkPoints.push(...densifyPolyline(points));
    laneNames.push(lane.name);
  });
  if (kind === 'residential') {
    const pocketRoutes: readonly { readonly id: string; readonly hierarchy: string; readonly controls: readonly (readonly [number, number])[] }[] = [
      { id: 'GREEN_POCKET_RESIDENTIAL_WEAVE', hierarchy: 'green-pocket-weave', controls: [[0.06, 0.99], [0.16, 0.92], [0.28, 0.98], [0.42, 0.92], [0.58, 0.985], [0.74, 0.92], [0.88, 0.98], [0.995, 0.94]] },
      { id: 'GREEN_POCKET_INNER_COURT', hierarchy: 'green-pocket-court', controls: [[0.12, 0.86], [0.2, 0.92], [0.3, 0.975]] },
      { id: 'GREEN_POCKET_MIDDLE_COURT', hierarchy: 'green-pocket-court', controls: [[0.4, 0.875], [0.51, 0.94], [0.62, 0.985]] },
      { id: 'GREEN_POCKET_OUTER_COURT', hierarchy: 'green-pocket-court', controls: [[0.72, 0.87], [0.84, 0.935], [0.96, 0.985]] },
    ];
    pocketRoutes.forEach(({ id, hierarchy, controls }, routeIndex) => {
      const points = corneredDistrictPath(definition, controls);
      const lane = ribbon(infrastructure, `LIVEWORK__RESIDENTIAL__ORGANIC_LANE__${id}`, points, 0.56, laneMaterial, definition.id);
      lane.userData.routeStyle = 'shared-organic-campus-lane'; lane.userData.networkHierarchy = hierarchy; lane.userData.greenHighlightedResidentialPocket = true;
      const neonPoints = points.map((point) => point.clone().setY(FLOOR_Y + 0.022));
      const light = ribbon(infrastructure, `LIVEWORK__RESIDENTIAL__CYBERPUNK_LANE_CENTERLIGHT__${id}`, neonPoints, 0.06, [m.neonCyan, m.neonMagenta, m.neonViolet][routeIndex % 3], definition.id);
      light.userData.routeStyle = 'cyberpunk-neon-organic-lane-light'; light.userData.networkHierarchy = hierarchy; light.userData.greenHighlightedResidentialPocket = true;
      networkPoints.push(...densifyPolyline(points)); laneNames.push(lane.name);
    });
  }
  return { networkPoints, laneNames };
}

function addContinuumWalk(infrastructure: THREE.Group, definition: DistrictDefinition, kind: DistrictKind, m: Materials) {
  const districtId = definition.id; const prefix = kind === 'residential' ? 'RESIDENTIAL' : 'EVER_HOUR'; const points = continuumPoints(definition);
  ribbon(infrastructure, `LIVEWORK__${prefix}__CONTINUUM_WALK`, points, 1.9, kind === 'residential' ? m.palePaving : m.darkPaving, districtId);
  for (let line = -1; line <= 1; line += 1) {
    const offsetPoints = points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); return point.clone().addScaledVector(normal, line * 0.36).setY(FLOOR_Y + 0.018); });
    const residentialContinuumLights = [m.neonCyan, m.neonMagenta, m.neonViolet] as const;
    pulse(ribbon(infrastructure, `LIVEWORK__${prefix}__WALKING_TIME_LINE_${line + 2}`, offsetPoints, 0.045, (kind === 'residential' ? residentialContinuumLights[line + 1] : m.goldLight).clone(), districtId), 0.0028 + line * 0.0002, line * 0.7, 0.25, 1.7);
  }
  const coverNames = kind === 'residential'
    ? ['PLANTED_PERGOLAS', 'STONE_COLONNADES', 'TIMBER_AND_GLASS_CANOPIES']
    : ['ENCLOSED_HOTEL_BRIDGES', 'PHOTOVOLTAIC_LABORATORY_ROOFS', 'DARK_METAL_MALL_ARCADES'];
  const coverMaterials = kind === 'residential' ? [m.timber, m.limestone, m.clearGlass] : [m.opalineGlass, m.pvGlass, m.blackSteel];
  for (let cover = 0; cover < 3; cover += 1) {
    const startIndex = cover * 40 + (cover === 0 ? 2 : 0);
    const endIndex = Math.min(points.length - 1 - (cover === 2 ? 2 : 0), (cover + 1) * 40);
    const start = points[startIndex].clone().setY(0.48); const end = points[endIndex].clone().setY(0.48);
    slabBetween(infrastructure, `LIVEWORK__${prefix}__CONTINUUM_COVER_${cover + 1}__${coverNames[cover]}`, start, end, 1.95, 0.08, coverMaterials[cover], districtId);
    for (let support = 0; support <= 8; support += 1) { const p = start.clone().lerp(end, support / 8); const tangent = end.clone().sub(start).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); for (const side of [-1, 1]) { const base = p.clone().addScaledVector(normal, side * 0.86); pipe(infrastructure, `LIVEWORK__${prefix}__${coverNames[cover]}_SUPPORT_${support + 1}_${side < 0 ? 'L' : 'R'}`, base.clone().setY(FLOOR_Y), base.clone().setY(0.48), kind === 'residential' ? 0.055 : 0.045, coverMaterials[cover], districtId, true); } }
  }
  return points;
}

function addResidentialCyberpunkPublicRealm(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const districtId = definition.id;
  const realm = new THREE.Group();
  realm.name = 'LIVEWORK__RESIDENTIAL__CYBERPUNK_NEON_PUBLIC_REALM';
  district.add(realm);
  const accents = [m.neonCyan, m.neonMagenta, m.neonViolet] as const;
  const bands = [
    { name: 'OUTER_CRESCENT', count: 18, radial: (index: number) => 0.985 - Math.sin(index * 0.73) * 0.012, angular: (index: number) => 0.06 + index * 0.88 / 17 },
    { name: 'SOUTHERN_EDGE', count: 14, radial: (index: number) => 0.06 + index * 0.88 / 13, angular: (index: number) => 0.022 + (index % 3) * 0.012 },
    { name: 'CONTINUUM_EDGE', count: 14, radial: (index: number) => 0.022 + (index % 3) * 0.012, angular: (index: number) => 0.08 + index * 0.84 / 13 },
  ] as const;
  bands.forEach((band, bandIndex) => {
    for (let marker = 0; marker < band.count; marker += 1) {
      const point = pointInDistrict(definition, band.radial(marker), band.angular(marker), FLOOR_Y + 0.03);
      box(realm, `LIVEWORK__RESIDENTIAL__${band.name}_NEON_GROUND_MARKER_${marker + 1}`, [0.38 + (marker % 3) * 0.12, 0.045, 0.075], accents[(marker + bandIndex) % accents.length], [point.x, point.y, point.z], districtId, false, [0, -definition.sector!.centerAngle + (marker % 2 ? 0.16 : -0.11), 0]);
    }
  });
  for (let marker = 0; marker < 24; marker += 1) {
    const column = marker % 8;
    const row = Math.floor(marker / 8);
    const point = pointInDistrict(definition, 0.08 + column * 0.125 + Math.sin(marker * 1.3) * 0.012, 0.9 + row * 0.038 + (column % 2 ? 0.012 : -0.008), FLOOR_Y + 0.03);
    box(realm, `LIVEWORK__RESIDENTIAL__GREEN_POCKET_NEON_GROUND_MARKER_${marker + 1}`, [0.5 + (marker % 3) * 0.12, 0.045, 0.075], accents[(marker + 1) % accents.length], [point.x, point.y, point.z], districtId, false, [0, -definition.sector!.centerAngle + (marker % 2 ? 0.12 : -0.15), 0]);
  }
  for (let pylon = 0; pylon < 10; pylon += 1) {
    const point = pointInDistrict(definition, 0.08 + pylon * 0.84 / 9, 0.49 + Math.sin(pylon * 1.8) * 0.025, FLOOR_Y);
    box(realm, `LIVEWORK__RESIDENTIAL__HOLOGRAPHIC_WAYFINDING_PYLON_${pylon + 1}`, [0.09, 1.6 + (pylon % 3) * 0.28, 0.12], accents[pylon % accents.length], [point.x, 0.82 + (pylon % 3) * 0.14, point.z], districtId);
    box(realm, `LIVEWORK__RESIDENTIAL__HOLOGRAPHIC_WAYFINDING_PANEL_${pylon + 1}`, [0.68, 0.52, 0.055], m.holographicGlass, [point.x, 1.18 + (pylon % 3) * 0.18, point.z], districtId, false, [0, -definition.sector!.centerAngle, 0]);
  }
  for (let pylon = 0; pylon < 8; pylon += 1) {
    const point = pointInDistrict(definition, 0.12 + pylon * 0.84 / 7, 0.925 + Math.sin(pylon * 1.7) * 0.022, FLOOR_Y);
    box(realm, `LIVEWORK__RESIDENTIAL__GREEN_POCKET_WAYFINDING_PYLON_${pylon + 1}`, [0.1, 1.85 + (pylon % 3) * 0.3, 0.13], accents[(pylon + 1) % accents.length], [point.x, 0.95 + (pylon % 3) * 0.15, point.z], districtId);
    box(realm, `LIVEWORK__RESIDENTIAL__GREEN_POCKET_WAYFINDING_PANEL_${pylon + 1}`, [0.78, 0.58, 0.055], m.holographicGlass, [point.x, 1.34 + (pylon % 3) * 0.18, point.z], districtId, false, [0, -definition.sector!.centerAngle, 0]);
  }
  realm.userData.cyberpunkPublicRealm = true;
  realm.userData.expansionBands = ['outer crescent', 'southern perimeter', 'inner Continuum edge', 'green-highlighted northwestern Residential pocket'];
  realm.userData.neonPalette = ['cyan', 'magenta', 'violet'];
  return realm;
}

function addPark(parent: THREE.Object3D, definition: DistrictDefinition, name: string, radialT: number, angularT: number, width: number, depth: number, m: Materials, options: { red?: boolean; water?: boolean; canopy?: boolean; formal?: boolean } = {}) {
  const districtId = definition.id; const park = new THREE.Group(); park.name = `LIVEWORK__PARK__${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`; park.position.copy(pointInDistrict(definition, radialT, angularT, FLOOR_Y)); parent.add(park);
  box(park, `${park.name}__GROUND`, [width, 0.07, depth], options.red ? m.darkPaving : options.formal ? m.palePaving : m.darkGrass, [0, 0.02, 0], districtId);
  if (options.water) for (let channel = 0; channel < 3; channel += 1) box(park, `${park.name}__RAIN_CHANNEL_${channel + 1}`, [width * 0.78, 0.025, 0.12], m.water, [0, 0.065, -depth * 0.25 + channel * depth * 0.25], districtId);
  for (let tree = 0; tree < 7; tree += 1) addTree(park, `${park.name}__TREE_${tree + 1}`, -width * 0.36 + (tree % 4) * width * 0.24, -depth * 0.26 + Math.floor(tree / 4) * depth * 0.52, districtId, m, options.red, 0.68 + (tree % 3) * 0.12);
  if (options.canopy) { box(park, `${park.name}__WEATHER_CANOPY`, [width * 0.82, 0.08, 1.25], m.clearGlass, [0, 0.4, depth * 0.32], districtId); for (let post = 0; post < 6; post += 1) cylinder(park, `${park.name}__CANOPY_POST_${post + 1}`, 0.09, 0.7, m.bronze, [-width * 0.36 + post * width * 0.144, 0.35, depth * 0.32], districtId, true, 8); }
  park.userData.featureRole = 'garden'; park.userData.semanticName = name; park.userData.districtId = districtId; return park;
}

function addSharedLandscape(district: THREE.Group, definition: DistrictDefinition, kind: DistrictKind, m: Materials) {
  const landscape = new THREE.Group(); landscape.name = `LIVEWORK__${kind === 'residential' ? 'RESIDENTIAL' : 'EVER_HOUR'}__PUBLIC_LANDSCAPES`; district.add(landscape);
  if (kind === 'residential') {
    addPark(landscape, definition, 'Long Horizon Park', 0.52, 0.50, 11.5, 8.5, m, { water: true, canopy: true });
    addPark(landscape, definition, 'Rootline Park', 0.94, 0.22, 10, 7.5, m, { water: true });
    addPark(landscape, definition, 'Family Orbit Garden', 0.78, 0.50, 9.5, 7.2, m, { water: true, canopy: true });
    addPark(landscape, definition, 'The 03:17 Garden', 0.23, 0.50, 7.2, 5.4, m, { canopy: true });
    addPark(landscape, definition, 'Pool Commons Residential Garden', 0.61, 0.26, 8.2, 5.8, m, { water: true, canopy: true });
  } else {
    addPark(landscape, definition, 'Rain Court', 0.91, 0.50, 7.5, 5.2, m, { water: true, canopy: true, formal: true });
    const chrono = addPark(landscape, definition, 'Chronogarden', 0.71, 0.50, 10.5, 8.0, m, { water: true, formal: true });
    cylinder(chrono, 'LIVEWORK__CHRONOGARDEN__SOLAR_TIME_BLADE', 0.28, 4.5, m.champagne, [0, 2.25, 0], definition.id, true, 8, [0, 0, -0.18]); for (let flower = 0; flower < 8; flower += 1) rotate(box(chrono, `LIVEWORK__CHRONOGARDEN__KINETIC_SHADE_FLOWER_${flower + 1}`, [1.45, 0.08, 0.52], m.titanium, [Math.cos(flower * Math.PI / 4) * 3.2, 1.1, Math.sin(flower * Math.PI / 4) * 2.4], definition.id, false, [0.2, -flower * Math.PI / 4, 0]), 0.001 + flower * 0.00004);
    addPark(landscape, definition, 'Redshift Grove', 0.46, 0.035, 10.2, 5.4, m, { red: true });
    addPark(landscape, definition, 'Pool Commons Guest Garden', 0.62, 0.50, 9.0, 6.0, m, { water: true, canopy: true });
    addPark(landscape, definition, 'Bench Garden', 0.24, 0.50, 10.0, 4.6, m, { water: true, canopy: true, formal: true });
  }
  const conditions = kind === 'residential'
    ? ['MOSS_BRIDGE_GARDEN', 'DRY_MINERAL_GARDEN', 'NIGHT_FLOWERING_GARDEN']
    : ['FERN_POOL_COURT', 'AROMATIC_RESTAURANT_GARDEN', 'ROBOTICS_WIND_GARDEN'];
  conditions.forEach((condition, index) => {
    const p = pointInDistrict(definition, 0.16 + index * 0.34, index % 2 ? 0.58 : 0.42); const garden = new THREE.Group(); garden.name = `LIVEWORK__PASSAGE_GARDEN__${condition}`; garden.position.copy(p); landscape.add(garden); box(garden, `${garden.name}__GROUND`, [3.2, 0.06, 2.1], index === 1 ? m.limestone : m.darkGrass, [0, 0.03, 0], definition.id); for (let plant = 0; plant < 9; plant += 1) box(garden, `${garden.name}__PLANT_${plant + 1}`, [0.08, 0.28 + (plant % 3) * 0.12, 0.08], index === 1 ? m.copper : index === 2 && kind === 'ever-hour' ? m.titanium : m.grass, [-1.2 + (plant % 5) * 0.6, 0.16 + (plant % 3) * 0.06, -0.55 + Math.floor(plant / 5) * 1.1], definition.id);
  });
  return landscape;
}

function addServiceRoutes(infrastructure: THREE.Group, definition: DistrictDefinition, kind: DistrictKind, m: Materials) {
  const districtId = definition.id; const namePrefix = kind === 'residential' ? 'RESIDENTIAL' : 'EVER_HOUR';
  const south = Array.from({ length: 81 }, (_, index) => pointInDistrict(definition, index / 80, 0.035, FLOOR_Y));
  ribbon(infrastructure, `LIVEWORK__${namePrefix}__CONTROLLED_SOUTHERN_SERVICE_LANE`, south, kind === 'residential' ? 1.45 : 1.8, m.darkPaving, districtId);
  for (let screen = 0; screen < 20; screen += 1) { const p = south[screen * 4]; cylinder(infrastructure, `LIVEWORK__${namePrefix}__SERVICE_SCREEN_${screen + 1}`, 0.1, 1.1, kind === 'residential' ? m.timber : m.blackSteel, [p.x, 0.55, p.z], districtId, true, 8); }
  if (kind === 'ever-hour') {
    const east = Array.from({ length: 61 }, (_, index) => pointInDistrict(definition, 0.08, 0.05 + index / 60 * 0.9, FLOOR_Y)); ribbon(infrastructure, 'LIVEWORK__EVER_HOUR__EASTERN_LABORATORY_SERVICE_LANE', east, 1.7, m.darkPaving, districtId);
    for (let dock = 0; dock < 12; dock += 1) pulse(box(infrastructure, `LIVEWORK__EVER_HOUR__CONTROLLED_SERVICE_DOCK_${dock + 1}`, [0.52, 0.08, 0.72], [m.cyan, m.green, m.amber][dock % 3].clone(), [east[dock * 5].x, FLOOR_Y + 0.04, east[dock * 5].z], districtId), 0.005, dock * 0.4);
  }
}

function addApproaches(infrastructure: THREE.Group, facilities: readonly THREE.Group[], program: readonly LiveWorkBuildingProgram[], networkPoints: readonly THREE.Vector3[], definition: DistrictDefinition, m: Materials) {
  const sector = definition.sector!;
  const radial = new THREE.Vector3(Math.cos(sector.centerAngle), 0, Math.sin(sector.centerAngle));
  const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
  facilities.forEach((facility, index) => {
    const record = program[index];
    const depth = record.code === 'H23' ? record.footprintMetres[1] / 20 * 0.98 : Math.min(5.6, record.footprintMetres[1] / 20 + 0.5);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(facility.quaternion).setY(0).normalize();
    const entrance = forward.clone().multiplyScalar(depth).add(facility.position).setY(FLOOR_Y + 0.012);
    const apron = entrance.clone().addScaledVector(forward, 0.68);
    const routePoint = nearestPoint(networkPoints, apron).clone().setY(FLOOR_Y + 0.012);
    const delta = routePoint.clone().sub(apron);
    const radialDistance = delta.dot(radial); const tangentDistance = delta.dot(tangent);
    const travelTangentFirst = Math.abs(tangentDistance) > Math.abs(radialDistance);
    const bend = travelTangentFirst
      ? apron.clone().addScaledVector(tangent, tangentDistance)
      : apron.clone().addScaledVector(radial, radialDistance);
    const rawPoints = routePoint.distanceToSquared(bend) < 0.02 || bend.distanceToSquared(apron) < 0.02
      ? [routePoint, apron, entrance]
      : [routePoint, bend, apron, entrance];
    const points = chamferPolyline(rawPoints, 0.24).map((point) => point.setY(FLOOR_Y + 0.012));
    const approach = ribbon(infrastructure, `LIVEWORK__${definition.id === 'scientist-residential' ? 'RESIDENTIAL' : 'EVER_HOUR'}__BUILDING_APPROACH_${record.code}`, points, definition.id === 'scientist-residential' ? 0.44 : 0.52, definition.id === 'scientist-residential' ? m.residentialLane : m.everHourLane, definition.id);
    approach.userData.routeStyle = 'short-cornered-building-approach';
    approach.userData.turnCount = Math.max(1, rawPoints.length - 2);
    approach.userData.routeLength = points.slice(1).reduce((length, point, pointIndex) => length + point.distanceTo(points[pointIndex]), 0);
    approach.userData.directDistance = routePoint.distanceTo(entrance);
    approach.userData.routePointCount = points.length;
    approach.userData.servesBuildingCode = record.code;
  });
}

function buildDistrict(district: THREE.Group, definition: DistrictDefinition, kind: DistrictKind) {
  if (!definition.sector) throw new Error(`${definition.name} requires a masterplan sector`);
  const m = createMaterials(kind); const program = kind === 'residential' ? RESIDENTIAL_SCIENTISTS_BUILDING_PROGRAM : EVER_HOUR_BUILDING_PROGRAM; const infrastructure = new THREE.Group(); infrastructure.name = `LIVEWORK__${kind === 'residential' ? 'RESIDENTIAL' : 'EVER_HOUR'}__INTEGRATED_INFRASTRUCTURE`; district.add(infrastructure);
  const continuum = addContinuumWalk(infrastructure, definition, kind, m); const laneNetwork = addOrganicLaneNetwork(infrastructure, definition, kind, continuum, m); addServiceRoutes(infrastructure, definition, kind, m); const landscape = addSharedLandscape(district, definition, kind, m); if (kind === 'residential') addResidentialCyberpunkPublicRealm(district, definition, m);
  const facilities = program.map((record) => {
    const placement = organicPlacement(record, kind);
    const building = kind === 'residential' ? createResidentialFacility(record, m) : createEverHourFacility(record, m); building.position.copy(pointInDistrict(definition, placement.radialT, placement.angularT, FLOOR_Y + 0.02));
    const worldPosition = building.position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z) + placement.rotationOffset;
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: placement.radialT, normalizedAngular: placement.angularT, ring: 'outer' };
    building.userData.organicPlacement = { deterministic: true, radialJitter: placement.radialT - record.radialT, angularJitter: placement.angularT - record.angularT, rotationOffset: placement.rotationOffset };
    district.add(building); return building;
  });
  addApproaches(infrastructure, facilities, program, laneNetwork.networkPoints, definition, m);
  const shared = {
    pairedMasterplan: 'Residential Scientists District + Ever Hour / Guest Scientists District integrated exterior masterplan',
    continuumDirection: 'planted residences -> community facilities -> hotels -> conference buildings -> bookable laboratories -> Robotics Labs',
    circulation: { primaryRoute: `LIVEWORK__${kind === 'residential' ? 'RESIDENTIAL' : 'EVER_HOUR'}__CONTINUUM_WALK`, hierarchy: kind === 'residential' ? 'Continuum Walk -> meandering neighborhood spines -> green-pocket weave and corner courts -> short dogleg entrance branches' : 'Continuum Walk -> meandering neighborhood spines -> alternating cornered crosswalks -> short dogleg entrance branches', neighborhoodLaneCount: laneNetwork.laneNames.length, neighborhoodLanes: laneNetwork.laneNames, coveredSequenceCount: 3, exactBuildingApproaches: facilities.length, southernServiceLane: true, publicServiceSeparation: true },
    lightGradient: 'active north -> warm central pedestrian light -> shielded red and low amber south toward Astronomy',
    noiseGradient: 'quiet west and outer housing -> community -> hotels -> dining and retail -> bookable laboratories -> Robotics',
    exteriorOnly: true,
  };
  const metadata = {
    ...shared,
    identity: kind === 'residential' ? 'Residential District for Scientists' : 'Ever Hour / Guest Scientists District',
    districtCharacter: kind === 'residential' ? 'organic, permanent, densely inhabited cyberpunk neighborhood with cyan, magenta, and violet neon layered over dark ecological gardens' : 'dense, public, continuously operating, and visibly awake',
    architecturalStyle: kind === 'residential' ? 'super-futuristic cyberpunk neon scientist housing, retaining the original diverse domestic and civic silhouettes' : 'all-hour scientific hospitality',
    expansionBands: kind === 'residential' ? { outerCrescent: ['R21', 'R22', 'R23'], southernPerimeter: ['R24', 'R25'], innerContinuumEdge: ['R26', 'R27'], greenHighlightedNorthwesternPocket: ['R28', 'R29', 'R30', 'R31', 'R32', 'R33', 'R34', 'R35', 'R36'] } : undefined,
    greenHighlightedResidentialPocket: kind === 'residential' ? { occupied: true, insideCanonicalResidentialSector: true, environmentalSciencePerimeterVacated: true, normalizedRadialRange: [0.08, 0.99], normalizedAngularRange: [0.93, 0.995], localRouteCount: 4, housingCodes: ['R28', 'R29', 'R30', 'R31', 'R32', 'R33', 'R34', 'R35', 'R36'] } : undefined,
    buildingCount: facilities.length,
    buildings: program.map((record) => ({ code: record.code, name: record.name, form: record.form, purpose: record.purpose, exteriorMotif: record.exteriorMotif, placementZone: record.zone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, lighting: record.lighting })),
    parks: kind === 'residential' ? ['Long Horizon Park', 'Rootline Park', 'Family Orbit Garden', 'The 03:17 Garden', 'Pool Commons'] : ['Rain Court', 'Chronogarden', 'Redshift Grove', 'Pool Commons', 'Bench Garden'],
    coveredWalkTypes: kind === 'residential' ? ['planted pergolas', 'stone colonnades', 'timber-and-glass canopies'] : ['enclosed hotel bridges', 'translucent photovoltaic laboratory roofs', 'dark metal mall arcades'],
    operatingRule: kind === 'residential' ? 'the entire western district glows as an inhabited cyberpunk neighborhood without becoming a rectilinear grid' : 'eastern district looks awake',
  };
  if (kind === 'residential') district.userData.residentialScientistsDistrict = metadata;
  else district.userData.everHourDistrict = metadata;
  district.userData.population = {
    plannedFacilities: program.map((record) => record.name),
    plannedObjects: [...metadata.parks, 'Continuum Walk', 'covered public landscapes', 'separated service lanes', 'Passage Gardens', ...(kind === 'residential' ? ['cyberpunk neon public realm', 'three inner expansion promenades', 'green-pocket residential weave', 'three green-pocket corner courts'] : [])],
    realizedFeatureTags: program.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: facilities.length + laneNetwork.laneNames.length + (kind === 'ever-hour' ? 3 : 2),
    radialCoverage: 0.94,
    angularCoverage: 0.93,
    liveWorkVisitIntegrated: true,
    exteriorOnly: true,
  };
}

export function buildResidentialScientistsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  buildDistrict(district, definition, 'residential');
}

export function buildEverHourDistrict(district: THREE.Group, definition: DistrictDefinition) {
  buildDistrict(district, definition, 'ever-hour');
}
