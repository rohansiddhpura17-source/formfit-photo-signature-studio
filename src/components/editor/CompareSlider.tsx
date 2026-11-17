import { useEffect, useMemo, useState } from 'react';
import { Columns2 } from 'lucide-react';

export function CompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Original',
  afterLabel = 'Compressed',
  aspect = 0.87,
}: {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeLabel?: string;
  afterLabel?: string;
  aspect?: number;
}) {
  const [position, setPosition] = useState(52);

  return (
    <div className="compare" style={{ aspectRatio: `${aspect}` }}>
      <div className="compare__pane">
        {beforeUrl ? (
          <img src={beforeUrl} alt={`${beforeLabel} preview`} className="compare__img" />
        ) : (
          <div className="compare__placeholder">Original preview unavailable</div>
        )}
        <span className="compare__tag compare__tag--left">{beforeLabel}</span>
      </div>
      <div className="compare__pane compare__pane--after" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        {afterUrl ? (
          <img src={afterUrl} alt={`${afterLabel} preview`} className="compare__img" />
        ) : (
          <div className="compare__placeholder">Compressed preview unavailable</div>
        )}
        <span className="compare__tag compare__tag--right">{afterLabel}</span>
      </div>
      <div className="compare__divider" style={{ left: `${position}%` }} aria-hidden>
        <span className="compare__handle">
          <Columns2 size={15} />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="compare__range"
        aria-label="Reveal original and compressed image"
      />
    </div>
  );
}

export function useBlobUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

export function ImagePreview({
  src,
  alt,
  aspect,
  checker = false,
  fit = 'contain',
  className = '',
}: {
  src: string | null;
  alt: string;
  aspect?: number;
  checker?: boolean;
  fit?: 'contain' | 'cover';
  className?: string;
}) {
  return (
    <div
      className={`image-preview ${checker ? 'image-preview--checker' : ''} ${className}`}
      style={aspect ? { aspectRatio: `${aspect}` } : undefined}
    >
      {src ? (
        <img src={src} alt={alt} style={{ objectFit: fit }} />
      ) : (
        <span className="image-preview__empty">No preview</span>
      )}
    </div>
  );
}
