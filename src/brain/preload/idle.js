const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // eslint-disable-next-line consistent-return
  async send(channel, data) {
    // whitelist channels
    const validChannels = [
      'osConfig',
      'auth',
      'heartbeat',
      'show',
      'logs',
      'connectivity',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  // eslint-disable-next-line consistent-return
  async receive(channel, func) {
    const validChannels = [''];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      return ipcRenderer.handle(channel, (event, ...args) => func(...args));
    }
  },
  getHeartBeatConfig: (callback) => ipcRenderer.on('heartbeatConfig', callback),
  getConnectivity: (callback) => ipcRenderer.on('connectivity', callback),
  getApp: () => 'idle',
});
