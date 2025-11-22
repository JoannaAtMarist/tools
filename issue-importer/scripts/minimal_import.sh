#!/usr/bin/env bash
# minimal_import.sh

set -euo pipefail

CSV_PATH="${1:-issues.csv}"

if [[ ! -f "$CSV_PATH" ]]; then
  echo "ERROR: CSV not found at '$CSV_PATH'"
  exit 1
fi

if [[ "${2:-}" == "--dry-run" ]]; then
  python3 "$(dirname "$0")/minimal_import_issues.py" "$CSV_PATH" --dry-run
else
  python3 "$(dirname "$0")/minimal_import_issues.py" "$CSV_PATH"
fi
