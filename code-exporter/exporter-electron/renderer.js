// renderer.js
// wires up the buttons

const browseBtn = document.getElementById("browseBtn");
const saveAsBtn = document.getElementById("saveAsBtn");
const exportBtn = document.getElementById("exportBtn");

const folderPathEl = document.getElementById("folderPath");
const savePathEl = document.getElementById("savePath");
const formatEl = document.getElementById("format");
const statusEl = document.getElementById("status");

function setStatus(text) {
    statusEl.textContent = text;
}

browseBtn.addEventListener("click", async () => {
    const folderPath = await window.api.pickFolder();
    if (!folderPath) return;

    folderPathEl.value = folderPath;

    // Suggest a default export filename based on folder name
    const baseName = folderPath.split(/[\\/]/).filter(Boolean).pop() || "export";
    const ext = formatEl.value === "md" ? ".md" : ".txt";
    const defaultName = `${baseName}-export${ext}`;

    setStatus(`Folder selected: ${folderPath}\nSuggested output name: ${defaultName}`);
});

formatEl.addEventListener("change", () => {
    const folderPath = folderPathEl.value;
    if (!folderPath) return;

    const baseName = folderPath.split(/[\\/]/).filter(Boolean).pop() || "export";
    const ext = formatEl.value === "md" ? ".md" : ".txt";
    const suggested = `${baseName}-export${ext}`;

    setStatus(`Format changed. Suggested output name: ${suggested}\n(Click "Save as..." to pick a new path)`);
    savePathEl.value = ""; // forces you to re-pick so extension stays consistent
});

saveAsBtn.addEventListener("click", async () => {
    const folderPath = folderPathEl.value;
    const baseName = folderPath ? folderPath.split(/[\\/]/).filter(Boolean).pop() : "export";
    const ext = formatEl.value === "md" ? ".md" : ".txt";
    const defaultName = `${baseName || "export"}-export${ext}`;

    const savePath = await window.api.pickSavePath(defaultName);
    if (!savePath) return;

    savePathEl.value = savePath;
    setStatus(`Save path selected: ${savePath}`);
});

exportBtn.addEventListener("click", async () => {
    const folderPath = folderPathEl.value;
    const savePath = savePathEl.value;
    const format = formatEl.value;

    try {
        setStatus("Exporting...\n");
        const result = await window.api.runExport({ folderPath, format, savePath });

        lastSavePath = result.savePath;
        openOutBtn.disabled = false;

        setStatus(
            `Done!\n` +
            `Files included: ${result.filesIncluded}\n` +
            `Folders skipped (depth): ${result.skippedDepth}\n` +
            `Folders ignored: ${result.ignoredFolders}\n` +
            `Files skipped (unsupported): ${result.skippedUnsupported}\n` +
            `Saved to: ${result.savePath}\n`
        );
    } catch (err) {
        setStatus(`Error: ${err.message || String(err)}`);
    }
});

const openOutBtn = document.getElementById("openOutBtn");

let lastSavePath = "";

openOutBtn.addEventListener("click", async () => {
    if (!lastSavePath) return;
    await window.api.openOutputFolder(lastSavePath);
});