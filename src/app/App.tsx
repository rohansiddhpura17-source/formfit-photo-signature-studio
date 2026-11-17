import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { AppProvider, useApp } from './AppContext';
import { AppShell } from '../components/layout/AppShell';
import { Welcome } from '../pages/Welcome/Welcome';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { PhotoUpload } from '../pages/PhotoStudio/PhotoUpload';
import { PhotoCrop } from '../pages/PhotoStudio/PhotoCrop';
import { PhotoAdjust } from '../pages/PhotoStudio/PhotoAdjust';
import { SignatureUpload } from '../pages/SignatureStudio/SignatureUpload';
import { SignatureEditor } from '../pages/SignatureStudio/SignatureEditor';
import { PresetLibrary } from '../pages/PresetLibrary/PresetLibrary';
import { PresetDetails } from '../pages/PresetLibrary/PresetDetails';
import { CompressionStudio } from '../pages/CompressionStudio/CompressionStudio';
import { ComparePage } from '../pages/CompressionStudio/ComparePage';
import { CustomPresets } from '../pages/CustomPresetBuilder/CustomPresets';
import { CustomPresetForm } from '../pages/CustomPresetBuilder/CustomPresetForm';
import { ExportCenter } from '../pages/ExportCenter/ExportCenter';
import { ExportSuccess } from '../pages/ExportCenter/ExportSuccess';
import { ProcessingHistory } from '../pages/ProcessingHistory/ProcessingHistory';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { Button } from '../components/common/Button';
import { RotateCcw } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FORMFIT crashed', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <div className="crash__card">
            <p className="eyebrow">Recoverable error</p>
            <h1>The studio hit an unexpected problem.</h1>
            <p>
              Your uploaded images were never stored, so nothing was lost from this device. Reload the
              application to continue.
            </p>
            <pre>{this.state.error.message}</pre>
            <Button variant="primary" icon={RotateCcw} onClick={() => window.location.reload()}>
              Reload FORMFIT
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  const { route } = useApp();
  const segments = route.segments;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.path]);

  if (segments.length === 0 || segments[0] === 'welcome') {
    return <Welcome />;
  }

  let page: ReactNode;
  switch (segments[0]) {
    case 'dashboard':
      page = <Dashboard />;
      break;
    case 'photo':
      page = segments[1] === 'crop' ? <PhotoCrop /> : segments[1] === 'adjust' ? <PhotoAdjust /> : <PhotoUpload />;
      break;
    case 'signature':
      page = segments[1] === 'editor' ? <SignatureEditor /> : <SignatureUpload />;
      break;
    case 'presets':
      page = segments[1] ? <PresetDetails id={segments[1]} /> : <PresetLibrary />;
      break;
    case 'compression':
      page = <CompressionStudio />;
      break;
    case 'compare':
      page = <ComparePage />;
      break;
    case 'custom-presets':
      page = segments[1] === 'new' ? <CustomPresetForm /> : <CustomPresets />;
      break;
    case 'export':
      page = segments[1] === 'success' ? <ExportSuccess /> : <ExportCenter />;
      break;
    case 'history':
      page = <ProcessingHistory />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <Dashboard />;
  }

  return <AppShell>{page}</AppShell>;
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router />
      </AppProvider>
    </ErrorBoundary>
  );
}
