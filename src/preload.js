const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sidekick', {
  onStatus: (callback) => ipcRenderer.on('status', (event, status) => callback(status)),
});
