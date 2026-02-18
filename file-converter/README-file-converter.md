# pdf-to-md

Convert a **text-based** PDF to Markdown (no OCR). Image-only/scanned pages are skipped for now.
Includes a best-effort **table preservation** pass (rebuilds lines using PDF layout, then turns tabbed blocks into Markdown tables).

## Install

```bash
npm init -y
npm i pdfjs-dist yargs
```

## Run

```bash
node pdf-to-md.js -i input.pdf -o output.md
```

## Options

- `--minChars 30` : skip pages with fewer extracted characters (often image-only pages)
- `--keepEmpty` : include a note listing skipped pages

## Table tuning (optional)

If tables don’t line up well, tweak these constants inside `pdf-to-md.js`:

- `gapThreshold` (default `18`) controls when a new column becomes a `\t`
- `yTolerance` (default `2`) controls how strictly text is grouped into rows
