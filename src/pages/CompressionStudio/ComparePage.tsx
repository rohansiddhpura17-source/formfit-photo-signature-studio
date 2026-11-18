import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Gauge, Images, Info, PenLine } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageIntro } from '../../components/common/EmptyState';
import { CompareSlider, useBlobUrl } from '../../components/editor/CompareSlider';
import { renderCrop } from '../../engines/imageCropper';
import { bytesToKB, formatBytes, formatLabel } from '../../utils/format';

export function ComparePage() {
  const { route, photo, signature, presets, navigate } = useApp();
  const isSignature = route.query.get('doc') === 'signature';
  const job = isSignature ? signature : photo;
  const preset = presets.find((item) => item.id === job.presetId) ?? presets[0];
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const afterUrl = useBlobUrl(job.result?.blob ?? null);

  useEffect(() => {
    if (!job.source) return;
    const canvas = document.createElement('canvas');
    renderCrop(canvas, {
      image: job.source.image,
      crop: job.crop,
      width: job.output.width,
      height: job.output.height,
      adjustments: job.adjustments,
      background: '#FFFFFF',
      transparent: isSignature && signature.transparent && job.output.format !== 'image/jpeg',
      inkThreshold: signature.inkThreshold,
    });
    setBeforeUrl(canvas.toDataURL('image/png'));
  }, [job.source, job.crop, job.adjustments, job.output.width, job.output.height, job.output.format, isSignature, signature.transparent, signature.inkThreshold]);

  if (!job.source || !job.result) {
    return (
      <div className="page">
        <EmptyState
          icon={Gauge}
          eyebrow="Before & after"
          title="No compressed file to compare"
          description="Compress a prepared image first. The comparison uses the actual encoded file, not a preview."
          actions={
            <Button variant="primary" onClick={() => navigate(`${ROUTES.compression}${isSignature ? '?doc=signature' : ''}`)}>
              Open Compression Studio
            </Button>
          }
        />
      </div>
    );
  }

  const reduction = Math.max(0, Math.round(((job.source.sizeBytes - job.result.bytes) / job.source.sizeBytes) * 100));

  const requirement = isSignature ? preset?.signature : preset?.photo;
  const belowMin = requirement ? job.result.bytes < requirement.minKB * 1024 : false;

  return (
    <div className="page">
      <PageIntro
        eyebrow="Compression Studio · Review"
        title="Inspect the compression"
        description="Drag the divider to compare the uncompressed render with the actual encoded file. Both are shown at the export dimensions."
        meta={
          <Badge tone={!job.result.targetMet || belowMin ? 'error' : 'success'}>
            {!job.result.targetMet ? 'Over target' : belowMin ? 'Below minimum' : 'Target met'}
          </Badge>
        }
        actions={
          <>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(`${ROUTES.compression}${isSignature ? '?doc=signature' : ''}`)}>
              Back to compression
            </Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate(ROUTES.export)}>
              Continue to export
            </Button>
          </>
        }
      />

      <div className="compare-layout">
        <section className="panel compare-panel">
          <CompareSlider
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            beforeLabel="Uncompressed render"
            afterLabel={`${formatLabel(job.result.format)} · ${bytesToKB(job.result.bytes)} KB`}
            aspect={job.crop.aspect}
          />
          <div className="compare-caption">
            <span>{isSignature ? <PenLine size={13} aria-hidden /> : <Images size={13} aria-hidden />} {preset?.shortName}</span>
            <span aria-hidden>·</span>
            <span>{job.result.width} × {job.result.height} px</span>
            <span aria-hidden>·</span>
            <span>Quality {Math.round(job.result.quality * 100)}%</span>
            <span className="compare-caption__spacer" />
            <span>Encoded {formatLabel(job.result.format)}</span>
          </div>
        </section>

        <aside className="compare-side">
          <div className="panel">
            <p className="eyebrow">File facts</p>
            <dl className="spec-table">
              <div><dt>Original file</dt><dd>{formatBytes(job.source.sizeBytes)}</dd></div>
              <div><dt>Final file</dt><dd>{formatBytes(job.result.bytes)}</dd></div>
              <div><dt>Reduction</dt><dd>{reduction}%</dd></div>
              <div><dt>Dimensions</dt><dd>{job.result.width} × {job.result.height} px</dd></div>
              <div><dt>Format</dt><dd>{formatLabel(job.result.format)}</dd></div>
              <div><dt>Quality</dt><dd>{Math.round(job.result.quality * 100)}%</dd></div>
              <div><dt>Attempts</dt><dd>{job.result.attempts}</dd></div>
              <div><dt>Downscaled</dt><dd>{job.result.downscaled ? 'Yes' : 'No'}</dd></div>
            </dl>
          </div>

          <div className="panel">
            <p className="eyebrow">What to look for</p>
            <ul className="checklist">
              <li>Edges of the face and hair stay clean.</li>
              <li>Signature strokes remain connected and legible.</li>
              <li>Background does not develop blocky artefacts.</li>
              <li>The file is strictly under the preset maximum.</li>
            </ul>
            <p className="compare-note">
              <Info size={13} aria-hidden /> The left side is a lossless render at export size; the
              right side is the real encoded file that will be downloaded.
            </p>
          </div>

          <Button
            variant="secondary"
            icon={Download}
            full
            onClick={() => navigate(ROUTES.export)}
          >
            Go to Export Center
          </Button>
        </aside>
      </div>
    </div>
  );
}
