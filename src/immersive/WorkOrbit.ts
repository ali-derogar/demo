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

/** Scene module only: renderer, camera, post-processing and RAF belong to Stage. */
export function createWorkOrbit(renderer: WebGLRenderer, linearOutput: boolean, mobile = false) {
  const group = new Group();
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
  const labels = new Map<string, ReturnType<typeof createProjectLabel>>();
  let portrait = false;
  const loader = new TextureLoader();
  const images = createResourceQueue<Texture>((url) => new Promise((resolve, reject) => {
    loader.load(url, (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      resolve(texture);
    }, undefined, reject);
  }), (texture) => texture.dispose());
  let items: DemoProject[] = [];
  let panels: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  let previousPosition: number | null = null;
  let priorityKey = '';
  let speed = 0;
  const ndc = new Vector2();
  const raycaster = new Raycaster();

  function prepare(next: DemoProject[]) {
    if (next === items) return;
    panels.forEach((panel) => { group.remove(panel); panel.material.dispose(); });
    items = next;
    priorityKey = '';
    previousPosition = null;
    panels = next.map((project, index) => {
      if (!labels.has(project.id)) labels.set(project.id, createProjectLabel(project, portrait, mobile));
      const label = labels.get(project.id);
      const material = new ShaderMaterial({
        uniforms: {
          uImage: { value: placeholder as Texture }, uLoaded: { value: 0 },
          uTime: { value: 0 }, uSpeed: { value: 0 }, uHover: { value: 0 },
          uFocus: { value: index === 0 ? 1 : 0 }, uReveal: { value: 0 },
          uSelected: { value: 0 },
          uBackdrop: backdrop, uBackdropReady: backdropReady, uViewSize: viewSize,
          uTitle: { value: label?.texture ?? placeholder }, uTitleReady: { value: label ? 1 : 0 },
          uEncodeOutput: { value: linearOutput ? 0 : 1 },
          uAccent: { value: new Color(project.accent) },
        },
        vertexShader: orbitVertex, fragmentShader: orbitFragment,
        side: DoubleSide, transparent: true, toneMapped: false,
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
  }

  function advance(state: OrbitMotion, dt: number) {
    prepare(state.items);
    const ease = 1 - Math.exp(-dt * (state.dragging ? 16 : 8));
    state.position += (state.target - state.position) * ease;
    state.selection += ((state.selectedIndex === null ? 0 : 1) - state.selection) * (1 - Math.exp(-dt * 6));
    speed = previousPosition === null ? 0 : (state.position - previousPosition) / Math.max(dt, .001);
    previousPosition = state.position;
    const target = Math.round(state.target);
    const current = Math.round(state.position);
    const key = `${target}:${current}`;
    if (key !== priorityKey) {
      priorityKey = key;
      const rank = (index: number) => index === target ? -2 : index === current ? -1 : Math.min(Math.abs(index - target), Math.abs(index - current));
      images.prioritize(items.map((project, index) => ({ url: project.preview, index }))
        .sort((a, b) => rank(a.index) - rank(b.index)).map((item) => item.url));
    }
  }

  function cameraPose(state: OrbitMotion, aspect: number, fov: number, eye: Vector3, aim: Vector3) {
    const pose = orbitPose(state.position, Math.max(1, state.items.length), portrait);
    const halfFov = Math.tan(fov * Math.PI / 360);
    const distance = Math.max(
      ORBIT_CARD_HEIGHT / (2 * halfFov * .62),
      ORBIT_CARD_WIDTH * (portrait ? .62 : 1) / (2 * halfFov * aspect * .9),
    ) * (1 - state.selection * (aspect < .8 ? .025 : .12));
    eye.set(Math.sin(pose.angle) * (ORBIT_RADIUS + distance), pose.y + .18, Math.cos(pose.angle) * (ORBIT_RADIUS + distance));
    aim.set(pose.x, pose.y, pose.z);
    aim.y += state.selection * .06;
  }

  function hitTest(camera: PerspectiveCamera, x: number, y: number, width: number, height: number): number {
    if (!group.visible) return -1;
    ndc.set(x / Math.max(1, width) * 2 - 1, 1 - y / Math.max(1, height) * 2);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(panels, false).find((item) => item.uv && insideOrbitCard(item.uv.x, item.uv.y));
    return (hit?.object.userData.index as number | undefined) ?? -1;
  }

  function update(state: OrbitMotion, camera: PerspectiveCamera, time: number, dt: number, reveal: number, interactive: boolean) {
    group.visible = reveal > .005;
    const pointer = getPointer();
    const hover = interactive && !state.dragging && pointer.active
      ? hitTest(camera, pointer.x, pointer.y, window.innerWidth, window.innerHeight) : -1;
    const ease = 1 - Math.exp(-dt * 8);
    panels.forEach((panel, index) => {
      const uniforms = panel.material.uniforms;
      const selected = state.selectedIndex === index ? 1 : 0;
      uniforms.uSelected.value += (selected - uniforms.uSelected.value) * (1 - Math.exp(-dt * 6));
      const lift = uniforms.uSelected.value as number;
      const pose = panel.userData.pose as ReturnType<typeof orbitPose>;
      panel.position.set(pose.x + Math.sin(pose.angle) * lift * .28, pose.y + lift * .06, pose.z + Math.cos(pose.angle) * lift * .28);
      const scale = 1 + lift * .025;
      panel.scale.set(scale * (portrait ? .62 : 1), scale, scale);
      const texture = images.get(items[index].preview);
      uniforms.uImage.value = texture ?? placeholder;
      uniforms.uLoaded.value = texture ? 1 : 0;
      const focus = Math.exp(-Math.pow(index - state.position, 2) * 1.6);
      uniforms.uFocus.value += (focus - uniforms.uFocus.value) * ease;
      uniforms.uHover.value += ((hover === index ? 1 : 0) - uniforms.uHover.value) * ease;
      uniforms.uSpeed.value += (speed - uniforms.uSpeed.value) * ease;
      uniforms.uTime.value = time;
      uniforms.uReveal.value = reveal * (1 - state.selection * .65 * (1 - lift)) * (1 - state.selection * .92);
    });
    group.updateMatrixWorld(true);
    const front = items[Math.max(0, Math.min(items.length - 1, Math.round(state.target)))];
    state.ready = !!front && !!images.get(front.preview) && reveal > .005;
    state.labelsReady = !!front && !!labels.get(front.id);
  }

  return {
    group, prepare, advance, cameraPose, update, hitTest,
    resize(width: number, height: number, dpr: number) {
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
      geometry.dispose();
      placeholder.dispose();
      panels.forEach((panel) => panel.material.dispose());
      images.dispose();
      labels.forEach((label) => label?.dispose()); labels.clear();
    },
  };
}
