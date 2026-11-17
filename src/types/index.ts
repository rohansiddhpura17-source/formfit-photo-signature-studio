export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export type Verification = 'verified' | 'unverified' | 'custom';

export type PresetCategory =
  | 'Banking'
  | 'Engineering'
  | 'Civil Services'
  | 'Medical'
  | 'University'
  | 'Custom';

export interface DimensionSpec {
  /** Exact output width in pixels, when the authority fixes it. */
  width?: number;
  /** Exact output height in pixels, when the authority fixes it. */
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Allowed width / height ratio range. */
  aspectMin?: number;
  aspectMax?: number;
}

export interface ImageRequirement {
  /** What the authority calls this image. */
  label: string;
  dimensions: DimensionSpec;
  minKB: number;
  maxKB: number;
  formats: OutputFormat[];
  /** Whether the dimensions are fixed by the authority or a working default. */
  dimensionsFixed: boolean;
  notes: string[];
}

export interface Preset {
  id: string;
  organization: string;
  name: string;
  shortName: string;
  category: PresetCategory;
  verification: Verification;
  verifiedOn?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceNote?: string;
  photo: ImageRequirement;
  signature: ImageRequirement;
  /** Default crop aspect used by the editor when dimensions are not fixed. */
  photoCropAspect: number;
  signatureCropAspect: number;
  createdAt?: string;
}

export interface LoadedImage {
  name: string;
  type: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
  image: HTMLImageElement;
  isSample?: boolean;
}

export interface CropSettings {
  zoom: number;
  /** Pan offsets as a fraction of the crop frame. */
  offsetX: number;
  offsetY: number;
  /** Rotation in degrees. */
  rotation: number;
  aspect: number;
  showFaceGuide: boolean;
}

export interface Adjustments {
  brightness: number; // 100 = unchanged
  contrast: number; // 100 = unchanged
  saturation: number; // 100 = unchanged
}

export interface OutputSettings {
  format: OutputFormat;
  width: number;
  height: number;
}

export type CompressionMode = 'auto' | 'balanced' | 'maximum' | 'manual';

export interface CompressionSettings {
  targetKB: number;
  format: OutputFormat;
  mode: CompressionMode;
  quality: number; // 0.3 - 1 for manual
  allowDownscale: boolean;
}

export interface CompressionResult {
  blob: Blob;
  bytes: number;
  quality: number;
  width: number;
  height: number;
  attempts: number;
  targetMet: boolean;
  targetBytes: number;
  minBytes: number;
  format: OutputFormat;
  downscaled: boolean;
  durationMs: number;
  note?: string;
}

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'na';

/**
 * 'warn' is a non-blocking warning: the file is real and downloadable,
 * but a portal may reject it (used only for the minimum file size).
 * 'ready' is true when no check has status 'fail'.
 */

export interface ValidationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ValidationReport {
  checks: ValidationCheck[];
  ready: boolean;
  checkedAt: string;
}

export type HistoryKind = 'photo' | 'signature';

export interface HistoryRecord {
  id: string;
  kind: HistoryKind;
  fileName: string;
  presetId: string;
  presetName: string;
  organization: string;
  date: string;
  originalBytes: number;
  finalBytes: number;
  width: number;
  height: number;
  format: OutputFormat;
  validation: 'ready' | 'not-ready';
  /** True when this file was sent as part of a multi-file download, where
   * the browser may hold the second file behind a permission prompt. The
   * record means "download started", not "file confirmed on disk".
   * Absent (older records) means a single download. */
  batch?: boolean;
  settings: {
    format: OutputFormat;
    width: number;
    height: number;
    targetKB: number;
    mode: CompressionMode;
  };
}

export interface Settings {
  appearance: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  defaultFormat: OutputFormat;
  defaultCompressionMode: CompressionMode;
  safetyMarginKB: number;
  defaultPhotoPresetId: string;
  confirmBeforeDelete: boolean;
  reduceMotion: boolean;
}

export interface Toast {
  id: string;
  tone: 'neutral' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
}

export interface PhotoJob {
  source: LoadedImage | null;
  presetId: string;
  crop: CropSettings;
  adjustments: Adjustments;
  output: OutputSettings;
  compression: CompressionSettings;
  result: CompressionResult | null;
  finalBlob: Blob | null;
  validation: ValidationReport | null;
}

export interface SignatureJob {
  source: LoadedImage | null;
  presetId: string;
  crop: CropSettings;
  adjustments: Adjustments;
  /** Remove near-white paper to transparency. */
  transparent: boolean;
  inkThreshold: number; // 0-100
  output: OutputSettings;
  compression: CompressionSettings;
  result: CompressionResult | null;
  finalBlob: Blob | null;
  validation: ValidationReport | null;
}
