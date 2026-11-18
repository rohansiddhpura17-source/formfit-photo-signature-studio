import type {
  ImageRequirement,
  OutputFormat,
  ValidationCheck,
  ValidationReport,
} from '../types';
import { blobDecodes } from './imageLoader';
import { bytesToKB, formatLabel } from '../utils/format';
import { describeDimensions, hasExactDimensions, hasRangeDimensions } from '../utils/geometry';

export interface ValidateArgs {
  blob: Blob;
  width: number;
  height: number;
  format: OutputFormat;
  requirement: ImageRequirement;
}

const KB = 1024;

/**
 * Validate the real output, not the intent. Dimensions and integrity are read
 * from the encoded Blob by decoding it again.
 */
export async function validateImageBlob(args: ValidateArgs): Promise<ValidationReport> {
  const { blob, width, height, format, requirement } = args;
  const checks: ValidationCheck[] = [];
  const spec = requirement.dimensions;

  const decoded = await blobDecodes(blob);
  const integrityOk = decoded.ok && decoded.width > 0 && decoded.height > 0;
  checks.push({
    id: 'integrity',
    label: 'Image integrity',
    status: integrityOk ? 'pass' : 'fail',
    detail: integrityOk
      ? `Decoded successfully at ${decoded.width} × ${decoded.height} px.`
      : 'The exported file could not be decoded. Try exporting again.',
  });

  const actualWidth = integrityOk ? decoded.width : width;
  const actualHeight = integrityOk ? decoded.height : height;

  const formatOk = blob.type === format;
  checks.push({
    id: 'format',
    label: 'File format',
    status: formatOk ? 'pass' : 'fail',
    detail: formatOk
      ? `${formatLabel(blob.type)} container verified.`
      : `Browser produced ${blob.type || 'an unknown type'} instead of ${formatLabel(format)}.`,
  });

  const formatAllowed = requirement.formats.includes(blob.type as OutputFormat);
  checks.push({
    id: 'format-allowed',
    label: 'Accepted by preset',
    status: formatAllowed ? 'pass' : 'fail',
    detail: formatAllowed
      ? `${formatLabel(blob.type)} is accepted for this preset.`
      : `This preset accepts ${requirement.formats.map(formatLabel).join(', ')} only.`,
  });

  let dimensionsStatus: ValidationCheck['status'] = 'na';
  let dimensionsDetail = 'The authority does not specify pixel dimensions for this image.';
  if (hasExactDimensions(spec)) {
    const exact = actualWidth === spec.width && actualHeight === spec.height;
    dimensionsStatus = exact ? 'pass' : 'fail';
    dimensionsDetail = exact
      ? `${actualWidth} × ${actualHeight} px matches the required ${spec.width} × ${spec.height} px.`
      : `Output is ${actualWidth} × ${actualHeight} px; required ${spec.width} × ${spec.height} px.`;
  } else if (hasRangeDimensions(spec)) {
    const withinW =
      (spec.minWidth === undefined || actualWidth >= spec.minWidth) &&
      (spec.maxWidth === undefined || actualWidth <= spec.maxWidth);
    const withinH =
      (spec.minHeight === undefined || actualHeight >= spec.minHeight) &&
      (spec.maxHeight === undefined || actualHeight <= spec.maxHeight);
    const within = withinW && withinH;
    dimensionsStatus = within ? 'pass' : 'fail';
    dimensionsDetail = `${actualWidth} × ${actualHeight} px · allowed ${describeDimensions(spec, false)}.`;
  }
  checks.push({
    id: 'dimensions',
    label: 'Dimensions',
    status: dimensionsStatus,
    detail: dimensionsDetail,
  });

  const aspect = actualHeight > 0 ? actualWidth / actualHeight : 0;
  if (spec.aspectMin !== undefined && spec.aspectMax !== undefined) {
    const within = aspect >= spec.aspectMin - 0.01 && aspect <= spec.aspectMax + 0.01;
    checks.push({
      id: 'aspect',
      label: 'Aspect ratio',
      status: within ? 'pass' : 'fail',
      detail: `${aspect.toFixed(2)} : 1 · allowed ${spec.aspectMin.toFixed(2)}–${spec.aspectMax.toFixed(2)}.`,
    });
  }

  const kb = blob.size / KB;
  const belowMax = blob.size < requirement.maxKB * KB;
  checks.push({
    id: 'max-size',
    label: 'Maximum file size',
    status: belowMax ? 'pass' : 'fail',
    detail: belowMax
      ? `${kb.toFixed(1)} KB is under the ${requirement.maxKB} KB limit.`
      : `${kb.toFixed(1)} KB is at or above the ${requirement.maxKB} KB limit.`,
  });

  // Both minimum and maximum file-size requirements are mandatory so
  // files that portals would reject for being too small are never marked Ready.
  const aboveMin = blob.size >= requirement.minKB * KB;
  checks.push({
    id: 'min-size',
    label: 'Minimum file size',
    status: aboveMin ? 'pass' : 'fail',
    detail: aboveMin
      ? `${kb.toFixed(1)} KB meets the ${requirement.minKB} KB minimum.`
      : `${kb.toFixed(1)} KB is below the ${requirement.minKB} KB minimum.`,
  });

  const ready = checks.every((check) => check.status !== 'fail');
  return { checks, ready, checkedAt: new Date().toISOString() };
}

export function reportSummary(report: ValidationReport | null): string {
  if (!report) return 'Not validated';
  if (report.ready) return 'Ready to download';
  const failed = report.checks.filter((c) => c.status === 'fail').length;
  return `${failed} check${failed === 1 ? '' : 's'} failed`;
}

export function actualSizeLabel(bytes: number): string {
  return `${bytesToKB(bytes)} KB`;
}
