import { Mesh, Object3D, Texture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
export type ModelNodes = Record<string, Object3D>;
export interface AssetProvider { model(path: string): Promise<ModelNodes>; dispose(): void; }
/** Locally packaged clothing supplied for this collection, with embedded PBR maps. */
export class StudioAssets implements AssetProvider {
  private root = new URL('./assets/collection/', import.meta.url).href;
  private draco = new DRACOLoader().setDecoderPath(this.root + 'draco/').setWorkerLimit(2);
  private loader = new GLTFLoader().setDRACOLoader(this.draco);
  private cache = new Map<string, Promise<ModelNodes>>();
  private models: ModelNodes[] = [];
  private disposed = false;
  model(path: string) {
    let value = this.cache.get(path);
    if (!value) {
      value = this.loader.loadAsync(this.root + path + '?v=fabric-2').then((gltf) => {
        const nodes = Object.fromEntries(gltf.scene.children.map((object) => [object.name, object]));
        this.models.push(nodes); if (this.disposed) this.releaseModel(nodes); return nodes;
      });
      this.cache.set(path, value); value.catch(() => this.cache.delete(path));
    }
    return value;
  }
  private releaseModel(nodes: ModelNodes) {
    const geometries = new Set<Mesh['geometry']>(), materials = new Set<Mesh['material']>(), textures = new Set<Texture>();
    Object.values(nodes).forEach((node) => node.traverse((object) => {
      if (!(object instanceof Mesh)) return; geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
      });
    }));
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => { if (!Array.isArray(material)) material.dispose(); });
    textures.forEach((texture) => { texture.dispose(); const image = texture.image as { close?: () => void } | undefined; image?.close?.(); });
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.models.forEach((nodes) => this.releaseModel(nodes)); this.cache.clear(); this.draco.dispose(); }
}
