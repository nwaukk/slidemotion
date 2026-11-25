import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import {
  createSampleTransitionPair,
  MORPH_MISTAKES,
  MORPH_SCENARIOS,
} from '../../data/transitions';
import { STAGE_DIMENSIONS } from '../../data/themes';
import { analyseMorphMatches } from '../../engine/morphEngine';
import { SlideSurface, TransitionStageRenderer } from '../../engine/transitionEngine';
import { useStudioStore } from '../../store/useStudioStore';
import { Slide } from '../../types/presentation';

type MorphSubTab = 'anatomy' | 'builder' | 'scenarios' | 'mistakes';

export const MorphDeepDive: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const settings = useStudioStore((s) => s.settings);
  const createMorphDuplicateSlide = useStudioStore((s) => s.createMorphDuplicateSlide);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const [subTab, setSubTab] = useState<MorphSubTab>('anatomy');
  const [morphMode, setMorphMode] = useState<'objects' | 'words' | 'characters'>('objects');
  const [selectedScenarioId, setSelectedScenarioId] = useState(MORPH_SCENARIOS[0].id);
  const [selectedMistakeId, setSelectedMistakeId] = useState(MORPH_MISTAKES[0].id);
  const [showFixedMistake, setShowFixedMistake] = useState(false);

  // Interactive Morph Builder state
  const defaultPair = useMemo(() => createSampleTransitionPair(), []);
  const [builderSlide1, setBuilderSlide1] = useState<Slide>(defaultPair.slideA);
  const [builderSlide2, setBuilderSlide2] = useState<Slide | null>(null);
  const [selectedBuilderElId, setSelectedBuilderElId] = useState<string>(defaultPair.slideA.elements[0]?.id ?? '');

  // Playback state
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.25 | 0.5 | 1>(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(640);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [subTab]);

  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let last = performance.now();
    const duration = 1.05;

    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setProgress((prev) => {
        const next = prev + dt / duration;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed]);

  const activeScenario = MORPH_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? MORPH_SCENARIOS[0];
  const activeMistake = MORPH_MISTAKES.find((m) => m.id === selectedMistakeId) ?? MORPH_MISTAKES[0];

  const currentPair: { slideA: Slide; slideB: Slide; activeMorphMode: 'objects' | 'words' | 'characters' } = useMemo(() => {
    if (subTab === 'scenarios') {
      return {
        slideA: activeScenario.slideA,
        slideB: activeScenario.slideB,
        activeMorphMode: activeScenario.morphMode,
      };
    }
    if (subTab === 'mistakes') {
      const pair = showFixedMistake ? activeMistake.fixedPair : activeMistake.brokenPair;
      return { slideA: pair.slideA, slideB: pair.slideB, activeMorphMode: 'objects' };
    }
    if (subTab === 'builder' && builderSlide2) {
      return { slideA: builderSlide1, slideB: builderSlide2, activeMorphMode: morphMode };
    }
    if (morphMode !== 'objects') {
      // Show kinetic text scenario when testing Words / Characters in Anatomy tab
      const textScenario = MORPH_SCENARIOS.find((s) => s.id === 'text-rearrange')!;
      return {
        slideA: textScenario.slideA,
        slideB: textScenario.slideB,
        activeMorphMode: morphMode,
      };
    }
    return {
      slideA: defaultPair.slideA,
      slideB: defaultPair.slideB,
      activeMorphMode: morphMode,
    };
  }, [activeMistake, activeScenario, builderSlide1, builderSlide2, defaultPair, morphMode, showFixedMistake, subTab]);

  const analysis = useMemo(
    () => analyseMorphMatches(currentPair.slideA, currentPair.slideB),
    [currentPair.slideA, currentPair.slideB],
  );

  const dims = STAGE_DIMENSIONS[project.aspectRatio];
  const stageScale = Math.min(0.45, Math.max(0.16, (previewWidth - 28) / dims.width));
  const thumbScale = 160 / dims.width;

  const runMorph = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  const handleDuplicateInBuilder = () => {
    const cloned: Slide = JSON.parse(JSON.stringify(builderSlide1)) as Slide;
    cloned.id = `builder-s2-${Date.now()}`;
    cloned.title = `${builderSlide1.title} (Morph Copy)`;
    // Nudge first element slightly so user immediately sees it is editable
    if (cloned.elements[0]) {
      cloned.elements[0].x = Math.max(80, cloned.elements[0].x - 320);
      cloned.elements[0].y = Math.max(80, cloned.elements[0].y + 80);
      cloned.elements[0].rotation = 25;
      setSelectedBuilderElId(cloned.elements[0].id);
    }
    setBuilderSlide2(cloned);
    setProgress(0);
  };

  const updateBuilderSlide2Element = (elId: string, patch: Partial<Slide['elements'][number]>) => {
    if (!builderSlide2) return;
    setBuilderSlide2({
      ...builderSlide2,
      elements: builderSlide2.elements.map((el) => (el.id === elId ? { ...el, ...patch } : el)),
    });
  };

  const activeDeckSlide = project.slides.find((s) => s.id === activeSlideId) ?? project.slides[0];
  const selectedBuilderEl = builderSlide2?.elements.find((e) => e.id === selectedBuilderElId) ?? builderSlide2?.elements[0];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['anatomy', 'How Morph Matches (!!)'],
              ['builder', 'Build Your Own Morph'],
              ['scenarios', '8 Best-Case Scenarios'],
              ['mistakes', 'Mistakes & Fixes'],
            ] as Array<[MorphSubTab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSubTab(id);
                setProgress(0);
                setIsPlaying(false);
              }}
              className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === id
                  ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                  : 'bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Morph Mode Picker */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-0.5 text-[11px]">
          {(
            [
              ['objects', 'By Objects'],
              ['words', 'By Words'],
              ['characters', 'By Characters'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setMorphMode(mode);
                runMorph();
              }}
              className={`rounded-md px-2.5 py-1 font-medium whitespace-nowrap ${
                morphMode === mode
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="studio-scroll flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
          {/* Left: Live Morph Stage + Controls */}
          <div ref={previewContainerRef} className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas-well)] p-4">
              <TransitionStageRenderer
                slideA={currentPair.slideA}
                slideB={currentPair.slideB}
                aspectRatio={project.aspectRatio}
                transitionType="morph"
                easing="ease-in-out"
                morphMode={currentPair.activeMorphMode}
                progress={progress}
                scale={stageScale}
                reduceMotion={settings.reduceMotion}
              />

              {/* Scrubber & Playback Controls */}
              <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) setIsPlaying(false);
                      else runMorph();
                    }}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3 font-semibold text-[var(--accent-contrast)]"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Run Morph'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setProgress(0);
                    }}
                    aria-label="Reset Morph"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  {([0.25, 0.5, 1] as const).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpeed(sp)}
                      className={`min-h-[32px] rounded-md px-2 font-mono-tabular text-[11px] ${
                        speed === sp
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-500)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {sp}×
                    </button>
                  ))}
                </div>

                <div className="flex flex-1 min-w-[160px] items-center gap-2">
                  <input
                    type="range"
                    aria-label="Morph progress scrubber"
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
                  <span className="font-mono-tabular w-10 text-right text-[11px] text-[var(--text-secondary)]">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Matched Pairs Visual Connecting Lines Diagram */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">
                  Object Matching Visualiser · Slide A ↔ Slide B
                </h3>
                <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                  {analysis.matched.length} matched · {analysis.unmatchedOut.length + analysis.unmatchedIn.length} fading
                </span>
              </div>

              <div className="grid grid-cols-[1fr_64px_1fr] items-center gap-2">
                {/* Slide A Thumbnail */}
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">Slide A (Before)</span>
                  <div
                    className="overflow-hidden rounded border border-black/30"
                    style={{ width: 160, height: Math.round(dims.height * thumbScale) }}
                  >
                    <div style={{ transform: `scale(${thumbScale})`, transformOrigin: 'top left' }}>
                      <SlideSurface slide={currentPair.slideA} width={dims.width} height={dims.height} />
                    </div>
                  </div>
                </div>

                {/* Connecting Lines SVG */}
                <svg viewBox="0 0 64 90" className="h-20 w-full">
                  {analysis.matched.map((m, idx) => {
                    const y = 18 + idx * 20;
                    return (
                      <g key={m.from.id}>
                        <line
                          x1="2"
                          y1={y}
                          x2="62"
                          y2={y}
                          stroke={m.matchType === 'bang' ? '#38bdf8' : '#10b981'}
                          strokeWidth="2.5"
                          strokeDasharray={m.matchType === 'bang' ? undefined : '4 3'}
                        />
                        <circle cx="4" cy={y} r="3" fill="#38bdf8" />
                        <circle cx="60" cy={y} r="3" fill="#10b981" />
                      </g>
                    );
                  })}
                  {analysis.matched.length === 0 && (
                    <text x="32" y="48" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="600">
                      0 matches
                    </text>
                  )}
                </svg>

                {/* Slide B Thumbnail */}
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">Slide B (After)</span>
                  <div
                    className="overflow-hidden rounded border border-black/30"
                    style={{ width: 160, height: Math.round(dims.height * thumbScale) }}
                  >
                    <div style={{ transform: `scale(${thumbScale})`, transformOrigin: 'top left' }}>
                      <SlideSurface slide={currentPair.slideB} width={dims.width} height={dims.height} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explicit Pair List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                {analysis.matched.map((pair) => (
                  <div
                    key={pair.from.id}
                    className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5"
                  >
                    <span className="font-mono-tabular font-semibold text-emerald-300">{pair.from.name}</span>
                    <span className="text-emerald-200/80">
                      {pair.matchType === 'bang' ? 'Matched via !!' : 'Matched by name'}
                    </span>
                  </div>
                ))}
                {analysis.unmatchedOut.map((el) => (
                  <div
                    key={`uo-${el.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-[var(--text-muted)]"
                  >
                    <span className="truncate">{el.name}</span>
                    <span>Fades out</span>
                  </div>
                ))}
                {analysis.unmatchedIn.map((el) => (
                  <div
                    key={`ui-${el.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-[var(--text-muted)]"
                  >
                    <span className="truncate">{el.name}</span>
                    <span>Fades in</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sub-tab Interactive Panel */}
          <div className="space-y-4">
            {subTab === 'anatomy' && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4">
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  How Morph Works in Three Steps
                </h3>
                <ol className="space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <li>
                    <strong className="text-[var(--text-primary)]">1. Duplicate Slide 1:</strong> Start with a slide containing your focal shapes, cards or titles, then duplicate it so Slide 2 shares the same object identities.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">2. Transform Slide 2:</strong> Move, resize, rotate or recolour those objects on the copy. Unmatched items automatically fade in or out.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">3. Use the !!Name Trick:</strong> In the Layers panel, start a layer’s name with two exclamation marks (such as{' '}
                    <code className="font-mono-tabular text-[var(--accent-500)]">!!HeroOrb</code>). Morph will pair objects with identical <code className="font-mono-tabular">!!</code> names even if you swap a shape or rewrite its text.
                  </li>
                </ol>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3.5 space-y-2 text-xs">
                  <div className="font-semibold text-[var(--text-primary)]">Morph Modes Explained</div>
                  <p className="text-[var(--text-secondary)]">
                    <strong>By Objects:</strong> Smoothly interpolates bounding boxes, rotation, corner radius and colours.
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    <strong>By Words:</strong> Moves matching words between Slide A and Slide B while fading new words.
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    <strong>By Characters:</strong> Flies individual shared letters to their new positions (try the By Characters toggle above!).
                  </p>
                </div>
              </div>
            )}

            {subTab === 'builder' && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4">
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Build Your Own Morph
                </h3>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)]">
                    Step 1 · Pick Starting Slide
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBuilderSlide1(defaultPair.slideA);
                        setBuilderSlide2(null);
                      }}
                      className="flex-1 min-h-[36px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium hover:border-[var(--accent-500)]"
                    >
                      Use Sample Slide A
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuilderSlide1(JSON.parse(JSON.stringify(activeDeckSlide)) as Slide);
                        setBuilderSlide2(null);
                      }}
                      className="flex-1 min-h-[36px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium hover:border-[var(--accent-500)]"
                    >
                      Use "{activeDeckSlide?.title}"
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDuplicateInBuilder}
                  className="flex w-full min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[var(--accent-600)] px-4 text-xs font-semibold text-[var(--accent-contrast)]"
                >
                  <Copy className="h-4 w-4" />
                  <span>{builderSlide2 ? 'Reset Slide 2 Duplicate' : 'Step 2 · Create Duplicate Slide 2'}</span>
                </button>

                {builderSlide2 && selectedBuilderEl && (
                  <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        Step 3 · Edit Object on Slide 2
                      </span>
                      <select
                        value={selectedBuilderEl.id}
                        onChange={(e) => setSelectedBuilderElId(e.target.value)}
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-2 py-1 text-xs outline-none"
                      >
                        {builderSlide2.elements.map((el) => (
                          <option key={el.id} value={el.id}>
                            {el.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="block space-y-1">
                        <span className="text-[11px] text-[var(--text-muted)]">X ({Math.round(selectedBuilderEl.x)})</span>
                        <input
                          type="range"
                          min={0}
                          max={dims.width - 100}
                          value={selectedBuilderEl.x}
                          onChange={(e) => updateBuilderSlide2Element(selectedBuilderEl.id, { x: Number(e.target.value) })}
                          className="w-full accent-[var(--accent-500)]"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] text-[var(--text-muted)]">Y ({Math.round(selectedBuilderEl.y)})</span>
                        <input
                          type="range"
                          min={0}
                          max={dims.height - 100}
                          value={selectedBuilderEl.y}
                          onChange={(e) => updateBuilderSlide2Element(selectedBuilderEl.id, { y: Number(e.target.value) })}
                          className="w-full accent-[var(--accent-500)]"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] text-[var(--text-muted)]">Width ({Math.round(selectedBuilderEl.w)})</span>
                        <input
                          type="range"
                          min={80}
                          max={1400}
                          value={selectedBuilderEl.w}
                          onChange={(e) => updateBuilderSlide2Element(selectedBuilderEl.id, { w: Number(e.target.value) })}
                          className="w-full accent-[var(--accent-500)]"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] text-[var(--text-muted)]">Rotation ({Math.round(selectedBuilderEl.rotation)}°)</span>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={selectedBuilderEl.rotation}
                          onChange={(e) => updateBuilderSlide2Element(selectedBuilderEl.id, { rotation: Number(e.target.value) })}
                          className="w-full accent-[var(--accent-500)]"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Slide 2 Fill Colour</span>
                      <input
                        type="color"
                        value={selectedBuilderEl.style.fill.colour}
                        onChange={(e) =>
                          updateBuilderSlide2Element(selectedBuilderEl.id, {
                            style: {
                              ...selectedBuilderEl.style,
                              fill: {
                                ...selectedBuilderEl.style.fill,
                                mode: 'solid',
                                colour: e.target.value,
                              },
                            },
                          })
                        }
                        className="h-7 w-10 cursor-pointer bg-transparent"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={runMorph}
                      className="flex w-full min-h-[38px] items-center justify-center gap-2 rounded-lg border border-[var(--accent-500)] bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-500)]"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Step 4 · Run Morph</span>
                    </button>
                  </div>
                )}

                <div className="border-t border-[var(--border-subtle)] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      createMorphDuplicateSlide(activeDeckSlide.id);
                      setActiveModule('designer');
                    }}
                    className="flex w-full min-h-[38px] items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Duplicate "{activeDeckSlide.title}" with Morph in Designer</span>
                  </button>
                </div>
              </div>
            )}

            {subTab === 'scenarios' && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-2.5">
                <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                  8 Best-Case Morph Scenarios
                </h3>
                <div className="space-y-2">
                  {MORPH_SCENARIOS.map((sc) => {
                    const active = sc.id === selectedScenarioId;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          setSelectedScenarioId(sc.id);
                          setProgress(0);
                          setIsPlaying(true);
                        }}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          active
                            ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-[var(--text-primary)]">{sc.title}</div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{sc.subtitle}</div>
                        {active && (
                          <p className="mt-2 border-t border-[var(--border-subtle)] pt-1.5 text-[11px] text-[var(--accent-500)]">
                            {sc.lessonNote}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {subTab === 'mistakes' && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-3">
                <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                  Common Morph Mistakes & How to Fix Them
                </h3>

                <div className="space-y-2">
                  {MORPH_MISTAKES.map((mk) => (
                    <button
                      key={mk.id}
                      type="button"
                      onClick={() => {
                        setSelectedMistakeId(mk.id);
                        setShowFixedMistake(false);
                        runMorph();
                      }}
                      className={`w-full rounded-xl border p-3 text-left text-xs font-medium ${
                        selectedMistakeId === mk.id
                          ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                      }`}
                    >
                      {mk.title}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFixedMistake(false);
                      runMorph();
                    }}
                    className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold ${
                      !showFixedMistake
                        ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Broken Version</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFixedMistake(true);
                      runMorph();
                    }}
                    className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold ${
                      showFixedMistake
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Fixed Version</span>
                  </button>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 text-xs leading-relaxed">
                  {showFixedMistake ? (
                    <p className="text-emerald-200">{activeMistake.fixSummary}</p>
                  ) : (
                    <p className="text-rose-200">{activeMistake.mistakeSummary}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
