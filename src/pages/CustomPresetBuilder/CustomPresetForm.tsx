import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileSliders,
  Info,
  PenLine,
  Save,
  ShieldQuestion,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Checkbox, Field, NumberInput, TextInput } from '../../components/common/Field';
import {
  presetToCustomInput,
  validateCustomPreset,
  type CustomPresetInput,
  type FormErrors,
} from '../../services/presetService';
import { formatLabel } from '../../utils/format';
import type { OutputFormat } from '../../types';

const EMPTY: CustomPresetInput = {
  name: '',
  organization: '',
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
  sourceUrl: '',
  sourceLabel: '',
};

const FORMATS: OutputFormat[] = ['image/jpeg', 'image/png', 'image/webp'];

export function CustomPresetForm() {
  const {
    route,
    customPresets,
    savePreset,
    updatePreset,
    navigate,
    pushToast,
    settings,
  } = useApp();
  const editId = route.query.get('edit');
  const editingPreset = editId ? customPresets.find((preset) => preset.id === editId) : undefined;
  const [form, setForm] = useState<CustomPresetInput>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadedEdit, setLoadedEdit] = useState(false);

  useEffect(() => {
    if (editingPreset && !loadedEdit) {
      setForm(presetToCustomInput(editingPreset));
      setLoadedEdit(true);
    }
  }, [editingPreset, loadedEdit]);

  const set = <K extends keyof CustomPresetInput>(key: K, value: CustomPresetInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const toggleFormat = (format: OutputFormat, checked: boolean) => {
    const next = checked
      ? [...new Set([...form.formats, format])]
      : form.formats.filter((item) => item !== format);
    set('formats', next);
  };

  const photoAspect = form.photoWidth > 0 && form.photoHeight > 0 ? form.photoWidth / form.photoHeight : 0.87;
  const signatureAspect =
    form.signatureWidth > 0 && form.signatureHeight > 0
      ? form.signatureWidth / form.signatureHeight
      : 2.33;

  const summary = useMemo(
    () => [
      {
        label: 'Photograph',
        dims: `${form.photoWidth || '—'} × ${form.photoHeight || '—'} px`,
        size: `${form.photoMinKB}–${form.photoMaxKB} KB`,
        aspect: photoAspect,
      },
      {
        label: 'Signature',
        dims: `${form.signatureWidth || '—'} × ${form.signatureHeight || '—'} px`,
        size: `${form.signatureMinKB}–${form.signatureMaxKB} KB`,
        aspect: signatureAspect,
      },
    ],
    [form, photoAspect, signatureAspect],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateCustomPreset(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      pushToast({
        tone: 'error',
        title: 'Preset needs attention',
        message: Object.values(nextErrors)[0],
      });
      return;
    }
    setSaving(true);
    try {
      const saved = editingPreset
        ? await updatePreset(editingPreset.id, form)
        : await savePreset(form);
      pushToast({
        tone: 'success',
        title: editingPreset ? 'Preset updated' : 'Preset created',
        message: `${saved.name} is available in your local library.`,
      });
      navigate(ROUTES.customPresets);
    } catch (cause) {
      pushToast({
        tone: 'error',
        title: 'Preset could not be saved',
        message: cause instanceof Error ? cause.message : 'Local storage refused the change.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (editId && !editingPreset && customPresets.length > 0) {
    return (
      <div className="page">
        <EmptyState
          icon={ShieldQuestion}
          eyebrow="Custom presets"
          title="That preset no longer exists"
          description="It may have been deleted on this device. Create a new preset or return to your library."
          actions={
            <>
              <Button variant="primary" onClick={() => navigate(ROUTES.customPresetNew)}>
                Create a preset
              </Button>
              <Button variant="ghost" onClick={() => navigate(ROUTES.customPresets)}>
                Back to library
              </Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(ROUTES.customPresets)}>
        <ArrowLeft size={15} aria-hidden /> Custom presets
      </button>

      <header className="form-hero">
        <div>
          <p className="eyebrow">{editingPreset ? 'Edit local preset' : 'New local preset'}</p>
          <h1 className="page-title">{editingPreset ? 'Adjust the requirements' : 'Build a preset from your notice'}</h1>
          <p className="page-desc">
            Copy the numbers exactly as printed by the authority. Everything you enter is used by the
            crop, resize, compression and validation engines on this device.
          </p>
        </div>
        <div className="form-hero__badges">
          <Badge tone="outline" icon={ShieldQuestion}>User-created · unverified</Badge>
          <Badge tone="neutral">Stored locally</Badge>
        </div>
      </header>

      <form className="preset-form" onSubmit={submit} noValidate>
        <div className="preset-form__main">
          <section className="panel form-section">
            <div className="form-section__head">
              <div>
                <p className="eyebrow">Identity</p>
                <h2 className="panel__title">What is this form?</h2>
              </div>
              <FileSliders size={18} aria-hidden />
            </div>
            <div className="form-grid form-grid--two">
              <Field label="Preset name" htmlFor="custom-name" error={errors.name} hint="For example: State PSC Clerk 2026.">
                <TextInput
                  id="custom-name"
                  value={form.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="Application form name"
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Organisation"
                htmlFor="custom-org"
                error={errors.organization}
                hint="The authority or institution that issued the notice."
              >
                <TextInput
                  id="custom-org"
                  value={form.organization}
                  onChange={(event) => set('organization', event.target.value)}
                  placeholder="Organisation name"
                  autoComplete="off"
                />
              </Field>
            </div>
          </section>

          <section className="panel form-section">
            <div className="form-section__head">
              <div>
                <p className="eyebrow">Photograph</p>
                <h2 className="panel__title">Photo specification</h2>
              </div>
              <Badge tone="neutral">Image A</Badge>
            </div>
            <div className="form-grid form-grid--four">
              <Field label="Width" htmlFor="photo-w" error={errors.photoWidth}>
                <NumberInput
                  id="photo-w"
                  value={form.photoWidth}
                  min={32}
                  max={6000}
                  suffix="px"
                  onChange={(event) => set('photoWidth', Number(event.target.value))}
                />
              </Field>
              <Field label="Height" htmlFor="photo-h" error={errors.photoHeight}>
                <NumberInput
                  id="photo-h"
                  value={form.photoHeight}
                  min={32}
                  max={6000}
                  suffix="px"
                  onChange={(event) => set('photoHeight', Number(event.target.value))}
                />
              </Field>
              <Field label="Minimum" htmlFor="photo-min" error={errors.photoMinKB}>
                <NumberInput
                  id="photo-min"
                  value={form.photoMinKB}
                  min={0}
                  max={10240}
                  suffix="KB"
                  onChange={(event) => set('photoMinKB', Number(event.target.value))}
                />
              </Field>
              <Field label="Maximum" htmlFor="photo-max" error={errors.photoMaxKB}>
                <NumberInput
                  id="photo-max"
                  value={form.photoMaxKB}
                  min={1}
                  max={10240}
                  suffix="KB"
                  onChange={(event) => set('photoMaxKB', Number(event.target.value))}
                />
              </Field>
            </div>
            <p className="field__hint">
              Output is forced to exactly {form.photoWidth || '—'} × {form.photoHeight || '—'} px and must
              be strictly under {form.photoMaxKB || '—'} KB.
            </p>
          </section>

          <section className="panel form-section">
            <div className="form-section__head">
              <div>
                <p className="eyebrow">Signature</p>
                <h2 className="panel__title">Signature specification</h2>
              </div>
              <Badge tone="neutral">Image B</Badge>
            </div>
            <div className="form-grid form-grid--four">
              <Field label="Width" htmlFor="sig-w" error={errors.signatureWidth}>
                <NumberInput
                  id="sig-w"
                  value={form.signatureWidth}
                  min={32}
                  max={6000}
                  suffix="px"
                  onChange={(event) => set('signatureWidth', Number(event.target.value))}
                />
              </Field>
              <Field label="Height" htmlFor="sig-h" error={errors.signatureHeight}>
                <NumberInput
                  id="sig-h"
                  value={form.signatureHeight}
                  min={32}
                  max={6000}
                  suffix="px"
                  onChange={(event) => set('signatureHeight', Number(event.target.value))}
                />
              </Field>
              <Field label="Minimum" htmlFor="sig-min" error={errors.signatureMinKB}>
                <NumberInput
                  id="sig-min"
                  value={form.signatureMinKB}
                  min={0}
                  max={10240}
                  suffix="KB"
                  onChange={(event) => set('signatureMinKB', Number(event.target.value))}
                />
              </Field>
              <Field label="Maximum" htmlFor="sig-max" error={errors.signatureMaxKB}>
                <NumberInput
                  id="sig-max"
                  value={form.signatureMaxKB}
                  min={1}
                  max={10240}
                  suffix="KB"
                  onChange={(event) => set('signatureMaxKB', Number(event.target.value))}
                />
              </Field>
            </div>
            <p className="field__hint">
              Signatures are often much wider than they are tall. A ratio near{' '}
              {signatureAspect.toFixed(2)} will be locked in the editor.
            </p>
          </section>

          <section className="panel form-section">
            <div className="form-section__head">
              <div>
                <p className="eyebrow">Accepted files</p>
                <h2 className="panel__title">Formats the portal allows</h2>
              </div>
              <Badge tone="neutral">{form.formats.length} selected</Badge>
            </div>
            <div className="format-checks">
              {FORMATS.map((format) => (
                <Checkbox
                  key={format}
                  label={formatLabel(format)}
                  checked={form.formats.includes(format)}
                  onChange={(checked) => toggleFormat(format, checked)}
                  description={
                    format === 'image/png'
                      ? 'Lossless; supports transparency.'
                      : format === 'image/jpeg'
                        ? 'Universal; best for photographs.'
                        : 'Modern compression; supported by current browsers.'
                  }
                />
              ))}
            </div>
            {errors.formats && <p className="field__error" role="alert">{errors.formats}</p>}
          </section>

          <section className="panel form-section">
            <div className="form-section__head">
              <div>
                <p className="eyebrow">Provenance</p>
                <h2 className="panel__title">Where did these numbers come from?</h2>
              </div>
              <Info size={18} aria-hidden />
            </div>
            <div className="form-grid form-grid--two">
              <Field
                label="Official notice link"
                htmlFor="custom-url"
                optional
                error={errors.sourceUrl}
                hint="Optional. A full https:// link helps you find the notice again."
              >
                <TextInput
                  id="custom-url"
                  type="url"
                  value={form.sourceUrl}
                  onChange={(event) => set('sourceUrl', event.target.value)}
                  placeholder="https://example.gov.in/notice.pdf"
                  autoComplete="off"
                />
              </Field>
              <Field label="Source label" htmlFor="custom-source" optional hint="For example: Official notification PDF, page 4.">
                <TextInput
                  id="custom-source"
                  value={form.sourceLabel}
                  onChange={(event) => set('sourceLabel', event.target.value)}
                  placeholder="Notice title and page"
                  autoComplete="off"
                />
              </Field>
            </div>
          </section>

          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.customPresets)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={editingPreset ? Save : Check} loading={saving}>
              {editingPreset ? 'Save changes' : 'Create preset'}
            </Button>
          </div>
        </div>

        <aside className="preset-form__aside">
          <div className="panel form-preview">
            <p className="eyebrow">Live summary</p>
            <h2 className="panel__title">{form.name.trim() || 'Untitled preset'}</h2>
            <p className="form-preview__org">{form.organization.trim() || 'Organisation not set'}</p>

            {summary.map((item) => (
              <div key={item.label} className="form-preview__row">
                <div className="form-preview__shape-wrap">
                  <div
                    className="form-preview__shape"
                    style={{ aspectRatio: `${item.aspect || 1}` }}
                    aria-hidden
                  />
                </div>
                <div className="form-preview__meta">
                  <p className="form-preview__label">{item.label}</p>
                  <p className="form-preview__dims">{item.dims}</p>
                  <p className="form-preview__size">{item.size}</p>
                </div>
              </div>
            ))}

            <dl className="spec-table spec-table--tight">
              <div><dt>Formats</dt><dd>{form.formats.map(formatLabel).join(', ') || 'None'}</dd></div>
              <div><dt>Verification</dt><dd>User-created</dd></div>
              <div><dt>Safety margin</dt><dd>{settings.safetyMarginKB} KB</dd></div>
            </dl>

            <div className="notice notice--warning">
              <ShieldQuestion size={17} strokeWidth={1.8} aria-hidden className="notice__icon" />
              <div>
                <p className="notice__title">Not an official preset</p>
                <div className="notice__body">
                  FORMFIT will label this preset as unverified everywhere it appears. Double-check every
                  number against the notice before you submit.
                </div>
              </div>
            </div>
          </div>

          <div className="panel form-guidance">
            <p className="eyebrow">Reading the notice</p>
            <ul className="checklist">
              <li>Use pixel dimensions only when the notice gives pixels, not centimetres.</li>
              <li>“Not exceeding 50 KB” means strictly under 50 KB; keep a small margin.</li>
              <li>If the notice gives only a maximum, set the minimum to the smallest sane size.</li>
              <li>Formats are case-insensitive in the notice but exact in the file.</li>
            </ul>
            <p className="form-guidance__note">
              <Sparkles size={13} aria-hidden /> Looking for a known exam? Check the verified library
              first — it may already exist.
            </p>
            <Button variant="ghost" size="sm" icon={FileSliders} onClick={() => navigate(ROUTES.presets)}>
              Browse official presets
            </Button>
          </div>

          <div className="panel form-guidance">
            <p className="eyebrow">Quick presets</p>
            <div className="quick-spec-list">
              <button
                type="button"
                className="quick-spec"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    photoWidth: 200,
                    photoHeight: 230,
                    photoMinKB: 20,
                    photoMaxKB: 50,
                    signatureWidth: 140,
                    signatureHeight: 60,
                    signatureMinKB: 10,
                    signatureMaxKB: 20,
                    formats: ['image/jpeg'],
                  }))
                }
              >
                <PenLine size={14} aria-hidden />
                <span>
                  <strong>Passport pair</strong>
                  200 × 230 · 140 × 60 · JPEG
                </span>
              </button>
              <button
                type="button"
                className="quick-spec"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    photoWidth: 300,
                    photoHeight: 400,
                    photoMinKB: 20,
                    photoMaxKB: 100,
                    signatureWidth: 400,
                    signatureHeight: 120,
                    signatureMinKB: 10,
                    signatureMaxKB: 50,
                    formats: ['image/jpeg'],
                  }))
                }
              >
                <FileSliders size={14} aria-hidden />
                <span>
                  <strong>Large portrait</strong>
                  300 × 400 · 400 × 120 · JPEG
                </span>
              </button>
            </div>
            <p className="form-guidance__note">
              <ArrowRight size={13} aria-hidden /> Quick presets only fill the form. You still review and
              save.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
