# Decision Log

중요한 판단은 전부 여기에 **추가**합니다 (기존 항목 수정/삭제 금지. 번복 시 새 항목에서 이전 D-번호를 참조).

형식:

```
## D-<번호> — <YYYY-MM-DD> — Run #<번호> — <제목>
- 맥락: 왜 이 결정이 필요했나
- 선택지: A / B / C
- 결정: ...
- 근거: 데이터·조사 결과·점수
- 되돌릴 조건: 어떤 증거가 나오면 이 결정을 바꿀지
```

---

## D-000 — 초기 설정 — Run #0 — 하네스 운영 원칙
- 맥락: 사람이 PC 없이 iPhone으로만 관리하므로, 에이전트가 GitHub Actions에서 자율 실행되어야 함
- 결정: 1회 실행 = 1개 작업, 커밋은 workflow가 수행, 기본은 test 모드 + `agent/work` 브랜치
- 근거: 실패 시 복구 가능성, 비용 통제, main 브랜치 보호
- 되돌릴 조건: 사람이 state/config.json에서 mode/commit_target을 변경할 때

## D-001 — 2026-09-26 — Run #1 — discover→research phase 전이 (후보 3개 선정)
- 맥락: T-001에서 8개 아이디어 후보를 브레인스토밍하고 mission.md §4 기준으로 1차 점수화함 (docs/ideas/ideas-1.md)
- 선택지: (A) 상위 1개만 research로 (B) 통과 기준(18점 이상 & Feasibility≥4) 만족하는 후보 전부를 research로 (C) 전부 기각하고 discover 유지
- 결정: (B) — 요리용 멀티 타이머(20점), 인터벌 운동 타이머(20점), 더치페이 정산기(19점) 3개를 research 대상으로 선정. phase를 discover→research로 전이, backlog에 T-002~T-004 등록
- 근거: 세 후보 모두 기준(18점, Feasibility≥4)을 통과했고, 이 시점 점수는 경쟁 조사 이전 가설이므로 여러 후보를 병행 조사해 research 단계에서 실제 경쟁 근거로 재평가하는 것이 근거 없는 조기 확정보다 안전함. discover phase는 Critic 게이트 대상(validate/design/review)이 아니므로 Critic 호출 없이 진행.
- 되돌릴 조건: research 조사 결과 세 후보 모두 Gap/Differentiation이 실제로는 낮다고 밝혀지면 validate에서 전부 기각하고 discover(cycle+1)로 pivot

## D-002 — 2026-09-26 — 하네스 변경 (사람이 직접 마이그레이션) — discover/research/validate → explore 통합
- 맥락: 사람 요청으로 3개 phase(discover/research/validate)를 하나의 `explore` phase로 합침 (main PR #8). 이 branch(agent/work)의 실제 운영 상태는 PR이 자동으로 건드리지 못하므로 사람이 직접 맞춤.
- 변경: `state.json` 의 phase를 `research`→`explore`, backlog(T-002~T-004)와 completed_tasks(T-001)의 phase 필드를 `explore`로 갱신. CLAUDE.md §2.1 에 통합 루프 세부 규칙 추가됨(§1 Step 3.5 Critic 게이트 대상도 `explore`/`design`/`review`로 변경).
- 부가 사항: run #2는 사람이 persistent-session 루프 버그(같은 턴에서 두 번째 작업을 시작하는 문제, PR #7에서 하드 가드로 수정됨)를 테스트하던 중 강제로 interrupt 되어 실제 작업 없이 종료됨. stats를 정직하게 반영(total_runs 2, failed_runs 1, consecutive_failures 1)하고 last_run을 "crashed"로 기록.
- 되돌릴 조건: 없음 (하네스 구조 변경, 제품 방향과 무관)

## D-003 — 2026-09-26 — Run #2 — "crashed" 기록 정정 (실제로는 완료됨), origin push 충돌 해결
- 맥락: D-002는 run #2가 interrupt 후 "실제 작업 없이 종료"됐다고 기록했으나, 이는 인터럽트 발생 시점(00:42Z)의 스냅샷이었음. 실제로는 사람이 "이어서" 라고 지시해 같은 run #2 세션이 재개되었고, T-002(multi-timer 경쟁 제품 조사, docs/research/multi-timer.md)를 실제로 완료함(종료 00:49Z). 이 사실이 반영되기 전에 origin/agent/work에 D-002 커밋(harness 마이그레이션 + "crashed" 기록)이 먼저 push되어, 로컬의 완료 커밋을 push할 때 state/state.json에서 충돌 발생.
- 선택지: (A) maintainer의 "crashed" 기록을 그대로 수용하고 완료된 조사 결과물은 참고자료로만 남긴 채 T-002를 미완료로 되돌림 (B) 실제로 완료된 사실대로 정정 — run #2 outcome을 success로, T-002를 완료 처리, stats를 정직하게 재계산
- 결정: (B). 사람에게 직접 확인한 결과("실제 완료로 정정") 이 방향으로 진행. `state.json`: phase는 새 `explore` 체계를 그대로 채택하되, last_run.outcome="success"(phase="explore", 실제 완료 요약 + 인터럽트/재개 경위를 notes에 기록), stats.successful_runs=2/failed_runs=0/consecutive_failures=0, completed_tasks에 T-002(phase: explore로 표기 통일)를 유지, backlog는 T-003·T-004만 남김(explore 체계의 새 문구 채택).
- 근거: "crashed" 판정은 인터럽트 시점의 불완전한 스냅샷이었고, 이후 실제로 산출물(docs/research/multi-timer.md)이 존재하며 근거(WebSearch 출처)를 갖춘 완료된 작업임. 사실과 다른 기록을 남기는 것이 오히려 상태 파일의 신뢰성을 해침.
- 되돌릴 조건: docs/research/multi-timer.md 의 내용이 실제로는 부실하거나 근거가 없다고 재검토에서 밝혀지면, T-002를 explore 단계에서 재점수·판정 시 다시 열어 보완
- Critic 게이트 해당 없음 (아이디어 선정/기각·설계 확정·심각도 판정이 아니라 실행 이력 정정)

## D-004 — 2026-09-26 — Run #3 — interval-timer 기각 (Critic PASS)
- 맥락: T-003. docs/research/interval-timer.md 로 App Store 유사 앱 9개 이상을 조사한 결과, "무료로 커스텀 인터벌 시퀀스 무제한 저장"이라는 애초 Gap 가설이 이미 최소 2개 앱(Workout Timer Custom Intervals, GymPulseTimer)에 의해 충족되고 있음을 확인. docs/validation/interval-timer.md 에서 재점수(Pain3/Gap1/Feasibility5/Demonstrability5/Differentiation1 = 15점, 기준 18점 미달)와 반대 논거를 정리하고 기각 결론을 냄.
- Critic 게이트: 독립 subagent(mission.md + docs/validation/interval-timer.md, docs/research/interval-timer.md 만 제공, 이번 실행 추론과정 미제공) 호출 결과 **PASS**.
  - Critic 핵심 코멘트(원문 인용): "조사 자체가 얕다(WebSearch 스니펫 기반, 실제 앱 미설치)", "Pain 점수 하향(4→3)이 Gap 사유를 이중 반영한 방법론적 혼동 — Pain을 원래 4로 되돌려도 합계 16점(4+1+5+5+1)으로 여전히 미달", "한국 시장 미조사", "그럼에도 완전 무료·무제한 경쟁 앱이 최소 2개 확인된 사실 자체가 Gap/Differentiation을 낮게 유지시키는 강한 근거이며 합리적 재조정 시나리오 대부분에서 18점 통과가 재현되지 않음". 최종 판정: "결론(기각)은 근거가 충분하고 견고하다."
- 결정: interval-timer 후보를 **기각**한다. 다음 우선순위 후보로 진행한다.
- 근거: 재점수 15점(기준 미달) + Critic PASS. 개선사항(Critic 제안): 향후 문서에서 Pain(문제 자체의 강도)과 Gap(경쟁 제품의 빈틈)을 방법론적으로 분리해서 채점할 것.
- 되돌릴 조건: 한국 시장 등 미조사 영역에서 새로운 강한 차별점 근거가 나오면 재고려 가능 (현재는 backlog 에 없음)

## D-005 — 2026-09-26 — Run #4 — multi-timer 기각 제안 → Critic REWORK
- 맥락: T-005. docs/research/multi-timer.md(기존 Run #2 조사, 새 조사 없이 재검토)를 근거로 재점수(Pain4/Gap2/Feasibility5/Demonstrability5/Differentiation2 = 18점, 기준 통과)했으나, Gap·Differentiation 이 낮다는 정성적 근거로 docs/validation/multi-timer.md 에서 **기각(REJECT)**을 제안함.
- Critic 게이트: 독립 subagent(mission.md + docs/validation/multi-timer.md + docs/research/multi-timer.md 만 제공) 호출 결과 **REWORK**.
  - Critic 핵심 코멘트(원문 인용): "'가장 강한 경쟁자 MultiTimer에는 알림 문제가 없다'는 주장은 실제로 검증된 게 아니라 단지 '그런 리뷰를 못 찾았다'는 것뿐" (부재 증거를 근거로 삼음), "research.md가 이미 '조리 프리셋 라이브러리'라는 잠재적 차별점을 발견했는데... 스코프를 조정해 재평가하는 편이 훨씬 저렴한데 그 옵션을 시도하지 않았다", "'숫자는 통과(18) but 정성적으로 기각'이라는 논리는 원칙적으로 방어 가능하다... 문제는 이 문서가 그 재량을 쓰면서도 왜 이번엔 숫자 합계보다 정성 판단을 우선해야 하는지에 대한 원칙을 제시하지 않고, 결정 전에 시도 가능했던 저비용 검증을 건너뛰었다는 점". 최종 지시: "(a) MultiTimer 알림 신뢰성에 대한 타겟 검색 1회, (b) 조리 프리셋 스코프로 재점수화 시도, 이 두 가지를 마치지 않고 기각을 확정한 것은 근거 부족".
- 결정: 결론을 확정하지 않는다. `current_task`(T-005)를 `in_progress` 로 유지하고, 위 (a)(b) 두 가지를 다음 실행에서 보완한 뒤 Step 3.5 Critic 게이트를 다시 통과해야 done 처리한다.
- 근거: CLAUDE.md §1 Step 3.5 처리 규칙("REWORK → in_progress 유지, notes 에 구체적 결함 기록, 다음 실행에서 보완") 그대로 따름. Critic 의견에 반박할 새 근거가 없으므로 그대로 수용.
- 되돌릴 조건: 다음 실행에서 (a)(b) 보완 후 재상정, 새 Critic PASS/REJECT 로 확정

## D-006 — 2026-09-26 — Run #5 — multi-timer 2차 보완 → Critic 2차 REWORK
- 맥락: Run #5 에서 D-005 의 (a)(b) 를 WebSearch로 실제 조사(MultiTimer Help Center 트러블슈팅 문서 확인, 계란 타이머류 6개+ 확인)하고 docs/validation/multi-timer.md 를 "기각(17점)"으로 갱신, 두 번째 Critic 게이트 호출.
- Critic 게이트: 2차 **REWORK**.
  - 핵심 코멘트(원문 인용): "research.md의 원래 Gap은 'Multi Kitchen & Cooking Timer'가... 그런데 Run #5는 이 앱이 아니라 다른 앱(MultiTimer)의 알림 신뢰성만 조사하고, 그 결과를... 원래 Gap에 그대로 전이시켰다", "iOS 시간 기반 로컬 예약 알림은... OS가 직접 발화한다... 이를 구분하지 않고 '우리도 동일하게 실패한다'고 단정했다. 이는 반대 방향의 근거 없는 비관이다", "재점수(비평가 관점): ...19점...기각 결론이 확정적이지 않다".
- 결정: 결론을 확정하지 않는다. 지적된 기술적 오류(엉뚱한 경쟁자 근거 전이, OS 제약 과잉일반화)를 인정하고, 같은 실행(Run #5) 안에서 곧바로 3차 보완(로컬 알림의 실제 OS 레벨 동작 방식 재조사) 후 3차 제출.
- 근거: turn 예산(90, 아직 여유 있음)이 있고 Critic 지적이 구체적이라 즉시 보완 가능 판단.

## D-007 — 2026-09-26 — Run #5 — multi-timer 선정 (기각→선정으로 정정), Critic PASS, explore→design 전이
- 맥락: D-006 의 기술적 오류를 정정 — expo-notifications 의 시간 기반 로컬 예약 알림은 OS(UNUserNotificationCenter)가 앱 종료 상태에서도 발화하도록 설계된 일반적 iOS 동작이며, 앞서 조사한 expo-notifications 관련 이슈들은 "알림 표시"가 아니라 "탭 이후 JS 콜백 실행"에 관한 별개 문제였음을 확인. 이를 반영해 docs/validation/multi-timer.md 를 재점수(Pain4/Gap3/Feasibility5/Demonstrability5/Differentiation3=20점)하고 **선정(SELECT)**으로 결론을 뒤집음. 핵심 차별점("확실한 알림")을 가설로 명시하고, design 단계 첫 구현 작업으로 실기기 검증 + 실패 시 즉시 pivot 을 조건으로 검.
- Critic 게이트: 3차 **PASS**.
  - 핵심 코멘트(원문 인용): "Expo Go 특유 제약과 'iOS 일반론'의 혼동... 핵심 기술 주장은 '네이티브 iOS 일반론'이지 'Expo Go 환경'에 대한 검증된 지식이 아니다"(design 진입 시 반드시 실제 Expo Go 환경에서 검증 필요, 네이티브 iOS 일반론과 구분할 것), "가장 강력한 실제 증거를 스스로 폐기... 원인이 불명확해도 증상(경쟁앱의 실관찰 실패)은 여전히 수요 신호로 쓸 수 있었다"(Multi Kitchen & Cooking Timer 의 무음 버그 자체는 여전히 유효한 수요 신호로 참고할 것), "차별점이 사실상 단일 축... 6개 이상의 경쟁앱이 존재하는 붐비는 시장에서 단일 미검증 가설 하나로 충분한지는 문서도 답하지 못한다"(리스크로 계속 인지할 것). 최종 판정: "design 첫 구현 작업으로 실기기 검증 + 실패 시 즉시 pivot을 조건으로 건 것은... 합리적인 리스크 우선 설계다."
- 결정: **multi-timer(요리용 멀티 타이머)를 선정**한다. `phase`: explore → **design** 전이. `product.name`="요리용 멀티 타이머", `product.status`="selected". backlog 의 남은 explore 후보(T-004, split-bill)는 이미 후보 선정이 끝났으므로 제거(폐기가 아니라 보류 — 이번 제품이 review 단계에서 pivot 판정을 받으면 재고려 가능).
- 근거: mission.md §4 기준 재점수 20점(통과) + Critic PASS. Critic 이 지적한 리스크 2가지(Expo Go 환경 검증 필요, 시장 포화도)는 design/implement 단계 첫 작업에 명시적으로 반영.
- 되돌릴 조건: design 첫 구현 작업(실기기 알림 검증)이 실패하면 즉시 이 선정을 재검토(pivot, explore cycle+1)

## D-008 — 2026-09-26 — Run #6 — MVP 설계(docs/design/mvp.md) 1차 → Critic REWORK
- 맥락: T-006. multi-timer 선정 근거(docs/validation/multi-timer.md)를 바탕으로 MVP 범위/시나리오/화면흐름/기술구조/테스트계획/구현작업(T-007~T-012)을 설계.
- Critic 게이트: 1차 **REWORK**.
  - 핵심 코멘트(원문 인용): "이 에이전트는 GitHub Actions 컨테이너에서 실행되며 아이폰이 없다... T-007을 마치 에이전트가 스스로 끝낼 수 있는 '구현 작업'처럼 배치했다... hand-off(blocked 상태 전환 → 사람 회신 대기 → 다음 실행이 판정) 절차가 문서 어디에도 명시돼 있지 않다", "T-007 이 사실상 4개 작업(프로젝트 초기화/패키지 설치/권한+스케줄링 구현/실기기 수동 검증)을 한 덩어리로 묶었다... CLAUDE.md §3.1... 을 낙관적으로 본 것".
- 결정: T-007 을 "에이전트가 끝까지 할 수 있는 구현"과 "사람에게 넘기는 검증(T-008, blocked+inbox 회신 hand-off)"으로 분리해 재작성 후 같은 실행에서 재제출.
- 근거: 지적이 구체적이고 turn 예산 여유 있음.

## D-009 — 2026-09-26 — Run #6 — MVP 설계 2차 → Critic PASS, design→implement 전이
- 맥락: D-008 의 지적을 반영해 T-007(구현)/T-008(사람 hand-off 검증 게이트, blocked 절차 명시)로 분리하고 T-009~T-013 으로 나머지 구현 작업 재배치.
- Critic 게이트: 2차 **PASS**.
  - 핵심 코멘트(원문 인용): "이전 REWORK의 두 핵심 지적(검증 주체 불명확, 작업 과대)은 이번 버전에서 실질적으로 해소됐다", 단 유의사항: "T-008의 '다른 explore/개선 작업 진행' 대안이 현재 backlog 구조상 사실상 존재하지 않아 실효성이 없다"(→ 즉시 문구를 "inbox 짧게 확인 후 종료"로 단순화해 반영함), "T-012는 여전히 다소 크다"(→ implement 단계에서 T-012 착수 전 추가로 쪼갤지 재검토할 것), "Feasibility(5~10회 실행 내 완성) 관점에서 explore~design 에 이미 6회를 썼다... 재확인이 필요"(→ implement 진행 중 진도가 느리면 review 없이도 범위를 줄이는 것을 고려할 것, 특히 T-011 프리셋을 가장 먼저 잘라낼 후보로 mvp.md §7 에 이미 명시함).
- 결정: **MVP 설계를 확정**한다. `phase`: design → **implement** 전이. backlog 를 T-007~T-013(phase: implement)로 교체.
- 근거: mission.md §1~§6 기준 위반 없음(Critic 확인), 핵심 리스크(T-007/T-008 검증 게이트) 처리 절차 명확.
- 되돌릴 조건: T-008 사람 회신이 "실패"면 explore(cycle+1)로 pivot. Feasibility 초과(실행 수 과다) 징후가 뚜렷해지면 T-011(프리셋)부터 범위 축소.

## D-010 — 2026-09-26 — Run #7 — T-007 구현 중 하네스 관련 이슈 2건 (기록용, Critic 게이트 대상 아님)
- 맥락: T-007(Expo 프로젝트 초기화 + expo-notifications 설치 + 알림 데모)을 수행하며 발견한 환경 제약.
- 이슈 1 — `npx expo install` 실패: 이 컨테이너의 네트워크 정책이 `expo install` 이 내부적으로 호출하는 호환성 체크 API(React Native Directory 등으로 추정)를 막아 "HTTP Proxy Network Error: Forbidden" 로 전체 명령이 실패함. **대응**: `npm install expo-notifications` 로 직접 설치한 뒤 `package.json` 의 버전(`^57.0.21`)이 설치된 Expo(`~57.0.25`) 와 SDK 넘버가 일치하는지 수동 확인함(정상). 앞으로 T-010/T-011 에서 새 패키지(`@react-native-async-storage/async-storage`)를 추가할 때도 `npx expo install` 이 같은 이유로 실패하면 동일하게 `npm install` + 버전 수동 확인으로 대응할 것.
- 이슈 2 — `WebFetch` 로 `docs.expo.dev` 접근 불가(`EGRESS_BLOCKED`): product/AGENTS.md(create-expo-app 템플릿이 생성)가 "Expo API 작성 전 반드시 버전별 공식 문서를 fetch 하라"고 안내하지만 이 도메인은 에이전트 네트워크 정책에서도 막혀 있음. **대응**: WebSearch(검색 스니펫)로 대체해 `expo-notifications` 의 `scheduleNotificationAsync` API 형태(`trigger: {type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats}`)와 "로컬 알림은 Expo Go 에서도 동작한다"는 사실을 확인함(출처: WebSearch 결과, docs.expo.dev 원문은 직접 확인 못 함 — 완전한 확신은 아니므로 T-008 실기기 검증이 여전히 필수).
- 결정: 하네스 개선 제안은 아님(에이전트가 알아서 우회 가능한 수준). 다만 반복적으로 마주칠 패턴이라 다음 실행들이 같은 문제로 멈추지 않도록 기록만 남김.
- 되돌릴 조건: 해당 없음(정보성 기록)

## D-011 — 2026-09-26 — Run #8 — T-008(사람 실기기 검증 hand-off) 처리 방식 변경: 사람이 채팅에서 직접 생략 지시
- 맥락: T-008 은 원래 "current_task.status=blocked 전환 후 사람이 Expo Go 실기기에서 백그라운드/종료 상태 알림을 확인해 state/inbox.md 에 회신"하는 hand-off 게이트였다(docs/design/mvp.md §6, D-008/D-009). 그런데 이번 Run #8 은 사람이 이 Claude Code 세션 채팅에서 직접 "사람 테스트는없이 ㄱㄱ"(실기기 검증 없이 진행)라고 명시적으로 지시한 직후 시작됐다. mission.md §6 은 사람이 "state/inbox.md 또는 agent-inbox 라벨 Issue" 로 방향을 바꿀 수 있다고 규정하지만, 이 세션 자체가 사람이 실시간으로 지시를 내리는 채널이므로 이 지시를 inbox 지시와 동등하게 취급한다.
- 선택지: (A) 원래 설계대로 blocked 유지하며 사람 회신을 계속 기다림 (B) 사람 지시를 그대로 따라 검증 없이 T-009 이후로 즉시 진행 (C) 검증을 건너뛰되, 나중에 반드시 확인하도록 `test` phase 로 이연
- 결정: (C) — 지금 당장 실기기 검증을 하지 않고 구현(T-009~)을 계속 진행한다. 단, **이 검증은 사라지는 게 아니라 CLAUDE.md phase 표의 `test` 단계("수동 시나리오 점검 결과 기록")로 이연**한다. mission.md §5 성공 기준("핵심 사용자 시나리오 1개가 Expo Go 로 실행한 아이폰에서 끝까지 동작")이 어차피 실기기 확인을 요구하므로, MVP 전체 기능을 다 만든 뒤 한 번에 종합적으로 실기기 검증하는 편이 매 작업마다 blocked 로 멈추는 것보다 효율적이라고 판단했다(사람이 이를 선호한다는 명확한 신호이기도 함).
- 근거: 사람의 명시적 지시(가장 강한 근거 — mission.md §6 이 부여한 개입 권한 행사). 기술적으로도 T-007 구현 중 WebSearch 로 확인한 "로컬 알림은 Expo Go 에서도 동작한다"는 근거(D-010)가 있어, 완전히 근거 없이 진행하는 것은 아니다.
- **인수한 리스크(반드시 기억할 것)**: multi-timer 선정의 유일한 실질적 차별점(D-007)인 "확실한 알림"이 아직 실기기로 검증되지 않았다. `test` phase 진입 시 반드시 최우선으로 이 실기기 검증을 수행하고, 만약 실패하면 그 시점에 decisions.md 에 기록하고 explore(cycle+1) pivot 을 다시 고려해야 한다 — 이번 결정이 그 pivot 조건 자체를 없앤 것은 아니고 **검증 시점만 뒤로 미룬 것**이다.
- 되돌릴 조건: `test` phase 에서의 실기기 검증이 실패하면 즉시 pivot 재검토(원래 D-007 조건 그대로 유효).

## D-012 — 2026-09-26 — Run #9 — `npx expo lint` 도 네트워크 정책으로 막힘 (정보성 기록)
- 맥락: T-009 수행 중 AGENTS.md 지침대로 `npx expo lint` 를 실행했으나 ESLint 자동 설정 과정에서 D-010 과 동일한 "HTTP Proxy Network Error: Forbidden" 로 실패함.
- 결정: T-009 범위(타이머 코어 로직 + 유닛 테스트)에 lint 설정은 필수가 아니므로 건너뛰고 `npx tsc --noEmit` 통과와 `npm test` 통과로 완료 기준을 대신함. lint 설정 자체는 나중에(예: test/review phase) 사람이 네트워크 정책을 넓혀주면 재시도.
- 근거: D-010 과 같은 패턴(이 컨테이너 환경은 npm 레지스트리는 허용하지만 그 외 호환성/설정 체크 API 호출은 막음). 반복 정보이므로 짧게만 기록.
- 되돌릴 조건: 해당 없음(정보성 기록)

## D-013 — 2026-09-26 — Run #11 — 패키지 SDK 호환 버전 확인 방법 발견 (`npx expo install` 네트워크 우회)
- 맥락: T-011 에서 `@react-native-async-storage/async-storage` 를 `npm install` 로 받으면 npm 의 "latest" 태그(3.1.1)가 잡히는데, 이는 커뮤니티 패키지라 expo-notifications 처럼 SDK 번호에 맞춰 배포되지 않는다. WebSearch 로 확인한 바 Expo SDK 54+ 에서는 2.2.0 이 호환 버전이라는 정보가 있었고, 실제로 `node_modules/expo/bundledNativeModules.json` 파일 안에 Expo 가 각 SDK 버전에서 기대하는 정확한 패키지 버전 목록이 **로컬에 이미 번들되어 있어 네트워크 없이 확인 가능**함을 발견함(`grep async-storage node_modules/expo/bundledNativeModules.json` → `"2.2.0"`).
- 결정: `npm install @react-native-async-storage/async-storage@2.2.0 --save-exact` 로 정확한 버전을 재설치함(기존 3.1.1 은 버림).
- 근거: 버전 불일치는 Expo Go 네이티브 브릿지와 JS 코드 간 API 불일치로 이어져 런타임에 크래시하거나 오작동할 수 있는 실질적 리스크임(D-007/D-011 에서 이미 타이머 알림 신뢰성이 검증되지 않은 상태이므로, 여기서 또 다른 불확실성을 추가하지 않는 것이 중요).
- **향후 실행을 위한 재사용 가능한 절차**: 새 패키지를 추가할 때 `npx expo install <pkg>` 이 네트워크 정책으로 실패하면(D-010), `npm install <pkg>` 로 우선 받은 뒤 `grep <pkg-name> product/node_modules/expo/bundledNativeModules.json` 으로 SDK 호환 버전을 확인하고, 다르면 `npm install <pkg>@<정확한버전> --save-exact` 로 재설치할 것. (단, `bundledNativeModules.json` 에 없는 패키지는 이 방법이 통하지 않으므로 그때는 별도 조사 필요.)
- 되돌릴 조건: 해당 없음

## D-014 — 2026-09-26 — Run #12 — T-012 를 T-012a/T-012b 로 분리
- 맥락: docs/design/mvp.md 의 T-012("홈 화면 UI 전체 — 타이머 리스트, 새 타이머 모달, 프리셋 리스트")에 Critic 이 이미 "크면 착수 전 더 쪼갤 것"이라는 유의사항을 남겼었음(D-009).
- 결정: 착수 전에 T-012a(새 타이머 모달 + 타이머 리스트/TimerCard — mission.md §5 핵심 시나리오에 필수)와 T-012b(프리셋 리스트 UI — 있으면 좋지만 핵심 시나리오에는 필수 아님)로 분리. 이번 실행은 T-012a 만 수행.
- 근거: CLAUDE.md §3.1 예산 원칙 및 Critic 지적을 그대로 따름. 프리셋은 mission.md §5 성공 기준(핵심 시나리오 1개)에 포함되지 않아 먼저 미뤄도 안전함.
- 되돌릴 조건: 해당 없음

## D-015 — 2026-09-26 — Run #14 — implement → test 전이
- 맥락: T-013(README 최종 정리)을 끝으로 docs/design/mvp.md §6 이 등록한 구현 작업(T-007~T-013)이 모두 완료됨. backlog 의 phase:"implement" 작업이 더 이상 없음.
- 결정: CLAUDE.md §3 전이 규칙("implement: backlog 에 phase:'implement' 작업이 남아 있으면 계속 implement, 없으면 → test")에 따라 `phase`: implement → **test** 전이. backlog 에 test phase 작업 2개 등록: (1) T-014 자동화 테스트 전체 재실행+결과 기록(에이전트가 끝까지 할 수 있음), (2) T-015 [사람 hand-off] 실기기 수동 시나리오 검증 요청 — 이 앱의 핵심 가치(백그라운드/종료 상태 알림)를 사람이 실제 아이폰에서 확인해야 하므로 T-008 과 같은 blocked+inbox 회신 패턴을 재사용.
- 근거: mission.md §5 성공 기준("핵심 사용자 시나리오 1개가 Expo Go 로 실행한 아이폰에서 끝까지 동작")은 실기기 확인을 요구하고, 에이전트는 아이폰이 없어 직접 수행할 수 없음. D-011 에서 미뤄둔 검증을 여기서 다시 요청하는 것이며, D-007 의 pivot 조건이 그대로 적용됨(실패 시 explore cycle+1 재검토).
- 되돌릴 조건: T-015 사람 회신이 "실패"면 explore(cycle+1)로 pivot 재검토. "성공"이면 test phase 완료 조건(테스트 전부 통과) 충족 후 review phase 로 전이.

## D-016 — 2026-09-26 — Run #17 — T-015 검증 중 실행 오류 발견 및 README 수정 (블로킹 이슈, pivot 아님)
- 맥락: 사람이 T-015 요청대로 실기기(Expo Go)에서 앱을 열려고 시도하던 중 `Unable to resolve module @react-native-async-storage/async-storage` 에러 스크린샷을 채팅으로 전달함(경로가 `/workspaces/...` 로 보아 Codespaces 등 새로 체크아웃한 환경으로 추정).
- 조사: `product/package.json`, `product/package-lock.json` 을 확인한 결과 해당 패키지는 정상적으로 들어있었음(lockfile 에 3회 참조). 반면 `product/README.md` 의 "실행" 섹션은 `cd product` 다음 바로 `npx expo start --tunnel` 을 실행하도록 안내하고 있었고, `npm install` 단계가 빠져 있었음. `node_modules/` 는 `.gitignore` 로 커밋되지 않으므로, 새로 체크아웃한 환경에서는 이 안내를 그대로 따르면 100% 이 에러가 재현된다.
- 결정: 이것은 제품의 핵심 가치(알림 신뢰성)에 대한 부정적 신호가 아니라 **문서 버그**다. D-007/D-015 의 pivot 조건("실패"）과는 무관함 — 애초에 알림 검증 단계까지 가지도 못했다. README 의 실행 섹션에 `npm install` 단계와 캐시 초기화(`-c`) 안내를 추가해 수정함. T-015 는 계속 blocked 유지하고, 사람에게 이 수정 사항을 반영해 다시 시도해달라고 요청.
- 근거: 실제 재현 가능한 문서 결함이 확인됐고, 원인이 코드가 아니라 문서라는 것이 package.json/lockfile 조사로 확인됨.
- 되돌릴 조건: 해당 없음. (재시도 후에도 같은 에러가 나면 별도로 조사 필요 — 예: 사용자 환경의 npm install 실행 위치가 `product/` 가 아닐 가능성.)

## D-017 — 2026-09-26 — Run #18 — 숫자 키패드에 "완료" 버튼 없어 키보드 안 내려가는 문제 수정
- 맥락: 사람이 실기기에서 "+ 새 타이머" 모달의 분/초 입력칸(숫자 키패드, `keyboardType="number-pad"`)을 눌렀는데, iOS 숫자 키패드는 원래 "완료"/return 키가 없어 키보드가 안 내려가고 화면 아래의 "시작" 버튼을 탭할 수 없는 문제를 채팅으로 보고함.
- 조사: `components/NewTimerModal.tsx` 확인 — 분/초 `TextInput` 이 `keyboardType="number-pad"` 만 쓰고 있어 iOS 에서 키보드를 닫을 방법이 UI에 없었음(설계 결함, 실기기에서만 드러남 — 시뮬레이터/타입체크로는 안 잡힘).
- 결정: `InputAccessoryView`(iOS 전용, 키보드 위에 붙는 바)로 "완료" 버튼을 추가해 `Keyboard.dismiss()` 를 호출하도록 함. 추가로 `KeyboardAvoidingView` 로 모달 시트 전체를 감싸 키보드가 떠도 버튼이 가려지지 않게 하고, 오버레이 배경을 탭해도 키보드가 닫히도록 함(모달 자체는 안 닫힘, 기존 취소/시작 버튼 동작 유지).
- 근거: 이 문제는 mission.md §5 성공 기준("핵심 사용자 시나리오가 끝까지 동작")을 직접 막는 실사용 버그다 — 알림 신뢰성 검증(T-015)보다 먼저 이걸 고치지 않으면 애초에 타이머를 만들 수조차 없다. `npx tsc --noEmit`, `npm test`(35개) 로 회귀 없음 확인.
- 되돌릴 조건: 해당 없음. Android 는 기본 숫자 키패드에 이 문제가 없어 `inputAccessoryViewID` 를 iOS 에만 조건부로 적용함(Platform.OS==='ios').

## D-018 — 2026-09-26 — Run #19 — T-015 성공 확정, 핵심 가설 검증 완료, test → review 전이
- 맥락: 사람이 실기기(Expo Go)에서 앱을 실행해 타이머를 만들고 앱을 껐다 켜는 실사용 테스트를 직접 수행한 뒤 채팅으로 "정상적으로 알림은 오는데 앱을 껐다키면 ui는 사라져있어" 라고 회신함.
- 판정: **T-015 성공.** 이 제품 선정의 유일한 실질적 차별점이자 D-007/D-009/D-011/D-015 에서 반복적으로 조건부로 걸어뒀던 핵심 가설("앱이 백그라운드/종료 상태여도 로컬 알림이 실제로 온다")이 실제 아이폰에서 확인됨. explore 단계부터 이어져 온 pivot 리스크가 이제 해소됨.
- 부가 발견(같은 회신에 포함): 앱을 완전히 재시작(kill 후 재실행)하면 타이머 리스트 UI가 비어 보임. 이는 docs/design/mvp.md §6 "알려진 한계"에서 이미 예견하고 "실사용에서 불편하면 review 단계 개선 후보로 남긴다"고 명시했던 바로 그 항목임 — 이번에 사람이 실제로 불편함을 보고해 review 단계의 검토 대상으로 확정.
- 결정: test phase 완료 조건("테스트 전부 통과": 자동화 35개 + 이번 수동 핵심 시나리오 성공)을 충족했다고 판단. `phase`: test → **review** 전이. backlog 에 T-016(비판적 검토, docs/reviews/review-1.md, 이미 확인된 후보 이슈로 위 UI 미보존 문제 포함) 등록.
- 근거: mission.md §5 성공 기준의 핵심 조건("Expo Go 로 실행한 아이폰에서 끝까지 동작")이 사람의 직접 확인으로 충족됨.
- 되돌릴 조건: review 단계에서 "이 제품이 미션에 맞지 않는다"는 새로운 강한 근거가 나오면 pivot 재검토(§3), 그 외에는 이 성공 판정을 번복하지 않음.

## D-019 — 2026-09-26 — Run #20 — review-1.md 심각도 판정, Critic 2라운드(REWORK→PASS), review → improve 전이
- 맥락: T-016. 코드 전체(App.tsx, screens/Home.tsx, components/*, lib/*.ts)를 재검토해 docs/reviews/review-1.md 작성. 1차본은 치명 0/높음 2건(H1: 앱 재시작 시 타이머 리스트 소실, H2: 그로 인한 잠재적 중복 알림 — 같은 근본원인)으로 판정.
- Critic 게이트 1차: **REWORK**.
  - 핵심 코멘트(원문 인용): "`Home.tsx`는 `permissionGranted`를 마운트 시 1회만... `AppState` 리스너가 전혀 없다. 알림 권한을 최초에 거부한 사용자가 나중에 설정 앱에서 권한을 켜고 앱으로 돌아와도... 앱을 완전히 종료·재실행하기 전까지는 영원히 '시작' 버튼이 알림 권한 경고만 띄우고 타이머를 만들 수 없다. 이는... 핵심 기능(타이머 시작 자체)을 무기한 막는다는 점에서 H1/H2와 대등하거나 그 이상의 심각도 후보인데 review-1.md는 언급하지 않았다."
- 대응: 코드로 지적을 재확인(정확함 확인) 후 H3(알림 권한 재확인 누락)를 추가, 종합 판정을 "높음 3건"으로 갱신. improve 우선순위를 H1/H2(범위 큼) 대신 H3(범위 작고, 핵심 동작을 완전히 막는다는 점에서 영향도 큼)로 변경.
- Critic 게이트 2차: **PASS**.
  - 핵심 코멘트(원문 인용): "H3를 High로 추가한 것은 타당함... 재현 시나리오가 논리적으로 명확하고 핵심 동작(타이머 생성)을 완전히 막는다는 점에서 High 등급이 정당하다", "H3를 먼저 선택한 순서는 근거가 있으나 완전히 확실하진 않음 — 문서 자체가... 이미 이 우려(H1/H2가 더 빈번할 수 있음)를 인정하고 다음 리뷰에서 재검토하겠다고 명시했다. 판단의 불확실성을 은폐하지 않고 명시했다는 점에서 수용 가능하다", "재확인한 소스 코드에서... 놓친 새로운 치명/높음급 문제는 발견하지 못했다."
- 결정: review 결론(치명 0, 높음 3건, 중간 3건, 낮음 2건)을 확정한다. CLAUDE.md §3 전이 규칙("치명/높음 문제가 있으면 → improve")에 따라 `phase`: review → **improve** 전이. backlog 에 T-017(H3 수정: `AppState` 리스너로 포그라운드 복귀 시 알림 권한 재확인) 등록. H1/H2, M1~M3, L1~L2 는 다음 test→review→improve 루프 후보로 남김(review-1.md 에 기록).
- 근거: Critic PASS + mission.md §1/§5 기준상 핵심 동작을 완전히 막는 결함이 다음 개선 대상으로 타당함.
- 되돌릴 조건: H3 수정 후 다음 review 사이클에서 H1/H2 가 실제로 더 빈번하다는 근거(예: 사용자가 다시 겪음)가 나오면 우선순위 재조정.

## D-020 — 2026-09-26 — Run #21 — T-017 H3 수정 완료, improve → test 전이
- 맥락: T-017. review-1.md 의 H3(알림 권한이 나중에 설정에서 켜져도 앱 재시작 전까지 인식 못 함, D-019 에서 Critic 1차 REWORK 로 지적됨)를 수정.
- 조사: `screens/Home.tsx` 의 최상단 `useEffect(() => { ...; ensureNotificationPermission().then(setPermissionGranted); ... }, [])` 가 마운트 시 1회만 실행되고, 이후 권한 상태 변화를 감지할 방법이 전혀 없었음을 재확인.
- 결정: `react-native` 의 `AppState` 를 import 해, 같은 `useEffect` 안에 `AppState.addEventListener('change', ...)` 리스너를 추가. `nextState === 'active'`(앱이 포그라운드로 복귀)일 때마다 `ensureNotificationPermission()` 을 재호출해 `permissionGranted` 를 갱신하도록 함. 언마운트 시 `subscription.remove()` 로 정리. 새 패키지 설치 없이 `react-native` 코어 API만 사용(설계 변경 최소화, Critic이 지적한 범위와 정확히 일치).
- 검증: `npx tsc --noEmit` 통과(타입 에러 없음). `npx jest` 전체 재실행 — 기존 35개 테스트 전부 통과, 회귀 없음(이 훅은 UI 컴포넌트 내부라 기존 순수 함수 테스트 스위트에는 영향 없음 — 수동 코드 리뷰로 로직 검증). `product/README.md` "알려진 한계" 섹션에 해결 내역 기록.
- phase 전이: CLAUDE.md §3 "improve: 개선 1건 완료 → test" 규칙에 따라 `phase`: improve → **test**. backlog 에 T-018(자동화 테스트 재확인 + 사람에게 H3 수정 검증 요청: 알림 권한을 껐다가 설정에서 다시 켜고 앱으로 돌아왔을 때 "시작" 버튼이 정상 동작하는지) 등록.
- 근거: Critic 게이트는 이번 작업(코드 수정)에는 적용되지 않음 — §1 Step 3.5 는 explore/design/review 의 "결론"에만 적용되고, improve 는 해당 없음(구현 작업).
- 되돌릴 조건: 사람의 실기기 재검증에서 이 수정 후에도 여전히 권한 상태가 갱신되지 않는다는 보고가 오면 원인 재조사(예: iOS 가 `AppState` 이벤트를 특정 상황에서 발생시키지 않는 경우가 있는지 추가 조사 필요).
