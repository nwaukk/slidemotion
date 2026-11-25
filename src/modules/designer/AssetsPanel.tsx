import React, { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  GripVertical,
  Layers,
  PanelLeftClose,
  Plus,
  Search,
  Shapes,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ANIMATION_RECIPES } from '../../data/animations';
import {
  ASSET_DRAG_MIME,
  ASSET_ICONS,
  ASSET_SHAPES,
  AssetIconItem,
  AssetShapeItem,
  DraggedAssetPayload,
  IconSetCategory,
  SavedAnimationPreset,
} from '../../data/assetsLibrary';
import { CHOREOGRAPHY_PRESETS } from '../../data/choreography';
import { useStudioStore } from '../../store/useStudioStore';
import {
  deleteCustomAnimationPreset,
  loadSavedAnimationPresets,
  saveCustomAnimationPreset,
} from '../../utils/assetPresets';

type AssetTab = 'shapes' | 'icons' | 'presets';
type ShapeFilter = 'All' | AssetShapeItem['category'];

const SHAPE_FILTERS: ShapeFilter[] = ['All', 'Basic', 'Diagram', 'Callout', 'Card'];
const ICON_SETS: IconSetCategory[] = ['All', 'Business', 'Interface', 'Design', 'Data & Arrows'];

function setDragAssetPayload(e: React.DragEvent, payload: DraggedAssetPayload, label: string) {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData(ASSET_DRAG_MIME, JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', label);
}

export const AssetsPanel: React.FC<{
  onActionComplete?: () => void;
  onCollapse?: () => void;
}> = ({ onActionComplete, onCollapse }) => {
  const [tab, setTab] = useState<AssetTab>('shapes');
  const [query, setQuery] = useState('');
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>('All');
  const [iconSet, setIconSet] = useState<IconSetCategory>('All');
  const [savedPresets, setSavedPresets] = useState<SavedAnimationPreset[]>(() => loadSavedAnimationPresets());
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  const project = useStudioStore((s) => s.project);
  const activeSlideId = useStudioStore((s) => s.activeSlideId);
  const selectedElementIds = useStudioStore((s) => s.selectedElementIds);
  const insertAssetShape = useStudioStore((s) => s.insertAssetShape);
  const insertAssetSvg = useStudioStore((s) => s.insertAssetSvg);
  const applyAnimationPresetToElement = useStudioStore((s) => s.applyAnimationPresetToElement);
  const insertAnimatedPresetCard = useStudioStore((s) => s.insertAnimatedPresetCard);
  const insertAnimatedElementsAt = useStudioStore((s) => s.insertAnimatedElementsAt);

  const activeSlide = project.slides.find((s) => s.id === activeSlideId);
  const selectedElement = activeSlide?.elements.find((el) => selectedElementIds.includes(el.id)) ?? null;

  const normalisedQuery = query.trim().toLowerCase();

  const filteredShapes = useMemo(
    () =>
      ASSET_SHAPES.filter((s) => {
        if (shapeFilter !== 'All' && s.category !== shapeFilter) return false;
        if (normalisedQuery && !s.name.toLowerCase().includes(normalisedQuery)) return false;
        return true;
      }),
    [normalisedQuery, shapeFilter],
  );

  const filteredIcons = useMemo(
    () =>
      ASSET_ICONS.filter((ic) => {
        if (iconSet !== 'All' && ic.set !== iconSet) return false;
        if (
          normalisedQuery &&
          !ic.name.toLowerCase().includes(normalisedQuery) &&
          !ic.set.toLowerCase().includes(normalisedQuery)
        ) {
          return false;
        }
        return true;
      }),
    [iconSet, normalisedQuery],
  );

  const filteredPresets = useMemo(
    () =>
      savedPresets.filter((p) => {
        if (!normalisedQuery) return true;
        return (
          p.name.toLowerCase().includes(normalisedQuery) ||
          p.description.toLowerCase().includes(normalisedQuery) ||
          p.category.toLowerCase().includes(normalisedQuery)
        );
      }),
    [normalisedQuery, savedPresets],
  );

  const multiElementRecipes = useMemo(() => {
    const items = [
      ...ANIMATION_RECIPES.map((r) => ({
        source: 'recipe' as const,
        id: r.id,
        name: r.name,
        subtitle: r.subtitle,
        elements: r.elements,
      })),
      ...CHOREOGRAPHY_PRESETS.slice(0, 6).map((c) => ({
        source: 'choreography' as const,
        id: c.id,
        name: c.title,
        subtitle: `${c.category} · ${c.elements.length} objects`,
        elements: c.elements,
      })),
    ];
    if (!normalisedQuery) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(normalisedQuery) ||
        item.subtitle.toLowerCase().includes(normalisedQuery),
    );
  }, [normalisedQuery]);

  const handleSaveSelectedAnimations = () => {
    if (!selectedElement || selectedElement.animations.length === 0) return;
    const defaultLabel = `${selectedElement.name} Motion`;
    const next = saveCustomAnimationPreset(presetNameInput || defaultLabel, selectedElement.animations);
    setSavedPresets(next);
    setPresetNameInput('');
    setPresetNotice(`Saved "${presetNameInput.trim() || defaultLabel}"`);
    window.setTimeout(() => setPresetNotice(null), 2400);
  };

  const handleDeleteCustomPreset = (id: string) => {
    setSavedPresets(deleteCustomAnimationPreset(id));
  };

  const handleInsertShape = (item: AssetShapeItem) => {
    insertAssetShape(item);
    onActionComplete?.();
  };

  const handleInsertIcon = (item: AssetIconItem) => {
    insertAssetSvg(item.svg, item.name);
    onActionComplete?.();
  };

  const handleClickAnimPreset = (preset: SavedAnimationPreset) => {
    if (selectedElement) {
      applyAnimationPresetToElement(selectedElement.id, preset.animations);
      setPresetNotice(`Applied "${preset.name}" to ${selectedElement.name}`);
      window.setTimeout(() => setPresetNotice(null), 2400);
    } else {
      insertAnimatedPresetCard(preset);
    }
    onActionComplete?.();
  };

  return (
    <aside
      aria-label="Assets library"
      className="flex h-full flex-col bg-[var(--bg-panel)] text-[var(--text-primary)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Shapes className="h-3.5 w-3.5 text-[var(--accent-500)]" />
          <h2 className="font-display text-xs font-semibold text-[var(--text-primary)]">Assets</h2>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            title="Collapse Assets sidebar"
            aria-label="Collapse Assets sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-[var(--border-subtle)] p-1.5">
        {(
          [
            ['shapes', 'Shapes'],
            ['icons', 'Icons'],
            ['presets', 'Presets'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[32px] rounded-lg text-[11px] font-semibold transition-colors ${
              tab === id
                ? 'bg-[var(--accent-soft)] text-[var(--accent-500)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search & Drag Tip */}
      <div className="border-b border-[var(--border-subtle)] px-2.5 py-2 space-y-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            aria-label="Search assets"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] py-1.5 pl-8 pr-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-500)]"
          />
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">
          Drag onto the slide canvas to place at cursor, or click to add.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="studio-scroll flex-1 overflow-y-auto p-2.5 space-y-3">
        {tab === 'shapes' && (
          <>
            <div className="flex flex-wrap gap-1">
              {SHAPE_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setShapeFilter(cat)}
                  className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                    shapeFilter === cat
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {filteredShapes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(e) => setDragAssetPayload(e, { kind: 'shape', shapeId: item.id }, item.name)}
                  onClick={() => handleInsertShape(item)}
                  title={`Drag or click to insert ${item.name}`}
                  className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2.5 text-center transition-colors hover:border-[var(--accent-500)] cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="absolute right-1.5 top-1.5 h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span
                    className="h-9 w-9 text-[var(--accent-500)] [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: item.previewSvg }}
                  />
                  <span className="w-full truncate text-[11px] font-medium text-[var(--text-primary)]">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>

            {filteredShapes.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">No matching shapes found.</div>
            )}
          </>
        )}

        {tab === 'icons' && (
          <>
            <div className="flex flex-wrap gap-1">
              {ICON_SETS.map((set) => (
                <button
                  key={set}
                  type="button"
                  onClick={() => setIconSet(set)}
                  className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                    iconSet === set
                      ? 'border-[var(--accent-500)] bg-[var(--accent-soft)] text-[var(--accent-500)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {set}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {filteredIcons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(e) => setDragAssetPayload(e, { kind: 'icon', iconId: item.id }, item.name)}
                  onClick={() => handleInsertIcon(item)}
                  title={`${item.name} (${item.set}) · Drag or click to insert`}
                  className="group relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2 text-[var(--text-secondary)] hover:border-[var(--accent-500)] hover:text-[var(--accent-500)] cursor-grab active:cursor-grabbing transition-colors"
                >
                  <GripVertical className="absolute right-1 top-1 h-2.5 w-2.5 opacity-0 group-hover:opacity-80" />
                  <span
                    className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                  <span className="w-full truncate text-center text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>

            {filteredIcons.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">No matching icons found.</div>
            )}
          </>
        )}

        {tab === 'presets' && (
          <div className="space-y-4">
            {/* Save Selected Element's Animations */}
            <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-primary)]">
                <BookmarkPlus className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                <span>Save Animation Preset</span>
              </div>

              {selectedElement && selectedElement.animations.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Selected: <strong className="text-[var(--text-secondary)]">{selectedElement.name}</strong> (
                    {selectedElement.animations.length} animation
                    {selectedElement.animations.length === 1 ? '' : 's'})
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={presetNameInput}
                      onChange={(e) => setPresetNameInput(e.target.value)}
                      placeholder="Preset name..."
                      className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] px-2 py-1 text-xs outline-none focus:border-[var(--accent-500)]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSelectedAnimations}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-600)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-contrast)] shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  Select an element with animations on the stage to save its sequence here.
                </p>
              )}

              {presetNotice && (
                <p role="status" className="text-[11px] font-medium text-emerald-400">
                  {presetNotice}
                </p>
              )}
            </section>

            {/* Saved & Quick Single-Element Animation Presets */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Saved & Element Presets
                </h3>
                <span className="text-[10px] text-[var(--text-muted)]">Drop on shape or canvas</span>
              </div>
              <div className="space-y-1.5">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    draggable
                    onDragStart={(e) =>
                      setDragAssetPayload(e, { kind: 'anim-preset', presetId: preset.id }, preset.name)
                    }
                    className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2.5 hover:border-[var(--accent-500)] cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleClickAnimPreset(preset)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 shrink-0 text-[var(--accent-500)]" />
                          <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                            {preset.name}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                          {preset.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] font-medium text-[var(--accent-500)]">
                          <span>{preset.category}</span>
                          <span>·</span>
                          <span>
                            {preset.animations.length} step{preset.animations.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </button>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        {preset.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomPreset(preset.id)}
                            title="Delete saved preset"
                            aria-label={`Delete ${preset.name}`}
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-rose-500/15 hover:text-rose-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Multi-Element Motion Recipes */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Multi-Element Motion Blocks
                </h3>
                <span className="text-[10px] text-[var(--text-muted)]">Drag onto canvas</span>
              </div>
              <div className="space-y-1.5">
                {multiElementRecipes.map((rec) => (
                  <button
                    key={`${rec.source}-${rec.id}`}
                    type="button"
                    draggable
                    onDragStart={(e) =>
                      setDragAssetPayload(
                        e,
                        { kind: 'recipe-preset', source: rec.source, id: rec.id },
                        rec.name,
                      )
                    }
                    onClick={() => {
                      insertAnimatedElementsAt(rec.elements);
                      onActionComplete?.();
                    }}
                    className="group flex w-full items-start justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-2.5 text-left hover:border-[var(--accent-500)] cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 shrink-0 text-[var(--accent-500)]" />
                        <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                          {rec.name}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{rec.subtitle}</p>
                    </div>
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
};
