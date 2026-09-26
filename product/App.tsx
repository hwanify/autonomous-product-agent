import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  configureNotificationHandler,
  ensureNotificationPermission,
  scheduleTimerNotification,
} from './lib/notifications';

// 검증 데모(T-007/T-008): 앱이 백그라운드거나 완전히 종료된 상태에서도
// 예약된 로컬 알림이 소리+배너로 실제로 울리는지 Expo Go 실기기에서 확인하기 위한 화면.
// 이 검증이 이 제품 선정의 핵심 전제다 (docs/decisions.md D-007/D-009 참조).

configureNotificationHandler();

const DELAYS_SECONDS = [10, 30, 60];

export default function App() {
  const [permissionStatus, setPermissionStatus] = useState<string>('확인 중...');
  const [lastScheduledAt, setLastScheduledAt] = useState<string | null>(null);

  useEffect(() => {
    ensureNotificationPermission().then((granted) => {
      setPermissionStatus(granted ? '허용됨' : '거부됨');
    });
  }, []);

  async function scheduleDemo(seconds: number) {
    if (permissionStatus !== '허용됨') {
      Alert.alert('알림 권한이 없습니다', '설정에서 알림 권한을 허용해주세요.');
      return;
    }
    await scheduleTimerNotification(`${seconds}초 데모`, seconds);
    const fireTime = new Date(Date.now() + seconds * 1000).toLocaleTimeString('ko-KR');
    setLastScheduledAt(`${seconds}초 뒤 (약 ${fireTime}) 알림 예약됨`);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>알림 신뢰성 검증 데모</Text>
      <Text style={styles.desc}>
        아래 버튼을 눌러 알림을 예약한 뒤, 화면을 끄거나 앱을 완전히 종료(스와이프)하고
        기다려서 소리+배너 알림이 오는지 확인하세요.
      </Text>
      <Text style={styles.status}>알림 권한: {permissionStatus}</Text>
      <View style={styles.buttonRow}>
        {DELAYS_SECONDS.map((s) => (
          <Pressable key={s} style={styles.button} onPress={() => scheduleDemo(s)}>
            <Text style={styles.buttonText}>{s}초 뒤 알림</Text>
          </Pressable>
        ))}
      </View>
      {lastScheduledAt ? <Text style={styles.result}>{lastScheduledAt}</Text> : null}
      <Text style={styles.platform}>Platform: {Platform.OS}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  desc: {
    textAlign: 'center',
    color: '#555',
  },
  status: {
    fontSize: 14,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  result: {
    marginTop: 8,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
  platform: {
    marginTop: 24,
    color: '#999',
    fontSize: 12,
  },
});
