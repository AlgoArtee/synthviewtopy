// Adapted from the user-owned MizuTopia project (NatureSimTopy/MizuTopia/src).
// Keep the shared surf model and Cygnus animation in sync when updating the source.
export const skyFragmentShader = /* glsl */`
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDirection;
  uniform float uCloud;
  uniform float uTime;
  uniform float uDaylight;
  uniform float uUnderwater;
  uniform float uDepth;
  uniform vec3 uWaterColor;
  varying vec3 vDirection;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    return noise(p)*.53 + noise(p*2.03+7.2)*.27 + noise(p*4.07-3.4)*.13 + noise(p*8.13)*.07;
  }
  void main() {
    vec3 dir = normalize(vDirection);
    float altitude = max(0.0, dir.y);
    // Warm aerosol scattering stays close to the horizon. The zenith keeps
    // the actual time-of-day color instead of a permanent daylight wash.
    float haze = exp(-altitude * 10.0);
    vec3 color = mix(uTop, uHorizon, haze * .92);
    color += uTop * exp(-altitude * 2.0) * .25;
    float sunCos = max(0.0, dot(dir, uSunDirection));
    float sun = smoothstep(.99993, .99996, sunCos) * 5.0;
    float glow = pow(sunCos, 100.0) * .18 + pow(sunCos, 12.0) * .035;
    color += mix(vec3(1,.43,.14), vec3(1,.96,.85), smoothstep(.05,.5,uSunDirection.y))
      * (sun+glow) * smoothstep(.12,.5,uDaylight) * (1.0-uCloud*.86);
    vec2 skyUV = vec2(atan(dir.z,dir.x), asin(clamp(dir.y,-1.0,1.0)));
    float night = 1.0 - smoothstep(.28,.88,uDaylight);
    vec2 starGrid = skyUV * 520.0;
    vec2 cell = floor(starGrid);
    vec2 starPoint = vec2(hash(cell+3.0),hash(cell+91.0));
    float starDistance = length(fract(starGrid)-starPoint);
    float starAA = max(.025, length(fwidth(starGrid))*.35);
    float stars = (1.0-smoothstep(.015,.015+starAA,starDistance)) * step(.985,hash(cell));
    float band = (skyUV.y-sin(skyUV.x+.8)*.32-.52)*4.0;
    float milkyWay = pow(fbm(skyUV*vec2(2.0,6.0)+7.0),3.0) * exp(-band*band);
    color += (stars * vec3(.75,.86,1.0)*1.8 + milkyWay*vec3(.014,.019,.035))
      * night * (1.0-uCloud) * smoothstep(.015,.16,altitude);
    vec2 cloudUV = dir.xz / max(.07, altitude+.07) * 2.4;
    cloudUV += vec2(uTime*.006,uTime*.002);
    float cloud = fbm(cloudUV + fbm(cloudUV*.4)*2.0);
    float cover = smoothstep(.68-uCloud*.30,.82-uCloud*.27,cloud);
    cover *= smoothstep(.005,.055,altitude);
    vec3 cloudColor = mix(uTop*.65, uHorizon*.38, exp(-altitude*6.0));
    cloudColor += vec3(.34,.36,.37) * uDaylight * (1.0-uCloud*.74)
      * smoothstep(.65,.9,cloud) * .38;
    color = mix(color,cloudColor,cover*(.45+uCloud*.5));
    if (uUnderwater > .5) {
      color = mix(vec3(.012,.15,.18), uWaterColor*.58, .45)
        * (.12+uDaylight*.88) * exp(-uDepth*.006);
    }
    gl_FragColor = vec4(max(color,vec3(0)),1);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
