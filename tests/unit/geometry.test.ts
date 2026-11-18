import { describe, expect, it } from 'vitest';
import type { ImageRequirement, Preset } from '../../src/types';
import {
  applyFineRotation,
  aspectLabel,
  clampOutputDimensions,
  combineRotation,
  defaultCompression,
  describeDimensions,
  fitContain,
  gcd,
  hasExactDimensions,
  hasRangeDimensions,
  recommendedDimensions,
  rotateByNinety,
  safeTargetKB,
  scaleToWidth,
  splitRotation,
} from '../../src/utils/geometry';

const fixedRequirement: ImageRequirement = {
  label: 'Photograph',
  dimensions: { width: 200, height: 230, aspectMin: 0.87, aspectMax: 0.87 },
  minKB: 20,
  maxKB: 50,
  formats: ['image/jpeg'],
  dimensionsFixed: true,
  notes: [],
};

const rangeRequirement: ImageRequirement = {
  label: 'Photograph',
  dimensions: { minWidth: 200, maxWidth: 530, minHeight: 260, maxHeight: 690 },
  minKB: 5,
  maxKB: 1024,
  formats: ['image/jpeg'],
  dimensionsFixed: false,
  notes: [],
};

const freeRequirement: ImageRequirement = {
  label: 'Photograph',
  dimensions: {},
  minKB: 10,
  maxKB: 200,
  formats: ['image/jpeg'],
  dimensionsFixed: false,
  notes: [],
};

describe('geometry primitives', () => {
  it('computes the greatest common divisor', () => {
    expect(gcd(200, 230)).toBe(10);
    expect(gcd(140, 60)).toBe(20);
    expect(gcd(7, 0)).toBe(7);
  });

  it('labels common aspect ratios', () => {
    expect(aspectLabel(1)).toBe('1:1');
    expect(aspectLabel(200 / 230)).toBe('20:23');
    expect(aspectLabel(140 / 60)).toBe('7:3');
    expect(aspectLabel(0.9123)).toBe('0.91');
  });

  it('fits an image inside a box without cropping', () => {
    expect(fitContain(400, 600, 200, 200)).toEqual({ width: 133, height: 200 });
    expect(fitContain(0, 600, 200, 200)).toEqual({ width: 0, height: 0 });
  });

  it('scales to a width while preserving ratio', () => {
    expect(scaleToWidth(1000, 1500, 400)).toEqual({ width: 400, height: 600 });
    expect(scaleToWidth(1000, 1, 400)).toEqual({ width: 400, height: 1 });
  });
});

describe('dimension specs', () => {
  it('detects exact and ranged specs', () => {
    expect(hasExactDimensions(fixedRequirement.dimensions)).toBe(true);
    expect(hasRangeDimensions(fixedRequirement.dimensions)).toBe(false);
    expect(hasExactDimensions(rangeRequirement.dimensions)).toBe(false);
    expect(hasRangeDimensions(rangeRequirement.dimensions)).toBe(true);
    expect(hasExactDimensions(freeRequirement.dimensions)).toBe(false);
    expect(hasRangeDimensions(freeRequirement.dimensions)).toBe(false);
  });

  it('describes fixed, ranged and free dimensions honestly', () => {
    expect(describeDimensions(fixedRequirement.dimensions, true)).toBe('200 × 230 px');
    expect(describeDimensions(rangeRequirement.dimensions, false)).toBe('200–530 × 260–690 px');
    expect(describeDimensions({ maxWidth: 600, maxHeight: 200 }, false)).toBe('≤ 600 × ≤ 200 px');
    expect(describeDimensions({ minWidth: 350, maxWidth: 500 }, false)).toBe('350–500 px × free height');
    expect(describeDimensions({}, false)).toBe('No fixed pixel size');
  });
});

describe('dimension clamping and aspect preservation', () => {
  it('enforces GATE 2025 4:5 aspect ratio when clamping low widths', () => {
    expect(clampOutputDimensions(200, 'width', 0.8, rangeRequirement.dimensions)).toEqual({
      width: 208,
      height: 260,
    });
    expect(clampOutputDimensions(3, 'width', 0.8, rangeRequirement.dimensions)).toEqual({
      width: 208,
      height: 260,
    });
    expect(clampOutputDimensions(350, 'width', 0.8, rangeRequirement.dimensions)).toEqual({
      width: 350,
      height: 438,
    });
  });

  it('clamps UPSC CSE free dimensions within 32–6000 px while keeping ratio', () => {
    expect(clampOutputDimensions(5, 'height', 0.8, freeRequirement.dimensions)).toEqual({
      width: 32,
      height: 40,
    });
    expect(clampOutputDimensions(9000, 'height', 0.8, freeRequirement.dimensions)).toEqual({
      width: 4800,
      height: 6000,
    });
  });
});

describe('rotation mathematics', () => {
  it('combines 90-degree turns with fine rotation angles', () => {
    let angle = rotateByNinety(0, 90);
    expect(angle).toBe(90);
    angle = applyFineRotation(angle, 2);
    expect(angle).toBe(92);
    expect(splitRotation(angle)).toEqual({ base: 90, fine: 2 });

    angle = rotateByNinety(angle, 90);
    expect(angle).toBe(182);
    angle = rotateByNinety(angle, -90);
    expect(angle).toBe(92);
  });

  it('supports negative fine angles and counterclockwise turns', () => {
    const neg = applyFineRotation(0, -5);
    expect(neg).toBe(-5);
    expect(rotateByNinety(neg, 90)).toBe(85);
    expect(rotateByNinety(0, -90)).toBe(270);
    expect(combineRotation(270, -4)).toBe(266);
  });
});

describe('recommended output size', () => {
  it('uses the exact authority dimensions when fixed', () => {
    expect(recommendedDimensions(fixedRequirement, 0.87)).toEqual({ width: 200, height: 230 });
  });

  it('picks a size inside a published range', () => {
    const photo = recommendedDimensions(rangeRequirement, 200 / 260);
    expect(photo.width).toBeGreaterThanOrEqual(200);
    expect(photo.width).toBeLessThanOrEqual(530);
    expect(photo.height).toBeGreaterThanOrEqual(260);
    expect(photo.height).toBeLessThanOrEqual(690);

    const signature = recommendedDimensions(
      {
        ...rangeRequirement,
        dimensions: { minWidth: 250, maxWidth: 580, minHeight: 80, maxHeight: 180 },
      },
      250 / 80,
    );
    expect(signature.width).toBeGreaterThanOrEqual(250);
    expect(signature.width).toBeLessThanOrEqual(580);
    expect(signature.height).toBeGreaterThanOrEqual(80);
    expect(signature.height).toBeLessThanOrEqual(180);
  });

  it('falls back to a working size when no dimensions are published', () => {
    expect(recommendedDimensions(freeRequirement, 0.75)).toEqual({ width: 600, height: 800 });
  });
});

describe('compression defaults', () => {
  const preset = {
    photo: fixedRequirement,
    signature: { ...fixedRequirement, maxKB: 20, minKB: 10 },
  } as Preset;

  it('keeps a safety margin below the maximum', () => {
    expect(safeTargetKB(fixedRequirement, 2)).toBe(48);
    expect(safeTargetKB({ ...fixedRequirement, minKB: 49, maxKB: 50 }, 2)).toBe(50);
  });

  it('builds a target from the preset maximum and first format', () => {
    const settings = defaultCompression(preset, 'photo', 2);
    expect(settings.targetKB).toBe(48);
    expect(settings.format).toBe('image/jpeg');
    expect(settings.mode).toBe('auto');
    expect(settings.allowDownscale).toBe(false);
  });
});
