import { BUILTIN_ANIMATION_PRESETS, SavedAnimationPreset } from '../data/assetsLibrary';
import { ElementAnimation } from '../types/presentation';

const SAVED_ANIM_PRESETS_KEY = 'slidemotion-saved-anim-presets-v1';

export function loadSavedAnimationPresets(): SavedAnimationPreset[] {
  try {
    const raw = localStorage.getItem(SAVED_ANIM_PRESETS_KEY);
    if (!raw) return BUILTIN_ANIMATION_PRESETS;
    const custom = JSON.parse(raw) as SavedAnimationPreset[];
    if (!Array.isArray(custom)) return BUILTIN_ANIMATION_PRESETS;
    const validCustom = custom.filter(
      (p) => p && typeof p.id === 'string' && typeof p.name === 'string' && Array.isArray(p.animations),
    );
    return [...validCustom, ...BUILTIN_ANIMATION_PRESETS];
  } catch {
    return BUILTIN_ANIMATION_PRESETS;
  }
}

export function saveCustomAnimationPreset(
  name: string,
  animations: ElementAnimation[],
): SavedAnimationPreset[] {
  const existingCustom = loadCustomOnlyPresets();
  const cleanName = name.trim() || 'Saved Animation Preset';
  const summary = animations.map((a) => a.effect).join(' → ');
  const newPreset: SavedAnimationPreset = {
    id: `custom-preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    description: `Saved sequence: ${summary} (${animations.length} step${animations.length === 1 ? '' : 's'})`,
    category: 'Saved',
    isCustom: true,
    createdAt: Date.now(),
    animations: animations.map(({ id: _id, order: _order, ...rest }) => ({ ...rest })),
  };
  const nextCustom = [newPreset, ...existingCustom];
  persistCustomPresets(nextCustom);
  return [...nextCustom, ...BUILTIN_ANIMATION_PRESETS];
}

export function deleteCustomAnimationPreset(presetId: string): SavedAnimationPreset[] {
  const nextCustom = loadCustomOnlyPresets().filter((p) => p.id !== presetId);
  persistCustomPresets(nextCustom);
  return [...nextCustom, ...BUILTIN_ANIMATION_PRESETS];
}

function loadCustomOnlyPresets(): SavedAnimationPreset[] {
  try {
    const raw = localStorage.getItem(SAVED_ANIM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAnimationPreset[];
    return Array.isArray(parsed) ? parsed.filter((p) => p.isCustom) : [];
  } catch {
    return [];
  }
}

function persistCustomPresets(list: SavedAnimationPreset[]): void {
  try {
    localStorage.setItem(SAVED_ANIM_PRESETS_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota errors
  }
}
