import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Columns2,
  Compass,
  Copy,
  Layers,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { LabPanelToggles } from '../../components/LabPanelToggles';
import { STAGE_DIMENSIONS } from '../../data/themes';
import {
  createSampleTransitionPair,
  TRANSITION_DEFINITIONS,
  TRANSITION_GOALS,
  TransitionDefinition,
} from '../../data/transitions';
import { TransitionStageRenderer } from '../../engine/transitionEngine';
import { useStudioStore } from '../../store/useStudioStore';
import { SlideTransition } from '../../types/presentation';
import { MorphDeepDive } from './MorphDeepDive';

type LabMode = 'explorer' | 'compare' | 'helper' | 'morph';
type SourceMode = 'sample' | 'deck';
type MobilePane = 'stage' | 'library' | 'inspector';

const CATEGORY_ORDER: Array<{ id: SlideTransition['category']; label: string; blurb: string }> = [
  { id: 'subtle', label: 'Subtle', blurb: 'Calm, disciplined transitions for everyday storytelling' },
  { id: 'exciting', label: 'Exciting', blurb: 'Bold 3D, tactile paper and geometric reveals' },
  { id: 'dynamic', label: 'Dynamic Content', blurb: 'Spatial continuity, Morph and camera depth' },
];

const EASING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ease-in-out', label: 'Ease In Out (Natural)' },
  { value: 'ease-out', label: 'Ease Out (Snappy)' },
  { value: 'spring', label: 'Spring (Elastic)' },
  { value: 'dramatic', label: 'Dramatic (Quartic)' },
  { value: 'linear', label: 'Linear (Mechanical)' },
];

export const TransitionsLab: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const settings = useStudioStore((s) => s.settings);
  const panels = settings.panels;
  const updateSlideTransition = useStudioStore((s) => s.updateSlideTransition);
  const duplicateSlide = useStudioStore((s) => s.duplicateSlide);

  const activeDeckSlide = project.slides.find((s) => s.id === activeSlideId) ?? project.slides[0];
  const initialDef =
    TRANSITION_DEFINITIONS.find((t) => t.id === activeDeckSlide?.transition.type) ?? TRANSITION_DEFINITIONS[0];

  const [labMode, setLabMode] = useState<LabMode>('explorer');
  const [sourceMode, setSourceMode] = useState<SourceMode>('sample');
  const [mobilePane, setMobilePane] = useState<MobilePane>('stage');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SlideTransition['category']>('all');

  // Deck pair indices (when sourceMode === 'deck')
  const [deckIndexA, setDeckIndexA] = useState(0);
  const [deckIndexB, setDeckIndexB] = useState(Math.min(1, Math.max(0, project.slides.length - 1)));

  // Active transition inspector state
  const [selectedId, setSelectedId] = useState<string>(initialDef.id);
  const [direction, setDirection] = useState<string>(
    activeDeckSlide?.transition.direction ?? initialDef.defaultDirection ?? 'left',
  );
  const [duration, setDuration] = useState<number>(
    activeDeckSlide?.transition.duration ?? initialDef.defaultDuration,
  );
  const [easing, setEasing] = useState<string>(activeDeckSlide?.transition.easing ?? 'ease-in-out');
  const [morphMode, setMorphMode] = useState<'objects' | 'words' | 'characters'>(
    activeDeckSlide?.transition.morphMode ?? 'objects',
  );

  // Compare mode secondary transition
  const [compareRightId, setCompareRightId] = useState<string>('morph');
  const [compareRightDirection, setCompareRightDirection] = useState<string>('left');

  // Helper mode state
  const [selectedGoalId, setSelectedGoalId] = useState<string>(TRANSITION_GOALS[0].id);

  // Playback state
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [speed, setSpeed] = useState<0.25 | 0.5 | 1>(1);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  // Stage sizing
  const explorerStageRef = useRef<HTMLDivElement>(null);
  const compareStageRef = useRef<HTMLDivElement>(null);
  const [explorerWidth, setExplorerWidth] = useState(640);
  const [compareWidth, setCompareWidth] = useState(640);

  useEffect(() => {
    const el = explorerStageRef.current;
    if (!el) return;
    const update = () => setExplorerWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [labMode, mobilePane]);

  useEffect(() => {
    const el = compareStageRef.current;
    if (!el) return;
    const update = () => setCompareWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [labMode]);

  // Keep deck indices valid if slides are added/deleted
  useEffect(() => {
    if (project.slides.length <= 1) {
      setDeckIndexA(0);
      setDeckIndexB(0);
    } else {
      setDeckIndexA((prev) => Math.min(prev, project.slides.length - 1));
      setDeckIndexB((prev) => {
        const clamped = Math.min(prev, project.slides.length - 1);
        return clamped === deckIndexA ? (deckIndexA + 1) % project.slides.length : clamped;
      });
    }
  }, [project.slides.length, deckIndexA]);

  const activeDef: TransitionDefinition =
    TRANSITION_DEFINITIONS.find((t) => t.id === selectedId) ?? TRANSITION_DEFINITIONS[0];
  const compareRightDef: TransitionDefinition =
    TRANSITION_DEFINITIONS.find((t) => t.id === compareRightId) ?? TRANSITION_DEFINITIONS[0];

  const selectTransition = (def: TransitionDefinition, autoPlay = true) => {
    setSelectedId(def.id);
    setDirection(def.defaultDirection ?? 'left');
    setDuration(def.defaultDuration);
    setProgress(0);
    setIsPlaying(autoPlay);
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let last = performance.now();
    const effectiveDuration = Math.max(0.2, duration);

    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setProgress((prev) => {
        const next = prev + dt / effectiveDuration;
        if (next >= 1) {
          if (loop) {
            return 0;
          }
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [duration, isPlaying, loop, speed]);

  const samplePair = useMemo(() => createSampleTransitionPair(), []);

  const activePair = useMemo(() => {
    if (sourceMode === 'deck' && project.slides.length >= 2) {
      const sA = project.slides[deckIndexA] ?? project.slides[0];
      const sB = project.slides[deckIndexB] ?? project.slides[1] ?? project.slides[0];
      return { slideA: sA, slideB: sB, master: project.master };
    }
    return { slideA: samplePair.slideA, slideB: samplePair.slideB, master: undefined };
  }, [deckIndexA, deckIndexB, project.master, project.slides, samplePair, sourceMode]);

  const dims = STAGE_DIMENSIONS[project.aspectRatio];
  const explorerScale = Math.min(0.46, Math.max(0.16, (explorerWidth - 36) / dims.width));
  const compareSingleWidth = Math.max(240, (compareWidth - 48) / (compareWidth >= 780 ? 2 : 1));
  const compareScale = Math.min(0.36, Math.max(0.14, (compareSingleWidth - 24) / dims.width));

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (progress >= 0.99) setProgress(0);
      setIsPlaying(true);
    }
  };

  const handleApplyToSlide = (applyAll = false) => {
    const payload: SlideTransition = {
      type: activeDef.id,
      category: activeDef.category,
      direction: activeDef.directions ? direction : undefined,
      duration,
      easing,
      ...(activeDef.id === 'morph' ? { morphMode } : {}),
    };
    if (applyAll) {
      project.slides.forEach((s) => updateSlideTransition(s.id, payload));
      setAppliedBanner(`Applied ${activeDef.name} to all ${project.slides.length} slides`);
    } else if (activeDeckSlide) {
      const targetSlide =
        sourceMode === 'deck' && project.slides[deckIndexB] ? project.slides[deckIndexB] : activeDeckSlide;
      updateSlideTransition(targetSlide.id, payload);
      setAppliedBanner(`Applied ${activeDef.name} to "${targetSlide.title}"`);
    }
    window.setTimeout(() => setAppliedBanner(null), 2600);
  };

  const activeGoal = TRANSITION_GOALS.find((g) => g.id === selectedGoalId) ?? TRANSITION_GOALS[0];

  const renderPlaybackBar = () => (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handlePlayToggle}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3.5 font-semibold text-[var(--accent-contrast)]"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
          title="Reset to Slide A (0%)"
          aria-label="Reset transition to start"
          className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setLoop((l) => !l)}
          title="Loop transition"
          aria-pressed={loop}
          className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg border px-2.5 font-medium ${
            loop
              ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
          }`}
        >
          <Repeat className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Loop</span>
        </button>

        <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-0.5">
          {([0.25, 0.5, 1] as const).map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className={`min-h-[32px] rounded-md px-2 font-mono-tabular text-[11px] font-medium ${
                speed === sp
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {sp}×
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-w-[170px] items-center gap-2">
        <span className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap">Slide A</span>
        <input
          type="range"
          aria-label="Transition timeline scrubber"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(e) => {
            setIsPlaying(false);
            setProgress(Number(e.target.value));
          }}
          className="flex-1 accent-[var(--accent-500)]"
        />
        <span className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap">Slide B</span>
        <span className="font-mono-tabular w-10 text-right text-[11px] font-semibold text-[var(--text-primary)]">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );

  const renderSourceSelector = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-0.5">
        <button
          type="button"
          onClick={() => {
            setSourceMode('sample');
            setProgress(0);
          }}
          className={`min-h-[32px] rounded-md px-2.5 font-medium whitespace-nowrap ${
            sourceMode === 'sample'
              ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          Sample Slides (A → B)
        </button>
        <button
          type="button"
          onClick={() => {
            setSourceMode('deck');
            setProgress(0);
          }}
          className={`min-h-[32px] rounded-md px-2.5 font-medium whitespace-nowrap ${
            sourceMode === 'deck'
              ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          My Deck Slides ({project.slides.length})
        </button>
      </div>

      {sourceMode === 'deck' && (
        <div className="flex flex-wrap items-center gap-2">
          {project.slides.length < 2 ? (
            <button
              type="button"
              onClick={() => duplicateSlide(project.slides[0].id)}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--accent-500)] bg-[var(--accent-soft)] px-2.5 text-xs font-medium text-[var(--accent-500)]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate Slide 1 to Test A → B</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Outgoing Slide A"
                value={deckIndexA}
                onChange={(e) => {
                  setDeckIndexA(Number(e.target.value));
                  setProgress(0);
                }}
                className="min-h-[34px] max-w-[150px] truncate rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-2 text-xs outline-none"
              >
                {project.slides.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {idx + 1}. {s.title}
                  </option>
                ))}
              </select>
              <ArrowLeftRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <select
                aria-label="Incoming Slide B"
                value={deckIndexB}
                onChange={(e) => {
                  setDeckIndexB(Number(e.target.value));
                  setProgress(0);
                }}
                className="min-h-[34px] max-w-[150px] truncate rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-2 text-xs outline-none"
              >
                {project.slides.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {idx + 1}. {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLibraryPanel = () => (
    <aside
      aria-label="Transitions Library"
      className="flex h-full min-h-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="border-b border-[var(--border-subtle)] p-3 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">
            All Transitions ({TRANSITION_DEFINITIONS.length})
          </h2>
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">3 groups</span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-[11px]">
          {(
            [
              ['all', 'All'],
              ['subtle', 'Subtle'],
              ['exciting', 'Exciting'],
              ['dynamic', 'Dynamic'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategoryFilter(id)}
              className={`min-h-[32px] rounded-lg border font-medium ${
                categoryFilter === id
                  ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORY_ORDER.filter((c) => categoryFilter === 'all' || c.id === categoryFilter).map((group) => {
          const items = TRANSITION_DEFINITIONS.filter((t) => t.category === group.id);
          return (
            <section key={group.id} className="space-y-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {group.label} · {items.length}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">{group.blurb}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((def) => {
                  const selected = def.id === activeDef.id;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => {
                        selectTransition(def, true);
                        setMobilePane('stage');
                      }}
                      className={`flex min-h-[42px] items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                        selected
                          ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="truncate">{def.name}</span>
                      {def.flashes && (
                        <AlertTriangle
                          aria-label="Contains gentle flash"
                          className="h-3 w-3 shrink-0 text-amber-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );

  const renderInspectorPanel = () => (
    <aside
      aria-label="Transition Options and Explanation"
      className="flex h-full min-h-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="studio-scroll flex-1 overflow-y-auto p-4 space-y-5">
        {/* Flash & Motion Accessibility Guards */}
        {activeDef.flashes && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="space-y-0.5">
              <div className="font-semibold text-amber-100">Flashing Light Advisory</div>
              <p className="leading-relaxed text-amber-200/90">
                Flash briefly brightens the stage once per slide change (safely below 3 flashes/sec). Avoid in dark rooms or for photosensitive viewers.
              </p>
            </div>
          </div>
        )}

        {settings.reduceMotion && (
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Reduce Motion is active:</strong> Transitions gently cross-fade instead of sliding or rotating in 3D.
          </div>
        )}

        {/* Controls Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              {activeDef.name} Options
            </h3>
            <span className="text-[11px] font-medium capitalize text-[var(--accent-500)]">
              {activeDef.category}
            </span>
          </div>

          {activeDef.directions && activeDef.directions.length > 0 && (
            <label className="block space-y-1 text-xs">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">Direction / Effect</span>
              <select
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value);
                  setProgress(0);
                  setIsPlaying(true);
                }}
                className="w-full min-h-[38px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
              >
                {activeDef.directions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {activeDef.id === 'morph' && (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold text-[var(--text-muted)]">Morph Matching Mode</span>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(
                  [
                    ['objects', 'Objects'],
                    ['words', 'Words'],
                    ['characters', 'Characters'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setMorphMode(mode);
                      setProgress(0);
                      setIsPlaying(true);
                    }}
                    className={`min-h-[36px] rounded-lg border font-medium ${
                      morphMode === mode
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLabMode('morph')}
                className="inline-flex w-full min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] text-[11px] font-semibold text-[var(--accent-500)] hover:border-[var(--accent-500)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Open Morph Deep-Dive & 8 Scenarios</span>
              </button>
            </div>
          )}

          <label className="block space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-[var(--text-muted)]">Duration</span>
              <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                {duration.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2.5}
              step={0.05}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-[var(--accent-500)]"
            />
          </label>

          <label className="block space-y-1 text-xs">
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">Easing Curve</span>
            <select
              value={easing}
              onChange={(e) => {
                setEasing(e.target.value);
                setProgress(0);
                setIsPlaying(true);
              }}
              className="w-full min-h-[38px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
            >
              {EASING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Apply to Deck */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleApplyToSlide(false)}
              className="min-h-[40px] rounded-lg bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)] hover:opacity-95"
            >
              Apply to Slide
            </button>
            <button
              type="button"
              onClick={() => handleApplyToSlide(true)}
              className="min-h-[40px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
            >
              Apply to All
            </button>
          </div>
          {appliedBanner && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>{appliedBanner}</span>
            </div>
          )}
        </section>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Explain It Card (Zero-Pill discipline: clean unboxed typography) */}
        <section aria-label="Explain this transition" className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Explain It · {activeDef.name}
            </h3>
            <p className="text-[11px] font-medium capitalize text-[var(--accent-500)]">
              Mood: {activeDef.mood} · Audience: {activeDef.audience}
            </p>
          </div>

          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                What it does
              </div>
              <p className="text-[var(--text-primary)]">{activeDef.whatItDoes}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                When to use it
              </div>
              <p className="text-[var(--text-secondary)]">{activeDef.whenToUse}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-400">
                When to avoid it
              </div>
              <p className="text-[var(--text-secondary)]">{activeDef.whenToAvoid}</p>
            </div>

            <div className="rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-soft)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-500)]">
                Pro Tip
              </div>
              <p className="text-[var(--text-primary)]">{activeDef.proTip}</p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Top Mode & Source Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 sm:px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['explorer', 'Transitions Explorer', Wand2],
              ['compare', 'Compare Side-by-Side', Columns2],
              ['helper', 'Which Transition Should I Use?', Compass],
              ['morph', 'Morph Deep-Dive', Sparkles],
            ] as const
          ).map(([id, label, Icon]) => {
            const active = labMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setLabMode(id);
                  setIsPlaying(false);
                  setProgress(0);
                }}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                    : 'bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(labMode === 'explorer' || labMode === 'compare') && renderSourceSelector()}
          {labMode === 'explorer' && <LabPanelToggles leftLabel="Library" rightLabel="Explain" />}
        </div>
      </div>

      {/* Mode 1: EXPLORER */}
      {labMode === 'explorer' && (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {/* Mobile / Tablet Pane Switcher */}
          <div className="lg:hidden grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
            {(
              [
                ['stage', 'Live Preview'],
                ['library', `Library (${TRANSITION_DEFINITIONS.length})`],
                ['inspector', 'Explain & Options'],
              ] as const
            ).map(([pane, label]) => (
              <button
                key={pane}
                type="button"
                onClick={() => setMobilePane(pane)}
                className={`min-h-[42px] text-xs font-semibold border-b-2 ${
                  mobilePane === pane
                    ? 'border-[var(--accent-500)] text-[var(--accent-500)]'
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className={`flex-1 min-h-0 grid grid-cols-1 overflow-hidden ${
              panels.labLeft && panels.labRight
                ? 'lg:grid-cols-[265px_1fr_325px]'
                : panels.labLeft
                  ? 'lg:grid-cols-[265px_1fr]'
                  : panels.labRight
                    ? 'lg:grid-cols-[1fr_325px]'
                    : 'lg:grid-cols-[1fr]'
            }`}
          >
            {/* Left: Library */}
            <div
              className={`min-h-0 overflow-hidden ${
                mobilePane === 'library'
                  ? panels.labLeft
                    ? 'block'
                    : 'block lg:hidden'
                  : panels.labLeft
                    ? 'hidden lg:block'
                    : 'hidden'
              }`}
            >
              {renderLibraryPanel()}
            </div>

            {/* Centre: Live Stage */}
            <main
              ref={explorerStageRef}
              className={`min-h-0 flex-col justify-between overflow-y-auto bg-[var(--bg-canvas-well)] p-3 sm:p-5 ${
                mobilePane === 'stage' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4">
                <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <h1 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {activeDef.name}
                    </h1>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {activePair.slideA.title} → {activePair.slideB.title}
                    </p>
                  </div>
                  <div className="font-mono-tabular text-[11px] text-[var(--text-secondary)]">
                    {duration.toFixed(2)}s · {easing}
                  </div>
                </div>

                <TransitionStageRenderer
                  slideA={activePair.slideA}
                  slideB={activePair.slideB}
                  aspectRatio={project.aspectRatio}
                  master={activePair.master}
                  transitionType={activeDef.id}
                  direction={direction}
                  easing={easing}
                  morphMode={morphMode}
                  progress={progress}
                  scale={explorerScale}
                  reduceMotion={settings.reduceMotion}
                />

                {renderPlaybackBar()}
              </div>
            </main>

            {/* Right: Inspector & Explain It */}
            <div
              className={`min-h-0 overflow-hidden ${
                mobilePane === 'inspector'
                  ? panels.labRight
                    ? 'block'
                    : 'block lg:hidden'
                  : panels.labRight
                    ? 'hidden lg:block'
                    : 'hidden'
              }`}
            >
              {renderInspectorPanel()}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: COMPARE SIDE-BY-SIDE */}
      {labMode === 'compare' && (
        <div ref={compareStageRef} className="studio-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-4">
            {renderPlaybackBar()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Compare Card */}
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <select
                    aria-label="Left transition to compare"
                    value={activeDef.id}
                    onChange={(e) => {
                      const found = TRANSITION_DEFINITIONS.find((t) => t.id === e.target.value);
                      if (found) selectTransition(found, false);
                    }}
                    className="min-h-[36px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs font-semibold outline-none"
                  >
                    {TRANSITION_DEFINITIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] capitalize text-[var(--accent-500)]">
                    Mood: {activeDef.mood}
                  </span>
                </div>

                <TransitionStageRenderer
                  slideA={activePair.slideA}
                  slideB={activePair.slideB}
                  aspectRatio={project.aspectRatio}
                  master={activePair.master}
                  transitionType={activeDef.id}
                  direction={direction}
                  easing={easing}
                  morphMode={morphMode}
                  progress={progress}
                  scale={compareScale}
                  reduceMotion={settings.reduceMotion}
                />

                <p className="w-full text-xs leading-relaxed text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Best for:</strong> {activeDef.whenToUse}
                </p>
              </div>

              {/* Right Compare Card */}
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <select
                    aria-label="Right transition to compare"
                    value={compareRightDef.id}
                    onChange={(e) => {
                      const found = TRANSITION_DEFINITIONS.find((t) => t.id === e.target.value);
                      if (found) {
                        setCompareRightId(found.id);
                        setCompareRightDirection(found.defaultDirection ?? 'left');
                      }
                    }}
                    className="min-h-[36px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs font-semibold outline-none"
                  >
                    {TRANSITION_DEFINITIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] capitalize text-[var(--accent-500)]">
                    Mood: {compareRightDef.mood}
                  </span>
                </div>

                <TransitionStageRenderer
                  slideA={activePair.slideA}
                  slideB={activePair.slideB}
                  aspectRatio={project.aspectRatio}
                  master={activePair.master}
                  transitionType={compareRightDef.id}
                  direction={compareRightDirection}
                  easing={easing}
                  morphMode={morphMode}
                  progress={progress}
                  scale={compareScale}
                  reduceMotion={settings.reduceMotion}
                />

                <p className="w-full text-xs leading-relaxed text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Best for:</strong> {compareRightDef.whenToUse}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: WHICH TRANSITION SHOULD I USE? HELPER */}
      {labMode === 'helper' && (
        <div className="studio-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="space-y-1">
              <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Which Transition Should I Use?
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Choose the presentation moment you are designing next to see disciplined transition recommendations and why they work.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRANSITION_GOALS.map((goal) => {
                const selected = goal.id === activeGoal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selected
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{goal.label}</div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{goal.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-500)]">
                  Recommended for: {activeGoal.label}
                </div>
                <p className="text-sm text-[var(--text-primary)]">{activeGoal.reason}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeGoal.recommendedIds.map((id) => {
                  const def = TRANSITION_DEFINITIONS.find((t) => t.id === id);
                  if (!def) return null;
                  return (
                    <div
                      key={def.id}
                      className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-4 space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">{def.name}</h3>
                          <span className="text-[11px] capitalize text-[var(--accent-500)]">{def.mood}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{def.whatItDoes}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          <strong className="text-[var(--text-primary)]">Tip:</strong> {def.proTip}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            selectTransition(def, true);
                            setLabMode('explorer');
                            setMobilePane('stage');
                          }}
                          className="flex-1 min-h-[36px] rounded-lg bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)]"
                        >
                          Preview Live
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeDeckSlide) {
                              updateSlideTransition(activeDeckSlide.id, {
                                type: def.id,
                                category: def.category,
                                direction: def.defaultDirection,
                                duration: def.defaultDuration,
                                easing: 'ease-in-out',
                              });
                              setAppliedBanner(`Applied ${def.name} to "${activeDeckSlide.title}"`);
                              window.setTimeout(() => setAppliedBanner(null), 2600);
                            }
                          }}
                          className="min-h-[36px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                        >
                          <Layers className="inline h-3.5 w-3.5 mr-1" />
                          Apply
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {appliedBanner && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>{appliedBanner}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: MORPH DEEP-DIVE */}
      {labMode === 'morph' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <MorphDeepDive />
        </div>
      )}
    </div>
  );
};
