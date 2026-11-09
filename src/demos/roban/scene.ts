import {
  ACESFilmicToneMapping, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DirectionalLight,
  DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster,
  Scene, Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2, Vector3, WebGLRenderer,
  type Material, type Object3D,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function heartShape(size = 1) {
  const s = new Shape();
  s.moveTo(0, -.66 * size);
  s.bezierCurveTo(-1.2 * size, .05 * size, -.9 * size, 1.02 * size, 0, .48 * size);
  s.bezierCurveTo(.9 * size, 1.02 * size, 1.2 * size, .05 * size, 0, -.66 * size);
  return s;
}

export function createAccessories(compact: boolean) {
  const world = new Group();
  const pink = new MeshPhysicalMaterial({ color: '#e8a4bd', roughness: .51, metalness: .04, clearcoat: .25, sheen: .5, sheenColor: new Color('#f9c9dc') });
  const lilac = new MeshPhysicalMaterial({ color: '#c6b0e6', roughness: .28, metalness: .08, clearcoat: .7 });
  const gold = new MeshStandardMaterial({ color: '#d9ad66', metalness: .85, roughness: .25 });
  const pearl = new MeshPhysicalMaterial({ color: '#fff2d9', metalness: .24, roughness: .19, clearcoat: 1, iridescence: .24, iridescenceIOR: 1.35 });
  const mirrorMaterial = new MeshStandardMaterial({ color: '#e3dbea', metalness: .99, roughness: .08 });
  const stitchMaterial = new MeshStandardMaterial({ color: '#f5c7d8', roughness: .7 });
  const mesh = (geometry: BufferGeometry, material: Material, parent: Object3D, x = 0, y = 0, z = 0) => {
    const m = new Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  function plinth(x: number, z: number, radius: number, height: number, color: string) {
    return mesh(new CylinderGeometry(radius, radius, height, compact ? 40 : 64), new MeshStandardMaterial({ color, roughness: .82 }), world, x, -.62 + height / 2, z);
  }
  plinth(0, .05, 1.32, .88, '#e7b1c3');
  plinth(-2.04, .5, .94, .38, '#d1bde4');
  plinth(2.03, .34, .9, .57, '#edc0cc');
  const bag = new Group(); bag.name = 'bag-01'; bag.position.set(-.04, .98, .07); bag.rotation.y = -.17; world.add(bag);
  mesh(new RoundedBoxGeometry(1.82, 1.27, .63, compact ? 3 : 5, .19), pink, bag);
  const flap = mesh(new RoundedBoxGeometry(1.77, .73, .09, 3, .15), pink, bag, 0, .29, .345); flap.rotation.x = -.03;
  const handle = mesh(new TorusGeometry(.56, .065, 10, compact ? 24 : 48, Math.PI), pink, bag, 0, .65, 0);
  handle.scale.y = .93;
  for (const x of [-.56, .56]) mesh(new TorusGeometry(.09, .027, 8, 18), gold, bag, x, .64, .02);
  mesh(new RoundedBoxGeometry(.22, .24, .075, 2, .045), gold, bag, 0, -.015, .43);
  // Individually laid diagonal seams follow the front panel rather than a painted card.
  for (const direction of [-1, 1]) for (let i = -3; i <= 3; i++) {
    const points: Vector3[] = [];
    for (let n = 0; n <= 24; n++) {
      const x = -.76 + n / 24 * 1.52, y = direction * x + i * .35;
      if (y >= -.5 && y <= .53) points.push(new Vector3(x, y, y > -.08 ? .397 : .326));
    }
    if (points.length > 1) mesh(new TubeGeometry(new CatmullRomCurve3(points), points.length, .006, 3, false), stitchMaterial, bag);
  }
  const bracelet = new Group(); bracelet.name = 'jewel-01'; bracelet.position.set(-2.04, -.06, .5); bracelet.rotation.set(.12, -.1, -.09); world.add(bracelet);
  const beadGeometry = new SphereGeometry(.115, compact ? 12 : 20, compact ? 10 : 16);
  for (let i = 0; i < 17; i++) { const a = i / 17 * Math.PI * 2; mesh(beadGeometry, pearl, bracelet, Math.cos(a) * .59, 0, Math.sin(a) * .59); }
  const charm = mesh(new ExtrudeGeometry(heartShape(.13), { depth: .045, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, steps: 1, curveSegments: 12 }), pink, bracelet, 0, -.02, .77); charm.rotation.x = -Math.PI / 2;
  const mirror = new Group(); mirror.name = 'daily-01'; mirror.position.set(2.03, .08, .37); mirror.rotation.y = -.35; world.add(mirror);
  const heartGeometry = new ExtrudeGeometry(heartShape(.65), { depth: .09, bevelEnabled: true, bevelSize: .045, bevelThickness: .035, bevelSegments: compact ? 2 : 4, curveSegments: compact ? 16 : 28 });
  const base = new Group(); base.rotation.x = -Math.PI / 2; mirror.add(base);
  mesh(heartGeometry, gold, base);
  const baseInset = mesh(heartGeometry, lilac, base, 0, 0, .055); baseInset.scale.set(.94, .94, .64);
  const lid = new Group(); lid.position.set(0, .46, -.31); lid.rotation.x = -.15; mirror.add(lid);
  mesh(heartGeometry, lilac, lid);
  const reflection = mesh(heartGeometry, mirrorMaterial, lid, 0, 0, .11); reflection.scale.set(.86, .86, .16);
  mesh(new CylinderGeometry(.055, .055, .38, 16), gold, mirror, 0, .025, -.38).rotation.z = Math.PI / 2;
  // A continuous twisted satin ribbon wraps the whole still life in depth.
  const curve = new CatmullRomCurve3([new Vector3(-3.7, -.5, -.55), new Vector3(-2.9, 1.55, -.9), new Vector3(-1.6, 2.65, -1.3), new Vector3(.2, 3.15, -1.45), new Vector3(1.85, 1.6, -1.15), new Vector3(3.5, -.4, -.45)]);
  const ribbonGeometry = new BufferGeometry(), vertices: number[] = [], indices: number[] = [], steps = compact ? 64 : 110;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, p = curve.getPoint(t), tangent = curve.getTangent(t);
    const side = new Vector3(-tangent.y, tangent.x, Math.sin(t * Math.PI * 3) * .7).normalize().multiplyScalar(.24);
    vertices.push(p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z);
    if (i < steps) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  ribbonGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3)); ribbonGeometry.setIndex(indices); ribbonGeometry.computeVertexNormals();
  mesh(ribbonGeometry, new MeshPhysicalMaterial({ color: '#df9bb9', roughness: .4, metalness: .08, side: DoubleSide, sheen: 1, sheenColor: new Color('#f8d8e8') }), world);
  return { world, products: [bag, bracelet, mirror] };
}

export function mountShowroom(host: HTMLElement, { onProductSelect }: { onProductSelect: (id: string) => void }) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  let compact = window.innerWidth < 768;
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { host.dataset.scene = 'fallback'; return { dispose() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  const scene = new Scene(), camera = new PerspectiveCamera(compact ? 40 : 37, 1, .1, 40);
  scene.add(new HemisphereLight('#fff5e9', '#bc91ad', 3));
  const key = new DirectionalLight('#fff4eb', 4.2); key.position.set(-3, 6, 5); key.castShadow = true;
  key.shadow.mapSize.setScalar(compact ? 512 : 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.normalBias = .035; key.shadow.bias = -.0001; scene.add(key);
  const rim = new DirectionalLight('#e5d3ff', 2); rim.position.set(4, 3, -3); scene.add(rim);
  function makeEnvironment() {
    const pmrem = new PMREMGenerator(renderer), room = new RoomEnvironment();
    const target = pmrem.fromScene(room, .04); scene.environment = target.texture; room.dispose(); pmrem.dispose(); return target;
  }
  let environment = makeEnvironment();
  const { world, products: objects } = createAccessories(compact); scene.add(world);
  const ground = new Mesh(new PlaneGeometry(200, 200), new MeshStandardMaterial({ color: '#fff8f4', roughness: 1, transparent: true, opacity: .55 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.625; ground.receiveShadow = true; scene.add(ground);
  const pointer = new Vector2(), raycaster = new Raycaster();
  let frame = 0, visible = true, overlay = !!document.querySelector('dialog[open]'), lost = false, disposed = false, last = 0, phase = 0, yaw = 0, pitch = 0, smoothScroll = 0, framesSlow = 0, adjusted = false;
  const hero = host.closest<HTMLElement>('.hero')!;
  function resize() { if (disposed || lost) return; const { width, height } = host.getBoundingClientRect(); if (!width || !height) return; compact = window.innerWidth < 768; camera.fov = compact ? 40 : 37; renderer.setPixelRatio(adjusted ? 1 : Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
  function tick(time: number) {
    frame = 0; if (disposed || !visible || document.hidden || overlay || lost) return;
    const dt = last ? Math.min((time - last) / 1000, .05) : 0; last = time; phase += dt;
    if (dt > .035) framesSlow++; else framesSlow = Math.max(0, framesSlow - 1);
    if (!adjusted && framesSlow > 70) { renderer.setPixelRatio(1); resize(); adjusted = true; }
    yaw += (pointer.x * .1 - yaw) * .045; pitch += (pointer.y * .06 - pitch) * .045;
    const r = hero.getBoundingClientRect(), progress = Math.max(0, Math.min(1, -r.top / Math.max(r.height, 1)));
    smoothScroll += (progress - smoothScroll) * .05;
    camera.position.set(yaw * 6 + smoothScroll * .4, 3.3 + pitch * 2 - smoothScroll * .5, (compact ? 10.3 : 9.3) - smoothScroll * .7);
    camera.lookAt(0, .95, 0); world.rotation.y = Math.sin(phase * .18) * .025;
    objects[0].rotation.y = -.17 + Math.sin(phase * .45) * .045;
    objects[2].rotation.y = -.35 + Math.sin(phase * .4 + 2) * .055;
    renderer.render(scene, camera);
    host.dataset.scene = 'ready';
    frame = requestAnimationFrame(tick);
  }
  function resume() { if (!frame && !disposed && visible && !document.hidden && !overlay && !lost) { last = 0; frame = requestAnimationFrame(tick); } }
  function pause() { cancelAnimationFrame(frame); frame = 0; }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resume(); else pause(); }, { rootMargin: '60px' }); observer.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  function move(event: PointerEvent) { if (event.pointerType !== 'mouse') return; const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, -((event.clientY - r.top) / r.height * 2 - 1)); raycaster.setFromCamera(pointer, camera); canvas.style.cursor = raycaster.intersectObjects(objects, true).length ? 'pointer' : ''; }
  function leave() { pointer.set(0, 0); canvas.style.cursor = ''; }
  let down = { x: 0, y: 0 };
  function pointerDown(event: PointerEvent) { down = { x: event.clientX, y: event.clientY }; }
  function click(event: MouseEvent) {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8) return;
    const r = canvas.getBoundingClientRect(); const p = new Vector2((event.clientX - r.left) / r.width * 2 - 1, -((event.clientY - r.top) / r.height * 2 - 1)); raycaster.setFromCamera(p, camera);
    const hit = raycaster.intersectObjects(objects, true)[0]; if (!hit) return;
    let object: Object3D | null = hit.object; while (object && !objects.includes(object as Group)) object = object.parent;
    if (object) onProductSelect(object.name);
  }
  function visibility() { if (document.hidden) pause(); else resume(); }
  function overlayChange(event: Event) { overlay = (event as CustomEvent<{ open: boolean }>).detail.open; if (overlay) pause(); else resume(); }
  function contextLost(event: Event) { event.preventDefault(); lost = true; pause(); host.dataset.scene = 'fallback'; }
  function contextRestored() { if (disposed) return; lost = false; environment.dispose(); environment = makeEnvironment(); resize(); resume(); }
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('click', click);
  canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('roban:overlay', overlayChange);
  resize(); resume();
  return { dispose() {
    if (disposed) return; disposed = true; pause(); observer.disconnect(); resizeObserver.disconnect();
    canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('click', click); canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('roban:overlay', overlayChange);
    const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(); scene.traverse((object) => { if (object instanceof Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => materials.add(m)); } });
    geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); environment.dispose(); renderer.dispose(); host.dataset.scene = 'poster';
  } };
}
