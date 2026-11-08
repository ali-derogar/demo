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
    // Glaze the existing world; leave its sculpture, haze and particles visible.
    gl_FragColor = vec4(color, uReveal * (.08 + perimeter * .3));
  }
`;
