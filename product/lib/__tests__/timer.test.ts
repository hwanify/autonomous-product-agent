import {
  addTimer,
  createTimer,
  getRemainingSeconds,
  isExpired,
  markDone,
  pauseTimer,
  removeTimer,
  resumeTimer,
  tick,
  tickAll,
  updateTimer,
} from '../timer';

const T0 = 1_000_000; // 기준 시각(ms), 임의의 고정값

describe('createTimer', () => {
  it('running 상태로 생성되고 endAt 이 now + duration 이다', () => {
    const timer = createTimer('t1', '라면', 240, T0);
    expect(timer.status).toBe('running');
    expect(timer.endAt).toBe(T0 + 240_000);
    expect(timer.remainingSeconds).toBeNull();
  });
});

describe('getRemainingSeconds', () => {
  it('running 상태에서 경과 시간만큼 줄어든다', () => {
    const timer = createTimer('t1', '라면', 240, T0);
    expect(getRemainingSeconds(timer, T0)).toBe(240);
    expect(getRemainingSeconds(timer, T0 + 60_000)).toBe(180);
  });

  it('running 상태에서 종료 시각을 지나면 0 이하로 내려가지 않는다', () => {
    const timer = createTimer('t1', '라면', 10, T0);
    expect(getRemainingSeconds(timer, T0 + 999_000)).toBe(0);
  });

  it('paused 상태에서는 remainingSeconds 를 그대로 반환한다(now 와 무관)', () => {
    const timer = createTimer('t1', '라면', 240, T0);
    const paused = pauseTimer(timer, T0 + 100_000);
    expect(getRemainingSeconds(paused, T0 + 500_000)).toBe(140);
  });

  it('done 상태에서는 0 을 반환한다', () => {
    const timer = markDone(createTimer('t1', '라면', 240, T0));
    expect(getRemainingSeconds(timer, T0 + 999_000)).toBe(0);
  });
});

describe('isExpired', () => {
  it('종료 시각 이전에는 false', () => {
    const timer = createTimer('t1', '계란', 60, T0);
    expect(isExpired(timer, T0 + 59_000)).toBe(false);
  });

  it('종료 시각 이후(같은 순간 포함)에는 true', () => {
    const timer = createTimer('t1', '계란', 60, T0);
    expect(isExpired(timer, T0 + 60_000)).toBe(true);
    expect(isExpired(timer, T0 + 61_000)).toBe(true);
  });

  it('paused/done 상태는 항상 false (running 이 아니므로)', () => {
    const running = createTimer('t1', '계란', 60, T0);
    const paused = pauseTimer(running, T0 + 10_000);
    expect(isExpired(paused, T0 + 999_000)).toBe(false);
    expect(isExpired(markDone(running), T0 + 999_000)).toBe(false);
  });
});

describe('pauseTimer / resumeTimer', () => {
  it('일시정지 후 남은 시간이 정확히 보존된다', () => {
    const timer = createTimer('t1', '라면', 240, T0);
    const paused = pauseTimer(timer, T0 + 40_000); // 40초 경과, 200초 남음
    expect(paused.status).toBe('paused');
    expect(paused.remainingSeconds).toBe(200);
    expect(paused.endAt).toBeNull();
  });

  it('재개하면 일시정지 시점의 남은 시간 기준으로 새 endAt 이 계산된다', () => {
    const timer = createTimer('t1', '라면', 240, T0);
    const paused = pauseTimer(timer, T0 + 40_000); // 200초 남음
    const resumed = resumeTimer(paused, T0 + 500_000); // 한참 뒤 재개해도
    expect(resumed.status).toBe('running');
    expect(resumed.endAt).toBe(T0 + 500_000 + 200_000); // 재개 시점 + 남은시간
    expect(getRemainingSeconds(resumed, T0 + 500_000)).toBe(200);
  });

  it('여러 번 일시정지/재개를 반복해도 누적 오차 없이 남은 시간이 맞는다', () => {
    let timer = createTimer('t1', '계란', 100, T0);
    timer = pauseTimer(timer, T0 + 10_000); // 90초 남음
    timer = resumeTimer(timer, T0 + 20_000); // 재개, endAt = 20_000+90_000
    timer = pauseTimer(timer, T0 + 50_000); // 30초 경과 후 다시 일시정지 → 60초 남음
    expect(timer.remainingSeconds).toBe(60);
    timer = resumeTimer(timer, T0 + 100_000);
    expect(getRemainingSeconds(timer, T0 + 100_000)).toBe(60);
  });

  it('이미 paused 인 타이머를 다시 pauseTimer 해도 변화 없음(멱등)', () => {
    const timer = createTimer('t1', '계란', 100, T0);
    const paused = pauseTimer(timer, T0 + 10_000);
    const pausedAgain = pauseTimer(paused, T0 + 50_000);
    expect(pausedAgain).toEqual(paused);
  });

  it('이미 running 인 타이머를 resumeTimer 해도 변화 없음(멱등)', () => {
    const timer = createTimer('t1', '계란', 100, T0);
    expect(resumeTimer(timer, T0 + 50_000)).toEqual(timer);
  });

  it('done 인 타이머는 pause/resume 해도 그대로다', () => {
    const done = markDone(createTimer('t1', '계란', 100, T0));
    expect(pauseTimer(done, T0)).toEqual(done);
    expect(resumeTimer(done, T0)).toEqual(done);
  });
});

describe('markDone / tick', () => {
  it('markDone 은 상태를 done, endAt=null, remainingSeconds=0 으로 만든다', () => {
    const timer = createTimer('t1', '라면', 240, T0);
    const done = markDone(timer);
    expect(done.status).toBe('done');
    expect(done.endAt).toBeNull();
    expect(done.remainingSeconds).toBe(0);
  });

  it('tick 은 만료된 running 타이머를 done 으로 바꾼다', () => {
    const timer = createTimer('t1', '라면', 10, T0);
    const ticked = tick(timer, T0 + 10_000);
    expect(ticked.status).toBe('done');
  });

  it('tick 은 아직 안 끝난 타이머는 그대로 둔다(참조 동일성 유지)', () => {
    const timer = createTimer('t1', '라면', 10, T0);
    const ticked = tick(timer, T0 + 5_000);
    expect(ticked).toBe(timer);
  });
});

describe('list 연산 (add/remove/update/tickAll)', () => {
  it('addTimer 는 새 배열에 타이머를 추가한다(원본 불변)', () => {
    const list = [createTimer('t1', '라면', 240, T0)];
    const next = addTimer(list, createTimer('t2', '계란', 540, T0));
    expect(list).toHaveLength(1);
    expect(next).toHaveLength(2);
  });

  it('removeTimer 는 id 가 일치하는 타이머만 제거한다', () => {
    const list = [
      createTimer('t1', '라면', 240, T0),
      createTimer('t2', '계란', 540, T0),
    ];
    const next = removeTimer(list, 't1');
    expect(next.map((t) => t.id)).toEqual(['t2']);
  });

  it('updateTimer 는 id 가 일치하는 타이머만 갱신한다', () => {
    const list = [
      createTimer('t1', '라면', 240, T0),
      createTimer('t2', '계란', 540, T0),
    ];
    const next = updateTimer(list, 't1', (t) => pauseTimer(t, T0 + 10_000));
    expect(next[0].status).toBe('paused');
    expect(next[1].status).toBe('running');
  });

  it('tickAll 은 각 타이머를 독립적으로 갱신한다(여러 타이머 동시 관리)', () => {
    const list = [
      createTimer('라면', '라면', 240, T0), // 안 끝남
      createTimer('계란', '계란', 10, T0), // 끝남
    ];
    const next = tickAll(list, T0 + 10_000);
    expect(next.find((t) => t.id === '라면')?.status).toBe('running');
    expect(next.find((t) => t.id === '계란')?.status).toBe('done');
  });
});
