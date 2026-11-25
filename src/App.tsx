import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Download,
  FileJson,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Layers,
  Play,
  Presentation,
  Printer,
  Redo2,
  Save,
  Settings,
  Shapes,
  Sparkles,
  Timer,
  Undo2,
  Wand2,
} from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ElementRenderer } from './components/ElementRenderer';
import { ConnectionStatusBadge, OfflineIndicator, PWAInstallButton } from './components/PWAControls';
import { SettingsModal } from './components/SettingsModal';
import { StudioBreadcrumb } from './components/StudioBreadcrumb';
import { STAGE_DIMENSIONS } from './data/themes';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { isDesktopApp, useOnlineStatus } from './hooks/useOnlineStatus';
import { AnimationLab } from './modules/animations/AnimationLab';
import { ElementChoreographer } from './modules/choreographer/ElementChoreographer';
import { DesignerWorkspace } from './modules/designer/DesignerWorkspace';
import { GuidedDesignStudio } from './modules/guided/GuidedDesignStudio';
import { LearnHub } from './modules/learn/LearnHub';
import { MergeShapesLab } from './modules/merge/MergeShapesLab';
import { AudienceMirrorView } from './modules/presenter/AudienceMirrorView';
import { PresenterOverlay } from './modules/presenter/PresenterOverlay';
import { TransitionsLab } from './modules/transitions/TransitionsLab';
import { useStudioStore } from './store/useStudioStore';
import { StudioModuleId } from './types/presentation';
import { exportProjectAsHtmlPresentation, exportSlideAsPng } from './utils/export';
import { openProjectFile, saveProjectFile } from './utils/storage';

const MODULES: Array<{
  id: StudioModuleId;
  label: string;
  shortLabel: string;
  phase: number;
  summary: string;
}> = [
  {
    id: 'designer',
    label: 'Slide Designer',
    shortLabel: 'Design',
    phase: 1,
    summary: 'Full vector slide editor with shapes, typography, layers, smart guides and themes.',
  },
  {
    id: 'animations',
    label: 'Animation Lab',
    shortLabel: 'Animate',
    phase: 2,
    summary: 'Interactive Entrance, Emphasis, Exit and Motion Path lab with Animation Pane and recipes.',
  },
  {
    id: 'transitions',
    label: 'Transitions Lab',
    shortLabel: 'Transitions',
    phase: 3,
    summary: '30+ Subtle, Exciting and Dynamic slide transitions plus a full Morph deep-dive.',
  },
  {
    id: 'merge',
    label: 'Merge Shapes Lab',
    shortLabel: 'Merge',
    phase: 4,
    summary: 'Real boolean SVG geometry (Union, Combine, Fragment, Intersect, Subtract) with challenges.',
  },
  {
    id: 'guided',
    label: 'Guided Studio',
    shortLabel: 'Guided',
    phase: 5,
    summary: 'Step-by-step template trainer with ghost overlay and automated coordinate/colour checking.',
  },
  {
    id: 'choreographer',
    label: 'Choreographer',
    shortLabel: 'Choreograph',
    phase: 6,
    summary: 'Multi-element motion presets: staggered builds, kinetic type, parallax and object journeys.',
  },
  {
    id: 'learn',
    label: 'Learn Hub',
    shortLabel: 'Learn',
    phase: 7,
    summary: 'Structured learning paths, Do & Don’t galleries, scenario quizzes and progress dashboard.',
  },
];

const VALID_MODULES: StudioModuleId[] = MODULES.map((m) => m.id);

export default function App() {
  const location = useLocation();
  const isAudienceWindow =
    location.pathname === '/audience' ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('audience') === '1');

  if (isAudienceWindow) {
    return <AudienceMirrorView />;
  }
  return <StudioApp />;
}

function StudioApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const hydrate = useStudioStore((s) => s.hydrate);
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const settings = useStudioStore((s) => s.settings);
  const activeModule = useStudioStore((s) => s.activeModule);
  const past = useStudioStore((s) => s.past);
  const future = useStudioStore((s) => s.future);

  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const setProjectName = useStudioStore((s) => s.setProjectName);
  const loadProject = useStudioStore((s) => s.loadProject);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [presenterRehearse, setPresenterRehearse] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const prevPathRef = useRef(location.pathname);
  const prevModuleRef = useRef(activeModule);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  useKeyboardShortcuts(notify);

  // Two-way synchronisation between HashRouter URL and Zustand activeModule
  useEffect(() => {
    const slug = location.pathname.replace(/^\/+/, '').split('/')[0] as StudioModuleId;
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      if (VALID_MODULES.includes(slug) && slug !== activeModule) {
        prevModuleRef.current = slug;
        setActiveModule(slug);
      }
      return;
    }
    if (activeModule !== prevModuleRef.current) {
      prevModuleRef.current = activeModule;
      const targetPath = `/${activeModule}`;
      if (location.pathname !== targetPath) {
        prevPathRef.current = targetPath;
        navigate(targetPath);
      }
    }
  }, [activeModule, location.pathname, navigate, setActiveModule]);

  useEffect(() => {
    const onPresentShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'F5') {
        e.preventDefault();
        setPresenterRehearse(e.shiftKey);
        setPresenterOpen(true);
      }
    };
    window.addEventListener('keydown', onPresentShortcut);
    return () => window.removeEventListener('keydown', onPresentShortcut);
  }, []);

  useEffect(() => {
    const api = window.desktop ?? window.electronAPI;
    if (!api) return;
    return api.onMenuAction((action) => {
      if (action === 'present') {
        setPresenterRehearse(false);
        setPresenterOpen(true);
      } else if (action === 'rehearse') {
        setPresenterRehearse(true);
        setPresenterOpen(true);
      } else if (action === 'open') {
        void openProjectFile().then((loaded) => {
          if (loaded) {
            useStudioStore.getState().loadProject(loaded);
            notify(`Opened "${loaded.name}"`);
          }
        });
      } else if (action === 'save') {
        void saveProjectFile(useStudioStore.getState().project).then((saved) => {
          if (saved) notify('Project saved to JSON file');
        });
      }
    });
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Sync theme, accent, text size, density, and reduce-motion classes on documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-high-contrast', 'reduce-motion');
    if (settings.theme === 'dark') root.classList.add('dark');
    if (settings.theme === 'high-contrast') {
      root.classList.add('dark', 'theme-high-contrast');
    }
    if (settings.reduceMotion) root.classList.add('reduce-motion');
    root.setAttribute('data-accent', settings.accent);
    root.setAttribute('data-text-size', settings.textSize);
    root.setAttribute('data-density', settings.density);
  }, [settings.accent, settings.density, settings.reduceMotion, settings.textSize, settings.theme]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const activeSlideIndex = Math.max(0, project.slides.findIndex((s) => s.id === activeSlideId));
  const activeSlide = project.slides[activeSlideIndex] ?? project.slides[0];
  const dims = STAGE_DIMENSIONS[project.aspectRatio];

  const handleOpenFile = async () => {
    const loaded = await openProjectFile();
    if (loaded) {
      loadProject(loaded);
      notify(`Opened "${loaded.name}"`);
    }
  };

  const handleSaveFile = async () => {
    const saved = await saveProjectFile(project);
    if (saved) notify('Project exported to JSON file');
  };

  const handleExportPng = async () => {
    setExportMenuOpen(false);
    if (!activeSlide) return;
    try {
      await exportSlideAsPng(activeSlide, activeSlideIndex, project);
      notify(`Exported Slide ${activeSlideIndex + 1} as PNG`);
    } catch {
      notify('Could not render PNG in this browser');
    }
  };

  const handleExportHtml = () => {
    setExportMenuOpen(false);
    exportProjectAsHtmlPresentation(project);
    notify('Exported standalone HTML presentation');
  };

  const handleExportPdf = () => {
    setExportMenuOpen(false);
    window.print();
  };

  const handleCheckWebUpdates = () => {
    setExportMenuOpen(false);
    if (!isOnline) {
      notify('Online only: You are offline. All slides remain saved locally in IndexedDB.');
      return;
    }
    notify(
      isDesktopApp()
        ? 'Desktop edition is running with bundled offline assets.'
        : 'You are using the latest cached web version.',
    );
  };

  const mobileTabs: Array<{ id: StudioModuleId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'designer', label: 'Design', icon: Layers },
    { id: 'animations', label: 'Animate', icon: Sparkles },
    { id: 'transitions', label: 'Transitions', icon: Wand2 },
    { id: 'merge', label: 'Merge', icon: Shapes },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <>
      <div className="no-print flex h-[100dvh] w-[100dvw] flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] pt-safe">
        {/* Top Studio Bar */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 sm:px-4">
          {/* Zone 1: Wordmark & Project Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-display text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0">
              SlideMotion Studio
            </span>
            <input
              type="text"
              aria-label="Project title"
              value={project.name}
              onChange={(e) => setProjectName(e.target.value)}
              className="hidden md:block w-40 lg:w-44 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-subtle)] focus:border-[var(--accent-500)] focus:bg-[var(--bg-app)] focus:text-[var(--text-primary)] outline-none"
            />
          </div>

          {/* Zone 2: Primary Module Navigation (desktop/tablet) */}
          <nav aria-label="Studio modules" className="hidden md:flex items-center gap-1 overflow-x-auto">
            {MODULES.map((mod) => {
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mod.shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions & Connectivity */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ConnectionStatusBadge />

            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] disabled:opacity-30"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => void handleOpenFile()}
              title="Open Project (.json)"
              aria-label="Open Project"
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleSaveFile()}
              title="Save Project (.json)"
              aria-label="Save Project"
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]"
            >
              <Save className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPresenterRehearse(false);
                setPresenterOpen(true);
              }}
              title="Present Deck (F5)"
              aria-label="Present Deck"
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-2.5 sm:px-3 text-xs font-semibold text-[var(--accent-contrast)] hover:opacity-95 whitespace-nowrap"
            >
              <Presentation className="h-3.5 w-3.5" />
              <span>Present</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPresenterRehearse(true);
                setPresenterOpen(true);
              }}
              title="Rehearse Timings (Shift+F5)"
              aria-label="Rehearse Timings"
              className="hidden sm:inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] whitespace-nowrap"
            >
              <Timer className="h-3.5 w-3.5 text-[var(--accent-500)]" />
              <span className="hidden lg:inline">Rehearse</span>
            </button>

            {/* Export Dropdown */}
            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                aria-label="Export options"
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 shadow-2xl text-xs">
                  <button
                    type="button"
                    onClick={() => void handleExportPng()}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-panel-elevated)]"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Export Slide as PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-panel-elevated)]"
                  >
                    <Printer className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Print / Save as PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportHtml}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-panel-elevated)]"
                  >
                    <Play className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Standalone HTML Deck</span>
                  </button>
                  <div className="my-1 h-px bg-[var(--border-subtle)]" />
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleSaveFile();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-panel-elevated)]"
                  >
                    <FileJson className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Save Project JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleOpenFile();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-panel-elevated)]"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>Open Project JSON</span>
                  </button>
                  <div className="my-1 h-px bg-[var(--border-subtle)]" />
                  <button
                    type="button"
                    onClick={handleCheckWebUpdates}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-panel-elevated)] ${
                      !isOnline ? 'opacity-70' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-amber-500" />
                      <span>Check Web Updates</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                      Online only
                    </span>
                  </button>
                </div>
              )}
            </div>

            <PWAInstallButton compact />

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Appearance & Accessibility Settings"
              aria-label="Open Settings"
              className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <StudioBreadcrumb modules={MODULES} />

        {/* Active Module Viewport via HashRouter */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/designer" element={<DesignerWorkspace />} />
            <Route path="/animations" element={<AnimationLab />} />
            <Route path="/transitions" element={<TransitionsLab />} />
            <Route path="/merge" element={<MergeShapesLab />} />
            <Route path="/guided" element={<GuidedDesignStudio />} />
            <Route path="/choreographer" element={<ElementChoreographer />} />
            <Route path="/learn" element={<LearnHub />} />
            <Route path="*" element={<Navigate to={`/${activeModule}`} replace />} />
          </Routes>
        </div>

        {/* Phone Bottom Navigation Bar (< 768px) */}
        <nav
          aria-label="Mobile module navigation"
          className="md:hidden grid grid-cols-5 shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] pb-safe"
        >
          {mobileTabs.map(({ id, label, icon: Icon }) => {
            const active = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveModule(id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-[var(--accent-500)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <PresenterOverlay
          open={presenterOpen}
          startSlideIndex={activeSlideIndex}
          initialRehearse={presenterRehearse}
          onClose={() => setPresenterOpen(false)}
        />
        <OfflineIndicator />

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-16 right-4 z-50 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] shadow-xl"
          >
            {toast}
          </div>
        )}
      </div>

      {/* Print-only PDF Export Deck */}
      <div className="print-deck hidden">
        {project.slides.map((slide, idx) => {
          const bg = slide.useMaster ? project.master.background : slide.background;
          const bgCss =
            bg.mode === 'gradient'
              ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientStart}, ${bg.gradientEnd})`
              : bg.colour;
          return (
            <div key={slide.id} className="print-slide-page">
              <div
                className="relative overflow-hidden"
                style={{
                  width: dims.width,
                  height: dims.height,
                  background: bgCss,
                  zoom: 0.65,
                }}
              >
                {slide.elements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.w,
                      height: el.h,
                      transform: `rotate(${el.rotation}deg)`,
                    }}
                  >
                    <ElementRenderer element={el} />
                  </div>
                ))}
                {slide.useMaster && project.master.showSlideNumber && (
                  <div
                    className="font-mono-tabular absolute bottom-7 right-16 text-lg opacity-60"
                    style={{ color: project.master.bodyColour }}
                  >
                    {idx + 1}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
