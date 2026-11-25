import React, { useState } from 'react';
import { Download, Wifi, WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const ConnectionStatusBadge: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      role="status"
      aria-live="polite"
      title={
        isOnline
          ? 'Online · Local-first auto-save to IndexedDB is active'
          : 'Offline · Working locally from IndexedDB; online-only actions paused'
      }
      className={`inline-flex h-[30px] items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium whitespace-nowrap select-none transition-colors ${
        isOnline
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
          : 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
        aria-hidden="true"
      />
      {isOnline ? (
        <Wifi className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <WifiOff className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (typeof window !== 'undefined' && typeof window.desktop !== 'undefined') {
    return null;
  }

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title="Install SlideMotion Studio as an offline desktop or mobile app"
        aria-label="Install app"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)] transition-colors whitespace-nowrap shrink-0 min-h-[34px]"
      >
        <Download className="h-3.5 w-3.5 text-[var(--accent-500)]" />
        {!compact && <span>Install App</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install on iOS"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] whitespace-nowrap shrink-0 min-h-[34px]"
        >
          <Download className="h-3.5 w-3.5 text-[var(--accent-500)]" />
          {!compact && <span>Install</span>}
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Install SlideMotion Studio on iPhone or iPad"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Install on iPhone or iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation guide"
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                <li>1. Tap the Share button in Safari’s toolbar.</li>
                <li>2. Scroll down and choose Add to Home Screen.</li>
                <li>3. Launch SlideMotion Studio from your home screen for offline use.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-[var(--accent-600)] py-2 text-xs font-semibold text-[var(--accent-contrast)]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 left-4 z-40 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/90 px-3 py-1.5 text-xs font-medium text-amber-100 shadow-lg backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span>Offline mode · Saving locally to IndexedDB</span>
    </div>
  );
};
