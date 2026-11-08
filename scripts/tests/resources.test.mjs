import assert from 'node:assert/strict';
import test from 'node:test';
import { source } from './helpers.mjs';

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('mobile resolution follows display density and retains legible detail after a quality downshift', async () => {
  const { scenePixelRatio } = await source('src/immersive/frameQuality.ts');
  for (const density of [.75, 1, 1.25, 1.5, 2, 3, 4]) {
    assert.equal(scenePixelRatio(density, true), Math.min(density, 2));
    assert.equal(scenePixelRatio(density, true, 1), Math.min(density, 1.5));
    assert.equal(scenePixelRatio(density, false), Math.min(density, 1.5));
    assert.equal(scenePixelRatio(density, false, 1), Math.min(density, 1.25));
    assert.equal(scenePixelRatio(density, false, 2), Math.min(density, 1));
  }
  for (const invalid of [NaN, Infinity, 0, -1]) assert.equal(scenePixelRatio(invalid, true), 1);
});

test('image queue bounds concurrency, reprioritizes and retries a failure once', async () => {
  const { createResourceQueue } = await source('src/immersive/resourceQueue.ts');
  const calls = []; const pending = new Map(); const released = [];
  const queue = createResourceQueue((url) => { calls.push(url); return new Promise((resolve, reject) => pending.set(url, { resolve, reject })); }, (value) => released.push(value));
  queue.prioritize(['current', 'neighbor', 'other', 'far']); await flush();
  assert.deepEqual(calls, ['current', 'neighbor']);
  queue.prioritize(['far', 'current', 'neighbor', 'other']);
  pending.get('current').resolve('current-image'); await flush();
  assert.deepEqual(calls, ['current', 'neighbor', 'far']);
  pending.get('neighbor').reject(new Error('offline')); await flush();
  assert.equal(calls.filter((url) => url === 'neighbor').length, 2);
  pending.get('neighbor').reject(new Error('still offline')); await flush();
  assert.equal(calls.at(-1), 'other');
  pending.get('other').resolve('other-image'); pending.get('far').resolve('far-image'); await flush();
  assert.equal(queue.get('current'), 'current-image');
  assert.equal(calls.filter((url) => url === 'neighbor').length, 2);
  queue.dispose();
  assert.deepEqual(new Set(released), new Set(['current-image', 'other-image', 'far-image']));
});

test('late image results are released after scene disposal and never restart requests', async () => {
  const { createResourceQueue } = await source('src/immersive/resourceQueue.ts');
  const pending = []; const released = [];
  const queue = createResourceQueue(() => new Promise((resolve) => pending.push(resolve)), (value) => released.push(value));
  queue.prioritize(['a', 'b', 'c']); await flush(); queue.dispose();
  pending.forEach((resolve, i) => resolve(i)); await flush();
  assert.equal(pending.length, 2); assert.deepEqual(released, [0, 1]);
});

test('quality ignores warmup/spikes and downshifts in bounded stages after sustained slow frames', async () => {
  const { FrameQuality } = await source('src/immersive/frameQuality.ts');
  const quality = new FrameQuality(false); const changes = [];
  const feed = (count, delta) => { for (let i = 0; i < count; i++) { const result = quality.sample(delta); if (result !== null) changes.push(result); } };
  feed(50, 40); assert.deepEqual(changes, [], 'warm-up cannot lower quality');
  feed(120, 16); feed(10, 60); feed(110, 16);
  assert.deepEqual(changes, [], 'a few spikes cannot lower quality');
  feed(120, 28); assert.deepEqual(changes, [], 'one slow window is insufficient');
  feed(120, 28); assert.deepEqual(changes, [1]);
  feed(240, 28); assert.deepEqual(changes, [1, 2]);
  feed(500, 40); assert.deepEqual(changes, [1, 2]);
  const mobile = new FrameQuality(true); const mobileChanges = [];
  for (let i = 0; i < 1000; i++) { const level = mobile.sample(40); if (level !== null) mobileChanges.push(level); }
  assert.deepEqual(mobileChanges, [1]);
});
