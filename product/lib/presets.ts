import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerPreset {
  id: string;
  label: string;
  durationSeconds: number;
}

const STORAGE_KEY = 'timer_presets_v1';

export function addPreset(list: TimerPreset[], preset: TimerPreset): TimerPreset[] {
  return [...list, preset];
}

export function removePreset(list: TimerPreset[], id: string): TimerPreset[] {
  return list.filter((p) => p.id !== id);
}

export async function loadPresets(): Promise<TimerPreset[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePresets(list: TimerPreset[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
