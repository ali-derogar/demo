import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, PlaneGeometry, Points, ShaderMaterial, Vector2, Vector4, type PerspectiveCamera, type Texture } from 'three';
import type { DemoProject } from '../data/projects';
import { smoothRange, type ProjectPresentation } from './projectPresentation';
import { projectParticlesFragment, projectParticlesVertex, projectSurfaceFragment, projectSurfaceVertex } from './projectShaders';

/** A camera-relative glass cavity and media-colored points in Stage's existing render chain. */
export function createProjectEnvironment(mobile: boolean, linearOutput: boolean, placeholder: Texture) {
  const group = new Group(); group.name = 'project-environment'; group.visible = false;
  const budget = mobile ? 6144 : 24576;
  const geometry = new BufferGeometry();
  const samples = new Float32Array(budget * 2), seeds = new Float32Array(budget);
  const columns = mobile ? 96 : 192, rows = mobile ? 64 : 128;
  for (let i = 0; i < budget; i++) {
    const sample = (i * 8191) % budget;
    samples[i * 2] = ((sample % columns) + .5) / columns;
    samples[i * 2 + 1] = (Math.floor(sample / columns) + .5) / rows;
    seeds[i] = ((i * 16807 + 17) % 65521) / 65521;
  }
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(budget * 3), 3));
  geometry.setAttribute('aSample', new Float32BufferAttribute(samples, 2));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  const uniforms = {
    uImage: { value: placeholder }, uLoaded: { value: 0 }, uFlow: { value: placeholder }, uFlowReady: { value: 0 },
    uTime: { value: 0 }, uReveal: { value: 0 }, uDpr: { value: 1 },
    uDetail: { value: mobile ? 0 : 1 },
    uEncodeOutput: { value: linearOutput ? 0 : 1 }, uAccent: { value: new Color('#8ba9a6') },
    uExtent: { value: new Vector2(1, 1) }, uFrame: { value: new Vector4(.2, .2, .6, .6) },
  };
  const surfaceGeometry = new PlaneGeometry(2, 2);
  const surfaceMaterial = new ShaderMaterial({ uniforms, vertexShader: projectSurfaceVertex, fragmentShader: projectSurfaceFragment, transparent: true, depthWrite: false, depthTest: false });
  const surface = new Mesh(surfaceGeometry, surfaceMaterial); surface.frustumCulled = false; surface.renderOrder = -4;
  const pointsMaterial = new ShaderMaterial({ uniforms, vertexShader: projectParticlesVertex, fragmentShader: projectParticlesFragment, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
  const points = new Points(geometry, pointsMaterial); points.frustumCulled = false; points.renderOrder = -2;
  group.add(surface, points);
  let previousId = '';
  return {
    group, budget,
    update(presentation: ProjectPresentation | undefined, project: DemoProject | undefined, texture: Texture | undefined, camera: PerspectiveCamera, time: number, width: number, height: number, dpr: number, panelMix: number) {
      const reveal = smoothRange(presentation?.progress ?? 0, .08, .75) * (1 - panelMix * .7);
      group.visible = !!project && reveal > .001;
      if (!group.visible || !project) return;
      group.position.copy(camera.position); group.quaternion.copy(camera.quaternion);
      uniforms.uImage.value = texture ?? placeholder; uniforms.uLoaded.value = texture ? 1 : 0;
      uniforms.uTime.value = time; uniforms.uReveal.value = reveal; uniforms.uDpr.value = dpr;
      const half = Math.tan(camera.fov * Math.PI / 360);
      uniforms.uExtent.value.set(half * camera.aspect, half);
      const bounds = presentation?.bounds;
      if (bounds) uniforms.uFrame.value.set(bounds.left / width, 1 - (bounds.top + bounds.height) / height, bounds.width / width, bounds.height / height);
      if (previousId !== project.id) { previousId = project.id; uniforms.uAccent.value.set(project.accent); }
    },
    setFlow(texture?: Texture) { uniforms.uFlow.value = texture ?? placeholder; uniforms.uFlowReady.value = texture ? 1 : 0; },
    setQuality(level: number) { geometry.setDrawRange(0, Math.floor(budget / (level === 2 ? 4 : 2))); uniforms.uDetail.value = 0; },
    dispose() { geometry.dispose(); surfaceGeometry.dispose(); surfaceMaterial.dispose(); pointsMaterial.dispose(); },
  };
}
