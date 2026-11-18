import { describe, expect, it } from 'vitest';
import {
  BUILTIN_PRESETS,
  PRESET_CATEGORIES,
  findPreset,
  presetOutputSummary,
  presetRangeLabel,
  searchPresets,
  validateCustomPreset,
  type CustomPresetInput,
} from '../../src/services/presetService';

const validInput: CustomPresetInput = {
  name: 'State PSC Clerk 2026',
  organization: 'State Public Service Commission',
  category: 'Custom',
  photoWidth: 200,
  photoHeight: 230,
  photoMinKB: 20,
  photoMaxKB: 50,
  signatureWidth: 140,
  signatureHeight: 60,
  signatureMinKB: 10,
  signatureMaxKB: 20,
  formats: ['image/jpeg'],
  sourceUrl: 'https://example.gov/notice.pdf',
  sourceLabel: 'Official notice',
};

describe('built-in presets', () => {
  it('ships four verified presets with official sources', () => {
    expect(BUILTIN_PRESETS).toHaveLength(4);
    for (const preset of BUILTIN_PRESETS) {
      expect(preset.verification).toBe('verified');
      expect(preset.sourceUrl).toMatch(/^https:\/\//);
      expect(preset.sourceLabel).toBeTruthy();
      expect(preset.verifiedOn).toBeTruthy();
      expect(preset.photo.maxKB).toBeGreaterThan(preset.photo.minKB);
      expect(preset.signature.maxKB).toBeGreaterThan(preset.signature.minKB);
    }
  });

  it('keeps IBPS dimensions and KB ranges exact', () => {
    const ibps = findPreset(BUILTIN_PRESETS, 'ibps-po-mt-2025');
    expect(ibps).not.toBeNull();
    expect(ibps!.photo.dimensions.width).toBe(200);
    expect(ibps!.photo.dimensions.height).toBe(230);
    expect(ibps!.photo.minKB).toBe(20);
    expect(ibps!.photo.maxKB).toBe(50);
    expect(ibps!.signature.dimensions.width).toBe(140);
    expect(ibps!.signature.dimensions.height).toBe(60);
    expect(ibps!.signature.minKB).toBe(10);
    expect(ibps!.signature.maxKB).toBe(20);
  });

  it('does not invent fixed dimensions where the authority published none', () => {
    const upsc = findPreset(BUILTIN_PRESETS, 'upsc-cse');
    expect(upsc!.photo.dimensions.width).toBeUndefined();
    expect(upsc!.photo.dimensions.height).toBeUndefined();
    expect(upsc!.photo.dimensionsFixed).toBe(false);
    expect(presetOutputSummary(upsc!, 'signature')).toBe('350–500 px × free height');
  });

  it('defaults GATE 2025 photo crop to 4:5 aspect ratio', () => {
    const gate = findPreset(BUILTIN_PRESETS, 'gate-2025');
    expect(gate!.photoCropAspect).toBeCloseTo(0.8, 3);
  });

  it('exposes every category filter', () => {
    expect(PRESET_CATEGORIES).toContain('All');
    expect(PRESET_CATEGORIES).toContain('Banking');
    expect(PRESET_CATEGORIES).toContain('Custom');
  });
});

describe('findPreset', () => {
  it('returns null for missing or empty ids', () => {
    expect(findPreset(BUILTIN_PRESETS, null)).toBeNull();
    expect(findPreset(BUILTIN_PRESETS, '')).toBeNull();
    expect(findPreset(BUILTIN_PRESETS, 'does-not-exist')).toBeNull();
  });
});

describe('searchPresets', () => {
  it('matches organisation, name and short name case-insensitively', () => {
    expect(searchPresets(BUILTIN_PRESETS, 'ibps', 'All').map((p) => p.id)).toEqual(['ibps-po-mt-2025']);
    expect(searchPresets(BUILTIN_PRESETS, 'graduate aptitude', 'All').map((p) => p.id)).toEqual([
      'gate-2025',
    ]);
    expect(searchPresets(BUILTIN_PRESETS, 'NEET', 'All').map((p) => p.id)).toEqual(['neet-ug-2025']);
  });

  it('filters by category', () => {
    expect(searchPresets(BUILTIN_PRESETS, '', 'Medical').map((p) => p.id)).toEqual(['neet-ug-2025']);
    expect(searchPresets(BUILTIN_PRESETS, 'ibps', 'Medical')).toEqual([]);
  });

  it('returns everything for an empty query and All category', () => {
    expect(searchPresets(BUILTIN_PRESETS, '   ', 'All')).toHaveLength(BUILTIN_PRESETS.length);
  });
});

describe('custom preset validation', () => {
  it('accepts a complete, internally consistent preset', () => {
    expect(validateCustomPreset(validInput)).toEqual({});
  });

  it('requires a name and organisation', () => {
    const errors = validateCustomPreset({ ...validInput, name: '  ', organization: '' });
    expect(errors.name).toBeTruthy();
    expect(errors.organization).toBeTruthy();
  });

  it('rejects out-of-range dimensions', () => {
    const errors = validateCustomPreset({
      ...validInput,
      photoWidth: 0,
      photoHeight: 7000,
      signatureWidth: 10,
      signatureHeight: 10,
    });
    expect(errors.photoWidth).toBeTruthy();
    expect(errors.photoHeight).toBeTruthy();
    expect(errors.signatureWidth).toBeTruthy();
    expect(errors.signatureHeight).toBeTruthy();
  });

  it('rejects a minimum at or above the maximum', () => {
    const errors = validateCustomPreset({
      ...validInput,
      photoMinKB: 50,
      photoMaxKB: 50,
      signatureMinKB: 30,
      signatureMaxKB: 20,
    });
    expect(errors.photoMinKB).toMatch(/below the maximum/);
    expect(errors.signatureMinKB).toMatch(/below the maximum/);
  });

  it('requires at least one format and a full http(s) source URL', () => {
    const errors = validateCustomPreset({ ...validInput, formats: [], sourceUrl: 'notice.pdf' });
    expect(errors.formats).toBeTruthy();
    expect(errors.sourceUrl).toMatch(/http/);
  });

  it('allows an empty source URL', () => {
    expect(validateCustomPreset({ ...validInput, sourceUrl: '' })).toEqual({});
  });
});

describe('preset summaries', () => {
  it('summarises KB ranges for each document', () => {
    const ibps = findPreset(BUILTIN_PRESETS, 'ibps-po-mt-2025')!;
    expect(presetRangeLabel(ibps, 'photo')).toBe('20–50 KB');
    expect(presetRangeLabel(ibps, 'signature')).toBe('10–20 KB');
  });

  it('summarises fixed and free dimensions without guessing', () => {
    const ibps = findPreset(BUILTIN_PRESETS, 'ibps-po-mt-2025')!;
    const neet = findPreset(BUILTIN_PRESETS, 'neet-ug-2025')!;
    expect(presetOutputSummary(ibps, 'photo')).toBe('200 × 230 px');
    expect(presetOutputSummary(neet, 'photo')).toBe('No fixed pixel size');
  });
});
