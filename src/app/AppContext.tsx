import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Adjustments,
  CompressionSettings,
  CropSettings,
  HistoryRecord,
  LoadedImage,
  OutputSettings,
  PhotoJob,
  Preset,
  Settings,
  SignatureJob,
  Toast,
  ValidationReport,
} from '../types';
import { parseHash, type RouteInfo } from './routes';
import {
  addHistory,
  clearAllLocalData,
  clearHistory as clearHistoryStore,
  deleteHistory,
  loadCustomPresets,
  loadHistory,
  loadSettings,
  saveSettings,
  storageEstimate,
} from '../services/storageService';
import {
  BUILTIN_PRESETS,
  createCustomPreset,
  removeCustomPreset,
  updateCustomPreset,
  type CustomPresetInput,
} from '../services/presetService';
import { defaultAdjustments, defaultCompression, defaultCropFor, outputForPreset } from '../utils/geometry';

interface AppValue {
  route: RouteInfo;
  navigate: (path: string) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  presets: Preset[];
  customPresets: Preset[];
  photo: PhotoJob;
  signature: SignatureJob;
  setPhotoSource: (image: LoadedImage) => void;
  clearPhoto: () => void;
  updatePhotoCrop: (patch: Partial<CropSettings>) => void;
  updatePhotoAdjustments: (patch: Partial<Adjustments>) => void;
  updatePhotoOutput: (patch: Partial<OutputSettings>) => void;
  updatePhotoCompression: (patch: Partial<CompressionSettings>) => void;
  setPhotoResult: (result: PhotoJob['result'], report?: ValidationReport | null) => void;
  setPhotoPreset: (id: string) => void;
  setSignatureSource: (image: LoadedImage) => void;
  clearSignature: () => void;
  updateSignatureCrop: (patch: Partial<CropSettings>) => void;
  updateSignatureAdjustments: (patch: Partial<Adjustments>) => void;
  updateSignatureSettings: (patch: Partial<SignatureJob>) => void;
  updateSignatureOutput: (patch: Partial<OutputSettings>) => void;
  updateSignatureCompression: (patch: Partial<CompressionSettings>) => void;
  setSignatureResult: (result: SignatureJob['result'], report?: ValidationReport | null) => void;
  setSignaturePreset: (id: string) => void;
  activePreset: Preset | null;
  history: HistoryRecord[];
  recordHistory: (record: HistoryRecord) => Promise<void>;
  removeHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  savePreset: (input: CustomPresetInput) => Promise<Preset>;
  updatePreset: (id: string, input: CustomPresetInput) => Promise<Preset>;
  deletePreset: (id: string) => Promise<void>;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  storage: { usage: number; quota: number } | null;
  refreshStorage: () => Promise<void>;
  clearEverything: () => Promise<void>;
  lastExport: { kind: 'photo' | 'signature'; fileName: string; at: string } | null;
  setLastExport: (value: AppValue['lastExport']) => void;
}

const AppContext = createContext<AppValue | null>(null);

function makePhotoJob(preset: Preset, settings: Settings): PhotoJob {
  const crop = defaultCropFor(preset, 'photo');
  const dims = outputForPreset(preset, 'photo', crop.aspect);
  return {
    source: null,
    presetId: preset.id,
    crop,
    adjustments: defaultAdjustments(),
    output: { format: preset.photo.formats[0], width: dims.width, height: dims.height },
    compression: defaultCompression(preset, 'photo', settings.safetyMarginKB),
    result: null,
    finalBlob: null,
    validation: null,
  };
}

function makeSignatureJob(preset: Preset, settings: Settings): SignatureJob {
  const crop = defaultCropFor(preset, 'signature');
  const dims = outputForPreset(preset, 'signature', crop.aspect);
  // Transparency only makes sense when the preset's default format can
  // store it. JPEG-only presets (e.g. IBPS) need a white-paper background,
  // so defaulting to Transparent only produced a warning on first open.
  const transparent = preset.signature.formats[0] === 'image/png';
  return {
    source: null,
    presetId: preset.id,
    crop,
    adjustments: defaultAdjustments(),
    transparent,
    inkThreshold: 82,
    output: { format: preset.signature.formats[0], width: dims.width, height: dims.height },
    compression: defaultCompression(preset, 'signature', settings.safetyMarginKB),
    result: null,
    finalBlob: null,
    validation: null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteInfo>(() => parseHash(window.location.hash));
  const [settings, setSettings] = useState<Settings>({
    appearance: 'light',
    density: 'comfortable',
    defaultFormat: 'image/jpeg',
    defaultCompressionMode: 'auto',
    safetyMarginKB: 2,
    defaultPhotoPresetId: 'ibps-po-mt-2025',
    confirmBeforeDelete: true,
    reduceMotion: false,
  });
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [photo, setPhoto] = useState<PhotoJob>(() =>
    makePhotoJob(BUILTIN_PRESETS[0], {
      appearance: 'light',
      density: 'comfortable',
      defaultFormat: 'image/jpeg',
      defaultCompressionMode: 'auto',
      safetyMarginKB: 2,
      defaultPhotoPresetId: 'ibps-po-mt-2025',
      confirmBeforeDelete: true,
      reduceMotion: false,
    }),
  );
  const [signature, setSignature] = useState<SignatureJob>(() =>
    makeSignatureJob(BUILTIN_PRESETS[0], {
      appearance: 'light',
      density: 'comfortable',
      defaultFormat: 'image/jpeg',
      defaultCompressionMode: 'auto',
      safetyMarginKB: 2,
      defaultPhotoPresetId: 'ibps-po-mt-2025',
      confirmBeforeDelete: true,
      reduceMotion: false,
    }),
  );
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [lastExport, setLastExport] = useState<AppValue['lastExport']>(null);
  const hydrated = useRef(false);

  const navigate = useCallback((path: string) => {
    if (window.location.hash !== `#${path}`) {
      window.location.hash = path;
    } else {
      setRoute(parseHash(`#${path}`));
    }
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) window.location.replace('#/welcome');
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const refreshStorage = useCallback(async () => {
    setStorage(await storageEstimate());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [loadedSettings, loadedPresets, loadedHistory] = await Promise.all([
        loadSettings(),
        loadCustomPresets(),
        loadHistory(),
      ]);
      if (!alive) return;
      setSettings(loadedSettings);
      setCustomPresets(loadedPresets);
      setHistory(loadedHistory);
      const all = [...BUILTIN_PRESETS, ...loadedPresets];
      const preset = all.find((p) => p.id === loadedSettings.defaultPhotoPresetId) ?? BUILTIN_PRESETS[0];
      setPhoto(makePhotoJob(preset, loadedSettings));
      setSignature(makeSignatureJob(preset, loadedSettings));
      hydrated.current = true;
      void refreshStorage();
    })();
    return () => {
      alive = false;
    };
  }, [refreshStorage]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.appearance;
    root.dataset.density = settings.density;
    root.dataset.reduceMotion = settings.reduceMotion ? 'true' : 'false';
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const presets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);
  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === photo.presetId) ?? BUILTIN_PRESETS[0],
    [presets, photo.presetId],
  );

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 5200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const setPhotoSource = useCallback((image: LoadedImage) => {
    setPhoto((current) => {
      const preset = presets.find((p) => p.id === current.presetId) ?? BUILTIN_PRESETS[0];
      const crop = defaultCropFor(preset, 'photo');
      const dims = outputForPreset(preset, 'photo', crop.aspect);
      return {
        ...current,
        source: image,
        crop,
        adjustments: defaultAdjustments(),
        output: { format: current.output.format, ...dims },
        result: null,
        finalBlob: null,
        validation: null,
      };
    });
  }, [presets]);

  const clearPhoto = useCallback(() => {
    setPhoto((current) => {
      const preset = presets.find((p) => p.id === current.presetId) ?? BUILTIN_PRESETS[0];
      return {
        ...makePhotoJob(preset, settings),
        output: { ...makePhotoJob(preset, settings).output, format: current.output.format },
      };
    });
  }, [presets, settings]);

  const updatePhotoCrop = useCallback((patch: Partial<CropSettings>) => {
    setPhoto((current) => {
      const crop = { ...current.crop, ...patch };
      const preset = presets.find((p) => p.id === current.presetId) ?? BUILTIN_PRESETS[0];
      const dims = outputForPreset(preset, 'photo', crop.aspect);
      return {
        ...current,
        crop,
        output: { ...current.output, ...dims },
        result: null,
        finalBlob: null,
        validation: null,
      };
    });
  }, [presets]);

  const updatePhotoAdjustments = useCallback((patch: Partial<Adjustments>) => {
    setPhoto((current) => ({
      ...current,
      adjustments: { ...current.adjustments, ...patch },
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const updatePhotoOutput = useCallback((patch: Partial<OutputSettings>) => {
    setPhoto((current) => ({
      ...current,
      output: { ...current.output, ...patch },
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const updatePhotoCompression = useCallback((patch: Partial<CompressionSettings>) => {
    setPhoto((current) => ({
      ...current,
      compression: { ...current.compression, ...patch },
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const setPhotoResult = useCallback(
    (result: PhotoJob['result'], report: ValidationReport | null = null) => {
      setPhoto((current) => ({
        ...current,
        result,
        finalBlob: result?.blob ?? null,
        validation: report,
      }));
    },
    [],
  );

  const setPhotoPreset = useCallback((id: string) => {
    setPhoto((current) => {
      const preset = presets.find((p) => p.id === id) ?? BUILTIN_PRESETS[0];
      const crop = defaultCropFor(preset, 'photo');
      const dims = outputForPreset(preset, 'photo', crop.aspect);
      return {
        ...makePhotoJob(preset, settings),
        source: current.source,
        crop,
        output: { format: preset.photo.formats[0], ...dims },
      };
    });
  }, [presets, settings]);

  const setSignatureSource = useCallback((image: LoadedImage) => {
    setSignature((current) => {
      const preset = presets.find((p) => p.id === current.presetId) ?? BUILTIN_PRESETS[0];
      const crop = defaultCropFor(preset, 'signature');
      const dims = outputForPreset(preset, 'signature', crop.aspect);
      return {
        ...current,
        source: image,
        crop,
        adjustments: defaultAdjustments(),
        output: { format: current.output.format, ...dims },
        result: null,
        finalBlob: null,
        validation: null,
      };
    });
  }, [presets]);

  const clearSignature = useCallback(() => {
    setSignature((current) => {
      const preset = presets.find((p) => p.id === current.presetId) ?? BUILTIN_PRESETS[0];
      return makeSignatureJob(preset, settings);
    });
  }, [presets, settings]);

  const updateSignatureCrop = useCallback((patch: Partial<CropSettings>) => {
    setSignature((current) => {
      const crop = { ...current.crop, ...patch };
      const preset = presets.find((p) => p.id === current.presetId) ?? BUILTIN_PRESETS[0];
      const dims = outputForPreset(preset, 'signature', crop.aspect);
      return {
        ...current,
        crop,
        output: { ...current.output, ...dims },
        result: null,
        finalBlob: null,
        validation: null,
      };
    });
  }, [presets]);

  const updateSignatureAdjustments = useCallback((patch: Partial<Adjustments>) => {
    setSignature((current) => ({
      ...current,
      adjustments: { ...current.adjustments, ...patch },
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const updateSignatureSettings = useCallback((patch: Partial<SignatureJob>) => {
    setSignature((current) => ({
      ...current,
      ...patch,
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const updateSignatureOutput = useCallback((patch: Partial<OutputSettings>) => {
    setSignature((current) => ({
      ...current,
      output: { ...current.output, ...patch },
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const updateSignatureCompression = useCallback((patch: Partial<CompressionSettings>) => {
    setSignature((current) => ({
      ...current,
      compression: { ...current.compression, ...patch },
      result: null,
      finalBlob: null,
      validation: null,
    }));
  }, []);

  const setSignatureResult = useCallback(
    (result: SignatureJob['result'], report: ValidationReport | null = null) => {
      setSignature((current) => ({
        ...current,
        result,
        finalBlob: result?.blob ?? null,
        validation: report,
      }));
    },
    [],
  );

  const setSignaturePreset = useCallback((id: string) => {
    setSignature((current) => {
      const preset = presets.find((p) => p.id === id) ?? BUILTIN_PRESETS[0];
      const crop = defaultCropFor(preset, 'signature');
      const dims = outputForPreset(preset, 'signature', crop.aspect);
      return {
        ...makeSignatureJob(preset, settings),
        source: current.source,
        crop,
        output: { format: preset.signature.formats[0], ...dims },
      };
    });
  }, [presets, settings]);

  const recordHistory = useCallback(async (record: HistoryRecord) => {
    await addHistory(record);
    setHistory(await loadHistory());
  }, []);

  const removeHistory = useCallback(async (id: string) => {
    await deleteHistory(id);
    setHistory(await loadHistory());
  }, []);

  const clearHistory = useCallback(async () => {
    await clearHistoryStore();
    setHistory([]);
  }, []);

  const savePreset = useCallback(async (input: CustomPresetInput) => {
    const preset = await createCustomPreset(input);
    setCustomPresets(await loadCustomPresets());
    return preset;
  }, []);

  const updatePreset = useCallback(async (id: string, input: CustomPresetInput) => {
    const preset = await updateCustomPreset(id, input);
    setCustomPresets(await loadCustomPresets());
    return preset;
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    await removeCustomPreset(id);
    setCustomPresets(await loadCustomPresets());
    setPhoto((current) =>
      current.presetId === id ? makePhotoJob(BUILTIN_PRESETS[0], settings) : current,
    );
    setSignature((current) =>
      current.presetId === id ? makeSignatureJob(BUILTIN_PRESETS[0], settings) : current,
    );
  }, [settings]);

  const clearEverything = useCallback(async () => {
    await clearAllLocalData();
    setHistory([]);
    setCustomPresets([]);
    setPhoto(makePhotoJob(BUILTIN_PRESETS[0], settings));
    setSignature(makeSignatureJob(BUILTIN_PRESETS[0], settings));
    await refreshStorage();
  }, [refreshStorage, settings]);

  const value: AppValue = {
    route,
    navigate,
    settings,
    updateSettings,
    presets,
    customPresets,
    photo,
    signature,
    setPhotoSource,
    clearPhoto,
    updatePhotoCrop,
    updatePhotoAdjustments,
    updatePhotoOutput,
    updatePhotoCompression,
    setPhotoResult,
    setPhotoPreset,
    setSignatureSource,
    clearSignature,
    updateSignatureCrop,
    updateSignatureAdjustments,
    updateSignatureSettings,
    updateSignatureOutput,
    updateSignatureCompression,
    setSignatureResult,
    setSignaturePreset,
    activePreset,
    history,
    recordHistory,
    removeHistory,
    clearHistory,
    savePreset,
    updatePreset,
    deletePreset,
    toasts,
    pushToast,
    dismissToast,
    storage,
    refreshStorage,
    clearEverything,
    lastExport,
    setLastExport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
