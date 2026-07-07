#!/usr/bin/env bash
# Stop hook: auto-run Vitest when app/ files have changed.
# Exits 0 (allow stop) on pass or when nothing relevant changed.
# Exits 2 (block stop) on test failure, surfacing output so the agent fixes it.

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

if git diff --quiet -- app 2>/dev/null \
   && git diff --cached --quiet -- app 2>/dev/null; then
  exit 0
fi

output=$(npm test --silent 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
  echo "Tests failed — fix the failures before finishing:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
