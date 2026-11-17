import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, FileSliders, Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge, VerificationBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatLabel } from '../../utils/format';
import { describeDimensions, hasExactDimensions, hasRangeDimensions } from '../../utils/geometry';

export function PresetDetails({ id }: { id: string }) {
  const { presets, navigate, setPhotoPreset, setSignaturePreset } = useApp();
  const preset = presets.find((item) => item.id === id);

  if (!preset) {
    return (
      <div className="page">
        <EmptyState
          icon={FileSliders}
          eyebrow="Preset Library"
          title="That preset could not be found"
          description="It may have been deleted from this device, or the link is incomplete."
          actions={<Button variant="primary" onClick={() => navigate(ROUTES.presets)}>Back to library</Button>}
        />
      </div>
    );
  }

  const apply = (kind: 'photo' | 'signature') => {
    if (kind === 'photo') {
      setPhotoPreset(preset.id);
      navigate(ROUTES.photo);
    } else {
      setSignaturePreset(preset.id);
      navigate(ROUTES.signature);
    }
  };

  const related = presets.filter((item) => item.id !== preset.id).slice(0, 2);

  return (
    <div className="page preset-detail">
      <button className="back-link" onClick={() => navigate(ROUTES.presets)}>
        <ArrowLeft size={15} aria-hidden /> Preset Library
      </button>

      <header className="preset-hero">
        <div className="preset-hero__main">
          <div className="preset-hero__badges">
            <Badge tone="neutral">{preset.category}</Badge>
            <VerificationBadge status={preset.verification} />
            {preset.verifiedOn && <span className="preset-hero__date">Verified {preset.verifiedOn}</span>}
          </div>
          <h1 className="preset-hero__name">{preset.name}</h1>
          <p className="preset-hero__org">{preset.organization}</p>
        </div>
        <div className="preset-hero__actions">
          <Button variant="secondary" iconRight={ArrowRight} onClick={() => apply('signature')}>
            Apply to signature
          </Button>
          <Button variant="primary" iconRight={ArrowRight} onClick={() => apply('photo')}>
            Apply to photograph
          </Button>
        </div>
      </header>

      <div className="preset-detail-grid">
        <SpecSheet
          kind="photo"
          title="Photograph requirements"
          requirement={preset.photo}
          fixed={preset.photo.dimensionsFixed}
        />
        <SpecSheet
          kind="signature"
          title="Signature requirements"
          requirement={preset.signature}
          fixed={preset.signature.dimensionsFixed}
        />
      </div>

      <div className="preset-detail-lower">
        <section className="panel source-panel-detail">
          <div className="source-panel-detail__head">
            <div>
              <p className="eyebrow">Provenance</p>
              <h2 className="panel__title">Official source</h2>
            </div>
            <ShieldCheck size={18} aria-hidden />
          </div>

          {preset.sourceUrl ? (
            <>
              <p className="source-panel-detail__label">{preset.sourceLabel}</p>
              <a className="source-link" href={preset.sourceUrl} target="_blank" rel="noreferrer noopener">
                {preset.sourceUrl.length > 74 ? `${preset.sourceUrl.slice(0, 74)}…` : preset.sourceUrl}
                <ArrowUpRight size={13} aria-hidden />
              </a>
            </>
          ) : (
            <p className="source-panel-detail__label">No official source was supplied for this user-created preset.</p>
          )}

          {preset.sourceNote && <p className="source-panel-detail__note">{preset.sourceNote}</p>}

          <div className={`source-status source-status--${preset.verification}`}>
            {preset.verification === 'verified' ? (
              <>
                <BadgeCheck size={15} aria-hidden />
                <span>
                  Checked against the authority's published requirements
                  {preset.verifiedOn ? ` on ${preset.verifiedOn}` : ''}. Requirements can change;
                  confirm the current notice before applying.
                </span>
              </>
            ) : (
              <>
                <TriangleAlert size={15} aria-hidden />
                <span>
                  This preset is user-created and not officially verified. The values were entered
                  locally and may not match any authority's requirements.
                </span>
              </>
            )}
          </div>

          <a className="text-link source-panel-detail__open" href={preset.sourceUrl ?? '#'} target="_blank" rel="noreferrer noopener">
            Open official document <ArrowUpRight size={12} aria-hidden />
          </a>
        </section>

        <section className="panel checks-panel">
          <p className="eyebrow">Validation</p>
          <h2 className="panel__title">What FORMFIT will check</h2>
          <ul className="checklist checklist--numbered">
            <li><span>01</span> The decoded pixel dimensions of the exported file.</li>
            <li><span>02</span> The actual encoded Blob size in bytes, not an estimate.</li>
            <li><span>03</span> The real MIME type produced by the browser encoder.</li>
            <li><span>04</span> That the file still decodes as a valid image.</li>
            <li><span>05</span> The aspect ratio, where the authority specifies one.</li>
          </ul>
          <div className="info-row">
            <Info size={14} aria-hidden />
            <span>
              FORMFIT cannot verify whether a portal will accept your file. It only checks the rules
              encoded in this preset.
            </span>
          </div>
        </section>
      </div>

      <section className="preset-related">
        <div className="preset-section__head">
          <div>
            <p className="eyebrow">Continue exploring</p>
            <h2 className="section-title">Other presets</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.presets)}>
            View library
          </Button>
        </div>
        <div className="preset-related__grid">
          {related.map((item) => (
            <button key={item.id} className="related-card" onClick={() => navigate(ROUTES.presetDetails(item.id))}>
              <div>
                <p className="related-card__org">{item.organization.split('(')[0].trim()}</p>
                <h3>{item.shortName}</h3>
              </div>
              <ArrowUpRight size={16} aria-hidden />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SpecSheet({
  kind,
  title,
  requirement,
  fixed,
}: {
  kind: 'photo' | 'signature';
  title: string;
  requirement: import('../../types').ImageRequirement;
  fixed: boolean;
}) {
  const spec = requirement.dimensions;
  const exact = hasExactDimensions(spec);
  const range = hasRangeDimensions(spec);

  return (
    <section className="panel spec-sheet">
      <div className="spec-sheet__head">
        <div>
          <p className="eyebrow">{kind === 'photo' ? 'Image A' : 'Image B'}</p>
          <h2 className="panel__title">{title}</h2>
        </div>
        <Badge tone={fixed ? 'accent' : 'outline'}>{fixed ? 'Fixed size' : 'Flexible size'}</Badge>
      </div>

      <div className="spec-sheet__hero">
        <span className="spec-sheet__big">{describeDimensions(spec, fixed)}</span>
        <span className="spec-sheet__sub">
          {exact ? 'Exact pixel dimensions' : range ? 'Allowed pixel range' : 'No pixel dimensions specified'}
        </span>
      </div>

      <dl className="spec-table">
        <div><dt>File size</dt><dd>{requirement.minKB}–{requirement.maxKB} KB</dd></div>
        <div><dt>Formats</dt><dd>{requirement.formats.map(formatLabel).join(', ')}</dd></div>
        {spec.aspectMin !== undefined && spec.aspectMax !== undefined && (
          <div>
            <dt>Aspect ratio</dt>
            <dd>{spec.aspectMin.toFixed(2)}–{spec.aspectMax.toFixed(2)} (w ÷ h)</dd>
          </div>
        )}
        <div><dt>Strict limit</dt><dd>Output must be below {requirement.maxKB} KB</dd></div>
      </dl>

      <div className="spec-sheet__notes">
        <p className="eyebrow">Authority notes</p>
        <ul>
          {requirement.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
