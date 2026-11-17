import type { ReactNode } from 'react';
import { useApp } from '../../app/AppContext';
import { Header } from './Header';
import { MobileNav, Sidebar } from './Sidebar';
import { ToastViewport } from '../common/Feedback';

export function AppShell({ children }: { children: ReactNode }) {
  const { route } = useApp();
  const isStudio =
    route.path === '/photo/crop' ||
    route.path === '/photo/adjust' ||
    route.path === '/signature/editor' ||
    route.path === '/compression';

  return (
    <div className={`shell ${isStudio ? 'shell--studio' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <Sidebar />
      <div className="shell__body">
        <Header />
        <main id="main" className={`main ${isStudio ? 'main--studio' : ''}`}>
          {children}
        </main>
        <MobileNav />
      </div>
      <ToastViewport />
    </div>
  );
}
