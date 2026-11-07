export const orbitVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uSpeed;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(uv.x * 6.283 + uTime * 2.0) * sin(uv.y * 3.14159) * uHover * .055;
    p.z += sin(uv.x * 3.14159) * (uv.y - .5) * clamp(uSpeed, -3.0, 3.0) * .11;
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
    vec2 imageUv = (vUv - .5) * .94 + .5;
    vec3 image = texture2D(uImage, imageUv).rgb;
    float luminance = dot(image, vec3(.2126, .7152, .0722));
    image = mix(vec3(luminance), image, .58 + uFocus * .42);
    image *= .42 + uFocus * .36;
    float edge = 1.0 - smoothstep(.0, .014, -frame);
    float sheenBand = pow(max(0.0, 1.0 - abs(vUv.x + vUv.y * .42 - .48) * 2.0), 7.0);
    vec3 glass = background * .9 + mix(vec3(.015, .018, .025), uAccent * .09, .5);
    vec3 color = mix(glass, image, uLoaded * (.48 + uFocus * .24));
    color += vec3(.6, .7, .82) * sheenBand * .045;
    color += mix(vec3(.28, .36, .42), uAccent, .38) * edge * (.18 + uFocus * .18);
    float sheen = pow(max(0.0, 1.0 - abs(vUv.x - .45) * 2.0), 6.0) * uHover * .06;
    color += vec3(.8, .9, 1.0) * sheen;
    // A single soft sweep follows the selection progress, then settles to a rim.
    float sweep = exp(-pow((vUv.x - mix(-.2, 1.2, uSelected)) * 15.0, 2.0));
    color += vec3(.75, .87, 1.0) * sweep * sin(uSelected * 3.14159) * .13;
    color += uAccent * edge * uSelected * .28;
    color *= 1.0 - vEdge * .09;
    color *= 1.0 - exp(-pow((vUv.y - .5) * 3.0, 2.0)) * uTitleReady * .72;
    if (!gl_FrontFacing) color *= .2;
    if (uReveal < .005) discard;
    vec4 title = texture2D(uTitle, vUv);
    color = mix(color, title.rgb, title.a * uTitleReady * (.6 + uFocus * .4));
    if (uEncodeOutput > .5) color = pow(max(color, .0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, uReveal * coverage);
  }
`;
