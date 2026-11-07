import {
  Color, DataTexture, DoubleSide, Group, Mesh, PlaneGeometry, Raycaster,
  RGBAFormat, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3,
  type PerspectiveCamera, type Texture, type WebGLRenderer,
} from 'three';
import type { DemoProject } from '../data/projects';
import { getPointer } from '../lib/raf';
import { ORBIT_CARD_HEIGHT, ORBIT_CARD_WIDTH, ORBIT_RADIUS, orbitPose, type OrbitMotion } from './orbit';
import { orbitFragment, orbitVertex } from './orbitShaders';

/** Scene module only: renderer, camera, post-processing and RAF belong to Stage. */
export function createWorkOrbit(renderer: WebGLRenderer, linearOutput: boolean) {
  const group = new Group();
  group.visible = false;
  const geometry = new PlaneGeometry(ORBIT_CARD_WIDTH, ORBIT_CARD_HEIGHT, 40, 8);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const angle = vertices.getX(i) / ORBIT_RADIUS;
    vertices.setX(i, Math.sin(angle) * ORBIT_RADIUS);
    vertices.setZ(i, (Math.cos(angle) - 1) * ORBIT_RADIUS);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const placeholder = new DataTexture(new Uint8Array([12, 20, 24, 255]), 1, 1, RGBAFormat);
  placeholder.needsUpdate = true;
  const cache = new Map<string, Texture>();
  const requested = new Set<string>();
  const loader = new TextureLoader();
  let items: DemoProject[] = [];
  let panels: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  let disposed = false;
  let previousPosition = 0;
  let speed = 0;
  const ndc = new Vector2();
  const raycaster = new Raycaster();

  function prepare(next: DemoProject[]) {
    if (next === items) return;
    panels.forEach((panel) => { group.remove(panel); panel.material.dispose(); });
    items = next;
    panels = next.map((project, index) => {
      const material = new ShaderMaterial({
        uniforms: {
          uImage: { value: placeholder as Texture }, uLoaded: { value: 0 },
          uTime: { value: 0 }, uSpeed: { value: 0 }, uHover: { value: 0 },
          uFocus: { value: index === 0 ? 1 : 0 }, uReveal: { value: 0 },
          uEncodeOutput: { value: linearOutput ? 0 : 1 },
          uAccent: { value: new Color(project.accent) },
        },
        vertexShader: orbitVertex, fragmentShader: orbitFragment,
        side: DoubleSide, transparent: true, toneMapped: false,
      });
      const panel = new Mesh(geometry, material);
      const pose = orbitPose(index, next.length);
      panel.position.set(pose.x, pose.y, pose.z);
      panel.rotation.y = pose.angle;
      panel.userData.index = index;
      group.add(panel);
      if (!requested.has(project.preview)) {
        requested.add(project.preview);
        loader.load(project.preview, (texture) => {
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          cache.set(project.preview, texture);
        }, undefined, () => { requested.delete(project.preview); });
      }
      return panel;
    });
  }

  function advance(state: OrbitMotion, dt: number) {
    prepare(state.items);
    const ease = 1 - Math.exp(-dt * (state.dragging ? 16 : 8));
    state.position += (state.target - state.position) * ease;
    speed = (state.position - previousPosition) / Math.max(dt, .001);
    previousPosition = state.position;
  }

  function cameraPose(state: OrbitMotion, aspect: number, fov: number, eye: Vector3, aim: Vector3) {
    const pose = orbitPose(state.position, Math.max(1, state.items.length));
    const halfFov = Math.tan(fov * Math.PI / 360);
    const distance = Math.max(
      ORBIT_CARD_HEIGHT / (2 * halfFov * .54),
      ORBIT_CARD_WIDTH / (2 * halfFov * aspect * .86),
    );
    eye.set(Math.sin(pose.angle) * (ORBIT_RADIUS + distance), pose.y + .18, Math.cos(pose.angle) * (ORBIT_RADIUS + distance));
    aim.set(pose.x, pose.y, pose.z);
  }

  function hitTest(camera: PerspectiveCamera, x: number, y: number, width: number, height: number): number {
    if (!group.visible) return -1;
    ndc.set(x / Math.max(1, width) * 2 - 1, 1 - y / Math.max(1, height) * 2);
    raycaster.setFromCamera(ndc, camera);
    return (raycaster.intersectObjects(panels, false)[0]?.object.userData.index as number | undefined) ?? -1;
  }

  function update(state: OrbitMotion, camera: PerspectiveCamera, time: number, dt: number, reveal: number, interactive: boolean) {
    group.visible = reveal > .005;
    const pointer = getPointer();
    const hover = interactive && !state.dragging && pointer.active
      ? hitTest(camera, pointer.x, pointer.y, window.innerWidth, window.innerHeight) : -1;
    const ease = 1 - Math.exp(-dt * 8);
    panels.forEach((panel, index) => {
      const uniforms = panel.material.uniforms;
      const texture = cache.get(items[index].preview);
      uniforms.uImage.value = texture ?? placeholder;
      uniforms.uLoaded.value = texture ? 1 : 0;
      const focus = Math.exp(-Math.pow(index - state.position, 2) * 1.6);
      uniforms.uFocus.value += (focus - uniforms.uFocus.value) * ease;
      uniforms.uHover.value += ((hover === index ? 1 : 0) - uniforms.uHover.value) * ease;
      uniforms.uSpeed.value += (speed - uniforms.uSpeed.value) * ease;
      uniforms.uTime.value = time;
      uniforms.uReveal.value = reveal;
    });
    const front = items[Math.max(0, Math.min(items.length - 1, Math.round(state.target)))];
    state.ready = !!front && cache.has(front.preview) && reveal > .005;
  }

  return {
    group, prepare, advance, cameraPose, update, hitTest,
    dispose() {
      disposed = true;
      geometry.dispose();
      placeholder.dispose();
      panels.forEach((panel) => panel.material.dispose());
      cache.forEach((texture) => texture.dispose());
    },
  };
}
