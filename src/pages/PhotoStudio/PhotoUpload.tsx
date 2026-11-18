import { useState } from 'react';
import {
  ArrowRight,
  Check,
  FileSliders,
  Images,
  Info,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge, Notice, VerificationBadge } from '../../components/common/Badge';
import { PageIntro } from '../../components/common/EmptyState';
import { Field, Select } from '../../components/common/Field';
import { FileChip, UploadZone } from '../../components/upload/UploadZone';
import { createSamplePhoto } from '../../engines/samples';
import { formatBytes, formatLabel } from '../../utils/format';
import { presetOutputSummary, presetSizeOf } from '../../services/presetService';

export function PhotoUpload() {
  const {
    presets,
    activePreset,
    photo,
    setPhotoSource,
    setPhotoPreset,
    clearPhoto,
    navigate,
    pushToast,
  } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);

  const useSample = async () => {
    setSampleBusy(true);
    setError(null);
    try {
      const image = await createSamplePhoto();
      setPhotoSource(image);
      pushToast({
        tone: 'success',
        title: 'Sample photograph loaded',
        message: 'A synthetic studio portrait is ready to crop.',
      });
      navigate(ROUTES.photoCrop);
    } catch {
      setError('The sample could not be generated in this browser. Choose a file instead.');
    } finally {
      setSampleBusy(false);
    }
  };

  const onLoaded = (image: Parameters<typeof setPhotoSource>[0]) => {
    setError(null);
    setPhotoSource(image);
    pushToast({
      tone: 'success',
      title: 'Photograph loaded',
      message: `${image.width} × ${image.height} px · ${formatBytes(image.sizeBytes)}`,
    });
    navigate(ROUTES.photoCrop);
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Photo Studio · Step 1 of 3"
        title="Add your photograph"
        description="A clear, recent photograph works best. FORMFIT reads the real file type and never uploads the image anywhere."
        actions={
          photo.source ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.photoCrop)}>
              Continue to crop
            </Button>
          ) : undefined
        }
      />

      <div className="studio-upload-grid">
        <div className="studio-upload-main">
          {error && (
            <Notice tone="error" title="That file could not be used">
              {error}
            </Notice>
          )}

          {photo.source ? (
            <div className="panel source-panel">
              <div className="source-panel__head">
                <div>
                  <p className="eyebrow">Loaded photograph</p>
                  <h2 className="panel__title">Ready to position</h2>
                </div>
                <Badge tone="success" icon={Check}>
                  In memory
                </Badge>
              </div>
              <div className="source-panel__preview">
                <img src={photo.source.url} alt="Uploaded photograph preview" />
              </div>
              <FileChip
                image={photo.source}
                label="Photograph"
                onReplaceFile={(next) => {
                  setError(null);
                  setPhotoSource(next);
                  pushToast({
                    tone: 'success',
                    title: 'Photograph replaced',
                    message: `${next.width} × ${next.height} px · ${formatBytes(next.sizeBytes)}`,
                  });
                }}
                onError={setError}
                onRemove={() => {
                  clearPhoto();
                  setError(null);
                  pushToast({ tone: 'neutral', title: 'Photograph removed', message: 'Nothing was saved to disk.' });
                }}
              />
              <div className="source-panel__actions">
                <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.photoCrop)}>
                  Crop &amp; position
                </Button>
              </div>
            </div>
          ) : (
            <UploadZone
              kind="photo"
              onLoaded={onLoaded}
              onError={setError}
              onSample={useSample}
              sampleLabel="Try a sample portrait"
              busy={sampleBusy}
            />
          )}

          <div className="upload-notes">
            <div>
              <Images size={16} strokeWidth={1.8} aria-hidden />
              <div>
                <p className="upload-notes__title">What makes a good source</p>
                <p>Plain background, even light, full face visible, no heavy filters or beauty retouching.</p>
              </div>
            </div>
            <div>
              <ShieldCheck size={16} strokeWidth={1.8} aria-hidden />
              <div>
                <p className="upload-notes__title">File handling</p>
                <p>
                  JPEG, PNG and WebP are accepted up to 50 MB. The type is checked from the file
                  signature, not the extension. The object URL is released when you replace the image.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="studio-rail">
          <div className="panel rail-panel">
            <div className="rail-panel__head">
              <p className="eyebrow">Target form</p>
              <button className="text-link" onClick={() => navigate(ROUTES.presets)}>
                Browse all
              </button>
            </div>
            <Field label="Preset" htmlFor="photo-preset">
              <Select
                id="photo-preset"
                value={photo.presetId}
                onChange={(event) => setPhotoPreset(event.target.value)}
                options={presets.map((preset) => ({
                  value: preset.id,
                  label: `${preset.shortName} — ${preset.organization.split('(')[0].trim()}`,
                }))}
              />
            </Field>

            {activePreset && (
              <>
                <div className="rail-preset">
                  <div className="rail-preset__top">
                    <div>
                      <h2 className="rail-preset__name">{activePreset.shortName}</h2>
                      <p className="rail-preset__org">{activePreset.organization}</p>
                    </div>
                    <VerificationBadge status={activePreset.verification} />
                  </div>
                  <dl className="spec-table">
                    <div>
                      <dt>Photograph</dt>
                      <dd>{presetOutputSummary(activePreset, 'photo')}</dd>
                    </div>
                    <div>
                      <dt>Photo size</dt>
                      <dd>{presetSizeOf(activePreset, 'photo')}</dd>
                    </div>
                    <div>
                      <dt>Signature</dt>
                      <dd>{presetOutputSummary(activePreset, 'signature')}</dd>
                    </div>
                    <div>
                      <dt>Signature size</dt>
                      <dd>{presetSizeOf(activePreset, 'signature')}</dd>
                    </div>
                    <div>
                      <dt>Format</dt>
                      <dd>{activePreset.photo.formats.map(formatLabel).join(', ')}</dd>
                    </div>
                    {activePreset.verifiedOn && (
                      <div>
                        <dt>Verified</dt>
                        <dd>{activePreset.verifiedOn}</dd>
                      </div>
                    )}
                  </dl>
                  <button className="text-link rail-preset__link" onClick={() => navigate(ROUTES.presetDetails(activePreset.id))}>
                    <FileSliders size={13} aria-hidden /> View full requirements &amp; source
                  </button>
                </div>

                <Notice tone="neutral" icon={ScanFace} title="Face guide, not face detection">
                  The guide is a visual reference for eye line and head position. It is never exported
                  and does not perform facial recognition.
                </Notice>
              </>
            )}
          </div>

          <div className="panel rail-tip">
            <Sparkles size={16} strokeWidth={1.7} aria-hidden />
            <div>
              <p className="rail-tip__title">Phone photo? That is fine.</p>
              <p>
                A 12 MP portrait is more than enough. FORMFIT downsamples to the preset size before
                compressing, so the output stays sharp and small.
              </p>
            </div>
          </div>

          <div className="rail-footnote">
            <Info size={13} aria-hidden />
            Requirements are verified against official sources where available. Always confirm with
            the current notice for your form.
          </div>
        </aside>
      </div>
    </div>
  );
}
