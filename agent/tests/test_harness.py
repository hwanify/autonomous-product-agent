"""Tests for the agent harness scripts. Run: python3 -m unittest discover -s agent/tests -v"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SCRIPTS = REPO / "agent" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import common  # noqa: E402


class SandboxRepo:
    """Copy the harness into a temp git repo so scripts can run end-to-end."""

    def __init__(self):
        self.dir = Path(tempfile.mkdtemp())
        for rel in ("agent", "state", "CLAUDE.md", "mission.md"):
            src = REPO / rel
            if src.is_dir():
                shutil.copytree(src, self.dir / rel, ignore=shutil.ignore_patterns("__pycache__"))
            else:
                shutil.copy(src, self.dir / rel)
        # start from the pristine initial state
        state = common.load_json(self.dir / "state" / "state.json")
        state.update(current_task=None, run=None, last_run=None, halted=False, halt_reason=None,
                     handled_issues=[], run_summary="")
        state["stats"] = {k: 0 for k in common.STATS_KEYS}
        common.save_json(self.dir / "state" / "state.json", state)
        self.git("init", "-q")
        self.git("-c", "user.email=t@t", "-c", "user.name=t", "add", "-A")
        self.git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init")
        self.tmp = self.dir / ".tmp"
        self.tmp.mkdir()

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.dir, capture_output=True, text=True, check=True)

    def run(self, script, **env):
        full_env = {**os.environ, "AGENT_ROOT": str(self.dir), "GITHUB_OUTPUT": str(self.tmp / "out"),
                    "GITHUB_STEP_SUMMARY": str(self.tmp / "summary"), **env}
        return subprocess.run([sys.executable, str(self.dir / "agent" / "scripts" / script)],
                              cwd=self.dir, env=full_env, capture_output=True, text=True)

    def state(self):
        return common.load_json(self.dir / "state" / "state.json")

    def outputs(self):
        text = (self.tmp / "out").read_text() if (self.tmp / "out").exists() else ""
        outs, lines, i = {}, text.splitlines(), 0
        while i < len(lines):
            name, delim = lines[i].split("<<", 1)
            j = lines.index(delim, i + 1)
            outs[name] = "\n".join(lines[i + 1:j])
            i = j + 1
        return outs

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class ValidationTests(unittest.TestCase):
    def test_repo_state_files_are_valid(self):
        self.assertEqual(common.validate_config(common.load_json(REPO / "state" / "config.json")), [])
        self.assertEqual(common.validate_state(common.load_json(REPO / "state" / "state.json")), [])

    def test_invalid_phase_rejected(self):
        state = common.load_json(REPO / "state" / "state.json")
        state["phase"] = "dance"
        self.assertTrue(any("phase" in e for e in common.validate_state(state)))

    def test_bad_task_status_rejected(self):
        state = common.load_json(REPO / "state" / "state.json")
        state["current_task"] = {"id": "T-1", "title": "x", "phase": "explore", "status": "weird"}
        self.assertTrue(common.validate_state(state))


class FlowTests(unittest.TestCase):
    def setUp(self):
        self.repo = SandboxRepo()

    def tearDown(self):
        self.repo.cleanup()

    def test_success_run_records_progress(self):
        r = self.repo.run("preflight.py", EVENT_NAME="workflow_dispatch", INPUT_INSTRUCTION="focus on students")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        outs = self.repo.outputs()
        self.assertEqual(outs["skip"], "false")
        self.assertIn("--max-turns", outs["claude_args"])
        self.assertIn("Run #1", outs["prompt"])
        self.assertIn("focus on students", (self.repo.dir / "state" / "inbox.md").read_text())
        self.assertEqual(self.repo.state()["run"]["status"], "running")

        # simulate the agent finishing a task
        s = self.repo.state()
        s["current_task"] = {"id": "T-001", "title": "ideas", "phase": "explore", "status": "done"}
        s["phase"] = "design"
        s["run_summary"] = "Explore: selected an idea, Critic PASS, move to design"
        s["handled_issues"] = [{"number": 3, "reply": "ok"}]
        common.save_json(self.repo.dir / "state" / "state.json", s)

        msg, replies = self.repo.tmp / "msg", self.repo.tmp / "replies.json"
        r = self.repo.run("postflight.py", CLAUDE_OUTCOME="success", COMMIT_MSG_FILE=str(msg),
                          ISSUE_REPLIES_FILE=str(replies))
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        s = self.repo.state()
        self.assertEqual(s["stats"]["total_runs"], 1)
        self.assertEqual(s["stats"]["successful_runs"], 1)
        self.assertIsNone(s["current_task"])
        self.assertEqual(s["completed_tasks"][0]["id"], "T-001")
        self.assertEqual(s["handled_issues"], [])
        self.assertEqual(json.loads(replies.read_text())[0]["number"], 3)
        self.assertIn("run #1, design", msg.read_text())
        self.assertTrue((self.repo.dir / "state" / "STATUS.md").exists())
        self.assertEqual(len((self.repo.dir / "state" / "runs.jsonl").read_text().splitlines()), 1)
        self.assertEqual(common.validate_state(s), [])

    def test_failure_triggers_recovery_then_halt(self):
        for n in range(1, 4):
            r = self.repo.run("preflight.py")
            self.assertEqual(self.repo.outputs()["skip"], "false", r.stdout)
            if n == 1:
                s = self.repo.state()
                s["current_task"] = {"id": "T-001", "title": "ideas", "phase": "explore",
                                     "status": "in_progress", "notes": "3 of 7 ideas written"}
                common.save_json(self.repo.dir / "state" / "state.json", s)
            else:
                self.assertIn("RECOVERY", (self.repo.dir / "state" / "run_context.md").read_text())
                self.assertIn("3 of 7 ideas written", (self.repo.dir / "state" / "run_context.md").read_text())
            self.repo.run("postflight.py", CLAUDE_OUTCOME="failure")
            (self.repo.tmp / "out").unlink()
        s = self.repo.state()
        self.assertTrue(s["halted"])
        self.assertEqual(s["current_task"]["status"], "in_progress")

        self.repo.run("preflight.py")
        self.assertEqual(self.repo.outputs()["skip"], "true")
        (self.repo.tmp / "out").unlink()
        self.repo.run("preflight.py", INPUT_RESET_HALT="true")
        self.assertEqual(self.repo.outputs()["skip"], "false")

    def test_corrupted_state_is_restored(self):
        self.repo.run("preflight.py")
        (self.repo.dir / "state" / "state.json").write_text("{ broken")
        r = self.repo.run("postflight.py", CLAUDE_OUTCOME="success")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        s = self.repo.state()
        self.assertEqual(s["last_run"]["outcome"], "failure")
        self.assertEqual(common.validate_state(s), [])

    def test_protected_paths_are_reverted(self):
        self.repo.run("preflight.py")
        (self.repo.dir / "mission.md").write_text("hijacked")
        (self.repo.dir / "agent" / "evil.py").write_text("x")
        self.repo.run("postflight.py", CLAUDE_OUTCOME="success")
        self.assertNotEqual((self.repo.dir / "mission.md").read_text(), "hijacked")
        self.assertFalse((self.repo.dir / "agent" / "evil.py").exists())

    def test_gating_conditions(self):
        cfg_path = self.repo.dir / "state" / "config.json"
        cfg = common.load_json(cfg_path)

        self.repo.run("preflight.py", EVENT_NAME="schedule")
        self.assertEqual(self.repo.outputs()["skip"], "true")

        (self.repo.tmp / "out").unlink()
        cfg["paused"] = True
        common.save_json(cfg_path, cfg)
        self.repo.run("preflight.py")
        self.assertEqual(self.repo.outputs()["skip"], "true")

        (self.repo.tmp / "out").unlink()
        cfg["paused"] = False
        cfg["max_total_runs"] = 1
        common.save_json(cfg_path, cfg)
        s = self.repo.state()
        s["stats"]["total_runs"] = 1
        common.save_json(self.repo.dir / "state" / "state.json", s)
        self.repo.run("preflight.py")
        self.assertEqual(self.repo.outputs()["skip"], "true")

    def test_unfinished_run_marker_counts_as_crash(self):
        self.repo.run("preflight.py")
        # session died: the run marker was committed but postflight never ran
        self.repo.git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qam", "started")
        (self.repo.tmp / "out").unlink()
        r = self.repo.run("preflight.py")
        self.assertIn("crashed", r.stdout)
        s = self.repo.state()
        self.assertEqual(s["last_run"]["outcome"], "crashed")
        self.assertEqual(s["stats"]["failed_runs"], 1)
        self.assertEqual(s["run"]["number"], 2)
        self.assertIn("RECOVERY", (self.repo.dir / "state" / "run_context.md").read_text())

    def test_dry_run_does_not_count(self):
        self.repo.run("preflight.py", INPUT_DRY_RUN="true")
        self.assertEqual(self.repo.outputs()["dry_run"], "true")
        self.repo.run("postflight.py", CLAUDE_OUTCOME="dry_run")
        s = self.repo.state()
        self.assertEqual(s["stats"]["total_runs"], 0)
        self.assertEqual(s["last_run"]["outcome"], "dry_run")

    def test_append_only_violation_detected(self):
        (self.repo.dir / "state" / "progress.md").write_text("# rewritten\n")
        r = self.repo.run("validate_state.py")
        self.assertEqual(r.returncode, 1)
        self.assertIn("append-only", r.stdout)


if __name__ == "__main__":
    unittest.main()
