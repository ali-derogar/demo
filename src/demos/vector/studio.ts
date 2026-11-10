export type StudioTheme = 'white' | 'sport' | 'gray';
export const studioThemes: StudioTheme[] = ['white', 'sport', 'gray'];
export const capsules = [
  { theme: 'white' as const, product: 'tee-02', node: 'Shirt_White', label: 'WHITE', position: [.65, .7, -.45], yaw: Math.PI / 9 },
  { theme: 'sport' as const, product: 'tee-03', node: 'Shirt_Sport', label: 'SPORT', position: [0, .7, 0], yaw: 0 },
  { theme: 'gray' as const, product: 'tee-01', node: 'Shirt_Gray', label: 'GRAY', position: [-.65, .7, -.45], yaw: -Math.PI / 9 },
];
export const referenceRoot = './assets/reference/';
export const overviewMaps = {
  default: 'textures/main/Default_Studio_Baked_Texture.webp', white: 'textures/main/White_Studio_Baked_Texture.webp',
  sport: 'textures/main/Red_Studio_Baked_Texture.webp', gray: 'textures/main/Gray_Studio_Baked_Texture.webp',
  whiteShirt: 'textures/main/White_Shirt_BakedTexture.webp', sportShirt: 'textures/main/Sport_Shirt_Baked_Texture.webp', grayShirt: 'textures/main/Gray_Shirt_Baked_Texture.webp',
};
export const roomMaps = {
  white: { studio: 'textures/white/first/White_Studio_Baked_Texture.webp', speakers: 'textures/white/first/Speakers_Baked_Texture.webp', dj: 'textures/white/first/Dj_Baked_Texture.webp', shirt: 'textures/white/first/White_Shirt_Baked_Texture.webp', tv: 'textures/white/first/TV_Screen.webp' },
  sport: { env: 'textures/sport/first/Floor_Baked_Texutre.webp', ramp: 'textures/sport/first/Ramp_Baked_Texture.webp', skateboard: 'textures/sport/first/Skateboard_Baked_Texture.webp', shirt: 'textures/sport/first/Sport_Shirt_Baked_Texture.webp' },
  gray: { shirt: 'textures/gray/first/Gray_Shirt_Baked_Texture.webp', assets: 'textures/gray/first/Assets_Baked_Texture.webp', wall: 'textures/gray/first/Wall_Baked_Texture.webp', floor: 'textures/gray/first/Floor_Baked_Texture.webp' },
};
export const detailMaps = {
  white: { shirt: 'textures/white/second/White_Studio_Baked_Texture.webp', sphere: 'textures/white/second/Sphere_Env_Baked_Texture.webp' },
  sport: { shirt: 'textures/sport/second/Sport_Shirt_Baked_Texture.webp', sphere: 'textures/sport/second/Sport_Sphere_Env_Baked_Texture.webp' },
  gray: { shirt: 'textures/gray/second/Gray_Shirt_Baked_Texture.webp', sphere: 'textures/gray/second/Gray_Sphere_Env_Baked_Texture.webp' },
};
export function capsuleFor(id: string | null) { return capsules.find((c) => c.product === id); }
export function storyProgress(scroll: number, top: number, height: number, viewport: number) { return Math.max(0, Math.min(1, (scroll - top) / Math.max(1, height - viewport))); }
export function range(value: number, from: number, to: number) { return Math.max(0, Math.min(1, (value - from) / (to - from))); }
export function storyPose(progress: number, compact: boolean) {
  const first = range(progress, .04, .24), turn = range(progress, .19, .74), last = range(progress, .77, .94);
  return { first, turn, last, roomY: first * 1.5, shirtYaw: first * Math.PI / 2,
    detailY: .1 + range(turn, 0, .8) * .6, detailYaw: Math.PI / 3 - Math.PI * 2 * turn,
    detailPitch: Math.PI / 8 * (1 - range(turn, 0, .2)), detailScale: (compact ? 1.5 : 2.2) + (1 - (compact ? 1.5 : 2.2)) * range(turn, .75, .92),
  };
}
