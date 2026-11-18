import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  FileSliders,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Badge, VerificationBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageIntro } from '../../components/common/EmptyState';
import { EmptyState } from '../../components/common/EmptyState';
import { TextInput } from '../../components/common/Field';
import { presetOutputSummary, presetSizeOf, searchPresets, PRESET_CATEGORIES } from '../../services/presetService';
import { formatLabel } from '../../utils/format';

export function PresetLibrary() {
  const { presets, navigate, setPhotoPreset, setSignaturePreset, customPresets } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const results = useMemo(() => searchPresets(presets, query, category), [presets, query, category]);
  const official = results.filter((preset) => preset.verification === 'verified');
  const userMade = results.filter((preset) => preset.verification === 'custom');

  const apply = (id: string, kind: 'photo' | 'signature') => {
    if (kind === 'photo') {
      setPhotoPreset(id);
      navigate(ROUTES.photo);
    } else {
      setSignaturePreset(id);
      navigate(ROUTES.signature);
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Library"
        title="Official form presets"
        description="Real requirements from real notices. Each preset stores its source, verification date and the exact checks it will perform."
        actions={
          <>
            <Button variant="ghost" icon={SlidersHorizontal} onClick={() => navigate(ROUTES.customPresets)}>
              Custom presets {customPresets.length > 0 ? `(${customPresets.length})` : ''}
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate(ROUTES.customPresetNew)}>
              Create preset
            </Button>
          </>
        }
      />

      <div className="library-toolbar">
        <div className="search-field">
          <Search size={16} aria-hidden />
          <TextInput
            placeholder="Search organisation, form or category…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search presets"
          />
          {query && (
            <button className="search-field__clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="filter-chips" role="group" aria-label="Filter by category">
          {PRESET_CATEGORIES.map((item) => (
            <button
              key={item}
              className={`filter-chip ${category === item ? 'is-active' : ''}`}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="library-count">{results.length} preset{results.length === 1 ? '' : 's'}</span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          eyebrow="No results"
          title="No preset matches that search"
          description={`Nothing matched “${query}”${category !== 'All' ? ` in ${category}` : ''}. Try a shorter term, clear the category, or create a custom preset for your form.`}
          actions={
            <>
              <Button variant="secondary" onClick={() => { setQuery(''); setCategory('All'); }}>
                Clear filters
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => navigate(ROUTES.customPresetNew)}>
                Create custom preset
              </Button>
            </>
          }
        />
      ) : (
        <>
          {official.length > 0 && (
            <section className="preset-section">
              <div className="preset-section__head">
                <div>
                  <p className="eyebrow">Verified sources</p>
                  <h2 className="section-title">Official presets</h2>
                </div>
                <span className="preset-section__note">
                  <ShieldCheck size={14} aria-hidden /> Linked to government or authority documents
                </span>
              </div>
              <div className="preset-grid">
                {official.map((preset) => (
                  <article key={preset.id} className="preset-card">
                    <div className="preset-card__top">
                      <div className="preset-card__org">
                        <span className="preset-card__monogram" aria-hidden>
                          {preset.organization.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="preset-card__org-name">{preset.organization.split('(')[0].trim()}</p>
                          <p className="preset-card__category">{preset.category}</p>
                        </div>
                      </div>
                      <VerificationBadge status={preset.verification} />
                    </div>

                    <h3 className="preset-card__name">{preset.name}</h3>

                    <div className="preset-card__specs">
                      <div className="preset-card__spec">
                        <span className="preset-card__spec-label">Photograph</span>
                        <span className="preset-card__spec-value">{presetOutputSummary(preset, 'photo')}</span>
                        <span className="preset-card__spec-sub">{presetSizeOf(preset, 'photo')}</span>
                      </div>
                      <div className="preset-card__spec">
                        <span className="preset-card__spec-label">Signature</span>
                        <span className="preset-card__spec-value">{presetOutputSummary(preset, 'signature')}</span>
                        <span className="preset-card__spec-sub">{presetSizeOf(preset, 'signature')}</span>
                      </div>
                    </div>

                    <div className="preset-card__meta">
                      <span>{preset.photo.formats.map(formatLabel).join(' · ')}</span>
                      {preset.verifiedOn && <span>Verified {preset.verifiedOn}</span>}
                    </div>

                    <div className="preset-card__actions">
                      <button className="text-link" onClick={() => navigate(ROUTES.presetDetails(preset.id))}>
                        View details <ArrowUpRight size={12} aria-hidden />
                      </button>
                      <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => apply(preset.id, 'photo')}>
                        Apply
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {userMade.length > 0 && (
            <section className="preset-section">
              <div className="preset-section__head">
                <div>
                  <p className="eyebrow">Local only</p>
                  <h2 className="section-title">Your presets</h2>
                </div>
                <span className="preset-section__note">Stored in IndexedDB on this device</span>
              </div>
              <div className="preset-grid">
                {userMade.map((preset) => (
                  <article key={preset.id} className="preset-card preset-card--custom">
                    <div className="preset-card__top">
                      <div className="preset-card__org">
                        <span className="preset-card__monogram" aria-hidden>
                          {preset.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="preset-card__org-name">{preset.organization}</p>
                          <p className="preset-card__category">Custom preset</p>
                        </div>
                      </div>
                      <VerificationBadge status="custom" />
                    </div>
                    <h3 className="preset-card__name">{preset.name}</h3>
                    <div className="preset-card__specs">
                      <div className="preset-card__spec">
                        <span className="preset-card__spec-label">Photograph</span>
                        <span className="preset-card__spec-value">{presetOutputSummary(preset, 'photo')}</span>
                        <span className="preset-card__spec-sub">{presetSizeOf(preset, 'photo')}</span>
                      </div>
                      <div className="preset-card__spec">
                        <span className="preset-card__spec-label">Signature</span>
                        <span className="preset-card__spec-value">{presetOutputSummary(preset, 'signature')}</span>
                        <span className="preset-card__spec-sub">{presetSizeOf(preset, 'signature')}</span>
                      </div>
                    </div>
                    <div className="preset-card__meta">
                      <Badge tone="outline">Not officially verified</Badge>
                    </div>
                    <div className="preset-card__actions">
                      <button className="text-link" onClick={() => navigate(ROUTES.presetDetails(preset.id))}>
                        View details <ArrowUpRight size={12} aria-hidden />
                      </button>
                      <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => apply(preset.id, 'photo')}>
                        Apply
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="library-note">
        <FileSliders size={16} aria-hidden />
        <p>
          All four official presets are verified against the authority's published documents. For
          UPSC CSE photographs and NEET UG images, pixel dimensions are not fixed by the authority,
          so the crop ratio is a working choice rather than an official requirement.
        </p>
      </div>
    </div>
  );
}
