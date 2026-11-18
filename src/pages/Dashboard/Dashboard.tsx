import {
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Download,
  FileSliders,
  History,
  ImagePlus,
  Images,
  PenLine,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Badge, VerificationBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageIntro, SectionHead } from '../../components/common/EmptyState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatBytes, formatDate } from '../../utils/format';
import { presetOutputSummary, presetSizeOf } from '../../services/presetService';
import type { Preset } from '../../types';

export function Dashboard() {
  const {
    navigate,
    photo,
    signature,
    presets,
    history,
    activePreset,
    setPhotoPreset,
    setSignaturePreset,
  } = useApp();

  const recent = history.slice(0, 4);
  const hasWork = Boolean(photo.source || signature.source);
  const verified = presets.filter((preset) => preset.verification === 'verified');

  const steps = [
    {
      label: 'Choose a form preset',
      done: Boolean(photo.source || signature.source || history.length),
      path: ROUTES.presets,
      icon: FileSliders,
    },
    {
      label: 'Add your photograph',
      done: Boolean(photo.source),
      path: ROUTES.photo,
      icon: Upload,
    },
    {
      label: 'Crop and position the face',
      done: Boolean(photo.result || photo.validation),
      path: photo.source ? ROUTES.photoCrop : ROUTES.photo,
      icon: Images,
    },
    {
      label: 'Compress and validate',
      done: Boolean(photo.validation?.ready || history.length),
      path: photo.source ? ROUTES.compression : ROUTES.photo,
      icon: Check,
    },
    {
      label: 'Download the finished file',
      done: history.length > 0,
      path: ROUTES.export,
      icon: Download,
    },
  ];
  const completed = steps.filter((step) => step.done).length;

  const usePreset = (preset: Preset, kind: 'photo' | 'signature') => {
    if (kind === 'photo') {
      setPhotoPreset(preset.id);
      navigate(ROUTES.photo);
    } else {
      setSignaturePreset(preset.id);
      navigate(ROUTES.signature);
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Workspace"
        title="What are we preparing today?"
        description="One workspace for the photograph, the signature, the size limit and the final check."
        meta={
          <span className="preset-context">
            <span className="preset-context__label">Active preset</span>
            <span className="preset-context__value">{activePreset?.shortName}</span>
            <Badge tone={activePreset?.verification === 'verified' ? 'success' : 'outline'}>
              {activePreset?.verification === 'verified' ? 'Verified' : 'User preset'}
            </Badge>
          </span>
        }
      />

      {hasWork && (
        <div className="resume-bar">
          <div className="resume-bar__icon">
            <Images size={18} strokeWidth={1.8} aria-hidden />
          </div>
          <div className="resume-bar__text">
            <p className="resume-bar__title">Work in progress</p>
            <p className="resume-bar__body">
              {photo.source ? photo.source.name : 'Signature'} · {activePreset?.name}
            </p>
          </div>
          <div className="resume-bar__progress" aria-hidden>
            {[photo.source, photo.crop.zoom !== 1 || photo.crop.offsetX !== 0, photo.result, photo.validation?.ready].map(
              (done, index) => (
                <span key={index} className={done ? 'is-done' : ''} />
              ),
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconRight={ArrowRight}
            onClick={() =>
              navigate(
                photo.result
                  ? ROUTES.export
                  : photo.source
                    ? ROUTES.photoCrop
                    : ROUTES.photo,
              )
            }
          >
            Continue
          </Button>
        </div>
      )}

      <section className="dash-actions" aria-label="Start a preparation">
        <button className="action-tile action-tile--photo" onClick={() => navigate(ROUTES.photo)}>
          <div className="action-tile__top">
            <span className="action-tile__icon"><ImagePlus size={22} strokeWidth={1.6} /></span>
            <span className="action-tile__index">01</span>
          </div>
          <div className="action-tile__body">
            <h2>Photograph</h2>
            <p>Crop to the official ratio, position the face with the guide, resize and compress under the KB limit.</p>
          </div>
          <div className="action-tile__foot">
            <span className="action-tile__spec">
              {activePreset ? presetOutputSummary(activePreset, 'photo') : '—'} ·{' '}
              {activePreset ? presetSizeOf(activePreset, 'photo') : '—'}
            </span>
            <span className="action-tile__go">Open Photo Studio <ArrowRight size={15} /></span>
          </div>
        </button>

        <button className="action-tile action-tile--signature" onClick={() => navigate(ROUTES.signature)}>
          <div className="action-tile__top">
            <span className="action-tile__icon"><PenLine size={22} strokeWidth={1.6} /></span>
            <span className="action-tile__index">02</span>
          </div>
          <div className="action-tile__body">
            <h2>Signature</h2>
            <p>Preserve the handwriting, clean the paper background, set ink contrast and export the exact size.</p>
          </div>
          <div className="action-tile__foot">
            <span className="action-tile__spec">
              {activePreset ? presetOutputSummary(activePreset, 'signature') : '—'} ·{' '}
              {activePreset ? presetSizeOf(activePreset, 'signature') : '—'}
            </span>
            <span className="action-tile__go">Open Signature Studio <ArrowRight size={15} /></span>
          </div>
        </button>
      </section>

      <div className="dash-grid">
        <div className="dash-main">
          <SectionHead
            eyebrow="Quick access"
            title="Official presets"
            description="Verified against the authority's own notice. Values are never estimated."
            action={
              <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate(ROUTES.presets)}>
                View all
              </Button>
            }
          />
          <div className="mini-presets">
            {verified.map((preset) => (
              <article key={preset.id} className="mini-preset">
                <div className="mini-preset__head">
                  <p className="mini-preset__org">{preset.organization.split('—')[0]}</p>
                  <VerificationBadge status={preset.verification} />
                </div>
                <h3 className="mini-preset__name">{preset.shortName}</h3>
                <dl className="mini-preset__specs">
                  <div>
                    <dt>Photo</dt>
                    <dd>{presetOutputSummary(preset, 'photo')}</dd>
                  </div>
                  <div>
                    <dt>Signature</dt>
                    <dd>{presetOutputSummary(preset, 'signature')}</dd>
                  </div>
                  <div>
                    <dt>Limits</dt>
                    <dd>
                      {preset.photo.maxKB} KB / {preset.signature.maxKB} KB
                    </dd>
                  </div>
                </dl>
                <div className="mini-preset__actions">
                  <button className="text-link" onClick={() => navigate(ROUTES.presetDetails(preset.id))}>
                    Details
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => usePreset(preset, 'photo')}>
                    Use preset
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <SectionHead
            eyebrow="Local record"
            title="Recent activity"
            description="Metadata only — your images are never saved to history."
            action={
              <Button variant="ghost" size="sm" icon={History} onClick={() => navigate(ROUTES.history)}>
                History
              </Button>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={History}
              compact
              title="No exports yet"
              description="Once you download a prepared file, its metadata will appear here. Images themselves stay in memory."
              actions={
                <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.photo)}>
                  Prepare your first photo
                </Button>
              }
            />
          ) : (
            <div className="recent-list">
              {recent.map((record) => (
                <button key={record.id} className="recent-row" onClick={() => navigate(ROUTES.history)}>
                  <span className={`recent-row__kind recent-row__kind--${record.kind}`}>
                    {record.kind === 'photo' ? <Images size={16} /> : <PenLine size={16} />}
                  </span>
                  <span className="recent-row__main">
                    <span className="recent-row__name">{record.fileName}</span>
                    <span className="recent-row__meta">
                      {record.presetName} · {record.width} × {record.height} px · {formatBytes(record.finalBytes)}
                    </span>
                  </span>
                  <span className={`recent-row__status ${record.validation === 'ready' ? 'is-ready' : ''}`}>
                    {record.validation === 'ready' ? 'Ready' : 'Not ready'}
                  </span>
                  <span className="recent-row__date">{formatDate(record.date)}</span>
                  <ChevronRight size={15} className="recent-row__chevron" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="dash-side">
          <div className="panel guide-panel">
            <div className="guide-panel__head">
              <div>
                <p className="eyebrow">Getting started</p>
                <h2 className="panel__title">Your preparation path</h2>
              </div>
              <span className="guide-panel__count">
                {completed}/{steps.length}
              </span>
            </div>
            <ol className="guide-steps">
              {steps.map((step, index) => (
                <li key={step.label} className={step.done ? 'is-done' : ''}>
                  <button onClick={() => navigate(step.path)}>
                    <span className="guide-steps__marker">
                      {step.done ? <Check size={12} strokeWidth={2.6} /> : <Circle size={9} />}
                    </span>
                    <span className="guide-steps__text">
                      <span className="guide-steps__index">Step {index + 1}</span>
                      <span className="guide-steps__label">{step.label}</span>
                    </span>
                    <ChevronRight size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
            <div className="guide-panel__foot">
              <Button variant="primary" size="sm" full iconRight={ArrowRight} onClick={() => navigate(ROUTES.photo)}>
                Start with a photograph
              </Button>
            </div>
          </div>

          <div className="panel privacy-panel">
            <ShieldCheck size={18} strokeWidth={1.7} aria-hidden />
            <div>
              <h3>Nothing leaves this device</h3>
              <p>
                Uploads are decoded in memory. Custom presets and export metadata live in local
                storage. There is no server to send anything to.
              </p>
              <button className="text-link" onClick={() => navigate(ROUTES.settings)}>
                Review privacy settings
              </button>
            </div>
          </div>

          <div className="panel tip-panel">
            <p className="eyebrow">Studio note</p>
            <p>
              The face guide is a positioning aid, not facial recognition. It is never burned into
              the exported photograph.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
