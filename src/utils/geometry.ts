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
    const formatBound = (min?: number, max?: number) =>
      min !== undefined && max !== undefined
        ? `${min}–${max}`
        : max !== undefined
          ? `≤ ${max}`
          : `${min}+`;
    const hasWidth = spec.minWidth !== undefined || spec.maxWidth !== undefined;
    const hasHeight = spec.minHeight !== undefined || spec.maxHeight !== undefined;
    if (hasWidth && hasHeight) {
      return `${formatBound(spec.minWidth, spec.maxWidth)} × ${formatBound(spec.minHeight, spec.maxHeight)} px`;
    }
    if (hasWidth) {
      return `${formatBound(spec.minWidth, spec.maxWidth)} px × free height`;
    }
    if (hasHeight) {
      return `free width × ${formatBound(spec.minHeight, spec.maxHeight)} px`;
    }
  }
  return fixed ? 'Fixed by authority' : 'No fixed pixel size';
}

/**
 * Clamp width or height to the valid range while strictly preserving the
 * selected crop aspect ratio and ensuring the paired axis also fits.
 */
export function clampOutputDimensions(
  value: number,
  axis: 'width' | 'height',
  aspect: number,
  spec: DimensionSpec,
): Dimensions {
  if (hasExactDimensions(spec)) {
    return { width: spec.width!, height: spec.height! };
  }
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const minW = spec.minWidth ?? 32;
  const maxW = spec.maxWidth ?? 6000;
  const minH = spec.minHeight ?? 32;
  const maxH = spec.maxHeight ?? 6000;

  let effMinW = Math.max(minW, Math.ceil(minH * safeAspect));
  let effMaxW = Math.min(maxW, Math.floor(maxH * safeAspect));
  while (effMinW < maxW && Math.round(effMinW / safeAspect) < minH) effMinW += 1;
  while (effMaxW > minW && Math.round(effMaxW / safeAspect) > maxH) effMaxW -= 1;
  if (effMinW > effMaxW) {
    effMinW = effMaxW = clamp(Math.round(minH * safeAspect), minW, maxW);
  }

  let effMinH = Math.max(minH, Math.ceil(minW / safeAspect));
  let effMaxH = Math.min(maxH, Math.floor(maxW / safeAspect));
  while (effMinH < maxH && Math.round(effMinH * safeAspect) < minW) effMinH += 1;
  while (effMaxH > minH && Math.round(effMaxH * safeAspect) > maxW) effMaxH -= 1;
  if (effMinH > effMaxH) {
    effMinH = effMaxH = clamp(Math.round(minW / safeAspect), minH, maxH);
  }

  const raw = Number.isFinite(value) ? Math.round(value) : 0;
  if (axis === 'width') {
    const width = clamp(raw, effMinW, effMaxW);
    const height = clamp(Math.round(width / safeAspect), effMinH, effMaxH);
    return { width, height };
  }
  const height = clamp(raw, effMinH, effMaxH);
  const width = clamp(Math.round(height * safeAspect), effMinW, effMaxW);
  return { width, height };
}

/**
 * Split a total angle (degrees) into a 90° base quadrant (0, 90, 180, 270)
 * and a fine tilt in [-10, 10] degrees.
 */
export function splitRotation(rotation: number): { base: number; fine: number } {
  const normalized = ((rotation % 360) + 360) % 360;
  let base = Math.round(normalized / 90) * 90;
  let fine = normalized - base;
  if (base === 360) base = 0;
  fine = clamp(Math.round(fine), -10, 10);
  return { base, fine };
}

/** Combine a 90° base angle and a fine tilt (-10..10), keeping negative angles near 0°. */
export function combineRotation(base: number, fine: number): number {
  const cleanFine = clamp(Math.round(fine), -10, 10);
  const cleanBase = (((Math.round(base / 90) * 90) % 360) + 360) % 360;
  if (cleanBase === 0) return cleanFine;
  return cleanBase + cleanFine;
}

/** Update only the fine rotation (-10..10) while preserving any 90° base turns. */
export function applyFineRotation(currentRotation: number, fine: number): number {
  const { base } = splitRotation(currentRotation);
  return combineRotation(base, fine);
}

/** Rotate by a 90° increment while preserving the current fine tilt. */
export function rotateByNinety(currentRotation: number, delta: number): number {
  const { base, fine } = splitRotation(currentRotation);
  return combineRotation(base + delta, fine);
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
    return clampOutputDimensions(targetHeight, 'height', aspect, spec);
  }

  return clampOutputDimensions(600, 'width', aspect, spec);
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
