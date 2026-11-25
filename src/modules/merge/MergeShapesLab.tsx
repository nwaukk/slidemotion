import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Eye,
  Layers,
  Plus,
  RotateCcw,
  Send,
  Shapes,
  Sparkles,
  Trash2,
  Trophy,
  Undo2,
} from 'lucide-react';
import {
  MERGE_CHALLENGES,
  MERGE_OPERATIONS,
  SANDBOX_STARTER_SHAPES,
} from '../../data/mergeShapes';
import { STAGE_DIMENSIONS } from '../../data/themes';
import {
  countHoles,
  LAB_CANVAS_HEIGHT,
  LAB_CANVAS_WIDTH,
  LabPrimitiveKind,
  LabShape,
  MergeOperation,
  multiPolygonArea,
  multiPolygonBounds,
  multiPolygonToNormalisedPath,
  multiPolygonToSvgPath,
  runBooleanOperation,
  shapeToMultiPolygon,
  transformMultiPolygon,
} from '../../engine/booleanGeometry';
import { LabPanelToggles } from '../../components/LabPanelToggles';
import { useStudioStore } from '../../store/useStudioStore';

type LabMode = 'sandbox' | 'challenges';
type MobilePane = 'canvas' | 'tools' | 'explain';

const PRIMITIVE_BUTTONS: Array<{ kind: LabPrimitiveKind; label: string; colour: string }> = [
  { kind: 'circle', label: 'Circle', colour: '#38bdf8' },
  { kind: 'rounded-rectangle', label: 'Rounded', colour: '#818cf8' },
  { kind: 'rectangle', label: 'Square', colour: '#34d399' },
  { kind: 'triangle', label: 'Triangle', colour: '#fbbf24' },
  { kind: 'star', label: 'Star', colour: '#f472b6' },
  { kind: 'diamond', label: 'Diamond', colour: '#22d3ee' },
  { kind: 'hexagon', label: 'Hexagon', colour: '#a78bfa' },
  { kind: 'arrow', label: 'Arrow', colour: '#fb923c' },
  { kind: 'chevron', label: 'Chevron', colour: '#2dd4bf' },
];

function cloneShapes(list: LabShape[]): LabShape[] {
  return JSON.parse(JSON.stringify(list)) as LabShape[];
}

export const MergeShapesLab: React.FC = () => {
  const project = useStudioStore((s) => s.project);
  const panels = useStudioStore((s) => s.settings.panels);
  const addFreeformElement = useStudioStore((s) => s.addFreeformElement);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const [labMode, setLabMode] = useState<LabMode>('sandbox');
  const [mobilePane, setMobilePane] = useState<MobilePane>('canvas');

  const [shapes, setShapes] = useState<LabShape[]>(() => cloneShapes(SANDBOX_STARTER_SHAPES));
  const [history, setHistory] = useState<LabShape[][]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => SANDBOX_STARTER_SHAPES.map((s) => s.id));

  const [activeOpInfo, setActiveOpInfo] = useState<MergeOperation>('subtract');
  const [hoverOp, setHoverOp] = useState<MergeOperation | null>(null);
  const [lastOp, setLastOp] = useState<MergeOperation | null>(null);

  // Challenges state
  const [activeChallengeId, setActiveChallengeId] = useState<string>(MERGE_CHALLENGES[0].id);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [challengeResult, setChallengeResult] = useState<{ passed: boolean; feedback: string } | null>(null);
  const [showTargetGuide, setShowTargetGuide] = useState(true);

  // Toast / status feedback
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Drag / Resize tracking
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<{
    type: 'move' | 'resize';
    shapeId: string;
    startClientX: number;
    startClientY: number;
    moved: boolean;
    initialShapes: LabShape[];
    initialShape: LabShape;
  } | null>(null);

  const activeChallenge = MERGE_CHALLENGES.find((c) => c.id === activeChallengeId) ?? MERGE_CHALLENGES[0];

  const orderedSelectedShapes = useMemo(
    () => selectedIds.map((id) => shapes.find((s) => s.id === id)).filter((s): s is LabShape => Boolean(s)),
    [selectedIds, shapes],
  );

  // Preview ghost for hovered operation
  const previewPieces = useMemo(() => {
    if (!hoverOp || orderedSelectedShapes.length < 2) return [];
    return runBooleanOperation(orderedSelectedShapes, hoverOp);
  }, [hoverOp, orderedSelectedShapes]);

  // Challenge target ghost path
  const challengeTargetPath = useMemo(() => {
    if (labMode !== 'challenges') return '';
    if (activeChallenge.id === 'keyhole') {
      const ref = activeChallenge.starterShapes;
      const plug = runBooleanOperation([ref[1], ref[2]], 'union');
      if (plug[0]) {
        const plugShape: LabShape = {
          id: 'tmp-plug',
          name: 'Plug',
          kind: 'boolean',
          x: plug[0].bounds.minX,
          y: plug[0].bounds.minY,
          w: plug[0].bounds.w,
          h: plug[0].bounds.h,
          rotation: 0,
          colour: '#ffffff',
          multiPolygon: plug[0].multiPolygon,
        };
        const res = runBooleanOperation([ref[0], plugShape], 'subtract');
        return res[0]?.svgPath ?? '';
      }
    }
    const res = runBooleanOperation(activeChallenge.starterShapes, activeChallenge.recommendedOp);
    return res[0]?.svgPath ?? '';
  }, [activeChallenge, labMode]);

  const pushHistory = (prevShapes: LabShape[]) => {
    setHistory((h) => [...h.slice(-29), cloneShapes(prevShapes)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setShapes(prev);
    setSelectedIds(prev.slice(0, 2).map((s) => s.id));
    setChallengeResult(null);
  };

  const loadSandbox = () => {
    setLabMode('sandbox');
    const fresh = cloneShapes(SANDBOX_STARTER_SHAPES);
    setShapes(fresh);
    setHistory([]);
    setSelectedIds(fresh.map((s) => s.id));
    setLastOp(null);
    setChallengeResult(null);
  };

  const loadChallenge = (challengeId: string) => {
    const ch = MERGE_CHALLENGES.find((c) => c.id === challengeId) ?? MERGE_CHALLENGES[0];
    setLabMode('challenges');
    setActiveChallengeId(ch.id);
    const fresh = cloneShapes(ch.starterShapes);
    setShapes(fresh);
    setHistory([]);
    setSelectedIds(fresh.map((s) => s.id));
    setActiveOpInfo(ch.recommendedOp);
    setLastOp(null);
    setChallengeResult(null);
  };

  const handleAddPrimitive = (kind: LabPrimitiveKind, defaultColour: string) => {
    pushHistory(shapes);
    const offset = (shapes.length % 4) * 28;
    const w = kind === 'arrow' ? 230 : 180;
    const h = kind === 'arrow' ? 140 : 180;
    const newShape: LabShape = {
      id: `sh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name: `${kind.replace('-', ' ').replace(/\b\w/g, (m) => m.toUpperCase())} ${shapes.length + 1}`,
      kind,
      x: 280 + offset,
      y: 140 + offset,
      w,
      h,
      rotation: 0,
      colour: defaultColour,
      cornerRadius: kind === 'rounded-rectangle' ? 26 : 0,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedIds((prev) => [...prev, newShape.id]);
  };

  const handleExecuteOp = (op: MergeOperation) => {
    if (orderedSelectedShapes.length < 2) return;
    const results = runBooleanOperation(orderedSelectedShapes, op);
    setActiveOpInfo(op);
    setLastOp(op);

    if (results.length === 0) {
      setSentNotice('That operation produced no overlapping area — adjust shapes and try again.');
      window.setTimeout(() => setSentNotice(null), 2600);
      return;
    }

    pushHistory(shapes);
    const consumedSet = new Set(selectedIds);
    const remaining = shapes.filter((s) => !consumedSet.has(s.id));

    const created: LabShape[] = results.map((piece, idx) => ({
      id: `bool-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      name:
        results.length > 1
          ? `Fragment ${idx + 1}`
          : `${op.charAt(0).toUpperCase() + op.slice(1)} Shape`,
      kind: 'boolean',
      x: piece.bounds.minX,
      y: piece.bounds.minY,
      w: piece.bounds.w,
      h: piece.bounds.h,
      rotation: 0,
      colour: piece.colour,
      multiPolygon: piece.multiPolygon,
    }));

    const nextShapes = [...remaining, ...created];
    setShapes(nextShapes);
    setSelectedIds(created.map((c) => c.id));
    setHoverOp(null);

    if (labMode === 'challenges') {
      const check = activeChallenge.validate(nextShapes, op);
      setChallengeResult(check);
      if (check.passed && !completedChallengeIds.includes(activeChallenge.id)) {
        setCompletedChallengeIds((prev) => [...prev, activeChallenge.id]);
      }
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const swapSelectionOrder = () => {
    if (selectedIds.length < 2) return;
    setSelectedIds((prev) => [...prev].reverse());
  };

  const deleteSelectedLabShapes = () => {
    if (selectedIds.length === 0) return;
    pushHistory(shapes);
    const delSet = new Set(selectedIds);
    setShapes((prev) => prev.filter((s) => !delSet.has(s.id)));
    setSelectedIds([]);
  };

  const updateSelectedColour = (colour: string) => {
    if (selectedIds.length === 0) return;
    const primaryId = selectedIds[0];
    setShapes((prev) => prev.map((s) => (s.id === primaryId ? { ...s, colour } : s)));
  };

  const updateSelectedRotation = (rotation: number) => {
    if (selectedIds.length === 0) return;
    const primaryId = selectedIds[0];
    setShapes((prev) => prev.map((s) => (s.id === primaryId && s.kind !== 'boolean' ? { ...s, rotation } : s)));
  };

  const handleSendToDesigner = (openDesignerAfter: boolean) => {
    const targets = orderedSelectedShapes.length > 0 ? orderedSelectedShapes : shapes;
    if (targets.length === 0) return;
    const dims = STAGE_DIMENSIONS[project.aspectRatio];
    const scaleFactor = 2.0;

    targets.forEach((sh, index) => {
      const mp = shapeToMultiPolygon(sh);
      const norm = multiPolygonToNormalisedPath(mp);
      const w = Math.max(60, Math.round(norm.w * scaleFactor));
      const h = Math.max(60, Math.round(norm.h * scaleFactor));
      const x = Math.round(dims.width / 2 - (LAB_CANVAS_WIDTH * scaleFactor) / 2 + norm.x * scaleFactor);
      const y = Math.round(dims.height / 2 - (LAB_CANVAS_HEIGHT * scaleFactor) / 2 + norm.y * scaleFactor);

      addFreeformElement({
        name: targets.length > 1 ? `${sh.name} (${index + 1})` : sh.name,
        path: norm.path,
        w,
        h,
        x,
        y,
        colour: sh.colour,
      });
    });

    if (openDesignerAfter) {
      setActiveModule('designer');
    } else {
      setSentNotice(
        `Sent ${targets.length} ${targets.length === 1 ? 'vector shape' : 'vector shapes'} to active slide in Designer`,
      );
      window.setTimeout(() => setSentNotice(null), 2800);
    }
  };

  // Pointer helpers for interactive SVG canvas
  const clientToSvgDelta = (dxClient: number, dyClient: number): { dx: number; dy: number } => {
    const svg = svgRef.current;
    if (!svg) return { dx: dxClient, dy: dyClient };
    const rect = svg.getBoundingClientRect();
    return {
      dx: (dxClient / Math.max(1, rect.width)) * LAB_CANVAS_WIDTH,
      dy: (dyClient / Math.max(1, rect.height)) * LAB_CANVAS_HEIGHT,
    };
  };

  const handleShapePointerDown = (e: React.PointerEvent, shape: LabShape) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      type: 'move',
      shapeId: shape.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      initialShapes: cloneShapes(shapes),
      initialShape: cloneShapes([shape])[0],
    };
  };

  const handleResizePointerDown = (e: React.PointerEvent, shape: LabShape) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      type: 'resize',
      shapeId: shape.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      initialShapes: cloneShapes(shapes),
      initialShape: cloneShapes([shape])[0],
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    if (!ds) return;
    const rawDx = e.clientX - ds.startClientX;
    const rawDy = e.clientY - ds.startClientY;
    if (Math.hypot(rawDx, rawDy) > 3) ds.moved = true;
    if (!ds.moved) return;

    const { dx, dy } = clientToSvgDelta(rawDx, rawDy);
    const orig = ds.initialShape;

    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== ds.shapeId) return s;
        if (ds.type === 'move') {
          if (orig.multiPolygon) {
            const shifted = transformMultiPolygon(orig.multiPolygon, dx, dy);
            const b = multiPolygonBounds(shifted);
            return { ...s, x: b.minX, y: b.minY, w: b.w, h: b.h, multiPolygon: shifted };
          }
          return { ...s, x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) };
        }
        // Resize
        const nextW = Math.max(36, Math.round(orig.w + dx));
        const nextH = Math.max(36, Math.round(orig.h + dy));
        if (orig.multiPolygon) {
          const sx = nextW / Math.max(1, orig.w);
          const sy = nextH / Math.max(1, orig.h);
          const scaled = transformMultiPolygon(orig.multiPolygon, 0, 0, sx, sy, orig.x, orig.y);
          const b = multiPolygonBounds(scaled);
          return { ...s, x: b.minX, y: b.minY, w: b.w, h: b.h, multiPolygon: scaled };
        }
        return { ...s, w: nextW, h: nextH };
      }),
    );
  };

  const handlePointerUp = () => {
    const ds = dragStateRef.current;
    if (!ds) return;
    dragStateRef.current = null;
    if (ds.moved) {
      pushHistory(ds.initialShapes);
    } else if (ds.type === 'move') {
      toggleSelectOrder(ds.shapeId);
    }
  };

  const primarySelected = orderedSelectedShapes[0];
  const primaryStats = useMemo(() => {
    if (!primarySelected) return null;
    const mp = shapeToMultiPolygon(primarySelected);
    return {
      area: Math.round(multiPolygonArea(mp)),
      holes: countHoles(mp),
      islands: mp.length,
    };
  }, [primarySelected]);

  const activeOpMeta = MERGE_OPERATIONS.find((o) => o.id === (hoverOp ?? activeOpInfo)) ?? MERGE_OPERATIONS[0];

  const renderToolsPanel = () => (
    <aside
      aria-label="Merge Operations and Shapes"
      className="flex h-full min-h-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-5">
        {/* 5 Boolean Operations */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">Merge Operations</h2>
            <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
              {orderedSelectedShapes.length} selected
            </span>
          </div>
          {orderedSelectedShapes.length < 2 && (
            <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-2 text-[11px] text-[var(--text-muted)]">
              Click 2 or more shapes in order on the canvas to enable boolean operations.
            </p>
          )}
          <div className="space-y-1.5">
            {MERGE_OPERATIONS.map((op) => {
              const disabled = orderedSelectedShapes.length < 2;
              const isHighlighted = (hoverOp ?? activeOpInfo) === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  disabled={disabled}
                  onMouseEnter={() => {
                    setHoverOp(op.id);
                    setActiveOpInfo(op.id);
                  }}
                  onMouseLeave={() => setHoverOp(null)}
                  onClick={() => handleExecuteOp(op.id)}
                  className={`flex w-full min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                    isHighlighted && !disabled
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{op.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {op.id === 'subtract' ? 'Keeps #1, cuts #2+' : op.tagline.slice(0, 34) + '…'}
                    </div>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-500)]">{op.symbol}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selection Order Inspector */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Selection Order
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={swapSelectionOrder}
                disabled={selectedIds.length < 2}
                title="Swap selection order (crucial for Subtract)"
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-500)] disabled:opacity-35"
              >
                <ArrowLeftRight className="h-3 w-3" />
                <span>Swap</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(shapes.map((s) => s.id))}
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-500)]"
              >
                All
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {shapes.map((sh) => {
              const orderIndex = selectedIds.indexOf(sh.id);
              const isSelected = orderIndex !== -1;
              return (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => toggleSelectOrder(sh.id)}
                  className={`flex w-full min-h-[38px] items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs ${
                    isSelected
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm border border-white/25"
                      style={{ backgroundColor: sh.colour }}
                    />
                    <span className="truncate font-medium text-[var(--text-primary)]">{sh.name}</span>
                  </div>
                  <span className="font-mono-tabular shrink-0 text-[11px] font-semibold text-[var(--accent-500)]">
                    {isSelected
                      ? orderIndex === 0
                        ? '#1 Base'
                        : `#${orderIndex + 1} Cutter`
                      : 'Click'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Add Shapes */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Add Shapes to Canvas
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {PRIMITIVE_BUTTONS.map((btn) => (
              <button
                key={btn.kind}
                type="button"
                onClick={() => handleAddPrimitive(btn.kind, btn.colour)}
                className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--text-primary)]"
              >
                <Plus className="h-3 w-3 text-[var(--accent-500)]" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );

  const renderExplainAndChallengesPanel = () => (
    <aside
      aria-label="Explain It and Challenges"
      className="flex h-full min-h-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-panel)]"
    >
      <div className="studio-scroll flex-1 overflow-y-auto p-4 space-y-5">
        {/* Challenge Mode Section */}
        {labMode === 'challenges' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                5 Geometry Challenges
              </h2>
              <span className="font-mono-tabular text-xs font-semibold text-emerald-400">
                {completedChallengeIds.length} / {MERGE_CHALLENGES.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {MERGE_CHALLENGES.map((ch) => {
                const active = ch.id === activeChallenge.id;
                const done = completedChallengeIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => loadChallenge(ch.id)}
                    className={`flex w-full min-h-[42px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs ${
                      active
                        ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--text-primary)] truncate">{ch.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {ch.difficulty} · Best: {ch.recommendedOp}
                      </div>
                    </div>
                    {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3.5 space-y-2.5 text-xs">
              <div className="font-semibold text-[var(--text-primary)]">{activeChallenge.title} Brief</div>
              <p className="leading-relaxed text-[var(--text-secondary)]">{activeChallenge.summary}</p>
              <div className="text-[11px] text-[var(--accent-500)]">
                <strong>Step Hint:</strong> {activeChallenge.stepHint}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                <strong>Order Rule:</strong> {activeChallenge.orderTip}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const check = activeChallenge.validate(shapes, lastOp);
                    setChallengeResult(check);
                    if (check.passed && !completedChallengeIds.includes(activeChallenge.id)) {
                      setCompletedChallengeIds((prev) => [...prev, activeChallenge.id]);
                    }
                  }}
                  className="flex-1 min-h-[38px] rounded-lg bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)]"
                >
                  Validate Shape
                </button>
                <button
                  type="button"
                  onClick={() => setShowTargetGuide((v) => !v)}
                  className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg border px-2.5 text-xs font-medium ${
                    showTargetGuide
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadChallenge(activeChallenge.id)}
                  className="min-h-[38px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-2.5 text-xs text-[var(--text-secondary)]"
                >
                  Reset
                </button>
              </div>

              {challengeResult && (
                <div
                  className={`rounded-lg border p-2.5 text-xs leading-relaxed ${
                    challengeResult.passed
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {challengeResult.feedback}
                </div>
              )}
            </div>

            <div className="h-px bg-[var(--border-subtle)]" />
          </section>
        )}

        {/* Explain It Card */}
        <section aria-label="Explain Merge Operation" className="space-y-3">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Explain It · {activeOpMeta.name}
              </h3>
              <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-500)]">
                {activeOpMeta.symbol}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">{activeOpMeta.tagline}</p>
          </div>

          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                What it does
              </div>
              <p className="text-[var(--text-primary)]">{activeOpMeta.whatItDoes}</p>
            </div>

            <div
              className={`rounded-xl border p-3 space-y-1 ${
                activeOpMeta.id === 'subtract'
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)]'
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                Selection-Order Rule
              </div>
              <p className="text-[var(--text-primary)]">{activeOpMeta.selectionOrderMatters}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                When to use it
              </div>
              <p className="text-[var(--text-secondary)]">{activeOpMeta.whenToUse}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-400">
                When to avoid it
              </div>
              <p className="text-[var(--text-secondary)]">{activeOpMeta.whenToAvoid}</p>
            </div>

            <div className="rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-soft)] p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-500)]">
                Pro Tip
              </div>
              <p className="text-[var(--text-primary)]">{activeOpMeta.proTip}</p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 sm:px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={loadSandbox}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap ${
              labMode === 'sandbox'
                ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                : 'bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shapes className="h-3.5 w-3.5" />
            <span>Free Merge Sandbox</span>
          </button>
          <button
            type="button"
            onClick={() => loadChallenge(activeChallengeId)}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap ${
              labMode === 'challenges'
                ? 'bg-[var(--accent-600)] text-[var(--accent-contrast)]'
                : 'bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>5 Challenges ({completedChallengeIds.length}/5)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium text-[var(--text-secondary)] disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={() =>
              labMode === 'challenges' ? loadChallenge(activeChallengeId) : loadSandbox()
            }
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={deleteSelectedLabShapes}
            disabled={selectedIds.length === 0}
            aria-label="Delete selected shape"
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium text-rose-400 disabled:opacity-35"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleSendToDesigner(false)}
            disabled={shapes.length === 0}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3 text-xs font-semibold text-[var(--accent-contrast)] disabled:opacity-40 whitespace-nowrap"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send to Designer</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendToDesigner(true)}
            disabled={shapes.length === 0}
            className="hidden sm:inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-500)] disabled:opacity-40 whitespace-nowrap"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Send & Open</span>
          </button>
          <LabPanelToggles leftLabel="Ops & Shapes" rightLabel="Explain" />
        </div>
      </div>

      {/* Mobile / Tablet Pane Switcher */}
      <div className="lg:hidden grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
        {(
          [
            ['canvas', 'Boolean Canvas'],
            ['tools', 'Ops & Shapes'],
            ['explain', labMode === 'challenges' ? 'Tasks & Explain' : 'Explain It'],
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
            ? 'lg:grid-cols-[275px_1fr_325px]'
            : panels.labLeft
              ? 'lg:grid-cols-[275px_1fr]'
              : panels.labRight
                ? 'lg:grid-cols-[1fr_325px]'
                : 'lg:grid-cols-[1fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${
            mobilePane === 'tools'
              ? panels.labLeft
                ? 'block'
                : 'block lg:hidden'
              : panels.labLeft
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {renderToolsPanel()}
        </div>

        {/* Centre Boolean SVG Canvas */}
        <main
          className={`min-h-0 flex-col justify-between overflow-y-auto bg-[var(--bg-canvas-well)] p-3 sm:p-5 ${
            mobilePane === 'canvas' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-3">
            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">
                  {labMode === 'challenges' ? activeChallenge.title : 'Interactive Boolean Canvas'}
                </strong>{' '}
                · Click shapes in order (1st, 2nd…) or drag to reposition
              </div>
              {hoverOp && orderedSelectedShapes.length >= 2 && (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-500)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Previewing {hoverOp}</span>
                </div>
              )}
            </div>

            {/* Responsive Virtual SVG Stage */}
            <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[#0b1220] shadow-2xl">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${LAB_CANVAS_WIDTH} ${LAB_CANVAS_HEIGHT}`}
                className="block h-auto w-full touch-none select-none"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => {
                  // Clicking empty canvas clears nothing unless dragged; keep selection convenient
                }}
              >
                <defs>
                  <pattern id="merge-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(148,163,184,0.12)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width={LAB_CANVAS_WIDTH} height={LAB_CANVAS_HEIGHT} fill="url(#merge-grid)" />

                {/* Target Silhouette Guide in Challenge Mode */}
                {labMode === 'challenges' && showTargetGuide && challengeTargetPath && (
                  <path
                    d={challengeTargetPath}
                    fill="rgba(56, 189, 248, 0.08)"
                    fillRule="evenodd"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="7 5"
                    pointerEvents="none"
                  />
                )}

                {/* Live Lab Shapes */}
                {shapes.map((sh) => {
                  const mp = shapeToMultiPolygon(sh);
                  const d = multiPolygonToSvgPath(mp);
                  const orderIdx = selectedIds.indexOf(sh.id);
                  const isSel = orderIdx !== -1;
                  const b = multiPolygonBounds(mp);

                  return (
                    <g key={sh.id}>
                      <path
                        d={d}
                        fill={sh.colour}
                        fillOpacity={hoverOp && isSel ? 0.25 : 0.88}
                        fillRule="evenodd"
                        clipRule="evenodd"
                        stroke={isSel ? '#ffffff' : 'rgba(255,255,255,0.22)'}
                        strokeWidth={isSel ? 2.5 : 1.2}
                        className="cursor-move"
                        onPointerDown={(e) => handleShapePointerDown(e, sh)}
                      />

                      {isSel && (
                        <g pointerEvents="none">
                          <rect
                            x={b.minX - 2}
                            y={b.minY - 2}
                            width={b.w + 4}
                            height={b.h + 4}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="5 4"
                          />
                          {/* Numbered Selection Order Badge */}
                          <circle cx={b.minX + 12} cy={b.minY + 12} r="13" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                          <text
                            x={b.minX + 12}
                            y={b.minY + 16}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="13"
                            fontWeight="700"
                          >
                            {orderIdx + 1}
                          </text>
                        </g>
                      )}

                      {/* Resize Handle */}
                      {isSel && (
                        <rect
                          x={b.maxX - 7}
                          y={b.maxY - 7}
                          width="14"
                          height="14"
                          rx="3"
                          fill="#ffffff"
                          stroke="#0284c7"
                          strokeWidth="2"
                          className="cursor-nwse-resize"
                          onPointerDown={(e) => handleResizePointerDown(e, sh)}
                        />
                      )}
                    </g>
                  );
                })}

                {/* Live Hover Preview of Boolean Output */}
                {hoverOp &&
                  previewPieces.map((piece) => (
                    <path
                      key={piece.id}
                      d={piece.svgPath}
                      fill={piece.colour}
                      fillOpacity={0.92}
                      fillRule="evenodd"
                      clipRule="evenodd"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      pointerEvents="none"
                    />
                  ))}
              </svg>
            </div>

            {/* Bottom Canvas Inspector & Quick Styling */}
            <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3.5 py-2.5 text-xs">
              {primarySelected && primaryStats ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-[var(--text-primary)]">{primarySelected.name}</span>
                    <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                      Area: {primaryStats.area.toLocaleString()} px² · Holes: {primaryStats.holes} · Islands: {primaryStats.islands}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      <span>Colour</span>
                      <input
                        type="color"
                        value={primarySelected.colour}
                        onChange={(e) => updateSelectedColour(e.target.value)}
                        className="h-6 w-8 cursor-pointer bg-transparent"
                      />
                    </label>
                    {primarySelected.kind !== 'boolean' && (
                      <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <span>Rotate ({Math.round(primarySelected.rotation)}°)</span>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={primarySelected.rotation}
                          onChange={(e) => updateSelectedRotation(Number(e.target.value))}
                          className="w-24 accent-[var(--accent-500)]"
                        />
                      </label>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-[var(--text-muted)]">
                  Click any shape on the canvas to inspect geometry, change colour, or run Merge Shapes.
                </span>
              )}
            </div>

            {sentNotice && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                <span>{sentNotice}</span>
              </div>
            )}
          </div>
        </main>

        <div
          className={`min-h-0 overflow-hidden ${
            mobilePane === 'explain'
              ? panels.labRight
                ? 'block'
                : 'block lg:hidden'
              : panels.labRight
                ? 'hidden lg:block'
                : 'hidden'
          }`}
        >
          {renderExplainAndChallengesPanel()}
        </div>
      </div>
    </div>
  );
};
