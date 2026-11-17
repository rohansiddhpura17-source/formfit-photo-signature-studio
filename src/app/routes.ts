export interface RouteInfo {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

export function parseHash(hash: string): RouteInfo {
  const raw = hash.replace(/^#/, '') || '/welcome';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return {
    path,
    segments: path.split('/').filter(Boolean),
    query: new URLSearchParams(queryPart ?? ''),
  };
}

export const ROUTES = {
  welcome: '/welcome',
  dashboard: '/dashboard',
  photo: '/photo',
  photoCrop: '/photo/crop',
  photoAdjust: '/photo/adjust',
  signature: '/signature',
  signatureEditor: '/signature/editor',
  presets: '/presets',
  presetDetails: (id: string) => `/presets/${id}`,
  compression: '/compression',
  compare: '/compare',
  customPresets: '/custom-presets',
  customPresetNew: '/custom-presets/new',
  export: '/export',
  exportSuccess: '/export/success',
  history: '/history',
  settings: '/settings',
} as const;

// Removed 2026-11-08 (audit fix): the internal pattern-library pages
// /system, /errors and /empty-states were removed from the shipped app.
// They contained fake reports, fake download toasts and dead buttons.
// Design documentation lives in documentation/DESIGN_SYSTEM.md instead.

export const PAGE_TITLES: Record<string, string> = {
  '/welcome': 'Welcome',
  '/dashboard': 'Dashboard',
  '/photo': 'Photo Studio',
  '/photo/crop': 'Photo Studio',
  '/photo/adjust': 'Photo Studio',
  '/signature': 'Signature Studio',
  '/signature/editor': 'Signature Studio',
  '/presets': 'Preset Library',
  '/compression': 'Compression Studio',
  '/compare': 'Before & After',
  '/custom-presets': 'Custom Presets',
  '/custom-presets/new': 'New Custom Preset',
  '/export': 'Export Center',
  '/export/success': 'Export complete',
  '/history': 'Processing History',
  '/settings': 'Settings',
};

export function breadcrumbsFor(route: RouteInfo): Array<{ label: string; path?: string }> {
  const segments = route.segments;
  if (segments.length === 0 || segments[0] === 'welcome') return [{ label: 'Welcome' }];
  const crumbs: Array<{ label: string; path?: string }> = [{ label: 'Dashboard', path: '/dashboard' }];
  const [first, second] = segments;

  const map: Record<string, string> = {
    photo: 'Photo Studio',
    signature: 'Signature Studio',
    presets: 'Preset Library',
    compression: 'Compression Studio',
    compare: 'Before & After',
    'custom-presets': 'Custom Presets',
    export: 'Export Center',
    history: 'Processing History',
    settings: 'Settings',
  };

  if (first === 'dashboard') return [{ label: 'Dashboard' }];
  if (first === 'presets' && second) {
    crumbs.push({ label: 'Preset Library', path: '/presets' });
    crumbs.push({ label: 'Details' });
    return crumbs;
  }
  if (first === 'custom-presets' && second === 'new') {
    crumbs.push({ label: 'Custom Presets', path: '/custom-presets' });
    crumbs.push({ label: 'New preset' });
    return crumbs;
  }
  if (first === 'photo' && second === 'crop') {
    crumbs.push({ label: 'Photo Studio', path: '/photo' });
    crumbs.push({ label: 'Crop & position' });
    return crumbs;
  }
  if (first === 'photo' && second === 'adjust') {
    crumbs.push({ label: 'Photo Studio', path: '/photo' });
    crumbs.push({ label: 'Adjust' });
    return crumbs;
  }
  if (first === 'signature' && second === 'editor') {
    crumbs.push({ label: 'Signature Studio', path: '/signature' });
    crumbs.push({ label: 'Editor' });
    return crumbs;
  }
  if (first === 'export' && second === 'success') {
    crumbs.push({ label: 'Export Center', path: '/export' });
    crumbs.push({ label: 'Complete' });
    return crumbs;
  }
  if (first === 'compression') {
    crumbs.push({ label: 'Compression Studio' });
    return crumbs;
  }
  crumbs.push({ label: map[first] ?? first });
  return crumbs;
}
