// This script exposes the IPC Renderer to the renderer through the context bridge
// This is done (instead of the more conventional way of just exposing electron in global)
// for security purposes. Based on: https://github.com/electron/electron/issues/9920#issuecomment-575839738

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  async send(channel, data) {
    // whitelist channels
    let validChannels = [
      'registerDevice',
      'osConfig',
      'auth',
      'logs',
      'connectivity',
    ];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
  },
  async receive(channel, func) {
    let validChannels = [''];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      return await ipcRenderer.handle(channel, (event, ...args) =>
        func(...args)
      );
    }
  },
  async close() {
    return ipcRenderer.send('close-window');
  },
  getApp() {
    return 'setup';
  },
});
