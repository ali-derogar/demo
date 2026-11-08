import { ORBIT_HOVER_BEND, ORBIT_SPEED_BEND } from './orbit';

export const orbitVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uSpeed;
  uniform float uFlatten;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.x = mix(p.x, asin(clamp(p.x / 12.0, -1.0, 1.0)) * 12.0, uFlatten);
    p.z *= 1.0 - uFlatten;
    p.z += sin(uv.x * 6.283 + uTime * 2.0) * sin(uv.y * 3.14159) * uHover * ${ORBIT_HOVER_BEND.toFixed(3)} * (1.0 - uFlatten);
    p.z += sin(uv.x * 3.14159) * (uv.y - .5) * clamp(uSpeed, -3.0, 3.0) * ${ORBIT_SPEED_BEND.toFixed(3)} * (1.0 - uFlatten);
    vEdge = abs(uv.x - .5) * 2.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const orbitFragment = /* glsl */ `
  uniform sampler2D uImage;
  uniform float uReveal;
  uniform float uEncodeOutput;
  uniform float uLoaded;
  uniform float uFocus;
  uniform float uHover;
  uniform vec3 uAccent;
  uniform float uSelected;
  uniform float uPresentation;
  uniform float uImageAspect;
  uniform float uFrameAspect;
  uniform float uTime;
  uniform sampler2D uFlow;
  uniform float uFlowReady;
  uniform vec2 uMediaSize;
  uniform vec2 uCssSize;
  uniform sampler2D uBackdrop;
  uniform float uBackdropReady;
  uniform vec2 uViewSize;
  uniform sampler2D uTitle;
  uniform float uTitleReady;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vec2 corner = abs(vUv - .5) - vec2(.445);
    float frame = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - .055;
    if (frame > .001) discard;
    float coverage = 1.0 - smoothstep(-.002, .001, frame);
    vec2 refractUv = gl_FragCoord.xy / max(uViewSize, vec2(1.0));
    vec2 lens = (vUv - .5) * (vec2(.5) - abs(vUv - .5)) * .08;
    vec2 sampleUv = clamp(refractUv + lens, .002, .998);
    vec3 background = texture2D(uBackdrop, sampleUv).rgb * .4;
    background += texture2D(uBackdrop, clamp(sampleUv + vec2(.004, .002), .002, .998)).rgb * .3;
    background += texture2D(uBackdrop, clamp(sampleUv - vec2(.004, .002), .002, .998)).rgb * .3;
    background = mix(uAccent * .035, background, uBackdropReady);
    vec2 wake = texture2D(uFlow, refractUv).xy * uFlowReady;
    wake /= max(1.0, length(wake));
    vec2 crop = vec2(min(1.0, uFrameAspect / uImageAspect), min(1.0, uImageAspect / uFrameAspect));
    vec2 imageUv = (vUv - .5) * crop + .5;
    imageUv -= wake * 12.0 / max(uMediaSize, vec2(1.0)) * uPresentation;
    imageUv = clamp(imageUv, .001, .999);
    vec3 image = texture2D(uImage, imageUv).rgb;
    vec2 chroma = wake * 2.0 / max(uMediaSize, vec2(1.0)) * uPresentation;
    image.r = texture2D(uImage, clamp(imageUv + chroma, .001, .999)).r;
    image.b = texture2D(uImage, clamp(imageUv - chroma, .001, .999)).b;
    float luminance = dot(image, vec3(.2126, .7152, .0722));
    image = mix(vec3(luminance), image, .58 + uFocus * .42);
    image *= .58 + uFocus * .4;
    float edge = 1.0 - smoothstep(.0, .014, -frame);
    float sheenBand = pow(max(0.0, 1.0 - abs(vUv.x + vUv.y * .42 - .48) * 2.0), 7.0);
    vec3 glass = background * .9 + mix(vec3(.015, .018, .025), uAccent * .09, .5);
    vec3 color = mix(glass, image, uLoaded * mix(.38 + uFocus * .56, 1.0, uPresentation));
    color += vec3(.6, .7, .82) * sheenBand * .022;
    color += mix(vec3(.28, .36, .42), uAccent, .38) * edge * (.12 + uFocus * .12);
    float sheen = pow(max(0.0, 1.0 - abs(vUv.x - .45) * 2.0), 6.0) * uHover * .06;
    color += vec3(.8, .9, 1.0) * sheen;
    // A single soft sweep follows the selection progress, then settles to a rim.
    float sweep = exp(-pow((vUv.x - mix(-.2, 1.2, uSelected)) * 15.0, 2.0));
    color += vec3(.75, .87, 1.0) * sweep * sin(uSelected * 3.14159) * .13;
    color += uAccent * edge * uSelected * .28;
    color *= 1.0 - vEdge * .09;
    color *= 1.0 - exp(-pow((vUv.y - .5) * 3.0, 2.0)) * uTitleReady * .32 * (1.0 - uPresentation);
    if (!gl_FrontFacing) color *= .2;
    if (uReveal < .005) discard;
    vec4 title = texture2D(uTitle, vUv);
    color = mix(color, title.rgb, title.a * uTitleReady * (.6 + uFocus * .4) * (1.0 - uPresentation));
    if (uEncodeOutput > .5) color = pow(max(color, .0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, uReveal * coverage);
  }
`;
