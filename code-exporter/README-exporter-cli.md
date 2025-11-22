# 🚀 Code Exporter CLI

A repo-agnostic Node.js CLI tool for exporting code from any folder into one `.txt` or `.md` file.

---

## ⭐ Features

- Interactive CLI menu  
- Depth limit (3 levels)  
- Skip binary files (PDF, PNG, DOCX, etc.)  
- Whitelist extensions  
- Ignore `.git`, `node_modules`, `dist`, etc.  
- TXT or Markdown output  
- Auto-named export files  
- Clean formatting

## ▶️ Usage

```bash
node exporter-cli.js
```

Follow prompts to choose:

- Folder to export  
- TXT or Markdown output  
- File name (auto-suggested)

## 🧩 Perfect For

- Code reviews  
- Documentation  
- ChatGPT uploads  
- Flattening multi-file projects

## 🧹 Ignore Rules

Inside script:

```js
const IGNORE_DIR_NAMES = [
  "node_modules",
  ".git",
  ".vscode",
  "dist",
  "build",
  "uploads",
  "logs"
];
```

## 📄 License

MIT
