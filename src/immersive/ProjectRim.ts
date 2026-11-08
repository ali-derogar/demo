import { DoubleSide, ExtrudeGeometry, Mesh, MeshPhysicalMaterial, Path, Shape } from 'three';
import { ORBIT_CARD_HEIGHT, ORBIT_CARD_WIDTH } from './orbit';

/** A thin, lit edge around the selected pane, attached to the original card mesh. */
export function createProjectRim() {
  function outline(width: number, height: number, radius: number) {
    const shape = new Shape(), x = -width / 2, y = -height / 2;
    shape.moveTo(x + radius, y); shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius); shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }
  const shape = outline(ORBIT_CARD_WIDTH + .04, ORBIT_CARD_HEIGHT + .04, .26);
  shape.holes.push(new Path(outline(ORBIT_CARD_WIDTH - .02, ORBIT_CARD_HEIGHT - .02, .23).getPoints(8).reverse()));
  const geometry = new ExtrudeGeometry(shape, { depth: .06, steps: 1, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 1, curveSegments: 6 });
  geometry.translate(0, 0, -.075);
  const material = new MeshPhysicalMaterial({ color: 0xb1c6c8, metalness: .85, roughness: .2, clearcoat: 1, iridescence: 1,
    iridescenceThicknessMinimum: 160, iridescenceThicknessMaximum: 520, envMapIntensity: 1.1, side: DoubleSide, transparent: true, depthWrite: false, opacity: 0 });
  const mesh = new Mesh(geometry, material); mesh.name = 'project-rim'; mesh.visible = false;
  material.forceSinglePass = true;
  return { mesh, dispose() { geometry.dispose(); material.dispose(); } };
}
