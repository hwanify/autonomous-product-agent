# Inbox — 사람 → Agent 지시사항

사람이 에이전트에게 전달할 지시를 적는 곳입니다. 방법은 세 가지:

1. **GitHub Issue** 에 `agent-inbox` 라벨을 붙여 생성 (iPhone에서 가장 쉬움). 에이전트가 처리 후 댓글을 달고 닫습니다.
2. **Actions → Autonomous Product Agent → Run workflow** 의 `instruction` 입력칸에 입력. 아래 "Pending" 에 자동으로 추가됩니다.
3. 이 파일을 직접 편집 (Pending 아래에 `- [ ] 지시 내용` 추가).

에이전트는 처리한 항목을 `- [x]` 로 바꾸고 "Handled" 로 옮기며, 처리 결과를 한 줄 덧붙입니다.

## 아이디어 승인 (필수)

`state/STATUS.md` 에 "🙋 사람의 결정 필요"와 함께 `승인 대기: T-00X ...`가 보이면, 여기 Pending 에 아래 형식으로 한 줄 추가하세요.
승인 전까지 에이전트는 그 아이디어의 설계/구현을 시작하지 않습니다.

```
- [ ] 승인: T-00X
- [ ] 거부: T-00X (이유: ...)
```

## Pending

## Handled
