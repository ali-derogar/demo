import { useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  ACESFilmicToneMapping, Color, DataTexture, DoubleSide, Group,
  Mesh, PerspectiveCamera, PlaneGeometry, Raycaster, RGBAFormat, Scene,
  ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer,
  type Texture,
} from 'three';
import type { DemoProject } from '../data/projects';
import { getPointer, subscribeRaf } from '../lib/raf';
import { ORBIT_CARD_HEIGHT, ORBIT_CARD_WIDTH, ORBIT_RADIUS, orbitPose, type OrbitMotion } from './orbit';
import { orbitFragment, orbitVertex } from './orbitShaders';

interface Props {
  items: DemoProject[];
  motionRef: RefObject<OrbitMotion>;
  onPick: (index: number) => void;
}

/** Curved image planes and an orbiting camera, using the shared frame loop. */
export function WorkOrbit({ items, motionRef, onPick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pickRef = useRef(onPick);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  pickRef.current = onPick;

  useEffect(() => {
    setReady(false);
    if (reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch { return; }
    const compact = () => wrap.clientWidth < 700;
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact() ? 1 : 1.5));
    const scene = new Scene();
    const root = new Group();
    scene.add(root);
    const camera = new PerspectiveCamera(43, 1, .1, 100);
    const geometry = new PlaneGeometry(ORBIT_CARD_WIDTH, ORBIT_CARD_HEIGHT, 36, 8);
    // Curve the mesh itself so hit-testing agrees with the rendered surface.
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const angle = vertices.getX(i) / ORBIT_RADIUS;
      vertices.setX(i, Math.sin(angle) * ORBIT_RADIUS);
      vertices.setZ(i, (Math.cos(angle) - 1) * ORBIT_RADIUS);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const placeholder = new DataTexture(new Uint8Array([18, 24, 28, 255]), 1, 1, RGBAFormat);
    placeholder.needsUpdate = true;
    const textures = new Set<Texture>();
    const loader = new TextureLoader();
    let disposed = false;
    let visible = false;
    let lost = false;
    let revealed = false;
    let time = 0;
    let previousPosition = motionRef.current?.position ?? 0;
    const panels = items.map((project, index) => {
      const material = new ShaderMaterial({
        uniforms: {
          uImage: { value: placeholder as Texture }, uLoaded: { value: 0 },
          uTime: { value: 0 }, uSpeed: { value: 0 },
          uHover: { value: 0 }, uFocus: { value: index === 0 ? 1 : 0 },
          uAccent: { value: new Color(project.accent) },
        },
        vertexShader: orbitVertex, fragmentShader: orbitFragment, side: DoubleSide,
      });
      const mesh = new Mesh(geometry, material);
      const pose = orbitPose(index, items.length);
      mesh.position.set(pose.x, pose.y, pose.z);
      mesh.rotation.y = pose.angle;
      mesh.userData.index = index;
      root.add(mesh);
      loader.load(project.preview, (texture) => {
        if (disposed) { texture.dispose(); return; }
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        textures.add(texture);
        material.uniforms.uImage.value = texture;
        material.uniforms.uLoaded.value = 1;
      }, undefined, () => { /* The native fallback image and project link remain available. */ });
      return mesh;
    });

    const pointerNdc = new Vector2();
    const raycaster = new Raycaster();
    const aim = new Vector3();
    let rect = wrap.getBoundingClientRect();
    const resize = () => {
      if (lost) return;
      rect = wrap.getBoundingClientRect();
      renderer.setSize(wrap.clientWidth, Math.max(1, wrap.clientHeight), false);
      camera.aspect = wrap.clientWidth / Math.max(1, wrap.clientHeight);
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) rect = wrap.getBoundingClientRect();
    }, { rootMargin: '120px' });
    visibilityObserver.observe(wrap);
    const unsubscribe = subscribeRaf((_timestamp, delta) => {
      if (!visible || lost) return;
      const state = motionRef.current;
      if (!state) return;
      const dt = Math.min(delta / 1000, .05);
      const ease = 1 - Math.exp(-dt * (state.dragging ? 16 : 8));
      state.position += (state.target - state.position) * ease;
      const speed = (state.position - previousPosition) / Math.max(dt, .001);
      previousPosition = state.position;
      time += dt;
      const pose = orbitPose(state.position, items.length);
      const halfFov = Math.tan(camera.fov * Math.PI / 360);
      const distance = Math.max(
        ORBIT_CARD_HEIGHT / (2 * halfFov * .78),
        ORBIT_CARD_WIDTH / (2 * halfFov * camera.aspect * .86),
      );
      camera.position.set(
        Math.sin(pose.angle) * (ORBIT_RADIUS + distance),
        pose.y + .15,
        Math.cos(pose.angle) * (ORBIT_RADIUS + distance),
      );
      aim.set(pose.x, pose.y, pose.z);
      camera.lookAt(aim);
      camera.rotateZ(compact() ? -.035 : -.045);
      camera.updateMatrixWorld();
      root.updateMatrixWorld(true);
      const input = getPointer();
      let hovered = -1;
      if (input.active) rect = wrap.getBoundingClientRect();
      if (input.active && !state.dragging && input.x >= rect.left && input.x <= rect.right && input.y >= rect.top && input.y <= rect.bottom) {
        pointerNdc.set((input.x - rect.left) / rect.width * 2 - 1, -(input.y - rect.top) / rect.height * 2 + 1);
        raycaster.setFromCamera(pointerNdc, camera);
        const hit = raycaster.intersectObjects(panels, false)[0];
        if (hit) hovered = hit.object.userData.index as number;
      }
      panels.forEach((panel, index) => {
        const uniforms = panel.material.uniforms;
        const focus = Math.exp(-Math.pow(index - state.position, 2) * 1.6);
        uniforms.uFocus.value += (focus - uniforms.uFocus.value) * ease;
        uniforms.uHover.value += ((hovered === index ? 1 : 0) - uniforms.uHover.value) * ease;
        uniforms.uTime.value = time;
        uniforms.uSpeed.value += (speed - uniforms.uSpeed.value) * ease;
      });
      renderer.render(scene, camera);
      const front = panels[Math.max(0, Math.min(panels.length - 1, Math.round(state.target)))];
      const hasImage = front.material.uniforms.uLoaded.value > 0;
      if (hasImage !== revealed) { revealed = hasImage; setReady(hasImage); }
    });

    const onClick = (event: MouseEvent) => {
      const state = motionRef.current;
      if (!state || state.dragging || performance.now() < state.blockClickUntil || lost) return;
      rect = wrap.getBoundingClientRect();
      pointerNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(panels, false)[0];
      if (hit) pickRef.current(hit.object.userData.index as number);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      unsubscribe();
      setReady(false);
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('webglcontextlost', onContextLost);
    return () => {
      disposed = true;
      unsubscribe();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      geometry.dispose();
      panels.forEach((panel) => panel.material.dispose());
      textures.forEach((texture) => texture.dispose());
      placeholder.dispose();
      renderer.dispose();
    };
  }, [items, motionRef, reduced]);

  return <div className="im-orbit__renderer" ref={wrapRef} data-ready={ready} aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
