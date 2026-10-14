import type { CityAmbience } from './osCityAmbience';

export function createCitySoundControls(sound:CityAmbience,clearKeys:()=>void){
  const container=document.createElement('div');container.className='city-sound-controls';
  const toggle=document.createElement('button');toggle.id='city-sound-toggle';toggle.type='button';toggle.setAttribute('aria-controls','city-sound-select city-sound-volume');
  toggle.addEventListener('click',()=>{const snapshot=sound.getSnapshot();if(snapshot.muted)sound.setMuted(false);else if(snapshot.state==='needs-gesture'||snapshot.state==='error')sound.prime();else sound.setMuted(true);});
  const label=document.createElement('label');label.htmlFor='city-sound-select';label.textContent='Sound for this weather';
  const select=document.createElement('select');select.id='city-sound-select';select.addEventListener('change',()=>sound.setTrack(select.value));
  const volumeLabel=document.createElement('label');volumeLabel.htmlFor='city-sound-volume';volumeLabel.textContent='City ambience volume';
  const range=document.createElement('input');range.id='city-sound-volume';range.type='range';range.min='0';range.max='100';range.step='1';range.value=String(Math.round(sound.getSnapshot().volume*100));
  const level=document.createElement('output');level.setAttribute('for','city-sound-volume');level.textContent=range.value+'%';
  range.addEventListener('input',()=>{sound.setVolume(Number(range.value)/100);level.textContent=range.value+'%';});
  const row=document.createElement('div');row.className='city-sound-volume-row';row.append(range,level);
  const note=document.createElement('p');note.id='city-sound-status';note.setAttribute('role','status');
  const credit=document.createElement('small');credit.className='city-sound-credit';
  const details=document.createElement('details');details.className='city-sound-uploads';
  const summary=document.createElement('summary');summary.textContent='Use your own sound';
  const privacy=document.createElement('p');privacy.textContent='Audio stays in this browser; never sent to a server. Up to 25 MB.';
  const file=document.createElement('input');file.type='file';file.id='city-sound-upload';file.accept='audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac';file.setAttribute('aria-label','Upload your audio for this weather');
  file.addEventListener('change',()=>{const selected=file.files?.[0];file.value='';if(selected)void sound.upload(selected);});
  const uploadStatus=document.createElement('p');uploadStatus.id='city-sound-upload-status';uploadStatus.setAttribute('role','status');
  const remove=document.createElement('button');remove.type='button';remove.id='city-sound-remove';remove.textContent='Remove your selected sound';remove.addEventListener('click',()=>void sound.removeUpload());
  details.append(summary,privacy,file,uploadStatus,remove);
  container.append(toggle,label,select,volumeLabel,row,note,credit,details);
  for(const control of [select,range,file,toggle,remove])control.addEventListener('focus',clearKeys);
  let choicesKey='',uiKey='';
  function refresh(){
    const snapshot=sound.getSnapshot(),choices=sound.getChoices(),nextChoicesKey=JSON.stringify([snapshot.weather,choices.map(t=>t.id)]);
    if(nextChoicesKey!==choicesKey){choicesKey=nextChoicesKey;select.replaceChildren();for(const track of choices){const option=document.createElement('option');option.value=track.id;option.textContent=track.label;select.append(option);}}
    select.value=snapshot.selectedId;
    const key=JSON.stringify([snapshot.state,snapshot.muted,snapshot.error,snapshot.selectedId,snapshot.uploadNotice,snapshot.listenerOutside,snapshot.doorOpening>.001,snapshot.windowOpening>.001]);if(key===uiKey)return;uiKey=key;
    toggle.textContent=snapshot.muted?'City sound: Off':snapshot.state==='needs-gesture'?'Play city sound':snapshot.state==='error'?'Retry city sound':'City sound: On';toggle.setAttribute('aria-pressed',String(!snapshot.muted));
    note.textContent=snapshot.error?('Could not play this sound. Tap Retry or choose another.'):(snapshot.state==='loading'?'Loading city ambience…':snapshot.muted?'City ambience muted.':snapshot.state==='silent'?'City ambience volume is zero.':snapshot.state==='needs-gesture'?'Tap Play city sound to listen.':snapshot.listenerOutside?'Full exterior ambience on the balcony.':snapshot.state==='closed'?'Window and balcony door closed — quiet indoors.':snapshot.doorOpening>.001&&snapshot.windowOpening>.001?'City ambience enters through the window and balcony door.':snapshot.doorOpening>.001?'City ambience enters through the balcony door.':'City ambience enters through the window.');
    const track=choices.find(t=>t.id===snapshot.selectedId)!;credit.replaceChildren();
    if(track.custom)credit.textContent='Your audio · private to this browser';
    else{const author=document.createElement('a');author.href=track.source;author.target='_blank';author.rel='noopener noreferrer';author.textContent='Sound by '+track.author;author.title=track.title;const license=document.createElement('a');license.href=track.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';license.textContent=track.license;credit.append(author,' · ',license);}
    uploadStatus.textContent=snapshot.uploadNotice;remove.hidden=!track.custom;
  }
  refresh();return{element:container,refresh};
}
