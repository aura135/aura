import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, CheckCircle, Smartphone } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[AURA PWA] App installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check modern navigator.install() first (Web Install API standard)
    if (typeof navigator.install === 'function') {
      try {
        await navigator.install();
        setInstallStatus('Installed successfully!');
        setIsInstallable(false);
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          setInstallStatus('Installation cancelled.');
          return;
        }
      }
    }

    // Fallback: beforeinstallprompt prompt
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallStatus('App installed!');
      setIsInstallable(false);
    } else {
      setInstallStatus('Installation dismissed.');
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-aura-purple/20 via-aura-surface to-aura-cyan/20 border-b border-aura-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-aura-cyan to-aura-purple flex items-center justify-center shadow-lg shadow-aura-cyan/20 flex-shrink-0">
            <Smartphone className="w-5 h-5 text-aura-bg" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <span>Install AURA on this Device</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-aura-cyan/20 text-aura-cyan border border-aura-cyan/30">
                PWA Ready
              </span>
            </p>
            <p className="text-xs text-aura-muted">
              Get an ultra-responsive standalone app experience with offline support and zero APK downloads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="btn-neon-cyan py-1.5 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-transform cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          ) : (
            <div className="text-xs text-aura-cyan bg-aura-card border border-aura-cyan/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-aura-cyan animate-spin-slow" />
              <span>Installable via Chrome Menu (⋮ &rarr; Install App)</span>
            </div>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg text-aura-darkMuted hover:text-white hover:bg-aura-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
