import { useEffect, useState } from 'react';
import { CircleHelp, Command, ShieldCheck, WifiOff } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { breadcrumbsFor } from '../../app/routes';
import { IconButton } from '../common/Button';
import { Modal } from '../common/Feedback';
import { Logo } from './Sidebar';

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function Header() {
  const { route, navigate } = useApp();
  const online = useOnlineStatus();
  const [helpOpen, setHelpOpen] = useState(false);
  const crumbs = breadcrumbsFor(route);

  return (
    <>
      <header className="topbar">
        <div className="topbar__left">
          <span className="topbar__mobile-logo">
            <Logo compact />
          </span>
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="crumbs__item">
                {index > 0 && <span className="crumbs__sep" aria-hidden>/</span>}
                {crumb.path && index < crumbs.length - 1 ? (
                  <button className="crumbs__link" onClick={() => navigate(crumb.path!)}>
                    {crumb.label}
                  </button>
                ) : (
                  <span className="crumbs__current" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="topbar__right">
          <span
            className={`offline-chip ${online ? '' : 'offline-chip--offline'}`}
            title="FORMFIT runs entirely on this device. No image data is transmitted."
          >
            {online ? <ShieldCheck size={14} strokeWidth={2} aria-hidden /> : <WifiOff size={14} strokeWidth={2} aria-hidden />}
            <span>{online ? 'Offline ready' : 'No network · fully functional'}</span>
          </span>
          <span className="topbar__divider" aria-hidden />
          <IconButton icon={CircleHelp} label="Help and shortcuts" onClick={() => setHelpOpen(true)} />
        </div>
      </header>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Working with FORMFIT"
        description="A short guide to the studio and the shortcuts that are actually implemented."
        width={560}
        footer={
          <button className="btn btn--primary btn--md" onClick={() => setHelpOpen(false)}>
            Back to the studio
          </button>
        }
      >
        <div className="help-grid">
          <div>
            <p className="eyebrow">Primary flow</p>
            <ol className="help-steps">
              <li>Choose a preset in Photo Studio.</li>
              <li>Upload, crop and position the face.</li>
              <li>Adjust tone and confirm output size.</li>
              <li>Compress under the KB limit.</li>
              <li>Validate the real file, then download.</li>
            </ol>
          </div>
          <div>
            <p className="eyebrow">Keyboard</p>
            <dl className="shortcut-list">
              <div><dt>Move through controls</dt><dd><kbd>Tab</kbd></dd></div>
              <div><dt>Adjust a slider</dt><dd><kbd>←</kbd><kbd>→</kbd></dd></div>
              <div><dt>Close a dialog</dt><dd><kbd>Esc</kbd></dd></div>
              <div><dt>Activate a button</dt><dd><kbd>Enter</kbd></dd></div>
            </dl>
          </div>
        </div>
        <p className="help-note">
          <Command size={13} aria-hidden /> FORMFIT verifies the requirements encoded in the selected
          preset. It does not claim that a portal has accepted an image.
        </p>
      </Modal>
    </>
  );
}
