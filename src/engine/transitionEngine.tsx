import React from 'react';
import { ElementRenderer } from '../components/ElementRenderer';
import { STAGE_DIMENSIONS } from '../data/themes';
import { AspectRatio, Slide, SlideBackground, SlideMaster } from '../types/presentation';
import {
  analyseMorphMatches,
  buildKineticTextTokens,
  interpolateBackground,
  interpolateElementPair,
} from './morphEngine';

export function applyEasing(t: number, easing: string): number {
  const x = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return x;
    case 'ease-out':
      return 1 - Math.pow(1 - x, 3);
    case 'spring': {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
    case 'dramatic':
      return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    default: // ease-in-out
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}

export function getEffectiveSlideBg(slide: Slide, master?: SlideMaster): SlideBackground {
  if (slide.useMaster && master) return master.background;
  return slide.background;
}

export function bgToCss(bg: SlideBackground): string {
  return bg.mode === 'gradient'
    ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientStart}, ${bg.gradientEnd})`
    : bg.colour;
}

export const SlideSurface: React.FC<{
  slide: Slide;
  width: number;
  height: number;
  master?: SlideMaster;
  slideNumber?: number;
}> = ({ slide, width, height, master, slideNumber }) => {
  const bg = getEffectiveSlideBg(slide, master);
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: bgToCss(bg),
      }}
    >
      {slide.useMaster && master?.showAccentBar && (
        <div className="absolute left-0 right-0 top-0 h-2" style={{ backgroundColor: master.accentColour }} />
      )}
      {slide.elements.map((el) => {
        if (!el.visible) return null;
        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              transform: `rotate(${el.rotation}deg)`,
            }}
          >
            <ElementRenderer element={el} />
          </div>
        );
      })}
      {slide.useMaster && master?.showFooter && (
        <div
          className="absolute bottom-7 left-16 text-lg opacity-55"
          style={{ color: master.bodyColour, fontFamily: master.bodyFont }}
        >
          {master.footerText}
        </div>
      )}
      {slide.useMaster && master?.showSlideNumber && slideNumber !== undefined && (
        <div
          className="font-mono-tabular absolute bottom-7 right-16 text-lg opacity-55"
          style={{ color: master.bodyColour }}
        >
          {slideNumber}
        </div>
      )}
    </div>
  );
};

interface TransitionStageRendererProps {
  slideA: Slide;
  slideB: Slide;
  aspectRatio: AspectRatio;
  master?: SlideMaster;
  transitionType: string;
  direction?: string;
  easing: string;
  morphMode?: 'objects' | 'words' | 'characters';
  progress: number; // 0..1
  scale: number;
  reduceMotion: boolean;
}

export const TransitionStageRenderer: React.FC<TransitionStageRendererProps> = ({
  slideA,
  slideB,
  aspectRatio,
  master,
  transitionType,
  direction = 'left',
  easing,
  morphMode = 'objects',
  progress,
  scale,
  reduceMotion,
}) => {
  const { width, height } = STAGE_DIMENSIONS[aspectRatio];
  const p = applyEasing(progress, easing);
  const inv = 1 - p;

  const renderMorphStage = () => {
    const analysis = analyseMorphMatches(slideA, slideB);
    const bgA = getEffectiveSlideBg(slideA, master);
    const bgB = getEffectiveSlideBg(slideB, master);
    const bgCss = interpolateBackground(bgA, bgB, p);

    return (
      <div className="relative overflow-hidden" style={{ width, height, background: bgCss }}>
        {/* Unmatched Outgoing Elements fade out */}
        {analysis.unmatchedOut.map((el) => (
          <div
            key={`out-${el.id}`}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              transform: `rotate(${el.rotation}deg)`,
              opacity: Math.max(0, 1 - p * 1.4),
            }}
          >
            <ElementRenderer element={el} />
          </div>
        ))}

        {/* Unmatched Incoming Elements fade in */}
        {analysis.unmatchedIn.map((el) => (
          <div
            key={`in-${el.id}`}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              transform: `rotate(${el.rotation}deg)`,
              opacity: Math.max(0, (p - 0.25) / 0.75),
            }}
          >
            <ElementRenderer element={el} />
          </div>
        ))}

        {/* Matched Morph Pairs */}
        {analysis.matched.map(({ from, to }) => {
          if ((morphMode === 'words' || morphMode === 'characters') && from.type === 'text' && to.type === 'text') {
            const tokens = buildKineticTextTokens(from, to, p, morphMode);
            return (
              <React.Fragment key={`kin-${from.id}-${to.id}`}>
                {tokens.map((tok) => (
                  <div
                    key={tok.key}
                    style={{
                      position: 'absolute',
                      left: tok.x,
                      top: tok.y,
                      opacity: tok.opacity,
                      color: tok.colour,
                      fontSize: `${tok.fontSize}px`,
                      fontFamily: `"${tok.fontFamily}", sans-serif`,
                      fontWeight: tok.fontWeight,
                      whiteSpace: 'pre',
                      willChange: 'transform, opacity',
                    }}
                  >
                    {tok.char}
                  </div>
                ))}
              </React.Fragment>
            );
          }

          const interp = interpolateElementPair(from, to, p);
          return (
            <div
              key={`morph-${from.id}-${to.id}`}
              style={{
                position: 'absolute',
                left: interp.x,
                top: interp.y,
                width: interp.w,
                height: interp.h,
                transform: `rotate(${interp.rotation}deg)`,
                willChange: 'transform, opacity',
              }}
            >
              <ElementRenderer element={interp} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderTransitionLayers = (): React.ReactNode => {
    if (transitionType === 'morph') {
      return renderMorphStage();
    }

    // Accessibility reduceMotion fallback: clean calm crossfade
    if (reduceMotion) {
      return (
        <div className="relative" style={{ width, height }}>
          <div className="absolute inset-0">
            <SlideSurface slide={slideA} width={width} height={height} master={master} slideNumber={1} />
          </div>
          <div className="absolute inset-0" style={{ opacity: p }}>
            <SlideSurface slide={slideB} width={width} height={height} master={master} slideNumber={2} />
          </div>
        </div>
      );
    }

    const slideAEl = <SlideSurface slide={slideA} width={width} height={height} master={master} slideNumber={1} />;
    const slideBEl = <SlideSurface slide={slideB} width={width} height={height} master={master} slideNumber={2} />;

    switch (transitionType) {
      case 'fade':
        if (direction === 'black') {
          return (
            <div className="relative bg-black" style={{ width, height }}>
              <div className="absolute inset-0" style={{ opacity: Math.max(0, 1 - p * 2) }}>
                {slideAEl}
              </div>
              <div className="absolute inset-0" style={{ opacity: Math.max(0, (p - 0.5) * 2) }}>
                {slideBEl}
              </div>
            </div>
          );
        }
        return (
          <div className="relative" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            <div className="absolute inset-0" style={{ opacity: p }}>
              {slideBEl}
            </div>
          </div>
        );

      case 'push': {
        const ax = direction === 'left' ? -p * 100 : direction === 'right' ? p * 100 : 0;
        const ay = direction === 'up' ? -p * 100 : direction === 'down' ? p * 100 : 0;
        const bx = direction === 'left' ? inv * 100 : direction === 'right' ? -inv * 100 : 0;
        const by = direction === 'up' ? inv * 100 : direction === 'down' ? -inv * 100 : 0;
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0" style={{ transform: `translate3d(${ax}%, ${ay}%, 0)` }}>
              {slideAEl}
            </div>
            <div className="absolute inset-0" style={{ transform: `translate3d(${bx}%, ${by}%, 0)` }}>
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'wipe': {
        const pct = Math.round(inv * 100);
        const clip =
          direction === 'right'
            ? `inset(0 ${pct}% 0 0)`
            : direction === 'up'
              ? `inset(${pct}% 0 0 0)`
              : direction === 'down'
                ? `inset(0 0 ${pct}% 0)`
                : `inset(0 0 0 ${pct}%)`;
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            <div className="absolute inset-0" style={{ clipPath: clip }}>
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'split': {
        const half = Math.round(inv * 50);
        const clip =
          direction === 'horizontal-out'
            ? `inset(${half}% 0 ${half}% 0)`
            : direction === 'horizontal-in'
              ? `inset(0 0 0 0)`
              : `inset(0 ${half}% 0 ${half}%)`;
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            <div
              className="absolute inset-0"
              style={{
                clipPath: direction?.endsWith('-in') ? undefined : clip,
                opacity: direction?.endsWith('-in') ? p : 1,
              }}
            >
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'reveal': {
        const sign = direction === 'right' ? 1 : -1;
        return (
          <div className="relative overflow-hidden bg-black" style={{ width, height }}>
            <div className="absolute inset-0" style={{ opacity: Math.min(1, p * 1.35) }}>
              {slideBEl}
            </div>
            <div
              className="absolute inset-0"
              style={{
                transform: `translate3d(${sign * p * 35}%, 0, 0)`,
                opacity: Math.max(0, 1 - p * 1.4),
              }}
            >
              {slideAEl}
            </div>
          </div>
        );
      }

      case 'cover': {
        const bx = direction === 'left' ? inv * 100 : direction === 'right' ? -inv * 100 : 0;
        const by = direction === 'up' ? inv * 100 : direction === 'down' ? -inv * 100 : 0;
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            <div className="absolute inset-0 shadow-2xl" style={{ transform: `translate3d(${bx}%, ${by}%, 0)` }}>
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'uncover': {
        const ax = direction === 'left' ? -p * 100 : direction === 'right' ? p * 100 : 0;
        const ay = direction === 'up' ? -p * 100 : direction === 'down' ? p * 100 : 0;
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{slideBEl}</div>
            <div className="absolute inset-0 shadow-2xl" style={{ transform: `translate3d(${ax}%, ${ay}%, 0)` }}>
              {slideAEl}
            </div>
          </div>
        );
      }

      case 'flash': {
        // Gentle single flash peak capped safely below 3Hz
        const whiteGlow = Math.sin(p * Math.PI);
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{p < 0.5 ? slideAEl : slideBEl}</div>
            <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: whiteGlow * 0.85 }} />
          </div>
        );
      }

      case 'dissolve': {
        const cols = 8;
        const rows = 5;
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            {Array.from({ length: cols * rows }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const hash = ((col * 37 + row * 17) % 19) / 19;
              const tileP = Math.max(0, Math.min(1, (p - hash * 0.55) / 0.45));
              return (
                <div
                  key={i}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${(col / cols) * 100}%`,
                    top: `${(row / rows) * 100}%`,
                    width: `${100 / cols + 0.2}%`,
                    height: `${100 / rows + 0.2}%`,
                    opacity: tileP,
                  }}
                >
                  <div
                    style={{
                      transform: `translate(${-col * (width / cols)}px, ${-row * (height / rows)}px)`,
                    }}
                  >
                    {slideBEl}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'zoom': {
        const isOut = direction === 'out';
        return (
          <div className="relative overflow-hidden bg-black" style={{ width, height }}>
            <div
              className="absolute inset-0"
              style={{
                transform: isOut ? `scale(${1 - p * 0.45})` : `scale(${1 + p * 0.45})`,
                opacity: Math.max(0, 1 - p * 1.3),
              }}
            >
              {slideAEl}
            </div>
            <div
              className="absolute inset-0"
              style={{
                transform: isOut ? `scale(${1.4 - p * 0.4})` : `scale(${0.65 + p * 0.35})`,
                opacity: Math.max(0, (p - 0.15) / 0.85),
              }}
            >
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'flip': {
        const sign = direction === 'right' ? 1 : -1;
        const deg = p * 180 * sign;
        return (
          <div className="relative bg-slate-950" style={{ width, height, perspective: 2400 }}>
            <div
              className="relative h-full w-full"
              style={{
                transformStyle: 'preserve-3d',
                transform: `scale(${1 - Math.sin(p * Math.PI) * 0.14}) rotateY(${deg}deg)`,
              }}
            >
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                {slideAEl}
              </div>
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {slideBEl}
              </div>
            </div>
          </div>
        );
      }

      case 'cube':
      case 'box': {
        const sign = direction === 'right' ? 1 : -1;
        const isBox = transitionType === 'box';
        const depth = width / 2;
        return (
          <div className="relative bg-slate-950 overflow-hidden" style={{ width, height, perspective: 2800 }}>
            <div
              className="relative h-full w-full"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translateZ(${-depth}px) scale(${isBox ? 0.92 : 1}) rotateY(${p * 90 * sign}deg)`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{ transform: `rotateY(0deg) translateZ(${depth}px)`, backfaceVisibility: 'hidden' }}
              >
                {slideAEl}
              </div>
              <div
                className="absolute inset-0"
                style={{
                  transform: `rotateY(${-90 * sign}deg) translateZ(${depth}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                {slideBEl}
              </div>
            </div>
          </div>
        );
      }

      case 'doors':
      case 'window': {
        const isVert = direction === 'vertical';
        const isWindow = transitionType === 'window';
        return (
          <div className="relative overflow-hidden bg-slate-950" style={{ width, height, perspective: 2200 }}>
            <div
              className="absolute inset-0"
              style={{ transform: `scale(${0.92 + p * 0.08})`, opacity: 0.4 + p * 0.6 }}
            >
              {slideBEl}
            </div>
            {/* Left / Top door */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: isVert ? 'inset(0 0 50% 0)' : 'inset(0 50% 0 0)',
                transformOrigin: isVert ? 'top center' : 'left center',
                transform: isVert
                  ? `rotateX(${(isWindow ? -1 : 1) * p * 95}deg)`
                  : `rotateY(${(isWindow ? 1 : -1) * p * 95}deg)`,
                opacity: Math.max(0, 1 - Math.max(0, p - 0.75) * 4),
              }}
            >
              {slideAEl}
            </div>
            {/* Right / Bottom door */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: isVert ? 'inset(50% 0 0 0)' : 'inset(0 0 0 50%)',
                transformOrigin: isVert ? 'bottom center' : 'right center',
                transform: isVert
                  ? `rotateX(${(isWindow ? 1 : -1) * p * 95}deg)`
                  : `rotateY(${(isWindow ? -1 : 1) * p * 95}deg)`,
                opacity: Math.max(0, 1 - Math.max(0, p - 0.75) * 4),
              }}
            >
              {slideAEl}
            </div>
          </div>
        );
      }

      case 'curtains': {
        return (
          <div className="relative overflow-hidden bg-black" style={{ width, height }}>
            <div className="absolute inset-0">{slideBEl}</div>
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'inset(0 50% 0 0)',
                transform: `translate3d(${-p * 54}%, 0, 0) scaleX(${1 - p * 0.25})`,
              }}
            >
              {slideAEl}
            </div>
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'inset(0 0 0 50%)',
                transform: `translate3d(${p * 54}%, 0, 0) scaleX(${1 - p * 0.25})`,
              }}
            >
              {slideAEl}
            </div>
          </div>
        );
      }

      case 'gallery':
      case 'conveyor': {
        const sign = direction === 'right' ? 1 : -1;
        const zoomDip = Math.sin(p * Math.PI) * 0.16;
        const tilt = transitionType === 'conveyor' ? Math.sin(p * Math.PI) * 14 * sign : 0;
        return (
          <div className="relative overflow-hidden bg-slate-950" style={{ width, height, perspective: 2200 }}>
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${1 - zoomDip}) translate3d(${sign * p * 105}%, 0, 0) rotateY(${tilt}deg)`,
                opacity: 1 - p * 0.4,
              }}
            >
              {slideAEl}
            </div>
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${1 - zoomDip}) translate3d(${-sign * inv * 105}%, 0, 0) rotateY(${tilt}deg)`,
                opacity: 0.6 + p * 0.4,
              }}
            >
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'ferris-wheel':
      case 'rotate':
      case 'orbit': {
        const sign = direction === 'right' ? 1 : -1;
        const isOrbit = transitionType === 'orbit';
        return (
          <div className="relative overflow-hidden bg-slate-950" style={{ width, height, perspective: 2400 }}>
            <div
              className="absolute inset-0"
              style={{
                transformOrigin: isOrbit ? 'center center' : '50% 170%',
                transform: isOrbit
                  ? `rotateY(${sign * p * 90}deg) translateZ(${-p * 400}px) scale(${1 - p * 0.2})`
                  : `rotate(${sign * p * 65}deg) translate3d(${sign * p * 28}%, ${p * 12}%, 0)`,
                opacity: Math.max(0, 1 - p * 1.15),
              }}
            >
              {slideAEl}
            </div>
            <div
              className="absolute inset-0"
              style={{
                transformOrigin: isOrbit ? 'center center' : '50% 170%',
                transform: isOrbit
                  ? `rotateY(${-sign * inv * 90}deg) translateZ(${-inv * 400}px) scale(${0.8 + p * 0.2})`
                  : `rotate(${-sign * inv * 65}deg) translate3d(${-sign * inv * 28}%, ${inv * 12}%, 0)`,
                opacity: Math.min(1, p * 1.2),
              }}
            >
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'fly-through': {
        const isOut = direction === 'out';
        return (
          <div className="relative overflow-hidden bg-slate-950" style={{ width, height }}>
            <div
              className="absolute inset-0"
              style={{
                transform: isOut ? `scale(${1 - p * 0.7})` : `scale(${1 + p * 1.5})`,
                opacity: Math.max(0, 1 - p * 1.35),
              }}
            >
              {slideAEl}
            </div>
            <div
              className="absolute inset-0"
              style={{
                transform: isOut ? `scale(${2.1 - p * 1.1})` : `scale(${0.25 + p * 0.75})`,
                opacity: Math.min(1, p * 1.4),
              }}
            >
              {slideBEl}
            </div>
          </div>
        );
      }

      case 'ripple': {
        const r = Math.round(p * 85);
        return (
          <div className="relative overflow-hidden" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            <div className="absolute inset-0" style={{ clipPath: `circle(${r}% at 50% 50%)` }}>
              {slideBEl}
            </div>
            {p > 0.02 && p < 0.96 && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-8 border-white/25 shadow-2xl"
                style={{ width: `${r * 2}%`, aspectRatio: '1 / 1' }}
              />
            )}
          </div>
        );
      }

      case 'vortex':
      case 'honeycomb':
      case 'fracture': {
        const cols = transitionType === 'fracture' ? 4 : 6;
        const rows = transitionType === 'fracture' ? 3 : 4;
        return (
          <div className="relative overflow-hidden bg-slate-950" style={{ width, height }}>
            <div className="absolute inset-0">{slideBEl}</div>
            {Array.from({ length: cols * rows }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const seed = ((col * 13 + row * 7) % 11) / 11;
              const localP = Math.max(0, Math.min(1, (p - seed * 0.28) / 0.72));
              const dx = (col - (cols - 1) / 2) * localP * 260;
              const dy = (row - (rows - 1) / 2) * localP * 200;
              const rot =
                transitionType === 'vortex'
                  ? localP * 180 * (i % 2 === 0 ? 1 : -1)
                  : transitionType === 'fracture'
                    ? localP * (seed - 0.5) * 90
                    : 0;
              const sc = 1 - localP * (transitionType === 'honeycomb' ? 0.9 : 0.45);
              return (
                <div
                  key={i}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${(col / cols) * 100}%`,
                    top: `${(row / rows) * 100}%`,
                    width: `${100 / cols + 0.3}%`,
                    height: `${100 / rows + 0.3}%`,
                    transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(${sc})`,
                    opacity: Math.max(0, 1 - localP * 1.1),
                    borderRadius: transitionType === 'honeycomb' ? `${localP * 40}%` : undefined,
                  }}
                >
                  <div
                    style={{
                      transform: `translate(${-col * (width / cols)}px, ${-row * (height / rows)}px)`,
                    }}
                  >
                    {slideAEl}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'shred': {
        const strips = 10;
        const isHoriz = direction === 'horizontal';
        return (
          <div className="relative overflow-hidden bg-slate-950" style={{ width, height }}>
            <div className="absolute inset-0">{slideBEl}</div>
            {Array.from({ length: strips }).map((_, i) => {
              const dir = i % 2 === 0 ? -1 : 1;
              const shift = p * 115 * dir;
              return (
                <div
                  key={i}
                  className="absolute overflow-hidden"
                  style={
                    isHoriz
                      ? {
                          left: 0,
                          right: 0,
                          top: `${(i / strips) * 100}%`,
                          height: `${100 / strips + 0.3}%`,
                          transform: `translate3d(${shift}%, 0, 0)`,
                          opacity: 1 - p * 0.5,
                        }
                      : {
                          top: 0,
                          bottom: 0,
                          left: `${(i / strips) * 100}%`,
                          width: `${100 / strips + 0.3}%`,
                          transform: `translate3d(0, ${shift}%, 0)`,
                          opacity: 1 - p * 0.5,
                        }
                  }
                >
                  <div
                    style={{
                      transform: isHoriz
                        ? `translateY(${-i * (height / strips)}px)`
                        : `translateX(${-i * (width / strips)}px)`,
                    }}
                  >
                    {slideAEl}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'page-curl':
      case 'peel-off':
      case 'origami': {
        const fromLeft = direction === 'left';
        const diag = Math.round(p * 135);
        return (
          <div className="relative overflow-hidden" style={{ width, height, perspective: 2200 }}>
            <div className="absolute inset-0">{slideBEl}</div>
            <div
              className="absolute inset-0"
              style={{
                clipPath: fromLeft
                  ? `polygon(${diag}% 0%, 100% 0%, 100% 100%, ${Math.max(0, diag - 25)}% 100%)`
                  : `polygon(0% 0%, ${Math.max(0, 100 - diag)}% 0%, ${Math.max(0, 125 - diag)}% 100%, 0% 100%)`,
                transform:
                  transitionType === 'origami'
                    ? `rotateY(${(fromLeft ? 1 : -1) * p * 35}deg)`
                    : undefined,
              }}
            >
              {slideAEl}
            </div>
            {/* Paper curl shadow crease */}
            {p > 0.02 && p < 0.98 && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-24 bg-gradient-to-r from-black/45 via-white/20 to-transparent shadow-2xl"
                style={{
                  left: fromLeft ? `${diag - 6}%` : `${Math.max(-10, 100 - diag)}%`,
                  transform: 'skewX(-12deg)',
                }}
              />
            )}
          </div>
        );
      }

      default:
        return (
          <div className="relative" style={{ width, height }}>
            <div className="absolute inset-0">{slideAEl}</div>
            <div className="absolute inset-0" style={{ opacity: p }}>
              {slideBEl}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        width: width * scale,
        height: height * scale,
      }}
      className="relative shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/30"
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {renderTransitionLayers()}
      </div>
    </div>
  );
};
