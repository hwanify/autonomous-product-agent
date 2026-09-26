import * as Notifications from 'expo-notifications';

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

/**
 * 타이머 종료 알림을 예약한다. `id`(호출 측 UNNotificationRequest 식별자)를 반환값으로 받아
 * 타이머가 취소/일시정지될 때 cancelTimerNotification 에 넘겨야 한다.
 */
export async function scheduleTimerNotification(label: string, seconds: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '타이머 종료',
      body: `${label} 타이머가 끝났습니다!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function cancelTimerNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
