import assert from 'node:assert/strict';
import test from 'node:test';
import { source } from './helpers.mjs';

test('procedural chrome sculptures have finite geometry and a smaller mobile budget', async () => {
  const { createWorkSculpture } = await source('src/immersive/WorkSculpture.ts');
  const { createBrandSculpture } = await source('src/immersive/BrandSculpture.ts');
  const desktop = createWorkSculpture(false), mobile = createWorkSculpture(true), brand = createBrandSculpture();
  const vertexCount = (object) => object.group.children.reduce((sum, mesh) => sum + mesh.geometry.attributes.position.count, 0);
  for (const sculpture of [desktop, mobile, brand]) {
    sculpture.group.traverse((mesh) => {
      if (!mesh.geometry) return;
      for (const attribute of ['position', 'normal']) assert.ok([...mesh.geometry.attributes[attribute].array].every(Number.isFinite));
      mesh.geometry.computeBoundingBox();
      assert.ok(Number.isFinite(mesh.geometry.boundingBox.min.y));
    });
  }
  assert.ok(vertexCount(mobile) < vertexCount(desktop) / 2);
  assert.ok(vertexCount(desktop) < 10000);
  assert.ok(brand.group.children.some((mesh) => mesh.geometry.boundingBox.min.y < -6), 'the medallion has continuous descending metal ribbons');
  desktop.dispose(); mobile.dispose(); brand.dispose();
});

test('the rounded glass mask rejects invisible corners without rejecting visible edges', async () => {
  const { insideOrbitCard } = await source('src/immersive/orbit.ts');
  assert.equal(insideOrbitCard(.5, .5), true);
  assert.equal(insideOrbitCard(.01, .5), true);
  assert.equal(insideOrbitCard(.0, .0), false);
  assert.equal(insideOrbitCard(1, 1), false);
});
