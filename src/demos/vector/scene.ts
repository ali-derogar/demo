import {
  ACESFilmicToneMapping, AlwaysStencilFunc, Color, DoubleSide, EqualStencilFunc, Group, KeepStencilOp, Mesh,
  MeshBasicMaterial, NotEqualStencilFunc, PerspectiveCamera, PlaneGeometry, Raycaster, ReplaceStencilOp,
  Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, HemisphereLight, DirectionalLight, PCFSoftShadowMap,
  PMREMGenerator, type Material, type BufferGeometry, type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { StudioAssets, type AssetProvider, type ModelNodes } from './assets';
import { capsules, capsuleFor, studioPalette, storyPose, range } from './studio';
import { buildOverview, buildRoom, buildDetail, buildFinale, garmentMeshes } from './design';
export { buildOverview, buildRoom, buildDetail, buildFinale } from './design';

function stencil(group: Group, enabled: boolean, inverse = false) {
  group.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
      material.stencilWrite = enabled; material.stencilRef = 1; material.stencilFunc = inverse ? NotEqualStencilFunc : EqualStencilFunc;
      material.stencilFail = material.stencilZFail = material.stencilZPass = KeepStencilOp;
    }); object.renderOrder = 2;
  });
}
export interface ShowroomOptions {
  onProductSelect: (id: string) => void;
  onShop?: () => void;
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
  assets?: AssetProvider;
}
export function mountShowroom(host: HTMLElement, options: ShowroomOptions) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: true, powerPreference: 'high-performance' }); }
  catch {
    host.dataset.scene = 'fallback'; options.onStatus?.('fallback');
    return { ready: Promise.resolve(), select: async (_id: string | null) => {}, hover(_id: string | null) {}, focus(_index: number) {}, setProgress(_progress: number) {}, rotate(_angle: number) {}, zoom(_delta: number) {}, dispose() {} };
  }
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping;
  const assets = options.assets ?? new StudioAssets(), scene = new Scene(), camera = new PerspectiveCamera(30, 1, .01, 100);
  scene.background = new Color('#30382f');
  let environmentTarget: WebGLRenderTarget | null = null;
  if (renderer.capabilities) {
    const pmrem = new PMREMGenerator(renderer), roomEnvironment = new RoomEnvironment();
    environmentTarget = pmrem.fromScene(roomEnvironment, .04); scene.environment = environmentTarget.texture; scene.environmentIntensity = .55;
    roomEnvironment.dispose(); pmrem.dispose();
  }
  const key = new DirectionalLight('#fff4df', 2.7); key.position.set(-2, 3, 3); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -2; key.shadow.camera.right = key.shadow.camera.top = 2; key.shadow.bias = -.0003;
  scene.add(key, new HemisphereLight('#e9ece8', '#302b23', .7));
  const rim = new DirectionalLight('#cad8ed', 1.7); rim.position.set(2, 2, -1); scene.add(rim);
  if (renderer.shadowMap) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap; }
  renderer.toneMappingExposure = .95; camera.position.set(0, .7, 3); camera.lookAt(0, .7, 0);
  const maskMaterial = new MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, stencilWrite: true, stencilRef: 1, stencilFunc: AlwaysStencilFunc, stencilFail: ReplaceStencilOp, stencilZFail: ReplaceStencilOp, stencilZPass: ReplaceStencilOp, side: DoubleSide });
  const mask = new Mesh(new PlaneGeometry(1, 1), maskMaterial); mask.renderOrder = 0; mask.visible = false; scene.add(mask);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), pointer = new Vector2(), raycaster = new Raycaster();
  const entry = { value: 0, spread: 0 }, reveal = { value: 0 };
  const entryTimeline = gsap.timeline({ paused: true }).to(entry, { value: 1, duration: 4, ease: 'power4.inOut' }, 0).to(entry, { spread: 1, duration: 3, ease: 'power2.out' }, 1);
  let revealTimeline = gsap.timeline({ paused: true }).to(reveal, { value: 1, duration: 1.3, ease: 'power3.out' });
  let overview: ReturnType<typeof buildOverview> | null = null, models: ModelNodes = {};
  let room: ReturnType<typeof buildRoom> | null = null, detail: ReturnType<typeof buildDetail> | null = null, film: Group | null = null;
  let finale: ReturnType<typeof buildFinale> | null = null;
  let selected: string | null = null, hoverId: string | null = null, mobileIndex = 1, targetProgress = 0, progress = 0, manualYaw = 0, zoomLevel = 0;
  let frame = 0, last = 0, elapsed = 0, entryElapsed = 0, revealElapsed = 0, visible = true, overlay = !!document.querySelector('dialog[open]'), lost = false, disposed = false, quality = 0, slow = 0, compact = window.innerWidth < 768, token = 0;
  const resources = new Set<Material>(), ownedGeometry = new Set<BufferGeometry>();
  let down: { x: number; y: number; id: number; dragging: boolean } | null = null;
  function remember(group: Group) { group.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => resources.add(m));
    if (!o.userData.assetGeometry) ownedGeometry.add(o.geometry);
    if (o.userData.product) o.castShadow = true; else o.receiveShadow = true;
  }); }
  function removeProduct() {
    for (const group of [room?.world, detail?.world, film]) if (group) {
      scene.remove(group); group.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => { if (resources.delete(material)) material.dispose(); });
        if (ownedGeometry.delete(object.geometry as PlaneGeometry)) object.geometry.dispose();
      });
    }
    room = null; detail = null; film = null; finale = null;
  }
  function canRun() { return !disposed && !lost && visible && !document.hidden && !overlay; }
  function pause() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function wake() { if (!frame && canRun()) frame = requestAnimationFrame(tick); }
  function resize() {
    if (disposed || lost) return; const bounds = host.getBoundingClientRect(); if (!bounds.width || !bounds.height) return;
    compact = window.innerWidth < 768; renderer.setPixelRatio(quality ? 1 : Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)); renderer.setSize(bounds.width, bounds.height, false); camera.aspect = bounds.width / bounds.height; camera.updateProjectionMatrix(); wake();
  }
  function updateOverview(dt: number) {
    if (!overview) return;
    const value = reduced.matches ? 1 : entry.value, spread = reduced.matches ? 1 : entry.spread;
    const scale = compact ? Math.min(1, camera.aspect * 2.05) : 1;
    overview.world.visible = !room; overview.world.scale.setScalar(scale);
    overview.world.position.set(0, .76 * (1 - scale) - .15 * (1 - value), 2 * (1 - value));
    const active = compact ? capsules[mobileIndex].product : hoverId;
    scene.background = new Color(active ? studioPalette[capsuleFor(active)!.theme] : '#30382f');
    overview.shirts.forEach((shirt, index) => {
      const capsule = capsules[index], focused = active === capsule.product, shift = compact ? (mobileIndex - 1) * .7 : 0;
      const yaw = focused ? 0 : capsule.yaw * (4 - spread * 3), alpha = reduced.matches ? 1 : 1 - Math.exp(-dt * 5);
      shirt.rotation.y += (yaw - shirt.rotation.y) * alpha;
      const targetPosition = new Vector3(capsule.position[0] * (2 - spread) + shift, .76, compact && focused ? 0 : capsule.position[2]);
      if (compact && !reduced.matches) shirt.position.lerp(targetPosition, alpha); else shirt.position.copy(targetPosition);
      const scale = focused ? 1.05 : 1; shirt.scale.lerp(new Vector3(scale, scale, scale), alpha);
    });
  }
  function updateStory() {
    if (!room || !selected) return;
    const capsule = capsuleFor(selected)!, pose = storyPose(progress, compact), viewportHeight = 2 * camera.position.z * Math.tan(Math.PI / 12), viewportWidth = viewportHeight * camera.aspect;
    room.world.visible = progress < .30; room.world.position.y = pose.roomY; room.shirt.rotation.y = pose.shirtYaw + manualYaw;
    room.shirt.scale.setScalar(compact ? Math.min(1, camera.aspect * 2.05) : 1);
    mask.scale.set(viewportWidth * 2.2, viewportHeight * 1.5, 1);
    if (progress < .3) {
      mask.visible = true; mask.position.set(0, .7 - viewportHeight * 1.3 * (1 - reveal.value) + viewportHeight * 2 * pose.first, .05); mask.rotation.z = -.2 * pose.first;
      stencil(room.world, true); if (detail) stencil(detail.world, true, true);
    } else if (progress >= .77 && film) {
      mask.visible = true; mask.position.set(0, .7 - viewportHeight * 1.6 * (1 - pose.last), .1); mask.rotation.z = -.3 * (1 - pose.last);
      stencil(film, true); if (detail) stencil(detail.world, true, true);
    } else { mask.visible = false; if (detail) stencil(detail.world, false); }
    if (detail) {
      detail.world.visible = progress > .045 && progress < .97; detail.world.position.y = pose.detailY;
      detail.world.rotation.set(pose.detailPitch, pose.detailYaw + manualYaw, 0); detail.world.scale.setScalar(compact ? Math.min(pose.detailScale, camera.aspect * 2.05) : pose.detailScale);
      detail.textMaterial.opacity = 1 - range(pose.turn, .1, .28); detail.marqueeMaterial.opacity = .10 * range(pose.turn, .12, .30); detail.texts.scale.setScalar(range(pose.turn, 0, .15));
      detail.marquees.forEach((mesh, i) => { const width = 2.4, phase = reduced.matches ? 0 : (elapsed / 50 % 1) * width; mesh.position.x = (i % 2 ? (i < 2 ? width : -width) : 0) + (i < 2 ? -phase : phase); });
    }
    if (film) film.visible = progress >= .77;
    scene.background = new Color(studioPalette[capsule.theme]);
    if (finale) {
      finale.shirt.rotation.y = -.25 + (reduced.matches ? 0 : Math.sin(elapsed * .25) * .13);
      const scale = compact ? Math.min(1, camera.aspect * 2.05) : 1;
      film!.scale.setScalar(scale);
      film!.position.set(compact ? -.5 * scale : 0, .76 * (1 - scale), 0);
    }
  }
  function tick(now: number) {
    frame = 0; if (!canRun()) return;
    const raw = last ? (now - last) / 1000 : 1 / 60, dt = Math.min(raw, .05); last = now; elapsed += dt; revealElapsed += dt; if (overview && !room) entryElapsed += dt;
    slow = raw > .04 && raw < .2 ? slow + 1 : Math.max(0, slow - 1); if (!quality && slow > 70) { quality = 1; resize(); }
    entryTimeline.totalTime(reduced.matches ? 4 : Math.min(entryElapsed, 4)); revealTimeline.totalTime(reduced.matches ? 1.3 : Math.min(revealElapsed, 1.3));
    const alpha = reduced.matches ? 1 : 1 - Math.exp(-dt * 3.5), target = new Vector3(reduced.matches ? 0 : pointer.x * .5, .7, 3 - (reduced.matches ? 0 : Math.abs(pointer.x * .2)) - zoomLevel);
    camera.position.lerp(target, alpha); camera.lookAt(0, .7, 0); progress += (targetProgress - progress) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 7));
    updateOverview(dt); updateStory(); renderer.render(scene, camera);
    if (overview && host.dataset.scene !== 'ready') { host.dataset.scene = 'ready'; options.onStatus?.('ready'); }
    if (!reduced.matches || camera.position.distanceTo(target) > .001 || Math.abs(progress - targetProgress) > .0001) frame = requestAnimationFrame(tick);
  }
  const ready = (async () => {
    let count = 0;
    const done = (promise: Promise<ModelNodes>) => promise.then((value) => { if (!disposed) options.onProgress?.(++count / 2); return value; });
    const [collection, lettering] = await Promise.all([done(assets.model('collection.glb')), done(assets.model('lettering.glb'))]);
    if (disposed) return;
    models = { ...collection, ...lettering }; overview = buildOverview(models); remember(overview.world); scene.add(overview.world); wake();
  })();
  ready.catch(() => { if (!disposed) { host.dataset.scene = 'fallback'; options.onStatus?.('fallback'); pause(); } });
  async function select(id: string | null) {
    const generation = ++token; selected = id; manualYaw = 0; zoomLevel = 0; progress = targetProgress = 0;
    if (!id) { removeProduct(); mask.visible = false; if (overview) overview.world.visible = true; options.onStatus?.('ready'); wake(); return; }
    const capsule = capsuleFor(id); if (!capsule) { selected = null; return; } options.onStatus?.('loading-product');
    try {
      await ready;
      const collection = await assets.model('collection.glb');
      if (disposed || generation !== token) return;
      models = { ...models, ...collection };
      removeProduct(); room = buildRoom(capsule.theme, models); remember(room.world); scene.add(room.world); if (overview) overview.world.visible = false;
      reveal.value = 0; revealElapsed = 0; revealTimeline.kill(); revealTimeline = gsap.timeline({ paused: true }).to(reveal, { value: 1, duration: 1.3, ease: 'power3.out' }); options.onStatus?.('product-ready'); wake();
      detail = buildDetail(capsule.theme, models); remember(detail.world); scene.add(detail.world);
      finale = buildFinale(capsule.theme, models); film = finale.world; remember(film); scene.add(film); wake();
    } catch { if (!disposed && generation === token) { options.onStatus?.(room ? 'partial' : 'product-error'); wake(); } }
  }
  function hover(id: string | null) { hoverId = id; wake(); }
  function focus(index: number) { mobileIndex = Math.max(0, Math.min(2, index)); wake(); }
  function setProgress(value: number) { targetProgress = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); wake(); }
  function rotate(angle: number) { if (selected && Number.isFinite(angle)) { manualYaw += angle; wake(); } }
  function zoom(delta: number) { if (selected && Number.isFinite(delta)) { zoomLevel = Math.max(-.35, Math.min(.3, zoomLevel + delta)); wake(); } }
  function move(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect(); pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    if (down && selected && down.id === event.pointerId) { const dx = event.clientX - down.x, dy = event.clientY - down.y;
      if (!down.dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) down = null;
      else if (down && (down.dragging || Math.abs(dx) > 8)) { down.dragging = true; canvas.setPointerCapture?.(event.pointerId); rotate(dx * .01); down.x = event.clientX; down.y = event.clientY; }
    }
    if (!selected && overview && event.pointerType !== 'touch') { raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(garmentMeshes(overview.shirts), false)[0]; hover(hit?.object.userData.product || null); canvas.style.cursor = hit ? 'pointer' : ''; } wake();
  }
  const leave = () => { pointer.set(0, 0); hoverId = null; canvas.style.cursor = ''; wake(); };
  const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY, id: event.pointerId, dragging: false }; };
  function pointerUp(event: PointerEvent) {
    const start = down; down = null; if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!start || start.id !== event.pointerId || start.dragging || Math.hypot(start.x - event.clientX, start.y - event.clientY) > 8) return;
    const bounds = canvas.getBoundingClientRect(); raycaster.setFromCamera(new Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2), camera);
    if (!selected && overview) { const hit = raycaster.intersectObjects(garmentMeshes(overview.shirts), false)[0]; if (hit) options.onProductSelect(hit.object.userData.product); }
    else if (film?.visible && raycaster.intersectObjects(film.children, true).some((hit) => hit.object.userData.action === 'shop')) options.onShop?.();
  }
  const cancel = () => { down = null; }, observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); else pause(); }); observer.observe(host);
  const resizer = new ResizeObserver(resize); resizer.observe(host); const visibility = () => document.hidden ? pause() : wake();
  const overlayChange = (event: Event) => { overlay = (event as CustomEvent<{ open: boolean }>).detail.open; if (overlay) pause(); else wake(); };
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; pause(); host.dataset.scene = 'fallback'; options.onStatus?.('context-lost'); };
  const contextRestored = () => { if (disposed) return; lost = false; resize(); wake(); };
  const motionChange = () => { wake(); };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('vector:overlay', overlayChange); reduced.addEventListener('change', motionChange); resize();
  return { ready, select, hover, focus, setProgress, rotate, zoom, getState: () => ({ selected, progress, targetProgress, mobileIndex, manualYaw, zoom: zoomLevel, quality, ready: !!overview, detailReady: !!detail, filmReady: !!film }), dispose() {
    if (disposed) return; disposed = true; token++; pause(); removeProduct(); observer.disconnect(); resizer.disconnect(); entryTimeline.kill(); revealTimeline.kill();
    canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
    document.removeEventListener('visibilitychange', visibility); document.removeEventListener('vector:overlay', overlayChange); reduced.removeEventListener('change', motionChange);
    resources.forEach((material) => material.dispose()); ownedGeometry.forEach((geometry) => geometry.dispose()); mask.geometry.dispose(); maskMaterial.dispose(); assets.dispose(); environmentTarget?.dispose(); key.shadow.dispose(); renderer.dispose(); host.dataset.scene = 'poster';
  } };
}
