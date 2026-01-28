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
const MAX_DEPTH = 15;

// Only export files with these extensions
const SAFE_EXTS = [
    // Web / JS / TS
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".json", ".jsonc",

    // Markup / templates
    ".html", ".css", ".scss", ".sass", ".less",
    ".md", ".txt",
    ".njk", // Nunjucks

    // Data / config (text)
    ".yaml", ".yml", ".toml", ".ini", ".cfg", ".properties",
    ".xml",

    // Python
    ".py", ".pyi",
    ".ipynb",

    // C / C++
    ".c", ".h",
    ".cpp", ".hpp", ".cc", ".cxx",

    // C# / Java
    ".cs", ".csx",
    ".java",

    // SQL
    ".sql",

    // Common scripts
    ".sh", ".bash", ".zsh",
    ".ps1", ".bat", ".cmd",

    // Build / tooling
    ".cmake", ".mk",

    // Other common languages
    ".rb",        // Ruby
    ".go",        // Go
    ".rs",        // Rust
    ".php",       // PHP
    ".kt", ".kts",// Kotlin / Gradle Kotlin DSL
    ".swift",     // Swift
    ".dart",      // Dart
    ".lua",       // Lua
    ".r",         // R
    ".scala",     // Scala
    ".pl", ".pm", // Perl
    ".groovy",    // Groovy
    ".gradle",    // Gradle
    ".proto",     // Protobuf
    ".graphql", ".gql", // GraphQL

    ".dockerignore",
    ".gitmodules",

    ".in", // CMake configure_file templates (e.g., foo.hpp.in)

    ".hpp", ".hh", ".ipp",  // more C++ headers
    ".mm", ".m",            // Objective-C / Obj-C++

    ".vue",                 // Vue single-file components
    ".svelte",              // Svelte

];

// Folder names to ignore entirely (normalize once)
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
    "temp",
    "SFML-2.6.2",
    ".temp-storage-area",
    "Labs",
    "private",
].map((d) => d.toLowerCase());

// ----- STATE -----

let skippedDepthFolders = [];
let ignoredFolders = [];
let skippedUnsupportedFiles = [];

// ----- HELPERS -----

function shouldIgnoreDir(dirName) {
    const lower = dirName.toLowerCase();
    // never ignore legos folders
    if (lower.includes("lego")) return false;
    return IGNORE_DIR_NAMES.includes(lower);
}

function isSafeExt(filePath) {
    const base = path.basename(filePath).toLowerCase();
    if (SAFE_FILENAMES.has(base)) return true;
    const ext = path.extname(filePath).toLowerCase();
    return SAFE_EXTS.includes(ext);
}


// Map extension -> markdown code fence language
function getCodeFenceLang(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".js":
        case ".mjs":
        case ".cjs":
            return "javascript";
        case ".ts":
            return "typescript";
        case ".md":
            return "markdown";

        case ".tsx":
            return "tsx";
        case ".jsx":
            return "jsx";
        case ".json":
        case ".jsonc":
            return "json";
        case ".html":
            return "html";
        case ".css":
        case ".scss":
        case ".sass":
        case ".less":
            return "css";

        case ".yaml":
        case ".yml":
            return "yaml";
        case ".toml":
            return "toml";
        case ".xml":
            return "xml";
        case ".njk":
            return "njk";
        case ".sql":
            return "sql";
        case ".cs":
        case ".csx":
            return "csharp";
        case ".java":
            return "java";
        case ".c":
            return "c";
        case ".cpp":
        case ".h":
        case ".hpp":
        case ".cc":
        case ".cxx":
            return "cpp";
        case ".sh":
        case ".bash":
        case ".zsh":
            return "bash";
        case ".ps1":
            return "powershell";

        case ".py":
        case ".pyi":
            return "python";
        case ".ipynb":
            return "json"; // notebooks are JSON; keeps it readable

        case ".rb":
            return "ruby";
        case ".go":
            return "go";
        case ".rs":
            return "rust";
        case ".php":
            return "php";
        case ".kt":
        case ".kts":
            return "kotlin";
        case ".swift":
            return "swift";
        case ".dart":
            return "dart";
        case ".lua":
            return "lua";
        case ".r":
            return "r";
        case ".scala":
            return "scala";
        case ".pl":
        case ".pm":
            return "perl";
        case ".groovy":
        case ".gradle":
            return "groovy";
        case ".proto":
            return "proto";
        case ".graphql":
        case ".gql":
            return "graphql";

        case ".bat":
        case ".cmd":
            return "bat";

        case ".dockerignore":
            return "docker";
        case ".gitmodules":
            return "gitconfig"; // closest common highlighter
        case ".in":
            return ""; // template file, depends on content

        case ".hh":
        case ".ipp":
            return "cpp";
        case ".m":
            return "objectivec";
        case ".mm":
            return "objectivecpp";

        case ".vue":
            return "vue";
        case ".svelte":
            return "svelte";

        default:
            return "";
    }
}

// Extensionless-but-important code/build files
const SAFE_FILENAMES = new Set([
    "cmakelists.txt",
    "makefile",
    "dockerfile",

    ".gitignore",
    ".gitattributes",
    ".editorconfig",

    ".env.example",
    ".npmrc",
    ".nvmrc",
    ".prettierrc",
    ".eslintrc",
    ".eslintignore",
    ".prettierignore",
    "license",
    "readme", // if someone has README without extension
]);

// Recursive walker with depth & ignore control
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
        output += `===== Skipped Folders (Exceeded Depth ${MAX_DEPTH}) =====\n`;
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
        output += `## Skipped Folders (Exceeded Depth ${MAX_DEPTH})\n`;
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
