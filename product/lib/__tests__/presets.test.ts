jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addPreset, loadPresets, removePreset, savePresets, type TimerPreset } from '../presets';

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addPreset / removePreset (순수 함수)', () => {
  const ramyeon: TimerPreset = { id: 'p1', label: '라면', durationSeconds: 240 };
  const egg: TimerPreset = { id: 'p2', label: '계란', durationSeconds: 540 };

  it('addPreset 은 새 배열에 프리셋을 추가한다(원본 불변)', () => {
    const list = [ramyeon];
    const next = addPreset(list, egg);
    expect(list).toHaveLength(1);
    expect(next).toEqual([ramyeon, egg]);
  });

  it('removePreset 은 id 가 일치하는 프리셋만 제거한다', () => {
    const list = [ramyeon, egg];
    const next = removePreset(list, 'p1');
    expect(next).toEqual([egg]);
  });
});

describe('loadPresets', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    const result = await loadPresets();
    expect(result).toEqual([]);
    expect(mockedStorage.getItem).toHaveBeenCalledWith('timer_presets_v1');
  });

  it('저장된 JSON 배열을 파싱해서 반환한다', async () => {
    const stored: TimerPreset[] = [{ id: 'p1', label: '라면', durationSeconds: 240 }];
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const result = await loadPresets();
    expect(result).toEqual(stored);
  });

  it('손상된 JSON 이면 빈 배열을 반환한다(예외를 던지지 않음)', async () => {
    mockedStorage.getItem.mockResolvedValue('{this is not valid json');
    const result = await loadPresets();
    expect(result).toEqual([]);
  });

  it('배열이 아닌 JSON(예: 객체)이 저장돼 있으면 빈 배열을 반환한다', async () => {
    mockedStorage.getItem.mockResolvedValue(JSON.stringify({ not: 'an array' }));
    const result = await loadPresets();
    expect(result).toEqual([]);
  });
});

describe('savePresets', () => {
  it('리스트를 JSON 문자열로 직렬화해 저장한다', async () => {
    const list: TimerPreset[] = [{ id: 'p1', label: '라면', durationSeconds: 240 }];
    await savePresets(list);
    expect(mockedStorage.setItem).toHaveBeenCalledWith('timer_presets_v1', JSON.stringify(list));
  });
});
