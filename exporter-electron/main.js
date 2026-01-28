// main.js
// Electron main process

import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { exportFolder } from "./exporter-core.js";

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 860,
        height: 720,
        webPreferences: {
            preload: path.join(app.getAppPath(), "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    // Standard behavior: quit on Windows/Linux, stay open on macOS
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("pick-folder", async () => {
    const result = await dialog.showOpenDialog(win, {
        title: "Select a folder to export",
        properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});

ipcMain.handle("pick-save-path", async (_event, { defaultName }) => {
    const result = await dialog.showSaveDialog(win, {
        title: "Save export file",
        defaultPath: defaultName,
        filters: [
            { name: "Markdown", extensions: ["md"] },
            { name: "Text", extensions: ["txt"] },
        ],
    });

    if (result.canceled || !result.filePath) return null;
    return result.filePath;
});

ipcMain.handle("run-export", async (_event, { folderPath, format, savePath }) => {
    if (!folderPath) throw new Error("No folder selected.");
    if (!savePath) throw new Error("No save path selected.");

    const { outputText, filesIncluded, report } = exportFolder({ folderPath, format });

    fs.writeFileSync(savePath, outputText, "utf-8");

    return {
        filesIncluded,
        skippedDepth: report.skippedDepthFolders.length,
        ignoredFolders: report.ignoredFolders.length,
        skippedUnsupported: report.skippedUnsupportedFiles.length,
        savePath,
    };
});
