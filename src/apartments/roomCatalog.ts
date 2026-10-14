export type RoomMotif = 'collegiate' | 'art-deco' | 'botanical' | 'celestial' | 'industrial' | 'gothic' | 'japonisme' | 'nautical' | 'aero' | 'baroque' | 'modernist' | 'antiquarian';

export interface RoomDefinition {
  id: string;
  number: number;
  name: string;
  description: string;
  style: string;
  palette: { wall: string; wood: string; upholstery: string; accent: string; metal: string };
  motif: RoomMotif;
  layout: number;
  seed: number;
  kind?: 'community' | 'city';
}

export interface RoomDisplayMetadata { name: string; description: string }
type StyleRow = readonly [style: string, motif: RoomMotif, wall: string, wood: string, upholstery: string, accent: string, metal: string];

// Each record has an explicit aesthetic and palette. Numbers, names and seeds
// stay stable when descriptions or names are edited on this device.
const STYLE_ROWS: readonly StyleRow[] = [
  ['Frutiger Aero', 'aero', '#456e72', '#8e7756', '#4ea8b3', '#95d6a0', '#c3d9d9'],
  ['Art Deco', 'art-deco', '#2c3546', '#503829', '#317478', '#d5b969', '#b49a52'],
  ['Art Nouveau', 'botanical', '#455440', '#60462d', '#667547', '#d4b785', '#a9925b'],
  ['Bauhaus', 'modernist', '#4a4843', '#6f5540', '#384b63', '#ce674d', '#a4a7a2'],
  ['Brutalism', 'modernist', '#555753', '#4c4034', '#4a504b', '#c08050', '#555e61'],
  ['Japandi', 'japonisme', '#666859', '#8b795c', '#73806a', '#c5b888', '#5e6156'],
  ['Wabi-Sabi', 'japonisme', '#5d6258', '#75664f', '#8b8a76', '#b49d7e', '#696357'],
  ['Mid-century Modern', 'modernist', '#5c6153', '#93613e', '#a46b32', '#779779', '#ad945b'],
  ['Space Age', 'celestial', '#344554', '#6c5542', '#557582', '#d8a468', '#b7c5c8'],
  ['Gothic Revival', 'gothic', '#353b3a', '#403124', '#622d3d', '#b1a27a', '#787565'],
  ['Victorian', 'antiquarian', '#424a35', '#5b362c', '#77403b', '#b8a277', '#ac8a53'],
  ['Edwardian', 'collegiate', '#5b6457', '#796144', '#536e62', '#d2c59e', '#aa926b'],
  ['Georgian', 'collegiate', '#52635d', '#694538', '#395866', '#ccb888', '#b29b63'],
  ['Regency', 'baroque', '#3f5148', '#633a2e', '#85703e', '#dac684', '#c1a356'],
  ['Baroque', 'baroque', '#4d3842', '#4c3028', '#76353e', '#d0ab65', '#b88b3e'],
  ['Rococo', 'baroque', '#59615b', '#8c745a', '#817282', '#d5c89e', '#c3ae6d'],
  ['Neoclassicism', 'collegiate', '#62665e', '#654e3b', '#3e555d', '#c7c4ad', '#a9956b'],
  ['Renaissance', 'antiquarian', '#4c4e39', '#68462c', '#693e37', '#b9a36a', '#968257'],
  ['Romanesque', 'gothic', '#5b584b', '#66523b', '#6a5641', '#c6b78e', '#716e59'],
  ['Byzantine', 'baroque', '#3d3f51', '#49372d', '#5c3155', '#c6aa52', '#b5a052'],
  ['Arts and Crafts', 'botanical', '#4e6042', '#855e39', '#657749', '#c3aa74', '#8f825b'],
  ['American Craftsman', 'collegiate', '#505d48', '#80532e', '#796544', '#c6b082', '#867451'],
  ['Prairie School', 'modernist', '#605e49', '#80613c', '#7b724a', '#cda864', '#958158'],
  ['Shaker', 'collegiate', '#61685a', '#97754d', '#556855', '#cbbb94', '#6f736a'],
  ['Scandinavian', 'modernist', '#596b67', '#a18a62', '#657e84', '#c7d0b9', '#a8b2aa'],
  ['Nordic National Romanticism', 'gothic', '#444e48', '#795638', '#555c73', '#b3ba9c', '#838781'],
  ['Swiss Modernism', 'modernist', '#555b5a', '#765f45', '#5a6170', '#c9574c', '#adb4b5'],
  ['De Stijl', 'modernist', '#454a47', '#796248', '#334e73', '#cbb250', '#a8aca4'],
  ['Constructivism', 'industrial', '#484b48', '#655040', '#663d3b', '#c77953', '#878d8a'],
  ['Suprematism', 'modernist', '#5b615a', '#796d52', '#404653', '#bb7057', '#b9b9a7'],
  ['Memphis', 'art-deco', '#4f4d66', '#795b43', '#835871', '#d9b86a', '#a5b3b8'],
  ['Postmodernism', 'modernist', '#615451', '#805944', '#597275', '#c99370', '#bba47e'],
  ['Deconstructivism', 'industrial', '#454d55', '#635246', '#425d62', '#cf9759', '#96a5ad'],
  ['Organic Modernism', 'botanical', '#5b6558', '#967552', '#7a805e', '#c6b289', '#9a9177'],
  ['Streamline Moderne', 'art-deco', '#465d62', '#6e4c3a', '#4d777d', '#c6b585', '#b4c2bd'],
  ['Steampunk', 'industrial', '#434d3b', '#604227', '#664936', '#ba9453', '#aa753d'],
  ['Dieselpunk', 'industrial', '#424b46', '#574535', '#46584f', '#b89964', '#74847e'],
  ['Atompunk', 'celestial', '#43515c', '#755136', '#537c7c', '#e0b667', '#c2b994'],
  ['Clockpunk', 'antiquarian', '#514d3c', '#694630', '#735943', '#c4a16c', '#a4894c'],
  ['Cyberpunk', 'industrial', '#263e49', '#473937', '#3e496a', '#64bac4', '#839da3'],
  ['Solarpunk', 'botanical', '#425e43', '#957747', '#6a894f', '#d1cc77', '#b5a367'],
  ['Biopunk', 'botanical', '#344d45', '#61523b', '#48694e', '#94b784', '#7f9a8a'],
  ['Cassette Futurism', 'industrial', '#4f5547', '#715039', '#646a50', '#c9ad75', '#a8a68b'],
  ['Raygun Gothic', 'celestial', '#394b58', '#67503a', '#4d7182', '#d6bd7d', '#bbbec3'],
  ['Vaporwave', 'aero', '#4a4c6a', '#77634e', '#91667f', '#83c2c8', '#b9afd0'],
  ['Synthwave', 'celestial', '#363b59', '#584337', '#684d78', '#d798a1', '#a4a5bd'],
  ['Y2K', 'aero', '#46596b', '#78694f', '#5e89a0', '#a5c89d', '#bfc9d8'],
  ['Frutiger Metro', 'aero', '#43584a', '#816447', '#51837b', '#bcd477', '#aabeb1'],
  ['Op Art', 'modernist', '#424b49', '#736247', '#394f54', '#d0c6a1', '#a9b5b4'],
  ['Cubism', 'modernist', '#5a554b', '#866343', '#75624c', '#c49a62', '#9d9479'],
  ['Surrealism', 'antiquarian', '#4f4b57', '#654839', '#5f6178', '#d2b875', '#b4a576'],
  ['Abstract Expressionism', 'modernist', '#565d55', '#805d43', '#6a4c4b', '#d49b6d', '#a1a898'],
  ['Eclectic Maximalism', 'antiquarian', '#474554', '#684933', '#815060', '#c5aa65', '#aa8851'],
  ['Contemporary Classic', 'collegiate', '#596761', '#705d47', '#4d6670', '#c4bd9f', '#a89d7d'],
  ['Neo-Parisian', 'baroque', '#555e61', '#79523e', '#49646a', '#d4c3a0', '#b8a175'],
  ['English Country', 'botanical', '#586346', '#765331', '#6b7448', '#cbb787', '#9a8856'],
  ['French Country', 'baroque', '#6a6c5d', '#927656', '#7b8064', '#d3c6a3', '#a79b77'],
  ['Tuscan', 'antiquarian', '#645c43', '#895b35', '#805944', '#d1a673', '#8f7b52'],
  ['Provençal', 'botanical', '#646761', '#8c7659', '#747387', '#c6c1a0', '#a59d83'],
  ['Mediterranean', 'nautical', '#586864', '#927347', '#4f7783', '#d3caa5', '#a29669'],
  ['Spanish Colonial', 'antiquarian', '#635949', '#704630', '#794b39', '#c8b383', '#7d715b'],
  ['Andalusian', 'baroque', '#4a6261', '#765136', '#457e78', '#d2bf87', '#b09a5d'],
  ['Moorish', 'gothic', '#454f5c', '#694b32', '#4f5b7a', '#cab173', '#a08a51'],
  ['Moroccan', 'baroque', '#5f4c43', '#865936', '#a46e43', '#c9af73', '#ad8c50'],
  ['Ottoman', 'baroque', '#434d4c', '#634127', '#763b43', '#c6b277', '#ab934f'],
  ['Persian', 'antiquarian', '#40515d', '#745239', '#4a6480', '#c7b786', '#ac9868'],
  ['Mughal', 'baroque', '#546452', '#795f41', '#5e7659', '#d5c98a', '#baa064'],
  ['Indo-Saracenic', 'gothic', '#5e514c', '#774830', '#704957', '#d2b48b', '#a3875d'],
  ['Chinoiserie', 'baroque', '#3e5450', '#4c362a', '#4c7370', '#cdbb7e', '#b7a164'],
  ['Japonisme', 'japonisme', '#53634f', '#766347', '#60715b', '#c6b778', '#9d916b'],
  ['Zen', 'japonisme', '#62665b', '#8b7e5e', '#747867', '#c4c4a2', '#787e70'],
  ['Tibetan', 'antiquarian', '#514a43', '#784e31', '#884b3e', '#cba75d', '#ae8c48'],
  ['Balinese', 'botanical', '#4b5e46', '#72502c', '#748351', '#c7b57b', '#927e50'],
  ['Burmese Teak', 'japonisme', '#4e5946', '#845831', '#6c7152', '#cdb181', '#aa925e'],
  ['Indochine', 'botanical', '#48584c', '#4d3829', '#7d7c4c', '#d2c082', '#a58d56'],
  ['Alpine Chalet', 'collegiate', '#565b4c', '#936437', '#66443a', '#c6b18a', '#8e8270'],
  ['Scottish Baronial', 'gothic', '#4c5650', '#674630', '#4b6052', '#c1b38b', '#92917b'],
  ['Tudor', 'collegiate', '#535b43', '#573a29', '#795844', '#c7b988', '#8f8165'],
  ['Elizabethan', 'antiquarian', '#514a42', '#62402c', '#5b465e', '#cab483', '#9f864f'],
  ['Jacobean', 'antiquarian', '#484e42', '#493124', '#6a4240', '#bda46b', '#968252'],
  ['Queen Anne', 'baroque', '#536351', '#785039', '#587069', '#d0bd91', '#ae9867'],
  ['Federal', 'collegiate', '#4e6267', '#734936', '#4c5f79', '#cfbd91', '#b7a16e'],
  ['Colonial Revival', 'collegiate', '#5b6354', '#815938', '#506965', '#d4c598', '#a29570'],
  ['Venetian Gothic', 'gothic', '#484956', '#66452e', '#784855', '#c6b38a', '#9f925e'],
  ['Italian Rationalism', 'modernist', '#5b635e', '#78624a', '#536867', '#c7bfa7', '#a6ada4'],
  ['Desert Modernism', 'modernist', '#6c624e', '#957148', '#a47e52', '#cdb990', '#a09477'],
  ['Southwestern', 'antiquarian', '#6d594b', '#8c5f39', '#8b543d', '#cab282', '#ad9369'],
  ['Coastal New England', 'nautical', '#526570', '#87704e', '#4b6879', '#c5ccba', '#a5b1a8'],
  ['Nautical', 'nautical', '#344d5a', '#795132', '#405d6d', '#d4bb83', '#b4995b'],
  ['Ocean Liner', 'nautical', '#465a5b', '#71472e', '#467978', '#d1bf8b', '#b3ad89'],
  ['Industrial', 'industrial', '#464d4d', '#75503a', '#596052', '#b99a6b', '#7c8584'],
  ['Rustic', 'collegiate', '#575d46', '#8c623b', '#72634a', '#c6ab79', '#8b8166'],
  ['Bohemian', 'antiquarian', '#5b494d', '#815339', '#906252', '#d0ae76', '#aa8955'],
  ['Biophilic', 'botanical', '#425c42', '#8c7045', '#65905a', '#becd92', '#9da275'],
  ['Botanical Conservatory', 'botanical', '#3f5b50', '#856342', '#558171', '#c3c396', '#a2ac8c'],
  ['Monastic Minimalism', 'gothic', '#62635c', '#837459', '#78796c', '#c3bca0', '#898d80'],
  ['Wunderkammer', 'antiquarian', '#434c3e', '#573b29', '#78553f', '#bdac76', '#a28e55'],
  ['Astronomical Observatory', 'celestial', '#303f55', '#655038', '#475674', '#c7b27c', '#a99f7b'],
  ['Alchemical', 'antiquarian', '#40504c', '#654632', '#5c6b5b', '#b7ac71', '#9d8647'],
  ['Digital Minimalism', 'aero', '#40555d', '#7c715b', '#5e7982', '#b4d0c1', '#b3c5c7'],
];

export const ROOM_CATALOG: readonly RoomDefinition[] = [
  { id: 'liminette-student-room', number: 0, name: 'Liminette Student Room', description: 'A spacious retreat of walnut, aged brass and deep green. Tall windows overlook the college gardens, Gothic rooftops and the distant city beneath an extraordinary sky.', style: 'Retro-futurism', palette: { wall: '#394b3f', wood: '#715137', upholstery: '#193c31', accent: '#b7a46d', metal: '#ba9251' }, motif: 'collegiate', layout: 0, seed: 8271 },
  { id: 'lux-umbrarum-community-room', number: -1, kind: 'community', name: 'Lux Umbrarum Community Room', description: 'A shared lounge in warm ivory, honey oak and champagne brass. Settle into the sunken conversation pit, browse the library, or listen to records beside a circular window overlooking the lake and collegiate skyline.', style: 'Ivory celestial lounge', palette: { wall: '#d3c4a7', wood: '#ad8856', upholstery: '#e2d8c2', accent: '#dbc395', metal: '#c7a566' }, motif: 'celestial', layout: 0, seed: 62026 },
  { id: 'lux-umbrarum-pool-commons', number: -2, kind: 'community', name: 'Lux Umbrarum Pool Commons', description: 'A spacious sunlit pool hall with arched garden windows, ivory tiles and pearl-and-platinum loungers facing the water from every side. Swim in the aquamarine basin or climb the brass diving board and jump in with a splash. Long pearl pod seats hang from metallic double-helix suspensions beside antique books and a grand brass clock.', style: 'Classical brass pool hall', palette: { wall: '#d8cbb2', wood: '#987444', upholstery: '#e2ddcc', accent: '#81bcc4', metal: '#b28b45' }, motif: 'antiquarian', layout: 0, seed: 41026 },
  { id: 'os-city-apartment', number: -3, kind: 'city', name: '0.8.0', description: 'A quiet white apartment above North City: an 8.55 m square bed with six oversized cotton pillows, full-wall city glazing, a left-wall holographic TV, flowing spectral figures, a floating acrylic chair, a luminous white circular rug, cyan displays and a bathroom traced in pink and blue light.', style: 'Soft future', palette: { wall: '#e0e5eb', wood: '#cbbda9', upholstery: '#eeeef1', accent: '#9eeaf8', metal: '#b2c1cf' }, motif: 'aero', layout: 0, seed: 86723 },
  ...STYLE_ROWS.map(([style, motif, wall, wood, upholstery, accent, metal], index): RoomDefinition => {
    const number = index + 1;
    const suffix = String(number).padStart(3, '0');
    return { id: `room-${suffix}`, number, name: `Room ${suffix}`, description: `An unassigned room combining ${style} with Dark Academia. A place for reading, study and everyday life, with the shared outlook over the Academic District.`, style, palette: { wall, wood, upholstery, accent, metal }, motif, layout: index % 12, seed: 104729 + number * 7919 };
  }),
];

export const ROOM_MOTIF_LABELS: Record<RoomMotif, string> = { collegiate: 'Collegiate', 'art-deco': 'Art Deco', botanical: 'Botanical', celestial: 'Celestial', industrial: 'Industrial', gothic: 'Gothic', japonisme: 'Japonisme', nautical: 'Nautical', aero: 'Aero', baroque: 'Baroque', modernist: 'Modernist', antiquarian: 'Antiquarian' };
export const ROOM_METADATA_STORAGE_KEY = 'vinculum-room-metadata-v1';
const roomsById = new Map(ROOM_CATALOG.map(room => [room.id, room]));
type MetadataMap = Record<string, RoomDisplayMetadata>;
let cachedRaw: string | null | undefined;
let cachedMetadata: MetadataMap = Object.create(null);

export function getRoomDefinition(id: string | null | undefined): RoomDefinition | undefined { return id ? roomsById.get(id) : undefined; }
export function roomHref(room: RoomDefinition) { return room.number === 0 ? '/liminette.html' : `/room.html?id=${encodeURIComponent(room.id)}`; }

function validateDisplay(value: unknown): RoomDisplayMetadata {
  if (!value || typeof value !== 'object') throw new Error('Each room needs a name and description.');
  const record = value as Record<string, unknown>;
  if (typeof record.name !== 'string' || typeof record.description !== 'string') throw new Error('Room names and descriptions must be text.');
  const name = record.name.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  const description = record.description.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!name || name.length > 80) throw new Error('Use a room name between 1 and 80 characters.');
  if (description.length > 600) throw new Error('Keep descriptions to 600 characters or fewer.');
  return { name, description };
}
function readMetadata(): MetadataMap {
  let raw: string | null;
  try { raw = localStorage.getItem(ROOM_METADATA_STORAGE_KEY); } catch { return Object.create(null); }
  if (raw === cachedRaw) return cachedMetadata;
  cachedRaw = raw; cachedMetadata = Object.create(null);
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return cachedMetadata;
    for (const [id, display] of Object.entries(parsed)) {
      if (!roomsById.has(id)) continue;
      try { cachedMetadata[id] = validateDisplay(display); } catch { /* Ignore an invalid old record without losing valid edits. */ }
    }
  } catch { /* A corrupt previous value never prevents the directory from loading. */ }
  return cachedMetadata;
}
function writeMetadata(metadata: MetadataMap) {
  try { localStorage.setItem(ROOM_METADATA_STORAGE_KEY, JSON.stringify(metadata)); }
  catch { throw new Error('This browser could not save the edits. Allow local storage, or copy this text before leaving.'); }
  cachedRaw = undefined;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('vinculum-room-metadata-change'));
}
export function getRoomDisplay(room: RoomDefinition): RoomDisplayMetadata {
  const display = readMetadata()[room.id];
  return display ? { ...display } : { name: room.name, description: room.description };
}
export function saveRoomDisplay(id: string, display: RoomDisplayMetadata) {
  const room = getRoomDefinition(id); if (!room) throw new Error('This room does not exist in the collection.');
  const validated = validateDisplay(display);
  const metadata = { ...readMetadata() };
  if (validated.name === room.name && validated.description === room.description) delete metadata[id];
  else metadata[id] = validated;
  writeMetadata(metadata);
  return validated;
}
export function resetRoomDisplay(id: string) {
  if (!roomsById.has(id)) throw new Error('This room does not exist in the collection.');
  const metadata = { ...readMetadata() }; delete metadata[id]; writeMetadata(metadata);
}
export function exportRoomMetadata(collection: 'student' | 'city' | 'all' = 'student'): string {
  return JSON.stringify({ format: 'vinculum-room-metadata', version: 1, rooms: ROOM_CATALOG.filter(room => collection === 'all' || (collection === 'city' ? room.kind === 'city' : room.kind !== 'city')).map(room => ({ id: room.id, ...getRoomDisplay(room) })) }, null, 2);
}
export function importRoomMetadata(json: string): number {
  if (json.length > 256_000) throw new Error('Choose a room metadata file smaller than 256 KB.');
  let parsed: unknown; try { parsed = JSON.parse(json); } catch { throw new Error('That file does not contain valid JSON.'); }
  if (!parsed || typeof parsed !== 'object') throw new Error('Choose a Vinculum room metadata export.');
  const payload = parsed as Record<string, unknown>;
  if (payload.format !== 'vinculum-room-metadata' || payload.version !== 1 || !Array.isArray(payload.rooms)) throw new Error('Choose a version 1 Vinculum room metadata export.');
  if (payload.rooms.length > ROOM_CATALOG.length) throw new Error('This metadata file contains too many rooms.');
  const next = { ...readMetadata() }; const seen = new Set<string>();
  for (const value of payload.rooms) {
    if (!value || typeof value !== 'object') throw new Error('Each imported room must have an ID, name and description.');
    const record = value as Record<string, unknown>;
    if (typeof record.id !== 'string' || !roomsById.has(record.id) || seen.has(record.id)) throw new Error('The metadata file contains an unknown or repeated room ID.');
    seen.add(record.id);
    const room = roomsById.get(record.id)!; const display = validateDisplay(record);
    if (display.name === room.name && display.description === room.description) delete next[record.id];
    else next[record.id] = display;
  }
  writeMetadata(next);
  return seen.size;
}
