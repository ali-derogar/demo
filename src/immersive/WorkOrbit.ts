import {
  Color, DataTexture, DoubleSide, Group, Mesh, PlaneGeometry, Raycaster,
  RGBAFormat, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3,
  type PerspectiveCamera, type Texture, type WebGLRenderer,
} from 'three';
import type { DemoProject } from '../data/projects';
import { getPointer } from '../lib/raf';
import { ORBIT_CARD_HEIGHT, ORBIT_CARD_WIDTH, ORBIT_CURVE_RADIUS, ORBIT_RADIUS, insideOrbitCard, orbitPose, type OrbitMotion } from './orbit';
import { orbitFragment, orbitVertex } from './orbitShaders';
import { createResourceQueue } from './resourceQueue';
import { createProjectLabel } from './projectLabel';
import { galleryCardFrame, projectFrame, smoothRange } from './projectPresentation';
import { createProjectRim } from './ProjectRim';

/** Scene module only: renderer, camera, post-processing and RAF belong to Stage. */
export function createWorkOrbit(renderer: WebGLRenderer, linearOutput: boolean, mobile = false) {
  const group = new Group();
  group.name = 'work-orbit';
  const rim = createProjectRim();
  group.visible = false;
  const geometry = new PlaneGeometry(ORBIT_CARD_WIDTH, ORBIT_CARD_HEIGHT, 40, 8);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const angle = vertices.getX(i) / ORBIT_CURVE_RADIUS;
    vertices.setX(i, Math.sin(angle) * ORBIT_CURVE_RADIUS);
    vertices.setZ(i, (Math.cos(angle) - 1) * ORBIT_CURVE_RADIUS);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const placeholder = new DataTexture(new Uint8Array([12, 20, 24, 255]), 1, 1, RGBAFormat);
  placeholder.needsUpdate = true;
  const backdrop = { value: placeholder as Texture };
  const backdropReady = { value: 0 };
  const viewSize = { value: new Vector2(1, 1) };
  const cssSize = { value: new Vector2(1, 1) };
  const flow = { value: placeholder as Texture };
  const flowReady = { value: 0 };
  let stableHeight = 1;
  const labels = new Map<string, ReturnType<typeof createProjectLabel>>();
  let portrait = false;
  let disposed = false;
  const loader = new TextureLoader();
  const images = createResourceQueue<Texture>((url) => new Promise((resolve, reject) => {
    loader.load(url, (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      if (!disposed) renderer.initTexture?.(texture);
      resolve(texture);
    }, undefined, reject);
  }), (texture) => texture.dispose());
  let items: DemoProject[] = [];
  let panels: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  let previousPosition: number | null = null;
  let priorityKey = '';
  let speed = 0;
  let hoverIndex = -1;
  let presented = false;
  let pendingReady = false;
  let pendingLabels = false;
  const ndc = new Vector2();
  const raycaster = new Raycaster();
  const center = new Vector3();
  const destination = new Vector3();
  const projected = new Vector3();
  const caseTilt = new Vector2();
  const rimNeutral = new Color('#d8e0df');
  const drawOrder: typeof panels = [];

  function prepare(next: DemoProject[]) {
    if (next === items) return;
    rim.mesh.removeFromParent();
    panels.forEach((panel) => { group.remove(panel); panel.material.dispose(); });
    items = next;
    priorityKey = '';
    previousPosition = null;
    presented = pendingReady = pendingLabels = false;
    panels = next.map((project, index) => {
      if (!project.visual && !labels.has(project.id)) labels.set(project.id, createProjectLabel(project, portrait, mobile));
      const label = labels.get(project.id);
      const material = new ShaderMaterial({
        uniforms: {
          uImage: { value: placeholder as Texture }, uLoaded: { value: 0 },
          uTime: { value: 0 }, uSpeed: { value: 0 }, uHover: { value: 0 },
          uFocus: { value: index === 0 ? 1 : 0 }, uReveal: { value: 0 },
          uSelected: { value: 0 },
          uPresentation: { value: 0 }, uFlatten: { value: 0 },
          uImageAspect: { value: 1.5 }, uFrameAspect: { value: 1.8 },
          uMediaSize: { value: new Vector2(1, 1) }, uFlow: flow, uFlowReady: flowReady,
          uCssSize: cssSize,
          uBackdrop: backdrop, uBackdropReady: backdropReady, uViewSize: viewSize,
          uTitle: { value: label?.texture ?? placeholder }, uTitleReady: { value: label ? 1 : 0 },
          uEncodeOutput: { value: linearOutput ? 0 : 1 },
          uAccent: { value: new Color(project.accent) },
        },
        vertexShader: orbitVertex, fragmentShader: orbitFragment,
        side: DoubleSide, transparent: true, depthWrite: false, toneMapped: false,
      });
      const panel = new Mesh(geometry, material);
      material.forceSinglePass = true;
      const pose = orbitPose(index, next.length, portrait);
      panel.position.set(pose.x, pose.y, pose.z);
      panel.rotation.y = pose.angle;
      panel.userData.index = index;
      panel.userData.pose = pose;
      group.add(panel);
      return panel;
    });
    drawOrder.splice(0, drawOrder.length, ...panels);
  }

  function advance(state: OrbitMotion, dt: number) {
    prepare(state.items);
    const ease = 1 - Math.exp(-dt * (state.dragging ? 16 : 8));
    state.position = state.scrollDriven ? state.target : state.position + (state.target - state.position) * ease;
    if (!state.scrollDriven) state.selection += ((state.selectedIndex === null ? 0 : 1) - state.selection) * (1 - Math.exp(-dt * 6));
    speed = previousPosition === null ? 0 : (state.position - previousPosition) / Math.max(dt, .001);
    previousPosition = state.position;
    const target = Math.round(state.target);
    const current = Math.round(state.position);
    const key = `${target}:${current}:${state.presentation?.projectId ?? ''}`;
    if (key !== priorityKey) {
      priorityKey = key;
      const rank = (index: number) => items[index].id === state.presentation?.projectId ? -3 : index === target ? -2 : index === current ? -1 : Math.min(Math.abs(index - target), Math.abs(index - current));
      images.prioritize(items.map((project, index) => ({ url: project.preview, index }))
        .sort((a, b) => rank(a.index) - rank(b.index)).map((item) => item.url));
    }
  }

  function cameraPose(state: OrbitMotion, aspect: number, fov: number, eye: Vector3, aim: Vector3) {
    const pose = orbitPose(state.position, Math.max(1, state.items.length), portrait);
    const halfFov = Math.tan(fov * Math.PI / 360);
    const compact = cssSize.value.x < 1024 && cssSize.value.x <= stableHeight;
    const phoneFrame = state.scrollDriven && cssSize.value.x < 768 && compact ? galleryCardFrame(cssSize.value.x, stableHeight) : null;
    const widthFraction = phoneFrame ? phoneFrame.width / cssSize.value.x : state.scrollDriven && compact
      ? Math.min(.82, projectFrame(cssSize.value.x, cssSize.value.y, stableHeight).width * .9 / cssSize.value.x) : .82;
    const distance = Math.max(
      ORBIT_CARD_HEIGHT / (2 * halfFov * .54),
      ORBIT_CARD_WIDTH / (2 * halfFov * aspect * widthFraction),
    ) * (state.scrollDriven ? 1 : 1 - state.selection * (portrait ? .015 : .08));
    eye.set(Math.sin(pose.angle) * (ORBIT_RADIUS + distance), pose.y + .18, Math.cos(pose.angle) * (ORBIT_RADIUS + distance));
    aim.set(pose.x, pose.y, pose.z);
    if (phoneFrame) {
      const offset = ((phoneFrame.top + phoneFrame.height / 2) / cssSize.value.y - .5) * 2 * distance * halfFov;
      eye.y += offset;
      aim.y += offset;
    }
    if (!state.scrollDriven) aim.y += state.selection * .06;
  }

  function hitTest(camera: PerspectiveCamera, x: number, y: number, width: number, height: number): number {
    if (!group.visible) return -1;
    ndc.set(x / Math.max(1, width) * 2 - 1, 1 - y / Math.max(1, height) * 2);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(panels, false).find((item) => item.object instanceof Mesh && item.object.material.uniforms.uReveal.value > .005 && item.uv && insideOrbitCard(item.uv.x, item.uv.y));
    return (hit?.object.userData.index as number | undefined) ?? -1;
  }

  function boundsFor(panel: typeof panels[number], camera: PerspectiveCamera, flatten: number) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    panel.updateMatrixWorld(true);
    for (const x of [-ORBIT_CARD_WIDTH / 2, 0, ORBIT_CARD_WIDTH / 2]) for (const y of [-ORBIT_CARD_HEIGHT / 2, 0, ORBIT_CARD_HEIGHT / 2]) {
      projected.set(Math.sin(x / ORBIT_CURVE_RADIUS) * ORBIT_CURVE_RADIUS * (1 - flatten) + x * flatten, y,
        (Math.cos(x / ORBIT_CURVE_RADIUS) - 1) * ORBIT_CURVE_RADIUS * (1 - flatten)).applyMatrix4(panel.matrixWorld).project(camera);
      const px = (projected.x + 1) * cssSize.value.x / 2, py = (1 - projected.y) * cssSize.value.y / 2;
      left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
    return { left, top, width: right - left, height: bottom - top };
  }

  function update(state: OrbitMotion, camera: PerspectiveCamera, time: number, dt: number, reveal: number, interactive: boolean, pointerEffects = true) {
    state.reveal = reveal;
    group.visible = reveal > .005;
    const pointer = getPointer();
    const hover = interactive && !state.dragging && pointer.active
      ? hitTest(camera, pointer.x, pointer.y, window.innerWidth, window.innerHeight) : -1;
    hoverIndex = hover;
    const ease = 1 - Math.exp(-dt * 8);
    const presentation = state.presentation;
    const progress = presentation?.progress ?? 0;
    const heroMix = smoothRange(progress, .2, 1);
    const flatten = heroMix * .82;
    const neighborReveal = 1 - smoothRange(progress, 0, .2);
    let hero: typeof panels[number] | undefined;
    const pointerEnabled = pointerEffects && !mobile && pointer.active && !!presentation?.projectId && presentation.phase !== 'closing';
    const tiltEase = state.scrollDriven ? 1 : ease;
    caseTilt.x += ((pointerEnabled ? Math.max(-1, Math.min(1, pointer.nx)) : 0) - caseTilt.x) * tiltEase;
    caseTilt.y += ((pointerEnabled ? Math.max(-1, Math.min(1, pointer.ny)) : 0) - caseTilt.y) * tiltEase;
    panels.forEach((panel, index) => {
      const uniforms = panel.material.uniforms;
      const selected = state.selectedIndex === index ? 1 : 0;
      uniforms.uSelected.value = state.scrollDriven ? selected * progress : uniforms.uSelected.value + (selected - uniforms.uSelected.value) * (1 - Math.exp(-dt * 6));
      const lift = uniforms.uSelected.value as number;
      const pose = panel.userData.pose as ReturnType<typeof orbitPose>;
      panel.rotation.set(0, pose.angle, 0);
      panel.position.set(pose.x + Math.sin(pose.angle) * lift * .18, pose.y + lift * .06, pose.z + Math.cos(pose.angle) * lift * .18);
      const scale = state.scrollDriven ? 1 : 1 + lift * .02;
      panel.scale.set(scale, scale, scale);
      const texture = images.get(items[index].preview);
      uniforms.uImage.value = texture ?? placeholder;
      uniforms.uLoaded.value = texture ? 1 : 0;
      const image = texture?.image as { width?: number; height?: number } | undefined;
      const imageAspect = image?.width && image?.height ? image.width / image.height : 1.5;
      uniforms.uImageAspect.value = imageAspect;
      const isHero = items[index].id === presentation?.projectId;
      uniforms.uPresentation.value = isHero ? smoothRange(progress, 0, .55) : 0;
      uniforms.uFlatten.value = isHero ? flatten : 0;
      if (isHero) {
        hero = panel;
        const frame = projectFrame(cssSize.value.x, cssSize.value.y, stableHeight, imageAspect);
        const base = boundsFor(panel, camera, 0);
        const target = { left: base.left + (frame.left - base.left) * heroMix, top: base.top + (frame.top - base.top) * heroMix,
          width: base.width + (frame.width - base.width) * heroMix, height: base.height + (frame.height - base.height) * heroMix };
        const baseDepth = -center.copy(panel.position).applyMatrix4(camera.matrixWorldInverse).z;
        const depth = baseDepth + (4.8 - baseDepth) * heroMix;
        const halfHeight = Math.tan(camera.fov * Math.PI / 360) * depth;
        if (heroMix > 0) {
          destination.set(((target.left + target.width / 2) / cssSize.value.x * 2 - 1) * halfHeight * camera.aspect,
            (1 - (target.top + target.height / 2) / cssSize.value.y * 2) * halfHeight, -depth).applyMatrix4(camera.matrixWorld);
          panel.position.copy(destination);
          panel.quaternion.slerp(camera.quaternion, heroMix);
          panel.scale.set(target.width / cssSize.value.x * halfHeight * 2 * camera.aspect / ORBIT_CARD_WIDTH,
            target.height / cssSize.value.y * halfHeight * 2 / ORBIT_CARD_HEIGHT, 1);
          // Correct the small projected curvature margin in screen space. This
          // avoids the mid-transition overshoot of independent world/scale lerps.
          for (let pass = 0; pass < 2; pass++) {
            panel.updateMatrixWorld(true);
            const actual = boundsFor(panel, camera, flatten);
            panel.scale.x *= target.width / actual.width;
            panel.scale.y *= target.height / actual.height;
          }
        }
        destination.set((state.scrollDriven ? 0 : Math.cos(time * .48) * .025) + caseTilt.x * .025, (state.scrollDriven ? 0 : Math.sin(time * .8) * .035) + caseTilt.y * .015, 0).applyQuaternion(camera.quaternion);
        panel.position.addScaledVector(destination, heroMix);
        panel.rotateY(((state.scrollDriven ? 0 : Math.sin(time * .26) * .012) + caseTilt.x * .015) * heroMix);
        panel.rotateX(((state.scrollDriven ? 0 : Math.cos(time * .31) * .007) - caseTilt.y * .008) * heroMix);
        uniforms.uMediaSize.value.set(frame.width, frame.height);
      }
      uniforms.uFrameAspect.value = ORBIT_CARD_WIDTH * panel.scale.x / (ORBIT_CARD_HEIGHT * panel.scale.y);
      const focus = Math.exp(-Math.pow(index - state.position, 2) * 1.6);
      uniforms.uFocus.value += (focus - uniforms.uFocus.value) * ease;
      uniforms.uHover.value = mobile ? 0 : uniforms.uHover.value + ((hover === index ? 1 : 0) - uniforms.uHover.value) * ease;
      uniforms.uSpeed.value = mobile || state.scrollDriven ? 0 : uniforms.uSpeed.value + (speed - uniforms.uSpeed.value) * ease;
      uniforms.uTime.value = time;
      uniforms.uReveal.value = reveal * (isHero ? 1 : presentation?.projectId ? neighborReveal : selected ? 1 : 1 - .7 * Math.max(0, state.selection - lift));
    });
    rim.mesh.visible = !!hero && progress > .001;
    if (hero) {
      if (rim.mesh.parent !== hero) hero.add(rim.mesh);
      rim.mesh.material.opacity = smoothRange(progress, .05, .5) * .72;
      rim.mesh.material.color.set(items[hero.userData.index].accent).lerp(rimNeutral, .6);
    }
    group.updateMatrixWorld(true);
    const frontIndex = Math.max(0, Math.min(items.length - 1, Math.round(state.target)));
    const front = items[frontIndex];
    const activePane = hero ?? panels[frontIndex];
    if (activePane) {
      if (hero && presentation) presentation.depth = -center.copy(hero.position).applyMatrix4(camera.matrixWorldInverse).z;
      const bounds = state.bounds ?? (state.bounds = { left: 0, top: 0, width: 0, height: 0 });
      Object.assign(bounds, boundsFor(activePane, camera, hero ? flatten : 0));
      if (hero && presentation) presentation.bounds = bounds;
      activePane.material.uniforms.uMediaSize.value.set(bounds.width, bounds.height);
    }
    // Transparent panes cannot write depth. Paint far panes first in the current camera space.
    drawOrder.forEach((panel) => {
      panel.userData.depth = center.copy(panel.position).applyMatrix4(camera.matrixWorldInverse).z;
    });
    drawOrder.sort((a, b) => a.userData.depth - b.userData.depth);
    drawOrder.forEach((panel, index) => { panel.renderOrder = index + 1; });
    const panel = panels[frontIndex];
    if (panel) center.copy(panel.position).project(camera);
    const inFrame = !!panel && Math.abs(center.x) < .35 && Math.abs(center.y) < .35 && center.z > -1 && center.z < 1;
    pendingReady = !!front && !!images.get(front.preview) && reveal > .005 && (presented || inFrame);
    pendingLabels = !!front && !!labels.get(front.id);
    state.ready &&= pendingReady;
    state.labelsReady &&= pendingLabels;
  }

  return {
    group, prepare, advance, cameraPose, update, hitTest,
    hovered: () => hoverIndex,
    preload(next: DemoProject[]) { images.prioritize(next.slice(0, 3).map((project) => project.preview)); },
    /** Only retire the native poster after a complete, visible GPU frame. */
    present(state: OrbitMotion) {
      state.ready = pendingReady;
      state.labelsReady = pendingLabels;
      if (pendingReady) presented = true;
      if (state.presentation?.projectId) {
        const project = items.find((item) => item.id === state.presentation?.projectId);
        const pane = panels.find((panel) => items[panel.userData.index]?.id === state.presentation?.projectId);
        state.presentation.ready = group.visible && !!project && !!images.get(project.preview) && !!state.presentation.bounds && !!pane && pane.material.uniforms.uReveal.value > .005;
      }
      state.onFrame?.();
      state.presentation?.onFrame?.();
    },
    texture(id: string) { const project = items.find((item) => item.id === id); return project ? images.get(project.preview) : undefined; },
    setFlow(texture?: Texture) { flow.value = texture ?? placeholder; flowReady.value = texture ? 1 : 0; },
    resize(width: number, height: number, dpr: number, stickyHeight = height) {
      stableHeight = stickyHeight;
      cssSize.value.set(Math.max(1, width), Math.max(1, height));
      viewSize.value.set(Math.max(1, width * dpr), Math.max(1, height * dpr));
      const nextPortrait = width / Math.max(1, height) < .8;
      if (nextPortrait !== portrait) {
        portrait = nextPortrait;
        labels.forEach((label) => label?.dispose()); labels.clear();
        const next = items; items = []; prepare(next);
      }
    },
    setBackdrop(texture: Texture) { backdrop.value = texture; backdropReady.value = 1; },
    clearBackdrop() { backdrop.value = placeholder; backdropReady.value = 0; },
    dispose() {
      disposed = true;
      geometry.dispose();
      rim.dispose();
      placeholder.dispose();
      panels.forEach((panel) => panel.material.dispose());
      images.dispose();
      labels.forEach((label) => label?.dispose()); labels.clear();
    },
  };
}
