import { CanvasTexture, SRGBColorSpace } from 'three';
import type { DemoProject } from '../data/projects';

/** Persian titles live on the glass as well as in the accessible native links. */
export function createProjectLabel(project: DemoProject, portrait: boolean, mobile: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = mobile ? 512 : 768;
  canvas.height = Math.round(canvas.width / (portrait ? 1.116 : 1.8));
  const context = canvas.getContext('2d');
  if (!context) return null;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  let alive = true;
  const draw = () => {
    if (!alive) return;
    const w = canvas.width, h = canvas.height;
    context.clearRect(0, 0, w, h);
    context.direction = 'rtl'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0,0,0,.65)'; context.shadowBlur = 12;
    context.fillStyle = '#e7e9ed';
    context.font = `400 ${Math.round(w * .024)}px "Vazirmatn Variable", sans-serif`;
    context.fillText(project.categoryLabel, w * .5, h * .35, w * .8);
    context.font = `300 ${Math.round(w * .108)}px "Vazirmatn Variable", sans-serif`;
    context.fillStyle = '#ffffff';
    context.fillText(project.title.split('؛')[0], w * .5, h * .52, w * .84);
    context.shadowBlur = 0; context.strokeStyle = 'rgba(255,255,255,.3)'; context.lineWidth = 1;
    context.beginPath(); context.moveTo(w * .42, h * .7); context.lineTo(w * .58, h * .7); context.stroke();
    texture.needsUpdate = true;
  };
  draw();
  void document.fonts?.ready.then(draw).catch(() => {});
  return { texture, dispose() { alive = false; texture.dispose(); } };
}
