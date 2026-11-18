import builtinData from '../../data/presets.json';
import type { ImageRequirement, OutputFormat, Preset, PresetCategory } from '../types';
import { bytesToKB } from '../utils/format';
import { describeDimensions } from '../utils/geometry';
import { deleteCustomPreset, loadCustomPresets, saveCustomPreset } from './storageService';

export const BUILTIN_PRESETS = builtinData as Preset[];

export async function getAllPresets(): Promise<Preset[]> {
  const custom = await loadCustomPresets();
  return [...BUILTIN_PRESETS, ...custom];
}

export function findPreset(presets: Preset[], id: string | null | undefined): Preset | null {
  if (!id) return null;
  return presets.find((preset) => preset.id === id) ?? null;
}

export function searchPresets(presets: Preset[], query: string, category: string): Preset[] {
  const q = query.trim().toLowerCase();
  return presets.filter((preset) => {
    if (category !== 'All' && preset.category !== category) return false;
    if (!q) return true;
    return [preset.organization, preset.name, preset.shortName, preset.category]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

export const PRESET_CATEGORIES: Array<PresetCategory | 'All'> = [
  'All',
  'Banking',
  'Engineering',
  'Civil Services',
  'Medical',
  'University',
  'Custom',
];

export interface CustomPresetInput {
  name: string;
  organization: string;
  category: PresetCategory;
  photoWidth: number;
  photoHeight: number;
  photoMinKB: number;
  photoMaxKB: number;
  signatureWidth: number;
  signatureHeight: number;
  signatureMinKB: number;
  signatureMaxKB: number;
  formats: OutputFormat[];
  sourceUrl: string;
  sourceLabel: string;
}

export interface FormErrors {
  [key: string]: string;
}

export function validateCustomPreset(input: CustomPresetInput): FormErrors {
  const errors: FormErrors = {};
  if (!input.name.trim()) errors.name = 'Give the preset a name.';
  if (!input.organization.trim()) errors.organization = 'Name the organisation or category.';
  if (!Number.isInteger(input.photoWidth) || input.photoWidth < 32 || input.photoWidth > 6000) {
    errors.photoWidth = 'Width must be between 32 and 6000 px.';
  }
  if (!Number.isInteger(input.photoHeight) || input.photoHeight < 32 || input.photoHeight > 6000) {
    errors.photoHeight = 'Height must be between 32 and 6000 px.';
  }
  if (!Number.isInteger(input.signatureWidth) || input.signatureWidth < 32 || input.signatureWidth > 6000) {
    errors.signatureWidth = 'Width must be between 32 and 6000 px.';
  }
  if (!Number.isInteger(input.signatureHeight) || input.signatureHeight < 32 || input.signatureHeight > 6000) {
    errors.signatureHeight = 'Height must be between 32 and 6000 px.';
  }
  if (input.photoMaxKB < 1) errors.photoMaxKB = 'Maximum size must be at least 1 KB.';
  if (input.photoMinKB < 0) errors.photoMinKB = 'Minimum size cannot be negative.';
  if (input.photoMinKB >= input.photoMaxKB) errors.photoMinKB = 'Minimum must be below the maximum.';
  if (input.signatureMaxKB < 1) errors.signatureMaxKB = 'Maximum size must be at least 1 KB.';
  if (input.signatureMinKB < 0) errors.signatureMinKB = 'Minimum size cannot be negative.';
  if (input.signatureMinKB >= input.signatureMaxKB) {
    errors.signatureMinKB = 'Minimum must be below the maximum.';
  }
  if (input.formats.length === 0) errors.formats = 'Select at least one output format.';
  if (input.sourceUrl && !/^https?:\/\//i.test(input.sourceUrl)) {
    errors.sourceUrl = 'Enter a full http(s) link, or leave it blank.';
  }
  return errors;
}

function requirement(
  label: string,
  width: number,
  height: number,
  minKB: number,
  maxKB: number,
  formats: OutputFormat[],
): ImageRequirement {
  return {
    label,
    dimensions: { width, height, aspectMin: width / height, aspectMax: width / height },
    minKB,
    maxKB,
    formats,
    dimensionsFixed: true,
    notes: ['User-created preset. Not verified against an official notice.'],
  };
}

function buildCustomPreset(id: string, input: CustomPresetInput, createdAt: string): Preset {
  return {
    id,
    organization: input.organization.trim(),
    name: input.name.trim(),
    shortName: input.name.trim(),
    category: 'Custom',
    verification: 'custom',
    createdAt,
    sourceUrl: input.sourceUrl || undefined,
    sourceLabel: input.sourceLabel || 'User-created preset',
    sourceNote: 'Created locally. Requirements are supplied by the user and are not officially verified.',
    photo: requirement(
      'Photograph',
      input.photoWidth,
      input.photoHeight,
      input.photoMinKB,
      input.photoMaxKB,
      input.formats,
    ),
    signature: requirement(
      'Signature',
      input.signatureWidth,
      input.signatureHeight,
      input.signatureMinKB,
      input.signatureMaxKB,
      input.formats,
    ),
    photoCropAspect: input.photoWidth / input.photoHeight,
    signatureCropAspect: input.signatureWidth / input.signatureHeight,
  };
}

export async function createCustomPreset(input: CustomPresetInput): Promise<Preset> {
  const errors = validateCustomPreset(input);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }
  const preset = buildCustomPreset(
    `custom-${Date.now().toString(36)}`,
    input,
    new Date().toISOString(),
  );
  await saveCustomPreset(preset);
  return preset;
}

export async function updateCustomPreset(id: string, input: CustomPresetInput): Promise<Preset> {
  const errors = validateCustomPreset(input);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }
  const existing = (await loadCustomPresets()).find((preset) => preset.id === id);
  if (!existing) throw new Error('That custom preset no longer exists on this device.');
  const preset = buildCustomPreset(id, input, existing.createdAt ?? new Date().toISOString());
  await saveCustomPreset(preset);
  return preset;
}

export function presetToCustomInput(preset: Preset): CustomPresetInput {
  return {
    name: preset.name,
    organization: preset.organization,
    category: 'Custom',
    photoWidth: preset.photo.dimensions.width ?? 200,
    photoHeight: preset.photo.dimensions.height ?? 230,
    photoMinKB: preset.photo.minKB,
    photoMaxKB: preset.photo.maxKB,
    signatureWidth: preset.signature.dimensions.width ?? 140,
    signatureHeight: preset.signature.dimensions.height ?? 60,
    signatureMinKB: preset.signature.minKB,
    signatureMaxKB: preset.signature.maxKB,
    formats: [...preset.photo.formats],
    sourceUrl: preset.sourceUrl ?? '',
    sourceLabel: preset.sourceLabel ?? '',
  };
}

export async function removeCustomPreset(id: string): Promise<void> {
  await deleteCustomPreset(id);
}

export function presetRangeLabel(preset: Preset, kind: 'photo' | 'signature'): string {
  const req = kind === 'photo' ? preset.photo : preset.signature;
  return `${req.minKB}–${req.maxKB} KB`;
}

export function presetOutputSummary(preset: Preset, kind: 'photo' | 'signature'): string {
  const req = kind === 'photo' ? preset.photo : preset.signature;
  return describeDimensions(req.dimensions, req.dimensionsFixed);
}

export function presetSizeOf(preset: Preset, kind: 'photo' | 'signature'): string {
  const req = kind === 'photo' ? preset.photo : preset.signature;
  return `${req.minKB}–${req.maxKB} KB`;
}

export function humanKB(bytes: number): string {
  return `${bytesToKB(bytes)} KB`;
}
