"""Shared helpers for the autonomous product agent harness (stdlib only)."""

from __future__ import annotations

import datetime as _dt
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(os.environ.get("AGENT_ROOT", Path(__file__).resolve().parents[2]))
STATE_DIR = ROOT / "state"
CONFIG_PATH = STATE_DIR / "config.json"
STATE_PATH = STATE_DIR / "state.json"
PROGRESS_PATH = STATE_DIR / "progress.md"
DECISIONS_PATH = STATE_DIR / "decisions.md"
INBOX_PATH = STATE_DIR / "inbox.md"
RUN_CONTEXT_PATH = STATE_DIR / "run_context.md"
RUNS_LOG_PATH = STATE_DIR / "runs.jsonl"
STATUS_PATH = STATE_DIR / "STATUS.md"
PROMPT_TEMPLATE_PATH = ROOT / "agent" / "prompts" / "run.md"

PHASES = ["explore", "design", "implement", "test", "review", "improve"]
TASK_STATUSES = ["in_progress", "blocked", "done"]
MODES = ["test", "live"]
MAX_COMPLETED_TASKS = 20

STATE_REQUIRED_KEYS = [
    "schema_version", "phase", "cycle", "product", "current_task", "backlog",
    "completed_tasks", "run_summary", "handled_issues", "run", "last_run",
    "stats", "halted", "halt_reason",
]
STATS_KEYS = ["total_runs", "successful_runs", "failed_runs", "consecutive_failures"]


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, path)


def git(*args: str, check: bool = False) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=check)


def git_show_head(rel_path: str) -> str | None:
    """Return the file content at HEAD, or None if unavailable."""
    res = git("show", f"HEAD:{rel_path}")
    return res.stdout if res.returncode == 0 else None


def validate_config(cfg: dict) -> list[str]:
    errors = []
    if cfg.get("mode") not in MODES:
        errors.append(f"config.mode must be one of {MODES}")
    for key in ("paused", "schedule_enabled"):
        if not isinstance(cfg.get(key), bool):
            errors.append(f"config.{key} must be true/false")
    if cfg.get("commit_target") not in ("work_branch", "default_branch"):
        errors.append("config.commit_target must be 'work_branch' or 'default_branch'")
    for key in ("max_total_runs", "max_consecutive_failures"):
        if not isinstance(cfg.get(key), int) or cfg.get(key) < 1:
            errors.append(f"config.{key} must be a positive integer")
    profiles = cfg.get("profiles", {})
    for mode in MODES:
        p = profiles.get(mode)
        if not isinstance(p, dict):
            errors.append(f"config.profiles.{mode} missing")
            continue
        if not isinstance(p.get("max_turns"), int) or p["max_turns"] < 1:
            errors.append(f"config.profiles.{mode}.max_turns must be a positive integer")
        if not isinstance(p.get("allowed_tools"), list):
            errors.append(f"config.profiles.{mode}.allowed_tools must be a list")
    return errors


def _validate_task(task, where: str) -> list[str]:
    errors = []
    if not isinstance(task, dict):
        return [f"{where} must be an object"]
    for key in ("id", "title", "phase"):
        if not isinstance(task.get(key), str) or not task.get(key):
            errors.append(f"{where}.{key} must be a non-empty string")
    if task.get("phase") and task.get("phase") not in PHASES:
        errors.append(f"{where}.phase '{task.get('phase')}' not in {PHASES}")
    return errors


def validate_state(state: dict) -> list[str]:
    errors = []
    for key in STATE_REQUIRED_KEYS:
        if key not in state:
            errors.append(f"state.{key} is missing")
    if errors:
        return errors
    if state["phase"] not in PHASES:
        errors.append(f"state.phase '{state['phase']}' not in {PHASES}")
    if not isinstance(state["cycle"], int) or state["cycle"] < 1:
        errors.append("state.cycle must be a positive integer")
    if not isinstance(state["product"], dict):
        errors.append("state.product must be an object")
    ct = state["current_task"]
    if ct is not None:
        errors += _validate_task(ct, "state.current_task")
        if isinstance(ct, dict) and ct.get("status") not in TASK_STATUSES:
            errors.append(f"state.current_task.status must be one of {TASK_STATUSES}")
    if not isinstance(state["backlog"], list):
        errors.append("state.backlog must be a list")
    else:
        for i, t in enumerate(state["backlog"]):
            errors += _validate_task(t, f"state.backlog[{i}]")
    if not isinstance(state["completed_tasks"], list):
        errors.append("state.completed_tasks must be a list")
    if not isinstance(state["run_summary"], str):
        errors.append("state.run_summary must be a string")
    if not isinstance(state["handled_issues"], list):
        errors.append("state.handled_issues must be a list")
    else:
        for i, h in enumerate(state["handled_issues"]):
            if not isinstance(h, dict) or not isinstance(h.get("number"), int):
                errors.append(f"state.handled_issues[{i}] must be {{\"number\": int, \"reply\": str}}")
    stats = state["stats"]
    if not isinstance(stats, dict) or any(not isinstance(stats.get(k), int) for k in STATS_KEYS):
        errors.append(f"state.stats must contain integer keys {STATS_KEYS}")
    if not isinstance(state["halted"], bool):
        errors.append("state.halted must be true/false")
    return errors


def append_only_violations() -> list[str]:
    """progress.md / decisions.md must keep their committed content as a prefix."""
    problems = []
    for path in (PROGRESS_PATH, DECISIONS_PATH):
        rel = path.relative_to(ROOT).as_posix()
        before = git_show_head(rel)
        if before is None or not path.exists():
            continue
        after = path.read_text(encoding="utf-8")
        if not after.startswith(before.rstrip("\n")):
            problems.append(f"{rel} is append-only: existing entries were modified or removed")
    return problems


def write_output(name: str, value: str) -> None:
    """Write a (possibly multi-line) step output for GitHub Actions."""
    out = os.environ.get("GITHUB_OUTPUT")
    if not out:
        print(f"[output] {name}={value[:200]}")
        return
    delim = "EOF_AGENT_OUTPUT_9f3c"
    with open(out, "a", encoding="utf-8") as f:
        f.write(f"{name}<<{delim}\n{value}\n{delim}\n")


def render_status(state: dict, cfg: dict) -> str:
    ct = state.get("current_task")
    lr = state.get("last_run") or {}
    stats = state.get("stats", {})
    product = state.get("product") or {}
    lines = [
        "# Agent Status",
        "",
        "> 자동 생성 파일 (postflight). 직접 수정하지 마세요.",
        "",
        f"- **Mode**: `{cfg.get('mode')}` | paused: `{cfg.get('paused')}` | schedule: `{cfg.get('schedule_enabled')}`",
        f"- **Phase**: `{state.get('phase')}` (cycle {state.get('cycle')})",
        f"- **Product**: {product.get('name') or '(미정)'} — {product.get('one_liner') or ''} [{product.get('status')}]",
        f"- **Runs**: total {stats.get('total_runs')} / max {cfg.get('max_total_runs')}, "
        f"success {stats.get('successful_runs')}, failed {stats.get('failed_runs')}, "
        f"consecutive failures {stats.get('consecutive_failures')}",
    ]
    if state.get("halted"):
        lines.append(f"- ⛔ **HALTED**: {state.get('halt_reason')} → Run workflow 에서 `reset_halt` 체크 후 실행하면 재개")
    if lr:
        lines.append(f"- **Last run**: #{lr.get('number')} `{lr.get('outcome')}` at {lr.get('ended_at')} — {lr.get('summary') or ''}")
        if lr.get("url"):
            lines.append(f"  - log: {lr.get('url')}")
    lines += ["", "## Current task"]
    if ct:
        lines.append(f"- `{ct.get('id')}` [{ct.get('status')}] {ct.get('title')} (phase {ct.get('phase')})")
        if ct.get("status") == "blocked":
            lines.append(f"- 🙋 **사람의 결정 필요**: {ct.get('notes')}")
        elif ct.get("notes"):
            lines.append(f"- notes: {ct.get('notes')}")
    else:
        lines.append("- (없음 — 다음 실행에서 backlog 에서 선택)")
    lines += ["", "## Backlog (top 10)"]
    backlog = sorted(state.get("backlog") or [], key=lambda t: t.get("priority", 99))
    if backlog:
        for t in backlog[:10]:
            lines.append(f"- `{t.get('id')}` p{t.get('priority', '-')} [{t.get('phase')}] {t.get('title')}")
    else:
        lines.append("- (비어 있음)")
    lines += ["", "## Recently completed"]
    for t in (state.get("completed_tasks") or [])[:5]:
        lines.append(f"- `{t.get('id')}` [{t.get('phase')}] {t.get('title')}")
    return "\n".join(lines) + "\n"
