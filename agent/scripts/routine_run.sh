#!/usr/bin/env bash
# Run one agent iteration from a Claude Code Routine session (uses the Claude subscription,
# no API key). Mirrors .github/workflows/agent.yml:
#
#   bash agent/scripts/routine_run.sh start           # prepare branch, gate, print the prompt
#   ... Claude does exactly one task following the prompt / CLAUDE.md ...
#   bash agent/scripts/routine_run.sh finish success  # or: finish failure
#
# Exit code of `start`: 0 = run the task, 3 = skip (paused/halted/limit), other = error.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
TMP="${TMPDIR:-/tmp}/product-agent"
mkdir -p "$TMP"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

cfg() { python3 -c "import json;print(json.load(open('state/config.json')).get('$1','$2'))"; }

push_branch() {
  local branch="$1"
  for i in 1 2 3 4; do
    if git push -u origin "HEAD:$branch"; then return 0; fi
    sleep $((2 ** i))
    git pull --rebase origin "$branch" || true
  done
  echo "push failed after retries" >&2
  return 1
}

ensure_git_identity() {
  git config user.name >/dev/null || git config user.name "product-agent[bot]"
  git config user.email >/dev/null || git config user.email "product-agent@users.noreply.github.com"
}

cmd_start() {
  # Hard technical guard against looping within one long-lived Routine session: at most one
  # task attempt begins per UTC hour in this container, no matter what the model does or how
  # many times it calls `start`. This does not depend on the model obeying "one task, then
  # stop" — it is enforced here regardless.
  local cur_hour lock_file
  cur_hour=$(date -u +%Y%m%d%H)
  lock_file="$TMP/last_run_hour"
  if [ -f "$lock_file" ] && [ "$(cat "$lock_file")" = "$cur_hour" ]; then
    echo "SKIP: a task attempt already started in this container during UTC hour $cur_hour; refusing to start another (loop guard)."
    exit 3
  fi

  ensure_git_identity
  git fetch -q origin "$DEFAULT_BRANCH"
  # Branch choice comes from the human-owned config on the default branch.
  local branch
  branch=$(git show "origin/$DEFAULT_BRANCH:state/config.json" | python3 -c "
import json,sys;c=json.load(sys.stdin)
print('$DEFAULT_BRANCH' if c.get('commit_target')=='default_branch' else c.get('work_branch','agent/work'))")

  if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    git fetch -q origin "$branch"
    git checkout -q -B "$branch" "origin/$branch"
    if [ "$branch" != "$DEFAULT_BRANCH" ]; then
      # Sync human-owned config and harness files from the default branch.
      git checkout -q "origin/$DEFAULT_BRANCH" -- agent CLAUDE.md mission.md state/config.json
      git diff --cached --quiet || git commit -qm "agent: sync harness and config from $DEFAULT_BRANCH"
    fi
  else
    git checkout -q -B "$branch" "origin/$DEFAULT_BRANCH"
  fi
  echo "$branch" > "$TMP/branch"

  : > "$TMP/out"
  [ -f "$TMP/issues.json" ] || echo "[]" > "$TMP/issues.json"
  EVENT_NAME=routine GITHUB_OUTPUT="$TMP/out" ISSUES_FILE="$TMP/issues.json" \
    python3 agent/scripts/preflight.py

  if grep -q '^true$' <(sed -n '/^skip<</{n;p}' "$TMP/out"); then
    git add -A
    git diff --cached --quiet || { git commit -qm "agent: preflight bookkeeping"; push_branch "$branch"; }
    echo "SKIP: $(sed -n '/^skip_reason<</{n;p}' "$TMP/out")"
    exit 3
  fi

  # Lock the hour now: this is the point of no return for this container this hour, whether
  # the task below succeeds, fails, or the session gets interrupted mid-way.
  echo "$cur_hour" > "$lock_file"

  # Checkpoint: if this session dies, the next run sees the unfinished run marker (RECOVERY).
  local n
  n=$(sed -n '/^run_number<</{n;p}' "$TMP/out")
  git add -A
  git commit -qm "agent(run #$n): started"
  push_branch "$branch"

  echo "================ AGENT PROMPT (Run #$n, branch $branch) ================"
  sed -n '/^prompt<</,/^EOF_AGENT_OUTPUT_9f3c$/p' "$TMP/out" | sed '1d;$d'
  echo "========================================================================"
}

cmd_finish() {
  local outcome="${1:-success}"
  ensure_git_identity
  local branch
  branch=$(cat "$TMP/branch" 2>/dev/null || cfg work_branch agent/work)
  # Protect the harness before running it.
  git checkout -q HEAD -- agent .github state/config.json 2>/dev/null || true
  git clean -fdq -- agent .github || true

  CLAUDE_OUTCOME="$outcome" COMMIT_MSG_FILE="$TMP/commit_msg.txt" \
    ISSUE_REPLIES_FILE="$TMP/issue_replies.json" RUN_URL="${RUN_URL:-}" \
    python3 agent/scripts/postflight.py
  python3 agent/scripts/validate_state.py || echo "WARNING: state validation reported problems"

  git add -A
  git diff --cached --quiet || git commit -q -F "$TMP/commit_msg.txt"
  push_branch "$branch"
  echo "Issue replies to post (comment + close with GitHub tools): $(cat "$TMP/issue_replies.json")"
  rm -f "$TMP/issues.json"
}

case "${1:-}" in
  start) cmd_start ;;
  finish) shift; cmd_finish "$@" ;;
  *) echo "usage: $0 start | finish [success|failure]" >&2; exit 2 ;;
esac
