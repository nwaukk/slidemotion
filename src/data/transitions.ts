import { createDefaultStyle } from './themes';
import { Slide, SlideElement, SlideTransition } from '../types/presentation';

export interface TransitionDefinition {
  id: string;
  name: string;
  category: SlideTransition['category'];
  defaultDuration: number;
  directions?: Array<{ value: string; label: string }>;
  defaultDirection?: string;
  mood: 'subtle' | 'formal' | 'dramatic' | 'playful';
  audience: string;
  whatItDoes: string;
  whenToUse: string;
  whenToAvoid: string;
  proTip: string;
  flashes?: boolean;
}

const FOUR_DIRS = [
  { value: 'left', label: 'From Right (Moves Left)' },
  { value: 'right', label: 'From Left (Moves Right)' },
  { value: 'up', label: 'From Bottom (Moves Up)' },
  { value: 'down', label: 'From Top (Moves Down)' },
];

const SPLIT_DIRS = [
  { value: 'vertical-out', label: 'Vertical Out' },
  { value: 'vertical-in', label: 'Vertical In' },
  { value: 'horizontal-out', label: 'Horizontal Out' },
  { value: 'horizontal-in', label: 'Horizontal In' },
];

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  // SUBTLE (9)
  {
    id: 'fade',
    name: 'Fade',
    category: 'subtle',
    defaultDuration: 0.6,
    directions: [
      { value: 'smooth', label: 'Smooth Cross-Fade' },
      { value: 'black', label: 'Through Black' },
    ],
    defaultDirection: 'smooth',
    mood: 'subtle',
    audience: 'Executives, conferences, lectures, client briefings',
    whatItDoes: 'Gently dissolves the outgoing slide out while fading the incoming slide in.',
    whenToUse: 'Moving between related points on the same theme without breaking rhythm.',
    whenToAvoid: 'Major chapter changes where you want a clearer spatial reset.',
    proTip: 'Use "Through Black" between major acts of a keynote to create a quiet pause.',
  },
  {
    id: 'push',
    name: 'Push',
    category: 'subtle',
    defaultDuration: 0.65,
    directions: FOUR_DIRS,
    defaultDirection: 'left',
    mood: 'formal',
    audience: 'Product demos, process walkthroughs, timelines',
    whatItDoes: 'The incoming slide pushes the outgoing slide off the screen edge.',
    whenToUse: 'Showing a continuous timeline, panoramic view, or sequential steps.',
    whenToAvoid: 'Unrelated topics or back-and-forth comparisons.',
    proTip: 'Match Push direction to reading order: move left for next step, down for deeper detail.',
  },
  {
    id: 'wipe',
    name: 'Wipe',
    category: 'subtle',
    defaultDuration: 0.6,
    directions: FOUR_DIRS,
    defaultDirection: 'left',
    mood: 'subtle',
    audience: 'Design reviews, data stories, editorial decks',
    whatItDoes: 'Sweeps a clean edge across the screen to reveal the new slide in place.',
    whenToUse: 'Before-and-after views or updating a chart without moving its axes.',
    whenToAvoid: 'High-contrast chaotic slides where the sweeping edge flickers.',
    proTip: 'Wipe works brilliantly when both slides share a grid so only changing content updates.',
  },
  {
    id: 'split',
    name: 'Split',
    category: 'subtle',
    defaultDuration: 0.65,
    directions: SPLIT_DIRS,
    defaultDirection: 'vertical-out',
    mood: 'formal',
    audience: 'Section intros, formal briefings',
    whatItDoes: 'Opens the new slide from the centre line outwards, or closes inwards.',
    whenToUse: 'Opening a new agenda chapter or revealing a symmetrical title.',
    whenToAvoid: 'Asymmetric layouts with heavy left-side text.',
    proTip: 'Vertical Out pairs naturally with centred title slides.',
  },
  {
    id: 'reveal',
    name: 'Reveal',
    category: 'subtle',
    defaultDuration: 0.75,
    directions: [
      { value: 'left', label: 'Slide Left Through Dark' },
      { value: 'right', label: 'Slide Right Through Dark' },
    ],
    defaultDirection: 'left',
    mood: 'subtle',
    audience: 'Keynotes, architectural and creative pitches',
    whatItDoes: 'Fades the outgoing slide softly as it glides aside to uncover the next slide.',
    whenToUse: 'Calm topic changes where Push feels too mechanical.',
    whenToAvoid: 'Fast back-and-forth Q&A slides.',
    proTip: 'Keep duration around 0.75s so the cross-fade feels unhurried.',
  },
  {
    id: 'cover',
    name: 'Cover',
    category: 'subtle',
    defaultDuration: 0.6,
    directions: FOUR_DIRS,
    defaultDirection: 'left',
    mood: 'formal',
    audience: 'Workshops, layered slide decks',
    whatItDoes: 'Slides the incoming slide over top of the stationary outgoing slide.',
    whenToUse: 'Layering a new detail card or summary sheet over an existing topic.',
    whenToAvoid: 'Returning back to an overview (use Uncover instead).',
    proTip: 'Use Cover moving forward and Uncover when stepping back to feel like real paper cards.',
  },
  {
    id: 'uncover',
    name: 'Uncover',
    category: 'subtle',
    defaultDuration: 0.6,
    directions: FOUR_DIRS,
    defaultDirection: 'right',
    mood: 'subtle',
    audience: 'Training decks, layered storytelling',
    whatItDoes: 'Pulls the outgoing slide away to reveal the waiting slide beneath it.',
    whenToUse: 'Revealing an answer behind a question slide, or dismissing a temporary detail.',
    whenToAvoid: 'Introducing a heavier, dominant title slide.',
    proTip: 'Uncover is ideal for "Problem slide → Solution waiting underneath".',
  },
  {
    id: 'flash',
    name: 'Flash',
    category: 'subtle',
    defaultDuration: 0.7,
    mood: 'dramatic',
    audience: 'Photo showcases, event openers',
    whatItDoes: 'Briefly brightens towards white between slides like a camera shutter.',
    whenToUse: 'Transitioning between high-impact photography or film stills.',
    whenToAvoid: 'Dense text slides, dark rooms, or photosensitive audiences.',
    flashes: true,
    proTip: 'SlideMotion keeps Flash gentler and slower than 3 flashes/sec for viewer comfort.',
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    category: 'subtle',
    defaultDuration: 0.7,
    mood: 'playful',
    audience: 'Creative retrospectives, digital media talks',
    whatItDoes: 'Breaks the frame into fine cells that dissolve sequentially into the next slide.',
    whenToUse: 'Retro, digital or mosaic-themed transitions between distinct visual scenes.',
    whenToAvoid: 'Corporate reports or small-font tables.',
    proTip: 'Use Dissolve once at a section break rather than on every slide.',
  },

  // EXCITING (15+)
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'exciting',
    defaultDuration: 0.75,
    directions: [
      { value: 'in', label: 'Zoom In' },
      { value: 'out', label: 'Zoom Out' },
    ],
    defaultDirection: 'in',
    mood: 'dramatic',
    audience: 'Product launches, investor pitches',
    whatItDoes: 'Scales forward into the incoming slide (or pulls back out of the current slide).',
    whenToUse: 'Zooming into a sub-topic or pulling back out to the big picture.',
    whenToAvoid: 'Sequential bullet slides where spatial zooming feels disorienting.',
    proTip: 'Zoom In = going deeper into detail; Zoom Out = stepping back to summary.',
  },
  {
    id: 'flip',
    name: 'Flip',
    category: 'exciting',
    defaultDuration: 0.85,
    directions: [
      { value: 'left', label: 'Flip Left' },
      { value: 'right', label: 'Flip Right' },
    ],
    defaultDirection: 'left',
    mood: 'playful',
    audience: 'Interactive quizzes, front/back product cards',
    whatItDoes: 'Rotates the slide 180 degrees in 3D space like turning over a physical card.',
    whenToUse: 'Showing the reverse side of a concept (Myth vs Fact, Question vs Answer).',
    whenToAvoid: 'Long decks with many consecutive flips.',
    proTip: 'Keep the background shade dark around the flip so the 3D edge reads cleanly.',
  },
  {
    id: 'doors',
    name: 'Doors',
    category: 'exciting',
    defaultDuration: 0.9,
    directions: [
      { value: 'horizontal', label: 'Horizontal Doors' },
      { value: 'vertical', label: 'Vertical Doors' },
    ],
    defaultDirection: 'horizontal',
    mood: 'dramatic',
    audience: 'Event launches, keynote reveals',
    whatItDoes: 'Splits the outgoing slide down the middle and swings both halves open like doors.',
    whenToUse: 'Grand openings to a major new product or section.',
    whenToAvoid: 'Mid-section informational slides.',
    proTip: 'Works best when the outgoing slide is a clean dark title card.',
  },
  {
    id: 'box',
    name: 'Box',
    category: 'exciting',
    defaultDuration: 0.85,
    directions: FOUR_DIRS,
    defaultDirection: 'left',
    mood: 'dramatic',
    audience: '3D product tours, architectural reviews',
    whatItDoes: 'Rotates both slides as adjacent outer faces of a 3D box.',
    whenToUse: 'Rotating between four perspectives of one product or quarterly pillar.',
    whenToAvoid: 'Text-heavy financial tables.',
    proTip: 'Keep directions consistent (e.g. always Left) so the audience senses a continuous cube.',
  },
  {
    id: 'cube',
    name: 'Cube',
    category: 'exciting',
    defaultDuration: 0.9,
    directions: FOUR_DIRS,
    defaultDirection: 'left',
    mood: 'dramatic',
    audience: 'Executive showcases, multi-angle demos',
    whatItDoes: 'Pivots the stage in deep 3D perspective like turning a solid exhibition cube.',
    whenToUse: 'Switching between four main themes or regional views.',
    whenToAvoid: 'More than 3–4 times in a row (can feel dizzying).',
    proTip: '0.85s with Ease In Out prevents the cube corners from snapping abruptly.',
  },
  {
    id: 'vortex',
    name: 'Vortex',
    category: 'exciting',
    defaultDuration: 1.0,
    directions: FOUR_DIRS,
    defaultDirection: 'left',
    mood: 'playful',
    audience: 'Creative reels, bold entertainment pitches',
    whatItDoes: 'Swirls tiles off in a spiral wave while spinning the new slide into place.',
    whenToUse: 'High-energy creative openers or dramatic resets.',
    whenToAvoid: 'Formal, scientific, medical or financial audiences.',
    proTip: 'Reserve theatrical transitions like Vortex for the opening or closing slide only.',
  },
  {
    id: 'ripple',
    name: 'Ripple',
    category: 'exciting',
    defaultDuration: 0.95,
    mood: 'playful',
    audience: 'Water/sustainability themes, creative keynotes',
    whatItDoes: 'Expands concentric rings outwards from the centre to reveal the next slide.',
    whenToUse: 'Illustrating "ripple effects", impact stories, or calm visual shifts.',
    whenToAvoid: 'Technical spreadsheets or bullet lists.',
    proTip: 'Pair Ripple with clean photographic or gradient slides.',
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb',
    category: 'exciting',
    defaultDuration: 1.05,
    mood: 'dramatic',
    audience: 'Science, technology, network talks',
    whatItDoes: 'Breaks the transition across staggered hexagonal cells.',
    whenToUse: 'Topics about networks, ecosystems, modular systems or teamwork.',
    whenToAvoid: 'Small-text dense slides.',
    proTip: 'Use when introducing a modular architecture diagram.',
  },
  {
    id: 'curtains',
    name: 'Curtains',
    category: 'exciting',
    defaultDuration: 1.1,
    mood: 'dramatic',
    audience: 'Award ceremonies, grand reveals, theatres',
    whatItDoes: 'Parts the outgoing slide from the centre like stage curtains opening.',
    whenToUse: 'The very first slide reveal or an award winner announcement.',
    whenToAvoid: 'Regular slide-to-slide navigation.',
    proTip: 'Start on a dark welcome slide, then part Curtains onto your hero title.',
  },
  {
    id: 'page-curl',
    name: 'Page Curl',
    category: 'exciting',
    defaultDuration: 0.9,
    directions: [
      { value: 'right', label: 'Curl from Bottom-Right' },
      { value: 'left', label: 'Curl from Bottom-Left' },
    ],
    defaultDirection: 'right',
    mood: 'subtle',
    audience: 'Publishing, portfolios, annual reports, case studies',
    whatItDoes: 'Lifts the corner of the outgoing slide like turning a printed magazine page.',
    whenToUse: 'Editorial storytelling, lookbooks, or chapter-by-chapter reports.',
    whenToAvoid: 'Futuristic software demos.',
    proTip: 'Looks best on light ivory or paper-toned slide themes.',
  },
  {
    id: 'fracture',
    name: 'Fracture',
    category: 'exciting',
    defaultDuration: 0.95,
    mood: 'dramatic',
    audience: 'Disruption pitches, bold creative decks',
    whatItDoes: 'Splits the outgoing slide into sharp geometric shards that drift apart.',
    whenToUse: 'Illustrating "breaking the status quo" or dramatic problem statements.',
    whenToAvoid: 'Calm corporate updates or sensitive topics.',
    proTip: 'Use once right before introducing your breakthrough solution.',
  },
  {
    id: 'shred',
    name: 'Shred',
    category: 'exciting',
    defaultDuration: 0.95,
    directions: [
      { value: 'vertical', label: 'Vertical Strips' },
      { value: 'horizontal', label: 'Horizontal Strips' },
    ],
    defaultDirection: 'vertical',
    mood: 'playful',
    audience: 'Creative workshops, energetic pitches',
    whatItDoes: 'Slices the slide into alternating strips that slide away in opposite directions.',
    whenToUse: 'Playful transitions between bold visual posters.',
    whenToAvoid: 'Any slide containing fine typography or tables.',
    proTip: 'Vertical strips read cleanly on wide 16:9 stages.',
  },
  {
    id: 'origami',
    name: 'Origami',
    category: 'exciting',
    defaultDuration: 1.0,
    mood: 'playful',
    audience: 'Craft, design, education, creative agencies',
    whatItDoes: 'Folds the outgoing slide along crisp diagonal creases to reveal the next slide.',
    whenToUse: 'Design studios, paper/craft metaphors or playful section breaks.',
    whenToAvoid: 'Data-heavy analytics decks.',
    proTip: 'Works particularly well when transitioning from a solid colour card to a photo.',
  },
  {
    id: 'peel-off',
    name: 'Peel Off',
    category: 'exciting',
    defaultDuration: 0.85,
    directions: [
      { value: 'left', label: 'Peel Left' },
      { value: 'right', label: 'Peel Right' },
    ],
    defaultDirection: 'left',
    mood: 'playful',
    audience: 'Sticky-note brainstorming, workshops, design sprints',
    whatItDoes: 'Peels the outgoing slide away from one edge like removing a sticker.',
    whenToUse: 'Moving between ideation boards or workshop prompts.',
    whenToAvoid: 'Formal boardroom reports.',
    proTip: 'Great for revealing answers under a workshop prompt card.',
  },

  // DYNAMIC CONTENT / SPATIAL (including MORPH)
  {
    id: 'morph',
    name: 'Morph',
    category: 'dynamic',
    defaultDuration: 0.9,
    mood: 'subtle',
    audience: 'Every audience—from boardrooms to Apple-style keynotes',
    whatItDoes:
      'Matches objects by name across consecutive slides and smoothly animates their position, size, rotation, colour and text.',
    whenToUse: 'Zooming into details, transforming diagrams, timeline journeys, and seamless storytelling.',
    whenToAvoid: 'Completely unrelated slides with zero shared objects.',
    proTip: 'Duplicate Slide 1, move or restyle elements on Slide 2, and prefix shared names with !!.',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    category: 'dynamic',
    defaultDuration: 0.85,
    directions: [
      { value: 'left', label: 'From Right' },
      { value: 'right', label: 'From Left' },
    ],
    defaultDirection: 'left',
    mood: 'formal',
    audience: 'Portfolios, museum exhibitions, brand reviews',
    whatItDoes: 'Steps back slightly and glides slides sideways like framed canvases in a gallery.',
    whenToUse: 'Reviewing a series of designs, mockups or case studies.',
    whenToAvoid: 'Quick rapid-fire Q&A slides.',
    proTip: 'Consistent margins across slides make Gallery look effortlessly curated.',
  },
  {
    id: 'window',
    name: 'Window',
    category: 'dynamic',
    defaultDuration: 0.9,
    directions: [
      { value: 'vertical', label: 'Vertical Panes' },
      { value: 'horizontal', label: 'Horizontal Panes' },
    ],
    defaultDirection: 'vertical',
    mood: 'dramatic',
    audience: 'Architecture, editorial showcases',
    whatItDoes: 'Swings the outgoing slide open outward in 3D like two casement window panes.',
    whenToUse: 'Opening a new perspective or "looking out" onto a vision slide.',
    whenToAvoid: 'Small text slides.',
    proTip: 'Subtler than Doors when used with a 0.85s ease-out curve.',
  },
  {
    id: 'ferris-wheel',
    name: 'Ferris Wheel',
    category: 'dynamic',
    defaultDuration: 0.95,
    directions: [
      { value: 'left', label: 'Sweep Left' },
      { value: 'right', label: 'Sweep Right' },
    ],
    defaultDirection: 'left',
    mood: 'playful',
    audience: 'Creative pitches, cyclical topics',
    whatItDoes: 'Swings slides along a large circular arc in and out of the frame.',
    whenToUse: 'Playful storytelling or rotating through team/customer stories.',
    whenToAvoid: 'Serious financial briefings.',
    proTip: 'Keep slide backgrounds dark so the rotating frame edges stay clean.',
  },
  {
    id: 'conveyor',
    name: 'Conveyor',
    category: 'dynamic',
    defaultDuration: 0.85,
    directions: [
      { value: 'left', label: 'Conveyor Left' },
      { value: 'right', label: 'Conveyor Right' },
    ],
    defaultDirection: 'left',
    mood: 'formal',
    audience: 'Operations, manufacturing, logistics, process decks',
    whatItDoes: 'Carries slides along an angled perspective track from one side to the other.',
    whenToUse: 'Step-by-step production pipelines or sequential stages.',
    whenToAvoid: 'Static reference decks.',
    proTip: 'Ideal for illustrating sequential stages in an operations pipeline.',
  },
  {
    id: 'rotate',
    name: 'Rotate',
    category: 'dynamic',
    defaultDuration: 0.85,
    directions: [
      { value: 'left', label: 'Rotate Left' },
      { value: 'right', label: 'Rotate Right' },
    ],
    defaultDirection: 'left',
    mood: 'dramatic',
    audience: 'Product launches, engineering demos',
    whatItDoes: 'Pivots the entire slide 90° around an off-screen axis in 3D space.',
    whenToUse: 'Shifting viewpoint cleanly between two phases.',
    whenToAvoid: 'Every slide in a long presentation.',
    proTip: 'Use Rotate at major narrative turning points.',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    category: 'dynamic',
    defaultDuration: 0.95,
    directions: [
      { value: 'left', label: 'Orbit Left' },
      { value: 'right', label: 'Orbit Right' },
    ],
    defaultDirection: 'left',
    mood: 'dramatic',
    audience: 'Space, innovation, 3D design reviews',
    whatItDoes: 'Swings the camera in an orbital arc around the slides in 3D depth.',
    whenToUse: 'Transitioning between global perspectives or system modules.',
    whenToAvoid: 'Text-heavy reading slides.',
    proTip: 'Slow Orbit (0.5×) shows how CSS perspective depth creates realistic spatial parallax.',
  },
  {
    id: 'fly-through',
    name: 'Fly Through',
    category: 'dynamic',
    defaultDuration: 0.9,
    directions: [
      { value: 'in', label: 'Fly Forward' },
      { value: 'out', label: 'Fly Backward' },
    ],
    defaultDirection: 'in',
    mood: 'dramatic',
    audience: 'Keynotes, futuristic launches, deep dives',
    whatItDoes: 'Accelerates the outgoing slide past the camera while the incoming slide zooms forward from the background.',
    whenToUse: 'Diving deep into a core insight or breaking into a new chapter.',
    whenToAvoid: 'Subtle everyday updates.',
    proTip: 'Pairs well with bold minimalist slides that have one clear central focal point.',
  },
];

export interface TransitionRecommendationGoal {
  id: string;
  label: string;
  description: string;
  recommendedIds: string[];
  reason: string;
}

export const TRANSITION_GOALS: TransitionRecommendationGoal[] = [
  {
    id: 'new-section',
    label: 'New section',
    description: 'Signalling a clear chapter change in your talk.',
    recommendedIds: ['push', 'split', 'gallery'],
    reason: 'Directional or symmetrical transitions give the audience a clean mental reset before a new chapter.',
  },
  {
    id: 'same-topic',
    label: 'Same topic',
    description: 'Moving smoothly to the next supporting slide.',
    recommendedIds: ['morph', 'fade', 'wipe'],
    reason: 'Morph keeps shared anchors steady while Fade and Wipe update content without spatial distraction.',
  },
  {
    id: 'emphasis',
    label: 'Emphasis',
    description: 'Zooming into a key detail or before-and-after.',
    recommendedIds: ['morph', 'zoom', 'uncover'],
    reason: 'Morph and Zoom physically direct attention towards the highlighted detail.',
  },
  {
    id: 'dramatic-reveal',
    label: 'Dramatic reveal',
    description: 'Opening a keynote or launching a flagship idea.',
    recommendedIds: ['doors', 'fly-through', 'curtains'],
    reason: 'Parting panels or camera fly-throughs build anticipation for a high-stakes reveal.',
  },
  {
    id: 'formal-report',
    label: 'Formal report',
    description: 'Boardroom, academic, financial or client briefing.',
    recommendedIds: ['fade', 'wipe', 'morph'],
    reason: 'Subtle, disciplined transitions keep credibility high and never distract from data.',
  },
  {
    id: 'creative-pitch',
    label: 'Creative pitch',
    description: 'Agency credential deck, portfolio or design review.',
    recommendedIds: ['morph', 'page-curl', 'cube'],
    reason: 'Tactile 3D turns and seamless Morph continuity showcase craft without looking gimmicky.',
  },
];

export function createSampleTransitionPair(): { slideA: Slide; slideB: Slide } {
  const slideA: Slide = {
    id: 'sample-a',
    title: 'Sample Slide A',
    useMaster: false,
    background: {
      mode: 'gradient',
      colour: '#0f172a',
      gradientStart: '#0b1222',
      gradientEnd: '#1e3a8a',
      gradientAngle: 135,
    },
    transition: { type: 'morph', category: 'dynamic', duration: 0.9, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', morphMode: 'objects' },
    notes: '',
    elements: [
      {
        id: 'sa-circle',
        name: '!!HeroOrb',
        type: 'shape',
        shapeKind: 'circle',
        x: 1180,
        y: 240,
        w: 520,
        h: 520,
        rotation: 0,
        locked: false,
        visible: true,
        text: '',
        style: createDefaultStyle({
          fill: { mode: 'gradient', colour: '#38bdf8', gradientStart: '#2dd4bf', gradientEnd: '#2563eb', gradientAngle: 140, gradientType: 'linear' },
        }),
        animations: [],
      },
      {
        id: 'sa-badge',
        name: '!!AccentBar',
        type: 'shape',
        shapeKind: 'rounded-rectangle',
        x: 180,
        y: 320,
        w: 140,
        h: 12,
        rotation: 0,
        locked: false,
        visible: true,
        text: '',
        style: createDefaultStyle({
          fill: { mode: 'solid', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#f59e0b', gradientAngle: 90, gradientType: 'linear' },
          cornerRadius: 6,
        }),
        animations: [],
      },
      {
        id: 'sa-title',
        name: '!!TitleText',
        type: 'text',
        x: 180,
        y: 365,
        w: 880,
        h: 220,
        rotation: 0,
        locked: false,
        visible: true,
        text: 'Slide A · Starting Scene',
        style: createDefaultStyle({
          fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' },
          typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 72, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.15, letterSpacing: -1 },
        }),
        animations: [],
      },
      {
        id: 'sa-sub',
        name: 'Intro Note',
        type: 'text',
        x: 180,
        y: 600,
        w: 840,
        h: 100,
        rotation: 0,
        locked: false,
        visible: true,
        text: 'Shared !! layers glide smoothly while unmatched notes fade away.',
        style: createDefaultStyle({
          fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' },
          typography: { fontFamily: 'DM Sans', fontSize: 32, fontWeight: 400, italic: false, underline: false, colour: '#cbd5e1', align: 'left', verticalAlign: 'top', lineHeight: 1.4, letterSpacing: 0 },
        }),
        animations: [],
      },
    ],
  };

  const slideB: Slide = {
    id: 'sample-b',
    title: 'Sample Slide B',
    useMaster: false,
    background: {
      mode: 'gradient',
      colour: '#042f2e',
      gradientStart: '#091926',
      gradientEnd: '#0f4c5c',
      gradientAngle: 135,
    },
    transition: { type: 'morph', category: 'dynamic', duration: 0.9, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', morphMode: 'objects' },
    notes: '',
    elements: [
      {
        id: 'sb-circle',
        name: '!!HeroOrb',
        type: 'shape',
        shapeKind: 'circle',
        x: 180,
        y: 220,
        w: 360,
        h: 360,
        rotation: 45,
        locked: false,
        visible: true,
        text: '',
        style: createDefaultStyle({
          fill: { mode: 'gradient', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#f97316', gradientAngle: 140, gradientType: 'linear' },
        }),
        animations: [],
      },
      {
        id: 'sb-badge',
        name: '!!AccentBar',
        type: 'shape',
        shapeKind: 'rounded-rectangle',
        x: 660,
        y: 310,
        w: 280,
        h: 12,
        rotation: 0,
        locked: false,
        visible: true,
        text: '',
        style: createDefaultStyle({
          fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#0284c7', gradientAngle: 90, gradientType: 'linear' },
          cornerRadius: 6,
        }),
        animations: [],
      },
      {
        id: 'sb-title',
        name: '!!TitleText',
        type: 'text',
        x: 660,
        y: 350,
        w: 1060,
        h: 220,
        rotation: 0,
        locked: false,
        visible: true,
        text: 'Slide B · Transformed Focus',
        style: createDefaultStyle({
          fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' },
          typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 72, fontWeight: 700, italic: false, underline: false, colour: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.15, letterSpacing: -1 },
        }),
        animations: [],
      },
      {
        id: 'sb-new-card',
        name: 'Insight Card',
        type: 'shape',
        shapeKind: 'rounded-rectangle',
        x: 660,
        y: 600,
        w: 980,
        h: 210,
        rotation: 0,
        locked: false,
        visible: true,
        text: 'New detail revealed cleanly after the transition settles.',
        style: createDefaultStyle({
          fill: { mode: 'solid', colour: '#112a3d', gradientStart: '#112a3d', gradientEnd: '#112a3d', gradientAngle: 180, gradientType: 'linear' },
          outline: { colour: '#38bdf8', width: 2, dash: 'solid' },
          cornerRadius: 20,
          typography: { fontFamily: 'DM Sans', fontSize: 32, fontWeight: 500, italic: false, underline: false, colour: '#e0f2fe', align: 'left', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 },
        }),
        animations: [],
      },
    ],
  };

  return { slideA, slideB };
}

export interface MorphScenario {
  id: string;
  title: string;
  subtitle: string;
  morphMode: 'objects' | 'words' | 'characters';
  lessonNote: string;
  slideA: Slide;
  slideB: Slide;
}

function makeSlide(id: string, title: string, bgStart: string, bgEnd: string, elements: SlideElement[]): Slide {
  return {
    id,
    title,
    useMaster: false,
    background: { mode: 'gradient', colour: bgStart, gradientStart: bgStart, gradientEnd: bgEnd, gradientAngle: 135 },
    transition: { type: 'morph', category: 'dynamic', duration: 0.9, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', morphMode: 'objects' },
    notes: '',
    elements,
  };
}

export const MORPH_SCENARIOS: MorphScenario[] = [
  {
    id: 'zoom-detail',
    title: '1. Zooming Into a Detail',
    subtitle: 'Overview grid enlarges smoothly into one focused metric',
    morphMode: 'objects',
    lessonNote: 'Grow !!FocusCard to fill the spotlight while shrinking or sliding competing cards off-stage.',
    slideA: makeSlide('sc1-a', 'Overview', '#0b1222', '#172554', [
      {
        id: 'sc1-a1', name: '!!CardLeft', type: 'shape', shapeKind: 'rounded-rectangle', x: 200, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'North Region\n£1.2M',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 36, fontWeight: 600, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc1-a2', name: '!!FocusCard', type: 'shape', shapeKind: 'rounded-rectangle', x: 730, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'Central Hub\n£3.8M',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#0284c7', gradientStart: '#0284c7', gradientEnd: '#0284c7', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 38, fontWeight: 700, italic: false, underline: false, colour: '#ffffff', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc1-a3', name: '!!CardRight', type: 'shape', shapeKind: 'rounded-rectangle', x: 1260, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'South Coast\n£1.9M',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 36, fontWeight: 600, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
    ]),
    slideB: makeSlide('sc1-b', 'Detail', '#0b1222', '#172554', [
      {
        id: 'sc1-b1', name: '!!CardLeft', type: 'shape', shapeKind: 'rounded-rectangle', x: -560, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'North Region\n£1.2M',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24, opacity: 0.2, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 36, fontWeight: 600, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc1-b2', name: '!!FocusCard', type: 'shape', shapeKind: 'rounded-rectangle', x: 180, y: 180, w: 860, h: 720, rotation: 0, locked: false, visible: true, text: 'Central Hub · £3.8M\n+41% Year-on-Year',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#0284c7', gradientStart: '#0284c7', gradientEnd: '#0284c7', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 32, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 54, fontWeight: 700, italic: false, underline: false, colour: '#ffffff', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc1-b3', name: '!!CardRight', type: 'shape', shapeKind: 'rounded-rectangle', x: 2020, y: 310, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: 'South Coast\n£1.9M',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24, opacity: 0.2, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 36, fontWeight: 600, italic: false, underline: false, colour: '#cbd5e1', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc1-b4', name: 'Detail Copy', type: 'text', x: 1120, y: 340, w: 620, h: 360, rotation: 0, locked: false, visible: true, text: 'Expanded store footprint and lower churn drove record regional margin.',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'DM Sans', fontSize: 38, fontWeight: 500, italic: false, underline: false, colour: '#e2e8f0', align: 'left', verticalAlign: 'middle', lineHeight: 1.45, letterSpacing: 0 } }), animations: [],
      },
    ]),
  },
  {
    id: 'shape-transform',
    title: '2. Shape Turning Into Another Shape',
    subtitle: 'Using !! prefix to morph a circle into a wide pill card',
    morphMode: 'objects',
    lessonNote: 'Because both objects are named !!MorphBadge, Morph interpolates corner radius, colour, width and rotation seamlessly.',
    slideA: makeSlide('sc2-a', 'Circle', '#111827', '#1e293b', [
      {
        id: 'sc2-a1', name: '!!MorphBadge', type: 'shape', shapeKind: 'rounded-rectangle', x: 760, y: 340, w: 400, h: 400, rotation: 0, locked: false, visible: true, text: 'IDEA',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 200, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 52, fontWeight: 800, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 2 } }), animations: [],
      },
    ]),
    slideB: makeSlide('sc2-b', 'Card', '#111827', '#1e293b', [
      {
        id: 'sc2-b1', name: '!!MorphBadge', type: 'shape', shapeKind: 'rounded-rectangle', x: 360, y: 370, w: 1200, h: 340, rotation: 0, locked: false, visible: true, text: 'EXECUTION PLAN · READY',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 28, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 52, fontWeight: 800, italic: false, underline: false, colour: '#052e16', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 1 } }), animations: [],
      },
    ]),
  },
  {
    id: 'text-rearrange',
    title: '3. Text Rearranging (By Characters)',
    subtitle: 'Letters glide and reassemble into a new phrase',
    morphMode: 'characters',
    lessonNote: 'Set Morph Mode to By Characters so matching letters fly to their new positions instead of cross-fading.',
    slideA: makeSlide('sc3-a', 'Before Phrase', '#090d16', '#1e1b4b', [
      {
        id: 'sc3-a1', name: '!!KineticPhrase', type: 'text', x: 260, y: 400, w: 1400, h: 240, rotation: 0, locked: false, visible: true, text: 'LISTEN CAREFULLY',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 96, fontWeight: 800, italic: false, underline: false, colour: '#38bdf8', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 4 } }), animations: [],
      },
    ]),
    slideB: makeSlide('sc3-b', 'After Phrase', '#090d16', '#1e1b4b', [
      {
        id: 'sc3-b1', name: '!!KineticPhrase', type: 'text', x: 260, y: 400, w: 1400, h: 240, rotation: 0, locked: false, visible: true, text: 'SILENT CLARITY',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 96, fontWeight: 800, italic: false, underline: false, colour: '#fbbf24', align: 'centre', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 4 } }), animations: [],
      },
    ]),
  },
  {
    id: 'object-travel',
    title: '4. Object Travelling Across Slides',
    subtitle: 'A single focal marker guides the viewer from left to right',
    morphMode: 'objects',
    lessonNote: 'Keep !!Marker persistent across slides so the viewer’s eye tracks one continuous journey.',
    slideA: makeSlide('sc4-a', 'Stage 1', '#0f172a', '#1e293b', [
      {
        id: 'sc4-a1', name: '!!Marker', type: 'shape', shapeKind: 'star', x: 240, y: 380, w: 260, h: 260, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#fbbf24', gradientAngle: 90, gradientType: 'linear' } }), animations: [],
      },
      {
        id: 'sc4-a2', name: 'Caption A', type: 'text', x: 200, y: 690, w: 600, h: 100, rotation: 0, locked: false, visible: true, text: 'Origin: Discovery',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 40, fontWeight: 600, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }), animations: [],
      },
    ]),
    slideB: makeSlide('sc4-b', 'Stage 2', '#0f172a', '#1e293b', [
      {
        id: 'sc4-b1', name: '!!Marker', type: 'shape', shapeKind: 'star', x: 1420, y: 220, w: 320, h: 320, rotation: 144, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' } }), animations: [],
      },
      {
        id: 'sc4-b2', name: 'Caption B', type: 'text', x: 1080, y: 690, w: 660, h: 100, rotation: 0, locked: false, visible: true, text: 'Destination: Delivery',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 40, fontWeight: 600, italic: false, underline: false, colour: '#f8fafc', align: 'right', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: 0 } }), animations: [],
      },
    ]),
  },
  {
    id: 'before-after',
    title: '5. Before-and-After Comparison',
    subtitle: 'Metric bar expands smoothly from legacy baseline to new result',
    morphMode: 'objects',
    lessonNote: 'Matching the !!Bar name turns a static chart update into an instant physical growth cue.',
    slideA: makeSlide('sc5-a', 'Before', '#18181b', '#27272a', [
      {
        id: 'sc5-a1', name: '!!StatHeading', type: 'text', x: 240, y: 260, w: 1200, h: 120, rotation: 0, locked: false, visible: true, text: 'Before · 28% Completion',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 64, fontWeight: 700, italic: false, underline: false, colour: '#a1a1aa', align: 'left', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: -1 } }), animations: [],
      },
      {
        id: 'sc5-a2', name: '!!Bar', type: 'shape', shapeKind: 'rounded-rectangle', x: 240, y: 450, w: 420, h: 110, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#52525b', gradientStart: '#52525b', gradientEnd: '#52525b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [],
      },
    ]),
    slideB: makeSlide('sc5-b', 'After', '#06281e', '#0f172a', [
      {
        id: 'sc5-b1', name: '!!StatHeading', type: 'text', x: 240, y: 260, w: 1200, h: 120, rotation: 0, locked: false, visible: true, text: 'After · 89% Completion',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 64, fontWeight: 700, italic: false, underline: false, colour: '#34d399', align: 'left', verticalAlign: 'middle', lineHeight: 1.2, letterSpacing: -1 } }), animations: [],
      },
      {
        id: 'sc5-b2', name: '!!Bar', type: 'shape', shapeKind: 'rounded-rectangle', x: 240, y: 450, w: 1380, h: 110, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [],
      },
    ]),
  },
  {
    id: 'timeline-progress',
    title: '6. Timeline Progress Bar',
    subtitle: 'Progress indicator and pill glide from Phase 1 to Phase 3',
    morphMode: 'objects',
    lessonNote: 'Keep the background track identical across slides and Morph only the !!ProgressFill and !!Pin.',
    slideA: makeSlide('sc6-a', 'Phase 1', '#0f172a', '#1e293b', [
      {
        id: 'sc6-a1', name: '!!Track', type: 'shape', shapeKind: 'rounded-rectangle', x: 260, y: 520, w: 1400, h: 24, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#334155', gradientStart: '#334155', gradientEnd: '#334155', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 12 }), animations: [],
      },
      {
        id: 'sc6-a2', name: '!!ProgressFill', type: 'shape', shapeKind: 'rounded-rectangle', x: 260, y: 520, w: 320, h: 24, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 12 }), animations: [],
      },
      {
        id: 'sc6-a3', name: '!!Pin', type: 'shape', shapeKind: 'circle', x: 540, y: 492, w: 80, h: 80, rotation: 0, locked: false, visible: true, text: '1',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#fbbf24', gradientAngle: 90, gradientType: 'linear' }, typography: { fontFamily: 'JetBrains Mono', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0 } }), animations: [],
      },
    ]),
    slideB: makeSlide('sc6-b', 'Phase 3', '#0f172a', '#1e293b', [
      {
        id: 'sc6-b1', name: '!!Track', type: 'shape', shapeKind: 'rounded-rectangle', x: 260, y: 520, w: 1400, h: 24, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#334155', gradientStart: '#334155', gradientEnd: '#334155', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 12 }), animations: [],
      },
      {
        id: 'sc6-b2', name: '!!ProgressFill', type: 'shape', shapeKind: 'rounded-rectangle', x: 260, y: 520, w: 1140, h: 24, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 12 }), animations: [],
      },
      {
        id: 'sc6-b3', name: '!!Pin', type: 'shape', shapeKind: 'circle', x: 1360, y: 492, w: 80, h: 80, rotation: 0, locked: false, visible: true, text: '3',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, typography: { fontFamily: 'JetBrains Mono', fontSize: 32, fontWeight: 700, italic: false, underline: false, colour: '#052e16', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0 } }), animations: [],
      },
    ]),
  },
  {
    id: 'product-tour',
    title: '7. Product Feature Tour',
    subtitle: 'Product frame shifts left while callout ring highlights a feature',
    morphMode: 'objects',
    lessonNote: 'Move the hero !!Device left and enlarge !!FeatureRing onto the specific component being explained.',
    slideA: makeSlide('sc7-a', 'Product Hero', '#0b1120', '#1e293b', [
      {
        id: 'sc7-a1', name: '!!Device', type: 'shape', shapeKind: 'rounded-rectangle', x: 660, y: 200, w: 600, h: 680, rotation: 0, locked: false, visible: true, text: 'Studio Display\nFull Overview',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, outline: { colour: '#64748b', width: 4, dash: 'solid' }, cornerRadius: 36, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 38, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc7-a2', name: '!!FeatureRing', type: 'shape', shapeKind: 'circle', x: 920, y: 260, w: 80, h: 80, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, outline: { colour: '#38bdf8', width: 4, dash: 'solid' }, opacity: 0.4 }), animations: [],
      },
    ]),
    slideB: makeSlide('sc7-b', 'Feature Callout', '#0b1120', '#1e293b', [
      {
        id: 'sc7-b1', name: '!!Device', type: 'shape', shapeKind: 'rounded-rectangle', x: 200, y: 200, w: 600, h: 680, rotation: 0, locked: false, visible: true, text: 'Studio Display\nFull Overview',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, outline: { colour: '#64748b', width: 4, dash: 'solid' }, cornerRadius: 36, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 38, fontWeight: 700, italic: false, underline: false, colour: '#f8fafc', align: 'centre', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
      {
        id: 'sc7-b2', name: '!!FeatureRing', type: 'shape', shapeKind: 'circle', x: 430, y: 240, w: 140, h: 140, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#fbbf24', gradientAngle: 90, gradientType: 'linear' }, outline: { colour: '#fbbf24', width: 6, dash: 'solid' }, opacity: 1 }), animations: [],
      },
      {
        id: 'sc7-b3', name: 'Callout Spec', type: 'text', x: 940, y: 360, w: 760, h: 300, rotation: 0, locked: false, visible: true, text: '12MP Precision Sensor\nZero-latency tracking in low light.',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 44, fontWeight: 600, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.4, letterSpacing: 0 } }), animations: [],
      },
    ]),
  },
  {
    id: 'parallax-scene',
    title: '8. Parallax Scene Change',
    subtitle: 'Background, mid-ground and foreground layers move at different speeds',
    morphMode: 'objects',
    lessonNote: 'Move !!BgHorizon slightly (120px), !!MidHill moderately (320px), and !!ForeCard furthest (680px) to create true depth.',
    slideA: makeSlide('sc8-a', 'Parallax A', '#09152b', '#1e3a8a', [
      {
        id: 'sc8-a1', name: '!!BgHorizon', type: 'shape', shapeKind: 'circle', x: 1200, y: 120, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1d4ed8', gradientStart: '#1d4ed8', gradientEnd: '#1d4ed8', gradientAngle: 90, gradientType: 'linear' }, opacity: 0.45 }), animations: [],
      },
      {
        id: 'sc8-a2', name: '!!MidHill', type: 'shape', shapeKind: 'rounded-rectangle', x: 300, y: 580, w: 1200, h: 460, rotation: -4, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#0369a1', gradientStart: '#0369a1', gradientEnd: '#0369a1', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 80, opacity: 0.7 }), animations: [],
      },
      {
        id: 'sc8-a3', name: '!!ForeCard', type: 'text', x: 200, y: 300, w: 860, h: 180, rotation: 0, locked: false, visible: true, text: 'Chapter 1 · Horizon',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 76, fontWeight: 800, italic: false, underline: false, colour: '#f8fafc', align: 'left', verticalAlign: 'middle', lineHeight: 1.15, letterSpacing: -1 } }), animations: [],
      },
    ]),
    slideB: makeSlide('sc8-b', 'Parallax B', '#09152b', '#1e3a8a', [
      {
        id: 'sc8-b1', name: '!!BgHorizon', type: 'shape', shapeKind: 'circle', x: 1080, y: 120, w: 460, h: 460, rotation: 0, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1d4ed8', gradientStart: '#1d4ed8', gradientEnd: '#1d4ed8', gradientAngle: 90, gradientType: 'linear' }, opacity: 0.45 }), animations: [],
      },
      {
        id: 'sc8-b2', name: '!!MidHill', type: 'shape', shapeKind: 'rounded-rectangle', x: -20, y: 560, w: 1200, h: 460, rotation: 3, locked: false, visible: true, text: '',
        style: createDefaultStyle({ fill: { mode: 'solid', colour: '#0284c7', gradientStart: '#0284c7', gradientEnd: '#0284c7', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 80, opacity: 0.75 }), animations: [],
      },
      {
        id: 'sc8-b3', name: '!!ForeCard', type: 'text', x: 880, y: 300, w: 860, h: 180, rotation: 0, locked: false, visible: true, text: 'Chapter 2 · Arrival',
        style: createDefaultStyle({ fill: { mode: 'none', colour: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 76, fontWeight: 800, italic: false, underline: false, colour: '#fbbf24', align: 'right', verticalAlign: 'middle', lineHeight: 1.15, letterSpacing: -1 } }), animations: [],
      },
    ]),
  },
];

export interface MorphMistakeDemo {
  id: string;
  title: string;
  mistakeSummary: string;
  fixSummary: string;
  brokenPair: { slideA: Slide; slideB: Slide };
  fixedPair: { slideA: Slide; slideB: Slide };
}

export const MORPH_MISTAKES: MorphMistakeDemo[] = [
  {
    id: 'mismatched-names',
    title: 'Mistake 1: Different Object Names (Nothing Matches)',
    mistakeSummary:
      'On Slide A the circle is named "Circle Alpha" and on Slide B it was renamed "Circle Beta". Morph sees zero matches, so Alpha fades out while Beta fades in instead of gliding.',
    fixSummary:
      'Give both objects the identical !! prefix name (e.g. !!HeroOrb) in the Layers panel so Morph links them even if you restyle them.',
    brokenPair: {
      slideA: makeSlide('mk1-a', 'Broken A', '#0f172a', '#1e293b', [
        {
          id: 'mk1-a1', name: 'Circle Alpha', type: 'shape', shapeKind: 'circle', x: 260, y: 340, w: 360, h: 360, rotation: 0, locked: false, visible: true, text: 'A',
          style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 72, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0 } }), animations: [],
        },
      ]),
      slideB: makeSlide('mk1-b', 'Broken B', '#0f172a', '#1e293b', [
        {
          id: 'mk1-b1', name: 'Circle Beta', type: 'shape', shapeKind: 'circle', x: 1300, y: 340, w: 360, h: 360, rotation: 0, locked: false, visible: true, text: 'B',
          style: createDefaultStyle({ fill: { mode: 'solid', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#fbbf24', gradientAngle: 90, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 72, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0 } }), animations: [],
        },
      ]),
    },
    fixedPair: {
      slideA: makeSlide('fx1-a', 'Fixed A', '#0f172a', '#1e293b', [
        {
          id: 'fx1-a1', name: '!!HeroOrb', type: 'shape', shapeKind: 'circle', x: 260, y: 340, w: 360, h: 360, rotation: 0, locked: false, visible: true, text: 'A',
          style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 72, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0 } }), animations: [],
        },
      ]),
      slideB: makeSlide('fx1-b', 'Fixed B', '#0f172a', '#1e293b', [
        {
          id: 'fx1-b1', name: '!!HeroOrb', type: 'shape', shapeKind: 'circle', x: 1300, y: 340, w: 360, h: 360, rotation: 0, locked: false, visible: true, text: 'B',
          style: createDefaultStyle({ fill: { mode: 'solid', colour: '#fbbf24', gradientStart: '#fbbf24', gradientEnd: '#fbbf24', gradientAngle: 90, gradientType: 'linear' }, typography: { fontFamily: 'Plus Jakarta Sans', fontSize: 72, fontWeight: 700, italic: false, underline: false, colour: '#0f172a', align: 'centre', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0 } }), animations: [],
        },
      ]),
    },
  },
  {
    id: 'too-many-crossing',
    title: 'Mistake 2: Too Many Objects Crossing at Once',
    mistakeSummary:
      'Swapping 4 objects across opposite corners creates chaotic collisions mid-transition so the viewer loses track.',
    fixSummary:
      'Keep supporting elements stationary or cross-faded, and Morph only 1–2 focal elements along clean horizontal or vertical tracks.',
    brokenPair: {
      slideA: makeSlide('mk2-a', 'Chaotic A', '#111827', '#1e293b', [
        { id: 'mk2-a1', name: '!!Box1', type: 'shape', shapeKind: 'rounded-rectangle', x: 220, y: 180, w: 280, h: 200, rotation: 0, locked: false, visible: true, text: '1', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#ef4444', gradientStart: '#ef4444', gradientEnd: '#ef4444', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
        { id: 'mk2-a2', name: '!!Box2', type: 'shape', shapeKind: 'rounded-rectangle', x: 1420, y: 180, w: 280, h: 200, rotation: 0, locked: false, visible: true, text: '2', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#f59e0b', gradientStart: '#f59e0b', gradientEnd: '#f59e0b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
        { id: 'mk2-a3', name: '!!Box3', type: 'shape', shapeKind: 'rounded-rectangle', x: 220, y: 700, w: 280, h: 200, rotation: 0, locked: false, visible: true, text: '3', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
        { id: 'mk2-a4', name: '!!Box4', type: 'shape', shapeKind: 'rounded-rectangle', x: 1420, y: 700, w: 280, h: 200, rotation: 0, locked: false, visible: true, text: '4', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
      ]),
      slideB: makeSlide('mk2-b', 'Chaotic B', '#111827', '#1e293b', [
        { id: 'mk2-b1', name: '!!Box1', type: 'shape', shapeKind: 'rounded-rectangle', x: 1420, y: 700, w: 280, h: 200, rotation: 180, locked: false, visible: true, text: '1', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#ef4444', gradientStart: '#ef4444', gradientEnd: '#ef4444', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
        { id: 'mk2-b2', name: '!!Box2', type: 'shape', shapeKind: 'rounded-rectangle', x: 220, y: 700, w: 280, h: 200, rotation: -180, locked: false, visible: true, text: '2', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#f59e0b', gradientStart: '#f59e0b', gradientEnd: '#f59e0b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
        { id: 'mk2-b3', name: '!!Box3', type: 'shape', shapeKind: 'rounded-rectangle', x: 1420, y: 180, w: 280, h: 200, rotation: 180, locked: false, visible: true, text: '3', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
        { id: 'mk2-b4', name: '!!Box4', type: 'shape', shapeKind: 'rounded-rectangle', x: 220, y: 180, w: 280, h: 200, rotation: -180, locked: false, visible: true, text: '4', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#38bdf8', gradientStart: '#38bdf8', gradientEnd: '#38bdf8', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 20 }), animations: [] },
      ]),
    },
    fixedPair: {
      slideA: makeSlide('fx2-a', 'Calm A', '#111827', '#1e293b', [
        { id: 'fx2-a1', name: '!!FocusBox', type: 'shape', shapeKind: 'rounded-rectangle', x: 320, y: 350, w: 460, h: 360, rotation: 0, locked: false, visible: true, text: 'Focus', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#0284c7', gradientStart: '#0284c7', gradientEnd: '#0284c7', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24 }), animations: [] },
        { id: 'fx2-a2', name: 'Static Info', type: 'shape', shapeKind: 'rounded-rectangle', x: 1020, y: 350, w: 560, h: 360, rotation: 0, locked: false, visible: true, text: 'Context A', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24 }), animations: [] },
      ]),
      slideB: makeSlide('fx2-b', 'Calm B', '#111827', '#1e293b', [
        { id: 'fx2-b1', name: '!!FocusBox', type: 'shape', shapeKind: 'rounded-rectangle', x: 320, y: 240, w: 620, h: 580, rotation: 0, locked: false, visible: true, text: 'Focus Expanded', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#10b981', gradientStart: '#10b981', gradientEnd: '#10b981', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 28 }), animations: [] },
        { id: 'fx2-b2', name: 'Updated Info', type: 'shape', shapeKind: 'rounded-rectangle', x: 1020, y: 350, w: 560, h: 360, rotation: 0, locked: false, visible: true, text: 'Context B', style: createDefaultStyle({ fill: { mode: 'solid', colour: '#1e293b', gradientStart: '#1e293b', gradientEnd: '#1e293b', gradientAngle: 90, gradientType: 'linear' }, cornerRadius: 24 }), animations: [] },
      ]),
    },
  },
];
