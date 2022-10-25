const { ipcMain } = require('electron');
const { getConnectivity } = require('./helper');

const connectivityHandler = async (arg) => {
  switch (arg.action) {
    case 'getConnectivity':
      return getConnectivity();
    default:
      break;
  }
};

ipcMain.handle('connectivity', connectivityHandler);

module.exports = connectivityHandler;
