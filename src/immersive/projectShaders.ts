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
  uniform vec3 uAccent;
  uniform vec4 uFrame;
  varying vec2 vUv;
  void main() {
    vec2 wake = texture2D(uFlow, vUv).xy * uFlowReady;
    wake /= max(1.0, length(wake));
    vec2 p = vUv + wake * .012;
    vec2 mediaUv = (p - uFrame.xy) / max(uFrame.zw, vec2(.01));
    vec2 mirrorUv = abs(fract(mediaUv * .5) * 2.0 - 1.0);
    vec3 media = texture2D(uImage, clamp(mirrorUv, .005, .995)).rgb;
    vec2 edge = abs(vUv - .5) * 2.0;
    float perimeter = smoothstep(.35, 1.0, max(edge.x, edge.y));
    float facets = sin(p.x * 139.0 + sin(p.y * 79.0) * 1.8 + uTime * .04)
      * cos(p.y * 121.0 + sin(p.x * 91.0) * 1.9 - uTime * .025);
    float glint = pow(abs(facets), 18.0);
    float mist = .5 + .5 * sin(p.x * 6.0 + p.y * 5.0 + uTime * .06);
    vec3 color = vec3(.003, .008, .01) + mix(uAccent, media, uLoaded * .8) * (.035 + perimeter * .09);
    color += mix(vec3(.15, .35, .36), media, uLoaded * .65) * perimeter * glint * (.12 + length(wake) * .3);
    color += vec3(.04, .1, .12) * pow(perimeter, 3.0) * mist;
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
    vec2 screenUv = clamp(screen * .5 + .5, .001, .999);
    vec2 wake = texture2D(uFlow, screenUv).xy * uFlowReady;
    wake /= max(1.0, length(wake));
    float depth = 5.9 + aSeed * 3.0;
    vec3 p = vec3(screen * uExtent * depth, -depth);
    p.xy += vec2(sin(aSeed * 41.0 + uTime * .13), cos(aSeed * 53.0 + uTime * .09)) * .06;
    p.xy += wake * .28;
    p.z += sin(aSeed * 77.0 + uTime * .15) * .1;
    vec3 media = texture2D(uImage, aSample).rgb;
    vColor = mix(uAccent * .3, media, uLoaded) * (.35 + aSeed * .8);
    vec2 relative = (screenUv - uFrame.xy) / max(uFrame.zw, vec2(.01));
    float center = step(.03, relative.x) * step(relative.x, .97) * step(.03, relative.y) * step(relative.y, .97);
    float edge = smoothstep(.2, .95, length(screen));
    float metadata = (1.0 - smoothstep(.2, .34, screenUv.x)) * (1.0 - smoothstep(.5, .7, screenUv.y));
    vAlpha = uReveal * (1.0 - center) * edge * (.14 + aSeed * .48) * (1.0 - metadata * .8);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((1.0 + aSeed * 2.6 + length(wake)) * uDpr * 6.0 / max(1.0, -mv.z), 1.0, 5.0);
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
