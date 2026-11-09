import {
  ACESFilmicToneMapping, BufferGeometry, CatmullRomCurve3, Color, DirectionalLight,
  Group, HemisphereLight, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial,
  PerspectiveCamera, PMREMGenerator, Scene, SphereGeometry, SRGBColorSpace, TorusGeometry,
  TubeGeometry, Vector2, Vector3, WebGLRenderer, type Material,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const regionPoints: Record<string, Vector3> = {
  botox: new Vector3(-.16, 1.11, .71), filler: new Vector3(.02, -.25, 1.02),
  skin: new Vector3(.56, .3, .77), laser: new Vector3(-.48, -1.62, .56),
};
const gaussian = (x: number, y: number, cx: number, cy: number, wx: number, wy: number) => Math.exp(-(((x - cx) / wx) ** 2) - ((y - cy) / wy) ** 2);
function faceWidth(y: number) { return .94 * (.82 + .18 * Math.min(1, Math.max(0, (y + .75) / 1.2))); }
function relief(x: number, y: number) {
  return .19 * gaussian(x, y, 0, .53, .13, .52) + .3 * gaussian(x, y, 0, .15, .16, .18)
    + .065 * (gaussian(x, y, -.17, .12, .11, .09) + gaussian(x, y, .17, .12, .11, .09))
    - .085 * (gaussian(x, y, -.36, .62, .23, .14) + gaussian(x, y, .36, .62, .23, .14))
    + .055 * (gaussian(x, y, -.36, .83, .28, .09) + gaussian(x, y, .36, .83, .28, .09))
    + .07 * (gaussian(x, y, -.47, .23, .23, .29) + gaussian(x, y, .47, .23, .23, .29))
    + .095 * gaussian(x, y, 0, -.23, .29, .065) + .11 * gaussian(x, y, 0, -.34, .27, .073)
    + .06 * gaussian(x, y, 0, -.66, .3, .19);
}
function surfaceZ(x: number, y: number) {
  return Math.sqrt(Math.max(0, 1 - (x / faceWidth(y)) ** 2 - ((y - .35) / 1.4) ** 2)) * .79 + relief(x, y);
}

/** An authored ceramic portrait, generated as real geometry rather than a textured plane. */
export function createBust(compact = false) {
  const world = new Group();
  const ceramic = new MeshPhysicalMaterial({ color: '#e7ead8', metalness: .08, roughness: .39, clearcoat: .35, clearcoatRoughness: .24, sheen: .35, sheenColor: new Color('#c7d5a8') });
  const detail = new MeshStandardMaterial({ color: '#a2af8d', roughness: .6, metalness: .12 });
  const ringMaterial = new MeshStandardMaterial({ color: '#a2b17c', metalness: .65, roughness: .3 });
  const headGeometry = new SphereGeometry(1, compact ? 64 : 100, compact ? 48 : 76);
  const position = headGeometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const originalZ = position.getZ(i), y = position.getY(i) * 1.4 + .35;
    const x = position.getX(i) * faceWidth(y);
    const z = originalZ * .79 + (originalZ > 0 ? relief(x, y) * Math.min(1, originalZ * 3) : 0);
    position.setXYZ(i, x, y, z);
  }
  headGeometry.computeVertexNormals();
  world.add(new Mesh(headGeometry, ceramic));
  const neckGeometry = new LatheGeometry([
    new Vector2(0, -2.1), new Vector2(1.18, -2.1), new Vector2(1.26, -2.01),
    new Vector2(1.19, -1.86), new Vector2(.9, -1.7), new Vector2(.59, -1.56),
    new Vector2(.36, -1.37), new Vector2(.31, -1.03), new Vector2(.33, -.77), new Vector2(0, -.77),
  ], compact ? 40 : 64);
  world.add(new Mesh(neckGeometry, ceramic));
  function line(points: Vector3[], radius = .007) {
    const tube = new TubeGeometry(new CatmullRomCurve3(points), compact ? 20 : 35, radius, 5, false);
    world.add(new Mesh(tube, detail));
  }
  // Shallow closed eyes and a cupid's bow retain the calm, sculptural expression.
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, x = side * (.18 + t * .36), y = .62 - Math.sin(t * Math.PI) * .032; points.push(new Vector3(x, y, surfaceZ(x, y) + .003)); }
    line(points, .006);
  }
  const lipPoints = [];
  for (let i = 0; i <= 30; i++) { const x = -.27 + i / 30 * .54, y = -.285 + .02 * Math.cos(x / .27 * Math.PI * 2); lipPoints.push(new Vector3(x, y, surfaceZ(x, y) + .006)); }
  line(lipPoints, .005);
  const ring = new Mesh(new TorusGeometry(1.85, .009, 5, compact ? 90 : 150), ringMaterial);
  ring.rotation.set(.22, -.25, -.28); ring.position.set(0, -.1, -.3); ring.scale.y = 1.08; world.add(ring);
  const smallPearl = new Mesh(new SphereGeometry(.105, 18, 14), ceramic); smallPearl.position.set(-1.7, .62, .19); world.add(smallPearl);
  const pins: Record<string, Mesh> = {};
  for (const [id, point] of Object.entries(regionPoints)) {
    const pin = new Mesh(new SphereGeometry(.027, 12, 10), new MeshStandardMaterial({ color: '#c9d9a3', metalness: .5, roughness: .2 }));
    pin.position.copy(point); pin.name = id; world.add(pin); pins[id] = pin;
  }
  return { world, pins, ring };
}

export function mountSculpture(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  const controls = [...host.querySelectorAll<HTMLButtonElement>('[data-rotate]')];
  const fallback = () => { host.dataset.scene = 'fallback'; const instruction = host.querySelector<HTMLElement>('#scene-instruction'); if (instruction) instruction.textContent = 'یک ناحیه را انتخاب کنید'; controls.forEach((button) => { button.hidden = true; }); };
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { fallback(); return { select(_id: string) {}, dispose() {} }; }
  const compact = window.innerWidth < 768, reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.8));
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  const scene = new Scene(), camera = new PerspectiveCamera(38, 1, .1, 30);
  camera.position.set(0, .05, 7.4); camera.lookAt(0, -.18, 0);
  scene.add(new HemisphereLight('#fffce8', '#6e8157', 2.5));
  const key = new DirectionalLight('#fff7db', 3.7); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new DirectionalLight('#d0dfbc', 2.2); rim.position.set(3, 2, -3); scene.add(rim);
  function makeEnvironment() { const pmrem = new PMREMGenerator(renderer), room = new RoomEnvironment(); const target = pmrem.fromScene(room, .08); scene.environment = target.texture; room.dispose(); pmrem.dispose(); return target; }
  let environment = makeEnvironment();
  const { world, pins, ring } = createBust(compact); scene.add(world);
  const projected = new Vector3(), nodes = new Map([...host.querySelectorAll<HTMLElement>('.atlas-hotspot')].map((node) => [node.dataset.region!, node]));
  let frame = 0, disposed = false, visible = true, lost = false, overlay = !!document.querySelector('dialog[open]');
  let width = 1, height = 1, yaw = -.16, targetYaw = -.16, pitch = 0, targetPitch = 0, phase = 0, last = 0, down: { x: number; y: number; yaw: number; pitch: number; id: number } | null = null;
  let slowFrames = 0, adjusted = false;
  function draw(time: number) {
    frame = 0;
    if (disposed || !visible || lost || overlay || document.hidden) return;
    const dt = last ? Math.min((time - last) / 1000, .06) : 0; last = time;
    if (dt > .038) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 65 && !adjusted) { adjusted = true; renderer.setPixelRatio(1); renderer.setSize(width, height, false); }
    if (!reduced.matches) phase += dt;
    yaw += (targetYaw - yaw) * (reduced.matches ? 1 : .12); pitch += (targetPitch - pitch) * (reduced.matches ? 1 : .12);
    world.rotation.set(pitch, yaw + (!reduced.matches && !down ? Math.sin(phase * .2) * .025 : 0), 0);
    ring.rotation.z = -.28 + Math.sin(phase * .15) * .035;
    world.updateMatrixWorld(true); camera.updateMatrixWorld();
    renderer.render(scene, camera);
    for (const [id, pin] of Object.entries(pins)) {
      pin.getWorldPosition(projected); projected.project(camera);
      const node = nodes.get(id); if (!node) continue;
      node.style.setProperty('--pin-x', `${(projected.x * .5 + .5) * width}px`);
      node.style.setProperty('--pin-y', `${(-projected.y * .5 + .5) * height}px`);
    }
    host.dataset.scene = 'ready';
    if (!reduced.matches || Math.abs(yaw - targetYaw) > .001 || Math.abs(pitch - targetPitch) > .001) frame = requestAnimationFrame(draw);
  }
  function resume() { if (!frame && !disposed && visible && !lost && !overlay && !document.hidden) { last = 0; frame = requestAnimationFrame(draw); } }
  function pause() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function resize() {
    if (disposed || lost) return;
    const rect = host.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    width = rect.width; height = rect.height;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.position.z = Math.max(7.4, 5.1 / (2 * Math.tan(38 * Math.PI / 360) * Math.min(1, camera.aspect)));
    camera.updateProjectionMatrix(); resume();
  }
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resume(); else pause(); }, { rootMargin: '80px' }); visibilityObserver.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const signal = new window.AbortController();
  const listen = (target: EventTarget, event: string, callback: EventListener) => target.addEventListener(event, callback, { signal: signal.signal });
  listen(canvas, 'pointerdown', ((e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button !== 0) return; down = { x: e.clientX, y: e.clientY, yaw: targetYaw, pitch: targetPitch, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); }) as EventListener);
  listen(canvas, 'pointermove', ((e: PointerEvent) => {
    if (!down || down.id !== e.pointerId) return;
    targetYaw = Math.max(-.65, Math.min(.65, down.yaw + (e.clientX - down.x) * .007));
    targetPitch = Math.max(-.14, Math.min(.14, down.pitch + (e.clientY - down.y) * .002)); resume();
  }) as EventListener);
  const release = ((e: PointerEvent) => { if (down?.id !== e.pointerId) return; down = null; if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); }) as EventListener;
  listen(canvas, 'pointerup', release); listen(canvas, 'pointercancel', release); listen(canvas, 'lostpointercapture', (() => { down = null; }) as EventListener);
  for (const button of controls) listen(button, 'click', (() => { const direction = Number(button.dataset.rotate); targetYaw = direction === 0 ? -.16 : Math.max(-.65, Math.min(.65, targetYaw + direction * .22)); targetPitch = 0; resume(); }) as EventListener);
  // The application owns the accessible buttons; this scene only projects their anchors.
  listen(document, 'visibilitychange', (() => { if (document.hidden) pause(); else resume(); }) as EventListener);
  listen(document, 'aura:overlay', ((e: CustomEvent<{ open: boolean }>) => { overlay = e.detail.open; if (overlay) pause(); else resume(); }) as EventListener);
  listen(canvas, 'webglcontextlost', ((e: Event) => { e.preventDefault(); lost = true; pause(); fallback(); }) as EventListener);
  listen(canvas, 'webglcontextrestored', (() => { if (disposed) return; lost = false; environment.dispose(); environment = makeEnvironment(); controls.forEach((button) => { button.hidden = false; }); host.querySelector<HTMLElement>('#scene-instruction')!.textContent = 'برای چرخاندن، بکشید'; resize(); resume(); }) as EventListener);
  reduced.addEventListener('change', resume, { signal: signal.signal });
  resize(); resume();
  return {
    select(id: string) { for (const [key, pin] of Object.entries(pins)) pin.scale.setScalar(key === id ? 1.7 : 1); resume(); },
    dispose() {
      if (disposed) return; disposed = true; pause(); signal.abort(); visibilityObserver.disconnect(); resizeObserver.disconnect();
      const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
      scene.traverse((object) => { if (object instanceof Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material)); } });
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); environment.dispose(); renderer.dispose(); host.dataset.scene = 'poster';
    },
  };
}
