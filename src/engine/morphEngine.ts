import { Slide, SlideBackground, SlideElement } from '../types/presentation';

export interface MorphMatchPair {
  from: SlideElement;
  to: SlideElement;
  matchType: 'bang' | 'exact';
}

export interface MorphAnalysis {
  matched: MorphMatchPair[];
  unmatchedOut: SlideElement[];
  unmatchedIn: SlideElement[];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
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

export function lerpHexColour(hexA: string, hexB: string, t: number): string {
  if (!hexA.startsWith('#') || !hexB.startsWith('#')) {
    return t < 0.5 ? hexA : hexB;
  }
  const [r1, g1, b1] = parseHexRgb(hexA);
  const [r2, g2, b2] = parseHexRgb(hexB);
  const r = Math.round(lerp(r1, r2, t)).toString(16).padStart(2, '0');
  const g = Math.round(lerp(g1, g2, t)).toString(16).padStart(2, '0');
  const b = Math.round(lerp(b1, b2, t)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function interpolateBackground(bgA: SlideBackground, bgB: SlideBackground, t: number): string {
  const cA1 = bgA.mode === 'gradient' ? bgA.gradientStart : bgA.colour;
  const cA2 = bgA.mode === 'gradient' ? bgA.gradientEnd : bgA.colour;
  const cB1 = bgB.mode === 'gradient' ? bgB.gradientStart : bgB.colour;
  const cB2 = bgB.mode === 'gradient' ? bgB.gradientEnd : bgB.colour;
  const angle = Math.round(lerp(bgA.gradientAngle || 135, bgB.gradientAngle || 135, t));
  return `linear-gradient(${angle}deg, ${lerpHexColour(cA1, cB1, t)}, ${lerpHexColour(cA2, cB2, t)})`;
}

/**
 * Matches elements between Slide A and Slide B using PowerPoint Morph rules:
 * 1) Identical names starting with `!!` (highest priority)
 * 2) Identical non-empty layer names
 */
export function analyseMorphMatches(slideA: Slide, slideB: Slide): MorphAnalysis {
  const matched: MorphMatchPair[] = [];
  const usedA = new Set<string>();
  const usedB = new Set<string>();

  // Pass 1: !! prefixed matches
  for (const elA of slideA.elements) {
    if (!elA.name.startsWith('!!')) continue;
    const matchB = slideB.elements.find((b) => !usedB.has(b.id) && b.name === elA.name);
    if (matchB) {
      matched.push({ from: elA, to: matchB, matchType: 'bang' });
      usedA.add(elA.id);
      usedB.add(matchB.id);
    }
  }

  // Pass 2: Exact name matches
  for (const elA of slideA.elements) {
    if (usedA.has(elA.id)) continue;
    const matchB = slideB.elements.find((b) => !usedB.has(b.id) && b.name === elA.name);
    if (matchB) {
      matched.push({ from: elA, to: matchB, matchType: 'exact' });
      usedA.add(elA.id);
      usedB.add(matchB.id);
    }
  }

  return {
    matched,
    unmatchedOut: slideA.elements.filter((e) => !usedA.has(e.id)),
    unmatchedIn: slideB.elements.filter((e) => !usedB.has(e.id)),
  };
}

export interface KineticToken {
  key: string;
  char: string;
  x: number;
  y: number;
  opacity: number;
  colour: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
}

/**
 * Computes interpolated tokens for Morph By Words or By Characters on matched text pairs.
 */
export function buildKineticTextTokens(
  from: SlideElement,
  to: SlideElement,
  t: number,
  mode: 'words' | 'characters',
): KineticToken[] {
  const tokenize = (el: SlideElement) => {
    const raw = mode === 'words' ? el.text.split(/(\s+)/).filter((s) => s.length > 0) : Array.from(el.text);
    const charWidth = el.style.typography.fontSize * 0.6;
    const totalLen = raw.reduce((sum, tok) => sum + tok.length, 0);
    const totalW = Math.min(el.w, totalLen * charWidth);
    const startX =
      el.style.typography.align === 'centre'
        ? el.x + (el.w - totalW) / 2
        : el.style.typography.align === 'right'
          ? el.x + el.w - totalW
          : el.x + 12;
    const baseY = el.y + el.h / 2 - el.style.typography.fontSize * 0.6;

    let cursorX = startX;
    return raw.map((tok, i) => {
      const item = {
        token: tok,
        x: cursorX,
        y: baseY,
        idx: i,
      };
      cursorX += tok.length * charWidth;
      return item;
    });
  };

  const tokensA = tokenize(from);
  const tokensB = tokenize(to);
  const usedB = new Set<number>();
  const result: KineticToken[] = [];

  // Match identical tokens (case-insensitive for characters/words)
  tokensA.forEach((a, i) => {
    if (!a.token.trim()) return;
    const matchIdx = tokensB.findIndex(
      (b, bi) => !usedB.has(bi) && b.token.toLowerCase() === a.token.toLowerCase(),
    );
    if (matchIdx !== -1) {
      usedB.add(matchIdx);
      const b = tokensB[matchIdx];
      result.push({
        key: `m-${i}-${matchIdx}`,
        char: t < 0.5 ? a.token : b.token,
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * 32,
        opacity: 1,
        colour: lerpHexColour(from.style.typography.colour, to.style.typography.colour, t),
        fontSize: lerp(from.style.typography.fontSize, to.style.typography.fontSize, t),
        fontFamily: to.style.typography.fontFamily,
        fontWeight: to.style.typography.fontWeight,
      });
    } else {
      result.push({
        key: `out-${i}`,
        char: a.token,
        x: a.x,
        y: a.y + t * 24,
        opacity: Math.max(0, 1 - t * 1.6),
        colour: from.style.typography.colour,
        fontSize: from.style.typography.fontSize,
        fontFamily: from.style.typography.fontFamily,
        fontWeight: from.style.typography.fontWeight,
      });
    }
  });

  tokensB.forEach((b, bi) => {
    if (usedB.has(bi) || !b.token.trim()) return;
    result.push({
      key: `in-${bi}`,
      char: b.token,
      x: b.x,
      y: b.y - (1 - t) * 24,
      opacity: Math.max(0, (t - 0.35) / 0.65),
      colour: to.style.typography.colour,
      fontSize: to.style.typography.fontSize,
      fontFamily: to.style.typography.fontFamily,
      fontWeight: to.style.typography.fontWeight,
    });
  });

  return result;
}

export function interpolateElementPair(from: SlideElement, to: SlideElement, t: number): SlideElement {
  return {
    ...to,
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    w: Math.max(4, lerp(from.w, to.w, t)),
    h: Math.max(4, lerp(from.h, to.h, t)),
    rotation: lerp(from.rotation, to.rotation, t),
    text: t < 0.5 ? from.text : to.text,
    style: {
      ...to.style,
      opacity: lerp(from.style.opacity, to.style.opacity, t),
      cornerRadius: lerp(from.style.cornerRadius, to.style.cornerRadius, t),
      fill: {
        ...to.style.fill,
        mode: from.style.fill.mode === 'none' && to.style.fill.mode === 'none' ? 'none' : to.style.fill.mode,
        colour: lerpHexColour(from.style.fill.colour, to.style.fill.colour, t),
        gradientStart: lerpHexColour(from.style.fill.gradientStart, to.style.fill.gradientStart, t),
        gradientEnd: lerpHexColour(from.style.fill.gradientEnd, to.style.fill.gradientEnd, t),
        gradientAngle: lerp(from.style.fill.gradientAngle, to.style.fill.gradientAngle, t),
      },
      outline: {
        ...to.style.outline,
        colour: lerpHexColour(from.style.outline.colour, to.style.outline.colour, t),
        width: lerp(from.style.outline.width, to.style.outline.width, t),
      },
      typography: {
        ...to.style.typography,
        fontSize: lerp(from.style.typography.fontSize, to.style.typography.fontSize, t),
        colour: lerpHexColour(from.style.typography.colour, to.style.typography.colour, t),
      },
    },
  };
}
