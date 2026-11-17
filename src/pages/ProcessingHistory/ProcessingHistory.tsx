import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  History,
  Images,
  PenLine,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState, PageIntro } from '../../components/common/EmptyState';
import { TextInput } from '../../components/common/Field';
import { Modal } from '../../components/common/Feedback';
import { formatBytes, formatDate, formatLabel } from '../../utils/format';
import type { HistoryRecord } from '../../types';

type KindFilter = 'all' | 'photo' | 'signature';
type StatusFilter = 'all' | 'ready' | 'not-ready';

export function ProcessingHistory() {
  const {
    history,
    presets,
    navigate,
    removeHistory,
    clearHistory,
    setPhotoPreset,
    setSignaturePreset,
    updatePhotoCompression,
    updateSignatureCompression,
    pushToast,
    settings,
  } = useApp();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<HistoryRecord | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((record) => {
      if (kind !== 'all' && record.kind !== kind) return false;
      if (status !== 'all' && record.validation !== status) return false;
      if (!q) return true;
      return [record.fileName, record.presetName, record.organization, record.format]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [history, query, kind, status]);

  const stats = useMemo(() => {
    const ready = history.filter((record) => record.validation === 'ready').length;
    const photo = history.filter((record) => record.kind === 'photo').length;
    const signature = history.filter((record) => record.kind === 'signature').length;
    const bytes = history.reduce((total, record) => total + record.finalBytes, 0);
    return { ready, photo, signature, bytes };
  }, [history]);

  const reuse = (record: HistoryRecord) => {
    const preset = presets.find((item) => item.id === record.presetId);
    if (!preset) {
      pushToast({
        tone: 'warning',
        title: 'Preset no longer available',
        message: 'The preset used for this export was deleted. Choose a preset and rebuild the file.',
      });
      navigate(ROUTES.presets);
      return;
    }
    if (record.kind === 'photo') {
      setPhotoPreset(preset.id);
      updatePhotoCompression({
        targetKB: record.settings.targetKB,
        mode: record.settings.mode,
        format: record.settings.format,
      });
      navigate(ROUTES.photo);
    } else {
      setSignaturePreset(preset.id);
      updateSignatureCompression({
        targetKB: record.settings.targetKB,
        mode: record.settings.mode,
        format: record.settings.format,
      });
      navigate(ROUTES.signature);
    }
    pushToast({
      tone: 'neutral',
      title: 'Settings loaded',
      message: `${preset.shortName} and the previous compression target are active. Add the image again.`,
    });
  };

  const requestDelete = (record: HistoryRecord) => {
    if (settings.confirmBeforeDelete) setPendingDelete(record);
    else void doDelete(record.id);
  };

  const doDelete = async (id: string) => {
    setBusy(true);
    try {
      await removeHistory(id);
      pushToast({ tone: 'neutral', title: 'History entry removed' });
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const doClear = async () => {
    setBusy(true);
    try {
      await clearHistory();
      setClearOpen(false);
      pushToast({ tone: 'neutral', title: 'History cleared', message: 'All export metadata was removed from this device.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Local record"
        title="Processing history"
        description="A metadata-only record of files you downloaded. Images are never stored — only the numbers needed to understand what was exported."
        meta={
          <Badge tone="neutral" dot>
            {history.length} entr{history.length === 1 ? 'y' : 'ies'} on this device
          </Badge>
        }
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={() => navigate(ROUTES.export)}>
              Export Center
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setClearOpen(true)}
              disabled={history.length === 0}
            >
              Clear history
            </Button>
          </>
        }
      />

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          eyebrow="Nothing recorded"
          title="No exports yet"
          description="History starts after a real download. Prepare a photograph or signature, validate the encoded file and export it — the metadata will appear here."
          actions={
            <>
              <Button variant="primary" icon={Images} onClick={() => navigate(ROUTES.photo)}>
                Prepare a photograph
              </Button>
              <Button variant="ghost" icon={PenLine} onClick={() => navigate(ROUTES.signature)}>
                Prepare a signature
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className="history-stats">
            <div className="history-stat">
              <span className="history-stat__label">Total exports</span>
              <span className="history-stat__value">{history.length}</span>
              <span className="history-stat__sub">Metadata entries</span>
            </div>
            <div className="history-stat">
              <span className="history-stat__label">Validated</span>
              <span className="history-stat__value">{stats.ready}</span>
              <span className="history-stat__sub">Passed every preset check</span>
            </div>
            <div className="history-stat">
              <span className="history-stat__label">Photographs</span>
              <span className="history-stat__value">{stats.photo}</span>
              <span className="history-stat__sub">Photo exports</span>
            </div>
            <div className="history-stat">
              <span className="history-stat__label">Signatures</span>
              <span className="history-stat__value">{stats.signature}</span>
              <span className="history-stat__sub">Signature exports</span>
            </div>
            <div className="history-stat history-stat--wide">
              <span className="history-stat__label">Output volume</span>
              <span className="history-stat__value">{formatBytes(stats.bytes)}</span>
              <span className="history-stat__sub">Sum of actual encoded file sizes</span>
            </div>
          </div>

          <div className="history-toolbar">
            <div className="search-field">
              <Search size={16} aria-hidden />
              <TextInput
                placeholder="Search filename, preset or organisation…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search history"
              />
              {query && (
                <button className="search-field__clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="filter-chips" role="group" aria-label="Filter by document type">
              {(['all', 'photo', 'signature'] as KindFilter[]).map((value) => (
                <button
                  key={value}
                  className={`filter-chip ${kind === value ? 'is-active' : ''}`}
                  onClick={() => setKind(value)}
                  aria-pressed={kind === value}
                >
                  {value === 'all' ? 'All documents' : value === 'photo' ? 'Photographs' : 'Signatures'}
                </button>
              ))}
            </div>
            <div className="filter-chips" role="group" aria-label="Filter by validation status">
              {(['all', 'ready', 'not-ready'] as StatusFilter[]).map((value) => (
                <button
                  key={value}
                  className={`filter-chip ${status === value ? 'is-active' : ''}`}
                  onClick={() => setStatus(value)}
                  aria-pressed={status === value}
                >
                  {value === 'all' ? 'Any status' : value === 'ready' ? 'Ready' : 'Not ready'}
                </button>
              ))}
            </div>
            <span className="library-count">
              {filtered.length} of {history.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              compact
              eyebrow="No match"
              title="No history entry matches these filters"
              description="Try a shorter search term, or reset the document and status filters."
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setKind('all');
                    setStatus('all');
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="history-table" role="table" aria-label="Export history">
              <div className="history-table__head" role="row">
                <span role="columnheader">File</span>
                <span role="columnheader">Preset</span>
                <span role="columnheader">Output</span>
                <span role="columnheader">Size</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Date</span>
                <span role="columnheader" className="history-table__actions-head">Actions</span>
              </div>
              {filtered.map((record) => (
                <div key={record.id} className="history-row" role="row">
                  <div className="history-row__file" role="cell">
                    <span className={`history-row__kind history-row__kind--${record.kind}`}>
                      {record.kind === 'photo' ? <Images size={15} /> : <PenLine size={15} />}
                    </span>
                    <div>
                      <p className="history-row__name" title={record.fileName}>{record.fileName}</p>
                      <p className="history-row__org">{record.organization.split('(')[0].trim()}</p>
                    </div>
                  </div>
                  <div className="history-row__preset" role="cell">
                    <p>{record.presetName}</p>
                    <span>{record.kind === 'photo' ? 'Photograph' : 'Signature'}</span>
                  </div>
                  <div className="history-row__output" role="cell">
                    <p>{record.width} × {record.height} px</p>
                    <span>{formatLabel(record.format)} · target {record.settings.targetKB} KB</span>
                  </div>
                  <div className="history-row__size" role="cell">
                    <p>{formatBytes(record.finalBytes)}</p>
                    <span>from {formatBytes(record.originalBytes)}</span>
                  </div>
                  <div className="history-row__status" role="cell">
                    <span className={`status-pill ${record.validation === 'ready' ? 'is-ready' : 'is-warning'}`}>
                      {record.validation === 'ready' ? <CheckCircle2 size={12} /> : <TriangleAlert size={12} />}
                      {record.validation === 'ready' ? 'Ready' : 'Not ready'}
                    </span>
                  </div>
                  <div className="history-row__date" role="cell">
                    <p>{formatDate(record.date)}</p>
                    <span>{record.settings.mode} mode</span>
                  </div>
                  <div className="history-row__actions" role="cell">
                    <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => reuse(record)}>
                      Reuse
                    </Button>
                    <button
                      className="icon-btn icon-btn--sm icon-btn--danger"
                      onClick={() => requestDelete(record)}
                      aria-label={`Delete history entry ${record.fileName}`}
                      title="Delete entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="history-note">
            <Clock3 size={16} aria-hidden />
            <p>
              “Reuse” restores the preset and compression target. It cannot restore the image or the
              encoded file — FORMFIT never stores image data. Add the source again to rebuild the export.
            </p>
          </div>
        </>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Remove this history entry?"
        description="Only the metadata row is removed. The downloaded file on your device is not touched."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep entry
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              loading={busy}
              onClick={() => pendingDelete && void doDelete(pendingDelete.id)}
            >
              Remove entry
            </Button>
          </>
        }
      >
        {pendingDelete && (
          <div className="delete-summary">
            <p className="delete-summary__name">{pendingDelete.fileName}</p>
            <p>{pendingDelete.presetName} · {formatBytes(pendingDelete.finalBytes)}</p>
            <p className="delete-summary__meta">{formatDate(pendingDelete.date)}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear all processing history?"
        description="This removes every metadata row stored by FORMFIT on this device. Downloaded files and custom presets are unaffected."
        footer={
          <>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} loading={busy} onClick={doClear}>
              Clear all history
            </Button>
          </>
        }
      >
        <p className="modal-copy">
          There {history.length === 1 ? 'is' : 'are'} <strong>{history.length}</strong>{' '}
          {history.length === 1 ? 'entry' : 'entries'} in this browser. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
