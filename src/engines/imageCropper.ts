import type { Adjustments, CropSettings } from '../types';

export interface RenderOptions {
  image: HTMLImageElement;
  crop: CropSettings;
  width: number;
  height: number;
  adjustments?: Adjustments;
  /** Fill shown where the image does not cover the frame. */
  background?: string;
  /** Signature-specific paper removal. */
  transparent?: boolean;
  inkThreshold?: number;
}

/**
 * Draw the current crop into a canvas. The same math is used for the on-screen
 * preview and the exported pixels, so what the user sees is what they export.
 * The face guide is a DOM overlay and is never drawn here.
 */
export function renderCrop(canvas: HTMLCanvasElement, options: RenderOptions): void {
  const { image, crop, width, height } = options;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is unavailable in this browser.');

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  ctx.save();
  ctx.fillStyle = options.background ?? '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rotation = (crop.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));

  // Scale needed for the rotated image to fully cover the frame.
  const coverW = (canvas.width) / (image.naturalWidth * cos + image.naturalHeight * sin);
  const coverH = (canvas.height) / (image.naturalWidth * sin + image.naturalHeight * cos);
  const cover = Math.max(coverW, coverH);
  const scale = cover * Math.max(0.2, crop.zoom);

  ctx.translate(
    canvas.width / 2 + crop.offsetX * canvas.width,
    canvas.height / 2 + crop.offsetY * canvas.height,
  );
  ctx.rotate(rotation);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    (-image.naturalWidth * scale) / 2,
    (-image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  );
  ctx.restore();

  const adjustments = options.adjustments;
  const needsTone =
    adjustments &&
    (adjustments.brightness !== 100 || adjustments.contrast !== 100 || adjustments.saturation !== 100);
  if (needsTone) {
    applyAdjustments(ctx, canvas.width, canvas.height, adjustments);
  }

  if (options.transparent) {
    removePaper(ctx, canvas.width, canvas.height, options.inkThreshold ?? 82);
  }
}

function applyAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: Adjustments,
) {
  const data = ctx.getImageData(0, 0, width, height);
  const pixels = data.data;
  const brightness = adjustments.brightness / 100;
  const contrast = adjustments.contrast / 100;
  const saturation = adjustments.saturation / 100;
  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i] * brightness;
    let g = pixels[i + 1] * brightness;
    let b = pixels[i + 2] * brightness;

    r = r * contrast + intercept;
    g = g * contrast + intercept;
    b = b * contrast + intercept;

    if (saturation !== 1) {
      const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = grey + (r - grey) * saturation;
      g = grey + (g - grey) * saturation;
      b = grey + (b - grey) * saturation;
    }

    pixels[i] = clampByte(r);
    pixels[i + 1] = clampByte(g);
    pixels[i + 2] = clampByte(b);
  }
  ctx.putImageData(data, 0, 0);
}

/**
 * Turn near-white paper into transparency without touching the ink strokes.
 * This preserves the handwriting exactly; it does not redraw or thicken it.
 */
export function removePaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
) {
  const data = ctx.getImageData(0, 0, width, height);
  const pixels = data.data;
  const cutoff = (threshold / 100) * 255;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luminance >= cutoff) {
      pixels[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
}

function clampByte(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
}

/** Render an offscreen canvas for compression/export. */
export function renderToCanvas(options: RenderOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  renderCrop(canvas, options);
  return canvas;
}

/** Draw a downscaled copy without repeatedly decoding the source image. */
export function scaleCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * factor));
  canvas.height = Math.max(1, Math.round(source.height * factor));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}
