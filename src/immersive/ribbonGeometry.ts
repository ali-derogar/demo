import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

/** A swept, slightly crowned strip. Both sculptures are procedural and share no model assets. */
export function ribbonGeometry(path: (t: number) => Vector3, width: (t: number) => number, twist: (t: number) => number, segments: number, crossSegments = 4) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const up = new Vector3(0, 0, 1);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = path(t);
    const tangent = path(Math.min(1, t + .001)).sub(path(Math.max(0, t - .001))).normalize();
    const side = new Vector3().crossVectors(tangent, up).normalize().applyAxisAngle(tangent, twist(t));
    const normal = new Vector3().crossVectors(side, tangent).normalize();
    for (let j = 0; j <= crossSegments; j++) {
      const across = j / crossSegments * 2 - 1;
      const point = center.clone().addScaledVector(side, across * width(t)).addScaledVector(normal, (1 - across * across) * .018);
      positions.push(point.x, point.y, point.z); uv.push(j / crossSegments, t);
      if (i < segments && j < crossSegments) {
        const a = i * (crossSegments + 1) + j, b = a + crossSegments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}
