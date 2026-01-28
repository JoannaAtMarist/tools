// preload.js
// safe bridge to renderer

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    pickFolder: () => ipcRenderer.invoke("pick-folder"),
    pickSavePath: (defaultName) => ipcRenderer.invoke("pick-save-path", { defaultName }),
    runExport: (payload) => ipcRenderer.invoke("run-export", payload),
});
