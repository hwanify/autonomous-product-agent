import { useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (label: string, durationSeconds: number, saveAsPreset: boolean) => void;
}

// iOS 숫자 키패드(number-pad)는 자체적으로 "완료" 키가 없어 키보드가 안 내려가는 문제가 있다.
// InputAccessoryView 로 키보드 위에 "완료" 버튼을 띄워 닫을 수 있게 한다(Android는 필요 없음).
const ACCESSORY_ID = 'newTimerModalAccessory';

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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlayBackground} onPress={() => Keyboard.dismiss()} />
        <View style={styles.sheet}>
          <Text style={styles.title}>새 타이머</Text>
          <TextInput
            style={styles.input}
            placeholder="라벨 (예: 라면)"
            value={label}
            onChangeText={setLabel}
            returnKeyType="done"
          />
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="분"
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
              inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
            />
            <Text style={styles.timeSeparator}>분</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="초"
              keyboardType="number-pad"
              value={seconds}
              onChangeText={setSeconds}
              inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
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
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <Pressable onPress={() => Keyboard.dismiss()}>
              <Text style={styles.accessoryButtonText}>완료</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  accessoryBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d1d5db',
  },
  accessoryButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
