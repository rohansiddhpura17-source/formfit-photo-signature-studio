import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  FileSliders,
  Pencil,
  Plus,
  Search,
  ShieldQuestion,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState, PageIntro } from '../../components/common/EmptyState';
import { TextInput } from '../../components/common/Field';
import { Modal } from '../../components/common/Feedback';
import { presetOutputSummary, presetSizeOf } from '../../services/presetService';
import { formatDate } from '../../utils/format';
import type { Preset } from '../../types';

export function CustomPresets() {
  const {
    customPresets,
    setPhotoPreset,
    setSignaturePreset,
    deletePreset,
    navigate,
    pushToast,
    settings,
  } = useApp();
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Preset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customPresets;
    return customPresets.filter((preset) =>
      [preset.name, preset.organization, preset.sourceLabel ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [customPresets, query]);

  const apply = (preset: Preset, kind: 'photo' | 'signature') => {
    if (kind === 'photo') {
      setPhotoPreset(preset.id);
      navigate(ROUTES.photo);
    } else {
      setSignaturePreset(preset.id);
      navigate(ROUTES.signature);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePreset(pendingDelete.id);
      pushToast({
        tone: 'neutral',
        title: 'Custom preset deleted',
        message: `${pendingDelete.name} was removed from this device.`,
      });
      setPendingDelete(null);
    } catch {
      pushToast({
        tone: 'error',
        title: 'Preset could not be deleted',
        message: 'Local storage refused the change. Try again.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const requestDelete = (preset: Preset) => {
    if (settings.confirmBeforeDelete) {
      setPendingDelete(preset);
    } else {
      void deletePreset(preset.id);
      pushToast({ tone: 'neutral', title: 'Custom preset deleted' });
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Local library"
        title="Your custom presets"
        description="Presets you create stay on this device. They are clearly marked as user-created and never presented as official requirements."
        actions={
          <>
            <Button variant="ghost" icon={FileSliders} onClick={() => navigate(ROUTES.presets)}>
              Official presets
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate(ROUTES.customPresetNew)}>
              New preset
            </Button>
          </>
        }
      />

      <div className="library-toolbar library-toolbar--simple">
        <div className="search-field">
          <Search size={16} aria-hidden />
          <TextInput
            placeholder="Search your presets…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search custom presets"
          />
        </div>
        <span className="library-count">
          {customPresets.length} saved preset{customPresets.length === 1 ? '' : 's'}
        </span>
      </div>

      {customPresets.length === 0 ? (
        <EmptyState
          icon={ShieldQuestion}
          eyebrow="No custom presets"
          title="Your form is not in the library?"
          description="Create a preset from the requirements printed in your official notice. FORMFIT will use it for crop ratios, dimensions, format and KB limits, and will mark it as unverified."
          actions={
            <>
              <Button variant="primary" icon={Plus} onClick={() => navigate(ROUTES.customPresetNew)}>
                Create a custom preset
              </Button>
              <Button variant="ghost" onClick={() => navigate(ROUTES.presets)}>
                Check official presets first
              </Button>
            </>
          }
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          compact
          eyebrow="No match"
          title="No saved preset matches that search"
          description={`Nothing matched “${query}”. Try a shorter term or clear the search.`}
          actions={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="custom-preset-grid">
          {results.map((preset) => (
            <article key={preset.id} className="custom-preset-card">
              <div className="custom-preset-card__head">
                <span className="preset-card__monogram" aria-hidden>
                  {preset.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="custom-preset-card__identity">
                  <h2>{preset.name}</h2>
                  <p>{preset.organization}</p>
                </div>
                <Badge tone="outline">User preset</Badge>
              </div>

              <dl className="custom-preset-card__specs">
                <div>
                  <dt>Photograph</dt>
                  <dd>{presetOutputSummary(preset, 'photo')}</dd>
                  <span>{presetSizeOf(preset, 'photo')}</span>
                </div>
                <div>
                  <dt>Signature</dt>
                  <dd>{presetOutputSummary(preset, 'signature')}</dd>
                  <span>{presetSizeOf(preset, 'signature')}</span>
                </div>
              </dl>

              <p className="custom-preset-card__note">
                {preset.createdAt ? `Created ${formatDate(preset.createdAt)}` : 'Stored locally'} · Not
                verified against any authority.
              </p>

              <div className="custom-preset-card__actions">
                <div className="custom-preset-card__apply">
                  <Button size="sm" variant="secondary" iconRight={ArrowRight} onClick={() => apply(preset, 'photo')}>
                    Photo
                  </Button>
                  <Button size="sm" variant="secondary" iconRight={ArrowRight} onClick={() => apply(preset, 'signature')}>
                    Signature
                  </Button>
                </div>
                <div className="custom-preset-card__manage">
                  <button
                    className="icon-btn icon-btn--sm"
                    onClick={() => navigate(`${ROUTES.customPresetNew}?edit=${preset.id}`)}
                    aria-label={`Edit ${preset.name}`}
                    title="Edit preset"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    onClick={() => requestDelete(preset)}
                    aria-label={`Delete ${preset.name}`}
                    title="Delete preset"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn--sm"
                    onClick={() => navigate(ROUTES.presetDetails(preset.id))}
                    aria-label={`View ${preset.name} details`}
                    title="View details"
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="library-note">
        <ShieldQuestion size={16} aria-hidden />
        <p>
          Custom presets are a convenience, not a guarantee. Requirements change between application
          cycles; always re-read the notice for the cycle you are applying to.
        </p>
      </div>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this custom preset?"
        description="The preset will be removed from this device. Images and export history are not affected."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep preset
            </Button>
            <Button variant="danger" icon={Trash2} loading={deleting} onClick={confirmDelete}>
              Delete preset
            </Button>
          </>
        }
      >
        {pendingDelete && (
          <div className="delete-summary">
            <p className="delete-summary__name">{pendingDelete.name}</p>
            <p>{pendingDelete.organization}</p>
            <p className="delete-summary__meta">
              Photo {presetSizeOf(pendingDelete, 'photo')} · Signature{' '}
              {presetSizeOf(pendingDelete, 'signature')}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
