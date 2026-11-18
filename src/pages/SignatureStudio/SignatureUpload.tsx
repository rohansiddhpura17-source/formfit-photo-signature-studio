import { useState } from 'react';
import {
  ArrowRight,
  Check,
  FileSliders,
  Info,
  PenLine,
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
import { createSampleSignature } from '../../engines/samples';
import { formatBytes, formatLabel } from '../../utils/format';
import { presetOutputSummary, presetSizeOf } from '../../services/presetService';

export function SignatureUpload() {
  const {
    presets,
    signature,
    setSignatureSource,
    setSignaturePreset,
    clearSignature,
    navigate,
    pushToast,
  } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const preset = presets.find((item) => item.id === signature.presetId) ?? presets[0];

  const useSample = async () => {
    setSampleBusy(true);
    setError(null);
    try {
      const image = await createSampleSignature();
      setSignatureSource(image);
      pushToast({
        tone: 'success',
        title: 'Sample signature loaded',
        message: 'Synthetic handwriting on white paper, ready to clean up.',
      });
      navigate(ROUTES.signatureEditor);
    } catch {
      setError('The sample could not be generated. Choose a signature scan instead.');
    } finally {
      setSampleBusy(false);
    }
  };

  const onLoaded = (image: Parameters<typeof setSignatureSource>[0]) => {
    setError(null);
    setSignatureSource(image);
    pushToast({
      tone: 'success',
      title: 'Signature loaded',
      message: `${image.width} × ${image.height} px · ${formatBytes(image.sizeBytes)}`,
    });
    navigate(ROUTES.signatureEditor);
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Signature Studio"
        title="Add your signature"
        description="Scan or photograph your signature on plain white paper. FORMFIT preserves the strokes and never redraws your handwriting."
        actions={
          signature.source ? (
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.signatureEditor)}>
              Continue to editor
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

          {signature.source ? (
            <div className="panel source-panel">
              <div className="source-panel__head">
                <div>
                  <p className="eyebrow">Loaded signature</p>
                  <h2 className="panel__title">Ready to clean up</h2>
                </div>
                <Badge tone="success" icon={Check}>In memory</Badge>
              </div>
              <div className="source-panel__preview source-panel__preview--signature">
                <img src={signature.source.url} alt="Uploaded signature preview" />
              </div>
              <FileChip
                image={signature.source}
                label="Signature"
                onReplaceFile={(next) => {
                  setError(null);
                  setSignatureSource(next);
                  pushToast({
                    tone: 'success',
                    title: 'Signature replaced',
                    message: `${next.width} × ${next.height} px · ${formatBytes(next.sizeBytes)}`,
                  });
                }}
                onError={setError}
                onRemove={() => {
                  clearSignature();
                  setError(null);
                  pushToast({ tone: 'neutral', title: 'Signature removed', message: 'Nothing was saved to disk.' });
                }}
              />
              <div className="source-panel__actions">
                <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.signatureEditor)}>
                  Open editor
                </Button>
              </div>
            </div>
          ) : (
            <UploadZone
              kind="signature"
              onLoaded={onLoaded}
              onError={setError}
              onSample={useSample}
              sampleLabel="Try a sample signature"
              busy={sampleBusy}
            />
          )}

          <div className="upload-notes">
            <div>
              <PenLine size={16} strokeWidth={1.8} aria-hidden />
              <div>
                <p className="upload-notes__title">Capture the real thing</p>
                <p>Sign on unlined white paper with black ink. Photograph it flat, with even light and no shadow across the strokes.</p>
              </div>
            </div>
            <div>
              <ShieldCheck size={16} strokeWidth={1.8} aria-hidden />
              <div>
                <p className="upload-notes__title">No reconstruction</p>
                <p>Background cleanup only affects paper pixels. It does not thin, thicken, smooth or regenerate your handwriting.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="studio-rail">
          <div className="panel rail-panel">
            <div className="rail-panel__head">
              <p className="eyebrow">Target form</p>
              <button className="text-link" onClick={() => navigate(ROUTES.presets)}>Browse all</button>
            </div>
            <Field label="Preset" htmlFor="signature-preset">
              <Select
                id="signature-preset"
                value={signature.presetId}
                onChange={(event) => setSignaturePreset(event.target.value)}
                options={presets.map((item) => ({
                  value: item.id,
                  label: `${item.shortName} — ${item.organization.split('(')[0].trim()}`,
                }))}
              />
            </Field>

            {preset && (
              <div className="rail-preset">
                <div className="rail-preset__top">
                  <div>
                    <h2 className="rail-preset__name">{preset.shortName}</h2>
                    <p className="rail-preset__org">{preset.organization}</p>
                  </div>
                  <VerificationBadge status={preset.verification} />
                </div>
                <dl className="spec-table">
                  <div><dt>Signature</dt><dd>{presetOutputSummary(preset, 'signature')}</dd></div>
                  <div><dt>Size limit</dt><dd>{presetSizeOf(preset, 'signature')}</dd></div>
                  <div><dt>Photograph</dt><dd>{presetOutputSummary(preset, 'photo')}</dd></div>
                  <div><dt>Format</dt><dd>{preset.signature.formats.map(formatLabel).join(', ')}</dd></div>
                </dl>
                <button className="text-link rail-preset__link" onClick={() => navigate(ROUTES.presetDetails(preset.id))}>
                  <FileSliders size={13} aria-hidden /> View full requirements &amp; source
                </button>
              </div>
            )}

            <Notice tone="neutral" icon={Sparkles} title="Signature tips">
              Use the full width of the paper, keep clear space above and below the strokes, and avoid
              capital-letter block signatures where the form asks for a usual signature.
            </Notice>
          </div>

          <div className="panel rail-tip">
            <Info size={16} strokeWidth={1.7} aria-hidden />
            <div>
              <p className="rail-tip__title">Photographed at an angle?</p>
              <p>The crop tool can rotate in 90° steps plus fine rotation, so a slightly tilted scan can still be squared up.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
