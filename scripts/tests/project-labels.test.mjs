import assert from 'node:assert/strict';
import test from 'node:test';
import { environment, source } from './helpers.mjs';

test('Persian glass titles refresh after font loading and stop updating after disposal', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  const drawn = [];
  env.w.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, fillText(text) { drawn.push(text); }, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
  });
  const { createProjectLabel } = await source('src/immersive/projectLabel.ts');
  const { projects } = await source('src/data/projects.ts');
  const label = createProjectLabel(projects[0], false, false);
  assert.ok(label); assert.ok(drawn.includes('آینه'));
  assert.ok(label.texture.image.width > label.texture.image.height);
  const version = label.texture.version;
  env.resolveFonts(); await Promise.resolve();
  assert.ok(label.texture.version > version);
  label.dispose();
  const portrait = createProjectLabel(projects[0], true, true);
  assert.ok(portrait.texture.image.height > label.texture.image.height);
  const pendingVersion = portrait.texture.version;
  portrait.dispose(); await Promise.resolve();
  assert.equal(portrait.texture.version, pendingVersion, 'late font callbacks do not resurrect disposed textures');
});
