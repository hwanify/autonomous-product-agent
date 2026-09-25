#!/usr/bin/env python3
"""Post-run step (always runs): repair/record state so the next run can resume.

Environment:
  CLAUDE_OUTCOME    success | failure | cancelled | skipped | dry_run
  COMMIT_MSG_FILE   where to write the commit message
  ISSUE_REPLIES_FILE where to write handled issues ([{number, reply}]) for the workflow
  RUN_URL           link to this Actions run
"""

from __future__ import annotations

import json
import os
import shutil
import sys

from common import (
    CONFIG_PATH, MAX_COMPLETED_TASKS, ROOT, RUNS_LOG_PATH, STATE_PATH, STATUS_PATH,
    append_only_violations, git, git_show_head, load_json, now_iso, render_status,
    save_json, validate_state,
)


def revert_protected_paths(protected: list[str]) -> list[str]:
    """Undo any agent changes under protected paths. Returns the reverted paths."""
    res = git("status", "--porcelain", "--untracked-files=all")
    reverted = []
    for line in res.stdout.splitlines():
        path = line[3:].strip().strip('"')
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if not any(path == p or (p.endswith("/") and path.startswith(p)) for p in protected):
            continue
        if line.startswith("??"):
            target = ROOT / path
            if target.is_dir():
                shutil.rmtree(target, ignore_errors=True)
            elif target.exists():
                target.unlink()
        else:
            git("checkout", "HEAD", "--", path)
        reverted.append(path)
    return reverted


def load_state_or_restore(notes: list[str]) -> tuple[dict, bool]:
    """Load state.json; if the agent corrupted it, fall back to the committed version."""
    try:
        state = load_json(STATE_PATH)
        errs = validate_state(state)
        if not errs:
            return state, True
        notes.append("state.json invalid after run: " + "; ".join(errs[:5]))
    except (OSError, json.JSONDecodeError) as e:
        notes.append(f"state.json unreadable after run: {e}")
    committed = git_show_head("state/state.json")
    state = json.loads(committed) if committed else load_json(STATE_PATH)
    notes.append("state.json restored from last commit")
    return state, False


def main() -> int:
    outcome = os.environ.get("CLAUDE_OUTCOME", "failure") or "failure"
    cfg = load_json(CONFIG_PATH)
    notes: list[str] = []

    reverted = revert_protected_paths(cfg.get("protected_paths", []))
    if reverted:
        notes.append("reverted protected paths: " + ", ".join(reverted))

    state, state_ok = load_state_or_restore(notes)
    if not state_ok and outcome == "success":
        outcome = "failure"
    notes += append_only_violations()

    run = state.get("run") or {}
    run_number = run.get("number") or state["stats"]["total_runs"] + 1
    dry_run = outcome == "dry_run" or run.get("dry_run")
    summary = (state.get("run_summary") or "").strip().splitlines()[0:1]
    summary = summary[0][:100] if summary else ""

    if not dry_run:
        stats = state["stats"]
        stats["total_runs"] = max(stats["total_runs"], run_number)
        if outcome == "success":
            stats["successful_runs"] += 1
            stats["consecutive_failures"] = 0
        else:
            stats["failed_runs"] += 1
            stats["consecutive_failures"] += 1
            if stats["consecutive_failures"] >= cfg["max_consecutive_failures"]:
                state["halted"] = True
                state["halt_reason"] = (f"{stats['consecutive_failures']} consecutive failed runs "
                                        f"(last: run #{run_number}, {outcome})")

    ct = state.get("current_task")
    if ct and ct.get("status") == "done":
        # Agent marked it done but forgot to move it: finish the bookkeeping.
        state["completed_tasks"].insert(0, {"id": ct["id"], "title": ct["title"],
                                            "phase": ct["phase"], "run": run_number})
        state["current_task"] = None
    state["completed_tasks"] = state["completed_tasks"][:MAX_COMPLETED_TASKS]

    handled = state.get("handled_issues") or []
    replies_file = os.environ.get("ISSUE_REPLIES_FILE")
    if replies_file:
        with open(replies_file, "w", encoding="utf-8") as f:
            json.dump(handled, f, ensure_ascii=False)
    state["handled_issues"] = []

    ended = now_iso()
    state["last_run"] = {
        "number": run_number,
        "outcome": "dry_run" if dry_run else outcome,
        "mode": run.get("mode"),
        "started_at": run.get("started_at"),
        "ended_at": ended,
        "phase": state["phase"],
        "summary": summary,
        "url": os.environ.get("RUN_URL") or run.get("url"),
        "notes": notes,
    }
    state["run"] = None
    state["run_summary"] = ""
    state["updated_at"] = ended
    save_json(STATE_PATH, state)

    with open(RUNS_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(state["last_run"], ensure_ascii=False) + "\n")

    status = render_status(state, cfg)
    STATUS_PATH.write_text(status, encoding="utf-8")
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as f:
            f.write(status)
            if notes:
                f.write("\n## Postflight notes\n" + "\n".join(f"- {n}" for n in notes) + "\n")

    label = "dry-run" if dry_run else outcome
    if outcome == "success" and summary:
        subject = f"agent(run #{run_number}, {state['phase']}): {summary}"
    else:
        subject = f"agent(run #{run_number}): {label} - state saved for next run"
    body = "\n".join([
        f"Outcome: {label}",
        f"Phase: {state['phase']} (cycle {state['cycle']})",
        f"Current task: {(state.get('current_task') or {}).get('id') or '-'}",
        f"Run: {state['last_run']['url'] or '-'}",
        *([f"Note: {n}" for n in notes]),
    ])
    msg_file = os.environ.get("COMMIT_MSG_FILE")
    if msg_file:
        with open(msg_file, "w", encoding="utf-8") as f:
            f.write(subject[:120] + "\n\n" + body + "\n")

    print(subject)
    for n in notes:
        print(f"note: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
