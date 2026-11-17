import { describe, expect, it } from 'vitest';
import {
  BYTES_PER_KB,
  bytesToKB,
  clamp,
  formatBytes,
  formatExtension,
  formatKB,
  formatLabel,
  kbToBytes,
  percentChange,
} from '../../src/utils/format';

describe('byte and KB conversion', () => {
  it('uses 1024 bytes per KB', () => {
    expect(BYTES_PER_KB).toBe(1024);
    expect(kbToBytes(50)).toBe(51200);
    expect(kbToBytes(1.5)).toBe(1536);
  });

  it('rounds fractional KB to one decimal below 100 KB', () => {
    expect(bytesToKB(40960)).toBe(40);
    expect(bytesToKB(51200)).toBe(50);
    expect(bytesToKB(1024 * 12.34)).toBe(12.3);
  });

  it('rounds KB to whole numbers at or above 100 KB', () => {
    expect(bytesToKB(1024 * 123.6)).toBe(124);
  });
});

describe('formatBytes', () => {
  it('formats bytes, kilobytes and megabytes with real units', () => {
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(40960)).toBe('40.0 KB');
    expect(formatBytes(1024 * 2048)).toBe('2.00 MB');
  });

  it('returns an em dash for invalid values', () => {
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
  });
});

describe('formatKB', () => {
  it('keeps integers clean and gives one decimal otherwise', () => {
    expect(formatKB(50)).toBe('50 KB');
    expect(formatKB(19.5)).toBe('19.5 KB');
  });
});

describe('labels and helpers', () => {
  it('maps MIME types to labels and extensions', () => {
    expect(formatLabel('image/jpeg')).toBe('JPEG');
    expect(formatLabel('image/png')).toBe('PNG');
    expect(formatLabel('image/webp')).toBe('WebP');
    expect(formatLabel('image/avif')).toBe('AVIF');
    expect(formatExtension('image/jpeg')).toBe('jpg');
    expect(formatExtension('image/png')).toBe('png');
    expect(formatExtension('image/webp')).toBe('webp');
    expect(formatExtension('image/avif')).toBe('img');
  });

  it('clamps and computes reduction percentages', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
    expect(percentChange(100, 40)).toBe(60);
    expect(percentChange(0, 40)).toBe(0);
  });
});
