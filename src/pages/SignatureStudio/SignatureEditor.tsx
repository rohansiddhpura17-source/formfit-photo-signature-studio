import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Eraser,
  Info,
  PenLine,
  RotateCcw,
  ScanLine,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge, Notice } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { NumberInput, Select } from '../../components/common/Field';
import { Segmented, Slider } from '../../components/common/Feedback';
import { CropStage } from '../../components/editor/CropStage';
import { formatLabel } from '../../utils/format';
import {
  applyFineRotation,
  aspectLabel,
  clampOutputDimensions,
  defaultCropFor,
  hasExactDimensions,
  outputForPreset,
  rotateByNinety,
  splitRotation,
} from '../../utils/geometry';
import type { OutputFormat } from '../../types';

export function SignatureEditor() {
  const {
    signature,
    activeSignaturePreset: activePreset,
    updateSignatureCrop,
    updateSignatureAdjustments,
    updateSignatureSettings,
    updateSignatureOutput,
    navigate,
    pushToast,
  } = useApp();

  const [widthText, setWidthText] = useState(String(signature.output.width));
  const [heightText, setHeightText] = useState(String(signature.output.height));
  const focusedRef = useRef<'width' | 'height' | null>(null);

  useEffect(() => {
    if (!signature.source) navigate(ROUTES.signature);
  }, [signature.source, navigate]);

  useEffect(() => {
    if (focusedRef.current !== 'width') setWidthText(String(signature.output.width));
    if (focusedRef.current !== 'height') setHeightText(String(signature.output.height));
  }, [signature.output.width, signature.output.height]);

  const ratios = useMemo(() => {
    if (!activePreset) return [2.3333];
    const spec = activePreset.signature.dimensions;
    if (hasExactDimensions(spec) || (spec.aspectMin && spec.aspectMax && Math.abs(spec.aspectMin - spec.aspectMax) < 0.01)) {
      return [activePreset.signatureCropAspect];
    }
    const min = spec.aspectMin ?? 0.4;
    const max = spec.aspectMax ?? 5.0;
    const raw = [activePreset.signatureCropAspect, 3.5, 3, 2.33, 2, 1.5, 1, 0.8].filter(
      (value) => value >= min - 0.01 && value <= max + 0.01,
    );
    const deduped: number[] = [];
    for (const value of raw) {
      if (!deduped.some((existing) => Math.abs(existing - value) < 0.05)) {
        deduped.push(value);
      }
    }
    return deduped.length > 0 ? deduped : [activePreset.signatureCropAspect];
  }, [activePreset]);

  if (!signature.source || !activePreset) {
    return (
      <div className="page">
        <EmptyState
          icon={PenLine}
          eyebrow="Signature Studio"
          title="No signature loaded"
          description="Add a signature scan to crop it and clean the paper background."
          actions={<Button variant="primary" onClick={() => navigate(ROUTES.signature)}>Go to upload</Button>}
        />
      </div>
    );
  }

  const alpha = signature.output.format !== 'image/jpeg';
  const spec = activePreset.signature.dimensions;
  const fixed = hasExactDimensions(spec);

  const handleWidthChange = (raw: string) => {
    setWidthText(raw);
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const dims = clampOutputDimensions(parsed, 'width', signature.crop.aspect, spec);
    updateSignatureOutput(dims);
    setHeightText(String(dims.height));
  };

  const handleHeightChange = (raw: string) => {
    setHeightText(raw);
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const dims = clampOutputDimensions(parsed, 'height', signature.crop.aspect, spec);
    updateSignatureOutput(dims);
    setWidthText(String(dims.width));
  };

  const commitDimensions = (axis: 'width' | 'height') => {
    focusedRef.current = null;
    const raw = axis === 'width' ? widthText : heightText;
    const parsed = Number(raw);
    const fallback = axis === 'width' ? signature.output.width : signature.output.height;
    const dims =
      raw.trim() !== '' && Number.isFinite(parsed) && parsed > 0
        ? clampOutputDimensions(parsed, axis, signature.crop.aspect, spec)
        : clampOutputDimensions(fallback, axis, signature.crop.aspect, spec);
    updateSignatureOutput(dims);
    setWidthText(String(dims.width));
    setHeightText(String(dims.height));
  };

  const setTransparent = (value: boolean) => {
    updateSignatureSettings({ transparent: value });
    if (value && signature.output.format === 'image/jpeg') {
      updateSignatureOutput({ format: 'image/png' });
    }
    if (!value && signature.output.format === 'image/png') {
      updateSignatureOutput({ format: activePreset.signature.formats[0] });
    }
  };

  const setFormat = (format: OutputFormat) => {
    updateSignatureOutput({ format });
    if (format === 'image/jpeg' && signature.transparent) {
      updateSignatureSettings({ transparent: false });
    }
  };

  const formatOptions: Array<{ value: OutputFormat; label: string }> = [
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/webp', label: 'WebP' },
  ];

  const reset = () => {
    const defaultCrop = defaultCropFor(activePreset, 'signature');
    const dims = outputForPreset(activePreset, 'signature', defaultCrop.aspect);
    updateSignatureCrop(defaultCrop);
    updateSignatureAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    updateSignatureOutput(dims);
    pushToast({ tone: 'neutral', title: 'Signature reset' });
  };

  return (
    <div className="studio-page">
      <div className="studio-bar">
        <div className="studio-bar__left">
          <button className="back-link" onClick={() => navigate(ROUTES.signature)}>
            <ArrowLeft size={15} aria-hidden /> Signature Studio
          </button>
          <span className="studio-bar__divider" aria-hidden />
          <h1 className="studio-bar__title">Signature editor</h1>
          <Badge tone="outline">{activePreset.shortName}</Badge>
        </div>
        <div className="studio-bar__right">
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={reset}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconRight={ArrowRight}
            onClick={() => navigate(`${ROUTES.compression}?doc=signature`)}
          >
            Continue to compress
          </Button>
        </div>
      </div>

      <div className="studio-layout">
        <section className="canvas-panel" aria-label="Signature canvas">
          <div className="canvas-toolbar">
            <div className="canvas-toolbar__group">
              <span className="canvas-toolbar__label"><ScanLine size={14} aria-hidden /> Signature crop</span>
              <span className="canvas-toolbar__value">{aspectLabel(signature.crop.aspect)}</span>
            </div>
            <div className="canvas-toolbar__group">
              <button
                className="icon-btn icon-btn--sm"
                onClick={() => updateSignatureCrop({ rotation: rotateByNinety(signature.crop.rotation, -90) })}
                aria-label="Rotate left 90 degrees"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="icon-btn icon-btn--sm"
                onClick={() => updateSignatureCrop({ rotation: rotateByNinety(signature.crop.rotation, 90) })}
                aria-label="Rotate right 90 degrees"
              >
                <RotateCcw size={15} className="flip-x" />
              </button>
              <span className="canvas-toolbar__divider" aria-hidden />
              <Segmented
                label="Signature background"
                size="sm"
                value={signature.transparent ? 'transparent' : 'paper'}
                onChange={(value) => setTransparent(value === 'transparent')}
                options={[
                  { value: 'paper', label: 'White paper' },
                  { value: 'transparent', label: 'Transparent' },
                ]}
              />
            </div>
          </div>

          <CropStage
            image={signature.source}
            crop={signature.crop}
            adjustments={signature.adjustments}
            onChange={updateSignatureCrop}
            guide="signature"
            transparent={signature.transparent && alpha}
            inkThreshold={signature.inkThreshold}
          />

          <div className="canvas-status">
            <span><Eraser size={13} aria-hidden /> Paper cleanup: {signature.transparent ? 'on' : 'off'}</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>{formatLabel(signature.output.format)}</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>Output {signature.output.width} × {signature.output.height} px</span>
            <span className="canvas-status__spacer" />
            <span>Ink threshold {signature.inkThreshold}%</span>
          </div>
        </section>

        <aside className="studio-rail studio-rail--scroll">
          {signature.transparent && !activePreset.signature.formats.includes('image/png') && (
            <Notice tone="warning" title="Transparency is not accepted by this preset">
              PNG preserves the transparent background, but {activePreset.shortName} requires{' '}
              {activePreset.signature.formats.map(formatLabel).join(', ')}. Turn transparency off
              before validating for submission.
            </Notice>
          )}

          <div className="rail-block">
            <p className="eyebrow">Crop &amp; scale</p>
            <h2 className="rail-block__title">Keep the strokes intact</h2>
            <p className="rail-block__desc">
              Crop close to the handwriting with a small, even margin. Zoom in only as far as the
              source resolution allows.
            </p>
            <Slider
              label="Zoom"
              value={signature.crop.zoom}
              min={1}
              max={3}
              step={0.01}
              onChange={(value) => updateSignatureCrop({ zoom: value })}
              formatValue={(value) => `${value.toFixed(2)}×`}
            />
            <Slider
              label="Fine rotation"
              value={splitRotation(signature.crop.rotation).fine}
              min={-10}
              max={10}
              step={1}
              onChange={(value) =>
                updateSignatureCrop({ rotation: applyFineRotation(signature.crop.rotation, value) })
              }
              formatValue={(value) => `${value}°`}
            />
            {!fixed && ratios.length > 1 && (
              <div className="ratio-picker ratio-picker--compact">
                {ratios.map((ratio) => (
                  <button
                    key={ratio}
                    className={`ratio ${Math.abs(signature.crop.aspect - ratio) < 0.03 ? 'is-active' : ''}`}
                    onClick={() => updateSignatureCrop({ aspect: ratio })}
                    aria-pressed={Math.abs(signature.crop.aspect - ratio) < 0.03}
                  >
                    {aspectLabel(ratio)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rail-block">
            <p className="eyebrow">Ink &amp; paper</p>
            <Slider
              label="Brightness"
              value={signature.adjustments.brightness}
              min={60}
              max={140}
              step={1}
              onChange={(value) => updateSignatureAdjustments({ brightness: value })}
              formatValue={(value) => `${value}%`}
            />
            <Slider
              label="Contrast"
              value={signature.adjustments.contrast}
              min={60}
              max={180}
              step={1}
              onChange={(value) => updateSignatureAdjustments({ contrast: value })}
              formatValue={(value) => `${value}%`}
            />
            <Slider
              label="Paper removal threshold"
              value={signature.inkThreshold}
              min={55}
              max={98}
              step={1}
              onChange={(value) => updateSignatureSettings({ inkThreshold: value })}
              formatValue={(value) => `${value}%`}
              hint="Pixels brighter than this become transparent. Lower values remove more paper; too low may clip light ink."
              disabled={!signature.transparent}
            />
            <div className="info-row">
              <Droplets size={14} aria-hidden />
              <span>
                {signature.transparent
                  ? 'Transparency is previewed on a checkerboard. JPEG cannot store alpha; choose PNG or WebP.'
                  : 'The paper stays white, which is what most official JPEG uploads expect.'}
              </span>
            </div>
          </div>

          <div className="rail-block">
            <p className="eyebrow">Output</p>
            <div className="dimension-row">
              <div className="dimension-field">
                <label htmlFor="sig-width">Width</label>
                <NumberInput
                  id="sig-width"
                  value={widthText}
                  min={spec.minWidth ?? 32}
                  max={spec.maxWidth ?? 6000}
                  disabled={fixed}
                  suffix="px"
                  onFocus={() => {
                    focusedRef.current = 'width';
                  }}
                  onChange={(event) => handleWidthChange(event.target.value)}
                  onBlur={() => commitDimensions('width')}
                />
              </div>
              <span className="dimension-x" aria-hidden>×</span>
              <div className="dimension-field">
                <label htmlFor="sig-height">Height</label>
                <NumberInput
                  id="sig-height"
                  value={heightText}
                  min={spec.minHeight ?? 32}
                  max={spec.maxHeight ?? 6000}
                  disabled={fixed}
                  suffix="px"
                  onFocus={() => {
                    focusedRef.current = 'height';
                  }}
                  onChange={(event) => handleHeightChange(event.target.value)}
                  onBlur={() => commitDimensions('height')}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label className="field__label" htmlFor="sig-format">Output format</label>
              <Select
                id="sig-format"
                value={signature.output.format}
                onChange={(event) => setFormat(event.target.value as OutputFormat)}
                options={formatOptions.map((option) => ({
                  value: option.value,
                  label: `${option.label}${activePreset.signature.formats.includes(option.value) ? ' · accepted' : ' · not accepted by preset'}`,
                }))}
              />
            </div>

            <dl className="spec-table spec-table--tight">
              <div><dt>Preset limit</dt><dd>{activePreset.signature.minKB}–{activePreset.signature.maxKB} KB</dd></div>
              <div><dt>Source</dt><dd>{(signature.source.sizeBytes / 1024).toFixed(1)} KB</dd></div>
            </dl>
          </div>

          <div className="info-row">
            <Info size={14} aria-hidden />
            <span>
              Ink cleanup only changes near-white paper pixels. The handwriting itself is never
              redrawn, thinned or regenerated.
            </span>
          </div>

          <div className="rail-actions">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.signature)}>
              Back
            </Button>
            <Button
              variant="primary"
              iconRight={ArrowRight}
              onClick={() => navigate(`${ROUTES.compression}?doc=signature`)}
            >
              Compress signature
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
