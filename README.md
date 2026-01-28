# Developer Utilities Collection

A small collection of repo-agnostic developer tools for documentation, code review, and project planning workflows.

Each tool is kept in its own folder with its own README so you can copy a tool into any repo without dragging the rest along.

---

<br>

## Included Tools

### 1) Project Structure Lister
**Folder:** `structure-lister/`

Generates a clean, text-based tree view of a project directory (similar to the `tree` command) while skipping common clutter folders.

- Output: `project-structure.txt`
- Good for onboarding docs and “what’s in this repo?” context

Docs: `structure-lister/README-structure-lister.md`

---

### 2) Code Exporter (CLI + Desktop App)
**Folder:** `code-exporter/`

Exports code from a chosen folder into a single `.txt` or `.md` file (skips binary/unsupported files, ignores junk folders, and reports what it skipped).

Includes:
- **CLI version** (Node script)
- **Electron desktop app** with “Browse folder” + “Save as…”

Docs: `code-exporter/README-code-exporter.md`

---

### 3) GitHub Issue Import Tool
**Folder:** `issue-importer/`

Bulk-creates GitHub Issues from a simple CSV (`title,body`) using GitHub CLI.

Docs: `issue-importer/README_issue_import_tool.md`

---  

### 4.) Excel Combiner (Python)  
**Folder:** `excel-combiner/`  
Combines multiple .xlsx files into one workbook, one sheet per file.

---

<br>

## License

Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)

You are free to use, modify, and share these utilities for personal or educational purposes.
Commercial use is not permitted.

See `LICENSE` for details.