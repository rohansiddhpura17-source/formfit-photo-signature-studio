import type { DimensionSpec, ImageRequirement, Preset } from '../types';
import { clamp } from './format';

export interface Dimensions {
  width: number;
  height: number;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function aspectLabel(aspect: number): string {
  const common: Array<[number, string]> = [
    [1, '1:1'],
    [4 / 5, '4:5'],
    [3 / 4, '3:4'],
    [2 / 3, '2:3'],
    [3 / 2, '3:2'],
    [4 / 3, '4:3'],
    [16 / 9, '16:9'],
    [140 / 60, '7:3'],
    [200 / 230, '20:23'],
    [3.5 / 4.5, '7:9'],
  ];
  for (const [value, label] of common) {
    if (Math.abs(aspect - value) < 0.02) return label;
  }
  return aspect.toFixed(2);
}

export function fitContain(
  naturalWidth: number,
  naturalHeight: number,
  boxWidth: number,
  boxHeight: number,
): Dimensions {
  if (naturalWidth <= 0 || naturalHeight <= 0) return { width: 0, height: 0 };
  const scale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
  };
}

export function scaleToWidth(naturalWidth: number, naturalHeight: number, width: number): Dimensions {
  return {
    width: Math.round(width),
    height: Math.max(1, Math.round((naturalHeight / naturalWidth) * width)),
  };
}

/** Is the exact pixel size fixed by the authority? */
export function hasExactDimensions(spec: DimensionSpec): boolean {
  return typeof spec.width === 'number' && typeof spec.height === 'number';
}

export function hasRangeDimensions(spec: DimensionSpec): boolean {
  return (
    spec.minWidth !== undefined ||
    spec.maxWidth !== undefined ||
    spec.minHeight !== undefined ||
    spec.maxHeight !== undefined
  );
}

/** Short human-readable dimension summary used on preset cards. */
export function describeDimensions(spec: DimensionSpec, fixed: boolean): string {
  if (hasExactDimensions(spec)) return `${spec.width} × ${spec.height} px`;
  if (hasRangeDimensions(spec)) {
    const w =
      spec.minWidth !== undefined && spec.maxWidth !== undefined
        ? `${spec.minWidth}–${spec.maxWidth}`
        : spec.maxWidth !== undefined
          ? `≤ ${spec.maxWidth}`
          : `${spec.minWidth}+`;
    const h =
      spec.minHeight !== undefined && spec.maxHeight !== undefined
        ? `${spec.minHeight}–${spec.maxHeight}`
        : spec.maxHeight !== undefined
          ? `≤ ${spec.maxHeight}`
          : `${spec.minHeight}+`;
    return `${w} × ${h} px`;
  }
  return fixed ? 'Fixed by authority' : 'No fixed pixel size';
}

/**
 * Compute a sensible output size for a requirement and crop aspect.
 * When the authority fixes dimensions, those are used exactly. When it only
 * gives a range, we pick a size inside the range. When it gives none, we use a
 * high-quality working size and let the user adjust it.
 */
export function recommendedDimensions(req: ImageRequirement, aspect: number): Dimensions {
  const spec = req.dimensions;
  if (hasExactDimensions(spec)) {
    return { width: spec.width!, height: spec.height! };
  }

  if (hasRangeDimensions(spec)) {
    const targetHeight = aspect <= 1 ? 450 : 160;
    let height = clamp(
      targetHeight,
      spec.minHeight ?? 1,
      spec.maxHeight ?? Math.max(targetHeight, 1),
    );
    let width = Math.round(height * aspect);
    const minW = spec.minWidth ?? 1;
    const maxW = spec.maxWidth ?? width;
    if (width < minW) {
      width = minW;
      height = Math.round(width / aspect);
    }
    if (width > maxW) {
      width = maxW;
      height = Math.round(width / aspect);
    }
    if (spec.minHeight !== undefined) height = Math.max(height, spec.minHeight);
    if (spec.maxHeight !== undefined) height = Math.min(height, spec.maxHeight);
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }

  const width = req.label.toLowerCase().includes('signature') ? 600 : 600;
  return { width, height: Math.max(1, Math.round(width / aspect)) };
}

export function aspectFor(preset: Preset, kind: 'photo' | 'signature'): number {
  return kind === 'photo' ? preset.photoCropAspect : preset.signatureCropAspect;
}

export function outputForPreset(preset: Preset, kind: 'photo' | 'signature', aspect: number): Dimensions {
  return recommendedDimensions(kind === 'photo' ? preset.photo : preset.signature, aspect);
}

export function defaultCropFor(preset: Preset, kind: 'photo' | 'signature') {
  return {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    aspect: aspectFor(preset, kind),
    showFaceGuide: kind === 'photo',
  };
}

export function defaultAdjustments() {
  return { brightness: 100, contrast: 100, saturation: 100 };
}

export function defaultCompression(preset: Preset, kind: 'photo' | 'signature', margin = 2) {
  const req = kind === 'photo' ? preset.photo : preset.signature;
  const target = Math.max(1, req.maxKB - margin);
  return {
    targetKB: target,
    format: req.formats[0],
    mode: 'auto' as const,
    quality: 0.85,
    allowDownscale: false,
  };
}

/** Choose a default target that sits under the maximum but above the minimum. */
export function safeTargetKB(req: ImageRequirement, margin = 2): number {
  const target = req.maxKB - margin;
  if (target < req.minKB) return req.maxKB;
  return target;
}
