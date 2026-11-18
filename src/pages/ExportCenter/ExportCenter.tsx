import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Download,
  Images,
  Loader2,
  PenLine,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState, PageIntro } from '../../components/common/EmptyState';
import { ValidationList } from '../../components/common/Feedback';
import { useBlobUrl } from '../../components/editor/CompareSlider';
import { validateImageBlob } from '../../engines/validationEngine';
import { buildFileName, downloadBlob } from '../../engines/exportEngine';
import { bytesToKB, formatBytes, formatLabel } from '../../utils/format';
import type { HistoryRecord, PhotoJob, Preset, SignatureJob, ValidationReport } from '../../types';

type DocKind = 'photo' | 'signature';

export function ExportCenter() {
  const {
    photo,
    signature,
    presets,
    setPhotoResult,
    setSignatureResult,
    navigate,
    recordHistory,
    pushToast,
    setLastExport,
    settings,
  } = useApp();

  const photoPreset = presets.find((item) => item.id === photo.presetId) ?? presets[0];
  const signaturePreset = presets.find((item) => item.id === signature.presetId) ?? presets[0];
  const photoUrl = useBlobUrl(photo.result?.blob ?? null);
  const signatureUrl = useBlobUrl(signature.result?.blob ?? null);
  const validated = useRef<WeakSet<Blob>>(new WeakSet());
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState<DocKind | null>(null);

  const validateDoc = async (kind: DocKind) => {
    const job = kind === 'photo' ? photo : signature;
    const preset = kind === 'photo' ? photoPreset : signaturePreset;
    if (!job.result || !preset) return;
    if (validated.current.has(job.result.blob)) return;
    validated.current.add(job.result.blob);
    const requirement = kind === 'photo' ? preset.photo : preset.signature;
    const report = await validateImageBlob({
      blob: job.result.blob,
      width: job.result.width,
      height: job.result.height,
      format: job.result.format,
      requirement,
    });
    if (kind === 'photo') setPhotoResult(photo.result, report);
    else setSignatureResult(signature.result, report);
  };

  useEffect(() => {
    void validateDoc('photo');
    void validateDoc('signature');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.result?.blob, signature.result?.blob]);

  const revalidateAll = async () => {
    setChecking(true);
    if (photo.result) {
      const report = await runValidation(photo, photoPreset);
      setPhotoResult(photo.result, report);
    }
    if (signature.result) {
      const report = await runValidation(signature, signaturePreset);
      setSignatureResult(signature.result, report);
    }
    setChecking(false);
    pushToast({ tone: 'neutral', title: 'Validation re-run', message: 'Dimensions, format and actual byte size were checked again.' });
  };

  const runValidation = async (
    job: PhotoJob | SignatureJob,
    preset: Preset,
  ): Promise<ValidationReport> => {
    const kind = job === photo ? 'photo' : 'signature';
    const requirement = kind === 'photo' ? preset.photo : preset.signature;
    return validateImageBlob({
      blob: job.result!.blob,
      width: job.result!.width,
      height: job.result!.height,
      format: job.result!.format,
      requirement,
    });
  };

  const makeRecord = (kind: DocKind, job: PhotoJob | SignatureJob, preset: Preset, batch: boolean): HistoryRecord => {
    const report = job.validation;
    return {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      fileName: buildFileName(
        kind,
        preset,
        job.result!.width,
        job.result!.height,
        job.result!.format,
        preset.shortName,
      ),
      presetId: preset.id,
      presetName: preset.shortName,
      organization: preset.organization,
      date: new Date().toISOString(),
      originalBytes: job.source?.sizeBytes ?? 0,
      finalBytes: job.result!.bytes,
      width: job.result!.width,
      height: job.result!.height,
      format: job.result!.format,
      validation: report?.ready ? 'ready' : 'not-ready',
      batch,
      settings: {
        format: job.result!.format,
        width: job.result!.width,
        height: job.result!.height,
        targetKB: job.compression.targetKB,
        mode: job.compression.mode,
      },
    };
  };

  const download = async (kind: DocKind) => {
    const job = kind === 'photo' ? photo : signature;
    const preset = kind === 'photo' ? photoPreset : signaturePreset;
    if (!job.result || !job.source || !preset) return;
    if (!job.validation?.ready) {
      pushToast({
        tone: 'error',
        title: 'File failed validation',
        message: 'Resolve the failed checks in Compression Studio before downloading.',
      });
      return;
    }
    setExporting(kind);
    const record = makeRecord(kind, job, preset, false);
    downloadBlob(job.result.blob, record.fileName);
    await recordHistory(record);
    setLastExport({ kind, fileName: record.fileName, at: record.date });
    setExporting(null);
    pushToast({
      tone: 'success',
      title: 'Download started',
      message: `${record.fileName} · ${bytesToKB(record.finalBytes)} KB. Check it in Downloads.`,
    });
    navigate(ROUTES.exportSuccess);
  };

  const downloadBoth = async () => {
    if (!photo.result && !signature.result) return;
    const records: HistoryRecord[] = [];
    if (photo.result && photo.source && photo.validation?.ready) {
      const record = makeRecord('photo', photo, photoPreset, true);
      downloadBlob(photo.result.blob, record.fileName);
      records.push(record);
    }
    if (signature.result && signature.source && signature.validation?.ready) {
      const record = makeRecord('signature', signature, signaturePreset, true);
      downloadBlob(signature.result.blob, record.fileName);
      records.push(record);
    }
    for (const record of records) await recordHistory(record);
    if (records.length > 0) {
      setLastExport({ kind: records[0].kind, fileName: records[0].fileName, at: records[0].date });
      pushToast({ tone: 'success', title: `${records.length} file${records.length > 1 ? 's' : ''} sent to your browser`, message: 'If Chrome asks about multiple files, tap Allow, then check Downloads.' });
      navigate(ROUTES.exportSuccess);
    }
  };

  const readyCount = [photo, signature].filter((job) => job.validation?.ready).length;
  const pending = [photo, signature].filter((job) => job.result).length;

  return (
    <div className="page">
      <PageIntro
        eyebrow="Export Center"
        title="Check the real files"
        description="Nothing here is a mock-up. Each card shows the encoded Blob, its actual dimensions and its actual byte size."
        meta={
          <Badge tone={readyCount > 0 ? 'success' : 'neutral'} dot>
            {readyCount} of {pending || 2} files ready
          </Badge>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={revalidateAll} loading={checking}>
              Re-run validation
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={downloadBoth}
              disabled={readyCount === 0}
            >
              Download both
            </Button>
          </>
        }
      />

      <div className="export-grid">
        <ExportCard
          kind="photo"
          job={photo}
          preset={photoPreset}
          previewUrl={photoUrl}
          onDownload={() => void download('photo')}
          onEdit={() => navigate(ROUTES.photoAdjust)}
          onCompress={() => navigate(ROUTES.compression)}
          exporting={exporting === 'photo'}
        />
        <ExportCard
          kind="signature"
          job={signature}
          preset={signaturePreset}
          previewUrl={signatureUrl}
          onDownload={() => void download('signature')}
          onEdit={() => navigate(ROUTES.signatureEditor)}
          onCompress={() => navigate(`${ROUTES.compression}?doc=signature`)}
          exporting={exporting === 'signature'}
        />
      </div>

      <div className="export-footer">
        <div className="export-footer__note">
          <ShieldCheck size={16} strokeWidth={1.7} aria-hidden />
          <p>
            Validation compares the file against the requirements stored in the selected preset. It
            does not claim that an examination portal has accepted the image. Confirm the current
            notice before submitting.
          </p>
        </div>
        <div className="export-footer__safety">
          <TriangleAlert size={15} aria-hidden />
          <p>
            A {settings.safetyMarginKB} KB safety margin is applied by default when choosing targets.
            The strict check still uses the preset's real maximum.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExportCard({
  kind,
  job,
  preset,
  previewUrl,
  onDownload,
  onEdit,
  onCompress,
  exporting,
}: {
  kind: DocKind;
  job: PhotoJob | SignatureJob;
  preset: Preset;
  previewUrl: string | null;
  onDownload: () => void;
  onEdit: () => void;
  onCompress: () => void;
  exporting: boolean;
}) {
  const isPhoto = kind === 'photo';
  const requirement = isPhoto ? preset.photo : preset.signature;
  const report = job.validation;
  const fileName = job.result
    ? buildFileName(kind, preset, job.result.width, job.result.height, job.result.format, preset.shortName)
    : null;

  return (
    <section className={`export-card ${report?.ready ? 'is-ready' : ''}`} aria-label={`${isPhoto ? 'Photograph' : 'Signature'} export`}>
      <div className="export-card__head">
        <div className="export-card__identity">
          <span className={`export-card__icon export-card__icon--${kind}`}>
            {isPhoto ? <Images size={18} /> : <PenLine size={18} />}
          </span>
          <div>
            <h2>{isPhoto ? 'Photograph' : 'Signature'}</h2>
            <p>{preset.shortName} · {preset.organization.split('(')[0].trim()}</p>
          </div>
        </div>
        {job.result ? (
          report ? (
            <Badge tone={report.ready ? 'success' : 'error'} icon={report.ready ? Check : CircleAlert}>
              {report.ready ? 'Ready' : 'Not ready'}
            </Badge>
          ) : (
            <Badge tone="accent"><Loader2 size={11} className="spin" aria-hidden /> Checking</Badge>
          )
        ) : (
          <Badge tone="outline">Not prepared</Badge>
        )}
      </div>

      {!job.result || !job.source ? (
        <EmptyState
          icon={isPhoto ? Images : PenLine}
          compact
          title={isPhoto ? 'No finished photograph' : 'No finished signature'}
          description={
            isPhoto
              ? 'Crop, adjust and compress a photograph to see its real file details here.'
              : 'Prepare a signature scan, clean the background and compress it first.'
          }
          actions={
            <Button variant="secondary" size="sm" onClick={() => (isPhoto ? onEdit() : onEdit())}>
              Open {isPhoto ? 'Photo Studio' : 'Signature Studio'}
            </Button>
          }
        />
      ) : (
        <>
          <div className={`export-card__preview ${kind === 'signature' ? 'is-checker' : ''}`}>
            {previewUrl ? (
              <img src={previewUrl} alt={`${isPhoto ? 'Photograph' : 'Signature'} export preview`} />
            ) : (
              <span>Preview unavailable</span>
            )}
            <span className="export-card__dim">{job.result.width} × {job.result.height} px</span>
          </div>

          <dl className="export-meta">
            <div><dt>Actual size</dt><dd>{formatBytes(job.result.bytes)}</dd></div>
            <div><dt>Format</dt><dd>{formatLabel(job.result.format)}</dd></div>
            <div><dt>Preset limit</dt><dd>{requirement.minKB}–{requirement.maxKB} KB</dd></div>
            <div><dt>Filename</dt><dd className="export-meta__file" title={fileName ?? ''}>{fileName}</dd></div>
          </dl>

          <div className="export-checks">
            <p className="eyebrow">Validation</p>
            {report ? (
              <ValidationList report={report} compact />
            ) : (
              <p className="export-checks__pending"><Loader2 size={13} className="spin" aria-hidden /> Decoding the exported Blob…</p>
            )}
          </div>

          <div className="export-card__actions">
            <Button
              variant="primary"
              icon={Download}
              onClick={onDownload}
              loading={exporting}
              disabled={!report || !report.ready}
            >
              Download {isPhoto ? 'photograph' : 'signature'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCompress}>
              Recompress
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
