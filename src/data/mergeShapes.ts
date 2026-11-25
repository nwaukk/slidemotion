import {
  computeIoU,
  countHoles,
  LabShape,
  MergeOperation,
  multiPolygonArea,
  multiPolygonBounds,
  runBooleanOperation,
  shapeToMultiPolygon,
} from '../engine/booleanGeometry';

export interface MergeOperationInfo {
  id: MergeOperation;
  name: string;
  symbol: string;
  tagline: string;
  whatItDoes: string;
  selectionOrderMatters: string;
  whenToUse: string;
  whenToAvoid: string;
  proTip: string;
}

export const MERGE_OPERATIONS: MergeOperationInfo[] = [
  {
    id: 'union',
    name: 'Union',
    symbol: 'A ∪ B',
    tagline: 'Welds all selected shapes into one continuous outline',
    whatItDoes:
      'Fuses two or more overlapping or touching shapes into a single unified silhouette, removing any shared internal borders.',
    selectionOrderMatters:
      'Geometry is identical regardless of order, but in PowerPoint the merged result inherits the fill, outline and style of the FIRST shape you select.',
    whenToUse:
      'Building custom icons (cloud from circles, shield from rectangle + triangle, speech bubble) or welding shapes to fill with one photo or gradient.',
    whenToAvoid:
      'When you still need to animate or colour the pieces independently—use Group instead.',
    proTip:
      'Overlap your shapes by a few pixels before clicking Union so tiny hairline seams never appear.',
  },
  {
    id: 'combine',
    name: 'Combine',
    symbol: 'A ⊕ B',
    tagline: 'Keeps non-overlapping areas and cuts out where shapes overlap (XOR)',
    whatItDoes:
      'Merges the shapes into one compound vector while punching transparent holes wherever an even number of shapes overlap.',
    selectionOrderMatters:
      'Style comes from the first selected shape, while the cut-out geometry works identically regardless of selection order.',
    whenToUse:
      'Creating hollow donut rings, cut-out stencil masks, frames, or text-inside-shape see-through banners.',
    whenToAvoid:
      'When three or more shapes triple-overlap in confusing ways—Subtract gives tighter control.',
    proTip:
      'Place a small shape wholly inside a larger shape and click Combine for an instant clean hole without worrying about click order.',
  },
  {
    id: 'fragment',
    name: 'Fragment',
    symbol: 'A | B',
    tagline: 'Slices every overlapping boundary into separate, editable pieces',
    whatItDoes:
      'Cuts along every intersection edge and turns each distinct area—exclusive outsides and shared overlaps—into its own independent shape.',
    selectionOrderMatters:
      'Click order does not change the cuts, making Fragment effortless for splitting Venn diagrams, pie wedges or grids.',
    whenToUse:
      'Isolating the shared centre of a Venn diagram, slicing an image or shape into custom mosaic cards, or building segmented infographics.',
    whenToAvoid:
      'Complex jagged shapes that produce dozens of tiny leftover slivers you have to delete manually.',
    proTip:
      'After clicking Fragment, click individual pieces on the canvas to recolour them or delete the unwanted outer shards.',
  },
  {
    id: 'intersect',
    name: 'Intersect',
    symbol: 'A ∩ B',
    tagline: 'Keeps ONLY the region shared by every selected shape',
    whatItDoes:
      'Discards everything outside the common overlap and preserves solely the area where all selected shapes meet.',
    selectionOrderMatters:
      'The shared shape is the same in any order, though the first shape clicked supplies the resulting colour and outline.',
    whenToUse:
      'Extracting an almond lens from two circles, cropping shapes cleanly inside a slide frame, or chamfering corners.',
    whenToAvoid:
      'Shapes that do not overlap at all—Intersect will return an empty selection.',
    proTip:
      'Duplicate a circle and slide it sideways, then run Intersect to forge instant leaf petals or optical lenses.',
  },
  {
    id: 'subtract',
    name: 'Subtract',
    symbol: 'A − B',
    tagline: 'Removes the 2nd (and subsequent) shapes from the 1st selected shape',
    whatItDoes:
      'Uses every shape selected after the first as a cookie-cutter to carve away material from your primary base shape.',
    selectionOrderMatters:
      'CRITICAL: Selection order decides what survives. Shape 1 is kept and carved; Shape 2, 3, etc. vanish after cutting!',
    whenToUse:
      'Carving crescent moons, notched progress bars, cut-out keyholes, angled ribbon banners and spotlight masks.',
    whenToAvoid:
      'When you clicked the cutter first by mistake—always watch the 1, 2, 3 selection badges before clicking Subtract.',
    proTip:
      'If Subtract deletes the wrong shape, undo, click "Swap Order" (or re-click your base shape 1st), and subtract again.',
  },
];

export const SANDBOX_STARTER_SHAPES: LabShape[] = [
  {
    id: 'sb-1',
    name: 'Primary Circle',
    kind: 'circle',
    x: 220,
    y: 120,
    w: 250,
    h: 250,
    rotation: 0,
    colour: '#38bdf8',
  },
  {
    id: 'sb-2',
    name: 'Accent Rounded Box',
    kind: 'rounded-rectangle',
    x: 345,
    y: 135,
    w: 240,
    h: 220,
    rotation: 0,
    colour: '#fbbf24',
    cornerRadius: 34,
  },
];

export interface MergeChallenge {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate';
  recommendedOp: MergeOperation;
  summary: string;
  stepHint: string;
  orderTip: string;
  starterShapes: LabShape[];
  validate: (shapes: LabShape[], lastOp: MergeOperation | null) => { passed: boolean; feedback: string };
}

function makeCrescentReference(): LabShape[] {
  return [
    { id: 'ref-m1', name: 'Moon Base', kind: 'circle', x: 240, y: 105, w: 280, h: 280, rotation: 0, colour: '#fbbf24' },
    { id: 'ref-m2', name: 'Moon Shadow', kind: 'circle', x: 335, y: 90, w: 250, h: 250, rotation: 0, colour: '#475569' },
  ];
}

function makeVennReference(): LabShape[] {
  return [
    { id: 'ref-v1', name: 'Set A', kind: 'circle', x: 200, y: 120, w: 260, h: 260, rotation: 0, colour: '#38bdf8' },
    { id: 'ref-v2', name: 'Set B', kind: 'circle', x: 340, y: 120, w: 260, h: 260, rotation: 0, colour: '#a855f7' },
  ];
}

function makeShieldReference(): LabShape[] {
  return [
    {
      id: 'ref-s1',
      name: 'Shield Crown',
      kind: 'rounded-rectangle',
      x: 280,
      y: 85,
      w: 240,
      h: 175,
      rotation: 0,
      colour: '#0ea5e9',
      cornerRadius: 24,
    },
    {
      id: 'ref-s2',
      name: 'Shield Point',
      kind: 'triangle',
      x: 280,
      y: 225,
      w: 240,
      h: 185,
      rotation: 180,
      colour: '#38bdf8',
    },
  ];
}

function makeDonutReference(): LabShape[] {
  return [
    { id: 'ref-d1', name: 'Outer Ring', kind: 'circle', x: 240, y: 90, w: 320, h: 320, rotation: 0, colour: '#10b981' },
    { id: 'ref-d2', name: 'Inner Hole', kind: 'circle', x: 320, y: 170, w: 160, h: 160, rotation: 0, colour: '#1e293b' },
  ];
}

function makeKeyholeReference(): LabShape[] {
  return [
    {
      id: 'ref-k1',
      name: 'Door Plate',
      kind: 'rounded-rectangle',
      x: 225,
      y: 65,
      w: 350,
      h: 370,
      rotation: 0,
      colour: '#6366f1',
      cornerRadius: 42,
    },
    {
      id: 'ref-k2',
      name: 'Keyhole Top',
      kind: 'circle',
      x: 345,
      y: 135,
      w: 110,
      h: 110,
      rotation: 0,
      colour: '#f8fafc',
    },
    {
      id: 'ref-k3',
      name: 'Keyhole Taper',
      kind: 'triangle',
      x: 340,
      y: 205,
      w: 120,
      h: 155,
      rotation: 0,
      colour: '#f8fafc',
    },
  ];
}

export const MERGE_CHALLENGES: MergeChallenge[] = [
  {
    id: 'crescent-moon',
    title: '1. Crescent Moon',
    difficulty: 'Beginner',
    recommendedOp: 'subtract',
    summary: 'Carve the overlapping shadow circle out of the golden moon base to leave a crisp crescent.',
    stepHint: 'Select Moon Base (1st), then select Moon Shadow (2nd), and click Subtract.',
    orderTip: 'Moon Base must be badge #1! If you select the shadow circle first, Subtract carves the wrong way.',
    starterShapes: makeCrescentReference(),
    validate: (shapes, lastOp) => {
      if (shapes.length !== 1 || shapes[0].kind !== 'boolean') {
        return {
          passed: false,
          feedback: 'Merge the two circles into a single crescent silhouette first.',
        };
      }
      const mp = shapeToMultiPolygon(shapes[0]);
      const area = multiPolygonArea(mp);
      const holes = countHoles(mp);
      const refResult = runBooleanOperation(makeCrescentReference(), 'subtract')[0];
      const iou = refResult ? computeIoU(mp, refResult.multiPolygon) : 0;

      if (holes > 0) {
        return { passed: false, feedback: 'Your shape has an enclosed hole—offset the cutter towards the edge.' };
      }
      if (mp.length !== 1 || area < 10000 || area > 50000) {
        return {
          passed: false,
          feedback: 'The crescent should be a single carved arc (smaller than the full circle). Try Subtract with Moon Base #1.',
        };
      }
      if (lastOp === 'subtract' || iou >= 0.52) {
        return {
          passed: true,
          feedback: 'Clean crescent geometry verified! Send it to Slide Designer or try Challenge 2.',
        };
      }
      return {
        passed: false,
        feedback: 'Check selection order (Moon Base #1, Shadow #2) and apply Subtract.',
      };
    },
  },
  {
    id: 'venn-overlap',
    title: '2. Venn Overlap Lens',
    difficulty: 'Beginner',
    recommendedOp: 'intersect',
    summary: 'Isolate ONLY the almond-shaped intersection shared by both Venn circles.',
    stepHint: 'Select Set A and Set B in either order, then click Intersect.',
    orderTip: 'Tip: Fragment would slice all 3 Venn zones, whereas Intersect keeps only the middle lens.',
    starterShapes: makeVennReference(),
    validate: (shapes, lastOp) => {
      if (shapes.length !== 1 || shapes[0].kind !== 'boolean') {
        return {
          passed: false,
          feedback: 'Select both circles and extract their single shared intersection.',
        };
      }
      const mp = shapeToMultiPolygon(shapes[0]);
      const area = multiPolygonArea(mp);
      const refResult = runBooleanOperation(makeVennReference(), 'intersect')[0];
      const iou = refResult ? computeIoU(mp, refResult.multiPolygon) : 0;

      if (mp.length === 1 && countHoles(mp) === 0 && area > 4000 && area < 42000 && (lastOp === 'intersect' || iou >= 0.6)) {
        return {
          passed: true,
          feedback: 'Exact Venn intersection lens verified!',
        };
      }
      return {
        passed: false,
        feedback: 'Use Intersect on the two overlapping circles so only the shared middle lens remains.',
      };
    },
  },
  {
    id: 'shield',
    title: '3. Heraldic Shield',
    difficulty: 'Beginner',
    recommendedOp: 'union',
    summary: 'Weld the rounded top crown and inverted triangle point into one seamless shield emblem.',
    stepHint: 'Select Shield Crown and Shield Point (already aligned), then click Union.',
    orderTip: 'Shield Crown #1 preserves the primary sky-blue badge colour on the welded result.',
    starterShapes: makeShieldReference(),
    validate: (shapes, lastOp) => {
      if (shapes.length !== 1 || shapes[0].kind !== 'boolean') {
        return {
          passed: false,
          feedback: 'Weld the two shield halves into one unified shape using Union.',
        };
      }
      const mp = shapeToMultiPolygon(shapes[0]);
      const area = multiPolygonArea(mp);
      const refResult = runBooleanOperation(makeShieldReference(), 'union')[0];
      const iou = refResult ? computeIoU(mp, refResult.multiPolygon) : 0;

      if (mp.length === 1 && countHoles(mp) === 0 && area > 46000 && (lastOp === 'union' || iou >= 0.65)) {
        return {
          passed: true,
          feedback: 'Solid unified Shield geometry verified with zero internal seams!',
        };
      }
      return {
        passed: false,
        feedback: 'Make sure both shapes overlap cleanly and click Union to weld them into one piece.',
      };
    },
  },
  {
    id: 'donut-ring',
    title: '4. Donut Chart Ring',
    difficulty: 'Intermediate',
    recommendedOp: 'combine',
    summary: 'Punch a concentric transparent centre hole out of the outer circle to form a true vector donut ring.',
    stepHint: 'Select both concentric circles and click Combine (or select Outer Ring #1 then Inner Hole #2 and Subtract).',
    orderTip: 'Combine punches inner overlaps regardless of click order—handy for concentric rings!',
    starterShapes: makeDonutReference(),
    validate: (shapes) => {
      if (shapes.length !== 1 || shapes[0].kind !== 'boolean') {
        return {
          passed: false,
          feedback: 'Merge the two concentric circles into a single ring shape with a hollow centre.',
        };
      }
      const mp = shapeToMultiPolygon(shapes[0]);
      const holes = countHoles(mp);
      const area = multiPolygonArea(mp);
      if (mp.length === 1 && holes === 1 && area > 20000 && area < 76000) {
        return {
          passed: true,
          feedback: 'True hollow Donut Ring verified (1 outer boundary + 1 inner hole)!',
        };
      }
      return {
        passed: false,
        feedback: 'Expected 1 hollow ring with 1 inner cut-out hole. Try Combine, or Subtract with Outer Ring #1.',
      };
    },
  },
  {
    id: 'keyhole',
    title: '5. Keyhole Plate',
    difficulty: 'Intermediate',
    recommendedOp: 'subtract',
    summary: 'Combine multi-shape boolean thinking: carve a circle + tapered slot aperture cleanly inside the indigo plate.',
    stepHint:
      'Either Union Keyhole Top + Keyhole Taper first and Subtract from Door Plate (#1), OR select Door Plate #1, Top #2, Taper #3 and Subtract all at once!',
    orderTip: 'Door Plate must be selected 1st before subtracting so the cutters carve out of the plate.',
    starterShapes: makeKeyholeReference(),
    validate: (shapes) => {
      if (shapes.length !== 1 || shapes[0].kind !== 'boolean') {
        return {
          passed: false,
          feedback: 'Finish with a single Door Plate containing one hollow keyhole cut-out.',
        };
      }
      const mp = shapeToMultiPolygon(shapes[0]);
      const holes = countHoles(mp);
      const bounds = multiPolygonBounds(mp);
      const area = multiPolygonArea(mp);
      if (mp.length === 1 && holes === 1 && bounds.w >= 260 && bounds.h >= 280 && area > 65000 && area < 120000) {
        return {
          passed: true,
          feedback: 'Precision Keyhole aperture verified inside the Door Plate!',
        };
      }
      return {
        passed: false,
        feedback: 'Result needs 1 outer plate with 1 single keyhole hole carved inside. Remember: Door Plate must be #1 when subtracting!',
      };
    },
  },
];
