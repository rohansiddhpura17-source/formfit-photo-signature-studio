import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Columns2,
  Gauge,
  ImageDown,
  Info,
  Loader2,
  PenLine,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge, Notice } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { NumberInput, Select } from '../../components/common/Field';
import { ProgressBar, Segmented, Slider, Switch } from '../../components/common/Feedback';
import { RenderedPreview } from '../../components/editor/RenderedPreview';
import { useBlobUrl } from '../../components/editor/CompareSlider';
import { SizeMeter } from '../../components/compression/SizeMeter';
import { compressCanvas, CompressionError, validateCompressionSettings } from '../../engines/compressionEngine';
import { renderCrop } from '../../engines/imageCropper';
import { bytesToKB, formatBytes, formatLabel } from '../../utils/format';
import type { CompressionMode, CompressionResult, OutputFormat } from '../../types';

type Status = 'idle' | 'running' | 'done' | 'error';

const MODES: Array<{ value: CompressionMode; label: string; hint: string }> = [
  { value: 'auto', label: 'Automatic', hint: 'Best quality under the limit' },
  { value: 'balanced', label: 'Balanced', hint: 'Keeps quality above 62%' },
  { value: 'maximum', label: 'Maximum', hint: 'Smallest file, may downscale' },
  { value: 'manual', label: 'Manual', hint: 'Encode at your chosen quality' },
];

export function CompressionStudio() {
  const {
    route,
    photo,
    signature,
    presets,
    setPhotoResult,
    setSignatureResult,
    updatePhotoCompression,
    updateSignatureCompression,
    updateSignatureSettings,
    navigate,
    pushToast,
  } = useApp();

  const isSignature = route.query.get('doc') === 'signature';
  const job = isSignature ? signature : photo;
  const preset = presets.find((item) => item.id === job.presetId) ?? presets[0];
  const requirement = preset ? (isSignature ? preset.signature : preset.photo) : null;

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);
  const runID = useRef(0);
  const result = job.result;
  const previewUrl = useBlobUrl(result?.blob ?? null);

  const transparent =
    isSignature && signature.transparent && job.output.format !== 'image/jpeg';

  useEffect(() => {
    if (!job.source) {
      setCanvas(null);
      return;
    }
    const next = document.createElement('canvas');
    try {
      renderCrop(next, {
        image: job.source.image,
        crop: job.crop,
        width: job.output.width,
        height: job.output.height,
        adjustments: job.adjustments,
        background: '#FFFFFF',
        transparent,
        inkThreshold: signature.inkThreshold,
      });
      setCanvas(next);
    } catch {
      setError('The crop could not be rendered. Return to the editor and try again.');
      setStatus('error');
    }
  }, [
    job.source,
    job.crop,
    job.adjustments,
    job.output.width,
    job.output.height,
    job.output.format,
    transparent,
    signature.inkThreshold,
  ]);

  const compressionKey = `${job.compression.targetKB}|${job.compression.format}|${job.compression.mode}|${job.compression.quality}|${job.compression.allowDownscale}|${preset?.id}|${runKey}`;

  useEffect(() => {
    if (!canvas || !requirement || !preset) return;
    const validationError = validateCompressionSettings(job.compression);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }
    const id = ++runID.current;
    let cancelled = false;
    setStatus('running');
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const output = await compressCanvas(canvas, job.compression, requirement);
        if (cancelled || runID.current !== id) return;
        if (isSignature) setSignatureResult(output, null);
        else setPhotoResult(output, null);
        setStatus('done');
      } catch (cause) {
        if (cancelled || runID.current !== id) return;
        setError(
          cause instanceof CompressionError
            ? cause.message
            : 'Compression failed in this browser. Try another format or target size.',
        );
        setStatus('error');
      }
    }, 320);

    return () => {
      cancelled = true;
      runID.current += 1;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, compressionKey, isSignature, requirement, preset]);

  if (!job.source || !preset || !requirement) {
    return (
      <div className="page">
        <EmptyState
          icon={isSignature ? PenLine : Gauge}
          eyebrow="Compression Studio"
          title={isSignature ? 'No signature to compress' : 'No photograph to compress'}
          description="Compression works on a real prepared image. Add one in the studio first."
          actions={
            <Button variant="primary" onClick={() => navigate(isSignature ? ROUTES.signature : ROUTES.photo)}>
              Open {isSignature ? 'Signature Studio' : 'Photo Studio'}
            </Button>
          }
        />
      </div>
    );
  }

  const update = (patch: Partial<typeof job.compression>) => {
    if (isSignature) updateSignatureCompression(patch);
    else updatePhotoCompression(patch);
  };

  const outputKB = result ? bytesToKB(result.bytes) : null;
  const reduction = result ? Math.max(0, Math.round(((job.source.sizeBytes - result.bytes) / job.source.sizeBytes) * 100)) : 0;
  const targetOver = job.compression.targetKB > requirement.maxKB;
  const targetUnder = job.compression.targetKB < requirement.minKB;

  const setFormat = (format: OutputFormat) => {
    update({ format });
    if (isSignature && format === 'image/jpeg' && signature.transparent) {
      updateSignatureSettings({ transparent: false });
    }
  };

  // Same wording as Compare and Export: 'Target met' means under the
  // maximum AND at least the minimum. Under the maximum but below the
  // minimum is a warning, not a success and not a failure.
  const belowMin = result ? result.bytes < requirement.minKB * 1024 : false;
  const resultBadge = result
    ? !result.targetMet
      ? { tone: 'warning' as const, label: 'Needs attention' }
      : belowMin
        ? { tone: 'warning' as const, label: 'Under limit · below minimum' }
        : { tone: 'success' as const, label: 'Target met' }
    : null;

  return (
    <div className="studio-page">
      <div className="studio-bar">
        <div className="studio-bar__left">
          <button
            className="back-link"
            onClick={() => navigate(isSignature ? ROUTES.signatureEditor : ROUTES.photoAdjust)}
          >
            <ArrowLeft size={15} aria-hidden /> {isSignature ? 'Signature editor' : 'Adjust'}
          </button>
          <span className="studio-bar__divider" aria-hidden />
          <h1 className="studio-bar__title">Compression Studio</h1>
          <Badge tone="outline">{preset.shortName}</Badge>
          <Segmented
            label="Document type"
            size="sm"
            value={isSignature ? 'signature' : 'photo'}
            onChange={(value) => navigate(`${ROUTES.compression}${value === 'signature' ? '?doc=signature' : ''}`)}
            options={[
              { value: 'photo', label: 'Photograph' },
              { value: 'signature', label: 'Signature' },
            ]}
          />
        </div>
        <div className="studio-bar__right">
          <Button
            variant="ghost"
            size="sm"
            icon={Columns2}
            onClick={() => navigate(`${ROUTES.compare}${isSignature ? '?doc=signature' : ''}`)}
            disabled={!result}
          >
            Compare
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconRight={ArrowRight}
            onClick={() => navigate(ROUTES.export)}
            disabled={!result}
          >
            Continue to export
          </Button>
        </div>
      </div>

      <div className="studio-layout">
        <section className="canvas-panel" aria-label="Compression preview">
          <div className="canvas-toolbar">
            <div className="canvas-toolbar__group">
              <span className="canvas-toolbar__label"><Gauge size={14} aria-hidden /> Compressed output</span>
              {resultBadge && <Badge tone={resultBadge.tone}>{resultBadge.label}</Badge>}
            </div>
            <div className="canvas-toolbar__group">
              <span className="canvas-toolbar__value">
                {result ? `${result.width} × ${result.height} px · ${formatLabel(result.format)}` : 'Preparing…'}
              </span>
            </div>
          </div>

          <div className={`compression-stage ${transparent ? 'is-checker' : ''}`}>
            {previewUrl ? (
              <img src={previewUrl} alt="Compressed output preview" />
            ) : (
              <RenderedPreview
                image={job.source}
                crop={job.crop}
                adjustments={job.adjustments}
                aspect={job.crop.aspect}
                transparent={transparent}
                inkThreshold={signature.inkThreshold}
              />
            )}
            {status === 'running' && (
              <div className="compression-stage__busy" role="status">
                <Loader2 size={18} className="spin" aria-hidden />
                <span>Encoding and measuring the actual file…</span>
              </div>
            )}
          </div>

          <div className="compression-stats">
            <div className="compression-stat">
              <span className="compression-stat__label">Original</span>
              <span className="compression-stat__value">{formatBytes(job.source.sizeBytes)}</span>
            </div>
            <div className="compression-stat">
              <span className="compression-stat__label">Target</span>
              <span className="compression-stat__value">{job.compression.targetKB} KB</span>
            </div>
            <div className="compression-stat compression-stat--accent">
              <span className="compression-stat__label">Actual output</span>
              <span className="compression-stat__value">{result ? `${outputKB} KB` : '—'}</span>
            </div>
            <div className="compression-stat">
              <span className="compression-stat__label">Reduction</span>
              <span className="compression-stat__value">{result ? `${reduction}%` : '—'}</span>
            </div>
            <div className="compression-stat">
              <span className="compression-stat__label">Quality</span>
              <span className="compression-stat__value">{result ? `${Math.round(result.quality * 100)}%` : '—'}</span>
            </div>
            <div className="compression-stat">
              <span className="compression-stat__label">Attempts</span>
              <span className="compression-stat__value">{result ? result.attempts : '—'}</span>
            </div>
          </div>

          <div className="compression-meter-wrap">
            <SizeMeter
              minKB={requirement.minKB}
              maxKB={requirement.maxKB}
              targetKB={job.compression.targetKB}
              actualKB={outputKB ?? undefined}
              showActual={Boolean(result)}
            />
            <p className="compression-meter-note">
              <Info size={13} aria-hidden /> 1 KB = 1024 bytes. The file must be strictly below
              {requirement.maxKB} KB. Below {requirement.minKB} KB is a warning, not a failure — some
              portals reject files that are too small.
            </p>
          </div>

          <div className="canvas-status">
            <span>{isSignature ? <PenLine size={13} aria-hidden /> : <ImageDown size={13} aria-hidden />} {isSignature ? 'Signature' : 'Photograph'}</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>Preset {preset.shortName}</span>
            <span className="canvas-status__dot" aria-hidden />
            <span>{result?.downscaled ? 'Dimensions reduced to hit the target' : 'Preset dimensions preserved'}</span>
            <span className="canvas-status__spacer" />
            <span>{result ? `${result.durationMs} ms` : '—'}</span>
          </div>
        </section>

        <aside className="studio-rail studio-rail--scroll">
          {error && (
            <Notice tone="error" title="Compression could not finish">
              {error}
            </Notice>
          )}

          {result && !result.targetMet && (
            <Notice tone="warning" title="Target not reached">
              {result.note ?? 'The smallest achievable file is still above the target.'} Try a smaller
              output size, enable dimension reduction, or switch to WebP where the preset allows it.
            </Notice>
          )}

          {result && result.targetMet && result.bytes < requirement.minKB * 1024 && (
            <Notice tone="warning" title="Below the minimum size">
              The file is under {requirement.minKB} KB. Some portals reject files that are too small;
              raise the target or use a larger source.
            </Notice>
          )}

          {targetOver && (
            <Notice tone="warning" title="Target is above the maximum">
              This preset allows at most {requirement.maxKB} KB. Validation will fail unless the target
              is lowered.
            </Notice>
          )}
          {targetUnder && (
            <Notice tone="warning" title="Target is below the minimum">
              This preset requires at least {requirement.minKB} KB.
            </Notice>
          )}

          <div className="rail-block">
            <p className="eyebrow">Target</p>
            <div className="target-row">
              <NumberInput
                value={job.compression.targetKB}
                min={2}
                max={10240}
                suffix="KB"
                onChange={(event) => update({ targetKB: Number(event.target.value) || 1 })}
                aria-label="Target file size in KB"
              />
              <div className="target-quick">
                {[1, 2, 5].map((margin) => (
                  <button
                    key={margin}
                    className="chip"
                    onClick={() => update({ targetKB: Math.max(2, requirement.maxKB - margin) })}
                  >
                    Max − {margin}
                  </button>
                ))}
              </div>
            </div>
            <p className="field__hint">
              Official limit: {requirement.minKB}–{requirement.maxKB} KB. A small margin protects
              against portal-side rounding.
            </p>

            <div className="field" style={{ marginTop: 14 }}>
              <label className="field__label" htmlFor="compression-format">Output format</label>
              <Select
                id="compression-format"
                value={job.compression.format}
                onChange={(event) => setFormat(event.target.value as OutputFormat)}
                options={(['image/jpeg', 'image/png', 'image/webp'] as OutputFormat[]).map((format) => ({
                  value: format,
                  label: `${formatLabel(format)}${requirement.formats.includes(format) ? ' · accepted' : ' · not accepted by preset'}`,
                }))}
              />
              {job.compression.format === 'image/png' && (
                <p className="field__hint">
                  PNG is lossless. The browser exposes no quality control, so only dimension reduction
                  can lower the size.
                </p>
              )}
            </div>
          </div>

          <div className="rail-block">
            <p className="eyebrow">Mode</p>
            <div className="mode-grid" role="group" aria-label="Compression mode">
              {MODES.map((mode) => (
                <button
                  key={mode.value}
                  className={`mode ${job.compression.mode === mode.value ? 'is-active' : ''}`}
                  onClick={() => update({ mode: mode.value })}
                  aria-pressed={job.compression.mode === mode.value}
                >
                  <span className="mode__label">{mode.label}</span>
                  <span className="mode__hint">{mode.hint}</span>
                </button>
              ))}
            </div>

            {job.compression.mode === 'manual' && (
              <Slider
                label="Encoding quality"
                value={Math.round(job.compression.quality * 100)}
                min={5}
                max={99}
                step={1}
                onChange={(value) => update({ quality: value / 100 })}
                formatValue={(value) => `${value}%`}
                hint="Manual mode encodes once. It will not silently lower quality to hit the target."
              />
            )}

            <Switch
              checked={job.compression.allowDownscale}
              onChange={(value) => update({ allowDownscale: value })}
              label="Allow dimension reduction"
              description="If quality alone cannot fit, shrink the image in 10% steps. You will be told when this happens."
              disabled={job.compression.mode === 'balanced'}
            />
            {job.compression.mode === 'balanced' && (
              <p className="field__hint">Balanced mode protects dimensions. Use Automatic or Maximum to allow shrinking.</p>
            )}
          </div>

          <div className="rail-block rail-block--result">
            <div className="rail-result-head">
              <div>
                <p className="eyebrow">Result</p>
                <h2 className="rail-block__title">{result ? `${outputKB} KB` : 'Waiting for a result'}</h2>
              </div>
              {status === 'running' ? (
                <Badge tone="accent"><Loader2 size={11} className="spin" aria-hidden /> Encoding</Badge>
              ) : result ? (
                <Badge tone={result.targetMet ? 'success' : 'error'} icon={result.targetMet ? Check : CircleAlert}>
                  {result.targetMet ? 'Under limit' : 'Over limit'}
                </Badge>
              ) : (
                <Badge tone="outline">Idle</Badge>
              )}
            </div>

            {status === 'running' && <ProgressBar value={0} indeterminate label="Compressing" />}

            {result && (
              <dl className="spec-table spec-table--tight">
                <div><dt>Encoded size</dt><dd>{formatBytes(result.bytes)}</dd></div>
                <div><dt>Dimensions</dt><dd>{result.width} × {result.height} px</dd></div>
                <div><dt>Format</dt><dd>{formatLabel(result.format)}</dd></div>
                <div><dt>Quality</dt><dd>{Math.round(result.quality * 100)}%</dd></div>
                <div><dt>Attempts</dt><dd>{result.attempts}</dd></div>
                <div><dt>Downscaled</dt><dd>{result.downscaled ? 'Yes' : 'No'}</dd></div>
              </dl>
            )}

            {result?.note && <p className="rail-result-note">{result.note}</p>}

            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              full
              loading={status === 'running'}
              onClick={() => setRunKey((key) => key + 1)}
            >
              Run compression again
            </Button>
          </div>

          <div className="rail-actions">
            <Button
              variant="secondary"
              icon={Columns2}
              onClick={() => navigate(`${ROUTES.compare}${isSignature ? '?doc=signature' : ''}`)}
              disabled={!result}
            >
              Compare
            </Button>
            <Button
              variant="primary"
              iconRight={ArrowRight}
              onClick={() => {
                if (result) {
                  pushToast({
                    tone: 'success',
                    title: 'Compressed file ready',
                    message: `${outputKB} KB · ${formatLabel(result.format)} · ${result.width} × ${result.height} px`,
                  });
                  navigate(ROUTES.export);
                }
              }}
              disabled={!result}
            >
              Use this file
            </Button>
          </div>

          <div className="rail-footnote">
            <Sparkles size={13} aria-hidden />
            Every size shown here is read from the encoded Blob, not estimated from the source.
          </div>
        </aside>
      </div>
    </div>
  );
}
