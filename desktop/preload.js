const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras e identificadores da plataforma para a interface do Desktop
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});
