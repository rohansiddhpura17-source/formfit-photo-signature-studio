/** All kilobyte values in FORMFIT use 1 KB = 1024 bytes, matching file managers. */
export const BYTES_PER_KB = 1024;

export function bytesToKB(bytes: number, decimals = 1): number {
  const kb = bytes / BYTES_PER_KB;
  if (kb >= 100) return Math.round(kb);
  return Number(kb.toFixed(decimals));
}

export function kbToBytes(kb: number): number {
  return Math.round(kb * BYTES_PER_KB);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < BYTES_PER_KB) return `${bytes} B`;
  if (bytes < BYTES_PER_KB * BYTES_PER_KB) {
    const kb = bytes / BYTES_PER_KB;
    return `${kb >= 100 ? Math.round(kb) : kb.toFixed(1)} KB`;
  }
  return `${(bytes / (BYTES_PER_KB * BYTES_PER_KB)).toFixed(2)} MB`;
}

export function formatKB(kb: number): string {
  return `${Number.isInteger(kb) ? kb : kb.toFixed(1)} KB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function percentChange(original: number, final: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - final) / original) * 100);
}

export function formatLabel(format: string): string {
  switch (format) {
    case 'image/jpeg':
      return 'JPEG';
    case 'image/png':
      return 'PNG';
    case 'image/webp':
      return 'WebP';
    default:
      return format.replace('image/', '').toUpperCase();
  }
}

export function formatExtension(format: string): string {
  if (format === 'image/jpeg') return 'jpg';
  if (format === 'image/png') return 'png';
  if (format === 'image/webp') return 'webp';
  return 'img';
}
