export * from 'three';
export const renderers = [];

/** No GPU drawing: tests exercise Stage's real lifecycle and Three scene objects. */
export class WebGLRenderer {
  extensions = { has: () => false };
  capabilities = { getMaxAnisotropy: () => 1 };
  disposed = false;
  frames = 0;
  sizes = [];
  constructor({ canvas }) { this.domElement = canvas; renderers.push(this); }
  setPixelRatio(value) { this.pixelRatio = value; }
  setSize(width, height) { this.sizes.push([width, height]); }
  render(scene, camera) { this.frames++; this.camera = camera.position.clone(); this.scene = scene; }
  dispose() { this.disposed = true; }
}
