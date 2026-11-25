import { StudioModuleId } from '../types/presentation';

export type LearningPathLevel = 'beginner' | 'intermediate' | 'pro';

export interface LearningPathStep {
  id: string;
  level: LearningPathLevel;
  stepNumber: number;
  title: string;
  summary: string;
  keyTakeaway: string;
  targetModule: StudioModuleId;
  actionLabel: string;
  durationMinutes: number;
}

export interface CheatSheetEntry {
  id: string;
  category: 'structure' | 'transitions' | 'animations' | 'merge';
  topic: string;
  rule: string;
  whenToUse: string;
  avoidWhen: string;
}

export interface DoDontExample {
  id: string;
  title: string;
  category: 'Layout' | 'Typography' | 'Motion' | 'Morph';
  dontTitle: string;
  dontReason: string;
  doTitle: string;
  doReason: string;
}

export interface QuizQuestion {
  id: string;
  category: 'Design' | 'Transitions' | 'Animations' | 'Merge Shapes' | 'Morph';
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  practiceModule: StudioModuleId;
}

export interface GlossaryEntry {
  term: string;
  category: 'Design' | 'Motion' | 'Morph' | 'Geometry' | 'Accessibility';
  definition: string;
  proTip: string;
}

export interface ShortcutGroup {
  group: string;
  items: Array<{ keys: string; description: string }>;
}

export const LEARNING_PATHS: Array<{
  level: LearningPathLevel;
  title: string;
  subtitle: string;
  description: string;
}> = [
  {
    level: 'beginner',
    title: 'Beginner · Design Foundations',
    subtitle: 'Structure, Alignment & Clean Hierarchy',
    description:
      'Build calm, scannable slides using focal contrast, Slide Master consistency, smart guides and accessible colour balance.',
  },
  {
    level: 'intermediate',
    title: 'Intermediate · Motion & Boolean Craft',
    subtitle: 'Animations, Morph !! & Merge Shapes',
    description:
      'Master entrance/exit choreography, exact !! Morph layer matching and custom vector boolean geometry with Subtract & Fragment.',
  },
  {
    level: 'pro',
    title: 'Pro · Keynote Storytelling',
    subtitle: 'Choreography, Pacing & Presenter Delivery',
    description:
      'Coordinate multi-element stagger cascades, kinetic typography, parallax transitions and live rehearsal timing like a keynote designer.',
  },
];

export const LEARNING_PATH_STEPS: LearningPathStep[] = [
  // Beginner
  {
    id: 'beg-1',
    level: 'beginner',
    stepNumber: 1,
    title: 'Establish One Clear Focal Point',
    summary:
      'Every slide needs one unmistakable anchor—either a bold headline, a primary metric, or a hero visual—supported by generous whitespace.',
    keyTakeaway: 'Aim for at least 30% open canvas breathing room; never fill every corner.',
    targetModule: 'guided',
    actionLabel: 'Practise in Guided Studio',
    durationMinutes: 5,
  },
  {
    id: 'beg-2',
    level: 'beginner',
    stepNumber: 2,
    title: 'Use Smart Guides & Distribution Tools',
    summary:
      'Uneven gaps between cards look unpolished immediately. Use alignment tools and Distribute Horizontal/Vertical in the Designer.',
    keyTakeaway: 'Keep consistent outer margins (around 120px on a 1920×1080 canvas).',
    targetModule: 'designer',
    actionLabel: 'Open Slide Designer',
    durationMinutes: 4,
  },
  {
    id: 'beg-3',
    level: 'beginner',
    stepNumber: 3,
    title: 'Maintain Typography & Colour Contrast',
    summary:
      'Pair a distinct display heading (48–72px) with crisp body text (24–28px) and high-contrast foreground/background colours.',
    keyTakeaway: 'Body copy below 20px on a 1920×1080 stage strains audiences at the back of a room.',
    targetModule: 'designer',
    actionLabel: 'Inspect Master Theme',
    durationMinutes: 4,
  },
  {
    id: 'beg-4',
    level: 'beginner',
    stepNumber: 4,
    title: 'Choose Purposeful Subtle Transitions',
    summary:
      'Use Fade or Push between related slides rather than rotating 3D flips that distract from your narrative.',
    keyTakeaway: 'Reserve Exciting or Dynamic transitions for major chapter shifts.',
    targetModule: 'transitions',
    actionLabel: 'Explore Transitions Lab',
    durationMinutes: 5,
  },

  // Intermediate
  {
    id: 'int-1',
    level: 'intermediate',
    stepNumber: 1,
    title: 'Choreograph On Click vs With Previous',
    summary:
      'Use On Click only when the speaker introduces a new point; chain supporting badges and subtitles using With Previous + small delays.',
    keyTakeaway: 'Stagger offsets of 0.12s–0.18s feel snappy without slowing the presenter down.',
    targetModule: 'animations',
    actionLabel: 'Open Animation Lab',
    durationMinutes: 6,
  },
  {
    id: 'int-2',
    level: 'intermediate',
    stepNumber: 2,
    title: 'Master Morph Matching with !! Prefixes',
    summary:
      'Duplicate a slide, reposition or resize shared objects, and ensure both slides share identical layer names (or a matching !!Hero prefix).',
    keyTakeaway: 'Keep shape types consistent between Slide A and Slide B so Morph glides rather than cross-fading.',
    targetModule: 'transitions',
    actionLabel: 'Launch Morph Deep-Dive',
    durationMinutes: 7,
  },
  {
    id: 'int-3',
    level: 'intermediate',
    stepNumber: 3,
    title: 'Craft Custom Vectors with Boolean Merge',
    summary:
      'Combine primitives using Subtract, Intersect, Union and Fragment to build crescent moons, rings, shields and split diagrams.',
    keyTakeaway: 'In Subtract, selection order decides the outcome: select the base shape first, then the cutter.',
    targetModule: 'merge',
    actionLabel: 'Open Merge Shapes Lab',
    durationMinutes: 6,
  },
  {
    id: 'int-4',
    level: 'intermediate',
    stepNumber: 4,
    title: 'Build Multi-Step Layouts Under Tolerance',
    summary:
      'Complete a guided layout from Target Mockup to Animate-It Finale to sharpen spatial intuition and colour matching.',
    keyTakeaway: 'Toggle the Ghost Overlay down to 0% as you gain confidence.',
    targetModule: 'guided',
    actionLabel: 'Take Guided Challenge',
    durationMinutes: 8,
  },

  // Pro
  {
    id: 'pro-1',
    level: 'pro',
    stepNumber: 1,
    title: 'Orchestrate Multi-Element Cascades',
    summary:
      'Combine background reveals, staggered cards and focus dimming so the audience’s eyes always land exactly where you are speaking.',
    keyTakeaway: 'Dim secondary cards (Desaturate / Transparency) while pulsing the active KPI.',
    targetModule: 'choreographer',
    actionLabel: 'Open Choreographer',
    durationMinutes: 6,
  },
  {
    id: 'pro-2',
    level: 'pro',
    stepNumber: 2,
    title: 'Direct Kinetic Text & Motion Paths',
    summary:
      'Use word-by-word or paragraph reveals paired with subtle arc motion paths to tell before-and-after or milestone stories.',
    keyTakeaway: 'Never combine Spin + Bounce + Fly-In on the same object; pick one crisp vector.',
    targetModule: 'animations',
    actionLabel: 'Test Motion Paths',
    durationMinutes: 6,
  },
  {
    id: 'pro-3',
    level: 'pro',
    stepNumber: 3,
    title: 'Design Accessible, Calm Motion Systems',
    summary:
      'Verify every slide stays safe under 3 flashes per second and works seamlessly when Reduce Motion is enabled.',
    keyTakeaway: 'Accessible motion relies on gentle opacity and spatial clarity rather than strobe highlights.',
    targetModule: 'animations',
    actionLabel: 'Review Motion Safety',
    durationMinutes: 4,
  },
  {
    id: 'pro-4',
    level: 'pro',
    stepNumber: 4,
    title: 'Rehearse & Pace Your Live Delivery',
    summary:
      'Use Presenter Mode with Speaker Notes, Laser Pointer and Rehearse Timings to balance time spent across every section.',
    keyTakeaway: 'Check the Rehearsal Timing Summary to catch slides that run too long.',
    targetModule: 'designer',
    actionLabel: 'Prep Notes in Designer',
    durationMinutes: 5,
  },
];

export const CHEAT_SHEET_ENTRIES: CheatSheetEntry[] = [
  {
    id: 'cs-1',
    category: 'structure',
    topic: '60 / 30 / 10 Colour Balance',
    rule: '60% calm canvas background, 30% elevated card surfaces, 10% accent colour for focal actions & metrics.',
    whenToUse: 'All executive, product and educational decks.',
    avoidWhen: 'Never let saturated accent gradients cover more than a third of the slide.',
  },
  {
    id: 'cs-2',
    category: 'structure',
    topic: '120px Safe Outer Margin',
    rule: 'Keep headlines, cards and footers at least 100–120px inside the 1920×1080 edge.',
    whenToUse: 'Projector screens, conference displays and PDF prints with crop bleed.',
    avoidWhen: 'Full-bleed photography or decorative corner accents only.',
  },
  {
    id: 'cs-3',
    category: 'transitions',
    topic: 'Fade vs Push vs Morph',
    rule: 'Fade = topic pause; Push = sequential journey; Morph = same objects evolving across state.',
    whenToUse: 'Use Fade (0.4–0.6s) as your deck default and Morph (0.8–1.1s) for spotlight transitions.',
    avoidWhen: 'Avoid mixing 5+ unrelated Exciting transitions in a single deck.',
  },
  {
    id: 'cs-4',
    category: 'transitions',
    topic: 'Morph !! Naming Contract',
    rule: 'Prefix persistent element names with !! (e.g., !!HeroCard) on both Slide A and Slide B.',
    whenToUse: 'Focusing on a card, zooming a map/chart, or sliding timelines forward.',
    avoidWhen: 'Avoid changing a rectangle into an image while expecting smooth geometry morphing.',
  },
  {
    id: 'cs-5',
    category: 'animations',
    topic: 'The 0.15s Stagger Sweet Spot',
    rule: 'Chain related cards with With Previous + increments of 0.12s to 0.18s delay.',
    whenToUse: '3-card grids, KPI rows and horizontal timeline milestones.',
    avoidWhen: 'Avoid 0.6s+ gaps between sibling items—they make audiences wait.',
  },
  {
    id: 'cs-6',
    category: 'animations',
    topic: 'Safety Under 3 Hz',
    rule: 'Flash-like emphasis effects (Bold Flash, Colour Pulse) must stay below 3 cycles per second.',
    whenToUse: 'Brief 0.6s–0.9s single-pulse highlights on key figures.',
    avoidWhen: 'Rapid strobe loops—never repeat flash effects continuously.',
  },
  {
    id: 'cs-7',
    category: 'merge',
    topic: 'Subtract Selection Order',
    rule: 'Shape #1 is the base silhouette; Shapes #2+ are subtracted away from Shape #1.',
    whenToUse: 'Crescent moons, donut rings, keyholes and notched badges.',
    avoidWhen: 'Forgetting order and subtracting the larger base shape by accident.',
  },
  {
    id: 'cs-8',
    category: 'merge',
    topic: 'Combine vs Union',
    rule: 'Union melts overlaps into one solid polygon; Combine punches XOR cut-outs where shapes overlap.',
    whenToUse: 'Union for unified shields/silhouettes; Combine for hollow frames and geometric logos.',
    avoidWhen: 'Using Union when you actually wanted an interior cut-out hole.',
  },
];

export const DO_DONT_GALLERY: DoDontExample[] = [
  {
    id: 'dd-hierarchy',
    title: 'Card Hierarchy vs Dense Text Wall',
    category: 'Layout',
    dontTitle: 'Don’t: Crowded Wall of Bullets',
    dontReason: 'Long unbroken paragraphs and 6 competing labels force the audience to read instead of listen.',
    doTitle: 'Do: Scannable 3-Pillar Grid',
    doReason: 'Short titles, generous padding and accent number badges let viewers grasp the structure in 2 seconds.',
  },
  {
    id: 'dd-contrast',
    title: 'Accessible Contrast vs Washed-Out Type',
    category: 'Typography',
    dontTitle: 'Don’t: Low-Contrast Grey on Mid-Tone',
    dontReason: 'Pale grey body text on mid-blue backgrounds fails readability on bright projectors.',
    doTitle: 'Do: Crisp Contrast & Weight Scale',
    doReason: 'Pair luminous white/slate-900 typography with clear size hierarchy (56px heading, 24px body).',
  },
  {
    id: 'dd-motion',
    title: 'Unified Stagger vs Chaotic Effects',
    category: 'Motion',
    dontTitle: 'Don’t: Mixed Bounce, Swivel & Spin',
    dontReason: 'Giving every card a different direction and bounce feels amateur and visually noisy.',
    doTitle: 'Do: Unified Float-In Cascade',
    doReason: 'One subtle upward float shared across all three cards with 0.15s stagger feels calm and deliberate.',
  },
  {
    id: 'dd-morph',
    title: 'Clean !! Morph vs Broken Layer Names',
    category: 'Morph',
    dontTitle: 'Don’t: Unmatched Names Cross-Fading',
    dontReason: 'Renaming "Card 1" to "Summary Box" breaks Morph matching, causing an awkward fade jump.',
    doTitle: 'Do: Shared !!HeroCard Identity',
    doReason: 'Keeping the same !! prefix on Slide A and Slide B glides position, scale and rotation smoothly.',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Morph',
    scenario:
      'You duplicated a slide and moved a hero badge to the corner while enlarging a chart. On playback, the badge just fades out and fades in at the new spot instead of gliding. What is the likeliest cause?',
    options: [
      'The transition duration is set to 0.9 seconds instead of 0.2 seconds.',
      'The badge’s layer name differs between Slide A and Slide B (e.g., missing matching name or !! prefix).',
      'Morph only works when the slide background is solid white.',
      'You must apply a Fly-In entrance animation on Slide B as well.',
    ],
    correctIndex: 1,
    explanation:
      'Morph pairs elements between Slide A and Slide B using exact layer names (or shared !! prefixes). If an element is renamed or replaced with an incompatible type, Morph falls back to a cross-fade.',
    practiceModule: 'transitions',
  },
  {
    id: 'q2',
    category: 'Merge Shapes',
    scenario:
      'You want to carve a crescent moon by cutting Circle B out of Circle A using Merge Shapes. Which operation and selection order produce the crescent?',
    options: [
      'Select Circle B first, then Circle A, and click Intersect.',
      'Select Circle A (the base) first, then Circle B (the cutter), and click Subtract.',
      'Select both circles in any order and click Union.',
      'Select Circle A, duplicate it, and click Combine twice.',
    ],
    correctIndex: 1,
    explanation:
      'Subtract keeps the first selected shape (#1) and removes every subsequent shape (#2+) from it. Selecting the base circle first ensures the cutter carves out the crescent.',
    practiceModule: 'merge',
  },
  {
    id: 'q3',
    category: 'Animations',
    scenario:
      'You have 3 summary cards on a slide that should appear smoothly one after another as soon as the slide arrives, without needing 3 extra clicks. How should they be triggered?',
    options: [
      'All three set to On Click with 0s delay.',
      'Card 1 set to With Previous (0s delay), Card 2 With Previous (0.16s delay), Card 3 With Previous (0.32s delay).',
      'All three set to Bounce Exit with 2.0s duration.',
      'Card 1 set to Spin 360°, Card 2 set to Swivel, Card 3 set to Random Bars.',
    ],
    correctIndex: 1,
    explanation:
      'Chaining sibling elements with With Previous and staggered 0.14s–0.18s delays delivers a crisp rhythm automatically without tedious extra clicks.',
    practiceModule: 'choreographer',
  },
  {
    id: 'q4',
    category: 'Transitions',
    scenario:
      'You are moving from Slide 4 (Step 1 of a process) to Slide 5 (Step 2 of the same process) and want the audience to feel forward spatial continuity. Which transition fits best?',
    options: [
      'Push (Left) or Morph',
      'Fracture',
      'Shred',
      'Honeycomb',
    ],
    correctIndex: 0,
    explanation:
      'Push (Left) physically nudges the timeline forward, and Morph smoothly tracks shared timeline nodes across slides. Dramatic shatter effects like Fracture interrupt the logical thread.',
    practiceModule: 'transitions',
  },
  {
    id: 'q5',
    category: 'Design',
    scenario:
      'An executive slide has 4 KPI cards whose widths are fine, but the horizontal gaps between them are slightly uneven (28px, 44px, 19px). Which Designer tool fixes this in one click?',
    options: [
      'Rotate 90°',
      'Group Selected',
      'Distribute Horizontal (after selecting all 4 cards)',
      'Send to Back',
    ],
    correctIndex: 2,
    explanation:
      'Selecting 3 or more elements and running Distribute Horizontal equalises the exact horizontal spacing between their outer bounds.',
    practiceModule: 'designer',
  },
  {
    id: 'q6',
    category: 'Animations',
    scenario:
      'How should a spotlight emphasis effect work when highlighting one key metric out of three on stage?',
    options: [
      'Flash the metric brightly 6 times per second so nobody misses it.',
      'Use Desaturate or Transparency on the two secondary cards while applying a gentle single Pulse on the active metric.',
      'Delete the other two cards mid-presentation.',
      'Set the active metric font size to 10px.',
    ],
    correctIndex: 1,
    explanation:
      'Contrast creates clarity safely: dimming secondary cards draws focus cleanly to the pulsing metric without risking photosensitive flash rates (>3 Hz).',
    practiceModule: 'choreographer',
  },
  {
    id: 'q7',
    category: 'Merge Shapes',
    scenario:
      'You overlap two circles (a Venn diagram) and want to colour the left lobe, the overlapping lens, and the right lobe independently. Which boolean operation creates those 3 separate pieces?',
    options: [
      'Union',
      'Fragment',
      'Subtract',
      'Intersect',
    ],
    correctIndex: 1,
    explanation:
      'Fragment slices every overlapping region into independent closed polygons—perfect for multi-colour Venn diagrams and segmented rings.',
    practiceModule: 'merge',
  },
  {
    id: 'q8',
    category: 'Design',
    scenario:
      'When preparing a 15-slide keynote for a brightly lit auditorium projector, which text and contrast practice should you follow?',
    options: [
      'Use 13px light-grey body copy so lots of paragraphs fit onto each slide.',
      'Keep body copy at least 22–26px with strong luminance contrast against the canvas background.',
      'Set every single word on the slide to bold uppercase.',
      'Use bright neon cyan text directly on a bright yellow background.',
    ],
    correctIndex: 1,
    explanation:
      'Bright rooms wash out weak contrast. Larger type (22–28px+) paired with crisp dark-on-light or light-on-dark polarity stays effortless to read from the back row.',
    practiceModule: 'guided',
  },
];

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: 'Morph Matching (!!)',
    category: 'Morph',
    definition:
      'Naming convention where elements sharing identical names—or an identical !! prefix such as !!Hero—pair automatically across consecutive slides so position, size, rotation and colour interpolate smoothly.',
    proTip: 'Use !! whenever you want to guarantee pairing even if copy inside the card changes.',
  },
  {
    term: 'Boolean Subtract',
    category: 'Geometry',
    definition:
      'A geometry operation that removes shapes #2 and above from shape #1, creating authentic vector holes, crescents and notched silhouettes.',
    proTip: 'Watch the numbered selection badges (1, 2) before clicking Subtract.',
  },
  {
    term: 'Boolean Fragment',
    category: 'Geometry',
    definition:
      'Slices all intersecting areas of selected shapes into individual standalone vector polygons that can be re-coloured or animated separately.',
    proTip: 'Ideal for Venn intersections and segmented progress arcs.',
  },
  {
    term: 'Even-Odd Fill Rule',
    category: 'Geometry',
    definition:
      'An SVG path rendering rule that automatically leaves interior subpaths (like the centre of a donut ring or keyhole) transparent.',
    proTip: 'SlideMotion Studio uses evenodd on all merged freeform paths automatically.',
  },
  {
    term: 'Stagger Offset',
    category: 'Motion',
    definition:
      'A small, consistent delay increment (typically 0.12s–0.18s) applied across sibling elements so they cascade gracefully instead of popping in all at once.',
    proTip: 'Keep total cascade span under 1.2s so the audience never waits on the animation.',
  },
  {
    term: 'On Click vs With Previous',
    category: 'Motion',
    definition:
      'Trigger modes in the Animation Pane: On Click pauses until the speaker advances; With Previous fires alongside the preceding cue.',
    proTip: 'Reserve On Click for narrative beats and use With Previous + Delay for polish.',
  },
  {
    term: 'Ease-Out Curve',
    category: 'Motion',
    definition:
      'An acceleration profile that starts decisively and decelerates gently to a stop—mirroring physical objects settling into place.',
    proTip: 'Prefer Ease-Out for entrances and Ease-In-Out for Morph and Motion Paths.',
  },
  {
    term: 'Slide Master',
    category: 'Design',
    definition:
      'Shared template settings (background, accent colour, heading/body fonts, footer and slide numbering) inherited across slides.',
    proTip: 'Enable Use Master on content slides so global theme updates cascade instantly.',
  },
  {
    term: 'Smart Guides',
    category: 'Design',
    definition:
      'Dynamic snap lines appearing while dragging to align edges and centres with the canvas or neighbouring elements.',
    proTip: 'Hold Alt/ignore grid temporarily or adjust Grid Size in Settings when doing freehand illustration.',
  },
  {
    term: 'CIE76 Delta E',
    category: 'Design',
    definition:
      'Perceptual colour distance metric used in Guided Design Studio to measure how closely your chosen fill matches the target mockup.',
    proTip: 'A Delta E below 10 looks nearly identical to the human eye.',
  },
  {
    term: 'Reduce Motion & <3 Hz Guard',
    category: 'Accessibility',
    definition:
      'Accessibility controls that substitute spinning/flying motion with calm opacity fades and cap any pulse/flash speed safely below 3 flashes per second.',
    proTip: 'Test your deck once with Reduce Motion toggled on in Settings before presenting publicly.',
  },
  {
    term: 'Kinetic Typography',
    category: 'Motion',
    definition:
      'Animating text word-by-word or character-by-character across a slide or Morph transition to emphasise phrasing and cadence.',
    proTip: 'Limit kinetic word effects to short hero statements under 8 words.',
  },
];

export const KEYBOARD_SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    group: 'Canvas & Editing',
    items: [
      { keys: 'Ctrl / Cmd + Z', description: 'Undo last edit (60-step history)' },
      { keys: 'Ctrl / Cmd + Y', description: 'Redo edit' },
      { keys: 'Ctrl / Cmd + C / V', description: 'Copy & paste selected elements' },
      { keys: 'Ctrl / Cmd + D', description: 'Duplicate selected elements' },
      { keys: 'Arrow Keys', description: 'Nudge selected elements by 1px (Shift = 10px)' },
      { keys: 'Delete / Backspace', description: 'Delete unlocked selected elements' },
    ],
  },
  {
    group: 'Selection, Groups & Project',
    items: [
      { keys: 'Ctrl / Cmd + A', description: 'Select all visible elements on slide' },
      { keys: 'Ctrl / Cmd + G', description: 'Group selected elements' },
      { keys: 'Ctrl / Cmd + Shift + G', description: 'Ungroup selected group' },
      { keys: 'Ctrl / Cmd + S', description: 'Save project to JSON file' },
      { keys: 'Ctrl / Cmd + O', description: 'Open project JSON file' },
    ],
  },
  {
    group: 'Presenter Mode',
    items: [
      { keys: 'F5 / Shift + F5', description: 'Start Presenter Mode / Rehearse Timings' },
      { keys: 'Space / → / Enter', description: 'Advance next animation cue or slide' },
      { keys: '← / PageUp', description: 'Step back one cue or slide' },
      { keys: 'L', description: 'Toggle Laser Pointer' },
      { keys: 'N', description: 'Toggle Speaker Notes & Next Slide Console' },
      { keys: 'G / B / F', description: 'Slide Grid (G) · Blackout (B) · Fullscreen (F)' },
    ],
  },
];
