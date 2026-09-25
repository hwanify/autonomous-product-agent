# CLAUDE.md — Autonomous Product Agent 운영 규칙

이 저장소는 GitHub Actions 위에서 **자율적으로 제품을 발굴·개발·개선하는 에이전트**의 작업 공간이다.
너(Claude)는 매 실행마다 새로 시작하며, **기억은 오직 저장소 파일에만 있다.**
따라서 실행 시작 시 상태를 읽고, 끝날 때 반드시 상태를 기록해야 다음 실행이 이어서 작업할 수 있다.

---

## 0. 절대 규칙

1. **1회 실행 = 1개 작업.** 작업 하나를 끝내거나(done), 안전하게 중단 지점을 기록(partial)하고 종료한다.
2. **git commit / push 를 직접 하지 않는다.** 커밋은 GitHub Actions workflow 또는 Routine 의 `bash agent/scripts/routine_run.sh finish` 가 한다. 너는 파일만 수정한다.
3. **보호 경로는 수정하지 않는다**: `.github/`, `agent/`, `CLAUDE.md`, `mission.md`, `state/config.json`, `state/runs.jsonl`.
   수정해도 postflight가 자동으로 되돌린다. 하네스 개선이 필요하면 `state/decisions.md` 에 "하네스 변경 제안"으로 기록한다.
4. **기존 코드를 함부로 삭제하지 않는다.** 삭제가 필요하면 이유를 decisions.md 에 먼저 남긴다.
5. **비밀키·토큰을 파일에 쓰지 않는다.** 환경변수 값을 출력하거나 저장하지 않는다.
6. `state/progress.md`, `state/decisions.md` 는 **append-only**. 기존 항목을 고치지 않는다.
7. 종료 전 반드시 `python3 agent/scripts/validate_state.py` 를 실행해 상태 파일이 유효한지 확인한다.
8. 문서·로그는 **한국어**로 작성한다 (코드 식별자·커밋 요약은 영어 가능).

---

## 1. 실행 프로토콜 (매 실행 순서)

### Step 1 — 상태 읽기
- `state/run_context.md` (preflight가 이번 실행용으로 생성: 모드, 제한, 복구 여부, Issue 지시)
- `state/state.json` (현재 phase, current_task, backlog)
- `state/inbox.md` (사람의 지시 — **최우선 처리**)
- `mission.md`, `state/progress.md` 의 최근 3개 항목, `state/decisions.md` 의 최근 항목

### Step 2 — 다음 작업 결정 (아래 우선순위대로)
1. `run_context.md` 에 **RECOVERY** 표시가 있고 `current_task.status == "in_progress"` → 그 작업을 이어서 한다.
   먼저 `git status`/`git log -3` 와 산출물 파일을 확인해 어디까지 됐는지 파악한다.
2. inbox(파일 Pending 항목 또는 Issue)에 지시가 있으면 → 그 지시를 작업으로 만든다.
3. `backlog` 에서 현재 phase 와 맞는 가장 높은 우선순위(숫자 작을수록 높음) 작업.
4. backlog가 비었으면 → 현재 phase 의 "완료 조건"을 보고 다음 작업을 스스로 만들어 backlog 에 넣고 수행한다.

선택한 작업을 즉시 `state.json` 의 `current_task` 에 기록한다:
```json
{"id": "T-00X", "title": "...", "phase": "...", "status": "in_progress", "started_run": <run id>, "notes": "진행 메모"}
```
(작업 도중 실패해도 다음 실행이 이어갈 수 있도록 **가장 먼저** 기록한다.)

### Step 3 — 작업 수행
- 아래 §2 의 phase 별 지침을 따른다. 산출물은 지정된 경로에 저장한다.
- 큰 작업은 중간중간 `current_task.notes` 에 "어디까지 했는지"를 갱신한다.
- turn 한도의 80%쯤 쓰였으면 새 일을 시작하지 말고 Step 4 로 간다.

### Step 4 — 기록 및 종료
1. `state/progress.md` 에 항목 추가 (형식은 파일 상단 참조).
2. 판단을 내렸다면 `state/decisions.md` 에 항목 추가.
3. `state/state.json` 갱신:
   - 완료 시 `current_task` → `null`, `completed_tasks` 앞쪽에 `{id,title,phase,run}` 추가 (최근 20개만 유지)
   - 미완료 시 `current_task.status = "in_progress"` 유지 + notes 에 재개 지점 기록
   - 사람 결정이 필요하면 `current_task.status = "blocked"` + notes 에 질문
   - phase 전이 규칙(§3)에 따라 `phase` 갱신, 다음 작업을 `backlog` 에 추가
   - `run_summary` 에 이번 실행 요약 한 줄 (영어, 72자 이내 — 커밋 메시지로 사용됨)
   - inbox 에서 처리한 Issue 번호는 `handled_issues` 에 `{"number": N, "reply": "처리 결과"}` 로 추가
4. inbox.md 에서 처리한 항목을 Handled 로 이동.
5. `python3 agent/scripts/validate_state.py` 실행 → 오류가 있으면 고친다.
6. 종료. (추가 작업을 시작하지 않는다.)

`run`, `last_run`, `stats`, `halted`, `halt_reason`, `updated_at` 필드는 스크립트가 관리하므로 건드리지 않는다.

---

## 2. Phase 별 지침

| phase | 할 일 | 산출물 | 완료 조건 |
|---|---|---|---|
| `discover` | mission.md 범위에서 문제/아이디어 후보 5~10개 도출, 평가 기준으로 1차 점수화 | `docs/ideas/ideas-<cycle>.md` | 상위 1~3개 후보 선정 |
| `research` | 상위 후보별 경쟁 제품 3~5개 조사 (WebSearch/WebFetch). 기능·가격·리뷰의 불만·빈틈 | `docs/research/<slug>.md` | 후보별 경쟁 분석 표 + 빈틈 요약 |
| `validate` | 조사 근거로 점수 재평가, 반대 논거(왜 실패할까) 작성, 1개 선정 또는 전부 기각 | `docs/validation/<slug>.md` | 선정(→design) 또는 기각(→discover, cycle+1) 결정이 decisions.md 에 기록 |
| `design` | MVP 범위(필수/제외 기능), 사용자 시나리오, 화면 흐름, 기술 구조, 테스트 계획, 구현 작업 분해 | `docs/design/mvp.md` | 구현 작업들이 backlog 에 T-번호로 등록 |
| `implement` | backlog 의 구현 작업 1개 구현 + 해당 테스트 작성 | `product/` | 작업 단위 코드+테스트 존재 |
| `test` | 전체 테스트 실행, 실패 수정, 수동 시나리오 점검 결과 기록 | `product/` , `docs/reviews/test-<n>.md` | 테스트 전부 통과 |
| `review` | **비판적** 검토: 사용성, 버그, 보안, 성능, 미션 적합성, 경쟁 대비 가치. 문제를 심각도(치명/높음/중간/낮음)로 분류 | `docs/reviews/review-<n>.md` | 개선 작업이 backlog 에 등록 |
| `improve` | 리뷰에서 나온 가장 심각한 문제 1개 개선 | `product/` | 해당 문제 해결 + 테스트 |

### 기술 원칙 (product/)
- test 모드: 외부 의존성 없음. 순수 HTML/CSS/JS, 테스트는 `node --test product/tests/`.
- `product/README.md` 에 실행 방법 유지. `product/package.json` 의 `test` 스크립트는 `node --test tests/`.
- 로직은 DOM 과 분리된 순수 함수 모듈로 작성해 Node 에서 테스트 가능하게 한다.

---

## 3. Phase 전이 규칙 (루프)

```
discover → research → validate ─(선정)→ design → implement ⟲ (구현 작업이 남아있는 동안)
                          │                          ↓
                          └─(전부 기각)→ discover     test → review → improve → test → review …
                                  (cycle+1)                     │
                                                                └─(제품 근본 문제: pivot)→ discover (cycle+1)
```

- implement: backlog 에 `phase:"implement"` 작업이 남아 있으면 계속 implement, 없으면 → test.
- test: 실패 시 phase 유지(수정), 전부 통과 → review.
- review: 치명/높음 문제가 있으면 → improve. 없고 성공 기준(mission.md §5)을 충족하면 `product.status="mvp_done"` 으로 두고 → improve (다음 개선 루프: 사용자 가치 증대).
- improve: 개선 1건 완료 → test.
- review 에서 "이 제품은 미션에 맞지 않는다"는 근거가 강하면 pivot: decisions.md 기록 후 discover(cycle+1).
- 전이 결정은 한 줄이라도 decisions.md 에 근거를 남긴다.

---

## 4. 비판적 검토 태도
- 자기 산출물을 칭찬하지 말 것. "사용자가 왜 이걸 안 쓸까?"를 먼저 쓴다.
- 근거 없는 주장 금지: 조사 결과에는 출처 URL, 테스트에는 실제 실행 결과를 적는다.
- 확신이 낮은 판단은 "가설"로 표시하고 검증 방법을 적는다.

## 5. 안전 / 종료 조건
- 실행당 turn 한도·시간 한도가 있다(run_context.md 참조). 한도 전에 Step 4 를 끝낸다.
- 같은 작업이 3회 연속 partial 이면 작업을 더 작게 쪼개 backlog 에 다시 넣고, 원래 작업은 완료 처리한다.
- 네트워크 명령(curl/wget), 패키지 설치(test 모드), git 쓰기 명령은 허용되지 않는다.
