/** Integrate speed changes so moving data packets never jump to a new phase. */
export function createCityStreamClock() {
  let speed=1,elapsedSeconds=0,lastWallElapsed=0;
  const setSpeed=(value:number)=>{if(Number.isFinite(value))speed=Math.round(Math.max(0,Math.min(3,value))*10)/10;};
  const step=(wallElapsed:number,reducedMotion=false)=>{
    const delta=Math.max(0,wallElapsed-lastWallElapsed);lastWallElapsed=wallElapsed;
    if(!reducedMotion)elapsedSeconds+=delta*speed;
    return elapsedSeconds;
  };
  return {setSpeed,step,getSpeed:()=>speed,snapshot:()=>({speed,elapsedSeconds})};
}
