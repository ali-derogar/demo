import { useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  ACESFilmicToneMapping, AdditiveBlending, BoxGeometry, BufferGeometry,
  CanvasTexture, DirectionalLight, Float32BufferAttribute, FogExp2,
  Group, HemisphereLight, MathUtils, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight,
  Points, PointsMaterial, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
  type Material,
} from 'three';
import { getPointer, subscribeRaf } from '../lib/raf';
import { useMediaQuery } from '../lib/useMedia';
import type { SceneProgress } from './types';

const CAMERA_STOPS = [
  { eye: [0.5, 1.2, 12.8], aim: [-0.1, -0.15, 0] },
  { eye: [-1.5, 0.7, 10.2], aim: [-1.5, -0.35, -1] },
  { eye: [1.5, 1.4, 11.4], aim: [-0.4, 0, -0.8] },
  { eye: [-0.2, 0.9, 12], aim: [-0.7, -0.2, 0] },
];

function lightTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

/** A single procedural scene. Only camera transforms change during scrolling. */
export function Stage({ progressRef }: { progressRef: RefObject<SceneProgress> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const lowPower = useMediaQuery('(max-width: 767px), (pointer: coarse)');
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !lowPower, powerPreference: 'high-performance' });
    } catch {
      setStatus('fallback');
      return;
    }
    setStatus('loading');
    renderer.setClearColor(0x0b0c0d, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    renderer.setPixelRatio(pixelRatio);

    const scene = new Scene();
    scene.fog = new FogExp2(0x0b0c0d, 0.045);
    const camera = new PerspectiveCamera(39, 1, 0.1, 80);
    const architecture = new Group();
    architecture.position.set(lowPower ? -0.7 : -2.65, lowPower ? 1.3 : 0, 0);
    architecture.rotation.y = -0.2;
    scene.add(architecture);

    const cube = new BoxGeometry(1, 1, 1);
    const plane = new PlaneGeometry(1, 1);
    const stone = new MeshStandardMaterial({ color: 0x292d31, metalness: 0.38, roughness: 0.52 });
    const silver = new MeshStandardMaterial({ color: 0x8a9297, metalness: 0.58, roughness: 0.35 });
    const dark = new MeshStandardMaterial({ color: 0x15191c, metalness: 0.3, roughness: 0.68 });
    const light = new MeshBasicMaterial({ color: 0xe4b67b, toneMapped: false });
    const edge = new MeshBasicMaterial({ color: 0xaebbc2, transparent: true, opacity: 0.3 });
    const materials: Material[] = [stone, silver, dark, light, edge];

    function block(parent: Group, size: [number, number, number], position: [number, number, number], material: Material) {
      const mesh = new Mesh(cube, material);
      mesh.scale.set(...size);
      mesh.position.set(...position);
      parent.add(mesh);
      return mesh;
    }

    // Receding, offset frames: structural geometry, not a borrowed 3D asset.
    const frameCount = lowPower ? 3 : 5;
    for (let i = 0; i < frameCount; i++) {
      const frame = new Group();
      const width = 3.65 + i * 0.42;
      const height = 5.7 + i * 0.15;
      frame.position.set(i * 0.22, -i * 0.025, -i * 1.05);
      frame.rotation.z = -0.055 + i * 0.026;
      frame.rotation.y = i * -0.045;
      const material = i === 0 ? silver : stone;
      block(frame, [0.17, height, 0.23], [-width / 2, 0, 0], material);
      block(frame, [0.17, height, 0.23], [width / 2, 0, 0], material);
      block(frame, [width + 0.17, 0.17, 0.23], [0, height / 2, 0], material);
      block(frame, [width + 0.17, 0.11, 0.23], [0, -height / 2, 0], dark);
      if (i < 2) block(frame, [0.018, height - 0.2, 0.025], [-width / 2 + 0.1, 0, 0.14], i === 0 ? light : edge);
      architecture.add(frame);
    }

    const left = block(architecture, [1.45, 4.65, 0.62], [-0.85, 0.18, 0.55], stone);
    left.rotation.z = -0.055;
    left.rotation.y = 0.11;
    const right = block(architecture, [1.1, 4.1, 0.8], [0.74, -0.13, 0.25], dark);
    right.rotation.z = 0.045;
    right.rotation.y = -0.08;
    block(architecture, [0.055, 4.55, 0.09], [0.025, 0.12, 0.7], light);
    block(architecture, [0.02, 4.45, 0.03], [-1.6, 0.16, 0.92], edge);
    const lintel = block(architecture, [4.5, 0.32, 0.95], [-0.25, 3.25, -0.7], stone);
    lintel.rotation.z = -0.12;
    block(architecture, [3.8, 0.18, 2.3], [0, -2.95, 0.05], dark);

    const floating: { mesh: Mesh; y: number; rz: number; phase: number }[] = [];
    const pieces = [
      [-3.2, 1.5, -0.5, 0.8, 1.5, 0.3, -0.18],
      [2.9, -0.2, -2.3, 0.65, 2.15, 0.4, 0.22],
      [-2.9, -1.9, 1, 0.85, 0.3, 0.7, 0.14],
      [1.9, 3.3, -2.6, 1.5, 0.28, 0.8, -0.1],
      [-3.2, 3.5, -3.9, 0.5, 0.8, 0.45, 0.35],
      [3.2, 1.6, -4.1, 1.3, 0.35, 0.5, -0.22],
    ];
    pieces.slice(0, lowPower ? 3 : pieces.length).forEach((p, i) => {
      const mesh = block(architecture, [p[3], p[4], p[5]], [p[0], p[1], p[2]], i % 2 ? silver : stone);
      mesh.rotation.set(0.12, i * 0.25, p[6]);
      floating.push({ mesh, y: p[1], rz: p[6], phase: i * 1.7 });
    });

    scene.add(new HemisphereLight(0xc5d1dd, 0x14110e, 2.4));
    const key = new DirectionalLight(0xe5edf3, 3.4);
    key.position.set(-4, 7, 6);
    scene.add(key);
    const rim = new DirectionalLight(0x8eacbf, 2);
    rim.position.set(4, 2, -5);
    scene.add(rim);
    const amber = new PointLight(0xf1b96e, 20, 13, 2);
    amber.position.set(-2.4, 0.2, 2.5);
    scene.add(amber);

    const floorMaterial = new MeshStandardMaterial({ color: 0x111416, metalness: 0.32, roughness: 0.48 });
    materials.push(floorMaterial);
    const floor = new Mesh(plane, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(110, 110, 1);
    floor.position.y = -3.12;
    scene.add(floor);

    // Soft baked light on the floor avoids real-time reflections and shadows.
    const texture = lightTexture();
    if (texture) {
      const glowMaterial = new MeshBasicMaterial({ map: texture, color: 0xc68d4c, transparent: true, opacity: 0.28, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
      materials.push(glowMaterial);
      const glow = new Mesh(plane, glowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.scale.set(9, 15, 1);
      glow.position.set(-2.6, -3.1, 2.1);
      scene.add(glow);
      const reflectionMaterial = glowMaterial.clone();
      reflectionMaterial.opacity = 0.35;
      materials.push(reflectionMaterial);
      const reflection = new Mesh(plane, reflectionMaterial);
      reflection.rotation.x = -Math.PI / 2;
      reflection.scale.set(0.7, 7, 1);
      reflection.position.set(-2.5, -3.08, 3);
      scene.add(reflection);
    }

    const count = lowPower ? 25 : 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.sin(i * 127.1) * 12;
      positions[i * 3 + 1] = Math.cos(i * 311.7) * 6;
      positions[i * 3 + 2] = Math.sin(i * 74.7) * 8 - 4;
    }
    const dustGeometry = new BufferGeometry();
    dustGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const dustMaterial = new PointsMaterial({ color: 0xacb7bd, size: lowPower ? 0.025 : 0.018, transparent: true, opacity: 0.35, depthWrite: false });
    materials.push(dustMaterial);
    const dust = new Points(dustGeometry, dustMaterial);
    scene.add(dust);

    let lost = false;
    let rendered = false;
    let smoothPosition = progressRef.current?.position ?? 0;
    let px = 0;
    let py = 0;
    let sampleTime = 0;
    let sampleCount = 0;
    const eye = new Vector3();
    const aim = new Vector3();
    const targetEye = new Vector3();
    const targetAim = new Vector3();
    const farEye = new Vector3();
    const farAim = new Vector3();

    const resize = () => {
      if (lost) return;
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      if (reduced) renderFrame(0, 16);
    };
    const renderFrame = (time: number, delta: number) => {
      if (lost) return;
      const dt = Math.min(delta || 16, 64);
      const easing = 1 - Math.exp(-dt / 200);
      smoothPosition += ((progressRef.current?.position ?? 0) - smoothPosition) * easing;
      const position = reduced ? 0 : MathUtils.clamp(smoothPosition, 0, 3);
      const index = Math.min(2, Math.floor(position));
      const blend = MathUtils.smoothstep(position - index, 0, 1);
      const a = CAMERA_STOPS[index];
      const b = CAMERA_STOPS[index + 1];
      targetEye.fromArray(a.eye).lerp(farEye.fromArray(b.eye), blend);
      targetAim.fromArray(a.aim).lerp(farAim.fromArray(b.aim), blend);
      const pointer = getPointer();
      const interactive = !reduced && !lowPower && pointer.active;
      px += ((interactive ? pointer.nx * 0.22 : 0) - px) * easing;
      py += ((interactive ? pointer.ny * 0.12 : 0) - py) * easing;
      eye.copy(targetEye);
      aim.copy(targetAim);
      eye.x += px;
      eye.y += py;
      if (lowPower) { eye.z += 4.5; aim.x = -0.3; aim.y += 0.35; }
      camera.position.copy(eye);
      camera.lookAt(aim);

      if (!reduced) {
        const t = time * 0.00022;
        floating.forEach(({ mesh, y, rz, phase }) => {
          mesh.position.y = y + Math.sin(t + phase) * 0.075;
          mesh.rotation.z = rz + Math.sin(t * 0.6 + phase) * 0.018;
        });
        dust.rotation.y = Math.sin(t * 0.16) * 0.07;
      }
      renderer.render(scene, camera);
      if (!rendered) { rendered = true; setStatus('ready'); }
      // Lower fill-rate once sustained frame times are high. No quality oscillation.
      if (!reduced && rendered && sampleCount < 120) {
        sampleTime += dt;
        sampleCount++;
        if (sampleCount === 120 && sampleTime / sampleCount > 25 && pixelRatio > 1) {
          pixelRatio = 1;
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
        }
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    const unsubscribe = reduced ? () => {} : subscribeRaf(renderFrame);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      unsubscribe();
      setStatus('fallback');
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    return () => {
      lost = true;
      unsubscribe();
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      cube.dispose();
      plane.dispose();
      dustGeometry.dispose();
      materials.forEach((material) => material.dispose());
      texture?.dispose();
      renderer.dispose();
    };
  }, [reduced, lowPower, progressRef]);

  return (
    <div className="im-stage" ref={wrapRef} data-status={status} aria-hidden="true">
      <div className="im-portal-fallback" />
      <canvas ref={canvasRef} className="im-stage__canvas" />
      <div className="im-stage__vignette" />
    </div>
  );
}
