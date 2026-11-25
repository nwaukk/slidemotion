import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Eye,
  Play,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  Trash2,
  Type,
  Wand2,
} from 'lucide-react';
import { AnimatedElementWrapper } from '../../components/AnimatedElementWrapper';
import { ElementRenderer } from '../../components/ElementRenderer';
import { LabPanelToggles } from '../../components/LabPanelToggles';
import { GUIDED_BADGES, GUIDED_LESSONS, GuidedLesson, GuidedLessonStep } from '../../data/guidedLessons';
import { createDefaultStyle, STAGE_DIMENSIONS } from '../../data/themes';
import { buildSlideTimeline } from '../../engine/animationEngine';
import {
  DIFFICULTY_THRESHOLDS,
  getElementPrimaryColour,
  GuidedDifficulty,
  StepValidationReport,
  validateStepElement,
} from '../../engine/guidedValidation';
import { bgToCss } from '../../engine/transitionEngine';
import { useStudioStore } from '../../store/useStudioStore';
import { SlideElement } from '../../types/presentation';

type MobilePane = 'canvas' | 'steps' | 'validate';

const STORAGE_KEY = 'slidemotion-guided-progress-v1';

interface SavedProgress {
  completedLessons: string[];
  earnedBadges: string[];
}

function loadGuidedProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedProgress>;
      return {
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { completedLessons: [], earnedBadges: [] };
}

function saveGuidedProgress(data: SavedProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota issues
  }
}

export const GuidedDesignStudio: React.FC = () => {
  const settings = useStudioStore((s) => s.settings);
  const panels = settings.panels;
  const importSlideToDeck = useStudioStore((s) => s.importSlideToDeck);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const [lessonId, setLessonId] = useState<string>(GUIDED_LESSONS[0].id);
  const [difficulty, setDifficulty] = useState<GuidedDifficulty>('standard');
  const [ghostOpacity, setGhostOpacity] = useState<number>(DIFFICULTY_THRESHOLDS.standard.defaultGhostOpacity);
  const [mobilePane, setMobilePane] = useState<MobilePane>('canvas');

  const [progress, setProgress] = useState<SavedProgress>(() => loadGuidedProgress());

  // User elements per lesson (mapped by stepId on each user element via `stepTag` in id prefix `user-${step.id}`)
  const [userElements, setUserElements] = useState<SlideElement[]>([]);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [editingElId, setEditingElId] = useState<string | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // "Show Me" animated hint
  const [showMeStepId, setShowMeStepId] = useState<string | null>(null);
  const [showMePulse, setShowMePulse] = useState(0);

  // Animate-It Finale state
  const [finaleActive, setFinaleActive] = useState(false);
  const [finalePlaying, setFinalePlaying] = useState(false);
  const [finaleTime, setFinaleTime] = useState(0);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Stage sizing
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [stageContainerSize, setStageContainerSize] = useState({ w: 800, h: 480 });

  const dragRef = useRef<{
    type: 'move' | 'resize';
    elId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const lesson: GuidedLesson = GUIDED_LESSONS.find((l) => l.id === lessonId) ?? GUIDED_LESSONS[0];
  const activeStep: GuidedLessonStep = lesson.steps[activeStepIdx] ?? lesson.steps[0];
  const dims = STAGE_DIMENSIONS['16:9']; // 1920 x 1080 canonical design space

  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageContainerSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobilePane]);

  // Match user element to a lesson step
  const findUserElementForStep = (step: GuidedLessonStep, list: SlideElement[]): SlideElement | undefined => {
    const tagged = list.find((e) => e.id.startsWith(`user-${step.id}`));
    if (tagged) return tagged;
    return list.find(
      (e) =>
        e.type === step.targetElement.type &&
        (e.type !== 'shape' || e.shapeKind === step.targetElement.shapeKind),
    );
  };

  // Real-time automated validation reports for all steps
  const stepReports: StepValidationReport[] = useMemo(
    () =>
      lesson.steps.map((st) =>
        validateStepElement(
          findUserElementForStep(st, userElements),
          st.targetElement,
          st.id,
          st.requireTextMatch,
          difficulty,
          dims.width,
          dims.height,
        ),
      ),
    [difficulty, dims.height, dims.width, lesson.steps, userElements],
  );

  const passedCount = stepReports.filter((r) => r.passed).length;
  const allStepsPassed = passedCount === lesson.steps.length && lesson.steps.length > 0;
  const activeReport = stepReports[activeStepIdx] ?? stepReports[0];

  // Award lesson & difficulty badges automatically when all steps pass
  useEffect(() => {
    if (!allStepsPassed) return;
    setProgress((prev) => {
      const nextLessons = prev.completedLessons.includes(lesson.id)
        ? prev.completedLessons
        : [...prev.completedLessons, lesson.id];
      const nextBadges = [...prev.earnedBadges];
      if (!nextBadges.includes(lesson.badgeId)) nextBadges.push(lesson.badgeId);
      if (difficulty === 'pro' && !nextBadges.includes('badge-pro')) nextBadges.push('badge-pro');
      if (
        nextLessons.length === prev.completedLessons.length &&
        nextBadges.length === prev.earnedBadges.length
      ) {
        return prev;
      }
      const updated = { completedLessons: nextLessons, earnedBadges: nextBadges };
      saveGuidedProgress(updated);
      return updated;
    });
  }, [allStepsPassed, difficulty, lesson.badgeId, lesson.id]);

  // Show Me animated timer
  useEffect(() => {
    if (!showMeStepId) return;
    let rafId = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - started) / 1000;
      if (elapsed >= 3.2) {
        setShowMeStepId(null);
        setShowMePulse(0);
        return;
      }
      setShowMePulse((elapsed % 1) / 1);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showMeStepId]);

  // Animate-It Finale timeline & playback loop
  const finaleElements: SlideElement[] = useMemo(() => {
    if (!finaleActive) return userElements;
    return lesson.steps
      .map((st) => {
        const userEl = findUserElementForStep(st, userElements) ?? st.targetElement;
        return {
          ...userEl,
          animations: st.finaleAnimations,
        };
      });
  }, [finaleActive, lesson.steps, userElements]);

  const finaleTimeline = useMemo(() => buildSlideTimeline(finaleElements), [finaleElements]);

  useEffect(() => {
    if (!finalePlaying) return;
    let rafId = 0;
    let last = performance.now();
    const total = Math.max(1.5, finaleTimeline.totalDuration + 0.4);
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setFinaleTime((prev) => {
        const next = prev + dt;
        if (next >= total) {
          setFinalePlaying(false);
          return total;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [finalePlaying, finaleTimeline.totalDuration]);

  const switchLesson = (id: string) => {
    setLessonId(id);
    setUserElements([]);
    setSelectedElId(null);
    setEditingElId(null);
    setActiveStepIdx(0);
    setFinaleActive(false);
    setFinalePlaying(false);
    setFinaleTime(0);
    setShowMeStepId(null);
  };

  const handleDifficultyChange = (nextDiff: GuidedDifficulty) => {
    setDifficulty(nextDiff);
    setGhostOpacity(DIFFICULTY_THRESHOLDS[nextDiff].defaultGhostOpacity);
  };

  // Spawn an unaligned starter element for the active step so the learner builds it interactively
  const handleSpawnStarterForStep = (step: GuidedLessonStep) => {
    const existing = findUserElementForStep(step, userElements);
    if (existing) {
      setSelectedElId(existing.id);
      return;
    }
    const target = step.targetElement;
    const starterX = Math.max(80, Math.min(dims.width - 360, target.x + (target.x > 900 ? -240 : 180)));
    const starterY = Math.max(80, Math.min(dims.height - 260, target.y > 600 ? target.y - 190 : target.y + 130));
    const starterW = Math.max(110, Math.round(target.w * 0.82));
    const starterH = Math.max(22, Math.round(target.h * 0.82));

    const starterEl: SlideElement = {
      ...(JSON.parse(JSON.stringify(target)) as SlideElement),
      id: `user-${step.id}-${Date.now().toString(36)}`,
      x: starterX,
      y: starterY,
      w: starterW,
      h: starterH,
      text: step.requireTextMatch ? 'Edit text here' : target.text,
      style: createDefaultStyle({
        ...target.style,
        fill:
          target.type === 'text'
            ? target.style.fill
            : {
                ...target.style.fill,
                mode: 'solid',
                colour: '#64748b',
              },
        typography: {
          ...target.style.typography,
          colour: target.type === 'text' ? '#94a3b8' : target.style.typography.colour,
        },
      }),
    };

    setUserElements((prev) => [...prev, starterEl]);
    setSelectedElId(starterEl.id);
    setFinaleActive(false);
    setMobilePane('canvas');
  };

  const updateUserEl = (id: string, patch: Partial<SlideElement>) => {
    setUserElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  };

  const deleteSelectedUserEl = () => {
    if (!selectedElId) return;
    setUserElements((prev) => prev.filter((el) => el.id !== selectedElId));
    setSelectedElId(null);
  };

  const runAnimateItFinale = () => {
    setFinaleActive(true);
    setFinaleTime(0);
    setFinalePlaying(true);
    setMobilePane('canvas');

    setProgress((prev) => {
      if (prev.earnedBadges.includes('badge-finale')) return prev;
      const updated = { ...prev, earnedBadges: [...prev.earnedBadges, 'badge-finale'] };
      saveGuidedProgress(updated);
      return updated;
    });
  };

  const handleSaveSlideToDeck = () => {
    const builtElements = lesson.steps.map((st) => {
      const userEl = findUserElementForStep(st, userElements) ?? st.targetElement;
      return {
        ...userEl,
        animations: st.finaleAnimations,
      };
    });
    importSlideToDeck({
      title: `${lesson.title} (Guided)`,
      background: { ...lesson.background },
      useMaster: false,
      elements: builtElements,
      transition: {
        type: 'morph',
        category: 'dynamic',
        duration: 0.85,
        easing: 'ease-in-out',
        morphMode: 'objects',
      },
      notes: `Built in Guided Design Studio (${DIFFICULTY_THRESHOLDS[difficulty].label} difficulty).`,
    });
    setSavedNotice(`Saved "${lesson.title}" to your project deck!`);
    window.setTimeout(() => setSavedNotice(null), 2800);
  };

  const scale = useMemo(() => {
    const availW = Math.max(260, stageContainerSize.w - 36);
    const availH = Math.max(160, stageContainerSize.h - 135);
    return Math.min(availW / dims.width, availH / dims.height, 0.72);
  }, [dims.height, dims.width, stageContainerSize.h, stageContainerSize.w]);

  const handlePointerDownEl = (e: React.PointerEvent, el: SlideElement, type: 'move' | 'resize') => {
    if (finaleActive || editingElId === el.id) return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setSelectedElId(el.id);
    dragRef.current = {
      type,
      elId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.w,
      origH: el.h,
    };
  };

  const handlePointerMoveStage = (e: React.PointerEvent) => {
    const dr = dragRef.current;
    if (!dr) return;
    const dx = (e.clientX - dr.startClientX) / Math.max(0.1, scale);
    const dy = (e.clientY - dr.startClientY) / Math.max(0.1, scale);
    const snapTol = DIFFICULTY_THRESHOLDS[difficulty].snapPx;

    // Locate corresponding step target for optional Beginner/Standard snap
    const matchingStep = lesson.steps.find((st) => dr.elId.startsWith(`user-${st.id}`));
    const tgt = matchingStep?.targetElement;

    if (dr.type === 'move') {
      let nx = Math.round(dr.origX + dx);
      let ny = Math.round(dr.origY + dy);
      if (tgt && snapTol > 0) {
        if (Math.abs(nx - tgt.x) <= snapTol) nx = tgt.x;
        if (Math.abs(ny - tgt.y) <= snapTol) ny = tgt.y;
      }
      updateUserEl(dr.elId, { x: nx, y: ny });
    } else {
      let nw = Math.max(24, Math.round(dr.origW + dx));
      let nh = Math.max(12, Math.round(dr.origH + dy));
      if (tgt && snapTol > 0) {
        if (Math.abs(nw - tgt.w) <= snapTol) nw = tgt.w;
        if (Math.abs(nh - tgt.h) <= snapTol) nh = tgt.h;
      }
      updateUserEl(dr.elId, { w: nw, h: nh });
    }
  };

  const handlePointerUpStage = () => {
    dragRef.current = null;
  };

  const selectedEl = userElements.find((e) => e.id === selectedElId);

  const renderStepsPanel = () => (
    <aside
      aria-label="Guided Lessons and Steps"
      className="flex h-full min-h-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-5">
        {/* Lessons List */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">
              Guided Lessons (Phase 5 · 1–3)
            </h2>
            <span className="font-mono-tabular text-[11px] text-emerald-400">
              {progress.completedLessons.length}/{GUIDED_LESSONS.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {GUIDED_LESSONS.map((l) => {
              const active = l.id === lesson.id;
              const done = progress.completedLessons.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => switchLesson(l.id)}
                  className={`flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs ${
                    active
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] truncate">
                      {l.number}. {l.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{l.focusArea}</div>
                  </div>
                  {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Numbered Steps */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Numbered Steps ({passedCount}/{lesson.steps.length})
            </h3>
          </div>

          <div className="space-y-2">
            {lesson.steps.map((st, idx) => {
              const report = stepReports[idx];
              const isCurrent = idx === activeStepIdx;
              const alreadyPlaced = Boolean(findUserElementForStep(st, userElements));
              return (
                <div
                  key={st.id}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-colors ${
                    isCurrent
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono-tabular text-[11px] ${
                          report?.passed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-strong)]'
                        }`}
                      >
                        {report?.passed ? '✓' : st.stepNumber}
                      </span>
                      <span>{st.title}</span>
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="mt-2.5 space-y-2.5">
                      <p className="leading-relaxed text-[var(--text-secondary)]">{st.instruction}</p>
                      <div className="rounded-lg bg-[var(--bg-panel)] p-2 font-mono-tabular text-[11px] text-[var(--text-muted)]">
                        Target: X {st.targetElement.x}, Y {st.targetElement.y} · {st.targetElement.w}×{st.targetElement.h}px ·{' '}
                        <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-sm border border-white/25"
                            style={{ backgroundColor: getElementPrimaryColour(st.targetElement) }}
                          />
                          {getElementPrimaryColour(st.targetElement)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--accent-500)]">{st.designTip}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpawnStarterForStep(st);
                          }}
                          className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1 rounded-lg bg-[var(--accent-600)] px-2.5 text-[11px] font-semibold text-[var(--accent-contrast)]"
                        >
                          {st.targetElement.type === 'text' ? <Type className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          <span>{alreadyPlaced ? 'Select Piece' : 'Add Starter Piece'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMeStepId(st.id);
                            setMobilePane('canvas');
                          }}
                          className="min-h-[36px] inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] px-2.5 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
                        >
                          <Sparkles className="h-3 w-3 text-[var(--accent-500)]" />
                          <span>Show Me</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );

  const renderValidationAndMockupPanel = () => {
    const rules = DIFFICULTY_THRESHOLDS[difficulty];
    const thumbScale = 272 / dims.width;
    return (
      <aside
        aria-label="Target Mockup, Validation and Badges"
        className="flex h-full min-h-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-panel)]"
      >
        <div className="studio-scroll flex-1 overflow-y-auto p-4 space-y-5">
          {/* Target Mockup Card */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">Target Mockup</h3>
              <span className="text-[11px] text-[var(--text-muted)]">Goal reference</span>
            </div>
            <div
              className="mx-auto overflow-hidden rounded-xl border border-[var(--border-subtle)] shadow-lg"
              style={{ width: 272, height: Math.round(dims.height * thumbScale) }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  width: dims.width,
                  height: dims.height,
                  transform: `scale(${thumbScale})`,
                  transformOrigin: 'top left',
                  background: bgToCss(lesson.background),
                }}
              >
                {lesson.steps.map((st) => (
                  <div
                    key={st.targetElement.id}
                    style={{
                      position: 'absolute',
                      left: st.targetElement.x,
                      top: st.targetElement.y,
                      width: st.targetElement.w,
                      height: st.targetElement.h,
                      transform: `rotate(${st.targetElement.rotation}deg)`,
                    }}
                  >
                    <ElementRenderer element={st.targetElement} />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{lesson.designPrinciple}</p>
          </section>

          <div className="h-px bg-[var(--border-subtle)]" />

          {/* Automated Validation Readout */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">
                Automated Check · Step {activeStep.stepNumber}
              </h3>
              <span
                className={`text-[11px] font-semibold ${
                  activeReport.passed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {activeReport.passed ? 'Passed' : activeReport.found ? 'Needs tuning' : 'Not placed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                className={`rounded-lg border p-2 ${
                  activeReport.positionOk
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                }`}
              >
                <div className="text-[var(--text-muted)]">Position ≤ {(rules.positionPct * 100).toFixed(1)}%</div>
                <div className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                  ΔX {activeReport.posErrorXPct}% · ΔY {activeReport.posErrorYPct}%
                </div>
              </div>
              <div
                className={`rounded-lg border p-2 ${
                  activeReport.sizeOk
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                }`}
              >
                <div className="text-[var(--text-muted)]">Size ≤ {(rules.sizePct * 100).toFixed(1)}%</div>
                <div className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                  ΔW {activeReport.sizeErrorWPct}% · ΔH {activeReport.sizeErrorHPct}%
                </div>
              </div>
              <div
                className={`rounded-lg border p-2 ${
                  activeReport.colourOk
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                }`}
              >
                <div className="text-[var(--text-muted)]">Colour ΔE &lt; {rules.deltaEMax}</div>
                <div className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                  ΔE {activeReport.deltaE}
                </div>
              </div>
              <div
                className={`rounded-lg border p-2 ${
                  activeReport.textOk
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                }`}
              >
                <div className="text-[var(--text-muted)]">Text Check</div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {activeStep.requireTextMatch ? (activeReport.textOk ? 'Matched' : 'Edit text') : 'N/A'}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1 text-xs">
              {activeReport.hints.map((h, i) => (
                <p key={i} className="leading-relaxed text-[var(--text-secondary)]">
                  • {h}
                </p>
              ))}
            </div>

            {/* Animate-It Finale & Save to Deck */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={runAnimateItFinale}
                disabled={userElements.length === 0}
                className={`flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors disabled:opacity-40 ${
                  allStepsPassed
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                }`}
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>{allStepsPassed ? 'Play Animate-It Finale!' : 'Preview Animate-It Finale'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSlideToDeck}
                className="flex w-full min-h-[38px] items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)]"
              >
                <Save className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                <span>Save Lesson Slide to My Deck</span>
              </button>

              {savedNotice && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-2 text-[11px] text-emerald-200">
                  <span>{savedNotice}</span>
                  <button
                    type="button"
                    onClick={() => setActiveModule('designer')}
                    className="font-semibold underline"
                  >
                    Open
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="h-px bg-[var(--border-subtle)]" />

          {/* Badges */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">
                Studio Badges ({progress.earnedBadges.length}/{GUIDED_BADGES.length})
              </h3>
            </div>
            <div className="space-y-1.5">
              {GUIDED_BADGES.map((badge) => {
                const earned = progress.earnedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs ${
                      earned
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] opacity-55'
                    }`}
                  >
                    <Award
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        earned ? 'text-amber-400' : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{badge.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{badge.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </aside>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Top Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 sm:px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-xs font-semibold text-[var(--text-primary)]">
            {lesson.number}. {lesson.title}
          </span>
          <span className="font-mono-tabular text-[11px] text-[var(--accent-500)]">
            {passedCount}/{lesson.steps.length} steps passed
          </span>
        </div>

        {/* Difficulty + Ghost Opacity + Reset */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-0.5">
            {(['beginner', 'standard', 'pro'] as GuidedDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDifficultyChange(d)}
                className={`min-h-[30px] rounded-md px-2.5 text-[11px] font-semibold capitalize ${
                  difficulty === d
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1 text-[11px]">
            <Eye className="h-3.5 w-3.5 text-[var(--accent-500)]" />
            <span className="text-[var(--text-secondary)]">Ghost</span>
            <input
              type="range"
              aria-label="Ghost overlay opacity"
              min={0}
              max={0.8}
              step={0.05}
              value={ghostOpacity}
              onChange={(e) => setGhostOpacity(Number(e.target.value))}
              className="w-20 accent-[var(--accent-500)]"
            />
            <span className="font-mono-tabular w-8 text-right text-[var(--text-primary)]">
              {Math.round(ghostOpacity * 100)}%
            </span>
          </label>

          <button
            type="button"
            onClick={() => switchLesson(lesson.id)}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Lesson</span>
          </button>
          <LabPanelToggles leftLabel="Steps" rightLabel="Check" />
        </div>
      </div>

      {/* Mobile Pane Switcher */}
      <div className="lg:hidden grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
        {(
          [
            ['canvas', 'Stage'],
            ['steps', `Steps (${passedCount}/${lesson.steps.length})`],
            ['validate', 'Check & Mockup'],
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

      {/* Main 3-Zone Guided Workspace */}
      <div
        className={`flex-1 min-h-0 grid grid-cols-1 overflow-hidden ${
          panels.labLeft && panels.labRight
            ? 'lg:grid-cols-[290px_1fr_325px]'
            : panels.labLeft
              ? 'lg:grid-cols-[290px_1fr]'
              : panels.labRight
                ? 'lg:grid-cols-[1fr_325px]'
                : 'lg:grid-cols-[1fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${
            mobilePane === 'steps'
              ? panels.labLeft
                ? 'block'
                : 'block lg:hidden'
              : panels.labLeft
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {renderStepsPanel()}
        </div>

        {/* Centre Virtual 1920x1080 Guided Canvas */}
        <main
          ref={stageContainerRef}
          className={`min-h-0 flex-col items-center justify-between overflow-hidden bg-[var(--bg-canvas-well)] p-3 sm:p-4 ${
            mobilePane === 'canvas' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Active Step Prompt Banner */}
          <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="h-4 w-4 shrink-0 text-[var(--accent-500)]" />
              <span className="truncate font-medium text-[var(--text-primary)]">
                Step {activeStep.stepNumber}: {activeStep.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {finaleActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setFinaleActive(false);
                    setFinalePlaying(false);
                  }}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-2.5 text-[11px] font-semibold text-[var(--text-primary)]"
                >
                  <Square className="h-3 w-3" />
                  <span>Exit Finale</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSpawnStarterForStep(activeStep)}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-[var(--accent-600)] px-2.5 text-[11px] font-semibold text-[var(--accent-contrast)]"
                >
                  <Plus className="h-3 w-3" />
                  <span>{findUserElementForStep(activeStep, userElements) ? 'Select Step Piece' : 'Add Step Piece'}</span>
                </button>
              )}
              {finaleActive && (
                <button
                  type="button"
                  onClick={runAnimateItFinale}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-[11px] font-semibold text-slate-950"
                >
                  <Play className="h-3 w-3" />
                  <span>Replay Finale</span>
                </button>
              )}
            </div>
          </div>

          {/* Scaled 1920x1080 Virtual Stage */}
          <div className="flex flex-1 items-center justify-center overflow-hidden py-2">
            <div
              className="relative overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/40"
              style={{
                width: dims.width * scale,
                height: dims.height * scale,
              }}
              onClick={() => {
                setSelectedElId(null);
                setEditingElId(null);
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  width: dims.width,
                  height: dims.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  background: bgToCss(lesson.background),
                }}
                onPointerMove={handlePointerMoveStage}
                onPointerUp={handlePointerUpStage}
                onPointerCancel={handlePointerUpStage}
              >
                {/* Ghost Overlay Layer */}
                {!finaleActive && ghostOpacity > 0 && (
                  <div className="pointer-events-none absolute inset-0" style={{ opacity: ghostOpacity }}>
                    {lesson.steps.map((st) => (
                      <div
                        key={`ghost-${st.targetElement.id}`}
                        style={{
                          position: 'absolute',
                          left: st.targetElement.x,
                          top: st.targetElement.y,
                          width: st.targetElement.w,
                          height: st.targetElement.h,
                          transform: `rotate(${st.targetElement.rotation}deg)`,
                          outline:
                            st.id === activeStep.id ? '2px dashed rgba(56, 189, 248, 0.85)' : undefined,
                        }}
                      >
                        <ElementRenderer element={st.targetElement} />
                      </div>
                    ))}
                  </div>
                )}

                {/* User Interactive Elements (or Finale Animated Playback) */}
                {(finaleActive ? finaleElements : userElements).map((el) => {
                  const isSel = !finaleActive && el.id === selectedElId;
                  const isEd = !finaleActive && el.id === editingElId;
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
                      className={finaleActive ? '' : 'cursor-move'}
                      onPointerDown={(e) => handlePointerDownEl(e, el, 'move')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!finaleActive) setSelectedElId(el.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (!finaleActive && (el.type === 'text' || el.type === 'shape')) {
                          setEditingElId(el.id);
                        }
                      }}
                    >
                      {finaleActive ? (
                        <AnimatedElementWrapper
                          element={el}
                          scheduledItems={finaleTimeline.items}
                          currentTime={finaleTime}
                          isPlayingOrPreviewing={true}
                          reduceMotion={settings.reduceMotion}
                        />
                      ) : (
                        <ElementRenderer
                          element={el}
                          isEditing={isEd}
                          onTextChange={(nextText) => updateUserEl(el.id, { text: nextText })}
                          onFinishEditing={() => setEditingElId(null)}
                        />
                      )}

                      {isSel && (
                        <>
                          <div className="pointer-events-none absolute inset-0 ring-4 ring-sky-400" />
                          <div
                            onPointerDown={(e) => handlePointerDownEl(e, el, 'resize')}
                            className="absolute -bottom-3 -right-3 h-7 w-7 cursor-nwse-resize rounded-full border-4 border-sky-500 bg-white shadow-lg"
                          />
                        </>
                      )}
                    </div>
                  );
                })}

                {/* "Show Me" Animated Target Demonstration */}
                {showMeStepId && (() => {
                  const targetStep = lesson.steps.find((s) => s.id === showMeStepId);
                  if (!targetStep) return null;
                  const t = targetStep.targetElement;
                  return (
                    <div
                      className="pointer-events-none absolute rounded-lg border-4 border-sky-300 bg-sky-400/15"
                      style={{
                        left: t.x,
                        top: t.y,
                        width: t.w,
                        height: t.h,
                        boxShadow: `0 0 ${Math.round(18 + showMePulse * 28)}px rgba(56,189,248,0.85)`,
                      }}
                    >
                      <div className="absolute -top-12 left-0 whitespace-nowrap rounded-lg bg-sky-500 px-3 py-1 text-2xl font-bold text-slate-950 shadow-lg">
                        Place here · {t.x}, {t.y} ({t.w}×{t.h})
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Bottom Element Quick-Edit Strip (Colour, Size, Text & Status) */}
          <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-xs">
            {selectedEl && !finaleActive ? (
              <>
                <div className="flex flex-wrap items-center gap-2.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                  <label className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-[var(--text-muted)]">Colour</span>
                    <input
                      type="color"
                      value={getElementPrimaryColour(selectedEl)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedEl.type === 'text') {
                          updateUserEl(selectedEl.id, {
                            style: {
                              ...selectedEl.style,
                              typography: { ...selectedEl.style.typography, colour: val },
                            },
                          });
                        } else {
                          updateUserEl(selectedEl.id, {
                            style: {
                              ...selectedEl.style,
                              fill: { ...selectedEl.style.fill, mode: 'solid', colour: val },
                            },
                          });
                        }
                      }}
                      className="h-6 w-8 cursor-pointer bg-transparent"
                    />
                  </label>

                  <label className="flex items-center gap-1 text-[11px]">
                    <span className="text-[var(--text-muted)]">W</span>
                    <input
                      type="number"
                      value={Math.round(selectedEl.w)}
                      onChange={(e) =>
                        updateUserEl(selectedEl.id, { w: Math.max(24, Number(e.target.value) || 24) })
                      }
                      className="font-mono-tabular w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-1.5 py-0.5 text-right outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px]">
                    <span className="text-[var(--text-muted)]">H</span>
                    <input
                      type="number"
                      value={Math.round(selectedEl.h)}
                      onChange={(e) =>
                        updateUserEl(selectedEl.id, { h: Math.max(12, Number(e.target.value) || 12) })
                      }
                      className="font-mono-tabular w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-1.5 py-0.5 text-right outline-none"
                    />
                  </label>

                  {(selectedEl.type === 'text' || activeStep.requireTextMatch) && (
                    <input
                      type="text"
                      aria-label="Edit element text"
                      value={selectedEl.text}
                      onChange={(e) => updateUserEl(selectedEl.id, { text: e.target.value })}
                      placeholder="Type slide copy..."
                      className="min-w-[160px] rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2 py-1 text-xs outline-none focus:border-[var(--accent-500)]"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                    X:{Math.round(selectedEl.x)} Y:{Math.round(selectedEl.y)}
                  </span>
                  <button
                    type="button"
                    onClick={deleteSelectedUserEl}
                    aria-label="Remove element"
                    className="rounded-md p-1.5 text-rose-400 hover:bg-rose-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex w-full items-center justify-between text-[var(--text-muted)]">
                <span>
                  {finaleActive
                    ? 'Playing Animate-It Finale choreography on your slide.'
                    : 'Click "Add Step Piece" above or select an element on the stage to position, resize and recolour.'}
                </span>
                {allStepsPassed && (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Lesson Complete
                  </span>
                )}
              </div>
            )}
          </div>
        </main>

        <div
          className={`min-h-0 overflow-hidden ${
            mobilePane === 'validate'
              ? panels.labRight
                ? 'block'
                : 'block lg:hidden'
              : panels.labRight
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {renderValidationAndMockupPanel()}
        </div>
      </div>
    </div>
  );
};
