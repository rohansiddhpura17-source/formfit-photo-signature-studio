import type { OutputFormat, Preset } from '../types';
import { formatExtension } from '../utils/format';

export function sanitizeSegment(value: string, fallback = 'File'): string {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
  return cleaned || fallback;
}

export function buildFileName(
  kind: 'photo' | 'signature',
  preset: Preset | null,
  width: number,
  height: number,
  format: OutputFormat,
  customName?: string,
): string {
  const ext = formatExtension(format);
  if (preset?.id === 'upsc-cse') {
    return `${kind === 'photo' ? 'photo' : 'signature'}.${ext}`;
  }
  const presetPart = sanitizeSegment(
    preset ? preset.shortName : customName || 'Custom',
    'Custom',
  );
  const kindPart = kind === 'photo' ? 'Photo' : 'Signature';
  return `FORMFIT_${kindPart}_${presetPart}_${width}x${height}.${ext}`;
}

/** Trigger a real browser download from an encoded Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to start the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function previewUrl(blob: Blob | null): string | null {
  return blob ? URL.createObjectURL(blob) : null;
}
