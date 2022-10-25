/* eslint-disable */
const os = require('os');
const { ipcMain } = require('electron');
const {
  getSystemMac,
  setSystemMac,
  setNetworkConfig,
  getNetworkConfig,
  getNetworkInterfaces,
  getMachineId,
} = require('./helper');

const osHandler = async (event, arg) => {
  switch (arg.action) {
    case 'systemMac':
      return await getSystemMac();
    case 'saveSystemMac':
      return await setSystemMac();
    case 'networkInterfaces':
      return await getNetworkInterfaces();
    case 'networkConfigs':
      return await getNetworkConfig();
    case 'saveNetworkConfig':
      return await setNetworkConfig(arg);
    case 'machineId':
      return await getMachineId(arg);
    default:
      return 'Unknown argument';
  }
};

ipcMain.handle('osConfig', osHandler);

module.exports = osHandler;
