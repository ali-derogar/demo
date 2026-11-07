import {
  CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Group, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, Path, Shape, SphereGeometry,
  TorusGeometry, TubeGeometry, Vector3, type BufferGeometry, type Material,
} from 'three';

/** The existing robot mark, modelled as a chrome medallion rather than AT's logo. */
export function createBrandSculpture() {
  const group = new Group();
  const chrome = new MeshPhysicalMaterial({
    color: 0xaadacb, metalness: .94, roughness: .17,
    clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.7,
  });
  const light = new MeshBasicMaterial({ color: 0x84e5bd, transparent: true, opacity: .5, toneMapped: false });
  const geometries = new Set<BufferGeometry>();
  const materials: Material[] = [chrome, light];
  function add(geometry: BufferGeometry, material: Material = chrome) {
    geometries.add(geometry);
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
    return mesh;
  }
  add(new TorusGeometry(1.03, .055, 12, 112));
  const halo = add(new TorusGeometry(1.105, .008, 6, 112), light);
  halo.position.z = -.02;
  function rounded(path: Shape | Path, x: number, y: number, width: number, height: number, radius: number) {
    path.moveTo(x + radius, y);
    path.lineTo(x + width - radius, y);
    path.quadraticCurveTo(x + width, y, x + width, y + radius);
    path.lineTo(x + width, y + height - radius);
    path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    path.lineTo(x + radius, y + height);
    path.quadraticCurveTo(x, y + height, x, y + height - radius);
    path.lineTo(x, y + radius);
    path.quadraticCurveTo(x, y, x + radius, y);
  }
  const outline = new Shape();
  rounded(outline, -.57, -.43, 1.14, .89, .22);
  const hole = new Path();
  rounded(hole, -.49, -.35, .98, .73, .16);
  outline.holes.push(hole);
  const head = add(new ExtrudeGeometry(outline, {
    depth: .075, bevelEnabled: true, bevelSegments: 3,
    bevelSize: .018, bevelThickness: .018, curveSegments: 20,
  }));
  head.position.z = .02;
  const stem = add(new CylinderGeometry(.027, .027, .18, 10));
  stem.position.set(0, .57, .065);
  const antenna = add(new SphereGeometry(.065, 16, 12));
  antenna.position.set(0, .71, .065);
  function stroke(points: [number, number, number][]) {
    return add(new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), 16, .026, 8, false));
  }
  stroke([[-.22, .17, .09], [-.34, .065, .09], [-.22, -.04, .09]]);
  stroke([[.22, .17, .09], [.34, .065, .09], [.22, -.04, .09]]);
  stroke([[-.2, -.2, .09], [0, -.2, .09], [.2, -.2, .09]]);
  const leftEar = add(new CylinderGeometry(.025, .025, .19, 10));
  leftEar.position.set(-.68, -.01, .065);
  const rightEar = add(new CylinderGeometry(.025, .025, .19, 10));
  rightEar.position.set(.68, -.01, .065);
  return {
    group,
    dispose() { geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); },
  };
}
