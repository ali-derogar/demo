import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  ACESFilmicToneMapping, AdditiveBlending, BufferGeometry,
  Color, DataTexture, DirectionalLight, Float32BufferAttribute, Group,
  HalfFloatType, HemisphereLight, LinearFilter, MathUtils,
  Mesh, PerspectiveCamera, Plane, PlaneGeometry, PMREMGenerator,
  Points, RGBAFormat, Raycaster, Scene, ShaderMaterial, SRGBColorSpace,
  Vector2, Vector3, Vector4, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createWorkOrbit } from './WorkOrbit';
import { createBrandSculpture } from './BrandSculpture';
import { createWorkSculpture } from './WorkSculpture';
import { FrameQuality } from './frameQuality';
import type { OrbitMotion } from './orbit';
import { getPointer, subscribeRaf } from '../lib/raf';
import { useMediaQuery, useReducedMotionPreference } from '../lib/useMedia';
import { BrandMark } from '../components/BrandMark';
import type { SceneProgress } from './types';
import {
  fluidStep, flowComposite, fullscreenVertex, particleFragment,
  particleVertex, positionStep, velocityStep,
  atmosphereFragment, atmosphereVertex,
} from './flowShaders';

/** Stateful GPU particles, advected pointer wakes, bloom and scroll morphing. */
export function Stage({ progressRef, workRef }: { progressRef: RefObject<SceneProgress>; workRef: RefObject<OrbitMotion> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  const lowPower = useMediaQuery('(max-width: 767px), (pointer: coarse)');
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const restore = () => setGeneration((value) => value + 1);
    canvas?.addEventListener('webglcontextrestored', restore);
    return () => canvas?.removeEventListener('webglcontextrestored', restore);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: 'high-performance' });
    } catch {
      setStatus('fallback');
      return;
    }
    setStatus('loading');
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    let dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    renderer.setPixelRatio(dpr);
    const scene = new Scene();
    scene.background = new Color(0x030606);
    const camera = new PerspectiveCamera(34, 1, .1, 120);
    let compact = window.innerWidth < 768;
    const world = new Group();
    world.name = 'home-world';
    world.position.set(0, .6, 0);
    scene.add(world);

    const side = lowPower ? 96 : 192;
    const count = side * side;
    const geometry = new BufferGeometry();
    const lookup = new Float32Array(count * 2);
    // Position is only a draw-count attribute. The vertex shader samples the GPU state.
    geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
    for (let i = 0; i < count; i++) {
      lookup[i * 2] = ((i % side) + .5) / side;
      lookup[i * 2 + 1] = (Math.floor(i / side) + .5) / side;
    }
    geometry.setAttribute('aLookup', new Float32BufferAttribute(lookup, 2));

    const emptyTexture = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat);
    emptyTexture.needsUpdate = true;
    const pointer = new Vector3(999, 999, 0);
    const pointerVelocity = new Vector3();
    const pulse = new Vector4(0, 0, -100, 0);
    const particleUniforms = {
      uPositions: { value: emptyTexture as import('three').Texture },
      uSimulation: { value: 0 },
      uTime: { value: 0 },
      uChapter: { value: 0 },
      uDpr: { value: dpr },
      uReveal: { value: reduced ? 1 : 0 },
      uPointer: { value: pointer },
    };
    const particleMaterial = new ShaderMaterial({
      uniforms: particleUniforms, vertexShader: particleVertex, fragmentShader: particleFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
    });
    const particles = new Points(geometry, particleMaterial);
    particles.frustumCulled = false;
    world.add(particles);

    const canFloat = renderer.extensions.has('EXT_color_buffer_float');
    const atmosphereGeometry = new PlaneGeometry(2, 2);
    const atmosphereUniforms = { uTime: { value: 0 }, uWork: { value: 0 }, uPanel: { value: 0 }, uEncodeOutput: { value: canFloat ? 0 : 1 } };
    const atmosphereMaterial = new ShaderMaterial({
      uniforms: atmosphereUniforms, vertexShader: atmosphereVertex, fragmentShader: atmosphereFragment,
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.frustumCulled = false; atmosphere.renderOrder = -1000;
    scene.add(atmosphere);
    let gpu: GPUComputationRenderer | null = null;
    let velocityVariable: ReturnType<GPUComputationRenderer['addVariable']> | null = null;
    let positionVariable: ReturnType<GPUComputationRenderer['addVariable']> | null = null;
    if (canFloat && !reduced) {
      gpu = new GPUComputationRenderer(side, side, renderer);
      gpu.setDataType(HalfFloatType);
      const positions = gpu.createTexture();
      const velocities = gpu.createTexture();
      const positionData = positions.image.data as Float32Array;
      for (let i = 0; i < count; i++) {
        const angle = i * 2.399963;
        const radius = 4 + (i % 113) / 113 * 3;
        positionData[i * 4] = Math.cos(angle) * radius;
        positionData[i * 4 + 1] = Math.sin(angle) * radius;
        positionData[i * 4 + 2] = Math.sin(i * 1.73) * 4;
        positionData[i * 4 + 3] = 1;
      }
      velocityVariable = gpu.addVariable('textureVelocity', velocityStep, velocities);
      positionVariable = gpu.addVariable('texturePosition', positionStep, positions);
      gpu.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
      gpu.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
      Object.assign(velocityVariable.material.uniforms, {
        uTime: { value: 0 }, uDelta: { value: 1 / 60 }, uChapter: { value: 0 },
        uEnergy: { value: 0 }, uPointer: { value: pointer },
        uPointerVelocity: { value: pointerVelocity }, uPulse: { value: pulse },
      });
      positionVariable.material.uniforms.uDelta = { value: 1 / 60 };
      if (gpu.init() !== null) {
        gpu.dispose();
        gpu = null;
        velocityVariable = positionVariable = null;
      } else {
        particleUniforms.uSimulation.value = 1;
      }
    }

    const brand = createBrandSculpture();
    const signature = brand.group;
    world.add(signature);
    const orbit = createWorkOrbit(renderer, canFloat, lowPower);
    scene.add(orbit.group);
    const sculpture = createWorkSculpture(lowPower);
    scene.add(sculpture.group);
    let backdrop: WebGLRenderTarget | null = canFloat ? new WebGLRenderTarget(1, 1, { minFilter: LinearFilter, magFilter: LinearFilter }) : null;
    let captureFrame = 0;
    let environment: WebGLRenderTarget | null = null;
    if (canFloat) {
      const room = new RoomEnvironment();
      const pmrem = new PMREMGenerator(renderer);
      environment = pmrem.fromScene(room, .05);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
    }
    scene.add(new HemisphereLight(0xc8e3ed, 0x12100d, 3));
    const key = new DirectionalLight(0xe7f1f8, 4);
    key.position.set(-2, 4, 6);
    scene.add(key);
    const rim = new DirectionalLight(0xa4c9ed, 3);
    rim.position.set(4, -2, 1);
    scene.add(rim);

    let composer: EffectComposer | null = null;
    let bloom: UnrealBloomPass | null = null;
    let flowPass: ShaderPass | null = null;
    let fluidMaterial: ShaderMaterial | null = null;
    let fluidQuad: FullScreenQuad | null = null;
    let flowRead: WebGLRenderTarget | null = null;
    let flowWrite: WebGLRenderTarget | null = null;
    const fluidSize = lowPower ? 96 : 160;
    const pointerUv = new Vector2(.5, .5);
    const previousUv = new Vector2(.5, .5);
    const inputVelocity = new Vector2();
    const fluidUniforms = {
      uPrevious: { value: emptyTexture as import('three').Texture },
      uTexel: { value: new Vector2(1 / fluidSize, 1 / fluidSize) },
      uPointer: { value: pointerUv }, uPreviousPointer: { value: previousUv },
      uVelocity: { value: inputVelocity }, uDelta: { value: 1 / 60 },
      uAspect: { value: 1 }, uActive: { value: 0 }, uBurst: { value: 0 },
    };
    if (canFloat) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      if (!lowPower) {
        bloom = new UnrealBloomPass(new Vector2(1, 1), .75, .55, .72);
        composer.addPass(bloom);
      }
      if (!reduced) {
        flowRead = new WebGLRenderTarget(fluidSize, fluidSize, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
        flowWrite = flowRead.clone();
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(flowRead); renderer.clear();
        renderer.setRenderTarget(flowWrite); renderer.clear();
        renderer.setRenderTarget(null);
        fluidMaterial = new ShaderMaterial({ uniforms: fluidUniforms, vertexShader: fullscreenVertex, fragmentShader: fluidStep, depthTest: false, depthWrite: false });
        fluidQuad = new FullScreenQuad(fluidMaterial);
        flowPass = new ShaderPass({
          uniforms: { tDiffuse: { value: null }, uFlow: { value: null }, uTime: { value: 0 }, uStrength: { value: 1 } },
          vertexShader: fullscreenVertex, fragmentShader: flowComposite,
        });
        composer.addPass(flowPass);
      }
      composer.addPass(new OutputPass());
    }

    let lost = false;
    let firstFrame = true;
    let elapsed = reduced ? 8 : 0;
    let chapter = progressRef.current?.position ?? 0;
    let workBlend = reduced ? 0 : progressRef.current?.workBlend ?? 0;
    let panelMix = 0;
    let energy = 0;
    let burst = 0;
    let pointerWasActive = false;
    const quality = new FrameQuality(lowPower);
    wrap.dataset.quality = '0';
    const lastPointer = new Vector3();
    const nextPointer = new Vector3();
    const ndc = new Vector2();
    const raycaster = new Raycaster();
    const interactionPlane = new Plane(new Vector3(0, 0, 1), 0);
    const eye = new Vector3();
    const aim = new Vector3();
    const nextEye = new Vector3();
    const nextAim = new Vector3();
    const clickUv = new Vector2();
    let pendingClick = false;
    const heroDrag = { id: -1, x: 0, y: 0, lastX: 0, active: false };
    let heroAngle = 0, heroTarget = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (reduced || progressRef.current?.overlay) return;
      clickUv.set(event.clientX / Math.max(1, window.innerWidth), 1 - event.clientY / Math.max(1, window.innerHeight));
      pendingClick = true;
      if (workBlend < .15 && event.button === 0 && !(event.target as Element | null)?.closest?.('a,button,input,summary')) {
        Object.assign(heroDrag, { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, active: false });
      }
    };
    const onHeroMove = (event: PointerEvent) => {
      if (heroDrag.id !== event.pointerId || workBlend > .15) return;
      const dx = event.clientX - heroDrag.x, dy = event.clientY - heroDrag.y;
      if (!heroDrag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { heroDrag.id = -1; return; }
        if (Math.abs(dx) < 8) return;
        heroDrag.active = true;
      }
      heroTarget += (event.clientX - heroDrag.lastX) * .006;
      heroDrag.lastX = event.clientX;
    };
    const onHeroEnd = () => { heroDrag.id = -1; heroDrag.active = false; };

    const renderFrame = (_time: number, delta: number) => {
      if (lost) return;
      const dt = Math.min(Math.max(delta / 1000, .001), 1 / 30);
      if (!reduced) elapsed += dt;
      const ease = 1 - Math.exp(-dt * 6);
      chapter += ((progressRef.current?.position ?? 0) - chapter) * ease;
      const timeline = progressRef.current;
      const work = workRef.current;
      workBlend += ((reduced ? 0 : timeline?.workBlend ?? 0) - workBlend) * ease;
      panelMix += ((timeline?.overlay ? 1 : 0) - panelMix) * ease;
      const fov = 34 + workBlend * 20;
      if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      const position = reduced ? 0 : MathUtils.clamp(chapter + panelMix * (timeline?.overlay === 'contact' ? 2 : 1), 0, 3);
      if (work && !reduced && ((timeline?.progress ?? 0) > .12 || workBlend > .001)) orbit.advance(work, dt);
      const intro = reduced ? 1 : MathUtils.smoothstep(elapsed, 0, 2.6);
      const input = getPointer();
      const active = !reduced && !lowPower && !timeline?.overlay && input.active;
      eye.set(active ? input.nx * .18 : 0, .1 - chapter * .45 + (active ? input.ny * .1 : 0), (compact ? 16.4 : 12.4) - chapter * 1.2 + (1 - intro) * 2.5);
      aim.set(0, .1 - chapter * .6, 0);
      if (work && workBlend > .001) {
        orbit.cameraPose(work, camera.aspect, camera.fov, nextEye, nextAim);
        eye.lerp(nextEye, workBlend);
        aim.lerp(nextAim, workBlend);
      }
      camera.position.lerp(eye, firstFrame || reduced ? 1 : workBlend > .95 ? 1 - Math.exp(-dt * 14) : ease);
      camera.lookAt(aim);
      camera.rotateZ(-.025 * workBlend * (1 - (work?.selection ?? 0)));
      camera.updateMatrixWorld();
      world.position.set(nextAim.x * panelMix * workBlend, .6 * (1 - workBlend) + nextAim.y * panelMix * workBlend, (nextAim.z - 3) * panelMix * workBlend);
      heroAngle += (heroTarget - heroAngle) * ease;
      world.rotation.y = reduced ? -.08 : Math.sin(elapsed * .14) * .08 + (1 - intro) * .45 + (chapter * .6 + heroAngle) * (1 - workBlend);
      world.rotation.z = reduced ? 0 : Math.sin(elapsed * .19) * .025;
      world.updateMatrixWorld(true);
      if (work && !reduced) orbit.update(
        work, camera, elapsed, dt,
        MathUtils.smoothstep(workBlend, .2, .96) * (1 - panelMix * .7),
        workBlend > .95 && work.interactive && !timeline?.overlay,
      );
      if (bloom) bloom.strength = .6 * (1 - workBlend) + .12 * workBlend;
      sculpture.material.opacity = .88 * workBlend * (1 - panelMix * .8) * (1 - (work?.selection ?? 0) * .88);
      sculpture.group.visible = sculpture.material.opacity > .005;
      sculpture.group.rotation.y = reduced ? 0 : elapsed * .06;
      atmosphereUniforms.uTime.value = elapsed;
      atmosphereUniforms.uWork.value = workBlend;
      atmosphereUniforms.uPanel.value = panelMix;

      previousUv.copy(pointerUv);
      if (active) pointerUv.set(input.x / Math.max(1, wrap.clientWidth), 1 - input.y / Math.max(1, wrap.clientHeight));
      if (active && !pointerWasActive) previousUv.copy(pointerUv);
      inputVelocity.subVectors(pointerUv, previousUv).divideScalar(dt).clampLength(0, 2.5);
      energy += ((active ? Math.min(inputVelocity.length() * 1.2, 2) : 0) - energy) * (1 - Math.exp(-dt * 5));

      if (active || pendingClick) {
        const uv = pendingClick ? clickUv : pointerUv;
        ndc.set(uv.x * 2 - 1, uv.y * 2 - 1);
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(interactionPlane, nextPointer)) {
          world.worldToLocal(nextPointer);
          if (!pointerWasActive) lastPointer.copy(nextPointer);
          pointerVelocity.subVectors(nextPointer, lastPointer).divideScalar(dt).clampLength(0, 12);
          if (pointerWasActive) pointer.lerp(nextPointer, ease);
          else pointer.copy(nextPointer);
          lastPointer.copy(nextPointer);
          if (pendingClick) {
            pulse.set(nextPointer.x, nextPointer.y, elapsed, 1);
            pointerUv.copy(clickUv); previousUv.copy(clickUv);
            burst = 1;
            pendingClick = false;
          }
        }
      } else {
        pointer.set(999, 999, 0);
        pointerVelocity.multiplyScalar(Math.exp(-dt * 8));
      }
      pointerWasActive = active;

      if (gpu && positionVariable && velocityVariable) {
        const uniforms = velocityVariable.material.uniforms;
        uniforms.uTime.value = elapsed;
        uniforms.uDelta.value = dt;
        uniforms.uChapter.value = position;
        uniforms.uEnergy.value = energy;
        positionVariable.material.uniforms.uDelta.value = dt;
        gpu.compute();
        particleUniforms.uPositions.value = gpu.getCurrentRenderTarget(positionVariable).texture;
      }
      particleUniforms.uTime.value = elapsed;
      particleUniforms.uChapter.value = position;
      particleUniforms.uReveal.value = (reduced ? .25 : MathUtils.smoothstep(elapsed, .05, 2.2)) * (.24 + workBlend * .64) * (1 - panelMix * .3) * (1 - (work?.selection ?? 0) * .86);
      signature.rotation.y = reduced ? -.15 : Math.sin(elapsed * .45) * .35;
      signature.rotation.z = reduced ? 0 : Math.sin(elapsed * .28) * .06;
      signature.position.y = reduced ? 0 : Math.sin(elapsed * .6) * .1;
      signature.scale.setScalar(Math.max(.001, 1 - workBlend) * (1 - panelMix * .16));
      signature.visible = workBlend < .995;
      if (flowPass) flowPass.uniforms.uStrength.value = 1 - panelMix * .8;

      if (fluidQuad && flowRead && flowWrite && flowPass) {
        fluidUniforms.uPrevious.value = flowRead.texture;
        fluidUniforms.uDelta.value = dt;
        fluidUniforms.uActive.value = active || burst > .01 ? 1 : 0;
        fluidUniforms.uBurst.value = burst;
        renderer.setRenderTarget(flowWrite);
        fluidQuad.render(renderer);
        renderer.setRenderTarget(null);
        const temporary = flowRead; flowRead = flowWrite; flowWrite = temporary;
        flowPass.uniforms.uFlow.value = flowRead.texture;
        flowPass.uniforms.uTime.value = elapsed;
        burst *= Math.exp(-dt * 8);
      }
      if (backdrop && workBlend > .02 && (work?.selection ?? 0) < .98 && (!lowPower || captureFrame++ % 2 === 0)) {
        const visible = orbit.group.visible;
        orbit.group.visible = false;
        renderer.setRenderTarget(backdrop); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
        orbit.group.visible = visible;
        orbit.setBackdrop(backdrop.texture);
      }
      if (composer) composer.render(dt);
      else renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; setStatus('ready'); }

      if (!reduced) {
        const level = quality.sample(delta);
        if (level !== null) {
          wrap.dataset.quality = String(level);
          dpr = Math.min(window.devicePixelRatio || 1, lowPower || level === 2 ? 1 : 1.25);
          renderer.setPixelRatio(dpr);
          composer?.setPixelRatio(dpr);
          particleUniforms.uDpr.value = dpr;
          orbit.resize(wrap.clientWidth, wrap.clientHeight, dpr);
          if (bloom) { composer?.removePass(bloom); bloom.dispose(); bloom = null; }
          if (lowPower || level === 2) {
            if (flowPass) { composer?.removePass(flowPass); flowPass.dispose(); flowPass = null; }
            fluidQuad?.dispose(); fluidQuad = null;
            fluidMaterial?.dispose(); fluidMaterial = null;
            flowRead?.dispose(); flowRead = null;
            flowWrite?.dispose(); flowWrite = null;
            backdrop?.dispose(); backdrop = null; orbit.clearBackdrop();
          }
        }
      }
    };

    const resize = () => {
      if (lost) return;
      const width = wrap.clientWidth;
      const height = Math.max(1, wrap.clientHeight);
      compact = width < 768;
      world.position.set(0, .6, 0);
      renderer.setSize(width, height, false);
      composer?.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      orbit.resize(width, height, dpr);
      backdrop?.setSize(Math.max(1, Math.floor(width * (lowPower ? .35 : .5))), Math.max(1, Math.floor(height * (lowPower ? .35 : .5))));
      fluidUniforms.uAspect.value = width / height;
      if (reduced) renderFrame(0, 16);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    const unsubscribe = reduced ? () => {} : subscribeRaf(renderFrame);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      unsubscribe();
      if (workRef.current) { workRef.current.ready = false; workRef.current.labelsReady = false; }
      setStatus('fallback');
    };
    const onProjectClick = (event: MouseEvent) => {
      if (event.defaultPrevented || (event.target as Element | null)?.closest?.('a')) return;
      const work = workRef.current;
      if (!work || workBlend < .95 || progressRef.current?.overlay || work.dragging || performance.now() < work.blockClickUntil) return;
      if (!(event.target as Element | null)?.closest?.('.im-orbit__stage')) return;
      const index = orbit.hitTest(camera, event.clientX, event.clientY, wrap.clientWidth, wrap.clientHeight);
      if (index >= 0) work.onPick?.(index);
    };
    window.addEventListener('click', onProjectClick);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onHeroMove, { passive: true });
    window.addEventListener('pointerup', onHeroEnd, { passive: true });
    window.addEventListener('pointercancel', onHeroEnd, { passive: true });
    canvas.addEventListener('webglcontextlost', onContextLost);
    return () => {
      lost = true;
      unsubscribe();
      observer.disconnect();
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onHeroMove);
      window.removeEventListener('pointerup', onHeroEnd);
      window.removeEventListener('pointercancel', onHeroEnd);
      window.removeEventListener('click', onProjectClick);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      gpu?.dispose();
      geometry.dispose(); particleMaterial.dispose();
      brand.dispose(); sculpture.dispose(); orbit.dispose(); environment?.dispose(); emptyTexture.dispose(); backdrop?.dispose();
      atmosphereGeometry.dispose(); atmosphereMaterial.dispose();
      if (workRef.current) { workRef.current.ready = false; workRef.current.labelsReady = false; }
      flowRead?.dispose(); flowWrite?.dispose();
      fluidQuad?.dispose(); fluidMaterial?.dispose();
      composer?.passes.forEach((pass) => pass.dispose());
      composer?.dispose();
      renderer.dispose();
    };
  }, [reduced, lowPower, progressRef, workRef, generation]);

  return (
    <div className="im-stage" ref={wrapRef} data-status={status} aria-hidden="true">
      <div className="im-brand-fallback"><BrandMark /></div>
      <canvas ref={canvasRef} className="im-stage__canvas" />
      <div className="im-stage__vignette" />
    </div>
  );
}
