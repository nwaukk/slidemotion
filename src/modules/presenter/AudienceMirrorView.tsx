import React, { useEffect, useMemo, useState } from 'react';
import { AnimatedElementWrapper } from '../../components/AnimatedElementWrapper';
import { STAGE_DIMENSIONS } from '../../data/themes';
import { buildSlideTimeline } from '../../engine/animationEngine';
import { bgToCss, getEffectiveSlideBg } from '../../engine/transitionEngine';
import { AudienceSyncPayload } from '../../types/electron';

export const AudienceMirrorView: React.FC = () => {
  const [payload, setPayload] = useState<AudienceSyncPayload | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const api = window.desktop ?? window.electronAPI;
    if (!api) return;
    return api.onAudienceSync((nextPayload) => {
      setPayload(nextPayload);
    });
  }, []);

  const timeline = useMemo(
    () => (payload ? buildSlideTimeline(payload.slide.elements) : { items: [], totalDuration: 0 }),
    [payload],
  );

  if (!payload || payload.blackout) {
    return <div className="fixed inset-0 bg-black" aria-label="Audience display waiting" />;
  }

  const dims = STAGE_DIMENSIONS[payload.aspectRatio];
  const scale = Math.min(viewport.w / dims.width, viewport.h / dims.height);
  const bg = getEffectiveSlideBg(payload.slide, payload.master);
  const hasAnimations = timeline.items.length > 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      <div
        className="relative overflow-hidden"
        style={{
          width: dims.width * scale,
          height: dims.height * scale,
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: dims.width,
            height: dims.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: bgToCss(bg),
          }}
        >
          {payload.slide.useMaster && payload.master.showAccentBar && (
            <div
              className="absolute left-0 right-0 top-0 h-2"
              style={{ backgroundColor: payload.master.accentColour }}
            />
          )}

          {payload.slide.elements.map((el) => {
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
                <AnimatedElementWrapper
                  element={el}
                  scheduledItems={timeline.items}
                  currentTime={payload.animTime}
                  isPlayingOrPreviewing={hasAnimations}
                  reduceMotion={payload.reduceMotion}
                />
              </div>
            );
          })}

          {payload.slide.useMaster && payload.master.showFooter && (
            <div
              className="absolute bottom-7 left-16 text-lg opacity-55"
              style={{
                color: payload.master.bodyColour,
                fontFamily: payload.master.bodyFont,
              }}
            >
              {payload.master.footerText}
            </div>
          )}

          {payload.slide.useMaster && payload.master.showSlideNumber && (
            <div
              className="font-mono-tabular absolute bottom-7 right-16 text-lg opacity-55"
              style={{ color: payload.master.bodyColour }}
            >
              {payload.slideIndex + 1}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
