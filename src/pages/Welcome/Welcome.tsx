import { ArrowRight, ArrowUpRight, Check, FileSliders, Lock, ShieldCheck, WifiOff } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { ROUTES } from '../../app/routes';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/layout/Sidebar';

export function Welcome() {
  const { navigate } = useApp();

  return (
    <div className="welcome">
      <header className="welcome__top">
        <Logo />
        <span className="welcome__edition">BSERC · Week 2 · Project 02</span>
        <button className="text-link" onClick={() => navigate(ROUTES.presets)}>
          Preset library <ArrowUpRight size={13} aria-hidden />
        </button>
      </header>

      <main className="welcome__grid">
        <section className="welcome__copy">
          <p className="eyebrow eyebrow--rule">Offline photo &amp; signature studio</p>
          <h1 className="welcome__title">
            Form photos,
            <br />
            <span className="welcome__title-accent">finished properly.</span>
          </h1>
          <p className="welcome__lede">
            Prepare a photograph and signature that match the exact dimensions, format and KB
            limit of your application form — without sending a single pixel to a server.
          </p>

          <div className="welcome__actions">
            <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => navigate(ROUTES.dashboard)}>
              Start preparing
            </Button>
            <Button variant="ghost" size="lg" icon={FileSliders} onClick={() => navigate(ROUTES.presets)}>
              Browse official presets
            </Button>
          </div>

          <div className="welcome__privacy">
            <div>
              <ShieldCheck size={18} strokeWidth={1.7} aria-hidden />
              <span>
                <strong>Private by architecture</strong>
                Images are decoded, cropped and encoded on this device.
              </span>
            </div>
            <div>
              <WifiOff size={18} strokeWidth={1.7} aria-hidden />
              <span>
                <strong>Works with Wi-Fi off</strong>
                No cloud APIs, remote fonts or tracking scripts.
              </span>
            </div>
            <div>
              <Lock size={18} strokeWidth={1.7} aria-hidden />
              <span>
                <strong>No account</strong>
                Nothing to sign up for, nothing to sync.
              </span>
            </div>
          </div>
        </section>

        <aside className="welcome__proof" aria-label="Example preset specification">
          <div className="proof-card">
            <div className="proof-card__head">
              <span className="proof-card__kicker">Specimen sheet</span>
              <span className="proof-card__preset">IBPS PO / MT</span>
            </div>

            <div className="proof-photo-wrap">
              <div className="proof-photo">
                <svg viewBox="0 0 220 253" role="img" aria-label="Illustration of a prepared portrait">
                  <rect width="220" height="253" fill="#E7DFD2" />
                  <circle cx="110" cy="98" r="48" fill="#D6A17E" />
                  <path d="M62 98a48 48 0 0 1 96 0c0-30-18-58-48-58S62 68 62 98Z" fill="#2B2621" />
                  <path d="M46 253c4-62 32-92 64-92s60 30 64 92Z" fill="#2E3440" />
                  <path d="M99 156h22l-11 24Z" fill="#F4EFE6" />
                  <circle cx="94" cy="96" r="3.2" fill="#241C17" />
                  <circle cx="126" cy="96" r="3.2" fill="#241C17" />
                  <path d="M101 120q9 6 18 0" stroke="#8D4A43" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div className="proof-frame" aria-hidden>
                <span className="proof-frame__corner proof-frame__corner--tl" />
                <span className="proof-frame__corner proof-frame__corner--tr" />
                <span className="proof-frame__corner proof-frame__corner--bl" />
                <span className="proof-frame__corner proof-frame__corner--br" />
                <span className="proof-frame__oval" />
                <span className="proof-frame__line" />
              </div>
              <div className="proof-dim">200 × 230 px</div>
            </div>

            <div className="proof-sig">
              <div>
                <p className="proof-sig__label">Signature</p>
                <p className="proof-sig__meta">140 × 60 px · 10–20 KB</p>
              </div>
              <svg viewBox="0 0 300 86" aria-label="Illustration of a signature" className="proof-sig__ink">
                <path
                  d="M18 62c10-34 22-40 28-24s-4 34 8 30 14-30 24-26 2 32 14 28 10-34 22-32 0 30 12 28 12-26 24-24 12 18 26 14 20-18 34-16"
                  fill="none"
                  stroke="#1C2A44"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path d="M70 72c50 8 120 6 190-10" fill="none" stroke="#1C2A44" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>

            <div className="proof-card__foot">
              <span><Check size={12} strokeWidth={2.6} aria-hidden /> JPEG</span>
              <span><Check size={12} strokeWidth={2.6} aria-hidden /> Under limit</span>
              <span className="proof-card__verified">Verified source</span>
            </div>
          </div>
          <p className="welcome__proof-note">
            Example specifications taken from the official IBPS registration guidelines. Always
            confirm the requirements against the current notice for your form.
          </p>
        </aside>
      </main>

      <footer className="welcome__foot">
        <span>Prepare.</span>
        <span>Compress.</span>
        <span>Validate.</span>
        <span>Download.</span>
        <span className="welcome__foot-note">No account · No uploads · No tracking</span>
      </footer>
    </div>
  );
}
