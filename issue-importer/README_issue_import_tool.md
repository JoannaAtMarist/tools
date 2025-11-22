# **Issue Import Tool**  
A simple CSV-based GitHub Issues uploader for project management

This tool provides a **clean, minimal, predictable** way to bulk-create GitHub Issues from a CSV file.  
It is designed for the PNF Capstone team’s workflow, but can be used for any project.

The tool requires only two columns:

```
title,body
```

No labels, no assignees, no project linking — the goal is simplicity and reliability.

## ✨ Features

- ✔ Upload issues directly to any GitHub repo using `gh issue create`  
- ✔ Simple CSV format: **title + body only**  
- ✔ Dry-run mode to preview all issue creation commands  
- ✔ Robust to missing fields and empty rows  
- ✔ Folder-safe path handling (runs from anywhere)  
- ✔ Fully shell + Python based, no dependencies beyond GitHub CLI

## 📁 Repository Structure

```
scripts/
   minimal_import_issues.py
   minimal_import.sh
   issues_template.csv       (optional)
   issues_capstone_import.csv (example)
README.md
```

## 📦 CSV Format

Your CSV must contain exactly these columns:

```
title,body
"Fix login redirect","Description of the issue…"
"Add logout route","Implement /logout endpoint…"
```

## 🧪 Dry Run (Preview Only)

```
bash scripts/minimal_import.sh scripts/issues_capstone_import.csv --dry-run
```

## 🚀 Real Run (Creates Issues)

```
bash scripts/minimal_import.sh scripts/issues_capstone_import.csv
```

## 🔐 GitHub Auth

```
gh auth login
```

## 🧠 How It Works

### `minimal_import_issues.py`
- Reads CSV  
- Validates columns  
- Builds issue commands  
- Executes or prints them

### `minimal_import.sh`
- Handles paths  
- Calls Python importer  
- Works from anywhere

## 📀 Optional Templates

- `issues_template.csv`  
- `issues_capstone_import.csv`

## ❤️ Credits

Built for **CMPT 475 Group 4 – Patient Not Found**.
