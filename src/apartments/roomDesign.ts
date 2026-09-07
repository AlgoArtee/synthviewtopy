import type { RoomDefinition } from './roomCatalog';
import type { FurnitureStyle } from './diverseFurniture';

export interface RoomDesign {
  furniture: FurnitureStyle;
  wallTreatment: 'panels' | 'limewash' | 'brick' | 'concrete' | 'wallpaper' | 'fluted' | 'lacquer' | 'slats';
  floorTreatment: 'parquet' | 'oak' | 'concrete' | 'terrazzo' | 'terracotta' | 'tatami' | 'checkerboard' | 'stone';
  rugPattern: 'medallion' | 'geometric' | 'plain' | 'woven' | 'stripes' | 'kilim' | 'orbital' | 'organic';
  ceilingTreatment: 'beams' | 'coffers' | 'cove' | 'pipes' | 'lattice' | 'orbits';
  curtainTreatment: 'velvet' | 'linen' | 'screen';
  libraryTreatment: 'ornate' | 'open' | 'steel' | 'low' | 'modular';
  features: string[];
}

const profiles: Record<FurnitureStyle, Omit<RoomDesign, 'furniture'>> = {
  traditional: {wallTreatment:'wallpaper', floorTreatment:'parquet', rugPattern:'medallion', ceilingTreatment:'coffers', curtainTreatment:'velvet', libraryTreatment:'ornate', features:['framed botanical wallpaper','formal upholstered salon','coffered ceiling']},
  deco: {wallTreatment:'fluted', floorTreatment:'checkerboard', rugPattern:'geometric', ceilingTreatment:'coffers', curtainTreatment:'velvet', libraryTreatment:'modular', features:['stepped metallic inlays','scalloped seating','geometric stone floor']},
  modern: {wallTreatment:'limewash', floorTreatment:'terrazzo', rugPattern:'geometric', ceilingTreatment:'cove', curtainTreatment:'linen', libraryTreatment:'modular', features:['low modular seating','open shelving composition','abstract textile geometry']},
  nordic: {wallTreatment:'limewash', floorTreatment:'oak', rugPattern:'woven', ceilingTreatment:'beams', curtainTreatment:'linen', libraryTreatment:'open', features:['pale timber','open furniture frames','quiet woven textiles']},
  japanese: {wallTreatment:'slats', floorTreatment:'tatami', rugPattern:'plain', ceilingTreatment:'lattice', curtainTreatment:'screen', libraryTreatment:'low', features:['slatted timber screens','low platform furniture','tatami floor borders']},
  industrial: {wallTreatment:'brick', floorTreatment:'concrete', rugPattern:'stripes', ceilingTreatment:'pipes', curtainTreatment:'screen', libraryTreatment:'steel', features:['exposed masonry','steel furniture frames','overhead services']},
  organic: {wallTreatment:'limewash', floorTreatment:'stone', rugPattern:'organic', ceilingTreatment:'cove', curtainTreatment:'linen', libraryTreatment:'open', features:['curved upholstery','sculpted natural forms','botanical wall relief']},
  space: {wallTreatment:'lacquer', floorTreatment:'terrazzo', rugPattern:'orbital', ceilingTreatment:'orbits', curtainTreatment:'screen', libraryTreatment:'modular', features:['moulded pod seating','orbital ceiling panels','illuminated wall seams']},
  bohemian: {wallTreatment:'wallpaper', floorTreatment:'terracotta', rugPattern:'kilim', ceilingTreatment:'beams', curtainTreatment:'linen', libraryTreatment:'open', features:['layered patterned textiles','woven furniture','collected wall tapestry']},
  coastal: {wallTreatment:'slats', floorTreatment:'oak', rugPattern:'stripes', ceilingTreatment:'beams', curtainTreatment:'linen', libraryTreatment:'open', features:['weathered slatted surfaces','woven seating','striped natural textiles']},
  rustic: {wallTreatment:'panels', floorTreatment:'oak', rugPattern:'woven', ceilingTreatment:'beams', curtainTreatment:'linen', libraryTreatment:'ornate', features:['substantial timber joinery','exposed structural beams','crafted storage']},
  gothic: {wallTreatment:'panels', floorTreatment:'stone', rugPattern:'medallion', ceilingTreatment:'coffers', curtainTreatment:'velvet', libraryTreatment:'ornate', features:['pointed wall tracery','dark carved timber','deep velvet upholstery']},
};

/** Design choices are independent of editable labels and preserve stable room IDs. */
export function getRoomDesign(room: RoomDefinition): RoomDesign {
  const style = room.style.toLowerCase();
  let furniture: FurnitureStyle = 'traditional';
  if (/frutiger|space age|atompunk|raygun|vaporwave|synthwave|y2k|digital minimalism/.test(style)) furniture = 'space';
  else if (/japandi|wabi|japonisme|zen|burmese/.test(style)) furniture = 'japanese';
  else if (/brutal|industrial|constructivi|steampunk|dieselpunk|cyberpunk|cassette/.test(style)) furniture = 'industrial';
  else if (/art deco|memphis|streamline/.test(style)) furniture = 'deco';
  else if (/scandinavian|shaker|monastic/.test(style)) furniture = 'nordic';
  else if (/art nouveau|organic|solar|biopunk|biophilic|botanical|balinese|indochine/.test(style)) furniture = 'organic';
  else if (/bohemian|eclectic|moroccan|persian|tibetan|southwestern|surreal/.test(style)) furniture = 'bohemian';
  else if (/mediterranean|coastal|nautical|ocean liner|andalusian/.test(style)) furniture = 'coastal';
  else if (/crafts|craftsman|prairie|rustic|chalet|tudor|country|proven|tuscan|spanish colonial/.test(style)) furniture = 'rustic';
  else if (/gothic|romanesque|baronial|saracenic|moorish|nordic national/.test(style)) furniture = 'gothic';
  else if (/modern|bauhaus|de stijl|supremat|op art|cubism|abstract expression/.test(style)) furniture = 'modern';
  const result: RoomDesign = {furniture, ...profiles[furniture], features:[...profiles[furniture].features]};
  if (/brutal/.test(style)) { result.wallTreatment='concrete'; result.floorTreatment='stone'; result.features[0]='board-marked architectural concrete'; }
  if (/mid-century/.test(style)) { result.furniture='nordic'; result.floorTreatment='parquet'; result.ceilingTreatment='beams'; result.libraryTreatment='open'; result.features=['tapered timber seating','warm walnut','geometric colour blocks']; }
  if (/memphis|de stijl|supremat|op art/.test(style)) { result.rugPattern='geometric'; result.wallTreatment='lacquer'; result.features.push('high-contrast abstract wall composition'); }
  if (/moroccan|persian|andalusian|mediterranean|tuscan|southwestern/.test(style)) { result.floorTreatment='terracotta'; result.rugPattern='kilim'; }
  if (/baroque|rococo|regency|byzantine|ottoman|mughal/.test(style)) { result.wallTreatment='fluted'; result.floorTreatment='checkerboard'; result.ceilingTreatment='coffers'; }
  if (/solarpunk|biophilic|botanical/.test(style)) result.features.push('vertical planting panels');
  return result;
}
