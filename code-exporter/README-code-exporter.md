# Code Exporter (CLI + Electron)

Export code from any folder into a single `.txt` or `.md` file.  
Designed for code reviews, documentation snapshots, and “upload one file to an AI” workflows.

This folder contains two versions:

- `exporter-cli/` -> Node.js CLI script (interactive prompts)
- `exporter-electron/` -> Desktop app (Browse folder + Save As)

---

## What it does

- Scans a chosen folder
- Ignores common junk folders (ex: `.git`, `node_modules`, `dist`, `build`, etc.)
- Includes only a “safe extension” allowlist (code + configs + common text formats)
- Skips unsupported/binary files
- Outputs either:
  - Plain text (`.txt`) with headers between files
  - Markdown (`.md`) with code fences per file (language inferred from extension)

---

## Option A: CLI (Node.js)

### Location
`code-exporter/exporter-cli/`

### Requirements
- Node.js 18+ recommended

### Run
From inside `code-exporter/exporter-cli/`:

```bash
node exporter-cli.js
```

Follow the prompts to pick:
- folder to export
- output format (TXT or Markdown)
- output filename

---

## Option B: Desktop App (Electron)

### Location
`code-exporter/exporter-electron/`

### Requirements
- Node.js + npm

### Run in dev mode

```bash
npm install
npm start
```

### Build an app

```bash
npm run dist
```

Build output is written to:

- `code-exporter/exporter-electron/dist/`

---

## Packaging notes

### Windows builds
- Build on **Windows** if you want a Windows `.exe`.
- If `electron-builder` fails with a symlink privilege error, enabling **Windows Developer Mode** usually fixes it.

### Linux builds
- Linux builds can produce an AppImage (depending on your `electron-builder` config).

---

## Repo layout

```txt
code-exporter/
  README-code-exporter.md
  exporter-cli/
    exporter-cli.js
    README-exporter-cli.md   (optional: keep as CLI-only docs, or replace with a short pointer)
  exporter-electron/
    main.js
    preload.cjs
    renderer.js
    exporter-core.js
    index.html
    package.json
```
