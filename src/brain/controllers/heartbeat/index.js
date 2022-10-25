const { ipcMain } = require('electron');
const { startHeartbeat } = require('./helpers');

const heartbeatHandler = async (arg) => {
  switch (arg.action) {
    case 'startHeartbeat': {
      const start = await startHeartbeat();
      return start;
    }
    default:
      return 'Undefined value';
  }
};

ipcMain.handle('heartbeat', heartbeatHandler);

module.exports = heartbeatHandler;
