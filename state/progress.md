# Progress Log

Agent가 매 실행마다 아래에 새 항목을 **추가**합니다 (기존 항목은 수정/삭제하지 않음).

형식:

```
## Run #<번호> — <YYYY-MM-DD HH:MM UTC> — phase: <phase>
- 작업: <task id> <제목>
- 결과: done | partial | blocked
- 한 일: ...
- 산출물: <파일 경로들>
- 다음 할 일: ...
```

---

## Run #0 — 초기 설정 — phase: discover
- 작업: 자율 제품 개발 에이전트 하네스 구축
- 결과: done
- 한 일: CLAUDE.md, mission.md, state/, agent/, .github/workflows/ 생성
- 다음 할 일: T-001 아이디어 발굴 (첫 실행)

## Run #1 — 2026-09-26 00:31 UTC — phase: discover
- 작업: T-001 mission.md 기준 제품 아이디어 후보 5~10개 발굴 및 1차 점수화
- 결과: done
- 한 일: 8개 후보(요리용 멀티 타이머, 커스텀 인터벌 운동 타이머, 더치페이 정산기, 레시피 단위 변환기, 약 복용 리마인더, 독서 페이스 계산기, 습관 트래커, 감정 일기)를 mission.md §4 기준(Pain/Gap/Feasibility/Demonstrability/Differentiation)으로 1차 점수화. 이 시점 점수는 경쟁 조사 이전 가설임을 명시. 18점 이상 & Feasibility≥4 통과한 3개(요리용 멀티 타이머 20점, 인터벌 운동 타이머 20점, 더치페이 정산기 19점)를 research 대상으로 선정. discover phase에는 Critic 게이트가 적용되지 않아(결론=선정/기각/설계확정/심각도판정 아님) 호출하지 않음.
- 산출물: docs/ideas/ideas-1.md
- 다음 할 일: T-002 multi-timer 경쟁 제품 조사 (WebSearch/WebFetch) → docs/research/multi-timer.md

## Run #2 — 2026-09-26 00:36 UTC — phase: research
- 작업: T-002 multi-timer(요리용 멀티 타이머) 경쟁 제품 조사
- 결과: done
- 한 일: WebSearch로 App Store 유사 앱 6개(About Timers, Multi Kitchen & Cooking Timer, Multi Timer: Kitchen Timer, MultiTimer: Multiple timers, All the Timers, Time Timer) 조사. 가격/기능/리뷰 불만 정리. 핵심 발견: (1) 직접 경쟁 앱 중 하나(Multi Kitchen & Cooking Timer)가 "소리 없이 배너만 깜빡임"이라는 치명적 알림 버그로 "쓸모없다"는 혹평을 받고 있어, 확실한 알림이 차별점이 될 수 있음. (2) 반대로 "완전 무료·광고 없음"은 이미 MultiTimer, Multi Timer: Utility 등이 선점하고 있어 ideas-1.md 의 Gap 4점은 과대평가였을 가능성이 있음 (validate 단계에서 재평가 필요). research phase 완료조건(후보별 분석)은 아직 T-003, T-004 가 남아 phase 는 research 유지.
- 산출물: docs/research/multi-timer.md
- 다음 할 일: T-003 interval-timer 경쟁 제품 조사

## Run #3 — 2026-09-26 00:58 UTC — phase: explore
- 작업: T-003 interval-timer(커스텀 인터벌 운동 타이머) 경쟁 조사 → 재점수·판정 (explore 통합 단계)
- 결과: done
- 한 일: WebSearch로 App Store 유사 앱 9개 이상 조사(Tabata Pro, Tabata Timer 계열, Intervals Pro, Seconds, Workout Timer Custom Intervals, Interval Timer X, GymPulseTimer 등). 핵심 발견: "무료로 커스텀 인터벌 시퀀스 무제한 저장"이라는 애초 Gap 가설이 이미 최소 2개 앱에 의해 충족되고 있어, 재점수 결과 15점(기준 18점 미달)으로 **기각** 결론. Step 3.5 Critic 게이트(독립 subagent, mission.md+산출물만 제공)를 호출해 PASS 판정 확인 — Critic은 조사가 얕다는 점과 Pain/Gap 채점 방법론 혼선을 지적했으나, 민감도 분석상 결론(기각) 자체는 견고하다고 판정. interval-timer 후보를 최종 기각하고 다음 후보로 진행.
- 산출물: docs/research/interval-timer.md, docs/validation/interval-timer.md
- 다음 할 일: T-005(multi-timer 재점수·판정, 기존 조사 활용) 또는 T-004(split-bill 조사) 진행 — backlog 우선순위상 T-005 먼저

## Run #4 — 2026-09-26 01:03 UTC — phase: explore
- 작업: T-005 multi-timer(요리용 멀티 타이머) 기존 조사 근거로 재점수·판정
- 결과: partial (Critic REWORK)
- 한 일: 기존 docs/research/multi-timer.md 를 재검토해 재점수(Pain4/Gap2/Feasibility5/Demonstrability5/Differentiation2=18점, 기준 통과)하고, Gap·Differentiation 부족을 근거로 docs/validation/multi-timer.md 에서 기각(REJECT) 제안. Step 3.5 Critic 게이트 호출 결과 **REWORK** — 부재 증거(경쟁자 MultiTimer 가 알림 문제 없다는 걸 실제로 확인 안 함)로 결론 내렸고, research.md 가 이미 발견한 "조리 프리셋 라이브러리" 대안 스코프를 저비용으로 재점수해볼 수 있었는데 시도하지 않았다는 지적. 프로토콜대로 결론을 확정하지 않고 current_task 를 in_progress 로 유지, notes 에 다음 실행이 보완할 두 가지(타겟 WebSearch, 조리 프리셋 스코프 재점수)를 기록.
- 산출물: docs/validation/multi-timer.md (초안, 미확정)
- 다음 할 일: T-005 보완 — (a) MultiTimer 알림 신뢰성 타겟 검색, (b) 조리 프리셋 스코프 재점수 → Critic 재통과 시도

## Run #5 — 2026-09-26 02:03 UTC — phase: explore (RECOVERY) → design
- 작업: T-005 multi-timer 재점수·판정 보완 (Critic REWORK 2회 → 최종 PASS)
- 결과: done
- 한 일: (1) MultiTimer Help Center 트러블슈팅 문서 확인, 계란 타이머류 6개+ 확인 → 재점수 17점(기각)으로 갱신했으나 Critic 2차 REWORK("엉뚱한 경쟁자에 근거 전이", "OS 제약 과잉일반화는 근거 없는 비관"). (2) 지적을 인정하고 iOS 로컬 예약 알림의 실제 OS 레벨 동작 방식을 재조사, expo-notifications 관련 이슈들이 "알림 표시"가 아니라 "탭 후 콜백 실행" 문제였음을 확인 → 재점수 20점(선정)으로 결론을 뒤집음. (3) Critic 3차 PASS — 단, "Expo Go 환경(네이티브 아님)에서 실제 검증 필요", "경쟁앱 무음 버그 자체는 여전히 유효한 수요 신호", "차별점이 단일 축이라 리스크 있음" 세 가지를 design/implement 단계에 반영하라는 조건부.
- Critic 판정 이력: REWORK(1차) → REWORK(2차) → **PASS(3차)**. 세 번의 코멘트 모두 state/decisions.md D-005~D-007 에 원문 인용으로 기록.
- 결정: **multi-timer(요리용 멀티 타이머) 선정.** phase `explore` → `design` 전이. 남은 explore 후보(T-004, split-bill)는 보류.
- 산출물: docs/research/multi-timer.md(갱신), docs/validation/multi-timer.md(최종)
- 다음 할 일: design 단계 — docs/design/mvp.md 작성. **반드시 첫 구현 작업으로 "Expo Go 실기기에서 앱 종료/백그라운드 상태에서도 예약 로컬 알림이 소리+배너로 울리는지" 검증을 포함할 것** (실패 시 즉시 pivot 조건부 선정이었음, D-007 참조).

## Run #6 — 2026-09-26 02:13 UTC — phase: design → implement
- 작업: T-006 docs/design/mvp.md 작성 (MVP 범위, 시나리오, 화면흐름, 기술구조, 테스트계획, 구현작업 분해)
- 결과: done
- 한 일: multi-timer 선정 근거를 바탕으로 MVP 설계 1차 작성 → Critic 1차 REWORK("에이전트는 아이폰이 없어 실기기 검증을 사람에게 넘기는 hand-off 절차가 빠짐", "검증 작업이 4개를 한 덩어리로 과하게 묶임"). 지적 반영해 T-007(에이전트가 끝까지 할 구현: Expo 프로젝트 초기화+알림 데모)과 T-008(사람 hand-off 검증 게이트: current_task blocked 전환 + state/inbox.md 회신 대기 절차 명시)로 분리, T-009~T-013 으로 나머지 작업 재배치 → Critic 2차 **PASS**(유의사항: T-012 크기, feasibility 재확인 필요 — 이미 mvp.md §7 에 축소 후보 명시됨). Critic 판정 이력과 원문 코멘트는 state/decisions.md D-008/D-009 에 기록.
- 결정: MVP 설계 확정. phase `design` → `implement` 전이. backlog 를 T-007~T-013(phase: implement)로 교체.
- 산출물: docs/design/mvp.md
- 다음 할 일: T-007 — `product/` 에 Expo 프로젝트 초기화 + expo-notifications 설치·권한 요청 + 알림 예약 데모 코드 작성. 그 다음 T-008(사람에게 실기기 검증 요청, blocked 전환)이 이어짐.

## Run #7 — 2026-09-26 03:03 UTC — phase: implement
- 작업: T-007 product/ 에 Expo 프로젝트 초기화 + expo-notifications 설치 + 알림 권한 요청/예약 데모 코드 작성
- 결과: done
- 한 일: `npx create-expo-app@latest . --template blank-typescript` 로 `product/` 에 Expo SDK 57(managed workflow, TypeScript) 프로젝트 생성. `npx expo install expo-notifications` 이 컨테이너 네트워크 정책으로 실패(호환성 체크 API 차단, "HTTP Proxy Network Error: Forbidden")해서 `npm install expo-notifications` 로 직접 설치 후 버전(`^57.0.21`)이 SDK 57 과 맞는지 수동 확인(D-010). WebSearch로 로컬 알림이 Expo Go 에서 동작한다는 사실과 `scheduleNotificationAsync` 의 최신 트리거 API 형태(`SchedulableTriggerInputTypes.TIME_INTERVAL`)를 확인(docs.expo.dev 는 WebFetch 로 접근 불가해 대체 조사, D-010). `App.tsx` 를 알림 권한 요청 + 10/30/60초 뒤 알림 예약 버튼이 있는 검증 데모 화면으로 작성. `npx tsc --noEmit` 통과 확인. `product/README.md` 를 현재 상태에 맞게 갱신(실행법, T-007 진행 상황, npm install 예외 사유 기록). implement phase 는 Critic 게이트 대상이 아니므로(§1 Step 3.5, explore/design/review 만 해당) 호출하지 않음.
- 산출물: product/App.tsx, product/package.json, product/app.json 등 Expo 프로젝트 전체, product/README.md
- 다음 할 일: T-008 — 사람 hand-off 검증 게이트. product/README.md 에 실기기 검증 요청을 구체적으로 적고 current_task 를 blocked 로 전환, state/inbox.md 회신을 요청한다.

## Run #8 — 2026-09-26 03:25 UTC — phase: implement
- 작업: T-008 사람 hand-off 검증 게이트 처리
- 결과: done (단, 원래 계획과 다르게 처리됨)
- 한 일: 이번 실행 직전 사람이 이 Claude Code 채팅 세션에서 직접 "사람 테스트는없이 ㄱㄱ"(실기기 검증 없이 진행)라고 명시적으로 지시함. 이를 mission.md §6 이 부여한 사람의 개입 권한 행사로 보고, T-008 을 원래 설계(blocked+inbox 회신 대기)대로 처리하지 않고 **검증을 `test` phase 로 이연**하기로 결정(state/decisions.md D-011). `docs/design/mvp.md` §6 에 이 변경을 기록하고, `product/README.md` 에 "핵심 가치(확실한 알림)가 아직 실기기 미검증"임을 명확히 남김. **인수한 리스크를 명시**: multi-timer 선정의 유일한 차별점(D-007)이 아직 검증되지 않은 채로 구현을 계속하며, `test` phase 진입 시 최우선으로 이 검증을 수행하고 실패 시 pivot 조건(D-007)은 그대로 유효함.
- 결정: T-008 을 "검증 이연"으로 완료 처리. backlog 에서 제거. T-009 가 다음 최우선 작업.
- 산출물: docs/design/mvp.md(수정), product/README.md(수정)
- 다음 할 일: T-009 — lib/timer.ts 타이머 코어 로직 + 유닛 테스트

## Run #9 — 2026-09-26 04:04 UTC — phase: implement
- 작업: T-009 lib/timer.ts 타이머 코어 로직(생성/일시정지/재개/남은시간 계산) + 유닛 테스트
- 결과: done
- 한 일: `jest`, `jest-expo`, `@types/jest` 설치 후 `package.json` 에 `"test": "jest"` 스크립트와 `jest-expo` 프리셋 설정, `tsconfig.json` 에 `"types": ["jest"]` 추가. `lib/timer.ts` 에 순수 함수(`createTimer`, `getRemainingSeconds`, `isExpired`, `pauseTimer`, `resumeTimer`, `markDone`, `tick`, 리스트 연산 `addTimer`/`removeTimer`/`updateTimer`/`tickAll`)를 작성 — 타임스탬프(`now` 인자 주입) 기반이라 테스트가 실제 시간에 의존하지 않음. `lib/__tests__/timer.test.ts` 에 일시정지/재개 반복 시 오차 없음, 멱등성(이미 paused/running/done 인 상태에 같은 연산을 다시 적용해도 불변), 여러 타이머 독립적 관리(tickAll) 등을 포함해 21개 테스트 작성 — 전부 통과(`npm test`). `npx tsc --noEmit` 통과. `npx expo lint` 는 D-010 과 같은 네트워크 정책 문제로 실패해 건너뜀(D-012, T-009 범위 밖). `product/README.md` 현재 상태 갱신. implement phase 는 Critic 게이트 대상 아님.
- 산출물: product/lib/timer.ts, product/lib/__tests__/timer.test.ts, product/package.json, product/tsconfig.json, product/README.md
- 다음 할 일: T-010 — lib/notifications.ts 알림 스케줄링 래퍼(T-007 데모 코드를 재사용 가능한 모듈로 정리) + 유닛 테스트

## Run #10 — 2026-09-26 04:15 UTC — phase: implement
- 작업: T-010 lib/notifications.ts 알림 스케줄링 래퍼(T-007 데모를 재사용 가능한 모듈로 정리) + 유닛 테스트
- 결과: done
- 한 일: `product/lib/notifications.ts` 에 `configureNotificationHandler`, `ensureNotificationPermission`, `scheduleTimerNotification`, `cancelTimerNotification` 4개 함수로 `expo-notifications` 를 래핑. App.tsx 에 흩어져 있던 알림 로직(T-007 데모)을 이 모듈 호출로 교체해 컴포넌트에서 분리(설계 원칙 준수). `lib/__tests__/notifications.test.ts` 에서 `jest.mock('expo-notifications', ...)` 로 모킹해 권한 허용/거부/미결정 3가지 분기, TIME_INTERVAL 트리거+repeats:false 검증, 취소 호출 등 7개 테스트 작성 — 전부 통과. `npx tsc --noEmit` 통과, 전체 테스트 28개(timer 21 + notifications 7) 통과.
- 산출물: product/lib/notifications.ts, product/lib/__tests__/notifications.test.ts, product/App.tsx(리팩터링), product/README.md
- 다음 할 일: T-011 — lib/presets.ts 프리셋 저장/불러오기(AsyncStorage) + 유닛 테스트

## Run #11 — 2026-09-26 04:19 UTC — phase: implement
- 작업: T-011 lib/presets.ts 프리셋 저장/불러오기(AsyncStorage) + 유닛 테스트
- 결과: done
- 한 일: `@react-native-async-storage/async-storage` 를 `npm install` 로 받으니 npm "latest" 태그(3.1.1)가 잡혔는데, `product/node_modules/expo/bundledNativeModules.json` 을 확인해보니 SDK 57 이 기대하는 버전은 2.2.0 임을 발견 — 정확한 버전(2.2.0)으로 재설치함(D-013, 향후 패키지 추가 시 재사용할 절차로 기록). `lib/presets.ts` 에 순수 함수(`addPreset`, `removePreset`)와 AsyncStorage I/O 함수(`loadPresets`, `savePresets`)를 분리해서 작성 — 저장된 값이 없거나 JSON 이 손상되거나 배열이 아닌 경우 모두 빈 배열을 안전하게 반환. `lib/__tests__/presets.test.ts` 에서 AsyncStorage 를 모킹해 7개 테스트 작성 — 전부 통과. `npx tsc --noEmit` 통과, 전체 테스트 35개(timer 21 + notifications 7 + presets 7) 통과.
- 산출물: product/lib/presets.ts, product/lib/__tests__/presets.test.ts, product/package.json, product/README.md
- 다음 할 일: T-012 — 홈 화면 UI(타이머 리스트, 새 타이머 모달, 프리셋 리스트) — lib 모듈 연결. Critic 이 크기 지적을 했으니 착수 전 더 쪼갤지 검토할 것.

## Run #12 — 2026-09-26 05:04 UTC — phase: implement
- 작업: T-012a 홈 화면(새 타이머 모달 + 타이머 리스트) — lib/timer.ts, lib/notifications.ts 연결
- 결과: done
- 한 일: Critic 이 이미 지적했던 T-012 크기 문제(D-009)를 반영해 착수 전 T-012a(핵심 화면)/T-012b(프리셋 UI)로 분리(D-014). `components/TimerCard.tsx`(라벨+남은시간(mm:ss)+일시정지/재개/취소), `components/NewTimerModal.tsx`(라벨+분/초 입력 폼), `screens/Home.tsx`(타이머 리스트 상태 관리, 1초마다 tickAll 로 갱신, 생성/일시정지/재개/취소 시 lib/notifications.ts 로 알림 예약/취소 동기화 — 일시정지 시 예약된 알림을 취소하고 재개 시 남은 시간 기준으로 다시 예약해서 알림 시각이 항상 정확하게 유지되도록 설계)를 작성. `App.tsx` 를 기존 알림 검증 데모 화면 대신 `Home` 화면을 렌더링하도록 교체 — 실제 타이머 생성 자체가 알림을 예약하므로 `test` phase 실기기 검증을 이 화면으로 대신할 수 있음. `npx tsc --noEmit` 통과, 기존 테스트 35개 전부 유지(회귀 없음, lib/*.ts 로직은 변경 안 함).
- 산출물: product/screens/Home.tsx, product/components/TimerCard.tsx, product/components/NewTimerModal.tsx, product/App.tsx(교체), product/README.md
- 다음 할 일: T-012b — 프리셋 리스트 UI(lib/presets.ts 연결) 또는 T-013(README 최종 정리)

## Run #13 — 2026-09-26 06:05 UTC — phase: implement
- 작업: T-012b 프리셋 리스트 UI(lib/presets.ts 연결) — 저장된 프리셋 바로 시작 + 새 타이머 생성 시 프리셋으로 저장
- 결과: done
- 한 일: `NewTimerModal.tsx` 에 "프리셋으로 저장" 스위치 추가(onCreate 시그니처에 `saveAsPreset` 인자 추가). `components/PresetList.tsx` 신규 작성 — 저장된 프리셋을 가로 스크롤 칩으로 보여주고 탭하면 즉시 시작, ×로 삭제. `screens/Home.tsx` 에서 타이머 시작 로직을 `startTimer` 공통 함수로 뽑아내 "새로 만들기"와 "프리셋으로 시작"이 같은 경로(생성+알림 예약)를 타도록 함. 마운트 시 `loadPresets()` 로 AsyncStorage 에서 프리셋을 불러오고, 저장/삭제 시 `savePresets()` 로 즉시 반영. `npx tsc --noEmit` 통과, 기존 테스트 35개 전부 유지(lib/*.ts 로직은 변경 안 함, UI 배선만 추가).
- 산출물: product/components/PresetList.tsx, product/components/NewTimerModal.tsx(수정), product/screens/Home.tsx(수정), product/README.md
- 다음 할 일: T-013 — product/README.md 최종 정리(npx expo start 실행법 재확인, Expo Go 로 여는 방법). 이걸로 design phase 가 등록한 구현 작업(T-007~T-013)이 모두 끝나 phase 전이를 검토해야 함(→ test).

## Run #14 — 2026-09-26 07:04 UTC — phase: implement → test
- 작업: T-013 product/README.md 최종 정리
- 결과: done
- 한 일: 최종 sanity check(`npx tsc --noEmit`, `npm test` 35개 통과) 확인 후 README 를 전면 재작성 — 사용법(타이머 생성/일시정지/재개/취소/프리셋), 테스트 현황(35개, 모듈별 분해), 파일 구조 트리, "알려진 한계"(실기기 알림 미검증, D-011 참조), 패키지 추가 시 참고사항(D-013 절차)까지 한 문서에 정리. docs/design/mvp.md §6 이 등록한 구현 작업(T-007~T-013) 전부 완료 확인 → backlog 에 phase:"implement" 작업 없음 → CLAUDE.md §3 전이 규칙에 따라 phase `implement` → `test` 전이(D-015). test phase 완료 조건("테스트 전부 통과", 산출물 docs/reviews/test-<n>.md)에 맞춰 backlog 에 T-014(자동화 테스트 재확인)와 T-015(사람 실기기 검증 hand-off, T-008 과 같은 blocked+inbox 패턴 재사용)를 등록.
- 산출물: product/README.md(전면 재작성)
- 다음 할 일: T-014 — 자동화 테스트 전체 재실행 + docs/reviews/test-1.md 작성. 그 다음 T-015(사람에게 실기기 검증 요청, blocked 전환).

## Run #15 — 2026-09-26 08:03 UTC — phase: test
- 작업: T-014 자동화 테스트 전체 재실행 + docs/reviews/test-1.md 작성
- 결과: done
- 한 일: `npm test`(35개 전부 통과) + `npx tsc --noEmit`(에러 없음) 재확인. `npx expo lint` 는 여전히 네트워크 정책으로 미실행(D-012, 기존 기록 참고, mission.md/CLAUDE.md 완료 조건이 lint 를 명시적으로 요구하지 않아 이번 판정에서 제외, review phase 개선 후보로 남김). `docs/reviews/test-1.md` 에 자동화 테스트 결과 표와, 에이전트가 확인할 수 없는 수동 시나리오 4가지(백그라운드/종료 상태 알림[핵심], 다중 타이머, 일시정지/재개, 프리셋 영속성)를 명시하고, "테스트 전부 통과"를 성급히 확정하지 않는다는 판단을 기록.
- 결정: phase 는 `test` 유지(전이하지 않음) — 핵심 수동 시나리오(특히 알림 신뢰성)가 아직 미검증이라 완료 조건을 충족하지 못했다고 판단. test phase 는 Critic 게이트 대상이 아니므로(§1 Step 3.5, explore/design/review 만 해당) Critic 호출 없이 이 판단을 내림.
- 산출물: docs/reviews/test-1.md
- 다음 할 일: T-015 — 사람에게 실기기(Expo Go) 수동 검증 요청, current_task blocked 전환, state/inbox.md 회신 대기.

## Run #16 — 2026-09-26 09:03 UTC — phase: test
- 작업: T-015 [사람 hand-off] 실기기(Expo Go) 수동 시나리오 검증 요청
- 결과: blocked (사람 결정/확인 필요)
- 한 일: `current_task` 를 blocked 로 전환하고 구체적 검증 요청을 notes 에 기록: (1) '라면' 4분+'계란' 9분 타이머 동시 시작 (2) 화면 끄기/앱 완전 종료 (3) 예약 시각에 소리+배너 알림이 실제로 오는지 확인 (4) 일시정지→재개 시에도 알림이 재개 시점 기준으로 정확한지 확인. 결과를 state/inbox.md 에 남겨달라고 요청. backlog 를 비워 다음 실행들이 이 blocked 상태를 유지하며 다른 작업을 임의로 시작하지 않도록 함(D-015 의 T-015 정의를 그대로 따름).
- 산출물: 없음(상태 파일만 갱신)
- 다음 할 일: 사람 회신 대기. 회신이 오면 성공→review phase 전이, 실패→decisions.md 기록 후 explore(cycle+1) pivot 검토(D-007/D-015).

## Run #17 — 2026-09-26 09:28 UTC — phase: test (T-015 blocked, 계속)
- 작업: T-015 사람 hand-off 검증 처리 중 발생한 실행 오류 대응
- 결과: blocked (계속 — 사람 재시도 필요)
- 한 일: 사람이 채팅으로 실기기 테스트 중 `Unable to resolve module @react-native-async-storage/async-storage` 에러 스크린샷을 전달함. `product/package.json`·`package-lock.json` 을 확인해 패키지 자체는 정상 등록돼 있음을 확인하고, 원인이 `product/README.md` 의 실행 안내에 `npm install` 단계가 빠져 있던 문서 버그임을 특정(D-016). README 를 수정해 `npm install` 단계와 Metro 캐시 초기화(`-c`) 안내를 추가하고, "알려진 한계" 섹션에 이번 이슈와 해결 내용을 기록. 이 문제는 제품의 핵심 가치(알림 신뢰성)에 대한 부정적 신호가 아니므로 pivot 대상이 아님을 명시. current_task(T-015)는 계속 blocked 유지하며, 사람에게 수정된 안내대로 다시 시도해달라고 요청.
- 산출물: product/README.md(수정)
- 다음 할 일: 사람이 재시도 후 실제 알림 동작 결과를 state/inbox.md 에 남기면, 성공→review phase 전이, (실제 알림이 안 오는) 실패→decisions.md 기록 후 explore(cycle+1) pivot 검토(D-007/D-015).
