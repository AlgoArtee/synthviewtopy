import { CITY_TV_CHANNELS, type CityTVChannel } from './osCityTVProgramming';
import type { CityTVControls } from './osCityTV';

export function createCityTVControls(tv:CityTVControls,onFocus:()=>void) {
  const section=document.createElement('section');section.id='city-tv-panel';section.className='city-window-panel city-tv-panel';section.setAttribute('aria-label','Bed TV controls');
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Bed TV';section.append(details);details.append(summary);
  const label=document.createElement('label');label.htmlFor='city-tv-channel';label.textContent='Channel';
  const select=document.createElement('select');select.id='city-tv-channel';
  for(const item of CITY_TV_CHANNELS){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;select.append(option);}
  const actions=document.createElement('div');actions.className='city-tv-actions';
  const pause=document.createElement('button');pause.id='city-tv-pause';pause.type='button';
  const next=document.createElement('button');next.id='city-tv-next-story';next.type='button';next.textContent='Next story';actions.append(pause,next);
  const autoLabel=document.createElement('label');autoLabel.className='city-tv-auto';
  const auto=document.createElement('input');auto.type='checkbox';auto.id='city-tv-auto';autoLabel.append(auto,document.createTextNode(' Change channel every minute'));
  const note=document.createElement('p');note.textContent='Original animations and fictional North City news. Your channel settings are saved in this browser.';
  const status=document.createElement('p');status.id='city-tv-status';status.setAttribute('role','status');
  details.append(label,select,actions,autoLabel,note,status);
  const refresh=()=>{const state=tv.getSnapshot();select.value=state.channel;pause.textContent=state.paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(state.paused));pause.disabled=state.reducedMotion;next.hidden=state.channel!=='news';auto.checked=state.autoCycle;auto.disabled=state.reducedMotion;
    status.textContent=(state.reducedMotion?'Motion paused by your reduced-motion preference.':state.paused?'Paused.':'Playing.')+(state.headline?' '+state.headline:'');
    note.textContent='Original animations and fictional North City news. '+(state.saved?'Settings saved in this browser.':'Settings apply for this visit and save when changed.');
  };
  select.addEventListener('change',()=>tv.setSettings({channel:select.value as CityTVChannel}));
  pause.addEventListener('click',()=>tv.setSettings({paused:!tv.getSnapshot().paused}));
  next.addEventListener('click',()=>tv.nextStory());auto.addEventListener('change',()=>tv.setSettings({autoCycle:auto.checked}));
  section.addEventListener('focusin',onFocus);section.addEventListener('pointerdown',onFocus);refresh();
  const unsubscribe=tv.subscribe(refresh);return {element:section,dispose:unsubscribe};
}
