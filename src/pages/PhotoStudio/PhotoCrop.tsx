import { useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crop,
  Grid2X2,
  Images,
  RotateCcw,
  RotateCw,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Notice } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Slider, Switch } from '../../components/common/Feedback';
import { CropStage } from '../../components/editor/CropStage';
import {
  applyFineRotation,
  aspectLabel,
  defaultCropFor,
  hasExactDimensions,
  rotateByNinety,
  splitRotation,
} from '../../utils/geometry';
import { formatLabel } from '../../utils/format';

export function PhotoCrop() {
  const { photo, activePreset, updatePhotoCrop, navigate, pushToast } = useApp();

  useEffect(() => {
    if (!photo.source) navigate(ROUTES.photo);
  }, [photo.source, navigate]);

  const ratios = useMemo(() => {
    if (!activePreset) return [4 / 5];
    const spec = activePreset.photo.dimensions;
    if (hasExactDimensions(spec) || (spec.aspectMin && spec.aspectMax && Math.abs(spec.aspectMin - spec.aspectMax) < 0.01)) {
      return [activePreset.photoCropAspect];
    }
    const candidates = [4 / 5, 3 / 4, 2 / 3, 1, 4 / 3, 3 / 2];
    const min = spec.aspectMin ?? 0.4;
    const max = spec.aspectMax ?? 2.5;
    return candidates.filter((value) => value >= min - 0.01 && value <= max + 0.01);
  }, [activePreset]);

  if (!photo.source || !activePreset) {
    return (
      <div className="page">
        <EmptyState
          icon={Images}
          eyebrow="Photo Studio"
          title="No photograph loaded"
          description="Add a photograph first, then position it inside the official crop frame."
          actions={
            <Button variant="primary" onClick={() => navigate(ROUTES.photo)}>
              Go to upload
            </Button>
          }
        />
      </div>
    );
  }

  const reset = () => {
    updatePhotoCrop(defaultCropFor(activePreset, 'photo'));
    pushToast({ tone: 'neutral', title: 'Crop reset', message: 'Zoom, position and rotation restored.' });
  };

  const rotate = (delta: number) => {
    updatePhotoCrop({ rotation: rotateByNinety(photo.crop.rotation, delta) });
  };

  return (
    <div className="studio-page">
      <div className="studio-bar">
        <div className="studio-bar__left">
          <button className="back-link" onClick={() => navigate(ROUTES.photo)}>
            <ArrowLeft size={15} aria-hidden /> Photo Studio
          </button>
          <span className="studio-bar__divider" aria-hidden />
          <h1 className="studio-bar__title">Crop &amp; position</h1>
          <Badge tone="outline">{activePreset.shortName}</Badge>
          <span className="studio-bar__step">Step 2 of 3</span>
        </div>
        <div className="studio-bar__right">
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={reset}>
            Reset
          </Button>
          <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => navigate(ROUTES.photoAdjust)}>
            Continue
          </Button>
        </div>
      </div>

      <div className="studio-layout">
        <section className="canvas-panel" aria-label="Crop canvas">
          <div className="canvas-toolbar">
            <div className="canvas-toolbar__group">
              <span className="canvas-toolbar__label"><Crop size={14} aria-hidden /> Crop frame</span>
              <span className="canvas-toolbar__value">{aspectLabel(photo.crop.aspect)}</span>
              {hasExactDimensions(activePreset.photo.dimensions) && (
                <span className="canvas-toolbar__locked">Fixed by preset</span>
              )}
            </div>
            <div className="canvas-toolbar__group">
              <button className="icon-btn icon-btn--sm" onClick={() => rotate(-90)} aria-label="Rotate left 90 degrees">
                <RotateCcw size={15} />
              </button>
              <button className="icon-btn icon-btn--sm" onClick={() => rotate(90)} aria-label="Rotate right 90 degrees">
                <RotateCw size={15} />
              </button>
              <span className="canvas-toolbar__divider" aria-hidden />
              <button
                className={`chip ${photo.crop.showFaceGuide ? 'is-active' : ''}`}
                onClick={() => updatePhotoCrop({ showFaceGuide: !photo.crop.showFaceGuide })}
                aria-pressed={photo.crop.showFaceGuide}
              >
                <ScanFace size={13} aria-hidden /> Face guide
              </button>
              <button
                className="chip"
                onClick={() => updatePhotoCrop({ offsetX: 0, offsetY: 0, zoom: 1 })}
                title="Centre the image"
              >
                <Grid2X2 size={13} aria-hidden /> Centre
              </button>
            </div>
          </div>

          <CropStage
            image={photo.source}
            crop={photo.crop}
            adjustments={photo.adjustments}
            onChange={updatePhotoCrop}
            guide="photo"
          />

          <div className="canvas-status">
            <span><ShieldCheck size={13} aria-hidden /> Face guide is an overlay only</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>Output {photo.output.width} × {photo.output.height} px</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>{formatLabel(photo.output.format)}</span>
            <span className="canvas-status__spacer" />
            <span>Source {photo.source.width} × {photo.source.height} px</span>
          </div>
        </section>

        <aside className="studio-rail studio-rail--scroll">
          <div className="rail-block">
            <p className="eyebrow">Framing</p>
            <h2 className="rail-block__title">Position the face</h2>
            <p className="rail-block__desc">
              Drag the photograph behind the frame. The eye line should sit near the upper guide and
              the chin near the lower guide.
            </p>

            <div className="ratio-picker" role="group" aria-label="Crop aspect ratio">
              {ratios.map((ratio) => (
                <button
                  key={ratio}
                  className={`ratio ${Math.abs(photo.crop.aspect - ratio) < 0.01 ? 'is-active' : ''}`}
                  onClick={() => updatePhotoCrop({ aspect: ratio })}
                  disabled={ratios.length === 1}
                  aria-pressed={Math.abs(photo.crop.aspect - ratio) < 0.01}
                >
                  <span className="ratio__shape" style={{ aspectRatio: `${ratio}` }} aria-hidden />
                  {aspectLabel(ratio)}
                </button>
              ))}
              {ratios.length === 1 && <span className="ratio-note">Ratio locked by the official specification.</span>}
            </div>

            <Slider
              label="Zoom"
              value={photo.crop.zoom}
              min={1}
              max={3}
              step={0.01}
              onChange={(value) => updatePhotoCrop({ zoom: value })}
              formatValue={(value) => `${value.toFixed(2)}×`}
              hint="Zooming in crops tighter around the face."
            />

            <Slider
              label="Fine rotation"
              value={splitRotation(photo.crop.rotation).fine}
              min={-10}
              max={10}
              step={1}
              onChange={(value) =>
                updatePhotoCrop({ rotation: applyFineRotation(photo.crop.rotation, value) })
              }
              formatValue={(value) => `${value}°`}
              hint="Combines with 90° turns. Use the rotate buttons for 90° steps."
            />

            <Switch
              checked={photo.crop.showFaceGuide}
              onChange={(value) => updatePhotoCrop({ showFaceGuide: value })}
              label="Show face positioning guide"
              description="A visual overlay. Never included in the export."
            />
          </div>

          <div className="rail-block">
            <p className="eyebrow">Output</p>
            <dl className="spec-table spec-table--tight">
              <div><dt>Dimensions</dt><dd>{photo.output.width} × {photo.output.height} px</dd></div>
              <div><dt>Format</dt><dd>{formatLabel(photo.output.format)}</dd></div>
              <div><dt>Size limit</dt><dd>{activePreset.photo.minKB}–{activePreset.photo.maxKB} KB</dd></div>
              <div><dt>Face coverage</dt><dd>{activePreset.photo.notes.some((n) => n.includes('75%')) ? 'At least 75%' : 'Guided, not measured'}</dd></div>
            </dl>
            <div className="check-row">
              <span className="check-row__icon"><Check size={12} strokeWidth={2.6} /></span>
              <span>Crop matches the preset ratio</span>
            </div>
            <div className="check-row">
              <span className="check-row__icon"><Check size={12} strokeWidth={2.6} /></span>
              <span>Image covers the full frame</span>
            </div>
          </div>

          <Notice tone="neutral" icon={Sparkles} title="A guide, not a detector">
            FORMFIT does not run facial recognition. The oval helps you place the head; you stay in
            control of the crop.
          </Notice>

          <div className="rail-actions">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.photo)}>
              Back
            </Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.photoAdjust)}>
              Adjust photo
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
