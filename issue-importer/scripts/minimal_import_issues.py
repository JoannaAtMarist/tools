#!/usr/bin/env python3
import csv
import subprocess
import sys
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python3 minimal_import_issues.py <csv_file> [--dry-run]")
    sys.exit(1)

csv_file = Path(sys.argv[1])
dry_run = "--dry-run" in sys.argv


def run(cmd):
    if dry_run:
        print("DRY RUN:", " ".join(cmd))
        return 0, "", ""
    proc = subprocess.run(cmd, capture_output=True, text=True)
        # capture_output ensures gh output still prints success URLs
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


with csv_file.open(newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    # Require ONLY title + body
    for required in ("title", "body"):
        if required not in reader.fieldnames:
            print(f"ERROR: Required column '{required}' missing.")
            print(f"Found columns: {reader.fieldnames}")
            sys.exit(2)

    count = 0

    for row in reader:
        title = (row.get("title") or "").strip()
        body = (row.get("body") or "").strip()

        if not title:
            continue

        cmd = [
            "gh", "issue", "create",
            "--title", title,
            "--body", body
        ]

        code, out, err = run(cmd)

        if code == 0:
            print(f"✔ Created: {out or title}")
        else:
            print(f"✖ Failed '{title}': {err or out}")

        count += 1

    print(f"\nDone. Processed {count} rows.")
