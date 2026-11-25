import { useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { openProjectFile, saveProjectFile } from '../utils/storage';

export function useKeyboardShortcuts(onNotify?: (message: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const store = useStudioStore.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveProjectFile(store.project).then((ok) => {
          if (ok && onNotify) onNotify('Project saved to file');
        });
        return;
      }

      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        void openProjectFile().then((proj) => {
          if (proj) {
            store.loadProject(proj);
            if (onNotify) onNotify(`Opened "${proj.name}"`);
          }
        });
        return;
      }

      if (isEditingInput || store.editingElementId) {
        if (e.key === 'Escape') {
          store.setEditingElement(null);
        }
        return;
      }

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        return;
      }
      if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        store.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        store.copySelected();
        return;
      }
      if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        store.pasteClipboard();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        store.duplicateSelected();
        return;
      }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        store.selectAll();
        return;
      }
      if (mod && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault();
        store.groupSelected();
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        store.ungroupSelected();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedElementIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
        return;
      }

      if (e.key === 'Escape') {
        store.clearSelection();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && store.selectedElementIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const slide = store.project.slides.find((s) => s.id === store.activeSlideId);
        if (!slide) return;
        const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
        const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;
        const updates = slide.elements
          .filter((el) => store.selectedElementIds.includes(el.id) && !el.locked)
          .map((el) => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } }));
        if (updates.length > 0) {
          store.updateElementsBatch(updates, true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNotify]);
}
