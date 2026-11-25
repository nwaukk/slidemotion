import React, { useState } from 'react';
import { Copy, Layers, Plus, Trash2, ArrowUp, ArrowDown, StickyNote, PanelLeftClose } from 'lucide-react';
import { STAGE_DIMENSIONS } from '../../data/themes';
import { useStudioStore } from '../../store/useStudioStore';
import { ElementRenderer } from '../../components/ElementRenderer';

export const SlideSorter: React.FC<{ onSlideSelected?: () => void; onCollapse?: () => void }> = ({
  onSlideSelected,
  onCollapse,
}) => {
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const isMasterEditMode = useStudioStore((s) => s.isMasterEditMode);
  const setActiveSlide = useStudioStore((s) => s.setActiveSlide);
  const addSlide = useStudioStore((s) => s.addSlide);
  const duplicateSlide = useStudioStore((s) => s.duplicateSlide);
  const deleteSlide = useStudioStore((s) => s.deleteSlide);
  const reorderSlides = useStudioStore((s) => s.reorderSlides);
  const updateSlideNotes = useStudioStore((s) => s.updateSlideNotes);
  const setMasterEditMode = useStudioStore((s) => s.setMasterEditMode);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const activeSlide = project.slides.find((s) => s.id === activeSlideId) ?? project.slides[0];
  const dims = STAGE_DIMENSIONS[project.aspectRatio];
  const thumbScale = 160 / dims.width;

  return (
    <aside
      aria-label="Slide sorter"
      className="flex h-full flex-col bg-[var(--bg-panel)] text-[var(--text-primary)] select-none"
    >
      <div className="flex items-center justify-between gap-1.5 border-b border-[var(--border-subtle)] px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-xs font-semibold tracking-tight text-[var(--text-primary)]">
            Slides
          </span>
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
            {project.slides.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={addSlide}
            title="Add new slide"
            aria-label="Add new slide"
            className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center gap-1 rounded-lg bg-[var(--accent-600)] px-2.5 text-xs font-medium text-[var(--accent-contrast)] hover:opacity-95 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Collapse Slides panel"
              aria-label="Collapse Slides panel"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {project.slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId && !isMasterEditMode;
          const bg = slide.useMaster ? project.master.background : slide.background;
          const bgCss =
            bg.mode === 'gradient'
              ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientStart}, ${bg.gradientEnd})`
              : bg.colour;

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) {
                  reorderSlides(dragIndex, index);
                }
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`group rounded-xl border p-2 transition-colors ${
                isActive
                  ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMasterEditMode(false);
                  setActiveSlide(slide.id);
                  onSlideSelected?.();
                }}
                aria-label={`Select slide ${index + 1}: ${slide.title}`}
                className="w-full text-left"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono-tabular font-semibold text-[var(--text-secondary)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate font-medium text-[var(--text-primary)]">{slide.title}</span>
                </div>

                <div
                  className="relative mx-auto overflow-hidden rounded-md border border-black/20 shadow-sm"
                  style={{
                    width: 160,
                    height: Math.round(dims.height * thumbScale),
                    background: bgCss,
                  }}
                >
                  <div
                    className="pointer-events-none origin-top-left"
                    style={{
                      width: dims.width,
                      height: dims.height,
                      transform: `scale(${thumbScale})`,
                    }}
                  >
                    {slide.useMaster && project.master.showAccentBar && (
                      <div
                        className="absolute left-0 right-0 top-0 h-1.5"
                        style={{ backgroundColor: project.master.accentColour }}
                      />
                    )}
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
                  </div>
                </div>
              </button>

              <div className="mt-2 flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => reorderSlides(index, index - 1)}
                    title="Move slide up"
                    aria-label="Move slide up"
                    className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)] disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === project.slides.length - 1}
                    onClick={() => reorderSlides(index, index + 1)}
                    title="Move slide down"
                    aria-label="Move slide down"
                    className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)] disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => duplicateSlide(slide.id)}
                    title="Duplicate slide"
                    aria-label="Duplicate slide"
                    className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)]"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={project.slides.length <= 1}
                    onClick={() => deleteSlide(slide.id)}
                    title="Delete slide"
                    aria-label="Delete slide"
                    className="rounded p-1.5 text-[var(--text-muted)] hover:bg-rose-500/15 hover:text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Master & Notes footer */}
      <div className="border-t border-[var(--border-subtle)] p-2.5 space-y-2">
        <button
          type="button"
          onClick={() => setMasterEditMode(!isMasterEditMode)}
          className={`flex w-full min-h-[36px] items-center justify-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
            isMasterEditMode
              ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{isMasterEditMode ? 'Editing Slide Master' : 'Slide Master'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="flex w-full min-h-[34px] items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
        >
          <span className="flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5" />
            <span>Speaker Notes</span>
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">{showNotes ? 'Hide' : 'Edit'}</span>
        </button>

        {showNotes && activeSlide && (
          <textarea
            value={activeSlide.notes}
            onChange={(e) => updateSlideNotes(activeSlide.id, e.target.value)}
            placeholder="Write presenter notes for this slide..."
            rows={4}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
          />
        )}
      </div>
    </aside>
  );
};
