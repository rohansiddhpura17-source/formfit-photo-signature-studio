import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blobDecodes } from '../../src/engines/imageLoader';
import { actualSizeLabel, reportSummary, validateImageBlob } from '../../src/engines/validationEngine';
import { BUILTIN_PRESETS } from '../../src/services/presetService';
import type { ImageRequirement } from '../../src/types';

vi.mock('../../src/engines/imageLoader', () => ({
  blobDecodes: vi.fn(),
}));

const decode = vi.mocked(blobDecodes);

const ibps = BUILTIN_PRESETS.find((preset) => preset.id === 'ibps-po-mt-2025')!;
const neet = BUILTIN_PRESETS.find((preset) => preset.id === 'neet-ug-2025')!;

function jpegOfSize(kb: number, type = 'image/jpeg'): Blob {
  return new Blob([new Uint8Array(Math.round(kb * 1024))], { type });
}

beforeEach(() => {
  decode.mockReset();
  decode.mockResolvedValue({ ok: true, width: 200, height: 230 });
});

describe('validateImageBlob — IBPS photo', () => {
  it('passes a file that matches every published rule', async () => {
    const report = await validateImageBlob({
      blob: jpegOfSize(40),
      width: 200,
      height: 230,
      format: 'image/jpeg',
      requirement: ibps.photo,
    });
    expect(report.ready).toBe(true);
    expect(report.checks.every((check) => check.status !== 'fail')).toBe(true);
    expect(report.checks.find((check) => check.id === 'dimensions')!.status).toBe('pass');
    expect(report.checks.find((check) => check.id === 'max-size')!.status).toBe('pass');
    expect(report.checks.find((check) => check.id === 'min-size')!.status).toBe('pass');
  });

  it('fails the maximum check at or above the limit', async () => {
    const report = await validateImageBlob({
      blob: jpegOfSize(50),
      width: 200,
      height: 230,
      format: 'image/jpeg',
      requirement: ibps.photo,
    });
    expect(report.ready).toBe(false);
    expect(report.checks.find((check) => check.id === 'max-size')!.status).toBe('fail');
  });

  it('warns on the minimum check below the limit but stays ready', async () => {
    const report = await validateImageBlob({
      blob: jpegOfSize(5),
      width: 200,
      height: 230,
      format: 'image/jpeg',
      requirement: ibps.photo,
    });
    // Minimum size is a warning, not a blocking failure: the file is real
    // and downloadable, but some portals reject files that are too small.
    expect(report.ready).toBe(true);
    expect(report.checks.find((check) => check.id === 'min-size')!.status).toBe('warn');
  });

  it('rejects a format the preset does not accept', async () => {
    const report = await validateImageBlob({
      blob: jpegOfSize(40, 'image/png'),
      width: 200,
      height: 230,
      format: 'image/png',
      requirement: ibps.photo,
    });
    expect(report.ready).toBe(false);
    expect(report.checks.find((check) => check.id === 'format-allowed')!.status).toBe('fail');
  });

  it('fails when decoded pixels do not match fixed dimensions', async () => {
    decode.mockResolvedValueOnce({ ok: true, width: 300, height: 400 });
    const report = await validateImageBlob({
      blob: jpegOfSize(40),
      width: 200,
      height: 230,
      format: 'image/jpeg',
      requirement: ibps.photo,
    });
    expect(report.ready).toBe(false);
    expect(report.checks.find((check) => check.id === 'dimensions')!.status).toBe('fail');
  });

  it('fails integrity when the blob cannot be decoded', async () => {
    decode.mockResolvedValueOnce({ ok: false, width: 0, height: 0 });
    const report = await validateImageBlob({
      blob: jpegOfSize(40),
      width: 200,
      height: 230,
      format: 'image/jpeg',
      requirement: ibps.photo,
    });
    expect(report.ready).toBe(false);
    expect(report.checks.find((check) => check.id === 'integrity')!.status).toBe('fail');
  });
});

describe('validateImageBlob — no published pixel size', () => {
  it('marks dimensions N/A instead of inventing a failure', async () => {
    decode.mockResolvedValueOnce({ ok: true, width: 640, height: 800 });
    const report = await validateImageBlob({
      blob: jpegOfSize(100),
      width: 640,
      height: 800,
      format: 'image/jpeg',
      requirement: neet.photo,
    });
    const dimensions = report.checks.find((check) => check.id === 'dimensions')!;
    expect(dimensions.status).toBe('na');
    expect(dimensions.detail).toMatch(/does not specify/i);
    expect(report.ready).toBe(true);
  });
});

describe('validation helpers', () => {
  it('summarises missing, passing and failing reports', () => {
    expect(reportSummary(null)).toBe('Not validated');
    expect(
      reportSummary({
        checks: [{ id: 'a', label: 'A', status: 'pass', detail: '' }],
        ready: true,
        checkedAt: '',
      }),
    ).toBe('Ready to download');
    expect(
      reportSummary({
        checks: [
          { id: 'a', label: 'A', status: 'fail', detail: '' },
          { id: 'b', label: 'B', status: 'fail', detail: '' },
        ],
        ready: false,
        checkedAt: '',
      }),
    ).toBe('2 checks failed');
  });

  it('formats actual byte sizes as KB', () => {
    expect(actualSizeLabel(40960)).toBe('40 KB');
  });
});

describe('requirement guard rails', () => {
  it('uses the requirement it was given, not a global', () => {
    const custom: ImageRequirement = {
      ...ibps.photo,
      maxKB: 10,
      minKB: 1,
    };
    return validateImageBlob({
      blob: jpegOfSize(20),
      width: 200,
      height: 230,
      format: 'image/jpeg',
      requirement: custom,
    }).then((report) => {
      expect(report.checks.find((check) => check.id === 'max-size')!.status).toBe('fail');
    });
  });
});
