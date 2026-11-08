import { Vector2, Vector4 } from 'three';
import type { PointerState } from '../lib/raf';

/** A single damped cursor field; displacement of individual stars stays on the GPU. */
export function createStarPointer() {
  const pointer = new Vector4(0, 0, 120, 0);
  const viewport = new Vector2(1, 1);
  let initialized = false;
  return {
    pointer, viewport,
    update(input: PointerState, width: number, height: number, dt: number, enabled: boolean) {
      viewport.set(Math.max(1, width), Math.max(1, height));
      pointer.z = Math.max(90, Math.min(150, Math.min(width, height) * .18));
      const active = enabled && input.active;
      const ease = 1 - Math.exp(-Math.max(0, Math.min(dt, .064)) * 10);
      if (active) {
        const x = Math.max(0, Math.min(width, input.x));
        const y = Math.max(0, Math.min(height, height - input.y));
        if (!initialized) { pointer.x = x; pointer.y = y; initialized = true; }
        else { pointer.x += (x - pointer.x) * ease; pointer.y += (y - pointer.y) * ease; }
      }
      pointer.w += ((active ? 1 : 0) - pointer.w) * ease;
    },
  };
}

export const projectStarField = /* glsl */ `
  uniform float uProjectMix;
  uniform vec4 uProjectFrame;
  uniform vec2 uProjectExtent;
  uniform float uProjectDepth;
  uniform vec4 uStarPointer;
  uniform vec2 uStarViewport;

  vec3 projectStarPosition(vec4 seed, float time) {
    float angle = seed.x * 6.2831853 + time * (.12 + seed.w * .045);
    vec2 direction = vec2(cos(angle), sin(angle));
    direction = sign(direction) * pow(abs(direction), vec2(.55));
    float radius = .47 + pow(seed.z, 1.8) * .32;
    vec2 uv = uProjectFrame.xy + uProjectFrame.zw * .5 + direction * uProjectFrame.zw * radius;
    uv += vec2(sin(time * .7 + seed.y * 31.0), cos(time * .6 + seed.w * 41.0)) * .005;

    vec2 delta = uv * uStarViewport - uStarPointer.xy;
    float distanceToMouse = length(delta);
    vec2 away = distanceToMouse > .01 ? delta / distanceToMouse : vec2(cos(seed.w * 6.283), sin(seed.w * 6.283));
    float influence = 1.0 - smoothstep(0.0, max(1.0, uStarPointer.z), distanceToMouse);
    float push = influence * influence * 110.0 * uStarPointer.w;
    vec2 tangent = vec2(-away.y, away.x) * sin(seed.y * 6.283 + time * .8) * .22;
    uv += (away + tangent) * push / max(uStarViewport, vec2(1.0));

    float depth = max(5.8, uProjectDepth + .8) + seed.y * 3.8;
    return vec3((uv * 2.0 - 1.0) * uProjectExtent * depth, -depth);
  }
`;
