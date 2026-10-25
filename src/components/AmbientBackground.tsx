import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { getPointer, onResize, subscribeRaf } from '../lib/raf';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / (0.5 * u_res.y);
  float t = u_time * 0.05;
  vec2 q = p * 1.4 + vec2(t, -t * 0.6) + u_pointer * 0.18;
  float n = fbm(q + fbm(q * 1.7) * 0.6);
  vec3 col = vec3(0.02, 0.03, 0.06);
  col += vec3(0.37, 0.95, 1.0) * pow(n, 3.0) * 0.5;
  col += vec3(0.66, 0.55, 0.94) * pow(1.0 - n, 2.5) * 0.26;
  col += vec3(1.0, 0.18, 0.53) * pow(fbm(q.yx * 1.3 - t), 4.0) * 0.2;
  vec2 g = abs(fract(p * 6.0) - 0.5);
  float grid = smoothstep(0.5, 0.47, max(g.x, g.y));
  col += vec3(0.3, 0.6, 1.0) * grid * 0.018;
  col *= smoothstep(1.7, 0.25, length(p));
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * پس‌زمینه‌ی محیطی: یک لایه‌ی شیدر WebGL (نِبیولا/گرید) + یک لایه‌ی کانواس ذرات.
 * هر دو از یک حلقه‌ی rAF مشترک تغذیه می‌شوند؛ بدون WebGL به گرادیان CSS بدنه برمی‌گردد.
 */
export function AmbientBackground() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const glCanvas = glRef.current;
    const dotCanvas = dotRef.current;
    if (!glCanvas || !dotCanvas) return;

    const ctx = dotCanvas.getContext('2d');
    let particles: Particle[] = [];

    const sizeDots = () => {
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = dotCanvas.clientWidth;
      const h = dotCanvas.clientHeight;
      dotCanvas.width = Math.max(1, Math.floor(w * dpr));
      dotCanvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.max(40, Math.floor((w * h) / 16000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const drawDots = () => {
      if (!ctx) return;
      const w = dotCanvas.clientWidth;
      const h = dotCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const pointer = getPointer();
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140 && dist > 1) {
            p.x += (dx / dist) * 0.25;
            p.y += (dy / dist) * 0.25;
          }
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 118) {
            ctx.strokeStyle = `rgba(169, 140, 240, ${(1 - dist / 118) * 0.28})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.fillStyle = 'rgba(120, 226, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    sizeDots();

    // ---- WebGL shader layer ----
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uPointer: WebGLUniformLocation | null = null;
    let buffer: WebGLBuffer | null = null;
    const start = performance.now();

    const setupGL = () => {
      gl =
        (glCanvas.getContext('webgl', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' }) as WebGLRenderingContext | null) ||
        (glCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      if (!gl) return;
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return;
      program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        program = null;
        return;
      }
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uTime = gl.getUniformLocation(program, 'u_time');
      uRes = gl.getUniformLocation(program, 'u_res');
      uPointer = gl.getUniformLocation(program, 'u_pointer');
      gl.clearColor(0, 0, 0, 0);
      sizeGL();
    };

    const sizeGL = () => {
      if (!gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(glCanvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(glCanvas.clientHeight * dpr));
      if (glCanvas.width !== w || glCanvas.height !== h) {
        glCanvas.width = w;
        glCanvas.height = h;
      }
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    };

    const drawGL = (time: number) => {
      if (!gl || !program) return;
      const pointer = getPointer();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      if (uTime) gl.uniform1f(uTime, time);
      if (uRes) gl.uniform2f(uRes, glCanvas.width, glCanvas.height);
      if (uPointer) gl.uniform2f(uPointer, pointer.nx, pointer.ny);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      program = null;
    };
    const onContextRestored = () => setupGL();

    setupGL();
    glCanvas.addEventListener('webglcontextlost', onContextLost);
    glCanvas.addEventListener('webglcontextrestored', onContextRestored);

    const handleResize = () => {
      sizeGL();
      sizeDots();
    };
    const unsubscribeResize = onResize(handleResize);

    let unsubscribeRaf: (() => void) | undefined;
    if (reduced) {
      drawGL(0);
      drawDots();
    } else {
      unsubscribeRaf = subscribeRaf((now) => {
        drawGL((now - start) / 1000);
        drawDots();
      });
    }

    return () => {
      unsubscribeRaf?.();
      unsubscribeResize();
      glCanvas.removeEventListener('webglcontextlost', onContextLost);
      glCanvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      gl = null;
      program = null;
    };
  }, [reduced]);

  return (
    <div className="ambient" aria-hidden="true">
      <canvas ref={glRef} className="ambient__gl" />
      <canvas ref={dotRef} className="ambient__dots" />
    </div>
  );
}
