import fs from "fs";
import path from "path";

const targetDir = process.argv[2];
const outputFile = process.argv[3] || "exported-code.txt";
const MAX_DEPTH = 3;

if (!targetDir) {
    console.error("Usage: node export-code.js <directory> [output-file]");
    process.exit(1);
}

// Allowed text-based code files
const SAFE_EXTS = [".js", ".mjs", ".cjs", ".ts", ".json", ".md", ".css", ".html", ".txt"];

let skippedFolders = [];
let skippedFiles = [];

function walk(dir, depth = 0, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (depth >= MAX_DEPTH) {
                skippedFolders.push(fullPath);
                continue;
            }
            walk(fullPath, depth + 1, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (!SAFE_EXTS.includes(ext)) {
                skippedFiles.push(fullPath); // record skipped binary file
                continue; // don't read or add
            }
            fileList.push(fullPath);
        }
    }

    return fileList;
}

function exportFiles(dir, output) {
    const filePaths = walk(dir);
    let outputText = "";

    // Folders skipped due to depth
    if (skippedFolders.length > 0) {
        outputText += "===== Skipped Folders (Exceeded Depth 3) =====\n";
        for (const folder of skippedFolders) outputText += `[SKIPPED FOLDER]: ${folder}\n`;
        outputText += "\n";
    }

    // Files skipped due to unsafe extension
    if (skippedFiles.length > 0) {
        outputText += "===== Skipped Binary/Unsupported Files =====\n";
        for (const file of skippedFiles) outputText += `[SKIPPED FILE]: ${file}\n`;
        outputText += "\n";
    }

    // Export readable code files
    for (const filePath of filePaths) {
        const contents = fs.readFileSync(filePath, "utf-8");
        outputText += `\n\n==============================\n`;
        outputText += `FILE: ${filePath}\n`;
        outputText += `==============================\n\n`;
        outputText += contents + "\n";
    }

    fs.writeFileSync(output, outputText, "utf-8");
    console.log(
        `Exported ${filePaths.length} text files → ${output} (skipped ${skippedFolders.length} folders, ${skippedFiles.length} files)`
    );
}

exportFiles(targetDir, outputFile);
