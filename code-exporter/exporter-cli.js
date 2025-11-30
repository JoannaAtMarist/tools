// exporter-cli.js
// Repo-agnostic code export tool with:
// - 3-level depth limit
// - Whitelist of safe extensions
// - Ignore patterns (like a mini .gitignore)
// - Skipped folder/file reporting
// - Interactive menu
// - TXT or Markdown output

import fs from "fs";
import path from "path";
import readline from "readline";

// ----- CONFIG -----

// Max folder depth from the chosen root (0 = starting dir)
const MAX_DEPTH = 5;

// Only export files with these extensions
const SAFE_EXTS = [
    ".js",
    ".mjs",
    ".cjs",
    ".ts",
    ".json",
    ".md",
    ".txt",
    ".html",
    ".css",
    ".yaml",
    ".yml",
    ".cpp",
    ".h",
    ".hpp",
    ".cc",
    ".cxx",
];

// Folder names to ignore entirely (unless name contains "lego")
const IGNORE_DIR_NAMES = [
    "node_modules",
    ".git",
    ".vscode",
    "dist",
    "build",
    "coverage",
    ".idea",
    "out",
    "uploads",
    "logs",
    "tmp",
];

// ----- STATE -----

let skippedDepthFolders = [];
let ignoredFolders = [];
let skippedUnsupportedFiles = [];

// ----- HELPERS -----

function isSafeExt(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SAFE_EXTS.includes(ext);
}

function shouldIgnoreDir(dirName) {
    const lower = dirName.toLowerCase();
    if (lower.includes("lego")) return false; // never ignore legos folders
    return IGNORE_DIR_NAMES.includes(dirName);
}

// Map extension -> markdown code fence language
function getCodeFenceLang(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".js":
        case ".mjs":
        case ".cjs":
        case ".ts":
            return "js";
        case ".json":
            return "json";
        case ".html":
            return "html";
        case ".css":
            return "css";
        case ".md":
            return "md";
        case ".yaml":
        case ".yml":
            return "yaml";
        case ".cpp":
        case ".h":
        case ".hpp":
        case ".cc":
        case ".cxx":
            return "cpp";
        default:
            return "";
    }
}

// Recursive walker with depth + ignore control
function walkDirectory(rootDir, currentDir, depth = 0, collectedFiles = []) {
    const entries = fs.readdirSync(currentDir);

    for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const relPath = path.relative(rootDir, fullPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (shouldIgnoreDir(entry)) {
                ignoredFolders.push(relPath);
                continue;
            }

            if (depth >= MAX_DEPTH) {
                skippedDepthFolders.push(relPath);
                continue;
            }

            walkDirectory(rootDir, fullPath, depth + 1, collectedFiles);
        } else {
            if (!isSafeExt(fullPath)) {
                skippedUnsupportedFiles.push(relPath);
                continue;
            }
            collectedFiles.push(fullPath);
        }
    }

    return collectedFiles;
}

// Build TXT output
function buildTxtOutput(rootDir, filePaths) {
    let output = "";

    if (skippedDepthFolders.length > 0) {
        output += "===== Skipped Folders (Exceeded Depth 3) =====\n";
        for (const folder of skippedDepthFolders) {
            output += `[SKIPPED FOLDER]: ${folder}\n`;
        }
        output += "\n";
    }

    if (ignoredFolders.length > 0) {
        output += "===== Ignored Folders (Pattern) =====\n";
        for (const folder of ignoredFolders) {
            output += `[IGNORED FOLDER]: ${folder}\n`;
        }
        output += "\n";
    }

    if (skippedUnsupportedFiles.length > 0) {
        output += "===== Skipped Binary/Unsupported Files =====\n";
        for (const file of skippedUnsupportedFiles) {
            output += `[SKIPPED FILE]: ${file}\n`;
        }
        output += "\n";
    }

    for (const filePath of filePaths) {
        const relPath = path.relative(rootDir, filePath);
        const contents = fs.readFileSync(filePath, "utf-8");

        output += `\n\n==============================\n`;
        output += `FILE: ${relPath}\n`;
        output += `==============================\n\n`;
        output += contents + "\n";
    }

    return output;
}

// Build Markdown output
function buildMarkdownOutput(rootDir, filePaths) {
    let output = "# Export Report\n\n";

    if (skippedDepthFolders.length > 0) {
        output += "## Skipped Folders (Exceeded Depth 3)\n";
        for (const folder of skippedDepthFolders) {
            output += `- \`${folder}\`\n`;
        }
        output += "\n";
    }

    if (ignoredFolders.length > 0) {
        output += "## Ignored Folders (Pattern)\n";
        for (const folder of ignoredFolders) {
            output += `- \`${folder}\`\n`;
        }
        output += "\n";
    }

    if (skippedUnsupportedFiles.length > 0) {
        output += "## Skipped Binary/Unsupported Files\n";
        for (const file of skippedUnsupportedFiles) {
            output += `- \`${file}\`\n`;
        }
        output += "\n";
    }

    for (const filePath of filePaths) {
        const relPath = path.relative(rootDir, filePath);
        const contents = fs.readFileSync(filePath, "utf-8");
        const lang = getCodeFenceLang(filePath);

        output += "\n---\n\n";
        output += `## \`${relPath}\`\n\n`;
        output += "```" + lang + "\n";
        output += contents.replace(/\r\n/g, "\n");
        output += "\n```\n";
    }

    output += "\n---\n";
    return output;
}

// ----- CLI -----

function createPrompt() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

async function runCli() {
    const baseDir = process.cwd();
    const entries = fs.readdirSync(baseDir);
    const folders = entries.filter((name) =>
        fs.statSync(path.join(baseDir, name)).isDirectory()
    );

    const rl = createPrompt();

    console.log("📁 Detected top-level folders in this repo:\n");
    folders.forEach((folder, index) => {
        console.log(`  ${index + 1}) ${folder}`);
    });
    console.log(`  ${folders.length + 1}) [Custom Path]`);
    console.log(`  ${folders.length + 2}) Quit\n`);

    let choice = await askQuestion(
        rl,
        `Select a folder to export (1-${folders.length + 2}): `
    );

    const maxOption = folders.length + 2;
    let choiceNum = parseInt(choice, 10);

    if (Number.isNaN(choiceNum) || choiceNum < 1 || choiceNum > maxOption) {
        console.log("❌ Invalid choice. Exiting.");
        rl.close();
        return;
    }

    if (choiceNum === maxOption) {
        console.log("👋 Quit selected. Exiting.");
        rl.close();
        return;
    }

    let targetDir;
    if (choiceNum === folders.length + 1) {
        const custom = await askQuestion(
            rl,
            "Enter custom path to export (relative or absolute): "
        );
        targetDir = path.resolve(baseDir, custom);
    } else {
        const folderName = folders[choiceNum - 1];
        targetDir = path.join(baseDir, folderName);
    }

    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        console.log("❌ That path is not a directory. Exiting.");
        rl.close();
        return;
    }

    // Output format
    console.log("\nChoose output format:");
    console.log("  1) TXT");
    console.log("  2) Markdown\n");

    let fmt = await askQuestion(rl, "Format (1-2): ");
    let isMarkdown = fmt === "2";

    const defaultBaseName = path.basename(targetDir) || "export";
    const defaultExt = isMarkdown ? ".md" : ".txt";
    const defaultFileName = `${defaultBaseName}-export${defaultExt}`;

    let fileName = await askQuestion(
        rl,
        `Output file name? (Enter for default: ${defaultFileName}): `
    );
    if (!fileName) fileName = defaultFileName;

    const outputPath = path.resolve(baseDir, fileName);

    console.log("\n🔍 Scanning and exporting...\n");

    // Reset tracking arrays
    skippedDepthFolders = [];
    ignoredFolders = [];
    skippedUnsupportedFiles = [];

    const files = walkDirectory(targetDir, targetDir, 0, []);
    const outputText = isMarkdown
        ? buildMarkdownOutput(targetDir, files)
        : buildTxtOutput(targetDir, files);

    fs.writeFileSync(outputPath, outputText, "utf-8");

    console.log("✅ Export complete.");
    console.log(`   Files included: ${files.length}`);
    console.log(`   Folders skipped (depth > ${MAX_DEPTH}): ${skippedDepthFolders.length}`);
    console.log(`   Folders ignored (pattern): ${ignoredFolders.length}`);
    console.log(`   Files skipped (unsupported type): ${skippedUnsupportedFiles.length}`);
    console.log(`   Output written to: ${outputPath}\n`);

    rl.close();
}

// Run CLI
runCli().catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
});
