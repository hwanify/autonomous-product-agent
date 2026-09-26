import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (label: string, durationSeconds: number, saveAsPreset: boolean) => void;
}

export default function NewTimerModal({ visible, onClose, onCreate }: Props) {
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [saveAsPreset, setSaveAsPreset] = useState(false);

  function reset() {
    setLabel('');
    setMinutes('');
    setSeconds('');
    setSaveAsPreset(false);
  }

  function handleStart() {
    const totalSeconds = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
    if (!label.trim() || totalSeconds <= 0) return;
    onCreate(label.trim(), totalSeconds, saveAsPreset);
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>새 타이머</Text>
          <TextInput
            style={styles.input}
            placeholder="라벨 (예: 라면)"
            value={label}
            onChangeText={setLabel}
          />
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="분"
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
            />
            <Text style={styles.timeSeparator}>분</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="초"
              keyboardType="number-pad"
              value={seconds}
              onChangeText={setSeconds}
            />
            <Text style={styles.timeSeparator}>초</Text>
          </View>
          <View style={styles.presetRow}>
            <Text style={styles.presetLabel}>프리셋으로 저장</Text>
            <Switch value={saveAsPreset} onValueChange={setSaveAsPreset} />
          </View>
          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.buttonText}>취소</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleStart}>
              <Text style={styles.buttonText}>시작</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 16,
    color: '#555',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  presetLabel: {
    fontSize: 15,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
