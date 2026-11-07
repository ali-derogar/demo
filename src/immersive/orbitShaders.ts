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
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vec3 image = texture2D(uImage, vUv).rgb;
    float luminance = dot(image, vec3(.2126, .7152, .0722));
    image = mix(vec3(luminance), image, .58 + uFocus * .42);
    image *= .48 + uFocus * .52;
    float edge = smoothstep(.985, 1.0, max(abs(vUv.x - .5) * 2.0, abs(vUv.y - .5) * 2.0));
    vec3 color = mix(image, uAccent * (.45 + uFocus * .5), edge * .7);
    float sheen = pow(max(0.0, 1.0 - abs(vUv.x - .45) * 2.0), 6.0) * uHover * .06;
    color += vec3(.8, .9, 1.0) * sheen;
    color *= 1.0 - vEdge * .09;
    if (!gl_FrontFacing) color *= .2;
    if (uReveal < .005) discard;
    color = mix(vec3(.025, .04, .045), color, uLoaded);
    if (uEncodeOutput > .5) color = pow(max(color, .0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, uReveal);
  }
`;
