import { Color, Group, Mesh, PlaneGeometry, ShaderMaterial, type PerspectiveCamera, type Texture } from 'three';
import type { DemoProject } from '../data/projects';
import { smoothRange, type ProjectPresentation } from './projectPresentation';
import { projectSurfaceFragment, projectSurfaceVertex } from './projectShaders';

/** A translucent glass glaze in Stage's existing render chain. */
export function createProjectEnvironment(mobile: boolean, linearOutput: boolean, placeholder: Texture) {
  const group = new Group(); group.name = 'project-environment'; group.visible = false;
  const uniforms = {
    uImage: { value: placeholder }, uLoaded: { value: 0 }, uFlow: { value: placeholder }, uFlowReady: { value: 0 },
    uTime: { value: 0 }, uReveal: { value: 0 },
    uDetail: { value: mobile ? 0 : 1 },
    uEncodeOutput: { value: linearOutput ? 0 : 1 }, uAccent: { value: new Color('#8ba9a6') },
  };
  const surfaceGeometry = new PlaneGeometry(2, 2);
  const surfaceMaterial = new ShaderMaterial({ uniforms, vertexShader: projectSurfaceVertex, fragmentShader: projectSurfaceFragment, transparent: true, depthWrite: false, depthTest: false });
  const surface = new Mesh(surfaceGeometry, surfaceMaterial); surface.frustumCulled = false; surface.renderOrder = -4;
  group.add(surface);
  let previousId = '';
  return {
    group,
    update(presentation: ProjectPresentation | undefined, project: DemoProject | undefined, texture: Texture | undefined, camera: PerspectiveCamera, time: number, panelMix: number) {
      const reveal = smoothRange(presentation?.progress ?? 0, .08, .75) * (1 - panelMix * .7);
      group.visible = !!project && reveal > .001;
      if (!group.visible || !project) return;
      group.position.copy(camera.position); group.quaternion.copy(camera.quaternion);
      uniforms.uImage.value = texture ?? placeholder; uniforms.uLoaded.value = texture ? 1 : 0;
      uniforms.uTime.value = time; uniforms.uReveal.value = reveal;
      if (previousId !== project.id) { previousId = project.id; uniforms.uAccent.value.set(project.accent); }
    },
    setFlow(texture?: Texture) { uniforms.uFlow.value = texture ?? placeholder; uniforms.uFlowReady.value = texture ? 1 : 0; },
    setQuality(level: number) { uniforms.uDetail.value = level === 0 && !mobile ? 1 : 0; },
    dispose() { surfaceGeometry.dispose(); surfaceMaterial.dispose(); },
  };
}
