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
- **얕게 끝내지 마라.** turn 한도는 넉넉하게 잡혀 있다(`run_context.md` 참조). 최소한만 하고 일찍 끝내는 것은 실패다 —
  근거를 더 찾고, 반대 사례를 더 검토하고, 산출물을 더 구체적으로 쓰는 데 남은 turn을 적극적으로 써라.
  "이 정도면 충분하다"고 느껴져도 검색 각도를 하나 더 시도하거나 빠뜨린 케이스가 없는지 한 번 더 점검하라.
- 큰 작업은 중간중간 `current_task.notes` 에 "어디까지 했는지"를 갱신한다.
- turn 한도의 90%쯤 쓰였으면 새 일을 시작하지 말고 Step 4 로 간다 (그 전까지는 계속 깊이를 더한다).

### Step 3.5 — Critic 게이트 (Builder/Critic 분리, 과대평가 방지)

phase 가 `explore`, `design`, `review` 중 하나이고 이번 작업에서 **결론(선정/기각, 설계 확정, 심각도 판정)** 을 냈다면,
그 결론을 `current_task.status="done"` 으로 확정하기 전에 **Task 도구로 독립된 Critic subagent 를 1회 호출**한다
(`subagent_type: "general-purpose"`). 너(Builder)의 이번 실행 대화나 추론 과정은 Critic 에게 주지 않는다.

Critic 에게 주는 것: `mission.md` 전체와, 이번에 만든 산출물 파일 경로(들)뿐이다. 이런 지시를 내린다:

> 너는 이 문서를 만들지 않은 독립 비평가다. mission.md 의 평가 기준으로 이 문서를 처음부터 다시 채점하라.
> "이 결론이 왜 틀렸을 수 있는가"를 먼저 3가지 이상 쓴 뒤 판정하라. 근거 없는 낙관은 감점하라.
> 마지막 줄에 정확히 `PASS`, `REWORK`, 또는 `REJECT` 중 하나만 출력하라.

처리 규칙:
- `PASS` → 결론을 확정하고, Critic 의 핵심 코멘트를 `state/decisions.md` 항목에 그대로 인용한다.
- `REWORK` → `current_task.status="in_progress"` 유지, notes 에 Critic 이 지적한 구체적 결함을 적고, 같은 작업을 다음 실행에서 보완하게 한다 (3.5 를 다시 통과해야 done).
- `REJECT` → phase 전이 규칙(§3)의 "기각"/"pivot" 경로를 따른다.
- Critic 의견을 근거 없이 무시하지 않는다. 반박하려면 Critic이 못 본 새로운 근거(추가 조사 등)가 있어야 한다.
- Critic 호출 자체와 그 결과는 `state/decisions.md` 에 반드시 남긴다 (판정 + 핵심 이유 2~3줄).

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
| `explore` | **발굴·조사·검증을 한 루프로 처리** (§2.1 참조): 아이디어 도출 → 상위 후보 빠른 경쟁 조사 → 조사 근거로 즉시 재점수·판정까지 같은 실행에서 최대한 진행 | `docs/ideas/ideas-<cycle>.md`, `docs/research/<slug>.md`, `docs/validation/<slug>.md` | 1개 선정(→design) 또는 모든 후보 기각(cycle+1, `explore` 유지) 결정이 decisions.md 에 기록 |
| `design` | MVP 범위(필수/제외 기능), 사용자 시나리오, 화면 흐름, 기술 구조, 테스트 계획, 구현 작업 분해 | `docs/design/mvp.md` | 구현 작업들이 backlog 에 T-번호로 등록 |
| `implement` | backlog 의 구현 작업 1개 구현 + 해당 테스트 작성 | `product/` | 작업 단위 코드+테스트 존재 |
| `test` | 전체 테스트 실행, 실패 수정, 수동 시나리오 점검 결과 기록 | `product/` , `docs/reviews/test-<n>.md` | 테스트 전부 통과 |
| `review` | **비판적** 검토: 사용성, 버그, 보안, 성능, 미션 적합성, 경쟁 대비 가치. 문제를 심각도(치명/높음/중간/낮음)로 분류 | `docs/reviews/review-<n>.md` | 개선 작업이 backlog 에 등록 |
| `improve` | 리뷰에서 나온 가장 심각한 문제 1개 개선 | `product/` | 해당 문제 해결 + 테스트 |

### 2.1 `explore` 단계 세부 규칙 (발굴+조사+검증 통합 루프)

예전엔 discover→research→validate 를 서로 다른 phase(실행 3~4회)로 나눴지만, 이제 **phase 는 `explore` 하나**다.
한 번의 실행 안에서 아래를 **turn 예산이 허락하는 만큼 이어서** 처리하고, 못 끝낸 부분은 `current_task.notes` 에 남겨 다음 실행이 잇는다.

1. **후보가 아직 없으면 (`docs/ideas/ideas-<cycle>.md` 없음)**: mission.md 기준으로 아이디어 5~10개를 브레인스토밍하고 1차 점수화한다.
   상위 1~3개를 이 실행에서 곧바로 아래 2번으로 넘어가 조사까지 시도한다 (턴이 부족하면 여기서 멈추고 다음 실행이 2번부터 시작).
2. **상위 후보 하나를 골라 경쟁 조사**: WebSearch/WebFetch 로 경쟁 제품 **최소 5개**를 실제로 찾아 각각 기능·가격·리뷰(앱스토어 리뷰, 커뮤니티 불만 스레드 등)를 검색해 `docs/research/<slug>.md` 에 정리한다.
   한두 번 검색해서 그럴듯한 답이 나왔다고 멈추지 마라. 검색어를 바꿔가며(예: "<제품군> alternatives", "<제품군> complaints/reviews", "<경쟁사명> vs") 여러 각도로 파고들어 근거를 두껍게 쌓는다. turn 예산은 아끼라고 준 게 아니라 이 조사에 쓰라고 준 것이다.
3. **같은 실행에서 곧바로 재점수·판정**: 조사 근거로 평가 기준을 다시 매기고, "왜 실패할까" 반대 논거를 **최소 3가지**, 각각 근거(어떤 검색 결과·리뷰에서 나온 얘기인지)와 함께 쓴 뒤 `docs/validation/<slug>.md` 에 선정/기각 결론을 낸다.
   이 결론에는 §1 Step 3.5 Critic 게이트가 적용된다.
4. 한 후보가 기각되면 다음 우선순위 후보로 2~3번을 반복한다(턴이 남는 한). 모든 후보가 기각되면 §3 규칙대로 `cycle+1` 하고 1번으로 되돌아간다.
5. 하나가 선정되고 Critic 이 `PASS` 하면 `phase="design"` 으로 전이한다.

### 기술 원칙 (product/) — Expo (React Native)
- `npx create-expo-app` 기반의 **managed workflow** 를 쓴다. `ios/`, `android/` 네이티브 디렉터리를 생성하는
  prebuild/eject 는 하지 않는다 (Mac/Xcode 없이 유지보수해야 하므로).
- 실행/확인: `npx expo start` → 아이폰의 **Expo Go** 앱으로 QR 스캔. `product/README.md` 에 이 방법을 항상 최신으로 유지한다.
- 로직은 컴포넌트와 분리된 순수 함수/훅 모듈로 작성한다. 테스트는 `jest-expo` 프리셋으로 `product/` 안에서 `npm test` (컴포넌트 트리는 최소, 순수 로직 위주로 테스트).
- 저장이 필요하면 `@react-native-async-storage/async-storage` (로컬 저장, 서버 없음). 유료 API·서버 호출 금지 (mission.md §3).
- 패키지는 `npx expo install <pkg>` 로 추가한다 (Expo SDK 버전과 호환되는 버전을 맞춰줌). 한 실행에서 꼭 필요한 것만 추가한다.

---

## 3. Phase 전이 규칙 (루프)

```
explore(발굴+조사+검증, §2.1) ─(선정, Critic PASS)→ design → implement ⟲ (구현 작업이 남아있는 동안)
        │                                                  ↓
        └─(모든 후보 기각)→ explore(cycle+1)             test → review → improve → test → review …
                                                                  │
                                                                  └─(제품 근본 문제: pivot)→ explore (cycle+1)
```

사람의 승인 없이 완전 자율로 진행한다: `explore` 에서 아이디어를 선정하고 Critic 이 `PASS` 를 주면 곧바로 `design` 으로 전이한다.
(사람이 방향을 바꾸고 싶으면 `mission.md` 수정, `state/inbox.md` 지시, 또는 `paused`/`reset_halt` 로 개입할 수 있다 — 이건 언제든 가능하지만 필수 관문은 아니다.)

- implement: backlog 에 `phase:"implement"` 작업이 남아 있으면 계속 implement, 없으면 → test.
- test: 실패 시 phase 유지(수정), 전부 통과 → review.
- review: 치명/높음 문제가 있으면 → improve. 없고 성공 기준(mission.md §5)을 충족하면 `product.status="mvp_done"` 으로 두고 → improve (다음 개선 루프: 사용자 가치 증대).
- improve: 개선 1건 완료 → test.
- review 에서 "이 제품은 미션에 맞지 않는다"는 근거가 강하면 pivot: decisions.md 기록 후 explore(cycle+1).
- 전이 결정은 한 줄이라도 decisions.md 에 근거를 남긴다.
- `explore`/`design`/`review` 의 결론은 위 §1 Step 3.5 Critic 게이트를 `PASS` 로 통과해야 phase 를 전이한다. `REWORK` 는 같은 phase 에 머문다.

## 3.1 실행 빈도와 예산 (시간당 1회 운영)
- Routine 은 1시간에 1번만 돈다. 다음 실행까지 한 시간을 그냥 버리는 것보다, 이번 실행에서 깊이 파는 게 항상 이득이다.
  **작업을 짧게 끝내서 turn 을 남기지 마라** — 남은 turn 은 다음 실행을 위해 아껴두는 게 아니라 지금 품질을 높이는 데 쓰는 것이다.
- Critic 게이트가 있는 작업(Step 3.5)은 Critic 호출도 turn 을 쓰므로, Builder 본 작업은 turn 한도의 약 75~80% 안에서 끝내고 나머지를 Critic 에게 남긴다.
  Critic 게이트가 없는 작업(implement 등)은 turn 한도의 90%까지 자유롭게 써도 된다.
- 실행이 몰려서 이전 실행이 아직 끝나지 않았다면(다음 실행 시작 시 `state/run` 이 남아있고 방금 시작된 경우) 겹쳐 실행하지 말고
  `state/inbox.md` 에 "겹침 감지, 이번 실행 skip" 을 기록한 뒤 즉시 종료한다 (Step 3.5, 구현 없이 바로 Step 4).

---

## 4. 비판적 검토 태도
- 자기 산출물을 칭찬하지 말 것. "사용자가 왜 이걸 안 쓸까?"를 먼저 쓴다.
- 근거 없는 주장 금지: 조사 결과에는 출처 URL, 테스트에는 실제 실행 결과를 적는다.
- 확신이 낮은 판단은 "가설"로 표시하고 검증 방법을 적는다.
- (Critic 역할일 때) 한두 줄로 판정을 내리지 마라. 실패 시나리오를 최소 3개, 각각 구체적인 입력/상황과 왜 실패하는지를 적고,
  가능하면 직접 검색해서 반박 근거를 찾아본 뒤 판정하라. 짧고 두루뭉술한 REWORK/PASS 사유는 그 자체로 부실한 검토다.

## 5. 안전 / 종료 조건
- 실행당 turn 한도·시간 한도가 있다(run_context.md 참조). 한도 전에 Step 4 를 끝낸다.
- 같은 작업이 3회 연속 partial 이면 작업을 더 작게 쪼개 backlog 에 다시 넣고, 원래 작업은 완료 처리한다.
- 네트워크 명령(curl/wget), 패키지 설치(test 모드), git 쓰기 명령은 허용되지 않는다.
