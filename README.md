# autonomous-product-agent

자율적으로 제품을 **발굴 → 경쟁 조사 → 검증 → MVP 설계 → 구현 → 테스트 → 비판적 검토 → 개선** 하는
Claude Code 에이전트. GitHub Actions 에서 실행되며, 사람은 iPhone(GitHub 앱/웹)만으로 운영할 수 있습니다.

## 빠른 확인
- 현재 상태: [`state/STATUS.md`](state/STATUS.md) (첫 실행 후 생성)
- 진행 기록: [`state/progress.md`](state/progress.md) · 결정 기록: [`state/decisions.md`](state/decisions.md)
- 미션(방향 설정): [`mission.md`](mission.md) · 에이전트 규칙: [`CLAUDE.md`](CLAUDE.md)

## 구조
```
CLAUDE.md                  에이전트 운영 규칙·실행 프로토콜·phase 루프
mission.md                 제품 방향/제약/평가 기준 (사람 소유)
state/config.json          모드(test/live), 일시정지, 스케줄, 한도 (사람 소유)
state/state.json           기계용 상태: phase, current_task, backlog, 통계
state/progress.md          실행별 진행 로그 (append-only)
state/decisions.md         의사결정 로그 (append-only)
state/inbox.md             사람 → 에이전트 지시
state/run_context.md       preflight 가 매 실행 생성하는 실행 정보
state/STATUS.md            postflight 가 생성하는 요약 대시보드
state/runs.jsonl           실행 이력 (자동)
agent/scripts/             preflight / postflight / validate_state (Python stdlib)
agent/prompts/run.md       Claude 에게 주는 실행 프롬프트 템플릿
agent/tests/               하네스 테스트
.github/workflows/agent.yml          에이전트 실행 workflow
.github/workflows/agent-selftest.yml 하네스 자체 테스트 (Claude 호출 없음)
docs/{ideas,research,validation,design,reviews}/  단계별 산출물
product/                   에이전트가 만드는 제품 코드
```

## 운영 (iPhone)
- 실행: Actions → **Autonomous Product Agent** → Run workflow
- 지시: `agent-inbox` 라벨을 붙인 Issue 작성, 또는 Run workflow 의 `instruction` 입력
- 정지: `state/config.json` 에서 `"paused": true`
- 자동 실행: `state/config.json` 에서 `"schedule_enabled": true` (6시간마다)

## 실행 방식 2가지
1. **Claude Code Routine (Claude 요금제 사용, API 키 불필요)** — claude.ai/code 의 Routine 이 예약 시각에 새 세션을 열고
   `bash agent/scripts/routine_run.sh start` → 작업 1개 수행 → `bash agent/scripts/routine_run.sh finish success` 를 실행.
   Routine 관리(주기 변경/중지): claude.ai/code 의 Routines 메뉴.
2. **GitHub Actions** (`.github/workflows/agent.yml`) — `ANTHROPIC_API_KEY` 또는 `CLAUDE_CODE_OAUTH_TOKEN` Secret 필요.

두 방식 모두 같은 `state/` 와 `agent/work` 브랜치를 사용하므로 섞어 써도 이어서 작업합니다.
