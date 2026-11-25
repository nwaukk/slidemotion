import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Layers,
  Presentation,
  Shapes,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import { StudioModuleId } from '../types/presentation';

export interface BreadcrumbModuleMeta {
  id: StudioModuleId;
  label: string;
  shortLabel: string;
  phase: number;
  summary: string;
}

const MODULE_ICONS: Record<StudioModuleId, React.ComponentType<{ className?: string }>> = {
  designer: Layers,
  animations: Sparkles,
  transitions: Wand2,
  merge: Shapes,
  guided: FolderKanban,
  choreographer: Presentation,
  learn: BookOpen,
};

interface StudioBreadcrumbProps {
  modules: BreadcrumbModuleMeta[];
}

export const StudioBreadcrumb: React.FC<StudioBreadcrumbProps> = ({ modules }) => {
  const project = useStudioStore((s) => s.project);
  const activeModule = useStudioStore((s) => s.activeModule);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const isMasterEditMode = useStudioStore((s) => s.isMasterEditMode);

  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const setActiveSlide = useStudioStore((s) => s.setActiveSlide);
  const clearSelection = useStudioStore((s) => s.clearSelection);
  const setMasterEditMode = useStudioStore((s) => s.setMasterEditMode);

  const [openMenu, setOpenMenu] = useState<'module' | 'slide' | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const currentModule = modules.find((m) => m.id === activeModule) ?? modules[0];
  const ModuleIcon = MODULE_ICONS[currentModule.id] ?? Layers;

  const activeSlideIndex = Math.max(0, project.slides.findIndex((s) => s.id === activeSlideId));
  const activeSlide = project.slides[activeSlideIndex] ?? project.slides[0];
  const selectedElements = activeSlide
    ? activeSlide.elements.filter((el) => selectedElementIds.includes(el.id))
    : [];

  const isLearnOrReference = activeModule === 'learn';

  const handleGoPrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlide(project.slides[activeSlideIndex - 1].id);
    }
  };

  const handleGoNextSlide = () => {
    if (activeSlideIndex < project.slides.length - 1) {
      setActiveSlide(project.slides[activeSlideIndex + 1].id);
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="Breadcrumb"
      className="relative z-30 flex min-h-[34px] shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-1 text-xs sm:px-4"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] sm:gap-1.5">
        {/* 1. Deck / Studio Root */}
        <li className="flex items-center min-w-0">
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              clearSelection();
              if (isMasterEditMode) setMasterEditMode(false);
              if (activeModule !== 'designer') setActiveModule('designer');
            }}
            title="Return to Slide Designer"
            className="inline-flex max-w-[140px] sm:max-w-[200px] items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <Presentation className="h-3 w-3 shrink-0 text-[var(--accent-500)]" />
            <span className="truncate">{project.name.trim() || 'Untitled Deck'}</span>
          </button>
        </li>

        <li aria-hidden="true" className="text-[var(--text-muted)]/70">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>

        {/* 2. Current Module (with quick module switcher) */}
        <li className="relative flex items-center">
          <button
            type="button"
            onClick={() => setOpenMenu((prev) => (prev === 'module' ? null : 'module'))}
            aria-expanded={openMenu === 'module'}
            aria-haspopup="menu"
            aria-current={isLearnOrReference ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium transition-colors ${
              isLearnOrReference
                ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-panel-elevated)]'
            }`}
          >
            <ModuleIcon className="h-3 w-3 shrink-0 text-[var(--accent-500)]" />
            <span className="whitespace-nowrap">{currentModule.label}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
          </button>

          {openMenu === 'module' && (
            <div
              role="menu"
              aria-label="Switch studio module"
              className="absolute left-0 top-7 z-50 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 shadow-2xl"
            >
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Studio Modules
              </div>
              {modules.map((mod) => {
                const Icon = MODULE_ICONS[mod.id] ?? Layers;
                const isCurrent = mod.id === activeModule;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveModule(mod.id);
                      setOpenMenu(null);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{mod.label}</span>
                    </span>
                    {isCurrent && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </li>

        {/* 3. Slide Path (when not inside Learn Hub, or always show deck slide context for spatial awareness) */}
        {activeSlide && (
          <>
            <li aria-hidden="true" className="text-[var(--text-muted)]/70">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>

            <li className="relative flex items-center gap-0.5 min-w-0">
              <button
                type="button"
                onClick={() => setOpenMenu((prev) => (prev === 'slide' ? null : 'slide'))}
                aria-expanded={openMenu === 'slide'}
                aria-haspopup="menu"
                aria-current={selectedElements.length === 0 && !isLearnOrReference ? 'page' : undefined}
                title={`Slide ${activeSlideIndex + 1} of ${project.slides.length}: ${activeSlide.title}`}
                className={`inline-flex max-w-[190px] sm:max-w-[280px] items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors ${
                  selectedElements.length === 0 && !isMasterEditMode && !isLearnOrReference
                    ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-500)]'
                    : 'font-medium text-[var(--text-primary)] hover:bg-[var(--bg-panel-elevated)]'
                }`}
              >
                <span className="font-mono-tabular shrink-0 text-[10px] opacity-80">
                  Slide {activeSlideIndex + 1}/{project.slides.length}
                </span>
                <span className="opacity-50">·</span>
                <span className="truncate">{activeSlide.title || `Slide ${activeSlideIndex + 1}`}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-75" />
              </button>

              {openMenu === 'slide' && (
                <div
                  role="menu"
                  aria-label="Jump to slide"
                  className="absolute left-0 top-7 z-50 max-h-72 w-72 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 shadow-2xl"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Slides in Deck ({project.slides.length})
                  </div>
                  {project.slides.map((slideItem, index) => {
                    const isCurrentSlide = slideItem.id === activeSlide.id;
                    return (
                      <button
                        key={slideItem.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveSlide(slideItem.id);
                          setOpenMenu(null);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                          isCurrentSlide
                            ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-500)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-mono-tabular w-5 shrink-0 text-[10px] text-[var(--text-muted)]">
                            {index + 1}.
                          </span>
                          <span className="truncate">{slideItem.title || `Slide ${index + 1}`}</span>
                        </span>
                        <span className="font-mono-tabular shrink-0 text-[10px] text-[var(--text-muted)]">
                          {slideItem.elements.length} {slideItem.elements.length === 1 ? 'obj' : 'objs'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          </>
        )}

        {/* 4. Master Mode or Selected Element Path */}
        {isMasterEditMode && activeModule === 'designer' && (
          <>
            <li aria-hidden="true" className="text-[var(--text-muted)]/70">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li aria-current="page">
              <button
                type="button"
                onClick={() => setMasterEditMode(false)}
                title="Click to exit Master Layout view"
                className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-400 hover:bg-amber-500/25"
              >
                <span>Master Layout</span>
              </button>
            </li>
          </>
        )}

        {!isMasterEditMode && selectedElements.length > 0 && (
          <>
            <li aria-hidden="true" className="hidden sm:flex text-[var(--text-muted)]/70">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li aria-current="page" className="hidden sm:flex items-center min-w-0">
              <button
                type="button"
                onClick={clearSelection}
                title="Selected on canvas (click to clear selection)"
                className="inline-flex max-w-[180px] items-center gap-1 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-semibold text-[var(--accent-500)] hover:opacity-85"
              >
                <span className="truncate">
                  {selectedElements.length === 1
                    ? selectedElements[0].name
                    : `${selectedElements.length} objects selected`}
                </span>
              </button>
            </li>
          </>
        )}
      </ol>

      {/* Right-hand quick slide stepping & aspect ratio context */}
      <div className="hidden md:flex shrink-0 items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <span className="font-mono-tabular">
          {project.aspectRatio} · {activeSlide ? `${activeSlide.elements.length} ${activeSlide.elements.length === 1 ? 'object' : 'objects'}` : '0 objects'}
        </span>

        {project.slides.length > 1 && (
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-0.5">
            <button
              type="button"
              onClick={handleGoPrevSlide}
              disabled={activeSlideIndex === 0}
              title="Previous slide"
              aria-label="Previous slide"
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleGoNextSlide}
              disabled={activeSlideIndex >= project.slides.length - 1}
              title="Next slide"
              aria-label="Next slide"
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
