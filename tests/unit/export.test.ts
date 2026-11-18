import { describe, expect, it } from 'vitest';
import { buildFileName, sanitizeSegment } from '../../src/engines/exportEngine';
import type { Preset } from '../../src/types';

const preset = {
  id: 'ibps-po-mt-2025',
  organization: 'Institute of Banking Personnel Selection (IBPS)',
  name: 'IBPS CRP PO/MT',
  shortName: 'IBPS PO',
  category: 'Banking',
  verification: 'verified',
  photo: {} as Preset['photo'],
  signature: {} as Preset['signature'],
  photoCropAspect: 0.87,
  signatureCropAspect: 2.33,
} as Preset;

describe('sanitizeSegment', () => {
  it('removes punctuation and collapses whitespace into hyphens', () => {
    expect(sanitizeSegment('IBPS PO / MT — 2025')).toBe('IBPS-PO-MT-2025');
    expect(sanitizeSegment('  State   PSC  ')).toBe('State-PSC');
  });

  it('strips diacritics and falls back when nothing remains', () => {
    expect(sanitizeSegment('Café Régional')).toBe('Cafe-Regional');
    expect(sanitizeSegment('!!!', 'Fallback')).toBe('Fallback');
  });

  it('caps the segment length', () => {
    expect(sanitizeSegment('a'.repeat(120))).toHaveLength(48);
  });
});

describe('buildFileName', () => {
  it('builds a deterministic, descriptive filename', () => {
    expect(buildFileName('photo', preset, 200, 230, 'image/jpeg')).toBe(
      'FORMFIT_Photo_IBPS-PO_200x230.jpg',
    );
    expect(buildFileName('signature', preset, 140, 60, 'image/png')).toBe(
      'FORMFIT_Signature_IBPS-PO_140x60.png',
    );
  });

  it('uses official photo and signature filenames for UPSC CSE', () => {
    const upsc = { ...preset, id: 'upsc-cse', shortName: 'UPSC CSE' } as Preset;
    expect(buildFileName('photo', upsc, 600, 750, 'image/jpeg')).toBe('photo.jpg');
    expect(buildFileName('signature', upsc, 400, 500, 'image/jpeg')).toBe('signature.jpg');
  });

  it('uses a custom name when there is no preset', () => {
    expect(buildFileName('photo', null, 600, 800, 'image/webp', 'State PSC')).toBe(
      'FORMFIT_Photo_State-PSC_600x800.webp',
    );
    expect(buildFileName('signature', null, 600, 200, 'image/jpeg')).toBe(
      'FORMFIT_Signature_Custom_600x200.jpg',
    );
  });
});
