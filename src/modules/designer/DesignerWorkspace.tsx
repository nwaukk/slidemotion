import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  LayoutGrid,
  Maximize2,
  PanelLeft,
  Play,
  Plus,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { AnimationPaneTimeline } from '../../components/AnimationPaneTimeline';
import { useStudioStore } from '../../store/useStudioStore';
import { PanelVisibilitySettings } from '../../types/presentation';
import { AssetsPanel } from './AssetsPanel';
import { LearnDockPanel } from './LearnDockPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { SlideSorter } from './SlideSorter';
import { StageCanvas } from './StageCanvas';
import { ToolsAndLayersPanel } from './ToolsAndLayersPanel';

type DrawerKind = 'slides' | 'tools' | 'assets' | 'properties' | 'learn' | null;

function useViewportTier() {
  const [tier, setTier] = useState<'phone-landscape' | 'phone' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide'>('desktop');

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (h <= 500 && w <= 950) {
        setTier('phone-landscape');
      } else if (w < 640) {
        setTier('phone');
      } else if (w < 1024) {
        setTier('tablet');
      } else if (w < 1480) {
        setTier('laptop');
      } else if (w < 2200) {
        setTier('desktop');
      } else {
        setTier('ultrawide');
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return tier;
}

export const DesignerWorkspace: React.FC = () => {
  const tier = useViewportTier();
  const settings = useStudioStore((s) => s.settings);
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const selectedAnimationId = useStudioStore((s) => s.selectedAnimationId);
  const isPainterActive = useStudioStore((s) => s.isPainterActive);
  const designerPreviewPlaying = useStudioStore((s) => s.designerPreviewPlaying);
  const designerPreviewTime = useStudioStore((s) => s.designerPreviewTime);

  const updateSettings = useStudioStore((s) => s.updateSettings);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const selectElements = useStudioStore((s) => s.selectElements);
  const setSelectedAnimationId = useStudioStore((s) => s.setSelectedAnimationId);
  const updateElementAnimation = useStudioStore((s) => s.updateElementAnimation);
  const removeElementAnimation = useStudioStore((s) => s.removeElementAnimation);
  const reorderSlideAnimation = useStudioStore((s) => s.reorderSlideAnimation);
  const activateAnimationPainter = useStudioStore((s) => s.activateAnimationPainter);
  const cancelAnimationPainter = useStudioStore((s) => s.cancelAnimationPainter);
  const setDesignerPreview = useStudioStore((s) => s.setDesignerPreview);

  const [drawer, setDrawer] = useState<DrawerKind>(null);

  const panels = settings.panels;
  const togglePanel = (key: keyof PanelVisibilitySettings) => {
    updateSettings({
      panels: {
        ...panels,
        [key]: !panels[key],
      },
    });
  };

  const setPanel = (key: keyof PanelVisibilitySettings, value: boolean) => {
    updateSettings({
      panels: {
        ...panels,
        [key]: value,
      },
    });
  };

  const allSidePanelsHidden =
    !panels.designerSlides &&
    !panels.designerInsert &&
    !panels.designerAssets &&
    !panels.designerProperties &&
    !settings.showLearnDock;

  const toggleAllPanels = () => {
    if (allSidePanelsHidden) {
      updateSettings({
        panels: {
          ...panels,
          designerSlides: true,
          designerInsert: true,
          designerAssets: true,
          designerProperties: true,
        },
      });
    } else {
      updateSettings({
        showLearnDock: false,
        panels: {
          ...panels,
          designerSlides: false,
          designerInsert: false,
          designerAssets: false,
          designerProperties: false,
        },
      });
    }
  };

  const slide = project.slides.find((s) => s.id === activeSlideId) ?? project.slides[0];
  const isMobile = tier === 'phone' || tier === 'phone-landscape';
  const isTablet = tier === 'tablet';
  const isLaptop = tier === 'laptop';
  const isExpandedDesktop = tier === 'desktop' || tier === 'ultrawide';

  const renderPanelToggleStrip = (compactMode: boolean) => (
    <div
      aria-label="Workspace panel toggles"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs shrink-0"
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[11px] font-medium text-[var(--text-muted)]">Panels:</span>

        <button
          type="button"
          onClick={() => (compactMode ? setDrawer(drawer === 'slides' ? null : 'slides') : togglePanel('designerSlides'))}
          aria-pressed={compactMode ? drawer === 'slides' : panels.designerSlides}
          title={compactMode ? 'Open Slides drawer' : 'Toggle Slides panel'}
          className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
            (compactMode ? drawer === 'slides' : panels.designerSlides)
              ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <PanelLeft className="h-3.5 w-3.5" />
          <span>Slides</span>
        </button>

        <button
          type="button"
          onClick={() => togglePanel('designerInsert')}
          aria-pressed={panels.designerInsert}
          title={compactMode ? 'Toggle Insert tool rail' : 'Toggle Insert & Layers panel'}
          className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
            panels.designerInsert
              ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Insert & Layers</span>
        </button>

        <button
          type="button"
          onClick={() => (compactMode ? setDrawer(drawer === 'assets' ? null : 'assets') : togglePanel('designerAssets'))}
          aria-pressed={compactMode ? drawer === 'assets' : panels.designerAssets}
          title={compactMode ? 'Open Assets drawer' : 'Toggle Assets sidebar'}
          className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
            (compactMode ? drawer === 'assets' : panels.designerAssets)
              ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Shapes className="h-3.5 w-3.5" />
          <span>Assets</span>
        </button>

        <button
          type="button"
          onClick={() =>
            isTablet || settings.panelLayout === 'focused'
              ? setDrawer(drawer === 'properties' ? null : 'properties')
              : togglePanel('designerProperties')
          }
          aria-pressed={isTablet || settings.panelLayout === 'focused' ? drawer === 'properties' : panels.designerProperties}
          title="Toggle Properties & Format panel"
          className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
            (isTablet || settings.panelLayout === 'focused' ? drawer === 'properties' : panels.designerProperties)
              ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Properties</span>
        </button>

        <button
          type="button"
          onClick={() =>
            compactMode
              ? setDrawer(drawer === 'learn' ? null : 'learn')
              : updateSettings({ showLearnDock: !settings.showLearnDock })
          }
          aria-pressed={compactMode ? drawer === 'learn' : settings.showLearnDock}
          title="Toggle docked Learn Companion panel"
          className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
            (compactMode ? drawer === 'learn' : settings.showLearnDock)
              ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Learn</span>
        </button>

        {isExpandedDesktop && (
          <button
            type="button"
            onClick={() => togglePanel('designerTimeline')}
            aria-pressed={panels.designerTimeline}
            title="Toggle bottom Animation Timeline dock"
            className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
              panels.designerTimeline
                ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={toggleAllPanels}
        className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      >
        {allSidePanelsHidden ? <LayoutGrid className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        <span>{allSidePanelsHidden ? 'Show All Panels' : 'Hide All Side Panels'}</span>
      </button>
    </div>
  );

  // Phone portrait & phone landscape: one zone with top stage + bottom sheets
  if (isMobile) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <div
          className={`flex-1 min-h-0 flex flex-col ${
            tier === 'phone-landscape' ? 'flex-row' : 'flex-col'
          }`}
        >
          {/* Stage */}
          <div
            className={
              tier === 'phone-landscape'
                ? 'h-full flex-1 min-w-0'
                : 'w-full aspect-video max-h-[52dvh] shrink-0'
            }
          >
            <StageCanvas />
          </div>

          {/* Touch Sheet Triggers */}
          <div
            className={
              tier === 'phone-landscape'
                ? 'flex w-28 shrink-0 flex-col justify-center gap-1.5 border-l border-[var(--border-subtle)] bg-[var(--bg-panel)] p-2'
                : 'grid grid-cols-5 gap-1.5 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] p-2'
            }
          >
            {(
              [
                ['slides', 'Slides', PanelLeft],
                ['tools', 'Insert', Plus],
                ['assets', 'Assets', Shapes],
                ['properties', 'Format', SlidersHorizontal],
                ['learn', 'Learn', BookOpen],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDrawer(drawer === key ? null : key)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border text-[11px] font-medium transition-colors ${
                  drawer === key
                    ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {tier === 'phone' && (
            <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-3 text-xs text-[var(--text-muted)]">
              <p className="font-medium text-[var(--text-primary)]">{slide?.title}</p>
              <p className="mt-1">
                Pinch with two fingers to zoom, drag with two fingers to pan, or press and hold an object for options.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Sheet Overlay */}
        {drawer && (
          <div
            onClick={() => setDrawer(null)}
            className="fixed inset-0 z-40 flex items-end bg-black/50 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex h-[72dvh] w-full flex-col rounded-t-3xl border-t border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-2.5">
                <div className="mx-auto h-1.5 w-10 rounded-full bg-[var(--border-strong)]" />
                <button
                  type="button"
                  onClick={() => setDrawer(null)}
                  aria-label="Close panel"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {drawer === 'slides' && <SlideSorter onSlideSelected={() => setDrawer(null)} />}
                {drawer === 'tools' && <ToolsAndLayersPanel onActionComplete={() => setDrawer(null)} />}
                {drawer === 'assets' && <AssetsPanel onActionComplete={() => setDrawer(null)} />}
                {drawer === 'properties' && <PropertiesPanel />}
                {drawer === 'learn' && <LearnDockPanel onClose={() => setDrawer(null)} />}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tablet (640px - 1023px) & Laptop (1024px - 1479px) & Focused Desktop
  if (isTablet || isLaptop || settings.panelLayout === 'focused') {
    const showLaptopProps = !isTablet && settings.panelLayout !== 'focused' && panels.designerProperties;

    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {renderPanelToggleStrip(true)}

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Collapsible Icon-only rail on Laptop / Tablet */}
          {panels.designerInsert && (
            <div className="flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
              <div className="flex flex-col items-center gap-1.5 border-b border-[var(--border-subtle)] p-1.5">
                <button
                  type="button"
                  title="Slides Drawer"
                  aria-label="Toggle Slides Drawer"
                  onClick={() => setDrawer(drawer === 'slides' ? null : 'slides')}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                    drawer === 'slides'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Insert & Layers Drawer"
                  aria-label="Toggle Insert and Layers Drawer"
                  onClick={() => setDrawer(drawer === 'tools' ? null : 'tools')}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                    drawer === 'tools'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Assets Drawer"
                  aria-label="Toggle Assets Drawer"
                  onClick={() => setDrawer(drawer === 'assets' ? null : 'assets')}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                    drawer === 'assets'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  <Shapes className="h-4 w-4" />
                </button>
                {(isTablet || !panels.designerProperties || settings.panelLayout === 'focused') && (
                  <button
                    type="button"
                    title="Properties Drawer"
                    aria-label="Toggle Properties Drawer"
                    onClick={() => setDrawer(drawer === 'properties' ? null : 'properties')}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                      drawer === 'properties'
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  title="Learn Companion"
                  aria-label="Toggle Learn Companion"
                  onClick={() => setDrawer(drawer === 'learn' ? null : 'learn')}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                    drawer === 'learn'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ToolsAndLayersPanel iconRail />
              </div>
            </div>
          )}

          {/* Maximised Stage */}
          <main className="flex-1 min-w-0 min-h-0">
            <StageCanvas />
          </main>

          {/* Collapsible Right Properties Inspector on Laptop */}
          {showLaptopProps && (
            <div className="w-[268px] shrink-0 border-l border-[var(--border-subtle)] overflow-hidden">
              <PropertiesPanel onCollapse={() => setPanel('designerProperties', false)} />
            </div>
          )}
        </div>

        {/* Slide-over Drawer */}
        {drawer && (
          <div
            onClick={() => setDrawer(null)}
            className="fixed inset-0 z-40 flex bg-black/45 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`flex h-full w-[300px] max-w-[85vw] flex-col border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-2xl ${
                drawer === 'properties' || drawer === 'learn' ? 'ml-auto border-l' : 'border-r'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
                <span className="font-display text-xs font-semibold capitalize">{drawer}</span>
                <button
                  type="button"
                  onClick={() => setDrawer(null)}
                  aria-label="Close drawer"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {drawer === 'slides' && <SlideSorter onSlideSelected={() => setDrawer(null)} />}
                {drawer === 'tools' && <ToolsAndLayersPanel />}
                {drawer === 'assets' && <AssetsPanel onActionComplete={() => setDrawer(null)} />}
                {drawer === 'properties' && <PropertiesPanel />}
                {drawer === 'learn' && <LearnDockPanel onClose={() => setDrawer(null)} />}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded Desktop (1920x1080) & Ultra-Wide (2560x1080 / 3440x1440): Fully Collapsible 6-Zone Workspace
  const sorterW = tier === 'ultrawide' ? '216px' : '188px';
  const toolsW = tier === 'ultrawide' ? '252px' : '226px';
  const assetsW = tier === 'ultrawide' ? '260px' : '236px';
  const propsW = tier === 'ultrawide' ? '300px' : '268px';
  const learnW = tier === 'ultrawide' ? '292px' : '260px';
  const swapped = settings.panelLayout === 'swapped';

  const colSlides = panels.designerSlides ? sorterW : '';
  const colInsert = panels.designerInsert ? toolsW : '';
  const colAssets = panels.designerAssets ? assetsW : '';
  const colProps = panels.designerProperties ? propsW : '';
  const colLearn = settings.showLearnDock ? learnW : '';

  const gridTemplateColumns = (
    swapped
      ? [colProps, '1fr', colLearn, colAssets, colInsert, colSlides]
      : [colSlides, colInsert, colAssets, '1fr', colLearn, colProps]
  )
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {renderPanelToggleStrip(false)}

      <div className="grid flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns }}>
        {swapped ? (
          <>
            {panels.designerProperties && (
              <div className="min-h-0 border-r border-[var(--border-subtle)] overflow-hidden">
                <PropertiesPanel onCollapse={() => setPanel('designerProperties', false)} />
              </div>
            )}
            <main className="min-w-0 min-h-0 overflow-hidden">
              <StageCanvas />
            </main>
            {settings.showLearnDock && (
              <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
                <LearnDockPanel onClose={() => updateSettings({ showLearnDock: false })} />
              </div>
            )}
            {panels.designerAssets && (
              <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
                <AssetsPanel onCollapse={() => setPanel('designerAssets', false)} />
              </div>
            )}
            {panels.designerInsert && (
              <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
                <ToolsAndLayersPanel onCollapse={() => setPanel('designerInsert', false)} />
              </div>
            )}
            {panels.designerSlides && (
              <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
                <SlideSorter onCollapse={() => setPanel('designerSlides', false)} />
              </div>
            )}
          </>
        ) : (
          <>
            {panels.designerSlides && (
              <div className="min-h-0 border-r border-[var(--border-subtle)] overflow-hidden">
                <SlideSorter onCollapse={() => setPanel('designerSlides', false)} />
              </div>
            )}
            {panels.designerInsert && (
              <div className="min-h-0 border-r border-[var(--border-subtle)] overflow-hidden">
                <ToolsAndLayersPanel onCollapse={() => setPanel('designerInsert', false)} />
              </div>
            )}
            {panels.designerAssets && (
              <div className="min-h-0 border-r border-[var(--border-subtle)] overflow-hidden">
                <AssetsPanel onCollapse={() => setPanel('designerAssets', false)} />
              </div>
            )}
            <main className="min-w-0 min-h-0 overflow-hidden">
              <StageCanvas />
            </main>
            {settings.showLearnDock && (
              <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
                <LearnDockPanel onClose={() => updateSettings({ showLearnDock: false })} />
              </div>
            )}
            {panels.designerProperties && (
              <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
                <PropertiesPanel onCollapse={() => setPanel('designerProperties', false)} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Zone 5: Bottom Animation Pane & Timeline Dock */}
      {isExpandedDesktop && (
        <section
          aria-label="Animation timeline dock"
          className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]"
        >
          <div className="flex items-center justify-between px-4 py-1.5 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => togglePanel('designerTimeline')}
                className="inline-flex items-center gap-1.5 font-display font-semibold text-[var(--text-primary)]"
              >
                {panels.designerTimeline ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                <span>Animation Timeline</span>
              </button>
              <span className="text-[11px] text-[var(--text-muted)]">
                Transition: <strong className="text-[var(--text-secondary)]">{slide?.transition.type}</strong> ·{' '}
                <span className="font-mono-tabular">{slide?.transition.duration}s</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  designerPreviewPlaying ? setDesignerPreview(false, 0) : setDesignerPreview(true, 0)
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
              >
                {designerPreviewPlaying ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3 text-[var(--accent-500)]" />}
                <span>{designerPreviewPlaying ? 'Stop' : 'Play Slide'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('animations')}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--text-primary)]"
              >
                <Sparkles className="h-3 w-3 text-[var(--accent-500)]" />
                <span>Animation Lab</span>
              </button>
            </div>
          </div>

          {panels.designerTimeline && slide && (
            <div className="h-36 border-t border-[var(--border-subtle)] overflow-hidden">
              <AnimationPaneTimeline
                elements={slide.elements}
                selectedElementId={selectedElementIds[0] ?? null}
                selectedAnimationId={selectedAnimationId}
                currentTime={designerPreviewTime}
                isPainterActive={isPainterActive}
                onSelectAnimation={(elId, animId) => {
                  selectElements([elId], false);
                  setSelectedAnimationId(animId);
                }}
                onUpdateTiming={(elId, animId, delay, duration) =>
                  updateElementAnimation(elId, animId, { delay, duration }, false)
                }
                onReorderAnimation={(animId, dir) => reorderSlideAnimation(animId, dir)}
                onRemoveAnimation={(elId, animId) => removeElementAnimation(elId, animId)}
                onPlayFrom={(startTime) => setDesignerPreview(true, startTime)}
                onTogglePainter={(elId) => {
                  if (isPainterActive) cancelAnimationPainter();
                  else activateAnimationPainter(elId);
                }}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
