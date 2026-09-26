jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

import * as Notifications from 'expo-notifications';
import {
  cancelTimerNotification,
  configureNotificationHandler,
  ensureNotificationPermission,
  scheduleTimerNotification,
} from '../notifications';

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('configureNotificationHandler', () => {
  it('setNotificationHandler 를 소리+배너를 켜는 핸들러로 등록한다', async () => {
    configureNotificationHandler();
    expect(mockedNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const handlerArg = mockedNotifications.setNotificationHandler.mock.calls[0][0];
    const result = await handlerArg!.handleNotification({} as any);
    expect(result).toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });
});

describe('ensureNotificationPermission', () => {
  it('이미 허용된 경우 요청 없이 true 를 반환한다', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    const granted = await ensureNotificationPermission();
    expect(granted).toBe(true);
    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('허용 안 된 경우 요청하고, 사용자가 허용하면 true 를 반환한다', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    const granted = await ensureNotificationPermission();
    expect(granted).toBe(true);
    expect(mockedNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('사용자가 거부하면 false 를 반환한다', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    const granted = await ensureNotificationPermission();
    expect(granted).toBe(false);
  });
});

describe('scheduleTimerNotification', () => {
  it('올바른 제목/본문과 TIME_INTERVAL 트리거로 예약을 호출한다', async () => {
    mockedNotifications.scheduleNotificationAsync.mockResolvedValue('notif-1');
    const id = await scheduleTimerNotification('라면', 240);
    expect(id).toBe('notif-1');
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: '타이머 종료',
        body: '라면 타이머가 끝났습니다!',
        sound: true,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 240,
        repeats: false,
      },
    });
  });

  it('repeats 는 항상 false 다 (한 번만 울려야 하는 타이머 알림)', async () => {
    mockedNotifications.scheduleNotificationAsync.mockResolvedValue('notif-2');
    await scheduleTimerNotification('계란', 540);
    const call = mockedNotifications.scheduleNotificationAsync.mock.calls[0][0];
    expect((call.trigger as any).repeats).toBe(false);
  });
});

describe('cancelTimerNotification', () => {
  it('주어진 id 로 cancelScheduledNotificationAsync 를 호출한다', async () => {
    await cancelTimerNotification('notif-1');
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-1');
  });
});
