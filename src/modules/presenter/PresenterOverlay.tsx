import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  FileText,
  Grid,
  Maximize2,
  Minimize2,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { AnimatedElementWrapper } from '../../components/AnimatedElementWrapper';
import { STAGE_DIMENSIONS } from '../../data/themes';
import { buildSlideTimeline } from '../../engine/animationEngine';
import { bgToCss, getEffectiveSlideBg, SlideSurface, TransitionStageRenderer } from '../../engine/transitionEngine';
import { useStudioStore } from '../../store/useStudioStore';

interface PresenterOverlayProps {
  open: boolean;
  startSlideIndex?: number;
  initialRehearse?: boolean;
  onClose: () => void;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const PresenterOverlay: React.FC<PresenterOverlayProps> = ({
  open,
  startSlideIndex = 0,
  initialRehearse = false,
  onClose,
}) => {
  const project = useStudioStore((s) => s.project);
  const settings = useStudioStore((s) => s.settings);
  const setActiveSlide = useStudioStore((s) => s.setActiveSlide);

  const [currentIndex, setCurrentIndex] = useState(startSlideIndex);
  const [showNotesView, setShowNotesView] = useState(false);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [blackout, setBlackout] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [externalDisplayOpen, setExternalDisplayOpen] = useState(false);

  // Rehearsal & timer state
  const [rehearseMode, setRehearseMode] = useState(initialRehearse);
  const [timerRunning, setTimerRunning] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [slideSeconds, setSlideSeconds] = useState(0);
  const [perSlideTimes, setPerSlideTimes] = useState<Record<string, number>>({});
  const [showTimingSummary, setShowTimingSummary] = useState(false);

  // Slide transition playback state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionFromIdx, setTransitionFromIdx] = useState(0);
  const [transitionToIdx, setTransitionToIdx] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Per-slide animation playback state
  const [animTime, setAnimTime] = useState(0);
  const [animTargetTime, setAnimTargetTime] = useState(0);
  const [currentClickStage, setCurrentClickStage] = useState(0);
  const [isAnimPlaying, setIsAnimPlaying] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [stageBox, setStageBox] = useState({ width: 960, height: 540 });

  const slides = project.slides;
  const safeIndex = Math.max(0, Math.min(slides.length - 1, currentIndex));
  const activeSlide = slides[safeIndex] ?? slides[0];
  const nextSlide = safeIndex < slides.length - 1 ? slides[safeIndex + 1] : null;
  const dims = STAGE_DIMENSIONS[project.aspectRatio];

  const timeline = useMemo(
    () => (activeSlide ? buildSlideTimeline(activeSlide.elements) : { items: [], totalDuration: 0 }),
    [activeSlide],
  );

  const maxClickGroup = useMemo(
    () => timeline.items.reduce((max, item) => Math.max(max, item.clickGroup), 0),
    [timeline.items],
  );

  const getGroupEndTime = useCallback(
    (group: number): number => {
      const matching = timeline.items.filter((i) => i.clickGroup <= group);
      if (matching.length === 0) return 0;
      return matching.reduce((max, item) => Math.max(max, item.endTime), 0);
    },
    [timeline.items],
  );

  // Reset overlay state whenever opened
  useEffect(() => {
    if (!open) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, startSlideIndex));
    setCurrentIndex(clamped);
    setRehearseMode(initialRehearse);
    setTimerRunning(true);
    setTotalSeconds(0);
    setSlideSeconds(0);
    setPerSlideTimes({});
    setShowTimingSummary(false);
    setBlackout(false);
    setShowGrid(false);
    setIsTransitioning(false);
    setTransitionProgress(0);

    const firstSlide = slides[clamped];
    if (firstSlide) {
      const tl = buildSlideTimeline(firstSlide.elements);
      const group0End = tl.items
        .filter((i) => i.clickGroup === 0)
        .reduce((max, item) => Math.max(max, item.endTime), 0);
      setCurrentClickStage(0);
      setAnimTime(0);
      setAnimTargetTime(group0End);
      setIsAnimPlaying(group0End > 0);
    }
  }, [open, startSlideIndex, initialRehearse, slides]);

  // Keep fullscreen indicator synced
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Measure available stage box cleanly
  useEffect(() => {
    if (!open) return;
    const el = stageContainerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageBox({
        width: Math.max(240, rect.width - 24),
        height: Math.max(160, rect.height - 24),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, showNotesView, showGrid, showTimingSummary]);

  // Timer tick (1s resolution)
  useEffect(() => {
    if (!open || !timerRunning || showTimingSummary) return;
    const id = window.setInterval(() => {
      setTotalSeconds((s) => s + 1);
      setSlideSeconds((s) => s + 1);
      if (activeSlide) {
        setPerSlideTimes((prev) => ({
          ...prev,
          [activeSlide.id]: (prev[activeSlide.id] ?? 0) + 1,
        }));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, timerRunning, showTimingSummary, activeSlide]);

  // Animate element timeline up to animTargetTime
  useEffect(() => {
    if (!open || !isAnimPlaying || isTransitioning) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setAnimTime((prev) => {
        const next = prev + dt;
        if (next >= animTargetTime) {
          setIsAnimPlaying(false);
          return animTargetTime;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open, isAnimPlaying, animTargetTime, isTransitioning]);

  const startSlideAnimations = useCallback(
    (slideIndex: number) => {
      const targetSlide = slides[slideIndex];
      if (!targetSlide) return;
      const tl = buildSlideTimeline(targetSlide.elements);
      const group0End = tl.items
        .filter((i) => i.clickGroup === 0)
        .reduce((max, item) => Math.max(max, item.endTime), 0);
      setCurrentClickStage(0);
      setAnimTime(0);
      setAnimTargetTime(group0End);
      setIsAnimPlaying(group0End > 0);
    },
    [slides],
  );

  // Slide-to-slide transition animation loop
  useEffect(() => {
    if (!open || !isTransitioning) return;
    const incomingSlide = slides[transitionToIdx];
    const durMs = Math.max(120, (incomingSlide?.transition.duration ?? 0.6) * 1000);
    if (settings.reduceMotion) {
      setIsTransitioning(false);
      setTransitionProgress(0);
      setCurrentIndex(transitionToIdx);
      setSlideSeconds(0);
      if (incomingSlide) setActiveSlide(incomingSlide.id);
      startSlideAnimations(transitionToIdx);
      return;
    }

    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durMs);
      setTransitionProgress(p);
      if (p >= 1) {
        setIsTransitioning(false);
        setTransitionProgress(0);
        setCurrentIndex(transitionToIdx);
        setSlideSeconds(0);
        if (incomingSlide) setActiveSlide(incomingSlide.id);
        startSlideAnimations(transitionToIdx);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open, isTransitioning, transitionToIdx, slides, settings.reduceMotion, setActiveSlide, startSlideAnimations]);

  const jumpToSlide = useCallback(
    (idx: number, playTransition = false) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      setShowGrid(false);
      setBlackout(false);
      if (playTransition && clamped !== safeIndex) {
        setTransitionFromIdx(safeIndex);
        setTransitionToIdx(clamped);
        setTransitionProgress(0);
        setIsTransitioning(true);
      } else {
        setIsTransitioning(false);
        setCurrentIndex(clamped);
        setSlideSeconds(0);
        const s = slides[clamped];
        if (s) setActiveSlide(s.id);
        startSlideAnimations(clamped);
      }
    },
    [safeIndex, slides, setActiveSlide, startSlideAnimations],
  );

  const handleNextStep = useCallback(() => {
    if (showGrid || showTimingSummary) return;
    if (blackout) {
      setBlackout(false);
      return;
    }

    // Snap active transition immediately if user clicks quickly
    if (isTransitioning) {
      const target = slides[transitionToIdx];
      setIsTransitioning(false);
      setTransitionProgress(0);
      setCurrentIndex(transitionToIdx);
      setSlideSeconds(0);
      if (target) setActiveSlide(target.id);
      startSlideAnimations(transitionToIdx);
      return;
    }

    // Advance click-triggered animation group first
    if (currentClickStage < maxClickGroup) {
      const nextStage = currentClickStage + 1;
      const nextEnd = getGroupEndTime(nextStage);
      setCurrentClickStage(nextStage);
      setAnimTargetTime(nextEnd);
      setIsAnimPlaying(true);
      return;
    }

    // Advance to next slide with its configured transition
    if (safeIndex < slides.length - 1) {
      jumpToSlide(safeIndex + 1, true);
    } else if (rehearseMode) {
      setShowTimingSummary(true);
    } else {
      setShowTimingSummary(true);
    }
  }, [
    showGrid,
    showTimingSummary,
    blackout,
    isTransitioning,
    transitionToIdx,
    slides,
    setActiveSlide,
    startSlideAnimations,
    currentClickStage,
    maxClickGroup,
    getGroupEndTime,
    safeIndex,
    jumpToSlide,
    rehearseMode,
  ]);

  const handlePrevStep = useCallback(() => {
    if (showGrid || showTimingSummary) return;
    if (isTransitioning) {
      setIsTransitioning(false);
      setTransitionProgress(0);
      return;
    }
    if (currentClickStage > 0) {
      const prevStage = currentClickStage - 1;
      const prevEnd = getGroupEndTime(prevStage);
      setCurrentClickStage(prevStage);
      setIsAnimPlaying(false);
      setAnimTargetTime(prevEnd);
      setAnimTime(prevEnd);
      return;
    }
    if (safeIndex > 0) {
      jumpToSlide(safeIndex - 1, false);
    }
  }, [showGrid, showTimingSummary, isTransitioning, currentClickStage, getGroupEndTime, safeIndex, jumpToSlide]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {});
    }
    const desktopApi = window.desktop ?? window.electronAPI;
    if (desktopApi?.closePresenterDisplay) {
      void desktopApi.closePresenterDisplay();
      setExternalDisplayOpen(false);
    }
    onClose();
  }, [onClose]);

  const toggleExternalDisplay = useCallback(async () => {
    const api = window.desktop ?? window.electronAPI;
    if (!api || !activeSlide) return;
    if (externalDisplayOpen) {
      await api.closePresenterDisplay();
      setExternalDisplayOpen(false);
    } else {
      await api.openPresenterDisplay({
        slide: activeSlide,
        slideIndex: safeIndex,
        aspectRatio: project.aspectRatio,
        master: project.master,
        blackout,
        animTime,
        reduceMotion: settings.reduceMotion,
      });
      setExternalDisplayOpen(true);
      setShowNotesView(true);
    }
  }, [externalDisplayOpen, activeSlide, safeIndex, project.aspectRatio, project.master, blackout, animTime, settings.reduceMotion]);

  useEffect(() => {
    const api = window.desktop ?? window.electronAPI;
    if (!api) return;
    return api.onAudienceClosed(() => setExternalDisplayOpen(false));
  }, []);

  useEffect(() => {
    const api = window.desktop ?? window.electronAPI;
    if (!open || !externalDisplayOpen || !api || !activeSlide) return;
    api.syncAudienceDisplay({
      slide: activeSlide,
      slideIndex: safeIndex,
      aspectRatio: project.aspectRatio,
      master: project.master,
      blackout,
      animTime,
      reduceMotion: settings.reduceMotion,
    });
  }, [open, externalDisplayOpen, activeSlide, safeIndex, project.aspectRatio, project.master, blackout, animTime, settings.reduceMotion]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGrid) {
          setShowGrid(false);
          return;
        }
        if (showTimingSummary) {
          setShowTimingSummary(false);
          return;
        }
        handleExit();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        if (safeIndex < slides.length - 1) jumpToSlide(safeIndex + 1, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key.toLowerCase() === 'l') {
        setLaserEnabled((v) => !v);
      } else if (e.key.toLowerCase() === 'n') {
        setShowNotesView((v) => !v);
      } else if (e.key.toLowerCase() === 'b') {
        setBlackout((v) => !v);
      } else if (e.key.toLowerCase() === 'g') {
        setShowGrid((v) => !v);
      } else if (e.key.toLowerCase() === 'r') {
        setRehearseMode((v) => !v);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    open,
    showGrid,
    showTimingSummary,
    handleExit,
    handleNextStep,
    handlePrevStep,
    safeIndex,
    slides.length,
    jumpToSlide,
    toggleFullscreen,
  ]);

  if (!open || !activeSlide) return null;

  const stageScale = Math.min(stageBox.width / dims.width, stageBox.height / dims.height);
  const renderedWidth = dims.width * stageScale;
  const renderedHeight = dims.height * stageScale;
  const bg = getEffectiveSlideBg(activeSlide, project.master);
  const hasInteractiveAnimations = timeline.items.length > 0;

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!laserEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLaserPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Presenter Mode"
      className="fixed inset-0 z-50 flex flex-col bg-[#05070d] text-slate-100 select-none overflow-hidden"
    >
      {/* Top Presenter Console Bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0b101b]/95 px-3 sm:px-4 py-2 text-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display font-bold text-white truncate max-w-[180px] sm:max-w-xs">
            {project.name}
          </span>
          <span className="font-mono-tabular text-slate-400">
            Slide {safeIndex + 1} / {slides.length}
          </span>
          {maxClickGroup > 0 && (
            <span className="hidden sm:inline font-mono-tabular text-sky-400">
              Cue {currentClickStage} / {maxClickGroup}
            </span>
          )}
          {rehearseMode && (
            <span className="inline-flex items-center gap-1 font-mono-tabular text-amber-400 font-semibold">
              <Timer className="h-3.5 w-3.5" />
              Rehearse Active
            </span>
          )}
        </div>

        {/* Live Stopwatch + Control Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tabular">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span title="Total elapsed presentation time">{formatClock(totalSeconds)}</span>
            <span className="text-white/25">|</span>
            <span title="Time on current slide" className="text-slate-300">
              {formatClock(slideSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setTimerRunning((v) => !v)}
              title={timerRunning ? 'Pause timer' : 'Resume timer'}
              aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
              className="ml-1 rounded p-0.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTotalSeconds(0);
                setSlideSeconds(0);
                setPerSlideTimes({});
              }}
              title="Reset rehearsal timers"
              aria-label="Reset timers"
              className="rounded p-0.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setRehearseMode((v) => !v)}
            title="Toggle Rehearse Timings (R)"
            className={`min-h-[34px] rounded-lg border px-2.5 font-medium transition-colors ${
              rehearseMode
                ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Rehearse
          </button>

          <button
            type="button"
            onClick={() => setLaserEnabled((v) => !v)}
            title="Laser Pointer (L)"
            className={`min-h-[34px] rounded-lg border px-2.5 font-medium transition-colors ${
              laserEnabled
                ? 'border-rose-500/70 bg-rose-500/20 text-rose-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Laser
          </button>

          <button
            type="button"
            onClick={() => setShowNotesView((v) => !v)}
            title="Speaker Notes & Next Slide (N)"
            className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 font-medium transition-colors ${
              showNotesView
                ? 'border-sky-400/70 bg-sky-500/20 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            title="Slide Grid Overview (G)"
            className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 font-medium transition-colors ${
              showGrid
                ? 'border-sky-400/70 bg-sky-500/20 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setBlackout((v) => !v)}
            title="Blackout Screen (B)"
            className={`hidden sm:inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 font-medium transition-colors ${
              blackout
                ? 'border-white/50 bg-white/20 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Black</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTimingSummary(true)}
            title="View Rehearsal Timing Summary"
            className="hidden md:inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 font-medium text-slate-300 hover:bg-white/10"
          >
            Timings
          </button>

          {typeof window !== 'undefined' && (window.desktop?.isDesktop || window.electronAPI?.isElectron) && (
            <button
              type="button"
              onClick={() => void toggleExternalDisplay()}
              title="Present Fullscreen on Second Monitor"
              className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 font-medium transition-colors ${
                externalDisplayOpen
                  ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{externalDisplayOpen ? '2nd Display On' : '2nd Display'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Browser Fullscreen (F)"
            aria-label="Toggle Fullscreen"
            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleExit}
            title="Exit Presenter Mode (Esc)"
            aria-label="Exit Presenter Mode"
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-rose-600 px-2.5 font-semibold text-white hover:bg-rose-500"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Presenter Body */}
      <div
        className={`flex-1 min-h-0 grid overflow-hidden ${
          showNotesView ? 'grid-cols-1 lg:grid-cols-[1fr_360px]' : 'grid-cols-1'
        }`}
      >
        {/* Live Interactive Slide Stage */}
        <div
          ref={stageContainerRef}
          className="relative flex items-center justify-center overflow-hidden bg-[#05070d] p-3"
        >
          {blackout ? (
            <button
              type="button"
              onClick={() => setBlackout(false)}
              className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black text-slate-500"
            >
              <EyeOff className="h-7 w-7 opacity-40" />
              <span className="text-xs">Screen blacked out · Press B or click to resume</span>
            </button>
          ) : (
            <div
              onClick={() => {
                if (!laserEnabled) handleNextStep();
              }}
              onPointerMove={handleStagePointerMove}
              onPointerLeave={() => setLaserPos(null)}
              className={`relative overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 ${
                laserEnabled ? 'cursor-none' : 'cursor-pointer'
              }`}
              style={{
                width: renderedWidth,
                height: renderedHeight,
              }}
            >
              {isTransitioning && slides[transitionFromIdx] && slides[transitionToIdx] ? (
                <TransitionStageRenderer
                  slideA={slides[transitionFromIdx]}
                  slideB={slides[transitionToIdx]}
                  aspectRatio={project.aspectRatio}
                  master={project.master}
                  transitionType={slides[transitionToIdx].transition.type}
                  direction={slides[transitionToIdx].transition.direction}
                  easing={slides[transitionToIdx].transition.easing}
                  morphMode={slides[transitionToIdx].transition.morphMode}
                  progress={transitionProgress}
                  scale={stageScale}
                  reduceMotion={settings.reduceMotion}
                />
              ) : (
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: dims.width,
                    height: dims.height,
                    transform: `scale(${stageScale})`,
                    transformOrigin: 'top left',
                    background: bgToCss(bg),
                  }}
                >
                  {activeSlide.useMaster && project.master.showAccentBar && (
                    <div
                      className="absolute left-0 right-0 top-0 h-2"
                      style={{ backgroundColor: project.master.accentColour }}
                    />
                  )}

                  {activeSlide.elements.map((el) => {
                    if (!el.visible) return null;
                    return (
                      <div
                        key={el.id}
                        style={{
                          position: 'absolute',
                          left: el.x,
                          top: el.y,
                          width: el.w,
                          height: el.h,
                          transform: `rotate(${el.rotation}deg)`,
                        }}
                      >
                        <AnimatedElementWrapper
                          element={el}
                          scheduledItems={timeline.items}
                          currentTime={animTime}
                          isPlayingOrPreviewing={hasInteractiveAnimations}
                          reduceMotion={settings.reduceMotion}
                        />
                      </div>
                    );
                  })}

                  {activeSlide.useMaster && project.master.showFooter && (
                    <div
                      className="absolute bottom-7 left-16 text-lg opacity-55"
                      style={{
                        color: project.master.bodyColour,
                        fontFamily: project.master.bodyFont,
                      }}
                    >
                      {project.master.footerText}
                    </div>
                  )}

                  {activeSlide.useMaster && project.master.showSlideNumber && (
                    <div
                      className="font-mono-tabular absolute bottom-7 right-16 text-lg opacity-55"
                      style={{ color: project.master.bodyColour }}
                    >
                      {safeIndex + 1}
                    </div>
                  )}
                </div>
              )}

              {/* Laser Cursor Dot */}
              {laserEnabled && laserPos && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${laserPos.x}%`, top: `${laserPos.y}%` }}
                >
                  <div className="h-7 w-7 rounded-full bg-rose-500/25 blur-[2px]" />
                  <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 shadow-[0_0_14px_4px_rgba(244,63,94,0.95)] ring-2 ring-white/80" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Presenter Notes & Next Slide Side Console */}
        {showNotesView && (
          <aside
            aria-label="Speaker Notes and Next Slide Preview"
            className="flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0b101b] p-4 gap-4 overflow-y-auto studio-scroll max-h-[42dvh] lg:max-h-none"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Next Slide</span>
                {nextSlide && (
                  <span className="font-mono-tabular text-sky-400">
                    {nextSlide.transition.type} · {nextSlide.transition.duration.toFixed(1)}s
                  </span>
                )}
              </div>
              {nextSlide ? (
                <button
                  type="button"
                  onClick={() => jumpToSlide(safeIndex + 1, true)}
                  className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-black text-left hover:border-sky-400/60"
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: dims.width * 0.165,
                      height: dims.height * 0.165,
                    }}
                  >
                    <div
                      style={{
                        width: dims.width,
                        height: dims.height,
                        transform: 'scale(0.165)',
                        transformOrigin: 'top left',
                      }}
                    >
                      <SlideSurface
                        slide={nextSlide}
                        width={dims.width}
                        height={dims.height}
                        master={project.master}
                        slideNumber={safeIndex + 2}
                      />
                    </div>
                  </div>
                  <div className="border-t border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 truncate">
                    {safeIndex + 2}. {nextSlide.title}
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                  Final slide in deck — advancing next opens Rehearsal Summary.
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Speaker Notes · {activeSlide.title}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                {activeSlide.notes?.trim()
                  ? activeSlide.notes
                  : 'No speaker notes recorded for this slide. Add talking points in the Slide Designer properties panel.'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">Presenter Shortcuts</div>
              <div>Space / → : Next cue or slide · ← : Previous</div>
              <div>L : Laser · N : Notes · G : Grid · B : Blackout · R : Rehearse · F : Fullscreen</div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Touch & Click Navigation Bar */}
      <footer className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#0b101b]/95 px-3 sm:px-4 py-2 text-xs shrink-0 pb-safe">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={safeIndex === 0 && currentClickStage === 0}
            className="inline-flex min-h-[42px] items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 font-medium text-white disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={() => startSlideAnimations(safeIndex)}
            title="Replay animations on current slide"
            className="inline-flex min-h-[42px] items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-slate-300 hover:bg-white/10"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Replay Slide</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-md">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpToSlide(idx, false)}
              aria-label={`Jump to slide ${idx + 1}: ${s.title}`}
              className={`h-2 rounded-full transition-all ${
                idx === safeIndex ? 'w-7 bg-sky-400' : 'w-2 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNextStep}
          className="inline-flex min-h-[42px] items-center gap-1 rounded-lg bg-sky-600 px-4 font-semibold text-white hover:bg-sky-500"
        >
          <span>
            {currentClickStage < maxClickGroup
              ? `Next Cue (${currentClickStage + 1}/${maxClickGroup})`
              : safeIndex < slides.length - 1
                ? 'Next Slide'
                : 'Finish'}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      {/* Slide Grid Overview Modal (G) */}
      {showGrid && (
        <div
          role="dialog"
          aria-label="Slide Grid Overview"
          className="absolute inset-0 z-40 flex flex-col bg-black/90 backdrop-blur-md p-4 sm:p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 shrink-0">
            <div>
              <h2 className="font-display text-base font-bold text-white">Slide Grid Overview</h2>
              <p className="text-xs text-slate-400">Select any slide to jump directly in Presenter Mode.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowGrid(false)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-medium text-white"
            >
              <X className="h-4 w-4" />
              <span>Close Grid</span>
            </button>
          </div>

          <div className="studio-scroll grid flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
            {slides.map((s, idx) => {
              const active = idx === safeIndex;
              const thumbScale = 0.16;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpToSlide(idx, false)}
                  className={`flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
                    active
                      ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-400/50'
                      : 'border-white/15 bg-white/5 hover:border-white/35'
                  }`}
                >
                  <div className="flex items-center justify-center bg-black/40 p-2">
                    <div
                      className="overflow-hidden rounded"
                      style={{ width: dims.width * thumbScale, height: dims.height * thumbScale }}
                    >
                      <div
                        style={{
                          width: dims.width,
                          height: dims.height,
                          transform: `scale(${thumbScale})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <SlideSurface
                          slide={s}
                          width={dims.width}
                          height={dims.height}
                          master={project.master}
                          slideNumber={idx + 1}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-xs">
                    <span className="truncate font-semibold text-white">
                      {idx + 1}. {s.title}
                    </span>
                    <span className="font-mono-tabular text-[11px] text-slate-400">
                      {formatClock(perSlideTimes[s.id] ?? 0)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rehearsal Timing Summary Modal */}
      {showTimingSummary && (
        <div
          role="dialog"
          aria-label="Rehearsal Timing Summary"
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0e1526] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-white">Rehearsal Timing Summary</h2>
                <p className="text-xs text-slate-400">
                  Total presentation time: <strong className="text-sky-400">{formatClock(totalSeconds)}</strong> across{' '}
                  {slides.length} slides
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTimingSummary(false)}
                aria-label="Close Timing Summary"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="studio-scroll max-h-72 overflow-y-auto space-y-2 pr-1">
              {slides.map((s, idx) => {
                const secs = perSlideTimes[s.id] ?? 0;
                const pct = totalSeconds > 0 ? Math.round((secs / totalSeconds) * 100) : 0;
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100 truncate">
                        {idx + 1}. {s.title}
                      </span>
                      <span className="font-mono-tabular text-sky-400">
                        {formatClock(secs)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowTimingSummary(false);
                  jumpToSlide(0, false);
                  setTotalSeconds(0);
                  setSlideSeconds(0);
                  setPerSlideTimes({});
                  setRehearseMode(true);
                  setTimerRunning(true);
                }}
                className="min-h-[38px] rounded-lg border border-white/15 bg-white/5 px-3 font-medium text-white hover:bg-white/10"
              >
                Restart Rehearsal
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="min-h-[38px] rounded-lg bg-sky-600 px-4 font-semibold text-white hover:bg-sky-500"
              >
                Return to Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
