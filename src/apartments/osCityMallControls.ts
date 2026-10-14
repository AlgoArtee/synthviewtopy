import { CITY_MALL_LABEL_LIMIT, type CityMallSigns, type CityMallSignSide } from './osCityMall';

export function createCityMallControls(signs:CityMallSigns,onFocus:()=>void) {
  const section=document.createElement('section');section.id='city-mall-panel';section.className='city-window-panel city-mall-panel';section.setAttribute('aria-label','Data Mall signs');
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Data Mall signs';details.append(summary);section.append(details);
  const note=document.createElement('p');note.textContent='Replace a level number with a promotion or any short message. Changes appear immediately.';details.append(note);
  const levelLabel=document.createElement('label');levelLabel.htmlFor='city-mall-level';levelLabel.textContent='Floor';
  const select=document.createElement('select');select.id='city-mall-level';
  for(let floor=1;floor<=10;floor++){const option=document.createElement('option');option.value=String(floor);option.textContent=`Level ${String(floor).padStart(2,'0')}${floor===1?' · ground floor':''}`;select.append(option);}
  details.append(levelLabel,select);
  const inputs={} as Record<CityMallSignSide,HTMLInputElement>;
  const status=document.createElement('p');status.id='city-mall-save-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const feedback=()=>{status.textContent=signs.isSaved()?'Saved in this browser.':'Applied for this visit; browser storage is unavailable.';};
  const refresh=()=>{const label=signs.getLabels()[Number(select.value)-1];inputs.left.value=label.left;inputs.right.value=label.right;feedback();};
  for(const side of ['left','right'] as const){
    const label=document.createElement('label');label.htmlFor=`city-mall-${side}-text`;label.textContent=side==='left'?'Left display':'Right display';
    const input=document.createElement('input');input.id=label.htmlFor;input.type='text';input.maxLength=CITY_MALL_LABEL_LIMIT;input.autocomplete='off';input.spellcheck=true;input.setAttribute('aria-describedby','city-mall-text-hint');
    input.addEventListener('focus',onFocus);input.addEventListener('input',()=>{signs.setLabel(Number(select.value),side,input.value);feedback();});inputs[side]=input;details.append(label,input);
  }
  const hint=document.createElement('p');hint.id='city-mall-text-hint';hint.textContent=`Up to ${CITY_MALL_LABEL_LIMIT} characters per display. Leave blank to hide its text.`;
  const reset=document.createElement('button');reset.type='button';reset.id='city-mall-reset-level';reset.textContent='Restore this floor’s numbers';reset.addEventListener('click',()=>{signs.resetLevel(Number(select.value));refresh();});
  select.addEventListener('focus',onFocus);select.addEventListener('change',refresh);summary.addEventListener('click',onFocus);details.append(hint,reset,status);refresh();return section;
}
