import { CubeTextureLoader, Mesh, SRGBColorSpace, TextureLoader, type CubeTexture, type Texture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
export type ModelNodes = Record<string, Mesh>;
export interface AssetProvider {
  model(path: string): Promise<ModelNodes>;
  texture(path: string, srgb?: boolean): Promise<Texture>;
  cube(path: string): Promise<CubeTexture>;
  dispose(): void;
}
export class ReferenceAssets implements AssetProvider {
  private root = new URL('./assets/reference/', import.meta.url).href;
  private draco = new DRACOLoader().setDecoderPath(this.root + 'draco/').setWorkerLimit(2);
  private loader = new GLTFLoader().setDRACOLoader(this.draco);
  private cache = new Map<string, Promise<unknown>>();
  private textures = new Set<Texture>();
  private models: ModelNodes[] = [];
  private disposed = false;
  private cached<T>(key: string, load: () => Promise<T>) {
    let value = this.cache.get(key) as Promise<T> | undefined;
    if (!value) { value = load(); this.cache.set(key, value); value.catch(() => this.cache.delete(key)); }
    return value;
  }
  model(path: string) {
    return this.cached(path, async () => {
      const gltf = await this.loader.loadAsync(this.root + path), nodes: ModelNodes = {};
      gltf.scene.traverse((object) => { if (object instanceof Mesh) nodes[object.name] = object; });
      this.models.push(nodes); if (this.disposed) this.releaseModel(nodes); return nodes;
    });
  }
  texture(path: string, srgb = true) {
    return this.cached(path + ':' + srgb, async () => {
      const texture = await new TextureLoader().loadAsync(this.root + path);
      texture.flipY = false; if (srgb) texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4;
      const image = texture.image as HTMLImageElement, limit = window.innerWidth < 768 ? 2048 : 4096;
      if (Math.max(image.width, image.height) > limit && !this.disposed) {
        const scale = limit / Math.max(image.width, image.height), canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (context) { context.drawImage(image, 0, 0, canvas.width, canvas.height); texture.image = canvas; texture.needsUpdate = true; }
      }
      this.textures.add(texture); if (this.disposed) texture.dispose(); return texture;
    });
  }
  cube(path: string) {
    return this.cached(path, async () => {
      const texture = await new CubeTextureLoader().setPath(this.root + path).loadAsync(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
      texture.colorSpace = SRGBColorSpace; this.textures.add(texture); if (this.disposed) texture.dispose(); return texture;
    });
  }
  private releaseModel(nodes: ModelNodes) {
    new Set(Object.values(nodes).map((node) => node.geometry)).forEach((geometry) => geometry.dispose());
    for (const node of Object.values(nodes)) (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => material.dispose());
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.draco.dispose();
    this.textures.forEach((texture) => { texture.dispose(); const image = texture.image as { close?: () => void } | undefined; image?.close?.(); });
    this.models.forEach((model) => this.releaseModel(model)); this.cache.clear();
  }
}
