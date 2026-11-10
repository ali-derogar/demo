import {
  ACESFilmicToneMapping, AlwaysStencilFunc, Color, DoubleSide, EqualStencilFunc, Group, KeepStencilOp, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, NotEqualStencilFunc, PerspectiveCamera, PlaneGeometry, Raycaster,
  ReplaceStencilOp, Scene, SRGBColorSpace, Texture, Vector2, Vector3, VideoTexture, WebGLRenderer, type Material,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { gsap } from 'gsap';
import { ReferenceAssets, type AssetProvider, type ModelNodes } from './assets';
import { capsules, capsuleFor, overviewMaps, roomMaps, detailMaps, storyPose, range, type StudioTheme } from './studio';

type TextureMap = Record<string, Texture>;
function basic(texture?: Texture) { return new MeshBasicMaterial({ map: texture }); }
function addMesh(parent: Group, nodes: ModelNodes, name: string, material: Material) {
  if (!nodes[name]) throw new Error('Missing reference node: ' + name);
  const object = new Mesh(nodes[name].geometry, material); object.name = name; parent.add(object); return object;
}
export function buildOverview(nodes: ModelNodes, maps: TextureMap) {
  const world = new Group(), environment = addMesh(world, nodes, 'Environment', basic(maps.default));
  const shirts = capsules.map((capsule) => {
    const shirt = addMesh(world, nodes, capsule.node, basic(maps[capsule.theme + 'Shirt']));
    shirt.position.fromArray(capsule.position); shirt.rotation.y = capsule.yaw; shirt.userData.product = capsule.product; return shirt;
  });
  return { world, environment, shirts };
}
export function buildRoom(theme: StudioTheme, nodes: ModelNodes, maps: TextureMap) {
  const world = new Group(); let shirt: Mesh;
  if (theme === 'white') {
    for (const [node, map] of [['DJ_Table', 'dj'], ['Speakers', 'speakers'], ['LED_Cube_White', 'studio'], ['Wall', 'studio'], ['Floor', 'studio'], ['TV', 'studio'], ['TV_Screen', 'tv']]) addMesh(world, nodes, node, basic(maps[map]));
    shirt = addMesh(world, nodes, 'Shirt_White', basic(maps.shirt));
  } else if (theme === 'sport') {
    for (const [node, map] of [['Environment', 'env'], ['Ramp', 'ramp'], ['SakteBoard', 'skateboard']]) {
      const object = addMesh(world, nodes, node, basic(maps[map])); if (node === 'SakteBoard') object.position.y = -.012;
    }
    shirt = addMesh(world, nodes, 'Shirt_Sport', basic(maps.shirt)); shirt.rotation.set(Math.PI, 0, Math.PI);
  } else {
    for (const [node, map] of [['Floor', 'floor'], ['Wall', 'wall'], ['Asset', 'assets']]) addMesh(world, nodes, node, basic(maps[map]));
    shirt = addMesh(world, nodes, 'Shirt_Gray', basic(maps.shirt));
  }
  shirt.position.set(0, .7, 0); return { world, shirt };
}
export function buildDetail(theme: StudioTheme, nodes: ModelNodes, maps: TextureMap) {
  const world = new Group(), shirt = addMesh(world, nodes, 'Shirt', basic(maps.shirt)); addMesh(world, nodes, 'Sphere_ENV', basic(maps.sphere));
  const color = theme === 'white' ? '#141414' : theme === 'sport' ? '#f32926' : '#efefef';
  const textMaterial = new MeshBasicMaterial({ color, transparent: true }), marqueeMaterial = new MeshBasicMaterial({ color, transparent: true, opacity: 0 });
  const texts = new Group(); world.add(texts);
  for (const [name, node] of Object.entries(nodes)) if (name.startsWith('Texts')) { const text = addMesh(texts, nodes, name, textMaterial); text.position.copy(node.position); }
  const marquees = [['Marquee_Top_Bottom', 0], ['Marquee_Top_Bottom', 5.7], ['Marquee_Middle', 0], ['Marquee_Middle', -6.2]].map(([name, x]) => { const object = addMesh(world, nodes, String(name), marqueeMaterial); object.position.x = Number(x); return object; });
  return { world, shirt, texts, textMaterial, marqueeMaterial, marquees };
}
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
  const assets = options.assets ?? new ReferenceAssets(), scene = new Scene(), camera = new PerspectiveCamera(30, 1, .01, 100);
  scene.background = new Color('#555'); camera.position.set(0, .7, 3); camera.lookAt(0, .7, 0);
  const maskMaterial = new MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, stencilWrite: true, stencilRef: 1, stencilFunc: AlwaysStencilFunc, stencilFail: ReplaceStencilOp, stencilZFail: ReplaceStencilOp, stencilZPass: ReplaceStencilOp, side: DoubleSide });
  const mask = new Mesh(new PlaneGeometry(1, 1), maskMaterial); mask.renderOrder = 0; mask.visible = false; scene.add(mask);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), pointer = new Vector2(), raycaster = new Raycaster();
  const entry = { value: 0 }, reveal = { value: 0 }, entryTimeline = gsap.timeline({ paused: true }).to(entry, { value: 1, duration: 4, ease: 'power4.inOut' });
  let revealTimeline = gsap.timeline({ paused: true }).to(reveal, { value: 1, duration: 1.3, ease: 'power3.out' });
  let overview: ReturnType<typeof buildOverview> | null = null, maps: TextureMap = {};
  let room: ReturnType<typeof buildRoom> | null = null, detail: ReturnType<typeof buildDetail> | null = null, film: Group | null = null;
  let video: HTMLVideoElement | null = null, videoTexture: VideoTexture | null = null, mirror: Reflector | null = null;
  let selected: string | null = null, hoverId: string | null = null, mobileIndex = 1, targetProgress = 0, progress = 0, manualYaw = 0, zoomLevel = 0;
  let frame = 0, last = 0, elapsed = 0, entryElapsed = 0, revealElapsed = 0, visible = true, overlay = !!document.querySelector('dialog[open]'), lost = false, disposed = false, quality = 0, slow = 0, compact = window.innerWidth < 768, token = 0;
  const resources = new Set<Material>(), ownedGeometry = new Set<PlaneGeometry>();
  let down: { x: number; y: number; id: number; dragging: boolean } | null = null;
  function remember(group: Group) { group.traverse((o) => { if (o instanceof Mesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => resources.add(m)); }); }
  function releaseFilm() { video?.pause(); if (video) { video.removeAttribute('src'); video.load(); } videoTexture?.dispose(); mirror?.getRenderTarget().dispose(); mirror = null; video = null; videoTexture = null; }
  function removeProduct() { if (room) scene.remove(room.world); if (detail) scene.remove(detail.world); if (film) scene.remove(film); releaseFilm(); room = null; detail = null; film = null; }
  function canRun() { return !disposed && !lost && visible && !document.hidden && !overlay; }
  function pause() { cancelAnimationFrame(frame); frame = 0; last = 0; video?.pause(); }
  function wake() { if (!frame && canRun()) frame = requestAnimationFrame(tick); }
  function resize() {
    if (disposed || lost) return; const bounds = host.getBoundingClientRect(); if (!bounds.width || !bounds.height) return;
    compact = window.innerWidth < 768; renderer.setPixelRatio(quality ? 1 : Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)); renderer.setSize(bounds.width, bounds.height, false); camera.aspect = bounds.width / bounds.height; camera.updateProjectionMatrix(); wake();
  }
  function updateOverview(dt: number) {
    if (!overview) return;
    const value = reduced.matches ? 1 : entry.value;
    overview.world.visible = !room; overview.world.scale.setScalar(window.innerWidth <= 400 ? .8 : 1);
    overview.world.position.set(0, -.15 * (1 - value), 2 * (1 - value));
    const active = compact ? capsules[mobileIndex].product : hoverId;
    (overview.environment.material as MeshBasicMaterial).map = maps[active ? capsuleFor(active)!.theme : 'default'];
    overview.shirts.forEach((shirt, index) => {
      const capsule = capsules[index], focused = active === capsule.product, shift = compact ? (mobileIndex - 1) * .65 : 0;
      const yaw = focused ? 0 : capsule.yaw * (4 - value * 3), alpha = reduced.matches ? 1 : 1 - Math.exp(-dt * 5);
      shirt.rotation.y += (yaw - shirt.rotation.y) * alpha;
      shirt.position.set(capsule.position[0] * (2 - value) + shift, .7, compact && focused ? 0 : capsule.position[2]);
      const scale = focused ? 1.05 : 1; shirt.scale.lerp(new Vector3(scale, scale, scale), alpha);
    });
  }
  function updateStory() {
    if (!room || !selected) return;
    const capsule = capsuleFor(selected)!, pose = storyPose(progress, compact), viewportHeight = 2 * camera.position.z * Math.tan(Math.PI / 12), viewportWidth = viewportHeight * camera.aspect;
    room.world.visible = progress < .30; room.world.position.y = pose.roomY; room.shirt.rotation.y = pose.shirtYaw + manualYaw;
    if (capsule.theme === 'sport') room.shirt.rotation.set(Math.PI, pose.shirtYaw + manualYaw, Math.PI);
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
      detail.world.rotation.set(pose.detailPitch, pose.detailYaw + manualYaw, 0); detail.world.scale.setScalar(pose.detailScale);
      detail.textMaterial.opacity = 1 - range(pose.turn, .1, .28); detail.marqueeMaterial.opacity = .10 * range(pose.turn, .12, .30); detail.texts.scale.setScalar(range(pose.turn, 0, .15));
      detail.marquees.forEach((mesh, i) => { const width = i < 2 ? 5.7 : 6.2, phase = reduced.matches ? 0 : (elapsed / 50 % 1) * width; mesh.position.x = (i % 2 ? (i < 2 ? width : -width) : 0) + (i < 2 ? -phase : phase); });
    }
    if (film) film.visible = progress >= .77;
    scene.background = new Color(capsule.theme === 'white' ? '#ededed' : capsule.theme === 'sport' ? '#2b0000' : '#252525');
    if (video && film?.visible && canRun() && !reduced.matches && video.paused) video.play().catch(() => {});
    else if (!film?.visible) video?.pause();
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
  async function textureMap(paths: Record<string, string>) { return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await assets.texture(path)]))); }
  const ready = (async () => {
    let count = 0; const done = <T>(promise: Promise<T>) => promise.then((value) => { if (!disposed) options.onProgress?.(++count / 8); return value; });
    const [nodes, textures] = await Promise.all([done(assets.model('models/main/MainStudio.glb')), Promise.all(Object.entries(overviewMaps).map(async ([key, path]) => [key, await done(assets.texture(path))]))]);
    if (disposed) return; maps = Object.fromEntries(textures) as TextureMap; overview = buildOverview(nodes, maps); remember(overview.world); scene.add(overview.world); wake();
  })();
  ready.catch(() => { if (!disposed) { host.dataset.scene = 'fallback'; options.onStatus?.('fallback'); pause(); } });
  async function select(id: string | null) {
    const generation = ++token; selected = id; manualYaw = 0; zoomLevel = 0; progress = targetProgress = 0;
    if (!id) { removeProduct(); mask.visible = false; if (overview) overview.world.visible = true; options.onStatus?.('ready'); wake(); return; }
    const capsule = capsuleFor(id); if (!capsule) { selected = null; return; } options.onStatus?.('loading-product');
    try {
      await ready;
      const [nodes, textures] = await Promise.all([assets.model(`models/${capsule.theme}/${capsule.theme === 'white' ? 'White' : capsule.theme === 'sport' ? 'Sport' : 'Gray'}Studio.glb`), textureMap(roomMaps[capsule.theme])]);
      if (disposed || generation !== token) return;
      removeProduct(); room = buildRoom(capsule.theme, nodes, textures); remember(room.world); scene.add(room.world); if (overview) overview.world.visible = false;
      reveal.value = 0; revealElapsed = 0; revealTimeline.kill(); revealTimeline = gsap.timeline({ paused: true }).to(reveal, { value: 1, duration: 1.3, ease: 'power3.out' }); options.onStatus?.('product-ready'); wake();
      const [detailNodes, detailTextures] = await Promise.all([assets.model('models/ShirtScrolling.glb'), textureMap(detailMaps[capsule.theme])]);
      if (disposed || generation !== token) return;
      detail = buildDetail(capsule.theme, detailNodes, detailTextures); remember(detail.world); scene.add(detail.world); wake();
      const [floorNormal, overlayTexture, cube, still] = await Promise.all([assets.texture('textures/FloorNormal.png', false), assets.texture('textures/SmudgesOverlay.jpg'), assets.cube(`textures/${capsule.theme}/third/`), assets.texture(`../img/film-${capsule.theme}.webp`)]);
      if (disposed || generation !== token) return;
      film = new Group(); const wall = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial({ color: capsule.theme === 'white' ? '#fff' : capsule.theme === 'sport' ? '#2b0000' : '#252525', map: overlayTexture })); wall.position.set(0, 5, -1.3); film.add(wall); ownedGeometry.add(wall.geometry);
      mirror = new Reflector(new PlaneGeometry(10, 3), { color: capsule.theme === 'white' ? '#bababa' : '#595959', textureWidth: compact ? 512 : 1024, textureHeight: compact ? 512 : 1024, clipBias: .003 }); mirror.rotation.x = -Math.PI / 2; mirror.position.y = .199; mirror.renderOrder = 1; film.add(mirror); ownedGeometry.add(mirror.geometry as PlaneGeometry);
      const floor = new Mesh(new PlaneGeometry(10, 3), new MeshStandardMaterial({ envMap: cube, normalMap: floorNormal, map: overlayTexture, transparent: true, opacity: .40, roughness: .8 })); floor.rotation.x = -Math.PI / 2; floor.position.y = .20; film.add(floor); ownedGeometry.add(floor.geometry);
      const screenMaterial = basic(still), screen = new Mesh(new PlaneGeometry(16, 9), screenMaterial); screen.scale.setScalar(compact ? .06 : .10); screen.rotation.y = -Math.PI / 6; screen.position.set(compact ? 0 : .2, compact ? .45 : .65, 0); film.add(screen); ownedGeometry.add(screen.geometry);
      const button = new Mesh(new PlaneGeometry(.5, .13), new MeshBasicMaterial({ color: capsule.theme === 'white' ? '#111' : '#eee' })); button.position.set(compact ? 0 : -.8, compact ? .88 : .7, .02); button.rotation.y = compact ? -Math.PI / 9 : Math.PI / 9; button.userData.action = 'shop'; film.add(button); ownedGeometry.add(button.geometry);
      video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none'; video.src = new URL(`./assets/reference/textures/${capsule.theme}/third/adidas.mp4`, import.meta.url).href;
      const ownVideo = video; videoTexture = new VideoTexture(video); videoTexture.colorSpace = SRGBColorSpace; const ownVideoTexture = videoTexture;
      video.addEventListener('loadeddata', () => { if (video !== ownVideo || disposed) return; screenMaterial.map = ownVideoTexture; screenMaterial.needsUpdate = true; wake(); }, { once: true }); video.load(); remember(film); scene.add(film); wake();
    } catch { if (!disposed && generation === token) { options.onStatus?.(room ? 'partial' : 'product-error'); wake(); } }
  }
  function hover(id: string | null) { hoverId = id; wake(); }
  function focus(index: number) { mobileIndex = Math.max(0, Math.min(2, index)); wake(); }
  function setProgress(value: number) { targetProgress = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); wake(); }
  function rotate(angle: number) { if (selected && Number.isFinite(angle)) { manualYaw += angle; wake(); } }
  function zoom(delta: number) { if (selected && Number.isFinite(delta)) { zoomLevel = Math.max(-.35, Math.min(.3, zoomLevel + delta)); wake(); } }
  function move(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect(); pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    if (down && selected) { const dx = event.clientX - down.x, dy = event.clientY - down.y;
      if (!down.dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) down = null;
      else if (down && (down.dragging || Math.abs(dx) > 8)) { down.dragging = true; canvas.setPointerCapture?.(event.pointerId); rotate(dx * .01); down.x = event.clientX; down.y = event.clientY; }
    }
    if (!selected && overview && event.pointerType !== 'touch') { raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(overview.shirts, false)[0]; hover(hit?.object.userData.product || null); canvas.style.cursor = hit ? 'pointer' : ''; } wake();
  }
  const leave = () => { pointer.set(0, 0); hoverId = null; canvas.style.cursor = ''; wake(); };
  const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY, id: event.pointerId, dragging: false }; };
  function pointerUp(event: PointerEvent) {
    const start = down; down = null; if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!start || start.dragging || Math.hypot(start.x - event.clientX, start.y - event.clientY) > 8) return;
    const bounds = canvas.getBoundingClientRect(); raycaster.setFromCamera(new Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2), camera);
    if (!selected && overview) { const hit = raycaster.intersectObjects(overview.shirts, false)[0]; if (hit) options.onProductSelect(hit.object.userData.product); }
    else if (film?.visible && raycaster.intersectObjects(film.children, true).some((hit) => hit.object.userData.action === 'shop')) options.onShop?.();
  }
  const cancel = () => { down = null; }, observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); else pause(); }); observer.observe(host);
  const resizer = new ResizeObserver(resize); resizer.observe(host); const visibility = () => document.hidden ? pause() : wake();
  const overlayChange = (event: Event) => { overlay = (event as CustomEvent<{ open: boolean }>).detail.open; if (overlay) pause(); else wake(); };
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; pause(); host.dataset.scene = 'fallback'; options.onStatus?.('context-lost'); };
  const contextRestored = () => { if (disposed) return; lost = false; resize(); wake(); };
  const motionChange = () => { if (reduced.matches) video?.pause(); wake(); };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('vector:overlay', overlayChange); reduced.addEventListener('change', motionChange); resize();
  return { ready, select, hover, focus, setProgress, rotate, zoom, getState: () => ({ selected, progress, targetProgress, mobileIndex, manualYaw, zoom: zoomLevel, quality, ready: !!overview, detailReady: !!detail, filmReady: !!film }), dispose() {
    if (disposed) return; disposed = true; token++; pause(); removeProduct(); observer.disconnect(); resizer.disconnect(); entryTimeline.kill(); revealTimeline.kill();
    canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
    document.removeEventListener('visibilitychange', visibility); document.removeEventListener('vector:overlay', overlayChange); reduced.removeEventListener('change', motionChange);
    resources.forEach((material) => material.dispose()); ownedGeometry.forEach((geometry) => geometry.dispose()); mask.geometry.dispose(); maskMaterial.dispose(); assets.dispose(); renderer.dispose(); host.dataset.scene = 'poster';
  } };
}
