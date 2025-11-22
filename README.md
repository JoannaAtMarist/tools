# Developer Utilities Collection

A collection of small, lightweight development tools written for general project maintenance, documentation, and code review workflows.  
These scripts are designed to work in **any repository**, with no dependencies beyond Node.js.

This repo currently includes:

---

## 📁 1. Project Structure Lister  
**File:** `list-structure.js`  
A simple tool that walks the directory tree and outputs a clean, readable text file showing the full folder structure.

- Recursively prints directories  
- Skips clutter like `node_modules`, `.git`, `dist`, etc.  
- Generates `project-structure.txt`  
- Great for documentation and project onboarding  

📄 See: `README-structure-lister.md`

---

## 🚀 2. Code Exporter CLI  
**File:** `exporter-cli.js`  
An interactive, repo-agnostic CLI that flattens large folder structures into a single readable `.txt` or `.md` file.

- Interactive menu  
- Depth-limited export (3 levels)  
- Skips binary files (PDF, PNG, DOCX, etc.)  
- Whitelist for safe code files  
- Ignores junk folders automatically  
- Outputs Markdown or plain text  
- Perfect for code reviews or ChatGPT uploads  

📄 See: `README-exporter-cli.md`

---


## 📄 License

This project is licensed under:

**Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**  
You are free to use, modify, and share these utilities for personal or educational purposes.  
Commercial use is not permitted.

See the `LICENSE` file for full details.

---
