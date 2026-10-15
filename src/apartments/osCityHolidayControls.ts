import { CITY_HOLIDAYS, type CityHolidayControls } from './osCityHolidays';

export function createCityHolidayControls(holidays:CityHolidayControls,onFocus:()=>void) {
  const section=document.createElement('section');section.id='city-holiday-panel';section.className='city-window-panel city-holiday-panel';section.setAttribute('aria-label','Holiday decorations');
  const label=document.createElement('label');label.htmlFor='city-holiday-select';label.textContent='Holidays';
  const select=document.createElement('select');select.id='city-holiday-select';select.setAttribute('aria-describedby','city-holiday-note');
  for(const item of CITY_HOLIDAYS){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;select.append(option);}
  const note=document.createElement('p');note.id='city-holiday-note';note.setAttribute('role','status');
  const refresh=()=>{const state=holidays.getSnapshot();select.value=state.holiday;note.textContent=state.active?'Giant robot pumpkin above the plaza chip, neon pumpkins, ghosts & bats. None restores your plaza hologram mix.'+(state.reducedMotion?' Animation paused for reduced motion.':''):'Choose a holiday to decorate your apartment and plaza.';note.textContent+=state.saved?' Selection saved.':'';};
  select.addEventListener('change',()=>holidays.setHoliday(select.value));section.addEventListener('focusin',onFocus);section.addEventListener('pointerdown',onFocus);
  refresh();const unsubscribe=holidays.subscribe(refresh);section.append(label,select,note);return {element:section,dispose:unsubscribe};
}
