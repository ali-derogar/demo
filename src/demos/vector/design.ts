import { BoxGeometry, CircleGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, type Material, type Object3D } from 'three';
import type { ModelNodes } from './assets';
import { capsules, type StudioTheme } from './studio';

export function cloneDesign(nodes: ModelNodes, name: string, material?: Material) {
  if (!nodes[name]) throw new Error('Missing VECTOR design: ' + name);
  const object = nodes[name].clone(true);
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.userData.assetGeometry = true;
    child.material = material ?? (Array.isArray(child.material) ? child.material.map((m) => m.clone()) : child.material.clone());
  });
  return object;
}
function block(parent: Group, name: string, size: number[], position: number[], color: string, roughness = .8) {
  const object = new Mesh<BoxGeometry, Material>(new BoxGeometry(...size as [number, number, number]), new MeshStandardMaterial({ color, roughness }));
  object.name = name; object.position.fromArray(position); parent.add(object); return object;
}
function lettering(parent: Group, nodes: ModelNodes, name: string, position: number[], scale = 1, material?: Material) {
  const object = cloneDesign(nodes, name, material); object.position.fromArray(position); object.scale.setScalar(scale); parent.add(object); return object;
}
function plinth(parent: Group, x: number, z: number, index: number) {
  block(parent, 'VECTOR monolith ' + index, [.57, .32, .54], [x, .16, z], '#252d28', .63);
  const inset = block(parent, 'Signal orange inlay', [.4, .003, .003], [x, .29, z + .272], '#f45932');
  inset.material.dispose(); inset.material = new MeshBasicMaterial({ color: '#e95c38' });
  for (let i = 0; i < 7; i++) {
    const shadow = new Mesh(new CircleGeometry(.21 - i * .018, 48), new MeshBasicMaterial({ color: '#080e0a', transparent: true, opacity: .055, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .53; shadow.position.set(x, .321 + i * .0001, z); parent.add(shadow);
  }
}
function studio(nodes: ModelNodes, theme?: StudioTheme) {
  const environment = new Group(); environment.name = 'VECTOR original architecture';
  block(environment, 'Limestone floor', [12, .05, 8], [0, -.025, 0], '#6b6c5e', .7);
  block(environment, 'Basalt backdrop', [8, 4, .08], [0, 1.8, -.93], theme === 'drift' ? '#30252b' : theme === 'shell' ? '#283335' : '#303b31');
  for (const x of [-1.95, 1.95]) {
    const panel = block(environment, 'Architectural folded panel', [.32, 2.8, .18], [x, 1.5, -.7], '#3a453c'); panel.rotation.y = x < 0 ? .3 : -.3;
    const light = block(environment, 'Vertical light reveal', [.007, 1.8, .012], [x + (x < 0 ? .18 : -.18), 1.2, -.59], '#e88e68');
    light.material.dispose(); light.material = new MeshBasicMaterial({ color: '#cf8362' });
  }
  for (let i = -4; i <= 4; i++) block(environment, 'Limestone expansion joint', [.002, .001, 6], [i * .5, .001, 0], '#53594e');
  lettering(environment, nodes, 'VectorWordmark', [0, 1.13, -.875], 1.08, new MeshStandardMaterial({ color: '#aea68e', roughness: .65 }));
  lettering(environment, nodes, 'StudioSignature', [0, 1.20, -.873], 1, new MeshBasicMaterial({ color: '#b5ac96' }));
  return environment;
}
function garment(nodes: ModelNodes, theme: StudioTheme) {
  const capsule = capsules.find((c) => c.theme === theme)!;
  const object = cloneDesign(nodes, capsule.node); object.name = capsule.node;
  object.traverse((child) => { child.userData.product = capsule.product; }); return object;
}
export function buildOverview(nodes: ModelNodes) {
  const world = new Group(), environment = studio(nodes); world.add(environment);
  const shirts = capsules.map((capsule, index) => {
    plinth(environment, capsule.position[0], capsule.position[2], index);
    const shirt = garment(nodes, capsule.theme); shirt.position.fromArray(capsule.position); shirt.rotation.y = capsule.yaw; world.add(shirt); return shirt;
  });
  return { world, environment, shirts };
}
export function buildRoom(theme: StudioTheme, nodes: ModelNodes) {
  const world = new Group(); world.add(studio(nodes, theme)); plinth(world, 0, 0, 1);
  const shirt = garment(nodes, theme); shirt.position.set(0, .76, 0); world.add(shirt);
  const title = theme[0].toUpperCase() + theme.slice(1) + 'Title';
  lettering(world, nodes, title, [0, .12, .276], .33, new MeshBasicMaterial({ color: '#bdb49b' }));
  return { world, shirt };
}
export function buildDetail(theme: StudioTheme, nodes: ModelNodes) {
  const world = new Group(), shirt = garment(nodes, theme); world.add(shirt);
  const orbit = new Mesh(new RingGeometry(.48, .483, 96), new MeshBasicMaterial({ color: '#817a68', side: DoubleSide, transparent: true, opacity: .3 }));
  orbit.name = 'VECTOR pattern orbit'; orbit.position.z = -.33; world.add(orbit);
  const textMaterial = new MeshBasicMaterial({ color: '#d4c6a8', transparent: true }), marqueeMaterial = new MeshBasicMaterial({ color: '#d4c6a8', transparent: true, opacity: 0 });
  const texts = new Group(); world.add(texts);
  const title = theme[0].toUpperCase() + theme.slice(1) + 'Title';
  lettering(texts, nodes, title, [0, -.43, 0], .55, textMaterial);
  const marquees = Array.from({ length: 4 }, (_, i) => lettering(world, nodes, 'VectorWordmark', [(i % 2 ? 2.4 : 0), i < 2 ? .51 : -.52, -.45], .62, marqueeMaterial));
  return { world, shirt, texts, textMaterial, marqueeMaterial, marquees };
}
export function buildFinale(theme: StudioTheme, nodes: ModelNodes) {
  const world = new Group(); world.name = 'VECTOR collection installation'; world.add(studio(nodes, theme));
  plinth(world, .5, 0, 1); const shirt = garment(nodes, theme); shirt.position.set(.5, .76, 0); shirt.rotation.y = -.25; world.add(shirt);
  const button = new Mesh(new BoxGeometry(.5, .12, .01), new MeshBasicMaterial({ color: '#d9cdb4', transparent: true, opacity: 0 }));
  button.position.set(-.65, .65, .1); button.userData.action = 'shop'; world.add(button);
  return { world, shirt };
}
export function garmentMeshes(objects: Object3D[]) {
  const meshes: Mesh[] = []; objects.forEach((object) => object.traverse((child) => { if (child instanceof Mesh) meshes.push(child); })); return meshes;
}
