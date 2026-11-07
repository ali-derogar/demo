/** Original motion shaders; no reference-site code or visual assets are reused. */
export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const shapeField = /* glsl */ `
  const float TAU = 6.28318530718;
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  vec4 seeds(vec2 id) {
    return vec4(hash21(id), hash21(id + 2.7), hash21(id + 7.2), hash21(id + 13.8));
  }
  mat2 turn(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
  }
  vec3 currentField(vec3 p, float t) {
    return vec3(
      sin(p.y * 1.1 + t) + cos(p.z * 1.3 - t * .7),
      sin(p.z * 1.3 + t * .8) + cos(p.x * 1.2 - t),
      sin(p.x * 1.2 + t * .7) + cos(p.y * 1.1 - t * .8)
    );
  }
  vec3 flowShape(vec2 id, float t, float chapter) {
    vec4 s = seeds(id);
    float lane = step(.5, s.y);
    float across = fract(s.y * 2.0) * 2.0 - 1.0;
    float phase = s.x * TAU + t * (.28 + s.w * .06);
    float cs = cos(phase);
    float sn = sin(phase);
    // Two living strands emerge beneath the medallion and weave downward.
    float side = lane * 2.0 - 1.0;
    vec3 portal = vec3(
      side * (.45 + .8 * cs) + sn * .6,
      -1.15 - (1.0 - cs) * 2.2,
      side * sn * .65 + cos(phase * 2.0 + t * .25) * .18
    );
    float twist = phase * 3.0 - t * .45 + lane * 3.14;
    portal.x += sin(phase * 2.0 + t * .32) * .18;
    portal.xy += across * vec2(cos(twist), sin(twist)) * .12;
    portal.z += across * sin(twist) * .16;
    portal += (s.z - .5) * .055;

    float spiral = phase + across * 3.5;
    vec3 vortex = vec3(
      cos(spiral) * (1.9 + s.z * .5),
      across * 4.5,
      sin(spiral) * (1.9 + s.z * .5)
    );
    vortex.xy = turn(-.35) * vortex.xy;
    float latitude = across * .9;
    float radius = sqrt(max(.01, 1.0 - latitude * latitude)) * 2.8;
    vec3 orbit = vec3(cos(phase) * radius, latitude * 2.8, sin(phase) * radius);
    orbit += normalize(orbit + .001) * sin(phase * 4.0 + t) * .18;
    orbit.yz = turn(.45) * orbit.yz;
    vec3 closing = portal;
    closing.xy = turn(sin(t * .15) * .12) * closing.xy;
    closing *= 1.04;
    if (chapter < 1.0) return mix(portal, vortex, smoothstep(.12, 1.0, chapter));
    if (chapter < 2.0) return mix(vortex, orbit, smoothstep(0.0, 1.0, chapter - 1.0));
    return mix(orbit, closing, smoothstep(0.0, 1.0, chapter - 2.0));
  }
`;

export const velocityStep = /* glsl */ `
  uniform float uTime;
  uniform float uDelta;
  uniform float uChapter;
  uniform float uEnergy;
  uniform vec3 uPointer;
  uniform vec3 uPointerVelocity;
  uniform vec4 uPulse;
  ${shapeField}
  void main() {
    vec2 id = gl_FragCoord.xy / resolution.xy;
    vec3 p = texture2D(texturePosition, id).xyz;
    vec3 velocity = texture2D(textureVelocity, id).xyz;
    vec3 target = flowShape(id, uTime, uChapter);
    vec3 force = (target - p) * 16.0;
    force += currentField(p * .75, uTime * .42) * (.7 + uEnergy * .8);
    vec2 away = p.xy - uPointer.xy;
    float falloff = exp(-dot(away, away) / 2.8);
    force.xy += normalize(away + .001) * falloff * (2.0 + uEnergy * 12.0);
    force += uPointerVelocity * falloff * 2.3;
    float age = uTime - uPulse.z;
    vec2 pulseAway = p.xy - uPulse.xy;
    float wave = exp(-pow(length(pulseAway) - age * 5.0, 2.0) * 4.0);
    wave *= exp(-max(age, 0.0) * 1.7) * step(0.0, age) * uPulse.w;
    force.xy += normalize(pulseAway + .001) * wave * 28.0;
    velocity = (velocity + force * uDelta) * exp(-4.1 * uDelta);
    float speed = length(velocity);
    velocity *= min(1.0, 11.0 / max(speed, .001));
    gl_FragColor = vec4(velocity, 1.0);
  }
`;

export const positionStep = /* glsl */ `
  uniform float uDelta;
  void main() {
    vec2 id = gl_FragCoord.xy / resolution.xy;
    vec3 p = texture2D(texturePosition, id).xyz;
    vec3 v = texture2D(textureVelocity, id).xyz;
    gl_FragColor = vec4(p + v * uDelta, 1.0);
  }
`;

export const particleVertex = /* glsl */ `
  attribute vec2 aLookup;
  uniform sampler2D uPositions;
  uniform float uSimulation;
  uniform float uTime;
  uniform float uChapter;
  uniform float uDpr;
  uniform float uReveal;
  uniform vec3 uPointer;
  varying vec3 vColor;
  varying float vAlpha;
  ${shapeField}
  void main() {
    vec4 s = seeds(aLookup);
    vec3 p;
    if (uSimulation > .5) {
      p = texture2D(uPositions, aLookup).xyz;
    } else {
      p = flowShape(aLookup, uTime, uChapter);
      vec2 away = p.xy - uPointer.xy;
      p.xy += normalize(away + .001) * exp(-dot(away, away) / 3.0) * .8;
      p += currentField(p, uTime * .4) * .08;
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((1.45 + s.z * 1.8) * uDpr * 10.0 / max(1.0, -mv.z), 1.0, 6.0);
    vec3 silver = vec3(.28, .82, .58);
    vec3 amber = vec3(.6, .56, .92);
    float warmth = smoothstep(.58, .95, s.w + sin(uTime * .12 + s.x * 6.0) * .12);
    vColor = mix(silver, amber, warmth) * (1.1 + s.z * .7);
    vAlpha = (.4 + s.y * .6) * uReveal * exp(-max(-mv.z - 10.0, 0.0) * .035);
  }
`;

export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - .5);
    if (radius > .5) discard;
    float core = exp(-radius * radius * 28.0);
    float halo = exp(-radius * radius * 8.0) * .16;
    gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
  }
`;

export const fluidStep = /* glsl */ `
  uniform sampler2D uPrevious;
  uniform vec2 uTexel;
  uniform vec2 uPointer;
  uniform vec2 uPreviousPointer;
  uniform vec2 uVelocity;
  uniform float uDelta;
  uniform float uAspect;
  uniform float uActive;
  uniform float uBurst;
  varying vec2 vUv;
  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 d = b - a;
    return length(p - a - d * clamp(dot(p - a, d) / max(dot(d, d), .00001), 0.0, 1.0));
  }
  void main() {
    vec3 old = texture2D(uPrevious, vUv).rgb;
    vec2 sampleUv = clamp(vUv - old.xy * uDelta * .22, uTexel, 1.0 - uTexel);
    vec3 flow = texture2D(uPrevious, sampleUv).rgb;
    vec2 left = texture2D(uPrevious, sampleUv - vec2(uTexel.x, 0.0)).xy;
    vec2 right = texture2D(uPrevious, sampleUv + vec2(uTexel.x, 0.0)).xy;
    vec2 down = texture2D(uPrevious, sampleUv - vec2(0.0, uTexel.y)).xy;
    vec2 up = texture2D(uPrevious, sampleUv + vec2(0.0, uTexel.y)).xy;
    float curl = (right.y - left.y) - (up.x - down.x);
    flow.xy += vec2(-flow.y, flow.x) * curl * uDelta * 4.0;
    flow.xy *= exp(-uDelta * 1.7);
    flow.z *= exp(-uDelta * 1.2);
    vec2 aspect = vec2(uAspect, 1.0);
    float distanceToStroke = segmentDistance(vUv * aspect, uPreviousPointer * aspect, uPointer * aspect);
    float brush = exp(-distanceToStroke * distanceToStroke / .0018) * uActive;
    float speed = min(length(uVelocity), 2.0);
    flow.xy += uVelocity * brush * uDelta * 7.0;
    flow.z += brush * (speed * 2.0 + uBurst * 1.7) * uDelta * 10.0;
    flow.z = min(flow.z, 1.7);
    flow.xy = clamp(flow.xy, vec2(-2.0), vec2(2.0));
    gl_FragColor = vec4(flow, 1.0);
  }
`;

export const flowComposite = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D uFlow;
  uniform float uTime;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    vec3 field = texture2D(uFlow, vUv).rgb;
    vec2 displacement = field.xy * .018 * uStrength;
    vec2 uv = clamp(vUv - displacement, .001, .999);
    vec3 color = texture2D(tDiffuse, uv).rgb;
    color.r = texture2D(tDiffuse, clamp(uv + displacement * .18, .001, .999)).r;
    color.b = texture2D(tDiffuse, clamp(uv - displacement * .18, .001, .999)).b;
    float mist = sin(vUv.x * 17.0 + vUv.y * 11.0 + uTime * .65 + field.z * 4.0) * .5 + .5;
    color += mix(vec3(.08, .3, .18), vec3(.23, .14, .36), mist) * field.z * .07 * uStrength;
    float vignette = 1.0 - smoothstep(.3, .85, length((vUv - .5) * vec2(.9, 1.0))) * .35;
    gl_FragColor = vec4(color * vignette, 1.0);
  }
`;
