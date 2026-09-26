import { useEffect, useRef, useState } from 'react';
import { AppState, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import TimerCard from '../components/TimerCard';
import NewTimerModal from '../components/NewTimerModal';
import PresetList from '../components/PresetList';
import {
  addTimer,
  createTimer,
  pauseTimer,
  removeTimer,
  resumeTimer,
  tickAll,
  updateTimer,
  type CookTimer,
} from '../lib/timer';
import {
  cancelTimerNotification,
  configureNotificationHandler,
  ensureNotificationPermission,
  scheduleTimerNotification,
} from '../lib/notifications';
import {
  addPreset,
  loadPresets,
  removePreset,
  savePresets,
  type TimerPreset,
} from '../lib/presets';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Home() {
  const [timers, setTimers] = useState<CookTimer[]>([]);
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [now, setNow] = useState(Date.now());
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  // 타이머 id → 예약된 알림 id. 일시정지/재개/취소 시 기존 예약을 취소하고 다시 걸어야 하므로
  // (한 번 예약한 알림은 시간이 고정돼 있어 일시정지해도 저절로 늦춰지지 않는다) 별도로 추적한다.
  const notificationIdsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    configureNotificationHandler();
    ensureNotificationPermission().then(setPermissionGranted);
    loadPresets().then(setPresets);

    // H3: 앱이 백그라운드/Settings 에 갔다가 포그라운드로 돌아올 때 권한 상태가
    // 바뀌었을 수 있으므로(예: 사용자가 설정에서 알림을 켬) 다시 확인한다.
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        ensureNotificationPermission().then(setPermissionGranted);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      setTimers((list) => tickAll(list, current));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function startTimer(label: string, durationSeconds: number) {
    if (!permissionGranted) {
      Alert.alert('알림 권한이 없습니다', '설정에서 알림 권한을 허용해주세요.');
      return;
    }
    const id = generateId();
    const timer = createTimer(id, label, durationSeconds, Date.now());
    setTimers((list) => addTimer(list, timer));
    const notificationId = await scheduleTimerNotification(label, durationSeconds);
    notificationIdsRef.current[id] = notificationId;
  }

  async function handleCreate(label: string, durationSeconds: number, saveAsPreset: boolean) {
    await startTimer(label, durationSeconds);
    if (saveAsPreset) {
      const preset: TimerPreset = { id: generateId(), label, durationSeconds };
      const next = addPreset(presets, preset);
      setPresets(next);
      await savePresets(next);
    }
  }

  async function handleStartPreset(preset: TimerPreset) {
    await startTimer(preset.label, preset.durationSeconds);
  }

  async function handleDeletePreset(id: string) {
    const next = removePreset(presets, id);
    setPresets(next);
    await savePresets(next);
  }

  async function handlePause(id: string) {
    setTimers((list) => updateTimer(list, id, (t) => pauseTimer(t, Date.now())));
    const notificationId = notificationIdsRef.current[id];
    if (notificationId) {
      await cancelTimerNotification(notificationId);
      delete notificationIdsRef.current[id];
    }
  }

  async function handleResume(id: string) {
    const target = timers.find((t) => t.id === id);
    if (!target || target.status !== 'paused') return;
    const resumed = resumeTimer(target, Date.now());
    setTimers((list) => updateTimer(list, id, () => resumed));
    const notificationId = await scheduleTimerNotification(resumed.label, target.remainingSeconds ?? 0);
    notificationIdsRef.current[id] = notificationId;
  }

  async function handleCancel(id: string) {
    setTimers((list) => removeTimer(list, id));
    const notificationId = notificationIdsRef.current[id];
    if (notificationId) {
      await cancelTimerNotification(notificationId);
      delete notificationIdsRef.current[id];
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>요리용 멀티 타이머</Text>
      <PresetList presets={presets} onStart={handleStartPreset} onDelete={handleDeletePreset} />
      {timers.length === 0 ? (
        <Text style={styles.empty}>아직 실행 중인 타이머가 없습니다.</Text>
      ) : (
        <FlatList
          data={timers}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TimerCard
              timer={item}
              now={now}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
            />
          )}
          style={styles.list}
        />
      )}
      <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ 새 타이머</Text>
      </Pressable>
      <NewTimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
