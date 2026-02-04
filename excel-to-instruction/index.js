// index.js
// CLI tool to convert Excel instruction sets <-> .txt/.xlsx

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// === CONFIG ===
const byteColumnName = "Byte";
const filesFolder = path.join(__dirname, "files");
const outputFolder = path.join(__dirname, "output");


/**
 * Normalize a token into a 2-digit hex byte (e.g., "0xA9" -> "A9", "a" -> "0A").
 * Returns null if the token is not a valid byte.
 * @param {string} token
 * @returns {string|null}
 */
function normalizeByteToken(token) {
    if (!token) return null;

    let t = token.trim().toUpperCase();
    if (t.startsWith("0X")) t = t.slice(2);

    // Remove trailing commas (common in "0xA9," style lists)
    if (t.endsWith(",")) t = t.slice(0, -1);

    // Must be 1-2 hex chars for a single byte
    if (!/^[0-9A-F]{1,2}$/.test(t)) return null;

    // Pad single hex digit -> 2 digits (A -> 0A)
    if (t.length === 1) t = "0" + t;

    return t;
}

/**
 * Parse a text file containing bytes separated by whitespace and/or commas.
 * Accepts formats like:
 *   A9 00 FF
 *   0xA9, 0x00, 0xFF
 *   A9\n00\nFF
 * @param {string} text
 * @returns {string[]} normalized bytes
 */
function parseBytesFromText(text) {
    const rawTokens = text
        .replace(/\r/g, "\n")
        .split(/[\s,]+/g)
        .map(s => s.trim())
        .filter(Boolean);

    const bytes = [];
    for (const tok of rawTokens) {
        const b = normalizeByteToken(tok);
        if (b !== null) bytes.push(b);
    }
    return bytes;
}

/**
 * EXCEL -> TXT
 * @param {string} excelPath
 */
function excelToTxt(excelPath) {
    const workbook = xlsx.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNames[0]]; // default to first sheet

    const json = xlsx.utils.sheet_to_json(sheet);
    const byteValues = json
        .map(row => row[byteColumnName])
        .filter(val => typeof val === "string" || typeof val === "number")
        .map(val => val.toString().trim().toUpperCase());

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const baseName = path.basename(excelPath, path.extname(excelPath));
    const outputPath = path.join(outputFolder, `${baseName}.txt`);

    fs.writeFileSync(outputPath, byteValues.join("\n"));
    console.log(`✅ Exported ${byteValues.length} instruction bytes to ${outputPath}`);
}

/**
 * TXT -> EXCEL
 * Creates a workbook with a single sheet and a "Byte" column.
 * (Optional upgrade later: load your template .xlsx and fill into its first sheet.)
 * @param {string} txtPath
 * @param {string} outXlsxPath
 */
function txtToExcel(txtPath, outXlsxPath) {
    const content = fs.readFileSync(txtPath, "utf8");
    const bytes = parseBytesFromText(content);

    if (bytes.length === 0) {
        console.error("❌ No valid bytes found in input text file.");
        process.exit(1);
    }

    // Build rows like: [{ Byte: "A9" }, { Byte: "00" }, ...]
    const rows = bytes.map(b => ({ [byteColumnName]: b }));

    const worksheet = xlsx.utils.json_to_sheet(rows, { header: [byteColumnName] });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Instructions");

    // Ensure output folder exists if the user provided a relative path inside it
    const outDir = path.dirname(outXlsxPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    xlsx.writeFile(workbook, outXlsxPath);
    console.log(`✅ Imported ${bytes.length} bytes into ${outXlsxPath}`);
}



/**
 * Export a single Excel file -> output/<name>.txt
 * (This is your existing behavior, wrapped into a function.)
 * @param {string} excelPath
 */
function exportOneExcelFile(excelPath) {
    const workbook = xlsx.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNames[0]]; // first sheet

    const json = xlsx.utils.sheet_to_json(sheet);
    const byteValues = json
        .map((row) => row[byteColumnName])
        .filter((val) => typeof val === "string" || typeof val === "number")
        .map((val) => val.toString().trim().toUpperCase());

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const baseName = path.basename(excelPath, path.extname(excelPath));
    const outputPath = path.join(outputFolder, `${baseName}.txt`);

    fs.writeFileSync(outputPath, byteValues.join("\n"));
    console.log(`✅ Exported ${byteValues.length} bytes -> ${outputPath}`);
}

/**
 * Find all .xlsx files inside /files (ignores Excel temp files like "~$foo.xlsx")
 * @returns {string[]} absolute paths
 */
function listExcelFilesInFilesFolder() {
    if (!fs.existsSync(filesFolder)) {
        return [];
    }

    const entries = fs.readdirSync(filesFolder);

    return entries
        .filter((name) => name.toLowerCase().endsWith(".xlsx"))
        .filter((name) => !name.startsWith("~$")) // skip Excel lock/temp files
        .map((name) => path.join(filesFolder, name));
}

/**
 * Export every .xlsx inside /files
 */
function exportAllExcelFiles() {
    const excelFiles = listExcelFilesInFilesFolder();

    if (excelFiles.length === 0) {
        console.log(`⚠️ No .xlsx files found in: ${filesFolder}`);
        return;
    }

    console.log(`📦 Found ${excelFiles.length} Excel file(s) in /files:`);

    for (const filePath of excelFiles) {
        console.log(`  - ${path.basename(filePath)}`);
        exportOneExcelFile(filePath);
    }
}

// ─────────────────────────────────────────────────────────────
// CLI
// Usage:
//   node index.js <path-to-excel.xlsx>   (single file, existing behavior)
//   node index.js --all                 (batch: every .xlsx in ./files)
// ─────────────────────────────────────────────────────────────

const arg1 = process.argv[2];

if (!arg1) {
    console.error("❌ Usage:\n  node index.js <file.xlsx>\n  node index.js --all");
    process.exit(1);
}

if (arg1 === "--all") {
    exportAllExcelFiles();
} else {
    // Backward compatible: treat arg as an Excel path
    exportOneExcelFile(arg1);
}

// ─────────────────────────────────────────────────────────────
// CLI
// Usage:
//   node index.js excel-to-txt path/to/file.xlsx
//   node index.js txt-to-excel path/to/file.txt path/to/out.xlsx
// Backward compatible:
//   node index.js path/to/file.xlsx   (defaults to excel-to-txt)
// ─────────────────────────────────────────────────────────────

const modeOrPath = process.argv[2];
const arg2 = process.argv[3];
const arg3 = process.argv[4];

if (!modeOrPath) {
    console.error(
        "❌ Usage:\n" +
        "  node index.js excel-to-txt <file.xlsx>\n" +
        "  node index.js txt-to-excel <file.txt> <out.xlsx>\n" +
        "  (or legacy) node index.js <file.xlsx>"
    );
    process.exit(1);
}

try {
    // Legacy behavior: if the first arg ends in .xlsx, treat it as excel-to-txt input
    if (modeOrPath.toLowerCase().endsWith(".xlsx")) {
        excelToTxt(modeOrPath);
    } else if (modeOrPath === "excel-to-txt") {
        if (!arg2) throw new Error("Missing Excel path for excel-to-txt.");
        excelToTxt(arg2);
    } else if (modeOrPath === "txt-to-excel") {
        if (!arg2 || !arg3) throw new Error("Missing args for txt-to-excel. Need <file.txt> <out.xlsx>.");
        txtToExcel(arg2, arg3);
    } else {
        throw new Error("Unknown mode. Use excel-to-txt or txt-to-excel.");
    }
} catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
}
