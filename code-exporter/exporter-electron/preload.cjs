// preload.cjs
// safe bridge to renderer

const { contextBridge, ipcRenderer } = require("electron");

openOutputFolder: (savePath) => ipcRenderer.invoke("open-output-folder", { savePath }),

contextBridge.exposeInMainWorld("api", {
    pickFolder: () => ipcRenderer.invoke("pick-folder"),
    pickSavePath: (defaultName) => ipcRenderer.invoke("pick-save-path", { defaultName }),
    runExport: (payload) => ipcRenderer.invoke("run-export", payload),
});