#!/usr/bin/env python3
"""Validate agent state files. Exit 0 if valid, 1 otherwise.

The agent runs this before finishing each run; the workflow runs it too.
"""

from __future__ import annotations

import json
import sys

from common import (
    CONFIG_PATH, DECISIONS_PATH, INBOX_PATH, PROGRESS_PATH, STATE_PATH,
    append_only_violations, load_json, validate_config, validate_state,
)


def main() -> int:
    errors: list[str] = []
    for path in (PROGRESS_PATH, DECISIONS_PATH, INBOX_PATH):
        if not path.exists():
            errors.append(f"{path.name} is missing")
    try:
        errors += validate_config(load_json(CONFIG_PATH))
    except (OSError, json.JSONDecodeError) as e:
        errors.append(f"config.json unreadable: {e}")
    try:
        errors += validate_state(load_json(STATE_PATH))
    except (OSError, json.JSONDecodeError) as e:
        errors.append(f"state.json unreadable: {e}")
    errors += append_only_violations()

    if errors:
        print("STATE INVALID:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("state OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
