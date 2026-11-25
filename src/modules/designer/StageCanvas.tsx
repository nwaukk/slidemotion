import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Grid,
  Lock,
  Maximize2,
  Play,
  RotateCw,
  Ruler,
  Square,
  Trash2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatedElementWrapper } from '../../components/AnimatedElementWrapper';
import { ElementRenderer } from '../../components/ElementRenderer';
import { ANIMATION_RECIPES } from '../../data/animations';
import {
  ASSET_DRAG_MIME,
  ASSET_ICONS,
  ASSET_SHAPES,
  DraggedAssetPayload,
} from '../../data/assetsLibrary';
import { CHOREOGRAPHY_PRESETS } from '../../data/choreography';
import { STAGE_DIMENSIONS } from '../../data/themes';
import { buildSlideTimeline } from '../../engine/animationEngine';
import { SmartGuide, useStudioStore } from '../../store/useStudioStore';
import { Project, SlideElement, ZoomMode } from '../../types/presentation';
import { loadSavedAnimationPresets } from '../../utils/assetPresets';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface InteractionState {
  mode: 'move' | 'resize' | 'rotate' | 'marquee' | 'pan';
  startClientX: number;
  startClientY: number;
  handle?: ResizeHandle;
  snapshotBefore?: Project;
  initialElements?: Map<string, { x: number; y: number; w: number; h: number; rotation: number }>;
  initialPan?: { x: number; y: number };
  centerX?: number;
  centerY?: number;
}

export const StageCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const editingElementId = useStudioStore((s) => s.editingElementId);
  const settings = useStudioStore((s) => s.settings);
  const zoomMode = useStudioStore((s) => s.zoomMode);
  const zoomScale = useStudioStore((s) => s.zoomScale);
  const panOffset = useStudioStore((s) => s.panOffset);
  const activeGuides = useStudioStore((s) => s.activeGuides);

  const selectElements = useStudioStore((s) => s.selectElements);
  const clearSelection = useStudioStore((s) => s.clearSelection);
  const setEditingElement = useStudioStore((s) => s.setEditingElement);
  const updateElement = useStudioStore((s) => s.updateElement);
  const updateElementsBatch = useStudioStore((s) => s.updateElementsBatch);
  const commitHistorySnapshot = useStudioStore((s) => s.commitHistorySnapshot);
  const setActiveGuides = useStudioStore((s) => s.setActiveGuides);
  const setZoomMode = useStudioStore((s) => s.setZoomMode);
  const setZoomScale = useStudioStore((s) => s.setZoomScale);
  const setPanOffset = useStudioStore((s) => s.setPanOffset);
  const updateSettings = useStudioStore((s) => s.updateSettings);
  const duplicateSelected = useStudioStore((s) => s.duplicateSelected);
  const deleteSelected = useStudioStore((s) => s.deleteSelected);
  const toggleLockElement = useStudioStore((s) => s.toggleLockElement);
  const reorderElementLayer = useStudioStore((s) => s.reorderElementLayer);
  const isPainterActive = useStudioStore((s) => s.isPainterActive);
  const applyAnimationPainterTo = useStudioStore((s) => s.applyAnimationPainterTo);
  const designerPreviewPlaying = useStudioStore((s) => s.designerPreviewPlaying);
  const designerPreviewTime = useStudioStore((s) => s.designerPreviewTime);
  const setDesignerPreview = useStudioStore((s) => s.setDesignerPreview);
  const insertAssetShape = useStudioStore((s) => s.insertAssetShape);
  const insertAssetSvg = useStudioStore((s) => s.insertAssetSvg);
  const applyAnimationPresetToElement = useStudioStore((s) => s.applyAnimationPresetToElement);
  const insertAnimatedPresetCard = useStudioStore((s) => s.insertAnimatedPresetCard);
  const insertAnimatedElementsAt = useStudioStore((s) => s.insertAnimatedElementsAt);

  const [containerSize, setContainerSize] = useState({ width: 960, height: 540 });
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null);
  const [assetDropState, setAssetDropState] = useState<{ x: number; y: number; targetElId: string | null } | null>(null);
  const [assetDropNotice, setAssetDropNotice] = useState<string | null>(null);
  const dropNoticeTimerRef = useRef<number | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number; midX: number; midY: number; panX: number; panY: number } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (dropNoticeTimerRef.current !== null) {
        window.clearTimeout(dropNoticeTimerRef.current);
      }
    };
  }, []);

  const showDropNotice = useCallback((message: string) => {
    setAssetDropNotice(message);
    if (dropNoticeTimerRef.current !== null) {
      window.clearTimeout(dropNoticeTimerRef.current);
    }
    dropNoticeTimerRef.current = window.setTimeout(() => {
      setAssetDropNotice(null);
      dropNoticeTimerRef.current = null;
    }, 2400);
  }, []);

  const dims = STAGE_DIMENSIONS[project.aspectRatio];
  const slideIndex = Math.max(0, project.slides.findIndex((s) => s.id === activeSlideId));
  const slide = project.slides[slideIndex] ?? project.slides[0];

  const { items: scheduledItems, totalDuration } = useMemo(
    () => buildSlideTimeline(slide?.elements ?? []),
    [slide?.elements],
  );

  // Drive Designer inline animation preview when designerPreviewPlaying is true
  useEffect(() => {
    if (!designerPreviewPlaying) return;
    let rafId = 0;
    let lastTs = performance.now();
    const maxT = Math.max(0.25, totalDuration);

    const tick = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      const cur = useStudioStore.getState().designerPreviewTime;
      const next = cur + dt;
      if (next >= maxT) {
        setDesignerPreview(false, 0);
        return;
      }
      setDesignerPreview(true, next);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [designerPreviewPlaying, setDesignerPreview, totalDuration]);

  // Observe stage well container to compute exact CSS transform scale
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveScale = useMemo(() => {
    const padX = settings.showRulers ? 44 : 24;
    const padY = settings.showRulers ? 44 : 24;
    const availW = Math.max(160, containerSize.width - padX);
    const availH = Math.max(120, containerSize.height - padY);
    if (zoomMode === 'fit') {
      return Math.min(availW / dims.width, availH / dims.height);
    }
    if (zoomMode === 'fill') {
      return Math.max(availW / dims.width, availH / dims.height);
    }
    if (zoomMode === '100') {
      return 1;
    }
    return zoomScale;
  }, [containerSize, dims, settings.showRulers, zoomMode, zoomScale]);

  const toStageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = stageWrapperRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left) / effectiveScale,
        y: (clientY - rect.top) / effectiveScale,
      };
    },
    [effectiveScale],
  );

  const findTopUnlockedElementAt = useCallback(
    (x: number, y: number): SlideElement | null => {
      if (!slide) return null;
      for (let i = slide.elements.length - 1; i >= 0; i--) {
        const el = slide.elements[i];
        if (!el.visible || el.locked) continue;
        if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
          return el;
        }
      }
      return null;
    },
    [slide],
  );

  const snapCoordinates = useCallback(
    (x: number, y: number, w: number, h: number, movingIds: Set<string>) => {
      let snappedX = x;
      let snappedY = y;
      const guides: SmartGuide[] = [];
      const threshold = 10;

      if (settings.snapToGrid && settings.showGrid) {
        const g = settings.gridSize;
        snappedX = Math.round(snappedX / g) * g;
        snappedY = Math.round(snappedY / g) * g;
      }

      if (settings.snapToGuides && slide) {
        const xCandidates = [0, dims.width / 2, dims.width];
        const yCandidates = [0, dims.height / 2, dims.height];
        slide.elements.forEach((other) => {
          if (movingIds.has(other.id) || !other.visible) return;
          xCandidates.push(other.x, other.x + other.w / 2, other.x + other.w);
          yCandidates.push(other.y, other.y + other.h / 2, other.y + other.h);
        });

        const objXAnchors = [
          { offset: 0, val: snappedX },
          { offset: w / 2, val: snappedX + w / 2 },
          { offset: w, val: snappedX + w },
        ];
        for (const anchor of objXAnchors) {
          const hit = xCandidates.find((c) => Math.abs(c - anchor.val) < threshold);
          if (hit !== undefined) {
            snappedX = hit - anchor.offset;
            guides.push({ axis: 'x', position: hit });
            break;
          }
        }

        const objYAnchors = [
          { offset: 0, val: snappedY },
          { offset: h / 2, val: snappedY + h / 2 },
          { offset: h, val: snappedY + h },
        ];
        for (const anchor of objYAnchors) {
          const hit = yCandidates.find((c) => Math.abs(c - anchor.val) < threshold);
          if (hit !== undefined) {
            snappedY = hit - anchor.offset;
            guides.push({ axis: 'y', position: hit });
            break;
          }
        }
      }

      return { x: Math.round(snappedX), y: Math.round(snappedY), guides };
    },
    [dims.height, dims.width, settings.gridSize, settings.showGrid, settings.snapToGrid, settings.snapToGuides, slide],
  );

  // Global pointer move/up handlers during drag/resize/rotate/marquee
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      const act = interactionRef.current;
      if (!act || !slide) return;

      const dx = (e.clientX - act.startClientX) / effectiveScale;
      const dy = (e.clientY - act.startClientY) / effectiveScale;

      if (act.mode === 'pan' && act.initialPan) {
        setPanOffset({
          x: act.initialPan.x + (e.clientX - act.startClientX),
          y: act.initialPan.y + (e.clientY - act.startClientY),
        });
        return;
      }

      if (act.mode === 'marquee') {
        const start = toStageCoords(act.startClientX, act.startClientY);
        const curr = toStageCoords(e.clientX, e.clientY);
        setMarqueeRect({
          x: Math.min(start.x, curr.x),
          y: Math.min(start.y, curr.y),
          w: Math.abs(curr.x - start.x),
          h: Math.abs(curr.y - start.y),
        });
        return;
      }

      if (act.mode === 'move' && act.initialElements) {
        const ids = Array.from(act.initialElements.keys());
        const movingSet = new Set(ids);
        const firstId = ids[0];
        const firstInit = act.initialElements.get(firstId);
        if (!firstInit) return;

        let rawDx = dx;
        let rawDy = dy;
        if (e.shiftKey) {
          if (Math.abs(rawDx) > Math.abs(rawDy)) rawDy = 0;
          else rawDx = 0;
        }

        const snapped = snapCoordinates(
          firstInit.x + rawDx,
          firstInit.y + rawDy,
          firstInit.w,
          firstInit.h,
          movingSet,
        );
        const deltaX = snapped.x - firstInit.x;
        const deltaY = snapped.y - firstInit.y;
        setActiveGuides(snapped.guides);

        const updates = ids.map((id) => {
          const init = act.initialElements!.get(id)!;
          return {
            id,
            patch: { x: Math.round(init.x + deltaX), y: Math.round(init.y + deltaY) },
          };
        });
        updateElementsBatch(updates, false);
        return;
      }

      if (act.mode === 'resize' && act.initialElements && act.handle) {
        const id = Array.from(act.initialElements.keys())[0];
        const init = act.initialElements.get(id);
        if (!init) return;
        let { x, y, w, h } = init;
        const handle = act.handle;

        if (handle.includes('e')) w = Math.max(20, init.w + dx);
        if (handle.includes('s')) h = Math.max(20, init.h + dy);
        if (handle.includes('w')) {
          const nextW = Math.max(20, init.w - dx);
          x = init.x + (init.w - nextW);
          w = nextW;
        }
        if (handle.includes('n')) {
          const nextH = Math.max(20, init.h - dy);
          y = init.y + (init.h - nextH);
          h = nextH;
        }

        if (e.shiftKey && init.h > 0) {
          const aspect = init.w / init.h;
          h = Math.round(w / aspect);
        }

        updateElement(id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }, false);
        return;
      }

      if (act.mode === 'rotate' && act.initialElements && act.centerX !== undefined && act.centerY !== undefined) {
        const id = Array.from(act.initialElements.keys())[0];
        const stagePt = toStageCoords(e.clientX, e.clientY);
        let deg = (Math.atan2(stagePt.y - act.centerY, stagePt.x - act.centerX) * 180) / Math.PI + 90;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        updateElement(id, { rotation: Math.round((deg + 360) % 360) }, false);
      }
    };

    const onPointerUp = () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      const act = interactionRef.current;
      if (!act) return;

      if (act.mode === 'marquee' && marqueeRect && slide) {
        const hitIds = slide.elements
          .filter(
            (el) =>
              el.visible &&
              el.x < marqueeRect.x + marqueeRect.w &&
              el.x + el.w > marqueeRect.x &&
              el.y < marqueeRect.y + marqueeRect.h &&
              el.y + el.h > marqueeRect.y,
          )
          .map((el) => el.id);
        selectElements(hitIds, false);
        setMarqueeRect(null);
      } else if (
        (act.mode === 'move' || act.mode === 'resize' || act.mode === 'rotate') &&
        act.snapshotBefore
      ) {
        commitHistorySnapshot(act.snapshotBefore);
      }

      setActiveGuides([]);
      interactionRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [
    commitHistorySnapshot,
    effectiveScale,
    marqueeRect,
    selectElements,
    setActiveGuides,
    setPanOffset,
    slide,
    snapCoordinates,
    toStageCoords,
    updateElement,
    updateElementsBatch,
  ]);

  const startMove = (e: React.PointerEvent, el: SlideElement) => {
    e.stopPropagation();
    setContextMenu(null);
    if (isPainterActive) {
      applyAnimationPainterTo(el.id);
      return;
    }
    if (editingElementId === el.id) return;

    const alreadySelected = selectedElementIds.includes(el.id);
    if (!alreadySelected || e.shiftKey) {
      selectElements([el.id], e.shiftKey);
    }

    // Long press timer for touch context menu
    if (e.pointerType === 'touch') {
      const clientX = e.clientX;
      const clientY = e.clientY;
      longPressTimerRef.current = window.setTimeout(() => {
        setContextMenu({ x: clientX, y: clientY, elementId: el.id });
      }, 550);
    }

    if (el.locked) return;

    const currentState = useStudioStore.getState();
    const activeIds = alreadySelected && !e.shiftKey ? currentState.selectedElementIds : [el.id];
    const initialElements = new Map<string, { x: number; y: number; w: number; h: number; rotation: number }>();
    slide?.elements.forEach((item) => {
      if (activeIds.includes(item.id) && !item.locked) {
        initialElements.set(item.id, {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          rotation: item.rotation,
        });
      }
    });

    if (initialElements.size === 0) return;

    interactionRef.current = {
      mode: 'move',
      startClientX: e.clientX,
      startClientY: e.clientY,
      snapshotBefore: JSON.parse(JSON.stringify(currentState.project)) as Project,
      initialElements,
    };
  };

  const startResize = (e: React.PointerEvent, el: SlideElement, handle: ResizeHandle) => {
    e.stopPropagation();
    if (el.locked) return;
    const currentState = useStudioStore.getState();
    interactionRef.current = {
      mode: 'resize',
      startClientX: e.clientX,
      startClientY: e.clientY,
      handle,
      snapshotBefore: JSON.parse(JSON.stringify(currentState.project)) as Project,
      initialElements: new Map([
        [el.id, { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation }],
      ]),
    };
  };

  const startRotate = (e: React.PointerEvent, el: SlideElement) => {
    e.stopPropagation();
    if (el.locked) return;
    const currentState = useStudioStore.getState();
    interactionRef.current = {
      mode: 'rotate',
      startClientX: e.clientX,
      startClientY: e.clientY,
      centerX: el.x + el.w / 2,
      centerY: el.y + el.h / 2,
      snapshotBefore: JSON.parse(JSON.stringify(currentState.project)) as Project,
      initialElements: new Map([
        [el.id, { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation }],
      ]),
    };
  };

  // Touch pinch-to-zoom & two-finger pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      pinchRef.current = {
        dist,
        scale: effectiveScale,
        midX,
        midY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
      interactionRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const ratio = dist / Math.max(1, pinchRef.current.dist);
      setZoomScale(pinchRef.current.scale * ratio);
      setPanOffset({
        x: pinchRef.current.panX + (midX - pinchRef.current.midX),
        y: pinchRef.current.panY + (midY - pinchRef.current.midY),
      });
    }
  };

  const handleTouchEnd = () => {
    pinchRef.current = null;
  };

  const handleFullscreenStage = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  const bg = slide?.useMaster ? project.master.background : slide?.background;
  const bgCss = bg
    ? bg.mode === 'gradient'
      ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientStart}, ${bg.gradientEnd})`
      : bg.colour
    : '#0f172a';

  const scaledW = dims.width * effectiveScale;
  const scaledH = dims.height * effectiveScale;

  const selectedList = slide ? slide.elements.filter((el) => selectedElementIds.includes(el.id)) : [];
  const contextEl = contextMenu?.elementId ? slide?.elements.find((e) => e.id === contextMenu.elementId) : null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg-canvas-well)]">
      {/* Compact Canvas Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)] whitespace-nowrap">
            {dims.width}×{dims.height}
          </span>
          <span className="hidden sm:inline text-[var(--text-muted)]" aria-hidden="true">
            ·
          </span>
          <span className="hidden sm:inline truncate text-[11px] text-[var(--text-secondary)]">
            Slide {slideIndex + 1} of {project.slides.length}
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {scheduledItems.length > 0 && (
            <button
              type="button"
              onClick={() =>
                designerPreviewPlaying
                  ? setDesignerPreview(false, 0)
                  : setDesignerPreview(true, 0)
              }
              title={designerPreviewPlaying ? 'Stop Animation Preview' : 'Preview Slide Animations'}
              className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2 text-[11px] font-semibold whitespace-nowrap ${
                designerPreviewPlaying
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
              }`}
            >
              {designerPreviewPlaying ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="hidden sm:inline">{designerPreviewPlaying ? 'Stop' : 'Play Fx'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => updateSettings({ showGrid: !settings.showGrid })}
            title="Toggle Grid"
            aria-label="Toggle Grid"
            className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2 text-[11px] font-medium whitespace-nowrap ${
              settings.showGrid
                ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ showRulers: !settings.showRulers })}
            title="Toggle Rulers"
            aria-label="Toggle Rulers"
            className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2 text-[11px] font-medium whitespace-nowrap ${
              settings.showRulers
                ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Rulers</span>
          </button>

          <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />

          {(['fit', 'fill', '100'] as ZoomMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setZoomMode(mode)}
              className={`min-h-[28px] rounded-md px-2 text-[11px] font-medium uppercase whitespace-nowrap ${
                zoomMode === mode
                  ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              {mode === '100' ? '100%' : mode}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setZoomScale(effectiveScale - 0.1)}
            title="Zoom out"
            aria-label="Zoom out"
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono-tabular w-10 text-center text-[11px] text-[var(--text-secondary)]">
            {Math.round(effectiveScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomScale(effectiveScale + 0.1)}
            title="Zoom in"
            aria-label="Zoom in"
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFullscreenStage}
            title="Fullscreen Stage"
            aria-label="Fullscreen Stage"
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Stage Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(ASSET_DRAG_MIME)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          const pt = toStageCoords(e.clientX, e.clientY);
          const x = Math.max(0, Math.min(dims.width, pt.x));
          const y = Math.max(0, Math.min(dims.height, pt.y));
          const hitEl = findTopUnlockedElementAt(x, y);
          setAssetDropState({ x, y, targetElId: hitEl?.id ?? null });
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setAssetDropState(null);
          }
        }}
        onDrop={(e) => {
          const raw = e.dataTransfer.getData(ASSET_DRAG_MIME);
          setAssetDropState(null);
          if (!raw) return;
          e.preventDefault();
          let payload: DraggedAssetPayload;
          try {
            payload = JSON.parse(raw) as DraggedAssetPayload;
          } catch {
            return;
          }
          const rawPt = toStageCoords(e.clientX, e.clientY);
          const pt = {
            x: Math.max(0, Math.min(dims.width, rawPt.x)),
            y: Math.max(0, Math.min(dims.height, rawPt.y)),
          };

          if (payload.kind === 'shape') {
            const shape = ASSET_SHAPES.find((s) => s.id === payload.shapeId);
            if (shape) {
              insertAssetShape(shape, pt);
              showDropNotice(`Dropped ${shape.name}`);
            }
            return;
          }

          if (payload.kind === 'icon') {
            const icon = ASSET_ICONS.find((ic) => ic.id === payload.iconId);
            if (icon) {
              insertAssetSvg(icon.svg, icon.name, pt);
              showDropNotice(`Dropped ${icon.name} icon`);
            }
            return;
          }

          if (payload.kind === 'anim-preset') {
            const preset = loadSavedAnimationPresets().find((p) => p.id === payload.presetId);
            if (!preset) return;
            const hitEl = findTopUnlockedElementAt(pt.x, pt.y);
            if (hitEl) {
              applyAnimationPresetToElement(hitEl.id, preset.animations);
              showDropNotice(`Applied "${preset.name}" to ${hitEl.name}`);
            } else {
              insertAnimatedPresetCard(preset, pt);
              showDropNotice(`Added animated "${preset.name}" card`);
            }
            return;
          }

          if (payload.kind === 'recipe-preset') {
            if (payload.source === 'recipe') {
              const recipe = ANIMATION_RECIPES.find((r) => r.id === payload.id);
              if (recipe) {
                insertAnimatedElementsAt(recipe.elements, pt);
                showDropNotice(`Added ${recipe.name}`);
              }
            } else {
              const choreo = CHOREOGRAPHY_PRESETS.find((c) => c.id === payload.id);
              if (choreo) {
                insertAnimatedElementsAt(choreo.elements, pt);
                showDropNotice(`Added ${choreo.title}`);
              }
            }
          }
        }}
        onPointerDown={(e) => {
          setContextMenu(null);
          if (e.button === 1 || (e.button === 0 && e.altKey)) {
            interactionRef.current = {
              mode: 'pan',
              startClientX: e.clientX,
              startClientY: e.clientY,
              initialPan: { ...panOffset },
            };
            return;
          }
          clearSelection();
          interactionRef.current = {
            mode: 'marquee',
            startClientX: e.clientX,
            startClientY: e.clientY,
          };
        }}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoomScale(effectiveScale - e.deltaY * 0.0015);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, elementId: selectedElementIds[0] ?? null });
        }}
        className="relative flex flex-1 items-center justify-center overflow-hidden touch-none select-none"
      >
        {assetDropNotice && (
          <div className="pointer-events-none absolute right-4 top-7 z-30 rounded-lg border border-emerald-500/40 bg-emerald-950/90 px-3 py-1.5 text-xs font-medium text-emerald-200 shadow-lg backdrop-blur-sm">
            {assetDropNotice}
          </div>
        )}
        {/* Top & Left Rulers */}
        {settings.showRulers && (
          <>
            <div className="pointer-events-none absolute left-6 right-0 top-0 z-20 flex h-5 items-end justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/85 px-4 font-mono-tabular text-[9px] text-[var(--text-muted)] backdrop-blur-sm">
              <span>0</span>
              <span>{Math.round(dims.width * 0.25)}</span>
              <span>{Math.round(dims.width * 0.5)}</span>
              <span>{Math.round(dims.width * 0.75)}</span>
              <span>{dims.width}</span>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 top-5 z-20 flex w-6 flex-col items-end justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]/85 py-4 pr-1 font-mono-tabular text-[9px] text-[var(--text-muted)] backdrop-blur-sm">
              <span>0</span>
              <span>{Math.round(dims.height * 0.5)}</span>
              <span>{dims.height}</span>
            </div>
          </>
        )}

        {/* Scaled Virtual Stage Box */}
        <div
          ref={stageWrapperRef}
          style={{
            width: scaledW,
            height: scaledH,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
          className="relative shrink-0 shadow-2xl ring-1 ring-black/30"
        >
          <div
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top left',
              background: bgCss,
            }}
            className="relative overflow-hidden"
          >
            {/* Master Chrome */}
            {slide?.useMaster && project.master.showAccentBar && (
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 h-2"
                style={{ backgroundColor: project.master.accentColour }}
              />
            )}
            {slide?.useMaster && project.master.showFooter && (
              <div
                className="pointer-events-none absolute bottom-7 left-16 text-lg opacity-55"
                style={{ color: project.master.bodyColour, fontFamily: project.master.bodyFont }}
              >
                {project.master.footerText}
              </div>
            )}
            {slide?.useMaster && project.master.showSlideNumber && (
              <div
                className="pointer-events-none font-mono-tabular absolute bottom-7 right-16 text-lg opacity-55"
                style={{ color: project.master.bodyColour }}
              >
                {slideIndex + 1}
              </div>
            )}

            {/* Alignment Grid */}
            {settings.showGrid && (
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)`,
                  backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`,
                }}
              />
            )}

            {/* Slide Elements */}
            {slide?.elements.map((el) => {
              if (!el.visible) return null;
              const isSelected = selectedElementIds.includes(el.id);
              const isEditing = editingElementId === el.id;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => startMove(e, el)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!el.locked && (el.type === 'text' || el.type === 'shape')) {
                      setEditingElement(el.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.w,
                    height: el.h,
                    transform: `rotate(${el.rotation}deg)`,
                    cursor: isPainterActive
                      ? 'copy'
                      : el.locked
                        ? 'not-allowed'
                        : isEditing
                          ? 'text'
                          : 'move',
                  }}
                >
                  {designerPreviewPlaying || designerPreviewTime > 0 ? (
                    <AnimatedElementWrapper
                      element={el}
                      scheduledItems={scheduledItems}
                      currentTime={designerPreviewTime}
                      isPlayingOrPreviewing={true}
                      reduceMotion={settings.reduceMotion}
                    />
                  ) : (
                    <ElementRenderer
                      element={el}
                      isEditing={isEditing}
                      onTextChange={(nextText) => updateElement(el.id, { text: nextText }, false)}
                      onFinishEditing={() => setEditingElement(null)}
                    />
                  )}

                  {/* Drop Target Highlight */}
                  {assetDropState?.targetElId === el.id && (
                    <div className="pointer-events-none absolute inset-0 rounded-md ring-4 ring-emerald-400/80 bg-emerald-400/10" />
                  )}

                  {/* Selection Box & Handles */}
                  {isSelected && !isEditing && (
                    <div
                      className="pointer-events-none absolute inset-0 ring-2"
                      style={{
                        borderColor: 'var(--accent-500)',
                        boxShadow: '0 0 0 2px var(--accent-500)',
                      }}
                    >
                      {!el.locked && selectedList.length === 1 && (
                        <>
                          {/* Rotation Handle */}
                          <button
                            type="button"
                            aria-label="Rotate element"
                            onPointerDown={(e) => startRotate(e, el)}
                            style={{
                              position: 'absolute',
                              left: '50%',
                              top: -42 / effectiveScale,
                              transform: `translateX(-50%) scale(${1 / effectiveScale})`,
                            }}
                            className="pointer-events-auto flex h-7 w-7 cursor-grab items-center justify-center rounded-full border border-[var(--accent-500)] bg-[var(--bg-panel)] text-[var(--accent-500)] shadow-md"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>

                          {/* 8 Resize Handles */}
                          {(
                            [
                              ['nw', '0%', '0%', 'nwse-resize'],
                              ['n', '50%', '0%', 'ns-resize'],
                              ['ne', '100%', '0%', 'nesw-resize'],
                              ['e', '100%', '50%', 'ew-resize'],
                              ['se', '100%', '100%', 'nwse-resize'],
                              ['s', '50%', '100%', 'ns-resize'],
                              ['sw', '0%', '100%', 'nesw-resize'],
                              ['w', '0%', '50%', 'ew-resize'],
                            ] as const
                          ).map(([handle, left, top, cursor]) => (
                            <div
                              key={handle}
                              onPointerDown={(e) => startResize(e, el, handle)}
                              style={{
                                position: 'absolute',
                                left,
                                top,
                                width: 14,
                                height: 14,
                                cursor,
                                transform: `translate(-50%, -50%) scale(${1 / effectiveScale})`,
                              }}
                              className="pointer-events-auto rounded-sm border-2 border-[var(--accent-500)] bg-white shadow"
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Smart Alignment Guides */}
            {activeGuides.map((g, i) =>
              g.axis === 'x' ? (
                <div
                  key={`gx-${i}`}
                  className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-rose-500"
                  style={{ left: g.position }}
                />
              ) : (
                <div
                  key={`gy-${i}`}
                  className="pointer-events-none absolute left-0 right-0 h-[2px] bg-rose-500"
                  style={{ top: g.position }}
                />
              ),
            )}

            {/* Marquee Selection Box */}
            {marqueeRect && (
              <div
                className="pointer-events-none absolute border-2 border-[var(--accent-500)] bg-[var(--accent-soft)]"
                style={{
                  left: marqueeRect.x,
                  top: marqueeRect.y,
                  width: marqueeRect.w,
                  height: marqueeRect.h,
                }}
              />
            )}

            {/* Asset Drop Target Reticle */}
            {assetDropState && (
              <div
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
                style={{ left: assetDropState.x, top: assetDropState.y }}
              >
                <div
                  style={{ transform: `scale(${1 / effectiveScale})` }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[var(--accent-500)] bg-[var(--accent-500)]/20 shadow-lg"
                >
                  <div className="h-2 w-2 rounded-full bg-[var(--accent-500)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Context Menu (Right-click or Long-press) */}
        {contextMenu && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              left: Math.min(window.innerWidth - 190, contextMenu.x),
              top: Math.min(window.innerHeight - 220, contextMenu.y),
            }}
            className="fixed z-50 w-44 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 shadow-2xl text-xs"
          >
            {contextEl ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    duplicateSelected();
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[var(--bg-panel-elevated)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reorderElementLayer(contextEl.id, 'front');
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[var(--bg-panel-elevated)]"
                >
                  <span>Bring to Front</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reorderElementLayer(contextEl.id, 'back');
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[var(--bg-panel-elevated)]"
                >
                  <span>Send to Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleLockElement(contextEl.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[var(--bg-panel-elevated)]"
                >
                  {contextEl.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>{contextEl.locked ? 'Unlock' : 'Lock'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteSelected();
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-rose-400 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setZoomMode('fit');
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[var(--bg-panel-elevated)]"
              >
                <span>Fit Stage to Screen</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
