import {
  ACESFilmicToneMapping, BufferGeometry, DirectionalLight, Float32BufferAttribute,
  Group, HemisphereLight, Mesh, MeshPhysicalMaterial, PerspectiveCamera, PMREMGenerator,
  Scene, SphereGeometry, SRGBColorSpace, Vector3, WebGLRenderer, type Material,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** A closed, thick, twisted metal contour. Every surface is authored geometry. */
export function createContour(compact = false) {
  const group = new Group(), geometry = new BufferGeometry();
  const positions: number[] = [], indices: number[] = [], steps = compact ? 100 : 180;
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * Math.PI * 2;
    const center = new Vector3(Math.cos(a) * 1.52 + Math.sin(a * 2) * .12, Math.sin(a) * 2.16, Math.sin(a * 2 + .4) * .38);
    const tangent = new Vector3(-Math.sin(a) * 1.52 + Math.cos(a * 2) * .24, Math.cos(a) * 2.16, Math.cos(a * 2 + .4) * .76).normalize();
    const outward = new Vector3(Math.cos(a), Math.sin(a), 0).normalize();
    const binormal = new Vector3().crossVectors(tangent, outward).normalize();
    const twist = Math.sin(a * 2) * .9 + .15;
    const side = outward.clone().multiplyScalar(Math.cos(twist)).addScaledVector(binormal, Math.sin(twist)).normalize();
    const normal = new Vector3().crossVectors(tangent, side).normalize();
    const width = .095 + Math.sin(a + .65) ** 2 * .055;
    for (const [s, n] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      const p = center.clone().addScaledVector(side, width * s).addScaledVector(normal, .025 * n); positions.push(p.x, p.y, p.z);
    }
    if (i < steps) for (let face = 0; face < 4; face++) {
      const k = i * 4, next = (face + 1) % 4;
      indices.push(k + face, k + next, k + face + 4, k + next, k + next + 4, k + face + 4);
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const material = new MeshPhysicalMaterial({ color: '#c6bdcf', metalness: 1, roughness: .16, clearcoat: 1, clearcoatRoughness: .14, iridescence: .24, iridescenceIOR: 1.3 });
  const contour = new Mesh(geometry, material); group.add(contour);
  const pearl = new Mesh(new SphereGeometry(.105, compact ? 16 : 24, 16), new MeshPhysicalMaterial({ color: '#e2b9c3', metalness: .5, roughness: .18, clearcoat: 1 }));
  pearl.position.set(-1.58, .63, .4); group.add(pearl);
  group.rotation.set(-.05, -.2, -.23);
  return { group, contour };
}

export function mountHero(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!, hero = host.closest<HTMLElement>('.hero')!;
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { host.dataset.scene = 'fallback'; return { dispose() {} }; }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new Scene(), camera = new PerspectiveCamera(38, 1, .1, 30);
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const { group } = createContour(window.innerWidth < 768); scene.add(group);
  scene.add(new HemisphereLight('#f5e6df', '#231723', 2));
  const key = new DirectionalLight('#ffeadb', 3.4); key.position.set(-3, 4, 4); scene.add(key);
  const rim = new DirectionalLight('#bc6895', 4); rim.position.set(4, 1, -2); scene.add(rim);
  const cool = new DirectionalLight('#b9cae8', 2); cool.position.set(-4, -1, 2); scene.add(cool);
  function makeEnvironment() { const pmrem = new PMREMGenerator(renderer), room = new RoomEnvironment(); const target = pmrem.fromScene(room, .05); scene.environment = target.texture; room.dispose(); pmrem.dispose(); return target; }
  let environment = makeEnvironment();
  let frame = 0, visible = true, disposed = false, lost = false, overlay = !!document.querySelector('dialog[open]');
  let phase = 0, last = 0, pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0, progress = 0, slow = 0, adjusted = false;
  function draw(time: number) {
    frame = 0; if (disposed || lost || !visible || overlay || document.hidden) return;
    const dt = last ? Math.min((time - last) / 1000, .06) : 0; last = time;
    if (dt > .038) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 65 && !adjusted) { adjusted = true; resize(); }
    const rect = hero.getBoundingClientRect(), targetProgress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
    progress += (targetProgress - progress) * (reduced.matches ? 1 : .07);
    smoothX += (pointerX - smoothX) * .035; smoothY += (pointerY - smoothY) * .035;
    if (!reduced.matches) phase += dt;
    group.rotation.set(-.05 + smoothY * .08, -.2 + smoothX * .15 + progress * .45, -.23 + Math.sin(phase * .16) * .025 - progress * .2);
    group.position.set(-.07 - progress * .18, .02 + Math.sin(phase * .3) * .035, progress * .2);
    renderer.render(scene, camera); host.dataset.scene = 'ready';
    if (!reduced.matches) frame = requestAnimationFrame(draw);
  }
  function resume() { if (!frame && !disposed && visible && !lost && !overlay && !document.hidden) { last = 0; frame = requestAnimationFrame(draw); } }
  function pause() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function resize() {
    if (disposed || lost) return;
    const { width, height } = host.getBoundingClientRect(); if (!width || !height) return;
    renderer.setPixelRatio(adjusted ? 1 : Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5));
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.position.set(0, 0, Math.max(7.5, 4.8 / (2 * Math.tan(38 * Math.PI / 360) * Math.min(1, camera.aspect))));
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); resume();
  }
  const signal = new window.AbortController();
  const listen = (target: EventTarget, name: string, callback: EventListener, options = {}) => target.addEventListener(name, callback, { ...options, signal: signal.signal });
  listen(hero, 'pointermove', ((event: PointerEvent) => { if (event.pointerType !== 'mouse' || reduced.matches) return; const rect = hero.getBoundingClientRect(); pointerX = (event.clientX - rect.left) / rect.width * 2 - 1; pointerY = (event.clientY - rect.top) / rect.height * 2 - 1; resume(); }) as EventListener, { passive: true });
  listen(hero, 'pointerleave', (() => { pointerX = 0; pointerY = 0; resume(); }) as EventListener);
  listen(document, 'visibilitychange', (() => { if (document.hidden) pause(); else resume(); }) as EventListener);
  listen(document, 'aura:overlay', ((event: CustomEvent<{ open: boolean }>) => { overlay = event.detail.open; if (overlay) pause(); else resume(); }) as EventListener);
  listen(canvas, 'webglcontextlost', ((event: Event) => { event.preventDefault(); lost = true; pause(); host.dataset.scene = 'fallback'; }) as EventListener);
  listen(canvas, 'webglcontextrestored', (() => { if (disposed) return; lost = false; environment.dispose(); environment = makeEnvironment(); resize(); }) as EventListener);
  reduced.addEventListener('change', () => { pointerX = 0; pointerY = 0; resume(); }, { signal: signal.signal });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resume(); else pause(); }); observer.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
  return { dispose() {
    if (disposed) return; disposed = true; pause(); signal.abort(); observer.disconnect(); resizeObserver.disconnect();
    const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
    scene.traverse((object) => { if (object instanceof Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => materials.add(m)); } });
    geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); environment.dispose(); renderer.dispose(); host.dataset.scene = 'poster';
  } };
}
