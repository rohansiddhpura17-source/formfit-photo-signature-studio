import { describe, expect, it } from 'vitest';
import { padJpegToMinimum, validateCompressionSettings } from '../../src/engines/compressionEngine';
import { sniffImageType } from '../../src/engines/imageLoader';
import type { CompressionSettings } from '../../src/types';

const base: CompressionSettings = {
  targetKB: 48,
  format: 'image/jpeg',
  mode: 'auto',
  quality: 0.85,
  allowDownscale: false,
};

describe('validateCompressionSettings', () => {
  it('accepts a normal target', () => {
    expect(validateCompressionSettings(base)).toBeNull();
  });

  it('rejects non-finite and tiny targets', () => {
    expect(validateCompressionSettings({ ...base, targetKB: Number.NaN })).toMatch(/target size/);
    expect(validateCompressionSettings({ ...base, targetKB: 1 })).toMatch(/at least 2 KB/);
    expect(validateCompressionSettings({ ...base, targetKB: 0 })).toMatch(/at least 2 KB/);
  });

  it('rejects targets above the supported ceiling', () => {
    expect(validateCompressionSettings({ ...base, targetKB: 10241 })).toMatch(/10,240/);
  });

  it('checks manual quality bounds only in manual mode', () => {
    expect(validateCompressionSettings({ ...base, mode: 'manual', quality: 0.04 })).toMatch(/5%/);
    expect(validateCompressionSettings({ ...base, mode: 'manual', quality: 1.1 })).toMatch(/5%/);
    expect(validateCompressionSettings({ ...base, mode: 'manual', quality: 0.6 })).toBeNull();
    expect(validateCompressionSettings({ ...base, mode: 'auto', quality: 0.01 })).toBeNull();
  });
});

describe('padJpegToMinimum', () => {
  it('pads small valid JPEG blobs into [minBytes, maxBytes) using a JPEG COM segment', async () => {
    const smallJpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9])], {
      type: 'image/jpeg',
    });
    const padded = await padJpegToMinimum(smallJpeg, 10240, 20479);
    expect(padded.type).toBe('image/jpeg');
    expect(padded.size).toBeGreaterThanOrEqual(10240);
    expect(padded.size).toBeLessThan(20479);
    const bytes = new Uint8Array(await padded.arrayBuffer());
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
    expect(bytes[2]).toBe(0xff);
    expect(bytes[3]).toBe(0xfe);
  });

  it('leaves non-JPEG blobs untouched', async () => {
    const pngBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], {
      type: 'image/png',
    });
    const out = await padJpegToMinimum(pngBlob, 10240, 20479);
    expect(out.size).toBe(pngBlob.size);
  });
});

describe('sniffImageType magic-byte verification', () => {
  it('identifies JPEG, PNG, and WebP containers and rejects spoofed text files', async () => {
    const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'photo.jpg');
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'photo.png');
    const webp = new File(
      [new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])],
      'photo.webp',
    );
    const spoof = new File([new TextEncoder().encode('not a jpeg')], 'fake.jpg');
    expect(await sniffImageType(jpg)).toBe('image/jpeg');
    expect(await sniffImageType(png)).toBe('image/png');
    expect(await sniffImageType(webp)).toBe('image/webp');
    expect(await sniffImageType(spoof)).toBeNull();
  });
});
