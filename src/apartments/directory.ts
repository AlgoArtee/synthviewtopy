/// <reference types="vite/client" />
import './apartments.css';
import { ROOM_CATALOG, ROOM_MOTIF_LABELS, ROOM_METADATA_STORAGE_KEY, getRoomDisplay, getRoomDefinition, roomHref, saveRoomDisplay, exportRoomMetadata, importRoomMetadata, type RoomDefinition } from './roomCatalog';

// The collection loads no island, Three.js or WebGL code. Only existing files
// discovered at build time can replace the clearly labelled palette studies.
const renderedPreviews = import.meta.glob<string>('/public/apartments/previews/room-*.jpg', { eager: true, query: '?url', import: 'default' });
const previewUrls = new Map(Object.entries(renderedPreviews).map(([path, url]) => [path.match(/(room-\d{3})\.jpg$/)?.[1], url]));
const find = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector); if (!element) throw new Error(`Missing directory element: ${selector}`); return element;
};
const search = find<HTMLInputElement>('#room-search');
const filter = find<HTMLSelectElement>('#room-motif-filter');
const grid = find<HTMLElement>('#room-catalog-grid');
const dialog = find<HTMLDialogElement>('#room-metadata-dialog');
const nameInput = find<HTMLInputElement>('#metadata-room-name');
const descriptionInput = find<HTMLTextAreaElement>('#metadata-room-description');
const feedback = find<HTMLElement>('#metadata-feedback');
const status = find<HTMLElement>('#catalog-status');
const newRooms = ROOM_CATALOG.filter(room => room.number > 0);
let editedId: string | null = null;
let visibleRooms: RoomDefinition[] = [];

for (const [value, label] of Object.entries(ROOM_MOTIF_LABELS).sort((a, b) => a[1].localeCompare(b[1]))) {
  const option = document.createElement('option'); option.value = value; option.textContent = label; filter.append(option);
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag); node.className = className; if (text !== undefined) node.textContent = text; return node;
}
function paletteIllustration(room: RoomDefinition) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 360 230'); svg.setAttribute('aria-hidden', 'true');
  const { wall, wood, upholstery, accent, metal } = room.palette;
  const shape = (tag: string, attributes: Record<string, string | number>) => {
    const node = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    svg.append(node); return node;
  };
  shape('rect', { x: 0, y: 0, width: 360, height: 230, fill: wall });
  shape('path', { d: 'M0 0H62V160L0 230Z', fill: wood, opacity: '.66' });
  shape('path', { d: 'M360 0H298V160L360 230Z', fill: wood, opacity: '.66' });
  shape('path', { d: 'M62 160H298L360 230H0Z', fill: wood });
  for (const x of [90, 150, 210]) {
    shape('path', { d: `M${x} 145V55Q${x + 20} 10 ${x + 40} 55V145Z`, fill: '#b5cac1', opacity: '.64', stroke: metal, 'stroke-width': 3 });
    shape('path', { d: `M${x + 20} 40V145M${x} 87H${x + 40}`, stroke: metal, 'stroke-width': 2, fill: 'none' });
  }
  shape('path', { d: 'M86 177H269L303 213H51Z', fill: upholstery, stroke: accent, 'stroke-width': 2 });
  for (let row = 0; row < 4; row++) {
    shape('path', { d: `M11 ${58 + row * 27}L49 ${65 + row * 24}`, stroke: accent, 'stroke-width': 3 });
    for (let book = 0; book < 6; book++) shape('path', { d: `M${15 + book * 5} ${40 + row * 26 + book}V${54 + row * 26 + book}`, stroke: book % 2 ? upholstery : metal, 'stroke-width': 3 });
  }
  const deskX = room.layout % 2 ? 89 : 184;
  shape('path', { d: `M${deskX} 145H${deskX + 77}L${deskX + 89} 158H${deskX - 9}Z`, fill: wood, stroke: accent, 'stroke-width': 2 });
  for (const x of [deskX - 3, deskX + 81]) shape('path', { d: `M${x} 158V193`, stroke: metal, 'stroke-width': 4 });
  shape('path', { d: `M${deskX + 36} 145V128M${deskX + 20} 129Q${deskX + 35} 106 ${deskX + 51} 129Z`, fill: upholstery, stroke: metal, 'stroke-width': 2 });
  shape('rect', { x: room.layout % 2 ? 226 : 79, y: 153, width: 39, height: 35, rx: 11, fill: upholstery, stroke: accent, 'stroke-width': 2 });
  shape('path', { d: 'M180 0V25', stroke: metal, 'stroke-width': 2 });
  if (room.motif === 'celestial' || room.motif === 'aero' || room.motif === 'nautical') {
    for (const r of [12, 22]) shape('ellipse', { cx: 180, cy: 39, rx: r * 1.5, ry: r * .6, fill: 'none', stroke: accent, 'stroke-width': 2 });
    shape('circle', { cx: 180, cy: 39, r: 7, fill: '#e9dbb8' });
  } else if (room.motif === 'botanical' || room.motif === 'japonisme') {
    for (let i = 0; i < 7; i++) shape('ellipse', { cx: 281 + Math.sin(i * 2.4) * 12, cy: 139 - i * 5, rx: 7, ry: 13, transform: `rotate(${i * 31} 281 125)`, fill: accent, opacity: '.7' });
    shape('path', { d: 'M270 148H291L287 168H275Z', fill: metal });
    shape('ellipse', { cx: 180, cy: 40, rx: 22, ry: 13, fill: accent, opacity: '.7' });
  } else if (room.motif === 'modernist' || room.motif === 'industrial' || room.motif === 'art-deco') {
    shape('path', { d: 'M160 26H200L191 49H169Z', fill: accent });
    shape('path', { d: 'M313 83L344 45V116Z', fill: upholstery, stroke: metal, 'stroke-width': 2 });
  } else {
    for (const x of [158, 180, 202]) { shape('path', { d: `M180 27L${x} 42`, stroke: metal, 'stroke-width': 2 }); shape('circle', { cx: x, cy: 44, r: 4, fill: '#ecdcad' }); }
    shape('path', { d: 'M316 88V60L333 42L350 60V88Z', fill: upholstery, stroke: accent, 'stroke-width': 2 });
  }
  return svg;
}
function createCard(room: RoomDefinition) {
  const display = getRoomDisplay(room);
  const card = element('article', 'catalog-card'); card.dataset.roomId = room.id; card.dataset.motif = room.motif;
  const link = element('a', 'catalog-room-link'); link.href = roomHref(room); link.setAttribute('aria-label', `${display.name} — ${room.style} × Dark Academia — enter 3D room`);
  const image = element('div', 'catalog-card-image');
  const previewUrl = previewUrls.get(room.id);
  if (previewUrl) {
    const preview = document.createElement('img'); preview.src = previewUrl; preview.alt = `${room.style} × Dark Academia room, rendered from the actual 3D scene`; preview.loading = 'lazy'; preview.decoding = 'async'; preview.width = 720; preview.height = 460; image.append(preview);
  } else image.append(paletteIllustration(room));
  image.append(element('span', 'catalog-visual-label', previewUrl ? '3D room preview' : 'Palette study · illustration'));
  const copy = element('div', 'catalog-card-copy');
  copy.append(element('p', 'catalog-style', `${room.style} × Dark Academia`), element('h3', '', display.name), element('p', 'catalog-description', display.description));
  const swatches = element('div', 'catalog-swatches'); swatches.setAttribute('aria-label', 'Room color palette');
  for (const [name, color] of Object.entries(room.palette)) { const swatch = element('span', ''); swatch.style.backgroundColor = color; swatch.title = `${name}: ${color}`; swatches.append(swatch); }
  const enter = element('span', 'catalog-enter', 'Enter room'); enter.append(element('span', '', '↗')); copy.append(swatches, enter); link.append(image, copy);
  const edit = element('button', 'catalog-edit', 'Edit name & description'); edit.type = 'button'; edit.dataset.editRoom = room.id; edit.setAttribute('aria-label', `Edit ${display.name}`); edit.addEventListener('click', () => openEditor(room));
  card.append(link, edit); return card;
}
function renderCollection() {
  const featured = ROOM_CATALOG[0]; const display = getRoomDisplay(featured);
  find('#featured-room-name').textContent = display.name; find('#featured-room-description').textContent = display.description;
  find('#featured-room-link').setAttribute('aria-label', `${display.name} — enter the 3D apartment`);
  const query = search.value.trim().toLocaleLowerCase();
  visibleRooms = newRooms.filter(room => {
    if (filter.value !== 'all' && room.motif !== filter.value) return false;
    const values = getRoomDisplay(room);
    return !query || [room.id, room.name, room.style, ROOM_MOTIF_LABELS[room.motif], values.name, values.description].join(' ').toLocaleLowerCase().includes(query);
  });
  grid.replaceChildren(...visibleRooms.map(createCard));
  find('#catalog-result-count').textContent = `${visibleRooms.length} of ${newRooms.length} rooms`;
  find('#catalog-empty').hidden = visibleRooms.length > 0;
}
function openEditor(room: RoomDefinition) {
  editedId = room.id; const display = getRoomDisplay(room); nameInput.value = display.name; descriptionInput.value = display.description;
  find('#metadata-style').textContent = `${room.style} × Dark Academia`;
  find('#metadata-reset').textContent = room.number === 0 ? 'Restore original text' : 'Restore generic text';
  feedback.textContent = ''; dialog.showModal(); nameInput.focus(); nameInput.select();
}
dialog.addEventListener('close', () => {
  const button = editedId === ROOM_CATALOG[0].id ? document.querySelector<HTMLButtonElement>('#edit-liminette') : Array.from(grid.querySelectorAll<HTMLButtonElement>('[data-edit-room]')).find(button => button.dataset.editRoom === editedId);
  (button ?? search).focus({ preventScroll: true }); editedId = null;
});
find('#room-metadata-form').addEventListener('submit', event => {
  event.preventDefault(); if (!editedId) return;
  try { const display = saveRoomDisplay(editedId, { name: nameInput.value, description: descriptionInput.value }); status.textContent = `${display.name}: name and description saved on this device.`; dialog.close(); }
  catch (error) { feedback.textContent = error instanceof Error ? error.message : 'The edits could not be saved.'; }
});
find('#metadata-reset').addEventListener('click', () => {
  const room = getRoomDefinition(editedId); if (!room) return;
  // Reset stays reviewable in the form until the user presses Save.
  nameInput.value = room.name; descriptionInput.value = room.description; feedback.textContent = 'Original text restored in the form. Press Save changes to keep it.';
});
find('#metadata-cancel').addEventListener('click', () => dialog.close());
find('#edit-liminette').addEventListener('click', () => openEditor(ROOM_CATALOG[0]));
search.addEventListener('input', renderCollection); filter.addEventListener('change', renderCollection);
find('#catalog-clear').addEventListener('click', () => { search.value = ''; filter.value = 'all'; renderCollection(); search.focus(); });
find('#metadata-export').addEventListener('click', () => {
  const blob = new Blob([exportRoomMetadata()], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'vinculum-room-names.json'; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Names and descriptions exported. Room styles and layouts stay with the collection.';
});
const importFile = find<HTMLInputElement>('#metadata-file');
find('#metadata-import').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0]; if (!file) return;
  try { if (file.size > 256_000) throw new Error('Choose a room metadata file smaller than 256 KB.'); const count = importRoomMetadata(await file.text()); status.textContent = `Imported names and descriptions for ${count} rooms on this device.`; }
  catch (error) { status.textContent = error instanceof Error ? error.message : 'The metadata file could not be imported.'; }
  finally { importFile.value = ''; }
});
window.addEventListener('vinculum-room-metadata-change', renderCollection);
window.addEventListener('storage', event => { if (event.key === ROOM_METADATA_STORAGE_KEY || event.key === null) renderCollection(); });
renderCollection();
window.render_game_to_text = () => JSON.stringify({ page: 'Vinculum Apartments', totalRooms: ROOM_CATALOG.length, additionalRooms: newRooms.length, visibleRooms: visibleRooms.map(room => room.id), filter: filter.value, query: search.value, editor: dialog.open ? editedId : null, apartments: ROOM_CATALOG.map(room => ({ id: room.id, name: getRoomDisplay(room).name, style: `${room.style} × Dark Academia`, href: roomHref(room) })) });
