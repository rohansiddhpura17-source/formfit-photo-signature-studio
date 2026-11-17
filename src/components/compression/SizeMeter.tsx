import { bytesToKB } from '../../utils/format';

export function SizeMeter({
  minKB,
  maxKB,
  targetKB,
  actualKB,
  showActual = false,
}: {
  minKB: number;
  maxKB: number;
  targetKB: number;
  actualKB?: number;
  showActual?: boolean;
}) {
  const ceiling = Math.max(maxKB * 1.2, (actualKB ?? 0) * 1.05, targetKB * 1.1, 10);
  const pct = (value: number) => `${Math.min(100, (value / ceiling) * 100)}%`;
  const left = (value: number) => `${Math.min(100, (value / ceiling) * 100)}%`;
  const width = `${Math.max(0, Math.min(100, ((maxKB - minKB) / ceiling) * 100))}%`;

  return (
    <div className="size-meter">
      <div className="size-meter__head">
        <span className="size-meter__title">File-size window</span>
        <span className="size-meter__range">
          {minKB}–{maxKB} KB
        </span>
      </div>
      <div className="size-meter__track" role="img" aria-label={`Allowed ${minKB} to ${maxKB} KB. Target ${targetKB} KB.`}>
        <span className="size-meter__allowed" style={{ left: left(minKB), width }} />
        <span className="size-meter__target" style={{ left: left(targetKB) }} title={`Target ${targetKB} KB`} />
        {showActual && actualKB !== undefined && (
          <span
            className={`size-meter__marker ${actualKB < maxKB ? 'is-ok' : 'is-over'}`}
            style={{ left: left(actualKB) }}
            title={`Actual ${bytesToKB(actualKB * 1024)} KB`}
          />
        )}
      </div>
      <div className="size-meter__legend">
        <span><i className="legend-dot legend-dot--allowed" /> Allowed range</span>
        <span><i className="legend-dot legend-dot--target" /> Target</span>
        {showActual && actualKB !== undefined && (
          <span><i className={`legend-dot ${actualKB < maxKB ? 'legend-dot--actual' : 'legend-dot--over'}`} /> Actual</span>
        )}
      </div>
    </div>
  );
}
