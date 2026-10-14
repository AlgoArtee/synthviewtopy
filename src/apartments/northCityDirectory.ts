import './northCity.css';
import { getRoomDefinition, getRoomDisplay, roomHref, ROOM_METADATA_STORAGE_KEY } from './roomCatalog';

const room = getRoomDefinition('os-city-apartment')!;
function refresh() {
  const display = getRoomDisplay(room);
  document.querySelector('#city-apartment-name')!.textContent = display.name;
  document.querySelector('#city-apartment-description')!.textContent = display.description;
  const link = document.querySelector<HTMLAnchorElement>('#city-apartment-link')!;
  link.href = roomHref(room); link.setAttribute('aria-label', `${display.name} — enter the 3D apartment`);
}
refresh();
window.addEventListener('vinculum-room-metadata-change', refresh);
window.addEventListener('storage', event => { if (event.key === ROOM_METADATA_STORAGE_KEY) refresh(); });
window.render_game_to_text = () => JSON.stringify({ page: 'North City', category: 'Interiors', totalRooms: 1, locations: [{ id: room.id, name: getRoomDisplay(room).name, href: roomHref(room) }] });
