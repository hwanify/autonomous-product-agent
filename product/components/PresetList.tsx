import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TimerPreset } from '../lib/presets';

interface Props {
  presets: TimerPreset[];
  onStart: (preset: TimerPreset) => void;
  onDelete: (id: string) => void;
}

export default function PresetList({ presets, onStart, onDelete }: Props) {
  if (presets.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>프리셋</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {presets.map((preset) => (
          <Pressable key={preset.id} style={styles.chip} onPress={() => onStart(preset)}>
            <Text style={styles.chipLabel}>{preset.label}</Text>
            <Text style={styles.chipTime}>
              {Math.floor(preset.durationSeconds / 60)}분 {preset.durationSeconds % 60}초
            </Text>
            <Pressable style={styles.deleteButton} onPress={() => onDelete(preset.id)}>
              <Text style={styles.deleteButtonText}>×</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  row: {
    gap: 10,
  },
  chip: {
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 88,
  },
  chipLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  chipTime: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
  },
});
