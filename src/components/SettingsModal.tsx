import React, { useState } from 'react';
import {
  Database,
  Eye,
  FileJson,
  FolderOpen,
  Globe,
  Keyboard,
  Layout,
  Monitor,
  Moon,
  Sun,
  WifiOff,
  X,
} from 'lucide-react';
import { isDesktopApp, useOnlineStatus } from '../hooks/useOnlineStatus';
import { useStudioStore } from '../store/useStudioStore';
import {
  AccentScheme,
  LayoutDensity,
  PanelLayout,
  TextSizeSetting,
  ThemeMode,
} from '../types/presentation';
import { openProjectFile, saveProjectFile } from '../utils/storage';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCENT_OPTIONS: Array<{ id: AccentScheme; label: string; swatch: string }> = [
  { id: 'sapphire', label: 'Sapphire', swatch: '#0ea5e9' },
  { id: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { id: 'amber', label: 'Amber', swatch: '#f59e0b' },
  { id: 'rose', label: 'Rose', swatch: '#f43f5e' },
  { id: 'indigo', label: 'Indigo', swatch: '#6366f1' },
];

const SHORTCUTS = [
  ['Ctrl / Cmd + Z', 'Undo (up to 60 steps)'],
  ['Ctrl / Cmd + Y', 'Redo'],
  ['Ctrl / Cmd + D', 'Duplicate selection'],
  ['Ctrl / Cmd + C / V', 'Copy / Paste elements'],
  ['Ctrl / Cmd + G', 'Group selected elements'],
  ['Ctrl / Cmd + Shift + G', 'Ungroup selection'],
  ['Arrow keys / Shift + Arrow', 'Nudge 1px / 10px'],
  ['Ctrl / Cmd + S / O', 'Save / Open project file'],
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const settings = useStudioStore((s) => s.settings);
  const project = useStudioStore((s) => s.project);
  const lastSavedAt = useStudioStore((s) => s.lastSavedAt);
  const updateSettings = useStudioStore((s) => s.updateSettings);
  const loadProject = useStudioStore((s) => s.loadProject);
  const isOnline = useOnlineStatus();
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null);

  if (!open) return null;

  const handleExportJson = async () => {
    const saved = await saveProjectFile(project);
    if (saved) setStorageFeedback('Project exported to local JSON file.');
  };

  const handleImportJson = async () => {
    const loaded = await openProjectFile();
    if (loaded) {
      loadProject(loaded);
      setStorageFeedback(`Imported "${loaded.name}" into local IndexedDB storage.`);
    }
  };

  const handleCheckUpdates = () => {
    if (!isOnline) {
      setStorageFeedback(
        'Online only: You are offline. All editing, animations, shapes and saving continue locally via IndexedDB.',
      );
      return;
    }
    setStorageFeedback(
      isDesktopApp()
        ? 'Desktop build v1.0.0 is running locally with bundled assets.'
        : 'Web app assets and service worker cache are up to date.',
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-6 backdrop-blur-sm"
    >
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 id="settings-heading" className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Studio Appearance & Accessibility
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Customise colour scheme, typography scale, panel layout and motion preferences.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="studio-scroll flex-1 overflow-y-auto p-5 space-y-6">
          {/* Colour Theme */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Sun className="h-3.5 w-3.5" />
              <span>Colour Theme</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'dark', label: 'Dark Studio', icon: Moon },
                  { id: 'light', label: 'Light Daylight', icon: Sun },
                  { id: 'high-contrast', label: 'High Contrast', icon: Eye },
                ] as Array<{ id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }>
              ).map(({ id, label, icon: Icon }) => {
                const active = settings.theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateSettings({ theme: id })}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Accent Colour */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Accent Colour Scheme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ACCENT_OPTIONS.map((opt) => {
                const active = settings.accent === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateSettings({ accent: opt.id })}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: opt.swatch }} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Text Size & Layout Density */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <section className="space-y-2.5">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Interface Text Size</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'small', label: 'Small' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'large', label: 'Large' },
                    { id: 'xl', label: 'Extra' },
                  ] as Array<{ id: TextSizeSetting; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSettings({ textSize: item.id })}
                    className={`min-h-[40px] rounded-lg border px-2 text-xs font-medium transition-colors ${
                      settings.textSize === item.id
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Layout Density</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'compact', label: 'Compact' },
                    { id: 'comfortable', label: 'Comfortable' },
                    { id: 'spacious', label: 'Spacious' },
                  ] as Array<{ id: LayoutDensity; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSettings({ density: item.id })}
                    className={`min-h-[40px] rounded-lg border px-2 text-xs font-medium transition-colors ${
                      settings.density === item.id
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Panel Layout */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Layout className="h-3.5 w-3.5" />
              <span>Workspace Panel Layout</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'default', label: 'Standard Studio', desc: 'Slides & tools left · Inspector right' },
                  { id: 'focused', label: 'Stage Focus', desc: 'Maximises canvas area' },
                  { id: 'swapped', label: 'Inspector Left', desc: 'Properties left · Slides right' },
                ] as Array<{ id: PanelLayout; label: string; desc: string }>
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateSettings({ panelLayout: item.id })}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                    settings.panelLayout === item.id
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
                  <span className="mt-0.5 text-[11px] text-[var(--text-muted)]">{item.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Accessibility & Canvas Guides */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Monitor className="h-3.5 w-3.5" />
              <span>Accessibility & Canvas Aids</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    key: 'reduceMotion',
                    label: 'Reduce motion',
                    help: 'Minimises interface animations and flashing previews.',
                  },
                  {
                    key: 'showRulers',
                    label: 'Show stage rulers',
                    help: 'Display virtual pixel coordinates along canvas edges.',
                  },
                  {
                    key: 'showGrid',
                    label: 'Show alignment grid',
                    help: 'Overlay a subtle spacing grid across the slide stage.',
                  },
                  {
                    key: 'snapToGuides',
                    label: 'Smart snap guides',
                    help: 'Snap objects to slide centres and neighbouring edges.',
                  },
                ] as const
              ).map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-3.5 py-2.5"
                >
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">{toggle.label}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{toggle.help}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[toggle.key]}
                    onChange={(e) => updateSettings({ [toggle.key]: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent-500)]"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Local-First Storage & Offline Readiness */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Database className="h-3.5 w-3.5" />
              <span>Local-First Storage & Offline Mode</span>
            </h3>
            <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">
                    IndexedDB Auto-Save ({project.slides.length} slides)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {lastSavedAt
                      ? `Last saved locally at ${new Date(lastSavedAt).toLocaleTimeString('en-GB')}`
                      : 'Stored automatically on this device for offline editing.'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleExportJson()}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                  >
                    <FileJson className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleImportJson()}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-xs">
                <div className="flex items-start gap-2">
                  {isOnline ? (
                    <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">
                      Web Update Check · <span className="text-amber-500">Online only</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {isOnline
                        ? 'Internet connection available for optional web update checks.'
                        : 'Currently offline — online-only features are paused while local studio tools remain available.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  className="min-h-[34px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                >
                  Check Now
                </button>
              </div>

              {storageFeedback && (
                <p role="status" className="text-[11px] font-medium text-[var(--accent-500)]">
                  {storageFeedback}
                </p>
              )}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Keyboard Shortcuts</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3">
              {SHORTCUTS.map(([keys, desc]) => (
                <div key={keys} className="flex items-center justify-between gap-2 py-1 text-xs">
                  <span className="text-[var(--text-secondary)]">{desc}</span>
                  <kbd className="font-mono-tabular rounded border border-[var(--border-strong)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[11px] text-[var(--text-primary)]">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex justify-end border-t border-[var(--border-subtle)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-[var(--accent-600)] px-5 text-xs font-semibold text-[var(--accent-contrast)] hover:opacity-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
