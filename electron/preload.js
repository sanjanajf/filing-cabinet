const { contextBridge, ipcRenderer } = require("electron");
const os = require("os");

contextBridge.exposeInMainWorld("electron", {
  homeDir: os.homedir(),
  exportDocument: (args) => ipcRenderer.invoke("export-document", args),
  exportFolder: (args) => ipcRenderer.invoke("export-folder", args),
});
