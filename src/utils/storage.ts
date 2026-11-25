import { AppSettings, Project } from '../types/presentation';

const DB_NAME = 'slidemotion-studio-db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const ACTIVE_PROJECT_KEY = 'active-project';
const SETTINGS_KEY = 'slidemotion-settings-v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToIndexedDB(project: Project): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.put(project, ACTIVE_PROJECT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem('slidemotion-project-fallback', JSON.stringify(project));
    } catch {
      // Storage quota exceeded or restricted
    }
  }
}

export async function loadProjectFromIndexedDB(): Promise<Project | null> {
  try {
    const db = await openDB();
    const result = await new Promise<Project | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(ACTIVE_PROJECT_KEY);
      req.onsuccess = () => resolve(req.result as Project | undefined);
      req.onerror = () => reject(req.error);
    });
    if (result && Array.isArray(result.slides) && result.slides.length > 0) {
      return result;
    }
  } catch {
    // Fall through to localStorage fallback
  }

  try {
    const raw = localStorage.getItem('slidemotion-project-fallback');
    if (raw) {
      const parsed = JSON.parse(raw) as Project;
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse failure
  }

  return null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accent: 'sapphire',
  textSize: 'medium',
  density: 'comfortable',
  panelLayout: 'default',
  reduceMotion: false,
  showGrid: false,
  snapToGrid: true,
  snapToGuides: true,
  showRulers: true,
  gridSize: 40,
  showLearnDock: false,
  panels: {
    designerSlides: true,
    designerInsert: true,
    designerAssets: true,
    designerProperties: true,
    designerTimeline: true,
    labLeft: true,
    labRight: true,
  },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      panels: {
        ...DEFAULT_SETTINGS.panels,
        ...(parsed.panels ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage restriction
  }
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: FilePickerAcceptType[];
}

interface FileSystemWritable {
  write: (data: Blob | string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileSystemFileHandle {
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritable>;
}

export async function saveProjectFile(project: Project): Promise<boolean> {
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'presentation';
  const fileName = `${safeName}.slidemotion.json`;
  const payload = JSON.stringify(project, null, 2);

  const desktopBridge = window.desktop ?? window.electronAPI;
  if (desktopBridge?.saveProjectDialog) {
    return desktopBridge.saveProjectDialog(fileName, payload);
  }

  const win = window as unknown as {
    showSaveFilePicker?: (opts: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  };

  if (typeof win.showSaveFilePicker === 'function') {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'SlideMotion Project (.json)',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(payload);
      await writable.close();
      return true;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return false;
      // Fallback to browser download if picker blocked by iframe sandbox
    }
  }

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export async function openProjectFile(): Promise<Project | null> {
  const desktopBridge = window.desktop ?? window.electronAPI;
  if (desktopBridge?.openProjectDialog) {
    const fileRes = await desktopBridge.openProjectDialog();
    if (!fileRes) return null;
    try {
      return validateImportedProject(JSON.parse(fileRes.content));
    } catch {
      return null;
    }
  }

  const win = window as unknown as {
    showOpenFilePicker?: (opts: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
  };

  if (typeof win.showOpenFilePicker === 'function') {
    try {
      const [handle] = await win.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'SlideMotion Project (.json)',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      if (!handle) return null;
      const file = await handle.getFile();
      const text = await file.text();
      return validateImportedProject(JSON.parse(text));
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return null;
      // Fall through to <input type="file">
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(validateImportedProject(JSON.parse(text)));
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

function validateImportedProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Project;
  if (!Array.isArray(candidate.slides) || candidate.slides.length === 0) return null;
  return {
    ...candidate,
    updatedAt: Date.now(),
  };
}
