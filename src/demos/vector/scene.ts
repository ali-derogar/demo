import {
  ACESFilmicToneMapping, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DataTexture, DirectionalLight,
  DoubleSide, Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial,
  PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster, Scene, TorusGeometry,
  TubeGeometry, Vector2, Vector3, WebGLRenderer, SRGBColorSpace, RepeatWrapping, RGBAFormat, type Material, type Object3D,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const garmentIds = ['tee-01', 'hoodie-01', 'jacket-01'] as const;
type GarmentId = typeof garmentIds[number];
type Kind = 'tee' | 'hoodie' | 'jacket';
const positions = [-2.8, 0, 2.8];
const defaultColors = ['#29292b', '#782c39', '#29292b'];

/** Sewn surfaces are real, hollow volume, with open necks, hems and cuffs. */
function surface(columns: number, rows: number, point: (u: number, v: number) => Vector3) {
  const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    const p = point(x / columns, y / rows); vertices.push(p.x, p.y, p.z); uv.push(x / columns, y / rows);
    if (x < columns && y < rows) { const i = y * (columns + 1) + x; indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1); }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
function mesh(parent: Object3D, geometry: BufferGeometry, material: Material, x = 0, y = 0, z = 0) {
  const object = new Mesh(geometry, material); object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
}
function seam(parent: Object3D, points: Vector3[], material: Material, radius = .007) {
  return mesh(parent, new TubeGeometry(new CatmullRomCurve3(points), Math.max(12, points.length * 2), radius, 4, false), material);
}

export function createGarment(kind: Kind, color: string, compact = false) {
  const group = new Group();
  const weave = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y * 64 + x) * 4;
    weave[i] = 128 + Math.round(Math.sin(x * Math.PI / 2) * 26); weave[i + 1] = 128 + Math.round(Math.sin(y * Math.PI / 2) * 26); weave[i + 2] = 249; weave[i + 3] = 255;
  }
  const normalMap = new DataTexture(weave, 64, 64, RGBAFormat); normalMap.wrapS = normalMap.wrapT = RepeatWrapping; normalMap.repeat.set(24, 24); normalMap.needsUpdate = true;
  const fabric = new MeshPhysicalMaterial({ color, roughness: kind === 'jacket' ? .65 : .92, metalness: 0,
    side: DoubleSide, sheen: kind === 'jacket' ? .2 : .75, sheenRoughness: .85, sheenColor: new Color('#d4cac0'), normalMap, normalScale: new Vector2(.13, .13) });
  const rib = new MeshStandardMaterial({ color, roughness: 1, side: DoubleSide });
  const stitch = new MeshStandardMaterial({ color: new Color(color).multiplyScalar(.7), roughness: .9 });
  const metal = new MeshStandardMaterial({ color: '#86868a', roughness: .35, metalness: .8 });
  const width = kind === 'jacket' ? .85 : .76, depth = kind === 'jacket' ? .36 : .25;
  const torsoPoint = (u: number, v: number) => {
    const angle = u * Math.PI * 2, xBase = Math.cos(angle), zBase = Math.sin(angle);
    const fold = (Math.sin(angle * 11 + v * 2.5) * .021 + Math.sin(angle * 7 - v * 5) * .019) * (.4 + .6 * Math.sin(v * Math.PI));
    const puff = kind === 'jacket' ? .085 * Math.sin(v * Math.PI * 6) ** 2 : Math.sin(v * 7 + angle * 3) * .024;
    const w = width * (.93 + .07 * v) + fold;
    return new Vector3(xBase * (w + puff * .6), -1 + v * 1.85 + .025 * Math.sin(angle * 4) * (1 - v), zBase * (depth + puff + fold + .035 * Math.sin(v * Math.PI)));
  };
  mesh(group, surface(compact ? 48 : 72, kind === 'jacket' ? 64 : 36, torsoPoint), fabric);
  // Shoulder panels taper into an actual neck opening, rather than a sealed solid.
  mesh(group, surface(compact ? 48 : 72, 12, (u, v) => {
    const a = u * Math.PI * 2, outer = torsoPoint(u, 1), neck = new Vector3(Math.cos(a) * .245, 1.06 - Math.max(0, Math.sin(a)) * .085, Math.sin(a) * .185);
    const p = outer.lerp(neck, v); p.y += Math.sin(v * Math.PI) * .055; return p;
  }), fabric);
  const band = (y: number, radiusX: number, radiusZ: number, height: number) => mesh(group, surface(64, 5, (u, v) => {
    const a = u * Math.PI * 2; const ribbing = .002 * Math.sin(a * 90); return new Vector3(Math.cos(a) * (radiusX + ribbing), y + v * height, Math.sin(a) * (radiusZ + ribbing));
  }), rib);
  band(-1.04, width * .935, depth + .008, kind === 'tee' ? .06 : .14);
  if (kind === 'tee') band(1.005, .248, .19, .065);
  for (const side of [-1, 1]) {
    const short = kind === 'tee';
    const sleeveStart = new Vector3(side * .57, .68, 0), sleeveEnd = new Vector3(side * (short ? 1.35 : 1.32), short ? .22 : -.92, .045);
    const axis = sleeveEnd.clone().sub(sleeveStart).normalize(), forward = new Vector3(0, 0, 1), across = new Vector3().crossVectors(axis, forward).normalize();
    const sleevePoint = (u: number, v: number) => {
      const a = u * Math.PI * 2, center = sleeveStart.clone().lerp(sleeveEnd, v);
      const join = Math.min(1, .20 + v * 7);
      const taper = (short ? .29 - v * .025 : .31 - v * .14) * join;
      const puff = kind === 'jacket' ? .045 * Math.sin(v * Math.PI * 5) ** 2 : .012 * Math.sin(v * 17 + a * 3);
      return center.addScaledVector(across, Math.cos(a) * (taper + puff)).addScaledVector(forward, Math.sin(a) * (taper * .9 + puff));
    };
    mesh(group, surface(compact ? 24 : 36, short ? 14 : 34, sleevePoint), fabric);
    mesh(group, surface(36, 5, (u, v) => sleevePoint(u, 1 - v * (short ? .065 : .095))), rib);
    seam(group, Array.from({ length: 37 }, (_, i) => sleevePoint(i / 36, .965)), stitch);
    if (kind === 'jacket') for (let ring = 1; ring < 5; ring++) seam(group, Array.from({ length: 33 }, (_, i) => sleevePoint(i / 32, ring / 5)), stitch, .006);
    // A tailored side seam subtly catches grazing light.
    seam(group, Array.from({ length: 24 }, (_, i) => torsoPoint(side === 1 ? .015 : .485, i / 23)), stitch, .004);
  }
  seam(group, Array.from({ length: 65 }, (_, i) => torsoPoint(i / 64, .025)), stitch, .005);
  if (kind === 'hoodie') {
    // A shaped open hood: shell wraps the back and sides, framing a deep opening.
    const hoodPoint = (u: number, v: number, inset = 0) => {
      const a = -.2 + u * (Math.PI + .4), height = .91 + v * .83;
      const radius = Math.max(.008, .46 * Math.sqrt(Math.max(0, 1 - ((height - 1.25) / .5) ** 2)) - inset);
      return new Vector3(Math.cos(a) * radius, height, -.06 - Math.sin(a) * radius * .88);
    };
    const lining = new MeshStandardMaterial({ color: new Color(color).multiplyScalar(.32), roughness: 1, side: DoubleSide });
    mesh(group, surface(40, 28, (u, v) => hoodPoint(u, v)), fabric);
    mesh(group, surface(40, 28, (u, v) => hoodPoint(u, v, .022)), lining); group.userData.lining = lining;
    for (const edge of [0, 1]) seam(group, Array.from({ length: 25 }, (_, i) => hoodPoint(edge, i / 24)), rib, .025);
    // Kangaroo pocket is a bowed cloth panel with open diagonal entry seams.
    mesh(group, surface(28, 16, (u, v) => new Vector3((u - .5) * (1.08 - v * .15), -.77 + v * .56, .285 + Math.sin(u * Math.PI) * .055 + Math.sin(v * Math.PI) * .015)), fabric);
    for (const side of [-1, 1]) seam(group, [new Vector3(side * .53, -.74, .29), new Vector3(side * .52, -.48, .30), new Vector3(side * .40, -.23, .325)], stitch, .009);
    for (const side of [-1, 1]) {
      seam(group, [new Vector3(side * .21, 1.01, .19), new Vector3(side * .24, .72, .32), new Vector3(side * .20, .41, .33)], rib, .014);
      mesh(group, new CylinderGeometry(.018, .018, .085, 8), metal, side * .20, .37, .33);
    }
  }
  if (kind === 'jacket') {
    band(.94, .30, .23, .35);
    for (let ring = 1; ring < 6; ring++) seam(group, Array.from({ length: 73 }, (_, i) => torsoPoint(i / 72, ring / 6)), stitch, .007);
    const zipperZ = (y: number) => y > .85 ? .255 : torsoPoint(.25, (y + 1) / 1.85).z + .025;
    seam(group, Array.from({ length: 49 }, (_, i) => { const y = -.96 + i / 48 * 2.16; return new Vector3(0, y, zipperZ(y)); }), rib, .025);
    for (let n = 0; n < 47; n++) {
      const y = -.92 + n * .045, z = zipperZ(y) + .025;
      mesh(group, new CylinderGeometry(.008, .008, .043, 4), metal, 0, y, z).rotation.z = Math.PI / 2;
    }
    mesh(group, new TorusGeometry(.045, .012, 6, 12), metal, 0, .86, .435).scale.y = 1.6;
    for (const side of [-1, 1]) seam(group, [new Vector3(side * .49, -.71, .32), new Vector3(side * .64, -.28, .30)], rib, .023);
  }
  // A tiny authored woven label, with no borrowed branding.
  mesh(group, new PlaneGeometry(.08, .12), new MeshStandardMaterial({ color: '#ef493c', side: DoubleSide }), .55, -.91, depth + .03);
  group.userData.fabric = [fabric, rib]; return group;
}

export function createShowroom(compact = false) {
  const world = new Group(), garments = garmentIds.map((id, index) => {
    const garment = createGarment((['tee', 'hoodie', 'jacket'] as const)[index], defaultColors[index], compact);
    garment.name = id; garment.position.set(positions[index], 2.12, 0); garment.rotation.y = index === 0 ? .16 : index === 2 ? -.16 : 0; world.add(garment); return garment;
  });
  const concrete = new MeshStandardMaterial({ color: '#373638', roughness: .9 });
  for (const x of positions) mesh(world, new CylinderGeometry(1.15, 1.18, .16, compact ? 40 : 64), concrete, x, .10, 0);
  return { world, garments };
}

export function showroomFrame(aspect: number, selected: number | null, zoom: number) {
  const isOverview = selected === null, x = isOverview ? 0 : positions[selected];
  const target = new Vector3(x, isOverview ? 1.95 : selected === 1 ? 2.48 : 2.18, 0);
  // The horizontal fit budget accounts for sleeves and all three display plinths.
  const distance = isOverview ? Math.max(8.7, 14.5 / Math.max(.55, aspect)) : Math.max(6.5, 6.2 / Math.max(.55, aspect)) - zoom;
  return { position: new Vector3(x + (isOverview ? .1 : .16), isOverview ? 3.0 : target.y + .25, distance), target };
}

export interface ShowroomOptions { onProductSelect: (id: string) => void }
export function mountShowroom(host: HTMLElement, { onProductSelect }: ShowroomOptions) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { host.dataset.scene = 'fallback'; return { select(_id: string | null) {}, setColor(_id: string, _color: string) {}, rotate(_delta: number) {}, zoom(_delta: number) {}, dispose() {} }; }
  let compact = window.innerWidth < 768, quality = 0;
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  const scene = new Scene(), camera = new PerspectiveCamera(38, 1, .1, 80);
  const { world, garments } = createShowroom(compact); scene.add(world);
  const floor = mesh(scene, new PlaneGeometry(100, 100), new MeshStandardMaterial({ color: '#252426', roughness: .82, metalness: .15 }), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
  scene.add(new HemisphereLight('#eeece5', '#151419', 2.1));
  const key = new DirectionalLight('#ffede1', 4.1); key.position.set(-3, 7, 5); key.castShadow = true;
  key.shadow.mapSize.setScalar(compact ? 512 : 1024); key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.normalBias = .025; scene.add(key);
  const fill = new DirectionalLight('#dfd9ef', 2.5); fill.position.set(5, 4, 3); scene.add(fill);
  const rim = new DirectionalLight('#ef493c', 3.5); rim.position.set(0, 3, -3); scene.add(rim);
  const strip = mesh(scene, new PlaneGeometry(18, .018), new MeshStandardMaterial({ color: '#d34137', emissive: '#d34137', emissiveIntensity: 1.5 }), 0, .06, -3.3);
  strip.rotation.x = -.2;
  const environment = () => { const pmrem = new PMREMGenerator(renderer), room = new RoomEnvironment(); const target = pmrem.fromScene(room, .06); scene.environment = target.texture; room.dispose(); pmrem.dispose(); return target; };
  let env = environment();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const raycaster = new Raycaster(), pointer = new Vector2(), look = new Vector3(0, 1.95, 0), targetColor = new Color('#ef493c');
  const rotations = [0, 0, 0];
  let selected: number | null = null, zoomLevel = 0, visible = true, overlay = false, lost = false, disposed = false, frame = 0;
  let time = 0, last = 0, slow = 0, animating = true;
  let down: { x: number; y: number; id: number; horizontal: boolean } | null = null;
  camera.position.copy(showroomFrame(2, null, 0).position);
  function running() { return !disposed && !lost && visible && !document.hidden && !overlay; }
  function pause() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function wake() { if (!frame && running()) frame = requestAnimationFrame(tick); }
  function resize() {
    if (disposed || lost) return;
    const { width, height } = host.getBoundingClientRect(); if (!width || !height) return;
    compact = window.innerWidth < 768;
    renderer.setPixelRatio(quality ? 1 : Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)); renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix(); animating = true; wake();
  }
  function tick(now: number) {
    frame = 0; if (!running()) return;
    const rawDt = last ? (now - last) / 1000 : 1 / 60, dt = Math.min(rawDt, .05); last = now; time += dt;
    slow = rawDt > .038 && rawDt < .2 ? slow + 1 : Math.max(0, slow - 1);
    if (!quality && slow > 65) { quality = 1; resize(); }
    const desired = showroomFrame(camera.aspect, selected, zoomLevel), alpha = reduced.matches ? 1 : 1 - Math.exp(-dt * 5.5);
    camera.position.lerp(desired.position, alpha); look.lerp(desired.target, alpha); camera.lookAt(look);
    garments.forEach((garment, index) => {
      const isSelected = selected === index;
      const rest = selected === null ? (index === 0 ? .16 : index === 2 ? -.16 : 0) : 0;
      const targetYaw = isSelected ? rotations[index] : rest;
      garment.rotation.y += (targetYaw - garment.rotation.y) * alpha;
      const base = 2.12 + (!reduced.matches ? Math.sin(time * .6 + index * 1.7) * .025 : 0);
      garment.position.y = base;
      const scale = selected === null || isSelected ? 1 : .88; garment.scale.lerp(new Vector3(scale, scale, scale), alpha);
    });
    rim.color.lerp(targetColor, alpha); renderer.render(scene, camera); host.dataset.scene = 'ready';
    animating = camera.position.distanceTo(desired.position) > .002 || garments.some((g, i) => Math.abs(g.rotation.y - (selected === i ? rotations[i] : selected === null ? i === 0 ? .16 : i === 2 ? -.16 : 0 : 0)) > .002);
    if (!reduced.matches || animating) wake();
  }
  function select(id: string | null) {
    const index = garmentIds.indexOf(id as GarmentId), next = index < 0 ? null : index;
    if (next !== selected) zoomLevel = 0; selected = next;
    if (selected !== null) targetColor.set(defaultColors[selected] === '#782c39' ? '#f35466' : '#c1b5aa'); else targetColor.set('#ef493c');
    animating = true; wake();
  }
  function setColor(id: string, color: string) {
    const object = garments.find((g) => g.name === id); if (!object || !/^#[a-f0-9]{6}$/i.test(color)) return;
    (object.userData.fabric as MeshStandardMaterial[]).forEach((m) => m.color.set(color)); animating = true; wake();
    if (object.userData.lining) (object.userData.lining as MeshStandardMaterial).color.set(color).multiplyScalar(.32);
  }
  function rotate(delta: number) { if (selected !== null && Number.isFinite(delta)) { rotations[selected] += delta; animating = true; wake(); } }
  function zoom(delta: number) { if (selected !== null && Number.isFinite(delta)) { zoomLevel = Math.max(-1, Math.min(1.25, zoomLevel + delta)); animating = true; wake(); } }
  function pointerDown(event: PointerEvent) { down = { x: event.clientX, y: event.clientY, id: event.pointerId, horizontal: false }; }
  function pointerMove(event: PointerEvent) {
    if (!down || selected === null || down.id !== event.pointerId) return;
    const dx = event.clientX - down.x, dy = event.clientY - down.y;
    if (!down.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { down = null; return; }
    if (!down.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { down.horizontal = true; canvas.setPointerCapture?.(event.pointerId); }
    if (down.horizontal) { rotate(dx * .012); down.x = event.clientX; down.y = event.clientY; }
  }
  function pointerUp(event: PointerEvent) {
    const start = down; down = null;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!start || start.horizontal || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    const bounds = canvas.getBoundingClientRect(); pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height * 2 - 1));
    raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(garments, true)[0]; if (!hit) return;
    let object: Object3D | null = hit.object; while (object && !garments.includes(object as Group)) object = object.parent;
    if (object) onProductSelect(object.name);
  }
  function pointerCancel() { down = null; }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); else pause(); }, { rootMargin: '80px' }); observer.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const visibility = () => document.hidden ? pause() : wake();
  const overlayChange = (event: Event) => { overlay = (event as CustomEvent<{ open: boolean }>).detail.open; if (overlay) pause(); else wake(); };
  const motionChange = () => { animating = true; wake(); };
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; pause(); host.dataset.scene = 'fallback'; };
  const contextRestored = () => { if (disposed) return; lost = false; env.dispose(); env = environment(); resize(); wake(); };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerCancel);
  canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('vector:overlay', overlayChange); reduced.addEventListener('change', motionChange);
  resize(); wake();
  return { select, setColor, rotate, zoom, getState: () => ({ selected, zoom: zoomLevel, rotations: [...rotations], quality }), dispose() {
    if (disposed) return; disposed = true; pause(); observer.disconnect(); resizeObserver.disconnect();
    canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerCancel);
    canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('vector:overlay', overlayChange); reduced.removeEventListener('change', motionChange);
    const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
    scene.traverse((object) => { if (object instanceof Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => materials.add(m)); } });
    geometries.forEach((g) => g.dispose()); materials.forEach((m) => { if (m instanceof MeshStandardMaterial) m.normalMap?.dispose(); m.dispose(); }); env.dispose(); renderer.dispose(); host.dataset.scene = 'poster';
  } };
}
