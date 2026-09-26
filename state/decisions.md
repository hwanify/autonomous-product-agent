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
