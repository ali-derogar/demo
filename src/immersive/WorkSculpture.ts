import { DoubleSide, Group, Mesh, MeshPhysicalMaterial, Vector3, type BufferGeometry } from 'three';
import { ribbonGeometry } from './ribbonGeometry';

export function createWorkSculpture(mobile: boolean) {
  const group = new Group();
  group.visible = false;
  const material = new MeshPhysicalMaterial({
    color: 0xb4bacf, metalness: .9, roughness: .21, clearcoat: 1,
    clearcoatRoughness: .16, iridescence: 1, iridescenceIOR: 1.4,
    iridescenceThicknessMinimum: 160, iridescenceThicknessMaximum: 520, envMapIntensity: 2.2,
    side: DoubleSide, transparent: true, opacity: .88,
  });
  const geometries: BufferGeometry[] = [];
  for (let strand = 0; strand < (mobile ? 3 : 4); strand++) {
    const phase = strand * Math.PI * .5;
    const geometry = ribbonGeometry((t) => {
      const angle = t * Math.PI * 4.6 + phase;
      const flare = .5 + Math.pow(.5 + .5 * Math.sin(t * Math.PI * 18 + phase), 2) * .9;
      return new Vector3(Math.cos(angle) * flare, 2.2 - t * 12.8, Math.sin(angle) * flare);
    }, (t) => .1 + Math.pow(.5 + .5 * Math.cos(t * Math.PI * 18 + phase * .6), 3) * .4,
    (t) => t * Math.PI * 8 + phase, mobile ? 112 : 256, mobile ? 2 : 4);
    geometries.push(geometry);
    group.add(new Mesh(geometry, material));
  }
  return { group, material, dispose() { geometries.forEach((geometry) => geometry.dispose()); material.dispose(); } };
}
