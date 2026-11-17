import { useState } from 'react';
import {
  Check,
  Database,
  Download,
  HardDrive,
  Info,
  Moon,
  Palette,
  RotateCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageIntro } from '../../components/common/EmptyState';
import { Field, NumberInput, Select } from '../../components/common/Field';
import { Modal, ProgressBar, Segmented, Switch } from '../../components/common/Feedback';
import { formatBytes, formatLabel } from '../../utils/format';
import { DEFAULT_SETTINGS } from '../../services/storageService';
import type { CompressionMode, OutputFormat } from '../../types';

const FORMATS: OutputFormat[] = ['image/jpeg', 'image/png', 'image/webp'];
const MODES: Array<{ value: CompressionMode; label: string }> = [
  { value: 'auto', label: 'Automatic — best quality under the limit' },
  { value: 'balanced', label: 'Balanced — protect quality and dimensions' },
  { value: 'maximum', label: 'Maximum — smallest file, may downscale' },
  { value: 'manual', label: 'Manual — encode at a fixed quality' },
];

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    presets,
    customPresets,
    storage,
    refreshStorage,
    clearEverything,
    navigate,
    pushToast,
    history,
  } = useApp();
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const usagePct =
    storage && storage.quota > 0 ? Math.min(100, (storage.usage / storage.quota) * 100) : 0;

  const resetSettings = () => {
    updateSettings(DEFAULT_SETTINGS);
    pushToast({ tone: 'neutral', title: 'Preferences reset', message: 'Studio defaults restored.' });
  };

  const doClear = async () => {
    setClearing(true);
    try {
      await clearEverything();
      updateSettings(DEFAULT_SETTINGS);
      setClearOpen(false);
      pushToast({
        tone: 'neutral',
        title: 'Local data cleared',
        message: 'History, custom presets and preferences were removed from this device.',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Preferences"
        title="Settings"
        description="Everything here is stored in this browser. There is no account and no sync — clearing site data removes these preferences."
        meta={<Badge tone="success" icon={ShieldCheck}>Local only</Badge>}
        actions={
          <Button variant="ghost" icon={RotateCcw} onClick={resetSettings}>
            Reset defaults
          </Button>
        }
      />

      <div className="settings-layout">
        <div className="settings-main">
          <section className="panel settings-section">
            <div className="settings-section__head">
              <span className="settings-section__icon"><Palette size={18} /></span>
              <div>
                <h2 className="panel__title">Appearance</h2>
                <p>Change how the studio looks on this device.</p>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row__label">
                <p>Theme</p>
                <span>Light is the default editorial surface. Dark reduces glare for late-night work.</span>
              </div>
              <Segmented
                label="Theme"
                value={settings.appearance}
                onChange={(value) => updateSettings({ appearance: value })}
                options={[
                  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
                  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
                ]}
              />
            </div>
            <div className="settings-row">
              <div className="settings-row__label">
                <p>Density</p>
                <span>Compact fits more controls on screen; comfortable adds breathing room.</span>
              </div>
              <Segmented
                label="Interface density"
                value={settings.density}
                onChange={(value) => updateSettings({ density: value })}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact', label: 'Compact' },
                ]}
              />
            </div>
            <div className="settings-row">
              <div className="settings-row__label">
                <p>Reduce motion</p>
                <span>Disables non-essential transitions and the success-mark animation.</span>
              </div>
              <Switch
                checked={settings.reduceMotion}
                onChange={(value) => updateSettings({ reduceMotion: value })}
                label="Reduce motion"
              />
            </div>
          </section>

          <section className="panel settings-section">
            <div className="settings-section__head">
              <span className="settings-section__icon"><SlidersHorizontal size={18} /></span>
              <div>
                <h2 className="panel__title">Studio defaults</h2>
                <p>Applied when a new document is started. Existing jobs keep their own settings.</p>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <p>Default preset</p>
                <span>The preset selected when FORMFIT starts.</span>
              </div>
              <Select
                value={settings.defaultPhotoPresetId}
                onChange={(event) => updateSettings({ defaultPhotoPresetId: event.target.value })}
                aria-label="Default preset"
                options={presets.map((preset) => ({
                  value: preset.id,
                  label: `${preset.shortName} — ${preset.verification === 'verified' ? 'Verified' : 'User preset'}`,
                }))}
              />
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <p>Default output format</p>
                <span>Used when the selected preset accepts more than one format.</span>
              </div>
              <Select
                value={settings.defaultFormat}
                onChange={(event) => updateSettings({ defaultFormat: event.target.value as OutputFormat })}
                aria-label="Default output format"
                options={FORMATS.map((format) => ({ value: format, label: formatLabel(format) }))}
              />
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <p>Default compression mode</p>
                <span>How the compressor searches for a file under the limit.</span>
              </div>
              <Select
                value={settings.defaultCompressionMode}
                onChange={(event) =>
                  updateSettings({ defaultCompressionMode: event.target.value as CompressionMode })
                }
                aria-label="Default compression mode"
                options={MODES}
              />
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <p>Safety margin</p>
                <span>Subtracted from the preset maximum when choosing a target. The strict check still uses the real maximum.</span>
              </div>
              <NumberInput
                value={settings.safetyMarginKB}
                min={0}
                max={20}
                suffix="KB"
                aria-label="Safety margin in KB"
                onChange={(event) =>
                  updateSettings({ safetyMarginKB: Math.max(0, Math.min(20, Number(event.target.value) || 0)) })
                }
              />
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <p>Confirm before delete</p>
                <span>Ask before removing history rows, custom presets or local data.</span>
              </div>
              <Switch
                checked={settings.confirmBeforeDelete}
                onChange={(value) => updateSettings({ confirmBeforeDelete: value })}
                label="Confirm before delete"
              />
            </div>

            <div className="info-row">
              <Info size={14} aria-hidden />
              <span>
                The safety margin is a convenience, not a guarantee. A portal may still reject a file
                that passes the preset checks.
              </span>
            </div>
          </section>

          <section className="panel settings-section">
            <div className="settings-section__head">
              <span className="settings-section__icon"><Database size={18} /></span>
              <div>
                <h2 className="panel__title">Local data</h2>
                <p>History, custom presets and preferences live in IndexedDB, with a localStorage fallback.</p>
              </div>
            </div>

            <div className="storage-card">
              <div className="storage-card__head">
                <div>
                  <p className="eyebrow">Browser storage</p>
                  <p className="storage-card__value">
                    {storage ? `${formatBytes(storage.usage)} used` : 'Estimate unavailable'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" icon={HardDrive} onClick={() => void refreshStorage()}>
                  Refresh
                </Button>
              </div>
              <ProgressBar
                value={storage && storage.quota > 0 ? storage.usage / storage.quota : 0}
                label="Local storage usage"
              />
              <p className="storage-card__meta">
                {storage && storage.quota > 0
                  ? `${usagePct.toFixed(2)}% of an estimated ${formatBytes(storage.quota)} quota.`
                  : 'Your browser does not expose a storage estimate. FORMFIT still works offline.'}
              </p>
              <dl className="spec-table spec-table--tight">
                <div><dt>History rows</dt><dd>{history.length}</dd></div>
                <div><dt>Custom presets</dt><dd>{customPresets.length}</dd></div>
                <div><dt>Images stored</dt><dd>0 — always</dd></div>
              </dl>
            </div>

            <div className="settings-danger">
              <div>
                <p className="settings-danger__title">
                  <TriangleAlert size={15} aria-hidden /> Clear all local data
                </p>
                <p>
                  Removes history, custom presets and preferences. Downloaded files on your device are
                  not touched.
                </p>
              </div>
              <Button variant="danger" icon={Trash2} onClick={() => setClearOpen(true)}>
                Clear local data
              </Button>
            </div>
          </section>
        </div>

        <aside className="settings-aside">
          <div className="panel settings-note">
            <ShieldCheck size={20} strokeWidth={1.7} aria-hidden />
            <h2 className="panel__title">Privacy by architecture</h2>
            <p>
              FORMFIT has no server, no account system and no analytics. Images are decoded in memory,
              processed on canvas and encoded by your browser. The only network-capable element is an
              optional link to an official notice.
            </p>
            <ul className="checklist checklist--compact">
              <li>No image uploads</li>
              <li>No remote fonts or CDN assets</li>
              <li>No tracking scripts</li>
              <li>No cookies for advertising</li>
            </ul>
          </div>

          <div className="panel settings-note">
            <WifiOff size={20} strokeWidth={1.7} aria-hidden />
            <h2 className="panel__title">Offline build</h2>
            <p>
              This build is a single HTML file. Open it directly from disk with no network connection
              and every processing feature remains available.
            </p>
          </div>

          <div className="panel settings-note">
            <Settings size={20} strokeWidth={1.7} aria-hidden />
            <h2 className="panel__title">Where settings live</h2>
            <p>
              Preferences are stored under the <code>formfit-studio</code> IndexedDB database. Private
              browsing or clearing site data will reset them.
            </p>
            <p className="settings-version">
              <Check size={12} aria-hidden /> FORMFIT Studio v1.0.2
            </p>
          </div>

          <div className="panel settings-note">
            <p className="eyebrow">Related</p>
            <div className="settings-links">
              <button className="text-link" onClick={() => navigate(ROUTES.history)}>Processing history</button>
              <button className="text-link" onClick={() => navigate(ROUTES.customPresets)}>Custom presets</button>
              <button className="text-link" onClick={() => navigate(ROUTES.presets)}>Preset library</button>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear all local data?"
        description="This removes history, custom presets and preferences from this browser. It cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} loading={clearing} onClick={doClear}>
              Clear everything
            </Button>
          </>
        }
      >
        <div className="delete-summary">
          <p className="delete-summary__name">{history.length} history rows · {customPresets.length} custom presets</p>
          <p>Images are never stored, so there is no image data to delete.</p>
          <p className="delete-summary__meta">Downloaded files remain in your Downloads folder.</p>
        </div>
      </Modal>
    </div>
  );
}
