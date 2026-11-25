import { STAGE_DIMENSIONS } from '../data/themes';
import { Project, Slide, SlideBackground, SlideElement } from '../types/presentation';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getEffectiveBackground(slide: Slide, project: Project): SlideBackground {
  return slide.useMaster ? project.master.background : slide.background;
}

function renderElementSvgString(el: SlideElement): string {
  if (!el.visible) return '';
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  const transform = `translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.w / 2}, ${el.h / 2})`;
  const gradId = `grad-${el.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const filterId = `shadow-${el.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  let defs = '';
  let fillAttr = 'none';
  if (el.style.fill.mode === 'solid') {
    fillAttr = el.style.fill.colour;
  } else if (el.style.fill.mode === 'gradient') {
    if (el.style.fill.gradientType === 'radial') {
      defs += `<radialGradient id="${gradId}" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${el.style.fill.gradientStart}"/><stop offset="100%" stop-color="${el.style.fill.gradientEnd}"/></radialGradient>`;
    } else {
      const rad = ((el.style.fill.gradientAngle - 90) * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(rad) * 50);
      const y1 = Math.round(50 - Math.sin(rad) * 50);
      const x2 = Math.round(50 + Math.cos(rad) * 50);
      const y2 = Math.round(50 + Math.sin(rad) * 50);
      defs += `<linearGradient id="${gradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"><stop offset="0%" stop-color="${el.style.fill.gradientStart}"/><stop offset="100%" stop-color="${el.style.fill.gradientEnd}"/></linearGradient>`;
    }
    fillAttr = `url(#${gradId})`;
  }

  let filterAttr = '';
  if (el.style.shadow.enabled) {
    defs += `<filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="${el.style.shadow.offsetX}" dy="${el.style.shadow.offsetY}" stdDeviation="${el.style.shadow.blur / 2}" flood-color="${el.style.shadow.colour}"/></filter>`;
    filterAttr = `filter="url(#${filterId})"`;
  }

  const stroke = el.style.outline.width > 0 ? el.style.outline.colour : 'none';
  const strokeWidth = el.style.outline.width;
  const dashArray =
    el.style.outline.dash === 'dashed'
      ? `${strokeWidth * 3 + 4} ${strokeWidth * 2 + 2}`
      : el.style.outline.dash === 'dotted'
        ? `${strokeWidth} ${strokeWidth * 2}`
        : '';

  let shapeSvg = '';
  if (el.type === 'shape') {
    const common = `fill="${fillAttr}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashArray ? `stroke-dasharray="${dashArray}"` : ''}`;
    switch (el.shapeKind) {
      case 'circle':
        shapeSvg = `<ellipse cx="${el.w / 2}" cy="${el.h / 2}" rx="${Math.max(1, el.w / 2)}" ry="${Math.max(1, el.h / 2)}" ${common}/>`;
        break;
      case 'rounded-rectangle':
        shapeSvg = `<rect x="0" y="0" width="${el.w}" height="${el.h}" rx="${el.style.cornerRadius}" ry="${el.style.cornerRadius}" ${common}/>`;
        break;
      case 'triangle':
        shapeSvg = `<polygon points="${el.w / 2},0 ${el.w},${el.h} 0,${el.h}" ${common}/>`;
        break;
      case 'star': {
        const pts: string[] = [];
        const rx = el.w / 2;
        const ry = el.h / 2;
        for (let i = 0; i < 10; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const factor = i % 2 === 0 ? 1 : 0.42;
          pts.push(`${(rx + Math.cos(angle) * rx * factor).toFixed(1)},${(ry + Math.sin(angle) * ry * factor).toFixed(1)}`);
        }
        shapeSvg = `<polygon points="${pts.join(' ')}" ${common}/>`;
        break;
      }
      case 'arrow':
        shapeSvg = `<polygon points="0,${el.h * 0.28} ${el.w * 0.62},${el.h * 0.28} ${el.w * 0.62},0 ${el.w},${el.h / 2} ${el.w * 0.62},${el.h} ${el.w * 0.62},${el.h * 0.72} 0,${el.h * 0.72}" ${common}/>`;
        break;
      case 'line':
        shapeSvg = `<line x1="0" y1="${el.h / 2}" x2="${el.w}" y2="${el.h / 2}" stroke="${el.style.outline.width > 0 ? el.style.outline.colour : el.style.fill.colour}" stroke-width="${Math.max(4, strokeWidth)}" stroke-linecap="round" ${dashArray ? `stroke-dasharray="${dashArray}"` : ''}/>`;
        break;
      case 'callout':
        shapeSvg = `<path d="M 18 0 H ${el.w - 18} Q ${el.w} 0 ${el.w} 18 V ${el.h * 0.76 - 18} Q ${el.w} ${el.h * 0.76} ${el.w - 18} ${el.h * 0.76} H ${el.w * 0.36} L ${el.w * 0.2} ${el.h} L ${el.w * 0.22} ${el.h * 0.76} H 18 Q 0 ${el.h * 0.76} 0 ${el.h * 0.76 - 18} V 18 Q 0 0 18 0 Z" ${common}/>`;
        break;
      case 'chevron':
        shapeSvg = `<polygon points="0,0 ${el.w * 0.78},0 ${el.w},${el.h / 2} ${el.w * 0.78},${el.h} 0,${el.h} ${el.w * 0.22},${el.h / 2}" ${common}/>`;
        break;
      case 'freeform':
        if (el.path) {
          shapeSvg = `<svg viewBox="0 0 100 100" width="${el.w}" height="${el.h}" preserveAspectRatio="none"><path d="${el.path}" fill-rule="evenodd" clip-rule="evenodd" vector-effect="non-scaling-stroke" ${common}/></svg>`;
        } else {
          shapeSvg = `<polygon points="${el.w * 0.1},${el.h * 0.25} ${el.w * 0.65},0 ${el.w},${el.h * 0.45} ${el.w * 0.75},${el.h} ${el.w * 0.18},${el.h * 0.85}" ${common}/>`;
        }
        break;
      default:
        shapeSvg = `<rect x="0" y="0" width="${el.w}" height="${el.h}" ${common}/>`;
    }
  } else if (el.type === 'image' && el.imageSrc) {
    shapeSvg = `<image href="${escapeXml(el.imageSrc)}" x="0" y="0" width="${el.w}" height="${el.h}" preserveAspectRatio="xMidYMid slice"/>`;
  } else if (el.type === 'svg' && el.svgContent) {
    shapeSvg = `<g style="color:${el.style.fill.mode === 'solid' ? el.style.fill.colour : '#38bdf8'}">${el.svgContent.replace(/<svg([^>]*)>/, `<svg$1 width="${el.w}" height="${el.h}">`)}</g>`;
  }

  let textHtml = '';
  if (el.text.trim()) {
    const typo = el.style.typography;
    const alignCss = typo.align === 'centre' ? 'center' : typo.align;
    const justifyCss =
      typo.verticalAlign === 'top' ? 'flex-start' : typo.verticalAlign === 'bottom' ? 'flex-end' : 'center';
    textHtml = `
      <foreignObject x="0" y="0" width="${el.w}" height="${el.h}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:${justifyCss};padding:${el.type === 'shape' ? '18px 24px' : '8px 10px'};box-sizing:border-box;font-family:'${escapeXml(typo.fontFamily)}', sans-serif;font-size:${typo.fontSize}px;font-weight:${typo.fontWeight};font-style:${typo.italic ? 'italic' : 'normal'};text-decoration:${typo.underline ? 'underline' : 'none'};color:${typo.colour};text-align:${alignCss};line-height:${typo.lineHeight};letter-spacing:${typo.letterSpacing}px;white-space:pre-wrap;word-break:break-word;">${escapeXml(el.text)}</div>
      </foreignObject>
    `;
  }

  return `
    ${defs ? `<defs>${defs}</defs>` : ''}
    <g transform="${transform}" opacity="${el.style.opacity}" ${filterAttr} data-center="${cx},${cy}">
      ${shapeSvg}
      ${textHtml}
    </g>
  `;
}

export function buildSlideSvgDocument(slide: Slide, slideIndex: number, project: Project): string {
  const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
  const bg = getEffectiveBackground(slide, project);
  const bgDef =
    bg.mode === 'gradient'
      ? `<defs><linearGradient id="slide-bg-${slide.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${bg.gradientStart}"/><stop offset="100%" stop-color="${bg.gradientEnd}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#slide-bg-${slide.id})"/>`
      : `<rect width="${width}" height="${height}" fill="${bg.colour}"/>`;

  const masterOverlays = slide.useMaster
    ? `${project.master.showAccentBar ? `<rect x="0" y="0" width="${width}" height="6" fill="${project.master.accentColour}"/>` : ''}
       ${project.master.showFooter ? `<text x="64" y="${height - 28}" fill="${project.master.bodyColour}" opacity="0.55" font-family="${escapeXml(project.master.bodyFont)}, sans-serif" font-size="18">${escapeXml(project.master.footerText)}</text>` : ''}
       ${project.master.showSlideNumber ? `<text x="${width - 64}" y="${height - 28}" text-anchor="end" fill="${project.master.bodyColour}" opacity="0.55" font-family="JetBrains Mono, monospace" font-size="18">${slideIndex + 1}</text>` : ''}`
    : '';

  const elementsMarkup = slide.elements.map(renderElementSvgString).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${bgDef}${masterOverlays}${elementsMarkup}</svg>`;
}

export async function exportSlideAsPng(slide: Slide, slideIndex: number, project: Project): Promise<void> {
  const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
  const svgMarkup = buildSlideSvgDocument(slide, slideIndex, project);
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    ctx.drawImage(img, 0, 0, width, height);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    const safeTitle = slide.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `slide-${slideIndex + 1}`;
    a.download = `${safeTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function exportProjectAsHtmlPresentation(project: Project): void {
  const { width, height } = STAGE_DIMENSIONS[project.aspectRatio];
  const slidesSvg = project.slides
    .map(
      (slide, i) => `
      <section class="slide" data-index="${i}" style="display:${i === 0 ? 'flex' : 'none'}">
        <div class="stage" style="aspect-ratio:${width}/${height};">
          ${buildSlideSvgDocument(slide, i, project)}
        </div>
      </section>
    `,
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeXml(project.name)} — SlideMotion Presentation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #05070d; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .slide { width: 100%; height: 100%; align-items: center; justify-content: center; }
    .stage { width: 100%; max-height: 100%; max-width: calc(100dvh * ${width / height}); box-shadow: 0 24px 64px rgba(0,0,0,0.6); border-radius: 8px; overflow: hidden; }
    .stage svg { width: 100%; height: 100%; display: block; }
    footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #0f172a; border-top: 1px solid #1e293b; font-size: 13px; }
    button { background: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }
    button:hover { background: #334155; }
  </style>
</head>
<body>
  <main>${slidesSvg}</main>
  <footer>
    <span>${escapeXml(project.name)}</span>
    <div style="display:flex;gap:8px;align-items:center;">
      <button id="prev">Previous</button>
      <span id="counter" style="font-variant-numeric:tabular-nums;">1 / ${project.slides.length}</span>
      <button id="next">Next</button>
      <button id="fs">Fullscreen</button>
    </div>
  </footer>
  <script>
    const slides = Array.from(document.querySelectorAll('.slide'));
    let idx = 0;
    function show(n) {
      idx = Math.max(0, Math.min(slides.length - 1, n));
      slides.forEach((s, i) => s.style.display = i === idx ? 'flex' : 'none');
      document.getElementById('counter').textContent = (idx + 1) + ' / ' + slides.length;
    }
    document.getElementById('prev').onclick = () => show(idx - 1);
    document.getElementById('next').onclick = () => show(idx + 1);
    document.getElementById('fs').onclick = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    };
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'presentation';
  a.download = `${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
