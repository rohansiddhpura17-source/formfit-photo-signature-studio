import { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Contrast,
  Images,
  Info,
  RotateCcw,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { NumberInput, Select } from '../../components/common/Field';
import { Slider } from '../../components/common/Feedback';
import { renderCrop } from '../../engines/imageCropper';
import { formatLabel } from '../../utils/format';
import { hasExactDimensions, hasRangeDimensions } from '../../utils/geometry';
import type { Adjustments, CropSettings, LoadedImage } from '../../types';

export function PhotoAdjust() {
  const {
    photo,
    activePreset,
    updatePhotoAdjustments,
    updatePhotoOutput,
    navigate,
    pushToast,
  } = useApp();

  useEffect(() => {
    if (!photo.source) navigate(ROUTES.photo);
  }, [photo.source, navigate]);

  if (!photo.source || !activePreset) {
    return (
      <div className="page">
        <EmptyState
          icon={Images}
          eyebrow="Photo Studio"
          title="No photograph loaded"
          description="Upload a photograph to adjust its tone and output dimensions."
          actions={<Button variant="primary" onClick={() => navigate(ROUTES.photo)}>Go to upload</Button>}
        />
      </div>
    );
  }

  const spec = activePreset.photo.dimensions;
  const fixed = hasExactDimensions(spec);
  const range = hasRangeDimensions(spec);

  const setWidth = (width: number) => {
    const safe = Math.max(32, Math.min(6000, Math.round(width || 0)));
    let nextWidth = safe;
    let nextHeight = Math.round(safe / photo.crop.aspect);
    if (range) {
      if (spec.minWidth) nextWidth = Math.max(nextWidth, spec.minWidth);
      if (spec.maxWidth) nextWidth = Math.min(nextWidth, spec.maxWidth);
      nextHeight = Math.round(nextWidth / photo.crop.aspect);
      if (spec.minHeight) nextHeight = Math.max(nextHeight, spec.minHeight);
      if (spec.maxHeight) nextHeight = Math.min(nextHeight, spec.maxHeight);
    }
    updatePhotoOutput({ width: nextWidth, height: Math.max(1, nextHeight) });
  };

  const reset = () => {
    updatePhotoAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    pushToast({ tone: 'neutral', title: 'Adjustments reset' });
  };

  return (
    <div className="studio-page">
      <div className="studio-bar">
        <div className="studio-bar__left">
          <button className="back-link" onClick={() => navigate(ROUTES.photoCrop)}>
            <ArrowLeft size={15} aria-hidden /> Crop
          </button>
          <span className="studio-bar__divider" aria-hidden />
          <h1 className="studio-bar__title">Adjust photograph</h1>
          <Badge tone="outline">{activePreset.shortName}</Badge>
          <span className="studio-bar__step">Step 3 of 3</span>
        </div>
        <div className="studio-bar__right">
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={reset}>
            Reset tone
          </Button>
          <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => navigate(ROUTES.compression)}>
            Continue to compress
          </Button>
        </div>
      </div>

      <div className="studio-layout">
        <section className="canvas-panel" aria-label="Photo adjustment previews">
          <div className="preview-pair">
            <div className="preview-panel">
              <div className="preview-panel__head">
                <span className="eyebrow">Original</span>
                <span className="preview-panel__meta">
                  {photo.source.width} × {photo.source.height} px
                </span>
              </div>
              <div className="preview-panel__image">
                <img src={photo.source.url} alt="Original photograph" />
              </div>
              <p className="preview-panel__foot">Full source frame, before crop and tone.</p>
            </div>

            <div className="preview-panel preview-panel--processed">
              <div className="preview-panel__head">
                <span className="eyebrow">Processed</span>
                <span className="preview-panel__meta">
                  {photo.output.width} × {photo.output.height} px · {formatLabel(photo.output.format)}
                </span>
              </div>
              <div className="preview-panel__image" style={{ aspectRatio: `${photo.crop.aspect}` }}>
                <ProcessedPreview
                  image={photo.source}
                  crop={photo.crop}
                  adjustments={photo.adjustments}
                  width={photo.output.width}
                  height={photo.output.height}
                />
              </div>
              <p className="preview-panel__foot">
                Crop, tone and final dimensions as they will be exported.
              </p>
            </div>
          </div>

          <div className="canvas-status">
            <span><Sun size={13} aria-hidden /> Brightness {photo.adjustments.brightness}%</span>
            <span className="canvas-status__dot" aria-hidden />
            <span><Contrast size={13} aria-hidden /> Contrast {photo.adjustments.contrast}%</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>Saturation {photo.adjustments.saturation}%</span>
            <span className="canvas-status__spacer" />
            <span>No stretching: ratio preserved</span>
          </div>
        </section>

        <aside className="studio-rail studio-rail--scroll">
          <div className="rail-block">
            <p className="eyebrow">Tone</p>
            <h2 className="rail-block__title">Keep it natural</h2>
            <p className="rail-block__desc">
              Small corrections are safer than heavy edits. Official forms reject photographs that no
              longer look like the candidate.
            </p>
            <Slider
              label="Brightness"
              value={photo.adjustments.brightness}
              min={50}
              max={150}
              step={1}
              onChange={(value) => updatePhotoAdjustments({ brightness: value })}
              formatValue={(value) => `${value}%`}
            />
            <Slider
              label="Contrast"
              value={photo.adjustments.contrast}
              min={50}
              max={150}
              step={1}
              onChange={(value) => updatePhotoAdjustments({ contrast: value })}
              formatValue={(value) => `${value}%`}
            />
            <Slider
              label="Saturation"
              value={photo.adjustments.saturation}
              min={0}
              max={150}
              step={1}
              onChange={(value) => updatePhotoAdjustments({ saturation: value })}
              formatValue={(value) => `${value}%`}
            />
          </div>

          <div className="rail-block">
            <p className="eyebrow">Dimensions</p>
            <div className="dimension-row">
              <div className="dimension-field">
                <label htmlFor="photo-width">Width</label>
                <NumberInput
                  id="photo-width"
                  value={photo.output.width}
                  min={32}
                  max={6000}
                  disabled={fixed}
                  suffix="px"
                  onChange={(event) => setWidth(Number(event.target.value))}
                />
              </div>
              <span className="dimension-x" aria-hidden>×</span>
              <div className="dimension-field">
                <label htmlFor="photo-height">Height</label>
                <NumberInput
                  id="photo-height"
                  value={photo.output.height}
                  min={32}
                  max={6000}
                  disabled={fixed || range}
                  suffix="px"
                  onChange={(event) => {
                    const height = Math.max(1, Math.round(Number(event.target.value) || 0));
                    updatePhotoOutput({ height, width: Math.round(height * photo.crop.aspect) });
                  }}
                />
              </div>
            </div>
            <p className="field__hint">
              {fixed
                ? `Locked to ${spec.width} × ${spec.height} px by the official preset.`
                : range
                  ? `Allowed ${spec.minWidth}–${spec.maxWidth} px wide and ${spec.minHeight}–${spec.maxHeight} px high. Ratio is preserved.`
                  : 'The authority does not fix pixel dimensions. Ratio is preserved from the crop.'}
            </p>

            <div className="field" style={{ marginTop: 14 }}>
              <label className="field__label" htmlFor="photo-format">Output format</label>
              <Select
                id="photo-format"
                value={photo.output.format}
                onChange={(event) => updatePhotoOutput({ format: event.target.value as typeof photo.output.format })}
                options={activePreset.photo.formats.map((format) => ({
                  value: format,
                  label: formatLabel(format),
                }))}
              />
              <p className="field__hint">
                This preset accepts {activePreset.photo.formats.map(formatLabel).join(', ')} only.
              </p>
            </div>

            <div className="info-row">
              <Info size={14} aria-hidden />
              <span>
                Browsers do not write physical DPI metadata. Validation uses the pixel dimensions and
                the actual file size, not a claimed DPI.
              </span>
            </div>
          </div>

          <div className="rail-block">
            <p className="eyebrow">File budget</p>
            <dl className="spec-table spec-table--tight">
              <div><dt>Maximum</dt><dd>{activePreset.photo.maxKB} KB</dd></div>
              <div><dt>Minimum</dt><dd>{activePreset.photo.minKB} KB</dd></div>
              <div><dt>Source</dt><dd>{(photo.source.sizeBytes / 1024).toFixed(1)} KB</dd></div>
            </dl>
            <p className="rail-block__desc">
              The compressor will search for the highest quality that fits strictly under the maximum.
            </p>
          </div>

          <div className="rail-actions">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.photoCrop)}>
              Back to crop
            </Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.compression)}>
              Compress photo
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProcessedPreview({
  image,
  crop,
  adjustments,
  width,
  height,
}: {
  image: LoadedImage;
  crop: CropSettings;
  adjustments: Adjustments;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const box = canvas.parentElement?.getBoundingClientRect();
    const frameWidth = Math.min(box?.width ?? 420, 520);
    const frameHeight = frameWidth / crop.aspect;
    try {
      renderCrop(canvas, {
        image: image.image,
        crop,
        width: Math.round(frameWidth * dpr),
        height: Math.round(frameHeight * dpr),
        adjustments,
        background: '#FFFFFF',
      });
    } catch {
      /* Preview errors are non-fatal; export will surface them. */
    }
  }, [image, crop, adjustments, width, height]);

  return <canvas ref={ref} className="processed-canvas" aria-label="Processed photograph preview" />;
}
