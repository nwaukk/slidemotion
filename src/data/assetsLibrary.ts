import { CURATED_SVG_LIBRARY } from './themes';
import { ElementAnimation, ShapeKind } from '../types/presentation';

export interface AssetShapeItem {
  id: string;
  name: string;
  category: 'Basic' | 'Diagram' | 'Callout' | 'Card';
  shapeKind: ShapeKind;
  w: number;
  h: number;
  text?: string;
  path?: string;
  fillColour?: string;
  outlineColour?: string;
  outlineWidth?: number;
  cornerRadius?: number;
  fontSize?: number;
  textColour?: string;
  previewSvg: string;
}

export type IconSetCategory = 'All' | 'Interface' | 'Business' | 'Design' | 'Data & Arrows';

export interface AssetIconItem {
  id: string;
  name: string;
  set: Exclude<IconSetCategory, 'All'>;
  svg: string;
}

export interface SavedAnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'Saved' | 'Entrance' | 'Emphasis' | 'Exit' | 'Sequence';
  isCustom?: boolean;
  animations: Array<Omit<ElementAnimation, 'id' | 'order'>>;
  createdAt: number;
}

export const ASSET_DRAG_MIME = 'application/x-slidemotion-asset';

export type DraggedAssetPayload =
  | {
      kind: 'shape';
      shapeId: string;
    }
  | {
      kind: 'icon';
      iconId: string;
    }
  | {
      kind: 'anim-preset';
      presetId: string;
    }
  | {
      kind: 'recipe-preset';
      source: 'recipe' | 'choreography';
      id: string;
    };

export const ASSET_SHAPES: AssetShapeItem[] = [
  {
    id: 'shape-rect',
    name: 'Rectangle',
    category: 'Basic',
    shapeKind: 'rectangle',
    w: 360,
    h: 220,
    cornerRadius: 0,
    previewSvg: '<svg viewBox="0 0 48 48"><rect x="6" y="11" width="36" height="26" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-rounded',
    name: 'Rounded Box',
    category: 'Basic',
    shapeKind: 'rounded-rectangle',
    w: 380,
    h: 240,
    cornerRadius: 24,
    previewSvg: '<svg viewBox="0 0 48 48"><rect x="6" y="11" width="36" height="26" rx="7" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-circle',
    name: 'Circle',
    category: 'Basic',
    shapeKind: 'circle',
    w: 260,
    h: 260,
    previewSvg: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-triangle',
    name: 'Triangle',
    category: 'Basic',
    shapeKind: 'triangle',
    w: 280,
    h: 240,
    previewSvg: '<svg viewBox="0 0 48 48"><polygon points="24,8 42,40 6,40" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-star',
    name: 'Star Badge',
    category: 'Basic',
    shapeKind: 'star',
    w: 260,
    h: 260,
    previewSvg:
      '<svg viewBox="0 0 48 48"><polygon points="24,6 29.2,17.2 41.5,18.8 32.5,27.3 34.8,39.5 24,33.5 13.2,39.5 15.5,27.3 6.5,18.8 18.8,17.2" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-diamond',
    name: 'Diamond',
    category: 'Diagram',
    shapeKind: 'freeform',
    path: 'M 50 0 L 100 50 L 50 100 L 0 50 Z',
    w: 260,
    h: 260,
    previewSvg: '<svg viewBox="0 0 48 48"><polygon points="24,6 42,24 24,42 6,24" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-hexagon',
    name: 'Hexagon Node',
    category: 'Diagram',
    shapeKind: 'freeform',
    path: 'M 25 2 L 75 2 L 99 50 L 75 98 L 25 98 L 1 50 Z',
    w: 280,
    h: 250,
    previewSvg: '<svg viewBox="0 0 48 48"><polygon points="14,9 34,9 43,24 34,39 14,39 5,24" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-arrow',
    name: 'Process Arrow',
    category: 'Diagram',
    shapeKind: 'arrow',
    w: 360,
    h: 160,
    previewSvg:
      '<svg viewBox="0 0 48 48"><polygon points="5,18 28,18 28,10 43,24 28,38 28,30 5,30" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-chevron',
    name: 'Chevron Step',
    category: 'Diagram',
    shapeKind: 'chevron',
    w: 360,
    h: 170,
    text: 'Step',
    fontSize: 32,
    previewSvg: '<svg viewBox="0 0 48 48"><polygon points="6,11 33,11 42,24 33,37 6,37 15,24" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-line',
    name: 'Accent Divider',
    category: 'Diagram',
    shapeKind: 'line',
    w: 480,
    h: 24,
    previewSvg: '<svg viewBox="0 0 48 48"><line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'shape-callout',
    name: 'Speech Callout',
    category: 'Callout',
    shapeKind: 'callout',
    w: 360,
    h: 230,
    text: 'Key insight',
    fontSize: 28,
    previewSvg:
      '<svg viewBox="0 0 48 48"><path d="M9 10h30a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H20l-7 8v-8H9a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-pill-tag',
    name: 'Pill Label',
    category: 'Callout',
    shapeKind: 'rounded-rectangle',
    w: 300,
    h: 76,
    cornerRadius: 40,
    text: 'SECTION TAG',
    fontSize: 22,
    previewSvg: '<svg viewBox="0 0 48 48"><rect x="5" y="16" width="38" height="16" rx="8" fill="currentColor" opacity="0.88"/></svg>',
  },
  {
    id: 'shape-kpi-card',
    name: 'KPI Metric Card',
    category: 'Card',
    shapeKind: 'rounded-rectangle',
    w: 420,
    h: 280,
    cornerRadius: 24,
    fillColour: '#1e293b',
    outlineColour: '#38bdf8',
    outlineWidth: 2,
    text: '+42%\nQuarterly Growth',
    fontSize: 36,
    textColour: '#f8fafc',
    previewSvg:
      '<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="28" rx="6" fill="#1e293b" stroke="currentColor" stroke-width="2"/><line x1="13" y1="20" x2="27" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="13" y1="28" x2="34" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/></svg>',
  },
  {
    id: 'shape-quote-card',
    name: 'Quote Panel',
    category: 'Card',
    shapeKind: 'rounded-rectangle',
    w: 520,
    h: 250,
    cornerRadius: 20,
    fillColour: '#0f172a',
    outlineColour: '#818cf8',
    outlineWidth: 2,
    text: '“Design with purpose, animate with restraint.”',
    fontSize: 30,
    textColour: '#f8fafc',
    previewSvg:
      '<svg viewBox="0 0 48 48"><rect x="6" y="11" width="36" height="26" rx="5" fill="#0f172a" stroke="#818cf8" stroke-width="2"/><line x1="12" y1="21" x2="36" y2="21" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="28" x2="28" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/></svg>',
  },
];

const EXTRA_ICONS: AssetIconItem[] = [
  {
    id: 'trend-bar',
    name: 'Bar Chart',
    set: 'Data & Arrows',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>',
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    set: 'Data & Arrows',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  },
  {
    id: 'arrow-up-right',
    name: 'Launch Arrow',
    set: 'Data & Arrows',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 16 16 12 12 8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  },
  {
    id: 'repeat-cycle',
    name: 'Cycle Loop',
    set: 'Data & Arrows',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  },
  {
    id: 'users-team',
    name: 'Team',
    set: 'Business',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  {
    id: 'briefcase',
    name: 'Strategy',
    set: 'Business',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  },
  {
    id: 'sparkles-motion',
    name: 'Motion Spark',
    set: 'Design',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
  },
  {
    id: 'wand-magic',
    name: 'Magic Wand',
    set: 'Design',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>',
  },
  {
    id: 'grid-layout',
    name: 'Grid Frame',
    set: 'Design',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  },
  {
    id: 'play-circle',
    name: 'Media Play',
    set: 'Interface',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
  },
  {
    id: 'zap-fast',
    name: 'Fast Action',
    set: 'Interface',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  },
  {
    id: 'bookmark-pin',
    name: 'Highlight Pin',
    set: 'Interface',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
  },
];

export const ASSET_ICONS: AssetIconItem[] = [
  ...CURATED_SVG_LIBRARY.map((item) => ({
    id: item.id,
    name: item.name,
    set: item.category as Exclude<IconSetCategory, 'All'>,
    svg: item.svg,
  })),
  ...EXTRA_ICONS,
];

export const BUILTIN_ANIMATION_PRESETS: SavedAnimationPreset[] = [
  {
    id: 'preset-crisp-fade',
    name: 'Crisp Editorial Fade',
    description: 'Clean 0.45s fade entrance on click — ideal for titles and body points.',
    category: 'Entrance',
    createdAt: 1,
    animations: [
      {
        category: 'entrance',
        effect: 'fade',
        options: {},
        start: 'on-click',
        duration: 0.45,
        delay: 0,
        repeat: 1,
        rewind: false,
      },
    ],
  },
  {
    id: 'preset-float-up',
    name: 'Smooth Float Up',
    description: 'Calm 48px upward drift paired with soft opacity fade.',
    category: 'Entrance',
    createdAt: 2,
    animations: [
      {
        category: 'entrance',
        effect: 'float-in',
        options: { direction: 'up' },
        start: 'with-previous',
        duration: 0.55,
        delay: 0,
        repeat: 1,
        rewind: false,
      },
    ],
  },
  {
    id: 'preset-wipe-draw',
    name: 'Wipe Draw Reveal',
    description: 'Progressive left-to-right mask reveal for arrows, lines, and bars.',
    category: 'Entrance',
    createdAt: 3,
    animations: [
      {
        category: 'entrance',
        effect: 'wipe',
        options: { direction: 'left' },
        start: 'with-previous',
        duration: 0.55,
        delay: 0,
        repeat: 1,
        rewind: false,
      },
    ],
  },
  {
    id: 'preset-hero-pulse',
    name: 'Zoom + Spotlight Pulse',
    description: 'Zooms cleanly into view, then pulses once to draw audience attention.',
    category: 'Emphasis',
    createdAt: 4,
    animations: [
      {
        category: 'entrance',
        effect: 'zoom',
        options: {},
        start: 'with-previous',
        duration: 0.4,
        delay: 0,
        repeat: 1,
        rewind: false,
      },
      {
        category: 'emphasis',
        effect: 'pulse',
        options: { scale: 112 },
        start: 'after-previous',
        duration: 0.6,
        delay: 0.15,
        repeat: 1,
        rewind: true,
      },
    ],
  },
  {
    id: 'preset-soft-exit',
    name: 'Fade & Retire Down',
    description: 'Enters smoothly then glides out downward after the beat completes.',
    category: 'Exit',
    createdAt: 5,
    animations: [
      {
        category: 'entrance',
        effect: 'fade',
        options: {},
        start: 'with-previous',
        duration: 0.4,
        delay: 0,
        repeat: 1,
        rewind: false,
      },
      {
        category: 'exit',
        effect: 'float-out',
        options: { direction: 'down' },
        start: 'after-previous',
        duration: 0.4,
        delay: 0.8,
        repeat: 1,
        rewind: false,
      },
    ],
  },
];
