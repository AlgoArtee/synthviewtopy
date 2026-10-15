export const CITY_TV_CHANNELS = [
  { id: 'news', label: 'North City News', subtitle: 'CITY BULLETIN / IN-WORLD NEWS', programme: 4 },
  { id: 'aurora', label: 'Aurora Ocean', subtitle: 'SLOW CINEMA / NORTHERN LIGHTS', programme: 0 },
  { id: 'orbit', label: 'Orbital Drift', subtitle: 'DEEP SPACE / RINGED WORLDS', programme: 1 },
  { id: 'jellyfish', label: 'Bioluminescence', subtitle: 'OCEAN LAB / MEDUSA', programme: 2 },
  { id: 'city', label: 'Neon After Hours', subtitle: 'NORTH CITY / RAIN STUDY', programme: 3 },
] as const;

export type CityTVChannel = typeof CITY_TV_CHANNELS[number]['id'];
export const CITY_TV_STORIES = [
  { section: 'CULTURE', title: ['Circuit Market opens', 'its midnight edition'], detail: 'Food, makers and music beneath the skyways.', visual: 'market' },
  { section: 'TRANSIT', title: ['Skyrail adds a new', 'North City night service'], detail: 'More departures connect the outer districts.', visual: 'transit' },
  { section: 'ART & SCIENCE', title: ['Light comes alive', 'above the central chip'], detail: 'Plaza artists unveil a new hologram collection.', visual: 'holograms' },
  { section: 'COMMUNITY', title: ['Rooftop gardens join', 'the neighbourhood network'], detail: 'Residents trade seedlings, skills and solar power.', visual: 'gardens' },
] as const;

/** All news is authored fiction for this apartment's world; no external feed. */
export function drawTVGraphics(c: CanvasRenderingContext2D, channel: CityTVChannel, time: number) {
  const w = 1280, h = 696;
  c.clearRect(0, 0, w, h);
  const text = (s: string, x: number, y: number, size = 24, color = '#d5f4ff', weight = 500) => {
    c.font = `${weight} ${size}px "Segoe UI", sans-serif`; c.fillStyle = color; c.fillText(s, x, y);
  };
  if (channel !== 'news') {
    const item = CITY_TV_CHANNELS.find(item => item.id === channel)!;
    c.fillStyle = '#041321a8'; c.fillRect(0, 614, w, 82);
    c.fillStyle = '#7af4ed'; c.fillRect(34, 635, 4, 29);
    text(item.label.toUpperCase(), 55, 660, 24, '#e0fbff', 600);
    c.textAlign = 'right'; text(item.subtitle, 1245, 660, 19, '#9ec6d9'); c.textAlign = 'left';
    return;
  }
  const storyIndex = Math.floor(time / 14) % CITY_TV_STORIES.length, story = CITY_TV_STORIES[storyIndex];
  const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#061727'); bg.addColorStop(1, '#152338');
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#31536c44'; c.lineWidth = 1;
  for (let x = 30; x < w; x += 38) { c.beginPath(); c.moveTo(x, 95); c.lineTo(x, 466); c.stroke(); }
  for (let y = 105; y < 466; y += 38) { c.beginPath(); c.moveTo(30, y); c.lineTo(1250, y); c.stroke(); }
  c.fillStyle = '#6ef3ed'; c.fillRect(32, 30, 58, 47); text('N', 45, 64, 34, '#061727', 800);
  text('NORTH CITY', 108, 63, 32, '#ecfaff', 700);
  c.textAlign = 'right'; text('IN-WORLD NEWS', 1245, 52, 20, '#94bacb', 600); text('DISTRICT 08 / EVENING EDITION', 1245, 79, 16, '#6f91a6'); c.textAlign = 'left';
  c.fillStyle = '#70e5ee'; c.fillRect(32, 98, 1216, 2);
  // Slowly rotating wire globe: an animated studio graphic behind the bulletin.
  const cx = 918, cy = 286, r = 154;
  const halo = c.createRadialGradient(cx, cy, 30, cx, cy, 220); halo.addColorStop(0, '#236f8c66'); halo.addColorStop(1, '#236f8c00');
  c.fillStyle = halo; c.fillRect(690, 104, 558, 363);
  c.save(); c.translate(cx, cy); c.strokeStyle = '#6fe6f6'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI / 9 + time * .12;
    c.strokeStyle = `rgba(93,224,246,${.2 + Math.abs(Math.sin(a)) * .45})`;
    c.beginPath(); c.ellipse(0, 0, Math.max(1, Math.abs(Math.sin(a)) * r), r, 0, 0, Math.PI * 2); c.stroke();
  }
  for (let i = -3; i <= 3; i++) { const y = i * 37; c.strokeStyle = '#5bd9ec66'; c.beginPath(); c.ellipse(0, y, Math.sqrt(r * r - y * y), 12, 0, 0, Math.PI * 2); c.stroke(); }
  c.rotate(-.35); c.strokeStyle = '#f19ed6'; c.beginPath(); c.ellipse(0, 0, r + 44, r * .35, 0, .2 + time * .08, 5.5 + time * .08); c.stroke(); c.restore();
  text('THE DISTRICT, CONNECTED', 35, 143, 19, '#79c3da', 600);
  text('N / 08', 35, 220, 66, '#eefcff', 700);
  text(story.section, 38, 256, 22, '#f2a6d7', 600);
  // Different miniature report footage accompanies each editorial segment.
  c.save(); c.beginPath(); c.rect(35, 281, 555, 173); c.clip();
  if (story.visual === 'market' || story.visual === 'transit') {
    for (let i = 0; i < 17; i++) {
      const x = 35 + i * 35, height = 35 + ((i * 37) % 83);
      c.fillStyle = '#1b3e57'; c.fillRect(x, 454 - height, 27, height);
      c.fillStyle = i % 3 === 0 ? '#f09ed1' : '#84dce7';
      for (let y = 464 - height; y < 448; y += 15) c.fillRect(x + 6, y, 4, 5);
    }
    if (story.visual === 'transit') {
      c.fillStyle = '#85cbdc'; c.fillRect(35, 343, 555, 3);
      const x = ((time * 52) % 760) - 160; c.fillStyle = '#b9f7ff'; c.fillRect(x, 324, 140, 15);
      c.fillStyle = '#355a83'; for (let i = 0; i < 8; i++) c.fillRect(x + i * 17 + 5, 327, 10, 6);
    } else {
      for (let i = 0; i < 8; i++) { const x = 49 + i * 70; c.fillStyle = i % 2 ? '#ec9cd3' : '#83e9ee'; c.fillRect(x, 420, 49, 8); c.fillRect(x + 3, 432, 43, 22); }
      c.fillStyle = '#e7ddbb'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(50 + i * 40, 307 + Math.sin(i + time * .5) * 7, 3, 0, Math.PI * 2); c.fill(); }
    }
  } else if (story.visual === 'holograms') {
    c.strokeStyle = '#8ff5f2'; c.lineWidth = 2;
    for (let i = 0; i < 12; i++) { c.beginPath(); const y = 308 + i * 11; c.ellipse(310, y, 85 + Math.sin(i * .3 + time) * 32, 13, time * .08, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#f8afe3'; for (let i = 0; i < 45; i++) c.fillRect(90 + (i * 97) % 440, 290 + ((i * 37 - time * 18) % 166 + 166) % 166, 3, 3);
  } else {
    c.fillStyle = '#33546a'; c.fillRect(60, 429, 500, 25);
    for (let i = 0; i < 12; i++) {
      const x = 80 + i * 41, top = 338 + Math.sin(i * 3.1) * 20;
      c.strokeStyle = '#85ceba'; c.beginPath(); c.moveTo(x, 429); c.lineTo(x + Math.sin(time * .5 + i) * 5, top); c.stroke();
      c.fillStyle = '#79cbb8'; c.beginPath(); c.ellipse(x - 6, top + 20, 14, 5, -.6, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 6, top + 4, 14, 5, .6, 0, 7); c.fill();
    }
  }
  c.restore();
  c.fillStyle = '#0c2a3e'; c.fillRect(0, 478, w, 160); c.fillStyle = '#f3a3d6'; c.fillRect(0, 478, 7, 160);
  text(story.title[0], 34, 528, 38, '#f4fcff', 700); text(story.title[1], 34, 573, 38, '#f4fcff', 700);
  text(story.detail, 35, 614, 23, '#a6cadb');
  for (let i = 0; i < CITY_TV_STORIES.length; i++) { c.fillStyle = i === storyIndex ? '#76e5ed' : '#35586b'; c.fillRect(1096 + i * 37, 606, 26, 4); }
  c.fillStyle = '#84e9ef'; c.fillRect(0, 646, w, 50);
  const ticker = 'NORTH CITY  /  NIGHT MARKET OPEN   •   SKYRAIL: NEW NIGHT ROUTE   •   CENTRAL CHIP: HOLOGRAM SHOWCASE   •   ROOFTOP GARDEN EXCHANGE   •   ';
  c.font = '600 22px "Segoe UI", sans-serif'; const length = c.measureText(ticker).width;
  const offset = (time * 47) % length;
  text(ticker, -offset, 679, 22, '#092b3c', 600); text(ticker, length - offset, 679, 22, '#092b3c', 600);
}

export const CITY_TV_FRAGMENT = `
varying vec2 q; uniform float time; uniform int programme; uniform sampler2D graphics;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.57+noise(p*2.13+7.3)*.28+noise(p*4.27+1.8)*.15;}
vec3 aurora(vec2 p){
  float t=time*.06; vec3 col=mix(vec3(.008,.035,.073),vec3(.055,.18,.24),p.y);
  float curtain=sin(p.x*7.2+t+fbm(vec2(p.x*5.5,t))*3.6)*.12+.70;
  float veil=exp(-pow((p.y-curtain)/(.058+noise(vec2(p.x*18.,t))*.06),2.));
  veil*=smoothstep(.35,.9,p.y)*(.35+.65*fbm(vec2(p.x*32.,p.y*10.-t)));
  col+=mix(vec3(.07,.55,.66),vec3(.42,.18,.57),p.x)*veil;
  float moon=1.-smoothstep(.045,.048,length((p-vec2(.73,.73))*vec2(1.84,1.))); col+=vec3(.42,.60,.65)*moon;
  for(int i=0;i<4;i++){float k=float(i),h=.24+k*.045+fbm(vec2(p.x*(8.+k*3.)+k*7.,k))*(.05+k*.025);
    col=mix(col,vec3(.018+k*.012,.06+k*.014,.09+k*.022),(1.-smoothstep(h-.005,h+.004,p.y))*.8);}
  if(p.y<.27){float r=fbm(vec2(p.x*31.,p.y*130.-time*.3)); col=mix(vec3(.014,.072,.10),vec3(.08,.30,.36),r*.68);
    col+=vec3(.12,.26,.28)*exp(-pow((p.x-.73)/(.016+(.27-p.y)*.24),2.))*r*.5;}
  return col;
}
vec3 orbit(vec2 p){
  vec2 uv=(p-vec2(.56,.56))*vec2(1.84,1.);float r=length(uv);float phase=time*.065;
  vec3 col=vec3(.008,.014,.045)+vec3(.07,.025,.13)*fbm(p*4.+phase*.2);
  vec2 grid=p*vec2(190.,105.); float star=pow(hash(floor(grid)),70.)*(1.-smoothstep(.02,.13,length(fract(grid)-.5)));
  col+=vec3(.65,.82,1.)*star;
  float glow=exp(-pow((r-.245)/.03,2.));col+=vec3(.08,.28,.46)*glow;
  vec2 ring=mat2(.94,-.34,.34,.94)*uv;float rr=length(ring*vec2(1.,3.8));
  float rings=smoothstep(.32,.34,rr)*(1.-smoothstep(.48,.50,rr))*(.55+.45*sin(rr*370.));
  if(r>.245||ring.y<0.)col+=mix(vec3(.18,.42,.55),vec3(.56,.26,.42),rr*2.)*rings;
  if(r<.245){float z=sqrt(.245*.245-r*r)/.245;vec3 n=vec3(uv/.245,z);float light=max(.05,dot(n,normalize(vec3(-.6,.7,1.))));
    float bands=.5+.5*sin(p.y*110.+fbm(p*18.+vec2(phase,0.))*3.);col=mix(vec3(.12,.21,.35),vec3(.39,.59,.65),bands)*light;
    if(ring.y<0.)col+=vec3(.25,.36,.41)*rings;}
  vec2 moon=uv-vec2(cos(phase)*.62,sin(phase)*.22);col+=vec3(.6,.76,.85)*(1.-smoothstep(.019,.022,length(moon)));
  return col;
}
vec3 jellyfish(vec2 p){
  vec3 col=mix(vec3(.005,.018,.055),vec3(.015,.11,.18),p.y);
  for(int j=0;j<4;j++){float k=float(j),scale=j==0?1.:.50;vec2 center=j==0?vec2(.43,.66):vec2(.16+k*.23,.38+sin(k*2.)*.16);
    vec2 u=(p-center-vec2(sin(time*.22+k)*.022,sin(time*.4+k)*.025))*vec2(1.84,1.)/scale;
    float pulse=1.+sin(time*1.15+k)*.065;u.x/=pulse;
    float radius=length(u/vec2(.21,.14));float dome=exp(-pow((radius-1.)/.025,2.))*step(0.,u.y);
    float inner=(1.-smoothstep(.1,1.,radius))*step(0.,u.y)*.12;
    float lip=exp(-pow(u.y/.006,2.))*(1.-smoothstep(.19,.21,abs(u.x)));
    vec3 tint=mix(vec3(.12,.7,.85),vec3(.7,.18,.62),k/4.);col+=tint*(dome+inner+lip);
    if(u.y<0.&&u.y>-.40){for(int i=0;i<9;i++){float f=float(i),x=(f-4.)*.041+sin(u.y*19.+time*.9+f)*(.012-u.y*.065);
      float strand=exp(-pow((u.x-x)/.0025,2.))*smoothstep(-.40,-.22,u.y);
      float bead=exp(-pow((u.y+mod(time*.065+f*.045,.38))/.012,2.));col+=tint*strand*(.45+bead);}}
  }
  vec2 particles=p*vec2(90.,55.)+vec2(0.,time*.9);col+=vec3(.1,.3,.4)*pow(hash(floor(particles)),18.)*(1.-smoothstep(.02,.12,length(fract(particles)-.5)));
  return col;
}
vec3 city(vec2 p){
  vec3 col=mix(vec3(.018,.025,.065),vec3(.12,.07,.18),p.y);
  for(int layer=0;layer<3;layer++){float k=float(layer),x=p.x*(16.-k*4.)+k*4.;float id=floor(x),height=.32+hash(vec2(id,k))*(.28+k*.07);
    if(p.y<height&&p.y>.20&&fract(x)<.83){col=vec3(.012,.025,.055)*(1.+k*.35);
      vec2 g=vec2(fract(x)*5.,p.y*75.);float lit=step(.37,hash(floor(g)+vec2(id*5.,k*23.)));
      float window=step(.25,fract(g.x))*step(fract(g.x),.63)*step(.2,fract(g.y))*step(fract(g.y),.60);
      col+=mix(vec3(.08,.42,.57),vec3(.62,.15,.43),hash(vec2(id,k)))*window*lit;
      col+=vec3(.08,.45,.62)*exp(-pow((fract(x)-.80)/.012,2.))*.45;}}
  float trafficY=.28+sin(p.x*3.)*.025;float traffic=exp(-pow((p.y-trafficY)/.003,2.))*pow(.5+.5*sin(p.x*46.-time*1.2),12.);
  col+=vec3(.8,.17,.46)*traffic;
  if(p.y<.2)col=vec3(.02,.035,.07)+mix(vec3(.04,.38,.52),vec3(.48,.08,.28),.5+.5*sin(p.x*36.))*fbm(vec2(p.x*28.,p.y*180.-time*.7))*.6;
  vec2 rain=p*vec2(150.,25.)+vec2(time*.15,time*2.);float streak=step(.985,fract(rain.x))*step(.7,hash(floor(rain)))*smoothstep(0.,.8,fract(rain.y));
  col+=vec3(.18,.28,.38)*streak;return col;
}
void main(){
  vec3 col=vec3(0.);if(programme==0)col=aurora(q);else if(programme==1)col=orbit(q);else if(programme==2)col=jellyfish(q);else if(programme==3)col=city(q);
  vec4 overlay=texture2D(graphics,q);col=mix(col*1.45,overlay.rgb,overlay.a);
  float edge=smoothstep(0.,.008,q.x)*(1.-smoothstep(.992,1.,q.x))*smoothstep(0.,.012,q.y)*(1.-smoothstep(.988,1.,q.y));
  float scan=.98+.02*sin(q.y*1600.-time*.4);gl_FragColor=vec4(col*scan,(programme==4?.96:.88)*edge);
}`;
