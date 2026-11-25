import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface LearnDockPanelProps {
  onClose?: () => void;
}

const DESIGN_LESSONS = [
  {
    title: '01. Visual Hierarchy & Contrast',
    body: 'A viewer reads the largest, highest-contrast item first. Make headlines at least twice the size of body text and keep backgrounds quiet.',
    tip: 'Use 60% clean background, 30% supporting surfaces, and 10% accent colour.',
  },
  {
    title: '02. Naming Layers for Morph (!!)',
    body: 'Morph transitions match elements across slides by their exact layer name. Starting a name with two exclamation marks (for example, !!HeroCircle) guarantees a smooth match even if the shape or text changes.',
    tip: 'Open the Layers tab and double-click any layer name to edit it.',
  },
  {
    title: '03. Smart Guides & Alignment',
    body: 'Invisible alignment lines turn scattered elements into an intentional grid. Align left edges for text blocks and distribute cards evenly.',
    tip: 'Hold Shift while dragging or pressing arrow keys to nudge by 10 virtual pixels.',
  },
  {
    title: '04. Whitespace as a Tool',
    body: 'Empty space is not wasted space—it separates ideas and lowers cognitive load so your audience listens to you instead of reading dense blocks.',
    tip: 'Keep at least 7% margin around the outer edge of every 16:9 slide.',
  },
];

export const LearnDockPanel: React.FC<LearnDockPanelProps> = ({ onClose }) => {
  return (
    <aside
      aria-label="Learn panel"
      className="flex h-full flex-col bg-[var(--bg-panel)] text-[var(--text-primary)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--accent-500)]" />
          <h2 className="font-display text-xs font-semibold">Design Companion</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Learn panel"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-panel-elevated)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3.5 space-y-4">
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Keep this guide docked beside the stage while designing to practise professional layout habits.
        </p>

        {DESIGN_LESSONS.map((lesson) => (
          <article
            key={lesson.title}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-elevated)] p-3.5 space-y-2"
          >
            <h3 className="font-display text-xs font-semibold text-[var(--text-primary)]">{lesson.title}</h3>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{lesson.body}</p>
            <p className="border-t border-[var(--border-subtle)] pt-2 text-[11px] font-medium text-[var(--accent-500)]">
              Pro tip: {lesson.tip}
            </p>
          </article>
        ))}
      </div>
    </aside>
  );
};
