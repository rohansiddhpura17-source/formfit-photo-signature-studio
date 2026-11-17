import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Move, RotateCcw } from 'lucide-react';
import type { Adjustments, CropSettings, LoadedImage } from '../../types';
import { renderCrop } from '../../engines/imageCropper';

interface CropStageProps {
  image: LoadedImage;
  crop: CropSettings;
  adjustments?: Adjustments;
  onChange: (patch: Partial<CropSettings>) => void;
  showGuides?: boolean;
  guide?: 'photo' | 'signature';
  transparent?: boolean;
  inkThreshold?: number;
}

/**
 * A fixed-ratio crop frame with a pannable, zoomable image behind it. The
 * on-screen canvas uses the exact same renderer as the exported file.
 */
export function CropStage({
  image,
  crop,
  adjustments,
  onChange,
  showGuides = true,
  guide = 'photo',
  transparent = false,
  inkThreshold = 82,
}: CropStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stageSize, setStageSize] = useState({ width: 640, height: 520 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setStageSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frame = fitFrame(stageSize.width - 48, stageSize.height - 48, crop.aspect);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    try {
      renderCrop(canvas, {
        image: image.image,
        crop,
        width: Math.max(1, Math.round(frame.width * dpr)),
        height: Math.max(1, Math.round(frame.height * dpr)),
        adjustments,
        background: transparent ? undefined : '#FFFFFF',
        transparent,
        inkThreshold,
      });
    } catch {
      /* The upload screen surfaces decode failures; keep the last frame here. */
    }
  }, [image, crop, adjustments, frame.width, frame.height, transparent, inkThreshold]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: crop.offsetX, oy: crop.offsetY };
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = (event.clientX - drag.current.x) / Math.max(1, frame.width);
    const dy = (event.clientY - drag.current.y) / Math.max(1, frame.height);
    onChange({
      offsetX: clampOffset(drag.current.ox + dx),
      offsetY: clampOffset(drag.current.oy + dy),
    });
  };

  const endDrag = () => setDragging(false);

  return (
    <div className={`crop-stage ${transparent ? 'crop-stage--checker' : ''}`} ref={stageRef}>
      <div
        className={`crop-frame ${dragging ? 'is-dragging' : ''}`}
        style={{ width: frame.width, height: frame.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="application"
        aria-label="Crop area. Drag to reposition the image."
      >
        <canvas ref={canvasRef} className="crop-canvas" style={{ width: '100%', height: '100%' }} />

        {showGuides && crop.showFaceGuide && guide === 'photo' && (
          <div className="face-guide" aria-hidden>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <ellipse cx="50" cy="41" rx="22" ry="27" />
              <line x1="50" y1="3" x2="50" y2="97" className="face-guide__center" />
              <line x1="6" y1="31" x2="94" y2="31" className="face-guide__eye" />
              <line x1="6" y1="71" x2="94" y2="71" className="face-guide__chin" />
            </svg>
            <span className="face-guide__label">Eye line</span>
          </div>
        )}

        {showGuides && guide === 'signature' && (
          <div className="signature-guide" aria-hidden>
            <span className="signature-guide__box" />
            <span className="signature-guide__label">Keep the signature inside the margin</span>
          </div>
        )}

        <div className="crop-grid" aria-hidden>
          <span /><span /><span /><span />
        </div>
        <span className="crop-corner crop-corner--tl" aria-hidden />
        <span className="crop-corner crop-corner--tr" aria-hidden />
        <span className="crop-corner crop-corner--bl" aria-hidden />
        <span className="crop-corner crop-corner--br" aria-hidden />
      </div>

      <div className="crop-stage__hint" aria-hidden>
        <Move size={13} /> Drag to reposition · zoom to crop tighter
      </div>
      <div className="crop-stage__size">
        {Math.round(frame.width)} × {Math.round(frame.height)} view
        <span aria-hidden>·</span>
        <RotateCcw size={12} aria-hidden /> {crop.rotation}°
      </div>
    </div>
  );
}

function clampOffset(value: number) {
  return Math.max(-0.65, Math.min(0.65, value));
}

function fitFrame(maxWidth: number, maxHeight: number, aspect: number) {
  const safeW = Math.max(240, maxWidth);
  const safeH = Math.max(220, maxHeight);
  let width = safeW;
  let height = width / aspect;
  if (height > safeH) {
    height = safeH;
    width = height * aspect;
  }
  return { width: Math.max(160, width), height: Math.max(120, height) };
}
