import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { AnimatedElementWrapper } from '../../components/AnimatedElementWrapper';
import { LabPanelToggles } from '../../components/LabPanelToggles';
import { CHOREOGRAPHY_PRESETS, ChoreographyPreset } from '../../data/choreography';
import { STAGE_DIMENSIONS } from '../../data/themes';
import { buildSlideTimeline } from '../../engine/animationEngine';
import { useStudioStore } from '../../store/useStudioStore';

type MobilePane = 'stage' | 'presets' | 'recipe';
type CategoryFilter = 'all' | ChoreographyPreset['category'];

export const ElementChoreographer: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const settings = useStudioStore((s) => s.settings);
  const panels = settings.panels;
  const applyRecipeToActiveSlide = useStudioStore((s) => s.applyRecipeToActiveSlide);
  const updateElement = useStudioStore((s) => s.updateElement);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const [selectedId, setSelectedId] = useState<string>(CHOREOGRAPHY_PRESETS[0].id);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [mobilePane, setMobilePane] = useState<MobilePane>('stage');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<0.25 | 0.5 | 1>(1);
  const [notice, setNotice] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(720);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobilePane]);

  const preset = CHOREOGRAPHY_PRESETS.find((p) => p.id === selectedId) ?? CHOREOGRAPHY_PRESETS[0];
  const dims = STAGE_DIMENSIONS['16:9'];
  const timeline = useMemo(() => buildSlideTimeline(preset.elements), [preset.elements]);
  const totalDur = Math.max(0.8, timeline.totalDuration + 0.25);

  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= totalDur) {
          setIsPlaying(false);
          return totalDur;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, totalDur]);

  const selectPreset = (p: ChoreographyPreset) => {
    setSelectedId(p.id);
    setCurrentTime(0);
    setIsPlaying(true);
    setMobilePane('stage');
  };

  const scale = Math.min(0.48, Math.max(0.16, (stageWidth - 36) / dims.width));
  const filteredPresets = CHOREOGRAPHY_PRESETS.filter(
    (p) => categoryFilter === 'all' || p.category === categoryFilter,
  );

  const handleInsertSceneToSlide = () => {
    applyRecipeToActiveSlide(preset.elements, false);
    setNotice(`Inserted "${preset.title}" scene onto your active slide`);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const handleApplyTimingToExistingSlide = () => {
    const activeSlide = project.slides.find((s) => s.id === activeSlideId);
    if (!activeSlide || activeSlide.elements.length === 0) {
      setNotice('Add at least 1 element to your active slide first.');
      window.setTimeout(() => setNotice(null), 2600);
      return;
    }

    activeSlide.elements.forEach((el, idx) => {
      const templateEl = preset.elements[idx % preset.elements.length];
      const baseAnim = templateEl.animations[0] ?? {
        category: 'entrance' as const,
        effect: 'float-in',
        options: { direction: 'up' },
        start: 'with-previous' as const,
        duration: 0.5,
        delay: idx * 0.16,
        repeat: 1,
        rewind: false,
      };
      updateElement(
        el.id,
        {
          animations: [
            {
              ...baseAnim,
              id: `ch-apply-${Date.now().toString(36)}-${idx}`,
              delay: Number((idx * 0.16).toFixed(2)),
              order: idx + 1,
            },
          ],
        },
        idx === 0,
      );
    });
    setNotice(`Applied ${preset.title} stagger pattern to ${activeSlide.elements.length} slide elements`);
    window.setTimeout(() => setNotice(null), 2800);
  };

  const renderPresetsList = () => (
    <aside
      aria-label="12 Choreography Presets"
      className="flex h-full min-h-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="border-b border-[var(--border-subtle)] p-3 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">
            12 Motion Presets
          </h2>
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
            {filteredPresets.length} shown
          </span>
        </div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {(['all', 'Stagger', 'Parallax', 'Emphasis', 'Storytelling'] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[30px] rounded-lg border px-2 font-medium capitalize ${
                categoryFilter === cat
                  ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3 space-y-2">
        {filteredPresets.map((p) => {
          const active = p.id === preset.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                active
                  ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {p.number}. {p.title}
                </span>
                <span className="font-mono-tabular text-[11px] text-[var(--accent-500)]">
                  {p.totalDuration}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                {p.category} · {p.recipeBreakdown.length} recipe steps
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );

  const renderRecipePanel = () => (
    <aside
      aria-label="Choreography Recipe Breakdown"
      className="flex h-full min-h-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="studio-scroll flex-1 overflow-y-auto p-4 space-y-5">
        <section className="space-y-2">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
              {preset.category} Choreography · {preset.totalDuration}
            </div>
            <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">{preset.title}</h3>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{preset.summary}</p>
          <div className="rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-soft)] p-3 text-xs leading-relaxed text-[var(--text-primary)]">
            <strong>Why It Works:</strong> {preset.whyItWorks}
          </div>
        </section>

        <section className="space-y-2.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Step-by-Step Recipe Breakdown
          </h4>
          <div className="space-y-2">
            {preset.recipeBreakdown.map((step) => (
              <div
                key={step.step}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {step.step}. {step.role}
                  </span>
                  <span className="font-mono-tabular text-[11px] font-semibold text-[var(--accent-500)]">
                    {step.effect}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-[11px] text-[var(--text-muted)]">
                  <span>{step.trigger}</span>
                  <span>·</span>
                  <span>Delay {step.delay}</span>
                  <span>·</span>
                  <span>Dur {step.duration}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">{step.rationale}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleInsertSceneToSlide}
            className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Insert Preset Scene onto Slide</span>
          </button>

          <button
            type="button"
            onClick={handleApplyTimingToExistingSlide}
            className="flex w-full min-h-[38px] items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
          >
            <Wand2 className="h-3.5 w-3.5 text-[var(--accent-500)]" />
            <span>Apply Stagger Timing to My Elements</span>
          </button>

          {notice && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                {notice}
              </span>
              <button
                type="button"
                onClick={() => setActiveModule('designer')}
                className="font-semibold underline"
              >
                View
              </button>
            </div>
          )}
        </section>
      </div>
    </aside>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-4 w-4 text-[var(--accent-500)]" />
          <span className="font-display font-bold text-[var(--text-primary)]">Element Choreographer</span>
          <span className="text-[var(--text-muted)]">· 12 Multi-Element Motion Recipes</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <LabPanelToggles leftLabel="Presets" rightLabel="Recipe" />
          <button
            type="button"
            onClick={handleInsertSceneToSlide}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3 font-semibold text-[var(--accent-contrast)]"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Use Preset on Slide</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher */}
      <div className="lg:hidden grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
        {(
          [
            ['stage', 'Live Stage'],
            ['presets', '12 Presets'],
            ['recipe', 'Recipe Breakdown'],
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

      {/* Main 3-Zone Workspace */}
      <div
        className={`flex-1 min-h-0 grid grid-cols-1 overflow-hidden ${
          panels.labLeft && panels.labRight
            ? 'lg:grid-cols-[270px_1fr_335px]'
            : panels.labLeft
              ? 'lg:grid-cols-[270px_1fr]'
              : panels.labRight
                ? 'lg:grid-cols-[1fr_335px]'
                : 'lg:grid-cols-[1fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${
            mobilePane === 'presets'
              ? panels.labLeft
                ? 'block'
                : 'block lg:hidden'
              : panels.labLeft
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {renderPresetsList()}
        </div>

        <main
          ref={stageRef}
          className={`min-h-0 flex-col justify-between overflow-y-auto bg-[var(--bg-canvas-well)] p-3 sm:p-5 ${
            mobilePane === 'stage' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4">
            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <h1 className="font-display text-base font-bold text-[var(--text-primary)]">
                  {preset.number}. {preset.title}
                </h1>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {preset.category} · {preset.elements.length} coordinated elements
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] text-[var(--text-secondary)]">
                <Clock className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                <span>
                  {currentTime.toFixed(2)}s / {totalDur.toFixed(2)}s
                </span>
              </div>
            </div>

            {/* 1920x1080 Choreography Stage */}
            <div
              className="relative shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/40"
              style={{ width: dims.width * scale, height: dims.height * scale }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  width: dims.width,
                  height: dims.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  background: 'linear-gradient(135deg, #0b1222, #172554)',
                }}
              >
                {preset.elements.map((el) => (
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
                      currentTime={currentTime}
                      isPlayingOrPreviewing={isPlaying || currentTime > 0}
                      reduceMotion={settings.reduceMotion}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Playback & Scrubber Bar */}
            <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                    } else {
                      if (currentTime >= totalDur - 0.02) setCurrentTime(0);
                      setIsPlaying(true);
                    }
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3.5 font-semibold text-[var(--accent-contrast)]"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play Recipe'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  aria-label="Reset choreography"
                  className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
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
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {sp}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 min-w-[160px] items-center gap-2">
                <input
                  type="range"
                  aria-label="Choreography timeline scrubber"
                  min={0}
                  max={totalDur}
                  step={0.02}
                  value={currentTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentTime(Number(e.target.value));
                  }}
                  className="flex-1 accent-[var(--accent-500)]"
                />
                <span className="font-mono-tabular w-12 text-right text-[11px] text-[var(--text-secondary)]">
                  {currentTime.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
        </main>

        <div
          className={`min-h-0 overflow-hidden ${
            mobilePane === 'recipe'
              ? panels.labRight
                ? 'block'
                : 'block lg:hidden'
              : panels.labRight
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {renderRecipePanel()}
        </div>
      </div>
    </div>
  );
};
