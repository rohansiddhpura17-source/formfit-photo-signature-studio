import type { CompressionResult, CompressionSettings, ImageRequirement } from '../types';
import { canvasToBlob } from './imageLoader';
import { scaleCanvas } from './imageCropper';

const KB = 1024;
const MIN_DIMENSION = 90;

export class CompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompressionError';
  }
}

const QUALITY_FLOORS: Record<CompressionSettings['mode'], number> = {
  auto: 0.4,
  balanced: 0.62,
  maximum: 0.25,
  manual: 0.3,
};

function maxBytesFor(settings: CompressionSettings): number {
  return Math.floor(settings.targetKB * KB) - 1;
}

/**
 * Encode at a quality and return the blob. PNG ignores quality by design — the
 * browser's PNG encoder is lossless, and we never pretend otherwise.
 */
async function encode(
  canvas: HTMLCanvasElement,
  type: CompressionSettings['format'],
  quality: number,
): Promise<Blob> {
  try {
    return await canvasToBlob(canvas, type, type === 'image/png' ? undefined : quality);
  } catch {
    throw new CompressionError('The browser could not encode this image in the selected format.');
  }
}

/**
 * JPEG and WebP have no alpha channel. When the browser encodes a canvas
 * with transparent pixels to one of them, the transparent areas come out
 * black — so a transparent signature would export on a black background
 * while still passing validation. Composite onto white first; PNG keeps
 * its alpha untouched.
 */
function flattenForLossy(
  source: HTMLCanvasElement,
  format: CompressionSettings['format'],
): HTMLCanvasElement {
  if (format === 'image/png') return source;
  const flat = document.createElement('canvas');
  flat.width = source.width;
  flat.height = source.height;
  const ctx = flat.getContext('2d');
  if (!ctx) return source;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(source, 0, 0);
  return flat;
}

/**
 * Real iterative compression. For JPEG/WebP we binary-search quality and keep
 * the largest result that is strictly under the byte limit. If the limit is
 * still missed and downscaling is allowed, dimensions are reduced in 10% steps
 * and the search repeats. Every reported size is the actual Blob.size.
 */
export async function compressCanvas(
  source: HTMLCanvasElement,
  settings: CompressionSettings,
  requirement?: ImageRequirement,
): Promise<CompressionResult> {
  const started = performance.now();
  const maxBytes = maxBytesFor(settings);
  const minBytes = requirement ? requirement.minKB * KB : 0;
  if (!Number.isFinite(settings.targetKB) || settings.targetKB <= 0) {
    throw new CompressionError('Enter a target size greater than 0 KB.');
  }
  if (maxBytes < 1024) {
    throw new CompressionError('The target is too small to produce a valid image. Use at least 2 KB.');
  }

  const floor = Math.min(
    0.98,
    settings.mode === 'manual' ? Math.max(0.05, settings.quality) : QUALITY_FLOORS[settings.mode],
  );
  const allowDownscale =
    settings.allowDownscale || settings.mode === 'maximum' ? true : false;

  type Encoded = { blob: Blob; quality: number };
  interface SearchOutcome {
    best: Encoded | null;
    smallest: Encoded | null;
    attempts: number;
  }

  let canvas = flattenForLossy(source, settings.format);
  let attempts = 0;
  let downscaled = false;

  const isLossy = settings.format !== 'image/png';

  const search = async (target: HTMLCanvasElement): Promise<SearchOutcome> => {
    let best: Encoded | null = null;
    let smallest: Encoded | null = null;
    let used = 0;

    if (!isLossy) {
      const blob = await encode(target, settings.format, 1);
      used += 1;
      smallest = { blob, quality: 1 };
      if (blob.size < maxBytes) best = { blob, quality: 1 };
      return { best, smallest, attempts: used };
    }

    // Manual mode: one honest encode at the chosen quality.
    if (settings.mode === 'manual') {
      const quality = Math.min(0.99, Math.max(0.05, settings.quality));
      const blob = await encode(target, settings.format, quality);
      used += 1;
      smallest = { blob, quality };
      if (blob.size < maxBytes) best = { blob, quality };
      return { best, smallest, attempts: used };
    }

    // Establish bounds. Encode the top quality once and reuse it.
    let low = floor;
    let high = 0.98;
    let lowBlob: Blob | null = null;
    let highBlob: Blob | null = null;

    highBlob = await encode(target, settings.format, high);
    used += 1;
    smallest = { blob: highBlob, quality: high };
    if (highBlob.size < maxBytes) {
      best = { blob: highBlob, quality: high };
      return { best, smallest, attempts: used };
    }

    lowBlob = await encode(target, settings.format, low);
    used += 1;
    if (lowBlob.size < (smallest?.blob.size ?? Infinity)) {
      smallest = { blob: lowBlob, quality: low };
    }
    if (lowBlob.size >= maxBytes) {
      // Even the quality floor is too large. Keep the smaller result.
      return { best, smallest, attempts: used };
    }

    // Binary search for the best quality that still fits.
    for (let i = 0; i < 6; i += 1) {
      const mid = (low + high) / 2;
      const blob = await encode(target, settings.format, mid);
      used += 1;
      if (blob.size < maxBytes) {
        best = { blob, quality: mid };
        low = mid;
      } else {
        if (!smallest || blob.size < smallest.blob.size) smallest = { blob, quality: mid };
        high = mid;
      }
    }

    return { best, smallest, attempts: used };
  };

  let outcome = await search(canvas);
  attempts += outcome.attempts;
  let best = outcome.best;
  let smallest = outcome.smallest;

  while (!best && allowDownscale) {
    const nextWidth = Math.round(canvas.width * 0.9);
    const nextHeight = Math.round(canvas.height * 0.9);
    if (nextWidth < MIN_DIMENSION || nextHeight < MIN_DIMENSION) break;
    canvas = scaleCanvas(canvas, 0.9);
    downscaled = true;
    outcome = await search(canvas);
    attempts += outcome.attempts;
    best = outcome.best;
    smallest = outcome.smallest;
  }

  const chosen = best ?? smallest;
  if (!chosen) {
    throw new CompressionError('No output could be produced. Try a different format or target.');
  }

  const targetMet = chosen.blob.size < maxBytes;
  const meetsMinimum = chosen.blob.size >= minBytes;

  let note: string | undefined;
  if (!targetMet) {
    note = `Could not reach ${settings.targetKB} KB. The smallest achievable file was ${(
      chosen.blob.size / KB
    ).toFixed(1)} KB.`;
  } else if (!meetsMinimum) {
    note = `Output is ${(chosen.blob.size / KB).toFixed(1)} KB, below the preset's ${
      requirement?.minKB
    } KB minimum. Use a larger source image or a higher target.`;
  } else if (settings.format === 'image/png') {
    note = 'PNG is lossless; quality control does not apply. Dimensions were reduced only if you allowed it.';
  }

  return {
    blob: chosen.blob,
    bytes: chosen.blob.size,
    quality: chosen.quality,
    width: canvas.width,
    height: canvas.height,
    attempts,
    targetMet,
    targetBytes: maxBytes,
    minBytes,
    format: settings.format,
    downscaled,
    durationMs: Math.round(performance.now() - started),
    note,
  };
}

function isPngGain(format: string): boolean {
  return format === 'image/png';
}

export function validateCompressionSettings(settings: CompressionSettings): string | null {
  if (!Number.isFinite(settings.targetKB)) return 'Enter a target size in KB.';
  if (settings.targetKB <= 1) return 'The target must be at least 2 KB.';
  if (settings.targetKB > 10240) return 'The target cannot exceed 10,240 KB.';
  if (settings.mode === 'manual' && (settings.quality < 0.05 || settings.quality > 1)) {
    return 'Quality must be between 5% and 100%.';
  }
  return null;
}
