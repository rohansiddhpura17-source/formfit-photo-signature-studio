import { useEffect, useRef } from 'react';
import type { Adjustments, CropSettings, LoadedImage } from '../../types';
import { renderCrop } from '../../engines/imageCropper';

export function RenderedPreview({
  image,
  crop,
  adjustments,
  aspect,
  transparent = false,
  inkThreshold = 82,
  className = '',
}: {
  image: LoadedImage;
  crop: CropSettings;
  adjustments: Adjustments;
  aspect: number;
  transparent?: boolean;
  inkThreshold?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const box = canvas.parentElement?.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.min(box?.width ?? 420, 720);
    const height = width / aspect;
    try {
      renderCrop(canvas, {
        image: image.image,
        crop,
        width: Math.round(width * dpr),
        height: Math.round(height * dpr),
        adjustments,
        background: '#FFFFFF',
        transparent,
        inkThreshold,
      });
    } catch {
      /* Non-fatal preview error. */
    }
  }, [image, crop, adjustments, aspect, transparent, inkThreshold]);

  return <canvas ref={ref} className={`rendered-preview ${className}`} aria-label="Image preview" />;
}
