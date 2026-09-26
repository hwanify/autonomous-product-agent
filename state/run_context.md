# Run Context — Run #18

> preflight 가 매 실행마다 새로 생성하는 파일입니다.

- 시작 시각: 2026-09-26T09:37:04Z
- 모드: **test**
- turn 한도: **90** (80% 전에 기록 단계로)
- 현재 phase: `test` / cycle 1
- 누적 실행: 17 / 최대 500
- 이전 실행: #17 `success` — Test: fixed missing npm install step in README (D-016), T-015 still blocked

## TEST 모드 제한
- npm/npx 는 허용되지만 (Expo 앱이라 필요) pip install 은 금지. git push/commit 은 여전히 금지.
- 작업 범위를 작게 유지하라. 한 번에 한 개 작업만.

