// exporter-core.js
// exporter cli logic without the cli

import fs from "fs";
import path from "path";

// ----- CONFIG -----
const MAX_DEPTH = 15;

const SAFE_EXTS = [
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".json", ".jsonc",

    ".html", ".css", ".scss", ".sass", ".less",
    ".md", ".txt",
    ".njk",

    ".yaml", ".yml", ".toml", ".ini", ".cfg", ".properties",
    ".xml",

    ".py", ".pyi",
    ".ipynb",

    ".c", ".h",
    ".cpp", ".hpp", ".cc", ".cxx", ".hh", ".ipp",

    ".cs", ".csx",
    ".java",

    ".sql",

    ".sh", ".bash", ".zsh",
    ".ps1", ".bat", ".cmd",

    ".cmake", ".mk",
    ".in",

    ".rb",
    ".go",
    ".rs",
    ".php",
    ".kt", ".kts",
    ".swift",
    ".dart",
    ".lua",
    ".r",
    ".scala",
    ".pl", ".pm",
    ".groovy", ".gradle",
    ".proto",
    ".graphql", ".gql",

    ".dockerignore",
    ".gitmodules",

    ".m", ".mm",
    ".vue",
    ".svelte",
];

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
    "sfml-2.6.2",
    ".temp-storage-area",
    "labs",
    "private",
].map((d) => d.toLowerCase());

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
    "readme",
]);

// ----- STATE (returned to caller) -----
function createReport() {
    return {
        skippedDepthFolders: [],
        ignoredFolders: [],
        skippedUnsupportedFiles: [],
    };
}

function isSafeExt(filePath) {
    const base = path.basename(filePath).toLowerCase();
    if (SAFE_FILENAMES.has(base)) return true;

    const ext = path.extname(filePath).toLowerCase();
    return SAFE_EXTS.includes(ext);
}

function shouldIgnoreDir(dirName) {
    const lower = dirName.toLowerCase();
    if (lower.includes("lego")) return false;
    return IGNORE_DIR_NAMES.includes(lower);
}

function getCodeFenceLang(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".js":
        case ".mjs":
        case ".cjs":
            return "javascript";
        case ".ts":
            return "typescript";
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
        case ".md":
            return "markdown";
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
        case ".hh":
        case ".ipp":
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
            return "json";

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

function walkDirectory(rootDir, currentDir, report, depth = 0, collectedFiles = []) {
    const entries = fs.readdirSync(currentDir);

    for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const relPath = path.relative(rootDir, fullPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (shouldIgnoreDir(entry)) {
                report.ignoredFolders.push(relPath);
                continue;
            }
            if (depth >= MAX_DEPTH) {
                report.skippedDepthFolders.push(relPath);
                continue;
            }
            walkDirectory(rootDir, fullPath, report, depth + 1, collectedFiles);
        } else {
            if (!isSafeExt(fullPath)) {
                report.skippedUnsupportedFiles.push(relPath);
                continue;
            }
            collectedFiles.push(fullPath);
        }
    }

    return collectedFiles;
}

function buildTxtOutput(rootDir, filePaths, report) {
    let output = "";

    if (report.skippedDepthFolders.length > 0) {
        output += `===== Skipped Folders (Exceeded Depth ${MAX_DEPTH}) =====\n`;
        for (const folder of report.skippedDepthFolders) output += `[SKIPPED FOLDER]: ${folder}\n`;
        output += "\n";
    }

    if (report.ignoredFolders.length > 0) {
        output += "===== Ignored Folders (Pattern) =====\n";
        for (const folder of report.ignoredFolders) output += `[IGNORED FOLDER]: ${folder}\n`;
        output += "\n";
    }

    if (report.skippedUnsupportedFiles.length > 0) {
        output += "===== Skipped Binary/Unsupported Files =====\n";
        for (const file of report.skippedUnsupportedFiles) output += `[SKIPPED FILE]: ${file}\n`;
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

function buildMarkdownOutput(rootDir, filePaths, report) {
    let output = "# Export Report\n\n";

    if (report.skippedDepthFolders.length > 0) {
        output += `## Skipped Folders (Exceeded Depth ${MAX_DEPTH})\n`;
        for (const folder of report.skippedDepthFolders) output += `- \`${folder}\`\n`;
        output += "\n";
    }

    if (report.ignoredFolders.length > 0) {
        output += "## Ignored Folders (Pattern)\n";
        for (const folder of report.ignoredFolders) output += `- \`${folder}\`\n`;
        output += "\n";
    }

    if (report.skippedUnsupportedFiles.length > 0) {
        output += "## Skipped Binary/Unsupported Files\n";
        for (const file of report.skippedUnsupportedFiles) output += `- \`${file}\`\n`;
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

// Main function Electron will call
export function exportFolder({ folderPath, format }) {
    const report = createReport();
    const files = walkDirectory(folderPath, folderPath, report, 0, []);

    const outputText =
        format === "md"
            ? buildMarkdownOutput(folderPath, files, report)
            : buildTxtOutput(folderPath, files, report);

    return {
        filesIncluded: files.length,
        report,
        outputText,
    };
}
