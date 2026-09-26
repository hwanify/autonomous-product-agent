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
