export type TimerStatus = 'running' | 'paused' | 'done';

export interface CookTimer {
  id: string;
  label: string;
  durationSeconds: number;
  status: TimerStatus;
  /** running 상태일 때만 값이 있음: 이 timestamp(ms)에 종료된다. */
  endAt: number | null;
  /** paused/done 상태일 때만 값이 있음: 남은 시간(초). */
  remainingSeconds: number | null;
}

export function createTimer(
  id: string,
  label: string,
  durationSeconds: number,
  now: number
): CookTimer {
  return {
    id,
    label,
    durationSeconds,
    status: 'running',
    endAt: now + durationSeconds * 1000,
    remainingSeconds: null,
  };
}

export function getRemainingSeconds(timer: CookTimer, now: number): number {
  if (timer.status === 'running') {
    if (timer.endAt === null) return 0;
    return Math.max(0, Math.ceil((timer.endAt - now) / 1000));
  }
  return timer.remainingSeconds ?? 0;
}

export function isExpired(timer: CookTimer, now: number): boolean {
  return timer.status === 'running' && timer.endAt !== null && now >= timer.endAt;
}

export function pauseTimer(timer: CookTimer, now: number): CookTimer {
  if (timer.status !== 'running') return timer;
  return {
    ...timer,
    status: 'paused',
    endAt: null,
    remainingSeconds: getRemainingSeconds(timer, now),
  };
}

export function resumeTimer(timer: CookTimer, now: number): CookTimer {
  if (timer.status !== 'paused') return timer;
  return {
    ...timer,
    status: 'running',
    endAt: now + (timer.remainingSeconds ?? 0) * 1000,
    remainingSeconds: null,
  };
}

export function markDone(timer: CookTimer): CookTimer {
  if (timer.status === 'done') return timer;
  return { ...timer, status: 'done', endAt: null, remainingSeconds: 0 };
}

/** running 상태인 타이머가 만료됐으면 done 으로 전이시킨다 (UI 폴링 루프에서 매초 호출). */
export function tick(timer: CookTimer, now: number): CookTimer {
  return isExpired(timer, now) ? markDone(timer) : timer;
}

export function addTimer(list: CookTimer[], timer: CookTimer): CookTimer[] {
  return [...list, timer];
}

export function removeTimer(list: CookTimer[], id: string): CookTimer[] {
  return list.filter((t) => t.id !== id);
}

export function updateTimer(
  list: CookTimer[],
  id: string,
  updater: (timer: CookTimer) => CookTimer
): CookTimer[] {
  return list.map((t) => (t.id === id ? updater(t) : t));
}

export function tickAll(list: CookTimer[], now: number): CookTimer[] {
  return list.map((t) => tick(t, now));
}
