import React from 'react';
import { SlideElement } from '../types/presentation';

interface ElementRendererProps {
  element: SlideElement;
  isEditing?: boolean;
  onTextChange?: (nextText: string) => void;
  onFinishEditing?: () => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isEditing = false,
  onTextChange,
  onFinishEditing,
}) => {
  if (!element.visible) return null;

  const { fill, outline, shadow, opacity, cornerRadius, typography } = element.style;
  const safeId = element.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `fill-grad-${safeId}`;

  const getFillAttr = (): string => {
    if (fill.mode === 'none') return 'none';
    if (fill.mode === 'solid') return fill.colour;
    return `url(#${gradId})`;
  };

  const dashArray =
    outline.dash === 'dashed'
      ? `${outline.width * 3 + 5} ${outline.width * 2 + 3}`
      : outline.dash === 'dotted'
        ? `${Math.max(1, outline.width)} ${outline.width * 2 + 2}`
        : undefined;

  const dropShadowStyle: React.CSSProperties = shadow.enabled
    ? {
        filter: `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.colour})`,
      }
    : {};

  const renderShapeSvg = () => {
    const w = Math.max(2, element.w);
    const h = Math.max(2, element.h);
    const stroke = outline.width > 0 ? outline.colour : 'none';
    const strokeWidth = outline.width;

    const rad = ((fill.gradientAngle - 90) * Math.PI) / 180;
    const x1 = `${Math.round(50 - Math.cos(rad) * 50)}%`;
    const y1 = `${Math.round(50 - Math.sin(rad) * 50)}%`;
    const x2 = `${Math.round(50 + Math.cos(rad) * 50)}%`;
    const y2 = `${Math.round(50 + Math.sin(rad) * 50)}%`;

    let shapeNode: React.ReactNode = null;
    switch (element.shapeKind) {
      case 'circle':
        shapeNode = (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={Math.max(1, w / 2 - strokeWidth / 2)}
            ry={Math.max(1, h / 2 - strokeWidth / 2)}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
        break;
      case 'rounded-rectangle':
        shapeNode = (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(1, w - strokeWidth)}
            height={Math.max(1, h - strokeWidth)}
            rx={cornerRadius}
            ry={cornerRadius}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
        break;
      case 'triangle':
        shapeNode = (
          <polygon
            points={`${w / 2},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        );
        break;
      case 'star': {
        const pts: string[] = [];
        const rx = w / 2 - strokeWidth;
        const ry = h / 2 - strokeWidth;
        for (let i = 0; i < 10; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const factor = i % 2 === 0 ? 1 : 0.42;
          pts.push(`${(w / 2 + Math.cos(angle) * rx * factor).toFixed(1)},${(h / 2 + Math.sin(angle) * ry * factor).toFixed(1)}`);
        }
        shapeNode = (
          <polygon
            points={pts.join(' ')}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        );
        break;
      }
      case 'arrow':
        shapeNode = (
          <polygon
            points={`0,${h * 0.28} ${w * 0.62},${h * 0.28} ${w * 0.62},0 ${w},${h / 2} ${w * 0.62},${h} ${w * 0.62},${h * 0.72} 0,${h * 0.72}`}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        );
        break;
      case 'line':
        shapeNode = (
          <line
            x1={0}
            y1={h / 2}
            x2={w}
            y2={h / 2}
            stroke={outline.width > 0 ? outline.colour : fill.colour}
            strokeWidth={Math.max(4, outline.width)}
            strokeLinecap="round"
            strokeDasharray={dashArray}
          />
        );
        break;
      case 'callout': {
        const bodyBottom = h * 0.76;
        const r = Math.min(24, w * 0.12, bodyBottom * 0.25);
        const d = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${bodyBottom - r} Q ${w} ${bodyBottom} ${w - r} ${bodyBottom} H ${w * 0.36} L ${w * 0.2} ${h} L ${w * 0.22} ${bodyBottom} H ${r} Q 0 ${bodyBottom} 0 ${bodyBottom - r} V ${r} Q 0 0 ${r} 0 Z`;
        shapeNode = (
          <path
            d={d}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        );
        break;
      }
      case 'chevron':
        shapeNode = (
          <polygon
            points={`0,0 ${w * 0.78},0 ${w},${h / 2} ${w * 0.78},${h} 0,${h} ${w * 0.22},${h / 2}`}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        );
        break;
      case 'freeform':
        shapeNode = element.path ? (
          <svg viewBox="0 0 100 100" width={w} height={h} preserveAspectRatio="none">
            <path
              d={element.path}
              fill={getFillAttr()}
              fillRule="evenodd"
              clipRule="evenodd"
              stroke={stroke}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={dashArray}
            />
          </svg>
        ) : (
          <polygon
            points={`${w * 0.1},${h * 0.25} ${w * 0.65},0 ${w},${h * 0.45} ${w * 0.75},${h} ${w * 0.18},${h * 0.85}`}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        );
        break;
      default:
        shapeNode = (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(1, w - strokeWidth)}
            height={Math.max(1, h - strokeWidth)}
            rx={cornerRadius}
            ry={cornerRadius}
            fill={getFillAttr()}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
    }

    return (
      <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${w} ${h}`}>
        {fill.mode === 'gradient' && (
          <defs>
            {fill.gradientType === 'radial' ? (
              <radialGradient id={gradId} cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor={fill.gradientStart} />
                <stop offset="100%" stopColor={fill.gradientEnd} />
              </radialGradient>
            ) : (
              <linearGradient id={gradId} x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0%" stopColor={fill.gradientStart} />
                <stop offset="100%" stopColor={fill.gradientEnd} />
              </linearGradient>
            )}
          </defs>
        )}
        {shapeNode}
      </svg>
    );
  };

  const textStyle: React.CSSProperties = {
    fontFamily: `"${typography.fontFamily}", sans-serif`,
    fontSize: `${typography.fontSize}px`,
    fontWeight: typography.fontWeight,
    fontStyle: typography.italic ? 'italic' : 'normal',
    textDecoration: typography.underline ? 'underline' : 'none',
    color: typography.colour,
    textAlign: typography.align === 'centre' ? 'center' : typography.align,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacing}px`,
  };

  const justifyClass =
    typography.verticalAlign === 'top'
      ? 'justify-start'
      : typography.verticalAlign === 'bottom'
        ? 'justify-end'
        : 'justify-center';

  return (
    <div
      className="relative h-full w-full select-none"
      style={{
        opacity,
        ...dropShadowStyle,
      }}
    >
      {element.type === 'shape' && renderShapeSvg()}

      {element.type === 'image' && element.imageSrc && (
        <img
          src={element.imageSrc}
          alt={element.name}
          draggable={false}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          style={{
            borderRadius: `${cornerRadius}px`,
            border: outline.width > 0 ? `${outline.width}px ${outline.dash} ${outline.colour}` : 'none',
          }}
        />
      )}

      {element.type === 'svg' && element.svgContent && (
        <div
          className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          style={{ color: fill.mode === 'solid' ? fill.colour : fill.gradientStart }}
          dangerouslySetInnerHTML={{ __html: element.svgContent }}
        />
      )}

      {(element.type === 'text' || element.text || isEditing) && (
        <div
          className={`absolute inset-0 flex flex-col ${justifyClass} ${
            element.type === 'shape' ? 'px-6 py-4' : 'px-2.5 py-2'
          }`}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={element.text}
              onChange={(e) => onTextChange?.(e.target.value)}
              onBlur={() => onFinishEditing?.()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  onFinishEditing?.();
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-full w-full resize-none bg-transparent outline-none"
              style={textStyle}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words" style={textStyle}>
              {element.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
