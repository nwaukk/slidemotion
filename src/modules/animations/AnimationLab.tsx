import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Pencil,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AnimatedElementWrapper } from '../../components/AnimatedElementWrapper';
import { AnimationPaneTimeline } from '../../components/AnimationPaneTimeline';
import { LabPanelToggles } from '../../components/LabPanelToggles';
import {
  ANIMATION_EFFECTS,
  ANIMATION_RECIPES,
  AnimationRecipe,
  CATEGORY_TEACHING,
  GOLDEN_RULES,
} from '../../data/animations';
import { createDefaultStyle, CURATED_SVG_LIBRARY, STAGE_DIMENSIONS } from '../../data/themes';
import {
  buildSlideTimeline,
  getMotionPathPreviewSvg,
} from '../../engine/animationEngine';
import { useStudioStore } from '../../store/useStudioStore';
import {
  AnimationCategory,
  AnimationStart,
  ElementAnimation,
  PathPoint,
  SlideElement,
  TextDeliveryMode,
} from '../../types/presentation';

type SampleKind = 'text' | 'card' | 'metric' | 'rocket';
type LeftTab = 'effects' | 'recipes' | 'rules';
type MobileSection = 'stage' | 'effects' | 'options' | 'timeline';

function createSandboxSample(kind: SampleKind): SlideElement {
  if (kind === 'text') {
    return {
      id: 'sandbox-el',
      name: 'Sample Headline',
      type: 'text',
      x: 360,
      y: 340,
      w: 1200,
      h: 400,
      rotation: 0,
      locked: false,
      visible: true,
      text: 'Purposeful Motion\nGuides Audience Focus\nWith Clarity',
      style: createDefaultStyle({
        fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' },
        typography: {
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 68,
          fontWeight: 700,
          italic: false,
          underline: false,
          colour: '#f8fafc',
          align: 'centre',
          verticalAlign: 'middle',
          lineHeight: 1.35,
          letterSpacing: -1,
        },
      }),
      animations: [],
    };
  }
  if (kind === 'metric') {
    return {
      id: 'sandbox-el',
      name: 'Key Metric',
      type: 'shape',
      shapeKind: 'rounded-rectangle',
      x: 680,
      y: 360,
      w: 560,
      h: 360,
      rotation: 0,
      locked: false,
      visible: true,
      text: '+64%\nRetention Rate',
      style: createDefaultStyle({
        fill: { mode: 'gradient', colour: '#0284c7', gradientStart: '#0ea5e9', gradientEnd: '#1d4ed8', gradientAngle: 140, gradientType: 'linear' },
        cornerRadius: 28,
        typography: {
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 56,
          fontWeight: 800,
          italic: false,
          underline: false,
          colour: '#ffffff',
          align: 'centre',
          verticalAlign: 'middle',
          lineHeight: 1.3,
          letterSpacing: -1,
        },
      }),
      animations: [],
    };
  }
  if (kind === 'rocket') {
    const rocketSvg = CURATED_SVG_LIBRARY.find((i) => i.id === 'rocket')?.svg ?? '';
    return {
      id: 'sandbox-el',
      name: 'Vector Rocket',
      type: 'svg',
      x: 820,
      y: 400,
      w: 280,
      h: 280,
      rotation: 0,
      locked: false,
      visible: true,
      text: '',
      svgContent: rocketSvg,
      style: createDefaultStyle({
        fill: { mode: 'solid', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#f59e0b', gradientAngle: 135, gradientType: 'linear' },
      }),
      animations: [],
    };
  }
  return {
    id: 'sandbox-el',
    name: 'Feature Card',
    type: 'shape',
    shapeKind: 'rounded-rectangle',
    x: 640,
    y: 350,
    w: 640,
    h: 380,
    rotation: 0,
    locked: false,
    visible: true,
    text: 'Quarterly Milestone\nDesign & Engineering',
    style: createDefaultStyle({
      fill: { mode: 'solid', colour: '#16223b', gradientStart: '#16223b', gradientEnd: '#1e293b', gradientAngle: 180, gradientType: 'linear' },
      outline: { colour: '#38bdf8', width: 3, dash: 'solid' },
      cornerRadius: 26,
      typography: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 40,
        fontWeight: 600,
        italic: false,
        underline: false,
        colour: '#f8fafc',
        align: 'centre',
        verticalAlign: 'middle',
        lineHeight: 1.4,
        letterSpacing: 0,
      },
    }),
    animations: [],
  };
}

export const AnimationLab: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const selectedAnimationId = useStudioStore((s) => s.selectedAnimationId);
  const settings = useStudioStore((s) => s.settings);
  const panels = settings.panels;
  const isPainterActive = useStudioStore((s) => s.isPainterActive);

  const selectElements = useStudioStore((s) => s.selectElements);
  const setSelectedAnimationId = useStudioStore((s) => s.setSelectedAnimationId);
  const addElementAnimation = useStudioStore((s) => s.addElementAnimation);
  const updateElementAnimation = useStudioStore((s) => s.updateElementAnimation);
  const removeElementAnimation = useStudioStore((s) => s.removeElementAnimation);
  const reorderSlideAnimation = useStudioStore((s) => s.reorderSlideAnimation);
  const activateAnimationPainter = useStudioStore((s) => s.activateAnimationPainter);
  const cancelAnimationPainter = useStudioStore((s) => s.cancelAnimationPainter);
  const applyAnimationPainterTo = useStudioStore((s) => s.applyAnimationPainterTo);
  const applyRecipeToActiveSlide = useStudioStore((s) => s.applyRecipeToActiveSlide);

  const activeSlide = project.slides.find((s) => s.id === activeSlideId) ?? project.slides[0];
  const dims = STAGE_DIMENSIONS[project.aspectRatio];

  const [targetSource, setTargetSource] = useState<'sandbox' | 'slide'>('sandbox');
  const [leftTab, setLeftTab] = useState<LeftTab>('effects');
  const [category, setCategory] = useState<AnimationCategory>('entrance');
  const [sampleKind, setSampleKind] = useState<SampleKind>('card');
  const [activeRecipe, setActiveRecipe] = useState<AnimationRecipe | null>(null);
  const [mobileSection, setMobileSection] = useState<MobileSection>('stage');
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  // Sandbox animation configuration
  const [sandboxAnim, setSandboxAnim] = useState<ElementAnimation>({
    id: 'sb-anim-1',
    category: 'entrance',
    effect: 'float-in',
    options: { direction: 'up' },
    start: 'on-click',
    duration: 0.55,
    delay: 0,
    repeat: 1,
    rewind: false,
    order: 1,
    textDelivery: 'all',
  });

  // Custom path drawing state
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [draftPoints, setDraftPoints] = useState<PathPoint[]>([]);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageBoxRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 640, height: 360 });

  // Playback engine state
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [currentTime, setCurrentTime] = useState(0);

  // Determine the elements rendered on the Lab stage
  const labElements: SlideElement[] = useMemo(() => {
    if (targetSource === 'slide' && activeSlide) {
      return activeSlide.elements;
    }
    if (activeRecipe) {
      return activeRecipe.elements;
    }
    const sample = createSandboxSample(sampleKind);
    return [{ ...sample, animations: [sandboxAnim] }];
  }, [activeRecipe, activeSlide, sampleKind, sandboxAnim, targetSource]);

  const { items: scheduledItems, totalDuration } = useMemo(
    () => buildSlideTimeline(labElements),
    [labElements],
  );

  // Determine currently inspected animation & element
  const inspectedTarget = useMemo(() => {
    if (targetSource === 'slide' && activeSlide) {
      for (const el of activeSlide.elements) {
        const found = el.animations.find((a) => a.id === selectedAnimationId);
        if (found) return { element: el, animation: found };
      }
      const selEl = activeSlide.elements.find((e) => selectedElementIds.includes(e.id));
      if (selEl && selEl.animations[0]) return { element: selEl, animation: selEl.animations[0] };
      if (scheduledItems[0]) {
        const el = activeSlide.elements.find((e) => e.id === scheduledItems[0].elementId);
        if (el) return { element: el, animation: scheduledItems[0].animation };
      }
      return null;
    }
    if (activeRecipe) {
      const first = scheduledItems[0];
      const match = scheduledItems.find((i) => i.animation.id === selectedAnimationId) ?? first;
      if (!match) return null;
      const el = activeRecipe.elements.find((e) => e.id === match.elementId)!;
      return { element: el, animation: match.animation };
    }
    return { element: labElements[0], animation: sandboxAnim };
  }, [activeRecipe, activeSlide, labElements, sandboxAnim, scheduledItems, selectedAnimationId, selectedElementIds, targetSource]);

  const inspectedAnim = inspectedTarget?.animation ?? sandboxAnim;
  const inspectedEffectDef =
    ANIMATION_EFFECTS.find((e) => e.id === inspectedAnim.effect) ?? ANIMATION_EFFECTS[0];

  // Observe stage container to keep stage perfectly scaled with zero overflow
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobileSection]);

  const stageScale = useMemo(() => {
    const availW = Math.max(200, stageSize.width - 24);
    const availH = Math.max(120, stageSize.height - 24);
    return Math.min(availW / dims.width, availH / dims.height);
  }, [dims.height, dims.width, stageSize.height, stageSize.width]);

  // 60fps requestAnimationFrame playback loop
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastTs = performance.now();
    const maxT = Math.max(0.2, totalDuration);

    const tick = (now: number) => {
      const dt = ((now - lastTs) / 1000) * speed;
      lastTs = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= maxT) {
          if (loopPlayback) return 0;
          setIsPlaying(false);
          return maxT;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, loopPlayback, speed, totalDuration]);

  const triggerPlay = (fromTime = 0) => {
    setCurrentTime(fromTime);
    setIsPlaying(true);
  };

  const resetPreview = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSelectEffect = (effectId: string) => {
    const def = ANIMATION_EFFECTS.find((e) => e.id === effectId);
    if (!def) return;
    const defaultOpts: Record<string, string | number | boolean> = {};
    def.optionFields.forEach((f) => {
      defaultOpts[f.key] = f.defaultValue;
    });

    if (targetSource === 'slide' && activeSlide) {
      const targetElId = selectedElementIds[0] ?? activeSlide.elements[0]?.id;
      if (!targetElId) return;
      if (inspectedTarget && selectedAnimationId === inspectedTarget.animation.id) {
        updateElementAnimation(inspectedTarget.element.id, inspectedTarget.animation.id, {
          category: def.category,
          effect: def.id,
          duration: def.defaultDuration,
          options: defaultOpts,
        });
      } else {
        addElementAnimation(targetElId, {
          category: def.category,
          effect: def.id,
          options: defaultOpts,
          start: 'on-click',
          duration: def.defaultDuration,
          delay: 0,
          repeat: 1,
          rewind: false,
          textDelivery: 'all',
        });
      }
      triggerPlay(0);
      return;
    }

    setActiveRecipe(null);
    setSandboxAnim((prev) => ({
      ...prev,
      category: def.category,
      effect: def.id,
      duration: def.defaultDuration,
      options: defaultOpts,
      customPoints:
        def.id === 'custom-path' && (!prev.customPoints || prev.customPoints.length < 2)
          ? [
              { x: 960, y: 540 },
              { x: 1120, y: 380 },
              { x: 1320, y: 420 },
              { x: 1440, y: 580 },
            ]
          : prev.customPoints,
    }));
    triggerPlay(0);
  };

  const patchInspectedAnim = (patch: Partial<ElementAnimation>) => {
    if (targetSource === 'slide' && inspectedTarget) {
      updateElementAnimation(inspectedTarget.element.id, inspectedTarget.animation.id, patch);
      return;
    }
    if (activeRecipe && inspectedTarget) {
      setActiveRecipe({
        ...activeRecipe,
        elements: activeRecipe.elements.map((el) =>
          el.id === inspectedTarget.element.id
            ? {
                ...el,
                animations: el.animations.map((a) =>
                  a.id === inspectedTarget.animation.id ? { ...a, ...patch } : a,
                ),
              }
            : el,
        ),
      });
      return;
    }
    setSandboxAnim((prev) => ({ ...prev, ...patch }));
  };

  const handleApplySandboxToSlide = () => {
    if (!activeSlide) return;
    const targetId = selectedElementIds[0] ?? activeSlide.elements[0]?.id;
    if (!targetId) return;
    const { id: _ignoreId, order: _ignoreOrder, ...rest } = sandboxAnim;
    addElementAnimation(targetId, rest);
    const elName = activeSlide.elements.find((e) => e.id === targetId)?.name ?? 'element';
    setAppliedBanner(`Applied ${inspectedEffectDef.name} to "${elName}" on ${activeSlide.title}`);
    window.setTimeout(() => setAppliedBanner(null), 2600);
  };

  const handleApplyRecipeToSlide = (recipe: AnimationRecipe) => {
    applyRecipeToActiveSlide(recipe.elements, false);
    setAppliedBanner(`Added "${recipe.name}" sequence to ${activeSlide?.title}`);
    window.setTimeout(() => setAppliedBanner(null), 2800);
  };

  // Custom Path Pointer Drawing on Stage
  const toStagePoint = (clientX: number, clientY: number): PathPoint => {
    const rect = stageBoxRef.current?.getBoundingClientRect();
    if (!rect) return { x: 960, y: 540 };
    return {
      x: Math.round((clientX - rect.left) / stageScale),
      y: Math.round((clientY - rect.top) / stageScale),
    };
  };

  const categoryEffects = ANIMATION_EFFECTS.filter((e) => e.category === category);
  const bg = activeSlide?.useMaster ? project.master.background : activeSlide?.background;
  const bgCss =
    targetSource === 'slide' && bg
      ? bg.mode === 'gradient'
        ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientStart}, ${bg.gradientEnd})`
        : bg.colour
      : 'linear-gradient(135deg, #0b1222, #172554)';

  const renderEffectsAndGuidePanel = () => (
    <div className="flex h-full flex-col bg-[var(--bg-panel)] overflow-hidden">
      {/* Top Sub-tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-[var(--border-subtle)] p-1.5 shrink-0">
        {(
          [
            ['effects', 'Effects'],
            ['recipes', 'Recipes (10)'],
            ['rules', 'Guide'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLeftTab(id)}
            className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              leftTab === id
                ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3 space-y-4">
        {leftTab === 'effects' && (
          <>
            {/* 4 Categories */}
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  ['entrance', 'Entrance'],
                  ['emphasis', 'Emphasis'],
                  ['exit', 'Exit'],
                  ['motion-path', 'Motion Paths'],
                ] as Array<[AnimationCategory, string]>
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[36px] rounded-lg border px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    category === cat
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category When & Why Teaching Note */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                {CATEGORY_TEACHING[category].title}
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {CATEGORY_TEACHING[category].role}
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                {CATEGORY_TEACHING[category].guidance}
              </p>
            </div>

            {/* Effects Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {categoryEffects.map((eff) => {
                const active = inspectedAnim.effect === eff.id && !activeRecipe;
                return (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => handleSelectEffect(eff.id)}
                    className={`flex min-h-[38px] items-center justify-between gap-1 rounded-lg border px-2.5 text-left text-xs font-medium transition-colors ${
                      active
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="truncate">{eff.name}</span>
                    {eff.flashes && (
                      <AlertTriangle
                        aria-label="Flashing effect warning"
                        className="h-3 w-3 shrink-0 text-amber-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explain It Card */}
            <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">
                  Explain It · {inspectedEffectDef.name}
                </h3>
                <span className="font-mono-tabular text-[10px] text-[var(--accent-500)]">
                  {inspectedEffectDef.defaultDuration}s default
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {inspectedEffectDef.summary}
              </p>
              <div className="space-y-1 border-t border-[var(--border-subtle)] pt-2 text-[11px]">
                <p className="text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Best used for:</strong> {inspectedEffectDef.whenToUse}
                </p>
                <p className="text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Avoid when:</strong> {inspectedEffectDef.whenToAvoid}
                </p>
                <p className="font-medium text-[var(--accent-500)]">
                  Pro tip: {inspectedEffectDef.proTip}
                </p>
              </div>
            </article>
          </>
        )}

        {leftTab === 'recipes' && (
          <div className="space-y-2.5">
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              Click any ready-made Animation Recipe to preview its sequence, inspect its timeline bars, or apply it to your slide.
            </p>
            {ANIMATION_RECIPES.map((recipe) => {
              const active = activeRecipe?.id === recipe.id;
              return (
                <div
                  key={recipe.id}
                  className={`rounded-xl border p-3 space-y-2 transition-colors ${
                    active
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSource('sandbox');
                      setActiveRecipe(recipe);
                      setSelectedAnimationId(recipe.elements[0]?.animations[0]?.id ?? null);
                      triggerPlay(0);
                    }}
                    className="w-full text-left"
                  >
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{recipe.name}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{recipe.subtitle}</div>
                  </button>
                  <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Why it works:</strong> {recipe.whyItWorks}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSource('sandbox');
                        setActiveRecipe(recipe);
                        triggerPlay(0);
                      }}
                      className="flex-1 min-h-[32px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[11px] font-medium"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRecipeToSlide(recipe)}
                      className="flex-1 min-h-[32px] rounded-lg bg-[var(--accent-600)] text-[11px] font-semibold text-[var(--accent-contrast)]"
                    >
                      Add to Slide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {leftTab === 'rules' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-2">
              <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">
                Golden Rules of Slide Animation
              </h3>
              <div className="space-y-2.5">
                {GOLDEN_RULES.map((item) => (
                  <div key={item.rule} className="border-t border-[var(--border-subtle)] pt-2 first:border-t-0 first:pt-0">
                    <div className="text-xs font-semibold text-[var(--accent-500)]">{item.rule}</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-2">
              <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">
                When & Why Summary
              </h3>
              {(['entrance', 'emphasis', 'exit', 'motion-path'] as AnimationCategory[]).map((cat) => (
                <div key={cat} className="border-t border-[var(--border-subtle)] pt-2 first:border-t-0 first:pt-0">
                  <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                    {CATEGORY_TEACHING[cat].title}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">{CATEGORY_TEACHING[cat].role}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Examples: {CATEGORY_TEACHING[cat].examples}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOptionsInspector = () => (
    <div className="flex h-full flex-col bg-[var(--bg-panel)] overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-3.5 py-2.5 shrink-0">
        <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">Effect Options & Timing</h2>
        <p className="text-[11px] text-[var(--text-muted)]">
          {inspectedTarget ? inspectedTarget.element.name : 'Select an effect to customise'}
        </p>
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Flash Accessibility Warning */}
        {inspectedEffectDef.flashes && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Flashing notice:</strong> This effect alters colour or brightness rapidly. SlideMotion caps flash speed below 3 cycles/second for viewer safety.
            </span>
          </div>
        )}

        {/* Custom Path Draw Button */}
        {inspectedAnim.effect === 'custom-path' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsDrawingPath(!isDrawingPath)}
              className={`flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${
                isDrawingPath
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{isDrawingPath ? 'Drag across stage now…' : 'Draw Custom Path on Stage'}</span>
            </button>
          </div>
        )}

        {/* Effect-Specific Options */}
        {inspectedEffectDef.optionFields.length > 0 && (
          <section className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Effect Options</h3>
            {inspectedEffectDef.optionFields.map((field) => {
              const val = inspectedAnim.options[field.key] ?? field.defaultValue;
              if (field.type === 'select') {
                return (
                  <label key={field.key} className="block space-y-1 text-xs">
                    <span className="text-[11px] text-[var(--text-secondary)]">{field.label}</span>
                    <select
                      value={String(val)}
                      onChange={(e) =>
                        patchInspectedAnim({
                          options: { ...inspectedAnim.options, [field.key]: e.target.value },
                        })
                      }
                      className="w-full min-h-[34px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2.5 text-xs text-[var(--text-primary)] outline-none"
                    >
                      {field.choices?.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }
              if (field.type === 'colour') {
                return (
                  <label
                    key={field.key}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-1.5 text-xs"
                  >
                    <span>{field.label}</span>
                    <input
                      type="color"
                      value={String(val)}
                      onChange={(e) =>
                        patchInspectedAnim({
                          options: { ...inspectedAnim.options, [field.key]: e.target.value },
                        })
                      }
                      className="h-6 w-8 cursor-pointer bg-transparent"
                    />
                  </label>
                );
              }
              return (
                <label key={field.key} className="block space-y-1 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)]">{field.label}</span>
                    <span className="font-mono-tabular text-[var(--text-primary)]">{val}</span>
                  </div>
                  <input
                    type="range"
                    min={field.min ?? 0}
                    max={field.max ?? 100}
                    step={field.step ?? 1}
                    value={Number(val)}
                    onChange={(e) =>
                      patchInspectedAnim({
                        options: { ...inspectedAnim.options, [field.key]: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[var(--accent-500)]"
                  />
                </label>
              );
            })}
          </section>
        )}

        {/* Start Trigger */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Start</h3>
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                ['on-click', 'On Click'],
                ['with-previous', 'With Prev'],
                ['after-previous', 'After Prev'],
              ] as Array<[AnimationStart, string]>
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => patchInspectedAnim({ start: val })}
                className={`min-h-[34px] rounded-lg border px-1.5 text-[11px] font-medium whitespace-nowrap ${
                  inspectedAnim.start === val
                    ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Duration & Delay */}
        <section className="space-y-3">
          <label className="block text-xs">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Duration</span>
              <span className="font-mono-tabular text-[var(--text-primary)]">
                {inspectedAnim.duration.toFixed(2)}s
                {inspectedAnim.duration >= 0.3 && inspectedAnim.duration <= 0.7 ? ' · Ideal' : ''}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={3.5}
              step={0.05}
              value={inspectedAnim.duration}
              onChange={(e) => patchInspectedAnim({ duration: Number(e.target.value) })}
              className="w-full accent-[var(--accent-500)]"
            />
          </label>

          <label className="block text-xs">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Delay</span>
              <span className="font-mono-tabular text-[var(--text-primary)]">
                {inspectedAnim.delay.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={3.0}
              step={0.05}
              value={inspectedAnim.delay}
              onChange={(e) => patchInspectedAnim({ delay: Number(e.target.value) })}
              className="w-full accent-[var(--accent-500)]"
            />
          </label>
        </section>

        {/* Repeat & Rewind */}
        <section className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs space-y-1">
              <span className="text-[11px] text-[var(--text-secondary)]">Repeat</span>
              <select
                value={inspectedAnim.repeat}
                onChange={(e) => patchInspectedAnim({ repeat: Number(e.target.value) })}
                className="w-full min-h-[34px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value={1}>None (1×)</option>
                <option value={2}>2 times</option>
                <option value={3}>3 times</option>
                <option value={5}>5 times</option>
                <option value={0}>Until Next Click</option>
              </select>
            </label>

            <label className="block text-xs space-y-1">
              <span className="text-[11px] text-[var(--text-secondary)]">Animate Text</span>
              <select
                value={inspectedAnim.textDelivery ?? 'all'}
                onChange={(e) => patchInspectedAnim({ textDelivery: e.target.value as TextDeliveryMode })}
                className="w-full min-h-[34px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="all">All at once</option>
                <option value="paragraph">By paragraph</option>
                <option value="word">By word</option>
                <option value="letter">By letter</option>
              </select>
            </label>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-2 text-xs">
            <span>Rewind when done playing</span>
            <input
              type="checkbox"
              checked={inspectedAnim.rewind}
              onChange={(e) => patchInspectedAnim({ rewind: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent-500)]"
            />
          </label>
        </section>

        {/* Apply to User's Active Slide CTA */}
        {targetSource === 'sandbox' && !activeRecipe && (
          <button
            type="button"
            onClick={handleApplySandboxToSlide}
            className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)] hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Apply to Selected Slide Object</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderStageAndTimeline = () => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top Playback & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] p-0.5">
            <button
              type="button"
              onClick={() => {
                setTargetSource('sandbox');
                resetPreview();
              }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                targetSource === 'sandbox'
                  ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Demo Sandbox
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetSource('slide');
                setActiveRecipe(null);
                resetPreview();
              }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                targetSource === 'slide'
                  ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              My Active Slide
            </button>
          </div>

          {targetSource === 'sandbox' && !activeRecipe && (
            <select
              aria-label="Sample demo object"
              value={sampleKind}
              onChange={(e) => {
                setSampleKind(e.target.value as SampleKind);
                resetPreview();
              }}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 py-1 text-[11px] text-[var(--text-primary)] outline-none"
            >
              <option value="card">Card</option>
              <option value="text">Text Block</option>
              <option value="metric">Key Metric</option>
              <option value="rocket">Vector Icon</option>
            </select>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (isPlaying) setIsPlaying(false);
              else triggerPlay(currentTime >= totalDuration ? 0 : currentTime);
            }}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)] whitespace-nowrap"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={resetPreview}
            title="Reset to start"
            aria-label="Reset animation preview"
            className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setSpeed(speed === 1 ? 0.5 : 1)}
            className={`min-h-[32px] rounded-lg border px-2 font-mono-tabular text-[11px] font-medium whitespace-nowrap ${
              speed === 0.5
                ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            {speed}×
          </button>

          <button
            type="button"
            onClick={() => setLoopPlayback(!loopPlayback)}
            className={`min-h-[32px] rounded-lg border px-2.5 text-[11px] font-medium whitespace-nowrap ${
              loopPlayback
                ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            Loop
          </button>

          <LabPanelToggles leftLabel="Effects" rightLabel="Options" />
        </div>
      </div>

      {/* Live Preview Stage */}
      <div
        ref={stageContainerRef}
        className="relative flex flex-1 min-h-[180px] items-center justify-center overflow-hidden bg-[var(--bg-canvas-well)] p-3"
      >
        <div
          ref={stageBoxRef}
          onPointerDown={(e) => {
            if (!isDrawingPath) return;
            const pt = toStagePoint(e.clientX, e.clientY);
            setDraftPoints([pt]);
          }}
          onPointerMove={(e) => {
            if (!isDrawingPath || e.buttons === 0) return;
            const pt = toStagePoint(e.clientX, e.clientY);
            setDraftPoints((prev) => [...prev, pt]);
          }}
          onPointerUp={() => {
            if (!isDrawingPath || draftPoints.length < 2) return;
            patchInspectedAnim({ customPoints: draftPoints });
            setIsDrawingPath(false);
            setDraftPoints([]);
            triggerPlay(0);
          }}
          style={{
            width: dims.width * stageScale,
            height: dims.height * stageScale,
            cursor: isDrawingPath ? 'crosshair' : 'default',
          }}
          className="relative shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/30 touch-none"
        >
          <div
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${stageScale})`,
              transformOrigin: 'top left',
              background: bgCss,
            }}
            className="relative overflow-hidden"
          >
            {/* Motion Path Trail Visualiser */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              {labElements.map((el) =>
                el.animations
                  .filter((a) => a.category === 'motion-path')
                  .map((anim) => {
                    const d = getMotionPathPreviewSvg(el, anim);
                    if (!d) return null;
                    return (
                      <path
                        key={anim.id}
                        d={d}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={4}
                        strokeDasharray="10 8"
                        opacity={0.7}
                      />
                    );
                  }),
              )}
              {draftPoints.length > 1 && (
                <path
                  d={draftPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Elements */}
            {labElements.map((el) => (
              <div
                key={el.id}
                onClick={() => {
                  if (targetSource !== 'slide') return;
                  if (isPainterActive) {
                    applyAnimationPainterTo(el.id);
                    return;
                  }
                  selectElements([el.id], false);
                  if (el.animations[0]) setSelectedAnimationId(el.animations[0].id);
                }}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  transform: `rotate(${el.rotation}deg)`,
                  cursor: targetSource === 'slide' ? (isPainterActive ? 'copy' : 'pointer') : 'default',
                }}
              >
                <AnimatedElementWrapper
                  element={el}
                  scheduledItems={scheduledItems}
                  currentTime={currentTime}
                  isPlayingOrPreviewing={isPlaying || currentTime > 0}
                  reduceMotion={settings.reduceMotion}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scrubber Strip Overlay */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)]/90 px-3 py-1.5 backdrop-blur-md text-[11px]">
          <span className="font-mono-tabular text-[var(--text-secondary)]">
            {currentTime.toFixed(2)}s
          </span>
          <input
            type="range"
            aria-label="Animation timeline scrubber"
            min={0}
            max={Math.max(0.2, totalDuration)}
            step={0.01}
            value={Math.min(currentTime, Math.max(0.2, totalDuration))}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(Number(e.target.value));
            }}
            className="flex-1 accent-[var(--accent-500)]"
          />
          <span className="font-mono-tabular text-[var(--text-muted)]">
            {totalDuration.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Bottom Animation Pane & Timeline */}
      <div className="h-48 sm:h-52 shrink-0 border-t border-[var(--border-subtle)] overflow-hidden">
        <AnimationPaneTimeline
          elements={labElements}
          selectedElementId={inspectedTarget?.element.id ?? null}
          selectedAnimationId={inspectedAnim.id}
          currentTime={currentTime}
          isPainterActive={targetSource === 'slide' ? isPainterActive : false}
          onSelectAnimation={(elId, animId) => {
            if (targetSource === 'slide') selectElements([elId], false);
            setSelectedAnimationId(animId);
          }}
          onUpdateTiming={(elId, animId, delay, duration) => {
            if (targetSource === 'slide') {
              updateElementAnimation(elId, animId, { delay, duration }, false);
            } else if (activeRecipe) {
              setActiveRecipe({
                ...activeRecipe,
                elements: activeRecipe.elements.map((el) =>
                  el.id === elId
                    ? {
                        ...el,
                        animations: el.animations.map((a) =>
                          a.id === animId ? { ...a, delay, duration } : a,
                        ),
                      }
                    : el,
                ),
              });
            } else {
              setSandboxAnim((prev) => ({ ...prev, delay, duration }));
            }
          }}
          onReorderAnimation={(animId, dir) => {
            if (targetSource === 'slide') reorderSlideAnimation(animId, dir);
          }}
          onRemoveAnimation={(elId, animId) => {
            if (targetSource === 'slide') removeElementAnimation(elId, animId);
          }}
          onPlayFrom={(startTime) => triggerPlay(startTime)}
          onTogglePainter={
            targetSource === 'slide'
              ? (elId) => {
                  if (isPainterActive) cancelAnimationPainter();
                  else activateAnimationPainter(elId);
                }
              : undefined
          }
        />
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Mobile/Tablet Section Switcher (< 1024px) */}
      <div className="lg:hidden grid grid-cols-4 gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 shrink-0">
        {(
          [
            ['stage', 'Stage', Play],
            ['effects', 'Effects', Sparkles],
            ['options', 'Options', BookOpen],
            ['timeline', 'Timeline', Check],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileSection(id)}
            className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg text-xs font-semibold ${
              mobileSection === id
                ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Desktop 3-Zone Animation Lab (>= 1024px) */}
      <div
        className={`hidden lg:grid flex-1 min-h-0 overflow-hidden ${
          panels.labLeft && panels.labRight
            ? 'grid-cols-[290px_1fr_290px] xl:grid-cols-[316px_1fr_308px]'
            : panels.labLeft
              ? 'grid-cols-[290px_1fr] xl:grid-cols-[316px_1fr]'
              : panels.labRight
                ? 'grid-cols-[1fr_290px] xl:grid-cols-[1fr_308px]'
                : 'grid-cols-[1fr]'
        }`}
      >
        {panels.labLeft && (
          <div className="min-h-0 border-r border-[var(--border-subtle)] overflow-hidden">
            {renderEffectsAndGuidePanel()}
          </div>
        )}
        <div className="min-w-0 min-h-0 overflow-hidden">{renderStageAndTimeline()}</div>
        {panels.labRight && (
          <div className="min-h-0 border-l border-[var(--border-subtle)] overflow-hidden">
            {renderOptionsInspector()}
          </div>
        )}
      </div>

      {/* Mobile / Tablet Active Section */}
      <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
        {mobileSection === 'stage' && renderStageAndTimeline()}
        {mobileSection === 'effects' && renderEffectsAndGuidePanel()}
        {mobileSection === 'options' && renderOptionsInspector()}
        {mobileSection === 'timeline' && (
          <AnimationPaneTimeline
            elements={labElements}
            selectedElementId={inspectedTarget?.element.id ?? null}
            selectedAnimationId={inspectedAnim.id}
            currentTime={currentTime}
            onSelectAnimation={(elId, animId) => {
              if (targetSource === 'slide') selectElements([elId], false);
              setSelectedAnimationId(animId);
            }}
            onUpdateTiming={(elId, animId, delay, duration) => {
              if (targetSource === 'slide') updateElementAnimation(elId, animId, { delay, duration }, false);
              else setSandboxAnim((prev) => ({ ...prev, delay, duration }));
            }}
            onReorderAnimation={(animId, dir) => {
              if (targetSource === 'slide') reorderSlideAnimation(animId, dir);
            }}
            onRemoveAnimation={(elId, animId) => {
              if (targetSource === 'slide') removeElementAnimation(elId, animId);
            }}
            onPlayFrom={(startTime) => {
              setMobileSection('stage');
              triggerPlay(startTime);
            }}
          />
        )}
      </div>

      {appliedBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 right-4 z-50 rounded-xl border border-emerald-500/40 bg-emerald-950/95 px-4 py-2 text-xs font-medium text-emerald-100 shadow-xl"
        >
          {appliedBanner}
        </div>
      )}
    </div>
  );
};
