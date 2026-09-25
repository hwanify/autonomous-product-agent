#!/usr/bin/env python3
"""Pre-run step: decide whether to run, mark the run as started, and build the prompt.

Environment (all optional):
  EVENT_NAME         github.event_name (schedule | workflow_dispatch | ...)
  INPUT_MODE         "", "test" or "live" (manual override)
  INPUT_INSTRUCTION  free-text instruction appended to state/inbox.md
  INPUT_DRY_RUN      "true" to skip the Claude step (pipeline check only)
  INPUT_RESET_HALT   "true" to clear a halted state
  ISSUES_FILE        path to JSON from `gh issue list --json number,title,body,url`
  RUN_URL            link to this Actions run

Outputs (GITHUB_OUTPUT): skip, skip_reason, dry_run, mode, run_number, max_turns,
claude_args, prompt.
"""

from __future__ import annotations

import json
import os
import shlex
import sys

from common import (
    CONFIG_PATH, INBOX_PATH, PROMPT_TEMPLATE_PATH, RUN_CONTEXT_PATH, STATE_PATH,
    load_json, now_iso, save_json, validate_config, validate_state, write_output,
)


def env_bool(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes")


def skip(reason: str) -> int:
    print(f"SKIP: {reason}")
    write_output("skip", "true")
    write_output("skip_reason", reason)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(f"## Agent run skipped\n\n{reason}\n")
    return 0


def load_issues() -> list[dict]:
    path = os.environ.get("ISSUES_FILE")
    if not path or not os.path.exists(path):
        return []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def append_instruction(text: str) -> None:
    content = INBOX_PATH.read_text(encoding="utf-8")
    item = f"- [ ] ({now_iso()}, via Run workflow) {text.strip()}"
    marker = "## Pending"
    if marker in content:
        head, tail = content.split(marker, 1)
        rest = tail.lstrip("\n")
        content = f"{head}{marker}\n\n{item}\n" + (f"\n{rest}" if rest else "")
    else:
        content = content.rstrip("\n") + f"\n\n{marker}\n\n{item}\n"
    INBOX_PATH.write_text(content, encoding="utf-8")


def build_claude_args(profile: dict, model: str) -> str:
    args = ["--max-turns", str(profile["max_turns"])]
    if profile.get("allowed_tools"):
        args += ["--allowedTools", ",".join(profile["allowed_tools"])]
    if profile.get("disallowed_tools"):
        args += ["--disallowedTools", ",".join(profile["disallowed_tools"])]
    if model:
        args += ["--model", model]
    return " ".join(shlex.quote(a) for a in args)


def build_run_context(state: dict, cfg: dict, mode: str, run_number: int, profile: dict,
                      recovery: bool, issues: list[dict]) -> str:
    ct = state.get("current_task")
    lr = state.get("last_run") or {}
    lines = [
        f"# Run Context — Run #{run_number}",
        "",
        "> preflight 가 매 실행마다 새로 생성하는 파일입니다.",
        "",
        f"- 시작 시각: {now_iso()}",
        f"- 모드: **{mode}**",
        f"- turn 한도: **{profile['max_turns']}** (80% 전에 기록 단계로)",
        f"- 현재 phase: `{state['phase']}` / cycle {state['cycle']}",
        f"- 누적 실행: {state['stats']['total_runs']} / 최대 {cfg['max_total_runs']}",
        f"- 이전 실행: " + (f"#{lr.get('number')} `{lr.get('outcome')}` — {lr.get('summary') or ''}" if lr else "없음 (첫 실행)"),
        "",
    ]
    if mode == "test":
        lines += [
            "## TEST 모드 제한",
            "- 외부 패키지 설치 금지 (npm/pip install 불가). 순수 JS + `node --test` 사용.",
            "- 작업 범위를 작게 유지하라. 한 번에 한 개 작업만.",
            "",
        ]
    if recovery:
        lines += [
            "## ⚠️ RECOVERY",
            "이전 실행이 실패했거나 작업이 끝나지 않았다. 아래 작업을 먼저 이어서 하라.",
            f"- 작업: `{(ct or {}).get('id')}` {(ct or {}).get('title')}",
            f"- 재개 메모: {(ct or {}).get('notes') or '(없음) — 산출물 파일과 git log 로 진행 상황을 파악하라'}",
            f"- 이전 실행 결과: {lr.get('outcome')}",
            "",
        ]
    if issues:
        lines += [
            "## 사람의 지시 (GitHub Issues, 라벨 inbox)",
            "처리 후 `state.json.handled_issues` 에 `{\"number\": N, \"reply\": \"처리 결과 요약\"}` 을 추가하라.",
            "",
        ]
        for it in issues:
            body = (it.get("body") or "").strip()
            if len(body) > 2000:
                body = body[:2000] + " …(생략)"
            lines += [f"### Issue #{it.get('number')}: {it.get('title')}", body or "(본문 없음)", ""]
    return "\n".join(lines) + "\n"


def main() -> int:
    cfg = load_json(CONFIG_PATH)
    errs = validate_config(cfg)
    if errs:
        print("config.json invalid:\n  " + "\n  ".join(errs))
        return 1
    state = load_json(STATE_PATH)
    errs = validate_state(state)
    if errs:
        print("state.json invalid:\n  " + "\n  ".join(errs))
        return 1

    event = os.environ.get("EVENT_NAME", "workflow_dispatch")
    dry_run = env_bool("INPUT_DRY_RUN")
    changed = False

    if env_bool("INPUT_RESET_HALT") and state.get("halted"):
        state["halted"] = False
        state["halt_reason"] = None
        state["stats"]["consecutive_failures"] = 0
        changed = True
        print("halt cleared by manual reset")

    # ---- termination / gating conditions -------------------------------------------
    reason = None
    if cfg["paused"]:
        reason = "config.paused is true (state/config.json)"
    elif event == "schedule" and not cfg["schedule_enabled"]:
        reason = "scheduled run ignored: config.schedule_enabled is false"
    elif state.get("halted"):
        reason = f"agent halted: {state.get('halt_reason')} (Run workflow with reset_halt=true to resume)"
    elif state["stats"]["total_runs"] >= cfg["max_total_runs"] and not dry_run:
        reason = f"max_total_runs reached ({cfg['max_total_runs']}). Raise it in state/config.json to continue."
    if reason:
        if changed:
            save_json(STATE_PATH, state)
        return skip(reason)

    mode = os.environ.get("INPUT_MODE", "").strip() or cfg["mode"]
    if mode not in cfg["profiles"]:
        print(f"unknown mode {mode}")
        return 1
    profile = cfg["profiles"][mode]
    run_number = state["stats"]["total_runs"] + 1

    instruction = os.environ.get("INPUT_INSTRUCTION", "").strip()
    if instruction:
        append_instruction(instruction)

    lr = state.get("last_run") or {}
    ct = state.get("current_task")
    recovery = bool(ct and ct.get("status") == "in_progress") or lr.get("outcome") in ("failure", "cancelled")

    issues = load_issues()
    RUN_CONTEXT_PATH.write_text(
        build_run_context(state, cfg, mode, run_number, profile, recovery, issues), encoding="utf-8")

    state["run"] = {
        "number": run_number,
        "mode": mode,
        "status": "running",
        "started_at": now_iso(),
        "event": event,
        "dry_run": dry_run,
        "recovery": recovery,
        "url": os.environ.get("RUN_URL"),
        "issues": [i.get("number") for i in issues],
    }
    save_json(STATE_PATH, state)

    template = PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")
    prompt = template.format(
        run_number=run_number,
        mode=mode,
        max_turns=profile["max_turns"],
        recovery_line=("\n⚠️ 이번 실행은 RECOVERY 실행이다. run_context.md 의 RECOVERY 섹션부터 처리하라."
                       if recovery else ""),
    )

    write_output("skip", "false")
    write_output("dry_run", "true" if dry_run else "false")
    write_output("mode", mode)
    write_output("run_number", str(run_number))
    write_output("max_turns", str(profile["max_turns"]))
    write_output("claude_args", build_claude_args(profile, cfg.get("model", "")))
    write_output("prompt", prompt)
    print(f"Run #{run_number} mode={mode} phase={state['phase']} recovery={recovery} "
          f"issues={len(issues)} dry_run={dry_run}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
