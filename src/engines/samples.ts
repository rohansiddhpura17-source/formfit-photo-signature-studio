import type { LoadedImage } from '../types';
import { loadImageFile } from './imageLoader';

/** Generate a clearly synthetic studio portrait for trying the workflow. */
export async function createSamplePhoto(): Promise<LoadedImage> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = ctx.createLinearGradient(0, 0, 900, 1600);
  bg.addColorStop(0, '#EFE9DE');
  bg.addColorStop(0.55, '#E3D9C9');
  bg.addColorStop(1, '#CFC2AE');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 1600);

  // Soft studio light
  const glow = ctx.createRadialGradient(520, 480, 80, 520, 700, 900);
  glow.addColorStop(0, 'rgba(255,252,244,0.85)');
  glow.addColorStop(1, 'rgba(255,252,244,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 1600);

  // Shoulders
  ctx.fillStyle = '#2E3440';
  ctx.beginPath();
  ctx.moveTo(170, 1600);
  ctx.bezierCurveTo(210, 1230, 420, 1090, 600, 1085);
  ctx.bezierCurveTo(780, 1090, 990, 1230, 1030, 1600);
  ctx.closePath();
  ctx.fill();

  // Shirt opening
  ctx.fillStyle = '#F6F3EC';
  ctx.beginPath();
  ctx.moveTo(560, 1120);
  ctx.lineTo(600, 1330);
  ctx.lineTo(640, 1120);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = '#C99472';
  ctx.beginPath();
  ctx.roundRect(515, 940, 170, 240, 60);
  ctx.fill();

  // Face
  const skin = ctx.createLinearGradient(420, 380, 800, 980);
  skin.addColorStop(0, '#D9A883');
  skin.addColorStop(1, '#C08A66');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(600, 650, 235, 300, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#C08A66';
  ctx.beginPath();
  ctx.ellipse(360, 660, 42, 78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(840, 660, 42, 78, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#27211D';
  ctx.beginPath();
  ctx.ellipse(600, 470, 255, 205, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(845, 560);
  ctx.bezierCurveTo(800, 430, 700, 360, 600, 360);
  ctx.bezierCurveTo(500, 360, 400, 430, 355, 560);
  ctx.closePath();
  ctx.fill();

  // Brows
  ctx.strokeStyle = '#3A2B23';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(455, 610);
  ctx.quadraticCurveTo(500, 585, 545, 605);
  ctx.moveTo(655, 605);
  ctx.quadraticCurveTo(700, 585, 745, 610);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#F8F4EC';
  ctx.beginPath();
  ctx.ellipse(500, 665, 52, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(700, 665, 52, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4A3527';
  ctx.beginPath();
  ctx.arc(500, 665, 19, 0, Math.PI * 2);
  ctx.arc(700, 665, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#171310';
  ctx.beginPath();
  ctx.arc(500, 665, 8, 0, Math.PI * 2);
  ctx.arc(700, 665, 8, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = 'rgba(120,72,46,0.55)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(600, 680);
  ctx.quadraticCurveTo(585, 780, 615, 800);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = '#8D4A43';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(530, 865);
  ctx.quadraticCurveTo(600, 895, 670, 865);
  ctx.stroke();

  // Jaw shading
  const shade = ctx.createLinearGradient(380, 780, 820, 940);
  shade.addColorStop(0, 'rgba(120,70,45,0)');
  shade.addColorStop(0.5, 'rgba(120,70,45,0.10)');
  shade.addColorStop(1, 'rgba(120,70,45,0)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(600, 780, 210, 210, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add subtle deterministic sensor grain so JPEG compression behaves realistically.
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = imgData.data;
  let seed = 0x12345678;
  for (let i = 0; i < px.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const delta = ((seed >>> 24) % 19) - 9;
    px[i] = Math.max(0, Math.min(255, px[i] + delta));
    px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + delta));
    px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + delta));
  }
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
  if (!blob) throw new Error('Could not create sample photograph');
  return loadImageFile(new File([blob], 'sample-portrait.jpg', { type: 'image/jpeg' }));
}

/** Generate a synthetic handwritten-style signature on white paper. */
export async function createSampleSignature(): Promise<LoadedImage> {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = '#FCFBF8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#1C2A44';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // A. Sharma — drawn as a continuous ink path with pressure variation.
  const strokes: Array<[number, number, number, number, number, number]> = [
    [90, 220, 130, 90, 170, 220],
    [140, 200, 200, 170, 250, 210],
    [300, 205, 330, 120, 360, 205],
    [320, 175, 400, 160, 420, 200],
    [450, 200, 470, 120, 500, 190],
    [520, 195, 545, 130, 570, 195],
    [590, 190, 610, 140, 640, 185],
    [660, 185, 690, 150, 720, 180],
    [740, 180, 800, 155, 860, 175],
    [860, 175, 900, 185, 920, 215],
    [330, 235, 470, 225, 600, 230],
  ];
  for (const [x1, y1, cx, cy, x2, y2] of strokes) {
    ctx.lineWidth = 5 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
  }

  // Flourish
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(600, 235);
  ctx.bezierCurveTo(720, 270, 840, 255, 930, 215);
  ctx.stroke();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create sample signature');
  return loadImageFile(new File([blob], 'sample-signature.png', { type: 'image/png' }));
}
