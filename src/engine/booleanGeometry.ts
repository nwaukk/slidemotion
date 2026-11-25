import * as pc from 'polygon-clipping';
import type { MultiPolygon, Pair, Polygon, Ring } from 'polygon-clipping';

const clipLib = ((pc as unknown as { default?: typeof pc }).default ?? pc) as typeof pc;

export type MergeOperation = 'union' | 'combine' | 'fragment' | 'intersect' | 'subtract';

export type LabPrimitiveKind =
  | 'circle'
  | 'rectangle'
  | 'rounded-rectangle'
  | 'triangle'
  | 'star'
  | 'diamond'
  | 'hexagon'
  | 'arrow'
  | 'chevron'
  | 'pentagon';

export interface LabShape {
  id: string;
  name: string;
  kind: LabPrimitiveKind | 'boolean';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  colour: string;
  cornerRadius?: number;
  /** Stored polygon geometry in lab canvas coordinates when created from a boolean op */
  multiPolygon?: MultiPolygon;
}

export interface BooleanResultPiece {
  id: string;
  name: string;
  multiPolygon: MultiPolygon;
  svgPath: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number };
  area: number;
  holeCount: number;
  colour: string;
}

export const LAB_CANVAS_WIDTH = 800;
export const LAB_CANVAS_HEIGHT = 500;

function closeRing(pts: Pair[]): Ring {
  if (pts.length === 0) return [];
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (Math.abs(first[0] - last[0]) > 1e-6 || Math.abs(first[1] - last[1]) > 1e-6) {
    return [...pts, [first[0], first[1]]];
  }
  return pts;
}

function rotatePoint(px: number, py: number, cx: number, cy: number, deg: number): Pair {
  if (!deg) return [px, py];
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - cx;
  const dy = py - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

export function shapeToMultiPolygon(shape: LabShape): MultiPolygon {
  if (shape.multiPolygon) {
    return shape.multiPolygon;
  }

  const { x, y, w, h, rotation } = shape;
  const cx = x + w / 2;
  const cy = y + h / 2;
  let pts: Pair[] = [];

  switch (shape.kind) {
    case 'circle': {
      const steps = 64;
      const rx = w / 2;
      const ry = h / 2;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
      }
      break;
    }

    case 'rounded-rectangle': {
      const r = Math.max(2, Math.min(shape.cornerRadius ?? 28, w / 2 - 1, h / 2 - 1));
      const arcSteps = 8;
      const corners: Array<{ ccx: number; ccy: number; start: number; end: number }> = [
        { ccx: x + w - r, ccy: y + r, start: -Math.PI / 2, end: 0 },
        { ccx: x + w - r, ccy: y + h - r, start: 0, end: Math.PI / 2 },
        { ccx: x + r, ccy: y + h - r, start: Math.PI / 2, end: Math.PI },
        { ccx: x + r, ccy: y + r, start: Math.PI, end: (Math.PI * 3) / 2 },
      ];
      corners.forEach((c) => {
        for (let i = 0; i <= arcSteps; i++) {
          const a = c.start + ((c.end - c.start) * i) / arcSteps;
          pts.push([c.ccx + Math.cos(a) * r, c.ccy + Math.sin(a) * r]);
        }
      });
      break;
    }

    case 'triangle':
      pts = [
        [x + w / 2, y],
        [x + w, y + h],
        [x, y + h],
      ];
      break;

    case 'diamond':
      pts = [
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
        [x, y + h / 2],
      ];
      break;

    case 'pentagon': {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        pts.push([cx + Math.cos(a) * (w / 2), cy + Math.sin(a) * (h / 2)]);
      }
      break;
    }

    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
        pts.push([cx + Math.cos(a) * (w / 2), cy + Math.sin(a) * (h / 2)]);
      }
      break;
    }

    case 'star': {
      const rx = w / 2;
      const ry = h / 2;
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const factor = i % 2 === 0 ? 1 : 0.42;
        pts.push([cx + Math.cos(a) * rx * factor, cy + Math.sin(a) * ry * factor]);
      }
      break;
    }

    case 'arrow':
      pts = [
        [x, y + h * 0.28],
        [x + w * 0.62, y + h * 0.28],
        [x + w * 0.62, y],
        [x + w, y + h / 2],
        [x + w * 0.62, y + h],
        [x + w * 0.62, y + h * 0.72],
        [x, y + h * 0.72],
      ];
      break;

    case 'chevron':
      pts = [
        [x, y],
        [x + w * 0.78, y],
        [x + w, y + h / 2],
        [x + w * 0.78, y + h],
        [x, y + h],
        [x + w * 0.22, y + h / 2],
      ];
      break;

    case 'rectangle':
    default:
      pts = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ];
      break;
  }

  const rotated = pts.map(([px, py]) => rotatePoint(px, py, cx, cy, rotation));
  return [[closeRing(rotated)]];
}

export function transformMultiPolygon(
  mp: MultiPolygon,
  dx: number,
  dy: number,
  scaleX = 1,
  scaleY = 1,
  originX = 0,
  originY = 0,
): MultiPolygon {
  return mp.map((poly) =>
    poly.map((ring) =>
      ring.map(([px, py]) => [originX + (px - originX) * scaleX + dx, originY + (py - originY) * scaleY + dy] as Pair),
    ),
  );
}

export function ringSignedArea(ring: Ring): number {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

export function multiPolygonArea(mp: MultiPolygon): number {
  let total = 0;
  for (const poly of mp) {
    if (poly.length === 0) continue;
    total += Math.abs(ringSignedArea(poly[0]));
    for (let i = 1; i < poly.length; i++) {
      total -= Math.abs(ringSignedArea(poly[i]));
    }
  }
  return Math.max(0, total);
}

export function countHoles(mp: MultiPolygon): number {
  return mp.reduce((acc, poly) => acc + Math.max(0, poly.length - 1), 0);
}

export function multiPolygonBounds(mp: MultiPolygon): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of mp) {
    for (const ring of poly) {
      for (const [px, py] of ring) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

export function multiPolygonCentroid(mp: MultiPolygon): { x: number; y: number } {
  const b = multiPolygonBounds(mp);
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  const outer = mp[0]?.[0];
  if (outer && outer.length > 1) {
    for (let i = 0; i < outer.length - 1; i++) {
      sumX += outer[i][0];
      sumY += outer[i][1];
      count += 1;
    }
    if (count > 0) return { x: sumX / count, y: sumY / count };
  }
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

export function multiPolygonToSvgPath(mp: MultiPolygon): string {
  const commands: string[] = [];
  for (const poly of mp) {
    for (const ring of poly) {
      if (ring.length < 2) continue;
      const pts = ring.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`);
      commands.push(`M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`);
    }
  }
  return commands.join(' ');
}

export function multiPolygonToNormalisedPath(mp: MultiPolygon): {
  path: string;
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const b = multiPolygonBounds(mp);
  const commands: string[] = [];
  for (const poly of mp) {
    for (const ring of poly) {
      if (ring.length < 2) continue;
      const pts = ring.map(([px, py]) => {
        const nx = (((px - b.minX) / b.w) * 100).toFixed(2);
        const ny = (((py - b.minY) / b.h) * 100).toFixed(2);
        return `${nx},${ny}`;
      });
      commands.push(`M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`);
    }
  }
  return {
    path: commands.join(' '),
    x: b.minX,
    y: b.minY,
    w: b.w,
    h: b.h,
  };
}

const FRAGMENT_PALETTE = ['#38bdf8', '#a855f7', '#fbbf24', '#10b981', '#fb7185', '#f97316', '#22d3ee'];

function buildPiece(
  mp: MultiPolygon,
  colour: string,
  name: string,
  idx: number,
): BooleanResultPiece | null {
  const cleaned: MultiPolygon = mp.filter(
    (poly) => poly.length > 0 && Math.abs(ringSignedArea(poly[0])) >= 4,
  );
  if (cleaned.length === 0) return null;
  const area = multiPolygonArea(cleaned);
  if (area < 8) return null;
  const bounds = multiPolygonBounds(cleaned);
  return {
    id: `piece-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    multiPolygon: cleaned,
    svgPath: multiPolygonToSvgPath(cleaned),
    bounds,
    area,
    holeCount: countHoles(cleaned),
    colour,
  };
}

export function runBooleanOperation(
  orderedShapes: LabShape[],
  op: MergeOperation,
): BooleanResultPiece[] {
  if (orderedShapes.length < 2) return [];

  const polys = orderedShapes.map(shapeToMultiPolygon);
  const baseColour = orderedShapes[0].colour;

  try {
    switch (op) {
      case 'union': {
        const res = clipLib.union(polys[0], ...polys.slice(1));
        const piece = buildPiece(res, baseColour, 'Unioned Shape', 0);
        return piece ? [piece] : [];
      }

      case 'combine': {
        const res = clipLib.xor(polys[0], ...polys.slice(1));
        const piece = buildPiece(res, baseColour, 'Combined Shape', 0);
        return piece ? [piece] : [];
      }

      case 'intersect': {
        const res = clipLib.intersection(polys[0], ...polys.slice(1));
        const piece = buildPiece(res, baseColour, 'Intersected Shape', 0);
        return piece ? [piece] : [];
      }

      case 'subtract': {
        const res = clipLib.difference(polys[0], ...polys.slice(1));
        const piece = buildPiece(res, baseColour, 'Subtracted Shape', 0);
        return piece ? [piece] : [];
      }

      case 'fragment': {
        let regions: Array<{ mp: MultiPolygon; colour: string; label: string }> = [
          { mp: polys[0], colour: orderedShapes[0].colour, label: orderedShapes[0].name },
        ];
        let covered: MultiPolygon = polys[0];

        for (let i = 1; i < polys.length; i++) {
          const nextPoly = polys[i];
          const nextRegions: Array<{ mp: MultiPolygon; colour: string; label: string }> = [];

          for (const reg of regions) {
            const outPart = clipLib.difference(reg.mp, nextPoly);
            if (multiPolygonArea(outPart) >= 8) {
              nextRegions.push({ mp: outPart, colour: reg.colour, label: reg.label });
            }
            const inPart = clipLib.intersection(reg.mp, nextPoly);
            if (multiPolygonArea(inPart) >= 8) {
              nextRegions.push({
                mp: inPart,
                colour: FRAGMENT_PALETTE[(nextRegions.length + i) % FRAGMENT_PALETTE.length],
                label: `${reg.label} ∩ ${orderedShapes[i].name}`,
              });
            }
          }

          const exclusiveNext = clipLib.difference(nextPoly, covered);
          if (multiPolygonArea(exclusiveNext) >= 8) {
            nextRegions.push({
              mp: exclusiveNext,
              colour: orderedShapes[i].colour,
              label: orderedShapes[i].name,
            });
          }

          covered = clipLib.union(covered, nextPoly);
          regions = nextRegions;
        }

        // Split multi-polygons that contain disconnected outer islands into individual selectable shards
        const pieces: BooleanResultPiece[] = [];
        let cursor = 0;
        regions.forEach((reg) => {
          reg.mp.forEach((singlePoly: Polygon) => {
            const singleMp: MultiPolygon = [singlePoly];
            const built = buildPiece(singleMp, reg.colour, `Fragment ${cursor + 1}`, cursor);
            if (built) {
              pieces.push(built);
              cursor += 1;
            }
          });
        });
        return pieces;
      }
    }
  } catch {
    return [];
  }
}

export function computeIoU(mpA: MultiPolygon, mpB: MultiPolygon): number {
  try {
    const interArea = multiPolygonArea(clipLib.intersection(mpA, mpB));
    const unionArea = multiPolygonArea(clipLib.union(mpA, mpB));
    return unionArea > 0 ? interArea / unionArea : 0;
  } catch {
    return 0;
  }
}
