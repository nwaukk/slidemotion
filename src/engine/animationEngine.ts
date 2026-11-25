import { ElementAnimation, PathPoint, SlideElement } from '../types/presentation';

export interface ScheduledAnimationItem {
  animation: ElementAnimation;
  elementId: string;
  elementName: string;
  startTime: number;
  endTime: number;
  clickGroup: number;
}

export interface ComputedElementFrame {
  visible: boolean;
  opacity: number;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  rotateY: number;
  clipPath?: string;
  filter?: string;
  tintColour?: string;
  tintAlpha?: number;
  fontWeightBoost?: number;
  textWaveProgress?: number; // -1 if inactive, else 0..1
  textRevealProgress?: number; // 0..1 for by-paragraph / by-word / by-letter
  isExitingText?: boolean;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutBounce(t: number): number {
  const x = clamp01(t);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) {
    const p = x - 1.5 / d1;
    return n1 * p * p + 0.75;
  }
  if (x < 2.5 / d1) {
    const p = x - 2.25 / d1;
    return n1 * p * p + 0.9375;
  }
  const p = x - 2.625 / d1;
  return n1 * p * p + 0.984375;
}

/**
 * Schedules every animation on a slide into exact timeline start/end seconds
 * respecting On Click, With Previous, After Previous, delay, duration, and repeat.
 */
export function buildSlideTimeline(elements: SlideElement[]): {
  items: ScheduledAnimationItem[];
  totalDuration: number;
} {
  const flat: Array<{ animation: ElementAnimation; element: SlideElement }> = [];
  elements.forEach((el) => {
    el.animations.forEach((anim) => {
      flat.push({ animation: anim, element: el });
    });
  });

  flat.sort((a, b) => a.animation.order - b.animation.order);

  const items: ScheduledAnimationItem[] = [];
  let prevStart = 0;
  let prevEnd = 0;
  let clickGroup = 0;

  flat.forEach(({ animation, element }, idx) => {
    const effectiveRepeat = animation.repeat <= 0 ? 2 : animation.repeat;
    const totalSpan = Math.max(0.05, animation.duration) * effectiveRepeat;

    let baseStart = 0;
    if (idx === 0) {
      baseStart = 0;
      if (animation.start === 'on-click') clickGroup = 1;
    } else if (animation.start === 'with-previous') {
      baseStart = prevStart;
    } else if (animation.start === 'after-previous') {
      baseStart = prevEnd;
    } else {
      // On Click — in continuous preview mode, add a crisp 0.35s breath after previous click group
      clickGroup += 1;
      baseStart = prevEnd + 0.35;
    }

    const startTime = Number((baseStart + Math.max(0, animation.delay)).toFixed(3));
    const endTime = Number((startTime + totalSpan).toFixed(3));

    items.push({
      animation,
      elementId: element.id,
      elementName: element.name,
      startTime,
      endTime,
      clickGroup,
    });

    prevStart = baseStart;
    prevEnd = Math.max(prevEnd, endTime);
  });

  return {
    items,
    totalDuration: items.reduce((max, item) => Math.max(max, item.endTime), 0),
  };
}

function sampleMotionPath(
  anim: ElementAnimation,
  progress: number,
): { dx: number; dy: number } {
  const p = easeInOutCubic(progress);
  const dist = Number(anim.options.distance) || 320;
  const dir = String(anim.options.direction || 'right');

  switch (anim.effect) {
    case 'line': {
      if (dir === 'left') return { dx: -dist * p, dy: 0 };
      if (dir === 'up') return { dx: 0, dy: -dist * p };
      if (dir === 'down') return { dx: 0, dy: dist * p };
      return { dx: dist * p, dy: 0 };
    }
    case 'arc': {
      const arcSign = dir === 'down' ? 1 : -1;
      const dx = dist * p;
      const dy = arcSign * Math.sin(p * Math.PI) * (dist * 0.42);
      return { dx, dy };
    }
    case 'turn': {
      if (dir === 'right-down') {
        if (p < 0.5) return { dx: dist * (p * 2), dy: 0 };
        return { dx: dist, dy: (dist * 0.65) * ((p - 0.5) * 2) };
      }
      if (p < 0.5) return { dx: 0, dy: (dist * 0.65) * (p * 2) };
      return { dx: dist * ((p - 0.5) * 2), dy: dist * 0.65 };
    }
    case 'shape-path': {
      const shape = String(anim.options.pathShape || 'circle');
      const r = 160;
      if (shape === 'square') {
        const seg = p * 4;
        if (seg < 1) return { dx: r * seg, dy: 0 };
        if (seg < 2) return { dx: r, dy: r * (seg - 1) };
        if (seg < 3) return { dx: r * (1 - (seg - 2)), dy: r };
        return { dx: 0, dy: r * (1 - (seg - 3)) };
      }
      if (shape === 'triangle') {
        const seg = p * 3;
        if (seg < 1) return { dx: r * 0.8 * seg, dy: r * 1.1 * seg };
        if (seg < 2) return { dx: r * 0.8 - r * 1.6 * (seg - 1), dy: r * 1.1 };
        return { dx: -r * 0.8 * (1 - (seg - 2)), dy: r * 1.1 * (1 - (seg - 2)) };
      }
      const angle = p * Math.PI * 2 - Math.PI / 2;
      return { dx: Math.cos(angle) * r, dy: Math.sin(angle) * r + r };
    }
    case 'loop': {
      const t = p * Math.PI * 2;
      return { dx: Math.sin(t) * 190, dy: Math.sin(t * 2) * 95 };
    }
    case 'custom-path': {
      const pts = anim.customPoints;
      if (!pts || pts.length < 2) return { dx: 0, dy: 0 };
      const origin = pts[0];
      const totalSegs = pts.length - 1;
      const exactIdx = p * totalSegs;
      const idx = Math.min(totalSegs - 1, Math.floor(exactIdx));
      const frac = exactIdx - idx;
      const a: PathPoint = pts[idx];
      const b: PathPoint = pts[idx + 1];
      return {
        dx: a.x + (b.x - a.x) * frac - origin.x,
        dy: a.y + (b.y - a.y) * frac - origin.y,
      };
    }
    default:
      return { dx: 0, dy: 0 };
  }
}

/**
 * Computes exact visual state for a single SlideElement at playback time `time` (seconds).
 */
export function evaluateElementAtTime(
  element: SlideElement,
  scheduledItems: ScheduledAnimationItem[],
  time: number,
  reduceMotion: boolean,
): ComputedElementFrame {
  const elItems = scheduledItems.filter((item) => item.elementId === element.id);

  const frame: ComputedElementFrame = {
    visible: true,
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    rotateY: 0,
    textWaveProgress: -1,
  };

  if (elItems.length === 0) return frame;

  // If the very first animation for this element is an entrance, element starts hidden until entrance begins
  const firstEntrance = elItems.find((i) => i.animation.category === 'entrance');
  if (firstEntrance && time < firstEntrance.startTime) {
    return { ...frame, visible: false, opacity: 0 };
  }

  for (const item of elItems) {
    const anim = item.animation;
    const dur = Math.max(0.05, anim.duration);
    const repeatCount = anim.repeat <= 0 ? 2 : anim.repeat;

    if (time < item.startTime) {
      continue;
    }

    const elapsed = time - item.startTime;
    const rawProgress = Math.min(repeatCount, elapsed / dur);
    const finished = elapsed >= dur * repeatCount;

    if (finished && anim.rewind) {
      if (anim.category === 'entrance') {
        frame.visible = false;
        frame.opacity = 0;
      }
      continue;
    }

    const cycleP = finished ? 1 : rawProgress % 1 === 0 && rawProgress > 0 ? 1 : rawProgress % 1;

    if (reduceMotion) {
      // Accessibility fallback: crisp opacity fade without spinning, flashing or flying
      if (anim.category === 'entrance') {
        frame.opacity *= easeOutCubic(cycleP);
      } else if (anim.category === 'exit') {
        frame.opacity *= 1 - easeOutCubic(cycleP);
        if (finished) frame.visible = false;
      }
      continue;
    }

    // Text stagger delivery
    if (anim.textDelivery && anim.textDelivery !== 'all') {
      if (anim.category === 'entrance') {
        frame.textRevealProgress = easeOutCubic(cycleP);
        frame.isExitingText = false;
      } else if (anim.category === 'exit') {
        frame.textRevealProgress = 1 - easeOutCubic(cycleP);
        frame.isExitingText = true;
      }
    }

    const e = easeOutCubic(cycleP);
    const dir = String(anim.options.direction || 'bottom');

    if (anim.category === 'entrance') {
      switch (anim.effect) {
        case 'appear':
          frame.opacity *= 1;
          break;
        case 'fade':
          frame.opacity *= e;
          break;
        case 'fly-in': {
          const dist = 540;
          if (dir === 'left') frame.translateX -= dist * (1 - e);
          else if (dir === 'right') frame.translateX += dist * (1 - e);
          else if (dir === 'top') frame.translateY -= dist * (1 - e);
          else frame.translateY += dist * (1 - e);
          break;
        }
        case 'float-in': {
          const dist = 54;
          frame.opacity *= e;
          frame.translateY += (dir === 'down' ? -dist : dist) * (1 - e);
          break;
        }
        case 'split': {
          const mode = String(anim.options.splitDirection || 'horizontal-out');
          const pct = Math.round((1 - e) * 50);
          if (mode === 'vertical-out') frame.clipPath = `inset(0 ${pct}% 0 ${pct}%)`;
          else if (mode === 'vertical-in') frame.clipPath = `inset(0 0 0 0)`;
          else frame.clipPath = `inset(${pct}% 0 ${pct}% 0)`;
          if (mode.endsWith('-in')) frame.opacity *= e;
          break;
        }
        case 'wipe': {
          const rem = Math.round((1 - e) * 100);
          if (dir === 'left') frame.clipPath = `inset(0 ${rem}% 0 0)`;
          else if (dir === 'right') frame.clipPath = `inset(0 0 0 ${rem}%)`;
          else if (dir === 'top') frame.clipPath = `inset(0 0 ${rem}% 0)`;
          else frame.clipPath = `inset(${rem}% 0 0 0)`;
          break;
        }
        case 'shape': {
          const shapeMask = String(anim.options.shapeMask || 'circle');
          if (shapeMask === 'box') {
            const p = Math.round((1 - e) * 50);
            frame.clipPath = `inset(${p}% ${p}% ${p}% ${p}%)`;
          } else if (shapeMask === 'diamond') {
            const d = e * 100;
            frame.clipPath = `polygon(50% ${50 - d}%, ${50 + d}% 50%, 50% ${50 + d}%, ${50 - d}% 50%)`;
          } else {
            frame.clipPath = `circle(${Math.round(e * 80)}% at 50% 50%)`;
          }
          break;
        }
        case 'wheel': {
          const spokes = Number(anim.options.spokes) || 1;
          const deg = Math.min(360, e * (360 / spokes) * spokes);
          if (e < 1) {
            frame.clipPath = `inset(0 ${Math.max(0, 100 - Math.round((deg / 360) * 100))}% 0 0)`;
            frame.rotate += (1 - e) * -28;
          }
          frame.opacity *= clamp01(e * 2.5);
          break;
        }
        case 'random-bars': {
          const orient = String(anim.options.orientation || 'horizontal');
          if (e < 1) {
            const step = Math.round((1 - e) * 45);
            frame.clipPath =
              orient === 'vertical'
                ? `inset(0 ${step}% 0 ${step}%)`
                : `inset(${step}% 0 ${step}% 0)`;
          }
          frame.opacity *= clamp01(e * 1.8);
          break;
        }
        case 'grow-and-turn':
          frame.opacity *= e;
          frame.scaleX *= 0.4 + 0.6 * e;
          frame.scaleY *= 0.4 + 0.6 * e;
          frame.rotate += -35 * (1 - e);
          break;
        case 'zoom':
          frame.opacity *= e;
          frame.scaleX *= 0.65 + 0.35 * e;
          frame.scaleY *= 0.65 + 0.35 * e;
          break;
        case 'swivel':
          frame.rotateY += (1 - e) * 90;
          frame.opacity *= clamp01(e * 1.4);
          break;
        case 'bounce': {
          const b = easeOutBounce(cycleP);
          frame.translateY -= (1 - b) * 260;
          frame.opacity *= clamp01(cycleP * 4);
          break;
        }
      }
    } else if (anim.category === 'emphasis') {
      const wave = Math.sin(cycleP * Math.PI);
      switch (anim.effect) {
        case 'pulse': {
          const peak = (Number(anim.options.scale) || 112) / 100;
          const s = 1 + (peak - 1) * wave;
          frame.scaleX *= s;
          frame.scaleY *= s;
          break;
        }
        case 'colour-pulse': {
          // Safe flash speed: at most 1 pulse per cycle >= 0.4s (< 3 Hz)
          const safeWave = dur < 0.36 ? 0.5 : wave;
          frame.tintColour = String(anim.options.tintColour || '#fbbf24');
          frame.tintAlpha = safeWave * 0.65;
          break;
        }
        case 'teeter':
          frame.rotate += Math.sin(cycleP * Math.PI * 4) * 7 * (1 - cycleP * 0.4);
          break;
        case 'spin': {
          const targetDeg = Number(anim.options.angle) || 360;
          frame.rotate += targetDeg * easeInOutCubic(cycleP);
          break;
        }
        case 'grow-shrink': {
          const target = (Number(anim.options.targetScale) || 120) / 100;
          const s = 1 + (target - 1) * easeInOutCubic(cycleP);
          frame.scaleX *= s;
          frame.scaleY *= s;
          break;
        }
        case 'desaturate':
          frame.filter = `${frame.filter ?? ''} saturate(${1 - 0.85 * easeInOutCubic(cycleP)})`.trim();
          break;
        case 'darken':
          frame.filter = `${frame.filter ?? ''} brightness(${1 - 0.48 * easeInOutCubic(cycleP)})`.trim();
          break;
        case 'lighten':
          frame.filter = `${frame.filter ?? ''} brightness(${1 + 0.45 * easeInOutCubic(cycleP)})`.trim();
          break;
        case 'transparency': {
          const targetOp = (Number(anim.options.targetOpacity) || 35) / 100;
          frame.opacity *= 1 - (1 - targetOp) * easeInOutCubic(cycleP);
          break;
        }
        case 'object-colour':
          frame.tintColour = String(anim.options.targetColour || '#10b981');
          frame.tintAlpha = easeInOutCubic(cycleP) * 0.72;
          break;
        case 'bold-flash': {
          // Strict < 3 flashes/sec safety cap (duration >= 0.4s per cycle)
          const safeIntensity = dur < 0.36 ? 0.4 : wave;
          frame.fontWeightBoost = safeIntensity > 0.3 ? 800 : undefined;
          const s = 1 + 0.06 * safeIntensity;
          frame.scaleX *= s;
          frame.scaleY *= s;
          frame.filter = `${frame.filter ?? ''} brightness(${1 + 0.25 * safeIntensity})`.trim();
          break;
        }
        case 'wave':
          frame.textWaveProgress = finished ? -1 : cycleP;
          frame.translateY += -Math.sin(cycleP * Math.PI * 2) * 14;
          break;
      }
    } else if (anim.category === 'exit') {
      if (finished && !anim.rewind) {
        frame.visible = false;
        frame.opacity = 0;
        continue;
      }
      switch (anim.effect) {
        case 'disappear':
          frame.visible = false;
          frame.opacity = 0;
          break;
        case 'fade-out':
          frame.opacity *= 1 - e;
          break;
        case 'fly-out': {
          const dist = 540;
          if (dir === 'left') frame.translateX -= dist * e;
          else if (dir === 'right') frame.translateX += dist * e;
          else if (dir === 'top') frame.translateY -= dist * e;
          else frame.translateY += dist * e;
          break;
        }
        case 'float-out':
          frame.opacity *= 1 - e;
          frame.translateY += (dir === 'up' ? -54 : 54) * e;
          break;
        case 'split-out': {
          const pct = Math.round(e * 50);
          frame.clipPath = `inset(${pct}% 0 ${pct}% 0)`;
          frame.opacity *= 1 - e * 0.4;
          break;
        }
        case 'wipe-out': {
          const rem = Math.round(e * 100);
          if (dir === 'left') frame.clipPath = `inset(0 ${rem}% 0 0)`;
          else if (dir === 'right') frame.clipPath = `inset(0 0 0 ${rem}%)`;
          else if (dir === 'top') frame.clipPath = `inset(0 0 ${rem}% 0)`;
          else frame.clipPath = `inset(${rem}% 0 0 0)`;
          break;
        }
        case 'shape-out':
          frame.clipPath = `circle(${Math.max(0, Math.round((1 - e) * 80))}% at 50% 50%)`;
          break;
        case 'wheel-out':
          frame.opacity *= 1 - e;
          frame.rotate += e * 36;
          break;
        case 'random-bars-out':
          frame.opacity *= 1 - e;
          frame.clipPath = `inset(${Math.round(e * 48)}% 0 ${Math.round(e * 48)}% 0)`;
          break;
        case 'shrink-and-turn':
          frame.opacity *= 1 - e;
          frame.scaleX *= 1 - 0.6 * e;
          frame.scaleY *= 1 - 0.6 * e;
          frame.rotate += 35 * e;
          break;
        case 'zoom-out':
          frame.opacity *= 1 - e;
          frame.scaleX *= 1 - 0.35 * e;
          frame.scaleY *= 1 - 0.35 * e;
          break;
        case 'swivel-out':
          frame.rotateY += e * 90;
          frame.opacity *= 1 - e;
          break;
        case 'bounce-out':
          frame.translateY += Math.pow(cycleP, 2) * 280 - Math.sin(cycleP * Math.PI) * 50;
          frame.opacity *= 1 - Math.pow(cycleP, 2);
          break;
      }
    } else if (anim.category === 'motion-path') {
      const { dx, dy } = sampleMotionPath(anim, cycleP);
      frame.translateX += dx;
      frame.translateY += dy;
    }
  }

  return frame;
}

/**
 * Generates an SVG path string (in stage coordinates) for visualising a Motion Path on canvas.
 */
export function getMotionPathPreviewSvg(element: SlideElement, anim: ElementAnimation): string {
  const cx = element.x + element.w / 2;
  const cy = element.y + element.h / 2;
  const dist = Number(anim.options.distance) || 320;
  const dir = String(anim.options.direction || 'right');

  switch (anim.effect) {
    case 'line': {
      const dx = dir === 'left' ? -dist : dir === 'right' ? dist : 0;
      const dy = dir === 'up' ? -dist : dir === 'down' ? dist : 0;
      return `M ${cx} ${cy} L ${cx + dx} ${cy + dy}`;
    }
    case 'arc': {
      const arcSign = dir === 'down' ? 1 : -1;
      const midX = cx + dist / 2;
      const midY = cy + arcSign * dist * 0.65;
      return `M ${cx} ${cy} Q ${midX} ${midY} ${cx + dist} ${cy}`;
    }
    case 'turn': {
      if (dir === 'right-down') {
        return `M ${cx} ${cy} L ${cx + dist} ${cy} L ${cx + dist} ${cy + dist * 0.65}`;
      }
      return `M ${cx} ${cy} L ${cx} ${cy + dist * 0.65} L ${cx + dist} ${cy + dist * 0.65}`;
    }
    case 'shape-path': {
      const shape = String(anim.options.pathShape || 'circle');
      const r = 160;
      if (shape === 'square') {
        return `M ${cx} ${cy} L ${cx + r} ${cy} L ${cx + r} ${cy + r} L ${cx} ${cy + r} Z`;
      }
      if (shape === 'triangle') {
        return `M ${cx} ${cy} L ${cx + r * 0.8} ${cy + r * 1.1} L ${cx - r * 0.8} ${cy + r * 1.1} Z`;
      }
      return `M ${cx} ${cy} A ${r} ${r} 0 1 1 ${cx - 0.1} ${cy}`;
    }
    case 'loop': {
      return `M ${cx} ${cy} C ${cx + 190} ${cy - 130} ${cx + 190} ${cy + 130} ${cx} ${cy} C ${cx - 190} ${cy - 130} ${cx - 190} ${cy + 130} ${cx} ${cy}`;
    }
    case 'custom-path': {
      const pts = anim.customPoints;
      if (!pts || pts.length < 2) return '';
      const ox = pts[0].x;
      const oy = pts[0].y;
      return pts
        .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(cx + (pt.x - ox))} ${Math.round(cy + (pt.y - oy))}`)
        .join(' ');
    }
    default:
      return '';
  }
}
