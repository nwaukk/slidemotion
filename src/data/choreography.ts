import { SlideElement } from '../types/presentation';
import { createDefaultStyle } from './themes';

export interface RecipeStepBreakdown {
  step: number;
  role: string;
  effect: string;
  trigger: string;
  delay: string;
  duration: string;
  rationale: string;
}

export interface ChoreographyPreset {
  id: string;
  number: number;
  title: string;
  category: 'Stagger' | 'Parallax' | 'Emphasis' | 'Storytelling';
  totalDuration: string;
  summary: string;
  whyItWorks: string;
  recipeBreakdown: RecipeStepBreakdown[];
  elements: SlideElement[];
}

const NONE_FILL = {
  mode: 'none' as const,
  colour: '#000000',
  gradientStart: '#000000',
  gradientEnd: '#000000',
  gradientAngle: 0,
  gradientType: 'linear' as const,
};

function solidFill(colour: string) {
  return {
    mode: 'solid' as const,
    colour,
    gradientStart: colour,
    gradientEnd: colour,
    gradientAngle: 135,
    gradientType: 'linear' as const,
  };
}

export const CHOREOGRAPHY_PRESETS: ChoreographyPreset[] = [
  {
    id: 'staggered-bullet-reveal',
    number: 1,
    title: 'Staggered Card Cascade',
    category: 'Stagger',
    totalDuration: '1.2s',
    summary: 'Header settles first, then three feature cards glide upward 140ms apart in a calm cascade.',
    whyItWorks: 'A 120–160ms stagger lets the eye register each card before the next begins, avoiding simultaneous clutter.',
    recipeBreakdown: [
      { step: 1, role: 'Section Heading', effect: 'Fade', trigger: 'With Previous', delay: '0.00s', duration: '0.45s', rationale: 'Anchors context immediately without sweeping across the canvas.' },
      { step: 2, role: 'Card 1 (Research)', effect: 'Float In (Up)', trigger: 'With Previous', delay: '0.18s', duration: '0.50s', rationale: 'Starts the rhythmic left-to-right visual scan.' },
      { step: 3, role: 'Card 2 (Prototype)', effect: 'Float In (Up)', trigger: 'With Previous', delay: '0.34s', duration: '0.50s', rationale: 'Overlaps Card 1 by ~65% so motion feels fluid, not stop-start.' },
      { step: 4, role: 'Card 3 (Launch)', effect: 'Float In (Up)', trigger: 'With Previous', delay: '0.50s', duration: '0.50s', rationale: 'Completes the triad while Card 2 is still settling.' },
    ],
    elements: [
      {
        id: 'ch1-head', name: 'Section Heading', type: 'text', x: 180, y: 150, w: 1200, h: 110, rotation: 0, locked: false, visible: true,
        text: 'Three Core Pillars of Delivery',
        style: createDefaultStyle({ fill: NONE_FILL, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 64, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.15, letterSpacing: -1 } }),
        animations: [{ id: 'ch1-a1', category: 'entrance', effect: 'fade', options: {}, start: 'with-previous', duration: 0.45, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch1-c1', name: 'Card 1', type: 'shape', shapeKind: 'rounded-rectangle', x: 180, y: 340, w: 480, h: 500, rotation: 0, locked: false, visible: true,
        text: '01 · Discover\nInterview real users before sketching screens.',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#38bdf8', width: 2, dash: 'solid' }, cornerRadius: 24, typography: { fontFamily: 'DM Sans', fontSize: 30, fontWeight: 600, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.45, letterSpacing: 0 } }),
        animations: [{ id: 'ch1-a2', category: 'entrance', effect: 'float-in', options: { direction: 'up' }, start: 'with-previous', duration: 0.5, delay: 0.18, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch1-c2', name: 'Card 2', type: 'shape', shapeKind: 'rounded-rectangle', x: 720, y: 340, w: 480, h: 500, rotation: 0, locked: false, visible: true,
        text: '02 · Prototype\nTest interactive motion flows early.',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#10b981', width: 2, dash: 'solid' }, cornerRadius: 24, typography: { fontFamily: 'DM Sans', fontSize: 30, fontWeight: 600, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.45, letterSpacing: 0 } }),
        animations: [{ id: 'ch1-a3', category: 'entrance', effect: 'float-in', options: { direction: 'up' }, start: 'with-previous', duration: 0.5, delay: 0.34, repeat: 1, rewind: false, order: 3 }],
      },
      {
        id: 'ch1-c3', name: 'Card 3', type: 'shape', shapeKind: 'rounded-rectangle', x: 1260, y: 340, w: 480, h: 500, rotation: 0, locked: false, visible: true,
        text: '03 · Deliver\nRefine typography and pacing.',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#fbbf24', width: 2, dash: 'solid' }, cornerRadius: 24, typography: { fontFamily: 'DM Sans', fontSize: 30, fontWeight: 600, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.45, letterSpacing: 0 } }),
        animations: [{ id: 'ch1-a4', category: 'entrance', effect: 'float-in', options: { direction: 'up' }, start: 'with-previous', duration: 0.5, delay: 0.5, repeat: 1, rewind: false, order: 4 }],
      },
    ],
  },
  {
    id: 'executive-kpi-trio',
    number: 2,
    title: 'Executive KPI Spotlight',
    category: 'Emphasis',
    totalDuration: '1.8s',
    summary: 'Three KPI tiles scale into place, then the standout metric gently pulses to draw immediate focus.',
    whyItWorks: 'Combining a rapid structural build with a single follow-up emphasis ensures executives know which number matters most.',
    recipeBreakdown: [
      { step: 1, role: 'KPI Tile 1', effect: 'Zoom', trigger: 'With Previous', delay: '0.00s', duration: '0.40s', rationale: 'Crisp scale entrance from 65% feels sharper than a long slide.' },
      { step: 2, role: 'KPI Tile 2 (Hero)', effect: 'Zoom + Pulse', trigger: 'With / After', delay: '0.15s', duration: '0.40s + 0.65s', rationale: 'After landing, a single 112% pulse highlights the headline metric.' },
      { step: 3, role: 'KPI Tile 3', effect: 'Zoom', trigger: 'With Previous', delay: '0.30s', duration: '0.40s', rationale: 'Balances the grid cleanly.' },
    ],
    elements: [
      {
        id: 'ch2-k1', name: 'Metric 1', type: 'shape', shapeKind: 'rounded-rectangle', x: 180, y: 320, w: 480, h: 420, rotation: 0, locked: false, visible: true,
        text: '98.4%\nUptime SLA',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 52, fontWeight: 700, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.35, letterSpacing: 0 } }),
        animations: [{ id: 'ch2-a1', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.4, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch2-k2', name: 'Hero Metric', type: 'shape', shapeKind: 'rounded-rectangle', x: 720, y: 280, w: 480, h: 500, rotation: 0, locked: false, visible: true,
        text: '+46%\nNet Retention',
        style: createDefaultStyle({ fill: solidFill('#0284c7'), cornerRadius: 28, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 58, fontWeight: 800, italic: false, underline: false, colour: '#ffffff', align: 'centre', verticalAlign: 'middle', lineHeight: 1.35, letterSpacing: 0 } }),
        animations: [
          { id: 'ch2-a2', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.4, delay: 0.15, repeat: 1, rewind: false, order: 2 },
          { id: 'ch2-a4', category: 'emphasis', effect: 'pulse', options: { scale: 112 }, start: 'after-previous', duration: 0.65, delay: 0.1, repeat: 1, rewind: true, order: 4 },
        ],
      },
      {
        id: 'ch2-k3', name: 'Metric 3', type: 'shape', shapeKind: 'rounded-rectangle', x: 1260, y: 320, w: 480, h: 420, rotation: 0, locked: false, visible: true,
        text: '14 Days\nAvg Onboarding',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 52, fontWeight: 700, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.35, letterSpacing: 0 } }),
        animations: [{ id: 'ch2-a3', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.4, delay: 0.3, repeat: 1, rewind: false, order: 3 }],
      },
    ],
  },
  {
    id: 'kinetic-title-split',
    number: 3,
    title: 'Kinetic Editorial Opener',
    category: 'Stagger',
    totalDuration: '1.6s',
    summary: 'An accent rule wipes outward, words reveal sequentially, and a quiet subtitle fades underneath.',
    whyItWorks: 'Wipe-to-Word choreography mirrors editorial film titles: line draws first, headline speaks second.',
    recipeBreakdown: [
      { step: 1, role: 'Accent Rule', effect: 'Wipe (Left)', trigger: 'With Previous', delay: '0.00s', duration: '0.45s', rationale: 'Establishes the left typographic edge in under half a second.' },
      { step: 2, role: 'Hero Headline', effect: 'Float In (By Word)', trigger: 'After Previous', delay: '0.00s', duration: '0.70s', rationale: 'Word-by-word stagger adds rhythm without reading slowly.' },
      { step: 3, role: 'Subtitle', effect: 'Fade', trigger: 'After Previous', delay: '0.00s', duration: '0.45s', rationale: 'Appears only after the main claim is read.' },
    ],
    elements: [
      {
        id: 'ch3-rule', name: 'Accent Rule', type: 'shape', shapeKind: 'rounded-rectangle', x: 220, y: 300, w: 180, h: 14, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: solidFill('#38bdf8'), cornerRadius: 7 }),
        animations: [{ id: 'ch3-a1', category: 'entrance', effect: 'wipe', options: { direction: 'left' }, start: 'with-previous', duration: 0.45, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch3-title', name: 'Editorial Title', type: 'text', x: 220, y: 345, w: 1380, h: 200, rotation: 0, locked: false, visible: true, text: 'Motion That Guides Attention',
        style: createDefaultStyle({ fill: NONE_FILL, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 82, fontWeight: 800, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.12, letterSpacing: -1 } }),
        animations: [{ id: 'ch3-a2', category: 'entrance', effect: 'float-in', options: { direction: 'up' }, start: 'after-previous', duration: 0.7, delay: 0, repeat: 1, rewind: false, order: 2, textDelivery: 'word' }],
      },
      {
        id: 'ch3-sub', name: 'Subtitle', type: 'text', x: 220, y: 560, w: 1080, h: 100, rotation: 0, locked: false, visible: true, text: 'Choreograph timing around reading speed rather than decoration.',
        style: createDefaultStyle({ fill: NONE_FILL, typography: { fontFamily: 'DM Sans', fontSize: 34, fontWeight: 400, italic: false, underline: false, colour: '#cbd5e1', align: 'left', verticalAlign: 'top', lineHeight: 1.4, letterSpacing: 0 } }),
        animations: [{ id: 'ch3-a3', category: 'entrance', effect: 'fade', options: {}, start: 'after-previous', duration: 0.45, delay: 0, repeat: 1, rewind: false, order: 3 }],
      },
    ],
  },
  {
    id: 'parallax-horizon-journey',
    number: 4,
    title: 'Parallax Horizon Drift',
    category: 'Parallax',
    totalDuration: '1.4s',
    summary: 'Three depth layers translate right at different distances (110px, 260px, 460px) to simulate camera parallax.',
    whyItWorks: 'Faster foreground travel relative to slower background drift tricks the eye into perceiving real 3D camera depth.',
    recipeBreakdown: [
      { step: 1, role: 'Distant Sun Orb', effect: 'Line Path (110px)', trigger: 'With Previous', delay: '0.00s', duration: '1.30s', rationale: 'Distant celestial elements barely shift as the camera pans.' },
      { step: 2, role: 'Midground Ridge', effect: 'Line Path (260px)', trigger: 'With Previous', delay: '0.00s', duration: '1.30s', rationale: 'Moderate travel bridges foreground and sky.' },
      { step: 3, role: 'Foreground Badge', effect: 'Line Path (460px)', trigger: 'With Previous', delay: '0.00s', duration: '1.30s', rationale: 'Closest element covers the longest path across the frame.' },
    ],
    elements: [
      {
        id: 'ch4-sun', name: 'Distant Sun', type: 'shape', shapeKind: 'circle', x: 1180, y: 150, w: 300, h: 300, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: solidFill('#1d4ed8'), opacity: 0.5 }),
        animations: [{ id: 'ch4-a1', category: 'motion-path', effect: 'line', options: { direction: 'right', distance: 110 }, start: 'with-previous', duration: 1.3, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch4-mid', name: 'Midground Ridge', type: 'shape', shapeKind: 'rounded-rectangle', x: 260, y: 540, w: 1120, h: 360, rotation: -3, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: solidFill('#0369a1'), cornerRadius: 72, opacity: 0.78 }),
        animations: [{ id: 'ch4-a2', category: 'motion-path', effect: 'line', options: { direction: 'right', distance: 260 }, start: 'with-previous', duration: 1.3, delay: 0, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch4-fg', name: 'Foreground Card', type: 'shape', shapeKind: 'rounded-rectangle', x: 180, y: 290, w: 540, h: 170, rotation: 0, locked: false, visible: true, text: 'Stage 02 · Momentum',
        style: createDefaultStyle({ fill: solidFill('#fbbf24'), cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 38, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch4-a3', category: 'motion-path', effect: 'line', options: { direction: 'right', distance: 460 }, start: 'with-previous', duration: 1.3, delay: 0, repeat: 1, rewind: false, order: 3 }],
      },
    ],
  },
  {
    id: 'spotlight-orbit',
    number: 5,
    title: 'Hub & Radial Callouts',
    category: 'Emphasis',
    totalDuration: '1.5s',
    summary: 'A central hub grows and turns into focus, followed radially by four surrounding satellite callouts.',
    whyItWorks: 'Anchoring the centre first gives spatial meaning to every satellite bubble that blooms outward.',
    recipeBreakdown: [
      { step: 1, role: 'Central Hub', effect: 'Grow & Turn', trigger: 'With Previous', delay: '0.00s', duration: '0.60s', rationale: 'Creates focal gravity in the exact middle of the stage.' },
      { step: 2, role: 'Top-Left Satellite', effect: 'Zoom', trigger: 'After Previous', delay: '0.00s', duration: '0.35s', rationale: 'Starts clockwise orbit reveal.' },
      { step: 3, role: 'Top-Right Satellite', effect: 'Zoom', trigger: 'With Previous', delay: '0.12s', duration: '0.35s', rationale: 'Tight 120ms clockwise stagger.' },
      { step: 4, role: 'Bottom Satellites', effect: 'Zoom', trigger: 'With Previous', delay: '0.24s', duration: '0.35s', rationale: 'Completes the hub-and-spoke diagram cleanly.' },
    ],
    elements: [
      {
        id: 'ch5-hub', name: 'Core Hub', type: 'shape', shapeKind: 'circle', x: 780, y: 360, w: 360, h: 360, rotation: 0, locked: false, visible: true, text: 'Core Engine',
        style: createDefaultStyle({ fill: solidFill('#0284c7'), typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 42, fontWeight: 700, italic: false, underline: false, colour: '#ffffff', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch5-a1', category: 'entrance', effect: 'grow-and-turn', options: {}, start: 'with-previous', duration: 0.6, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch5-s1', name: 'Input API', type: 'shape', shapeKind: 'rounded-rectangle', x: 260, y: 200, w: 320, h: 120, rotation: 0, locked: false, visible: true, text: 'Inputs',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#38bdf8', width: 2, dash: 'solid' }, cornerRadius: 20, typography: { fontFamily: 'DM Sans', fontSize: 30, fontWeight: 600, italic: false, underline: false, colour: '#e2e8f0', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch5-a2', category: 'entrance', effect: 'zoom', options: {}, start: 'after-previous', duration: 0.35, delay: 0, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch5-s2', name: 'Rules', type: 'shape', shapeKind: 'rounded-rectangle', x: 1340, y: 200, w: 320, h: 120, rotation: 0, locked: false, visible: true, text: 'Rules',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#10b981', width: 2, dash: 'solid' }, cornerRadius: 20, typography: { fontFamily: 'DM Sans', fontSize: 30, fontWeight: 600, italic: false, underline: false, colour: '#e2e8f0', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch5-a3', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.35, delay: 0.12, repeat: 1, rewind: false, order: 3 }],
      },
      {
        id: 'ch5-s3', name: 'Outputs', type: 'shape', shapeKind: 'rounded-rectangle', x: 1340, y: 740, w: 320, h: 120, rotation: 0, locked: false, visible: true, text: 'Outputs',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#fbbf24', width: 2, dash: 'solid' }, cornerRadius: 20, typography: { fontFamily: 'DM Sans', fontSize: 30, fontWeight: 600, italic: false, underline: false, colour: '#e2e8f0', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch5-a4', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.35, delay: 0.24, repeat: 1, rewind: false, order: 4 }],
      },
    ],
  },
  {
    id: 'hero-focus-dim',
    number: 6,
    title: 'Spotlight Focus & Dim',
    category: 'Emphasis',
    totalDuration: '1.1s',
    summary: 'Secondary options fade to 35% transparency and desaturate while the chosen option grows 115% forward.',
    whyItWorks: 'Quietly dimming competitors is more persuasive—and far more executive—than spinning or bouncing the winner.',
    recipeBreakdown: [
      { step: 1, role: 'Option A (Dimmed)', effect: 'Transparency (35%)', trigger: 'With Previous', delay: '0.00s', duration: '0.60s', rationale: 'Recedes smoothly so it no longer competes for attention.' },
      { step: 2, role: 'Option B (Recommended)', effect: 'Grow (115%) + Pulse', trigger: 'With Previous', delay: '0.05s', duration: '0.65s', rationale: 'Steps slightly forward to signal the recommended decision.' },
      { step: 3, role: 'Option C (Dimmed)', effect: 'Desaturate', trigger: 'With Previous', delay: '0.00s', duration: '0.60s', rationale: 'Strips colour noise from unselected choices.' },
    ],
    elements: [
      {
        id: 'ch6-o1', name: 'Basic Tier', type: 'shape', shapeKind: 'rounded-rectangle', x: 200, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'Starter\n£19 / mo',
        style: createDefaultStyle({ fill: solidFill('#334155'), cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 40, fontWeight: 600, italic: false, underline: false, colour: '#e2e8f0', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }),
        animations: [{ id: 'ch6-a1', category: 'emphasis', effect: 'transparency', options: { targetOpacity: 35 }, start: 'with-previous', duration: 0.6, delay: 0.2, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch6-o2', name: 'Studio Pro Tier', type: 'shape', shapeKind: 'rounded-rectangle', x: 730, y: 290, w: 460, h: 500, rotation: 0, locked: false, visible: true, text: 'Studio Pro\n£49 / mo',
        style: createDefaultStyle({ fill: solidFill('#10b981'), cornerRadius: 28, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 44, fontWeight: 800, italic: false, underline: false, colour: '#052e16', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }),
        animations: [{ id: 'ch6-a2', category: 'emphasis', effect: 'grow-shrink', options: { targetScale: 114 }, start: 'with-previous', duration: 0.65, delay: 0.25, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch6-o3', name: 'Enterprise Tier', type: 'shape', shapeKind: 'rounded-rectangle', x: 1260, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'Enterprise\nCustom',
        style: createDefaultStyle({ fill: solidFill('#475569'), cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 40, fontWeight: 600, italic: false, underline: false, colour: '#e2e8f0', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }),
        animations: [{ id: 'ch6-a3', category: 'emphasis', effect: 'transparency', options: { targetOpacity: 35 }, start: 'with-previous', duration: 0.6, delay: 0.2, repeat: 1, rewind: false, order: 3 }],
      },
    ],
  },
  {
    id: 'before-after-swap',
    number: 7,
    title: 'Before → After Replacement',
    category: 'Storytelling',
    totalDuration: '1.6s',
    summary: 'The legacy state swivels/fades out before the improved replacement card zooms in at the exact same spot.',
    whyItWorks: 'Exit-then-Entrance on overlapping coordinates keeps your slide tidy without pushing elements into margins.',
    recipeBreakdown: [
      { step: 1, role: 'Legacy Card', effect: 'Fade Out', trigger: 'With Previous', delay: '0.35s', duration: '0.50s', rationale: 'Gives audience a brief moment to read "Before", then clears space.' },
      { step: 2, role: 'New Solution Card', effect: 'Zoom In', trigger: 'After Previous', delay: '0.05s', duration: '0.60s', rationale: 'Replaces the legacy card cleanly in the same visual anchor.' },
    ],
    elements: [
      {
        id: 'ch7-old', name: 'Legacy State', type: 'shape', shapeKind: 'rounded-rectangle', x: 520, y: 300, w: 880, h: 460, rotation: 0, locked: false, visible: true, text: 'Before · Manual Spreadsheets\n4.5 Hours Weekly',
        style: createDefaultStyle({ fill: solidFill('#3f3f46'), cornerRadius: 28, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 44, fontWeight: 700, italic: false, underline: false, colour: '#e4e4e7', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }),
        animations: [{ id: 'ch7-a1', category: 'exit', effect: 'fade-out', options: {}, start: 'with-previous', duration: 0.5, delay: 0.45, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch7-new', name: 'Modern State', type: 'shape', shapeKind: 'rounded-rectangle', x: 520, y: 300, w: 880, h: 460, rotation: 0, locked: false, visible: true, text: 'After · Automated Sync\n12 Minutes Weekly',
        style: createDefaultStyle({ fill: solidFill('#0284c7'), cornerRadius: 28, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 46, fontWeight: 800, italic: false, underline: false, colour: '#ffffff', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }),
        animations: [{ id: 'ch7-a2', category: 'entrance', effect: 'zoom', options: {}, start: 'after-previous', duration: 0.6, delay: 0.05, repeat: 1, rewind: false, order: 2 }],
      },
    ],
  },
  {
    id: 'process-rail-wave',
    number: 8,
    title: 'Process Rail & Milestones',
    category: 'Stagger',
    totalDuration: '1.9s',
    summary: 'The horizontal connector rail wipes across from left to right, triggering each circular milestone along the way.',
    whyItWorks: 'Synchronising milestone entrances with the wiping progress bar makes the timeline read like a live progressing route.',
    recipeBreakdown: [
      { step: 1, role: 'Progress Track', effect: 'Wipe (Left)', trigger: 'With Previous', delay: '0.00s', duration: '0.90s', rationale: 'Sweeps steadily across the slide width.' },
      { step: 2, role: 'Step 1 Node', effect: 'Zoom', trigger: 'With Previous', delay: '0.15s', duration: '0.40s', rationale: 'Pops in right as the wipe reaches X: 350.' },
      { step: 3, role: 'Step 2 Node', effect: 'Zoom', trigger: 'With Previous', delay: '0.45s', duration: '0.40s', rationale: 'Pops in as the wipe crosses the midpoint.' },
      { step: 4, role: 'Step 3 Node', effect: 'Bounce', trigger: 'With Previous', delay: '0.75s', duration: '0.60s', rationale: 'Lands the final milestone with celebratory bounce.' },
    ],
    elements: [
      {
        id: 'ch8-rail', name: 'Timeline Track', type: 'shape', shapeKind: 'rounded-rectangle', x: 240, y: 525, w: 1440, h: 18, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: solidFill('#38bdf8'), cornerRadius: 9 }),
        animations: [{ id: 'ch8-a1', category: 'entrance', effect: 'wipe', options: { direction: 'left' }, start: 'with-previous', duration: 0.9, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch8-n1', name: 'Milestone 1', type: 'shape', shapeKind: 'circle', x: 240, y: 424, w: 220, h: 220, rotation: 0, locked: false, visible: true, text: '01\nAudit',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#38bdf8', width: 6, dash: 'solid' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'centre', verticalAlign: 'middle', lineHeight: 1.25, letterSpacing: 0 } }),
        animations: [{ id: 'ch8-a2', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.4, delay: 0.15, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch8-n2', name: 'Milestone 2', type: 'shape', shapeKind: 'circle', x: 850, y: 424, w: 220, h: 220, rotation: 0, locked: false, visible: true, text: '02\nBuild',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#10b981', width: 6, dash: 'solid' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'centre', verticalAlign: 'middle', lineHeight: 1.25, letterSpacing: 0 } }),
        animations: [{ id: 'ch8-a3', category: 'entrance', effect: 'zoom', options: {}, start: 'with-previous', duration: 0.4, delay: 0.45, repeat: 1, rewind: false, order: 3 }],
      },
      {
        id: 'ch8-n3', name: 'Milestone 3', type: 'shape', shapeKind: 'circle', x: 1460, y: 424, w: 220, h: 220, rotation: 0, locked: false, visible: true, text: '03\nScale',
        style: createDefaultStyle({ fill: solidFill('#fbbf24'), typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 32, fontWeight: 800, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1.25, letterSpacing: 0 } }),
        animations: [{ id: 'ch8-a4', category: 'entrance', effect: 'bounce', options: {}, start: 'with-previous', duration: 0.6, delay: 0.75, repeat: 1, rewind: false, order: 4 }],
      },
    ],
  },
  {
    id: 'diagram-assembly',
    number: 9,
    title: 'Convergent Diagram Build',
    category: 'Storytelling',
    totalDuration: '1.2s',
    summary: 'Left and right building blocks glide inward simultaneously to snap around a central emblem.',
    whyItWorks: 'Symmetric inward Fly-In motion physically visualises "bringing teams or systems together".',
    recipeBreakdown: [
      { step: 1, role: 'Central Emblem', effect: 'Shape (Circle)', trigger: 'With Previous', delay: '0.00s', duration: '0.50s', rationale: 'Blooms from the centre point.' },
      { step: 2, role: 'Left Pillar', effect: 'Fly In (Left)', trigger: 'With Previous', delay: '0.20s', duration: '0.60s', rationale: 'Glides inward from the left margin.' },
      { step: 3, role: 'Right Pillar', effect: 'Fly In (Right)', trigger: 'With Previous', delay: '0.20s', duration: '0.60s', rationale: 'Mirrors the Left Pillar inward for symmetric snap.' },
    ],
    elements: [
      {
        id: 'ch9-core', name: 'Unified Hub', type: 'shape', shapeKind: 'circle', x: 810, y: 390, w: 300, h: 300, rotation: 0, locked: false, visible: true, text: 'Aligned',
        style: createDefaultStyle({ fill: solidFill('#10b981'), typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 44, fontWeight: 800, italic: false, underline: false, colour: '#052e16', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch9-a1', category: 'entrance', effect: 'shape', options: { shapeMask: 'circle' }, start: 'with-previous', duration: 0.5, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch9-left', name: 'Design Team', type: 'shape', shapeKind: 'rounded-rectangle', x: 240, y: 450, w: 460, h: 180, rotation: 0, locked: false, visible: true, text: 'Design System →',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#38bdf8', width: 2, dash: 'solid' }, cornerRadius: 20, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 34, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch9-a2', category: 'entrance', effect: 'fly-in', options: { direction: 'left' }, start: 'with-previous', duration: 0.6, delay: 0.2, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch9-right', name: 'Engineering Team', type: 'shape', shapeKind: 'rounded-rectangle', x: 1220, y: 450, w: 460, h: 180, rotation: 0, locked: false, visible: true, text: '← Engineering',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), outline: { colour: '#fbbf24', width: 2, dash: 'solid' }, cornerRadius: 20, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 34, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch9-a3', category: 'entrance', effect: 'fly-in', options: { direction: 'right' }, start: 'with-previous', duration: 0.6, delay: 0.2, repeat: 1, rewind: false, order: 3 }],
      },
    ],
  },
  {
    id: 'callout-pulse-alert',
    number: 10,
    title: 'Data Bar + Callout Alert',
    category: 'Emphasis',
    totalDuration: '1.7s',
    summary: 'Two data bars wipe upward cleanly, then a crisp callout badge pops above the outlier with a calm pulse.',
    whyItWorks: 'Showing the baseline bars before popping the callout lets the audience spot the trend right before you explain it.',
    recipeBreakdown: [
      { step: 1, role: 'Q1 Baseline Bar', effect: 'Wipe (Bottom)', trigger: 'With Previous', delay: '0.00s', duration: '0.50s', rationale: 'Grows upward like a real bar chart.' },
      { step: 2, role: 'Q2 Peak Bar', effect: 'Wipe (Bottom)', trigger: 'With Previous', delay: '0.18s', duration: '0.60s', rationale: 'Climbs higher to reveal the jump.' },
      { step: 3, role: 'Insight Callout', effect: 'Zoom + Pulse', trigger: 'After Previous', delay: '0.00s', duration: '0.40s + 0.55s', rationale: 'Draws attention directly to the inflection point.' },
    ],
    elements: [
      {
        id: 'ch10-b1', name: 'Q1 Bar', type: 'shape', shapeKind: 'rounded-rectangle', x: 520, y: 560, w: 220, h: 320, rotation: 0, locked: false, visible: true, text: 'Q1\n32%',
        style: createDefaultStyle({ fill: solidFill('#334155'), cornerRadius: 16, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.3, letterSpacing: 0 } }),
        animations: [{ id: 'ch10-a1', category: 'entrance', effect: 'wipe', options: { direction: 'bottom' }, start: 'with-previous', duration: 0.5, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch10-b2', name: 'Q2 Bar', type: 'shape', shapeKind: 'rounded-rectangle', x: 860, y: 340, w: 220, h: 540, rotation: 0, locked: false, visible: true, text: 'Q2\n78%',
        style: createDefaultStyle({ fill: solidFill('#0284c7'), cornerRadius: 16, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 34, fontWeight: 800, italic: false, underline: false, colour: '#ffffff', align: 'centre', verticalAlign: 'middle', lineHeight: 1.3, letterSpacing: 0 } }),
        animations: [{ id: 'ch10-a2', category: 'entrance', effect: 'wipe', options: { direction: 'bottom' }, start: 'with-previous', duration: 0.6, delay: 0.18, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch10-call', name: 'Outlier Callout', type: 'shape', shapeKind: 'callout', x: 1120, y: 210, w: 400, h: 170, rotation: 0, locked: false, visible: true, text: '+143% Lift after launch',
        style: createDefaultStyle({ fill: solidFill('#fbbf24'), typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 30, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [
          { id: 'ch10-a3', category: 'entrance', effect: 'zoom', options: {}, start: 'after-previous', duration: 0.4, delay: 0, repeat: 1, rewind: false, order: 3 },
          { id: 'ch10-a4', category: 'emphasis', effect: 'pulse', options: { scale: 110 }, start: 'after-previous', duration: 0.55, delay: 0.05, repeat: 1, rewind: true, order: 4 },
        ],
      },
    ],
  },
  {
    id: 'arc-journey-orbit',
    number: 11,
    title: 'Arc Object Journey',
    category: 'Parallax',
    totalDuration: '1.5s',
    summary: 'A focal star traces a sweeping parabolic arc between two anchor pedestals while a headline reveals cleanly.',
    whyItWorks: 'Curved Arc motion feels organic and intentional compared to robotic straight-line hops.',
    recipeBreakdown: [
      { step: 1, role: 'Pedestals A & B', effect: 'Fade', trigger: 'With Previous', delay: '0.00s', duration: '0.40s', rationale: 'Sets the origin and destination landmarks.' },
      { step: 2, role: 'Travelling Star', effect: 'Arc Motion Path', trigger: 'After Previous', delay: '0.00s', duration: '1.00s', rationale: 'Soars cleanly along a 780px curved arc between pedestals.' },
    ],
    elements: [
      {
        id: 'ch11-p1', name: 'Origin Base', type: 'shape', shapeKind: 'rounded-rectangle', x: 320, y: 660, w: 300, h: 120, rotation: 0, locked: false, visible: true, text: 'Idea',
        style: createDefaultStyle({ fill: solidFill('#1e293b'), cornerRadius: 20, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch11-a1', category: 'entrance', effect: 'fade', options: {}, start: 'with-previous', duration: 0.4, delay: 0, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch11-p2', name: 'Target Base', type: 'shape', shapeKind: 'rounded-rectangle', x: 1240, y: 660, w: 300, h: 120, rotation: 0, locked: false, visible: true, text: 'Impact',
        style: createDefaultStyle({ fill: solidFill('#10b981'), cornerRadius: 20, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#052e16', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }),
        animations: [{ id: 'ch11-a2', category: 'entrance', effect: 'fade', options: {}, start: 'with-previous', duration: 0.4, delay: 0, repeat: 1, rewind: false, order: 2 }],
      },
      {
        id: 'ch11-star', name: 'Travelling Star', type: 'shape', shapeKind: 'star', x: 400, y: 470, w: 140, h: 140, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: solidFill('#fbbf24') }),
        animations: [{ id: 'ch11-a3', category: 'motion-path', effect: 'arc', options: { direction: 'up', distance: 920 }, start: 'after-previous', duration: 1.0, delay: 0.05, repeat: 1, rewind: false, order: 3 }],
      },
    ],
  },
  {
    id: 'closing-cta-curtain',
    number: 12,
    title: 'Closing Keynote & CTA',
    category: 'Storytelling',
    totalDuration: '1.5s',
    summary: 'Supporting context gently exits while the final Call-to-Action button blooms to hold the room.',
    whyItWorks: 'Clearing secondary elements at the end of a talk leaves zero visual friction before Q&A.',
    recipeBreakdown: [
      { step: 1, role: 'Summary Note', effect: 'Fade Out', trigger: 'With Previous', delay: '0.45s', duration: '0.45s', rationale: 'Clears supporting copy once digested.' },
      { step: 2, role: 'Final CTA Banner', effect: 'Zoom + Spin Accent', trigger: 'After Previous', delay: '0.00s', duration: '0.55s', rationale: 'Claims centre stage with calm confidence.' },
    ],
    elements: [
      {
        id: 'ch12-note', name: 'Recap Line', type: 'text', x: 360, y: 260, w: 1200, h: 120, rotation: 0, locked: false, visible: true, text: 'Three pillars · One unified craft',
        style: createDefaultStyle({ fill: NONE_FILL, typography: { fontFamily: 'DM Sans', fontSize: 40, fontWeight: 500, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.3, letterSpacing: 0 } }),
        animations: [{ id: 'ch12-a1', category: 'exit', effect: 'fade-out', options: {}, start: 'with-previous', duration: 0.45, delay: 0.45, repeat: 1, rewind: false, order: 1 }],
      },
      {
        id: 'ch12-cta', name: 'Final CTA', type: 'shape', shapeKind: 'rounded-rectangle', x: 480, y: 420, w: 960, h: 240, rotation: 0, locked: false, visible: true, text: 'Let’s Build Something Remarkable',
        style: createDefaultStyle({ fill: solidFill('#38bdf8'), cornerRadius: 32, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 48, fontWeight: 800, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1.25, letterSpacing: -0.5 } }),
        animations: [{ id: 'ch12-a2', category: 'entrance', effect: 'zoom', options: {}, start: 'after-previous', duration: 0.55, delay: 0, repeat: 1, rewind: false, order: 2 }],
      },
    ],
  },
];
