import React from 'react';
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Group,
  Lock,
  PanelRightClose,
  Trash2,
  Ungroup,
  Unlock,
  Wand2,
} from 'lucide-react';
import { SLIDE_FONTS, STAGE_DIMENSIONS, THEME_PRESETS } from '../../data/themes';
import { useStudioStore } from '../../store/useStudioStore';
import { AspectRatio, SlideElement } from '../../types/presentation';

export const PropertiesPanel: React.FC<{ onCollapse?: () => void }> = ({ onCollapse }) => {
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const isMasterEditMode = useStudioStore((s) => s.isMasterEditMode);

  const updateElement = useStudioStore((s) => s.updateElement);
  const alignSelected = useStudioStore((s) => s.alignSelected);
  const distributeSelected = useStudioStore((s) => s.distributeSelected);
  const groupSelected = useStudioStore((s) => s.groupSelected);
  const ungroupSelected = useStudioStore((s) => s.ungroupSelected);
  const duplicateSelected = useStudioStore((s) => s.duplicateSelected);
  const deleteSelected = useStudioStore((s) => s.deleteSelected);
  const reorderElementLayer = useStudioStore((s) => s.reorderElementLayer);
  const toggleLockElement = useStudioStore((s) => s.toggleLockElement);

  const updateSlideTitle = useStudioStore((s) => s.updateSlideTitle);
  const updateSlideBackground = useStudioStore((s) => s.updateSlideBackground);
  const toggleSlideUseMaster = useStudioStore((s) => s.toggleSlideUseMaster);
  const setAspectRatio = useStudioStore((s) => s.setAspectRatio);
  const applyThemePreset = useStudioStore((s) => s.applyThemePreset);
  const updateMaster = useStudioStore((s) => s.updateMaster);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const slide = project.slides.find((s) => s.id === activeSlideId) ?? project.slides[0];
  const selectedElements = slide
    ? slide.elements.filter((el) => selectedElementIds.includes(el.id))
    : [];
  const primary: SlideElement | undefined = selectedElements[0];

  const updateStyle = (patch: Partial<SlideElement['style']>) => {
    if (!primary) return;
    updateElement(primary.id, { style: { ...primary.style, ...patch } });
  };

  if (isMasterEditMode) {
    return (
      <aside aria-label="Slide Master Properties" className="flex h-full flex-col bg-[var(--bg-panel)]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3.5 py-2.5">
          <div>
            <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">Slide Master</h2>
            <p className="text-[11px] text-[var(--text-muted)]">Shared layout rules inherited by linked slides</p>
          </div>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Collapse Properties panel"
              aria-label="Collapse Properties panel"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-5">
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Master Background</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(['solid', 'gradient'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateMaster({ background: { ...project.master.background, mode } })}
                  className={`min-h-[34px] rounded-lg border text-xs font-medium capitalize ${
                    project.master.background.mode === mode
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {project.master.background.mode === 'solid' ? (
              <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                <span>Background Colour</span>
                <input
                  type="color"
                  value={project.master.background.colour}
                  onChange={(e) =>
                    updateMaster({ background: { ...project.master.background, colour: e.target.value } })
                  }
                  className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                  <span>Start</span>
                  <input
                    type="color"
                    value={project.master.background.gradientStart}
                    onChange={(e) =>
                      updateMaster({ background: { ...project.master.background, gradientStart: e.target.value } })
                    }
                    className="h-6 w-7 cursor-pointer bg-transparent"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                  <span>End</span>
                  <input
                    type="color"
                    value={project.master.background.gradientEnd}
                    onChange={(e) =>
                      updateMaster({ background: { ...project.master.background, gradientEnd: e.target.value } })
                    }
                    className="h-6 w-7 cursor-pointer bg-transparent"
                  />
                </label>
              </div>
            )}
          </section>

          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Master Chrome & Footer</h3>
            <label className="flex items-center justify-between text-xs">
              <span>Top Accent Bar</span>
              <input
                type="checkbox"
                checked={project.master.showAccentBar}
                onChange={(e) => updateMaster({ showAccentBar: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent-500)]"
              />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>Accent Colour</span>
              <input
                type="color"
                value={project.master.accentColour}
                onChange={(e) => updateMaster({ accentColour: e.target.value })}
                className="h-6 w-8 cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>Show Footer Text</span>
              <input
                type="checkbox"
                checked={project.master.showFooter}
                onChange={(e) => updateMaster({ showFooter: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent-500)]"
              />
            </label>
            {project.master.showFooter && (
              <input
                type="text"
                value={project.master.footerText}
                onChange={(e) => updateMaster({ footerText: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
              />
            )}
            <label className="flex items-center justify-between text-xs">
              <span>Show Slide Numbers</span>
              <input
                type="checkbox"
                checked={project.master.showSlideNumber}
                onChange={(e) => updateMaster({ showSlideNumber: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent-500)]"
              />
            </label>
          </section>
        </div>
      </aside>
    );
  }

  if (!primary) {
    return (
      <aside aria-label="Slide Properties" className="flex h-full flex-col bg-[var(--bg-panel)]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3.5 py-2.5">
          <div>
            <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">Slide & Theme</h2>
            <p className="text-[11px] text-[var(--text-muted)]">Select an object on canvas to inspect its style</p>
          </div>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Collapse Properties panel"
              aria-label="Collapse Properties panel"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-5">
          {slide && (
            <section className="space-y-2">
              <label className="block text-[11px] font-semibold text-[var(--text-muted)]">Slide Title</label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) => updateSlideTitle(slide.id, e.target.value)}
                className="w-full min-h-[36px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
              />
            </section>
          )}

          {/* Slide Aspect Ratio */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Slide Size</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(STAGE_DIMENSIONS) as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`min-h-[36px] rounded-lg border font-mono-tabular text-xs font-medium ${
                    project.aspectRatio === ratio
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </section>

          {/* Slide Background */}
          {slide && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Background</h3>
                <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={slide.useMaster}
                    onChange={() => toggleSlideUseMaster(slide.id)}
                    className="accent-[var(--accent-500)]"
                  />
                  <span>Use Master</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(['solid', 'gradient'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateSlideBackground(slide.id, { mode })}
                    className={`min-h-[34px] rounded-lg border text-xs font-medium capitalize ${
                      (slide.useMaster ? project.master.background.mode : slide.background.mode) === mode
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {slide.background.mode === 'solid' ? (
                <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                  <span>Fill Colour</span>
                  <input
                    type="color"
                    value={slide.useMaster ? project.master.background.colour : slide.background.colour}
                    onChange={(e) => updateSlideBackground(slide.id, { mode: 'solid', colour: e.target.value })}
                    className="h-6 w-8 cursor-pointer bg-transparent"
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                    <span>From</span>
                    <input
                      type="color"
                      value={slide.background.gradientStart}
                      onChange={(e) => updateSlideBackground(slide.id, { gradientStart: e.target.value })}
                      className="h-6 w-7 cursor-pointer bg-transparent"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                    <span>To</span>
                    <input
                      type="color"
                      value={slide.background.gradientEnd}
                      onChange={(e) => updateSlideBackground(slide.id, { gradientEnd: e.target.value })}
                      className="h-6 w-7 cursor-pointer bg-transparent"
                    />
                  </label>
                </div>
              )}
            </section>
          )}

          {/* Slide Transition Summary */}
          {slide && (
            <section className="space-y-2">
              <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Slide Transition</h3>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-semibold capitalize text-[var(--text-primary)]">
                    {slide.transition.type.replace('-', ' ')}
                  </div>
                  <div className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                    {slide.transition.duration.toFixed(2)}s · {slide.transition.category}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('transitions')}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg bg-[var(--accent-soft)] px-2.5 text-[11px] font-semibold text-[var(--accent-500)] hover:opacity-90"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>Customise</span>
                </button>
              </div>
            </section>
          )}

          {/* Theme & Colour Palette Presets */}
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Theme & Palette Presets</h3>
            <div className="space-y-2">
              {THEME_PRESETS.map((preset) => {
                const isActive = project.themeId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`rounded-xl border p-2.5 transition-colors ${
                      isActive
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{preset.name}</span>
                      <div className="flex items-center gap-1">
                        {preset.swatches.map((hex, i) => (
                          <span
                            key={i}
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{preset.description}</p>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyThemePreset(preset.id, false)}
                        className="flex-1 rounded-md border border-[var(--border-strong)] bg-[var(--bg-panel)] py-1 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                      >
                        This Slide
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThemePreset(preset.id, true)}
                        className="flex-1 rounded-md bg-[var(--accent-600)] py-1 text-[11px] font-medium text-[var(--accent-contrast)] hover:opacity-95"
                      >
                        All Slides
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Object Properties" className="flex h-full flex-col bg-[var(--bg-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3.5 py-2.5">
        <div className="min-w-0">
          <h2 className="font-display text-xs font-semibold text-[var(--text-primary)] truncate">
            {selectedElements.length > 1 ? `${selectedElements.length} Objects Selected` : primary.name}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            {primary.groupId ? 'Grouped element' : primary.type}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={duplicateSelected}
            title="Duplicate (Ctrl+D)"
            aria-label="Duplicate selected"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleLockElement(primary.id)}
            title={primary.locked ? 'Unlock' : 'Lock'}
            aria-label={primary.locked ? 'Unlock element' : 'Lock element'}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            {primary.locked ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            title="Delete"
            aria-label="Delete selected"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-rose-500/15 hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Collapse Properties panel"
              aria-label="Collapse Properties panel"
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-5">
        {/* Morph Layer Name */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">Element Name (Morph Key)</label>
            {!primary.name.startsWith('!!') && (
              <button
                type="button"
                onClick={() => updateElement(primary.id, { name: `!!${primary.name}` })}
                className="text-[11px] font-medium text-[var(--accent-500)] hover:underline"
              >
                Add !! prefix
              </button>
            )}
          </div>
          <input
            type="text"
            value={primary.name}
            onChange={(e) => updateElement(primary.id, { name: e.target.value }, false)}
            className="font-mono-tabular w-full min-h-[34px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
          />
        </section>

        {/* Geometry */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Position & Size</h3>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['X', 'x'],
                ['Y', 'y'],
                ['W', 'w'],
                ['H', 'h'],
              ] as const
            ).map(([label, key]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs"
              >
                <span className="text-[var(--text-muted)]">{label}</span>
                <input
                  type="number"
                  value={Math.round(primary[key])}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isNaN(val)) {
                      updateElement(primary.id, {
                        [key]: key === 'w' || key === 'h' ? Math.max(12, val) : val,
                      });
                    }
                  }}
                  className="font-mono-tabular w-16 bg-transparent text-right text-[var(--text-primary)] outline-none"
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs">
              <span className="text-[var(--text-muted)]">Rotate</span>
              <input
                type="number"
                value={Math.round(primary.rotation)}
                onChange={(e) => updateElement(primary.id, { rotation: Number(e.target.value) || 0 })}
                className="font-mono-tabular w-14 bg-transparent text-right text-[var(--text-primary)] outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs">
              <span className="text-[var(--text-muted)]">Radius</span>
              <input
                type="number"
                min={0}
                max={200}
                value={primary.style.cornerRadius}
                onChange={(e) => updateStyle({ cornerRadius: Math.max(0, Number(e.target.value) || 0) })}
                className="font-mono-tabular w-14 bg-transparent text-right text-[var(--text-primary)] outline-none"
              />
            </label>
          </div>
        </section>

        {/* Alignment, Grouping & Layer Order */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Align, Distribute & Order</h3>
          <div className="grid grid-cols-6 gap-1">
            {(
              [
                ['left', AlignLeft, 'Align Left'],
                ['centre', AlignHorizontalJustifyCenter, 'Align Centre'],
                ['right', AlignRight, 'Align Right'],
                ['top', ArrowUpToLine, 'Align Top'],
                ['middle', AlignVerticalJustifyCenter, 'Align Middle'],
                ['bottom', ArrowDownToLine, 'Align Bottom'],
              ] as const
            ).map(([dir, Icon, title]) => (
              <button
                key={dir}
                type="button"
                title={title}
                aria-label={title}
                onClick={() => alignSelected(dir)}
                className="flex min-h-[34px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--text-primary)]"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={selectedElements.length < 3}
              onClick={() => distributeSelected('horizontal')}
              className="min-h-[32px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-500)] disabled:opacity-40"
            >
              Distribute X
            </button>
            <button
              type="button"
              disabled={selectedElements.length < 3}
              onClick={() => distributeSelected('vertical')}
              className="min-h-[32px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-500)] disabled:opacity-40"
            >
              Distribute Y
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {(
              [
                ['front', 'Front'],
                ['forward', 'Fwd'],
                ['backward', 'Back'],
                ['back', 'Bottom'],
              ] as const
            ).map(([dir, label]) => (
              <button
                key={dir}
                type="button"
                onClick={() => reorderElementLayer(primary.id, dir)}
                className="min-h-[30px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[11px] text-[var(--text-secondary)] hover:border-[var(--accent-500)]"
              >
                {label}
              </button>
            ))}
          </div>

          {(selectedElements.length >= 2 || primary.groupId) && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={selectedElements.length < 2}
                onClick={groupSelected}
                className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-xs font-medium disabled:opacity-40"
              >
                <Group className="h-3.5 w-3.5" />
                <span>Group</span>
              </button>
              <button
                type="button"
                disabled={!primary.groupId}
                onClick={ungroupSelected}
                className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-xs font-medium disabled:opacity-40"
              >
                <Ungroup className="h-3.5 w-3.5" />
                <span>Ungroup</span>
              </button>
            </div>
          )}
        </section>

        {/* Fill */}
        <section className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Fill & Opacity</h3>
          <div className="grid grid-cols-3 gap-1">
            {(['none', 'solid', 'gradient'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateStyle({ fill: { ...primary.style.fill, mode } })}
                className={`min-h-[32px] rounded-lg border text-xs font-medium capitalize ${
                  primary.style.fill.mode === mode
                    ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {primary.style.fill.mode === 'solid' && (
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
              <span>Colour</span>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                  {primary.style.fill.colour}
                </span>
                <input
                  type="color"
                  value={primary.style.fill.colour}
                  onChange={(e) =>
                    updateStyle({ fill: { ...primary.style.fill, colour: e.target.value } })
                  }
                  className="h-6 w-8 cursor-pointer bg-transparent"
                />
              </div>
            </label>
          )}

          {primary.style.fill.mode === 'gradient' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                  <span>Start</span>
                  <input
                    type="color"
                    value={primary.style.fill.gradientStart}
                    onChange={(e) =>
                      updateStyle({ fill: { ...primary.style.fill, gradientStart: e.target.value } })
                    }
                    className="h-6 w-7 cursor-pointer bg-transparent"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs">
                  <span>End</span>
                  <input
                    type="color"
                    value={primary.style.fill.gradientEnd}
                    onChange={(e) =>
                      updateStyle({ fill: { ...primary.style.fill, gradientEnd: e.target.value } })
                    }
                    className="h-6 w-7 cursor-pointer bg-transparent"
                  />
                </label>
              </div>
              <label className="block text-xs">
                <div className="mb-1 flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Gradient Angle</span>
                  <span className="font-mono-tabular">{primary.style.fill.gradientAngle}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={primary.style.fill.gradientAngle}
                  onChange={(e) =>
                    updateStyle({ fill: { ...primary.style.fill, gradientAngle: Number(e.target.value) } })
                  }
                  className="w-full accent-[var(--accent-500)]"
                />
              </label>
            </div>
          )}

          <label className="block text-xs">
            <div className="mb-1 flex justify-between text-[11px] text-[var(--text-muted)]">
              <span>Opacity</span>
              <span className="font-mono-tabular">{Math.round(primary.style.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(primary.style.opacity * 100)}
              onChange={(e) => updateStyle({ opacity: Number(e.target.value) / 100 })}
              className="w-full accent-[var(--accent-500)]"
            />
          </label>
        </section>

        {/* Outline & Shadow */}
        <section className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Outline & Shadow</h3>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 py-1 text-xs">
              <span>Stroke</span>
              <input
                type="color"
                value={primary.style.outline.colour}
                onChange={(e) =>
                  updateStyle({ outline: { ...primary.style.outline, colour: e.target.value } })
                }
                className="h-6 w-6 cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 py-1 text-xs">
              <span>Px</span>
              <input
                type="number"
                min={0}
                max={32}
                value={primary.style.outline.width}
                onChange={(e) =>
                  updateStyle({ outline: { ...primary.style.outline, width: Math.max(0, Number(e.target.value) || 0) } })
                }
                className="font-mono-tabular w-10 bg-transparent text-right outline-none"
              />
            </label>
            <select
              value={primary.style.outline.dash}
              onChange={(e) =>
                updateStyle({
                  outline: { ...primary.style.outline, dash: e.target.value as 'solid' | 'dashed' | 'dotted' },
                })
              }
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-1.5 text-xs outline-none"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-2 text-xs">
            <span>Drop Shadow</span>
            <input
              type="checkbox"
              checked={primary.style.shadow.enabled}
              onChange={(e) =>
                updateStyle({ shadow: { ...primary.style.shadow, enabled: e.target.checked } })
              }
              className="h-4 w-4 accent-[var(--accent-500)]"
            />
          </label>
        </section>

        {/* Typography */}
        <section className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Typography</h3>
          <select
            value={primary.style.typography.fontFamily}
            onChange={(e) =>
              updateStyle({ typography: { ...primary.style.typography, fontFamily: e.target.value } })
            }
            className="w-full min-h-[34px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs text-[var(--text-primary)] outline-none"
          >
            {SLIDE_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2 py-1.5 text-xs">
              <span className="text-[var(--text-muted)]">Size</span>
              <input
                type="number"
                min={10}
                max={200}
                value={primary.style.typography.fontSize}
                onChange={(e) =>
                  updateStyle({
                    typography: { ...primary.style.typography, fontSize: Math.max(10, Number(e.target.value) || 24) },
                  })
                }
                className="font-mono-tabular w-11 bg-transparent text-right outline-none"
              />
            </label>
            <select
              value={primary.style.typography.fontWeight}
              onChange={(e) =>
                updateStyle({
                  typography: {
                    ...primary.style.typography,
                    fontWeight: Number(e.target.value) as 400 | 500 | 600 | 700 | 800,
                  },
                })
              }
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-1.5 text-xs outline-none"
            >
              <option value={400}>Regular</option>
              <option value={500}>Medium</option>
              <option value={600}>SemiBold</option>
              <option value={700}>Bold</option>
              <option value={800}>ExtraBold</option>
            </select>
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2 py-1 text-xs">
              <span className="text-[var(--text-muted)]">Text</span>
              <input
                type="color"
                value={primary.style.typography.colour}
                onChange={(e) =>
                  updateStyle({ typography: { ...primary.style.typography, colour: e.target.value } })
                }
                className="h-6 w-6 cursor-pointer bg-transparent"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {(
              [
                ['left', AlignLeft],
                ['centre', AlignCenter],
                ['right', AlignRight],
              ] as const
            ).map(([align, Icon]) => (
              <button
                key={align}
                type="button"
                aria-label={`Align text ${align}`}
                onClick={() => updateStyle({ typography: { ...primary.style.typography, align } })}
                className={`flex min-h-[34px] items-center justify-center rounded-lg border ${
                  primary.style.typography.align === align
                    ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs">
              <span className="text-[var(--text-muted)]">Leading</span>
              <input
                type="number"
                step={0.05}
                min={0.8}
                max={2.5}
                value={primary.style.typography.lineHeight}
                onChange={(e) =>
                  updateStyle({
                    typography: { ...primary.style.typography, lineHeight: Number(e.target.value) || 1.25 },
                  })
                }
                className="font-mono-tabular w-12 bg-transparent text-right outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 py-1.5 text-xs">
              <span className="text-[var(--text-muted)]">Track</span>
              <input
                type="number"
                step={0.5}
                min={-4}
                max={20}
                value={primary.style.typography.letterSpacing}
                onChange={(e) =>
                  updateStyle({
                    typography: { ...primary.style.typography, letterSpacing: Number(e.target.value) || 0 },
                  })
                }
                className="font-mono-tabular w-12 bg-transparent text-right outline-none"
              />
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
};
