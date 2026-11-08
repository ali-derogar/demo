export const projectSurfaceVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, .999, 1.0); }
`;
export const projectSurfaceFragment = /* glsl */ `
  uniform sampler2D uImage;
  uniform sampler2D uFlow;
  uniform float uFlowReady;
  uniform float uTime;
  uniform float uReveal;
  uniform float uLoaded;
  uniform float uEncodeOutput;
  uniform float uDetail;
  uniform vec3 uAccent;
  uniform vec4 uFrame;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 cell = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y);
  }
  void main() {
    vec2 wake = texture2D(uFlow, vUv).xy * uFlowReady;
    wake /= max(1.0, length(wake));
    vec2 p = vUv + wake * .012;
    // Broad color reflections, rather than recognizable tiled copies of the photograph.
    vec3 paletteA = texture2D(uImage, vec2(.2, .25)).rgb;
    vec3 paletteB = texture2D(uImage, vec2(.8, .75)).rgb;
    vec3 paletteC = texture2D(uImage, vec2(.5, .45)).rgb;
    vec3 media = mix(mix(paletteA, paletteB, p.x), paletteC, .35 + .15 * sin(p.y * 4.0));
    vec2 edge = abs(vUv - .5) * 2.0;
    float perimeter = smoothstep(.35, 1.0, max(edge.x, edge.y));
    float facets = noise(p * 96.0 + uTime * .015);
    if (uDetail > .5) facets = facets * .7 + noise(p * 37.0) * .3;
    vec3 normal = normalize(vec3(-vec2(dFdx(facets), dFdy(facets)) * 70.0, 1.0));
    float glint = pow(max(0.0, dot(normal, normalize(vec3(-.4, .6, 1.0)))), 24.0);
    float mist = .5 + .5 * sin(p.x * 6.0 + p.y * 5.0 + uTime * .06);
    vec3 color = vec3(.001, .003, .004) + mix(uAccent, media, uLoaded * .8) * (.008 + perimeter * .018);
    color += mix(vec3(.1, .25, .28), media, uLoaded * .65) * perimeter * glint * (.045 + length(wake) * .12);
    color += vec3(.008, .028, .03) * pow(perimeter, 3.0) * mist;
    color *= 1.0 - (1.0 - smoothstep(.22, .35, vUv.x)) * (1.0 - smoothstep(.5, .7, vUv.y)) * .65;
    if (uEncodeOutput > .5) color = pow(max(color, .0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, uReveal);
  }
`;
export const projectParticlesVertex = /* glsl */ `
  attribute vec2 aSample;
  attribute float aSeed;
  uniform sampler2D uImage;
  uniform sampler2D uFlow;
  uniform float uFlowReady;
  uniform float uTime;
  uniform float uReveal;
  uniform float uDpr;
  uniform float uLoaded;
  uniform vec2 uExtent;
  uniform vec4 uFrame;
  uniform vec3 uAccent;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 screen = (aSample - .5) * 2.7;
    screen.x += .2;
    screen += vec2(sin(aSeed * 419.0), cos(aSeed * 317.0)) * .075;
    vec2 screenUv = clamp(screen * .5 + .5, .001, .999);
    vec2 wake = texture2D(uFlow, screenUv).xy * uFlowReady;
    wake /= max(1.0, length(wake));
    float depth = 5.9 + aSeed * 3.0;
    vec3 p = vec3(screen * uExtent * depth, -depth);
    p.xy += vec2(sin(aSeed * 41.0 + uTime * .13), cos(aSeed * 53.0 + uTime * .09)) * .06;
    p.xy += wake * .28;
    p.z += sin(aSeed * 77.0 + uTime * .15) * .1;
    vec3 media = texture2D(uImage, aSample).rgb;
    vColor = mix(uAccent * .3, media, uLoaded) * (.12 + aSeed * .5);
    vec2 relative = (screenUv - uFrame.xy) / max(uFrame.zw, vec2(.01));
    float center = step(.03, relative.x) * step(relative.x, .97) * step(.03, relative.y) * step(relative.y, .97);
    float edge = smoothstep(.2, .95, length(screen));
    float metadata = (1.0 - smoothstep(.2, .34, screenUv.x)) * (1.0 - smoothstep(.5, .7, screenUv.y));
    float cluster = .3 + .7 * pow(.5 + .5 * sin(screen.y * 21.0 + sin(screen.x * 15.0) * 2.0), 3.0);
    vAlpha = uReveal * (1.0 - center) * edge * (.025 + aSeed * .18) * cluster * (1.0 - metadata * .8);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((.7 + aSeed * 1.8 + length(wake)) * uDpr * 6.0 / max(1.0, -mv.z), 1.0, 4.0);
  }
`;
export const projectParticlesFragment = /* glsl */ `
  uniform float uEncodeOutput;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 p = abs(gl_PointCoord - .5) * 2.0;
    float shape = max(p.x, p.y);
    if (shape > .95 || vAlpha < .001) discard;
    vec3 color = vColor * (.6 + .4 * gl_PointCoord.y);
    if (uEncodeOutput > .5) color = pow(max(color, .0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, vAlpha * (1.0 - smoothstep(.6, 1.0, shape)));
  }
`;
