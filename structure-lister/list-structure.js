// list-structure.js
// Recursively prints folder + file structure, excluding junk folders,
// and writes result to project-structure.txt.

import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const outputFile = path.join(rootDir, "project-structure.txt");

// Folders to ignore
const IGNORED = new Set([
    ".git",
    ".github",
    "node_modules",
    ".venv",
    "venv",
    ".idea",
    ".vscode",
    "dist",
    "build",
    "coverage",
    "__pycache__"
]);

let output = "📁 Project Structure\n\n";

function listDir(dir, prefix = "") {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach((item, index) => {
        if (IGNORED.has(item.name)) return;

        const isLast = index === items.length - 1;
        const pointer = isLast ? "└── " : "├── ";
        const nextPrefix = isLast ? "    " : "│   ";

        const line = prefix + pointer + item.name;
        console.log(line);
        output += line + "\n";

        if (item.isDirectory()) {
            const fullPath = path.join(dir, item.name);
            listDir(fullPath, prefix + nextPrefix);
        }
    });
}

console.log("📁 Project Structure\n");
listDir(rootDir);

// Write output
fs.writeFileSync(outputFile, output, "utf-8");

console.log(`\nSaved to ${outputFile}`);
