import { describe, expect, it } from 'vitest';
import { validateCompressionSettings } from '../../src/engines/compressionEngine';
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
