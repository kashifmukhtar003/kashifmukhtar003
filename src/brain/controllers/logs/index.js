const { log, retryLog } = require('./helper');
const { ipcMain } = require('electron');

const logsHandlerIPC = async (event, arg) => {
  switch (arg.action) {
    case 'createLog':
      //create log
      log(arg.params.message, arg.params.severity, arg.params.target, arg.params.type);
      break;
    case 'retryLog':
      //retry log
      retryLog();
      break;
    default:
      break;
  }
};

ipcMain.handle('logs', logsHandlerIPC);

const logsHandler = {
  log: (message, severity, target, type) => log(message, severity, target, type),
  retryLog: () => retryLog()
}

module.exports = logsHandler;