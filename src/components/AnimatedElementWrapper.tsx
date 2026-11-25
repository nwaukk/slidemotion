import React from 'react';
import { ComputedElementFrame, evaluateElementAtTime, ScheduledAnimationItem } from '../engine/animationEngine';
import { ElementRenderer } from './ElementRenderer';
import { SlideElement, TextDeliveryMode } from '../types/presentation';

interface AnimatedElementWrapperProps {
  element: SlideElement;
  scheduledItems: ScheduledAnimationItem[];
  currentTime: number;
  isPlayingOrPreviewing: boolean;
  reduceMotion: boolean;
}

export const AnimatedElementWrapper: React.FC<AnimatedElementWrapperProps> = ({
  element,
  scheduledItems,
  currentTime,
  isPlayingOrPreviewing,
  reduceMotion,
}) => {
  if (!element.visible) return null;

  if (!isPlayingOrPreviewing) {
    return <ElementRenderer element={element} />;
  }

  const frame: ComputedElementFrame = evaluateElementAtTime(
    element,
    scheduledItems,
    currentTime,
    reduceMotion,
  );

  if (!frame.visible || frame.opacity <= 0.005) {
    return null;
  }

  // Check if element uses paragraph/word/letter staggered text delivery
  const activeTextAnim = scheduledItems.find(
    (item) =>
      item.elementId === element.id &&
      item.animation.textDelivery &&
      item.animation.textDelivery !== 'all',
  );
  const delivery: TextDeliveryMode = activeTextAnim?.animation.textDelivery ?? 'all';

  const transformCss = [
    `translate3d(${frame.translateX}px, ${frame.translateY}px, 0)`,
    `rotate(${frame.rotate}deg)`,
    frame.rotateY ? `perspective(900px) rotateY(${frame.rotateY}deg)` : '',
    `scale(${frame.scaleX}, ${frame.scaleY})`,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity: frame.opacity,
    transform: transformCss,
    clipPath: frame.clipPath,
    filter: frame.filter,
    willChange: 'transform, opacity',
  };

  // Render staggered text chunks when textDelivery !== 'all' and progress is provided
  const renderStaggeredText = () => {
    if (delivery === 'all' || !element.text) return null;
    const progress = frame.textRevealProgress ?? 1;
    const typo = element.style.typography;
    const justifyClass =
      typo.verticalAlign === 'top'
        ? 'justify-start'
        : typo.verticalAlign === 'bottom'
          ? 'justify-end'
          : 'justify-center';

    const textBaseStyle: React.CSSProperties = {
      fontFamily: `"${typo.fontFamily}", sans-serif`,
      fontSize: `${typo.fontSize}px`,
      fontWeight: frame.fontWeightBoost ?? typo.fontWeight,
      fontStyle: typo.italic ? 'italic' : 'normal',
      textDecoration: typo.underline ? 'underline' : 'none',
      color: typo.colour,
      textAlign: typo.align === 'centre' ? 'center' : typo.align,
      lineHeight: typo.lineHeight,
      letterSpacing: `${typo.letterSpacing}px`,
    };

    const units =
      delivery === 'paragraph'
        ? element.text.split('\n')
        : delivery === 'word'
          ? element.text.split(/(\s+)/)
          : Array.from(element.text);

    const total = Math.max(1, units.length);

    return (
      <div
        className={`absolute inset-0 flex flex-col ${justifyClass} ${
          element.type === 'shape' ? 'px-6 py-4' : 'px-2.5 py-2'
        }`}
        style={textBaseStyle}
      >
        {delivery === 'paragraph' ? (
          units.map((line, i) => {
            const threshold = i / total;
            const localP = Math.max(0, Math.min(1, (progress - threshold) * total));
            const waveY =
              frame.textWaveProgress !== undefined && frame.textWaveProgress >= 0
                ? -Math.sin((frame.textWaveProgress * Math.PI * 2) + i * 0.7) * 10
                : 0;
            return (
              <div
                key={i}
                style={{
                  opacity: localP,
                  transform: `translateY(${(1 - localP) * 14 + waveY}px)`,
                }}
              >
                {line || '\u00A0'}
              </div>
            );
          })
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {units.map((token, i) => {
              const threshold = i / total;
              const localP = Math.max(0, Math.min(1, (progress - threshold) * total));
              const waveY =
                frame.textWaveProgress !== undefined && frame.textWaveProgress >= 0
                  ? -Math.sin((frame.textWaveProgress * Math.PI * 2) + i * 0.45) * 10
                  : 0;
              return (
                <span
                  key={i}
                  style={{
                    display: token === '\n' ? 'block' : 'inline-block',
                    opacity: localP,
                    transform: `translateY(${(1 - localP) * 10 + waveY}px)`,
                    whiteSpace: 'pre',
                  }}
                >
                  {token === '\n' ? '' : token}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const effectiveElement: SlideElement =
    frame.fontWeightBoost || frame.tintColour
      ? {
          ...element,
          style: {
            ...element.style,
            typography: {
              ...element.style.typography,
              fontWeight: (frame.fontWeightBoost ?? element.style.typography.fontWeight) as
                | 400
                | 500
                | 600
                | 700
                | 800,
            },
          },
        }
      : element;

  return (
    <div style={wrapperStyle} className="relative">
      {delivery !== 'all' && element.type === 'text' ? (
        renderStaggeredText()
      ) : (
        <ElementRenderer element={effectiveElement} />
      )}

      {/* Colour Pulse / Object Colour tint overlay */}
      {frame.tintColour && frame.tintAlpha !== undefined && frame.tintAlpha > 0 && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            backgroundColor: frame.tintColour,
            opacity: frame.tintAlpha,
            mixBlendMode: 'screen',
            borderRadius: element.shapeKind === 'circle' ? '9999px' : `${element.style.cornerRadius}px`,
          }}
        />
      )}
    </div>
  );
};
