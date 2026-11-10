export * from 'three';
export const renderers = [];
export const control = { unavailable: false };
/** Real imported models and camera transforms; GPU pixels are not emulated. */
export class WebGLRenderer {
  frames = 0;
  constructor({ canvas }) { if (control.unavailable) throw new Error('WebGL unavailable'); this.domElement = canvas; renderers.push(this); }
  setPixelRatio(ratio) { this.pixelRatio = ratio; }
  setSize(width, height) { this.size = [width, height]; }
  render(scene, camera) { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); this.frames++; this.scene = scene; this.camera = camera; }
  dispose() { this.disposed = true; }
}
