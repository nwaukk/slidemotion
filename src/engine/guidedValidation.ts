import { SlideElement } from '../types/presentation';

export type GuidedDifficulty = 'beginner' | 'standard' | 'pro';

export interface DifficultyThresholds {
  label: string;
  description: string;
  positionPct: number; // e.g. 0.03 = 3%
  sizePct: number; // e.g. 0.05 = 5%
  deltaEMax: number; // e.g. 10
  snapPx: number;
  defaultGhostOpacity: number;
}

export const DIFFICULTY_THRESHOLDS: Record<GuidedDifficulty, DifficultyThresholds> = {
  beginner: {
    label: 'Beginner',
    description: 'Gentle tolerances (4% pos, 6% size, ΔE < 14) with target snapping and 35% ghost.',
    positionPct: 0.04,
    sizePct: 0.06,
    deltaEMax: 14,
    snapPx: 18,
    defaultGhostOpacity: 0.35,
  },
  standard: {
    label: 'Standard',
    description: 'Studio standard tolerances (position ≤ 3%, size ≤ 5%, ΔE < 10) with light ghost.',
    positionPct: 0.03,
    sizePct: 0.05,
    deltaEMax: 10,
    snapPx: 8,
    defaultGhostOpacity: 0.2,
  },
  pro: {
    label: 'Pro',
    description: 'Precision tolerances (position ≤ 2%, size ≤ 3.5%, ΔE < 8), no snapping, ghost off by default.',
    positionPct: 0.02,
    sizePct: 0.035,
    deltaEMax: 8,
    snapPx: 0,
    defaultGhostOpacity: 0,
  },
};

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0,
    ];
  }
  if (clean.length >= 6) {
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  }
  return [128, 128, 128];
}

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => {
    const v = c / 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  };
  const rl = lin(r) * 100;
  const gl = lin(g) * 100;
  const bl = lin(b) * 100;
  return [
    rl * 0.4124 + gl * 0.3576 + bl * 0.1805,
    rl * 0.2126 + gl * 0.7152 + bl * 0.0722,
    rl * 0.0193 + gl * 0.1192 + bl * 0.9505,
  ];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / refX);
  const fy = f(y / refY);
  const fz = f(z / refZ);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Computes perceptual CIE76 Delta E colour distance between two hex colours.
 */
export function computeDeltaE(hexA: string, hexB: string): number {
  const [r1, g1, b1] = parseHexRgb(hexA);
  const [r2, g2, b2] = parseHexRgb(hexB);
  const [x1, y1, z1] = rgbToXyz(r1, g1, b1);
  const [x2, y2, z2] = rgbToXyz(r2, g2, b2);
  const [l1, a1, bLab1] = xyzToLab(x1, y1, z1);
  const [l2, a2, bLab2] = xyzToLab(x2, y2, z2);
  return Math.sqrt(Math.pow(l2 - l1, 2) + Math.pow(a2 - a1, 2) + Math.pow(bLab2 - bLab1, 2));
}

export interface StepValidationReport {
  stepId: string;
  found: boolean;
  passed: boolean;
  positionOk: boolean;
  sizeOk: boolean;
  colourOk: boolean;
  textOk: boolean;
  posErrorXPct: number;
  posErrorYPct: number;
  sizeErrorWPct: number;
  sizeErrorHPct: number;
  deltaE: number;
  hints: string[];
}

export function getElementPrimaryColour(el: SlideElement): string {
  if (el.type === 'text') return el.style.typography.colour;
  if (el.style.fill.mode === 'gradient') return el.style.fill.gradientStart;
  return el.style.fill.colour;
}

export function validateStepElement(
  userElement: SlideElement | undefined,
  targetElement: SlideElement,
  stepId: string,
  requireTextMatch: boolean,
  difficulty: GuidedDifficulty,
  stageWidth = 1920,
  stageHeight = 1080,
): StepValidationReport {
  const rules = DIFFICULTY_THRESHOLDS[difficulty];

  if (!userElement) {
    return {
      stepId,
      found: false,
      passed: false,
      positionOk: false,
      sizeOk: false,
      colourOk: false,
      textOk: false,
      posErrorXPct: 100,
      posErrorYPct: 100,
      sizeErrorWPct: 100,
      sizeErrorHPct: 100,
      deltaE: 100,
      hints: [`Add the "${targetElement.name}" element to the stage first.`],
    };
  }

  const dx = userElement.x - targetElement.x;
  const dy = userElement.y - targetElement.y;
  const dw = userElement.w - targetElement.w;
  const dh = userElement.h - targetElement.h;

  const posErrorXPct = Math.abs(dx) / stageWidth;
  const posErrorYPct = Math.abs(dy) / stageHeight;
  const sizeErrorWPct = Math.abs(dw) / Math.max(40, targetElement.w);
  const sizeErrorHPct = Math.abs(dh) / Math.max(20, targetElement.h);

  const positionOk = posErrorXPct <= rules.positionPct && posErrorYPct <= rules.positionPct;
  const sizeOk = sizeErrorWPct <= rules.sizePct && sizeErrorHPct <= rules.sizePct;

  const userCol = getElementPrimaryColour(userElement);
  const targetCol = getElementPrimaryColour(targetElement);
  const deltaE = computeDeltaE(userCol, targetCol);
  const colourOk = deltaE < rules.deltaEMax;

  let textOk = true;
  if (requireTextMatch) {
    const cleanUser = userElement.text.trim().toLowerCase();
    const cleanTarget = targetElement.text.trim().toLowerCase();
    const keywords = cleanTarget.split(/\s+/).filter((w) => w.length >= 2);
    textOk =
      cleanUser === cleanTarget ||
      (cleanUser.length >= 3 && keywords.some((kw) => cleanUser.includes(kw)));
  }

  const hints: string[] = [];
  if (!positionOk) {
    const dirX = dx > 12 ? `left ${Math.round(Math.abs(dx))}px` : dx < -12 ? `right ${Math.round(Math.abs(dx))}px` : '';
    const dirY = dy > 12 ? `up ${Math.round(Math.abs(dy))}px` : dy < -12 ? `down ${Math.round(Math.abs(dy))}px` : '';
    const moveStr = [dirX, dirY].filter(Boolean).join(' and ');
    hints.push(`Position outside ≤ ${(rules.positionPct * 100).toFixed(1)}% tolerance — nudge ${moveStr || 'closer to target'}.`);
  }
  if (!sizeOk) {
    hints.push(
      `Size outside ≤ ${(rules.sizePct * 100).toFixed(1)}% tolerance — target is ${Math.round(targetElement.w)} × ${Math.round(targetElement.h)}px.`,
    );
  }
  if (!colourOk) {
    hints.push(`Colour ΔE is ${deltaE.toFixed(1)} (target < ${rules.deltaEMax}). Match closer to ${targetCol}.`);
  }
  if (!textOk) {
    hints.push(`Update the text to match "${targetElement.text.replace(/\n/g, ' ')}".`);
  }

  const passed = positionOk && sizeOk && colourOk && textOk;
  if (passed) {
    hints.push('Spot on — position, proportions, colour and copy all pass!');
  }

  return {
    stepId,
    found: true,
    passed,
    positionOk,
    sizeOk,
    colourOk,
    textOk,
    posErrorXPct: Number((posErrorXPct * 100).toFixed(1)),
    posErrorYPct: Number((posErrorYPct * 100).toFixed(1)),
    sizeErrorWPct: Number((sizeErrorWPct * 100).toFixed(1)),
    sizeErrorHPct: Number((sizeErrorHPct * 100).toFixed(1)),
    deltaE: Number(deltaE.toFixed(1)),
    hints,
  };
}
