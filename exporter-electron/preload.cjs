// preload.cjs
// safe bridge to renderer

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    pickFolder: () => ipcRenderer.invoke("pick-folder"),
    pickSavePath: (defaultName) => ipcRenderer.invoke("pick-save-path", { defaultName }),
    runExport: (payload) => ipcRenderer.invoke("run-export", payload),
});