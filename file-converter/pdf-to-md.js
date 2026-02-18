#!/usr/bin/env node
/**
 * pdf-to-md.js
 * Convert a PDF into Markdown using pdfjs page-by-page text extraction.
 * Skips "image-only" pages (pages with very little extracted text).
 *
 * Usage:
 *   node pdf-to-md.js -i input.pdf -o output.md
 *
 * Options:
 *   --minChars 30   -> minimum extracted characters required to keep a page
 *   --keepEmpty     -> include placeholders for skipped pages
 */

const fs = require("fs");
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const { createRequire } = require("module");
const { pathToFileURL } = require("url");
const requireFromHere = createRequire(__filename);

async function loadPdfjs() {
    const candidates = [
        "pdfjs-dist/build/pdf.mjs",
        "pdfjs-dist/pdf.mjs",
        "pdfjs-dist/legacy/build/pdf.mjs",
        "pdfjs-dist/build/pdf.js",
        "pdfjs-dist/legacy/build/pdf.js",
    ];

    let lastErr;
    for (const spec of candidates) {
        try {
            const resolved = requireFromHere.resolve(spec);
            return await import(pathToFileURL(resolved).href);
        } catch (e) {
            lastErr = e;
        }
    }

    throw new Error(
        "Could not load pdfjs-dist from any known path. Last error: " +
        (lastErr?.message || lastErr)
    );
}


function normalizeWhitespace(text) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

function looksLikeHeading(line) {
    const t = line.trim();
    if (!t) return false;

    const shortEnough = t.length <= 80;
    const noPeriod = !t.endsWith(".");
    const upperRatio =
        t.replace(/[^A-Z]/g, "").length / Math.max(1, t.replace(/[^A-Za-z]/g, "").length);

    const hasSectionPrefix = /^(chapter|section|part)\b/i.test(t);
    const endsWithColon = t.endsWith(":");
    const mostlyUpper = upperRatio >= 0.6 && t.length >= 6;

    return shortEnough && noPeriod && (hasSectionPrefix || endsWithColon || mostlyUpper);
}

function looksLikeBullet(line) {
    const t = line.trim();
    return (
        /^([*-]|\u2022|o)\s+/.test(t) ||     // -, *, •, o
        /^\(?\d+\)?[.)]\s+/.test(t)         // 1.  1)  (1)  1)
    );
}

function toMarkdown(text) {
    const normalized = normalizeWhitespace(text);

    const fixed = normalized.replace(/(\w)-\n(\w)/g, "$1$2");
    const lines = fixed.split("\n");

    const out = [];
    let paragraph = [];

    function flushParagraph() {
        if (paragraph.length === 0) return;
        out.push(paragraph.join(" ").replace(/\s+/g, " ").trim());
        paragraph = [];
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            flushParagraph();
            out.push("");
            continue;
        }

        // TABLE BLOCK detection: consecutive tabbed lines
        if (isTableLine(line)) {
            flushParagraph();

            const tableLines = [line];
            while (i + 1 < lines.length && isTableLine(lines[i + 1].trim())) {
                i++;
                tableLines.push(lines[i].trim());
            }

            out.push(emitMarkdownTable(tableLines));
            out.push("");
            continue;
        }

        if (looksLikeBullet(line)) {
            flushParagraph();
            const bulletLine = line
                .replace(/^\u2022\s+/, "- ")
                .replace(/^\*\s+/, "- ")
                .replace(/^o\s+/, "- ");
            out.push(bulletLine);
            continue;
        }

        if (looksLikeHeading(line)) {
            flushParagraph();
            out.push(`## ${line.replace(/:+$/, "").trim()}`);
            out.push("");
            continue;
        }

        paragraph.push(line);
    }

    flushParagraph();
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function escapePipes(s) {
    return s.replace(/\|/g, "\\|").trim();
}

function isTableLine(line) {
    // "table-ish" if it contains at least 1 tab and isn't just noise
    const t = line.trim();
    if (!t) return false;
    return t.includes("\t") && t.split("\t").filter((c) => c.trim().length > 0).length >= 2;
}

function emitMarkdownTable(lines) {
    // lines are tab-separated rows
    const rows = lines.map((l) => l.split("\t").map((c) => escapePipes(c)));
    const colCount = Math.max(...rows.map((r) => r.length));

    const norm = rows.map((r) => {
        const rr = r.slice();
        while (rr.length < colCount) rr.push("");
        return rr;
    });

    // Heuristic: If first row looks like header (has letters), use it as header.
    // Otherwise generate generic headers.
    const first = norm[0].join(" ");
    const looksHeader = /[A-Za-z]/.test(first);

    const header = looksHeader
        ? norm[0]
        : Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);

    const body = looksHeader ? norm.slice(1) : norm;

    const sep = Array.from({ length: colCount }, () => "---");

    const out = [];
    out.push(`| ${header.join(" | ")} |`);
    out.push(`| ${sep.join(" | ")} |`);
    for (const r of body) out.push(`| ${r.join(" | ")} |`);
    return out.join("\n");
}

function groupByY(items, yTolerance = 2) {
    // group items into rows by similar y values
    const rows = [];
    for (const it of items) {
        rows.push(it);
    }
    // Sort by y descending (PDF coords often increase upwards)
    rows.sort((a, b) => b.y - a.y);

    const grouped = [];
    for (const it of rows) {
        const last = grouped[grouped.length - 1];
        if (!last || Math.abs(last.y - it.y) > yTolerance) {
            grouped.push({ y: it.y, items: [it] });
        } else {
            last.items.push(it);
        }
    }
    return grouped;
}

function rowToTextWithTabs(rowItems, gapThreshold = 18) {
    // Sort left-to-right
    rowItems.sort((a, b) => a.x - b.x);

    let out = "";
    let prevX = null;

    for (const it of rowItems) {
        const s = (it.str || "").trim();
        if (!s) continue;

        if (prevX !== null) {
            const gap = it.x - prevX;
            if (gap > gapThreshold) out += "\t";
            else out += " ";
        }

        out += s;
        prevX = it.x;
    }

    return out.replace(/[ ]{2,}/g, " ").trim();
}

async function extractTextByPage(pdfPath, pdfjsLib) {
    const pdfjs = pdfjsLib.default || pdfjsLib;

    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjs.getDocument({ data }).promise;

    const pages = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();

        // Collect positioned items
        const positioned = content.items
            .map((it) => {
                // transform[4], transform[5] are x,y in PDF.js
                const t = it.transform;
                return {
                    str: it.str,
                    x: t[4],
                    y: t[5],
                };
            })
            .filter((it) => it.str && it.str.trim().length > 0);

        const rows = groupByY(positioned, 2);
        const lines = rows
            .map((r) => rowToTextWithTabs(r.items, 18))
            .filter(Boolean);

        const pageText = lines.join("\n").trim();
        pages.push({ pageNum, text: pageText });
    }

    return pages;
}


async function main() {
    const pdfjsLib = await loadPdfjs();

    const argv = yargs(hideBin(process.argv))
        .option("input", { alias: "i", type: "string", demandOption: true, describe: "Input PDF path" })
        .option("output", { alias: "o", type: "string", demandOption: true, describe: "Output Markdown path" })
        .option("minChars", { type: "number", default: 30, describe: "Minimum characters to treat a page as text" })
        .option("keepEmpty", { type: "boolean", default: false, describe: "Keep placeholders for skipped pages" })
        .help()
        .parse();

    const inputPath = path.resolve(argv.input);
    const outputPath = path.resolve(argv.output);

    if (!fs.existsSync(inputPath)) {
        console.error(`Input file not found: ${inputPath}`);
        process.exit(1);
    }

    let pages;
    try {
        pages = await extractTextByPage(inputPath, pdfjsLib);
    } catch (err) {
        console.error("Failed to read PDF.");
        console.error(err?.message || err);
        process.exit(1);
    }

    const kept = [];
    const skipped = [];

    for (const p of pages) {
        if ((p.text || "").length >= argv.minChars) kept.push(p);
        else skipped.push(p.pageNum);
    }

    let combined = "";
    for (const p of kept) {
        combined += `\n\n---\n\n<!-- Page ${p.pageNum} -->\n\n${p.text}\n`;
    }

    if (argv.keepEmpty && skipped.length) {
        combined += `\n\n---\n\n`;
        combined += `Skipped (likely image-only) pages: ${skipped.join(", ")}\n`;
    }

    const md = toMarkdown(combined);
    fs.writeFileSync(outputPath, md, "utf8");

    console.log(`Wrote Markdown: ${outputPath}`);
    console.log(`Kept pages: ${kept.length}/${pages.length}`);
    if (skipped.length) console.log(`Skipped pages (likely image-only): ${skipped.join(", ")}`);
}

main().catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
});
