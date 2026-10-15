import { CITY_RADIO_PROGRAMS, type CityRadioAudio } from './osCityRadioAudio';

export function createCityRadioControls(audio:CityRadioAudio,onOpen:()=>void,onClose:()=>void) {
  const dialog=document.createElement('dialog');dialog.className='city-radio-dialog';dialog.id='city-radio-dialog';dialog.setAttribute('aria-labelledby','city-radio-title');
  dialog.innerHTML=`<header><div><p>NOCTURNE / 01</p><h2 id="city-radio-title">Halloween radio</h2></div><button type="button" class="city-radio-close" aria-label="Close radio">×</button></header>
    <p class="city-radio-intro">Choose a frequency for the witching hour.</p>
    <fieldset><legend>Music &amp; soundscapes</legend><div class="city-radio-programs"></div></fieldset>
    <div class="city-radio-transport"><button type="button" id="city-radio-play">Play</button><p id="city-radio-status" role="status" aria-live="polite"></p></div>
    <label class="city-radio-volume" for="city-radio-volume">Volume <output id="city-radio-volume-value"></output></label>
    <input id="city-radio-volume" type="range" min="0" max="100" step="1">
    <p class="city-radio-note">Audio continues when you close the radio. Switching tabs stops playback.</p>`;
  const choices=dialog.querySelector('.city-radio-programs')!,inputs:HTMLInputElement[]=[];
  for(const program of CITY_RADIO_PROGRAMS){
    const label=document.createElement('label');label.className='city-radio-program';
    const input=document.createElement('input');input.type='radio';input.name='city-radio-program';input.value=program.id;
    const text=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('small'),kind=document.createElement('em');
    title.textContent=program.name;description.textContent=program.description;kind.textContent=program.kind;
    text.append(title,description);label.append(input,text,kind);choices.append(label);inputs.push(input);
    input.addEventListener('change',()=>audio.select(program.id));
  }
  const play=dialog.querySelector<HTMLButtonElement>('#city-radio-play')!,status=dialog.querySelector<HTMLParagraphElement>('#city-radio-status')!,volume=dialog.querySelector<HTMLInputElement>('#city-radio-volume')!,output=dialog.querySelector<HTMLOutputElement>('#city-radio-volume-value')!;
  const refresh=()=>{const state=audio.getSnapshot();inputs.forEach(input=>input.checked=input.value===state.program);volume.value=String(state.volume);output.textContent=state.volume+'%';volume.setAttribute('aria-valuetext',state.volume+'%');play.textContent=state.playing||state.loading?'Stop':'Play';play.setAttribute('aria-label',state.playing||state.loading?'Stop radio':'Play radio');status.textContent=state.error??(state.loading?'Tuning…':state.playing?'On air · '+CITY_RADIO_PROGRAMS.find(p=>p.id===state.program)!.name:'Ready when you are');};
  play.addEventListener('click',()=>{const state=audio.getSnapshot();if(state.playing||state.loading)audio.stop();else void audio.play();});
  volume.addEventListener('input',()=>audio.setVolume(Number(volume.value)));
  dialog.querySelector('.city-radio-close')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',onClose);
  const unsubscribe=audio.subscribe(refresh);refresh();document.body.append(dialog);
  const open=()=>{if(dialog.open)return;onOpen();refresh();dialog.showModal();inputs.find(input=>input.checked)?.focus();};
  const button=document.createElement('button');button.type='button';button.id='city-radio-open';button.className='city-radio-open';button.textContent='♫  Desk radio';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',dialog.id);button.addEventListener('click',open);
  return {button,open,isOpen:()=>dialog.open,dispose:()=>{unsubscribe();dialog.removeEventListener('close',onClose);dialog.remove();button.remove();}};
}
