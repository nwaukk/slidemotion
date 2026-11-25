import { create } from 'zustand';
import { AssetShapeItem, SavedAnimationPreset } from '../data/assetsLibrary';
import { createDefaultStyle, createStarterProject, STAGE_DIMENSIONS, THEME_PRESETS } from '../data/themes';
import {
  AppSettings,
  AspectRatio,
  ElementAnimation,
  Project,
  ShapeKind,
  Slide,
  SlideBackground,
  SlideElement,
  SlideMaster,
  SlideTransition,
  StudioModuleId,
  ZoomMode,
} from '../types/presentation';
import {
  loadProjectFromIndexedDB,
  loadSettings,
  saveProjectToIndexedDB,
  saveSettings,
} from '../utils/storage';

const MAX_HISTORY = 60;

export interface SmartGuide {
  axis: 'x' | 'y';
  position: number;
  label?: string;
}

interface StudioState {
  project: Project;
  activeSlideId: string;
  selectedElementIds: string[];
  editingElementId: string | null;
  clipboard: SlideElement[];
  past: Project[];
  future: Project[];
  settings: AppSettings;
  activeModule: StudioModuleId;
  zoomMode: ZoomMode;
  zoomScale: number;
  panOffset: { x: number; y: number };
  activeGuides: SmartGuide[];
  isMasterEditMode: boolean;
  lastSavedAt: number | null;
  isHydrated: boolean;

  animationPainterBuffer: ElementAnimation[] | null;
  isPainterActive: boolean;
  selectedAnimationId: string | null;
  designerPreviewPlaying: boolean;
  designerPreviewTime: number;

  hydrate: () => Promise<void>;
  setActiveModule: (module: StudioModuleId) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;

  setProjectName: (name: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  loadProject: (project: Project) => void;
  resetStarterProject: () => void;

  setActiveSlide: (slideId: string) => void;
  addSlide: () => void;
  importSlideToDeck: (slide: Omit<Slide, 'id'>) => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  updateSlideTitle: (slideId: string, title: string) => void;
  updateSlideNotes: (slideId: string, notes: string) => void;
  updateSlideBackground: (slideId: string, bg: Partial<SlideBackground>) => void;
  updateSlideTransition: (slideId: string, patch: Partial<SlideTransition>) => void;
  createMorphDuplicateSlide: (slideId: string) => void;
  toggleSlideUseMaster: (slideId: string) => void;
  applyThemePreset: (themeId: string, applyToAllSlides: boolean) => void;
  updateMaster: (patch: Partial<SlideMaster>) => void;
  setMasterEditMode: (enabled: boolean) => void;

  selectElements: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  setEditingElement: (id: string | null) => void;
  setActiveGuides: (guides: SmartGuide[]) => void;

  addShape: (kind: ShapeKind) => void;
  addFreeformElement: (opts: {
    name: string;
    path: string;
    w: number;
    h: number;
    x?: number;
    y?: number;
    colour?: string;
    outlineColour?: string;
    outlineWidth?: number;
  }) => void;
  addTextBox: () => void;
  addImageElement: (src: string, name?: string, w?: number, h?: number) => void;
  addSvgElement: (svgContent: string, name?: string) => void;
  insertAssetShape: (item: AssetShapeItem, coords?: { x: number; y: number }) => void;
  insertAssetSvg: (svgContent: string, name?: string, coords?: { x: number; y: number }) => void;

  updateElement: (id: string, patch: Partial<SlideElement>, recordHistory?: boolean) => void;
  updateElementsBatch: (updates: Array<{ id: string; patch: Partial<SlideElement> }>, recordHistory?: boolean) => void;
  commitHistorySnapshot: (snapshotBeforeDrag: Project) => void;

  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  selectAll: () => void;

  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleLockElement: (id: string) => void;
  toggleVisibilityElement: (id: string) => void;
  reorderElementLayer: (id: string, direction: 'front' | 'forward' | 'backward' | 'back') => void;
  moveLayerIndex: (fromIndex: number, toIndex: number) => void;

  alignSelected: (alignment: 'left' | 'centre' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;

  undo: () => void;
  redo: () => void;

  setZoomMode: (mode: ZoomMode, scale?: number) => void;
  setZoomScale: (scale: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;

  setSelectedAnimationId: (id: string | null) => void;
  addElementAnimation: (elementId: string, anim: Omit<ElementAnimation, 'id' | 'order'>) => string;
  updateElementAnimation: (
    elementId: string,
    animId: string,
    patch: Partial<ElementAnimation>,
    recordHistory?: boolean,
  ) => void;
  removeElementAnimation: (elementId: string, animId: string) => void;
  reorderSlideAnimation: (animId: string, direction: 'up' | 'down') => void;
  activateAnimationPainter: (sourceElementId: string) => void;
  cancelAnimationPainter: () => void;
  applyAnimationPainterTo: (targetElementId: string) => void;
  applyRecipeToActiveSlide: (recipeElements: SlideElement[], replaceElements?: boolean) => void;
  applyAnimationPresetToElement: (
    elementId: string,
    animations: Array<Omit<ElementAnimation, 'id' | 'order'>>,
  ) => void;
  insertAnimatedPresetCard: (preset: SavedAnimationPreset, coords?: { x: number; y: number }) => void;
  insertAnimatedElementsAt: (elements: SlideElement[], coords?: { x: number; y: number }) => void;
  setDesignerPreview: (playing: boolean, time?: number) => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`;
}

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project)) as Project;
}

function persist(project: Project, set: (partial: Partial<StudioState>) => void) {
  const updated = { ...project, updatedAt: Date.now() };
  void saveProjectToIndexedDB(updated);
  set({ lastSavedAt: updated.updatedAt });
}

function expandSelectionWithGroups(elements: SlideElement[], selectedIds: string[]): string[] {
  const groupIds = new Set(
    elements.filter((e) => selectedIds.includes(e.id) && e.groupId).map((e) => e.groupId as string),
  );
  if (groupIds.size === 0) return selectedIds;
  return elements.filter((e) => selectedIds.includes(e.id) || (e.groupId && groupIds.has(e.groupId))).map((e) => e.id);
}

const initialProject = createStarterProject();

export const useStudioStore = create<StudioState>((set, get) => ({
  project: initialProject,
  activeSlideId: initialProject.slides[0].id,
  selectedElementIds: [],
  editingElementId: null,
  clipboard: [],
  past: [],
  future: [],
  settings: loadSettings(),
  activeModule: 'designer',
  zoomMode: 'fit',
  zoomScale: 0.5,
  panOffset: { x: 0, y: 0 },
  activeGuides: [],
  isMasterEditMode: false,
  lastSavedAt: null,
  isHydrated: false,

  animationPainterBuffer: null,
  isPainterActive: false,
  selectedAnimationId: null,
  designerPreviewPlaying: false,
  designerPreviewTime: 0,

  hydrate: async () => {
    const saved = await loadProjectFromIndexedDB();
    if (saved) {
      set({
        project: saved,
        activeSlideId: saved.slides[0]?.id ?? '',
        selectedElementIds: [],
        isHydrated: true,
        lastSavedAt: saved.updatedAt,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  setActiveModule: (module) => set({ activeModule: module }),

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },

  setProjectName: (name) => {
    const prev = cloneProject(get().project);
    const next = { ...get().project, name, updatedAt: Date.now() };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  setAspectRatio: (ratio) => {
    const prev = cloneProject(get().project);
    const next = { ...get().project, aspectRatio: ratio, updatedAt: Date.now() };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  loadProject: (project) => {
    const prev = cloneProject(get().project);
    set({
      project,
      activeSlideId: project.slides[0]?.id ?? '',
      selectedElementIds: [],
      editingElementId: null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(project, set);
  },

  resetStarterProject: () => {
    const prev = cloneProject(get().project);
    const fresh = createStarterProject();
    set({
      project: fresh,
      activeSlideId: fresh.slides[0].id,
      selectedElementIds: [],
      editingElementId: null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(fresh, set);
  },

  setActiveSlide: (slideId) => set({ activeSlideId: slideId, selectedElementIds: [], editingElementId: null }),

  addSlide: () => {
    const { project } = get();
    const prev = cloneProject(project);
    const newSlide: Slide = {
      id: uid('slide'),
      title: `Slide ${project.slides.length + 1}`,
      background: { ...project.master.background },
      useMaster: true,
      elements: [
        {
          id: uid('el'),
          name: 'Slide Heading',
          type: 'text',
          x: 150,
          y: 120,
          w: 1100,
          h: 120,
          rotation: 0,
          locked: false,
          visible: true,
          text: 'New Slide Title',
          style: createDefaultStyle({
            fill: {
              mode: 'none',
              colour: '#000000',
              gradientStart: '#000000',
              gradientEnd: '#000000',
              gradientAngle: 0,
              gradientType: 'linear',
            },
            typography: {
              fontFamily: project.master.headingFont,
              fontSize: 64,
              fontWeight: 700,
              italic: false,
              underline: false,
              colour: project.master.headingColour,
              align: 'left',
              verticalAlign: 'middle',
              lineHeight: 1.15,
              letterSpacing: -1,
            },
          }),
          animations: [],
        },
      ],
      transition: {
        type: 'fade',
        category: 'subtle',
        duration: 0.6,
        easing: 'ease-out',
      },
      notes: '',
    };
    const next = { ...project, slides: [...project.slides, newSlide], updatedAt: Date.now() };
    set({
      project: next,
      activeSlideId: newSlide.id,
      selectedElementIds: [],
      editingElementId: null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  importSlideToDeck: (slideData) => {
    const { project } = get();
    const prev = cloneProject(project);
    const clonedSlide: Slide = {
      ...(JSON.parse(JSON.stringify(slideData)) as Omit<Slide, 'id'>),
      id: uid('slide'),
      elements: slideData.elements.map((el) => ({
        ...(JSON.parse(JSON.stringify(el)) as SlideElement),
        id: uid('el'),
      })),
    };
    const next = { ...project, slides: [...project.slides, clonedSlide], updatedAt: Date.now() };
    set({
      project: next,
      activeSlideId: clonedSlide.id,
      selectedElementIds: [],
      editingElementId: null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  duplicateSlide: (slideId) => {
    const { project } = get();
    const index = project.slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;
    const prev = cloneProject(project);
    const source = project.slides[index];
    const cloned: Slide = {
      ...(JSON.parse(JSON.stringify(source)) as Slide),
      id: uid('slide'),
      title: `${source.title} (Copy)`,
      elements: source.elements.map((el) => ({
        ...(JSON.parse(JSON.stringify(el)) as SlideElement),
        id: uid('el'),
      })),
    };
    const slides = [...project.slides];
    slides.splice(index + 1, 0, cloned);
    const next = { ...project, slides, updatedAt: Date.now() };
    set({
      project: next,
      activeSlideId: cloned.id,
      selectedElementIds: [],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  deleteSlide: (slideId) => {
    const { project, activeSlideId } = get();
    if (project.slides.length <= 1) return;
    const prev = cloneProject(project);
    const idx = project.slides.findIndex((s) => s.id === slideId);
    const slides = project.slides.filter((s) => s.id !== slideId);
    const nextActive =
      activeSlideId === slideId ? (slides[Math.min(idx, slides.length - 1)]?.id ?? slides[0].id) : activeSlideId;
    const next = { ...project, slides, updatedAt: Date.now() };
    set({
      project: next,
      activeSlideId: nextActive,
      selectedElementIds: [],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  reorderSlides: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const { project } = get();
    const prev = cloneProject(project);
    const slides = [...project.slides];
    const [moved] = slides.splice(fromIndex, 1);
    if (!moved) return;
    slides.splice(toIndex, 0, moved);
    const next = { ...project, slides, updatedAt: Date.now() };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  updateSlideTitle: (slideId, title) => {
    const { project } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === slideId ? { ...s, title } : s)),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  updateSlideNotes: (slideId, notes) => {
    const { project } = get();
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === slideId ? { ...s, notes } : s)),
    };
    set({ project: next });
    persist(next, set);
  },

  updateSlideBackground: (slideId, bg) => {
    const { project } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === slideId ? { ...s, useMaster: false, background: { ...s.background, ...bg } } : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  updateSlideTransition: (slideId, patch) => {
    const { project } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === slideId ? { ...s, transition: { ...s.transition, ...patch } } : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  createMorphDuplicateSlide: (slideId) => {
    const { project } = get();
    const index = project.slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;
    const prev = cloneProject(project);
    const source = project.slides[index];
    const cloned: Slide = {
      ...(JSON.parse(JSON.stringify(source)) as Slide),
      id: uid('slide'),
      title: `${source.title} (Morph)`,
      transition: {
        type: 'morph',
        category: 'dynamic',
        duration: 0.9,
        easing: 'ease-in-out',
        morphMode: 'objects',
      },
      elements: source.elements.map((el) => ({
        ...(JSON.parse(JSON.stringify(el)) as SlideElement),
        id: uid('el'),
      })),
    };
    const slides = [...project.slides];
    slides.splice(index + 1, 0, cloned);
    const next = { ...project, slides, updatedAt: Date.now() };
    set({
      project: next,
      activeSlideId: cloned.id,
      selectedElementIds: cloned.elements[0] ? [cloned.elements[0].id] : [],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  toggleSlideUseMaster: (slideId) => {
    const { project } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === slideId ? { ...s, useMaster: !s.useMaster } : s)),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  applyThemePreset: (themeId, applyToAllSlides) => {
    const preset = THEME_PRESETS.find((t) => t.id === themeId);
    if (!preset) return;
    const { project, activeSlideId } = get();
    const prev = cloneProject(project);
    const nextMaster: SlideMaster = {
      ...project.master,
      background: { ...preset.background },
      accentColour: preset.accentColour,
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      headingColour: preset.headingColour,
      bodyColour: preset.bodyColour,
    };
    const nextSlides = project.slides.map((s) => {
      if (!applyToAllSlides && s.id !== activeSlideId) return s;
      return {
        ...s,
        useMaster: applyToAllSlides ? true : s.useMaster,
        background: { ...preset.background },
        elements: s.elements.map((el) => {
          if (el.type === 'text') {
            const isHeading = el.style.typography.fontSize >= 44;
            return {
              ...el,
              style: {
                ...el.style,
                typography: {
                  ...el.style.typography,
                  fontFamily: isHeading ? preset.headingFont : preset.bodyFont,
                  colour: isHeading ? preset.headingColour : preset.bodyColour,
                },
              },
            };
          }
          return el;
        }),
      };
    });
    const next: Project = {
      ...project,
      themeId: preset.id,
      master: nextMaster,
      slides: nextSlides,
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  updateMaster: (patch) => {
    const { project } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      master: { ...project.master, ...patch },
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  setMasterEditMode: (enabled) => set({ isMasterEditMode: enabled }),

  selectElements: (ids, additive = false) => {
    const { project, activeSlideId, selectedElementIds } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const base = additive
      ? ids.reduce((acc, id) => (acc.includes(id) ? acc.filter((x) => x !== id) : [...acc, id]), selectedElementIds)
      : ids;
    const expanded = expandSelectionWithGroups(slide.elements, base);
    set({ selectedElementIds: expanded, editingElementId: null });
  },

  clearSelection: () => set({ selectedElementIds: [], editingElementId: null }),

  setEditingElement: (id) => set({ editingElementId: id }),

  setActiveGuides: (guides) => set({ activeGuides: guides }),

  addShape: (kind) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const isLine = kind === 'line';
    const w = isLine ? 460 : kind === 'circle' || kind === 'star' ? 280 : 360;
    const h = isLine ? 24 : kind === 'circle' || kind === 'star' ? 280 : 240;
    const offset = (slide.elements.length % 5) * 28;
    const labelMap: Record<ShapeKind, string> = {
      rectangle: 'Rectangle',
      'rounded-rectangle': 'Rounded Box',
      circle: 'Circle',
      triangle: 'Triangle',
      star: 'Star',
      arrow: 'Arrow',
      line: 'Line',
      callout: 'Callout',
      chevron: 'Chevron',
      freeform: 'Freeform Polygon',
    };
    const newEl: SlideElement = {
      id: uid('el'),
      name: `${labelMap[kind]} ${slide.elements.length + 1}`,
      type: 'shape',
      shapeKind: kind,
      x: Math.round(width / 2 - w / 2 + offset),
      y: Math.round(height / 2 - h / 2 + offset),
      w,
      h,
      rotation: 0,
      locked: false,
      visible: true,
      text: '',
      style: createDefaultStyle({
        fill: {
          mode: isLine ? 'none' : 'solid',
          colour: project.master.accentColour || '#38bdf8',
          gradientStart: project.master.accentColour || '#38bdf8',
          gradientEnd: '#1d4ed8',
          gradientAngle: 135,
          gradientType: 'linear',
        },
        outline: {
          colour: isLine ? project.master.accentColour || '#38bdf8' : '#e2e8f0',
          width: isLine ? 6 : 0,
          dash: 'solid',
        },
        cornerRadius: kind === 'rounded-rectangle' ? 24 : 0,
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  addFreeformElement: ({ name, path, w, h, x, y, colour, outlineColour, outlineWidth }) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const dims = STAGE_DIMENSIONS[project.aspectRatio];
    const safeW = Math.max(40, Math.round(w));
    const safeH = Math.max(40, Math.round(h));
    const fillColour = colour ?? project.master.accentColour ?? '#38bdf8';
    const newEl: SlideElement = {
      id: uid('el'),
      name,
      type: 'shape',
      shapeKind: 'freeform',
      path,
      x: x !== undefined ? Math.round(x) : Math.round(dims.width / 2 - safeW / 2),
      y: y !== undefined ? Math.round(y) : Math.round(dims.height / 2 - safeH / 2),
      w: safeW,
      h: safeH,
      rotation: 0,
      locked: false,
      visible: true,
      text: '',
      style: createDefaultStyle({
        fill: {
          mode: 'solid',
          colour: fillColour,
          gradientStart: fillColour,
          gradientEnd: '#1d4ed8',
          gradientAngle: 135,
          gradientType: 'linear',
        },
        outline: {
          colour: outlineColour ?? '#e2e8f0',
          width: outlineWidth ?? 0,
          dash: 'solid',
        },
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  addTextBox: () => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const newEl: SlideElement = {
      id: uid('el'),
      name: `Text Box ${slide.elements.length + 1}`,
      type: 'text',
      x: Math.round(width / 2 - 320),
      y: Math.round(height / 2 - 80),
      w: 640,
      h: 160,
      rotation: 0,
      locked: false,
      visible: true,
      text: 'Double-click to edit text',
      style: createDefaultStyle({
        fill: {
          mode: 'none',
          colour: '#000000',
          gradientStart: '#000000',
          gradientEnd: '#000000',
          gradientAngle: 0,
          gradientType: 'linear',
        },
        typography: {
          fontFamily: project.master.headingFont,
          fontSize: 44,
          fontWeight: 600,
          italic: false,
          underline: false,
          colour: project.master.headingColour,
          align: 'centre',
          verticalAlign: 'middle',
          lineHeight: 1.25,
          letterSpacing: 0,
        },
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      editingElementId: newEl.id,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  addImageElement: (src, name = 'Uploaded Image', w = 520, h = 360) => {
    const { project, activeSlideId } = get();
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const newEl: SlideElement = {
      id: uid('el'),
      name,
      type: 'image',
      x: Math.round(width / 2 - w / 2),
      y: Math.round(height / 2 - h / 2),
      w,
      h,
      rotation: 0,
      locked: false,
      visible: true,
      text: '',
      imageSrc: src,
      style: createDefaultStyle({
        fill: {
          mode: 'none',
          colour: '#000000',
          gradientStart: '#000000',
          gradientEnd: '#000000',
          gradientAngle: 0,
          gradientType: 'linear',
        },
        cornerRadius: 16,
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  addSvgElement: (svgContent, name = 'Vector Graphic') => {
    const { project, activeSlideId } = get();
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const newEl: SlideElement = {
      id: uid('el'),
      name,
      type: 'svg',
      x: Math.round(width / 2 - 120),
      y: Math.round(height / 2 - 120),
      w: 240,
      h: 240,
      rotation: 0,
      locked: false,
      visible: true,
      text: '',
      svgContent,
      style: createDefaultStyle({
        fill: {
          mode: 'solid',
          colour: project.master.accentColour || '#38bdf8',
          gradientStart: '#38bdf8',
          gradientEnd: '#2563eb',
          gradientAngle: 135,
          gradientType: 'linear',
        },
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  insertAssetShape: (item, coords) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const isLine = item.shapeKind === 'line';
    const rawX = coords ? coords.x - item.w / 2 : width / 2 - item.w / 2 + (slide.elements.length % 5) * 24;
    const rawY = coords ? coords.y - item.h / 2 : height / 2 - item.h / 2 + (slide.elements.length % 5) * 24;
    const clampedX = Math.round(Math.max(0, Math.min(width - item.w, rawX)));
    const clampedY = Math.round(Math.max(0, Math.min(height - item.h, rawY)));
    const accent = project.master.accentColour || '#38bdf8';
    const newEl: SlideElement = {
      id: uid('el'),
      name: `${item.name} ${slide.elements.length + 1}`,
      type: 'shape',
      shapeKind: item.shapeKind,
      path: item.path,
      x: clampedX,
      y: clampedY,
      w: item.w,
      h: item.h,
      rotation: 0,
      locked: false,
      visible: true,
      text: item.text ?? '',
      style: createDefaultStyle({
        fill: {
          mode: isLine ? 'none' : 'solid',
          colour: item.fillColour ?? accent,
          gradientStart: item.fillColour ?? accent,
          gradientEnd: '#1d4ed8',
          gradientAngle: 135,
          gradientType: 'linear',
        },
        outline: {
          colour: item.outlineColour ?? (isLine ? accent : '#e2e8f0'),
          width: item.outlineWidth ?? (isLine ? 6 : 0),
          dash: 'solid',
        },
        cornerRadius: item.cornerRadius ?? (item.shapeKind === 'rounded-rectangle' ? 24 : 0),
        typography: {
          fontFamily: project.master.headingFont || 'Plus Jakarta Sans',
          fontSize: item.fontSize ?? 36,
          fontWeight: 600,
          italic: false,
          underline: false,
          colour: item.textColour ?? '#f8fafc',
          align: 'centre',
          verticalAlign: 'middle',
          lineHeight: 1.3,
          letterSpacing: 0,
        },
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  insertAssetSvg: (svgContent, name = 'Vector Graphic', coords) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const size = 200;
    const rawX = coords ? coords.x - size / 2 : width / 2 - size / 2;
    const rawY = coords ? coords.y - size / 2 : height / 2 - size / 2;
    const newEl: SlideElement = {
      id: uid('el'),
      name,
      type: 'svg',
      x: Math.round(Math.max(0, Math.min(width - size, rawX))),
      y: Math.round(Math.max(0, Math.min(height - size, rawY))),
      w: size,
      h: size,
      rotation: 0,
      locked: false,
      visible: true,
      text: '',
      svgContent,
      style: createDefaultStyle({
        fill: {
          mode: 'solid',
          colour: project.master.accentColour || '#38bdf8',
          gradientStart: '#38bdf8',
          gradientEnd: '#2563eb',
          gradientAngle: 135,
          gradientType: 'linear',
        },
      }),
      animations: [],
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  updateElement: (id, patch, recordHistory = true) => {
    const { project, activeSlideId } = get();
    const prev = recordHistory ? cloneProject(project) : null;
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: s.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) }
          : s,
      ),
    };
    if (recordHistory && prev) {
      set({
        project: next,
        past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
        future: [],
      });
    } else {
      set({ project: next });
    }
    persist(next, set);
  },

  updateElementsBatch: (updates, recordHistory = false) => {
    const { project, activeSlideId } = get();
    const prev = recordHistory ? cloneProject(project) : null;
    const updateMap = new Map(updates.map((u) => [u.id, u.patch]));
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) => {
                const patch = updateMap.get(el.id);
                return patch ? { ...el, ...patch } : el;
              }),
            }
          : s,
      ),
    };
    if (recordHistory && prev) {
      set({
        project: next,
        past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
        future: [],
      });
    } else {
      set({ project: next });
    }
    persist(next, set);
  },

  commitHistorySnapshot: (snapshotBeforeDrag) => {
    set({
      past: [...get().past.slice(-(MAX_HISTORY - 1)), snapshotBeforeDrag],
      future: [],
    });
    persist(get().project, set);
  },

  deleteSelected: () => {
    const { project, activeSlideId, selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const deletableIds = new Set(
      slide.elements.filter((el) => selectedElementIds.includes(el.id) && !el.locked).map((el) => el.id),
    );
    if (deletableIds.size === 0) return;
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId ? { ...s, elements: s.elements.filter((el) => !deletableIds.has(el.id)) } : s,
      ),
    };
    set({
      project: next,
      selectedElementIds: [],
      editingElementId: null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  duplicateSelected: () => {
    const { project, activeSlideId, selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const groupMap = new Map<string, string>();
    const duplicated = slide.elements
      .filter((el) => selectedElementIds.includes(el.id))
      .map((el) => {
        let nextGroupId = el.groupId ?? null;
        if (el.groupId) {
          if (!groupMap.has(el.groupId)) groupMap.set(el.groupId, uid('grp'));
          nextGroupId = groupMap.get(el.groupId) ?? null;
        }
        return {
          ...(JSON.parse(JSON.stringify(el)) as SlideElement),
          id: uid('el'),
          name: `${el.name} Copy`,
          x: el.x + 36,
          y: el.y + 36,
          groupId: nextGroupId,
        };
      });
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId ? { ...s, elements: [...s.elements, ...duplicated] } : s,
      ),
    };
    set({
      project: next,
      selectedElementIds: duplicated.map((d) => d.id),
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  copySelected: () => {
    const { project, activeSlideId, selectedElementIds } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide || selectedElementIds.length === 0) return;
    const copied = slide.elements
      .filter((el) => selectedElementIds.includes(el.id))
      .map((el) => JSON.parse(JSON.stringify(el)) as SlideElement);
    set({ clipboard: copied });
  },

  pasteClipboard: () => {
    const { project, activeSlideId, clipboard } = get();
    if (clipboard.length === 0) return;
    const prev = cloneProject(project);
    const groupMap = new Map<string, string>();
    const pasted = clipboard.map((el) => {
      let nextGroupId = el.groupId ?? null;
      if (el.groupId) {
        if (!groupMap.has(el.groupId)) groupMap.set(el.groupId, uid('grp'));
        nextGroupId = groupMap.get(el.groupId) ?? null;
      }
      return {
        ...(JSON.parse(JSON.stringify(el)) as SlideElement),
        id: uid('el'),
        x: el.x + 40,
        y: el.y + 40,
        groupId: nextGroupId,
      };
    });
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, ...pasted] } : s)),
    };
    set({
      project: next,
      selectedElementIds: pasted.map((p) => p.id),
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  selectAll: () => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    set({ selectedElementIds: slide.elements.filter((e) => e.visible).map((e) => e.id) });
  },

  groupSelected: () => {
    const { project, activeSlideId, selectedElementIds } = get();
    if (selectedElementIds.length < 2) return;
    const prev = cloneProject(project);
    const groupId = uid('grp');
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) => (selectedElementIds.includes(el.id) ? { ...el, groupId } : el)),
            }
          : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  ungroupSelected: () => {
    const { project, activeSlideId, selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                selectedElementIds.includes(el.id) ? { ...el, groupId: null } : el,
              ),
            }
          : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  toggleLockElement: (id) => {
    const { project, activeSlideId } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: s.elements.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)) }
          : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  toggleVisibilityElement: (id) => {
    const { project, activeSlideId } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: s.elements.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el)) }
          : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  reorderElementLayer: (id, direction) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const idx = slide.elements.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const prev = cloneProject(project);
    const els = [...slide.elements];
    const [item] = els.splice(idx, 1);
    if (direction === 'front') els.push(item);
    else if (direction === 'back') els.unshift(item);
    else if (direction === 'forward') els.splice(Math.min(els.length, idx + 1), 0, item);
    else if (direction === 'backward') els.splice(Math.max(0, idx - 1), 0, item);

    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: els } : s)),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  moveLayerIndex: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const els = [...slide.elements];
    const [item] = els.splice(fromIndex, 1);
    if (!item) return;
    els.splice(toIndex, 0, item);
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: els } : s)),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  alignSelected: (alignment) => {
    const { project, activeSlideId, selectedElementIds } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide || selectedElementIds.length === 0) return;
    const targets = slide.elements.filter((e) => selectedElementIds.includes(e.id) && !e.locked);
    if (targets.length === 0) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];

    const bounds =
      targets.length === 1
        ? { minX: 0, maxX: width, minY: 0, maxY: height }
        : {
            minX: Math.min(...targets.map((t) => t.x)),
            maxX: Math.max(...targets.map((t) => t.x + t.w)),
            minY: Math.min(...targets.map((t) => t.y)),
            maxY: Math.max(...targets.map((t) => t.y + t.h)),
          };

    const nextElements = slide.elements.map((el) => {
      if (!targets.some((t) => t.id === el.id)) return el;
      switch (alignment) {
        case 'left':
          return { ...el, x: bounds.minX };
        case 'centre':
          return { ...el, x: Math.round((bounds.minX + bounds.maxX) / 2 - el.w / 2) };
        case 'right':
          return { ...el, x: bounds.maxX - el.w };
        case 'top':
          return { ...el, y: bounds.minY };
        case 'middle':
          return { ...el, y: Math.round((bounds.minY + bounds.maxY) / 2 - el.h / 2) };
        case 'bottom':
          return { ...el, y: bounds.maxY - el.h };
      }
    });

    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: nextElements } : s)),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  distributeSelected: (axis) => {
    const { project, activeSlideId, selectedElementIds } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const targets = slide.elements.filter((e) => selectedElementIds.includes(e.id) && !e.locked);
    if (targets.length < 3) return;
    const prev = cloneProject(project);

    const sorted = [...targets].sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));
    const updates = new Map<string, { x?: number; y?: number }>();

    if (axis === 'horizontal') {
      const minX = sorted[0].x;
      const maxRight = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w;
      const totalWidth = sorted.reduce((sum, el) => sum + el.w, 0);
      const gap = (maxRight - minX - totalWidth) / (sorted.length - 1);
      let cursor = minX;
      sorted.forEach((el) => {
        updates.set(el.id, { x: Math.round(cursor) });
        cursor += el.w + gap;
      });
    } else {
      const minY = sorted[0].y;
      const maxBottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h;
      const totalHeight = sorted.reduce((sum, el) => sum + el.h, 0);
      const gap = (maxBottom - minY - totalHeight) / (sorted.length - 1);
      let cursor = minY;
      sorted.forEach((el) => {
        updates.set(el.id, { y: Math.round(cursor) });
        cursor += el.h + gap;
      });
    }

    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: s.elements.map((el) => ({ ...el, ...(updates.get(el.id) ?? {}) })) }
          : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  undo: () => {
    const { past, future, project } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const nextPast = past.slice(0, -1);
    set({
      project: previous,
      activeSlideId: previous.slides.some((s) => s.id === get().activeSlideId)
        ? get().activeSlideId
        : (previous.slides[0]?.id ?? ''),
      selectedElementIds: [],
      editingElementId: null,
      past: nextPast,
      future: [cloneProject(project), ...future.slice(0, MAX_HISTORY - 1)],
    });
    persist(previous, set);
  },

  redo: () => {
    const { past, future, project } = get();
    if (future.length === 0) return;
    const next = future[0];
    const nextFuture = future.slice(1);
    set({
      project: next,
      activeSlideId: next.slides.some((s) => s.id === get().activeSlideId)
        ? get().activeSlideId
        : (next.slides[0]?.id ?? ''),
      selectedElementIds: [],
      editingElementId: null,
      past: [...past.slice(-(MAX_HISTORY - 1)), cloneProject(project)],
      future: nextFuture,
    });
    persist(next, set);
  },

  setZoomMode: (mode, scale) => {
    set({
      zoomMode: mode,
      ...(scale !== undefined ? { zoomScale: scale } : {}),
      ...(mode !== 'custom' ? { panOffset: { x: 0, y: 0 } } : {}),
    });
  },

  setZoomScale: (scale) => set({ zoomMode: 'custom', zoomScale: Math.max(0.15, Math.min(2.5, scale)) }),

  setPanOffset: (offset) => set({ panOffset: offset }),

  setSelectedAnimationId: (id) => set({ selectedAnimationId: id }),

  addElementAnimation: (elementId, anim) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return '';
    const prev = cloneProject(project);
    const maxOrder = slide.elements.reduce(
      (max, el) => Math.max(max, ...el.animations.map((a) => a.order), 0),
      0,
    );
    const newAnim: ElementAnimation = {
      ...anim,
      id: uid('anim'),
      order: maxOrder + 1,
    };
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                el.id === elementId ? { ...el, animations: [...el.animations, newAnim] } : el,
              ),
            }
          : s,
      ),
    };
    set({
      project: next,
      selectedAnimationId: newAnim.id,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
    return newAnim.id;
  },

  updateElementAnimation: (elementId, animId, patch, recordHistory = true) => {
    const { project, activeSlideId } = get();
    const prev = recordHistory ? cloneProject(project) : null;
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                el.id === elementId
                  ? {
                      ...el,
                      animations: el.animations.map((a) => (a.id === animId ? { ...a, ...patch } : a)),
                    }
                  : el,
              ),
            }
          : s,
      ),
    };
    if (recordHistory && prev) {
      set({
        project: next,
        past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
        future: [],
      });
    } else {
      set({ project: next });
    }
    persist(next, set);
  },

  removeElementAnimation: (elementId, animId) => {
    const { project, activeSlideId, selectedAnimationId } = get();
    const prev = cloneProject(project);
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                el.id === elementId
                  ? { ...el, animations: el.animations.filter((a) => a.id !== animId) }
                  : el,
              ),
            }
          : s,
      ),
    };
    set({
      project: next,
      selectedAnimationId: selectedAnimationId === animId ? null : selectedAnimationId,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  reorderSlideAnimation: (animId, direction) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const flat: Array<{ elId: string; anim: ElementAnimation }> = [];
    slide.elements.forEach((el) => {
      el.animations.forEach((anim) => flat.push({ elId: el.id, anim }));
    });
    flat.sort((a, b) => a.anim.order - b.anim.order);
    const idx = flat.findIndex((item) => item.anim.id === animId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= flat.length) return;

    const prev = cloneProject(project);
    const [moved] = flat.splice(idx, 1);
    flat.splice(targetIdx, 0, moved);
    const orderMap = new Map<string, number>();
    flat.forEach((item, i) => orderMap.set(item.anim.id, i + 1));

    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) => ({
                ...el,
                animations: el.animations.map((a) => ({ ...a, order: orderMap.get(a.id) ?? a.order })),
              })),
            }
          : s,
      ),
    };
    set({
      project: next,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  activateAnimationPainter: (sourceElementId) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    const el = slide?.elements.find((e) => e.id === sourceElementId);
    if (!el || el.animations.length === 0) return;
    set({
      animationPainterBuffer: JSON.parse(JSON.stringify(el.animations)) as ElementAnimation[],
      isPainterActive: true,
    });
  },

  cancelAnimationPainter: () => set({ isPainterActive: false, animationPainterBuffer: null }),

  applyAnimationPainterTo: (targetElementId) => {
    const { project, activeSlideId, animationPainterBuffer } = get();
    if (!animationPainterBuffer || animationPainterBuffer.length === 0) return;
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    let maxOrder = slide.elements.reduce(
      (max, el) => Math.max(max, ...el.animations.map((a) => a.order), 0),
      0,
    );
    const clonedAnims = animationPainterBuffer.map((a) => {
      maxOrder += 1;
      return {
        ...(JSON.parse(JSON.stringify(a)) as ElementAnimation),
        id: uid('anim'),
        order: maxOrder,
      };
    });
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                el.id === targetElementId ? { ...el, animations: clonedAnims } : el,
              ),
            }
          : s,
      ),
    };
    set({
      project: next,
      isPainterActive: false,
      animationPainterBuffer: null,
      selectedElementIds: [targetElementId],
      selectedAnimationId: clonedAnims[0]?.id ?? null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  applyRecipeToActiveSlide: (recipeElements, replaceElements = false) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    let orderCursor = replaceElements
      ? 0
      : slide.elements.reduce((max, el) => Math.max(max, ...el.animations.map((a) => a.order), 0), 0);

    const clonedElements: SlideElement[] = recipeElements.map((el) => ({
      ...(JSON.parse(JSON.stringify(el)) as SlideElement),
      id: uid('el'),
      animations: el.animations.map((a) => {
        orderCursor += 1;
        return {
          ...(JSON.parse(JSON.stringify(a)) as ElementAnimation),
          id: uid('anim'),
          order: orderCursor,
        };
      }),
    }));

    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? { ...s, elements: replaceElements ? clonedElements : [...s.elements, ...clonedElements] }
          : s,
      ),
    };
    set({
      project: next,
      selectedElementIds: clonedElements[0] ? [clonedElements[0].id] : [],
      selectedAnimationId: clonedElements[0]?.animations[0]?.id ?? null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  applyAnimationPresetToElement: (elementId, animations) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    let maxOrder = slide.elements.reduce(
      (max, el) => Math.max(max, ...el.animations.map((a) => a.order), 0),
      0,
    );
    const createdAnims: ElementAnimation[] = animations.map((a) => {
      maxOrder += 1;
      return {
        ...(JSON.parse(JSON.stringify(a)) as Omit<ElementAnimation, 'id' | 'order'>),
        id: uid('anim'),
        order: maxOrder,
      };
    });
    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                el.id === elementId ? { ...el, animations: createdAnims } : el,
              ),
            }
          : s,
      ),
    };
    set({
      project: next,
      selectedElementIds: [elementId],
      selectedAnimationId: createdAnims[0]?.id ?? null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  insertAnimatedPresetCard: (preset, coords) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
    const w = 440;
    const h = 250;
    const rawX = coords ? coords.x - w / 2 : width / 2 - w / 2;
    const rawY = coords ? coords.y - h / 2 : height / 2 - h / 2;
    let maxOrder = slide.elements.reduce(
      (max, el) => Math.max(max, ...el.animations.map((a) => a.order), 0),
      0,
    );
    const anims: ElementAnimation[] = preset.animations.map((a) => {
      maxOrder += 1;
      return {
        ...(JSON.parse(JSON.stringify(a)) as Omit<ElementAnimation, 'id' | 'order'>),
        id: uid('anim'),
        order: maxOrder,
      };
    });
    const accent = project.master.accentColour || '#38bdf8';
    const newEl: SlideElement = {
      id: uid('el'),
      name: `${preset.name} Card`,
      type: 'shape',
      shapeKind: 'rounded-rectangle',
      x: Math.round(Math.max(0, Math.min(width - w, rawX))),
      y: Math.round(Math.max(0, Math.min(height - h, rawY))),
      w,
      h,
      rotation: 0,
      locked: false,
      visible: true,
      text: `${preset.name}\nDouble-click to customise`,
      style: createDefaultStyle({
        fill: {
          mode: 'solid',
          colour: '#1e293b',
          gradientStart: '#1e293b',
          gradientEnd: '#0f172a',
          gradientAngle: 135,
          gradientType: 'linear',
        },
        outline: {
          colour: accent,
          width: 2,
          dash: 'solid',
        },
        cornerRadius: 24,
        typography: {
          fontFamily: project.master.headingFont || 'Plus Jakarta Sans',
          fontSize: 32,
          fontWeight: 600,
          italic: false,
          underline: false,
          colour: '#f8fafc',
          align: 'centre',
          verticalAlign: 'middle',
          lineHeight: 1.35,
          letterSpacing: 0,
        },
      }),
      animations: anims,
    };
    const next = {
      ...project,
      slides: project.slides.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s)),
    };
    set({
      project: next,
      selectedElementIds: [newEl.id],
      selectedAnimationId: anims[0]?.id ?? null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  insertAnimatedElementsAt: (elements, coords) => {
    const { project, activeSlideId } = get();
    const slide = project.slides.find((s) => s.id === activeSlideId);
    if (!slide || elements.length === 0) return;
    const prev = cloneProject(project);
    const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];

    const minX = Math.min(...elements.map((e) => e.x));
    const minY = Math.min(...elements.map((e) => e.y));
    const maxX = Math.max(...elements.map((e) => e.x + e.w));
    const maxY = Math.max(...elements.map((e) => e.y + e.h));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const dx = coords ? coords.x - cx : 0;
    const dy = coords ? coords.y - cy : 0;

    let orderCursor = slide.elements.reduce(
      (max, el) => Math.max(max, ...el.animations.map((a) => a.order), 0),
      0,
    );

    const clonedElements: SlideElement[] = elements.map((el) => {
      const targetX = Math.round(Math.max(0, Math.min(width - el.w, el.x + dx)));
      const targetY = Math.round(Math.max(0, Math.min(height - el.h, el.y + dy)));
      return {
        ...(JSON.parse(JSON.stringify(el)) as SlideElement),
        id: uid('el'),
        x: targetX,
        y: targetY,
        animations: el.animations.map((a) => {
          orderCursor += 1;
          return {
            ...(JSON.parse(JSON.stringify(a)) as ElementAnimation),
            id: uid('anim'),
            order: orderCursor,
          };
        }),
      };
    });

    const next = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === activeSlideId ? { ...s, elements: [...s.elements, ...clonedElements] } : s,
      ),
    };
    set({
      project: next,
      selectedElementIds: clonedElements.map((e) => e.id),
      selectedAnimationId: clonedElements[0]?.animations[0]?.id ?? null,
      past: [...get().past.slice(-(MAX_HISTORY - 1)), prev],
      future: [],
    });
    persist(next, set);
  },

  setDesignerPreview: (playing, time) =>
    set((state) => ({
      designerPreviewPlaying: playing,
      designerPreviewTime: time !== undefined ? time : state.designerPreviewTime,
    })),
}));
