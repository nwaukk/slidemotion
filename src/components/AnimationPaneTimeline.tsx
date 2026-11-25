import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Link2,
  MousePointerClick,
  Paintbrush,
  Play,
  Trash2,
} from 'lucide-react';
import { ANIMATION_EFFECTS } from '../data/animations';
import { buildSlideTimeline, ScheduledAnimationItem } from '../engine/animationEngine';
import { AnimationCategory, SlideElement } from '../types/presentation';

interface AnimationPaneTimelineProps {
  elements: SlideElement[];
  selectedElementId: string | null;
  selectedAnimationId: string | null;
  currentTime: number;
  isPainterActive?: boolean;
  onSelectAnimation: (elementId: string, animId: string) => void;
  onUpdateTiming: (elementId: string, animId: string, delay: number, duration: number) => void;
  onReorderAnimation: (animId: string, direction: 'up' | 'down') => void;
  onRemoveAnimation: (elementId: string, animId: string) => void;
  onPlayFrom: (startTime: number) => void;
  onTogglePainter?: (elementId: string) => void;
}

const CATEGORY_COLOURS: Record<AnimationCategory, string> = {
  entrance: '#10b981',
  emphasis: '#f59e0b',
  exit: '#f43f5e',
  'motion-path': '#38bdf8',
};

export const AnimationPaneTimeline: React.FC<AnimationPaneTimelineProps> = ({
  elements,
  selectedElementId,
  selectedAnimationId,
  currentTime,
  isPainterActive = false,
  onSelectAnimation,
  onUpdateTiming,
  onReorderAnimation,
  onRemoveAnimation,
  onPlayFrom,
  onTogglePainter,
}) => {
  const { items, totalDuration } = buildSlideTimeline(elements);
  const timelineMax = Math.max(4, Math.ceil(totalDuration + 1));
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    item: ScheduledAnimationItem;
    mode: 'move' | 'resize';
    startX: number;
    origDelay: number;
    origDur: number;
  } | null>(null);

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    if (!dragState || !trackRef.current) return;
    const width = Math.max(180, trackRef.current.clientWidth);
    const deltaSec = ((e.clientX - dragState.startX) / width) * timelineMax;

    if (dragState.mode === 'move') {
      const nextDelay = Math.max(0, Math.round((dragState.origDelay + deltaSec) * 20) / 20);
      onUpdateTiming(dragState.item.elementId, dragState.item.animation.id, nextDelay, dragState.origDur);
    } else {
      const nextDur = Math.max(0.1, Math.min(6, Math.round((dragState.origDur + deltaSec) * 20) / 20));
      onUpdateTiming(dragState.item.elementId, dragState.item.animation.id, dragState.origDelay, nextDur);
    }
  };

  const handleTrackPointerUp = () => {
    setDragState(null);
  };

  const selectedEl = elements.find((e) => e.id === selectedElementId);
  const canPaint = Boolean(selectedEl && selectedEl.animations.length > 0 && onTogglePainter);

  return (
    <div
      onPointerMove={handleTrackPointerMove}
      onPointerUp={handleTrackPointerUp}
      className="flex h-full flex-col bg-[var(--bg-panel)] text-[var(--text-primary)] select-none"
    >
      {/* Pane Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-display font-semibold">Animation Pane & Timeline</span>
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
            {items.length} {items.length === 1 ? 'effect' : 'effects'} · {totalDuration.toFixed(2)}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onTogglePainter && (
            <button
              type="button"
              disabled={!canPaint && !isPainterActive}
              onClick={() => selectedEl && onTogglePainter(selectedEl.id)}
              title="Copy animations from the selected element and click another object to paste"
              className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                isPainterActive
                  ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] disabled:opacity-35'
              }`}
            >
              <Paintbrush className="h-3 w-3" />
              <span>{isPainterActive ? 'Click target object…' : 'Animation Painter'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Ruler + Rows */}
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-3 text-xs text-[var(--text-muted)]">
          No animations scheduled yet. Select an object and choose an Entrance, Emphasis, Exit or Motion Path effect.
        </div>
      ) : (
        <div className="studio-scroll flex-1 overflow-y-auto">
          {/* Time Ruler */}
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(190px,260px)_1fr] border-b border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[10px] text-[var(--text-muted)]">
            <div className="border-r border-[var(--border-subtle)] px-3 py-1 font-medium">
              Order & Element
            </div>
            <div ref={trackRef} className="relative flex items-center justify-between px-2 py-1 font-mono-tabular">
              {Array.from({ length: timelineMax + 1 }).map((_, sec) => (
                <span key={sec}>{sec}s</span>
              ))}
              {/* Playhead indicator */}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-[var(--accent-500)]"
                style={{ left: `${Math.min(100, (currentTime / timelineMax) * 100)}%` }}
              />
            </div>
          </div>

          {/* Animation Rows */}
          {items.map((item, idx) => {
            const def = ANIMATION_EFFECTS.find((d) => d.id === item.animation.effect);
            const active = selectedAnimationId === item.animation.id;
            const barColour = CATEGORY_COLOURS[item.animation.category];
            const leftPct = (item.startTime / timelineMax) * 100;
            const widthPct = Math.max(2.5, ((item.endTime - item.startTime) / timelineMax) * 100);

            return (
              <div
                key={item.animation.id}
                onClick={() => onSelectAnimation(item.elementId, item.animation.id)}
                className={`grid grid-cols-[minmax(190px,260px)_1fr] border-b border-[var(--border-subtle)] text-xs transition-colors ${
                  active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-panel-elevated)]/60'
                }`}
              >
                {/* Left Item Info & Controls */}
                <div className="flex items-center justify-between gap-1.5 border-r border-[var(--border-subtle)] px-2.5 py-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono-tabular w-4 text-[10px] text-[var(--text-muted)]">
                      {item.animation.start === 'on-click' ? item.clickGroup || idx + 1 : '·'}
                    </span>
                    <span
                      title={
                        item.animation.start === 'on-click'
                          ? 'On Click'
                          : item.animation.start === 'with-previous'
                            ? 'With Previous'
                            : 'After Previous'
                      }
                      className="shrink-0"
                    >
                      {item.animation.start === 'on-click' ? (
                        <MousePointerClick className="h-3.5 w-3.5 text-sky-400" />
                      ) : item.animation.start === 'with-previous' ? (
                        <Link2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--text-primary)]">{item.elementName}</div>
                      <div className="truncate text-[10px] text-[var(--text-muted)]">
                        {def?.name ?? item.animation.effect}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onPlayFrom(item.startTime)}
                      title="Play from here"
                      aria-label={`Play from ${item.elementName}`}
                      className="rounded p-1 text-[var(--accent-500)] hover:bg-[var(--bg-panel)]"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onReorderAnimation(item.animation.id, 'up')}
                      title="Move earlier"
                      aria-label="Move animation earlier"
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-25"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => onReorderAnimation(item.animation.id, 'down')}
                      title="Move later"
                      aria-label="Move animation later"
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-25"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveAnimation(item.elementId, item.animation.id)}
                      title="Remove animation"
                      aria-label="Remove animation"
                      className="rounded p-1 text-[var(--text-muted)] hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Right Draggable Timeline Track */}
                <div className="relative flex items-center px-1 py-1.5">
                  {/* Playhead */}
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-10 w-[2px] bg-[var(--accent-500)]/80"
                    style={{ left: `${Math.min(100, (currentTime / timelineMax) * 100)}%` }}
                  />

                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDragState({
                        item,
                        mode: 'move',
                        startX: e.clientX,
                        origDelay: item.animation.delay,
                        origDur: item.animation.duration,
                      });
                    }}
                    title="Drag bar to adjust delay; drag right edge to adjust duration"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: barColour,
                    }}
                    className="relative flex h-6 cursor-grab items-center justify-between rounded-md px-2 text-[10px] font-semibold text-slate-950 shadow-sm active:cursor-grabbing"
                  >
                    <span className="font-mono-tabular truncate">
                      {item.animation.duration.toFixed(2)}s
                    </span>

                    {/* Right Resize Handle */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                          item,
                          mode: 'resize',
                          startX: e.clientX,
                          origDelay: item.animation.delay,
                          origDur: item.animation.duration,
                        });
                      }}
                      className="absolute bottom-0 right-0 top-0 w-2.5 cursor-ew-resize rounded-r-md bg-black/25 hover:bg-black/45"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
