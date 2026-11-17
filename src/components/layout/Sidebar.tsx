import {
  ArrowLeftRight,
  Clock3,
  Download,
  FileSliders,
  Gauge,
  History,
  Images,
  LayoutDashboard,
  PenLine,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  match: string[];
  hint?: string;
}

const WORKSPACE: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: LayoutDashboard, match: ['/dashboard'] },
  { label: 'Photo Studio', path: ROUTES.photo, icon: Images, match: ['/photo'] },
  { label: 'Signature Studio', path: ROUTES.signature, icon: PenLine, match: ['/signature'] },
  { label: 'Compression Studio', path: ROUTES.compression, icon: Gauge, match: ['/compression', '/compare'] },
  { label: 'Export Center', path: ROUTES.export, icon: Download, match: ['/export'] },
];

const LIBRARY: NavItem[] = [
  { label: 'Preset Library', path: ROUTES.presets, icon: FileSliders, match: ['/presets'] },
  { label: 'Custom Presets', path: ROUTES.customPresets, icon: SlidersHorizontal, match: ['/custom-presets'] },
  { label: 'History', path: ROUTES.history, icon: History, match: ['/history'] },
];

function NavLink({ item }: { item: NavItem }) {
  const { route, navigate } = useApp();
  const active = item.match.some((m) => route.path === m || route.path.startsWith(`${m}/`));
  return (
    <button
      className={`nav-item ${active ? 'is-active' : ''}`}
      onClick={() => navigate(item.path)}
      aria-current={active ? 'page' : undefined}
      title={item.label}
    >
      <item.icon size={18} strokeWidth={1.75} aria-hidden />
      <span>{item.label}</span>
      {item.hint && <span className="nav-item__hint">{item.hint}</span>}
    </button>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const { navigate } = useApp();
  return (
    <button className={`logo ${compact ? 'logo--compact' : ''}`} onClick={() => navigate(ROUTES.dashboard)} aria-label="FORMFIT Studio — Dashboard">
      <span className="logo__mark" aria-hidden>
        <svg viewBox="0 0 32 32" width="30" height="30">
          <rect width="32" height="32" rx="7" fill="currentColor" />
          <path d="M10 9h13v3H13v3h8v3h-8v6h-3V9z" fill="#F8F7F4" />
          <circle cx="24.5" cy="24" r="2.5" fill="#E66A36" />
        </svg>
      </span>
      {!compact && (
        <span className="logo__type">
          <span className="logo__name">FORMFIT</span>
          <span className="logo__sub">Studio</span>
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { navigate, route, settings } = useApp();
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand">
        <Logo />
      </div>

      <nav className="sidebar__nav">
        <p className="nav-label">Workspace</p>
        {WORKSPACE.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
        <p className="nav-label nav-label--spaced">Library</p>
        {LIBRARY.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="local-card">
          <ShieldCheck size={16} strokeWidth={1.8} aria-hidden />
          <div>
            <p className="local-card__title">Local by design</p>
            <p className="local-card__body">Images never leave this device.</p>
          </div>
        </div>
        <button
          className={`nav-item ${route.path === '/settings' ? 'is-active' : ''}`}
          onClick={() => navigate(ROUTES.settings)}
          aria-current={route.path === '/settings' ? 'page' : undefined}
        >
          <Settings size={18} strokeWidth={1.75} aria-hidden />
          <span>Settings</span>
        </button>
        <p className="sidebar__version">
          <Sparkles size={11} aria-hidden /> v1.0.2 · Offline build
        </p>
        {settings.appearance === 'dark' && <span className="sr-only">Dark appearance enabled</span>}
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { route, navigate } = useApp();
  const items: NavItem[] = [
    { label: 'Home', path: ROUTES.dashboard, icon: LayoutDashboard, match: ['/dashboard'] },
    { label: 'Photo', path: ROUTES.photo, icon: Images, match: ['/photo'] },
    { label: 'Presets', path: ROUTES.presets, icon: FileSliders, match: ['/presets'] },
    { label: 'Export', path: ROUTES.export, icon: Download, match: ['/export'] },
  ];
  const moreActive = !items.some((item) => item.match.some((m) => route.path.startsWith(m)));
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const active = item.match.some((m) => route.path.startsWith(m));
        return (
          <button
            key={item.path}
            className={`mobile-nav__item ${active ? 'is-active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon size={20} strokeWidth={1.8} aria-hidden />
            <span>{item.label}</span>
          </button>
        );
      })}
      <button
        className={`mobile-nav__item ${moreActive ? 'is-active' : ''}`}
        onClick={() => navigate(ROUTES.settings)}
        aria-label="More and settings"
      >
        <Settings size={20} strokeWidth={1.8} aria-hidden />
        <span>More</span>
      </button>
    </nav>
  );
}

export const NAV_ICON_MAP = { ArrowLeftRight, Clock3, Gauge };
