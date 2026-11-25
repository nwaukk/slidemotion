import React from 'react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';

interface LabPanelTogglesProps {
  leftLabel?: string;
  rightLabel?: string;
}

export const LabPanelToggles: React.FC<LabPanelTogglesProps> = ({
  leftLabel = 'Left Panel',
  rightLabel = 'Right Panel',
}) => {
  const panels = useStudioStore((s) => s.settings.panels);
  const updateSettings = useStudioStore((s) => s.updateSettings);

  const toggleLeft = () =>
    updateSettings({
      panels: { ...panels, labLeft: !panels.labLeft },
    });

  const toggleRight = () =>
    updateSettings({
      panels: { ...panels, labRight: !panels.labRight },
    });

  return (
    <div className="hidden lg:inline-flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={toggleLeft}
        aria-pressed={panels.labLeft}
        title={panels.labLeft ? `Collapse ${leftLabel}` : `Show ${leftLabel}`}
        className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2 text-[11px] font-medium transition-colors ${
          panels.labLeft
            ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
            : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        {panels.labLeft ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
        <span className="hidden xl:inline">{leftLabel}</span>
      </button>

      <button
        type="button"
        onClick={toggleRight}
        aria-pressed={panels.labRight}
        title={panels.labRight ? `Collapse ${rightLabel}` : `Show ${rightLabel}`}
        className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2 text-[11px] font-medium transition-colors ${
          panels.labRight
            ? 'border-[var(--accent-500)]/45 bg-[var(--accent-soft)] text-[var(--accent-500)]'
            : 'border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        {panels.labRight ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
        <span className="hidden xl:inline">{rightLabel}</span>
      </button>
    </div>
  );
};
