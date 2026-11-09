export * from 'three';
import { Texture } from 'three';
export const renderers = [], environments = [];
export const rendererControl = { unavailable: false };
/** Exercises real showroom lifecycle, geometry and camera logic; does not draw GPU pixels. */
export class WebGLRenderer {
  shadowMap = {};
  frames = 0;
  sizes = [];
  constructor({ canvas }) { if (rendererControl.unavailable) throw new Error('WebGL unavailable'); this.domElement = canvas; renderers.push(this); }
  setPixelRatio(value) { this.pixelRatio = value; }
  setSize(width, height) { this.sizes.push([width, height]); }
  render(scene, camera) { this.frames++; this.scene = scene; this.camera = camera.position.clone(); this.fov = camera.fov; }
  dispose() { this.disposed = true; }
}
export class PMREMGenerator {
  fromScene() { const target = { texture: new Texture(), disposed: false, dispose() { this.texture.dispose(); this.disposed = true; } }; environments.push(target); return target; }
  dispose() {}
}
