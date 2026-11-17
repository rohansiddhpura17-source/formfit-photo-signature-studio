import { useCallback, useRef, useState } from 'react';
import { FileImage, ImagePlus, Loader2, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { ImageLoadError, loadImageFile, MAX_INPUT_BYTES } from '../../engines/imageLoader';
import type { LoadedImage } from '../../types';
import { Button } from '../common/Button';

export function UploadZone({
  kind,
  onLoaded,
  onError,
  sampleLabel,
  onSample,
  compact = false,
  busy = false,
}: {
  kind: 'photo' | 'signature';
  onLoaded: (image: LoadedImage) => void;
  onError: (message: string) => void;
  sampleLabel?: string;
  onSample?: () => void;
  compact?: boolean;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setLoading(true);
      try {
        const image = await loadImageFile(file);
        onLoaded(image);
      } catch (error) {
        const message =
          error instanceof ImageLoadError
            ? error.message
            : 'This image could not be read. Try another JPEG, PNG or WebP file.';
        onError(message);
      } finally {
        setLoading(false);
      }
    },
    [onLoaded, onError],
  );

  const isPhoto = kind === 'photo';

  return (
    <div
      className={`upload ${dragging ? 'is-dragging' : ''} ${compact ? 'upload--compact' : ''} ${busy ? 'is-busy' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFile(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
        aria-label={isPhoto ? 'Choose a photograph' : 'Choose a signature image'}
      />

      <div className="upload__icon" aria-hidden>
        {loading || busy ? <Loader2 className="spin" size={24} /> : isPhoto ? <ImagePlus size={24} strokeWidth={1.5} /> : <FileImage size={24} strokeWidth={1.5} />}
      </div>

      <div className="upload__copy">
        <h3>{isPhoto ? 'Drop a photograph here' : 'Drop a signature scan here'}</h3>
        <p>
          Drag a file into this area, or{' '}
          <button type="button" className="text-link" onClick={() => inputRef.current?.click()}>
            browse this device
          </button>
          .
        </p>
      </div>

      <div className="upload__meta">
        <span>JPEG · PNG · WebP</span>
        <span className="upload__dot" aria-hidden />
        <span>Up to {MAX_INPUT_BYTES / (1024 * 1024)} MB</span>
        <span className="upload__dot" aria-hidden />
        <span>
          <ShieldCheck size={12} strokeWidth={2} aria-hidden /> Processed locally
        </span>
      </div>

      <div className="upload__actions">
        <Button
          variant="primary"
          size="md"
          icon={UploadCloud}
          onClick={() => inputRef.current?.click()}
          loading={loading}
        >
          Choose {isPhoto ? 'photograph' : 'signature'}
        </Button>
        {onSample && (
          <Button variant="ghost" size="md" onClick={onSample} disabled={loading}>
            {sampleLabel ?? 'Use a sample'}
          </Button>
        )}
      </div>

      {dragging && (
        <div className="upload__overlay" aria-hidden>
          <UploadCloud size={26} />
          <span>Release to load</span>
        </div>
      )}
      {busy && <span className="upload__busy" role="status">Preparing preview…</span>}
      <button type="button" className="sr-only" onClick={() => inputRef.current?.click()}>
        Open file picker
      </button>
    </div>
  );
}

export function FileChip({
  image,
  onReplace,
  onRemove,
  label,
}: {
  image: LoadedImage;
  onReplace?: () => void;
  onRemove?: () => void;
  label: string;
}) {
  return (
    <div className="file-chip">
      <div className="file-chip__thumb">
        <img src={image.url} alt="" />
      </div>
      <div className="file-chip__meta">
        <p className="file-chip__label">{label}</p>
        <p className="file-chip__name" title={image.name}>
          {image.name}
        </p>
        <p className="file-chip__dims">
          {image.width} × {image.height} px · {(image.sizeBytes / 1024).toFixed(1)} KB
        </p>
      </div>
      <div className="file-chip__actions">
        {onReplace && (
          <button className="text-link" onClick={onReplace}>
            Replace
          </button>
        )}
        {onRemove && (
          <button className="icon-btn icon-btn--sm" onClick={onRemove} aria-label={`Remove ${label.toLowerCase()}`}>
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
