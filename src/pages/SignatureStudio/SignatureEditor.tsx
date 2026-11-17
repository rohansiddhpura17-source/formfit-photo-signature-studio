import { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Contrast,
  Droplets,
  Eraser,
  Info,
  PenLine,
  RotateCcw,
  ScanLine,
  Sun,
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
import { aspectLabel, hasExactDimensions } from '../../utils/geometry';
import type { OutputFormat } from '../../types';

export function SignatureEditor() {
  const {
    signature,
    activePreset,
    updateSignatureCrop,
    updateSignatureAdjustments,
    updateSignatureSettings,
    updateSignatureOutput,
    navigate,
    pushToast,
  } = useApp();

  useEffect(() => {
    if (!signature.source) navigate(ROUTES.signature);
  }, [signature.source, navigate]);

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
  const fixed = hasExactDimensions(activePreset.signature.dimensions);

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
            onClick={() => {
              updateSignatureCrop({
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
                rotation: 0,
                aspect: activePreset.signatureCropAspect,
                showFaceGuide: false,
              });
              updateSignatureAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
              pushToast({ tone: 'neutral', title: 'Signature reset' });
            }}
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
                onClick={() => updateSignatureCrop({ rotation: (signature.crop.rotation - 90 + 360) % 360 })}
                aria-label="Rotate left 90 degrees"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="icon-btn icon-btn--sm"
                onClick={() => updateSignatureCrop({ rotation: (signature.crop.rotation + 90) % 360 })}
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
              value={Math.max(-10, Math.min(10, signature.crop.rotation > 180 ? signature.crop.rotation - 360 : signature.crop.rotation))}
              min={-10}
              max={10}
              step={1}
              onChange={(value) => updateSignatureCrop({ rotation: value })}
              formatValue={(value) => `${value}°`}
            />
            {!fixed && (
              <div className="ratio-picker ratio-picker--compact">
                {[3, 2.33, 2, 1].map((ratio) => (
                  <button
                    key={ratio}
                    className={`ratio ${Math.abs(signature.crop.aspect - ratio) < 0.02 ? 'is-active' : ''}`}
                    onClick={() => updateSignatureCrop({ aspect: ratio })}
                    aria-pressed={Math.abs(signature.crop.aspect - ratio) < 0.02}
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
                  value={signature.output.width}
                  min={32}
                  max={6000}
                  disabled={fixed}
                  suffix="px"
                  onChange={(event) => {
                    const width = Math.max(32, Math.min(6000, Math.round(Number(event.target.value) || 0)));
                    updateSignatureOutput({ width, height: Math.round(width / signature.crop.aspect) });
                  }}
                />
              </div>
              <span className="dimension-x" aria-hidden>×</span>
              <div className="dimension-field">
                <label htmlFor="sig-height">Height</label>
                <NumberInput
                  id="sig-height"
                  value={signature.output.height}
                  min={32}
                  max={6000}
                  disabled={fixed}
                  suffix="px"
                  onChange={(event) => {
                    const height = Math.max(32, Math.min(6000, Math.round(Number(event.target.value) || 0)));
                    updateSignatureOutput({ height, width: Math.round(height * signature.crop.aspect) });
                  }}
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
