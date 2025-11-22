# 📁 Project Structure Lister

A lightweight Node.js utility for generating a clean, text-based tree view of any project directory.
Automatically ignores common junk folders (like `node_modules`, `.git`, etc.) and writes the result to `project-structure.txt`.

---

## 🚀 Features

- Recursively prints directory structure  
- Ignores clutter folders automatically  
- Clean ASCII-tree output (like `tree` command)  
- Writes output to `project-structure.txt`  
- Works in **any repo**  
- No dependencies — pure Node.js

## ▶️ Usage

```bash
node list-structure.js
```

Generates:

```
project-structure.txt
```

## 🧹 Ignore Rules

Modify inside script:

```js
const IGNORED = new Set([
  ".git",
  "node_modules",
  "dist",
  "build"
]);

