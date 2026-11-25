import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  Code2,
  Eye,
  EyeOff,
  ImagePlus,
  Layers,
  Lock,
  MessageSquare,
  Minus,
  PanelLeftClose,
  Pentagon,
  Plus,
  Square,
  Star,
  Triangle,
  Type,
  Unlock,
} from 'lucide-react';
import { CURATED_SVG_LIBRARY } from '../../data/themes';
import { useStudioStore } from '../../store/useStudioStore';
import { ShapeKind } from '../../types/presentation';

const SHAPE_TOOLS: Array<{ kind: ShapeKind; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { kind: 'rectangle', label: 'Rectangle', icon: Square },
  { kind: 'rounded-rectangle', label: 'Rounded Box', icon: Square },
  { kind: 'circle', label: 'Circle', icon: Circle },
  { kind: 'triangle', label: 'Triangle', icon: Triangle },
  { kind: 'star', label: 'Star', icon: Star },
  { kind: 'arrow', label: 'Arrow', icon: ArrowRight },
  { kind: 'line', label: 'Line', icon: Minus },
  { kind: 'callout', label: 'Callout', icon: MessageSquare },
  { kind: 'chevron', label: 'Chevron', icon: ArrowRight },
  { kind: 'freeform', label: 'Freeform', icon: Pentagon },
];

export const ToolsAndLayersPanel: React.FC<{
  iconRail?: boolean;
  onActionComplete?: () => void;
  onCollapse?: () => void;
}> = ({ iconRail = false, onActionComplete, onCollapse }) => {
  const [tab, setTab] = useState<'insert' | 'layers'>('insert');
  const [customSvgModal, setCustomSvgModal] = useState(false);
  const [customSvgInput, setCustomSvgInput] = useState(
    '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="40"/></svg>',
  );
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const addShape = useStudioStore((s) => s.addShape);
  const addTextBox = useStudioStore((s) => s.addTextBox);
  const addImageElement = useStudioStore((s) => s.addImageElement);
  const addSvgElement = useStudioStore((s) => s.addSvgElement);
  const selectElements = useStudioStore((s) => s.selectElements);
  const updateElement = useStudioStore((s) => s.updateElement);
  const toggleLockElement = useStudioStore((s) => s.toggleLockElement);
  const toggleVisibilityElement = useStudioStore((s) => s.toggleVisibilityElement);
  const moveLayerIndex = useStudioStore((s) => s.moveLayerIndex);

  const activeSlide = project.slides.find((s) => s.id === activeSlideId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 720;
        const ratio = img.width > 0 ? img.height / img.width : 0.75;
        const w = Math.min(maxW, Math.max(240, img.width));
        const h = Math.round(w * ratio);
        addImageElement(dataUrl, file.name.replace(/\.[^.]+$/, ''), w, h);
        onActionComplete?.();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (iconRail) {
    return (
      <div className="flex h-full flex-col items-center gap-1.5 border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] py-2.5 px-1.5">
        <button
          type="button"
          onClick={() => addTextBox()}
          title="Insert Text Box"
          aria-label="Insert Text Box"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
        >
          <Type className="h-4 w-4" />
        </button>
        {SHAPE_TOOLS.slice(0, 6).map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => addShape(kind)}
            title={`Insert ${label}`}
            aria-label={`Insert ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <Icon className={`h-4 w-4 ${kind === 'rounded-rectangle' ? 'rounded' : ''}`} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
          aria-label="Upload Image"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </div>
    );
  }

  const layersTopDown = activeSlide ? [...activeSlide.elements].map((el, idx) => ({ el, idx })).reverse() : [];

  return (
    <aside
      aria-label="Tools and layers"
      className="flex h-full flex-col bg-[var(--bg-panel)] text-[var(--text-primary)]"
    >
      <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] p-1.5">
        <div className="grid flex-1 grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setTab('insert')}
            className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'insert'
                ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setTab('layers')}
            className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'layers'
                ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Layers ({activeSlide?.elements.length ?? 0})
          </button>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            title="Collapse Insert & Layers panel"
            aria-label="Collapse Insert & Layers panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {tab === 'insert' ? (
        <div className="studio-scroll flex-1 overflow-y-auto p-3 space-y-5">
          {/* Quick Text & Media */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Text & Media</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  addTextBox();
                  onActionComplete?.();
                }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium hover:border-[var(--accent-500)]"
              >
                <Type className="h-4 w-4 text-[var(--accent-500)]" />
                <span>Text Box</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs font-medium hover:border-[var(--accent-500)]"
              >
                <ImagePlus className="h-4 w-4 text-[var(--accent-500)]" />
                <span>Image</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </section>

          {/* Shapes */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Geometric & Callout Shapes</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SHAPE_TOOLS.map(({ kind, label, icon: Icon }) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    addShape(kind);
                    onActionComplete?.();
                  }}
                  className="flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 text-xs text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-500)]" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Curated Vector Icons & SVG */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">Vector Icons & SVG</h3>
              <button
                type="button"
                onClick={() => setCustomSvgModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-500)] hover:underline"
              >
                <Code2 className="h-3 w-3" />
                <span>Paste SVG</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {CURATED_SVG_LIBRARY.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={`Insert ${item.name}`}
                  aria-label={`Insert ${item.name}`}
                  onClick={() => {
                    addSvgElement(item.svg, item.name);
                    onActionComplete?.();
                  }}
                  className="flex min-h-[44px] flex-col items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2 text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--accent-500)] transition-colors"
                >
                  <span
                    className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="studio-scroll flex-1 overflow-y-auto p-2.5 space-y-2">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] px-2.5 py-2 text-[11px] text-[var(--text-muted)]">
            Double-click any layer name to rename it. Prefix matching objects across slides with{' '}
            <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">!!</span> for Morph.
          </div>

          {layersTopDown.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              This slide has no objects yet. Switch to Insert to add shapes or text.
            </div>
          )}

          {layersTopDown.map(({ el, idx }) => {
            const selected = selectedElementIds.includes(el.id);
            const isMorphNamed = el.name.startsWith('!!');

            return (
              <div
                key={el.id}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                  selected
                    ? 'border-[var(--accent-500)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] hover:border-[var(--border-strong)]'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => selectElements([el.id], e.shiftKey)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left py-1"
                >
                  <Layers className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                  {editingNameId === el.id ? (
                    <input
                      autoFocus
                      value={el.name}
                      onChange={(e) => updateElement(el.id, { name: e.target.value }, false)}
                      onBlur={() => setEditingNameId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') setEditingNameId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-[var(--accent-500)] bg-[var(--bg-app)] px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingNameId(el.id);
                      }}
                      className={`truncate font-medium ${
                        isMorphNamed ? 'text-[var(--accent-500)] font-mono-tabular' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {el.name}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === (activeSlide?.elements.length ?? 1) - 1}
                    onClick={() => moveLayerIndex(idx, idx + 1)}
                    title="Move layer forward"
                    aria-label="Move layer forward"
                    className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-25"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLayerIndex(idx, idx - 1)}
                    title="Move layer backward"
                    aria-label="Move layer backward"
                    className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-25"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVisibilityElement(el.id)}
                    title={el.visible ? 'Hide element' : 'Show element'}
                    aria-label={el.visible ? 'Hide element' : 'Show element'}
                    className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {el.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-amber-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLockElement(el.id)}
                    title={el.locked ? 'Unlock element' : 'Lock element'}
                    aria-label={el.locked ? 'Unlock element' : 'Lock element'}
                    className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {el.locked ? <Lock className="h-3 w-3 text-amber-400" /> : <Unlock className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {customSvgModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Paste custom SVG markup"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 shadow-2xl space-y-3">
            <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Insert Custom SVG Graphic
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Paste clean vector SVG markup below to add it as a scalable object on your slide.
            </p>
            <textarea
              rows={6}
              value={customSvgInput}
              onChange={(e) => setCustomSvgInput(e.target.value)}
              className="font-mono-tabular w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-500)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCustomSvgModal(false)}
                className="min-h-[38px] rounded-lg border border-[var(--border-subtle)] px-4 text-xs font-medium text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customSvgInput.trim().startsWith('<svg')) {
                    addSvgElement(customSvgInput.trim(), 'Custom SVG');
                    setCustomSvgModal(false);
                    onActionComplete?.();
                  }
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-4 text-xs font-semibold text-[var(--accent-contrast)]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Slide</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
