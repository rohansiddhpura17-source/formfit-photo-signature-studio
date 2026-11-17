import { ArrowRight, Check, Download, History, Images, PenLine, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ValidationList } from '../../components/common/Feedback';
import { useBlobUrl } from '../../components/editor/CompareSlider';
import { buildFileName, downloadBlob } from '../../engines/exportEngine';
import { formatBytes, formatLabel } from '../../utils/format';
import type { HistoryRecord } from '../../types';

export function ExportSuccess() {
  const { lastExport, photo, signature, presets, history, navigate, pushToast, recordHistory, setLastExport } = useApp();
  const photoPreset = presets.find((item) => item.id === photo.presetId) ?? presets[0];
  const signaturePreset = presets.find((item) => item.id === signature.presetId) ?? presets[0];
  const photoUrl = useBlobUrl(photo.result?.blob ?? null);
  const signatureUrl = useBlobUrl(signature.result?.blob ?? null);
  const exportedKind = lastExport?.kind ?? 'photo';
  const exportedJob = exportedKind === 'photo' ? photo : signature;

  if (!lastExport) {
    return (
      <div className="page">
        <EmptyState
          icon={Download}
          eyebrow="Export complete"
          title="No export has happened yet"
          description="This screen only appears after a real file has been downloaded. Prepare and export an image first."
          actions={<Button variant="primary" onClick={() => navigate(ROUTES.photo)}>Prepare a photograph</Button>}
        />
      </div>
    );
  }

  const redownload = async (kind: 'photo' | 'signature') => {
    const job = kind === 'photo' ? photo : signature;
    const preset = kind === 'photo' ? photoPreset : signaturePreset;
    if (!job.result) return;
    const name = buildFileName(kind, preset, job.result.width, job.result.height, job.result.format, preset.shortName);
    downloadBlob(job.result.blob, name);
    // A single re-download is not a batch: record it so the card can
    // honestly say "Downloaded" afterwards.
    const record: HistoryRecord = {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      fileName: name,
      presetId: preset.id,
      presetName: preset.shortName,
      organization: preset.organization,
      date: new Date().toISOString(),
      originalBytes: job.source?.sizeBytes ?? 0,
      finalBytes: job.result.bytes,
      width: job.result.width,
      height: job.result.height,
      format: job.result.format,
      validation: job.validation?.ready ? 'ready' : 'not-ready',
      settings: {
        format: job.result.format,
        width: job.result.width,
        height: job.result.height,
        targetKB: job.compression.targetKB,
        mode: job.compression.mode,
      },
      batch: false,
    };
    await recordHistory(record);
    setLastExport({ kind, fileName: name, at: record.date });
    pushToast({ tone: 'success', title: 'Download started', message: name });
  };

  // A badge must never claim more than the app can know. A History record
  // is written when a download is *started*. A single download lands
  // straight away, so its card earns "Downloaded". A file sent as part of
  // a multi-file batch may still be held behind the browser's permission
  // prompt, so its card says "Download started" until a later single
  // download of the same file upgrades the newest record.
  const cards = [
    { kind: 'photo' as const, job: photo, preset: photoPreset, url: photoUrl, icon: Images, label: 'Photograph' },
    { kind: 'signature' as const, job: signature, preset: signaturePreset, url: signatureUrl, icon: PenLine, label: 'Signature' },
  ].map((card) => {
    const fileName = card.job.result
      ? buildFileName(card.kind, card.preset, card.job.result.width, card.job.result.height, card.job.result.format, card.preset.shortName)
      : null;
    // History is newest-first, so the first match is the latest download.
    const record = fileName
      ? history.find((item) => item.kind === card.kind && item.fileName === fileName)
      : undefined;
    return {
      ...card,
      fileName,
      downloaded: record !== undefined && record.batch !== true,
      started: record !== undefined && record.batch === true,
    };
  });
  const anyStarted = cards.some((card) => card.started);

  return (
    <div className="success-page">
      <div className="success-hero">
        <div className="success-mark" aria-hidden>
          <span className="success-mark__ring" />
          <span className="success-mark__ring success-mark__ring--2" />
          <Check size={28} strokeWidth={2.4} />
        </div>
        <p className="eyebrow">Export complete</p>
        <h1 className="success-title">Your file left the studio.</h1>
        <p className="success-lede">
          {lastExport.fileName} was created on this device and handed to your browser. FORMFIT keeps no
          copy of the image.
        </p>
        <div className="success-badges">
          {anyStarted ? (
            <Badge tone="neutral" icon={ShieldCheck}>Sent to your browser</Badge>
          ) : (
            <Badge tone="success" icon={Check}>Real file downloaded</Badge>
          )}
          <Badge tone="neutral" icon={ShieldCheck}>Processed locally</Badge>
          {exportedJob.validation?.ready && (
            exportedJob.validation.checks.some((check) => check.status === 'warn') ? (
              <Badge tone="warning" icon={Check}>Validation passed with a warning</Badge>
            ) : (
              <Badge tone="success" icon={Check}>Validation passed</Badge>
            )
          )}
        </div>
        {anyStarted && (
          <p className="success-lede">
            Chrome may ask permission for the second file. Tap Allow, then confirm both files in your
            Downloads folder before submitting.
          </p>
        )}
      </div>

      <div className="success-grid">
        {cards.map(({ kind, job, preset, url, icon: Icon, label, downloaded, started }) => (
          <article key={kind} className={`success-card ${job.result ? 'is-ready' : ''}`}>
            <div className="success-card__head">
              <span className="success-card__icon"><Icon size={17} /></span>
              <div>
                <h2>{label}</h2>
                <p>{preset.shortName}</p>
              </div>
              {!job.result ? (
                <Badge tone="outline">Not prepared</Badge>
              ) : downloaded ? (
                <Badge tone="success">Downloaded</Badge>
              ) : started ? (
                <Badge tone="neutral">Download started</Badge>
              ) : (
                <Badge tone="outline">Prepared — not downloaded yet</Badge>
              )}
            </div>
            {job.result && (
              <>
                <div className={`success-card__preview ${kind === 'signature' ? 'is-checker' : ''}`}>
                  {url && <img src={url} alt={`${label} preview`} />}
                </div>
                <dl className="export-meta">
                  <div><dt>Dimensions</dt><dd>{job.result.width} × {job.result.height} px</dd></div>
                  <div><dt>Format</dt><dd>{formatLabel(job.result.format)}</dd></div>
                  <div><dt>Actual size</dt><dd>{formatBytes(job.result.bytes)}</dd></div>
                </dl>
                <Button variant="secondary" size="sm" icon={Download} onClick={() => redownload(kind)}>
                  {downloaded ? 'Download again' : 'Download'}
                </Button>
              </>
            )}
          </article>
        ))}
      </div>

      <div className="success-lower">
        <div className="panel">
          <p className="eyebrow">Validation summary</p>
          <h2 className="panel__title">{exportedKind === 'photo' ? 'Photograph' : 'Signature'} checks</h2>
          {exportedJob.validation ? (
            <ValidationList report={exportedJob.validation} />
          ) : (
            <p className="field__hint">This file was downloaded without a completed validation report.</p>
          )}
        </div>

        <div className="panel success-next">
          <p className="eyebrow">Next</p>
          <h2 className="panel__title">Before you submit</h2>
          <ol className="success-next__list">
            <li><span>01</span> Open the downloaded file on your device and confirm it looks correct.</li>
            <li><span>02</span> Check the dimensions and KB value in your file manager.</li>
            <li><span>03</span> Upload it to the official portal and review their preview.</li>
          </ol>
          <p className="success-next__note">
            <Sparkles size={13} aria-hidden /> FORMFIT validates against the preset, not the portal.
            Acceptance is always the authority's decision.
          </p>
        </div>
      </div>

      <div className="success-actions">
        <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.dashboard)}>
          Return to dashboard
        </Button>
        <Button variant="ghost" onClick={() => navigate(ROUTES.photo)}>Prepare another</Button>
        <Button variant="ghost" icon={History} onClick={() => navigate(ROUTES.history)}>View history</Button>
      </div>
    </div>
  );
}
