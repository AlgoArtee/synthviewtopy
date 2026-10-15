import { CITY_HOLOGRAMS, type CityHologramControls } from './osCityPlazaHolograms';

export function createCityHologramControls(holograms:CityHologramControls,onFocus:()=>void) {
  const section=document.createElement('section');section.id='city-hologram-panel';section.className='city-window-panel city-hologram-panel';section.setAttribute('aria-label','Plaza hologram mixer');
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Plaza holograms';details.append(summary);section.append(details);
  const intro=document.createElement('p');intro.textContent='Everyday light from the central chip. Fade in any combination, or use Solo to show one projection. Halloween replaces this mix until Holidays is set to None.';details.append(intro);
  const refreshers:(()=>void)[]=[];
  const status=document.createElement('p');status.id='city-hologram-status';status.setAttribute('role','status');
  function refresh(){refreshers.forEach(fn=>fn());const settings=holograms.getSettings(),count=Object.values(settings.levels).filter(v=>v>0).length;
    const failed=Object.entries(holograms.getSnapshot().assets as Record<string,string>).filter(([,v])=>v==='failed');
    status.textContent=(settings.brightness===0||count===0?'Projector off.':`${count} projection${count===1?'':'s'} in the mix.`)+' '+(holograms.isSaved()?'Saved in this browser.':'Applied for this visit.')+(failed.length?` Unavailable: ${failed.map(([id])=>id).join(', ')}.`:'');
  }
  function slider(parent:HTMLElement,id:string,title:string,min:number,max:number,get:()=>number,set:(v:number)=>void){
    const label=document.createElement('label');label.htmlFor=id;label.textContent=title;
    const row=document.createElement('div');row.className='city-window-slider-row';
    const input=document.createElement('input');input.id=id;input.type='range';input.min=String(min);input.max=String(max);input.step='1';
    const output=document.createElement('output');output.setAttribute('for',id);
    refreshers.push(()=>{input.value=String(get());output.textContent=input.value+'%';input.setAttribute('aria-valuetext',output.textContent);});
    input.addEventListener('input',()=>{set(Number(input.value));refresh();});row.append(input,output);parent.append(label,row);return row;
  }
  slider(details,'city-hologram-brightness','Projector brightness',0,150,()=>holograms.getSettings().brightness,v=>holograms.setSettings({brightness:v}));
  slider(details,'city-hologram-size','Projection size',60,140,()=>holograms.getSettings().size,v=>holograms.setSettings({size:v}));
  const animateLabel=document.createElement('label');animateLabel.className='city-hologram-motion';
  const animate=document.createElement('input');animate.type='checkbox';animate.id='city-hologram-animate';animateLabel.append(animate,document.createTextNode(' Animate light & particles'));details.append(animateLabel);
  animate.addEventListener('change',()=>{holograms.setSettings({animated:animate.checked});refresh();});refreshers.push(()=>{animate.checked=holograms.getSettings().animated;});
  const actions=document.createElement('div');actions.className='city-hologram-actions';
  for(const [id,label,action] of [['off','All off',holograms.allOff],['reset','Reset mix',holograms.reset]] as const){const button=document.createElement('button');button.type='button';button.id=`city-hologram-${id}`;button.textContent=label;button.addEventListener('click',()=>{action();refresh();});actions.append(button);}details.append(actions);
  for(const category of ['Figures','Weather','Day cycle']){
    const family=document.createElement('details');family.className='city-hologram-family';family.open=category==='Figures';
    const heading=document.createElement('summary');heading.textContent=category;family.append(heading);details.append(family);
    for(const item of CITY_HOLOGRAMS.filter(item=>item.category===category)){
      const entry=document.createElement('div');entry.className='city-hologram-entry';
      slider(entry,`city-hologram-${item.id}`,item.label,0,100,()=>holograms.getSettings().levels[item.id],v=>holograms.setLevel(item.id,v));
      const solo=document.createElement('button');solo.type='button';solo.textContent='Solo';solo.id=`city-hologram-solo-${item.id}`;solo.setAttribute('aria-label',`Show only ${item.label}`);
      solo.addEventListener('click',()=>{holograms.solo(item.id);refresh();});entry.append(solo);family.append(entry);
    }
  }
  const note=document.createElement('p');note.textContent='The weather and time designs are artwork presets. They do not change the city’s weather. Reduced-motion preferences pause animation.';
  details.append(note,status);section.addEventListener('focusin',onFocus);section.addEventListener('pointerdown',onFocus);refresh();return section;
}
