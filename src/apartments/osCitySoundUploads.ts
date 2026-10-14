import type { OsCityWeather } from './osCityWeather';

export interface CitySoundUpload { id:string; weather:OsCityWeather; name:string; blob:Blob; duration:number; created:number; }
/** Audio stays in this origin's IndexedDB; unavailable storage falls back to this session. */
export function createCitySoundUploads(){
  const records=new Map<string,CitySoundUpload>();let disposed=false,storageState='opening',storageError='';
  const database=new Promise<IDBDatabase|null>(resolve=>{
    let settled=false;
    const finish=(db:IDBDatabase|null)=>{if(settled){db?.close();return;}settled=true;clearTimeout(timer);storageState=db?'ready':'unavailable';resolve(db);};
    let timer:number|undefined;
    // First WebGL shader compilation can block the main thread for many seconds.
    // Start storage and its timeout after that first render, so queued IDB events get time to run.
    requestAnimationFrame(()=>{if(disposed){finish(null);return;}timer=window.setTimeout(()=>{storageError='Audio storage did not respond';finish(null);},30000);
    try{const request=indexedDB.open('north-city-sounds',1);
      request.onupgradeneeded=()=>{request.result.createObjectStore('uploads',{keyPath:'id'});};
      request.onsuccess=()=>{if(disposed){request.result.close();finish(null);}else{request.result.onversionchange=()=>request.result.close();finish(request.result);}};
      request.onerror=()=>{storageError=request.error?.message??'Audio storage unavailable';finish(null);};request.onblocked=()=>{storageError='Audio storage is blocked by another tab';finish(null);};
    }catch(e){storageError=String(e);finish(null);}});
  });
  function transaction<T>(db:IDBDatabase,mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>){
    return new Promise<T>((resolve,reject)=>{try{const tx=db.transaction('uploads',mode),request=action(tx.objectStore('uploads'));let result:T;request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Audio storage unavailable'));}catch(e){reject(e);}});
  }
  const ready=(async()=>{const db=await database;if(!db)return;try{for(const record of await transaction<CitySoundUpload[]>(db,'readonly',s=>s.getAll()))if(record.blob instanceof Blob&&record.id&&record.weather)records.set(record.id,record);}catch(e){storageError=String(e);}})();
  async function put(record:CitySoundUpload){await ready;if(disposed)return false;records.set(record.id,record);const db=await database;if(!db)return false;try{await transaction(db,'readwrite',s=>s.put(record));return true;}catch(e){storageError=String(e);return false;}}
  async function remove(id:string){await ready;const db=await database;if(db)await transaction(db,'readwrite',s=>s.delete(id));records.delete(id);}
  return{ready,getSnapshot:()=>({state:storageState,error:storageError||null}),list:()=>[...records.values()],get:(id:string)=>records.get(id),put,remove,dispose:()=>{disposed=true;void database.then(db=>db?.close());records.clear();}};
}
export function inspectUploadedAudio(file:File):Promise<number>{
  if(!file.size)return Promise.reject(new Error('The audio file is empty.'));
  if(file.size>25*1024*1024)return Promise.reject(new Error('Choose an audio file smaller than 25 MB.'));
  if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|ogg|oga|m4a|aac|flac|webm)$/i.test(file.name))return Promise.reject(new Error('Choose an audio file such as MP3, WAV, OGG or M4A.'));
  return new Promise((resolve,reject)=>{const audio=new Audio(),url=URL.createObjectURL(file);
    const cleanup=()=>{clearTimeout(timer);audio.onloadedmetadata=audio.onerror=null;audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);};
    const timer=setTimeout(()=>{cleanup();reject(new Error('This audio format could not be read. Try MP3 or WAV.'));},10000);
    audio.onloadedmetadata=()=>{const duration=audio.duration;if(Number.isFinite(duration)&&duration>1){cleanup();resolve(duration);}else{cleanup();reject(new Error('Choose an audio recording longer than one second.'));}};
    audio.onerror=()=>{cleanup();reject(new Error('This audio could not be read. Try a different file.'));};audio.preload='metadata';audio.src=url;
  });
}
