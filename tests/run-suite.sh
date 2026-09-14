#!/usr/bin/env bash
# Run every test file of one suite directory in its own process.
# Bun shares a single module registry per process, so `mock.module` calls
# from one file would leak into other files of the same run. Per-file
# processes keep every suite hermetic no matter how files are added later.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: run-suite.sh <suite-dir>" >&2
  exit 1
fi

count=0
for f in "$1"/*.test.ts; do
  bun test "$f" || exit 1
  count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
  echo "No test files found in $1" >&2
  exit 1
fi
