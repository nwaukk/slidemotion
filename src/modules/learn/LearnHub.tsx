import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Keyboard,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trophy,
} from 'lucide-react';
import {
  CHEAT_SHEET_ENTRIES,
  CheatSheetEntry,
  DO_DONT_GALLERY,
  GLOSSARY_ENTRIES,
  KEYBOARD_SHORTCUT_GROUPS,
  LEARNING_PATH_STEPS,
  LEARNING_PATHS,
  LearningPathLevel,
  QUIZ_QUESTIONS,
} from '../../data/learnContent';
import { GUIDED_BADGES, GUIDED_LESSONS } from '../../data/guidedLessons';
import { useStudioStore } from '../../store/useStudioStore';

type LearnTab = 'paths' | 'cheatsheet' | 'gallery' | 'quiz' | 'glossary' | 'progress';

const LEARN_PROGRESS_KEY = 'slidemotion-learn-progress-v1';
const GUIDED_PROGRESS_KEY = 'slidemotion-guided-progress-v1';

interface LearnProgressState {
  completedStepIds: string[];
  quizAnswers: Record<string, number>;
}

function loadLearnProgress(): LearnProgressState {
  try {
    const raw = localStorage.getItem(LEARN_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LearnProgressState>;
      return {
        completedStepIds: Array.isArray(parsed.completedStepIds) ? parsed.completedStepIds : [],
        quizAnswers: parsed.quizAnswers && typeof parsed.quizAnswers === 'object' ? parsed.quizAnswers : {},
      };
    }
  } catch {
    // Ignore storage read error
  }
  return { completedStepIds: [], quizAnswers: {} };
}

function saveLearnProgress(state: LearnProgressState): void {
  try {
    localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write error
  }
}

function loadGuidedSummary(): { completedLessons: string[]; earnedBadges: string[] } {
  try {
    const raw = localStorage.getItem(GUIDED_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { completedLessons?: string[]; earnedBadges?: string[] };
      return {
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      };
    }
  } catch {
    // Ignore read error
  }
  return { completedLessons: [], earnedBadges: [] };
}

const DoDontVisualPreview: React.FC<{ id: string; motionActive: boolean }> = ({ id, motionActive }) => {
  if (id === 'dd-hierarchy') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Don't */}
        <div className="aspect-video rounded-xl border border-rose-500/35 bg-slate-900 p-4 flex flex-col justify-between overflow-hidden text-slate-300">
          <div className="text-[11px] font-bold text-rose-400">Quarterly Product & Operations Update</div>
          <div className="text-[9px] leading-snug space-y-1 text-slate-400">
            <p>• First quarter revenue grew compared to last year across EMEA and APAC regions due to enterprise renewals and expansion.</p>
            <p>• Engineering shipped 42 updates including faster chart rendering, improved login, and mobile layout support.</p>
            <p>• Support response times dropped from 8 hours to 2 hours while customer satisfaction reached 94% overall.</p>
            <p>• Next quarter we will focus on onboarding automation, partner channels and training workshops.</p>
          </div>
          <div className="text-[8px] text-slate-500">Confidential · Slide 4 · Notes attached below</div>
        </div>
        {/* Do */}
        <div className="aspect-video rounded-xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 to-indigo-950 p-4 flex flex-col justify-between overflow-hidden">
          <div className="text-xs font-bold text-white">Q1 Key Outcomes</div>
          <div className="grid grid-cols-3 gap-2 my-auto">
            {[
              { n: '01', k: '+34%', l: 'Enterprise Growth' },
              { n: '02', k: '2 hrs', l: 'Support Response' },
              { n: '03', k: '94%', l: 'Client CSAT' },
            ].map((card) => (
              <div key={card.n} className="rounded-lg border border-white/10 bg-white/5 p-2 space-y-0.5">
                <div className="text-[9px] font-mono-tabular text-sky-400">{card.n}</div>
                <div className="text-sm font-bold text-white">{card.k}</div>
                <div className="text-[9px] text-slate-300 leading-tight">{card.l}</div>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-slate-400">Clean hierarchy · 3 focal anchors</div>
        </div>
      </div>
    );
  }

  if (id === 'dd-contrast') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="aspect-video rounded-xl border border-rose-500/35 bg-[#4f6478] p-4 flex flex-col justify-center gap-1.5">
          <div className="text-sm font-semibold text-[#798fa3]">Strategic Roadmap 2026</div>
          <div className="text-[10px] text-[#6d8296]">
            Pale grey text on a mid-tone slate backdrop loses legibility on conference projectors.
          </div>
        </div>
        <div className="aspect-video rounded-xl border border-emerald-500/40 bg-[#0b1324] p-4 flex flex-col justify-center gap-1.5">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-sky-400">2026 Strategy</div>
          <div className="text-base font-bold text-white">Strategic Roadmap</div>
          <div className="text-[10px] text-slate-200 leading-relaxed">
            High luminance contrast and clear typographic scale stay crisp from the back row.
          </div>
        </div>
      </div>
    );
  }

  if (id === 'dd-motion') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="aspect-video rounded-xl border border-rose-500/35 bg-slate-900 p-4 flex flex-col justify-between overflow-hidden">
          <div className="text-[10px] font-semibold text-rose-300">Mixed Direction & Spin</div>
          <div className="grid grid-cols-3 gap-2 my-auto">
            <div
              className="rounded-lg bg-rose-500/20 border border-rose-400/40 p-2 text-center text-[10px] text-white transition-transform duration-700"
              style={{ transform: motionActive ? 'rotate(-14deg) translateY(-10px)' : 'none' }}
            >
              Spin
            </div>
            <div
              className="rounded-lg bg-amber-500/20 border border-amber-400/40 p-2 text-center text-[10px] text-white transition-transform duration-700"
              style={{ transform: motionActive ? 'scale(1.18) translateY(8px)' : 'none' }}
            >
              Bounce
            </div>
            <div
              className="rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 p-2 text-center text-[10px] text-white transition-transform duration-700"
              style={{ transform: motionActive ? 'rotate(18deg) translateX(6px)' : 'none' }}
            >
              Swivel
            </div>
          </div>
          <div className="text-[9px] text-slate-400">Competing vectors distract viewers</div>
        </div>
        <div className="aspect-video rounded-xl border border-emerald-500/40 bg-slate-900 p-4 flex flex-col justify-between overflow-hidden">
          <div className="text-[10px] font-semibold text-emerald-300">Unified Staggered Float (0.15s)</div>
          <div className="grid grid-cols-3 gap-2 my-auto">
            {['Step 1', 'Step 2', 'Step 3'].map((label, i) => (
              <div
                key={label}
                className="rounded-lg bg-sky-500/20 border border-sky-400/40 p-2 text-center text-[10px] text-white transition-all duration-500"
                style={{
                  transitionDelay: `${i * 140}ms`,
                  transform: motionActive ? 'translateY(0px)' : 'translateY(10px)',
                  opacity: motionActive ? 1 : 0.45,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="text-[9px] text-slate-300">Consistent upward rhythm & delay</div>
        </div>
      </div>
    );
  }

  // dd-morph
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="aspect-video rounded-xl border border-rose-500/35 bg-slate-900 p-4 flex flex-col justify-between">
        <div className="text-[10px] font-semibold text-rose-300">Broken Names: "Box 1" → "Summary"</div>
        <div className="flex items-center justify-between gap-3 my-auto">
          <div
            className="h-12 w-16 rounded-lg bg-slate-700 border border-white/15 flex items-center justify-center text-[9px] text-slate-200 transition-opacity duration-500"
            style={{ opacity: motionActive ? 0.25 : 1 }}
          >
            Box 1
          </div>
          <span className="text-[10px] text-rose-400">Cross-fade jump</span>
          <div
            className="h-14 w-24 rounded-lg bg-rose-500/25 border border-rose-400/50 flex items-center justify-center text-[9px] text-white transition-opacity duration-500"
            style={{ opacity: motionActive ? 1 : 0.25 }}
          >
            Summary
          </div>
        </div>
        <div className="text-[9px] text-slate-400">No shared !! identity</div>
      </div>

      <div className="aspect-video rounded-xl border border-emerald-500/40 bg-slate-900 p-4 flex flex-col justify-between">
        <div className="text-[10px] font-semibold text-emerald-300">Matched: !!HeroCard → !!HeroCard</div>
        <div className="relative h-16 my-auto rounded-lg bg-white/5 overflow-hidden flex items-center px-3">
          <div
            className="rounded-lg bg-sky-500/80 border border-sky-300 flex items-center justify-center text-[9px] font-semibold text-white transition-all duration-700"
            style={{
              width: motionActive ? '108px' : '58px',
              height: motionActive ? '46px' : '32px',
              transform: motionActive ? 'translateX(118px)' : 'translateX(0px)',
            }}
          >
            !!HeroCard
          </div>
        </div>
        <div className="text-[9px] text-slate-300">Smooth position + scale glide</div>
      </div>
    </div>
  );
};

export const LearnHub: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const [tab, setTab] = useState<LearnTab>('paths');
  const [selectedLevel, setSelectedLevel] = useState<LearningPathLevel>('beginner');
  const [cheatFilter, setCheatFilter] = useState<'all' | CheatSheetEntry['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [galleryAnimated, setGalleryAnimated] = useState(true);

  const [progress, setProgress] = useState<LearnProgressState>(() => loadLearnProgress());
  const guidedSummary = useMemo(() => loadGuidedSummary(), []);

  const toggleStepComplete = (stepId: string) => {
    setProgress((prev) => {
      const exists = prev.completedStepIds.includes(stepId);
      const next: LearnProgressState = {
        ...prev,
        completedStepIds: exists
          ? prev.completedStepIds.filter((id) => id !== stepId)
          : [...prev.completedStepIds, stepId],
      };
      saveLearnProgress(next);
      return next;
    });
  };

  const selectQuizAnswer = (questionId: string, optionIdx: number) => {
    setProgress((prev) => {
      const next: LearnProgressState = {
        ...prev,
        quizAnswers: { ...prev.quizAnswers, [questionId]: optionIdx },
      };
      saveLearnProgress(next);
      return next;
    });
  };

  const resetQuiz = () => {
    setProgress((prev) => {
      const next: LearnProgressState = { ...prev, quizAnswers: {} };
      saveLearnProgress(next);
      return next;
    });
  };

  const quizStats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      const ans = progress.quizAnswers[q.id];
      if (ans !== undefined) {
        answered += 1;
        if (ans === q.correctIndex) correct += 1;
      }
    });
    return { answered, correct, total: QUIZ_QUESTIONS.length };
  }, [progress.quizAnswers]);

  const activeDeckAudit = useMemo(() => {
    const slides = project.slides;
    const withNotes = slides.filter((s) => s.notes && s.notes.trim().length > 0).length;
    const usingMaster = slides.filter((s) => s.useMaster).length;
    const morphSlides = slides.filter((s) => s.transition.type === 'morph').length;
    const animatedElements = slides.reduce(
      (sum, s) => sum + s.elements.filter((el) => el.animations.length > 0).length,
      0,
    );
    return { totalSlides: slides.length, withNotes, usingMaster, morphSlides, animatedElements };
  }, [project.slides]);

  const filteredCheatEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CHEAT_SHEET_ENTRIES.filter((entry) => {
      if (cheatFilter !== 'all' && entry.category !== cheatFilter) return false;
      if (!q) return true;
      return (
        entry.topic.toLowerCase().includes(q) ||
        entry.rule.toLowerCase().includes(q) ||
        entry.whenToUse.toLowerCase().includes(q)
      );
    });
  }, [cheatFilter, searchQuery]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return GLOSSARY_ENTRIES;
    return GLOSSARY_ENTRIES.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q),
    );
  }, [glossaryQuery]);

  const tabs: Array<{ id: LearnTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'paths', label: 'Learning Paths', icon: Compass },
    { id: 'cheatsheet', label: 'Cheat Sheet', icon: Layers },
    { id: 'gallery', label: 'Do & Don’t Gallery', icon: Sparkles },
    { id: 'quiz', label: 'Scenario Quiz', icon: HelpCircle },
    { id: 'glossary', label: 'Glossary & Shortcuts', icon: Keyboard },
    { id: 'progress', label: 'Progress Dashboard', icon: Trophy },
  ];

  const totalStepsDone = progress.completedStepIds.length;
  const totalStepsCount = LEARNING_PATH_STEPS.length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Top Header & Sub-Navigation */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 pt-3 pb-2 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <BookOpen className="h-4 w-4 text-[var(--accent-500)]" />
            <span className="font-display text-sm font-bold text-[var(--text-primary)]">
              SlideMotion Learn Hub
            </span>
            <span className="hidden sm:inline text-[var(--text-muted)]">
              · Structured Slide Design, Motion Craft & Keynote Readiness
            </span>
          </div>
          <div className="font-mono-tabular text-xs text-[var(--text-secondary)]">
            {totalStepsDone}/{totalStepsCount} lessons · {quizStats.correct}/{quizStats.total} quiz score
          </div>
        </div>

        <nav aria-label="Learn Hub sections" className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Scrollable Hub Content */}
      <div className="studio-scroll flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* TAB 1: LEARNING PATHS */}
          {tab === 'paths' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {LEARNING_PATHS.map((path) => {
                  const stepsForLevel = LEARNING_PATH_STEPS.filter((s) => s.level === path.level);
                  const doneForLevel = stepsForLevel.filter((s) =>
                    progress.completedStepIds.includes(s.id),
                  ).length;
                  const active = selectedLevel === path.level;
                  return (
                    <button
                      key={path.level}
                      type="button"
                      onClick={() => setSelectedLevel(path.level)}
                      className={`rounded-2xl border p-4 text-left transition-colors space-y-2 ${
                        active
                          ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-[var(--text-primary)]">
                          {path.title}
                        </span>
                        <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-500)]">
                          {doneForLevel}/{stepsForLevel.length}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[var(--text-secondary)]">{path.subtitle}</div>
                      <p className="text-xs leading-relaxed text-[var(--text-muted)]">{path.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEARNING_PATH_STEPS.filter((s) => s.level === selectedLevel).map((step) => {
                  const done = progress.completedStepIds.includes(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col justify-between rounded-2xl border p-5 space-y-4 ${
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-panel)]'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono-tabular font-semibold text-[var(--accent-500)]">
                            Module Step {step.stepNumber} · {step.durationMinutes} min
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleStepComplete(step.id)}
                            className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2.5 text-xs font-medium ${
                              done
                                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{done ? 'Completed' : 'Mark Complete'}</span>
                          </button>
                        </div>

                        <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                          {step.title}
                        </h2>
                        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{step.summary}</p>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 text-xs text-[var(--text-primary)]">
                          <strong>Key Takeaway:</strong> {step.keyTakeaway}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveModule(step.targetModule)}
                        className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-600)] px-4 text-xs font-semibold text-[var(--accent-contrast)]"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>{step.actionLabel}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CHEAT SHEET */}
          {tab === 'cheatsheet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(['all', 'structure', 'transitions', 'animations', 'merge'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCheatFilter(cat)}
                      className={`min-h-[36px] rounded-lg border px-3 font-medium capitalize ${
                        cheatFilter === cat
                          ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {cat === 'merge' ? 'Merge Shapes' : cat}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter rules & topics..."
                    aria-label="Filter cheat sheet"
                    className="min-h-[38px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCheatEntries.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">{item.topic}</h2>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">{item.rule}</p>
                    <div className="space-y-1 pt-1 text-xs text-[var(--text-secondary)]">
                      <div>
                        <strong className="text-emerald-400">When to use:</strong> {item.whenToUse}
                      </div>
                      <div>
                        <strong className="text-rose-400">Avoid when:</strong> {item.avoidWhen}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DO & DON'T GALLERY */}
          {tab === 'gallery' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                <div>
                  <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    Live Do & Don’t Comparison Gallery
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Compare common slide mistakes side by side against clean studio principles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryAnimated((v) => !v)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--accent-600)] px-3.5 text-xs font-semibold text-[var(--accent-contrast)]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{galleryAnimated ? 'Reset Motion Cards' : 'Trigger Motion Demo'}</span>
                </button>
              </div>

              <div className="space-y-5">
                {DO_DONT_GALLERY.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">{item.title}</h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
                        {item.category}
                      </span>
                    </div>

                    <DoDontVisualPreview id={item.id} motionActive={galleryAnimated} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-1">
                        <div className="inline-flex items-center gap-1.5 font-semibold text-rose-400">
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>{item.dontTitle}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{item.dontReason}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                        <div className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{item.doTitle}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{item.doReason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SCENARIO QUIZ */}
          {tab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                <div className="space-y-0.5">
                  <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    Scenario-Based Design & Motion Quiz
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Answered {quizStats.answered} of {quizStats.total} · Score:{' '}
                    <strong className="text-[var(--accent-500)]">
                      {quizStats.correct}/{quizStats.total}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Quiz</span>
                </button>
              </div>

              <div className="space-y-4">
                {QUIZ_QUESTIONS.map((q, qIdx) => {
                  const chosen = progress.quizAnswers[q.id];
                  const isAnswered = chosen !== undefined;
                  const isCorrect = chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono-tabular font-semibold text-[var(--accent-500)]">
                          Scenario {qIdx + 1} · {q.category}
                        </span>
                        {isAnswered && (
                          <span className={`font-semibold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCorrect ? 'Correct' : 'Needs Review'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">{q.scenario}</p>

                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const selected = chosen === optIdx;
                          const rightOpt = optIdx === q.correctIndex;
                          let styleCls =
                            'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)]';
                          if (isAnswered) {
                            if (rightOpt) {
                              styleCls = 'border-emerald-500/60 bg-emerald-500/15 text-[var(--text-primary)]';
                            } else if (selected) {
                              styleCls = 'border-rose-500/60 bg-rose-500/15 text-[var(--text-primary)]';
                            }
                          }
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => selectQuizAnswer(q.id, optIdx)}
                              className={`min-h-[42px] rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${styleCls}`}
                            >
                              <span className="font-mono-tabular mr-2 font-semibold text-[var(--accent-500)]">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 text-xs">
                          <p className="flex-1 leading-relaxed text-[var(--text-secondary)]">
                            <strong className="text-[var(--text-primary)]">Explanation:</strong> {q.explanation}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveModule(q.practiceModule)}
                            className="shrink-0 rounded-lg bg-[var(--accent-600)] px-3 py-1.5 font-semibold text-[var(--accent-contrast)]"
                          >
                            Practise in Lab
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: GLOSSARY & SHORTCUTS */}
          {tab === 'glossary' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Presentation & Motion Glossary
                  </h2>
                  <div className="relative min-w-[220px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="search"
                      value={glossaryQuery}
                      onChange={(e) => setGlossaryQuery(e.target.value)}
                      placeholder="Search terms..."
                      aria-label="Search glossary terms"
                      className="min-h-[38px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredGlossary.map((entry) => (
                    <div
                      key={entry.term}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-2"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-500)]">
                        {entry.category}
                      </div>
                      <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">{entry.term}</h3>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{entry.definition}</p>
                      <div className="pt-1 text-[11px] text-[var(--text-muted)]">
                        <strong className="text-[var(--text-primary)]">Pro Tip:</strong> {entry.proTip}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                  Keyboard Shortcuts Reference
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {KEYBOARD_SHORTCUT_GROUPS.map((grp) => (
                    <div
                      key={grp.group}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-3"
                    >
                      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--accent-500)]">
                        {grp.group}
                      </h3>
                      <div className="space-y-2 text-xs">
                        {grp.items.map((item) => (
                          <div key={item.keys} className="flex items-start justify-between gap-3">
                            <kbd className="shrink-0 rounded-md border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-[var(--text-primary)]">
                              {item.keys}
                            </kbd>
                            <span className="text-right text-[var(--text-secondary)]">{item.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 6: PROGRESS DASHBOARD */}
          {tab === 'progress' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-1.5">
                  <div className="text-xs text-[var(--text-muted)]">Learning Path Progress</div>
                  <div className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    {Math.round((totalStepsDone / Math.max(1, totalStepsCount)) * 100)}%
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {totalStepsDone} of {totalStepsCount} path steps marked complete
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-1.5">
                  <div className="text-xs text-[var(--text-muted)]">Scenario Quiz Score</div>
                  <div className="font-display text-2xl font-bold text-[var(--accent-500)]">
                    {quizStats.correct} / {quizStats.total}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {quizStats.answered} scenarios attempted
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-1.5">
                  <div className="text-xs text-[var(--text-muted)]">Guided Studio Lessons</div>
                  <div className="font-display text-2xl font-bold text-emerald-400">
                    {guidedSummary.completedLessons.length} / {GUIDED_LESSONS.length}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {guidedSummary.earnedBadges.length} skill badges unlocked
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 space-y-1.5">
                  <div className="text-xs text-[var(--text-muted)]">Active Deck Readiness</div>
                  <div className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    {activeDeckAudit.totalSlides} Slides
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {activeDeckAudit.withNotes} with speaker notes · {activeDeckAudit.morphSlides} Morph
                  </div>
                </div>
              </div>

              {/* Earned Guided Studio Badges */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[var(--accent-500)]" />
                    <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                      Guided Studio Skill Badges
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModule('guided')}
                    className="text-xs font-semibold text-[var(--accent-500)] hover:underline"
                  >
                    Open Guided Studio
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {GUIDED_BADGES.map((badge) => {
                    const earned = guidedSummary.earnedBadges.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`rounded-xl border p-3.5 space-y-1 text-xs ${
                          earned
                            ? 'border-amber-400/50 bg-amber-500/10'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-semibold text-[var(--text-primary)]">
                          <span>{badge.title}</span>
                          <span className={earned ? 'text-amber-400' : 'text-[var(--text-muted)]'}>
                            {earned ? 'Earned' : 'Locked'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{badge.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Project Deck Health Check */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--accent-500)]" />
                  <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    Active Project Audit · “{project.name}”
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3">
                    <div className="font-semibold text-[var(--text-primary)]">Master Theme Consistency</div>
                    <div className="mt-1 text-[var(--text-secondary)]">
                      {activeDeckAudit.usingMaster} of {activeDeckAudit.totalSlides} slides inherit the Slide Master.
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3">
                    <div className="font-semibold text-[var(--text-primary)]">Motion & Morph Usage</div>
                    <div className="mt-1 text-[var(--text-secondary)]">
                      {activeDeckAudit.animatedElements} animated elements · {activeDeckAudit.morphSlides} Morph slides.
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3">
                    <div className="font-semibold text-[var(--text-primary)]">Speaker Notes Coverage</div>
                    <div className="mt-1 text-[var(--text-secondary)]">
                      {activeDeckAudit.withNotes} of {activeDeckAudit.totalSlides} slides include Presenter notes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
